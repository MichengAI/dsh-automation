/** Web 客户端与 Host RPC 共享的 JSON 契约。 */
export type AutomationStatus = 'active' | 'paused';
export type AutomationRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'cancelled' | 'interrupted';
export type AutomationPermission = string;
export interface PermissionOption {
    readonly value: string;
    readonly name: string;
    readonly description?: string;
}
export type AutomationSchedule = {
    readonly kind: 'once';
    readonly at: string;
    readonly timeZone?: string;
} | {
    readonly kind: 'interval';
    readonly everyMinutes: number;
    readonly anchor?: string;
    readonly timeZone?: string;
} | {
    readonly kind: 'daily';
    readonly time: string;
    readonly timeZone?: string;
} | {
    readonly kind: 'weekly';
    readonly time: string;
    readonly weekdays: readonly number[];
    readonly timeZone?: string;
} | {
    readonly kind: 'hourly';
    readonly minute: number;
    readonly timeZone?: string;
} | {
    readonly kind: 'monthly';
    readonly day: number;
    readonly time: string;
    readonly timeZone?: string;
} | {
    readonly kind: 'custom';
    readonly everyDays: number;
    readonly time: string;
    readonly timeZone?: string;
};
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
export interface AutomationViewModel {
    readonly id: string;
    readonly revision: number;
    readonly name: string;
    readonly prompt: string;
    readonly status: AutomationStatus;
    readonly schedule: AutomationSchedule;
    readonly scheduleSummary: string;
    readonly timeZone: string;
    readonly permission: AutomationPermission;
    readonly workspaceId?: string;
    readonly cwd?: string;
    readonly provider?: string | null;
    readonly model?: string | null;
    readonly reasoningEffort?: string | null | undefined;
    readonly nextRunAt?: string;
    readonly lastRunAt?: string;
    readonly lastRunStatus?: AutomationRunStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface AutomationRunViewModel {
    readonly id: string;
    readonly automationId: string;
    readonly automationName: string;
    readonly status: AutomationRunStatus;
    readonly trigger: 'schedule' | 'manual' | 'catch-up';
    readonly scheduledFor: string;
    readonly startedAt?: string;
    readonly finishedAt?: string;
    readonly sessionId?: string;
    readonly summary?: string;
    readonly error?: string;
    readonly unread?: boolean;
}
export interface AutomationSnapshot {
    readonly scope: {
        readonly workspaceId?: string;
        readonly workspaceName?: string;
        readonly cwd: string;
    };
    readonly workspaces?: readonly WorkspaceOption[];
    readonly models?: readonly ModelOption[];
    readonly modelFailures?: readonly ModelCatalogFailure[];
    readonly defaultModel?: ModelOption | null;
    readonly skills?: readonly {
        readonly id: string;
        readonly name: string;
    }[];
    readonly permissions: readonly PermissionOption[];
    readonly defaultPermission: string;
    readonly automations: readonly AutomationViewModel[];
    readonly runs: readonly AutomationRunViewModel[];
    readonly serverNow: string;
}
export interface CreateAutomationInput {
    readonly name: string;
    readonly prompt: string;
    readonly schedule: AutomationSchedule;
    readonly timeZone: string;
    readonly permission: AutomationPermission;
    readonly workspaceId: string;
    readonly cwd: string;
    readonly provider?: string | null;
    readonly model?: string | null;
    readonly reasoningEffort?: string | null | undefined;
}
export interface SnapshotRequest {
    readonly sessionId?: string;
}
export interface CreateRequest {
    readonly sessionId?: string;
    readonly input: CreateAutomationInput;
}
export interface MutateRequest {
    readonly sessionId?: string;
    readonly automationId: string;
    readonly mutation: 'pause' | 'resume' | 'delete';
}
export interface UpdateRequest {
    readonly sessionId?: string;
    readonly automationId: string;
    readonly input: CreateAutomationInput;
}
export interface RunNowRequest {
    readonly sessionId?: string;
    readonly automationId: string;
}
export interface MarkReadRequest {
    readonly sessionId?: string;
    readonly runId: string;
}
export interface AddWorkspaceRequest {
    readonly sessionId?: string;
    readonly path: string;
}
export interface RpcErrorValue {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
}
export type RpcResult<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly error: RpcErrorValue;
};
export declare function unwrapRpcResult<T>(value: unknown): T;
