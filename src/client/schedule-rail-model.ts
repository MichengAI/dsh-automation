/** 侧栏定时树与原生任务列表的纯函数，供组件和单测共用。 */

import type { AutomationStatus } from './protocol.js'
import { probeService } from './workspace-create.js'

export const AUTOMATION_SESSION_PREFIX = 'dsh-automation-session-'
/** 记录视图把每个自动化任务合成一个官方工作区分组，id 进入这个命名空间避免与真实工作区冲突。 */
export const AUTOMATION_TASK_WORKSPACE_PREFIX = 'dsh-automation-task:'
export const NATIVE_SIDEBAR_TAB_KEY = 'dsh-native-sidebar.tab'

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
  readonly retainedBy?: { readonly mainView?: number }
}

export interface NativeWorkspaceLike {
  readonly id?: string
  readonly workspaceId?: string
  readonly title?: string
  readonly path?: string
  readonly sessionIds?: readonly string[]
  readonly createdAt?: string
  readonly updatedAt?: string
}

export type NativeSidebarTab = 'tasks' | 'channels' | 'schedule'

import { formatRunStamp } from '../run-title.js'

export function groupScheduledSessions(
  automations: readonly { readonly id: string; readonly name: string; readonly timeZone?: string }[],
  runs: readonly ScheduleRunLike[],
): ScheduleRailGroup[] {
  const nameById = new Map<string, string>()
  const timeZoneById = new Map<string, string>()
  for (const item of automations) {
    nameById.set(item.id, item.name)
    if (item.timeZone !== undefined) timeZoneById.set(item.id, item.timeZone)
  }
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
          label: formatRunStamp(run.startedAt ?? run.scheduledFor, timeZoneById.get(id)) + ' - ' + name,
        })),
    }
  }).filter(group => group.sessions.length > 0)
}

export interface OverviewAutomationLike {
  readonly id: string
  readonly name: string
  readonly status: AutomationStatus
  readonly nextRunAt?: string
}

export interface TaskOverviewRow {
  readonly id: string
  readonly name: string
  readonly status: AutomationStatus
  readonly nextRunAt?: string
}

export function automationToggleMutation(status: AutomationStatus): 'pause' | 'resume' {
  return status === 'active' ? 'pause' : 'resume'
}

/** 任务总览只由任务定义生成，不依赖执行记录或会话是否已经创建。 */
export function deriveTaskOverviewRows(
  automations: readonly OverviewAutomationLike[],
): TaskOverviewRow[] {
  return automations.map(item => ({
    id: item.id,
    name: item.name,
    status: item.status,
    ...(item.nextRunAt === undefined ? {} : { nextRunAt: item.nextRunAt }),
  }))
}

export type ArchivedSessionFilter = 'default' | 'show' | 'only'

/** 默认隐藏已归档；显示和仅归档跟官方筛选同一套规则。空 id 一律不展示。 */
export function scheduledSessionVisible(
  sessionId: string | undefined,
  archived: ReadonlySet<string>,
  filter: ArchivedSessionFilter,
): boolean {
  if (sessionId === undefined || sessionId === '') return false
  const isArchived = archived.has(sessionId)
  if (filter === 'only') return isArchived
  if (filter === 'show') return true
  return !isArchived
}

/** 当前打开的是定时会话，但快照还没有这条执行记录时，侧栏应立刻再拉一次。 */
export function scheduledSessionNeedsSnapshotRefresh(
  sessionId: string | null | undefined,
  runs: readonly { readonly sessionId?: string }[] | undefined,
): boolean {
  if (sessionId === undefined || sessionId === null || sessionId === '') return false
  if (!sessionId.startsWith(AUTOMATION_SESSION_PREFIX)) return false
  return !(runs ?? []).some(run => run.sessionId === sessionId)
}
export function collectScheduledSessionIds(runs: readonly { readonly sessionId?: string | null }[] | undefined): Set<string> {
  const ids = new Set<string>()
  for (const run of runs ?? []) {
    const id = run.sessionId
    if (typeof id === 'string' && id !== '') ids.add(id)
  }
  return ids
}


