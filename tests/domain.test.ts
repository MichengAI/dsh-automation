import assert from 'node:assert/strict'
import test from 'node:test'
import {
  automationDefinitionSchema,
  createDefinition,
  createManualRun,
  createScheduledRun,
  occurrenceKey,
  pauseDefinition,
  updateDefinition,
} from '../src/domain.ts'

function baseInput() {
  return {
    id: 'automation_1',
    name: '每日检查',
    prompt: '检查测试并报告结果。',
    schedule: { kind: 'daily' as const, time: '09:00', timeZone: 'Asia/Shanghai' },
    workspaceId: 'ws_1',
    cwd: 'D:\\work\\demo',
    agentPreset: 'standard',
    createdBy: { kind: 'web' as const, sessionId: 'session_1' },
    now: '2026-08-16T01:00:00.000Z',
  }
}

test('创建定义会规范化计划、生成 RRULE，并默认只读', () => {
  const definition = createDefinition(baseInput())
  assert.equal(definition.revision, 1)
  assert.equal(definition.permissionPreset, 'read-only')
  assert.match(definition.rrule, /FREQ=DAILY/)
  assert.equal(definition.timeZone, 'Asia/Shanghai')
})

test('更新定义会增加 revision', () => {
  const current = createDefinition(baseInput())
  const next = updateDefinition(current, {
    prompt: '新的独立任务说明',
    now: '2026-08-16T01:05:00.000Z',
  })
  assert.equal(next.revision, 2)
  assert.equal(next.prompt, '新的独立任务说明')
  assert.equal(current.prompt, '检查测试并报告结果。')
})

test('暂停会提升 revision；计划 occurrence 使用确定性 run id', () => {
  const definition = pauseDefinition(createDefinition(baseInput()), '2026-08-16T01:10:00.000Z')
  assert.equal(definition.status, 'paused')
  assert.equal(definition.revision, 2)
  const scheduledFor = '2026-08-16T01:00:00.000Z'
  const run = createScheduledRun(createDefinition(baseInput()), scheduledFor)
  assert.equal(run.status, 'queued')
  assert.equal(run.occurrenceKey, occurrenceKey(run.automationId, run.definitionRevision, scheduledFor))
  assert.equal(createManualRun(createDefinition(baseInput()), scheduledFor, 'nonce-1').trigger, 'manual')
})

test('空名称或无效时区会被拒绝', () => {
  assert.throws(() => createDefinition({ ...baseInput(), name: '  ' }), /name/)
  assert.throws(() => createDefinition({
    ...baseInput(),
    schedule: { kind: 'daily', time: '09:00', timeZone: 'Not/AZone' },
  }))
})


test('并发数量兼容旧定义、持久化更新，并拒绝无效上限', () => {
  const initial = createDefinition(baseInput())
  assert.equal(initial.maxConcurrentRuns, 1)
  const { maxConcurrentRuns: _, ...legacy } = initial
  assert.equal(automationDefinitionSchema.parse(legacy).maxConcurrentRuns, 1)
  const updated = updateDefinition(initial, { maxConcurrentRuns: 3, now: baseInput().now })
  assert.equal(automationDefinitionSchema.parse(JSON.parse(JSON.stringify(updated))).maxConcurrentRuns, 3)
  assert.equal(updateDefinition(updated, { name: '新名称', now: baseInput().now }).maxConcurrentRuns, 3)
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => createDefinition({ ...baseInput(), maxConcurrentRuns: value }))
    assert.throws(() => updateDefinition(initial, { maxConcurrentRuns: value, now: baseInput().now }))
  }
})

test('间隔定义接受一分钟并拒绝不足一分钟', () => {
  const schedule = { kind: 'interval' as const, everyMinutes: 1, anchor: baseInput().now, timeZone: 'UTC' }
  assert.equal(createDefinition({ ...baseInput(), schedule }).schedule.kind, 'interval')
  for (const everyMinutes of [0, -1, 0.5]) {
    assert.throws(() => createDefinition({ ...baseInput(), schedule: { ...schedule, everyMinutes } }))
  }
})
