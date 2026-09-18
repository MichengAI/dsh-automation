import type { CSSProperties } from 'react'
import type { Translate } from './contracts.js'

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

export function relativeTime(value: string, t: Translate, now = Date.now()): string {
  const ts = Date.parse(value || '')
  if (!Number.isFinite(ts)) return ''
  const delta = Math.max(0, now - ts)
  const min = Math.floor(delta / 60000)
  if (min < 1) return t('time.now')
  if (min < 60) return t('time.minuteAgo', { count: min })
  const hour = Math.floor(min / 60)
  if (hour < 24) return t('time.hourAgo', { count: hour })
  return t('time.dayAgo', { count: Math.floor(hour / 24) })
}
