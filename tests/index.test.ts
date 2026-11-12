import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { Context } from '@deepseek-ai/cordis'
import {
  apply,
  humanApprovalReason,
  inject,
  needsHumanApproval,
  sessionApprovalPolicy,
} from '../src/index.ts'

const { Context: CordisContext, Service: CordisService } = await import('@deepseek-ai/cordis') as unknown as {
  Context: new () => Context & {
    provide(name: string, value: unknown): void
    extend(meta?: Record<string, unknown>): Context & { provide(name: string, value: unknown): void }
    plugin(plugin: unknown): Promise<unknown>
    emit(name: string, ...args: unknown[]): void
    readonly fiber: { dispose(): Promise<void> }
  }
  Service: abstract new (ctx: Context, name: string, immediate?: boolean) => { ctx: Context & { scope?: string } }
}

test('Full access 的 never 策略不强制 ask，避免静默拒绝', () => {
  const signal = new AbortController().signal
  assert.equal(needsHumanApproval({ name: 'automation_create', signal }, true, 'never'), false)
  assert.equal(needsHumanApproval({ name: 'automation_delete', signal }, true, 'never'), false)
  assert.equal(needsHumanApproval({ name: 'automation_run_now', signal }, true), false)
})

test('Read Only / Workspace Write 的 ask 策略会走官方授权', () => {
  const signal = new AbortController().signal
  assert.equal(needsHumanApproval({ name: 'automation_create', signal }, true, 'ask'), true)
  assert.equal(needsHumanApproval({ name: 'automation_delete', signal }, true, 'ask'), true)
  assert.equal(needsHumanApproval({ name: 'automation_run_now', signal }, true, 'ask'), true)
  assert.equal(needsHumanApproval({
    name: 'automation_update',
    arguments: { id: 'automation-1', status: 'paused' },
    signal,
  }, true, 'ask'), false)
  assert.equal(needsHumanApproval({
    name: 'automation_update',
    arguments: { id: 'automation-1', name: '新名称' },
    signal,
  }, true, 'ask'), true)
  assert.equal(needsHumanApproval({ name: 'automation_list', signal }, true, 'ask'), false)
  assert.match(humanApprovalReason('automation_delete'), /永久删除/)
})

test('会话策略优先读 override，否则回退配置默认值', () => {
  assert.equal(sessionApprovalPolicy({
    overrideOf: () => 'never',
    config: { policy: 'ask' },
  }, {}), 'never')
  assert.equal(sessionApprovalPolicy({
    overrideOf: () => undefined,
    config: { policy: 'ask' },
  }, {}), 'ask')
  assert.equal(sessionApprovalPolicy(undefined, {}), undefined)
})

function memoryTable() {
  const map = new Map<string, any>()
  return {
    get: (key: string) => map.get(key),
    entries: () => map.entries(),
    keys: () => map.keys(),
    get size() { return map.size },
    async put(key: string, value: any) { map.set(key, value) },
    async delete(key: string) { return map.delete(key) },
    async update(key: string, transform: (v: any) => any) {
      const next = transform(map.get(key))
      map.set(key, next)
      return next
    },
  }
}

function makeFakeAgent(
  ctx: InstanceType<typeof CordisContext>,
  id: string,
  toolsByAgent: Map<string, string[]>,
  opts: {
    readonly origin?: string
    readonly delegationDepth?: number
    readonly subagentDepth?: number
  } = {},
) {
  const registered: string[] = []
  toolsByAgent.set(id, registered)
  const agentCtx = ctx.extend({ scope: id })
  return {
    registered,
    agent: {
      id,
      ctx: agentCtx,
      options: opts.subagentDepth === undefined ? {} : { subagentDepth: opts.subagentDepth },
      session: {
        id,
        header: {
          ...(opts.origin === undefined ? {} : { origin: opts.origin }),
          ...(opts.delegationDepth === undefined ? {} : { delegationDepth: opts.delegationDepth }),
        },
        snapshotEvents: () => [],
      },
    },
  }
}

