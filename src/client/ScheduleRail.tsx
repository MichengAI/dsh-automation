import { Component, createElement, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode } from 'react'
import { SegmentedTabs, StateDot, type SegmentedTab } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionSelector, Translate, WorkspaceSelector } from './contracts.js'
import { IconClockOutline, IconFolderClose } from './host-icons.js'
import type { AutomationRuntime } from './runtime.js'
import {
  filterTaskSessionState,
  collectScheduledSessionIds,
  filterWorkspaceListState,
  groupNativeTaskSessions,
  groupScheduledSessions,
  scheduledSessionNeedsSnapshotRefresh,
  NATIVE_SIDEBAR_TAB_KEY,
  ownedSidebarTabIds,
  readNativeSidebarTab,
  resolveVisibleSidebarTab,
  shouldFollowSessionTab,
  tabForSessionId,
  resolveCurrentSessionId,
  type NativeSessionLike,
  type NativeSidebarTab,
  type NativeWorkspaceLike,
} from './schedule-rail-model.js'
import { scheduledListHostActions } from './native-group-actions.js'
import { NativeScheduleSessionList } from './native-session-list.js'
import { SCHEDULE_VIEW_PANEL_ID, ScheduleOverview, ScheduleViewSwitch, type ScheduleView } from './schedule-overview.js'
import type { NativeSidebarTab as ExtraSidebarTab, NativeTabRegistry } from './native-tabs.js'
import type { AutomationTaskSettingsRequest } from './task-settings-request.js'

const EMPTY_EXTRA_TABS: ExtraSidebarTab[] = []
const noopSubscribe = (_listener: () => void): (() => void) => () => undefined
/**
 * 侧栏外壳分段页签共用的面板 id：四个页签同一时刻只渲染一个内容区，
 * 全部 `aria-controls` 指向它，避免未挂载面板形成悬空引用。
 */
const SHELL_PANEL_ID = 'dsh-st-shell-panel'

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

