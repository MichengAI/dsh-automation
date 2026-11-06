/** 客户端 Agent 预设显示：内置预设走官方词条，用户自建预设保留自报名称。 */
import type { Translate } from './contracts.js';
/** 下拉与卡片共用的预设名称。 */
export declare function agentPresetLabel(preset: {
    readonly id: string;
    readonly name?: string;
}, t: Translate): string;
/** 下拉项的说明文案；内置预设缺省时回退到官方描述。 */
export declare function agentPresetDescription(preset: {
    readonly id: string;
    readonly description?: string;
}, t: Translate): string | undefined;
