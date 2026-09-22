import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { IconListPenOutline } from './host-icons.js'
import type { AutomationViewProps, Translate } from './contracts.js'
import {
  AutomationFormError,
  buildCreateInput,
  clockTime,
  defaultFormState,
  formatDuration,
  formatRunTrigger,
  formatSchedule,
  formatWithin,
  formFromAutomation,
  groupHistory,
  HISTORY_STATUS_OPTIONS,
  readSortDefault,
  sortAutomations,
  SETTINGS_SORT_DEFAULT_KEY,
  type AutomationFormState,
  type AutomationSortDirection,
  type AutomationSortKey,
  type HistoryRange,
  type ScheduleKind,
  type SortPreferenceStorage,
} from './helpers.js'
import { automationToggleMutation } from './schedule-rail-model.js'
import {
  ChatIcon,
  ClockIcon,
  GithubIcon,
  InfoIcon,
  MoreIcon,
  PlusIcon,
  RefreshIcon,
} from './icons.js'
import { AntdProvider, Button, Dropdown, Input, Select, Switch, Tabs } from './antd-ui.js'
import { CreateModal } from './create-modal.js'
import { DeleteConfirmation } from './delete-confirmation.js'
import { setChatPrefill } from './prefill.js'
import { isTransportError } from './runtime.js'
import { SortMenu } from './sort-menu.js'
import type { AutomationRunStatus, AutomationRunViewModel, AutomationViewModel } from './protocol.js'
import {
  AUTOMATION_TASK_SETTINGS_EVENT,
  clearAutomationTaskSettingsRequest,
  parseAutomationTaskSettingsRequest,
  readAutomationTaskSettingsRequest,
  resolveAutomationTaskSettings,
  type AutomationTaskSettingsRequest,
} from './task-settings-request.js'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
const SORT_STORAGE: SortPreferenceStorage | undefined = typeof window === 'undefined' ? undefined : window.localStorage
const TASK_SETTINGS_STORAGE: Storage | undefined = typeof window === 'undefined' ? undefined : window.sessionStorage

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
  const [deleteTarget, setDeleteTarget] = useState<AutomationViewModel>()
  const [draft, setDraft] = useState<Partial<AutomationFormState>>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [historyRange, setHistoryRange] = useState<HistoryRange>('day')
  const [historyTask, setHistoryTask] = useState('all')
  const [historyStatus, setHistoryStatus] = useState<'all' | AutomationRunStatus>('all')
  const [sortKey, setSortKey] = useState<AutomationSortKey>(() => readSortDefault(SORT_STORAGE, SETTINGS_SORT_DEFAULT_KEY)?.key ?? 'created')
  const [sortDirection, setSortDirection] = useState<AutomationSortDirection>(() => readSortDefault(SORT_STORAGE, SETTINGS_SORT_DEFAULT_KEY)?.direction ?? 'desc')
  const [taskSettingsRequest, setTaskSettingsRequest] = useState<AutomationTaskSettingsRequest | undefined>(() => readAutomationTaskSettingsRequest(TASK_SETTINGS_STORAGE))
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onTaskSettings = (event: Event): void => {
      const request = parseAutomationTaskSettingsRequest((event as CustomEvent<unknown>).detail)
      if (request !== undefined) setTaskSettingsRequest(request)
    }
    window.addEventListener(AUTOMATION_TASK_SETTINGS_EVENT, onTaskSettings)
    return () => { window.removeEventListener(AUTOMATION_TASK_SETTINGS_EVENT, onTaskSettings) }
  }, [])

  useEffect(() => {
    if (taskSettingsRequest === undefined || snapshot === undefined) return
    const item = resolveAutomationTaskSettings(taskSettingsRequest, snapshot.automations, snapshot.runs)
    clearAutomationTaskSettingsRequest(TASK_SETTINGS_STORAGE)
    setTaskSettingsRequest(undefined)
    setTab('mine')
    setQuery('')
    if (item === undefined) {
      setError(t('error.taskMissing'))
      return
    }
    openEdit(item)
  }, [snapshot, taskSettingsRequest, t])

  return (
    <AntdProvider>
    <div className="dsh-st-shell">
      <header className="dsh-st-top">
        <div className="dsh-st-heading">
          <div className="dsh-st-heading-row">
            <h1>{t('tab')}</h1>
            <div className="dsh-st-heading-links">
              <Button size="small" shape="default" href="https://github.com/MichengAI/dsh-automation" target="_blank" rel="noreferrer" aria-label={t('header.githubProject')} icon={<GithubIcon />}>{t('header.githubProject')}</Button>
              <Button size="small" shape="default" href="https://github.com/MichengAI/dsh-automation/issues" target="_blank" rel="noreferrer" aria-label={t('header.githubFeedback')} icon={<IconListPenOutline />}>{t('header.githubFeedback')}</Button>
            </div>
          </div>
          <p>{t('header.lead')}</p>
        </div>
        <div className="dsh-st-toolbar">
          <Input className="dsh-st-search" allowClear value={query} placeholder={t('search.placeholder')} onChange={event => setQuery(event.target.value)} />
          <Button icon={<ChatIcon />} onClick={() => {
            setChatPrefill(t('chat.prompt'))
            closeSettings?.()
          }}>{t('action.chatCreate')}</Button>
          <Button type="primary" icon={<PlusIcon />} disabled={defaultPermission === '' || permissions.length === 0} onClick={() => openCreate()}>{t('action.create')}</Button>
          <Button icon={<RefreshIcon />} aria-label={t('section.refresh')} onClick={() => { void runtime.refresh() }} />
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
          <Button type="primary" onClick={() => { void runtime.refresh() }}>{t('error.retry')}</Button>
        </div>
      )}

      <div className="dsh-st-tabs">
        <Tabs
          className="dsh-st-settings-tabs"
          activeKey={tab}
          onChange={key => setTab(key as Tab)}
          items={[{ key: 'mine', label: t('tabs.mine') }, { key: 'runs', label: t('tabs.runs') }]}
          styles={{
            header: { margin: 0, height: 40 },
            item: { height: 40, padding: 0, display: 'flex', alignItems: 'center' },
            body: { display: 'none' },
            content: { display: 'none' },
          }}
        />
        {tab === 'mine' && (
          <div className="dsh-st-sort-wrap">
            <SortMenu
              t={t}
              {...(SORT_STORAGE === undefined ? {} : { storage: SORT_STORAGE })}
              storageKey={SETTINGS_SORT_DEFAULT_KEY}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSelect={(key, direction) => {
                setSortKey(key)
                setSortDirection(direction)
              }}
            />
          </div>
        )}
        {tab === 'runs' && (
          <div className="dsh-st-filters">
            <Select
              className="dsh-st-filter-range"
              value={historyRange}
              popupMatchSelectWidth={false}
              options={(['day', 'week', 'month'] as const).map(range => ({ value: range, label: t(`history.range.${range}`) }))}
              onChange={setHistoryRange}
            />
            <Select
              className="dsh-st-filter-task"
              value={historyTask}
              popupMatchSelectWidth={false}
              options={[
                { value: 'all', label: t('history.allTasks') },
                ...(snapshot?.automations ?? []).map(item => ({ value: item.id, label: item.name })),
              ]}
              onChange={setHistoryTask}
            />
            <Select
              className="dsh-st-filter-status"
              value={historyStatus}
              popupMatchSelectWidth={false}
              options={[
                { value: 'all', label: t('history.allStatus') },
                ...HISTORY_STATUS_OPTIONS.map(status => ({ value: status, label: t(`status.${status}`) })),
              ]}
              onChange={value => setHistoryStatus(value)}
            />
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
                  onToggle={() => { void runAction(() => runtime.mutateAutomation(item.id, automationToggleMutation(item.status))) }}
                  onRun={() => { void runAction(() => runtime.runNow(item.id)) }}
                  onDelete={() => setDeleteTarget(item)}
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
      <DeleteConfirmation
        target={deleteTarget}
        t={t}
        busy={busy}
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={() => {
          const target = deleteTarget
          if (target === undefined) return
          void runAction(async () => {
            await runtime.mutateAutomation(target.id, 'delete')
            setDeleteTarget(undefined)
          })
        }}
      />
    </div>
    </AntdProvider>
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
  return (
    <article className="dsh-st-card" onClick={onEdit}>
      <div className="dsh-st-card-head">
        <span onClick={(event) => event.stopPropagation()}>
          <Switch checked={item.status === 'active'} disabled={busy} aria-label={item.status === 'active' ? t('card.pause') : t('card.resume')} onChange={() => onToggle()} />
        </span>
        <span onClick={(event) => event.stopPropagation()}>
          <Dropdown
            menu={{
              items: [
                { key: 'run', label: t('menu.run'), disabled: busy, onClick: onRun },
                { key: 'edit', label: t('menu.edit'), disabled: busy, onClick: onEdit },
                { key: 'delete', label: t('menu.delete'), danger: true, disabled: busy, onClick: onDelete },
              ],
            }}
          >
            <Button type="text" aria-label={t('card.more')} icon={<MoreIcon width={16} height={16} />} />
          </Dropdown>
        </span>
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

function RunRow({ run, t }: { readonly run: AutomationRunViewModel; readonly t: Translate }): JSX.Element {
  const duration = formatDuration(run.startedAt, run.finishedAt)
  return (
    <article className={`dsh-st-run is-${run.status}`}>
      <strong>{run.automationName}</strong>
      <p>
        <span>{clockTime(run.startedAt ?? run.scheduledFor)}</span>
        {duration !== undefined && <span>{duration}</span>}
        <span>{formatRunTrigger(run.trigger, t)}</span>
      </p>
    </article>
  )
}
