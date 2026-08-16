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
export declare function needsHumanApproval(exec: {
    readonly name: string;
    readonly arguments?: unknown;
    readonly signal: AbortSignal;
}, isMountedAgent: boolean): boolean;
export declare function humanApprovalReason(toolName: string): string;
export declare function apply(ctx: Context, rawConfig: Config): Promise<void>;
export type * from './types.ts';
export { automationDomainSpec } from './domain.ts';
