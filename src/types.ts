export type AutomationStatus = 'active' | 'paused'
export type AutomationRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'cancelled'
export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'
export type PermissionPreset = 'read-only' | 'workspace-write'

export interface OnceSchedule {
  readonly kind: 'once'
  readonly at: string
  readonly timeZone: string
}

export interface IntervalSchedule {
  readonly kind: 'interval'
  readonly everyMinutes: number
  readonly anchor: string
  readonly timeZone: string
}

export interface DailySchedule {
  readonly kind: 'daily'
  readonly time: string
  readonly timeZone: string
}

export interface WeeklySchedule {
  readonly kind: 'weekly'
  readonly weekdays: readonly Weekday[]
  readonly time: string
  readonly timeZone: string
}

export interface HourlySchedule {
  readonly kind: 'hourly'
  readonly minute: number
  readonly timeZone: string
}

export interface MonthlySchedule {
  readonly kind: 'monthly'
  readonly day: number
  readonly time: string
  readonly timeZone: string
}

export interface CustomSchedule {
  readonly kind: 'custom'
  readonly everyDays: number
  readonly time: string
  readonly timeZone: string
}

export type AutomationSchedule =
  | OnceSchedule
  | IntervalSchedule
  | DailySchedule
  | WeeklySchedule
  | HourlySchedule
  | MonthlySchedule
  | CustomSchedule

export interface AutomationCreator {
  readonly kind: 'agent' | 'web'
  readonly sessionId: string
}

/** 一次无人值守运行的首条消息来源，不能伪装成人类输入。 */
export interface AutomationMessageSource {
  readonly kind: 'automation'
  readonly automationId: string
  readonly runId: string
  readonly scheduledFor: string
}

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    automation: AutomationMessageSource
  }
}

export interface AutomationDefinition {
  readonly version: 1
  readonly id: string
  readonly revision: number
  readonly name: string
  readonly prompt: string
  readonly status: AutomationStatus
  readonly schedule: AutomationSchedule
  readonly rrule: string
  readonly timeZone: string
  readonly workspaceId: string
  readonly cwd: string
  readonly agentPreset: string
  readonly provider: string | null
  readonly model: string | null
  readonly reasoningEffort?: string | null | undefined
  readonly permissionPreset: PermissionPreset
  readonly createdBy: AutomationCreator
  readonly createdAt: string
  readonly updatedAt: string
}

export interface AutomationTargetSnapshot {
  readonly workspaceId: string
  readonly cwd: string
  readonly agentPreset: string
  readonly provider: string | null
  readonly model: string | null
  readonly reasoningEffort?: string | null | undefined
  readonly permissionPreset: PermissionPreset
}

export interface AutomationRunError {
  readonly code: string
  readonly message: string
}

export interface AutomationRun {
  readonly version: 1
  readonly id: string
  readonly automationId: string
  readonly definitionRevision: number
  readonly occurrenceKey: string
  readonly trigger: 'schedule' | 'manual'
  readonly scheduledFor: string
  readonly status: AutomationRunStatus
  readonly promptSnapshot: string
  readonly targetSnapshot: AutomationTargetSnapshot
  readonly sessionId: string | null
  readonly startedAt: string | null
  readonly finishedAt: string | null
  readonly summary: string | null
  readonly error: AutomationRunError | null
  readonly unread: boolean
}

export interface CreateAutomationInput {
  readonly id: string
  readonly name: string
  readonly prompt: string
  readonly schedule: AutomationSchedule
  readonly workspaceId: string
  readonly cwd: string
  readonly agentPreset: string
  readonly provider?: string | null
  readonly model?: string | null
  readonly reasoningEffort?: string | null | undefined
  readonly permissionPreset?: PermissionPreset
  readonly createdBy: AutomationCreator
  readonly now: string
}

export interface UpdateAutomationInput {
  readonly name?: string
  readonly prompt?: string
  readonly status?: AutomationStatus
  readonly schedule?: AutomationSchedule
  readonly agentPreset?: string
  readonly provider?: string | null
  readonly model?: string | null
  readonly reasoningEffort?: string | null | undefined
  readonly permissionPreset?: PermissionPreset
  readonly workspaceId?: string
  readonly cwd?: string
  readonly now: string
}

export interface DeleteAutomationPlan {
  readonly id: string
  readonly preserveRunHistory: true
}
