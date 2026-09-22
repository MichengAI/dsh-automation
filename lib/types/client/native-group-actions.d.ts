export declare const ARCHIVE_MANAGER_PLUGIN = "@michengai/dsh-archive-manager";
export declare function hasArchiveManagerPlugin(root: {
    querySelector(selector: string): unknown;
} | undefined): boolean;
export type ScheduledSessionMenuAction = 'pin' | 'unpin' | 'rename' | 'fork' | 'archive' | 'unarchive' | 'delete-session';
export interface ScheduledListHostActions {
    readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>;
    readonly archiveSession?: (sessionId: string) => void | Promise<void>;
    readonly unarchiveSession?: (sessionId: string) => void | Promise<void>;
    readonly deleteSession?: (sessionId: string) => void | Promise<void>;
    readonly forkSession?: (sessionId: string) => void | Promise<void>;
    readonly pinSession?: (sessionId: string) => void | Promise<void>;
    readonly unpinSession?: (sessionId: string) => void | Promise<void>;
    readonly notifyArchivedNotOpenable?: () => void;
}
export interface ScheduledSessionMenuState {
    readonly canDelete: boolean;
    readonly archived: boolean;
    readonly pinned: boolean;
    readonly canPin: boolean;
    readonly canUnarchive: boolean;
}
/** 官方 WorkspaceBrowser 会把这四个操作放进列表 props；页签渲染和自绘回退必须抽同一份。 */
export declare function scheduledListHostActions(props?: Record<string, unknown> | null): ScheduledListHostActions;
/** 官方任务树本身没有删除；删除项由 archive-manager 补进菜单。没装归档插件时即使宿主传入 deleteSession 也不展示。 */
export declare function canDeleteScheduledSession(archiveManagerInstalled: boolean, deleteSession?: (sessionId: string) => void | Promise<void>): boolean;
/** 定时列表不提供置顶。顺序是重命名、分叉、归档或恢复，最后才是删除。 */
export declare function scheduledSessionMenuActions(state: ScheduledSessionMenuState): readonly ScheduledSessionMenuAction[];
export declare function scheduledGroupShowsActiveFolder(sessionIds: readonly string[], selectedId: string | null): boolean;
export declare function scheduledSessionOmitsStatusSlot(flat: boolean, running: boolean): boolean;
/** 串行归档，避免多个 workspace 状态写入相互覆盖。 */
export declare function archiveScheduledGroup(sessionIds: readonly string[], archiveSession: (sessionId: string) => void | Promise<void>): Promise<void>;
