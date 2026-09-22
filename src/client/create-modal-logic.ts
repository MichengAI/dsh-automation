import type { AutomationPermission } from './protocol.js'

/** 新建/编辑弹窗点遮罩不关。Esc 只关这一层弹窗，不能继续冒泡把设置页关掉。 */
export function shouldCloseCreateModal(reason: 'backdrop' | 'escape' | 'cancel'): boolean {
  return reason !== 'backdrop'
}

/** 与 Chat 一致：从其他权限切换到完全访问时显示风险确认。 */
export function shouldConfirmFullAccess(current: AutomationPermission, next: AutomationPermission): boolean {
  return current !== next && next === 'danger-full-access'
}
