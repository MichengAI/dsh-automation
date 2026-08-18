/** 侧栏定时树与原生任务列表的纯函数，供组件和单测共用。 */

export const AUTOMATION_SESSION_PREFIX = 'dsh-automation-session-'
export const NATIVE_SIDEBAR_TAB_KEY = 'dsh-automation.sidebar-tab'

export interface ScheduleRailSession {
  readonly id: string
  readonly running: boolean
  readonly label: string
}

export interface ScheduleRailGroup {
  readonly id: string
  readonly name: string
  readonly sessions: readonly ScheduleRailSession[]
}

export interface ScheduleRunLike {
  readonly automationId: string
  readonly automationName?: string
  readonly sessionId?: string
  readonly status: string
  readonly startedAt?: string
  readonly scheduledFor: string
}

export interface NativeSessionLike {
  readonly id?: string
  readonly title?: string
  readonly displayTitle?: string
  readonly blank?: boolean
  readonly origin?: string
  readonly updatedAt?: number | string
  readonly running?: boolean
}

export interface NativeWorkspaceLike {
  readonly id?: string
  readonly workspaceId?: string
  readonly title?: string
  readonly path?: string
  readonly sessionIds?: readonly string[]
}

export type NativeSidebarTab = 'tasks' | 'channels' | 'schedule'

export { formatRunStamp } from '../run-title.js'
import { formatRunStamp } from '../run-title.js'

/** 定时会话标题复刻任务树：优先用 Session 真实标题，没有再用执行时间兜底。 */
export function scheduledSessionTitle(liveTitle: string | undefined, fallbackLabel: string): string {
  const title = liveTitle?.trim() ?? ''
  return title !== '' ? title : fallbackLabel
}

export function sessionUpdatedAtIso(value: number | string | undefined, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString()
  if (typeof value === 'string' && value.trim() !== '') return value
  return fallback
}

export function groupScheduledSessions(
  automations: readonly { readonly id: string; readonly name: string }[],
  runs: readonly ScheduleRunLike[],
): ScheduleRailGroup[] {
  const nameById = new Map<string, string>()
  for (const item of automations) nameById.set(item.id, item.name)
  for (const run of runs) {
    const stored = (run.automationName || '').trim()
    if (stored !== '' && stored !== run.automationId && !nameById.has(run.automationId)) {
      nameById.set(run.automationId, stored)
    }
  }
  const ids: string[] = []
  const seen = new Set<string>()
  for (const item of automations) {
    if (seen.has(item.id)) continue
    ids.push(item.id)
    seen.add(item.id)
  }
  for (const run of runs) {
    if (run.sessionId === undefined || run.sessionId === '' || seen.has(run.automationId)) continue
    ids.push(run.automationId)
    seen.add(run.automationId)
  }
  return ids.map((id) => {
    const name = nameById.get(id) ?? id
    return {
      id,
      name,
      sessions: runs
        .filter(run => run.automationId === id && run.sessionId !== undefined && run.sessionId !== '')
        .slice()
        .sort((left, right) => Date.parse(right.startedAt ?? right.scheduledFor) - Date.parse(left.startedAt ?? left.scheduledFor))
        .map(run => ({
          id: run.sessionId as string,
          running: run.status === 'running' || run.status === 'queued',
          label: formatRunStamp(run.startedAt ?? run.scheduledFor) + ' - ' + name,
        })),
    }
  }).filter(group => group.sessions.length > 0)
}

/** 归档中的、以及宿主已经不认识的 Session，都不应再出现在定时页。 */
export function keepScheduledSessionLink(
  sessionId: string | undefined,
  archived: ReadonlySet<string>,
  presentIds?: ReadonlySet<string>,
): boolean {
  if (sessionId === undefined || sessionId === '') return false
  if (archived.has(sessionId)) return false
  if (presentIds === undefined) return true
  return presentIds.has(sessionId)
}
export function collectScheduledSessionIds(runs: readonly { readonly sessionId?: string | null }[] | undefined): Set<string> {
  const ids = new Set<string>()
  for (const run of runs ?? []) {
    const id = run.sessionId
    if (typeof id === 'string' && id !== '') ids.add(id)
  }
  return ids
}


const AUTOMATION_TITLE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/

