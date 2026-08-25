import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import type { AutomationViewProps, Translate } from './contracts.js'
import {
  AutomationFormError,
  buildCreateInput,
  clockTime,
  defaultFormState,
  formatDuration,
  formatSchedule,
  formatWithin,
  formFromAutomation,
  groupHistory,
  sortAutomations,
  type AutomationFormState,
  type AutomationSortDirection,
  type AutomationSortKey,
  type HistoryRange,
  type ScheduleKind,
} from './helpers.js'
import {
  ChatIcon,
  CheckOutlineIcon,
  ChevronIcon,
  ClockIcon,
  InfoIcon,
  MoreIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
} from './icons.js'
import { CreateModal } from './create-modal.js'
import { setChatPrefill } from './prefill.js'
import { isTransportError } from './runtime.js'
import type { AutomationRunStatus, AutomationRunViewModel, AutomationViewModel } from './protocol.js'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const

type Tab = 'mine' | 'runs'

const EXAMPLES: readonly { readonly name: string; readonly scheduleKind: ScheduleKind; readonly time: string; readonly weekdays: readonly number[] }[] = [
  { name: '每日回归检查', scheduleKind: 'daily', time: '09:00', weekdays: [1, 2, 3, 4, 5] },
  { name: '每周依赖巡检', scheduleKind: 'weekly', time: '10:00', weekdays: [1] },
  { name: '工作日早报', scheduleKind: 'weekly', time: '08:00', weekdays: [1, 2, 3, 4, 5] },
]

