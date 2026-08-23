import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  adoptPickedWorkspace,
  shouldConfirmFullAccess,
  shouldCloseCreateModal,
} from '../src/client/create-modal-logic.ts'

test('新建弹窗点遮罩不能关闭，只能取消或 ESC', () => {
  assert.equal(shouldCloseCreateModal('backdrop'), false)
  assert.equal(shouldCloseCreateModal('escape'), true)
  assert.equal(shouldCloseCreateModal('cancel'), true)
})

test('选择完全访问必须先确认，保持完全访问时不重复确认', () => {
  assert.equal(shouldConfirmFullAccess('read-only', 'danger-full-access'), true)
  assert.equal(shouldConfirmFullAccess('workspace-write', 'danger-full-access'), true)
  assert.equal(shouldConfirmFullAccess('danger-full-access', 'danger-full-access'), false)
  assert.equal(shouldConfirmFullAccess('danger-full-access', 'read-only'), false)
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

test('任务模型菜单直接展示官方式分组列表且浮层可点击', () => {
  const modal = readFileSync(new URL('../src/client/create-modal.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(modal, /const modelGroups = Array\.from/)
  assert.match(modal, /role="menuitemradio"/)
  assert.doesNotMatch(modal, /form\.modelDefault|setPane\(|reasoningEffort: 'high'/)
  assert.match(styles, /\.dsh-st-flyout-root \.dsh-st-select-menu,\.dsh-st-flyout-root \.dsh-st-model-select-menu\{pointer-events:auto\}/)
})
