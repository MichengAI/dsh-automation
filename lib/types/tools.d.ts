/** 绑定到单个 root Agent 工作区的管理工具。 */
import type { AutomationService } from './service.ts';
interface ToolAgent {
    readonly id: string;
    readonly ctx: {
        readonly tools: {
            register(definition: unknown): () => void;
        };
    };
}
export declare function registerAutomationTools(service: AutomationService, agent: ToolAgent): () => void;
export {};
