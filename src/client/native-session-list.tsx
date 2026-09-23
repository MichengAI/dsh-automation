import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Button,
  HoverCard,
  Menu,
  Modal,
  StateDot,
  type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { hostHasWorkspaceTree, hostMenuRendersChildren, hostSessionList016, IconArchiveOutline, IconBranchOutline, IconEditOutline, IconEllipsisOutline, IconSettingsOutline, IconTrashOutline } from './host-icons.js'
import type { SessionSelector, Translate, WorkspaceSelector } from './contracts.js'
import {
  ChevronIcon,
  FolderClosedIcon,
  FolderOpenIcon,
  RunningStateDot,
  UnarchiveOutlineIcon,
} from './icons.js'
import {
  nativeSessionHoverStyle,
  scheduledSessionHoverStatuses,
  sessionHoverTime,
  sessionRowTime,
  revealSessionTitle,
  startSessionTitleMarquee,
  stopSessionTitleMarquee,
} from './native-session-menu.js'
import { archiveScheduledGroup, canDeleteScheduledSession, hasArchiveManagerPlugin, scheduledGroupShowsActiveFolder, scheduledSessionMenuActions, scheduledSessionOmitsStatusSlot } from './native-group-actions.js'
import type { AutomationRuntime } from './runtime.js'
import { applyWorkspaceBrowserQuery, formatRunStamp, groupScheduledSessions, groupScheduledSessionsByWorkspaceTree, resolveCurrentSessionId, scheduledSessionNeedsSnapshotRefresh, scheduledSessionVisible, type ArchivedSessionFilter, type NativeSessionLike, type NativeWorkspaceLike, type WorkspaceGroupMode, type WorkspaceListSort } from './schedule-rail-model.js'
import { ScheduleOverview, ScheduleViewSwitch, type ScheduleView } from './schedule-overview.js'
import { WorkspaceToolbar } from './workspace-toolbar.js'
import type { AutomationTaskSettingsRequest } from './task-settings-request.js'

interface SessionStatusLike {
  readonly running?: boolean
  readonly completionUnread?: boolean
  readonly pendingInteraction?: { readonly kind?: string }
}

const EMPTY_SESSION_BY_ID: Record<string, NativeSessionLike> = {}
const EMPTY_WORKSPACES: readonly NativeWorkspaceLike[] = []

