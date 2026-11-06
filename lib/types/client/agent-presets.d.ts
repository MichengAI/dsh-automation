/** 客户端 Agent 预设显示：内置预设走官方词条，用户自建预设保留自报名称。 */
import type { Translate } from './contracts.js';
import type { AgentPresetOption } from './protocol.js';
import type { MenuSelectOption } from './menu-select.js';
/** 宿主 settings.agentPreset 命名空间的翻译函数；比插件自身词条覆盖更多语言。 */
export type PresetTranslate = (key: string, params?: Record<string, unknown>) => string;
/** 下拉与卡片共用的预设名称。 */
export declare function agentPresetLabel(preset: {
    readonly id: string;
    readonly name?: string;
}, t: Translate, presetT?: PresetTranslate): string;
/** 下拉项的说明文案；内置预设缺省时回退到官方描述。 */
export declare function agentPresetDescription(preset: {
    readonly id: string;
    readonly description?: string;
}, t: Translate, presetT?: PresetTranslate): string | undefined;
/** 构造预设下拉项；损坏预设保留但禁用，当前值不在名册时也保留可见。 */
export declare function buildAgentPresetOptions(presets: readonly AgentPresetOption[], current: string, t: Translate, presetT?: PresetTranslate): MenuSelectOption[];
