import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  shouldConfirmFullAccess,
  shouldCloseCreateModal,
} from '../src/client/create-modal-logic.ts'

test('新建弹窗点遮罩不能关闭，只能取消或 ESC', () => {
  assert.equal(shouldCloseCreateModal('backdrop'), false)
  assert.equal(shouldCloseCreateModal('escape'), true)
  assert.equal(shouldCloseCreateModal('cancel'), true)
})

test('权限选择与 Chat 一致，切换到完全访问时要求风险确认', () => {
  assert.equal(shouldConfirmFullAccess('read-only', 'danger-full-access'), true)
  assert.equal(shouldConfirmFullAccess('workspace-write', 'danger-full-access'), true)
  assert.equal(shouldConfirmFullAccess('danger-full-access', 'danger-full-access'), false)
  assert.equal(shouldConfirmFullAccess('danger-full-access', 'read-only'), false)
})

test('任务模型菜单复刻官方两层模型与推理等级菜单且浮层可点击', () => {
  const modal = readFileSync(new URL('../src/client/create-modal.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(modal, /const modelGroups = Array\.from/)
  assert.match(modal, /setPane\('model'\)/)
  assert.match(modal, /setPane\('effort'\)/)
  assert.match(modal, /modelT\('menu\.model'\)/)
  assert.match(modal, /modelT\('menu\.effort'\)/)
  assert.match(modal, /item\.reasoning\?\.defaultEffort \?\? 'none'/)
  assert.match(modal, /role="menuitemradio"/)
  assert.doesNotMatch(modal, /form\.modelDefault|跟随默认模型|reasoningEffort: 'high'/)
  assert.match(styles, /\.dsh-st-flyout-root \.dsh-st-select-menu,\.dsh-st-flyout-root \.dsh-st-model-select-menu\{pointer-events:auto\}/)
})
