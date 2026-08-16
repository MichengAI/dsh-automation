import assert from 'node:assert/strict'
import test from 'node:test'
import { AutomationFormError, buildCreateInput, defaultFormState, deriveOverview, formatSchedule } from '../src/client/helpers.ts'
import { unwrapRpcResult } from '../src/client/protocol.ts'
import { createAutomationRuntime } from '../src/client/runtime.ts'

const t = (key: string, params?: Record<string, unknown>): string => {
  if (params?.count !== undefined) return `${key}:${params.count}`
  if (params?.time !== undefined) return `${key}:${params.time}`
  if (params?.days !== undefined) return `${key}:${params.days}`
  return key
}

const workspaces = [{ id: 'ws_1', title: 'demo', path: 'D:\\work\\demo' }]

test('表单会拒绝空白任务和过去的一次性时间', () => {
  const form = defaultFormState(new Date('2026-08-16T08:00:00+08:00'), workspaces)
  assert.throws(() => buildCreateInput(form, workspaces, [], new Date('2026-08-16T08:00:00+08:00')), AutomationFormError)
  const valid = buildCreateInput({
    ...form,
    name: '检查',
    prompt: '跑测试',
  }, workspaces, [], new Date('2026-08-16T08:00:00+08:00'))
  assert.equal(valid.schedule.kind, 'daily')
  assert.equal(valid.workspaceId, 'ws_1')
})

test('总览统计会统计未读失败并给出最近下次运行', () => {
  const overview = deriveOverview({
    scope: { cwd: 'D:\\work' },
    serverNow: '2026-08-16T01:00:00.000Z',
    automations: [
      { id: 'a1', revision: 1, name: 'A', prompt: 'p', status: 'active', schedule: { kind: 'daily', time: '09:00' }, scheduleSummary: '', timeZone: 'Asia/Shanghai', permission: 'read-only', nextRunAt: '2026-08-16T02:00:00.000Z', createdAt: '', updatedAt: '' },
      { id: 'a2', revision: 1, name: 'B', prompt: 'p', status: 'paused', schedule: { kind: 'once', at: '2026-08-20T00:00:00.000Z' }, scheduleSummary: '', timeZone: 'UTC', permission: 'read-only', createdAt: '', updatedAt: '' },
    ],
    runs: [
      { id: 'r1', automationId: 'a1', automationName: 'A', status: 'failed', trigger: 'schedule', scheduledFor: '2026-08-16T00:00:00.000Z', unread: true },
    ],
  })
  assert.equal(overview.total, 2)
  assert.equal(overview.active, 1)
  assert.equal(overview.attention, 1)
  assert.equal(overview.nextRunAt, '2026-08-16T02:00:00.000Z')
  assert.match(formatSchedule({ kind: 'daily', time: '09:00' }, t), /dailyAt/)
})

test('RPC 结果必须失败关闭，运行时会在变更后刷新快照', async () => {
  assert.throws(() => unwrapRpcResult({}), /无效响应/)
  const calls: string[] = []
  const runtime = createAutomationRuntime({
    async call(_channel, endpoint) {
      calls.push(endpoint)
      if (endpoint === 'snapshot') return { ok: true, value: { scope: { cwd: 'D:\\work' }, automations: [], runs: [], serverNow: '2026-08-16T01:00:00.000Z' } }
      return { ok: true, value: { id: 'ok' } }
    },
  })
  await runtime.createAutomation({
    name: 'n',
    prompt: 'p',
    schedule: { kind: 'daily', time: '09:00' },
    timeZone: 'Asia/Shanghai',
    permission: 'read-only',
    workspaceId: 'ws_1',
    cwd: 'D:\\work\\demo',
  })
  assert.deepEqual(calls, ['create', 'snapshot'])
  assert.equal(runtime.source.getSnapshot().phase, 'ready')
})
