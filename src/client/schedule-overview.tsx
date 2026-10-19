import { useMemo, useState } from 'react'
import type { Translate } from './contracts.js'
import {
  formatRelativeTime,
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
import { automationToggleMutation, deriveTaskOverviewRows, type TaskOverviewRow } from './schedule-rail-model.js'
import { SegmentedTabs, Switch, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  IconClockOutline,
  IconCloseFill,
  IconFlatListOutline,
  IconProjectAddOutline,
  IconSearchOutline,
  IconWorkspaceTreeOutline,
} from './host-icons.js'
import { SortMenu } from './sort-menu.js'
import type { AutomationTaskSettingsRequest } from './task-settings-request.js'

export type ScheduleView = 'runs' | 'overview'

/**
 * 视图切换页签与内容面板共用的面板 id。
 * 执行记录与任务总览同一时刻只渲染一个面板，所有页签的 `aria-controls` 都指向它，
 * 避免未挂载面板造成悬空引用；调用方渲染面板时必须带上 `id` 与 `role="tabpanel"`。
 */
export const SCHEDULE_VIEW_PANEL_ID = 'dsh-st-rail-panel'

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
    <SegmentedTabs
      className="dsh-st-rail-views"
      label={t('sidebar.views')}
      value={view}
      items={[
        {
          value: 'runs' as const,
          id: 'dsh-st-rail-view-runs',
          panelId: SCHEDULE_VIEW_PANEL_ID,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <IconFlatListOutline size={14} />
              <span>{t('sidebar.runsTab')}</span>
            </span>
          ),
        },
        {
          value: 'overview' as const,
          id: 'dsh-st-rail-view-overview',
          panelId: SCHEDULE_VIEW_PANEL_ID,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <IconWorkspaceTreeOutline size={14} />
              <span>{t('sidebar.overviewTab')}</span>
            </span>
          ),
        },
      ]}
      onChange={onChange}
    />
  )
}

/** 侧栏任务总览：点击卡片打开任务设置，右上角开关直接切换任务状态。 */
export function ScheduleOverview({
  t,
  automations,
  serverNow,
  openTaskSettings,
  openCreateTask,
  onToggleAutomation,
}: {
  readonly t: Translate
  readonly automations: readonly AutomationViewModel[]
  readonly serverNow?: string
  readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void
  readonly openCreateTask?: () => void
  readonly onToggleAutomation?: (automationId: string, mutation: 'pause' | 'resume') => void | Promise<void>
}): JSX.Element {
  const [sortKey, setSortKey] = useState<AutomationSortKey>(() => readSortDefault(SORT_STORAGE, OVERVIEW_SORT_DEFAULT_KEY)?.key ?? 'planned')
  const [sortDirection, setSortDirection] = useState<AutomationSortDirection>(() => readSortDefault(SORT_STORAGE, OVERVIEW_SORT_DEFAULT_KEY)?.direction ?? 'asc')
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const now = useMemo(() => new Date(serverNow ?? Date.now()), [serverNow])
  const rows = useMemo(() => {
    const sorted = sortAutomations(automations, sortKey, sortDirection)
    return deriveTaskOverviewRows(sorted)
  }, [automations, sortDirection, sortKey])
  const normalizedQuery = query.trim().toLowerCase()
  const visibleRows = normalizedQuery === ''
    ? rows
    : rows.filter(row => row.name.toLowerCase().includes(normalizedQuery))
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
          <span aria-label={`${visibleRows.length}`}>{visibleRows.length}</span>
        </div>
        <div className="dsh-st-overview-actions">
          <Tooltip label={searchOpen ? t('sidebar.clearSearch') : t('sidebar.search')} side="bottom" delayMs={500}>
            <button
              type="button"
              className={searchOpen ? 'dsh-st-n-head-btn is-on' : 'dsh-st-n-head-btn'}
              aria-label={searchOpen ? t('sidebar.clearSearch') : t('sidebar.search')}
              aria-expanded={searchOpen}
              onClick={() => {
                if (searchOpen) setQuery('')
                setSearchOpen(open => !open)
              }}
            >
              {searchOpen ? <IconCloseFill size={12} /> : <IconSearchOutline size={14} />}
            </button>
          </Tooltip>
          <SortMenu
            t={t}
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
          {openCreateTask === undefined ? null : (
            <Tooltip label={t('action.create')} side="bottom" delayMs={500}>
              <button
                type="button"
                className="dsh-st-n-head-btn"
                aria-label={t('action.create')}
                onClick={openCreateTask}
              >
                <IconProjectAddOutline size={16} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      {searchOpen ? (
        <div className="dsh-st-overview-search">
          <IconSearchOutline size={11} />
          <input
            autoFocus
            value={query}
            aria-label={t('search.placeholder')}
            placeholder={t('search.placeholder')}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query === '' ? null : (
            <button type="button" aria-label={t('sidebar.clearSearch')} onClick={() => setQuery('')}>
              <IconCloseFill size={12} />
            </button>
          )}
        </div>
      ) : null}
      {visibleRows.length === 0
        ? <div className="dsh-st-rail-empty">{t('overview.empty')}</div>
        : visibleRows.map(row => <OverviewRow
            key={row.id}
            t={t}
            row={row}
            now={now}
            scheduleSummary={scheduleSummaries.get(row.id) ?? ''}
            toggleDisabled={onToggleAutomation === undefined || busyIds.has(row.id)}
            onToggleAutomation={toggleAutomation}
            {...(openTaskSettings === undefined ? {} : { openTaskSettings })}
          />)}
    </div>
  )
}

function OverviewRow({
  t,
  row,
  now,
  scheduleSummary,
  openTaskSettings,
  toggleDisabled,
  onToggleAutomation,
}: {
  readonly t: Translate
  readonly row: TaskOverviewRow
  readonly now: Date
  readonly scheduleSummary: string
  readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void
  readonly toggleDisabled: boolean
  readonly onToggleAutomation?: (automationId: string, mutation: 'pause' | 'resume') => void
}): JSX.Element {
  const paused = row.status !== 'active'
  const nextRun = row.nextRunAt === undefined ? t('stats.noneScheduled') : formatWithin(row.nextRunAt, now, t)
  const nextRunCompact = row.nextRunAt === undefined ? t('stats.noneScheduled') : formatRelativeTime(row.nextRunAt, now, t)
  const nextRunLabel = `${t('stats.next')}: ${nextRun}`
  const toggleLabel = paused ? t('card.resume') : t('card.pause')
  return (
    <div className={`dsh-st-overview-row${paused ? ' is-paused' : ''}`}>
      <button
        type="button"
        className="dsh-st-overview-open"
        disabled={openTaskSettings === undefined}
        onClick={() => { openTaskSettings?.({ automationId: row.id, name: row.name, sessionIds: [] }) }}
      >
        <span className="dsh-st-overview-copy">
          <span className="dsh-st-overview-name">{row.name}</span>
          {scheduleSummary !== '' && <span className="dsh-st-overview-schedule"><IconClockOutline size={14} /><span>{scheduleSummary}</span></span>}
        </span>
        <span className="dsh-st-overview-next" title={nextRunLabel} aria-label={nextRunLabel}><strong>{nextRunCompact}</strong></span>
      </button>
      <span className="dsh-st-overview-toggle" title={toggleLabel}>
        <Switch
          checked={!paused}
          disabled={toggleDisabled}
          label={toggleLabel}
          onChange={() => { onToggleAutomation?.(row.id, automationToggleMutation(row.status)) }}
        />
      </span>
    </div>
  )
}
