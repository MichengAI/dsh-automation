import { Component, createElement, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { SegmentedTabs, type SegmentedTab } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionSelector, Translate, WorkspaceSelector } from './contracts.js'
import { IconClockOutline, IconFolderClose, IconQueueOutline } from './host-icons.js'
import type { AutomationRuntime } from './runtime.js'
import {
  automationIdFromTaskWorkspaceId,
  automationTaskWorkspaceId,
  collectScheduledSessionIds,
  groupScheduledSessions,
  scheduledOnlySessionState,
  scheduledRealWorkspaceState,
  scheduledSessionNeedsSnapshotRefresh,
  scheduledSessionVisible,
  syntheticTaskWorkspaceState,
  NATIVE_SIDEBAR_TAB_KEY,
  ownedSidebarTabIds,
  readNativeSidebarTab,
  resolveVisibleSidebarTab,
  shouldFollowSessionTab,
  tabForSessionId,
  resolveCurrentSessionId,
  type NativeSessionLike,
  type NativeWorkspaceLike,
  type SyntheticTaskGroup,
} from './schedule-rail-model.js'
import { SCHEDULE_VIEW_PANEL_ID, ScheduleOverview, ScheduleViewSwitch, type ScheduleView } from './schedule-overview.js'
import { getRecordsViewStore, type RecordsViewState } from './records-view-store.js'
import { installTaskGroupOption } from './workspace-menu.js'
import type { NativeSidebarTab as ExtraSidebarTab, NativeTabRegistry } from './native-tabs.js'
import type { AutomationTaskSettingsRequest } from './task-settings-request.js'

const EMPTY_EXTRA_TABS: ExtraSidebarTab[] = []
const noopSubscribe = (_listener: () => void): (() => void) => () => undefined
/**
 * 侧栏外壳分段页签共用的面板 id：四个页签同一时刻只渲染一个内容区，
 * 全部 `aria-controls` 指向它，避免未挂载面板形成悬空引用。
 */
const SHELL_PANEL_ID = 'dsh-st-shell-panel'

const EMPTY_SESSION_STATE = { ids: [] as readonly string[], byId: {} as Record<string, NativeSessionLike> }
const EMPTY_WORKSPACE_STATE = { items: [] as readonly NativeWorkspaceLike[], archivedSessionIds: [] as readonly string[] }
const EMPTY_ARCHIVED_IDS: readonly string[] = []

type SessionSearchResult = { readonly items: readonly { readonly id?: string }[]; readonly hasMore: boolean }
type SessionSearch = (query: string, signal: AbortSignal) => Promise<SessionSearchResult>
type HostTranslate = (key: string, params?: Record<string, unknown>) => string
type HostStartSession = (workspaceId?: string, options?: unknown) => void
type HostWorkspaceAction = (workspaceId: string, value?: string) => Promise<void>
interface HostShortcut { readonly id?: string }
type HostShortcutSelector = <Selected>(
  select: (rows: readonly HostShortcut[]) => Selected,
  equals?: (left: Selected, right: Selected) => boolean,
) => Selected
const EMPTY_SHORTCUTS: readonly HostShortcut[] = []

function noDirectoryFlow<T>(select: (occupied: boolean) => T): T {
  return select(false)
}

function hostFunction<T>(props: Record<string, unknown> | undefined, key: string): T | undefined {
  const value = props?.[key]
  return typeof value === 'function' ? value as T : undefined
}

const noop = (): void => undefined

class OfficialTreeGuard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true } }
  override componentDidCatch(error: unknown): void {
    console.warn('[dsh-automation] official workspace tree crashed', error)
  }
  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function TreeUnavailable({ t }: { readonly t: Translate }): JSX.Element {
  return <div className="dsh-st-rail-empty">{t('sidebar.treeUnavailable')}</div>
}



