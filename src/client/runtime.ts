import type { ClientRpc } from './contracts.js'
import type {
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

export function snapshotPollIntervalMs(runs: readonly { readonly status: string }[] | undefined): number {
  return (runs ?? []).some(run => run.status === 'running' || run.status === 'queued')
    ? ACTIVE_POLL_INTERVAL_MS
    : IDLE_POLL_INTERVAL_MS
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
  subscribe(listener: () => void): () => void
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

/** 常驻订阅保证无页面挂载时仍能发现新定时会话，并同步 Host 会话列表。 */
export function installAutomationSessionSync(
  runtime: AutomationRuntime,
  getSessions: () => HostSessionSync | undefined,
): () => void {
  let stopped = false
  let completedRefreshes = 0
  let automationRefreshInProgress = runtime.source.getSnapshot().phase === 'loading'
  let trackedSessions: HostSessionSync | undefined
  let trackedMissingKey: string | undefined
  let attempts = 0
  let nextAttemptRefresh = 0
  let warnedMissingKey: string | undefined
  let hostRefreshPromise: Promise<void> | undefined
  let reconcileAfterRefresh = false

  const resetAttempts = (missingKey?: string): void => {
    trackedMissingKey = missingKey
    attempts = 0
    nextAttemptRefresh = completedRefreshes
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
    return [...new Set(snapshot.runs
      .map(run => run.sessionId)
      .filter((sessionId): sessionId is string => sessionId !== undefined && sessionId !== ''))]
      .filter(sessionId => !present.has(sessionId))
      .sort()
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
    if (attempts >= HOST_SESSION_MAX_ATTEMPTS || completedRefreshes < nextAttemptRefresh) return
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
  })
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
  const armPoll = (): void => {
    if (pollTimer !== undefined) clearInterval(pollTimer)
    if (listeners.size === 0) {
      pollTimer = undefined
      return
    }
    pollTimer = setInterval(() => { void refresh().catch(() => undefined) }, snapshotPollIntervalMs(state.snapshot?.runs))
  }
  const armPageResumeListeners = (): void => {
    removePageResumeListeners()
    if (listeners.size === 0) return
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
    const previousInterval = snapshotPollIntervalMs(state.snapshot?.runs)
    state = next
    if (listeners.size > 0 && previousInterval !== snapshotPollIntervalMs(state.snapshot?.runs)) armPoll()
    for (const listener of [...listeners]) listener()
  }
  const source: AutomationStateSource = {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      if (listeners.size === 1) {
        queueMicrotask(() => { if (listeners.size > 0) void refresh().catch(() => undefined) })
        armPoll()
        // Chromium 会节流后台标签页计时器，恢复页面时必须主动追平快照。
        armPageResumeListeners()
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && pollTimer !== undefined) {
          clearInterval(pollTimer)
          pollTimer = undefined
        }
        if (listeners.size === 0) removePageResumeListeners()
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
        : undefined)
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
