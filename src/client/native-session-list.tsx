import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { Translate } from './contracts.js'
import {
  ArchiveIcon,
  BranchIcon,
  ChevronIcon,
  EllipsisIcon,
  FolderClosedIcon,
  FolderOpenIcon,
  PencilIcon,
  RunningStateDot,
  TrashIcon,
} from './icons.js'
import type { AutomationRuntime } from './runtime.js'
import { formatRunStamp, groupScheduledSessions, type NativeSessionLike } from './schedule-rail-model.js'

const EMPTY_SESSION_BY_ID: Record<string, NativeSessionLike> = {}

export function relativeTime(value: string): string {
  const ts = Date.parse(value || '')
  if (!Number.isFinite(ts)) return ''
  const delta = Math.max(0, Date.now() - ts)
  const min = Math.floor(delta / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return String(min) + '分钟'
  const hour = Math.floor(min / 60)
  if (hour < 24) return String(hour) + '小时'
  return String(Math.floor(hour / 24)) + '天'
}

export function NativeScheduleSessionList(props: {
  readonly t: Translate
  readonly runtime: AutomationRuntime
  readonly openSession?: (sessionId: string) => void
  readonly useSessions?: (select: (state: any) => any) => any
  readonly useWorkspaces?: (select: (state: any) => any) => any
  readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>
  readonly archiveSession?: (sessionId: string) => void | Promise<void>
  readonly deleteSession?: (sessionId: string) => void | Promise<void>
  readonly forkSession?: (sessionId: string) => void | Promise<void>
}): JSX.Element {
  const { t, runtime, openSession, useSessions, useWorkspaces, renameSession, archiveSession, deleteSession, forkSession } = props
  const state = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
  const selectedId = useSessions ? useSessions((snap: { current?: string | null }) => snap?.current ?? null) : null
  const sessionById: Record<string, NativeSessionLike> = useSessions
    ? useSessions((snap: { byId?: Record<string, NativeSessionLike> }) => snap?.byId ?? EMPTY_SESSION_BY_ID)
    : EMPTY_SESSION_BY_ID
  const archivedIds: string[] = useWorkspaces ? useWorkspaces((snap: { archivedSessionIds?: string[] }) => snap?.archivedSessionIds ?? []) : []
  const [folded, setFolded] = useState<Record<string, boolean>>({})
  useEffect(() => {
    void runtime.refresh().catch(() => undefined)
    const timer = window.setInterval(() => { void runtime.refresh().catch(() => undefined) }, 15_000)
    return () => { window.clearInterval(timer) }
  }, [runtime])
  const archived = useMemo(() => new Set(archivedIds), [archivedIds])
  const groups = useMemo(() => {
    const snapshot = state.snapshot
    if (snapshot === undefined) return []
    return groupScheduledSessions(snapshot.automations, snapshot.runs).map((group) => ({
      ...group,
      sessions: group.sessions.filter((session) => !archived.has(session.id)).map((session) => {
        const run = snapshot.runs.find((item) => item.sessionId === session.id)
        return {
          ...session,
          title: formatRunStamp((run && (run.startedAt || run.scheduledFor)) || ''),
          updatedAt: (run && (run.startedAt || run.scheduledFor)) || '',
          running: session.running || sessionById[session.id]?.running === true,
        }
      }),
    })).filter((group) => group.sessions.length > 0)
  }, [archived, sessionById, state.snapshot])
  return (
    <div className='dsh-st-n'>
      <div className='dsh-st-n-tree' role='tree'>
        {state.phase === 'loading' && groups.length === 0 && <div className='dsh-st-n-empty'>{t('loading')}</div>}
        {groups.length === 0 && state.phase !== 'loading' && <div className='dsh-st-n-empty'>{t('sidebar.empty')}</div>}
        {groups.map((group) => {
          const expanded = folded[group.id] !== true
          return (
            <div key={group.id} className='dsh-st-n-group'>
              <div className='dsh-st-n-row' role='treeitem' aria-expanded={expanded} onClick={() => setFolded((current) => ({ ...current, [group.id]: expanded }))}>
                <span className='dsh-st-n-slot dsh-st-n-folder'>{expanded ? <FolderOpenIcon width={16} height={16} /> : <FolderClosedIcon width={16} height={16} />}</span>
                <span className='dsh-st-n-slot dsh-st-n-chevron'><span className={expanded ? 'dsh-st-n-arrow is-open' : 'dsh-st-n-arrow'}><ChevronIcon width={14} height={14} /></span></span>
                <span className='dsh-st-n-title'>{group.name}</span>
                <span className='dsh-st-n-acts'>
                  <button
                    type='button'
                    className='dsh-st-n-ico'
                    aria-label={t('session.deleteFolder')}
                    onClick={(event) => {
                      event.stopPropagation()
                      void (async () => {
                        for (const session of group.sessions) {
                          try { await deleteSession?.(session.id) } catch { /* ignore */ }
                        }
                        await runtime.forgetAutomationSessions(group.id)
                      })()
                    }}
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </span>
              </div>
              {expanded && group.sessions.map((session) => (
                <NativeSessionRow
                  key={session.id}
                  t={t}
                  id={session.id}
                  title={session.title}
                  updatedAt={session.updatedAt}
                  running={session.running}
                  selected={selectedId === session.id}
                  onOpen={() => {
                    openSession?.(session.id)
                    void runtime.adoptSession?.(session.id).catch(() => undefined)
                  }}
                  onDelete={async () => {
                    try { await deleteSession?.(session.id) } catch { /* 宿主可能拒绝，侧栏仍摘掉 */ }
                    await runtime.forgetSession(session.id)
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
    </div>
  )
}

function NativeSessionRow(props: {
  readonly t: Translate
  readonly id: string
  readonly title: string
  readonly updatedAt: string
  readonly running: boolean
  readonly selected: boolean
  readonly onOpen: () => void
  readonly onDelete: () => void | Promise<void>
  readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>
  readonly archiveSession?: (sessionId: string) => void | Promise<void>
  readonly forkSession?: (sessionId: string) => void | Promise<void>
}): JSX.Element {
  const { t, id, title, updatedAt, running, selected, onOpen, onDelete, renameSession, archiveSession, forkSession } = props
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(title)
  useEffect(() => { setDraft(title) }, [title])
  useEffect(() => {
    if (!menu) return
    const close = (event: MouseEvent): void => {
      const target = event.target as Node | null
      if (target !== null && (event.target as HTMLElement).closest('.dsh-st-n-sess.is-menu') !== null) return
      setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [menu])
  const run = (action: () => void | Promise<void>): void => { void Promise.resolve(action()).catch(() => undefined) }
  const rowClass = 'dsh-st-n-sess' + (selected ? ' is-on' : '') + (menu ? ' is-menu' : '')
  if (renaming) {
    return (
      <div className={rowClass}>
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
    { id: 'delete', label: t('session.delete'), icon: <TrashIcon width={16} height={16} />, danger: true, go: () => run(() => onDelete()) },
  ]
  return (
    <div className={rowClass} role='treeitem' tabIndex={0} aria-selected={selected} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); setMenu((open) => !open) }}>
      <span className='dsh-st-n-slot'>{running ? <RunningStateDot /> : null}</span>
      <span className='dsh-st-n-title'>{title}</span>
      <span className='dsh-st-n-time'>{relativeTime(updatedAt)}</span>
      <span className='dsh-st-n-acts'>
        <button type='button' className='dsh-st-n-ico' aria-label={title + ' 更多'} onClick={(event) => { event.stopPropagation(); setMenu((open) => !open) }}>
          <EllipsisIcon width={16} height={16} />
        </button>
      </span>
      {menu && (
        <div className='dsh-st-n-menu' onClick={(event) => event.stopPropagation()}>
          {menuItems.map((item) => (
            <button key={item.id} type='button' className={item.danger === true ? 'danger' : undefined} onClick={() => { setMenu(false); item.go() }}>
              <span className='dsh-st-n-mi'>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}






