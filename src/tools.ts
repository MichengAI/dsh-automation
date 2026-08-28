/** 绑定到单个 root Agent 工作区的管理工具。 */

import { defineTool, type JsonValue, type ToolRunContext } from '@deepseek-ai/dsh-tools'
import type { AutomationService } from './service.ts'
import { AUTOMATION_CREATE_DESCRIPTION } from './prompt.ts'
import type { AutomationSchedule, PermissionPreset, Weekday } from './types.ts'

interface ToolAgent {
  readonly id: string
  readonly ctx: {
    readonly tools: { register(definition: unknown): () => void }
  }
}

const WEEKDAYS: readonly Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

interface ScheduleArgs {
  readonly kind?: 'once' | 'interval' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
  readonly time_zone?: string
  readonly at?: string
  readonly every_minutes?: number
  readonly minute?: number
  readonly time?: string
  readonly weekdays?: string[]
  readonly month_day?: number
  readonly every_days?: number
}

interface CreateArgs extends ScheduleArgs {
  readonly name: string
  readonly prompt: string
  readonly kind: 'once' | 'interval' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
  readonly time_zone: string
  readonly permission?: PermissionPreset
}

interface ManageArgs extends ScheduleArgs {
  readonly id: string
  readonly action: 'update' | 'pause' | 'resume' | 'run_now' | 'delete'
  readonly name?: string
  readonly prompt?: string
  readonly status?: 'active' | 'paused'
  readonly permission?: PermissionPreset
}

interface GetArgs { readonly id?: string; readonly include_runs?: boolean; readonly status?: string }

const SCHEDULE_FIELDS = [
  'time_zone', 'at', 'every_minutes', 'minute', 'time', 'weekdays', 'month_day', 'every_days',
] as const

function render(_args: unknown, value: JsonValue): { type: 'text'; text: string }[] {
  return [{ type: 'text', text: JSON.stringify(value) }]
}

const JSON_OUTPUT = {
  schema: { type: 'json' },
  render,
} as const

