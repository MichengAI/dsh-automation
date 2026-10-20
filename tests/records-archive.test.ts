import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error 与侧栏测试共用真实组件的 Hook harness。
import { createShellHarness, findNode } from './sidebar-shell-harness.mjs'

function recordsHarness(fail = false) {
  const shell = createShellHarness()
  const calls: string[] = []
  const snapshot = { phase: 'ready', snapshot: {
    automations: [{ id: 'task', name: '巡检' }],
    runs: [{ automationId: 'task', sessionId: 'a', status: 'succeeded', scheduledFor: '2026-10-20T00:00:00Z' }],
  } }
  const props = {
    openTaskSettings() {},
    runtime: { source: { subscribe: () => () => {}, getSnapshot: () => snapshot } },
    hostProps: { archiveSession: async (id: string) => {
      calls.push(id)
      if (fail) throw new Error('归档失败')
    } },
    useWorkspaces: (select: (state: unknown) => unknown) => select({ items: [], archivedSessionIds: [] }),
  }
  const render = () => shell.renderRecords(props)
  render()
  const menu = shell.menuOptions()
  const task = menu.resolveTask('dsh-automation-task:task')
  assert.deepEqual(task.sessionIds, ['a'])
  assert.equal(menu.resolveTask('real-workspace'), undefined)
  menu.archive.request(task)
  return { render, calls, snapshot }
}

test('任务组归档须先确认，取消时不调用宿主', () => {
  const h = recordsHarness()
  const modal = findNode(h.render(), (node: any) => node.type === 'modal')
  assert.equal(modal.props.open, true)
  modal.props.onClose()
  assert.equal(findNode(h.render(), (node: any) => node.type === 'modal').props.open, false)
  assert.deepEqual(h.calls, [])
})

test('确认时重新解析真实成员，重复点击只执行一次，成功后关闭弹窗', async () => {
  const h = recordsHarness()
  h.snapshot.snapshot.runs.push({ automationId: 'task', sessionId: 'b', status: 'succeeded', scheduledFor: '2026-10-20T01:00:00Z' })
  const modal = findNode(h.render(), (node: any) => node.type === 'modal')
  const confirm = modal.props.footer.props.children[1]
  confirm.props.onClick()
  confirm.props.onClick()
  const busyModal = findNode(h.render(), (node: any) => node.type === 'modal')
  assert.equal(busyModal.props.footer.props.children[1].props.disabled, true)
  busyModal.props.onClose()
  assert.equal(findNode(h.render(), (node: any) => node.type === 'modal').props.open, true)
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(h.calls, ['b', 'a'])
  assert.equal(findNode(h.render(), (node: any) => node.type === 'modal').props.open, false)
})

test('宿主归档失败时保留确认弹窗并展示错误', async () => {
  const h = recordsHarness(true)
  const modal = findNode(h.render(), (node: any) => node.type === 'modal')
  modal.props.footer.props.children[1].props.onClick()
  await new Promise(resolve => setImmediate(resolve))
  const result = h.render()
  assert.equal(findNode(result, (node: any) => node.type === 'modal').props.open, true)
  assert.equal(findNode(result, (node: any) => node.props?.role === 'alert').props.children, '归档失败')
})
