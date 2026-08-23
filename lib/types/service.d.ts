/** 持久化定义、occurrence 认领、时钟与执行调度。 */
import type { Context } from '@deepseek-ai/cordis';
import { type PermissionOption } from './permission-presets.ts';
import type { AutomationDefinition, AutomationRun, AutomationSchedule, PermissionPreset, UpdateAutomationInput } from './types.ts';
export declare const AUTOMATION_SESSION_PREFIX = "dsh-automation-session-";
export interface AutomationConfig {
    readonly maxConcurrentRuns: number;
    readonly runTimeoutMs: number;
    readonly misfireGraceMs: number;
    readonly historyLimit: number;
}
export interface WorkspaceOption {
    readonly id: string;
    readonly title: string;
    readonly path: string;
}
export interface ModelOption {
    readonly provider: string;
    readonly providerLabel: string;
    readonly model: string;
    readonly label: string;
    readonly description?: string;
    readonly reasoning?: {
        readonly efforts: readonly {
            readonly id: string;
            readonly name: string;
            readonly description?: string;
        }[];
        readonly defaultEffort?: string;
    };
}
export interface ModelCatalogFailure {
    readonly provider: string;
    readonly providerLabel: string;
    readonly message: string;
}
export interface CreateRequest {
    readonly name: string;
    readonly prompt: string;
    readonly schedule: AutomationSchedule;
    readonly permissionPreset?: PermissionPreset;
    readonly workspaceId?: string;
    readonly cwd?: string;
    readonly provider?: string | null;
    readonly model?: string | null;
    readonly reasoningEffort?: string | null;
    readonly agentPreset?: string;
}
export interface AutomationScope {
    readonly sessionId: string;
    readonly creatorKind: 'agent' | 'web';
    readonly hostWide?: boolean;
}
export interface AutomationSnapshot {
    readonly generatedAt: string;
    readonly workspace: WorkspaceOption | null;
    readonly workspaces: readonly WorkspaceOption[];
    readonly models: readonly ModelOption[];
    readonly modelFailures: readonly ModelCatalogFailure[];
    readonly defaultModel: ModelOption | null;
    readonly skills: readonly {
        readonly id: string;
        readonly name: string;
    }[];
    readonly permissions: readonly PermissionOption[];
    readonly defaultPermission: string;
    readonly definitions: readonly AutomationDefinitionView[];
    readonly runs: readonly AutomationRun[];
}
export interface AutomationDefinitionView extends AutomationDefinition {
    readonly nextRunAt: string | null;
    readonly lastRun: AutomationRun | null;
}
/** 可安全返回给 RPC/工具调用方的输入、状态或权限错误。 */
export declare class AutomationRequestError extends Error {
    readonly name = "AutomationRequestError";
}
interface SessionEventLike {
    readonly type: string;
    readonly data: unknown;
}
export declare class AutomationService {
    private readonly ctx;
    private readonly domain;
    private readonly config;
    private definitions;
    private runs;
    private timer;
    private operationTail;
    private pumpScheduled;
    private requested;
    private started;
    private stopping;
    private optionCatalogCache;
    private readonly active;
    private constructor();
    static open(ctx: Context, config: AutomationConfig): Promise<AutomationService>;
    start(): void;
    ownsSession(sessionId: string, events?: readonly SessionEventLike[]): boolean;
    permissionNames(): readonly string[];
    permissionOptions(): readonly PermissionOption[];
    defaultPermission(): string;
    dispose(): Promise<void>;
    snapshot(scope: AutomationScope, signal?: AbortSignal): Promise<AutomationSnapshot>;
    create(scope: AutomationScope, request: CreateRequest, signal?: AbortSignal): Promise<AutomationDefinition>;
    update(scope: AutomationScope, id: string, input: Omit<UpdateAutomationInput, 'now'> & {
        readonly status?: 'active' | 'paused';
    }, signal?: AbortSignal): Promise<AutomationDefinition>;
    delete(scope: AutomationScope, id: string, signal?: AbortSignal): Promise<{
        readonly id: string;
        readonly deleted: boolean;
    }>;
    runNow(scope: AutomationScope, id: string, signal?: AbortSignal): Promise<AutomationRun>;
    markRead(scope: AutomationScope, runId: string, signal?: AbortSignal): Promise<AutomationRun>;
    forgetSession(sessionId: string): Promise<void>;
    reconcileMissingSessions(): Promise<void>;
    private knownSessionIds;
    forgetAutomationSessions(automationId: string): Promise<void>;
    adoptSession(sessionId: string): Promise<void>;
    private resolveUpdateWorkspace;
    private collectOptions;
    private resolveCreateTarget;
    private resolveScope;
    private ownedDefinition;
    private requestPump;
    private pumpOnce;
    private claimLatestDue;
    private startQueuedRuns;
    private startRun;
    private executeRun;
    private armNextTimer;
    private armRetryTimer;
    private clearTimer;
    private serialize;
    private permissionPresets;
    private requirePermission;
    /** 把旧版 full-access 及已移除的预设收敛到 Host 当前可用列表。 */
    private migratePermissionPresets;
    private recoverInterruptedRuns;
    private pruneWorkspaceHistory;
    private pruneAllHistory;
}
export {};
