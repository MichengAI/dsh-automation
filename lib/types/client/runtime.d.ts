import type { ClientRpc } from './contracts.js';
import type { AutomationSnapshot, CreateAutomationInput, MutateRequest } from './protocol.js';
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
    runNow(automationId: string): Promise<void>;
    markRunRead(runId: string): Promise<void>;
}
export declare function createAutomationRuntime(rpc: ClientRpc): AutomationRuntime;
