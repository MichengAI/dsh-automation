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

test('任务编辑弹窗使用宿主浮层背景和统一关闭图标', () => {
  const modal = readFileSync(new URL('../src/client/create-modal.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')

  assert.match(styles, /\.dsh-st-mask\{[^}]*background:var\(--dsw-alias-bg-mask-1\);[^}]*backdrop-filter:var\(--dsw-mask-blur\)/)
  assert.match(styles, /\.dsh-st-modal\{[^}]*border:0;[^}]*border-radius:24px;[^}]*background:var\(--dsw-alias-bg-layer-2\);[^}]*box-shadow:var\(--dsw-elevation-prominent\)/)
  assert.match(styles, /\.dsh-st-modal-close\{[^}]*width:28px;[^}]*height:28px;[^}]*border:0;[^}]*border-radius:8px;[^}]*background:transparent/)
  assert.match(modal, /<button type="button" className="dsh-st-modal-close"[^>]*><CloseOutlineIcon width=\{14\} height=\{14\} \/><\/button>/)
  assert.doesNotMatch(modal, />×<\/button>/)
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

test('任务下拉菜单使用宿主主题颜色，浅色主题下保持文字可读', () => {
  const styles = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(styles, /\.dsh-st-select-menu\{[^}]*background:var\(--dsw-specific-menu,var\(--dsw-alias-bg-base\)\)/)
  assert.doesNotMatch(styles, /\.dsh-st-select-menu\{[^}]*background:#2a2c31/)
})

test('删除任务必须先显示确认对话框', () => {
  const view = readFileSync(new URL('../src/client/AutomationView.tsx', import.meta.url), 'utf8')
  const confirmation = readFileSync(new URL('../src/client/delete-confirmation.tsx', import.meta.url), 'utf8')
  assert.match(view, /setDeleteTarget\(item\)/)
  assert.match(view, /<DeleteConfirmation/)
  assert.match(confirmation, /role="alertdialog"/)
  assert.match(confirmation, /card\.confirmDelete/)
  assert.match(confirmation, /card\.confirmDeleteHint/)
  assert.match(confirmation, /card\.confirm/)
})