async function setupApplyHarness(
  t: test.TestContext,
  options: {
    readonly agentsService: (ctx: InstanceType<typeof CordisContext>, toolsByAgent: Map<string, string[]>) => Record<string, unknown>
    readonly subagentsService?: (ctx: InstanceType<typeof CordisContext>) => Record<string, unknown>
  },
) {
  const ctx = new CordisContext()
  const stateDir = mkdtempSync(join(tmpdir(), 'dsh-automation-index-'))
  const toolsByAgent = new Map<string, string[]>()
  t.after(async () => {
    await ctx.fiber.dispose()
    rmSync(stateDir, { recursive: true, force: true })
  })
  const tables = new Map([
    ['definitions', memoryTable()],
    ['runs', memoryTable()],
  ])
  class FakeToolsService extends CordisService {
    constructor(rootCtx: Context) {
      super(rootCtx, 'tools', true)
    }
    register(definition: { readonly name: string }) {
      const scopeId = this.ctx.scope ?? '<root>'
      const list = toolsByAgent.get(scopeId) ?? []
      toolsByAgent.set(scopeId, list)
      list.push(definition.name)
      return () => {
        const index = list.indexOf(definition.name)
        if (index >= 0) list.splice(index, 1)
      }
    }
  }
  await ctx.plugin(FakeToolsService)
  ctx.provide('storageDomain', {
    async open() {
      return {
        name: 'dsh_automation',
        table: (name: string) => tables.get(name),
        async close() {},
      }
    },
  })
  ctx.provide('agents', options.agentsService(ctx, toolsByAgent))
  ctx.provide('sessions', { list: async () => [], get: () => undefined })
  ctx.provide('workspaceRegistry', { list: () => [], get: () => undefined, resolveByPath: async () => undefined })
  ctx.provide('agentDefaultModel', { currentSelection: () => undefined })
  ctx.provide('agentPresets', { defaultId: 'standard' })
  ctx.provide('permissionPresets', {
    names: ['read-only', 'workspace-write'],
    defaultPreset: 'workspace-write',
    optionOf: (value: string) => ({ value, name: value }),
    set() {},
  })
  ctx.provide('connection', { rpc: { handle: () => async () => {} } })
  ctx.provide('llm', {})
  ctx.provide('webServer', { register: () => () => {} })
  if (options.subagentsService !== undefined) {
    ctx.provide('subagents', options.subagentsService(ctx))
  }
  await ctx.plugin({
    inject,
    apply: (pluginCtx: Context) => apply(pluginCtx, {
      runTimeoutMinutes: 60,
      misfireGraceMinutes: 15,
      historyLimit: 200,
      stateDir,
    }),
  })
  return { ctx, toolsByAgent }
}

test('0.2.2-rc.2 缺失 ctx.agents.roots() 时仍能启动，仅向根会话注册管理工具并保留可选 subagents 兜底', async (t) => {
  assert.equal(inject.includes('subagents'), false, 'subagents 不得写入必需 inject')
  const live = new Map<string, any>()
  let createdRoot!: ReturnType<typeof makeFakeAgent>
  let createdSubOrigin!: ReturnType<typeof makeFakeAgent>
  let createdSubUnauthorized!: ReturnType<typeof makeFakeAgent>
  let rootAtStartup!: ReturnType<typeof makeFakeAgent>
  let forkedRootAtStartup!: ReturnType<typeof makeFakeAgent>
  let subOriginAtStartup!: ReturnType<typeof makeFakeAgent>
  let subDepthAtStartup!: ReturnType<typeof makeFakeAgent>
  let subOptDepthAtStartup!: ReturnType<typeof makeFakeAgent>
  let subResidentAtStartup!: ReturnType<typeof makeFakeAgent>
  let ownedAutomationAtStartup!: ReturnType<typeof makeFakeAgent>

  const { ctx, toolsByAgent } = await setupApplyHarness(t, {
    agentsService(rootCtx, toolsMap) {
      rootAtStartup = makeFakeAgent(rootCtx, 'root-startup', toolsMap, { origin: 'web', delegationDepth: 0 })
      forkedRootAtStartup = makeFakeAgent(rootCtx, 'fork-root', toolsMap, { origin: 'fork', delegationDepth: 0 })
      subOriginAtStartup = makeFakeAgent(rootCtx, 'sub-origin', toolsMap, { origin: 'subagent', delegationDepth: 1 })
      subDepthAtStartup = makeFakeAgent(rootCtx, 'sub-depth', toolsMap, { delegationDepth: 1 })
      subOptDepthAtStartup = makeFakeAgent(rootCtx, 'sub-opt-depth', toolsMap, { subagentDepth: 2 })
      subResidentAtStartup = makeFakeAgent(rootCtx, 'sub-resident', toolsMap)
      ownedAutomationAtStartup = makeFakeAgent(rootCtx, 'dsh-automation-session-run-1', toolsMap, { origin: 'web' })
      for (const item of [
        rootAtStartup,
        forkedRootAtStartup,
        subOriginAtStartup,
        subDepthAtStartup,
        subOptDepthAtStartup,
        subResidentAtStartup,
        ownedAutomationAtStartup,
      ]) {
        live.set(item.agent.id, item.agent)
      }
      return {
        get: (id: string) => live.get(id),
        list: () => [...live.values()],
      }
    },
    subagentsService() {
      return {
        marker: 'bound-subagents',
        rootOf(this: { marker?: string }, caller: any) {
          assert.equal(this?.marker, 'bound-subagents', '调用 rootOf 必须保留 service 的 this 上下文')
          if (caller.id === 'sub-resident') return rootAtStartup.agent
          if (caller.id === 'sub-unauthorized') {
            throw Object.assign(new Error('agent has no active runtime owner'), { code: 'UNAUTHORIZED' })
          }
          return caller
        },
      }
    },
  })

  assert.equal(rootAtStartup.registered.length, 6)
  assert.equal(forkedRootAtStartup.registered.length, 6)
  assert.equal(subOriginAtStartup.registered.length, 0)
  assert.equal(subDepthAtStartup.registered.length, 0)
  assert.equal(subOptDepthAtStartup.registered.length, 0)
  assert.equal(subResidentAtStartup.registered.length, 0)
  assert.equal(ownedAutomationAtStartup.registered.length, 0)

  createdRoot = makeFakeAgent(ctx, 'root-created', toolsByAgent, { origin: 'web' })
  createdSubOrigin = makeFakeAgent(ctx, 'sub-created', toolsByAgent, { origin: 'subagent', delegationDepth: 1 })
  createdSubUnauthorized = makeFakeAgent(ctx, 'sub-unauthorized', toolsByAgent)
  for (const item of [createdRoot, createdSubOrigin, createdSubUnauthorized]) {
    live.set(item.agent.id, item.agent)
    ctx.emit('agent/created', { agent: item.agent })
  }

  assert.equal(createdRoot.registered.length, 6)
  assert.equal(createdSubOrigin.registered.length, 0)
  assert.equal(createdSubUnauthorized.registered.length, 0)
})

