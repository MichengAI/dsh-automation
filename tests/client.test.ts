import assert from 'node:assert/strict'
import test from 'node:test'
import { AutomationFormError, buildCreateInput, defaultFormState, deriveOverview, formatSchedule, formFromAutomation, insertSkillGesture, prettyModelName, skillGestureToken } from '../src/client/helpers.ts'
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
  const form = defaultFormState(new Date('2026-08-16T08:00:00+08:00'), workspaces, null, 'read-only')
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
    permissions: [],
    defaultPermission: 'read-only',
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
      if (endpoint === 'snapshot') return { ok: true, value: { scope: { cwd: 'D:\\work' }, permissions: [], defaultPermission: 'read-only', automations: [], runs: [], serverNow: '2026-08-16T01:00:00.000Z' } }
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
  await runtime.updateAutomation('a1', {
    name: 'n2',
    prompt: 'p2',
    schedule: { kind: 'daily', time: '10:00' },
    timeZone: 'Asia/Shanghai',
    permission: 'workspace-write',
    workspaceId: 'ws_1',
    cwd: 'D:\\work\\demo',
  })
  assert.deepEqual(calls, ['create', 'snapshot', 'update', 'snapshot'])
})

test('删除成功后即使刷新失败也要从列表里拿掉任务', async () => {
  const snapshot = {
    scope: { cwd: 'D:\\work' },
    permissions: [],
    defaultPermission: 'read-only',
    automations: [
      { id: 'keep', revision: 1, name: 'Keep', prompt: 'p', status: 'active', schedule: { kind: 'daily', time: '09:00' }, scheduleSummary: '', timeZone: 'Asia/Shanghai', permission: 'read-only', createdAt: '', updatedAt: '' },
      { id: 'gone', revision: 1, name: 'Gone', prompt: 'p', status: 'active', schedule: { kind: 'daily', time: '09:00' }, scheduleSummary: '', timeZone: 'Asia/Shanghai', permission: 'read-only', createdAt: '', updatedAt: '' },
    ],
    runs: [],
    serverNow: '2026-08-16T01:00:00.000Z',
  }
  let snapshots = 0
  const runtime = createAutomationRuntime({
    async call(_channel, endpoint) {
      if (endpoint === 'snapshot') {
        snapshots += 1
        if (snapshots === 1) return { ok: true, value: snapshot }
        throw new Error('Failed to fetch')
      }
      if (endpoint === 'mutate') return { ok: true, value: { id: 'gone', deleted: true } }
      throw new Error(`unexpected ${endpoint}`)
    },
  })
  await runtime.refresh()
  await runtime.mutateAutomation('gone', 'delete')
  const state = runtime.source.getSnapshot()
  assert.deepEqual(state.snapshot?.automations.map(item => item.id), ['keep'])
})

test('编辑表单会从已有任务还原名称、计划和模型', () => {
  const form = formFromAutomation({
    id: 'a1',
    revision: 2,
    name: '每日回归',
    prompt: '检查失败用例',
    status: 'active',
    schedule: { kind: 'weekly', time: '08:30', weekdays: [1, 3, 5] },
    scheduleSummary: '',
    timeZone: 'Asia/Shanghai',
    permission: 'workspace-write',
    workspaceId: 'ws_1',
    provider: 'deepseek',
    model: 'v4',
    createdAt: '2026-08-16T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z',
  }, workspaces, { provider: 'openai', providerLabel: 'OpenAI', model: 'gpt', label: 'GPT' })
  assert.equal(form.name, '每日回归')
  assert.equal(form.prompt, '检查失败用例')
  assert.equal(form.scheduleKind, 'weekly')
  assert.equal(form.time, '08:30')
  assert.deepEqual(form.weekdays, [1, 3, 5])
  assert.equal(form.permission, 'workspace-write')
  assert.equal(form.workspaceId, 'ws_1')
  assert.equal(form.modelKey, 'deepseek::v4')
})


test('模型名去掉供应商前缀，只保留展示名', () => {
  assert.equal(prettyModelName('deepseek-v4-pro'), 'DeepSeek-V4-Pro')
})

test('新建任务采用模型适配器声明的默认推理等级', () => {
  const model = {
    provider: 'deepseek-official',
    providerLabel: 'DeepSeek',
    model: 'deepseek-v4-pro',
    label: 'DeepSeek-V4-Pro',
    reasoning: {
      defaultEffort: 'high',
      efforts: [{ id: 'high', name: 'High' }],
    },
  }
  const form = defaultFormState(new Date('2026-08-16T08:00:00+08:00'), workspaces, model, 'read-only')
  assert.equal(form.modelKey, 'deepseek-official::deepseek-v4-pro')
  assert.equal(form.reasoningEffort, 'high')
})


test('编辑一次性任务允许保留已经过去的时间', () => {
  const form = {
    ...defaultFormState(new Date('2026-08-16T10:00:00+08:00'), workspaces, null, 'read-only'),
    name: '补跑',
    prompt: '继续处理',
    scheduleKind: 'once' as const,
    onceAt: '2026-08-16T09:00',
  }
  assert.throws(() => buildCreateInput(form, workspaces, [], new Date('2026-08-16T10:00:00+08:00')), AutomationFormError)
  const updated = buildCreateInput(form, workspaces, [], new Date('2026-08-16T10:00:00+08:00'), { allowPastOnce: true })
  assert.equal(updated.schedule.kind, 'once')
})

import { automationSessionTitle } from '../src/run-title.ts'

test('automation session title uses run time and task name', () => {
  const title = automationSessionTitle('自动执行-报表系统-生成部署', '2026-08-16T02:30:00.000Z')
  assert.ok(title.includes('自动执行-报表系统-生成部署'))
  assert.ok(title.includes('2026-08-16'))
})

test('技能点选写入 /name，已存在则不重复', () => {
  assert.equal(skillGestureToken({ id: 'daily-briefing', name: '每日早报' }), '/daily-briefing')
  assert.equal(skillGestureToken({ id: 'folder', name: 'web-search' }), '/web-search')
  const first = insertSkillGesture('检查失败', '/daily-briefing', 0)
  assert.equal(first.text, '/daily-briefing 检查失败')
  const again = insertSkillGesture(first.text, '/daily-briefing', first.caret)
  assert.equal(again.text, first.text)
  const mid = insertSkillGesture('请执行', '/web-search', 3)
  assert.equal(mid.text, '请执行 /web-search ')
})


