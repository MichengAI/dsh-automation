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
  const dispose = registerAutomationTools({ permissionNames: () => ['read-only', 'workspace-write', 'danger-full-access'] } as never, agent)
  assert.deepEqual(names, [
    'automation_create', 'automation_list', 'automation_update',
    'automation_runs', 'automation_run_now', 'automation_delete',
  ])
  assert.match(descriptions.get('automation_create') ?? '', /定时任务/)
  assert.deepEqual(definitions.get('automation_create')?.parameters?.permission?.enum, [
    'read-only', 'workspace-write', 'danger-full-access',
  ])
  dispose()
})

test('RPC 适配器只接受已知端点并返回失败关闭信封', async () => {
  let handler: ((endpoint: string, payload: unknown, signal: AbortSignal) => Promise<unknown>) | undefined
  const ctx = {
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


