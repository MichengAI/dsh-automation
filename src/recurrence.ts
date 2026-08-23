import { DateTime, IANAZone } from 'luxon'
import type { AutomationSchedule, Weekday } from './types.ts'

const WEEKDAY_NUMBERS: Readonly<Record<Weekday, number>> = {
  MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7,
}
const WEEKDAY_ORDER = Object.keys(WEEKDAY_NUMBERS) as Weekday[]
const LOCAL_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const farFutureIso = '9999-12-31T23:59:59.999Z'

export function assertValidSchedule(schedule: AutomationSchedule): void {
  assertTimeZone(schedule.timeZone)
  if (schedule.kind === 'once') {
    parseInstant(schedule.at, 'once.at')
    return
  }
  if (schedule.kind === 'interval') {
    if (!Number.isInteger(schedule.everyMinutes) || schedule.everyMinutes < 5) {
      throw new Error('interval.everyMinutes must be an integer of at least 5')
    }
    parseInstant(schedule.anchor, 'interval.anchor')
    return
  }
  if (schedule.kind === 'hourly') {
    if (!Number.isInteger(schedule.minute) || schedule.minute < 0 || schedule.minute > 59) {
      throw new Error('hourly.minute must be an integer from 0 to 59')
    }
    return
  }
  if (!LOCAL_TIME.test(schedule.time)) {
    throw new Error(`${schedule.kind}.time must use 24-hour HH:mm format`)
  }
  if (schedule.kind === 'monthly' && (!Number.isInteger(schedule.day) || schedule.day < 1 || schedule.day > 31)) {
    throw new Error('monthly.day must be an integer from 1 to 31')
  }
  if (schedule.kind === 'custom' && (!Number.isInteger(schedule.everyDays) || schedule.everyDays < 1)) {
    throw new Error('custom.everyDays must be a positive integer')
  }
  if (schedule.kind === 'weekly') {
    if (schedule.weekdays.length === 0) throw new Error('weekly.weekdays must not be empty')
    if (new Set(schedule.weekdays).size !== schedule.weekdays.length) {
      throw new Error('weekly.weekdays must not contain duplicates')
    }
    for (const weekday of schedule.weekdays) {
      if (!Object.hasOwn(WEEKDAY_NUMBERS, weekday)) throw new Error(`invalid weekday '${weekday}'`)
    }
  }
}

export function normalizeSchedule(schedule: AutomationSchedule): AutomationSchedule {
  assertValidSchedule(schedule)
  if (schedule.kind !== 'weekly') return schedule
  const selected = new Set(schedule.weekdays)
  return { ...schedule, weekdays: WEEKDAY_ORDER.filter(day => selected.has(day)) }
}

export function scheduleToRRule(schedule: AutomationSchedule): string {
  const normalized = normalizeSchedule(schedule)
  if (normalized.kind === 'once') {
    const at = parseInstant(normalized.at, 'once.at').toUTC()
    return `DTSTART:${formatUtc(at)}\nRRULE:FREQ=DAILY;COUNT=1`
  }
  if (normalized.kind === 'interval') {
    const first = parseInstant(normalized.anchor, 'interval.anchor')
      .toUTC()
      .plus({ minutes: normalized.everyMinutes })
    return `DTSTART:${formatUtc(first)}\nRRULE:FREQ=MINUTELY;INTERVAL=${normalized.everyMinutes}`
  }
  if (normalized.kind === 'hourly') {
    return `DTSTART:19700101T000000Z\nRRULE:FREQ=HOURLY;BYMINUTE=${normalized.minute};BYSECOND=0`
  }
  const [hour, minute] = parseLocalTime(normalized.time)
  if (normalized.kind === 'monthly') {
    return `DTSTART;TZID=${normalized.timeZone}:19700101T${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00\nRRULE:FREQ=MONTHLY;BYMONTHDAY=${normalized.day};BYHOUR=${hour};BYMINUTE=${minute};BYSECOND=0`
  }
  if (normalized.kind === 'custom') {
    return `DTSTART;TZID=${normalized.timeZone}:19700101T${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00\nRRULE:FREQ=DAILY;INTERVAL=${normalized.everyDays};BYHOUR=${hour};BYMINUTE=${minute};BYSECOND=0`
  }
  const base = DateTime.fromObject({ year: 1970, month: 1, day: 5 }, { zone: normalized.timeZone })
  const start = firstValidLocalOccurrence(normalized, base, hour, minute)
  const byDay = normalized.kind === 'weekly' ? `;BYDAY=${normalized.weekdays.join(',')}` : ''
  const frequency = normalized.kind === 'weekly' ? 'WEEKLY' : 'DAILY'
  return `DTSTART;TZID=${normalized.timeZone}:${formatLocal(start)}\nRRULE:FREQ=${frequency}${byDay};BYHOUR=${hour};BYMINUTE=${minute};BYSECOND=0`
}

