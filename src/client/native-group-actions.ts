export const ARCHIVE_MANAGER_PLUGIN = '@michengai/dsh-archive-manager'

export function hasArchiveManagerPlugin(root: { querySelector(selector: string): unknown } | undefined): boolean {
  return root?.querySelector(`[data-plugin="${ARCHIVE_MANAGER_PLUGIN}"]`) != null
}

export type ScheduledSessionMenuAction = 'rename' | 'fork' | 'archive' | 'delete-session'

export function canDeleteScheduledSession(
  archiveManagerInstalled: boolean,
  deleteSession?: (sessionId: string) => void | Promise<void>,
): boolean {
  return archiveManagerInstalled && deleteSession !== undefined
}

export function scheduledSessionMenuActions(canDelete: boolean): readonly ScheduledSessionMenuAction[] {
  return canDelete
    ? ['rename', 'fork', 'archive', 'delete-session']
    : ['rename', 'fork', 'archive']
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
