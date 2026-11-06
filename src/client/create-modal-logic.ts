import type { AutomationPermission } from './protocol.js'

/** 新建/编辑弹窗点遮罩不关。Esc 只关这一层弹窗，不能继续冒泡把设置页关掉。 */
export function shouldCloseCreateModal(reason: 'backdrop' | 'escape' | 'cancel'): boolean {
  return reason !== 'backdrop'
}

/** 与 Chat 一致：从其他权限切换到完全访问时显示风险确认。 */
export function shouldConfirmFullAccess(current: AutomationPermission, next: AutomationPermission): boolean {
  return current !== next && next === 'danger-full-access'
}

export interface PresetGuardInput {
  /** 编辑已有任务时不受名册影响。 */
  readonly editing?: boolean | undefined
  /** 快照是否真的带回了预设字段；旧服务端快照没有这两个字段。 */
  readonly loaded: boolean
  readonly presets: number
  readonly defaultPreset: string
  readonly selected: string
}

export interface PresetGuard {
  /** 宿主声明零预设，无法创建。 */
  readonly missing: boolean
  /** 宿主有预设但没有默认值，必须显式选择。 */
  readonly required: boolean
}

/** 把「零预设」「有预设但未选」「旧快照」分开，避免混合版本永久禁用创建。 */
export function resolvePresetGuard(input: PresetGuardInput): PresetGuard {
  if (input.editing === true || !input.loaded) return { missing: false, required: false }
  if (input.presets === 0 && input.defaultPreset === '') return { missing: true, required: false }
  if (input.presets > 0 && input.selected === '') return { missing: false, required: true }
  return { missing: false, required: false }
}