export function NativeScheduleSessionList(props: {
  readonly t: Translate
  readonly runtime: AutomationRuntime
  readonly openSession?: (sessionId: string) => void
  readonly useSessions?: SessionSelector
  readonly useWorkspaces?: WorkspaceSelector
  readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>
  readonly archiveSession?: (sessionId: string) => void | Promise<void>
  readonly unarchiveSession?: (sessionId: string) => void | Promise<void>
  readonly deleteSession?: (sessionId: string) => void | Promise<void>
  readonly forkSession?: (sessionId: string) => void | Promise<void>
  readonly notifyArchivedNotOpenable?: () => void
  readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void
  readonly renderSlot?: (name: string, props?: Record<string, unknown>, opts?: { readonly hookContext?: unknown; readonly only?: string }) => ReactNode
  readonly useSessionStatus?: <T>(selector: (state: ReadonlyMap<string, SessionStatusLike>) => T) => T
}): JSX.Element {
  const { t, runtime, openSession, useSessions, useWorkspaces, renameSession, archiveSession, unarchiveSession, deleteSession, forkSession, notifyArchivedNotOpenable, openTaskSettings, renderSlot, useSessionStatus } = props
  const state = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
  const selectedId = useSessions ? useSessions(snap => resolveCurrentSessionId(snap)) : null
  const sessionById: Record<string, NativeSessionLike> = useSessions
    ? useSessions(snap => snap.byId ?? EMPTY_SESSION_BY_ID)
    : EMPTY_SESSION_BY_ID
  const archivedIds: readonly string[] = useWorkspaces ? useWorkspaces(snap => snap.archivedSessionIds ?? []) : []
  const workspaceItems = useWorkspaces ? useWorkspaces(snap => snap.items ?? EMPTY_WORKSPACES) : EMPTY_WORKSPACES
  const sessionStatuses = useSessionStatus ? useSessionStatus(state => state) : undefined
  const projections = useSessions ? useSessions(snap => (snap as { projectionsBySession?: Record<string, { values?: { subagentCatalog?: readonly { id?: string }[] } }> }).projectionsBySession) : undefined
  const [folded, setFolded] = useState<Record<string, boolean>>({})
  const [openMenu, setOpenMenu] = useState<string>()
  const [openGroupMenu, setOpenGroupMenu] = useState<string>()
  const [archiveGroupTarget, setArchiveGroupTarget] = useState<{ readonly id: string; readonly name: string; readonly sessionIds: readonly string[] }>()
  const [archiveGroupBusy, setArchiveGroupBusy] = useState(false)
  const [archiveGroupError, setArchiveGroupError] = useState<string>()
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<{ readonly id: string; readonly title: string }>()
  const [deleteSessionBusy, setDeleteSessionBusy] = useState(false)
  const [deleteSessionError, setDeleteSessionError] = useState<string>()
  const [archiveManagerInstalled, setArchiveManagerInstalled] = useState(() => typeof document !== 'undefined' && hasArchiveManagerPlugin(document))
  const [archivedFilter, setArchivedFilter] = useState<ArchivedSessionFilter>('default')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<WorkspaceListSort>('time')
  const [groupMode, setGroupMode] = useState<WorkspaceGroupMode>('workspace')
  const [view, setView] = useState<ScheduleView>('runs')
  const snapshotRefreshFor = useRef<string | null>(null)
  const archived = useMemo(() => new Set(archivedIds), [archivedIds])
  const groups = useMemo(() => {
    const snapshot = state.snapshot
    if (snapshot === undefined) return []
    const timeZoneById = new Map(snapshot.automations.map(item => [item.id, item.timeZone]))
    return groupScheduledSessions(snapshot.automations, snapshot.runs).map((group) => ({
      ...group,
      sessions: group.sessions.filter((session) => scheduledSessionVisible(session.id, archived, hostMenuRendersChildren() ? archivedFilter : 'default')).map((session) => {
        const run = snapshot.runs.find((item) => item.sessionId === session.id)
        return {
          ...session,
          title: formatRunStamp((run && (run.startedAt || run.scheduledFor)) || '', timeZoneById.get(group.id)),
          updatedAt: (run && (run.startedAt || run.scheduledFor)) || '',
          running: session.running || sessionById[session.id]?.running === true,
        }
      }),
    })).filter((group) => group.sessions.length > 0)
  }, [archived, archivedFilter, sessionById, state.snapshot])
  useEffect(() => {
    if (!scheduledSessionNeedsSnapshotRefresh(selectedId, state.snapshot?.runs)) {
      snapshotRefreshFor.current = null
      return
    }
    if (snapshotRefreshFor.current === selectedId) return
    snapshotRefreshFor.current = selectedId
    void runtime.refresh().catch(() => undefined)
  }, [runtime, selectedId, state.snapshot?.runs])
  const effectiveGroup = groupMode === 'workspace-tree' && !hostHasWorkspaceTree() ? 'workspace' : groupMode
  const visibleGroups = useMemo(() => {
    const source = effectiveGroup === 'workspace-tree'
      ? groupScheduledSessionsByWorkspaceTree(groups.flatMap((group) => group.sessions.map((session) => ({ ...session, automationId: group.id }))), workspaceItems, t('sidebar.ungrouped'))
      : groups
    return applyWorkspaceBrowserQuery(source.map((group) => ({ ...group, name: group.name })), query, sort, effectiveGroup)
  }, [effectiveGroup, groups, query, sort, t, workspaceItems])
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
    const refresh = (): void => { setArchiveManagerInstalled(hasArchiveManagerPlugin(document)) }
    refresh()
    const observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, { childList: true, subtree: true })
    return () => { observer.disconnect() }
  }, [])
  const canArchiveGroup = archiveManagerInstalled && archiveSession !== undefined
  const canDeleteSession = canDeleteScheduledSession(archiveManagerInstalled, deleteSession)
  const canUnarchive = unarchiveSession !== undefined
  const confirmArchiveGroup = (): void => {
    if (archiveGroupTarget === undefined || archiveSession === undefined || archiveGroupBusy) return
    const target = archiveGroupTarget
    setArchiveGroupBusy(true)
    setArchiveGroupError(undefined)
    void archiveScheduledGroup(target.sessionIds, archiveSession)
      .then(() => { setArchiveGroupTarget(undefined) })
      .catch((caught: unknown) => { setArchiveGroupError(caught instanceof Error ? caught.message : t('error.action')) })
      .finally(() => { setArchiveGroupBusy(false) })
  }
  const confirmDeleteSession = (): void => {
    if (deleteSessionTarget === undefined || deleteSession === undefined || deleteSessionBusy) return
    const target = deleteSessionTarget
    setDeleteSessionBusy(true)
    setDeleteSessionError(undefined)
    void Promise.resolve(deleteSession(target.id))
      .then(() => { setDeleteSessionTarget(undefined) })
      .catch((caught: unknown) => { setDeleteSessionError(caught instanceof Error ? caught.message : t('error.action')) })
      .finally(() => { setDeleteSessionBusy(false) })
  }
  return (
    <div className={hostMenuRendersChildren() ? 'dsh-st-n is-017' : hostSessionList016() ? 'dsh-st-n is-016' : 'dsh-st-n'}>
      <ScheduleViewSwitch t={t} view={view} onChange={setView} />
      {view === 'overview'
        ? state.snapshot === undefined
          ? <div className='dsh-st-n-empty'>{state.phase === 'loading' ? t('loading') : t('overview.empty')}</div>
          : <ScheduleOverview
              t={t}
              automations={state.snapshot.automations}
              onToggleAutomation={(automationId, mutation) => runtime.mutateAutomation(automationId, mutation)}
              {...(openTaskSettings === undefined ? {} : { openTaskSettings })}
              {...(state.snapshot.serverNow === undefined ? {} : { serverNow: state.snapshot.serverNow })}
            />
        : <>
            <WorkspaceToolbar t={t} query={query} sort={sort} groupMode={effectiveGroup} archivedFilter={archivedFilter} onQueryChange={setQuery} onSortChange={setSort} onGroupModeChange={setGroupMode} {...(hostMenuRendersChildren() ? { onArchivedFilterChange: setArchivedFilter } : {})} />
            <div className='dsh-st-n-list-area'>
            <div className='dsh-st-n-tree' role='tree'>
              {state.phase === 'loading' && visibleGroups.length === 0 && <div className='dsh-st-n-empty'>{t('loading')}</div>}
              {visibleGroups.length === 0 && state.phase !== 'loading' && <div className='dsh-st-n-empty'>{t('sidebar.empty')}</div>}
              {visibleGroups.map((group) => {
                const expanded = folded[group.id] !== true
                const hasCurrentSession = scheduledGroupShowsActiveFolder(group.sessions.map(session => session.id), selectedId)
                const depth = 'depth' in group ? group.depth : 0
                const automationIds = [...new Set(group.sessions.flatMap((session) => 'automationId' in session && typeof session.automationId === 'string' ? [session.automationId] : []))]
                const treeTask = effectiveGroup === 'workspace-tree' && automationIds.length === 1
                  ? state.snapshot?.automations.find(item => item.id === automationIds[0])
                  : undefined
                const taskAutomationId: string | undefined = effectiveGroup === 'workspace-tree' ? treeTask?.id : group.id
                const taskSettingsName = effectiveGroup === 'workspace-tree' ? treeTask?.name : group.name
                return (
                  <div key={group.id === '' ? 'ungrouped' : group.id} className='dsh-st-n-group' style={depth > 0 ? (hostMenuRendersChildren() || hostSessionList016() ? { ['--dsh-workspace-indent' as string]: `${depth * 12}px` } : { paddingLeft: depth * 16 }) : undefined}>
                    {effectiveGroup !== 'list' && <NativeScheduleGroupRow
                      t={t}
                      id={group.id}
                      name={group.name}
                      sessionIds={group.sessions.map(session => session.id)}
                      expanded={expanded}
                      hasCurrentSession={hasCurrentSession}
                      menuOpen={openGroupMenu === group.id}
                      canArchiveGroup={canArchiveGroup}
                      showTaskSettings={taskAutomationId !== undefined}
                      onToggle={() => setFolded((current) => ({ ...current, [group.id]: expanded }))}
                      onMenuChange={(open) => {
                        setOpenMenu(undefined)
                        setOpenGroupMenu(open ? group.id : undefined)
                      }}
                      onTaskSettings={() => {
                        if (taskAutomationId === undefined) return
                        openTaskSettings?.({ automationId: taskAutomationId, name: taskSettingsName ?? group.name, sessionIds: group.sessions.map(session => session.id) })
                      }}
                      onArchiveGroup={() => {
                        setArchiveGroupError(undefined)
                        setArchiveGroupTarget({ id: group.id, name: group.name, sessionIds: group.sessions.map(session => session.id) })
                      }}
                    />}
                    {(effectiveGroup === 'list' || expanded) && group.sessions.map((session) => (
                      <NativeSessionRow
                        key={session.id}
                        t={t}
                        flat={effectiveGroup === 'list'}
                        id={session.id}
                        title={session.title}
                        hoverTitle={String(sessionById[session.id]?.displayTitle ?? sessionById[session.id]?.title ?? group.name)}
                        updatedAt={session.updatedAt}
                        running={session.running}
                        archived={archived.has(session.id)}
                        selected={selectedId === session.id}
                        menuOpen={openMenu === session.id}
                        canDelete={canDeleteSession}
                        canUnarchive={canUnarchive}
                        hoverStatuses={scheduledSessionHoverStatuses({
                          running: session.running || sessionStatuses?.get(session.id)?.running === true,
                          archived: archived.has(session.id),
                          completed: sessionStatuses?.get(session.id)?.completionUnread === true,
                          ...(sessionStatuses?.get(session.id)?.pendingInteraction?.kind === undefined ? {} : { pendingKind: sessionStatuses.get(session.id)?.pendingInteraction?.kind ?? '' }),
                          runningSubagentCount: (projections?.[session.id]?.values?.subagentCatalog ?? []).filter((child) => child.id !== undefined && sessionStatuses?.get(child.id)?.running === true).length,
                        }, t)}
                        {...(renderSlot === undefined ? {} : { renderSlot })}
                        onMenuChange={(open) => {
                          setOpenGroupMenu(undefined)
                          setOpenMenu(open ? session.id : undefined)
                        }}
                        onOpen={() => {
                          setOpenMenu(undefined)
                          if (archived.has(session.id)) {
                            notifyArchivedNotOpenable?.()
                            return
                          }
                          openSession?.(session.id)
                        }}
                        onDeleteSession={() => {
                          setDeleteSessionError(undefined)
                          setDeleteSessionTarget({
                            id: session.id,
                            title: String(sessionById[session.id]?.displayTitle ?? sessionById[session.id]?.title ?? session.title),
                          })
                        }}
                        {...(renameSession === undefined ? {} : { renameSession })}
                        {...(archiveSession === undefined ? {} : { archiveSession })}
                        {...(unarchiveSession === undefined ? {} : { unarchiveSession })}
                        {...(forkSession === undefined ? {} : { forkSession })}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
            </div>
          </>}
      <Modal
        open={archiveGroupTarget !== undefined}
        onClose={() => {
          if (archiveGroupBusy) return
          setArchiveGroupTarget(undefined)
          setArchiveGroupError(undefined)
        }}
        closeLabel={t('session.archiveGroupClose')}
        title={t('session.archiveGroup')}
        footer={<div className='dsh-st-n-dialog-actions'>
          <Button variant='outline' disabled={archiveGroupBusy} onClick={() => { setArchiveGroupTarget(undefined); setArchiveGroupError(undefined) }}>{t('session.archiveGroupCancel')}</Button>
          <Button variant='outline' className='dsh-st-n-danger-button' disabled={archiveGroupBusy} onClick={confirmArchiveGroup}>{t('session.archiveGroupConfirm')}</Button>
        </div>}
      >
        <p className='dsh-st-n-dialog-copy'>{archiveGroupTarget === undefined ? '' : t('session.archiveGroupDescription', { name: archiveGroupTarget.name, count: archiveGroupTarget.sessionIds.length })}</p>
        {archiveGroupBusy && <div className='dsh-st-n-dialog-status' role='status'>{t('session.archiveGroupPending')}</div>}
        {archiveGroupError !== undefined && <div className='dsh-st-n-dialog-error' role='alert'>{t('session.archiveGroupFailed', { message: archiveGroupError })}</div>}
      </Modal>
      <Modal
        open={deleteSessionTarget !== undefined}
        onClose={() => {
          if (deleteSessionBusy) return
          setDeleteSessionTarget(undefined)
          setDeleteSessionError(undefined)
        }}
        closeLabel={t('session.deleteSessionClose')}
        title={t('session.deleteSession')}
        footer={<div className='dsh-st-n-dialog-actions'>
          <Button variant='outline' disabled={deleteSessionBusy} onClick={() => { setDeleteSessionTarget(undefined); setDeleteSessionError(undefined) }}>{t('session.deleteSessionCancel')}</Button>
          <Button variant='outline' className='dsh-st-n-danger-button' disabled={deleteSessionBusy} onClick={confirmDeleteSession}>{t('session.deleteSessionConfirm')}</Button>
        </div>}
      >
        <p className='dsh-st-n-dialog-copy'>{deleteSessionTarget === undefined ? '' : t('session.deleteSessionDescription', { name: deleteSessionTarget.title })}</p>
        {deleteSessionBusy && <div className='dsh-st-n-dialog-status' role='status'>{t('session.deleteSessionPending')}</div>}
        {deleteSessionError !== undefined && <div className='dsh-st-n-dialog-error' role='alert'>{t('session.deleteSessionFailed', { message: deleteSessionError })}</div>}
      </Modal>
    </div>
  )
}

function NativeScheduleGroupRow(props: {
  readonly t: Translate
  readonly id: string
  readonly name: string
  readonly sessionIds: readonly string[]
  readonly expanded: boolean
  readonly hasCurrentSession: boolean
  readonly menuOpen: boolean
  readonly canArchiveGroup: boolean
  readonly showTaskSettings: boolean
  readonly onToggle: () => void
  readonly onMenuChange: (open: boolean) => void
  readonly onTaskSettings: () => void
  readonly onArchiveGroup: () => void
}): JSX.Element {
  const { t, id, name, expanded, hasCurrentSession, menuOpen, canArchiveGroup, showTaskSettings, onToggle, onMenuChange, onTaskSettings, onArchiveGroup } = props
  const items: MenuEntry[] = [
    ...(showTaskSettings ? [{ id: 'task-settings', label: t('session.taskSettings'), icon: <IconSettingsOutline size={16} /> }] : []),
    ...(canArchiveGroup
      ? [
          ...(showTaskSettings ? [{ type: 'separator' as const, id: 'archive-separator' }] : []),
          { id: 'archive-group', label: t('session.archiveGroup'), icon: <IconArchiveOutline size={16} />, danger: true },
        ]
      : []),
  ]
  const rowClass = 'dsh-st-n-row' + (hasCurrentSession ? ' has-current-session' : '') + (menuOpen ? ' is-menu' : '')
  return (
    <div
      className={rowClass}
      role='treeitem'
      aria-expanded={expanded}
      data-n-group={id}
      onClick={onToggle}
    >
      <span className='dsh-st-n-slot dsh-st-n-folder'>{expanded ? <FolderOpenIcon width={16} height={16} /> : <FolderClosedIcon width={16} height={16} />}</span>
      <span className='dsh-st-n-slot dsh-st-n-chevron'><ChevronIcon width={14} height={14} className={'dsh-st-n-arrow' + (expanded ? ' is-open' : '')} /></span>
      <span className='dsh-st-n-project-text'><span className='dsh-st-n-title'>{name}</span></span>
      <span className='dsh-st-n-acts'>
        <Menu
          open={menuOpen}
          onClose={() => { onMenuChange(false) }}
          items={items}
          onSelect={(action) => {
            onMenuChange(false)
            if (action === 'task-settings') onTaskSettings()
            if (action === 'archive-group') onArchiveGroup()
          }}
          portal
          closeOnPointerLeave
          anchor={<button
            type='button'
            className='dsh-st-n-ico'
            aria-label={t('session.groupActions', { name })}
            onMouseDown={(event) => { event.stopPropagation() }}
            onClick={(event) => { event.stopPropagation(); onMenuChange(!menuOpen) /* 官方 Menu 受控，不会自己开；官方行也是锚点 toggle */ }}
          ><IconEllipsisOutline size={16} /></button>}
        />
      </span>
    </div>
  )
}

function NativeSessionRow(props: {
  readonly t: Translate
  readonly flat: boolean
  readonly id: string
  readonly title: string
  readonly hoverTitle?: string
  readonly updatedAt: string
  readonly running: boolean
  readonly archived: boolean
  readonly selected: boolean
  readonly menuOpen: boolean
  readonly canDelete: boolean
  readonly canUnarchive: boolean
  readonly hoverStatuses: readonly { readonly state: 'ongoing' | 'warning' | 'done' | 'idle' | 'archived'; readonly label: string; readonly trailing?: string }[]
  readonly renderSlot?: (name: string, props?: Record<string, unknown>, opts?: { readonly hookContext?: unknown; readonly only?: string }) => ReactNode
  readonly onMenuChange: (open: boolean) => void
  readonly onOpen: () => void
  readonly onDeleteSession?: () => void
  readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>
  readonly archiveSession?: (sessionId: string) => void | Promise<void>
  readonly unarchiveSession?: (sessionId: string) => void | Promise<void>
  readonly forkSession?: (sessionId: string) => void | Promise<void>
}): JSX.Element {
  const { t, flat, id, title, hoverTitle, updatedAt, running, archived, selected, menuOpen, canDelete, canUnarchive, hoverStatuses, renderSlot, onMenuChange, onOpen, onDeleteSession, renameSession, archiveSession, unarchiveSession, forkSession } = props
  const omitStatusSlot = scheduledSessionOmitsStatusSlot(flat, running)
  const rowRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef<HTMLDivElement>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [hoverStyle, setHoverStyle] = useState<CSSProperties>({})
  const hoverTimer = useRef<number | undefined>(undefined)
  const titleRef = useRef<HTMLSpanElement>(null)
  const titleFrame = useRef({ id: 0 })
  useEffect(() => () => { stopSessionTitleMarquee(titleRef.current, titleFrame.current) }, [])
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(title)
  useEffect(() => { setDraft(title) }, [title])
  useEffect(() => {
    if (!hoverOpen || menuOpen) return
    const update = (): void => {
      const row = rowRef.current?.getBoundingClientRect()
      const card = hoverRef.current
      if (row === undefined) return
      const size = card === null ? { width: 220, height: 96 } : { width: card.offsetWidth, height: card.offsetHeight }
      setHoverStyle(nativeSessionHoverStyle({ right: row.right, top: row.top }, size, { width: window.innerWidth, height: window.innerHeight }))
    }
    update()
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      document.removeEventListener('scroll', update, true)
    }
  }, [hoverOpen, menuOpen, title, updatedAt, running])
  useEffect(() => () => {
    if (hoverTimer.current !== undefined) window.clearTimeout(hoverTimer.current)
  }, [])
  const run = (action: () => void | Promise<void>): void => { void Promise.resolve(action()).catch(() => undefined) }
  const showHover = (): void => {
    if (menuOpen) return
    if (hoverTimer.current !== undefined) window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHoverOpen(true), 500)
  }
  const hideHover = (): void => {
    if (hoverTimer.current !== undefined) window.clearTimeout(hoverTimer.current)
    setHoverOpen(false)
  }
  const rowClass = 'dsh-st-n-sess' + (selected ? ' is-on' : '') + (menuOpen ? ' is-menu' : '') + (omitStatusSlot ? ' is-flat-idle' : '') + (archived ? ' is-archived' : '')
  if (renaming) {
    return (
      <div className={rowClass} ref={rowRef}>
        <input className='dsh-st-n-rename' value={draft} autoFocus aria-label={t('session.rename')} onChange={(event) => setDraft(event.target.value)} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); setRenaming(false); if (draft.trim() !== '' && draft.trim() !== title) run(() => renameSession?.(id, draft.trim())) }
          if (event.key === 'Escape') { event.preventDefault(); setRenaming(false); setDraft(title) }
        }} onBlur={() => { setRenaming(false); if (draft.trim() !== '' && draft.trim() !== title) run(() => renameSession?.(id, draft.trim())) }} />
      </div>
    )
  }
  const displayTitle = (hoverTitle ?? title).trim() || title
  const menuSlot = renderSlot !== undefined && hostMenuRendersChildren() ? ['rename', 'fork', 'archive', 'archive-manager.delete-session'].map((only) => renderSlot('sidebar.workspaces.session.menu.item', {
    sessionId: id,
    displayTitle,
  }, { hookContext: [menuOpen, (open: boolean) => onMenuChange(open)], only })) : undefined
  const items: MenuEntry[] = menuSlot !== undefined ? [] : scheduledSessionMenuActions({ canDelete, archived, canUnarchive }).map((action) => {
    if (action === 'rename') return { id: action, label: t('session.rename'), icon: <IconEditOutline /> }
    if (action === 'fork') return { id: action, label: t('session.fork'), icon: <IconBranchOutline /> }
    if (action === 'archive') return { id: action, label: t('session.archive'), icon: <IconArchiveOutline size={16} /> }
    if (action === 'unarchive') return { id: action, label: t('session.unarchive'), icon: <UnarchiveOutlineIcon width={16} height={16} /> }
    return { id: action, label: t('session.deleteSession'), icon: <IconTrashOutline />, danger: true }
  })
  const primary = hoverStatuses.find((status) => status.state !== 'archived')
  const showDot = !archived && primary !== undefined && primary.state !== 'idle'
  const trailing = primary?.trailing
  const hoverBody = (
    <>
      <div className='dsh-st-n-hover-title'>{displayTitle}</div>
      <div className='dsh-st-n-hover-time'>{sessionHoverTime(updatedAt, t)}</div>
      {hoverStatuses.map((status) => (
        <div key={status.label} className='dsh-st-n-hover-state'>
          {status.state === 'archived'
            ? <IconArchiveOutline size={14} />
            : <StateDot state={status.state === 'ongoing' ? 'ongoing' : status.state === 'warning' ? 'warning' : status.state === 'done' ? 'done' : 'idle'} size={10} />}
          {status.label}
        </div>
      ))}
    </>
  )
  const row = (
    <div className={rowClass} ref={rowRef} role='treeitem' tabIndex={0} aria-selected={selected} data-n-menu-root={id} onClick={onOpen} onMouseEnter={() => { if (hostMenuRendersChildren()) startSessionTitleMarquee(titleRef.current, titleFrame.current); else if (hostSessionList016()) revealSessionTitle(titleRef.current, true); showHover() }} onMouseLeave={() => { if (hostMenuRendersChildren()) stopSessionTitleMarquee(titleRef.current, titleFrame.current); else if (hostSessionList016()) revealSessionTitle(titleRef.current, false); hideHover() }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); hideHover(); onMenuChange(true) }}>
      {!omitStatusSlot && <span className='dsh-st-n-slot'>{showDot && primary !== undefined ? <StateDot state={primary.state === 'ongoing' ? 'ongoing' : primary.state === 'warning' ? 'warning' : 'done'} size={10} /> : running ? <RunningStateDot /> : null}</span>}
      <span ref={titleRef} className='dsh-st-n-title' onDoubleClick={hostMenuRendersChildren() ? (event) => { if (renameSession === undefined) return; event.stopPropagation(); setRenaming(true) } : undefined}>{title}</span>
      <span className='dsh-st-n-time' aria-hidden={trailing === undefined ? undefined : true}>{trailing ?? sessionRowTime(updatedAt, t)}</span>
      <span className='dsh-st-n-acts'>
        {menuSlot === undefined && archived && canUnarchive && (
          <button type='button' className='dsh-st-n-restore' onMouseDown={(event) => { event.stopPropagation() }} onClick={(event) => { event.stopPropagation(); run(() => unarchiveSession?.(id)) }}>{t('session.unarchive')}</button>
        )}
        <Menu
          open={menuOpen}
          onClose={() => { onMenuChange(false) }}
          items={items}
          onSelect={(action) => {
            onMenuChange(false)
            if (action === 'rename') setRenaming(true)
            if (action === 'fork') run(() => forkSession?.(id))
            if (action === 'archive') run(() => archiveSession?.(id))
            if (action === 'unarchive') run(() => unarchiveSession?.(id))
            if (action === 'delete-session') onDeleteSession?.()
          }}
          portal
          closeOnPointerLeave
          anchor={<button
            type='button'
            className='dsh-st-n-ico'
            aria-label={t('session.moreActions', { title })}
            onMouseDown={(event) => { event.stopPropagation() }}
            onClick={(event) => { event.stopPropagation(); hideHover(); onMenuChange(!menuOpen) /* 官方 Menu 受控，不会自己开；官方行也是锚点 toggle */ }}
          ><IconEllipsisOutline size={16} /></button>}
        >
          {menuSlot}
        </Menu>
        {renderSlot?.('sidebar.workspaces.session.row.action', { sessionId: id, displayTitle }, { only: 'archive' })}
      </span>
      {typeof HoverCard !== 'function' && hoverOpen && !menuOpen && typeof document !== 'undefined' && createPortal(
        <div ref={hoverRef} className='dsh-st-n-hover' style={hoverStyle} onMouseEnter={showHover} onMouseLeave={hideHover}>
          {hoverBody}
        </div>,
        document.body,
      )}
    </div>
  )
  if (typeof HoverCard !== 'function') return row
  return (
    <HoverCard
      anchor={row}
      content={hoverBody}
      openDelayMs={hostMenuRendersChildren() ? 800 : 500}
      disabled={menuOpen}
      copyText={displayTitle}
      copyLabel={t('session.copy')}
      copiedLabel={t('session.copied')}
    />
  )
}
