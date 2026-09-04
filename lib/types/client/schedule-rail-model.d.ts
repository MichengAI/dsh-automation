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
    readonly automationName?: string;
    readonly sessionId?: string;
    readonly status: string;
    readonly startedAt?: string;
    readonly scheduledFor: string;
}
export interface NativeSessionLike {
    readonly id?: string;
    readonly title?: string;
    readonly displayTitle?: string;
    readonly blank?: boolean;
    readonly origin?: string;
    readonly updatedAt?: number | string;
    readonly running?: boolean;
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
/** 定时会话标题复刻任务树：优先用 Session 真实标题，没有再用执行时间兜底。 */
export declare function scheduledSessionTitle(liveTitle: string | undefined, fallbackLabel: string): string;
export declare function sessionUpdatedAtIso(value: number | string | undefined, fallback: string): string;
export declare function groupScheduledSessions(automations: readonly {
    readonly id: string;
    readonly name: string;
    readonly timeZone?: string;
}[], runs: readonly ScheduleRunLike[]): ScheduleRailGroup[];
export interface OverviewAutomationLike {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly nextRunAt?: string;
}
export interface TaskOverviewRow {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly nextRunAt?: string;
    readonly lastSessionId?: string;
}
/** 任务总览：每个定义一行；最近一次留有会话的运行决定该行是否可点开。 */
export declare function deriveTaskOverviewRows(automations: readonly OverviewAutomationLike[], runs: readonly ScheduleRunLike[]): TaskOverviewRow[];
/** 归档立即摘掉。宿主会话簿经常晚于自动化快照，缺席不能当成已删除。 */
export declare function keepScheduledSessionLink(sessionId: string | undefined, archived: ReadonlySet<string>, _presentIds?: ReadonlySet<string>): boolean;
/** 当前打开的是定时会话，但快照还没有这条执行记录时，侧栏应立刻再拉一次。 */
export declare function scheduledSessionNeedsSnapshotRefresh(sessionId: string | null | undefined, runs: readonly {
    readonly sessionId?: string;
}[] | undefined): boolean;
export declare function collectScheduledSessionIds(runs: readonly {
    readonly sessionId?: string | null;
}[] | undefined): Set<string>;
/** 任务树要藏的定时会话：前缀、仍挂在定时快照上，或标题是定时跑出来的时间戳。 */
export declare function isAutomationSidebarSession(id: string, item?: NativeSessionLike, scheduledIds?: ReadonlySet<string>): boolean;
export declare function isNativeTaskSession(item: NativeSessionLike | undefined, scheduledIds?: ReadonlySet<string>): boolean;
export declare function groupNativeTaskSessions(sessions: {
    readonly ids?: readonly string[];
    readonly byId?: Record<string, NativeSessionLike>;
}, workspaces: {
    readonly items?: readonly NativeWorkspaceLike[];
    readonly archivedSessionIds?: readonly string[];
} | undefined, ungroupedLabel: string, scheduledIds?: ReadonlySet<string>): {
    readonly id: string;
    readonly label: string;
    readonly sessions: readonly NativeSessionLike[];
}[];
export declare function readNativeSidebarTab(raw: string | null): NativeSidebarTab;
/** 协作页签（频道/定时）以 registry 为准，不能因 sidebar.channels slot 未就绪就把点击打回任务。 */
/** 只有当前会话变了才跟随切页签，避免点「定时」时被频道/任务会话打回去闪烁。 */
export declare function shouldFollowSessionTab(previousCurrent: string | null | undefined, current: string | null | undefined): boolean;
export declare function ownedSidebarTabIds(input: {
    readonly extraTabIds: readonly string[];
    readonly channelsReady: boolean;
}): string[];
export declare function resolveVisibleSidebarTab(input: {
    readonly tab: string;
    readonly channelsReady: boolean;
    readonly extraTabIds: readonly string[];
}): string;
export declare function tabForSessionId(sessionId: string | null | undefined, scheduledIds?: ReadonlySet<string>): NativeSidebarTab | undefined;
export declare function occupantLooksLikeCodexUi(value: unknown): boolean;
export declare function slotOccupantName(item: unknown): string;
export declare function hasCodexUiSidebar(entries: readonly unknown[] | undefined): boolean;
export interface SessionListState {
    readonly ids?: readonly string[];
    readonly byId?: Record<string, NativeSessionLike>;
    readonly current?: string | null;
}
export declare function filterTaskSessionState<T extends SessionListState>(state: T | undefined, scheduledIds?: ReadonlySet<string>): T;
export interface WorkspaceListState {
    readonly items?: readonly NativeWorkspaceLike[];
    readonly archivedSessionIds?: readonly string[];
}
export declare function openScheduledSession(id: string, openRuntime?: (sessionId: string) => void, openHost?: (sessionId: string) => void): boolean;
export interface EnsureOpenScheduledSessionInput {
    readonly id: string;
    readonly adopt?: (sessionId: string) => Promise<void>;
    readonly listed?: (sessionId: string) => boolean;
    readonly refresh?: () => Promise<void>;
    readonly openRuntime?: (sessionId: string) => void;
    readonly openHost?: (sessionId: string) => void;
}
/** 先把会话挂回工作区并刷新客户端会话簿，再打开；避免侧栏能看见、点下去却 unknown session。 */
export declare function ensureOpenScheduledSession(input: EnsureOpenScheduledSessionInput): Promise<boolean>;
export declare function isHiddenSidebarSessionId(id: string, scheduledIds?: ReadonlySet<string>): boolean;
export declare function filterWorkspaceListState<T extends WorkspaceListState>(state: T | undefined, scheduledIds?: ReadonlySet<string>): T;
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
export type WorkspaceGroupMode = 'workspace' | 'list';
export type WorkspaceListSort = 'manual' | 'time';
export interface SearchableRailGroup {
    readonly name: string;
    readonly sessions: readonly {
        readonly title?: string;
        readonly label?: string;
        readonly updatedAt?: string;
    }[];
}
export declare function applyWorkspaceBrowserQuery<T extends SearchableRailGroup>(groups: readonly T[], query: string, sort: WorkspaceListSort, groupMode?: WorkspaceGroupMode): T[];
