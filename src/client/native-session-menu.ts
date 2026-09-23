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

export interface SessionHoverStatus {
  readonly state: 'ongoing' | 'warning' | 'done' | 'idle' | 'archived'
  readonly label: string
  readonly trailing?: string
}

/** 对齐官方 SessionHoverContent：待处理优先，其次运行和子代理，完成只在未读时出现；已归档不再重复空闲或完成。 */
export function scheduledSessionHoverStatuses(input: {
  readonly running: boolean
  readonly archived: boolean
  readonly pendingKind?: string
  readonly runningSubagentCount?: number
  readonly completed?: boolean
}, t: Translate): SessionHoverStatus[] {
  const count = input.runningSubagentCount ?? 0
  const subagents: SessionHoverStatus | undefined = count === 0
    ? undefined
    : { state: 'ongoing', label: t('session.subagentsRunning', { count }) }
  let pending: SessionHoverStatus | undefined
  if (input.pendingKind === 'approval') pending = { state: 'warning', label: t('session.waitingApproval'), trailing: t('session.compactApproval') }
  else if (input.pendingKind === 'plan-review') pending = { state: 'warning', label: t('session.planReview'), trailing: t('session.compactPlan') }
  else if (input.pendingKind === 'question') pending = { state: 'warning', label: t('session.waitingAnswer'), trailing: t('session.compactAnswer') }
  let statuses: SessionHoverStatus[]
  if (pending !== undefined) statuses = subagents === undefined ? [pending] : [pending, subagents]
  else if (input.running) statuses = subagents === undefined ? [{ state: 'ongoing', label: t('session.runningStatus') }] : [{ state: 'ongoing', label: t('session.runningStatus') }, subagents]
  else if (subagents !== undefined) statuses = [subagents]
  else if (input.completed === true) statuses = [{ state: 'done', label: t('session.completed') }]
  else statuses = [{ state: 'idle', label: t('session.idle') }]
  const visible = statuses.filter((status) => !(input.archived && (status.state === 'done' || status.state === 'idle')))
  if (input.archived) visible.push({ state: 'archived', label: t('session.archived') })
  return visible
}

function sessionAge(value: string, now: number): { readonly unit: 'now' | 'minutes' | 'hours' | 'days' | 'months' | 'years'; readonly count: number } | undefined {
  const ts = Date.parse(value || '')
  if (!Number.isFinite(ts)) return undefined
  const minMs = 6e4
  const hourMs = 36e5
  const dayMs = 864e5
  const diff = Math.max(0, now - ts)
  if (diff < minMs) return { unit: 'now', count: 0 }
  if (diff < hourMs) return { unit: 'minutes', count: Math.floor(diff / minMs) }
  if (diff < dayMs) return { unit: 'hours', count: Math.floor(diff / hourMs) }
  if (diff < 30 * dayMs) return { unit: 'days', count: Math.floor(diff / dayMs) }
  if (diff < 365 * dayMs) return { unit: 'months', count: Math.floor(diff / (30 * dayMs)) }
  return { unit: 'years', count: Math.floor(diff / (365 * dayMs)) }
}

function ageText(age: { readonly unit: 'now' | 'minutes' | 'hours' | 'days' | 'months' | 'years'; readonly count: number }, t: Translate): string {
  if (age.unit === 'now') return t('time.now')
  if (age.unit === 'minutes') return t('time.minutes', { count: age.count })
  if (age.unit === 'hours') return t('time.hours', { count: age.count })
  if (age.unit === 'days') return t('time.days', { count: age.count })
  if (age.unit === 'months') return t('time.months', { count: age.count })
  return t('time.years', { count: age.count })
}

/** 0.1.7 会话标题在悬停时匀速滚到末尾，并交给样式做两端淡出。 */
export function placeSessionTitle(title: HTMLElement, left: number, range: number): void {
  title.scrollLeft = left
  if (left > 0) title.dataset.scrolled = ''
  else delete title.dataset.scrolled
  if (left < range) title.dataset.clipped = ''
  else delete title.dataset.clipped
}

export function restSessionTitle(title: HTMLElement): void {
  title.scrollLeft = 0
  delete title.dataset.scrolled
  delete title.dataset.clipped
}

export function startSessionTitleMarquee(title: HTMLElement | null, frame: { id: number }): void {
  if (title === null) return
  const range = title.scrollWidth - title.clientWidth
  if (range <= 8) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    placeSessionTitle(title, range, range)
    return
  }
  cancelAnimationFrame(frame.id)
  let previous: number | undefined
  let position = 0
  const step = (now: number): void => {
    position += previous === undefined ? 0 : (now - previous) * 0.03
    previous = now
    placeSessionTitle(title, Math.min(position, range), range)
    if (position < range) frame.id = requestAnimationFrame(step)
  }
  frame.id = requestAnimationFrame(step)
}

export function stopSessionTitleMarquee(title: HTMLElement | null, frame: { id: number }): void {
  cancelAnimationFrame(frame.id)
  if (title !== null) restSessionTitle(title)
}

/** 行内时间不带「前」，和官方 timeLabel 一样。 */
export function sessionRowTime(value: string, t: Translate, now = Date.now()): string {
  const age = sessionAge(value, now)
  return age === undefined ? '' : ageText(age, t)
}

/** 悬停卡用官方 hoverTimeLabel：刚刚保持原样，其余套「前」。 */
export function sessionHoverTime(value: string, t: Translate, now = Date.now()): string {
  const age = sessionAge(value, now)
  if (age === undefined) return ''
  if (age.unit === 'now') return t('time.now')
  return t('time.ago', { text: ageText(age, t) })
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
