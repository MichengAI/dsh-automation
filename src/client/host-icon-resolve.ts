import type { CSSProperties } from 'react'

export type HostIcon = (props: { readonly size?: number; readonly className?: string; readonly style?: CSSProperties }) => JSX.Element | null

export function pickHostIcon(source: Readonly<Record<string, unknown>>, ...names: readonly string[]): HostIcon {
  for (const name of names) {
    const icon = source[name]
    if (typeof icon === 'function') return icon as HostIcon
  }
  throw new Error(`Missing host icon export: ${names.join(', ')}`)
}
