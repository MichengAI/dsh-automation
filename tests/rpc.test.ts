import assert from 'node:assert/strict'
import test from 'node:test'
import { registerAutomationRpc } from '../src/rpc.ts'
import { registerAutomationTools } from '../src/tools.ts'

test('工具注册收敛为三个管理入口，并校验计划字段组合', () => {
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
    'automation_create', 'automation_get', 'automation_manage',
  ])
  assert.match(descriptions.get('automation_create') ?? '', /定时任务/)
  assert.deepEqual(definitions.get('automation_create')?.parameters?.permission?.enum, [
    'read-only', 'workspace-write',
  ])
  assert.deepEqual(definitions.get('automation_create')?.parameters?.kind?.enum, [
    'once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom',
  ])
  assert.deepEqual(definitions.get('automation_manage')?.parameters?.kind?.enum, [
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
  const update = definitions.get('automation_manage')?.execute as (args: unknown, context: unknown) => Promise<unknown>
  const context = { agent, signal: new AbortController().signal }

  await execute({ name: 'hourly', prompt: 'p', kind: 'hourly', time_zone: 'UTC', minute: 15 }, context)
  await execute({ name: 'monthly', prompt: 'p', kind: 'monthly', time_zone: 'UTC', time: '09:00', month_day: 31 }, context)
  await execute({ name: 'custom', prompt: 'p', kind: 'custom', time_zone: 'UTC', time: '10:00', every_days: 3 }, context)
  await update({ id: 'automation-1', action: 'update', kind: 'hourly', time_zone: 'UTC', minute: 45 }, context)

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