export function AutomationView({ t, permissionT, modelT, runtime, closeSettings }: AutomationViewProps): JSX.Element {
  const state = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
  const [tab, setTab] = useState<Tab>('mine')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [draft, setDraft] = useState<Partial<AutomationFormState>>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [historyRange, setHistoryRange] = useState<HistoryRange>('day')
  const [historyTask, setHistoryTask] = useState('all')
  const [historyStatus, setHistoryStatus] = useState<'all' | AutomationRunStatus>('all')
  const [sortKey, setSortKey] = useState<AutomationSortKey>('planned')
  const [sortDirection, setSortDirection] = useState<AutomationSortDirection>('asc')
  const now = useMemo(() => new Date(state.snapshot?.serverNow ?? Date.now()), [state.snapshot?.serverNow, state.refreshedAt])

  const snapshot = state.snapshot
  const workspaces = snapshot?.workspaces ?? []
  const models = snapshot?.models ?? []
  const permissions = snapshot?.permissions ?? []
  const defaultPermission = snapshot?.defaultPermission ?? ''
  const automations = sortAutomations(
    (snapshot?.automations ?? []).filter(item => query.trim() === '' || `${item.name} ${item.prompt}`.toLowerCase().includes(query.trim().toLowerCase())),
    sortKey,
    sortDirection,
  )

  const runs = (snapshot?.runs ?? []).filter((run) => {
    if (historyTask !== 'all' && run.automationId !== historyTask) return false
    if (historyStatus !== 'all' && run.status !== historyStatus) return false
    return true
  })
  const groups = groupHistory(runs, historyRange, now, t)

  const runAction = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true)
    setError(undefined)
    try {
      await action()
    } catch (caught) {
      setError(caught instanceof AutomationFormError
        ? t(caught.key)
        : isTransportError(caught) ? t('error.offline')
          : caught instanceof Error ? caught.message : t('error.action'))
    } finally {
      setBusy(false)
    }
  }

  const closeModal = (): void => {
    setCreating(false)
    setDraft(undefined)
    setEditingId(undefined)
  }

  const openCreate = (partial?: Partial<AutomationFormState>): void => {
    if (defaultPermission === '' || permissions.length === 0) return
    setEditingId(undefined)
    setDraft(partial)
    setCreating(true)
  }

  const openEdit = (item: AutomationViewModel): void => {
    setEditingId(item.id)
    setDraft(formFromAutomation(item, workspaces, snapshot?.defaultModel ?? null, snapshot?.defaultPermission ?? item.permission))
    setCreating(true)
  }

  return (
    <div className="dsh-st-shell">
      <header className="dsh-st-top">
        <div className="dsh-st-heading">
          <h1>{t('tab')}</h1>
          <p>{t('header.lead')}</p>
        </div>
        <div className="dsh-st-toolbar">
          <input className="dsh-st-search" value={query} placeholder={t('search.placeholder')} onChange={event => setQuery(event.target.value)} />
          <button type="button" className="dsh-st-btn" onClick={() => {
            setChatPrefill(t('chat.prompt'))
            closeSettings?.()
          }}><ChatIcon />{t('action.chatCreate')}</button>
          <button type="button" className="dsh-st-btn dsh-st-btn--primary" disabled={defaultPermission === '' || permissions.length === 0} onClick={() => openCreate()}><PlusIcon />{t('action.create')}</button>
          <button type="button" className="dsh-st-icon" onClick={() => { void runtime.refresh() }} aria-label={t('section.refresh')}><RefreshIcon /></button>
        </div>
      </header>

      <div className="dsh-st-banner" role="note">
        <span><InfoIcon />{t('banner.wake')}</span>
      </div>

      <section className="dsh-st-examples">
        <div className="dsh-st-examples-head">
          <h2>{t('examples.title')}</h2>
        </div>
        <div className="dsh-st-example-row">
          {EXAMPLES.map((example, index) => (
            <button
              key={example.name}
              type="button"
              className="dsh-st-example"
              disabled={defaultPermission === '' || permissions.length === 0}
              onClick={() => openCreate({
                name: t(`examples.${index + 1}.title` as 'examples.1.title'),
                prompt: t(`examples.${index + 1}.body` as 'examples.1.body'),
                scheduleKind: example.scheduleKind,
                time: example.time,
                weekdays: example.weekdays,
              })}
            >
              <strong>{t(`examples.${index + 1}.title` as 'examples.1.title')}</strong>
              <p>{t(`examples.${index + 1}.body` as 'examples.1.body')}</p>
              <span className="dsh-st-chip"><ClockIcon />{t(`examples.${index + 1}.chip` as 'examples.1.chip')}</span>
            </button>
          ))}
        </div>
      </section>

      {error !== undefined && <p className="dsh-st-error">{error}</p>}
      {(state.phase === 'idle' || (state.phase === 'loading' && snapshot === undefined)) && <p className="dsh-st-muted">{t('loading')}</p>}
      {state.phase === 'error' && snapshot === undefined && (
        <div className="dsh-st-empty">
          <h3>{t('error.title')}</h3>
          <p>{state.error}</p>
          <button type="button" className="dsh-st-btn dsh-st-btn--primary" onClick={() => { void runtime.refresh() }}>{t('error.retry')}</button>
        </div>
      )}

      <div className="dsh-st-tabs">
        <button type="button" className={tab === 'mine' ? 'is-on' : ''} onClick={() => setTab('mine')}>{t('tabs.mine')}</button>
        <button type="button" className={tab === 'runs' ? 'is-on' : ''} onClick={() => setTab('runs')}>{t('tabs.runs')}</button>
        {tab === 'mine' && (
          <SortMenu
            t={t}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSelect={(key, direction) => {
              setSortKey(key)
              setSortDirection(direction)
            }}
          />
        )}
        {tab === 'runs' && (
          <div className="dsh-st-filters">
            {(['day', 'week', 'month'] as const).map(range => (
              <button key={range} type="button" className={historyRange === range ? 'is-on' : ''} onClick={() => setHistoryRange(range)}>
                {t(`history.range.${range}`)}
              </button>
            ))}
            <select value={historyTask} onChange={event => setHistoryTask(event.target.value)}>
              <option value="all">{t('history.allTasks')}</option>
              {(snapshot?.automations ?? []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={historyStatus} onChange={event => setHistoryStatus(event.target.value as 'all' | AutomationRunStatus)}>
              <option value="all">{t('history.allStatus')}</option>
              {(['succeeded', 'failed', 'running', 'queued', 'skipped', 'cancelled'] as const).map(status => (
                <option key={status} value={status}>{t(`status.${status}`)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tab === 'mine' && (
        automations.length === 0
          ? <div className="dsh-st-empty"><h3>{t('empty.title')}</h3><p>{t('empty.body')}</p></div>
          : <div className="dsh-st-grid">
              {automations.map(item => (
                <TaskCard
                  key={item.id}
                  item={item}
                  t={t}
                  now={now}
                  busy={busy}
                  onEdit={() => openEdit(item)}
                  onToggle={() => { void runAction(() => runtime.mutateAutomation(item.id, item.status === 'active' ? 'pause' : 'resume')) }}
                  onRun={() => { void runAction(() => runtime.runNow(item.id)) }}
                  onDelete={() => { void runAction(() => runtime.mutateAutomation(item.id, 'delete')) }}
                />
              ))}
            </div>
      )}

      {tab === 'runs' && (
        groups.length === 0
          ? <div className="dsh-st-empty">{t('runs.empty')}</div>
          : <div className="dsh-st-timeline">
              {groups.map(group => (
                <section key={group.key} className="dsh-st-group">
                  <h3>{group.label}</h3>
                  {group.items.map(run => <RunRow key={run.id} run={run} t={t} />)}
                </section>
              ))}
            </div>
      )}

      {creating && (
        <CreateModal
          key={editingId ?? 'create'}
          t={t}
          permissionT={permissionT}
          modelT={modelT}
          busy={busy}
          workspaces={workspaces}
          models={models}
          modelFailures={snapshot?.modelFailures ?? []}
          defaultModel={snapshot?.defaultModel ?? null}
          skills={snapshot?.skills ?? []}
          permissions={permissions}
          defaultPermission={defaultPermission}
          editing={editingId !== undefined}
          {...(draft === undefined ? {} : { draft })}
          onClose={closeModal}
          onSubmit={async (form) => {
            const input = buildCreateInput(form, workspaces, models, new Date(), {
              allowPastOnce: editingId !== undefined,
            })
            await runAction(async () => {
              if (editingId === undefined) await runtime.createAutomation(input)
              else await runtime.updateAutomation(editingId, input)
              closeModal()
            })
          }}
        />
      )}
    </div>
  )
}

function TaskCard({
  item, t, now, busy, onEdit, onToggle, onRun, onDelete,
}: {
  readonly item: AutomationViewModel
  readonly t: Translate
  readonly now: Date
  readonly busy: boolean
  readonly onEdit: () => void
  readonly onToggle: () => void
  readonly onRun: () => void
  readonly onDelete: () => void
}): JSX.Element {
  const [menu, setMenu] = useState(false)
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!menu) return
    const close = (event: MouseEvent): void => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [menu])

  return (
    <article className="dsh-st-card" ref={root} onClick={onEdit}>
      <div className="dsh-st-card-head">
        <button type="button" className={`dsh-st-switch ${item.status === 'active' ? 'is-on' : ''}`} role="switch" aria-checked={item.status === 'active'} disabled={busy} onClick={(event) => { event.stopPropagation(); onToggle() }} />
        <button type="button" className="dsh-st-more" onClick={(event) => { event.stopPropagation(); setMenu(value => !value) }} aria-label={t('card.delete')}><MoreIcon /></button>
        {menu && (
          <div className="dsh-st-menu" onClick={event => event.stopPropagation()}>
            <button type="button" disabled={busy} onClick={() => { setMenu(false); onRun() }}><PlayIcon />{t('menu.run')}</button>
            <button type="button" className="is-danger" disabled={busy} onClick={() => { setMenu(false); onDelete() }}><TrashIcon />{t('menu.delete')}</button>
          </div>
        )}
      </div>
      <h3>{item.name}</h3>
      <p>{item.prompt}</p>
      <div className="dsh-st-card-foot">
        <span className="dsh-st-chip"><ClockIcon />{formatSchedule(item.schedule, t)}</span>
        <span>{item.nextRunAt === undefined ? t('stats.noneScheduled') : t('history.nextApprox', { when: formatWithin(item.nextRunAt, now, t) })}</span>
      </div>
    </article>
  )
}

function SortMenu({
  t,
  sortKey,
  sortDirection,
  onSelect,
}: {
  readonly t: Translate
  readonly sortKey: AutomationSortKey
  readonly sortDirection: AutomationSortDirection
  readonly onSelect: (key: AutomationSortKey, direction: AutomationSortDirection) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [open])

  const fields: readonly { readonly key: AutomationSortKey; readonly label: string }[] = [
    { key: 'title', label: t('sort.key.title') },
    { key: 'created', label: t('sort.key.created') },
    { key: 'planned', label: t('sort.key.planned') },
  ]
  return (
    <div className="dsh-st-sort" ref={root}>
      <button type="button" className={`dsh-st-sort-btn${open ? ' is-open' : ''}`} aria-label={t('sort.by')} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {t('sort.by')}
        <ChevronIcon className="dsh-st-sort-chevron" />
      </button>
      {open && (
        <div className="dsh-st-sort-menu" role="menu">
          <div className="dsh-st-sort-label">{t('sort.field')}</div>
          {fields.map(field => (
            <SortRow
              key={field.key}
              label={field.label}
              selected={sortKey === field.key}
              onSelect={() => { setOpen(false); onSelect(field.key, sortDirection) }}
            />
          ))}
          <div className="dsh-st-sort-split" />
          <div className="dsh-st-sort-label">{t('sort.direction')}</div>
          <SortRow label={t('sort.direction.asc')} selected={sortDirection === 'asc'} onSelect={() => { setOpen(false); onSelect(sortKey, 'asc') }} />
          <SortRow label={t('sort.direction.desc')} selected={sortDirection === 'desc'} onSelect={() => { setOpen(false); onSelect(sortKey, 'desc') }} />
        </div>
      )}
    </div>
  )
}

function SortRow({
  label,
  selected,
  onSelect,
}: {
  readonly label: string
  readonly selected: boolean
  readonly onSelect: () => void
}): JSX.Element {
  return (
    <button type="button" role="menuitemradio" aria-checked={selected} className={selected ? 'is-on' : undefined} onClick={onSelect}>
      <span>{label}</span>
      {selected ? <CheckOutlineIcon width={16} height={16} /> : <span className="dsh-st-sort-tick" />}
    </button>
  )
}

function RunRow({ run, t }: { readonly run: AutomationRunViewModel; readonly t: Translate }): JSX.Element {
  const duration = formatDuration(run.startedAt, run.finishedAt)
  return (
    <article className={`dsh-st-run is-${run.status}`}>
      <strong>{run.automationName}</strong>
      <p>
        <span>{clockTime(run.startedAt ?? run.scheduledFor)}</span>
        {duration !== undefined && <span>{duration}</span>}
        <span>{t('history.trigger')}</span>
      </p>
    </article>
  )
}

