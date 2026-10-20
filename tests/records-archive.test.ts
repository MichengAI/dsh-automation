import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error 与侧栏测试共用真实组件的 Hook harness。
import { createShellHarness, findNode } from './sidebar-shell-harness.mjs'

test('任务组菜单保留任务设置，但不再暴露批量归档入口', () => {
  const shell = createShellHarness()
  const calls: string[] = []
  const snapshot = { phase: 'ready', snapshot: {
    automations: [{ id: 'task', name: '巡检' }],
    runs: [{ automationId: 'task', sessionId: 'a', status: 'succeeded', scheduledFor: '2026-10-20T00:00:00Z' }],
  } }
  const props = {
    openTaskSettings() {},
    runtime: { source: { subscribe: () => () => {}, getSnapshot: () => snapshot } },
    hostProps: { archiveSession: async (id: string) => { calls.push(id) } },
    useWorkspaces: (select: (state: unknown) => unknown) => select({ items: [], archivedSessionIds: [] }),
  }

  const rendered = shell.renderRecords(props)
  const menu = shell.menuOptions()
  assert.deepEqual(menu.resolveTask('dsh-automation-task:task')?.sessionIds, ['a'])
  assert.equal(menu.resolveTask('real-workspace'), undefined)
  assert.equal('archive' in menu, false)
  assert.equal(findNode(rendered, (node: any) => node.type === 'modal'), undefined)
  assert.deepEqual(calls, [])
})