test('0.2.2-rc.2 无 subagents 服务时仍可启动并按会话字段区分根会话与子代理', async (t) => {
  const live = new Map<string, any>()
  let rootAtStartup!: ReturnType<typeof makeFakeAgent>
  let subAtStartup!: ReturnType<typeof makeFakeAgent>
  const { ctx, toolsByAgent } = await setupApplyHarness(t, {
    agentsService(rootCtx, toolsMap) {
      rootAtStartup = makeFakeAgent(rootCtx, 'root-no-subagents', toolsMap, { origin: 'web' })
      subAtStartup = makeFakeAgent(rootCtx, 'sub-no-subagents', toolsMap, { origin: 'subagent', delegationDepth: 1 })
      live.set(rootAtStartup.agent.id, rootAtStartup.agent)
      live.set(subAtStartup.agent.id, subAtStartup.agent)
      return {
        get: (id: string) => live.get(id),
        list: () => [...live.values()],
      }
    },
  })
  assert.equal(rootAtStartup.registered.length, 6)
  assert.equal(subAtStartup.registered.length, 0)
  const createdSub = makeFakeAgent(ctx, 'sub-created-no-svc', toolsByAgent, { subagentDepth: 1 })
  live.set(createdSub.agent.id, createdSub.agent)
  ctx.emit('agent/created', { agent: createdSub.agent })
  assert.equal(createdSub.registered.length, 0)
})

test('0.2.0-rc.1 ~ 0.2.2-rc.1 提供 ctx.agents.roots() 时沿用 roots() 判据', async (t) => {
  const rootsSet = new Set<any>()
  const live = new Map<string, any>()
  let rootAgent!: ReturnType<typeof makeFakeAgent>
  let legacyChild!: ReturnType<typeof makeFakeAgent>
  const { ctx, toolsByAgent } = await setupApplyHarness(t, {
    agentsService(rootCtx, toolsMap) {
      rootAgent = makeFakeAgent(rootCtx, 'legacy-root', toolsMap)
      legacyChild = makeFakeAgent(rootCtx, 'legacy-child', toolsMap)
      rootsSet.add(rootAgent.agent)
      live.set(rootAgent.agent.id, rootAgent.agent)
      live.set(legacyChild.agent.id, legacyChild.agent)
      return {
        get: (id: string) => live.get(id),
        list: () => [...live.values()],
        roots: () => [...rootsSet],
      }
    },
  })
  assert.equal(rootAgent.registered.length, 6)
  assert.equal(legacyChild.registered.length, 0)
  const createdLegacyChild = makeFakeAgent(ctx, 'legacy-child-created', toolsByAgent)
  live.set(createdLegacyChild.agent.id, createdLegacyChild.agent)
  ctx.emit('agent/created', { agent: createdLegacyChild.agent })
  assert.equal(createdLegacyChild.registered.length, 0)
})