export function ScheduledRecordsView({
  t,
  runtime,
  officialTree,
  hostProps,
  openSession,
  openTaskSettings,
  openCreateTask,
  useSessions,
  useWorkspaces,
  wide,
}: {
  readonly t: Translate
  readonly runtime: AutomationRuntime
  readonly officialTree?: ComponentType<Record<string, unknown>>
  readonly hostProps?: Record<string, unknown>
  readonly openSession?: (sessionId: string) => void
  readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void
  readonly openCreateTask?: () => void
  readonly useSessions?: SessionSelector
  readonly useWorkspaces?: WorkspaceSelector
  readonly wide?: boolean
}): JSX.Element {
  const Official = officialTree
  const [view, setView] = useState<ScheduleView>('runs')
  const automationState = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
  const scheduledIds = useMemo(() => collectScheduledSessionIds(automationState.snapshot?.runs), [automationState.snapshot])
  const archivedIds = useWorkspaces === undefined
    ? EMPTY_ARCHIVED_IDS
    : useWorkspaces(state => state.archivedSessionIds ?? EMPTY_ARCHIVED_IDS)
  const recordsStore = getRecordsViewStore()
  const useRecordsStore = <T,>(select: (state: RecordsViewState) => T): T => {
    const snapshot = useSyncExternalStore(recordsStore.subscribe, recordsStore.getSnapshot, recordsStore.getSnapshot)
    return select(snapshot)
  }
  const groupBy = useRecordsStore(state => state.groupBy)
  const archivedFilter = useRecordsStore(state => state.archivedFilter)
  const scheduledGroups = useMemo<readonly SyntheticTaskGroup[]>(() => {
    const snapshot = automationState.snapshot
    if (snapshot === undefined) return []
    const archived = new Set(archivedIds)
    const createdAtById = new Map<string, string>()
    for (const run of snapshot.runs) {
      if (run.sessionId === undefined || run.sessionId === '') continue
      const at = run.startedAt ?? run.scheduledFor
      const previous = createdAtById.get(run.automationId)
      if (previous === undefined || Date.parse(at) < Date.parse(previous)) createdAtById.set(run.automationId, at)
    }
    return groupScheduledSessions(snapshot.automations, snapshot.runs)
      .map((group) => {
        const sessionIds = group.sessions
          .filter(session => scheduledSessionVisible(session.id, archived, archivedFilter))
          .map(session => session.id)
        const createdAt = createdAtById.get(group.id)
        return {
          id: group.id,
          name: group.name,
          sessionIds,
          ...(createdAt === undefined ? {} : { createdAt }),
        }
      })
      .filter(group => group.sessionIds.length > 0)
  }, [archivedFilter, archivedIds, automationState.snapshot])
  const useScheduledSessions = useCallback<SessionSelector>((selector, eq) => {
    if (useSessions === undefined) return selector(EMPTY_SESSION_STATE)
    return useSessions(state => selector(scheduledOnlySessionState(state, scheduledIds)), eq)
  }, [useSessions, scheduledIds])
  const sourceWorkspaces = useWorkspaces === undefined ? undefined : useWorkspaces(state => state)
  const realWorkspaces = useMemo(
    () => scheduledRealWorkspaceState(sourceWorkspaces, scheduledIds, archivedFilter),
    [archivedFilter, scheduledIds, sourceWorkspaces],
  )
  const useRecordsWorkspaces = useCallback<WorkspaceSelector>((selector, eq) => {
    if (useWorkspaces === undefined) return selector(EMPTY_WORKSPACE_STATE)
    return useWorkspaces(state => selector(
      groupBy === 'task'
        ? syntheticTaskWorkspaceState(state, scheduledGroups)
        : scheduledRealWorkspaceState(state, scheduledIds, archivedFilter),
    ), eq)
  }, [archivedFilter, groupBy, scheduledGroups, scheduledIds, useWorkspaces])

  const rawOfficialProps = { ...(hostProps ?? {}), ...(wide === undefined ? {} : { wide }) }
  const rawUseShortcuts = hostFunction<HostShortcutSelector>(hostProps, 'useShortcuts')
  // 头部「＋」现在是新建定时任务，不能继续显示宿主的“添加工作区”快捷键。
  const useRecordsShortcuts = useCallback<HostShortcutSelector>((select, equals) => {
    if (rawUseShortcuts === undefined) return select(EMPTY_SHORTCUTS)
    return rawUseShortcuts(rows => select((rows ?? []).filter(row => row.id !== 'workspace.add')), equals)
  }, [rawUseShortcuts])
  const hostT = hostFunction<HostTranslate>(hostProps, 't') ?? ((key: string) => key)
  const recordsT = useCallback((key: string, params?: Record<string, unknown>) => {
    if (key === 'section.workspaces' && groupBy === 'task') return t('records.sectionTasks')
    if (key === 'workspace.add' || key === 'menu.addWorkspace') return t('action.create')
    return hostT(key, params)
  }, [groupBy, hostT, t])
  const recordsOpen = openSession ?? hostFunction<(sessionId: string) => void>(hostProps, 'open')
  const rawSearch = hostFunction<SessionSearch>(hostProps, 'searchSessions')
  const rawStartSession = hostFunction<HostStartSession>(hostProps, 'startSession')
  const rawRenameWorkspace = hostFunction<HostWorkspaceAction>(hostProps, 'renameWorkspace')
  const rawDeleteWorkspace = hostFunction<HostWorkspaceAction>(hostProps, 'deleteWorkspace')
  const rawInsertWorkspaceBefore = hostFunction<HostWorkspaceAction>(hostProps, 'insertWorkspaceBefore')
  const searchScheduledSessions = useCallback(async (query: string, signal: AbortSignal): Promise<SessionSearchResult> => {
    if (rawSearch === undefined) return { items: [], hasMore: false }
    const result = await rawSearch(query, signal)
    return {
      items: result.items.filter(item => item.id !== undefined && scheduledIds.has(item.id)),
      hasMore: result.hasMore,
    }
  }, [rawSearch, scheduledIds])
  const startScheduledSession = useCallback((workspaceId?: string, options?: unknown) => {
    if (groupBy !== 'task' || automationIdFromTaskWorkspaceId(workspaceId) !== undefined) return
    rawStartSession?.(workspaceId, options)
  }, [groupBy, rawStartSession])
  const renameScheduledWorkspace = useCallback(async (workspaceId: string, title: string): Promise<void> => {
    if (groupBy !== 'task' || automationIdFromTaskWorkspaceId(workspaceId) !== undefined) {
      throw new Error(t('records.groupReadOnly'))
    }
    await rawRenameWorkspace?.(workspaceId, title)
  }, [groupBy, rawRenameWorkspace, t])
  const deleteScheduledWorkspace = useCallback(async (workspaceId: string): Promise<void> => {
    if (groupBy !== 'task' || automationIdFromTaskWorkspaceId(workspaceId) !== undefined) {
      throw new Error(t('records.groupReadOnly'))
    }
    await rawDeleteWorkspace?.(workspaceId)
  }, [groupBy, rawDeleteWorkspace, t])
  const insertScheduledWorkspaceBefore = useCallback(async (workspaceId: string, beforeWorkspaceId?: string): Promise<void> => {
    if (groupBy !== 'task' || automationIdFromTaskWorkspaceId(workspaceId) !== undefined) return
    await rawInsertWorkspaceBefore?.(workspaceId, beforeWorkspaceId)
  }, [groupBy, rawInsertWorkspaceBefore])
  const useCreateTaskFlow = useCallback(<T,>(select: (available: boolean) => T): T => select(true), [])
  const scheduledOfficialProps = {
    ...rawOfficialProps,
    useStore: useRecordsStore,
    actions: recordsStore.actions,
    t: recordsT,
    ...(recordsOpen === undefined ? {} : { open: recordsOpen }),
    ...(useSessions === undefined ? {} : { useSessions: useScheduledSessions }),
    ...(useWorkspaces === undefined ? {} : { useWorkspaces: useRecordsWorkspaces }),
    ...(rawUseShortcuts === undefined ? {} : { useShortcuts: useRecordsShortcuts }),
    useDirectoryFlow: openCreateTask === undefined ? noDirectoryFlow : useCreateTaskFlow,
    requestAddWorkspace: openCreateTask ?? noop,
    startSession: startScheduledSession,
    renameWorkspace: renameScheduledWorkspace,
    deleteWorkspace: deleteScheduledWorkspace,
    insertWorkspaceBefore: insertScheduledWorkspaceBefore,
    ...(rawSearch === undefined ? {} : { searchSessions: searchScheduledSessions }),
  }
  const groupKeys = useMemo(() => {
    if (groupBy === 'task') return scheduledGroups.map(group => automationTaskWorkspaceId(group.id))
    if (groupBy === 'flat') return []
    return (realWorkspaces.items ?? [])
      .map(workspace => String(workspace.workspaceId ?? workspace.id ?? ''))
      .filter(key => key !== '')
  }, [groupBy, realWorkspaces.items, scheduledGroups])
  useEffect(() => {
    recordsStore.actions.ensureExpanded(groupKeys)
  }, [groupKeys, recordsStore])
  useEffect(() => installTaskGroupOption({
    label: t('records.groupByTask'),
    groupLabel: recordsT('groupBy.label'),
    workspaceLabel: recordsT('groupBy.workspace'),
    checked: groupBy === 'task',
    onSelect: () => recordsStore.actions.setGroupBy('task'),
  }), [groupBy, recordsStore, recordsT, t])

  const recordsBody = Official === undefined
    ? <TreeUnavailable t={t} />
    : (
        <div className="dsh-st-schedule-tree" data-mode={groupBy}>
          <OfficialTreeGuard fallback={<TreeUnavailable t={t} />}>
            {createElement(Official, scheduledOfficialProps)}
          </OfficialTreeGuard>
        </div>
      )
  return (
    <div className="dsh-st-n">
      <div className="dsh-st-n-views-wrap">
        <ScheduleViewSwitch t={t} view={view} onChange={setView} />
      </div>
      <div id={SCHEDULE_VIEW_PANEL_ID} role="tabpanel" className="dsh-st-n-view-body">
        {view === 'overview'
          ? automationState.snapshot === undefined
            ? <div className="dsh-st-n-empty">{automationState.phase === 'loading' ? t('loading') : t('overview.empty')}</div>
            : <ScheduleOverview
                t={t}
                automations={automationState.snapshot.automations}
                onToggleAutomation={(automationId, mutation) => runtime.mutateAutomation(automationId, mutation)}
                {...(openTaskSettings === undefined ? {} : { openTaskSettings })}
                {...(openCreateTask === undefined ? {} : { openCreateTask })}
                {...(automationState.snapshot.serverNow === undefined ? {} : { serverNow: automationState.snapshot.serverNow })}
              />
          : recordsBody}
      </div>
    </div>
  )
}

