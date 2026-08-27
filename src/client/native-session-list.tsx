import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  Button,
  IconArchiveOutline20,
  IconEllipsisOutline16,
  Menu,
  Modal,
  type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ModelTranslate, SessionSelector, Translate, WorkspaceSelector } from './contracts.js'
import type { PermissionTranslate } from './permissions.js'
import {
  ArchiveIcon,
  BranchIcon,
  ClockIcon,
  EllipsisIcon,
  FolderClosedIcon,
  FolderOpenIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RunningStateDot,
  TrashIcon,
} from './icons.js'
import {
  nativeSessionHoverStyle,
  nativeSessionMenuStyle,
  nextOpenSessionMenu,
  pointerPoint,
  relativeTime,
  shouldCloseNativeSessionMenu,
  type NativeSessionMenuState,
} from './native-session-menu.js'
import { archiveScheduledGroup, hasArchiveManagerPlugin, scheduledGroupShowsActiveFolder } from './native-group-actions.js'
import type { AutomationRuntime } from './runtime.js'
import type { AutomationViewModel } from './protocol.js'
import { formatSchedule, formatWithin } from './helpers.js'
import { applyWorkspaceBrowserQuery, formatRunStamp, groupScheduledSessions, keepScheduledSessionLink, type NativeSessionLike } from './schedule-rail-model.js'
import { WorkspaceToolbar } from './workspace-toolbar.js'
import { DeleteConfirmation } from './delete-confirmation.js'
import { AutomationTaskCreator, AutomationTaskEditor } from './AutomationView.js'

export {
  nativeSessionMenuStyle,
  nextOpenSessionMenu,
  nextOpenSessionMenuId,
  pointerPoint,
  relativeTime,
  resolveEventElement,
  shouldCloseNativeSessionMenu,
} from './native-session-menu.js'

const EMPTY_SESSION_BY_ID: Record<string, NativeSessionLike> = {}

