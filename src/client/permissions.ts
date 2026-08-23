import type { PermissionOption } from './protocol.js'

export type PermissionTranslate = (key: string, params?: Record<string, unknown>) => string

const BUILT_IN_PERMISSION_LABELS = new Map<string, readonly [string, string]>([
  ['read-only', ['preset.readOnly', 'Read Only']],
  ['workspace-write', ['preset.workspaceWrite', 'Workspace Write']],
  ['danger-full-access', ['preset.fullAccess', 'Full access']],
])

/** 与 Chat 一致：只本地化官方内置原名，自定义预设保留 Host 提供的名称。 */
export function permissionLabel(option: PermissionOption, t: PermissionTranslate): string {
  const builtIn = BUILT_IN_PERMISSION_LABELS.get(option.value)
  if (builtIn !== undefined && (option.name === option.value || option.name === builtIn[1])) {
    return t(builtIn[0])
  }
  return option.name || option.value
}
