import assert from 'node:assert/strict'
import test from 'node:test'
import { applyUnattendedPermission, pinAutomationSessionTitle, readSessionEvents, settlesWithin, summarizeRun, unattendedToolGuardReason } from '../src/executor.ts'

test('无人值守运行通过官方服务应用完整权限预设', () => {
  const selected: string[] = []
  applyUnattendedPermission({
    names: ['read-only', 'workspace-write', 'danger-full-access'],
    defaultPreset: 'workspace-write',
    optionOf: value => ({ value, name: value }),
    set: (_session, value) => { selected.push(value) },
  }, {}, 'danger-full-access')
  assert.deepEqual(selected, ['danger-full-access'])
})

test('无人值守守卫拒绝未知工具和后台 shell', () => {
  assert.equal(unattendedToolGuardReason('read', {}), undefined)
  assert.equal(unattendedToolGuardReason('automation_create', {}), "工具 'automation_create' 不在无人值守自动化允许列表中。")
  assert.match(unattendedToolGuardReason('bash', { run_in_background: true }) ?? '', /后台进程/)
})

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

