/** 侧栏定时树与原生任务列表的纯函数，供组件和单测共用。 */
import type { AutomationStatus } from './protocol.js';
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
    readonly retainedBy?: {
        readonly mainView?: number;
    };
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
    readonly status: AutomationStatus;
    readonly nextRunAt?: string;
}
export interface TaskOverviewRow {
    readonly id: string;
    readonly name: string;
    readonly status: AutomationStatus;
    readonly nextRunAt?: string;
}
export declare function automationToggleMutation(status: AutomationStatus): 'pause' | 'resume';
/** 任务总览只由任务定义生成，不依赖执行记录或会话是否已经创建。 */
export declare function deriveTaskOverviewRows(automations: readonly OverviewAutomationLike[]): TaskOverviewRow[];
export type ArchivedSessionFilter = 'default' | 'show' | 'only';
/** 默认隐藏已归档；显示和仅归档跟官方筛选同一套规则。空 id 一律不展示。 */
export declare function scheduledSessionVisible(sessionId: string | undefined, archived: ReadonlySet<string>, filter: ArchivedSessionFilter): boolean;
/** 置顶会话留在原有相对顺序里，整段排到分组前面。 */
export declare function leadWithPinnedSessions<T extends {
    readonly id?: string;
}>(sessions: readonly T[], pinned: ReadonlySet<string>): T[];
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
    readonly pinnedSessionIds?: readonly string[];
}
/** 旧宿主读 list.current；alpha.2 主视图改由 retainedBy.mainView 标记。 */
export declare function resolveCurrentSessionId(snapshot: SessionListState | undefined): string | null;
export interface ClientSessionOpenAccess {
    readonly uiWorkspace?: {
        openSession(id: string): void;
    };
    readonly sessions?: {
        open?(id: string): void;
    };
    readonly get?: (name: string) => unknown;
    readonly reflect?: {
        get?: (name: string) => unknown;
    };
}
/** 不硬读 ctx.uiWorkspace：Cordis 未 inject 时读属性会抛，只能 reflect.get / get。 */
export declare function resolveClientSessionOpenAccess(ctx: ClientSessionOpenAccess): ClientSessionOpenAccess;
export declare function canOpenClientSession(access: ClientSessionOpenAccess): boolean;
/** 官方 alpha.2 走 uiWorkspace.openSession；旧宿主继续 sessions.open。不硬注入 uiWorkspace。 */
export declare function openClientSession(access: ClientSessionOpenAccess, id: string): void;
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
export type WorkspaceGroupMode = 'workspace' | 'workspace-tree' | 'list';
/** 官方按工作区树：子目录挂到路径最长的已打开工作区下面。 */
export declare function owningParentFolder(path: string, candidates: readonly string[]): string | undefined;
export interface WorkspaceTreeGroup<T> {
    readonly id: string;
    readonly name: string;
    readonly depth: number;
    readonly keep?: boolean;
    readonly sessions: readonly T[];
}
/** 定时会话按宿主工作区归组，工作区路径嵌套时缩进。没有工作区的会话进未分组。 */
export declare function groupScheduledSessionsByWorkspaceTree<T extends {
    readonly id?: string;
}>(sessions: readonly T[], workspaces: readonly NativeWorkspaceLike[], ungroupedLabel: string): WorkspaceTreeGroup<T>[];
export type WorkspaceListSort = 'manual' | 'time';
export interface SearchableRailGroup {
    readonly name: string;
    readonly sessions: readonly {
        readonly title?: string;
        readonly label?: string;
        readonly updatedAt?: string;
    }[];
    /** 按工作区树时，没有自己的会话、只用来托住子工作区的父级也要留着。 */
    readonly keep?: boolean;
}
export declare function applyWorkspaceBrowserQuery<T extends SearchableRailGroup>(groups: readonly T[], query: string, sort: WorkspaceListSort, groupMode?: WorkspaceGroupMode): T[];
