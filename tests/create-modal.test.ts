import assert from 'node:assert/strict'
import test from 'node:test'
import {
  adoptPickedWorkspace,
  shouldCloseCreateModal,
} from '../src/client/create-modal-logic.ts'

test('新建弹窗点遮罩不能关闭，只能取消或 ESC', () => {
  assert.equal(shouldCloseCreateModal('backdrop'), false)
  assert.equal(shouldCloseCreateModal('escape'), true)
  assert.equal(shouldCloseCreateModal('cancel'), true)
})

test('添加工作区走选择器，取消选择时不登记', async () => {
  const added: string[] = []
  const id = await adoptPickedWorkspace({
    pick: async () => null,
    add: async (path) => {
      added.push(path)
      return 'ws_new'
    },
  })
  assert.equal(id, null)
  assert.deepEqual(added, [])
})

test('添加工作区选中目录后才登记，不接受手输路径', async () => {
  const added: string[] = []
  const id = await adoptPickedWorkspace({
    pick: async () => 'D:\\work\\project',
    add: async (path) => {
      added.push(path)
      return 'ws_picked'
    },
  })
  assert.equal(id, 'ws_picked')
  assert.deepEqual(added, ['D:\\work\\project'])
})
