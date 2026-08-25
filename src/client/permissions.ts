import type { PermissionOption } from './protocol.js'

export type PermissionLocaleKey = 'permission.readOnly' | 'permission.workspaceWrite' | 'permission.fullAccess'
export type PermissionLabelTranslate = (key: PermissionLocaleKey, params?: Record<string, unknown>) => string
export type PermissionTranslate = (key: string, params?: Record<string, unknown>) => string

const BUILT_IN_PERMISSION_LABELS = new Map<string, readonly [PermissionLocaleKey, string]>([
  ['read-only', ['permission.readOnly', 'Read Only']],
  ['workspace-write', ['permission.workspaceWrite', 'Workspace Write']],
  ['danger-full-access', ['permission.fullAccess', 'Full access']],
])

/** 与 Chat 一致：只本地化官方内置原名，自定义预设保留 Host 提供的名称。 */
export function permissionLabel(option: PermissionOption, t: PermissionLabelTranslate): string {
  const builtIn = BUILT_IN_PERMISSION_LABELS.get(option.value)
  if (builtIn !== undefined && (option.name === option.value || option.name === builtIn[1])) {
    return t(builtIn[0])
  }
  return option.name || option.value
}