/** 任务树要藏的定时会话：前缀、仍挂在定时快照上，或标题是定时跑出来的时间戳。 */
export function isAutomationSidebarSession(id: string, item?: NativeSessionLike, scheduledIds: ReadonlySet<string> = new Set()): boolean {
  if (id.startsWith(AUTOMATION_SESSION_PREFIX) || scheduledIds.has(id)) return true
  const title = String(item?.title ?? item?.displayTitle ?? '')
  return AUTOMATION_TITLE_RE.test(title)
}
export function isNativeTaskSession(item: NativeSessionLike | undefined, scheduledIds: ReadonlySet<string> = new Set()): boolean {
  if (item === undefined || item.blank === true) return false
  if (item.origin === 'im' || item.origin === 'subagent') return false
  const id = item.id ?? ''
  if (id.startsWith('im:')) return false
  if (isAutomationSidebarSession(id, item, scheduledIds)) return false
  return true
}

export function groupNativeTaskSessions(
  sessions: { readonly ids?: readonly string[]; readonly byId?: Record<string, NativeSessionLike> },
  workspaces: { readonly items?: readonly NativeWorkspaceLike[]; readonly archivedSessionIds?: readonly string[] } | undefined,
  ungroupedLabel: string,
  scheduledIds: ReadonlySet<string> = new Set(),
): { readonly id: string; readonly label: string; readonly sessions: readonly NativeSessionLike[] }[] {
  const byId = sessions.byId ?? {}
  const archived = new Set(workspaces?.archivedSessionIds ?? [])
  const assigned = new Set<string>()
  const groups: { id: string; label: string; sessions: NativeSessionLike[] }[] = []
  for (const workspace of workspaces?.items ?? []) {
    const items = (workspace.sessionIds ?? [])
      .map(id => byId[id])
      .filter((item): item is NativeSessionLike => item !== undefined && item.id !== undefined && isNativeTaskSession(item, scheduledIds) && !archived.has(item.id))
    for (const item of items) {
      if (item.id !== undefined) assigned.add(item.id)
    }
    if (items.length > 0) {
      groups.push({
        id: workspace.workspaceId ?? workspace.id ?? workspace.path ?? workspace.title ?? 'workspace',
        label: workspace.title || workspace.path || ungroupedLabel,
        sessions: items,
      })
    }
  }
  const ungrouped = (sessions.ids ?? [])
    .map(id => byId[id])
    .filter((item): item is NativeSessionLike => item !== undefined && item.id !== undefined && !assigned.has(item.id) && isNativeTaskSession(item, scheduledIds) && !archived.has(item.id))
  if (ungrouped.length > 0) groups.push({ id: '', label: ungroupedLabel, sessions: ungrouped })
  return groups
}

export function readNativeSidebarTab(raw: string | null): NativeSidebarTab {
  if (raw === 'channels' || raw === 'schedule' || raw === 'tasks') return raw
  return 'tasks'
}


/** 协作页签（频道/定时）以 registry 为准，不能因 sidebar.channels slot 未就绪就把点击打回任务。 */

/** 只有当前会话变了才跟随切页签，避免点「定时」时被频道/任务会话打回去闪烁。 */
export function shouldFollowSessionTab(previousCurrent: string | null | undefined, current: string | null | undefined): boolean {
  const prev = previousCurrent ?? ''
  const next = current ?? ''
  return next !== '' && prev !== next
}
export function ownedSidebarTabIds(input: {
  readonly extraTabIds: readonly string[]
  readonly channelsReady: boolean
}): string[] {
  const ids: string[] = ['tasks']
  for (const id of input.extraTabIds) {
    if (id === '' || id === 'tasks' || id === 'schedule' || ids.includes(id)) continue
    ids.push(id)
  }
  if (input.channelsReady && !ids.includes('channels')) ids.push('channels')
  ids.push('schedule')
  return ids
}

export function resolveVisibleSidebarTab(input: {
  readonly tab: string
  readonly channelsReady: boolean
  readonly extraTabIds: readonly string[]
}): string {
  if (input.extraTabIds.includes(input.tab)) return input.tab
  if (input.tab === 'channels' && !input.channelsReady) return 'tasks'
  return input.tab
}
export function tabForSessionId(sessionId: string | null | undefined, scheduledIds?: ReadonlySet<string>): NativeSidebarTab | undefined {
  if (sessionId === undefined || sessionId === null || sessionId === '') return undefined
  if (scheduledIds !== undefined ? scheduledIds.has(sessionId) : sessionId.startsWith(AUTOMATION_SESSION_PREFIX)) return 'schedule'
  if (sessionId.startsWith('im:')) return 'channels'
  return undefined
}

export function occupantLooksLikeCodexUi(value: unknown): boolean {
  return /dsh-codex-ui|michengai-codex-ui|michengai\.codexUi|codex-ui/i.test(String(value ?? ''))
}

