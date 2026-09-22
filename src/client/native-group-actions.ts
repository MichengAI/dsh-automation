export const ARCHIVE_MANAGER_PLUGIN = '@michengai/dsh-archive-manager'

export function hasArchiveManagerPlugin(root: { querySelector(selector: string): unknown } | undefined): boolean {
  return root?.querySelector(`[data-plugin="${ARCHIVE_MANAGER_PLUGIN}"]`) != null
}

export type ScheduledSessionMenuAction = 'pin' | 'unpin' | 'rename' | 'fork' | 'archive' | 'unarchive' | 'delete-session'

export interface ScheduledListHostActions {
  readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>
  readonly archiveSession?: (sessionId: string) => void | Promise<void>
  readonly unarchiveSession?: (sessionId: string) => void | Promise<void>
  readonly deleteSession?: (sessionId: string) => void | Promise<void>
  readonly forkSession?: (sessionId: string) => void | Promise<void>
  readonly pinSession?: (sessionId: string) => void | Promise<void>
  readonly unpinSession?: (sessionId: string) => void | Promise<void>
  readonly notifyArchivedNotOpenable?: () => void
}

export interface ScheduledSessionMenuState {
  readonly canDelete: boolean
  readonly archived: boolean
  readonly pinned: boolean
  readonly canPin: boolean
  readonly canUnarchive: boolean
}

function asSessionAction<Args extends readonly unknown[]>(
  value: unknown,
): ((...args: Args) => void | Promise<void>) | undefined {
  return typeof value === 'function' ? (value as (...args: Args) => void | Promise<void>) : undefined
}

/** 官方 WorkspaceBrowser 会把这四个操作放进列表 props；页签渲染和自绘回退必须抽同一份。 */
export function scheduledListHostActions(props?: Record<string, unknown> | null): ScheduledListHostActions {
  const source = props ?? {}
  const renameSession = asSessionAction<[string, string]>(source.renameSession)
  const archiveSession = asSessionAction<[string]>(source.archiveSession)
  const unarchiveSession = asSessionAction<[string]>(source.unarchiveSession)
  const deleteSession = asSessionAction<[string]>(source.deleteSession)
  const forkSession = asSessionAction<[string]>(source.forkSession)
  const pinSession = asSessionAction<[string]>(source.pinSession)
  const unpinSession = asSessionAction<[string]>(source.unpinSession)
  const notifyArchivedNotOpenable = asSessionAction<[]>(source.notifyArchivedNotOpenable)
  return {
    ...(renameSession === undefined ? {} : { renameSession }),
    ...(archiveSession === undefined ? {} : { archiveSession }),
    ...(unarchiveSession === undefined ? {} : { unarchiveSession }),
    ...(deleteSession === undefined ? {} : { deleteSession }),
    ...(forkSession === undefined ? {} : { forkSession }),
    ...(pinSession === undefined ? {} : { pinSession }),
    ...(unpinSession === undefined ? {} : { unpinSession }),
    ...(notifyArchivedNotOpenable === undefined ? {} : { notifyArchivedNotOpenable }),
  }
}

/** 官方任务树本身没有删除；删除项由 archive-manager 补进菜单。没装归档插件时即使宿主传入 deleteSession 也不展示。 */
export function canDeleteScheduledSession(
  archiveManagerInstalled: boolean,
  deleteSession?: (sessionId: string) => void | Promise<void>,
): boolean {
  return archiveManagerInstalled && deleteSession !== undefined
}

/** 定时列表不提供置顶。顺序是重命名、分叉、归档或恢复，最后才是删除。 */
export function scheduledSessionMenuActions(state: ScheduledSessionMenuState): readonly ScheduledSessionMenuAction[] {
  const items: ScheduledSessionMenuAction[] = ['rename', 'fork']
  if (state.archived) {
    if (state.canUnarchive) items.push('unarchive')
  } else {
    items.push('archive')
  }
  if (state.canDelete) items.push('delete-session')
  return items
}

export function scheduledGroupShowsActiveFolder(
  sessionIds: readonly string[],
  selectedId: string | null,
): boolean {
  return selectedId !== null && sessionIds.includes(selectedId)
}

export function scheduledSessionOmitsStatusSlot(flat: boolean, running: boolean): boolean {
  return flat && !running
}

/** 串行归档，避免多个 workspace 状态写入相互覆盖。 */
export async function archiveScheduledGroup(
  sessionIds: readonly string[],
  archiveSession: (sessionId: string) => void | Promise<void>,
): Promise<void> {
  for (const sessionId of sessionIds) await archiveSession(sessionId)
}
