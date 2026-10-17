export type HostIcon = (props: { readonly size?: number; readonly className?: string }) => JSX.Element | null

/** 没有对应导出时返回 undefined，调用方再退回自绘。 */
export function pickHostExport(source: Readonly<Record<string, unknown>>, name: string): unknown {
  const value = source[name]
  return typeof value === 'function' ? value : undefined
}

/** 宿主图标渲染出 null 时改用自绘。 */
export function hostOrFallback(icon: HostIcon, fallback: HostIcon): HostIcon {
  return function HostOrFallback(props) {
    return icon(props) ?? fallback(props)
  }
}

export function pickHostIcon(source: Readonly<Record<string, unknown>>, ...names: readonly string[]): HostIcon {
  for (const name of names) {
    const icon = source[name]
    if (typeof icon === 'function') return icon as HostIcon
  }
  return function MissingHostIcon() {
    return null
  }
}
