/** Host 官方权限预设服务的最小结构契约。 */

export interface PermissionOption {
  readonly value: string
  readonly name: string
  readonly description?: string
}

export interface PermissionPresetService {
  readonly names: readonly string[]
  readonly defaultPreset: string
  optionOf(name: string): PermissionOption
  resolve?(name: string): {
    readonly sandbox: 'read-only' | 'workspace-write' | 'danger-full-access'
    readonly approval: 'ask' | 'never'
  }
  set(session: unknown, name: string): void
}

/** 兼容旧版插件曾保存的 full-access 名称，其余值必须来自 Host 当前列表。 */
export function normalizePermissionPreset(
  input: unknown,
  names: readonly string[],
): string | undefined {
  if (typeof input !== 'string') return undefined
  const raw = input.trim()
  if (raw === '') return undefined
  const value = raw === 'full-access' ? 'danger-full-access' : raw
  return names.includes(value) ? value : undefined
}

/** 无人值守任务禁止完全文件系统访问；自定义预设也按其真实 sandbox 语义判断。 */
export function isUnattendedPermissionSafe(
  name: string,
  presets: PermissionPresetService,
): boolean {
  const normalized = normalizePermissionPreset(name, presets.names)
  if (normalized === undefined) return false
  const sandbox = presets.resolve?.(normalized).sandbox
  return (sandbox ?? normalized) !== 'danger-full-access'
}