export function readNativeSidebarTab(raw: string | null): NativeSidebarTab {
  if (raw === 'channels' || raw === 'schedule' || raw === 'tasks') return raw
  return 'tasks'
}

/** 迁移前各插件各写一份页签选择；新键统一后只在迁移时读一次。 */
export const LEGACY_AUTOMATION_TAB_KEY = 'dsh-automation.sidebar-tab'
export const IM_TAB_KEY = 'dsh-im-connect.sidebar-tab'

type TabStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * 读取侧栏页签选择：新键优先，缺失时回退到两边旧键并写回新键。
 *
 * 只清理本插件自己的旧键；`dsh-im-connect.sidebar-tab` 属于 IM，旧版 IM 仍会读它，
 * 由 IM 自己迁移后清理，这里删掉会让旧版 IM 丢失用户选择。
 * 存储不可用（隐私模式）时一律回落到任务页。
 */
export function readStoredSidebarTab(storage: TabStorage | undefined): NativeSidebarTab {
  if (storage === undefined) return 'tasks'
  let raw: string | null
  try {
    raw = storage.getItem(NATIVE_SIDEBAR_TAB_KEY)
      ?? storage.getItem(LEGACY_AUTOMATION_TAB_KEY)
      ?? storage.getItem(IM_TAB_KEY)
  } catch {
    return 'tasks'
  }
  const tab = readNativeSidebarTab(raw)
  try {
    storage.setItem(NATIVE_SIDEBAR_TAB_KEY, tab)
    storage.removeItem(LEGACY_AUTOMATION_TAB_KEY)
  } catch { /* 存储不可用或只读时不重试；下次挂载会再迁移一次 */ }
  return tab
}

/** 新建控件允许附带快捷键，但会话行仍须由调用方排除。 */
export function isHostNewSessionControl(label: string): boolean {
  return /^(新会话|新建任务|New chat|New session)(?:\s+(?:Ctrl|Alt|Shift|Meta)(?:\+[^\s+]+)*)?$/i.test(label.trim())
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
  if (input.tab === 'channels' && input.channelsReady) return 'channels'
  // 协作页签可能已被注册方注销，但用户选择仍留在 localStorage：此时必须回落到任务页，
  // 否则分段页签拿不到匹配项，指示器会移出可视区且不渲染任何面板。
  return 'tasks'
}
export function tabForSessionId(
  sessionId: string | null | undefined,
  scheduledIds?: ReadonlySet<string>,
  options: { readonly followSchedule?: boolean; readonly followChannels?: boolean } = {},
): NativeSidebarTab | undefined {
  if (sessionId === undefined || sessionId === null || sessionId === '') return undefined
  const scheduled = scheduledIds !== undefined
    ? scheduledIds.has(sessionId)
    : sessionId.startsWith(AUTOMATION_SESSION_PREFIX)
  if (scheduled) return options.followSchedule === false ? undefined : 'schedule'
  // 频道会话也出现在官方任务树里；从任务树点开时不要强制跳频道页签。
  if (sessionId.startsWith('im:')) return options.followChannels === false ? undefined : 'channels'
  return 'tasks'
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
}

const scheduledSessionCache = new WeakMap<object, { key: string; result: object }>()
const syntheticWorkspaceCache = new WeakMap<object, { key: string; result: object }>()
const realWorkspaceCache = new WeakMap<object, { key: string; result: object }>()

function recordField(value: unknown, key: string): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || !(key in value)) return undefined
  const field = Reflect.get(value, key)
  return field !== null && typeof field === 'object' ? field as Record<string, unknown> : undefined
}

function scheduledCacheKey(scheduledIds: ReadonlySet<string>): string {
  if (scheduledIds.size === 0) return ''
  return [...scheduledIds].sort().join('\0')
}