export function ScheduleRail({
  t,
  runtime,
  openSession,
  openTaskSettings,
  view: controlledView,
  showViewSwitch = true,
}: {
  readonly t: Translate
  readonly runtime: AutomationRuntime
  readonly openSession?: (sessionId: string) => void
  readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void
  readonly view?: ScheduleView
  readonly showViewSwitch?: boolean
}): JSX.Element {
  const state = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
  const [folded, setFolded] = useState<Record<string, boolean>>({})
  const [localView, setLocalView] = useState<ScheduleView>('runs')
  const view = controlledView ?? localView
  const snapshot = state.snapshot

  const groups = useMemo(() => {
    if (snapshot === undefined) return []
    return groupScheduledSessions(snapshot.automations, snapshot.runs)
  }, [snapshot])

  return (
    <div className="dsh-st-rail">
      {showViewSwitch && (
        <div className="dsh-st-n-views-wrap">
          <ScheduleViewSwitch t={t} view={view} onChange={setLocalView} />
        </div>
      )}
      <div id={SCHEDULE_VIEW_PANEL_ID} role="tabpanel" className="dsh-st-rail-panel">
        {view === 'overview'
          ? snapshot === undefined
            ? <div className="dsh-st-rail-empty">{state.phase === 'loading' ? t('loading') : t('overview.empty')}</div>
            : <ScheduleOverview
                t={t}
                automations={snapshot.automations}
                onToggleAutomation={(automationId, mutation) => runtime.mutateAutomation(automationId, mutation)}
                {...(openTaskSettings === undefined ? {} : { openTaskSettings })}
                {...(snapshot.serverNow === undefined ? {} : { serverNow: snapshot.serverNow })}
              />
          : <>
              {state.phase === 'loading' && groups.length === 0 && <div className="dsh-st-rail-empty">{t('loading')}</div>}
              {groups.length === 0 && state.phase !== 'loading' && <div className="dsh-st-rail-empty">{t('sidebar.empty')}</div>}
              {groups.map(group => (
                <section key={group.id} className="dsh-st-rail-group">
                  <button
                    type="button"
                    className="dsh-st-rail-head"
                    onClick={() => setFolded(current => ({ ...current, [group.id]: !current[group.id] }))}
                  >
                    <span className="dsh-st-rail-folder"><IconClockOutline size={16} /></span>
                    <span className="dsh-st-rail-title">{group.name}</span>
                  </button>
                  {folded[group.id] !== true && group.sessions.map(session => (
                    <button
                      key={session.id}
                      type="button"
                      className="dsh-st-rail-session"
                      onClick={() => openSession?.(session.id)}
                    >
                      <span>{session.label}</span>
                      {session.running && <StateDot state="ongoing" size={10} />}
                    </button>
                  ))}
                </section>
              ))}
            </>}
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
  useSessions,
  useWorkspaces,
  renderSlot,
  hasChannels,
  subscribeChannels,
  tabRegistry,
  wide,
}: {
  readonly t: Translate
  readonly runtime: AutomationRuntime
  readonly officialTree?: ComponentType<any>
  readonly hostProps?: Record<string, unknown>
  readonly openSession?: (sessionId: string) => void
  readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void
  readonly useSessions?: SessionSelector
  readonly useWorkspaces?: WorkspaceSelector
  readonly renderSlot?: (name: string, props?: Record<string, unknown>) => ReactNode
  readonly hasChannels?: () => boolean
  readonly subscribeChannels?: (listener: () => void) => () => void
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
  const channelsReady = useSyncExternalStore(
    subscribeChannels ?? noopSubscribe,
    () => {
      try { return hasChannels?.() === true } catch { return false }
    },
    () => false,
  )
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
  const useFilteredSessions = useCallback<SessionSelector>((selector, eq) => {
    if (useSessions === undefined) return selector({ ids: [], byId: {} })
    return useSessions(state => selector(filterTaskSessionState(state, scheduledIds)), eq)
  }, [useSessions, scheduledIds])
  const useFilteredWorkspaces = useCallback<WorkspaceSelector>((selector, eq) => {
    if (useWorkspaces === undefined) return selector({ items: [], archivedSessionIds: [] })
    return useWorkspaces(state => selector(filterWorkspaceListState(state, scheduledIds)), eq)
  }, [useWorkspaces, scheduledIds])

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
    const next = tabForSessionId(currentId ?? undefined, scheduledIds)
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
    if (matched !== undefined && matched.id !== 'schedule') setTab(matched.id)
  }, [currentId, channelsReady, extraTabs, scheduledIds])

  const rawOfficialProps = { ...(hostProps ?? {}), ...(wide === undefined ? {} : { wide }) }
  const filteredOfficialProps = {
    ...rawOfficialProps,
    ...(useSessions === undefined ? {} : { useSessions: useFilteredSessions }),
    ...(useWorkspaces === undefined ? {} : { useWorkspaces: useFilteredWorkspaces }),
  }
  const renderOfficial = (props: Record<string, unknown>): ReactNode => {
    if (Official === undefined) {
      return <NativeTaskRail t={t} {...(openSession === undefined ? {} : { openSession })} {...(useSessions === undefined ? {} : { useSessions: useFilteredSessions })} {...(useWorkspaces === undefined ? {} : { useWorkspaces })} />
    }
    return (
      <OfficialTreeGuard fallback={createElement(Official, rawOfficialProps)}>
        {createElement(Official, props)}
      </OfficialTreeGuard>
    )
  }

  if (wide === false) return <>{renderOfficial(filteredOfficialProps)}</>

  const foreignTabs = useMemo(() => extraTabs.filter(item => item.id !== 'schedule'), [extraTabs])
  const visibleTab = resolveVisibleSidebarTab({
    tab,
    channelsReady,
    extraTabIds: ownedSidebarTabIds({ extraTabIds: foreignTabs.map(item => item.id), channelsReady }),
  })
  const hostedSchedule = extraTabs.find(item => item.id === 'schedule')
  const scheduleBody = hostedSchedule === undefined
    ? <NativeScheduleSessionList t={t} runtime={runtime} {...(openSession === undefined ? {} : { openSession })} {...(openTaskSettings === undefined ? {} : { openTaskSettings })} {...(useSessions === undefined ? {} : { useSessions })} {...(useWorkspaces === undefined ? {} : { useWorkspaces })} {...(renderSlot === undefined ? {} : { renderSlot })} {...scheduledListHostActions(hostProps)} {...(typeof hostProps?.useSessionStatus === 'function' ? { useSessionStatus: hostProps.useSessionStatus as NonNullable<Parameters<typeof NativeScheduleSessionList>[0]['useSessionStatus']> } : {})} />
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
            <svg viewBox="0 0 16 16" width={14} height={14} fill="none" aria-hidden="true">
              <path fill="currentColor" d="M2.15 2.9h11.7v8.2H6.42L2.15 13.85V2.9Zm1.4 1.4v6.62l1.78-1.12h7.12V4.3H3.55Z" />
            </svg>
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
    if (channelsReady && foreignTabs.every(item => item.id !== 'channels')) {
      items.push({
        value: 'channels',
        id: 'dsh-st-tab-channels',
        panelId: SHELL_PANEL_ID,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg viewBox="0 0 16 16" width={14} height={14} fill="none" aria-hidden="true">
              <path fill="currentColor" d="M2.15 2.9h11.7v8.2H6.42L2.15 13.85V2.9Zm1.4 1.4v6.62l1.78-1.12h7.12V4.3H3.55Z" />
            </svg>
            <span>{t('sidebar.channelsTab')}</span>
          </span>
        ),
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

  const activeForeignTab = visibleTab === 'schedule' || visibleTab === 'channels'
    ? undefined
    : foreignTabs.find(item => item.id === visibleTab)
  const panelClass = activeForeignTab !== undefined || visibleTab === 'schedule' || visibleTab === 'channels'
    ? 'dsh-st-shell-body'
    : 'dsh-st-official-tree'

  return (
    <div className="dsh-st-shell-rail">
      <div className="dsh-st-shell-tabs-wrap">
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
            : visibleTab === 'channels'
              ? renderSlot?.('sidebar.channels', { ...(hostProps ?? {}), openSession, open: openSession, useSessions, wide: true, skin: 'native' })
              : renderOfficial(filteredOfficialProps)}
      </div>
    </div>
  )
}

