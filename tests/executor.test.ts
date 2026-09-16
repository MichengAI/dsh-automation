import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefinition, createScheduledRun } from '../src/domain.ts'
import { applyUnattendedPermission, executeAutomationRun, hasAutomationSource, pinAutomationSessionTitle, readSessionEvents, settlesWithin, summarizeCollectedRun, summarizeRun, watchSessionEvents, type SessionEventLike } from '../src/executor.ts'

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

for (const [hostDenies, setupApi] of [[false, 'legacy'], [true, 'legacy'], [false, 'explicit'], [true, 'explicit']] as const) {
  test(`${setupApi} 创建接口对后台 shell 和扩展工具遵循 Host ${hostDenies ? '拒绝' : '允许'}结果`, async () => {
    const definition = createDefinition({
      id: 'automation_permissions', name: '权限检查', prompt: '执行权限检查。',
      schedule: { kind: 'daily', time: '09:00', timeZone: 'Asia/Shanghai' },
      workspaceId: 'ws_1', cwd: 'D:\\work\\demo', agentPreset: 'standard',
      permissionPreset: 'danger-full-access',
      createdBy: { kind: 'web', sessionId: 'source' }, now: '2026-09-06T00:00:00.000Z',
    })
    const run = createScheduledRun(definition, '2026-09-06T01:00:00.000Z')
    const events: SessionEventLike[] = []
    const listeners: Array<(session: unknown, event: SessionEventLike) => void> = []
    const session = {
      get seq() { return events.length },
      snapshotEvents() { throw new Error('生产路径不应再读 snapshotEvents') },
      append(type: string, data: Record<string, unknown>) {
        const event = { seq: events.length, type, data }
        events.push(event)
        for (const listener of listeners) listener(session, event)
      },
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
    const agentCtx = {
      get agent() {
        if (setupApi === 'explicit') throw new Error('新版 Host 不允许读取 ctx.agent')
        return agent
      },
      tools: { guard(callback: (call: Call) => string | undefined) { guards.push(callback) } },
    }
    const ctx = {
      workspaceRegistry: { get: () => ({ path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }) },
      agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
      agentPresets: { mount: async () => {} },
      permissionPresets: { set(target: unknown, preset: string) { assert.equal(target, session); appliedPreset = preset } },
      agents: {
        withoutInitiator: (callback: () => unknown) => callback(),
        async create(options: { setup: (ctx: unknown, agent?: unknown) => Promise<void> }) {
          await options.setup(agentCtx, setupApi === 'explicit' ? agent : undefined)
          return { agent, async dispose() { disposed = true } }
        },
      },
      sessions: { flush: async () => {} },
      get: () => undefined,
      on(name: string, listener: (session: unknown, event: SessionEventLike) => void) {
        if (name !== 'session/event') return () => {}
        listeners.push(listener)
        return () => {
          const index = listeners.indexOf(listener)
          if (index >= 0) listeners.splice(index, 1)
        }
      },
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

test('有 session/event 增量时摘要不读 snapshotEvents', () => {
  const session = { id: 'live' }
  const watched = watchSessionEvents({
    on(name, listener) {
      assert.equal(name, 'session/event')
      listener(session, { seq: 1, type: 'turn/start', data: {} })
      listener({ id: 'other' }, { seq: 9, type: 'turn/end', data: { reason: { kind: 'error' } } })
      listener(session, { seq: 2, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '增量摘要' }] } } })
      listener(session, { seq: 3, type: 'turn/end', data: { reason: { kind: 'completed' } } })
      return () => {}
    },
  }, session, 1)
  let read = 0
  const result = summarizeCollectedRun(watched.events, {
    snapshotEvents() {
      read += 1
      throw new Error('完整增量不应回退 snapshotEvents')
    },
  }, 1)
  watched.stop()
  assert.equal(read, 0)
  assert.equal(result.text, '增量摘要')
  assert.equal(result.reason?.kind, 'completed')
})

test('增量只有无关事件时回退 snapshotEvents', () => {
  const result = summarizeCollectedRun(
    [{ seq: 1, type: 'request/header', data: {} }],
    {
      snapshotEvents: () => [
        { seq: 1, type: 'request/header', data: {} },
        { seq: 2, type: 'turn/start', data: {} },
        { seq: 3, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '快照摘要' }] } } },
        { seq: 4, type: 'turn/end', data: { reason: { kind: 'completed' } } },
      ],
    },
    1,
  )
  assert.equal(result.text, '快照摘要')
  assert.equal(result.reason?.kind, 'completed')
})

test('订阅了 session/event 但没有增量时回退 snapshotEvents', () => {
  const watched = watchSessionEvents({
    on(name) {
      assert.equal(name, 'session/event')
      return () => {}
    },
  }, { id: 'silent' }, 1)
  const result = summarizeCollectedRun(watched.events, {
    snapshotEvents: () => [
      { seq: 1, type: 'turn/start', data: {} },
      { seq: 2, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '静默回退' }] } } },
      { seq: 3, type: 'turn/end', data: { reason: { kind: 'completed' } } },
    ],
  }, 1)
  watched.stop()
  assert.equal(result.text, '静默回退')
  assert.equal(result.reason?.kind, 'completed')
})

test('归属识别优先 deriveMessages，存在投影时不读 snapshotEvents', () => {
  assert.equal(hasAutomationSource({
    deriveMessages: () => [{ source: { kind: 'automation' } }],
    snapshotEvents: () => { throw new Error('deprecated') },
  }), true)
  assert.equal(hasAutomationSource({
    deriveMessages: () => [{ source: { kind: 'user' } }],
    snapshotEvents: () => [{ seq: 1, type: 'user/message', data: { source: { kind: 'automation' } } }],
  }), false)
  assert.equal(hasAutomationSource([
    { seq: 1, type: 'user/message', data: { source: { kind: 'automation' } } },
  ]), true)
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
