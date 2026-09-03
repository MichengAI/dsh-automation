/** 已认领 run 的独立 Agent 执行边界。 */
import type { Context } from '@deepseek-ai/cordis';
import type { PermissionPresetService } from './permission-presets.ts';
import type { AutomationDefinition, AutomationRun } from './types.ts';
export interface SessionEventLike {
    readonly seq: number;
    readonly type: string;
    readonly data: Record<string, any>;
}
interface SessionEventReader {
    readonly events?: readonly SessionEventLike[];
    snapshotEvents?(): readonly SessionEventLike[];
}
/** 对不保证及时响应 AbortSignal 的宿主任务设置第二道退出上限。 */
export declare function settlesWithin(promise: Promise<unknown>, timeoutMs: number): Promise<boolean>;
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
/** 先应用官方预设的完整语义，再让无人值守审批 fail-closed。 */
export declare function applyUnattendedPermission(presets: PermissionPresetService, session: unknown, permission: AutomationDefinition['permissionPreset']): void;
/** 优先读取新版按需快照，避免保留旧版 Session.events 的内部日志引用。 */
export declare function readSessionEvents(session: SessionEventReader): readonly SessionEventLike[];
export declare function summarizeRun(events: readonly SessionEventLike[], firstSeq: number): {
    readonly text: string;
    readonly reason?: Record<string, any>;
};
export declare function executeAutomationRun(ctx: Context, definition: AutomationDefinition, run: AutomationRun, config: ExecutorConfig): Promise<RunCompletion>;
export declare function pinAutomationSessionTitle(ctx: Context, session: unknown, title: string): void;
export {};
