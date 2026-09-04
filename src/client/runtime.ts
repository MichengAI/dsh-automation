import type { ClientRpc } from './contracts.js'
import type {
  AutomationRunViewModel,
  AutomationSnapshot,
  CreateAutomationInput,
  CreateRequest,
  MarkReadRequest,
  MutateRequest,
  RunNowRequest,
  UpdateRequest,
} from './protocol.js'
import { unwrapRpcResult } from './protocol.js'

const CHANNEL = '/dsh-automation'
const IDLE_POLL_INTERVAL_MS = 15_000
const ACTIVE_POLL_INTERVAL_MS = 2_000
// 首次立即尝试；后续间隔单位是完整的 Automation 快照刷新周期，不是毫秒或状态发布次数。
const HOST_SESSION_RETRY_REFRESH_GAPS = [1, 2, 4] as const
const HOST_SESSION_MAX_ATTEMPTS = HOST_SESSION_RETRY_REFRESH_GAPS.length + 1
const HOST_SESSION_REARM_INTERVAL_MS = 5 * 60 * 1_000
const RECENT_TERMINAL_RUN_WINDOW_MS = 24 * 60 * 60 * 1_000

export function snapshotPollIntervalMs(runs: readonly { readonly status: string }[] | undefined): number {
  return (runs ?? []).some(run => run.status === 'running' || run.status === 'queued')
    ? ACTIVE_POLL_INTERVAL_MS
    : IDLE_POLL_INTERVAL_MS
}

/** 没有界面订阅时维持低频轮询；界面打开后才按运行状态提升刷新频率。 */
export function effectiveSnapshotPollIntervalMs(
  runs: readonly { readonly status: string }[] | undefined,
  foregroundSubscribers: number,
): number {
  return foregroundSubscribers > 0 ? snapshotPollIntervalMs(runs) : IDLE_POLL_INTERVAL_MS
}

export function isTransportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message)
}
export interface AutomationClientState {
  readonly phase: 'idle' | 'loading' | 'ready' | 'error'
  readonly snapshot?: AutomationSnapshot
  readonly error?: string
  readonly refreshedAt?: number
}

export interface AutomationStateSource {
  getSnapshot(): AutomationClientState
  subscribe(listener: () => void, options?: { readonly background?: boolean }): () => void
}

export interface AutomationRuntime {
  readonly source: AutomationStateSource
  refresh(): Promise<void>
  createAutomation(input: CreateAutomationInput): Promise<void>
  mutateAutomation(automationId: string, mutation: MutateRequest['mutation']): Promise<void>
  updateAutomation(automationId: string, input: CreateAutomationInput): Promise<void>
  runNow(automationId: string): Promise<void>
  markRunRead(runId: string): Promise<void>
  adoptSession(sessionId: string): Promise<void>
  forgetSession(sessionId: string): Promise<void>
  forgetAutomationSessions(automationId: string): Promise<void>
}

export interface HostSessionSync {
  readonly list?: {
    getSnapshot(): {
      readonly ids?: readonly string[]
      readonly byId?: Readonly<Record<string, unknown>>
    }
  }
  refresh?: () => Promise<void>
}

/** 只同步未完成或最近完成的会话，避免已被 Host 清理的历史记录永久占用重试集合。 */
export function sessionIdsNeedingHostSync(
  runs: readonly Pick<AutomationRunViewModel, 'status' | 'sessionId' | 'scheduledFor' | 'startedAt' | 'finishedAt'>[],
  serverNow: string,
): string[] {
  const parsedNow = Date.parse(serverNow)
  const referenceTime = Number.isFinite(parsedNow) ? parsedNow : Date.now()
  const cutoff = referenceTime - RECENT_TERMINAL_RUN_WINDOW_MS
  return [...new Set(runs
    .filter((run) => {
      if (run.status === 'queued' || run.status === 'running') return true
      const timestamp = Date.parse(run.finishedAt ?? run.startedAt ?? run.scheduledFor)
      return Number.isFinite(timestamp) && timestamp >= cutoff
    })
    .map(run => run.sessionId)
    .filter((sessionId): sessionId is string => sessionId !== undefined && sessionId !== ''))]
    .sort()
}

