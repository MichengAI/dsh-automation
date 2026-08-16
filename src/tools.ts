/** 绑定到单个 root Agent 工作区的管理工具。 */

import { defineTool, type JsonValue, type ToolRunContext } from '@deepseek-ai/dsh-tools'
import type { AutomationService } from './service.ts'
import type { AutomationSchedule, PermissionPreset, Weekday } from './types.ts'

interface ToolAgent {
  readonly id: string
  readonly ctx: {
    readonly tools: { register(definition: unknown): () => void }
  }
}

const WEEKDAYS: readonly Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

interface ScheduleArgs {
  readonly kind?: 'once' | 'interval' | 'daily' | 'weekly'
  readonly time_zone?: string
  readonly at?: string
  readonly every_minutes?: number
  readonly time?: string
  readonly weekdays?: string[]
}

interface CreateArgs extends ScheduleArgs {
  readonly name: string
  readonly prompt: string
  readonly kind: 'once' | 'interval' | 'daily' | 'weekly'
  readonly time_zone: string
  readonly permission?: PermissionPreset
}

interface UpdateArgs extends ScheduleArgs {
  readonly id: string
  readonly name?: string
  readonly prompt?: string
  readonly status?: 'active' | 'paused'
  readonly permission?: PermissionPreset
}

interface IdArgs { readonly id: string }

const SCHEDULE_FIELDS = ['time_zone', 'at', 'every_minutes', 'time', 'weekdays'] as const

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
      : args.kind === 'daily'
        ? ['time_zone', 'time'] as const
        : ['time_zone', 'time', 'weekdays'] as const
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
    case 'daily':
      return { kind: 'daily', time: String(args.time ?? ''), timeZone }
    case 'weekly': {
      const weekdays = Array.isArray(args.weekdays) ? args.weekdays.map(String) : []
      if (weekdays.some(day => !WEEKDAYS.includes(day as Weekday))) throw new Error('weekdays 包含无效值')
      return { kind: 'weekly', weekdays: weekdays as Weekday[], time: String(args.time ?? ''), timeZone }
    }
    default:
      throw new Error('kind 必须是 once、interval、daily 或 weekly')
  }
}

export function registerAutomationTools(service: AutomationService, agent: ToolAgent): () => void {
  const scope = { sessionId: agent.id, creatorKind: 'agent' as const }
  const disposers: Array<() => void> = []
  const register = (definition: unknown): void => { disposers.push(agent.ctx.tools.register(definition)) }
  try {
    register(defineTool({
      name: 'automation_create',
      description: '为当前工作区创建一条独立自动化。每次触发都会开启全新 DSH Session，不会继承当前对话。必须使用显式 IANA 时区。最短间隔为 5 分钟。默认只读；只有需要改文件时才选择 workspace-write。',
      parameters: {
        name: { type: 'string', required: true },
        prompt: { type: 'string', required: true, description: '每次独立运行都使用的自包含任务说明。' },
        kind: { type: 'string', required: true, enum: ['once', 'interval', 'daily', 'weekly'] },
        time_zone: { type: 'string', required: true, description: 'IANA 时区，例如 Asia/Shanghai。' },
        at: { type: 'string', description: '一次性计划的带偏移 ISO 时间。' },
        every_minutes: { type: 'integer', description: '间隔计划的分钟数，最小 5。' },
        time: { type: 'string', description: '每天或每周计划的本地 HH:mm。' },
        weekdays: { type: 'array', items: { type: 'string', enum: WEEKDAYS } },
        permission: { type: 'string', enum: ['read-only', 'workspace-write', 'full-access'] },
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
      name: 'automation_list',
      description: '列出当前工作区的自动化规则、下次运行时间和最近一次结果。',
      parameters: {},
      output: JSON_OUTPUT,
      async execute(_args: Record<string, never>, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
          const snapshot = await service.snapshot(scope, exec.signal)
          return json({
            ok: true,
            generatedAt: snapshot.generatedAt,
            workspace: snapshot.workspace,
            automations: snapshot.definitions,
          })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: () => present('列出自动化', 'read'),
    }))

    register(defineTool({
      name: 'automation_update',
      description: '更新当前工作区中一条自动化的名称、任务说明、计划、权限或暂停/恢复状态。仅暂停不需要其他字段。',
      parameters: {
        id: { type: 'string', required: true },
        name: { type: 'string' },
        prompt: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused'] },
        kind: { type: 'string', enum: ['once', 'interval', 'daily', 'weekly'] },
        time_zone: { type: 'string' },
        at: { type: 'string' },
        every_minutes: { type: 'integer' },
        time: { type: 'string' },
        weekdays: { type: 'array', items: { type: 'string', enum: WEEKDAYS } },
        permission: { type: 'string', enum: ['read-only', 'workspace-write', 'full-access'] },
      },
      output: JSON_OUTPUT,
      async execute(args: UpdateArgs, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
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
          if (Object.keys(input).length === 0) throw new Error('automation_update 至少需要一个变更字段')
          const value = await service.update(scope, args.id, input, exec.signal)
          return json({ ok: true, automation: value })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: (args: UpdateArgs) => present('更新自动化', 'other', args.id),
    }))

    register(defineTool({
      name: 'automation_runs',
      description: '读取当前工作区有界的自动化运行历史，包括失败、跳过、摘要和结果 Session。',
      parameters: {},
      output: JSON_OUTPUT,
      async execute(_args: Record<string, never>, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
          const snapshot = await service.snapshot(scope, exec.signal)
          return json({ ok: true, generatedAt: snapshot.generatedAt, runs: snapshot.runs })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: () => present('读取运行历史', 'read'),
    }))

    register(defineTool({
      name: 'automation_run_now',
      description: '立即排队执行一次已有自动化。仍会使用全新 Session 和该规则保存的权限边界。',
      parameters: { id: { type: 'string', required: true } },
      output: JSON_OUTPUT,
      async execute(args: IdArgs, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
          return json({ ok: true, run: await service.runNow(scope, args.id, exec.signal) })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: (args: IdArgs) => present('立即运行自动化', 'other', args.id),
    }))

    register(defineTool({
      name: 'automation_delete',
      description: '删除当前工作区的自动化定义，但保留运行历史用于审计。',
      parameters: { id: { type: 'string', required: true } },
      output: JSON_OUTPUT,
      async execute(args: IdArgs, exec: ToolRunContext) {
        if (exec.agent !== agent || exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
        try {
          return json({ ok: true, value: await service.delete(scope, args.id, exec.signal) })
        } catch (error: unknown) {
          if (exec.signal.aborted) return json({ ok: false, code: 'cancelled' })
          return json({ ok: false, code: 'automation_error', message: error instanceof Error ? error.message : String(error) })
        }
      },
      presentCall: (args: IdArgs) => present('删除自动化', 'other', args.id),
    }))
  } catch (error) {
    for (const dispose of disposers.reverse()) dispose()
    throw error
  }
  return () => { for (const dispose of disposers.reverse()) dispose() }
}

