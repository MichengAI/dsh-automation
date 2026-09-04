import type { Translate } from './contracts.js';
import type { AutomationViewModel } from './protocol.js';
import type { AutomationTaskSettingsRequest } from './task-settings-request.js';
export type ScheduleView = 'runs' | 'overview';
export declare function ScheduleViewSwitch({ t, view, onChange, }: {
    readonly t: Translate;
    readonly view: ScheduleView;
    readonly onChange: (view: ScheduleView) => void;
}): JSX.Element;
/** 侧栏任务总览：点击卡片打开任务设置，右上角开关直接切换任务状态。 */
export declare function ScheduleOverview({ t, automations, serverNow, openTaskSettings, onToggleAutomation, }: {
    readonly t: Translate;
    readonly automations: readonly AutomationViewModel[];
    readonly serverNow?: string;
    readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void;
    readonly onToggleAutomation?: (automationId: string, mutation: 'pause' | 'resume') => void | Promise<void>;
}): JSX.Element;
