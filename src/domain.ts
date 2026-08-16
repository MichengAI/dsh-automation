import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { normalizeSchedule, scheduleToRRule } from './recurrence.ts'
import type {
  AutomationDefinition, AutomationRun, AutomationSchedule, CreateAutomationInput,
  DeleteAutomationPlan, UpdateAutomationInput,
} from './types.ts'

const nonBlank = z.string().trim().min(1)
const instant = z.string().datetime({ offset: true })
const timeZone = nonBlank
const weekday = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])
export const automationScheduleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('once'), at: instant, timeZone }),
  z.object({ kind: z.literal('interval'), everyMinutes: z.number().int().min(5), anchor: instant, timeZone }),
  z.object({ kind: z.literal('daily'), time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), timeZone }),
  z.object({
    kind: z.literal('weekly'),
    weekdays: z.array(weekday).min(1),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    timeZone,
  }),
  z.object({ kind: z.literal('hourly'), minute: z.number().int().min(0).max(59), timeZone }),
  z.object({
    kind: z.literal('monthly'),
    day: z.number().int().min(1).max(31),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    timeZone,
  }),
  z.object({
    kind: z.literal('custom'),
    everyDays: z.number().int().min(1).max(365),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    timeZone,
  }),
])

const permissionPreset = z.enum(['read-only', 'workspace-write'])
const creator = z.object({ kind: z.enum(['agent', 'web']), sessionId: nonBlank })
const targetSnapshot = z.object({
  workspaceId: nonBlank,
  cwd: nonBlank,
  agentPreset: nonBlank,
  provider: z.string().nullable(),
  model: z.string().nullable(),
  reasoningEffort: z.string().min(1).nullable().optional(),
  permissionPreset,
})

export const automationDefinitionSchema: z.ZodType<AutomationDefinition> = z.object({
  version: z.literal(1),
  id: nonBlank,
  revision: z.number().int().positive(),
  name: nonBlank,
  prompt: nonBlank,
  status: z.enum(['active', 'paused']),
  schedule: automationScheduleSchema,
  rrule: nonBlank,
  timeZone,
  workspaceId: nonBlank,
  cwd: nonBlank,
  agentPreset: nonBlank,
  provider: z.string().nullable(),
  model: z.string().nullable(),
  reasoningEffort: z.string().min(1).nullable().optional(),
  permissionPreset,
  createdBy: creator,
  createdAt: instant,
  updatedAt: instant,
}).superRefine((value, ctx) => {
  try {
    if (value.timeZone !== value.schedule.timeZone) {
      ctx.addIssue({ code: 'custom', message: 'timeZone must match schedule.timeZone', path: ['timeZone'] })
    }
    if (value.rrule !== scheduleToRRule(value.schedule)) {
      ctx.addIssue({ code: 'custom', message: 'rrule must be derived from schedule', path: ['rrule'] })
    }
  } catch (error) {
    ctx.addIssue({ code: 'custom', message: String(error), path: ['schedule'] })
  }
})

export const automationRunSchema: z.ZodType<AutomationRun> = z.object({
  version: z.literal(1),
  id: nonBlank,
  automationId: nonBlank,
  definitionRevision: z.number().int().positive(),
  occurrenceKey: nonBlank,
  trigger: z.enum(['schedule', 'manual']),
  scheduledFor: instant,
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'skipped', 'cancelled']),
  promptSnapshot: nonBlank,
  targetSnapshot,
  sessionId: z.string().nullable(),
  startedAt: instant.nullable(),
  finishedAt: instant.nullable(),
  summary: z.string().nullable(),
  error: z.object({ code: nonBlank, message: nonBlank }).nullable(),
  unread: z.boolean(),
})

export const automationDomainSpec = {
  name: 'dsh_automation',
  version: 1,
  tables: {
    definitions: { valueSchema: automationDefinitionSchema },
    runs: { valueSchema: automationRunSchema },
  },
} as const

export function createDefinition(input: CreateAutomationInput): AutomationDefinition {
  const schedule = normalizeSchedule(input.schedule)
  const now = parseInstant(input.now, 'now')
  return automationDefinitionSchema.parse({
    version: 1,
    id: requireNonBlank(input.id, 'id'),
    revision: 1,
    name: requireNonBlank(input.name, 'name'),
    prompt: requireNonBlank(input.prompt, 'prompt'),
    status: 'active',
    schedule,
    rrule: scheduleToRRule(schedule),
    timeZone: schedule.timeZone,
    workspaceId: requireNonBlank(input.workspaceId, 'workspaceId'),
    cwd: requireNonBlank(input.cwd, 'cwd'),
    agentPreset: requireNonBlank(input.agentPreset, 'agentPreset'),
    provider: input.provider ?? null,
    model: input.model ?? null,
    ...(input.reasoningEffort === undefined ? {} : { reasoningEffort: input.reasoningEffort }),
    permissionPreset: input.permissionPreset ?? 'read-only',
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  })
}

