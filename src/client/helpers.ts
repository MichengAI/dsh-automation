import type { Translate } from './contracts.js'
import type {
  AutomationSchedule,
  AutomationRunStatus,
  AutomationSnapshot,
  AutomationViewModel,
  CreateAutomationInput,
  ModelOption,
  WorkspaceOption,
} from './protocol.js'

export type ScheduleKind = 'once' | 'interval' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface AutomationFormState {
  readonly name: string
  readonly prompt: string
  readonly scheduleKind: ScheduleKind
  readonly onceAt: string
  readonly everyMinutes: string
  readonly intervalAnchor: string
  readonly time: string
  readonly weekdays: readonly number[]
  readonly hourlyMinute: string
  readonly monthDay: string
  readonly customDays: string
  readonly timeZone: string
  readonly permission: CreateAutomationInput['permission']
  readonly workspaceId: string
  readonly modelKey: string
  readonly reasoningEffort: string
  readonly skills: readonly string[]
}

export type FormErrorKey =
  | 'form.error.name'
  | 'form.error.prompt'
  | 'form.error.once'
  | 'form.error.interval'
  | 'form.error.weekdays'
  | 'form.error.workspace'

export class AutomationFormError extends Error {
  constructor(readonly key: FormErrorKey) {
    super(key)
  }
}

const SKILL_GESTURE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Chat 点选技能后写入输入框的 `/name` 文本。优先用合法技能名，否则回退到目录 id。 */
export function skillGestureToken(skill: { readonly id: string; readonly name: string }): string {
  const raw = SKILL_GESTURE_NAME.test(skill.name) ? skill.name : skill.id
  return `/${raw}`
}

/** 在光标处插入技能手势；已存在相同 token 时不重复插入。 */
export function insertSkillGesture(
  prompt: string,
  token: string,
  caret: number,
): { readonly text: string; readonly caret: number } {
  const normalized = token.startsWith('/') ? token : `/${token}`
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(prompt)) {
    return { text: prompt, caret: Math.min(Math.max(caret, 0), prompt.length) }
  }
  const at = Math.min(Math.max(caret, 0), prompt.length)
  const prefix = prompt.slice(0, at)
  const suffix = prompt.slice(at)
  const lead = prefix.length > 0 && !/\s$/.test(prefix) ? ' ' : ''
  const inserted = `${lead}${normalized} `
  return { text: prefix + inserted + suffix, caret: prefix.length + inserted.length }
}
export function localDateTimeValue(date = new Date()): string {
  const future = new Date(date.getTime() + 60 * 60 * 1000)
  future.setMinutes(0, 0, 0)
  const offset = future.getTimezoneOffset() * 60_000
  return new Date(future.getTime() - offset).toISOString().slice(0, 16)
}

export function defaultFormState(
  now = new Date(),
  workspaces: readonly WorkspaceOption[] = [],
  defaultModel?: ModelOption | null,
  defaultPermission = '',
): AutomationFormState {
  return {
    name: '',
    prompt: '',
    scheduleKind: 'daily',
    onceAt: localDateTimeValue(now),
    everyMinutes: '60',
    intervalAnchor: '',
    time: '09:00',
    weekdays: [1, 2, 3, 4, 5],
    hourlyMinute: '00',
    monthDay: '1',
    customDays: '2',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
    permission: defaultPermission,
    workspaceId: workspaces[0]?.id ?? '',
    modelKey: defaultModel === undefined || defaultModel === null
      ? 'default'
      : `${defaultModel.provider}::${defaultModel.model}`,
    reasoningEffort: defaultModel?.reasoning?.defaultEffort ?? 'none',
    skills: [],
  }
}