/** 记录视图只保留定时执行产生的会话；其余字段原样带给官方树。 */
export function scheduledOnlySessionState<T extends SessionListState>(state: T | undefined, scheduledIds: ReadonlySet<string>): T {
  const src = (state ?? { ids: [], byId: {} }) as T
  const key = scheduledCacheKey(scheduledIds)
  if (typeof src === 'object' && src !== null) {
    const hit = scheduledSessionCache.get(src)
    if (hit !== undefined && hit.key === key) return hit.result as T
  }
  const ids = (src.ids ?? []).filter(id => scheduledIds.has(String(id)))
  const byId = Object.fromEntries(
    ids
      .map(id => [id, src.byId?.[id]] as const)
      .filter((entry): entry is readonly [string, NativeSessionLike] => entry[1] !== undefined),
  )
  const projections = recordField(src, 'projectionsBySession')
  const result = {
    ...src,
    ids,
    byId,
    ...(projections === undefined
      ? {}
      : {
          projectionsBySession: Object.fromEntries(
            ids.filter(id => projections[id] !== undefined).map(id => [id, projections[id]]),
          ),
        }),
  } as T
  if (typeof src === 'object' && src !== null) scheduledSessionCache.set(src, { key, result })
  return result
}

export interface WorkspaceListState {
  readonly items?: readonly NativeWorkspaceLike[]
  readonly archivedSessionIds?: readonly string[]
  readonly pinnedSessionIds?: readonly string[]
  readonly state?: 'idle' | 'loading' | 'error'
  readonly phase?: 'pending' | 'ready'
  readonly error?: unknown
}

export interface SyntheticTaskGroup {
  readonly id: string
  readonly name: string
  readonly sessionIds: readonly string[]
  /** 任务自身的创建时间（ISO-8601）；官方树用它排序并渲染分组悬停卡片。 */
  readonly createdAt: string
}

export function automationTaskWorkspaceId(automationId: string): string {
  return `${AUTOMATION_TASK_WORKSPACE_PREFIX}${automationId}`
}

export function automationIdFromTaskWorkspaceId(workspaceId: string | undefined): string | undefined {
  if (workspaceId === undefined || !workspaceId.startsWith(AUTOMATION_TASK_WORKSPACE_PREFIX)) return undefined
  const id = workspaceId.slice(AUTOMATION_TASK_WORKSPACE_PREFIX.length)
  return id === '' ? undefined : id
}

/**
 * 把自动化任务合成为官方 WorkspaceView 列表。
 *
 * 官方树只按 `workspaceId` + `sessionIds` 分组，不校验工作区是否真实存在；
 * 保留源快照的 phase/state/archived/pinned，避免官方树一直停在未就绪状态。
 */
export function syntheticTaskWorkspaceState<T extends WorkspaceListState>(
  state: T | undefined,
  groups: readonly SyntheticTaskGroup[],
): T {
  const src = (state ?? { items: [], archivedSessionIds: [] }) as T
  const key = groups
    .map(group => `${group.id}\0${group.name}\0${group.createdAt}\0${group.sessionIds.join(',')}`)
    .join('\0\0')
  if (typeof src === 'object' && src !== null) {
    const hit = syntheticWorkspaceCache.get(src)
    if (hit !== undefined && hit.key === key) return hit.result as T
  }
  const items = groups.map((group) => {
    const workspaceId = automationTaskWorkspaceId(group.id)
    return {
      workspaceId,
      id: workspaceId,
      title: group.name,
      path: '',
      sessionIds: [...group.sessionIds],
      createdAt: group.createdAt,
      updatedAt: group.createdAt,
    }
  })
  const result = { ...src, items } as T
  if (typeof src === 'object' && src !== null) syntheticWorkspaceCache.set(src, { key, result })
  return result
}

/**
 * 按真实工作区分组时，只保留定时执行会话，并沿用官方的归档筛选。
 * 保留 phase/state/archived/pinned，官方树才会正常渲染。
 */
