/** 仅 loopback 的 Web 客户端 RPC 适配器。 */

import type { AutomationService } from './service.ts'
import type { AutomationSchedule as DomainSchedule, Weekday } from './types.ts'

const WEEKDAYS: readonly Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

interface RpcContext {
  readonly connection: {
    readonly rpc: {
      handle(
        channel: string,
        handler: (endpoint: string, payload: unknown, signal: AbortSignal) => Promise<unknown>,
        options: { readonly authority: 'loopback' | 'trusted-host' },
      ): () => Promise<void>
    }
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string`)
  return value
}

function optionalString(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : string(value, label)
}

function integer(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new Error(`${label} must be an integer`)
  return value
}

function toDomainSchedule(raw: unknown, timeZone: string): DomainSchedule {
  const schedule = record(raw, 'schedule')
  const kind = string(schedule.kind, 'schedule.kind')
  switch (kind) {
    case 'once':
      return { kind, at: string(schedule.at, 'schedule.at'), timeZone }
    case 'interval': {
      const everyMinutes = integer(schedule.everyMinutes, 'schedule.everyMinutes')
      return {
        kind,
        everyMinutes,
        anchor: optionalString(schedule.anchor, 'schedule.anchor') ?? new Date().toISOString(),
        timeZone,
      }
    }
    case 'daily':
      return { kind, time: string(schedule.time, 'schedule.time'), timeZone }
    case 'weekly': {
      if (!Array.isArray(schedule.weekdays)) throw new Error('schedule.weekdays must be an array')
      const weekdays = schedule.weekdays.map((value) => {
        const number = integer(value, 'schedule.weekdays[]')
        const weekday = WEEKDAYS[number - 1]
        if (weekday === undefined) throw new Error('schedule.weekdays must contain numbers from 1 to 7')
        return weekday
      })
      return { kind, time: string(schedule.time, 'schedule.time'), weekdays, timeZone }
    }
    case 'hourly':
      return { kind, minute: integer(schedule.minute, 'schedule.minute'), timeZone }
    case 'monthly':
      return { kind, day: integer(schedule.day, 'schedule.day'), time: string(schedule.time, 'schedule.time'), timeZone }
    case 'custom':
      return { kind, everyDays: integer(schedule.everyDays, 'schedule.everyDays'), time: string(schedule.time, 'schedule.time'), timeZone }
    default:
      throw new Error('schedule.kind must be once, interval, daily, weekly, hourly, monthly, or custom')
  }
}

function toClientSchedule(schedule: DomainSchedule): Record<string, unknown> {
  if (schedule.kind !== 'weekly') return { ...schedule }
  return {
    ...schedule,
    weekdays: schedule.weekdays.map(day => WEEKDAYS.indexOf(day) + 1),
  }
}

function errorResult(
  error: unknown,
  aborted = false,
): { readonly ok: false; readonly error: Record<string, unknown> } {
  if (aborted) {
    return {
      ok: false,
      error: { code: 'cancelled', message: '自动化请求已取消。', details: {} },
    }
  }
  const message = error instanceof Error ? error.message : String(error)
  const badRequest = /must|required|unknown automation|another workspace|未来|已有排队|not registered|requires a live|没有工作区|已取消|至少需要/.test(message)
  return {
    ok: false,
    error: {
      code: badRequest ? 'bad-request' : 'internal',
      message,
      details: badRequest ? { issues: [] } : {},
    },
  }
}

function scopeOf(payload: Record<string, unknown>) {
  const sessionId = typeof payload.sessionId === 'string' && payload.sessionId.trim() !== ''
    ? payload.sessionId.trim()
    : 'settings'
  return { sessionId, creatorKind: 'web' as const, hostWide: true }
}

async function snapshotValue(service: AutomationService, payload: Record<string, unknown>, signal: AbortSignal) {
  const snapshot = await service.snapshot(scopeOf(payload), signal)
  const names = new Map(snapshot.definitions.map(definition => [definition.id, definition.name]))
  return {
    scope: {
      workspaceId: snapshot.workspace?.id,
      workspaceName: snapshot.workspace?.title,
      cwd: snapshot.workspace?.path ?? '',
    },
    workspaces: snapshot.workspaces,
    models: snapshot.models,
    defaultModel: snapshot.defaultModel,
    skills: snapshot.skills,
    automations: snapshot.definitions.map(definition => ({
      id: definition.id,
      revision: definition.revision,
      name: definition.name,
      prompt: definition.prompt,
      status: definition.status,
      schedule: toClientSchedule(definition.schedule),
      scheduleSummary: definition.rrule,
      timeZone: definition.timeZone,
      permission: definition.permissionPreset,
      ...(definition.nextRunAt === null ? {} : { nextRunAt: definition.nextRunAt }),
      ...(definition.lastRun === null ? {} : {
        lastRunAt: definition.lastRun.finishedAt ?? definition.lastRun.startedAt ?? definition.lastRun.scheduledFor,
        lastRunStatus: definition.lastRun.error?.code === 'host_interrupted'
          ? 'interrupted'
          : definition.lastRun.status,
      }),
      workspaceId: definition.workspaceId,
      cwd: definition.cwd,
      provider: definition.provider,
      model: definition.model,
      reasoningEffort: definition.reasoningEffort,
      createdAt: definition.createdAt,
      updatedAt: definition.updatedAt,
    })),
    runs: snapshot.runs.map(run => ({
      id: run.id,
      automationId: run.automationId,
      automationName: names.get(run.automationId) ?? run.automationId,
      status: run.error?.code === 'host_interrupted' ? 'interrupted' : run.status,
      trigger: run.trigger,
      scheduledFor: run.scheduledFor,
      ...(run.startedAt === null ? {} : { startedAt: run.startedAt }),
      ...(run.finishedAt === null ? {} : { finishedAt: run.finishedAt }),
      ...(run.sessionId === null ? {} : { sessionId: run.sessionId }),
      ...(run.summary === null ? {} : { summary: run.summary }),
      ...(run.error === null ? {} : { error: run.error.message }),
      unread: run.unread,
    })),
    serverNow: snapshot.generatedAt,
  }
}

export function registerAutomationRpc(ctx: RpcContext, service: AutomationService): () => Promise<void> {
  return ctx.connection.rpc.handle('/dsh-automation', async (endpoint, rawPayload, signal) => {
    try {
      const payload = record(rawPayload, 'payload')
      switch (endpoint) {
        case 'snapshot':
          return { ok: true, value: await snapshotValue(service, payload, signal) }
        case 'create': {
          const input = record(payload.input, 'input')
          const timeZone = string(input.timeZone, 'input.timeZone')
          const created = await service.create(scopeOf(payload), {
            name: string(input.name, 'input.name'),
            prompt: string(input.prompt, 'input.prompt'),
            schedule: toDomainSchedule(input.schedule, timeZone),
            permissionPreset: string(input.permission, 'input.permission') as 'read-only' | 'workspace-write' | 'full-access',
            ...(input.workspaceId === undefined ? {} : { workspaceId: string(input.workspaceId, 'input.workspaceId') }),
            ...(input.cwd === undefined ? {} : { cwd: string(input.cwd, 'input.cwd') }),
            ...(input.provider === undefined ? {} : { provider: input.provider === null ? null : string(input.provider, 'input.provider') }),
            ...(input.model === undefined ? {} : { model: input.model === null ? null : string(input.model, 'input.model') }),
            ...(input.reasoningEffort === undefined ? {} : { reasoningEffort: input.reasoningEffort === null ? null : string(input.reasoningEffort, 'input.reasoningEffort') }),
          }, signal)
          return { ok: true, value: { id: created.id } }
        }
        case 'mutate': {
          const id = string(payload.automationId, 'automationId')
          const mutation = string(payload.mutation, 'mutation')
          if (mutation === 'delete') {
            return { ok: true, value: await service.delete(scopeOf(payload), id, signal) }
          }
          if (mutation !== 'pause' && mutation !== 'resume') {
            throw new Error('mutation must be pause, resume, or delete')
          }
          const value = await service.update(scopeOf(payload), id, {
            status: mutation === 'pause' ? 'paused' : 'active',
          }, signal)
          return { ok: true, value: { id: value.id, revision: value.revision } }
        }
        case 'update': {
          const id = string(payload.automationId, 'automationId')
          const input = record(payload.input, 'input')
          const timeZone = string(input.timeZone, 'input.timeZone')
          const value = await service.update(scopeOf(payload), id, {
            name: string(input.name, 'input.name'),
            prompt: string(input.prompt, 'input.prompt'),
            schedule: toDomainSchedule(input.schedule, timeZone),
            permissionPreset: string(input.permission, 'input.permission') as 'read-only' | 'workspace-write' | 'full-access',
            ...(input.workspaceId === undefined ? {} : { workspaceId: string(input.workspaceId, 'input.workspaceId') }),
            ...(input.cwd === undefined ? {} : { cwd: string(input.cwd, 'input.cwd') }),
            ...(input.provider === undefined ? {} : { provider: input.provider === null ? null : string(input.provider, 'input.provider') }),
            ...(input.model === undefined ? {} : { model: input.model === null ? null : string(input.model, 'input.model') }),
            ...(input.reasoningEffort === undefined ? {} : { reasoningEffort: input.reasoningEffort === null ? null : string(input.reasoningEffort, 'input.reasoningEffort') }),
          }, signal)
          return { ok: true, value: { id: value.id, revision: value.revision } }
        }
        case 'run-now': {
          const run = await service.runNow(scopeOf(payload), string(payload.automationId, 'automationId'), signal)
          return { ok: true, value: { runId: run.id } }
        }
        case 'mark-read': {
          const run = await service.markRead(scopeOf(payload), string(payload.runId, 'runId'), signal)
          return { ok: true, value: { runId: run.id, unread: run.unread } }
        }
        default:
          throw new Error(`unknown automation endpoint '${endpoint}'`)
      }
    } catch (error) {
      return errorResult(error, signal.aborted)
    }
  }, { authority: 'loopback' })
}