export function buildCreateInput(
  form: AutomationFormState,
  workspaces: readonly WorkspaceOption[],
  models: readonly ModelOption[],
  now = new Date(),
  options: { readonly allowPastOnce?: boolean } = {},
): CreateAutomationInput {
  const name = form.name.trim()
  const prompt = form.prompt.trim()
  if (name === '') throw new AutomationFormError('form.error.name')
  if (prompt === '') throw new AutomationFormError('form.error.prompt')
  const workspace = workspaces.find(item => item.id === form.workspaceId)
  if (workspace === undefined) throw new AutomationFormError('form.error.workspace')

  let schedule: CreateAutomationInput['schedule']
  switch (form.scheduleKind) {
    case 'once': {
      const at = new Date(form.onceAt)
      if (!Number.isFinite(at.getTime()) || (options.allowPastOnce !== true && at.getTime() <= now.getTime())) {
        throw new AutomationFormError('form.error.once')
      }
      schedule = { kind: 'once', at: at.toISOString(), timeZone: form.timeZone }
      break
    }
    case 'interval': {
      const everyMinutes = Number(form.everyMinutes)
      if (!Number.isInteger(everyMinutes) || everyMinutes < 5 || everyMinutes > 43_200) {
        throw new AutomationFormError('form.error.interval')
      }
      schedule = {
        kind: 'interval',
        everyMinutes,
        anchor: form.intervalAnchor.trim() || now.toISOString(),
        timeZone: form.timeZone,
      }
      break
    }
    case 'daily':
      schedule = { kind: 'daily', time: form.time, timeZone: form.timeZone }
      break
    case 'weekly':
      if (form.weekdays.length === 0) throw new AutomationFormError('form.error.weekdays')
      schedule = { kind: 'weekly', time: form.time, weekdays: [...form.weekdays].sort((a, b) => a - b), timeZone: form.timeZone }
      break
    case 'hourly': {
      const minute = Number(form.hourlyMinute)
      if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new AutomationFormError('form.error.interval')
      schedule = { kind: 'hourly', minute, timeZone: form.timeZone }
      break
    }
    case 'monthly': {
      const day = Number(form.monthDay)
      if (!Number.isInteger(day) || day < 1 || day > 31) throw new AutomationFormError('form.error.interval')
      schedule = { kind: 'monthly', day, time: form.time, timeZone: form.timeZone }
      break
    }
    case 'custom': {
      const everyDays = Number(form.customDays)
      if (!Number.isInteger(everyDays) || everyDays < 1) throw new AutomationFormError('form.error.interval')
      schedule = { kind: 'custom', everyDays, time: form.time, timeZone: form.timeZone }
      break
    }
  }

  const selected = models.find(item => `${item.provider}::${item.model}` === form.modelKey)
  return {
    name,
    prompt,
    schedule,
    timeZone: form.timeZone,
    permission: form.permission,
    workspaceId: workspace.id,
    cwd: workspace.path,
    ...(selected === undefined ? { provider: null, model: null } : { provider: selected.provider, model: selected.model }),
    reasoningEffort: form.reasoningEffort === 'none' ? null : form.reasoningEffort,
  }
}

const ATTENTION_STATUSES = new Set<AutomationRunStatus>(['failed', 'interrupted'])

export interface OverviewStats {
  readonly total: number
  readonly active: number
  readonly attention: number
  readonly nextRunAt?: string
}

export function deriveOverview(snapshot: AutomationSnapshot): OverviewStats {
  const next = snapshot.automations
    .filter(item => item.status === 'active' && item.nextRunAt !== undefined)
    .map(item => item.nextRunAt as string)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0]
  return {
    total: snapshot.automations.length,
    active: snapshot.automations.filter(item => item.status === 'active').length,
    attention: snapshot.runs.filter(run => ATTENTION_STATUSES.has(run.status) && run.unread !== false).length,
    ...(next === undefined ? {} : { nextRunAt: next }),
  }
}

export function formatRelativeTime(iso: string, now: Date, t: Translate): string {
  const value = Date.parse(iso)
  if (!Number.isFinite(value)) return iso
  const deltaMinutes = Math.round((value - now.getTime()) / 60_000)
  const abs = Math.abs(deltaMinutes)
  if (abs < 1) return t('time.now')
  const future = deltaMinutes > 0
  if (abs < 60) return t(future ? 'time.inMinute' : 'time.minuteAgo', { count: abs })
  const hours = Math.round(abs / 60)
  if (hours < 24) return t(future ? 'time.inHour' : 'time.hourAgo', { count: hours })
  const days = Math.round(hours / 24)
  return t(future ? 'time.inDay' : 'time.dayAgo', { count: days })
}