/** 常驻订阅保证无页面挂载时仍能发现新定时会话，并同步 Host 会话列表。 */
export function installAutomationSessionSync(
  runtime: AutomationRuntime,
  getSessions: () => HostSessionSync | undefined,
  options: { readonly now?: () => number } = {},
): () => void {
  let stopped = false
  let completedRefreshes = 0
  let automationRefreshInProgress = runtime.source.getSnapshot().phase === 'loading'
  let trackedSessions: HostSessionSync | undefined
  let trackedMissingKey: string | undefined
  let attempts = 0
  let nextAttemptRefresh = 0
  let nextRearmAt = 0
  let warnedMissingKey: string | undefined
  let hostRefreshPromise: Promise<void> | undefined
  let reconcileAfterRefresh = false

  const resetAttempts = (missingKey?: string): void => {
    trackedMissingKey = missingKey
    attempts = 0
    nextAttemptRefresh = completedRefreshes
    nextRearmAt = 0
    warnedMissingKey = undefined
  }

  const missingSessionKey = (sessions: HostSessionSync | undefined): string | undefined => {
    const snapshot = runtime.source.getSnapshot().snapshot
    const hostSnapshot = sessions?.list?.getSnapshot()
    if (snapshot === undefined || hostSnapshot === undefined || sessions?.refresh === undefined) return undefined
    const present = new Set([
      ...(hostSnapshot.ids ?? []),
      ...Object.keys(hostSnapshot.byId ?? {}),
    ])
    return sessionIdsNeedingHostSync(snapshot.runs, snapshot.serverNow)
      .filter(sessionId => !present.has(sessionId))
      .join('\u0000')
  }

  const reconcile = (): void => {
    if (stopped) return
    const sessions = getSessions()
    if (sessions !== trackedSessions) {
      trackedSessions = sessions
      resetAttempts()
    }
    const missingKey = missingSessionKey(sessions)
    if (missingKey === undefined) return
    if (missingKey === '') {
      resetAttempts()
      return
    }
    if (missingKey !== trackedMissingKey) resetAttempts(missingKey)
    if (attempts >= HOST_SESSION_MAX_ATTEMPTS) {
      if ((options.now ?? Date.now)() < nextRearmAt) return
      resetAttempts(missingKey)
    }
    if (completedRefreshes < nextAttemptRefresh) return
    if (hostRefreshPromise !== undefined) {
      reconcileAfterRefresh = true
      return
    }

    const attemptIndex = attempts
    attempts += 1
    const retryGap = HOST_SESSION_RETRY_REFRESH_GAPS[attemptIndex]
    nextAttemptRefresh = retryGap === undefined
      ? Number.POSITIVE_INFINITY
      : completedRefreshes + retryGap
    if (attempts >= HOST_SESSION_MAX_ATTEMPTS) {
      nextRearmAt = (options.now ?? Date.now)() + HOST_SESSION_REARM_INTERVAL_MS
    }
    hostRefreshPromise = Promise.resolve()
      .then(async () => { await sessions!.refresh!() })
      .catch((error: unknown) => {
        if (!stopped && warnedMissingKey !== missingKey) {
          warnedMissingKey = missingKey
          console.warn('[dsh-automation] 刷新 Host 会话列表失败', error)
        }
      })
      .finally(() => {
        hostRefreshPromise = undefined
        if (stopped || !reconcileAfterRefresh) return
        reconcileAfterRefresh = false
        reconcile()
      })
  }

  const unsubscribe = runtime.source.subscribe(() => {
    const phase = runtime.source.getSnapshot().phase
    if (phase === 'loading') {
      automationRefreshInProgress = true
    } else if (automationRefreshInProgress) {
      automationRefreshInProgress = false
      completedRefreshes += 1
    }
    reconcile()
  }, { background: true })
  reconcile()
  return () => {
    stopped = true
    reconcileAfterRefresh = false
    unsubscribe()
  }
}

