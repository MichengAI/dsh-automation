import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  shouldConfirmFullAccess,
  shouldCloseCreateModal,
} from '../src/client/create-modal-logic.ts'

test('新建弹窗点遮罩不能关，Esc 只关弹窗', () => {
  assert.equal(shouldCloseCreateModal('backdrop'), false)
  assert.equal(shouldCloseCreateModal('escape'), true)
  assert.equal(shouldCloseCreateModal('cancel'), true)
})

test('任务编辑弹窗使用 Ant Design，点遮罩不能关闭', () => {
  const modal = readFileSync(new URL('../src/client/create-modal.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')

  assert.match(modal, /<Modal/)
  assert.match(modal, /maskClosable=\{false\}/)
  assert.match(modal, /keyboard=\{false\}/)
  assert.match(modal, /event\.stopImmediatePropagation\(\)/)
  assert.match(modal, /onClose\(\)/)
  assert.match(modal, /AntdProvider/)
  assert.doesNotMatch(modal, /dsh-st-modal-close/)
  assert.doesNotMatch(styles, /\.dsh-st-modal\{/)
  assert.doesNotMatch(styles, /\.dsh-st-mask\{/)
})

test('权限选择与 Chat 一致，切换到完全访问时要求风险确认', () => {
  assert.equal(shouldConfirmFullAccess('read-only', 'danger-full-access'), true)
  assert.equal(shouldConfirmFullAccess('workspace-write', 'danger-full-access'), true)
  assert.equal(shouldConfirmFullAccess('danger-full-access', 'danger-full-access'), false)
  assert.equal(shouldConfirmFullAccess('danger-full-access', 'read-only'), false)
})

test('任务模型用分组选择和推理等级选择，不再自绘两层面板', () => {
  const modal = readFileSync(new URL('../src/client/create-modal.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(modal, /models\.reduce/)
  assert.match(modal, /item\?\.reasoning\?\.defaultEffort \?\? 'none'/)
  assert.match(modal, /modelT\('effort\.providerDefault'\)/)
  assert.doesNotMatch(modal, /setPane\('model'\)|setPane\('effort'\)|role="menuitemradio"/)
  assert.doesNotMatch(modal, /form\.modelDefault|跟随默认模型|reasoningEffort: 'high'/)
  assert.doesNotMatch(styles, /\.dsh-st-model-select/)
  assert.doesNotMatch(styles, /\.dsh-st-select-menu/)
})

test('删除任务必须先显示确认对话框', () => {
  const view = readFileSync(new URL('../src/client/AutomationView.tsx', import.meta.url), 'utf8')
  const confirmation = readFileSync(new URL('../src/client/delete-confirmation.tsx', import.meta.url), 'utf8')
  assert.match(view, /setDeleteTarget\(item\)/)
  assert.match(view, /<DeleteConfirmation/)
  assert.match(confirmation, /<Modal/)
  assert.match(confirmation, /danger type="primary"/)
  assert.match(confirmation, /card\.confirmDelete/)
  assert.match(confirmation, /card\.confirmDeleteHint/)
  assert.match(confirmation, /card\.confirm/)
})
