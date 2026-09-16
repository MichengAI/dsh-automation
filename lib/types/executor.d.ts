/** 已认领 run 的独立 Agent 执行边界。 */
import type { Context } from '@deepseek-ai/cordis';
import type { PermissionPresetService } from './permission-presets.ts';
import type { AutomationDefinition, AutomationRun } from './types.ts';
export interface SessionEventLike {
    readonly seq?: number;
    readonly type: string;
    readonly data: Record<string, any>;
}
interface SessionEventReader {
    readonly events?: readonly SessionEventLike[];
    snapshotEvents?(): readonly SessionEventLike[];
}
export interface SessionOwnershipHintObject extends SessionEventReader {
    deriveMessages?(): readonly {
        readonly source?: {
            readonly kind?: unknown;
        };
    }[];
}
export type SessionOwnershipHint = readonly SessionEventLike[] | SessionOwnershipHintObject;
export interface SessionEventWatch {
    readonly events: SessionEventLike[];
    stop(): void;
}
/** 对不保证及时响应 AbortSignal 的宿主任务设置第二道退出上限。 */
export declare function settlesWithin(promise: Promise<unknown>, timeoutMs: number): Promise<boolean>;
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
/** 新宿主读 deriveMessages 投影；旧宿主和测试夹具再回退事件数组或弃用的同步快照。 */
export declare function hasAutomationSource(hint?: SessionOwnershipHint): boolean;
/** 已弃用的同步历史读取，只给 session/event 没有增量的旧宿主兜底。 */
export declare function readSessionEvents(session: SessionEventReader): readonly SessionEventLike[];
/** 订阅当前会话增量，避免为摘要再扫整段历史。 */
export declare function watchSessionEvents(ctx: {
    on?(name: string, listener: (...args: any[]) => void): () => void;
}, session: unknown, fromSeq: number): SessionEventWatch;
export declare function summarizeCollectedRun(live: readonly SessionEventLike[], session: SessionEventReader, firstSeq: number): ReturnType<typeof summarizeRun>;
export declare function summarizeRun(events: readonly SessionEventLike[], firstSeq: number): {
    readonly text: string;
    readonly reason?: Record<string, any>;
};
export declare function executeAutomationRun(ctx: Context, definition: AutomationDefinition, run: AutomationRun, config: ExecutorConfig): Promise<RunCompletion>;
export declare function pinAutomationSessionTitle(ctx: Context, session: unknown, title: string): void;
export {};