export function shortSessionId(sessionId: string): string {
  return sessionId.length <= 12 ? sessionId : `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`
}

export function formatSchedule(schedule: AutomationSchedule, t: Translate): string {
  switch (schedule.kind) {
    case 'once':
      return t('schedule.onceAt', { time: new Date(schedule.at).toLocaleString() })
    case 'interval':
      return t('schedule.everyMinutes', { count: schedule.everyMinutes })
    case 'daily':
      return t('schedule.dailyAt', { time: schedule.time })
    case 'weekly': {
      const days = schedule.weekdays.map(day => t(`day.${day}` as 'day.1' | 'day.2' | 'day.3' | 'day.4' | 'day.5' | 'day.6' | 'day.7')).join('、')
      return t('schedule.weeklyAt', { days, time: schedule.time })
    }
    case 'hourly':
      return t('schedule.hourlyAt', { minute: String(schedule.minute).padStart(2, '0') })
    case 'monthly':
      return t('schedule.monthlyAt', { day: schedule.day, time: schedule.time })
    case 'custom':
      return t('schedule.customAt', { count: schedule.everyDays, time: schedule.time })
  }
}

export function workspaceLabel(
  item: { readonly workspaceId?: string; readonly cwd?: string },
  workspaces: readonly WorkspaceOption[],
): string {
  const found = workspaces.find(workspace => workspace.id === item.workspaceId)
  return found?.title || item.cwd || item.workspaceId || '-'
}

export function formatWithin(iso: string, now: Date, t: Translate): string {
  const delta = Date.parse(iso) - now.getTime()
  if (!Number.isFinite(delta) || delta <= 0) return t('time.now')
  const minutes = Math.max(1, Math.ceil(delta / 60_000))
  if (minutes < 60) return t('time.withinMinute', { count: minutes })
  const hours = Math.ceil(minutes / 60)
  if (hours < 24) return t('time.withinHour', { count: hours })
  return t('time.withinDay', { count: Math.ceil(hours / 24) })
}

export function formatDuration(startedAt?: string, finishedAt?: string): string | undefined {
  if (startedAt === undefined || finishedAt === undefined) return undefined
  const seconds = (Date.parse(finishedAt) - Date.parse(startedAt)) / 1000
  if (!Number.isFinite(seconds) || seconds < 0) return undefined
  return `${seconds.toFixed(1)}s`
}

