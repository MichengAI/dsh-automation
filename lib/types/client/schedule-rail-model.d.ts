/** 侧栏定时树与原生任务列表的纯函数，供组件和单测共用。 */
export declare const AUTOMATION_SESSION_PREFIX = "dsh-automation-session-";
export declare const NATIVE_SIDEBAR_TAB_KEY = "dsh-automation.sidebar-tab";
export interface ScheduleRailSession {
    readonly id: string;
    readonly running: boolean;
    readonly label: string;
}
export interface ScheduleRailGroup {
    readonly id: string;
    readonly name: string;
    readonly sessions: readonly ScheduleRailSession[];
}
export interface ScheduleRunLike {
    readonly automationId: string;
    readonly sessionId?: string;
    readonly status: string;
    readonly startedAt?: string;
    readonly scheduledFor: string;
}
export interface NativeSessionLike {
    readonly id?: string;
    readonly title?: string;
    readonly blank?: boolean;
    readonly origin?: string;
}
export interface NativeWorkspaceLike {
    readonly id?: string;
    readonly workspaceId?: string;
    readonly title?: string;
    readonly path?: string;
    readonly sessionIds?: readonly string[];
}
export type NativeSidebarTab = 'tasks' | 'channels' | 'schedule';
export { formatRunStamp } from '../run-title.js';
export declare function groupScheduledSessions(automations: readonly {
    readonly id: string;
    readonly name: string;
}[], runs: readonly ScheduleRunLike[]): ScheduleRailGroup[];
export declare function isNativeTaskSession(item: NativeSessionLike | undefined): boolean;
export declare function groupNativeTaskSessions(sessions: {
    readonly ids?: readonly string[];
    readonly byId?: Record<string, NativeSessionLike>;
}, workspaces: {
    readonly items?: readonly NativeWorkspaceLike[];
    readonly archivedSessionIds?: readonly string[];
} | undefined, ungroupedLabel: string): {
    readonly id: string;
    readonly label: string;
    readonly sessions: readonly NativeSessionLike[];
}[];
export declare function readNativeSidebarTab(raw: string | null): NativeSidebarTab;
export declare function tabForSessionId(sessionId: string | null | undefined): NativeSidebarTab | undefined;
export declare function occupantLooksLikeCodexUi(value: unknown): boolean;
export declare function slotOccupantName(item: unknown): string;
export declare function hasCodexUiSidebar(entries: readonly unknown[] | undefined): boolean;
export interface SessionListState {
    readonly ids?: readonly string[];
    readonly byId?: Record<string, NativeSessionLike>;
    readonly current?: string | null;
}
export declare function filterTaskSessionState<T extends SessionListState>(state: T | undefined): T;
export interface WorkspaceListState {
    readonly items?: readonly NativeWorkspaceLike[];
    readonly archivedSessionIds?: readonly string[];
}
export declare function openScheduledSession(id: string, openRuntime?: (sessionId: string) => void, openHost?: (sessionId: string) => void): void;
export declare function isHiddenSidebarSessionId(id: string): boolean;
export declare function filterWorkspaceListState<T extends WorkspaceListState>(state: T | undefined): T;
export type WrapperFlags = {
    __dshAutomationWrapped?: unknown;
    __dshAutomationOriginal?: unknown;
    __imConnectWrapped?: unknown;
    __imConnectOriginal?: unknown;
};
export declare function wrapperFlags(component: unknown): WrapperFlags;
export declare function isOwnAutomationWrapper(component: unknown): boolean;
export declare function isMarkedWorkspaceWrapper(component: unknown): boolean;
export declare function resolveOfficialTreeComponent(component: unknown): unknown;
export declare function isAutomationWorkspaceWrapper(item: unknown): boolean;
export declare function pickWrappableWorkspacesEntry(entries: readonly unknown[]): unknown;