export function updateDefinition(
  current: AutomationDefinition,
  input: UpdateAutomationInput,
): AutomationDefinition {
  automationDefinitionSchema.parse(current)
  const schedule = normalizeSchedule(input.schedule ?? current.schedule)
  return automationDefinitionSchema.parse({
    ...current,
    revision: current.revision + 1,
    name: input.name === undefined ? current.name : requireNonBlank(input.name, 'name'),
    prompt: input.prompt === undefined ? current.prompt : requireNonBlank(input.prompt, 'prompt'),
    status: input.status ?? current.status,
    schedule,
    rrule: scheduleToRRule(schedule),
    timeZone: schedule.timeZone,
    agentPreset: input.agentPreset === undefined
      ? current.agentPreset
      : requireNonBlank(input.agentPreset, 'agentPreset'),
    provider: input.provider === undefined ? current.provider : input.provider,
    model: input.model === undefined ? current.model : input.model,
    reasoningEffort: input.reasoningEffort === undefined ? current.reasoningEffort : input.reasoningEffort,
    permissionPreset: input.permissionPreset ?? current.permissionPreset,
    workspaceId: input.workspaceId === undefined ? current.workspaceId : requireNonBlank(input.workspaceId, 'workspaceId'),
    cwd: input.cwd === undefined ? current.cwd : requireNonBlank(input.cwd, 'cwd'),
    updatedAt: parseInstant(input.now, 'now'),
  })
}

export function pauseDefinition(current: AutomationDefinition, now: string): AutomationDefinition {
  return setStatus(current, 'paused', now)
}

export function resumeDefinition(current: AutomationDefinition, now: string): AutomationDefinition {
  return setStatus(current, 'active', now)
}

export function deleteDefinition(current: AutomationDefinition): DeleteAutomationPlan {
  automationDefinitionSchema.parse(current)
  return { id: current.id, preserveRunHistory: true }
}

export function occurrenceKey(
  automationId: string,
  definitionRevision: number,
  scheduledFor: string,
): string {
  return `${requireNonBlank(automationId, 'automationId')}:${positiveInteger(definitionRevision, 'definitionRevision')}:${parseInstant(scheduledFor, 'scheduledFor')}`
}

export function runIdForOccurrence(key: string): string {
  return `run_${createHash('sha256').update(requireNonBlank(key, 'occurrenceKey')).digest('hex').slice(0, 32)}`
}

export function createScheduledRun(definition: AutomationDefinition, scheduledFor: string): AutomationRun {
  automationDefinitionSchema.parse(definition)
  const normalizedInstant = parseInstant(scheduledFor, 'scheduledFor')
  const key = occurrenceKey(definition.id, definition.revision, normalizedInstant)
  return queuedRun(definition, normalizedInstant, 'schedule', key, runIdForOccurrence(key))
}

export function createManualRun(
  definition: AutomationDefinition,
  scheduledFor: string,
  nonce: string = randomUUID(),
): AutomationRun {
  automationDefinitionSchema.parse(definition)
  const normalizedInstant = parseInstant(scheduledFor, 'scheduledFor')
  const key = `manual:${definition.id}:${requireNonBlank(nonce, 'nonce')}`
  return queuedRun(definition, normalizedInstant, 'manual', key, runIdForOccurrence(key))
}

function setStatus(
  current: AutomationDefinition,
  status: AutomationDefinition['status'],
  now: string,
): AutomationDefinition {
  automationDefinitionSchema.parse(current)
  if (current.status === status) return current
  return automationDefinitionSchema.parse({
    ...current,
    status,
    revision: current.revision + 1,
    updatedAt: parseInstant(now, 'now'),
  })
}

function queuedRun(
  definition: AutomationDefinition,
  scheduledFor: string,
  trigger: AutomationRun['trigger'],
  key: string,
  id: string,
): AutomationRun {
  return automationRunSchema.parse({
    version: 1,
    id,
    automationId: definition.id,
    definitionRevision: definition.revision,
    occurrenceKey: key,
    trigger,
    scheduledFor,
    status: 'queued',
    promptSnapshot: definition.prompt,
    targetSnapshot: {
      workspaceId: definition.workspaceId,
      cwd: definition.cwd,
      agentPreset: definition.agentPreset,
      provider: definition.provider,
      model: definition.model,
      ...(definition.reasoningEffort === undefined ? {} : { reasoningEffort: definition.reasoningEffort }),
      permissionPreset: definition.permissionPreset,
    },
    sessionId: null,
    startedAt: null,
    finishedAt: null,
    summary: null,
    error: null,
    unread: true,
  })
}

function requireNonBlank(value: string, field: string): string {
  const trimmed = value.trim()
  if (trimmed === '') throw new Error(`${field} must not be blank`)
  return trimmed
}

function parseInstant(value: string, field: string): string {
  const result = instant.safeParse(value)
  if (!result.success) throw new Error(`${field} must be an ISO-8601 instant with an explicit offset`)
  return new Date(result.data).toISOString()
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${field} must be a positive integer`)
  return value
}

export type { AutomationSchedule }