function json(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

function present(title: string, kind: 'read' | 'other', rawInput?: unknown) {
  return { card: 'generic' as const, title, kind, ...(rawInput === undefined ? {} : { rawInput }) }
}

function validateScheduleSelector(args: ScheduleArgs): void {
  const presentFields = SCHEDULE_FIELDS.filter(field => args[field] !== undefined)
  if (args.kind === undefined) {
    if (presentFields.length > 0) throw new Error('修改计划字段时必须提供 kind')
    return
  }
  const required = args.kind === 'once'
    ? ['time_zone', 'at'] as const
    : args.kind === 'interval'
      ? ['time_zone', 'every_minutes'] as const
      : args.kind === 'hourly'
        ? ['time_zone', 'minute'] as const
        : args.kind === 'weekly'
          ? ['time_zone', 'time', 'weekdays'] as const
          : args.kind === 'monthly'
            ? ['time_zone', 'time', 'month_day'] as const
            : args.kind === 'custom'
              ? ['time_zone', 'time', 'every_days'] as const
              : ['time_zone', 'time'] as const
  const allowed = new Set<string>(required)
  const missing = required.filter(field => args[field] === undefined)
  if (missing.length > 0) throw new Error(`${args.kind} 计划需要 ${missing.join(', ')}`)
  const unrelated = presentFields.filter(field => !allowed.has(field))
  if (unrelated.length > 0) throw new Error(`${args.kind} 计划不接受 ${unrelated.join(', ')}`)
}

function scheduleFromArgs(args: ScheduleArgs, now: string): AutomationSchedule {
  validateScheduleSelector(args)
  const timeZone = String(args.time_zone ?? '')
  switch (args.kind) {
    case 'once':
      return { kind: 'once', at: String(args.at ?? ''), timeZone }
    case 'interval':
      return { kind: 'interval', everyMinutes: Number(args.every_minutes), anchor: now, timeZone }
    case 'hourly':
      return { kind: 'hourly', minute: Number(args.minute), timeZone }
    case 'daily':
      return { kind: 'daily', time: String(args.time ?? ''), timeZone }
    case 'weekly': {
      const weekdays = Array.isArray(args.weekdays) ? args.weekdays.map(String) : []
      if (weekdays.some(day => !WEEKDAYS.includes(day as Weekday))) throw new Error('weekdays 包含无效值')
      return { kind: 'weekly', weekdays: weekdays as Weekday[], time: String(args.time ?? ''), timeZone }
    }
    case 'monthly':
      return { kind: 'monthly', day: Number(args.month_day), time: String(args.time ?? ''), timeZone }
    case 'custom':
      return { kind: 'custom', everyDays: Number(args.every_days), time: String(args.time ?? ''), timeZone }
    default:
      throw new Error('kind 必须是 once、interval、hourly、daily、weekly、monthly 或 custom')
  }
}

export function registerAutomationTools(service: AutomationService, agent: ToolAgent): () => void {
  const scope = { sessionId: agent.id, creatorKind: 'agent' as const }
  const permissionNames = [...service.permissionNames()]
  const disposers: Array<() => void> = []
  const register = (definition: unknown): void => { disposers.push(agent.ctx.tools.register(definition)) }
  try {
    register(defineTool({
      name: 'automation_create',
      description: AUTOMATION_CREATE_DESCRIPTION,
      parameters: {
        name: { type: 'string', required: true },
        prompt: { type: 'string', required: true, description: '每次独立运行都使用的自包含任务说明。' },
        kind: { type: 'string', required: true, enum: ['once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom'] },
        time_zone: { type: 'string', required: true, description: 'IANA 时区，例如 Asia/Shanghai。' },
        at: { type: 'string', description: '一次性计划的带偏移 ISO 时间。' },
        every_minutes: { type: 'integer', description: '间隔计划的分钟数，最小 5。' },
        minute: { type: 'integer', description: '每小时计划在第几分钟运行，范围 0-59。' },
        time: { type: 'string', description: '每天、每周、每月或自定义计划的本地 HH:mm。' },
        weekdays: { type: 'array', items: { type: 'string', enum: WEEKDAYS } },
        month_day: { type: 'integer', description: '每月计划在第几日运行，范围 1-31。' },
        every_days: { type: 'integer', description: '自定义计划每隔几天运行，范围 1-365。' },
        permission: { type: 'string', enum: permissionNames },
      },
      output: JSON_OUTPUT,
      async execute(args: CreateArgs, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
          const value = await service.create(scope, {
            name: args.name,
            prompt: args.prompt,
            schedule: scheduleFromArgs(args, new Date().toISOString()),
            ...(args.permission === undefined ? {} : { permissionPreset: args.permission }),
          }, exec.signal)
          return json({ ok: true, automation: value })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: (args: CreateArgs) => present('创建自动化', 'other', args.name),
    }))

    register(defineTool({
      name: 'automation_get',
      description: '读取当前工作区的自动化任务。省略 id 返回任务摘要；指定 id 返回任务详情，可用 include_runs 读取该任务的运行历史。',
      parameters: {
        id: { type: 'string', description: '可选的自动化 ID。' },
        include_runs: { type: 'boolean', description: '指定 id 时是否返回该任务的运行历史。' },
        status: { type: 'string', description: '可选的运行状态过滤。' },
      },
      output: JSON_OUTPUT,
      async execute(args: GetArgs, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
          const snapshot = await service.snapshot(scope, exec.signal)
          const definitions = args.id === undefined
            ? snapshot.definitions
            : snapshot.definitions.filter(item => item.id === args.id)
          const runs = args.id === undefined
            ? []
            : snapshot.runs.filter(item => item.automationId === args.id && (args.status === undefined || item.status === args.status))
          return json({
            ok: true,
            generatedAt: snapshot.generatedAt,
            workspace: snapshot.workspace,
            automations: definitions,
            ...(args.id === undefined || args.include_runs !== true ? {} : { runs }),
          })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: () => present('读取自动化', 'read'),
    }))

    register(defineTool({
      name: 'automation_manage',
      description: '管理当前工作区中已有的自动化。使用 action 执行 update、pause、resume、run_now 或 delete。',
      parameters: {
        id: { type: 'string', required: true },
        action: { type: 'string', required: true, enum: ['update', 'pause', 'resume', 'run_now', 'delete'] },
        name: { type: 'string' },
        prompt: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused'] },
        kind: { type: 'string', enum: ['once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom'] },
        time_zone: { type: 'string' },
        at: { type: 'string' },
        every_minutes: { type: 'integer' },
        minute: { type: 'integer' },
        time: { type: 'string' },
        weekdays: { type: 'array', items: { type: 'string', enum: WEEKDAYS } },
        month_day: { type: 'integer' },
        every_days: { type: 'integer' },
        permission: { type: 'string', enum: permissionNames },
      },
      output: JSON_OUTPUT,
      async execute(args: ManageArgs, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
          if (args.action === 'run_now') return json({ ok: true, run: await service.runNow(scope, args.id, exec.signal) })
          if (args.action === 'delete') return json({ ok: true, value: await service.delete(scope, args.id, exec.signal) })
          if (args.action === 'pause' || args.action === 'resume') {
            return json({ ok: true, automation: await service.update(scope, args.id, { status: args.action === 'pause' ? 'paused' : 'active' }, exec.signal) })
          }
          validateScheduleSelector(args)
          const input: {
            name?: string
            prompt?: string
            status?: 'active' | 'paused'
            schedule?: AutomationSchedule
            permissionPreset?: PermissionPreset
          } = {}
          if (args.name !== undefined) input.name = String(args.name)
          if (args.prompt !== undefined) input.prompt = String(args.prompt)
          if (args.status !== undefined) input.status = args.status
          if (args.permission !== undefined) input.permissionPreset = args.permission
          if (args.kind !== undefined) input.schedule = scheduleFromArgs(args, new Date().toISOString())
          if (Object.keys(input).length === 0) throw new Error('automation_manage 的 update 至少需要一个变更字段')
          const value = await service.update(scope, args.id, input, exec.signal)
          return json({ ok: true, automation: value })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: (args: ManageArgs) => present('管理自动化', 'other', args.id),
    }))
  } catch (error) {
    for (const dispose of disposers.reverse()) dispose()
    throw error
  }
  return () => { for (const dispose of disposers.reverse()) dispose() }
}