export function nextOccurrence(schedule: AutomationSchedule, afterExclusive: string): string | null {
  return occurrencesBetween(schedule, afterExclusive, farFutureIso, 1)[0] ?? null
}

export function latestDueOccurrence(schedule: AutomationSchedule, now: string): string | null {
  assertValidSchedule(schedule)
  const nowMs = parseInstant(now, 'now').toMillis()
  if (schedule.kind === 'once') {
    const at = parseInstant(schedule.at, 'once.at').toMillis()
    return at <= nowMs ? DateTime.fromMillis(at, { zone: 'utc' }).toISO() : null
  }
  if (schedule.kind === 'interval') {
    const anchor = parseInstant(schedule.anchor, 'interval.anchor').toMillis()
    const step = schedule.everyMinutes * 60_000
    if (anchor + step > nowMs) return null
    return DateTime.fromMillis(
      anchor + Math.floor((nowMs - anchor) / step) * step,
      { zone: 'utc' },
    ).toISO()
  }
  // latestDueOccurrence 只需要最近一个到期点。hourly 的最近点最多一小时前；
  // 若沿用 2 天窗口，前向 limit 会截掉真正的最新点。
  const lookbackMs = schedule.kind === 'hourly'
    ? 2 * 60 * 60_000
    : (schedule.kind === 'daily' ? 2 : schedule.kind === 'monthly' ? 40 : 8) * 86_400_000
  const values = occurrencesBetween(
    schedule,
    DateTime.fromMillis(nowMs - lookbackMs, { zone: 'utc' }).toISO()!,
    DateTime.fromMillis(nowMs, { zone: 'utc' }).toISO()!,
    16,
  )
  return values.at(-1) ?? null
}

export function occurrencesBetween(
  schedule: AutomationSchedule,
  afterExclusive: string,
  untilInclusive: string,
  limit = 1_000,
): string[] {
  const normalized = normalizeSchedule(schedule)
  const after = parseInstant(afterExclusive, 'afterExclusive').toUTC()
  const until = parseInstant(untilInclusive, 'untilInclusive').toUTC()
  if (until < after || !Number.isInteger(limit) || limit < 1) return []

  if (normalized.kind === 'once') {
    const at = parseInstant(normalized.at, 'once.at').toUTC()
    return at > after && at <= until ? [at.toISO()!] : []
  }
  if (normalized.kind === 'interval') {
    return intervalOccurrences(normalized.anchor, normalized.everyMinutes, after, until, limit)
  }
  if (normalized.kind === 'hourly') {
    return hourlyOccurrences(normalized, after, until, limit)
  }
  if (normalized.kind === 'monthly') {
    return monthlyOccurrences(normalized, after, until, limit)
  }
  if (normalized.kind === 'custom') {
    return customOccurrences(normalized, after, until, limit)
  }
  return calendarOccurrences(normalized, after, until, limit)
}


function hourlyOccurrences(
  schedule: Extract<AutomationSchedule, { kind: 'hourly' }>,
  after: DateTime,
  until: DateTime,
  limit: number,
): string[] {
  let cursor = after.setZone(schedule.timeZone).plus({ minutes: 1 }).set({ minute: schedule.minute, second: 0, millisecond: 0 })
  if (cursor <= after.setZone(schedule.timeZone)) cursor = cursor.plus({ hours: 1 })
  if (cursor.minute !== schedule.minute) cursor = cursor.set({ minute: schedule.minute, second: 0, millisecond: 0 })
  const values: string[] = []
  while (cursor.toUTC() <= until && values.length < limit) {
    const utc = cursor.toUTC()
    if (utc > after && utc <= until && cursor.minute === schedule.minute) values.push(utc.toISO()!)
    cursor = cursor.plus({ hours: 1 }).set({ minute: schedule.minute, second: 0, millisecond: 0 })
  }
  return values
}

function monthlyOccurrences(
  schedule: Extract<AutomationSchedule, { kind: 'monthly' }>,
  after: DateTime,
  until: DateTime,
  limit: number,
): string[] {
  const [hour, minute] = parseLocalTime(schedule.time)
  let cursor = after.setZone(schedule.timeZone).startOf('month')
  const values: string[] = []
  while (cursor.toUTC() <= until.plus({ days: 32 }) && values.length < limit) {
    const candidate = localCandidate(cursor.set({ day: 1 }), hour, minute, schedule.timeZone)
    const dayValue = DateTime.fromObject(
      { year: cursor.year, month: cursor.month, day: schedule.day, hour, minute, second: 0, millisecond: 0 },
      { zone: schedule.timeZone },
    )
    if (dayValue.isValid && dayValue.day === schedule.day && dayValue.hour === hour && dayValue.minute === minute) {
      const utc = dayValue.toUTC()
      if (utc > after && utc <= until) values.push(utc.toISO()!)
    }
    cursor = cursor.plus({ months: 1 })
    void candidate
  }
  return values
}

