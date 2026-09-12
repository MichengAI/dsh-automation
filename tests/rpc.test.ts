import assert from 'node:assert/strict'
import test from 'node:test'
import { registerAutomationRpc } from '../src/rpc.ts'
import { registerAutomationTools } from '../src/tools.ts'

test('工具注册覆盖六个管理入口，并校验计划字段组合', () => {
  const names: string[] = []
  const descriptions = new Map<string, string>()
  const definitions = new Map<string, any>()
  const agent = {
    id: 'session-1',
    ctx: {
      tools: {
        register(definition: { name: string; description?: string }): () => void {
          names.push(definition.name)
          definitions.set(definition.name, definition)
          if (typeof definition.description === 'string') descriptions.set(definition.name, definition.description)
          return () => {}
        },
      },
    },
  }
  const dispose = registerAutomationTools({ permissionNames: () => ['read-only', 'workspace-write'] } as never, agent)
  assert.deepEqual(names, [
    'automation_create', 'automation_list', 'automation_update',
    'automation_runs', 'automation_run_now', 'automation_delete',
  ])
  assert.match(descriptions.get('automation_create') ?? '', /定时任务/)
  assert.deepEqual(definitions.get('automation_create')?.parameters?.permission?.enum, [
    'read-only', 'workspace-write',
  ])
  assert.deepEqual(definitions.get('automation_create')?.parameters?.kind?.enum, [
    'once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom',
  ])
  assert.deepEqual(definitions.get('automation_update')?.parameters?.kind?.enum, [
    'once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom',
  ])
  dispose()
})

test('Agent 工具可以创建和更新 hourly、monthly、custom 计划', async () => {
  const schedules: unknown[] = []
  const definitions = new Map<string, any>()
  const agent = {
    id: 'session-advanced',
    ctx: {
      tools: {
        register(definition: { name: string }): () => void {
          definitions.set(definition.name, definition)
          return () => {}
        },
      },
    },
  }
  registerAutomationTools({
    permissionNames: () => ['read-only'],
    async create(_scope: unknown, request: { schedule: unknown }) {
      schedules.push(request.schedule)
      return { id: `automation-${schedules.length}` }
    },
    async update(_scope: unknown, id: string, request: { schedule?: unknown }) {
      schedules.push(request.schedule)
      return { id }
    },
  } as never, agent)
  const execute = definitions.get('automation_create')?.execute as (args: unknown, context: unknown) => Promise<unknown>
  const update = definitions.get('automation_update')?.execute as (args: unknown, context: unknown) => Promise<unknown>
  const context = { agent, signal: new AbortController().signal }

  await execute({ name: 'hourly', prompt: 'p', kind: 'hourly', time_zone: 'UTC', minute: 15 }, context)
  await execute({ name: 'monthly', prompt: 'p', kind: 'monthly', time_zone: 'UTC', time: '09:00', month_day: 31 }, context)
  await execute({ name: 'custom', prompt: 'p', kind: 'custom', time_zone: 'UTC', time: '10:00', every_days: 3 }, context)
  await update({ id: 'automation-1', kind: 'hourly', time_zone: 'UTC', minute: 45 }, context)

  assert.deepEqual(schedules, [
    { kind: 'hourly', minute: 15, timeZone: 'UTC' },
    { kind: 'monthly', day: 31, time: '09:00', timeZone: 'UTC' },
    { kind: 'custom', everyDays: 3, time: '10:00', timeZone: 'UTC' },
    { kind: 'hourly', minute: 45, timeZone: 'UTC' },
  ])
})

test('RPC 适配器只接受已知端点并返回失败关闭信封', async () => {
  let handler: ((endpoint: string, payload: unknown, signal: AbortSignal) => Promise<unknown>) | undefined
  const ctx = {
    logger: { warn() {} },
    connection: {
      rpc: {
        handle(_channel: string, next: typeof handler) {
          handler = next
          return async () => {}
        },
      },
    },
  }
  registerAutomationRpc(ctx as never, {} as never)
  const result = await handler!('missing', { sessionId: 's1' }, new AbortController().signal) as { ok: false; error: { code: string } }
  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'bad-request')
})