export function slotOccupantName(item: unknown): string {
  const record = item as {
    options?: { locale?: unknown; id?: unknown; name?: unknown; registrant?: unknown }
    component?: { displayName?: unknown; name?: unknown }
    id?: unknown
    name?: unknown
  } | undefined
  return String(
    record?.options?.locale
    ?? record?.options?.id
    ?? record?.options?.name
    ?? record?.options?.registrant
    ?? record?.component?.displayName
    ?? record?.component?.name
    ?? record?.id
    ?? record?.name
    ?? '',
  )
}

export function hasCodexUiSidebar(entries: readonly unknown[] | undefined): boolean {
  return (entries ?? []).some(item => occupantLooksLikeCodexUi(slotOccupantName(item)))
}

export interface SessionListState {
  readonly ids?: readonly string[]
  readonly byId?: Record<string, NativeSessionLike>
  readonly current?: string | null
}

const taskFilterCache = new WeakMap<object, { key: string; result: object }>()
const workspaceFilterCache = new WeakMap<object, { key: string; result: object }>()

function scheduledCacheKey(scheduledIds: ReadonlySet<string>): string {
  if (scheduledIds.size === 0) return ''
  return [...scheduledIds].sort().join('\0')
}

export function filterTaskSessionState<T extends SessionListState>(state: T | undefined, scheduledIds: ReadonlySet<string> = new Set()): T {
  const src = (state ?? { ids: [], byId: {}, current: null }) as T
  const key = scheduledCacheKey(scheduledIds)
  if (typeof src === 'object' && src !== null) {
    const hit = taskFilterCache.get(src)
    if (hit !== undefined && hit.key === key) return hit.result as T
  }
  const ids = (src.ids ?? []).filter((id) => {
    const value = String(id)
    return !value.startsWith('im:') && !isAutomationSidebarSession(value, src.byId?.[value], scheduledIds)
  })
  const unchanged = ids.length === (src.ids ?? []).length
  const result = unchanged ? src : { ...src, ids, byId: Object.fromEntries(ids.map((id) => [id, src.byId?.[id]]).filter((entry) => entry[1] !== undefined)) }
  if (typeof src === 'object' && src !== null) taskFilterCache.set(src, { key, result })
  return result
}

export interface WorkspaceListState {
  readonly items?: readonly NativeWorkspaceLike[]
  readonly archivedSessionIds?: readonly string[]
}

export function openScheduledSession(
  id: string,
  openRuntime?: (sessionId: string) => void,
  openHost?: (sessionId: string) => void,
): boolean {
  if (id === '') return false
  const attempts = id.startsWith(AUTOMATION_SESSION_PREFIX) || id.startsWith('im:')
    ? [openRuntime, openHost]
    : [openHost, openRuntime]
  for (const attempt of attempts) {
    if (typeof attempt !== 'function') continue
    try {
      attempt(id)
      return true
    } catch {
      // 列表里有、宿主会话簿还没收录时，换下一个打开入口。
    }
  }
  return false
}

export interface EnsureOpenScheduledSessionInput {
  readonly id: string
  readonly adopt?: (sessionId: string) => Promise<void>
  readonly listed?: (sessionId: string) => boolean
  readonly refresh?: () => Promise<void>
  readonly openRuntime?: (sessionId: string) => void
  readonly openHost?: (sessionId: string) => void
}

/** 先把会话挂回工作区并刷新客户端会话簿，再打开；避免侧栏能看见、点下去却 unknown session。 */
export async function ensureOpenScheduledSession(input: EnsureOpenScheduledSessionInput): Promise<boolean> {
  const id = input.id.trim()
  if (id === '') return false
  await input.adopt?.(id).catch(() => undefined)
  const listed = (): boolean => input.listed?.(id) === true
  if (!listed() && input.refresh !== undefined) {
    await input.refresh().catch(() => undefined)
  }
  if (openScheduledSession(id, input.openRuntime, input.openHost)) return true
  if (input.refresh !== undefined) {
    await input.refresh().catch(() => undefined)
  }
  return openScheduledSession(id, input.openRuntime, input.openHost)
}

export function isHiddenSidebarSessionId(id: string, scheduledIds: ReadonlySet<string> = new Set()): boolean {
  return id.startsWith('im:') || isAutomationSidebarSession(id, undefined, scheduledIds)
}

export function filterWorkspaceListState<T extends WorkspaceListState>(state: T | undefined, scheduledIds: ReadonlySet<string> = new Set()): T {
  const src = (state ?? { items: [], archivedSessionIds: [] }) as T
  const key = scheduledCacheKey(scheduledIds)
  if (typeof src === 'object' && src !== null) {
    const hit = workspaceFilterCache.get(src)
    if (hit !== undefined && hit.key === key) return hit.result as T
  }
  let changed = false
  const items = (src.items ?? []).map((workspace) => {
    const sessionIds = (workspace.sessionIds ?? []).filter(sid => !isHiddenSidebarSessionId(String(sid), scheduledIds))
    if (sessionIds.length !== (workspace.sessionIds ?? []).length) {
      changed = true
      return { ...workspace, sessionIds }
    }
    return workspace
  })
  const result = changed ? { ...src, items } : src
  if (typeof src === 'object' && src !== null) workspaceFilterCache.set(src, { key, result })
  return result
}

