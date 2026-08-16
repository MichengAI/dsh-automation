import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefinition } from '../src/domain.ts'
import { AutomationService, type AutomationConfig } from '../src/service.ts'
import type { AutomationDefinition, AutomationRun } from '../src/types.ts'

class MemoryTable<V> {
  private readonly values = new Map<string, V>()
  get(key: string): V | undefined { return this.values.get(key) }
  entries(): IterableIterator<[string, V]> { return this.values.entries() }
  keys(): IterableIterator<string> { return this.values.keys() }
  get size(): number { return this.values.size }
  async put(key: string, value: V): Promise<void> { this.values.set(key, value) }
  async delete(key: string): Promise<boolean> { return this.values.delete(key) }
  async update(key: string, transform: (current: V) => V): Promise<V> {
    const current = this.values.get(key)
    if (current === undefined) throw new Error(`missing ${key}`)
    const next = transform(current)
    this.values.set(key, next)
    return next
  }
}

function config(overrides: Partial<AutomationConfig> = {}): AutomationConfig {
  return {
    maxConcurrentRuns: 2,
    runTimeoutMs: 60_000,
    misfireGraceMs: 15 * 60_000,
    historyLimit: 3,
    ...overrides,
  }
}

function makeService(initial: {
  definitions?: AutomationDefinition[]
  runs?: AutomationRun[]
} = {}, overrides: Partial<AutomationConfig> = {}) {
  const definitions = new MemoryTable<AutomationDefinition>()
  const runs = new MemoryTable<AutomationRun>()
  for (const item of initial.definitions ?? []) void definitions.put(item.id, item)
  for (const item of initial.runs ?? []) void runs.put(item.id, item)
  const agent = {
    session: {
      header: { cwd: 'D:\\work\\demo', agentPreset: 'standard' },
      requestHeader: () => ({ config: { provider: 'deepseek', model: 'v4' } }),
    },
    ctx: {},
  }
  const ctx = {
    logger: { warn() {} },
    storageDomain: {
      async open() {
        return {
          name: 'dsh_automation',
          table(name: string) { return name === 'definitions' ? definitions : runs },
          async close() {},
        }
      },
    },
    agents: {
      get() { return agent },
    },
    workspaceRegistry: {
      async resolveByPath() {
        return { id: 'ws_1', title: 'demo', path: 'D:\\work\\demo' }
      },
    },
    agentDefaultModel: { currentSelection: () => ({ provider: 'deepseek', model: 'v4' }) },
    agentPresets: { composedPreset: () => 'standard' },
  }
  return AutomationService.open(ctx as never, config(overrides)).then(async (service) => {
    Object.assign(service as any, { definitions, runs })
    return { service, definitions, runs }
  })
}

function sampleDefinition(overrides: Partial<AutomationDefinition> = {}): AutomationDefinition {
  return createDefinition({
    id: 'automation_1',
    name: '每日检查',
    prompt: '检查测试',
    schedule: { kind: 'once', at: '2026-08-16T01:00:00.000Z', timeZone: 'UTC' },
    workspaceId: 'ws_1',
    cwd: 'D:\\work\\demo',
    agentPreset: 'standard',
    createdBy: { kind: 'web', sessionId: 'session_1' },
    now: '2026-08-16T00:00:00.000Z',
    ...overrides,
  })
}

test('重启后把遗留 queued/running 标记为 host_interrupted', async () => {
  const definition = sampleDefinition()
  const { runs } = await makeService({
    definitions: [definition],
    runs: [{
      version: 1,
      id: 'run_old',
      automationId: definition.id,
      definitionRevision: 1,
      occurrenceKey: 'k',
      trigger: 'schedule',
      scheduledFor: '2026-08-16T00:30:00.000Z',
      status: 'running',
      promptSnapshot: definition.prompt,
      targetSnapshot: {
        workspaceId: definition.workspaceId,
        cwd: definition.cwd,
        agentPreset: definition.agentPreset,
        provider: null,
        model: null,
        permissionPreset: 'read-only',
      },
      sessionId: 'sess',
      startedAt: '2026-08-16T00:30:00.000Z',
      finishedAt: null,
      summary: null,
      error: null,
      unread: true,
    }],
  })
  const recovered = runs.get('run_old')
  assert.equal(recovered?.status, 'failed')
  assert.equal(recovered?.error?.code, 'host_interrupted')
})

test('ownsSession 通过前缀、运行记录和消息来源识别自动化会话', async () => {
  const { service } = await makeService()
  assert.equal(service.ownsSession('dsh-automation-session-abc'), true)
  assert.equal(service.ownsSession('user-session', [
    { type: 'user/message', data: { source: { kind: 'automation' } } },
  ]), true)
  assert.equal(service.ownsSession('user-session', [
    { type: 'user/message', data: { source: { kind: 'user' } } },
  ]), false)
})

test('创建和立即运行都限制在来源工作区', async () => {
  const { service } = await makeService()
  const created = await service.create({ sessionId: 'session_1', creatorKind: 'web' }, {
    name: '一次性',
    prompt: '跑测试',
    schedule: { kind: 'once', at: '2099-01-01T10:00:00.000Z', timeZone: 'UTC' },
  })
  assert.equal(created.workspaceId, 'ws_1')
  const run = await service.runNow({ sessionId: 'session_1', creatorKind: 'web' }, created.id)
  assert.equal(run.trigger, 'manual')
  await assert.rejects(
    () => service.runNow({ sessionId: 'session_1', creatorKind: 'web' }, created.id),
    /已有排队/,
  )
})