function NativeTaskRail({
  t,
  openSession,
  useSessions,
  useWorkspaces,
}: {
  readonly t: Translate
  readonly openSession?: (sessionId: string) => void
  readonly useSessions?: SessionSelector
  readonly useWorkspaces?: WorkspaceSelector
}): JSX.Element {
  const snap = useSessions === undefined
    ? { ids: [] as string[], byId: {} as Record<string, NativeSessionLike> }
    : useSessions(state => state ?? { ids: [], byId: {} })
  const workspaces = useWorkspaces === undefined
    ? undefined
    : useWorkspaces(state => state ?? { items: [], archivedSessionIds: [] })
  const groups = groupNativeTaskSessions(snap, workspaces, t('sidebar.ungrouped'))
  const currentId = resolveCurrentSessionId(snap)
  if (groups.length === 0) return <div className="dsh-st-rail-empty">{t('sidebar.tasksEmpty')}</div>
  return (
    <div className="dsh-st-rail">
      {groups.map(group => (
        <section key={group.id || 'ungrouped'} className="dsh-st-rail-group">
          <div className="dsh-st-rail-head is-static">
            <span className="dsh-st-rail-title">{group.label}</span>
          </div>
          {group.sessions.map(item => (
            <button
              key={item.id}
              type="button"
              className={`dsh-st-rail-session${currentId === item.id ? ' is-on' : ''}`}
              onClick={() => { if (item.id !== undefined) openSession?.(item.id) }}
            >
              <span>{item.title || item.id}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}
