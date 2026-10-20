import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error 与侧栏测试共用真实组件的 Hook harness。
import { createShellHarness, findNode } from './sidebar-shell-harness.mjs'

test('任务组菜单只为合成任务组提供任务设置，真实工作区不注入', () => {
  const shell = createShellHarness()
  const opened: { automationId: string; name: string; sessionIds: string[] }[] = []
  const snapshot = { phase: 'ready', snapshot: {
    automations: [{ id: 'task', name: '巡检' }],
    runs: [
      { automationId: 'task', sessionId: 'a', status: 'succeeded', scheduledFor: '2026-10-20T00:00:00Z' },
      { automationId: 'task', sessionId: 'b', status: 'failed', scheduledFor: '2026-10-19T00:00:00Z' },
    ],
  } }
  const props = {
    openTaskSettings: (request: { automationId: string; name: string; sessionIds: string[] }) => { opened.push(request) },
    runtime: { source: { subscribe: () => () => {}, getSnapshot: () => snapshot } },
    useWorkspaces: (select: (state: unknown) => unknown) => select({ items: [], archivedSessionIds: [] }),
  }

  shell.renderRecords(props)
  const menu = shell.menuOptions()
  const task = menu.resolveTask('dsh-automation-task:task')
  assert.equal(task?.name, '巡检')
  assert.deepEqual(task?.sessionIds, ['a', 'b'])
  // 真实工作区不归本插件管，注入器必须拒绝处理。
  assert.equal(menu.resolveTask('real-workspace'), undefined)
  // 批量归档入口已移除：注入选项里不应再出现 archive 字段。
  assert.equal('archive' in menu, false)

  menu.openTaskSettings({ automationId: 'task', name: '巡检', sessionIds: ['a', 'b'] })
  assert.deepEqual(opened, [{ automationId: 'task', name: '巡检', sessionIds: ['a', 'b'] }])
})

test('合成任务组用任务定义创建时间排序，任务已删除时才退回最早执行时间', () => {
  const shell = createShellHarness()
  const snapshot = { phase: 'ready', snapshot: {
    automations: [{ id: 'task', name: '巡检', createdAt: '2026-05-01T00:00:00.000Z' }],
    runs: [
      { automationId: 'task', sessionId: 'a', status: 'succeeded', scheduledFor: '2026-10-20T00:00:00.000Z' },
      // 任务定义已不在快照里，只剩执行记录：用最早一次执行时间兜底，而不是 1970。
      { automationId: 'gone', sessionId: 'b', status: 'failed', scheduledFor: '2026-07-02T00:00:00.000Z' },
      { automationId: 'gone', sessionId: 'c', status: 'succeeded', scheduledFor: '2026-08-02T00:00:00.000Z' },
    ],
  } }
  const Official = (): null => null
  const rendered = shell.renderRecords({
    runtime: { source: { subscribe: () => () => {}, getSnapshot: () => snapshot } },
    officialTree: Official,
    useWorkspaces: (select: (state: unknown) => unknown) => select({ items: [], archivedSessionIds: [] }),
    useSessions: (select: (state: unknown) => unknown) => select({ ids: [], byId: {} }),
  })
  const captured = findNode(rendered, (node: any) => node.type === Official).props
  const groups = captured.useWorkspaces((state: any) => state).items
  assert.deepEqual(groups.map((item: any) => item.workspaceId), ['dsh-automation-task:task', 'dsh-automation-task:gone'])
  assert.equal(groups[0].createdAt, '2026-05-01T00:00:00.000Z')
  assert.equal(groups[1].createdAt, '2026-07-02T00:00:00.000Z')
  for (const group of groups) assert.notEqual(Date.parse(group.createdAt), 0)
})