export function NativeScheduleShell({
  t,
  runtime,
  officialTree,
  hostProps,
  openSession,
  openTaskSettings,
  openCreateTask,
  useSessions,
  useWorkspaces,
  tabRegistry,
  wide,
}: {
  readonly t: Translate
  readonly runtime: AutomationRuntime
  readonly officialTree?: ComponentType<Record<string, unknown>>
  readonly hostProps?: Record<string, unknown>
  readonly openSession?: (sessionId: string) => void
  readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void
  readonly openCreateTask?: () => void
  readonly useSessions?: SessionSelector
  readonly useWorkspaces?: WorkspaceSelector
  readonly renderSlot?: (name: string, props?: Record<string, unknown>) => ReactNode
  readonly tabRegistry?: NativeTabRegistry
  readonly wide?: boolean
}): JSX.Element | null {
  const Official = officialTree
  const [tab, setTab] = useState<string>(() => {
    try { return readNativeSidebarTab(window.localStorage.getItem(NATIVE_SIDEBAR_TAB_KEY)) }
    catch { return 'tasks' }
  })
  const extraTabs = useSyncExternalStore(
    tabRegistry?.subscribe ?? noopSubscribe,
    () => tabRegistry?.getTabs() ?? EMPTY_EXTRA_TABS,
    () => EMPTY_EXTRA_TABS,
  )
  // 只有注册表提供了可渲染的频道贡献，才显示频道入口；不跨用工作区的子槽位权限。
  const channelsReady = extraTabs.some(item => item.id === 'channels')
  const currentId = useSessions?.((state) => resolveCurrentSessionId(state))
  const automationState = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
  const scheduledIds = useMemo(() => collectScheduledSessionIds(automationState.snapshot?.runs), [automationState.snapshot])
  const snapshotRefreshFor = useRef<string | null>(null)
  useEffect(() => {
    if (!scheduledSessionNeedsSnapshotRefresh(currentId, automationState.snapshot?.runs)) {
      snapshotRefreshFor.current = null
      return
    }
    if (snapshotRefreshFor.current === currentId) return
    snapshotRefreshFor.current = currentId ?? null
    void runtime.refresh().catch(() => undefined)
  }, [automationState.snapshot?.runs, currentId, runtime])
  useEffect(() => {
    try { window.localStorage.setItem(NATIVE_SIDEBAR_TAB_KEY, tab) }
    catch { /* 隐私模式或禁用存储时忽略 */ }
  }, [tab])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('button') : null
      if (target === null) return
      const label = `${target.textContent ?? ''} ${target.getAttribute('aria-label') ?? ''}`
      if (/新会话|新建任务|New chat|New session/i.test(label)) setTab('tasks')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
  const previousCurrentId = useRef(currentId)
  const tabFollowReady = useRef(false)
  useEffect(() => {
    // 定时会话已经出现在官方任务树里，点到它时不再强制切到定时页签。
    const next = tabForSessionId(currentId ?? undefined, scheduledIds, { followSchedule: false, followChannels: false })
    if (!tabFollowReady.current) {
      tabFollowReady.current = true
      previousCurrentId.current = currentId
      if (next === 'tasks') setTab('tasks')
      return
    }
    const previous = previousCurrentId.current
    previousCurrentId.current = currentId
    if (!shouldFollowSessionTab(previous, currentId)) return
    const extraIds = extraTabs.map(item => item.id)
    if (next === 'tasks') setTab('tasks')
    if (next === 'channels' && (channelsReady || extraIds.includes('channels'))) setTab('channels')
    const matched = extraTabs.find(item => currentId !== undefined && currentId !== null && item.matchSession?.(String(currentId)) === true)
    // 频道会话已经在任务树里，频道页签交给用户手动切换；定时页签同样不抢。
    if (matched !== undefined && matched.id !== 'schedule' && matched.id !== 'channels') setTab(matched.id)
  }, [currentId, channelsReady, extraTabs, scheduledIds])

  const rawOfficialProps = { ...(hostProps ?? {}), ...(wide === undefined ? {} : { wide }) }
  const rawOpen = hostFunction<(sessionId: string) => void>(hostProps, 'open')
  const openSidebarSession = useCallback((sessionId: string) => {
    if (scheduledIds.has(sessionId) && openSession !== undefined) {
      openSession(sessionId)
      return
    }
    rawOpen?.(sessionId)
  }, [openSession, rawOpen, scheduledIds])
  const filteredOfficialProps = {
    ...rawOfficialProps,
    open: openSidebarSession,
  }
  const renderOfficial = (props: Record<string, unknown>): ReactNode => {
    if (Official === undefined) return <TreeUnavailable t={t} />
    return (
      <OfficialTreeGuard fallback={createElement(Official, rawOfficialProps)}>
        {createElement(Official, props)}
      </OfficialTreeGuard>
    )
  }

  const foreignTabs = useMemo(() => extraTabs.filter(item => item.id !== 'schedule'), [extraTabs])
  const visibleTab = resolveVisibleSidebarTab({
    tab,
    channelsReady,
    extraTabIds: ownedSidebarTabIds({ extraTabIds: foreignTabs.map(item => item.id), channelsReady }),
  })
  const hostedSchedule = extraTabs.find(item => item.id === 'schedule')
  const scheduleBody = hostedSchedule === undefined
    ? (
        <ScheduledRecordsView
          t={t}
          runtime={runtime}
          {...(Official === undefined ? {} : { officialTree: Official })}
          {...(hostProps === undefined ? {} : { hostProps })}
          {...(openSession === undefined ? {} : { openSession })}
          {...(openTaskSettings === undefined ? {} : { openTaskSettings })}
          {...(openCreateTask === undefined ? {} : { openCreateTask })}
          {...(useSessions === undefined ? {} : { useSessions })}
          {...(useWorkspaces === undefined ? {} : { useWorkspaces })}
          {...(wide === undefined ? {} : { wide })}
        />
      )
    : hostedSchedule.render({ ...(hostProps ?? {}), openSession, open: openSession, useSessions, wide: true }) as ReactNode

  const sidebarTabItems = useMemo<readonly [SegmentedTab<string>, ...SegmentedTab<string>[]]>(() => {
    const items: SegmentedTab<string>[] = [
      {
        value: 'tasks',
        id: 'dsh-st-tab-tasks',
        panelId: SHELL_PANEL_ID,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <IconFolderClose size={14} />
            <span>{t('sidebar.tasksTab')}</span>
          </span>
        ),
      },
    ]
    for (const item of foreignTabs) {
      // 宿主的 tasks 页签由本组件渲染；重复插入会撞 DOM id 与 React key。
      if (item.id === 'tasks') continue
      const itemLabel = item.id === 'channels'
        ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <IconQueueOutline size={14} />
            <span>{item.label}</span>
          </span>
        )
        : item.label
      items.push({
        value: item.id,
        id: 'dsh-st-tab-' + item.id,
        panelId: SHELL_PANEL_ID,
        label: itemLabel,
      })
    }
    items.push({
      value: 'schedule',
      id: 'dsh-st-tab-schedule',
      panelId: SHELL_PANEL_ID,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <IconClockOutline size={14} />
          <span>{t('sidebar.tab')}</span>
        </span>
      ),
    })
    return items as unknown as readonly [SegmentedTab<string>, ...SegmentedTab<string>[]]
  }, [channelsReady, foreignTabs, t])

  if (wide === false) return <>{renderOfficial(filteredOfficialProps)}</>

  const activeForeignTab = visibleTab === 'schedule' || visibleTab === 'tasks'
    ? undefined
    : foreignTabs.find(item => item.id === visibleTab)
  const panelClass = activeForeignTab !== undefined || visibleTab === 'schedule' || visibleTab === 'channels'
    ? 'dsh-st-shell-body'
    : 'dsh-st-official-tree'

  return (
    <div className="dsh-st-shell-rail">
      <div className="dsh-st-shell-tabs-wrap" style={{ '--dsh-st-tab-count': String(sidebarTabItems.length) } as CSSProperties}>
        <SegmentedTabs
          className="dsh-st-shell-segmented-tabs"
          label={t('sidebar.tabs')}
          value={visibleTab}
          onChange={next => setTab(next)}
          items={sidebarTabItems}
        />
      </div>
      <div id={SHELL_PANEL_ID} role="tabpanel" className={panelClass}>
        {visibleTab === 'schedule'
          ? scheduleBody
          : activeForeignTab !== undefined
            ? activeForeignTab.render({ ...(hostProps ?? {}), openSession, open: openSession, useSessions, wide: true }) as ReactNode
            : renderOfficial(filteredOfficialProps)}
      </div>
    </div>
  )
}


