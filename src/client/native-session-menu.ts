import type { CSSProperties } from 'react'

/** 把点击目标收成元素节点，避免标题文本节点没有 closest 导致关闭逻辑中断。 */
export function resolveEventElement(target: unknown): object | null {
  if (target == null || typeof target !== 'object') return null
  const node = target as { nodeType?: number; parentElement?: unknown }
  if (node.nodeType === 3 || node.nodeType === 8) {
    return (node.parentElement as object | null) ?? null
  }
  return node
}

/** 点击不在当前行或当前菜单内时，应关闭已打开的菜单。 */
export function shouldCloseNativeSessionMenu(target: unknown, keepInside: readonly unknown[]): boolean {
  const el = resolveEventElement(target)
  if (el == null) return true
  return !keepInside.some((root) => {
    if (root == null || typeof root !== 'object') return false
    if (root === el) return true
    const box = root as { contains?: (other: unknown) => boolean }
    return typeof box.contains === 'function' && box.contains(el)
  })
}

/** 侧栏同一时间只保留一条会话菜单。再点同一条则关闭。 */
export function nextOpenSessionMenuId(current: string | null, clicked: string): string | null {
  return current === clicked ? null : clicked
}

/** 用视口坐标固定菜单，避免被侧栏 overflow 裁切后叠到下一条会话上。 */
export function nativeSessionMenuStyle(
  box: { readonly bottom: number; readonly right: number },
  viewportWidth: number,
): CSSProperties {
  return {
    position: 'fixed',
    zIndex: 1200,
    top: `${Math.round(box.bottom + 4)}px`,
    right: `${Math.max(8, Math.round(viewportWidth - box.right))}px`,
  }
}

export function relativeTime(value: string): string {
  const ts = Date.parse(value || '')
  if (!Number.isFinite(ts)) return ''
  const delta = Math.max(0, Date.now() - ts)
  const min = Math.floor(delta / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return String(min) + '分钟'
  const hour = Math.floor(min / 60)
  if (hour < 24) return String(hour) + '小时'
  return String(Math.floor(hour / 24)) + '天'
}