export function NativeScheduleSessionList(props: {
  readonly t: Translate
  readonly permissionT?: PermissionTranslate
  readonly modelT?: ModelTranslate
  readonly runtime: AutomationRuntime
  readonly openSession?: (sessionId: string) => void
  readonly useSessions?: SessionSelector
  readonly useWorkspaces?: WorkspaceSelector
  readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>
  readonly archiveSession?: (sessionId: string) => void | Promise<void>
  readonly deleteSession?: (sessionId: string) => void | Promise<void>
  readonly forkSession?: (sessionId: string) => void | Promise<void>
}): JSX.Element {
  const { t, permissionT, modelT, runtime, openSession, useSessions, useWorkspaces, renameSession, archiveSession, forkSession } = props
  const state = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
  const selectedId = useSessions ? useSessions(snap => snap.current ?? null) : null
  const sessionById: Record<string, NativeSessionLike> = useSessions
    ? useSessions(snap => snap.byId ?? EMPTY_SESSION_BY_ID)
    : EMPTY_SESSION_BY_ID
  const archivedIds: readonly string[] = useWorkspaces ? useWorkspaces(snap => snap.archivedSessionIds ?? []) : []
  const [folded, setFolded] = useState<Record<string, boolean>>({})
  const [openMenu, setOpenMenu] = useState<NativeSessionMenuState>(null)
  const [openGroupMenu, setOpenGroupMenu] = useState<string>()
  const [archiveGroupTarget, setArchiveGroupTarget] = useState<{ readonly id: string; readonly name: string; readonly sessionIds: readonly string[] }>()
  const [archiveGroupBusy, setArchiveGroupBusy] = useState(false)
  const [archiveGroupError, setArchiveGroupError] = useState<string>()
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<AutomationViewModel>()
  const [deleteTaskBusy, setDeleteTaskBusy] = useState(false)
  const [editTaskTarget, setEditTaskTarget] = useState<AutomationViewModel>()
  const [creatingTask, setCreatingTask] = useState(false)
  const [archiveManagerInstalled, setArchiveManagerInstalled] = useState(() => typeof document !== 'undefined' && hasArchiveManagerPlugin(document))
  const [query, setQuery] = useState('')
  const archived = useMemo(() => new Set(archivedIds), [archivedIds])
  const listedIds: readonly string[] | undefined = useSessions
    ? useSessions(snap => Array.isArray(snap.ids) ? snap.ids : undefined)
    : undefined
  const presentIds = useMemo(() => {
    if (listedIds !== undefined) return new Set(listedIds)
    const keys = Object.keys(sessionById)
    return keys.length > 0 ? new Set(keys) : undefined
  }, [listedIds, sessionById])
  const groups = useMemo(() => {
    const snapshot = state.snapshot
    if (snapshot === undefined) return []
    const automationById = new Map(snapshot.automations.map(item => [item.id, item]))
    return groupScheduledSessions(snapshot.automations, snapshot.runs).map((group) => ({
      ...group,
      automation: automationById.get(group.id),
      sessions: group.sessions.filter((session) => keepScheduledSessionLink(session.id, archived, presentIds)).map((session) => {
        const run = snapshot.runs.find((item) => item.sessionId === session.id)
        return {
          ...session,
          title: formatRunStamp((run && (run.startedAt || run.scheduledFor)) || ''),
          updatedAt: (run && (run.startedAt || run.scheduledFor)) || '',
          running: session.running || sessionById[session.id]?.running === true,
          runStatus: run?.status,
        }
      }),
    }))
  }, [archived, presentIds, sessionById, state.snapshot])
  const visibleGroups = useMemo(() => applyWorkspaceBrowserQuery(groups.map((group) => ({ ...group, name: group.name })), query, 'time', 'workspace'), [groups, query])
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
    const refresh = (): void => { setArchiveManagerInstalled(hasArchiveManagerPlugin(document)) }
    refresh()
    const observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, { childList: true, subtree: true })
    return () => { observer.disconnect() }
  }, [])
  const canArchiveGroup = archiveManagerInstalled && archiveSession !== undefined
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
  return (
    <div className='dsh-st-n'>
      <>
            <WorkspaceToolbar t={t} query={query} onQueryChange={setQuery} onCreateTask={() => setCreatingTask(true)} />
            <div className='dsh-st-n-tree' role='tree'>
              {state.phase === 'loading' && visibleGroups.length === 0 && <div className='dsh-st-n-empty'>{t('loading')}</div>}
              {visibleGroups.length === 0 && state.phase !== 'loading' && <div className='dsh-st-n-empty'>{t('sidebar.empty')}</div>}
              {visibleGroups.map((group) => {
                const expanded = folded[group.id] !== true
                const hasCurrentSession = scheduledGroupShowsActiveFolder(expanded, group.sessions.map(session => session.id), selectedId)
                return (
                  <div key={group.id} className='dsh-st-n-group'>
                    <NativeScheduleGroupRow
                      t={t}
                      id={group.id}
                      name={group.name}
                      {...(group.automation === undefined ? {} : { automation: group.automation })}
                      sessionIds={group.sessions.map(session => session.id)}
                      expanded={expanded}
                      hasCurrentSession={hasCurrentSession}
                      menuOpen={openGroupMenu === group.id}
                      canArchiveGroup={canArchiveGroup}
                      onRunTask={() => { void runtime.runNow(group.id) }}
                      onToggleTask={() => { void runtime.mutateAutomation(group.id, group.automation?.status === 'active' ? 'pause' : 'resume') }}
                      onDeleteTask={() => { if (group.automation !== undefined) setDeleteTaskTarget(group.automation) }}
                      onToggle={() => setFolded((current) => ({ ...current, [group.id]: expanded }))}
                      onMenuChange={(open) => {
                        setOpenMenu(null)
                        setOpenGroupMenu(open ? group.id : undefined)
                      }}
                      onTaskSettings={() => {
                        if (group.automation !== undefined) setEditTaskTarget(group.automation)
                      }}
                      onArchiveGroup={() => {
                        setArchiveGroupError(undefined)
                        setArchiveGroupTarget({ id: group.id, name: group.name, sessionIds: group.sessions.map(session => session.id) })
                      }}
                    />
                    {expanded && group.sessions.map((session) => (
                      <NativeSessionRow
                        key={session.id}
                        t={t}
                        id={session.id}
                        title={session.title}
                        hoverTitle={String(sessionById[session.id]?.displayTitle ?? sessionById[session.id]?.title ?? group.name)}
                        updatedAt={session.updatedAt}
                        running={session.running}
                        {...(session.runStatus === undefined ? {} : { runStatus: session.runStatus })}
                        selected={selectedId === session.id}
                        menuOpen={openMenu?.id === session.id}
                        menuPoint={openMenu === null || openMenu.id !== session.id ? { x: 8, y: 8 } : { x: openMenu.x, y: openMenu.y }}
                        onToggleMenu={(event) => {
                          setOpenGroupMenu(undefined)
                          setOpenMenu((current) => nextOpenSessionMenu(current, session.id, pointerPoint(event)))
                        }}
                        onCloseMenu={() => setOpenMenu((current) => current?.id === session.id ? null : current)}
                        onOpen={() => {
                          setOpenMenu(null)
                          openSession?.(session.id)
                        }}
                        {...(renameSession === undefined ? {} : { renameSession })}
                        {...(archiveSession === undefined ? {} : { archiveSession })}
                        {...(forkSession === undefined ? {} : { forkSession })}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </>
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
      <DeleteConfirmation
        target={deleteTaskTarget}
        t={t}
        busy={deleteTaskBusy}
        onCancel={() => setDeleteTaskTarget(undefined)}
        onConfirm={() => {
          const target = deleteTaskTarget
          if (target === undefined) return
          setDeleteTaskBusy(true)
          void runtime.mutateAutomation(target.id, 'delete')
            .then(() => setDeleteTaskTarget(undefined))
            .finally(() => setDeleteTaskBusy(false))
        }}
      />
      {editTaskTarget !== undefined && state.snapshot !== undefined && permissionT !== undefined && modelT !== undefined && (
        <AutomationTaskEditor
          item={editTaskTarget}
          snapshot={state.snapshot}
          t={t}
          permissionT={permissionT}
          modelT={modelT}
          runtime={runtime}
          onClose={() => setEditTaskTarget(undefined)}
        />
      )}
      {creatingTask && state.snapshot !== undefined && permissionT !== undefined && modelT !== undefined && (
        <AutomationTaskCreator snapshot={state.snapshot} t={t} permissionT={permissionT} modelT={modelT} runtime={runtime} onClose={() => setCreatingTask(false)} />
      )}
    </div>
  )
}

function NativeScheduleGroupRow(props: {
  readonly t: Translate
  readonly id: string
  readonly name: string
  readonly automation?: AutomationViewModel
  readonly sessionIds: readonly string[]
  readonly expanded: boolean
  readonly hasCurrentSession: boolean
  readonly menuOpen: boolean
  readonly canArchiveGroup: boolean
  readonly onRunTask: () => void
  readonly onToggleTask: () => void
  readonly onDeleteTask: () => void
  readonly onToggle: () => void
  readonly onMenuChange: (open: boolean) => void
  readonly onTaskSettings: () => void
  readonly onArchiveGroup: () => void
}): JSX.Element {
  const { t, id, name, automation, expanded, hasCurrentSession, menuOpen, canArchiveGroup, onToggle, onMenuChange, onTaskSettings, onArchiveGroup, onRunTask, onToggleTask, onDeleteTask } = props
  const rowRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef<HTMLDivElement>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [hoverStyle, setHoverStyle] = useState<CSSProperties>({})
  const hoverTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => { if (hoverTimer.current !== undefined) window.clearTimeout(hoverTimer.current) }, [])
  useEffect(() => {
    if (!hoverOpen || menuOpen) return
    const update = (): void => {
      const row = rowRef.current?.getBoundingClientRect()
      const card = hoverRef.current
      if (row === undefined) return
      const size = card === null ? { width: 240, height: 120 } : { width: card.offsetWidth, height: card.offsetHeight }
      setHoverStyle(nativeSessionHoverStyle({ right: row.right, top: row.top }, size, { width: window.innerWidth, height: window.innerHeight }))
    }
    update()
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    return () => { window.removeEventListener('resize', update); document.removeEventListener('scroll', update, true) }
  }, [hoverOpen, menuOpen, name, automation?.nextRunAt, automation?.status])
  const showHover = (): void => {
    if (menuOpen) return
    if (hoverTimer.current !== undefined) window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHoverOpen(true), 500)
  }
  const hideHover = (): void => {
    if (hoverTimer.current !== undefined) window.clearTimeout(hoverTimer.current)
    setHoverOpen(false)
  }
  const items: MenuEntry[] = [
    { id: 'task-settings', label: t('session.taskSettings'), icon: <PencilIcon width={16} height={16} /> },
    { id: 'run-task', label: t('menu.run'), icon: <PlayIcon width={16} height={16} /> },
    { id: 'toggle-task', label: automation?.status === 'active' ? t('menu.pause') : t('menu.resume'), icon: automation?.status === 'active' ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} /> },
    { id: 'delete-task', label: t('menu.delete'), icon: <TrashIcon width={16} height={16} />, danger: true },
    ...(canArchiveGroup
      ? [
          { type: 'separator' as const, id: 'archive-separator' },
          { id: 'archive-group', label: t('session.archiveGroup'), icon: <IconArchiveOutline20 size={16} />, danger: true },
        ]
      : []),
  ]
  const rowClass = 'dsh-st-n-row' + (hasCurrentSession ? ' has-current-session' : '') + (menuOpen ? ' is-menu' : '')
  return (
    <div
      ref={rowRef}
      className={rowClass}
      role='treeitem'
      aria-expanded={expanded}
      title={name}
      data-n-group={id}
      onClick={onToggle}
      onMouseEnter={showHover}
      onMouseLeave={hideHover}
    >
      <span className='dsh-st-n-slot dsh-st-n-folder'>{expanded ? <FolderOpenIcon width={16} height={16} /> : <FolderClosedIcon width={16} height={16} />}</span>
      <span className='dsh-st-n-title'>{name}</span>
      <span className='dsh-st-n-acts'>
        <Menu
          open={menuOpen}
          onClose={() => { onMenuChange(false) }}
          items={items}
          onSelect={(action) => {
            onMenuChange(false)
            if (action === 'task-settings') onTaskSettings()
            if (action === 'run-task') onRunTask()
            if (action === 'toggle-task') onToggleTask()
            if (action === 'delete-task') onDeleteTask()
            if (action === 'archive-group') onArchiveGroup()
          }}
          portal
          dense
          compact
          anchor={<button
            type='button'
            className='dsh-st-n-ico'
            aria-label={t('session.groupActions', { name })}
            onMouseDown={(event) => { event.stopPropagation() }}
            onClick={(event) => { event.stopPropagation(); onMenuChange(!menuOpen) }}
          ><IconEllipsisOutline16 size={16} /></button>}
        />
      </span>
      {hoverOpen && !menuOpen && typeof document !== 'undefined' && (
        createPortal(
          <div ref={hoverRef} className='dsh-st-n-hover' style={hoverStyle} onMouseEnter={showHover} onMouseLeave={hideHover}>
            <div className='dsh-st-n-hover-title'>{name}</div>
            <div className='dsh-st-n-hover-state'>
              <span className={automation?.status === 'active' ? 'dsh-st-n-hover-dot is-run' : 'dsh-st-n-hover-dot'} />
              {automation?.status === 'paused' ? t('status.paused') : t('status.active')}
            </div>
            {automation !== undefined && <div className='dsh-st-n-hover-schedule'>
              <span className='dsh-st-chip'><ClockIcon />{formatSchedule(automation.schedule, t)}</span>
              <span className='dsh-st-n-hover-time'>{automation.nextRunAt === undefined ? t('stats.noneScheduled') : t('history.nextApprox', { when: formatWithin(automation.nextRunAt, new Date(), t) })}</span>
            </div>}
          </div>,
          document.body,
        )
      )}
    </div>
  )
}

function NativeSessionRow(props: {
  readonly t: Translate
  readonly id: string
  readonly title: string
  readonly hoverTitle?: string
  readonly updatedAt: string
  readonly running: boolean
  readonly runStatus?: string
  readonly selected: boolean
  readonly menuOpen: boolean
  readonly menuPoint: { readonly x: number; readonly y: number }
  readonly onToggleMenu: (event: { readonly clientX?: number; readonly clientY?: number }) => void
  readonly onCloseMenu: () => void
  readonly onOpen: () => void
  readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>
  readonly archiveSession?: (sessionId: string) => void | Promise<void>
  readonly forkSession?: (sessionId: string) => void | Promise<void>
}): JSX.Element {
  const { t, id, title, hoverTitle, updatedAt, running, runStatus, selected, menuOpen, menuPoint, onToggleMenu, onCloseMenu, onOpen, renameSession, archiveSession, forkSession } = props
  const rowRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef<HTMLDivElement>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [hoverStyle, setHoverStyle] = useState<CSSProperties>({})
  const hoverTimer = useRef<number | undefined>(undefined)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(title)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  useEffect(() => { setDraft(title) }, [title])
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent): void => {
      if (!shouldCloseNativeSessionMenu(event.target, [rowRef.current, menuRef.current])) return
      onCloseMenu()
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCloseMenu()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, onCloseMenu])
  useLayoutEffect(() => {
    if (!menuOpen) return
    const update = (): void => {
      const el = menuRef.current
      const size = el === null ? { width: 218, height: 176 } : { width: el.offsetWidth, height: el.offsetHeight }
      setMenuStyle(nativeSessionMenuStyle(menuPoint, size, { width: window.innerWidth, height: window.innerHeight }))
    }
    update()
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      document.removeEventListener('scroll', update, true)
    }
  }, [menuOpen, menuPoint])
  const run = (action: () => void | Promise<void>): void => { void Promise.resolve(action()).catch(() => undefined) }
  const rowClass = 'dsh-st-n-sess' + (selected ? ' is-on' : '') + (menuOpen ? ' is-menu' : '')
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
  const menuItems = [
    { id: 'rename', label: t('session.rename'), icon: <PencilIcon width={16} height={16} />, go: () => { setRenaming(true) } },
    { id: 'fork', label: t('session.fork'), icon: <BranchIcon width={16} height={16} />, go: () => run(() => forkSession?.(id)) },
    { id: 'archive', label: t('session.archive'), icon: <ArchiveIcon width={16} height={16} />, go: () => run(() => archiveSession?.(id)) },
  ]
  const menu = menuOpen && typeof document !== 'undefined'
    ? createPortal(
      <div ref={menuRef} className='dsh-st-n-menu is-float' data-n-menu={id} style={menuStyle} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
        {menuItems.map((item) => (
          <button key={item.id} type='button' className={undefined} onClick={() => { onCloseMenu(); item.go() }}>
            <span className='dsh-st-n-mi'>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>,
      document.body,
    )
    : null
  return (
    <div className={rowClass} ref={rowRef} role='treeitem' tabIndex={0} aria-selected={selected} data-n-menu-root={id} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); onToggleMenu(event) }}>
      <span className='dsh-st-n-slot'>{runStatus === 'succeeded' ? <span className='dsh-st-n-status-dot is-success' /> : runStatus !== undefined && runStatus !== 'running' && runStatus !== 'queued' ? <span className='dsh-st-n-status-dot is-error' /> : running ? <RunningStateDot /> : null}</span>
      <span className='dsh-st-n-title'>{title}</span>
      <span className='dsh-st-n-time'>{relativeTime(updatedAt, t)}</span>
      <span className='dsh-st-n-acts'>
        <button type='button' className='dsh-st-n-ico' aria-label={t('session.moreActions', { title })} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onToggleMenu(event) }}>
          <EllipsisIcon width={16} height={16} />
        </button>
      </span>
      {menu}
    </div>
  )
}
