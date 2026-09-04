import assert from 'node:assert/strict'
import test from 'node:test'
import { AutomationFormError, buildCreateInput, defaultFormState, deriveOverview, formatSchedule, formFromAutomation, groupHistory, HISTORY_STATUS_OPTIONS, insertSkillGesture, prettyModelName, readSortDefault, skillGestureToken, sortAutomations, writeSortDefault } from '../src/client/helpers.ts'
import type { AutomationViewModel } from '../src/client/protocol.ts'
import { unwrapRpcResult } from '../src/client/protocol.ts'
import { createAutomationRuntime, installAutomationSessionSync, snapshotPollIntervalMs } from '../src/client/runtime.ts'

const t = (key: string, params?: Record<string, unknown>): string => {
  if (params?.count !== undefined) return `${key}:${params.count}`
  if (params?.time !== undefined) return `${key}:${params.time}`
  if (params?.days !== undefined) return `${key}:${params.days}`
  return key
}

const workspaces = [{ id: 'ws_1', title: 'demo', path: 'D:\\work\\demo' }]

function automationView(id: string, name: string, createdAt: string, nextRunAt?: string): AutomationViewModel {
  return {
    id,
    name,
    createdAt,
    ...(nextRunAt === undefined ? {} : { nextRunAt }),
    revision: 1,
    prompt: 'p',
    status: 'active',
    schedule: { kind: 'daily', time: '09:00' },
    scheduleSummary: 'daily',
    timeZone: 'Asia/Shanghai',
    permission: 'read-only',
    updatedAt: createdAt,
  }
}

test('任务排序支持创建时间/计划时间与正倒序', () => {
  const items = [
    automationView('a1', 'B', '2026-08-01T00:00:00.000Z', '2026-08-10T00:00:00.000Z'),
    automationView('a2', 'A', '2026-08-02T00:00:00.000Z', '2026-08-09T00:00:00.000Z'),
    automationView('a3', 'C', '2026-08-03T00:00:00.000Z'),
  ]
  assert.deepEqual(sortAutomations(items, 'created', 'desc').map(item => item.id), ['a3', 'a2', 'a1'])
  assert.deepEqual(sortAutomations(items, 'created', 'asc').map(item => item.id), ['a1', 'a2', 'a3'])
  assert.deepEqual(sortAutomations(items, 'planned', 'asc').map(item => item.id), ['a2', 'a1', 'a3'])
  assert.deepEqual(sortAutomations(items, 'planned', 'desc').map(item => item.id), ['a1', 'a2', 'a3'])
})

test('任务排序不修改原数组', () => {
  const items = [automationView('a1', 'A', '2026-08-01T00:00:00.000Z')]
  sortAutomations(items, 'created', 'desc')
  assert.equal(items.length, 1)
  assert.equal(items[0]?.id, 'a1')
})

test('默认排序偏好读写并拒绝损坏或非法值', () => {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
  assert.equal(readSortDefault(storage, 'key'), undefined)
  writeSortDefault(storage, 'key', 'planned', 'asc')
  assert.deepEqual(readSortDefault(storage, 'key'), { key: 'planned', direction: 'asc' })
  values.set('key', 'not-json')
  assert.equal(readSortDefault(storage, 'key'), undefined)
  values.set('key', JSON.stringify({ key: 'bogus', direction: 'asc' }))
  assert.equal(readSortDefault(storage, 'key'), undefined)
  values.set('key', JSON.stringify({ key: 'planned', direction: 'up' }))
  assert.equal(readSortDefault(storage, 'key'), undefined)
  assert.equal(readSortDefault(undefined, 'key'), undefined)
})

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

