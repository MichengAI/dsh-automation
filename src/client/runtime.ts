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

export function createAutomationRuntime(rpc: ClientRpc): AutomationRuntime {
  let state: AutomationClientState = { phase: 'idle' }
  let refreshPromise: Promise<void> | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined
  const listeners = new Set<() => void>()
  const armPoll = (): void => {
    if (pollTimer !== undefined) clearInterval(pollTimer)
    if (listeners.size === 0) {
      pollTimer = undefined
      return
    }
    pollTimer = setInterval(() => { void refresh().catch(() => undefined) }, snapshotPollIntervalMs(state.snapshot?.runs))
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
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && pollTimer !== undefined) {
          clearInterval(pollTimer)
          pollTimer = undefined
        }
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