export function createAutomationRuntime(rpc: ClientRpc): AutomationRuntime {
  let state: AutomationClientState = { phase: 'idle' }
  let refreshPromise: Promise<void> | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined
  let removePageResumeListeners = (): void => undefined
  const listeners = new Set<() => void>()
  const foregroundListeners = new Set<() => void>()
  const armPoll = (): void => {
    if (pollTimer !== undefined) clearInterval(pollTimer)
    if (listeners.size === 0) {
      pollTimer = undefined
      return
    }
    pollTimer = setInterval(
      () => { void refresh().catch(() => undefined) },
      effectiveSnapshotPollIntervalMs(state.snapshot?.runs, foregroundListeners.size),
    )
  }
  const armPageResumeListeners = (): void => {
    removePageResumeListeners()
    if (foregroundListeners.size === 0) return
    const refreshOnResume = (): void => { void refresh().catch(() => undefined) }
    const refreshOnVisible = (): void => {
      if (document.visibilityState === 'visible') refreshOnResume()
    }
    if (typeof window !== 'undefined') window.addEventListener('focus', refreshOnResume)
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', refreshOnVisible)
    removePageResumeListeners = () => {
      if (typeof window !== 'undefined') window.removeEventListener('focus', refreshOnResume)
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', refreshOnVisible)
      removePageResumeListeners = (): void => undefined
    }
  }
  const publish = (next: AutomationClientState): void => {
    const previousInterval = effectiveSnapshotPollIntervalMs(state.snapshot?.runs, foregroundListeners.size)
    state = next
    if (listeners.size > 0 && previousInterval !== effectiveSnapshotPollIntervalMs(state.snapshot?.runs, foregroundListeners.size)) armPoll()
    for (const listener of [...listeners]) listener()
  }
  const source: AutomationStateSource = {
    getSnapshot: () => state,
    subscribe: (listener, options = {}) => {
      const hadListeners = listeners.size > 0
      const hadForegroundListeners = foregroundListeners.size > 0
      listeners.add(listener)
      if (options.background !== true) foregroundListeners.add(listener)
      if (!hadListeners || (options.background !== true && !hadForegroundListeners)) {
        queueMicrotask(() => { if (listeners.size > 0) void refresh().catch(() => undefined) })
      }
      armPoll()
      // Chromium 会节流后台标签页计时器；只在界面挂载时监听恢复事件。
      if (foregroundListeners.size > 0 && !hadForegroundListeners) armPageResumeListeners()
      return () => {
        listeners.delete(listener)
        foregroundListeners.delete(listener)
        if (listeners.size === 0 && pollTimer !== undefined) {
          clearInterval(pollTimer)
          pollTimer = undefined
        } else if (listeners.size > 0) {
          armPoll()
        }
        if (foregroundListeners.size === 0) removePageResumeListeners()
      }
    },
  }

  const refresh = async (): Promise<void> => {
    if (refreshPromise !== undefined) return refreshPromise
    const previous = state.snapshot
    publish(previous === undefined
      ? { phase: 'loading' }
      : {
          phase: 'loading',
          snapshot: previous,
          ...(state.refreshedAt === undefined ? {} : { refreshedAt: state.refreshedAt }),
        })
    refreshPromise = (async () => {
      try {
        const response = await rpc.call(CHANNEL, 'snapshot', { sessionId: 'settings' })
        const snapshot = unwrapRpcResult<AutomationSnapshot>(response)
        publish({ phase: 'ready', snapshot, refreshedAt: Date.now() })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        publish(previous === undefined
          ? { phase: 'error', error: message }
          : {
              phase: 'error',
              snapshot: previous,
              error: message,
              ...(state.refreshedAt === undefined ? {} : { refreshedAt: state.refreshedAt }),
            })
        throw error
      } finally {
        refreshPromise = undefined
      }
    })()
    return refreshPromise
  }

  const callRpc = async (endpoint: string, payload: unknown): Promise<unknown> => {
    try {
      return await rpc.call(CHANNEL, endpoint, payload)
    } catch (error) {
      if (!isTransportError(error)) throw error
      return await rpc.call(CHANNEL, endpoint, payload)
    }
  }

  const mutateThenRefresh = async (
    endpoint: string,
    payload: unknown,
    patch?: (snapshot: AutomationSnapshot) => AutomationSnapshot,
  ): Promise<void> => {
    unwrapRpcResult<unknown>(await callRpc(endpoint, payload))
    if (patch !== undefined && state.snapshot !== undefined) {
      publish({ phase: 'ready', snapshot: patch(state.snapshot), refreshedAt: Date.now() })
    }
    const pendingBeforeRefresh = refreshPromise
    if (pendingBeforeRefresh !== undefined) await pendingBeforeRefresh.catch(() => undefined)
    try {
      await refresh()
    } catch {
      // 变更已经生效；刷新失败不应让用户以为删除/更新没成功。
    }
  }

  return {
    source,
    refresh,
    async createAutomation(input) {
      const payload: CreateRequest = { sessionId: 'settings', input }
      await mutateThenRefresh('create', payload)
    },
    async mutateAutomation(automationId, mutation) {
      const payload: MutateRequest = { sessionId: 'settings', automationId, mutation }
      await mutateThenRefresh('mutate', payload, mutation === 'delete'
        ? (snapshot) => ({
            ...snapshot,
            automations: snapshot.automations.filter(item => item.id !== automationId),
          })
        : (snapshot) => ({
            ...snapshot,
            automations: snapshot.automations.map((item) => item.id === automationId
              ? { ...item, status: mutation === 'pause' ? 'paused' : 'active' }
              : item),
          }))
    },
    async updateAutomation(automationId, input) {
      const payload: UpdateRequest = { sessionId: 'settings', automationId, input }
      await mutateThenRefresh('update', payload)
    },
    async runNow(automationId) {
      const payload: RunNowRequest = { sessionId: 'settings', automationId }
      await mutateThenRefresh('run-now', payload)
    },
    async markRunRead(runId) {
      const payload: MarkReadRequest = { sessionId: 'settings', runId }
      await mutateThenRefresh('mark-read', payload)
    },
    async adoptSession(sessionId) {
      unwrapRpcResult<unknown>(await rpc.call(CHANNEL, 'adopt-session', { sessionId }))
    },
    async forgetSession(sessionId) {
      await mutateThenRefresh('forget-session', { sessionId }, (snapshot) => ({
        ...snapshot,
        runs: snapshot.runs.map((run) => { if (run.sessionId !== sessionId) return run; const { sessionId: _ignored, ...rest } = run; return rest }),
      }))
    },
    async forgetAutomationSessions(automationId) {
      await mutateThenRefresh('forget-automation-sessions', { automationId }, (snapshot) => ({
        ...snapshot,
        runs: snapshot.runs.map((run) => { if (run.automationId !== automationId) return run; const { sessionId: _ignored, ...rest } = run; return rest }),
      }))
    },
  }
}