export function scheduledRealWorkspaceState<T extends WorkspaceListState>(
  state: T | undefined,
  scheduledIds: ReadonlySet<string>,
  archivedFilter: ArchivedSessionFilter,
): T {
  const src = (state ?? { items: [], archivedSessionIds: [] }) as T
  const key = `${scheduledCacheKey(scheduledIds)}\0${archivedFilter}`
  if (typeof src === 'object' && src !== null) {
    const hit = realWorkspaceCache.get(src)
    if (hit !== undefined && hit.key === key) return hit.result as T
  }
  const archived = new Set(src.archivedSessionIds ?? [])
  const items = (src.items ?? [])
    .map((workspace) => {
      const sessionIds = (workspace.sessionIds ?? []).filter((id) => {
        const value = String(id)
        return scheduledIds.has(value) && scheduledSessionVisible(value, archived, archivedFilter)
      })
      return sessionIds.length === (workspace.sessionIds ?? []).length
        ? workspace
        : { ...workspace, sessionIds }
    })
  const result = { ...src, items } as T
  if (typeof src === 'object' && src !== null) realWorkspaceCache.set(src, { key, result })
  return result
}

/** 0.2 主视图由 retainedBy.mainView 标记。 */
export function resolveCurrentSessionId(snapshot: SessionListState | undefined): string | null {
  const byId = snapshot?.byId ?? {}
  for (const [id, session] of Object.entries(byId)) {
    if ((session?.retainedBy?.mainView ?? 0) > 0) {
      const explicit = session.id?.trim()
      return explicit !== undefined && explicit !== '' ? explicit : id
    }
  }
  return null
}

export interface ClientSessionOpenAccess {
  readonly uiWorkspace?: { openSession(id: string): void }
  readonly get?: (name: string) => unknown
  readonly reflect?: { get?: (name: string) => unknown }
}

function asUiWorkspace(value: unknown): { openSession(id: string): void } | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const openSession = (value as { openSession?: unknown }).openSession
  if (typeof openSession !== 'function') return undefined
  return { openSession: (id: string) => { (openSession as (id: string) => void).call(value, id) } }
}

/** 不硬读 ctx.uiWorkspace：Cordis 未 inject 时读属性会抛，只能 reflect.get / get。 */
export function resolveClientSessionOpenAccess(ctx: ClientSessionOpenAccess): ClientSessionOpenAccess {
  const uiWorkspace = asUiWorkspace(probeService(ctx, 'uiWorkspace'))
  return {
    ...(uiWorkspace === undefined ? {} : { uiWorkspace }),
  }
}

export function canOpenClientSession(access: ClientSessionOpenAccess): boolean {
  return typeof access.uiWorkspace?.openSession === 'function'
}

/** 支持范围内的宿主都用 uiWorkspace.openSession。不硬读未注入的属性。 */
export function openClientSession(access: ClientSessionOpenAccess, id: string): void {
  if (typeof access.uiWorkspace?.openSession === 'function') {
    access.uiWorkspace.openSession(id)
    return
  }
  throw new Error('no client session opener')
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



export type WrapperFlags = {
  __dshNativeTabWrapped?: unknown
  __dshNativeTabOriginal?: unknown
  __dshNativeTabOwner?: unknown
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
  const flags = wrapperFlags(component)
  return flags.__dshAutomationWrapped === true
    || (flags.__dshNativeTabWrapped === true && flags.__dshNativeTabOwner === 'automation')
}

export function resolveOfficialTreeComponent(component: unknown): unknown {
  const seen = new Set<unknown>()
  let current = component
  while (current !== undefined && current !== null && !seen.has(current)) {
    seen.add(current)
    const flags = wrapperFlags(current)
    const next = flags.__dshNativeTabOriginal ?? flags.__dshAutomationOriginal ?? flags.__imConnectOriginal
    if (next !== undefined && next !== current) {
      current = next
      continue
    }
    if (flags.__dshNativeTabWrapped === true || flags.__dshAutomationWrapped === true || flags.__imConnectWrapped === true) return undefined
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
    || (name === 'DshNativeTabWorkspaceShell' && isOwnAutomationWrapper(record?.component))
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