export type WrapperFlags = {
  __dshAutomationWrapped?: unknown
  __dshAutomationOriginal?: unknown
  __imConnectWrapped?: unknown
  __imConnectOriginal?: unknown
}

export function wrapperFlags(component: unknown): WrapperFlags {
  if (component === undefined || component === null || (typeof component !== 'function' && typeof component !== 'object')) return {}
  return component as WrapperFlags
}

export function isOwnAutomationWrapper(component: unknown): boolean {
  return wrapperFlags(component).__dshAutomationWrapped === true
}

export function isMarkedWorkspaceWrapper(component: unknown): boolean {
  const flags = wrapperFlags(component)
  return flags.__dshAutomationWrapped === true
    || flags.__dshAutomationOriginal !== undefined
    || flags.__imConnectWrapped === true
    || flags.__imConnectOriginal !== undefined
}

export function resolveOfficialTreeComponent(component: unknown): unknown {
  const seen = new Set<unknown>()
  let current = component
  while (current !== undefined && current !== null && !seen.has(current)) {
    seen.add(current)
    const flags = wrapperFlags(current)
    const next = flags.__dshAutomationOriginal ?? flags.__imConnectOriginal
    if (next !== undefined && next !== current) {
      current = next
      continue
    }
    if (flags.__dshAutomationWrapped === true || flags.__imConnectWrapped === true) return undefined
    return current
  }
  return undefined
}

export function isAutomationWorkspaceWrapper(item: unknown): boolean {
  const record = item as { options?: { id?: unknown }; component?: { displayName?: unknown; name?: unknown } }
  const id = String(record?.options?.id ?? '')
  const name = String(record?.component?.displayName ?? record?.component?.name ?? '')
  return id === 'dsh-automation-native-switcher'
    || id === 'dsh-automation-wrap-bump'
    || name === 'AutomationNativeWorkspaceShell'
    || name === 'AutomationWrapBump'
    || isOwnAutomationWrapper(record?.component)
}

export function pickWrappableWorkspacesEntry(entries: readonly unknown[]): unknown {
  for (const item of entries) {
    const record = item as { component?: unknown }
    if (record?.component === undefined) continue
    if (isAutomationWorkspaceWrapper(item)) continue
    return item
  }
  return undefined
}









export type WorkspaceGroupMode = 'workspace' | 'list'
export type WorkspaceListSort = 'manual' | 'time'

export interface SearchableRailGroup {
  readonly name: string
  readonly sessions: readonly { readonly title?: string; readonly label?: string; readonly updatedAt?: string }[]
}

export function applyWorkspaceBrowserQuery<T extends SearchableRailGroup>(
  groups: readonly T[],
  query: string,
  sort: WorkspaceListSort,
  groupMode: WorkspaceGroupMode = 'workspace',
): T[] {
  const needle = query.trim().toLocaleLowerCase()
  const filtered = groups.map((group) => {
    if (needle === '') return group
    if (group.name.toLocaleLowerCase().includes(needle)) return group
    const sessions = group.sessions.filter((session) => `${session.title ?? ''} ${session.label ?? ''}`.toLocaleLowerCase().includes(needle))
    return { ...group, sessions }
  }).filter((group) => group.sessions.length > 0 || (needle !== '' && group.name.toLocaleLowerCase().includes(needle)))
  if (groupMode === 'list') {
    const sessions = filtered.flatMap((group) => [...group.sessions])
    if (sort === 'time') sessions.sort((left, right) => sessionTime(right) - sessionTime(left))
    return sessions.length === 0 ? [] : [{ ...(filtered[0] as T), name: '', sessions }]
  }
  if (sort === 'manual') return filtered
  return [...filtered].sort((left, right) => latestSessionTime(right) - latestSessionTime(left))
}

function sessionTime(session: { readonly updatedAt?: string }): number {
  const ts = Date.parse(session.updatedAt ?? '')
  return Number.isFinite(ts) ? ts : 0
}

function latestSessionTime(group: SearchableRailGroup): number {
  let latest = 0
  for (const session of group.sessions) {
    const ts = sessionTime(session)
    if (ts > latest) latest = ts
  }
  return latest
}
