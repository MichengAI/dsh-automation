/** 独立自动化的 Cordis Host 插件入口。 */
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "dsh-automation";
export declare const inject: string[];
export interface Config {
    readonly maxConcurrentRuns?: number;
    readonly runTimeoutMinutes?: number;
    readonly misfireGraceMinutes?: number;
    readonly historyLimit?: number;
}
export declare const Config: any;
export type SessionApprovalPolicy = 'ask' | 'never';
export interface ApprovalPolicyReader {
    readonly config?: {
        readonly policy?: SessionApprovalPolicy;
    };
    overrideOf?(session: unknown): SessionApprovalPolicy | undefined;
}
/**
 * 读会话审批策略。官方三档对应：
 * Read Only / Workspace Write → ask
 * Full access → never
 */
export declare function sessionApprovalPolicy(approval: ApprovalPolicyReader | undefined, session: unknown): SessionApprovalPolicy | undefined;
/**
 * 只在官方 ask 策略下二次确认。never（Full access）再 ask，
 * 会被映射成 “the user rejected tool”，且不会弹窗。
 */
export declare function needsHumanApproval(exec: {
    readonly name: string;
    readonly arguments?: unknown;
    readonly signal: AbortSignal;
}, isMountedAgent: boolean, policy?: SessionApprovalPolicy): boolean;
export declare function humanApprovalReason(toolName: string): string;
export declare function apply(ctx: Context, rawConfig: Config): Promise<void>;
export type * from './types.ts';
export { automationDomainSpec } from './domain.ts';
