import type { ClientRpc } from './contracts.js';
import type { AutomationSnapshot, CreateAutomationInput, MutateRequest } from './protocol.js';
export declare function snapshotPollIntervalMs(runs: readonly {
    readonly status: string;
}[] | undefined): number;
export declare function isTransportError(error: unknown): boolean;
export interface AutomationClientState {
    readonly phase: 'idle' | 'loading' | 'ready' | 'error';
    readonly snapshot?: AutomationSnapshot;
    readonly error?: string;
    readonly refreshedAt?: number;
}
export interface AutomationStateSource {
    getSnapshot(): AutomationClientState;
    subscribe(listener: () => void): () => void;
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
/**
 * 常驻订阅 Automation 快照，并把新产生的定时会话同步进 Host 会话列表。
 * 独立模式依靠这条订阅持续轮询；Codex UI 模式还会在发现缺失会话时刷新 Host Store。
 */
export declare function installAutomationSessionSync(runtime: AutomationRuntime, sessions: HostSessionSync | undefined): () => void;
export declare function createAutomationRuntime(rpc: ClientRpc): AutomationRuntime;
