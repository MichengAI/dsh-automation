/** 仅 loopback 的 Web 客户端 RPC 适配器。 */
import { type AutomationService } from './service.ts';
interface RpcContext {
    readonly logger: {
        warn(message: string): void;
    };
    readonly connection: {
        readonly rpc: {
            handle(channel: string, handler: (endpoint: string, payload: unknown, signal: AbortSignal) => Promise<unknown>, options: {
                readonly authority: 'loopback' | 'trusted-host';
            }): () => Promise<void>;
        };
    };
}
export declare function registerAutomationRpc(ctx: RpcContext, service: AutomationService): () => Promise<void>;
export {};