test('历史状态筛选覆盖 interrupted', () => {
  assert.deepEqual(HISTORY_STATUS_OPTIONS, [
    'succeeded', 'failed', 'interrupted', 'running', 'queued', 'skipped', 'cancelled',
  ])
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

test('有排队或执行中的任务时加快侧栏快照轮询', () => {
  assert.equal(snapshotPollIntervalMs([{ status: 'running' }]), 2_000)
  assert.equal(snapshotPollIntervalMs([{ status: 'queued' }]), 2_000)
  assert.equal(snapshotPollIntervalMs([{ status: 'succeeded' }]), 15_000)
  assert.equal(snapshotPollIntervalMs([]), 15_000)
})

test('多个客户端订阅共享一个初始刷新和轮询器', async () => {
  let snapshots = 0
  const runtime = createAutomationRuntime({
    async call(_channel, endpoint) {
      if (endpoint !== 'snapshot') throw new Error(`unexpected ${endpoint}`)
      snapshots += 1
      return { ok: true, value: { scope: { cwd: 'D:\\work' }, permissions: [], defaultPermission: 'read-only', automations: [], runs: [], serverNow: '2026-08-16T01:00:00.000Z' } }
    },
  })
  const stopA = runtime.source.subscribe(() => {})
  const stopB = runtime.source.subscribe(() => {})
  await new Promise(resolve => setTimeout(resolve, 0))
  stopA()
  stopB()
  assert.equal(snapshots, 1)
})

test('插件级同步桥在页面未挂载时仍刷新快照并同步 Host 会话列表', async () => {
  let snapshots = 0
  let hostRefreshes = 0
  const hostIds = new Set<string>()
  const runtime = createAutomationRuntime({
    async call(_channel, endpoint) {
      if (endpoint !== 'snapshot') throw new Error(`unexpected ${endpoint}`)
      snapshots += 1
      return {
        ok: true,
        value: {
          scope: { cwd: 'D:\\work' },
          permissions: [],
          defaultPermission: 'read-only',
          automations: [],
          runs: [{
            id: 'r1',
            automationId: 'a1',
            automationName: 'A',
            status: 'succeeded',
            trigger: 'schedule',
            scheduledFor: '2026-08-16T01:00:00.000Z',
            sessionId: 'dsh-automation-session-r1',
            unread: false,
          }],
          serverNow: '2026-08-16T01:00:00.000Z',
        },
      }
    },
  })
  const stop = installAutomationSessionSync(runtime, {
    list: { getSnapshot: () => ({ ids: [...hostIds], byId: {} }) },
    async refresh() {
      hostRefreshes += 1
      hostIds.add('dsh-automation-session-r1')
    },
  })

  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(snapshots, 1)
  assert.equal(hostRefreshes, 1)

  stop()
  await runtime.refresh()
  assert.equal(hostRefreshes, 1)
})

test('Host 会话同步合并重复请求，并在失败后的下一次快照发布时重试', async () => {
  type Listener = () => void
  const listeners = new Set<Listener>()
  const snapshot = {
    scope: { cwd: 'D:\\work' },
    permissions: [],
    defaultPermission: 'read-only',
    automations: [],
    runs: [{
      id: 'r1',
      automationId: 'a1',
      automationName: 'A',
      status: 'succeeded' as const,
      trigger: 'schedule' as const,
      scheduledFor: '2026-08-16T01:00:00.000Z',
      sessionId: 'dsh-automation-session-r1',
      unread: false,
    }],
    serverNow: '2026-08-16T01:00:00.000Z',
  }
  const runtime = {
    source: {
      getSnapshot: () => ({ phase: 'ready' as const, snapshot }),
      subscribe(listener: Listener) {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
  } as unknown as ReturnType<typeof createAutomationRuntime>
  let hostRefreshes = 0
  let warnings = 0
  const previousWarn = console.warn
  console.warn = () => { warnings += 1 }
  let stop = (): void => undefined
  try {
    stop = installAutomationSessionSync(runtime, {
      list: { getSnapshot: () => ({ ids: [], byId: {} }) },
      async refresh() {
        hostRefreshes += 1
        if (hostRefreshes === 1) throw new Error('temporary failure')
      },
    })

    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(hostRefreshes, 1)
    assert.equal(warnings, 1)
    for (const listener of [...listeners]) listener()
    for (const listener of [...listeners]) listener()
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(hostRefreshes, 2)

    for (const listener of [...listeners]) listener()
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(hostRefreshes, 2)
  } finally {
    stop()
    console.warn = previousWarn
  }
  assert.equal(listeners.size, 0)
})

test('页面恢复焦点或可见时立即刷新执行记录', async () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const page = new EventTarget()
  const documentTarget = new EventTarget() as EventTarget & { visibilityState: string }
  Object.defineProperty(documentTarget, 'visibilityState', { configurable: true, writable: true, value: 'hidden' })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: page })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentTarget })

  let stop = (): void => undefined
  try {
    let snapshots = 0
    const runtime = createAutomationRuntime({
      async call(_channel, endpoint) {
        if (endpoint !== 'snapshot') throw new Error(`unexpected ${endpoint}`)
        snapshots += 1
        return { ok: true, value: { scope: { cwd: 'D:\\work' }, permissions: [], defaultPermission: 'read-only', automations: [], runs: [], serverNow: '2026-08-16T01:00:00.000Z' } }
      },
    })
    stop = runtime.source.subscribe(() => {})
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(snapshots, 1)

    page.dispatchEvent(new Event('focus'))
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(snapshots, 2)

    documentTarget.dispatchEvent(new Event('visibilitychange'))
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(snapshots, 2)

    documentTarget.visibilityState = 'visible'
    documentTarget.dispatchEvent(new Event('visibilitychange'))
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(snapshots, 3)

    stop()
    page.dispatchEvent(new Event('focus'))
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(snapshots, 3)
  } finally {
    stop()
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window
    else Object.defineProperty(globalThis, 'window', previousWindow)
    if (previousDocument === undefined) delete (globalThis as { document?: unknown }).document
    else Object.defineProperty(globalThis, 'document', previousDocument)
  }
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
  assert.equal(form.timeZone, 'Asia/Shanghai')
})