function customOccurrences(
  schedule: Extract<AutomationSchedule, { kind: 'custom' }>,
  after: DateTime,
  until: DateTime,
  limit: number,
): string[] {
  const [hour, minute] = parseLocalTime(schedule.time)
  const origin = DateTime.fromObject({ year: 1970, month: 1, day: 1 }, { zone: schedule.timeZone }).startOf('day')
  let cursor = after.setZone(schedule.timeZone).startOf('day')
  const values: string[] = []
  while (cursor.toUTC() <= until.plus({ days: 1 }) && values.length < limit) {
    const days = Math.floor(cursor.diff(origin, 'days').days)
    if (days >= 0 && days % schedule.everyDays === 0) {
      const value = localCandidate(cursor, hour, minute, schedule.timeZone)
      if (value !== null) {
        const utc = value.toUTC()
        if (utc > after && utc <= until) values.push(utc.toISO()!)
      }
    }
    cursor = cursor.plus({ days: 1 })
  }
  return values
}

function intervalOccurrences(
  anchorIso: string,
  everyMinutes: number,
  after: DateTime,
  until: DateTime,
  limit: number,
): string[] {
  const anchor = parseInstant(anchorIso, 'interval.anchor').toUTC()
  const stepMs = everyMinutes * 60_000
  const elapsed = after.toMillis() - anchor.toMillis()
  const steps = Math.max(1, Math.floor(elapsed / stepMs) + 1)
  let candidateMs = anchor.toMillis() + steps * stepMs
  const values: string[] = []
  while (candidateMs <= until.toMillis() && values.length < limit) {
    values.push(DateTime.fromMillis(candidateMs, { zone: 'utc' }).toISO()!)
    candidateMs += stepMs
  }
  return values
}

function calendarOccurrences(
  schedule: Extract<AutomationSchedule, { kind: 'daily' | 'weekly' }>,
  after: DateTime,
  until: DateTime,
  limit: number,
): string[] {
  const [hour, minute] = parseLocalTime(schedule.time)
  const allowed = schedule.kind === 'weekly'
    ? new Set(schedule.weekdays.map(day => WEEKDAY_NUMBERS[day]))
    : null
  const values: string[] = []
  let cursor = after.setZone(schedule.timeZone).startOf('day')
  const last = until.setZone(schedule.timeZone).plus({ days: 1 }).startOf('day')
  while (cursor <= last && values.length < limit) {
    if (allowed === null || allowed.has(cursor.weekday)) {
      const candidate = localCandidate(cursor, hour, minute, schedule.timeZone)
      if (candidate !== null) {
        const utc = candidate.toUTC()
        if (utc > after && utc <= until) values.push(utc.toISO()!)
      }
    }
    cursor = cursor.plus({ days: 1 })
  }
  return values
}

function firstValidLocalOccurrence(
  schedule: Extract<AutomationSchedule, { kind: 'daily' | 'weekly' }>,
  from: DateTime,
  hour: number,
  minute: number,
): DateTime {
  const allowed = schedule.kind === 'weekly'
    ? new Set(schedule.weekdays.map(day => WEEKDAY_NUMBERS[day]))
    : null
  for (let offset = 0; offset < 8; offset += 1) {
    const date = from.startOf('day').plus({ days: offset })
    if (allowed !== null && !allowed.has(date.weekday)) continue
    const value = localCandidate(date, hour, minute, schedule.timeZone)
    if (value !== null && value >= from) return value
  }
  throw new Error('schedule has no valid local occurrence in the next week')
}

function localCandidate(date: DateTime, hour: number, minute: number, zone: string): DateTime | null {
  const value = DateTime.fromObject(
    { year: date.year, month: date.month, day: date.day, hour, minute, second: 0, millisecond: 0 },
    { zone },
  )
  return value.isValid && value.hour === hour && value.minute === minute ? value : null
}

function parseInstant(value: string, field: string): DateTime {
  const parsed = DateTime.fromISO(value, { setZone: true })
  if (!parsed.isValid || parsed.offsetNameShort === null || !/(?:Z|[+-]\d\d:\d\d)$/.test(value)) {
    throw new Error(`${field} must be an ISO-8601 instant with an explicit offset`)
  }
  return parsed
}

function assertTimeZone(zone: string): void {
  if (!IANAZone.isValidZone(zone)) {
    throw new Error(`timeZone '${zone}' must be an explicit IANA zone such as Asia/Shanghai`)
  }
}

function parseLocalTime(value: string): [number, number] {
  const [hour, minute] = value.split(':').map(Number)
  return [hour!, minute!]
}

function formatUtc(value: DateTime): string {
  return value.toFormat("yyyyMMdd'T'HHmmss'Z'")
}

function formatLocal(value: DateTime): string {
  return value.toFormat("yyyyMMdd'T'HHmmss")
}
