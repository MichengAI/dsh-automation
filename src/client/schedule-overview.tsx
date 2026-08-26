import { useMemo, useState } from 'react'
import type { Translate } from './contracts.js'
import {
  formatWithin,
  readSortDefault,
  sortAutomations,
  OVERVIEW_SORT_DEFAULT_KEY,
  type AutomationSortDirection,
  type AutomationSortKey,
  type SortPreferenceStorage,
} from './helpers.js'
import type { AutomationViewModel } from './protocol.js'
import { deriveTaskOverviewRows, keepScheduledSessionLink, type ScheduleRunLike, type TaskOverviewRow } from './schedule-rail-model.js'
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

/** 侧栏任务总览：只读列表，有上次会话的任务可点开，其余仅展示。 */
export function ScheduleOverview({
  t,
  automations,
  runs,
  openSession,
  serverNow,
  archived,
  presentIds,
}: {
  readonly t: Translate
  readonly automations: readonly AutomationViewModel[]
  readonly runs: readonly ScheduleRunLike[]
  readonly openSession?: (sessionId: string) => void
  readonly serverNow?: string
  readonly archived?: ReadonlySet<string>
  readonly presentIds?: ReadonlySet<string>
}): JSX.Element {
  const [sortKey, setSortKey] = useState<AutomationSortKey>(() => readSortDefault(SORT_STORAGE, OVERVIEW_SORT_DEFAULT_KEY)?.key ?? 'planned')
  const [sortDirection, setSortDirection] = useState<AutomationSortDirection>(() => readSortDefault(SORT_STORAGE, OVERVIEW_SORT_DEFAULT_KEY)?.direction ?? 'asc')
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

  return (
    <div className="dsh-st-overview">
      <div className="dsh-st-overview-toolbar">
        <SortMenu
          t={t}
          compact
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
        : rows.map(row => <OverviewRow key={row.id} t={t} row={row} now={now} {...(openSession === undefined ? {} : { openSession })} />)}
    </div>
  )
}

function OverviewRow({
  t,
  row,
  now,
  openSession,
}: {
  readonly t: Translate
  readonly row: TaskOverviewRow
  readonly now: Date
  readonly openSession?: (sessionId: string) => void
}): JSX.Element {
  const paused = row.status !== 'active'
  return (
    <button
      type="button"
      className={`dsh-st-overview-row${paused ? ' is-paused' : ''}`}
      disabled={row.lastSessionId === undefined}
      title={paused ? t('status.paused') : t('status.active')}
      onClick={() => { if (row.lastSessionId !== undefined) openSession?.(row.lastSessionId) }}
    >
      <span className="dsh-st-rail-dot" />
      <span className="dsh-st-overview-name">{row.name}</span>
      <span className="dsh-st-overview-time">{row.nextRunAt === undefined ? t('stats.noneScheduled') : formatWithin(row.nextRunAt, now, t)}</span>
    </button>
  )
}
