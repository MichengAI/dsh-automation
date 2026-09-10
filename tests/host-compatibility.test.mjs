// 独立进程加载 npm 宿主实现，不使用 register-dsh-stubs；模型响应固定且不联网。
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { LlmAdapter } from '@deepseek-ai/dsh-llm'
import SessionStore from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import ApprovalService from '@deepseek-ai/dsh-user-approval'
import PermissionPresets from '@deepseek-ai/dsh-permission-presets'
import * as Connection from '@deepseek-ai/dsh-client-connection'
import { registerAutomationRpc } from '../src/rpc.ts'
import { createDefinition, createScheduledRun } from '../src/domain.ts'
import { executeAutomationRun } from '../src/executor.ts'

class FixedAdapter extends LlmAdapter {
  requests = []
  async resolveModel(provider, model) { return { provider, id: model, name: model } }
  async *stream(request) {
    this.requests.push(request)
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: '兼容性验收通过' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: '兼容性验收通过' } }
    yield { type: 'usage', usage: { inputTokens: 10, outputTokens: 5 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

const hostVersion = process.env.DSH_TEST_VERSION ?? '0.1.5-rc.1'
const explicitAgent = hostVersion === '0.1.5-rc.1'

test(`${hostVersion} 真实 Connection 在插件作用域注册和卸载自动化 RPC`, async t => {
  const ctx = new Context()
  t.after(() => ctx.fiber.dispose())
  const routes = new Set()
  ctx.provide('webRuntime', { trustedHosts: [] })
  // 与真实 Loader 一致：WebServer 来自兄弟插件，不能用根 Context 的无条件提供掩盖缺失注入。
  await ctx.plugin({ apply(owner) {
    owner.provide('webServer', {
      port: 0,
      register(route) { routes.add(route); return () => routes.delete(route) },
      registerUpgrade() { return () => {} },
      tapIndex() { return () => {} },
    })
  } })
  let record
  ctx.provide('credentials', {
    async readRecord() { return record },
    async modifyRecord(_key, mutate) { record = await mutate(record); return record },
  })
  // 直接读取 bundle 中受控的注入列表，让删除该修复时能复现真实启动失败。
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  const section = patch.match(/^- id: connection\r?\n  inject:\r?\n((?:    - [\w]+\r?\n)+)/m)
  const extraInject = section?.[1].trim().split(/\r?\n/).map(line => line.trim().slice(2)) ?? []
  await ctx.plugin({ ...Connection, inject: [...Connection.inject, ...extraInject] })
  let remove
  await ctx.plugin({
    inject: ['connection', 'webServer'],
    apply(owner) { remove = registerAutomationRpc(owner, {}) },
  })
  assert.ok([...routes].some(route => route.path === '/dsh-automation'))
  await remove()
  assert.ok(![...routes].some(route => route.path === '/dsh-automation'))
})

test(`${hostVersion} 真实 AgentLoop 执行自动化、保留权限日志并释放 Agent`, { timeout: 10_000 }, async t => {
  const ctx = new Context()
  t.after(() => ctx.fiber.dispose())
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(ApprovalService)
  // 此夹具不执行 shell，只提供权限预设读取的宿主能力描述。
  ctx.provide('shell', { sandboxMode: 'workspace-write' })
  await ctx.plugin(PermissionPresets, { defaultPreset: 'workspace-write' })
  await ctx.plugin(AgentLoop, { agents: [] })
  const adapter = new FixedAdapter()
  ctx.llm.registerAdapter(['compat'], adapter)
  const cwd = process.cwd()
  const attached = []
  ctx.provide('workspaceRegistry', {
    get: () => ({ path: cwd, status: async () => 'ok', attachSession: async id => { attached.push(id) } }),
  })
  ctx.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'compat', model: 'fixed' }) })
  ctx.provide('agentPresets', {
    mount: async agentCtx => {
      if (explicitAgent) assert.throws(() => agentCtx.agent, /cannot get property "agent"/)
      else assert.ok(agentCtx.agent.session)
    },
  })
  let session
  ctx.on('agent/created', ({ agent }) => { session = agent.session })
  const definition = createDefinition({
    id: 'compat', name: '新版宿主验收', prompt: '输出验收结果',
    schedule: { kind: 'once', at: '2026-09-11T00:00:00Z', timeZone: 'UTC' },
    workspaceId: 'compat-workspace', cwd, agentPreset: 'standard',
    provider: 'compat', model: 'fixed', permissionPreset: 'danger-full-access',
    createdBy: { kind: 'web', sessionId: 'source' }, now: '2026-09-10T00:00:00Z',
  })
  const run = createScheduledRun(definition, '2026-09-11T00:00:00Z')
  const result = await executeAutomationRun(ctx, definition, run, { sessionId: 'compat-run', runTimeoutMs: 3_000 })
  assert.equal(result.status, 'succeeded', JSON.stringify(result))
  assert.equal(result.summary, '兼容性验收通过')
  assert.equal(adapter.requests.length, 1)
  assert.deepEqual(attached, ['compat-run'])
  const events = typeof session.snapshotEvents === 'function' ? session.snapshotEvents() : session.events
  assert.equal(session.header.version, explicitAgent ? 3 : 0)
  assert.equal(events.findLast(event => event.type === 'permission/preset')?.data.preset, 'danger-full-access')
  assert.equal(events.findLast(event => event.type === 'approval/policy')?.data.policy, 'never')
  assert.equal(ctx.agents.get('compat-run'), undefined)
  assert.equal(ctx.sessions.get('compat-run'), undefined)
})
