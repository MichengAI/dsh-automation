import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isEqualSchedule,
  latestDueOccurrence,
  nextOccurrence,
  normalizeSchedule,
  scheduleToRRule,
} from '../src/recurrence.ts'

test('间隔计划不会在创建当即触发', () => {
  const schedule = {
    kind: 'interval' as const,
    everyMinutes: 30,
    anchor: '2026-08-16T00:00:00.000Z',
    timeZone: 'UTC',
  }
  assert.equal(latestDueOccurrence(schedule, '2026-08-16T00:20:00.000Z'), null)
  assert.equal(nextOccurrence(schedule, '2026-08-16T00:00:00.000Z'), '2026-08-16T00:30:00.000Z')
  assert.equal(latestDueOccurrence(schedule, '2026-08-16T01:05:00.000Z'), '2026-08-16T01:00:00.000Z')
})

test('每天计划保持本地墙钟时间并跳过不存在的夏令时时刻', () => {
  const schedule = { kind: 'daily' as const, time: '02:30', timeZone: 'America/New_York' }
  const values = [
    nextOccurrence(schedule, '2026-03-07T10:00:00.000Z'),
    nextOccurrence(schedule, '2026-03-08T10:00:00.000Z'),
  ]
  assert.equal(values[0], '2026-03-09T06:30:00.000Z')
  assert.notEqual(values[1], '2026-03-08T06:30:00.000Z')
})

test('每周计划按标准化星期顺序生成 RRULE', () => {
  const schedule = normalizeSchedule({
    kind: 'weekly',
    weekdays: ['FR', 'MO'],
    time: '09:00',
    timeZone: 'Asia/Shanghai',
  })
  assert.deepEqual(schedule.kind === 'weekly' ? [...schedule.weekdays] : [], ['MO', 'FR'])
  assert.match(scheduleToRRule(schedule), /FREQ=WEEKLY;BYDAY=MO,FR/)
})

test('计划语义判等不受对象字段顺序和星期顺序影响', () => {
  assert.equal(isEqualSchedule(
    { kind: 'weekly', time: '09:00', weekdays: ['FR', 'MO'], timeZone: 'Asia/Shanghai' },
    { kind: 'weekly', weekdays: ['MO', 'FR'], time: '09:00', timeZone: 'Asia/Shanghai' },
  ), true)
  assert.equal(isEqualSchedule(
    { kind: 'daily', time: '09:00', timeZone: 'Asia/Shanghai' },
    { kind: 'daily', time: '10:00', timeZone: 'Asia/Shanghai' },
  ), false)
})

test('每小时计划按分钟对齐', () => {
  const schedule = { kind: 'hourly' as const, minute: 15, timeZone: 'UTC' }
  assert.equal(nextOccurrence(schedule, '2026-08-16T10:00:00.000Z'), '2026-08-16T10:15:00.000Z')
  assert.equal(nextOccurrence(schedule, '2026-08-16T10:15:00.000Z'), '2026-08-16T11:15:00.000Z')
})

test('每小时 latestDue 必须取满载窗口中的最近到期点', () => {
  const schedule = { kind: 'hourly' as const, minute: 15, timeZone: 'UTC' }
  assert.equal(
    latestDueOccurrence(schedule, '2026-08-23T10:30:00.000Z'),
    '2026-08-23T10:15:00.000Z',
  )
})

test('每月计划跳过不存在的日期', () => {
  const schedule = { kind: 'monthly' as const, day: 31, time: '09:00', timeZone: 'UTC' }
  const next = nextOccurrence(schedule, '2026-01-31T10:00:00.000Z')
  assert.equal(next, '2026-03-31T09:00:00.000Z')
})

test('长周期自定义计划恢复时仍能找到最近一次到期点', () => {
  const schedule = { kind: 'custom' as const, everyDays: 30, time: '09:00', timeZone: 'UTC' }
  assert.equal(
    latestDueOccurrence(schedule, '2026-08-15T09:00:00.000Z'),
    '2026-08-05T09:00:00.000Z',
  )
})

test('每月 31 日计划在短月之后仍能找到最近一次到期点', () => {
  const schedule = { kind: 'monthly' as const, day: 31, time: '09:00', timeZone: 'UTC' }
  assert.equal(
    latestDueOccurrence(schedule, '2026-03-30T09:00:00.000Z'),
    '2026-01-31T09:00:00.000Z',
  )
})

test('每周计划遇到不存在的夏令时时刻后仍能找到上一次有效到期点', () => {
  const schedule = {
    kind: 'weekly' as const,
    weekdays: ['SU'] as const,
    time: '02:30',
    timeZone: 'America/New_York',
  }
  assert.equal(
    latestDueOccurrence(schedule, '2026-03-14T12:00:00.000Z'),
    '2026-03-01T07:30:00.000Z',
  )
})