test('RPC 限制任务字段长度并隐藏内部异常文案', async () => {
  let handler: ((endpoint: string, payload: unknown, signal: AbortSignal) => Promise<any>) | undefined
  const warnings: string[] = []
  const ctx = {
    logger: { warn(message: string) { warnings.push(message) } },
    connection: { rpc: { handle(_channel: string, next: typeof handler) { handler = next; return async () => {} } } },
  }
  registerAutomationRpc(ctx as never, {
    async create() { throw new Error('storage path C:\\secret\\domain.db') },
  } as never)
  const signal = new AbortController().signal
  const oversized = await handler!('create', {
    input: {
      name: 'x'.repeat(201), prompt: 'p', timeZone: 'UTC', permission: 'read-only',
      schedule: { kind: 'daily', time: '09:00' },
    },
  }, signal)
  assert.equal(oversized.error.code, 'bad-request')
  const internal = await handler!('create', {
    input: {
      name: 'n', prompt: 'p', timeZone: 'UTC', permission: 'read-only',
      schedule: { kind: 'daily', time: '09:00' },
    },
  }, signal)
  assert.equal(internal.error.code, 'internal')
  assert.equal(internal.error.message, '自动化服务暂时无法完成请求。')
  assert.equal(warnings.length, 1)
  assert.match(warnings[0] ?? '', /RPC 'create' failed:.*storage path C:\\secret\\domain\.db/s)
})



test('RPC 创建和编辑传递并发数量，拒绝非整数类型', async () => {
  let handler: ((endpoint: string, payload: unknown, signal: AbortSignal) => Promise<any>) | undefined
  const received: number[] = []
  registerAutomationRpc({
    logger: { warn() {} },
    connection: { rpc: { handle(_channel: string, next: typeof handler) { handler = next; return async () => {} } } },
  } as never, {
    async create(_scope: unknown, input: { maxConcurrentRuns: number }) { received.push(input.maxConcurrentRuns); return { id: 'a' } },
    async update(_scope: unknown, _id: string, input: { maxConcurrentRuns: number }) { received.push(input.maxConcurrentRuns); return { id: 'a', revision: 2 } },
  } as never)
  const input = { name: 'n', prompt: 'p', timeZone: 'UTC', permission: 'read-only', schedule: { kind: 'daily', time: '09:00' }, maxConcurrentRuns: 3 }
  const signal = new AbortController().signal
  for (const endpoint of ['create', 'update']) {
    assert.equal((await handler!(endpoint, { automationId: 'a', input }, signal)).ok, true)
    assert.equal((await handler!(endpoint, { automationId: 'a', input: { ...input, maxConcurrentRuns: '3' } }, signal)).error.code, 'bad-request')
  }
  assert.deepEqual(received, [3, 3])
})

test('Agent 创建与更新工具透传并发数量，省略参数时不覆盖已有值', async () => {
  const definitions = new Map<string, any>()
  const requests: Record<string, unknown>[] = []
  const agent = {
    id: 'concurrency-tool-test',
    ctx: { tools: { register(definition: { name: string }) { definitions.set(definition.name, definition); return () => {} } } },
  }
  const dispose = registerAutomationTools({
    permissionNames: () => ['read-only'],
    async create(_scope: unknown, input: Record<string, unknown>) { requests.push(input); return { id: 'a' } },
    async update(_scope: unknown, _id: string, input: Record<string, unknown>) { requests.push(input); return { id: 'a' } },
  } as never, agent)
  const context = { agent, signal: new AbortController().signal }
  const create = definitions.get('automation_create').execute
  const update = definitions.get('automation_update').execute
  const input = { name: '检查', prompt: '领取下一项', kind: 'interval', every_minutes: 1, time_zone: 'UTC' }
  try {
    await create({ ...input, max_concurrent_runs: 3 }, context)
    await update({ id: 'a', max_concurrent_runs: 2 }, context)
    await create(input, context)
    await update({ id: 'a', name: '改名' }, context)
    assert.equal(requests.length, 4)
    assert.equal(requests[0]?.maxConcurrentRuns, 3)
    assert.deepEqual(requests[1], { maxConcurrentRuns: 2 })
    assert.equal(Object.hasOwn(requests[2]!, 'maxConcurrentRuns'), false)
    assert.equal(Object.hasOwn(requests[3]!, 'maxConcurrentRuns'), false)
  } finally {
    dispose()
  }
})
