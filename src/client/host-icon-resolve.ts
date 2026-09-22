export type HostIcon = (props: { readonly size?: number; readonly className?: string }) => JSX.Element | null

/** 0.1.7 把尺寸从组件名里拿掉了。旧宿主仍导出带尺寸的名字，缺哪个就用另一个。 */
/** 旧宿主没有这个导出时返回 undefined，调用方再退回自绘。 */
export function pickHostExport(source: Readonly<Record<string, unknown>>, name: string): unknown {
  const value = source[name]
  return typeof value === 'function' ? value : undefined
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
