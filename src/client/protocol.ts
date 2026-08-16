/** Web 客户端与 Host RPC 共享的 JSON 契约。 */

export type AutomationStatus = 'active' | 'paused'
export type AutomationRunStatus =
  | 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'cancelled' | 'interrupted'
export type AutomationPermission = 'read-only' | 'workspace-write' | 'full-access'

export type AutomationSchedule =
  | { readonly kind: 'once'; readonly at: string; readonly timeZone?: string }
  | { readonly kind: 'interval'; readonly everyMinutes: number; readonly anchor?: string; readonly timeZone?: string }
  | { readonly kind: 'daily'; readonly time: string; readonly timeZone?: string }
  | { readonly kind: 'weekly'; readonly time: string; readonly weekdays: readonly number[]; readonly timeZone?: string }
  | { readonly kind: 'hourly'; readonly minute: number; readonly timeZone?: string }
  | { readonly kind: 'monthly'; readonly day: number; readonly time: string; readonly timeZone?: string }
  | { readonly kind: 'custom'; readonly everyDays: number; readonly time: string; readonly timeZone?: string }

export interface WorkspaceOption {
  readonly id: string
  readonly title: string
  readonly path: string
}

export interface ModelOption {
  readonly provider: string
  readonly model: string
  readonly label: string
}

export interface AutomationViewModel {
  readonly id: string
  readonly revision: number
  readonly name: string
  readonly prompt: string
  readonly status: AutomationStatus
  readonly schedule: AutomationSchedule
  readonly scheduleSummary: string
  readonly timeZone: string
  readonly permission: AutomationPermission
  readonly workspaceId?: string
  readonly cwd?: string
  readonly provider?: string | null
  readonly model?: string | null
  readonly reasoningEffort?: string | null | undefined
  readonly nextRunAt?: string
  readonly lastRunAt?: string
  readonly lastRunStatus?: AutomationRunStatus
  readonly createdAt: string
  readonly updatedAt: string
}

export interface AutomationRunViewModel {
  readonly id: string
  readonly automationId: string
  readonly automationName: string
  readonly status: AutomationRunStatus
  readonly trigger: 'schedule' | 'manual' | 'catch-up'
  readonly scheduledFor: string
  readonly startedAt?: string
  readonly finishedAt?: string
  readonly sessionId?: string
  readonly summary?: string
  readonly error?: string
  readonly unread?: boolean
}

export interface AutomationSnapshot {
  readonly scope: {
    readonly workspaceId?: string
    readonly workspaceName?: string
    readonly cwd: string
  }
  readonly workspaces?: readonly WorkspaceOption[]
  readonly models?: readonly ModelOption[]
  readonly defaultModel?: ModelOption | null
  readonly skills?: readonly { readonly id: string; readonly name: string }[]
  readonly automations: readonly AutomationViewModel[]
  readonly runs: readonly AutomationRunViewModel[]
  readonly serverNow: string
}

export interface CreateAutomationInput {
  readonly name: string
  readonly prompt: string
  readonly schedule: AutomationSchedule
  readonly timeZone: string
  readonly permission: AutomationPermission
  readonly workspaceId: string
  readonly cwd: string
  readonly provider?: string | null
  readonly model?: string | null
  readonly reasoningEffort?: string | null | undefined
}

export interface SnapshotRequest { readonly sessionId?: string }
export interface CreateRequest { readonly sessionId?: string; readonly input: CreateAutomationInput }
export interface MutateRequest {
  readonly sessionId?: string
  readonly automationId: string
  readonly mutation: 'pause' | 'resume' | 'delete'
}

export interface UpdateRequest {
  readonly sessionId?: string
  readonly automationId: string
  readonly input: CreateAutomationInput
}
export interface RunNowRequest { readonly sessionId?: string; readonly automationId: string }
export interface MarkReadRequest { readonly sessionId?: string; readonly runId: string }

export interface RpcErrorValue {
  readonly code: string
  readonly message: string
  readonly details?: unknown
}

export type RpcResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RpcErrorValue }

export function unwrapRpcResult<T>(value: unknown): T {
  if (typeof value !== 'object' || value === null || !('ok' in value)) {
    throw new Error('自动化主机返回了无效响应。')
  }
  const result = value as Partial<RpcResult<T>>
  if (result.ok === true && 'value' in result) return result.value as T
  if (result.ok === false && 'error' in result) {
    const error = result.error as RpcErrorValue | undefined
    throw new Error(error?.message ?? '自动化请求失败。')
  }
  throw new Error('自动化主机返回了无效响应。')
}
