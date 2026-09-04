import { useMemo, useState } from 'react'
import type { Translate } from './contracts.js'
import {
  CalendarIcon,
  ChevronIcon,
} from './icons.js'
import {
  formatWithin,
  formatSchedule,
  readSortDefault,
  sortAutomations,
  OVERVIEW_SORT_DEFAULT_KEY,
  type AutomationSortDirection,
  type AutomationSortKey,
  type SortPreferenceStorage,
} from './helpers.js'
import type { AutomationViewModel } from './protocol.js'
import { automationToggleMutation, deriveTaskOverviewRows, keepScheduledSessionLink, type ScheduleRunLike, type TaskOverviewRow } from './schedule-rail-model.js'
import { SortMenu } from './sort-menu.js'

export type ScheduleView = 'runs' | 'overview'

const EMPTY_SET: ReadonlySet<string> = new Set()
const SORT_STORAGE: SortPreferenceStorage | undefined = typeof window === 'undefined' ? undefined : window.localStorage

export function ScheduleViewSwitch({
  t,
  view,
  onChange,
}: {
  readonly t: Translate
  readonly view: ScheduleView
  readonly onChange: (view: ScheduleView) => void
}): JSX.Element {
  return (
    <div className="dsh-st-rail-views" role="tablist" aria-label={t('sidebar.views')}>
      <button type="button" role="tab" aria-selected={view === 'runs'} className={view === 'runs' ? 'is-on' : undefined} onClick={() => onChange('runs')}>{t('tabs.runs')}</button>
      <button type="button" role="tab" aria-selected={view === 'overview'} className={view === 'overview' ? 'is-on' : undefined} onClick={() => onChange('overview')}>{t('sidebar.viewOverview')}</button>
    </div>
  )
}

/** 侧栏任务总览：任务状态可直接切换，有上次会话的任务可点开执行记录。 */
export function ScheduleOverview({
  t,
  automations,
  runs,
  openSession,
  serverNow,
  archived,
  presentIds,
  onToggleAutomation,
}: {
  readonly t: Translate
  readonly automations: readonly AutomationViewModel[]
  readonly runs: readonly ScheduleRunLike[]
  readonly openSession?: (sessionId: string) => void
  readonly serverNow?: string
  readonly archived?: ReadonlySet<string>
  readonly presentIds?: ReadonlySet<string>
  readonly onToggleAutomation?: (automationId: string, mutation: 'pause' | 'resume') => void | Promise<void>
}): JSX.Element {
  const [sortKey, setSortKey] = useState<AutomationSortKey>(() => readSortDefault(SORT_STORAGE, OVERVIEW_SORT_DEFAULT_KEY)?.key ?? 'planned')
  const [sortDirection, setSortDirection] = useState<AutomationSortDirection>(() => readSortDefault(SORT_STORAGE, OVERVIEW_SORT_DEFAULT_KEY)?.direction ?? 'asc')
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(() => new Set())
  const now = useMemo(() => new Date(serverNow ?? Date.now()), [serverNow])
  const rows = useMemo(() => {
    const sorted = sortAutomations(automations, sortKey, sortDirection)
    return deriveTaskOverviewRows(sorted, runs).map((row) => {
      if (row.lastSessionId === undefined || !keepScheduledSessionLink(row.lastSessionId, archived ?? EMPTY_SET, presentIds)) {
        const { lastSessionId: _dropped, ...rest } = row
        return rest
      }
      return row
    })
  }, [archived, automations, presentIds, runs, sortDirection, sortKey])
  const scheduleSummaries = useMemo(() => new Map(automations.map(item => [item.id, formatSchedule(item.schedule, t)])), [automations, t])

  const toggleAutomation = (automationId: string, mutation: 'pause' | 'resume'): void => {
    if (onToggleAutomation === undefined || busyIds.has(automationId)) return
    setBusyIds(current => new Set(current).add(automationId))
    void Promise.resolve(onToggleAutomation(automationId, mutation))
      .catch((error: unknown) => { console.warn('[dsh-automation] 切换任务状态失败', error) })
      .finally(() => {
        setBusyIds(current => {
          const next = new Set(current)
          next.delete(automationId)
          return next
        })
      })
  }

  return (
    <div className="dsh-st-overview">
      <div className="dsh-st-overview-head">
        <div className="dsh-st-overview-title">
          <strong>{t('sidebar.viewOverview')}</strong>
          <span aria-label={`${rows.length}`}>{rows.length}</span>
        </div>
        <SortMenu
          t={t}
          compact
          iconOnly
          className="dsh-st-overview-sort"
          {...(SORT_STORAGE === undefined ? {} : { storage: SORT_STORAGE })}
          storageKey={OVERVIEW_SORT_DEFAULT_KEY}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSelect={(key, direction) => {
            setSortKey(key)
            setSortDirection(direction)
          }}
        />
      </div>
      {rows.length === 0
        ? <div className="dsh-st-rail-empty">{t('overview.empty')}</div>
        : rows.map(row => <OverviewRow
            key={row.id}
            t={t}
            row={row}
            now={now}
            scheduleSummary={scheduleSummaries.get(row.id) ?? ''}
            toggleDisabled={onToggleAutomation === undefined || busyIds.has(row.id)}
            onToggleAutomation={toggleAutomation}
            {...(openSession === undefined ? {} : { openSession })}
          />)}
    </div>
  )
}

function OverviewRow({
  t,
  row,
  now,
  scheduleSummary,
  openSession,
  toggleDisabled,
  onToggleAutomation,
}: {
  readonly t: Translate
  readonly row: TaskOverviewRow
  readonly now: Date
  readonly scheduleSummary: string
  readonly openSession?: (sessionId: string) => void
  readonly toggleDisabled: boolean
  readonly onToggleAutomation?: (automationId: string, mutation: 'pause' | 'resume') => void
}): JSX.Element {
  const paused = row.status !== 'active'
  const nextRun = row.nextRunAt === undefined ? t('stats.noneScheduled') : formatWithin(row.nextRunAt, now, t)
  const toggleLabel = paused ? t('card.resume') : t('card.pause')
  return (
    <div className={`dsh-st-overview-row${paused ? ' is-paused' : ''}`}>
      <button
        type="button"
        className="dsh-st-overview-open"
        disabled={row.lastSessionId === undefined}
        onClick={() => { if (row.lastSessionId !== undefined) openSession?.(row.lastSessionId) }}
      >
        <span className="dsh-st-overview-copy">
          <span className="dsh-st-overview-name">{row.name}</span>
          {scheduleSummary !== '' && <span className="dsh-st-overview-schedule"><CalendarIcon width={14} height={14} />{scheduleSummary}</span>}
        </span>
        <span className="dsh-st-overview-next"><span>{t('stats.next')}</span><strong>{nextRun}</strong></span>
        {row.lastSessionId !== undefined && <ChevronIcon width={12} height={12} className="dsh-st-overview-chevron" />}
      </button>
      <label className="dsh-st-overview-toggle" title={toggleLabel}>
        <input
          type="checkbox"
          role="switch"
          checked={!paused}
          aria-checked={!paused}
          aria-label={toggleLabel}
          disabled={toggleDisabled}
          onChange={() => { onToggleAutomation?.(row.id, automationToggleMutation(row.status)) }}
        />
        <span aria-hidden="true" />
      </label>
    </div>
  )
}
