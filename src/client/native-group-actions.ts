export const ARCHIVE_MANAGER_PLUGIN = '@michengai/dsh-archive-manager'

export function hasArchiveManagerPlugin(root: { querySelector(selector: string): unknown } | undefined): boolean {
  return root?.querySelector(`[data-plugin="${ARCHIVE_MANAGER_PLUGIN}"]`) != null
}

export function scheduledGroupShowsActiveFolder(
  expanded: boolean,
  sessionIds: readonly string[],
  selectedId: string | null,
): boolean {
  return expanded && selectedId !== null && sessionIds.includes(selectedId)
}

/** 串行归档，避免多个 workspace 状态写入相互覆盖。 */
export async function archiveScheduledGroup(
  sessionIds: readonly string[],
  archiveSession: (sessionId: string) => void | Promise<void>,
): Promise<void> {
  for (const sessionId of sessionIds) await archiveSession(sessionId)
}