export function clockTime(iso: string): string {
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return iso
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export type HistoryRange = 'day' | 'week' | 'month'

export type AutomationSortKey = 'created' | 'planned'
export type AutomationSortDirection = 'asc' | 'desc'

export interface HistoryGroup {
  readonly key: string
  readonly label: string
  readonly items: readonly import('./protocol.js').AutomationRunViewModel[]
}

function sortStamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** 设置页任务列表排序：计划时间 = nextRunAt，无计划的任务固定排最后。 */
export function sortAutomations(
  items: readonly AutomationViewModel[],
  key: AutomationSortKey,
  direction: AutomationSortDirection,
): AutomationViewModel[] {
  const factor = direction === 'asc' ? 1 : -1
  return items.slice().sort((left, right) => {
    if (key === 'planned') {
      const leftNext = left.nextRunAt
      const rightNext = right.nextRunAt
      if (leftNext === undefined || rightNext === undefined) {
        if (leftNext === undefined && rightNext === undefined) {
          return left.name.localeCompare(right.name) || left.id.localeCompare(right.id)
        }
        return leftNext === undefined ? 1 : -1
      }
      const primary = sortStamp(leftNext) - sortStamp(rightNext)
      if (primary !== 0) return primary * factor
      return left.name.localeCompare(right.name) || left.id.localeCompare(right.id)
    }
    const primary = sortStamp(left.createdAt) - sortStamp(right.createdAt)
    if (primary !== 0) return primary * factor
    return left.id.localeCompare(right.id)
  })
}

export function groupHistory(
  runs: readonly import('./protocol.js').AutomationRunViewModel[],
  range: HistoryRange,
  now: Date,
  t: Translate,
): HistoryGroup[] {
  const buckets = new Map<string, import('./protocol.js').AutomationRunViewModel[]>()
  for (const run of runs) {
    const at = new Date(run.finishedAt ?? run.startedAt ?? run.scheduledFor)
    if (Number.isNaN(at.getTime())) continue
    let key: string
    if (range === 'month') {
      key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`
    } else if (range === 'week') {
      const start = startOfWeek(at)
      key = localDayKey(start)
    } else {
      key = localDayKey(at)
    }
    const existing = buckets.get(key) ?? []
    existing.push(run)
    buckets.set(key, existing)
  }
  return [...buckets.entries()].map(([key, items]) => ({
    key,
    label: items[0] === undefined ? key : (
      range === 'month'
        ? t('history.month', { month: key.replace('-', '/') })
        : range === 'week'
          ? t('history.week', { date: key.slice(5).replace('-', '/') })
          : key === localDayKey(now)
            ? t('history.today')
            : key === localDayKey(new Date(now.getTime() - 86_400_000))
              ? t('history.yesterday')
              : t('history.date', { date: key.slice(5).replace('-', '/') })
    ),
    items,
  }))
}

function localDayKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function startOfWeek(value: Date): Date {
  const next = new Date(value)
  const day = next.getDay()
  const offset = day === 0 ? 6 : day - 1
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() - offset)
  return next
}

export function formFromAutomation(
  item: import('./protocol.js').AutomationViewModel,
  workspaces: readonly WorkspaceOption[] = [],
  defaultModel?: ModelOption | null,
  defaultPermission = item.permission,
): AutomationFormState {
  const base = defaultFormState(new Date(), workspaces, defaultModel, defaultPermission)
  const schedule = item.schedule
  const modelKey = item.provider && item.model ? `${item.provider}::${item.model}` : 'default'
  const common = {
    ...base,
    name: item.name,
    prompt: item.prompt,
    permission: item.permission,
    workspaceId: item.workspaceId ?? base.workspaceId,
    modelKey,
    reasoningEffort: item.reasoningEffort ?? 'none',
    timeZone: item.timeZone || schedule.timeZone || base.timeZone,
  }
  switch (schedule.kind) {
    case 'once':
      return { ...common, scheduleKind: 'once', onceAt: toLocalInput(schedule.at) }
    case 'interval':
      return {
        ...common,
        scheduleKind: 'interval',
        everyMinutes: String(schedule.everyMinutes),
        intervalAnchor: schedule.anchor ?? '',
      }
    case 'hourly':
      return { ...common, scheduleKind: 'hourly', hourlyMinute: String(schedule.minute).padStart(2, '0') }
    case 'daily':
      return { ...common, scheduleKind: 'daily', time: schedule.time }
    case 'weekly':
      return { ...common, scheduleKind: 'weekly', time: schedule.time, weekdays: [...schedule.weekdays] }
    case 'monthly':
      return { ...common, scheduleKind: 'monthly', time: schedule.time, monthDay: String(schedule.day) }
    case 'custom':
      return { ...common, scheduleKind: 'custom', time: schedule.time, customDays: String(schedule.everyDays) }
  }
}

function toLocalInput(iso: string): string {
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return localDateTimeValue()
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}


export function prettyModelName(model: string): string {
  return model.split(/[-_]/g).map((part) => {
    if (part.toLowerCase() === 'deepseek') return 'DeepSeek'
    if (/^v\d/i.test(part)) return part.slice(0, 1).toUpperCase() + part.slice(1)
    if (part === '') return part
    return part.slice(0, 1).toUpperCase() + part.slice(1)
  }).join('-')
}
