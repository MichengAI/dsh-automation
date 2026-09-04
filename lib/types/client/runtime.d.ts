import type { ClientRpc } from './contracts.js';
import type { AutomationRunViewModel, AutomationSnapshot, CreateAutomationInput, MutateRequest } from './protocol.js';
export declare function snapshotPollIntervalMs(runs: readonly {
    readonly status: string;
}[] | undefined): number;
/** 没有界面订阅时维持低频轮询；界面打开后才按运行状态提升刷新频率。 */
export declare function effectiveSnapshotPollIntervalMs(runs: readonly {
    readonly status: string;
}[] | undefined, foregroundSubscribers: number): number;
export declare function isTransportError(error: unknown): boolean;
export interface AutomationClientState {
    readonly phase: 'idle' | 'loading' | 'ready' | 'error';
    readonly snapshot?: AutomationSnapshot;
    readonly error?: string;
    readonly refreshedAt?: number;
}
export interface AutomationStateSource {
    getSnapshot(): AutomationClientState;
    subscribe(listener: () => void, options?: {
        readonly background?: boolean;
    }): () => void;
}
export interface AutomationRuntime {
    readonly source: AutomationStateSource;
    refresh(): Promise<void>;
    createAutomation(input: CreateAutomationInput): Promise<void>;
    mutateAutomation(automationId: string, mutation: MutateRequest['mutation']): Promise<void>;
    updateAutomation(automationId: string, input: CreateAutomationInput): Promise<void>;
    runNow(automationId: string): Promise<void>;
    markRunRead(runId: string): Promise<void>;
    adoptSession(sessionId: string): Promise<void>;
    forgetSession(sessionId: string): Promise<void>;
    forgetAutomationSessions(automationId: string): Promise<void>;
}
export interface HostSessionSync {
    readonly list?: {
        getSnapshot(): {
            readonly ids?: readonly string[];
            readonly byId?: Readonly<Record<string, unknown>>;
        };
    };
    refresh?: () => Promise<void>;
}
/** 只同步未完成或最近完成的会话，避免已被 Host 清理的历史记录永久占用重试集合。 */
export declare function sessionIdsNeedingHostSync(runs: readonly Pick<AutomationRunViewModel, 'status' | 'sessionId' | 'scheduledFor' | 'startedAt' | 'finishedAt'>[], serverNow: string): string[];
/** 常驻订阅保证无页面挂载时仍能发现新定时会话，并同步 Host 会话列表。 */
export declare function installAutomationSessionSync(runtime: AutomationRuntime, getSessions: () => HostSessionSync | undefined, options?: {
    readonly now?: () => number;
}): () => void;
export declare function createAutomationRuntime(rpc: ClientRpc): AutomationRuntime;
