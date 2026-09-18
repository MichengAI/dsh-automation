export declare const ARCHIVE_MANAGER_PLUGIN = "@michengai/dsh-archive-manager";
export declare function hasArchiveManagerPlugin(root: {
    querySelector(selector: string): unknown;
} | undefined): boolean;
export type ScheduledSessionMenuAction = 'rename' | 'fork' | 'archive' | 'delete-session';
export declare function canDeleteScheduledSession(archiveManagerInstalled: boolean, deleteSession?: (sessionId: string) => void | Promise<void>): boolean;
export declare function scheduledSessionMenuActions(canDelete: boolean): readonly ScheduledSessionMenuAction[];
export declare function scheduledGroupShowsActiveFolder(sessionIds: readonly string[], selectedId: string | null): boolean;
export declare function scheduledSessionOmitsStatusSlot(flat: boolean, running: boolean): boolean;
/** 串行归档，避免多个 workspace 状态写入相互覆盖。 */
export declare function archiveScheduledGroup(sessionIds: readonly string[], archiveSession: (sessionId: string) => void | Promise<void>): Promise<void>;
