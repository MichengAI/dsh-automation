/** 侧栏定时树与原生任务列表的纯函数，供组件和单测共用。 */
import type { AutomationStatus } from './protocol.js';
export declare const AUTOMATION_SESSION_PREFIX = "dsh-automation-session-";
export declare const IM_SESSION_PREFIX_LEGACY = "im:";
export declare const IM_SESSION_PREFIX = "dsh-im-session-";
export declare function isImSessionId(id: string | null | undefined): boolean;
/** 记录视图把每个自动化任务合成一个官方工作区分组，id 进入这个命名空间避免与真实工作区冲突。 */
export declare const AUTOMATION_TASK_WORKSPACE_PREFIX = "dsh-automation-task:";
export declare const NATIVE_SIDEBAR_TAB_KEY = "dsh-native-sidebar.tab";
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
    readonly createdAt?: string;
    readonly updatedAt?: string;
}
export type NativeSidebarTab = 'tasks' | 'channels' | 'schedule';
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
/** 当前打开的是定时会话，但快照还没有这条执行记录时，侧栏应立刻再拉一次。 */
export declare function scheduledSessionNeedsSnapshotRefresh(sessionId: string | null | undefined, runs: readonly {
    readonly sessionId?: string;
}[] | undefined): boolean;
export declare function collectScheduledSessionIds(runs: readonly {
    readonly sessionId?: string | null;
}[] | undefined): Set<string>;
export declare function readNativeSidebarTab(raw: string | null): NativeSidebarTab;
/** 迁移前各插件各写一份页签选择；新键统一后只在迁移时读一次。 */
export declare const LEGACY_AUTOMATION_TAB_KEY = "dsh-automation.sidebar-tab";
export declare const IM_TAB_KEY = "dsh-im-connect.sidebar-tab";
type TabStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
/**
 * 读取侧栏页签选择：新键优先，缺失时回退到两边旧键并写回新键。
 *
 * 只清理本插件自己的旧键；`dsh-im-connect.sidebar-tab` 属于 IM，旧版 IM 仍会读它，
 * 由 IM 自己迁移后清理，这里删掉会让旧版 IM 丢失用户选择。
 * 存储不可用（隐私模式）时一律回落到任务页。
 */
export declare function readStoredSidebarTab(storage: TabStorage | undefined): NativeSidebarTab;
/** 新建控件允许附带快捷键，但会话行仍须由调用方排除。 */
export declare function isHostNewSessionControl(label: string): boolean;
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
export declare function tabForSessionId(sessionId: string | null | undefined, scheduledIds?: ReadonlySet<string>, options?: {
    readonly followSchedule?: boolean;
    readonly followChannels?: boolean;
}): NativeSidebarTab | undefined;
export declare function occupantLooksLikeCodexUi(value: unknown): boolean;
export declare function slotOccupantName(item: unknown): string;
export declare function hasCodexUiSidebar(entries: readonly unknown[] | undefined): boolean;
export interface SessionListState {
    readonly ids?: readonly string[];
    readonly byId?: Record<string, NativeSessionLike>;
}
/** 记录视图只保留定时执行产生的会话；其余字段原样带给官方树。 */
export declare function scheduledOnlySessionState<T extends SessionListState>(state: T | undefined, scheduledIds: ReadonlySet<string>): T;
export interface WorkspaceListState {
    readonly items?: readonly NativeWorkspaceLike[];
    readonly archivedSessionIds?: readonly string[];
    readonly pinnedSessionIds?: readonly string[];
    readonly state?: 'idle' | 'loading' | 'error';
    readonly phase?: 'pending' | 'ready';
    readonly error?: unknown;
}
export interface SyntheticTaskGroup {
    readonly id: string;
    readonly name: string;
    readonly sessionIds: readonly string[];
    /** 任务自身的创建时间（ISO-8601）；官方树用它排序并渲染分组悬停卡片。 */
    readonly createdAt: string;
}
export declare function automationTaskWorkspaceId(automationId: string): string;
export declare function automationIdFromTaskWorkspaceId(workspaceId: string | undefined): string | undefined;
/**
 * 把自动化任务合成为官方 WorkspaceView 列表。
 *
 * 官方树只按 `workspaceId` + `sessionIds` 分组，不校验工作区是否真实存在；
 * 保留源快照的 phase/state/archived/pinned，避免官方树一直停在未就绪状态。
 */
export declare function syntheticTaskWorkspaceState<T extends WorkspaceListState>(state: T | undefined, groups: readonly SyntheticTaskGroup[]): T;
/**
 * 按真实工作区分组时，只保留定时执行会话，并沿用官方的归档筛选。
 * 保留 phase/state/archived/pinned，官方树才会正常渲染。
 */
export declare function scheduledRealWorkspaceState<T extends WorkspaceListState>(state: T | undefined, scheduledIds: ReadonlySet<string>, archivedFilter: ArchivedSessionFilter): T;
/** 0.2 主视图由 retainedBy.mainView 标记。 */
export declare function resolveCurrentSessionId(snapshot: SessionListState | undefined): string | null;
export interface ClientSessionOpenAccess {
    readonly uiWorkspace?: {
        openSession(id: string): void;
    };
    readonly get?: (name: string) => unknown;
    readonly reflect?: {
        get?: (name: string) => unknown;
    };
}
/** 不硬读 ctx.uiWorkspace：Cordis 未 inject 时读属性会抛，只能 reflect.get / get。 */
export declare function resolveClientSessionOpenAccess(ctx: ClientSessionOpenAccess): ClientSessionOpenAccess;
export declare function canOpenClientSession(access: ClientSessionOpenAccess): boolean;
/** 支持范围内的宿主都用 uiWorkspace.openSession。不硬读未注入的属性。 */
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
export type WrapperFlags = {
    __dshNativeTabWrapped?: unknown;
    __dshNativeTabOriginal?: unknown;
    __dshNativeTabOwner?: unknown;
    __dshAutomationWrapped?: unknown;
    __dshAutomationOriginal?: unknown;
    __imConnectWrapped?: unknown;
    __imConnectOriginal?: unknown;
};
export declare function wrapperFlags(component: unknown): WrapperFlags;
export declare function isOwnAutomationWrapper(component: unknown): boolean;
export declare function resolveOfficialTreeComponent(component: unknown): unknown;
export declare function isAutomationWorkspaceWrapper(item: unknown): boolean;
export declare function pickWrappableWorkspacesEntry(entries: readonly unknown[]): unknown;
export {};