test('编辑间隔任务会保留原始时区和 anchor', () => {
  const anchor = '2026-08-16T00:00:00.000Z'
  const form = formFromAutomation({
    id: 'interval-1',
    revision: 3,
    name: '间隔检查',
    prompt: '检查状态',
    status: 'active',
    schedule: { kind: 'interval', everyMinutes: 30, anchor, timeZone: 'America/New_York' },
    scheduleSummary: '',
    timeZone: 'America/New_York',
    permission: 'read-only',
    workspaceId: 'ws_1',
    createdAt: '2026-08-16T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z',
  }, workspaces, null, 'read-only')

  const updated = buildCreateInput(form, workspaces, [], new Date('2026-08-20T00:00:00.000Z'), { allowPastOnce: true })
  assert.equal(updated.timeZone, 'America/New_York')
  assert.deepEqual(updated.schedule, {
    kind: 'interval',
    everyMinutes: 30,
    anchor,
    timeZone: 'America/New_York',
  })
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
  const previous = process.env.TZ
  process.env.TZ = 'Asia/Shanghai'
  try {
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
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})

test('UTC+ 时区的周分组使用本地周一而不是前一天 UTC 日期', () => {
  const previous = process.env.TZ
  process.env.TZ = 'Asia/Shanghai'
  try {
    const groups = groupHistory([{
      id: 'r-week', automationId: 'a1', automationName: 'A', status: 'succeeded', trigger: 'schedule',
      scheduledFor: '2026-08-16T16:30:00.000Z', unread: false,
    }], 'week', new Date('2026-08-23T00:00:00+08:00'), t)
    assert.equal(groups[0]?.key, '2026-08-17')
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})

import { automationSessionTitle } from '../src/run-title.ts'

test('运行标题 fallback 在调用时读取当前宿主时区', () => {
  const previous = process.env.TZ
  try {
    process.env.TZ = 'UTC'
    assert.equal(automationSessionTitle('任务', '2026-08-16T02:30:00.000Z'), '2026-08-16 02:30 - 任务')
    process.env.TZ = 'America/Los_Angeles'
    assert.equal(automationSessionTitle('任务', '2026-08-16T02:30:00.000Z'), '2026-08-15 19:30 - 任务')
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})

test('自动化会话标题按计划时区显示运行时间和任务名', () => {
  const title = automationSessionTitle(
    '自动执行-报表系统-生成部署',
    '2026-08-16T01:30:00.000Z',
    'Asia/Shanghai',
  )
  assert.ok(title.includes('自动执行-报表系统-生成部署'))
  assert.ok(title.includes('2026-08-16 09:30'))
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
