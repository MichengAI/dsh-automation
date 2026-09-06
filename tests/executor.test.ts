import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefinition, createScheduledRun } from '../src/domain.ts'
import { applyUnattendedPermission, executeAutomationRun, pinAutomationSessionTitle, readSessionEvents, settlesWithin, summarizeRun, type SessionEventLike } from '../src/executor.ts'

for (const permission of ['read-only', 'workspace-write', 'danger-full-access', 'host-custom']) {
  test(`无人值守应用 Host 预设 ${permission} 后禁用审批`, () => {
    const events: { type: string; data: unknown }[] = []
    const session = {
      append(type: string, data: unknown) { events.push({ type, data }) },
    }
    applyUnattendedPermission({
      names: [permission],
      defaultPreset: permission,
      optionOf: value => ({ value, name: value }),
      set: (target, value) => {
        assert.equal(target, session)
        assert.equal(value, permission)
        session.append('host/preset', { value })
        session.append('approval/policy', { policy: 'ask' })
      },
    }, session, permission)
    assert.deepEqual(events, [
      { type: 'host/preset', data: { value: permission } },
      { type: 'approval/policy', data: { policy: 'ask' } },
      { type: 'approval/policy', data: { policy: 'never' } },
    ])
  })
}

for (const hostDenies of [false, true]) {
  test(`执行器对后台 shell 和扩展工具遵循 Host ${hostDenies ? '拒绝' : '允许'}结果`, async () => {
    const definition = createDefinition({
      id: 'automation_permissions', name: '权限检查', prompt: '执行权限检查。',
      schedule: { kind: 'daily', time: '09:00', timeZone: 'Asia/Shanghai' },
      workspaceId: 'ws_1', cwd: 'D:\\work\\demo', agentPreset: 'standard',
      permissionPreset: 'danger-full-access',
      createdBy: { kind: 'web', sessionId: 'source' }, now: '2026-09-06T00:00:00.000Z',
    })
    const run = createScheduledRun(definition, '2026-09-06T01:00:00.000Z')
    const events: SessionEventLike[] = []
    const session = {
      get seq() { return events.length },
      snapshotEvents: () => events,
      append(type: string, data: Record<string, unknown>) { events.push({ seq: events.length, type, data }) },
    }
    type Call = { name: string; arguments: Record<string, unknown> }
    const guards: ((call: Call) => string | undefined)[] = [() => hostDenies ? 'Host denied' : undefined]
    const calls: Call[] = ['bash', 'pwsh', 'im_send', 'automation_create', 'new_plugin_tool']
      .map(name => ({ name, arguments: { run_in_background: true } }))
    const decisions: (string | undefined)[] = []
    let disposed = false
    let appliedPreset: string | undefined
    const agent = {
      session,
      async whenIdle() {},
      followup() {
        assert.equal(appliedPreset, definition.permissionPreset)
        assert.deepEqual(events.at(-1)?.data, { policy: 'never' })
        for (const call of calls) decisions.push(guards.map(guard => guard(call)).find(reason => reason !== undefined))
        session.append('turn/start', {})
        session.append('turn/end', { reason: { kind: 'completed' } })
      },
    }
    const agentCtx = { agent, tools: { guard(callback: (call: Call) => string | undefined) { guards.push(callback) } } }
    const ctx = {
      workspaceRegistry: { get: () => ({ path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }) },
      agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
      agentPresets: { mount: async () => {} },
      permissionPresets: { set(target: unknown, preset: string) { assert.equal(target, session); appliedPreset = preset } },
      agents: {
        withoutInitiator: (callback: () => unknown) => callback(),
        async create(options: { setup: (ctx: unknown) => Promise<void> }) {
          await options.setup(agentCtx)
          return { agent, async dispose() { disposed = true } }
        },
      },
      sessions: { flush: async () => {} },
      get: () => undefined,
    }
    const result = await executeAutomationRun(ctx as never, definition, run, { sessionId: 'automation_run', runTimeoutMs: 1_000 })
    assert.equal(result.status, 'succeeded')
    assert.deepEqual(decisions, calls.map(() => hostDenies ? 'Host denied' : undefined))
    assert.equal(disposed, true)
  })
}

test('取消收敛等待有独立硬超时', async () => {
  assert.equal(await settlesWithin(Promise.resolve(), 10), true)
  assert.equal(await settlesWithin(new Promise(() => {}), 5), false)
})

test('运行摘要只取本 run 区间内的最后一条助手文本和 turn 结束原因', () => {
  const result = summarizeRun([
    { seq: 1, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '旧内容' }] } } },
    { seq: 2, type: 'turn/start', data: {} },
    { seq: 3, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '新结果' }] } } },
    { seq: 4, type: 'turn/end', data: { reason: { kind: 'completed' } } },
  ], 2)
  assert.equal(result.text, '新结果')
  assert.equal(result.reason?.kind, 'completed')
})

test('会话事件优先使用新版 snapshotEvents，并兼容旧版 events', () => {
  const current = [{ seq: 2, type: 'turn/start', data: {} }]
  const legacy = [{ seq: 1, type: 'user/message', data: {} }]
  assert.deepEqual(readSessionEvents({
    snapshotEvents: () => current,
    events: legacy,
  }), current)
  assert.deepEqual(readSessionEvents({ events: legacy }), legacy)
})

test('未注入 sessionTitle 时不能让整次执行失败', () => {
  const warnings: string[] = []
  const ctx = {
    get(name: string) {
      if (name === 'sessionTitle') return undefined
      return undefined
    },
    get sessionTitle() {
      throw new Error('cannot get property "sessionTitle" without inject')
    },
    logger: { warn(message: string) { warnings.push(message) } },
  } as never
  pinAutomationSessionTitle(ctx, {}, '2026-08-17 00:36 - 每日回归检查')
  assert.deepEqual(warnings, [])
})

test('sessionTitle.rename 失败只记日志，不抛出', () => {
  const warnings: string[] = []
  const ctx = {
    get() {
      return {
        rename() { throw new Error('rename rejected') },
      }
    },
    logger: { warn(message: string) { warnings.push(message) } },
  } as never
  pinAutomationSessionTitle(ctx, {}, 'title')
  assert.equal(warnings.length, 1)
  assert.match(warnings[0] ?? '', /rename rejected/)
})

