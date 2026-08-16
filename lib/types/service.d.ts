/** 持久化定义、occurrence 认领、时钟与执行调度。 */
import type { Context } from '@deepseek-ai/cordis';
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
    readonly model: string;
    readonly label: string;
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
    readonly defaultModel: ModelOption | null;
    readonly skills: readonly {
        readonly id: string;
        readonly name: string;
    }[];
    readonly definitions: readonly AutomationDefinitionView[];
    readonly runs: readonly AutomationRun[];
}
export interface AutomationDefinitionView extends AutomationDefinition {
    readonly nextRunAt: string | null;
    readonly lastRun: AutomationRun | null;
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
    private readonly active;
    private constructor();
    static open(ctx: Context, config: AutomationConfig): Promise<AutomationService>;
    start(): void;
    ownsSession(sessionId: string, events?: readonly SessionEventLike[]): boolean;
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
    private recoverInterruptedRuns;
    private pruneWorkspaceHistory;
    private pruneAllHistory;
}
export {};
