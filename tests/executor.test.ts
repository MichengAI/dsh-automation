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

for (const hostDenies of [false, true]) {
  test(`创建接口对后台 shell 和扩展工具遵循 Host ${hostDenies ? '拒绝' : '允许'}结果`, async () => {
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
        throw new Error('新版 Host 不允许读取 ctx.agent')
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
          await options.setup(agentCtx, agent)
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

test('会话事件只从 snapshotEvents 读取', () => {
  const current = [{ seq: 2, type: 'turn/start', data: {} }]
  assert.deepEqual(readSessionEvents({ snapshotEvents: () => current }), current)
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

test('增量订阅只保留摘要需要的 turn 边界事件', () => {
  const session = { id: 'live' }
  const watched = watchSessionEvents({
    on(_name, listener) {
      listener(session, { seq: 1, type: 'request/header', data: { prompt: 'secret' } })
      listener(session, { seq: 2, type: 'tool/result', data: { output: 'huge' } })
      listener(session, { seq: 3, type: 'turn/start', data: {} })
      listener(session, { seq: 4, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '摘要' }] } } })
      listener(session, { seq: 5, type: 'turn/end', data: { reason: { kind: 'completed' } } })
      return () => {}
    },
  }, session, 1)
  assert.deepEqual(watched.events.map(event => event.type), ['turn/start', 'assistant/message', 'turn/end'])
  watched.stop()
})

test('执行器把任务配置的推理档位写入 AgentOptions', async () => {
  const definition = createDefinition({
    id: 'automation_effort', name: '档位检查', prompt: '检查推理档位。',
    schedule: { kind: 'daily', time: '09:00', timeZone: 'Asia/Shanghai' },
    workspaceId: 'ws_1', cwd: 'D:\\work\\demo', agentPreset: 'standard',
    provider: 'magpie-responses', model: 'codex/gpt-6-luna', reasoningEffort: 'max',
    permissionPreset: 'danger-full-access',
    createdBy: { kind: 'web', sessionId: 'source' }, now: '2026-09-06T00:00:00.000Z',
  })
  const run = createScheduledRun(definition, '2026-09-06T01:00:00.000Z')
  assert.equal(run.targetSnapshot.reasoningEffort, 'max')

  const events: SessionEventLike[] = []
  const listeners: Array<(session: unknown, event: SessionEventLike) => void> = []
  const session = {
    get seq() { return events.length },
    append(type: string, data: Record<string, unknown>) {
      const event = { seq: events.length, type, data }
      events.push(event)
      for (const listener of listeners) listener(session, event)
    },
  }
  const agent = {
    session,
    async whenIdle() {},
    followup() {
      session.append('turn/start', {})
      session.append('turn/end', { reason: { kind: 'completed' } })
    },
    cancel() {},
  }
  let captured: Record<string, unknown> | undefined
  const ctx = {
    workspaceRegistry: { get: () => ({ path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'fallback', model: 'fallback' }) },
    agentPresets: { mount: async () => {} },
    permissionPresets: { set() {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create(options: { agentOptions: Record<string, unknown>; setup: (ctx: unknown, agent?: unknown) => Promise<void> }) {
        captured = options.agentOptions
        await options.setup({}, agent)
        return { agent, async dispose() {} }
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
  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 'automation_effort',
    runTimeoutMs: 1_000,
  })
  assert.equal(result.status, 'succeeded')
  assert.deepEqual(captured, {
    provider: 'magpie-responses',
    model: 'codex/gpt-6-luna',
    reasoningEffort: 'max',
  })
})

function sampleRun() {
  const definition = createDefinition({
    id: 'automation_unload', name: '卸载检查', prompt: '检查卸载。',
    schedule: { kind: 'daily', time: '09:00', timeZone: 'Asia/Shanghai' },
    workspaceId: 'ws_1', cwd: 'D:\\work\\demo', agentPreset: 'standard',
    permissionPreset: 'read-only',
    createdBy: { kind: 'web', sessionId: 'source' }, now: '2026-09-06T00:00:00.000Z',
  })
  return { definition, run: createScheduledRun(definition, '2026-09-06T01:00:00.000Z') }
}

function executorStub(on: () => never) {
  const session = { get seq() { return 0 } }
  const agent = {
    session,
    async whenIdle() {},
    followup() { throw new Error('卸载后不应再 followup') },
    cancel() {},
  }
  let disposed = false
  return {
    get disposed() { return disposed },
    ctx: {
      workspaceRegistry: { get: () => ({ path: 'D:\\work\\demo', status: async () => 'ok', attachSession: async () => {} }) },
      agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
      agentPresets: { mount: async () => {} },
      permissionPresets: { set() {} },
      agents: {
        withoutInitiator: (callback: () => unknown) => callback(),
        async create() { return { agent, async dispose() { disposed = true } } },
      },
      sessions: { flush: async () => {} },
      get: () => undefined,
      on,
    },
  }
}

test('插件 fiber 卸载时 ctx.on 抛 INACTIVE_EFFECT 记为 cancelled', async () => {
  const { definition, run } = sampleRun()
  const stub = executorStub(() => {
    throw Object.assign(new Error('cannot create effect on inactive context'), { code: 'INACTIVE_EFFECT' })
  })
  const result = await executeAutomationRun(stub.ctx as never, definition, run, {
    sessionId: 'automation_unload',
    runTimeoutMs: 1_000,
  })
  assert.equal(result.status, 'cancelled')
  assert.equal(result.error?.code, 'cancelled')
  assert.equal(stub.disposed, true)
})

test('已 abort 时中段抛错也记为 cancelled', async () => {
  const { definition, run } = sampleRun()
  const abort = new AbortController()
  const stub = executorStub(() => {
    throw new Error('fiber already gone')
  })
  const originalCreate = stub.ctx.agents.create
  stub.ctx.agents.create = async () => {
    abort.abort()
    return originalCreate()
  }
  const result = await executeAutomationRun(stub.ctx as never, definition, run, {
    sessionId: 'automation_aborted',
    runTimeoutMs: 1_000,
    signal: abort.signal,
  })
  assert.equal(result.status, 'cancelled')
  assert.equal(result.error?.code, 'cancelled')
})

test('执行器其他异常仍记为 executor_error', async () => {
  const { definition, run } = sampleRun()
  const stub = executorStub(() => {
    throw new Error('watch failed')
  })
  const result = await executeAutomationRun(stub.ctx as never, definition, run, {
    sessionId: 'automation_error',
    runTimeoutMs: 1_000,
  })
  assert.equal(result.status, 'failed')
  assert.equal(result.error?.code, 'executor_error')
  assert.match(result.error?.message ?? '', /watch failed/)
})

test('sessionMode 为 reuse 时首次创建会话不会在运行结束时被 dispose', async () => {
  const { definition: baseDef, run: baseRun } = sampleRun()
  const definition = { ...baseDef, sessionMode: 'reuse' as const }
  const run = { ...baseRun, targetSnapshot: { ...baseRun.targetSnapshot, sessionMode: 'reuse' as const } }
  let disposed = false
  const listeners: any[] = []
  const events: any[] = []
  const session = {
    get seq() { return events.length },
    append(type: string, data: any) {
      const evt = { seq: events.length, type, data }
      events.push(evt)
      for (const l of listeners) l(session, evt)
    },
  }
  const agent = {
    session,
    async whenIdle() {},
    followup() {
      session.append('turn/start', {})
      session.append('turn/end', { reason: { kind: 'completed' } })
    },
    cancel() {},
  }
  const ctx = {
    workspaceRegistry: { get: () => ({ path: 'D:\\work\\demo', status: async () => 'ok', attachSession: async () => {} }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    agentPresets: { mount: async () => {} },
    permissionPresets: { set() {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create(options: any) {
        await options?.setup?.(ctx, agent)
        return {
          agent,
          async dispose() {
            disposed = true
          },
        }
      },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on(name: string, listener: any) {
      if (name === 'session/event') listeners.push(listener)
      return () => {}
    },
  }
  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 'automation_reuse_first',
    runTimeoutMs: 1_000,
  })
  assert.equal(result.status, 'succeeded')
  assert.equal(disposed, false, '复用模式下新创建的专属会话不应被 dispose')
})

test('sessionMode 为 reuse 且传入已有 agent 时直接复用并不重新建会话与标题', async () => {
  const { definition: baseDef, run: baseRun } = sampleRun()
  const definition = { ...baseDef, sessionMode: 'reuse' as const, activeSessionId: 'existing_session' }
  const run = { ...baseRun, targetSnapshot: { ...baseRun.targetSnapshot, sessionMode: 'reuse' as const } }
  const events: any[] = []
  const listeners: any[] = []
  const existingSession = {
    id: 'existing_session',
    get seq() { return events.length },
    append(type: string, data: any) {
      const evt = { seq: events.length, type, data }
      events.push(evt)
      for (const l of listeners) l(existingSession, evt)
    },
  }
  let followupCalled = false
  let createCalled = false
  let renamed = false
  const existingAgent = {
    session: existingSession,
    async whenIdle() {},
    followup(msg: any) {
      followupCalled = true
      assert.equal(msg.source?.kind, 'automation')
      assert.equal(msg.source?.automationId, definition.id)
      existingSession.append('turn/start', {})
      existingSession.append('assistant/message', { message: { content: [{ type: 'text', text: '复用会话产出' }] } })
      existingSession.append('turn/end', { reason: { kind: 'completed' } })
    },
  }
  const ctx = {
    workspaceRegistry: { get: () => ({ path: 'D:\\work\\demo', status: async () => 'ok', attachSession: async () => {} }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    agentPresets: { mount: async () => {} },
    permissionPresets: { set() {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create() {
        createCalled = true
        throw new Error('不应调用 create')
      },
    },
    sessions: { flush: async () => {} },
    get: (name: string) => {
      if (name === 'sessionTitle') {
        return {
          rename() { renamed = true },
        }
      }
      return undefined
    },
    on(name: string, listener: any) {
      if (name === 'session/event') listeners.push(listener)
      return () => {}
    },
  }
  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 'existing_session',
    runTimeoutMs: 1_000,
    reusedAgent: existingAgent,
  })
  assert.equal(result.status, 'succeeded')
  assert.equal(result.summary, '复用会话产出')
  assert.equal(createCalled, false, '复用会话时不应调用 agents.create')
  assert.equal(followupCalled, true, '应调用 existingAgent.followup 开启新一轮')
  assert.equal(renamed, false, '复用已有会话时不应覆写其原始标题')
})

test('复用已有 liveAgent 时必须重新应用权限预设并同步 model.select', async () => {
  const definition = createDefinition({
    id: 'def_perm_test',
    name: '权限收窄测试',
    prompt: '只读任务',
    schedule: { kind: 'daily', time: '09:00', timeZone: 'Asia/Shanghai' },
    workspaceId: 'ws_demo',
    cwd: 'D:\\work\\demo',
    agentPreset: 'standard',
    permissionPreset: 'read-only',
    sessionMode: 'reuse',
    provider: 'deepseek',
    model: 'v3',
    reasoningEffort: 'low',
    createdBy: { kind: 'web', sessionId: 'src' },
    now: '2026-04-01T00:00:00Z',
  })
  const run = createScheduledRun(definition, '2026-04-01T09:00:00Z')
  const events: any[] = []
  const listeners: any[] = []
  const existingSession = {
    id: 's_reuse',
    get seq() { return events.length },
    append(type: string, data: any) {
      const evt = { seq: events.length, type, data }
      events.push(evt)
      for (const l of listeners) l(existingSession, evt)
    },
  }
  let permissionApplied = false
  let modelSelected: any = null
  const existingAgent = {
    session: existingSession,
    model: {
      select(selection: any) {
        modelSelected = selection
      },
    },
    async whenIdle() {},
    followup() {
      existingSession.append('turn/start', {})
      existingSession.append('turn/end', { reason: { kind: 'completed' } })
    },
  }
  const ctx = {
    workspaceRegistry: { get: () => ({ path: 'D:\\work\\demo', status: async () => 'ok', attachSession: async () => {} }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    agentPresets: { mount: async () => {} },
    permissionPresets: {
      set(session: any, preset: string) {
        if (preset === 'read-only') permissionApplied = true
      },
    },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create() { throw new Error('不应调用 create') },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on(name: string, listener: any) {
      if (name === 'session/event') listeners.push(listener)
      return () => {}
    },
  }
  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 's_reuse',
    runTimeoutMs: 1_000,
    reusedAgent: existingAgent,
  })
  assert.equal(result.status, 'succeeded')
  assert.equal(permissionApplied, true, '复用会话时必须调用 permissionPresets.set 应用当前任务定义的权限')
  assert.deepEqual(modelSelected, { provider: 'deepseek', model: 'v3', reasoningEffort: 'low' }, '复用会话时必须调用 model.select 设定任务定义的模型')
})

test('复用会话初始处于忙碌时，若 signal 中止必须触发 cancel 并在时限内返回 cancelled，不永久卡死', async () => {
  const definition = createDefinition({
    id: 'def_busy_test',
    name: '忙碌防卡死测试',
    prompt: '任务',
    schedule: { kind: 'daily', time: '09:00', timeZone: 'Asia/Shanghai' },
    workspaceId: 'ws_demo',
    cwd: 'D:\\work\\demo',
    agentPreset: 'standard',
    permissionPreset: 'read-only',
    sessionMode: 'reuse',
    createdBy: { kind: 'web', sessionId: 'src' },
    now: '2026-04-01T00:00:00Z',
  })
  const run = createScheduledRun(definition, '2026-04-01T09:00:00Z')
  let cancelCalled = false
  let idleResolved = false
  // 模拟 whenIdle 挂起，直到 cancel 被调用才 resolve
  let resolveIdle: () => void
  const idlePromise = new Promise<void>((resolve) => {
    resolveIdle = () => {
      idleResolved = true
      resolve()
    }
  })
  const busyAgent = {
    session: { id: 's_busy', seq: 0, append() {} },
    whenIdle() {
      return idlePromise
    },
    cancel() {
      cancelCalled = true
      resolveIdle()
    },
    followup() {},
  }
  const ctx = {
    workspaceRegistry: { get: () => ({ path: 'D:\\work\\demo', status: async () => 'ok', attachSession: async () => {} }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    permissionPresets: { set() {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create() { throw new Error('不应调用 create') },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on() { return () => {} },
  }
  const controller = new AbortController()
  // 50ms 后中止
  setTimeout(() => controller.abort(), 50)
  const started = Date.now()
  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 's_busy',
    runTimeoutMs: 500,
    reusedAgent: busyAgent,
    signal: controller.signal,
  })
  const elapsed = Date.now() - started
  assert.equal(result.status, 'cancelled')
  assert.equal(cancelCalled, true, 'signal 中止时必须调用 liveAgent.cancel')
  assert.ok(elapsed < 400, `应在取消后迅速退出，实际耗时 ${elapsed}ms`)
})

test('resumeSession 为 true 时通过 agents.resume 恢复会话，不调用 agents.create', async () => {
  const { definition: baseDef, run: baseRun } = sampleRun()
  const definition = { ...baseDef, sessionMode: 'reuse' as const, activeSessionId: 'dsh-automation-session-resumable' }
  const run = { ...baseRun, targetSnapshot: { ...baseRun.targetSnapshot, sessionMode: 'reuse' as const } }

  let resumeCalled = false
  let createCalled = false
  let resumedSessionId: string | undefined
  const events: any[] = []
  const listeners: any[] = []
  const session = {
    id: 'dsh-automation-session-resumable',
    header: { cwd: definition.cwd },
    get seq() { return events.length },
    append(type: string, data: any) {
      const evt = { seq: events.length, type, data }
      events.push(evt)
      for (const l of listeners) l(session, evt)
    },
  }
  const resumedAgent = {
    session,
    async whenIdle() {},
    followup() {
      session.append('turn/start', {})
      session.append('assistant/message', { message: { content: [{ type: 'text', text: '恢复会话产出' }] } })
      session.append('turn/end', { reason: { kind: 'completed' } })
    },
  }

  const ctx = {
    workspaceRegistry: { get: () => ({ path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    permissionPresets: { set() {} },
    agentPresets: { mount: async () => {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create() {
        createCalled = true
        throw new Error('不应调用 create')
      },
      async resume(options: any) {
        resumeCalled = true
        resumedSessionId = String(options.resumeSessionId)
        return { agent: resumedAgent, async dispose() {} }
      },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on(name: string, listener: any) {
      if (name === 'session/event') listeners.push(listener)
      return () => {}
    },
  }

  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 'dsh-automation-session-resumable',
    runTimeoutMs: 1_000,
    resumeSession: true,
  })

  assert.equal(result.status, 'succeeded')
  assert.equal(result.sessionId, 'dsh-automation-session-resumable')
  assert.equal(result.summary, '恢复会话产出')
  assert.equal(resumeCalled, true, '必须调用 agents.resume')
  assert.equal(resumedSessionId, 'dsh-automation-session-resumable')
  assert.equal(createCalled, false, '恢复成功时不应调用 agents.create')
})

test('resumeSession 为 true 且 agents.resume 失败时自愈回退到 agents.create 并生成新会话', async () => {
  const { definition: baseDef, run: baseRun } = sampleRun()
  const definition = { ...baseDef, sessionMode: 'reuse' as const, activeSessionId: 'dsh-automation-session-broken' }
  const run = { ...baseRun, targetSnapshot: { ...baseRun.targetSnapshot, sessionMode: 'reuse' as const } }

  let resumeCalled = false
  let createCalled = false
  let createdSessionId: string | undefined
  const events: any[] = []
  const listeners: any[] = []
  const session = {
    header: { cwd: definition.cwd },
    get seq() { return events.length },
    append(type: string, data: any) {
      const evt = { seq: events.length, type, data }
      events.push(evt)
      for (const l of listeners) l(session, evt)
    },
  }
  const createdAgent = {
    session,
    async whenIdle() {},
    followup() {
      session.append('turn/start', {})
      session.append('assistant/message', { message: { content: [{ type: 'text', text: '自愈新建产出' }] } })
      session.append('turn/end', { reason: { kind: 'completed' } })
    },
  }

  const ctx = {
    workspaceRegistry: { get: () => ({ path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    permissionPresets: { set() {} },
    agentPresets: { mount: async () => {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async resume() {
        resumeCalled = true
        throw new Error('session persistence record not found')
      },
      async create(options: any) {
        createCalled = true
        createdSessionId = String(options.sessionId)
        return { agent: createdAgent, async dispose() {} }
      },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on(name: string, listener: any) {
      if (name === 'session/event') listeners.push(listener)
      return () => {}
    },
  }

  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 'dsh-automation-session-broken',
    runTimeoutMs: 1_000,
    resumeSession: true,
  })

  assert.equal(result.status, 'succeeded')
  assert.equal(resumeCalled, true, '应尝试调用 agents.resume')
  assert.equal(createCalled, true, 'resume 失败后必须自愈调用 agents.create')
  assert.ok(result.sessionId)
  assert.notEqual(result.sessionId, 'dsh-automation-session-broken', '自愈后必须生成新的 session ID')
  assert.equal(result.sessionId, createdSessionId)
  assert.equal(result.summary, '自愈新建产出')
})

test('执行器复用会话时，若 session cwd 与目标 cwd 不一致，必须拒绝并自愈新建', async () => {
  const { definition: baseDef, run: baseRun } = sampleRun()
  const definition = { ...baseDef, sessionMode: 'reuse' as const, cwd: 'D:\\work\\new_target' }
  const run = {
    ...baseRun,
    targetSnapshot: { ...baseRun.targetSnapshot, cwd: 'D:\\work\\new_target', sessionMode: 'reuse' as const },
  }

  let createCalled = false
  let createdSessionId: string | undefined
  const staleSession = {
    id: 's_stale_ws',
    header: { cwd: 'D:\\work\\old_ws' },
  }
  const staleAgent = {
    session: staleSession,
    async whenIdle() {},
    followup() {
      throw new Error('不应向旧工作区的会话 followup')
    },
  }

  const events: any[] = []
  const listeners: any[] = []
  const freshSession = {
    header: { cwd: 'D:\\work\\new_target' },
    get seq() { return events.length },
    append(type: string, data: any) {
      const evt = { seq: events.length, type, data }
      events.push(evt)
      for (const l of listeners) l(freshSession, evt)
    },
  }
  const freshAgent = {
    session: freshSession,
    async whenIdle() {},
    followup() {
      freshSession.append('turn/start', {})
      freshSession.append('turn/end', { reason: { kind: 'completed' } })
    },
  }

  const ctx = {
    workspaceRegistry: {
      get: () => ({ path: 'D:\\work\\new_target', status: async () => 'ok', attachSession: async () => {} }),
    },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    permissionPresets: { set() {} },
    agentPresets: { mount: async () => {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create(options: any) {
        createCalled = true
        createdSessionId = String(options.sessionId)
        await options?.setup?.({}, freshAgent)
        return { agent: freshAgent, async dispose() {} }
      },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on(name: string, listener: any) {
      if (name === 'session/event') listeners.push(listener)
      return () => {}
    },
  }

  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 's_stale_ws',
    runTimeoutMs: 1_000,
    reusedAgent: staleAgent,
  })

  assert.equal(result.status, 'succeeded')
  assert.equal(createCalled, true, '跨工作区旧会话必须被执行器拦截并自愈调用 create')
  assert.notEqual(result.sessionId, 's_stale_ws')
  assert.equal(result.sessionId, createdSessionId)
})


test('初始 whenIdle 纳入超时保护：runTimeout 到期后必须触发 cancel 并在未收敛时返回 cancel_convergence_timeout', { timeout: 300 }, async () => {
  const { definition: baseDef, run: baseRun } = sampleRun()
  const definition = { ...baseDef, sessionMode: 'reuse' as const, activeSessionId: 's_timeout_idle' }
  const run = { ...baseRun, targetSnapshot: { ...baseRun.targetSnapshot, sessionMode: 'reuse' as const } }

  let cancelCalled = false
  const busyAgent = {
    session: {
      id: 's_timeout_idle',
      header: { cwd: definition.cwd },
      seq: 0,
      append() {},
    },
    // 永久 pending，模拟挂死不收敛的 agent；若缺少 Promise.race 将导致 await initialIdle 永久挂死
    whenIdle: () => new Promise<void>(() => {}),
    cancel: () => {
      cancelCalled = true
    },
    followup: () => {},
  }

  const ctx = {
    workspaceRegistry: {
      get: () => ({ path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }),
      resolveByPath: async () => ({ id: 'w1', path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }),
    },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    permissionPresets: { set() {} },
    agentPresets: { mount: async () => {} },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create() { throw new Error('should not create') },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on() { return () => {} },
  }

  const started = Date.now()
  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 's_timeout_idle',
    runTimeoutMs: 30,
    cancelConvergenceTimeoutMs: 20,
    reusedAgent: busyAgent,
  })
  const elapsed = Date.now() - started
  assert.equal(result.status, 'failed')
  assert.equal(result.error?.code, 'cancel_convergence_timeout')
  assert.equal(cancelCalled, true, '超时必须触发 cancel')
  assert.ok(elapsed >= 30, '至少等待 runTimeoutMs')
  assert.ok(elapsed < 250, `超时后应在收敛时限内迅速退出，实际耗时 ${elapsed}ms`)
})

test('执行器复用会话时，若 session 预设与目标预设不一致，必须拒绝并自愈新建', async () => {
  const { definition: baseDef, run: baseRun } = sampleRun()
  const definition = { ...baseDef, sessionMode: 'reuse' as const, agentPreset: 'ptc', activeSessionId: 's_preset_mismatch' }
  const run = {
    ...baseRun,
    targetSnapshot: { ...baseRun.targetSnapshot, sessionMode: 'reuse' as const, agentPreset: 'ptc' },
  }

  const stalePresetAgent = {
    session: {
      id: 's_preset_mismatch',
      header: { cwd: definition.cwd, agentPreset: 'standard' },
      seq: 0,
    },
    whenIdle: async () => {},
    cancel: () => {},
    followup: () => {},
  }

  let createCalled = false
  let createdSessionId: string | undefined
  let createdPreset: string | undefined
  const events: any[] = []
  const listeners: any[] = []
  const freshSession = {
    id: 's_fresh',
    header: { cwd: definition.cwd, agentPreset: 'ptc' },
    get seq() { return events.length },
    append(type: string, data: any) {
      const evt = { seq: events.length, type, data }
      events.push(evt)
      for (const l of listeners) l(freshSession, evt)
    },
  }
  const freshAgent = {
    session: freshSession,
    whenIdle: async () => {},
    cancel: () => {},
    followup() {
      freshSession.append('turn/start', {})
      freshSession.append('assistant/message', { message: { content: [{ type: 'text', text: '新预设执行成功' }] } })
      freshSession.append('turn/end', { reason: { kind: 'completed' } })
    },
  }

  const ctx = {
    workspaceRegistry: {
      get: () => ({ path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }),
      resolveByPath: async () => ({ id: 'w1', path: definition.cwd, status: async () => 'ok', attachSession: async () => {} }),
    },
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test' }) },
    permissionPresets: { set() {} },
    agentPresets: {
      mount: async (_ctx: any, preset: string) => {
        createdPreset = preset
      },
    },
    agents: {
      withoutInitiator: (callback: () => unknown) => callback(),
      async create(options: any) {
        createCalled = true
        createdSessionId = String(options.sessionId)
        await options?.setup?.({}, freshAgent)
        return { agent: freshAgent, async dispose() {} }
      },
    },
    sessions: { flush: async () => {} },
    get: () => undefined,
    on(name: string, listener: any) {
      if (name === 'session/event') listeners.push(listener)
      return () => {}
    },
  }

  const result = await executeAutomationRun(ctx as never, definition, run, {
    sessionId: 's_preset_mismatch',
    runTimeoutMs: 1_000,
    reusedAgent: stalePresetAgent,
  })

  assert.equal(result.status, 'succeeded')
  assert.equal(createCalled, true, '预设不匹配时必须拒绝复用并新建')
  assert.equal(createdPreset, 'ptc', '必须以新预设 mount')
  assert.notEqual(result.sessionId, 's_preset_mismatch')
  assert.equal(result.sessionId, createdSessionId)
})
