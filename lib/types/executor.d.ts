/** 已认领 run 的独立 Agent 执行边界。 */
import type { Context } from '@deepseek-ai/cordis';
import type { AutomationDefinition, AutomationRun } from './types.ts';
interface SessionEventLike {
    readonly seq: number;
    readonly type: string;
    readonly data: Record<string, any>;
}
export declare function unattendedToolGuardReason(name: string, args: unknown): string | undefined;
export interface RunCompletion {
    readonly sessionId?: string;
    readonly status: 'succeeded' | 'failed' | 'cancelled';
    readonly summary?: string;
    readonly error?: {
        readonly code: string;
        readonly message: string;
    };
}
export interface ExecutorConfig {
    readonly runTimeoutMs: number;
    readonly sessionId: string;
    readonly signal?: AbortSignal;
}
/** 自动化权限名称与 DSH 沙箱事件名称不同，必须在写入会话前转换。 */
export declare function sandboxModeForPermission(permission: AutomationDefinition['permissionPreset']): 'read-only' | 'workspace-write' | 'danger-full-access';
export declare function summarizeRun(events: readonly SessionEventLike[], firstSeq: number): {
    readonly text: string;
    readonly reason?: Record<string, any>;
};
export declare function executeAutomationRun(ctx: Context, definition: AutomationDefinition, run: AutomationRun, config: ExecutorConfig): Promise<RunCompletion>;
export declare function pinAutomationSessionTitle(ctx: Context, session: unknown, title: string): void;
export {};
