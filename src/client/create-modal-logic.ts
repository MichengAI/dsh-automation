import type { AutomationPermission } from './protocol.js'

/** 新建/编辑弹窗只允许取消或 ESC 关闭，点旁边不能关。 */
export function shouldCloseCreateModal(reason: 'backdrop' | 'escape' | 'cancel'): boolean {
  return reason !== 'backdrop'
}

/** 只有从非完全访问切换到完全访问时才需要风险确认。 */
export function shouldConfirmFullAccess(current: AutomationPermission, next: AutomationPermission): boolean {
  return current !== next && next === 'danger-full-access'
}

/** 和 Chat 一样：先选目录，取消则不登记；没有手输路径这条路。 */
export async function adoptPickedWorkspace(input: {
  readonly pick: () => Promise<string | null>
  readonly add: (path: string) => Promise<string>
}): Promise<string | null> {
  const path = await input.pick()
  if (path == null || path.trim() === '') return null
  return input.add(path.trim())
}
