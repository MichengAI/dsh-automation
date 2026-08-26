export declare const ARCHIVE_MANAGER_PLUGIN = "@michengai/dsh-archive-manager";
export declare function hasArchiveManagerPlugin(root: {
    querySelector(selector: string): unknown;
} | undefined): boolean;
export declare function scheduledGroupShowsActiveFolder(expanded: boolean, sessionIds: readonly string[], selectedId: string | null): boolean;
/** 串行归档，避免多个 workspace 状态写入相互覆盖。 */
export declare function archiveScheduledGroup(sessionIds: readonly string[], archiveSession: (sessionId: string) => void | Promise<void>): Promise<void>;
