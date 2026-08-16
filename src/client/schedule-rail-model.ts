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
  readonly sessionId?: string
  readonly status: string
  readonly startedAt?: string
  readonly scheduledFor: string
}

export interface NativeSessionLike {
  readonly id?: string
  readonly title?: string
  readonly blank?: boolean
  readonly origin?: string
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

export function groupScheduledSessions(
  automations: readonly { readonly id: string; readonly name: string }[],
  runs: readonly ScheduleRunLike[],
): ScheduleRailGroup[] {
  return automations.map((item) => ({
    id: item.id,
    name: item.name,
    sessions: runs
      .filter(run => run.automationId === item.id && run.sessionId !== undefined && run.sessionId !== '')
      .slice()
      .sort((left, right) => Date.parse(right.startedAt ?? right.scheduledFor) - Date.parse(left.startedAt ?? left.scheduledFor))
      .map(run => ({
        id: run.sessionId as string,
        running: run.status === 'running' || run.status === 'queued',
        label: `${formatRunStamp(run.startedAt ?? run.scheduledFor)} - ${item.name}`,
      })),
  })).filter(group => group.sessions.length > 0)
}

export function isNativeTaskSession(item: NativeSessionLike | undefined): boolean {
  if (item === undefined || item.blank === true) return false
  if (item.origin === 'im' || item.origin === 'subagent') return false
  const id = item.id ?? ''
  if (id.startsWith('im:')) return false
  if (id.startsWith(AUTOMATION_SESSION_PREFIX)) return false
  return true
}

export function groupNativeTaskSessions(
  sessions: { readonly ids?: readonly string[]; readonly byId?: Record<string, NativeSessionLike> },
  workspaces: { readonly items?: readonly NativeWorkspaceLike[]; readonly archivedSessionIds?: readonly string[] } | undefined,
  ungroupedLabel: string,
): { readonly id: string; readonly label: string; readonly sessions: readonly NativeSessionLike[] }[] {
  const byId = sessions.byId ?? {}
  const archived = new Set(workspaces?.archivedSessionIds ?? [])
  const assigned = new Set<string>()
  const groups: { id: string; label: string; sessions: NativeSessionLike[] }[] = []
  for (const workspace of workspaces?.items ?? []) {
    const items = (workspace.sessionIds ?? [])
      .map(id => byId[id])
      .filter((item): item is NativeSessionLike => item !== undefined && item.id !== undefined && isNativeTaskSession(item) && !archived.has(item.id))
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
    .filter((item): item is NativeSessionLike => item !== undefined && item.id !== undefined && !assigned.has(item.id) && isNativeTaskSession(item) && !archived.has(item.id))
  if (ungrouped.length > 0) groups.push({ id: '', label: ungroupedLabel, sessions: ungrouped })
  return groups
}

export function readNativeSidebarTab(raw: string | null): NativeSidebarTab {
  if (raw === 'channels' || raw === 'schedule' || raw === 'tasks') return raw
  return 'tasks'
}

export function tabForSessionId(sessionId: string | null | undefined): NativeSidebarTab | undefined {
  if (sessionId === undefined || sessionId === null || sessionId === '') return undefined
  if (sessionId.startsWith(AUTOMATION_SESSION_PREFIX)) return 'schedule'
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

export function filterTaskSessionState<T extends SessionListState>(state: T | undefined): T {
  const src = (state ?? { ids: [], byId: {}, current: null }) as T
  const ids = (src.ids ?? []).filter((id) => {
    const value = String(id)
    return !value.startsWith(AUTOMATION_SESSION_PREFIX) && !value.startsWith('im:')
  })
  const byId: Record<string, NativeSessionLike> = {}
  for (const id of ids) {
    const item = src.byId?.[id]
    if (item !== undefined) byId[id] = item
  }
  return { ...src, ids, byId }
}

export interface WorkspaceListState {
  readonly items?: readonly NativeWorkspaceLike[]
  readonly archivedSessionIds?: readonly string[]
}

export function openScheduledSession(
  id: string,
  openRuntime?: (sessionId: string) => void,
  openHost?: (sessionId: string) => void,
): void {
  if (id === '') return
  const attempts = id.startsWith(AUTOMATION_SESSION_PREFIX) || id.startsWith('im:')
    ? [openRuntime, openHost]
    : [openHost, openRuntime]
  for (const attempt of attempts) {
    if (typeof attempt !== 'function') continue
    try {
      attempt(id)
      return
    } catch {
      // 列表里有、宿主会话簿还没收录时，换下一个打开入口。
    }
  }
}

export function isHiddenSidebarSessionId(id: string): boolean {
  return id.startsWith(AUTOMATION_SESSION_PREFIX) || id.startsWith('im:')
}

export function filterWorkspaceListState<T extends WorkspaceListState>(state: T | undefined): T {
  const src = (state ?? { items: [], archivedSessionIds: [] }) as T
  const items = (src.items ?? []).map((workspace) => ({
    ...workspace,
    sessionIds: (workspace.sessionIds ?? []).filter(sid => !isHiddenSidebarSessionId(String(sid))),
  }))
  return { ...src, items }
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
