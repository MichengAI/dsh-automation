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

export type NativeSessionMenuState = {
  readonly id: string
  readonly x: number
  readonly y: number
} | null

export function pointerPoint(event: { readonly clientX?: unknown; readonly clientY?: unknown } | null | undefined): { x: number; y: number } {
  const x = Number(event?.clientX)
  const y = Number(event?.clientY)
  return {
    x: Number.isFinite(x) ? x : 8,
    y: Number.isFinite(y) ? y : 8,
  }
}

export function clampMenuPoint(
  x: number,
  y: number,
  width: number,
  height: number,
  viewport: { readonly width: number; readonly height: number },
): { x: number; y: number } {
  const pad = 8
  const vw = viewport.width || width + pad * 2
  const vh = viewport.height || height + pad * 2
  return {
    x: Math.max(pad, Math.min(x, Math.max(pad, vw - width - pad))),
    y: Math.max(pad, Math.min(y, Math.max(pad, vh - height - pad))),
  }
}

export function nextOpenSessionMenu(
  current: NativeSessionMenuState,
  clicked: string,
  point: { readonly x: number; readonly y: number },
): NativeSessionMenuState {
  if (current?.id === clicked) return null
  return { id: clicked, x: point.x, y: point.y }
}

/** 和 IM 一样：菜单出现在指针处，再用真实尺寸限制在视口内。 */
export function nativeSessionMenuStyle(
  point: { readonly x: number; readonly y: number },
  size: { readonly width: number; readonly height: number } = { width: 218, height: 176 },
  viewport: { readonly width: number; readonly height: number } = { width: 1000, height: 800 },
): CSSProperties {
  const pos = clampMenuPoint(point.x, point.y, size.width, size.height, viewport)
  return {
    position: 'fixed',
    zIndex: 4000,
    left: `${Math.round(pos.x)}px`,
    top: `${Math.round(pos.y)}px`,
  }
}

export function nativeSessionHoverStyle(
  row: { readonly right: number; readonly top: number },
  card: { readonly width: number; readonly height: number },
  viewport: { readonly width: number; readonly height: number },
): CSSProperties {
  const pad = 8
  const left = row.right + pad
  const top = row.top + card.height > viewport.height - pad
    ? Math.max(pad, viewport.height - card.height - pad)
    : Math.max(pad, row.top)
  return {
    position: 'fixed',
    zIndex: 4100,
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  }
}

export function relativeTime(value: string): string {
  const ts = Date.parse(value || '')
  if (!Number.isFinite(ts)) return ''
  const delta = Math.max(0, Date.now() - ts)
  const min = Math.floor(delta / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return String(min) + '分钟前'
  const hour = Math.floor(min / 60)
  if (hour < 24) return String(hour) + '小时前'
  return String(Math.floor(hour / 24)) + '天前'
}

