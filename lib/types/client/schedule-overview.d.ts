import type { Translate } from './contracts.js';
import type { AutomationViewModel } from './protocol.js';
import type { AutomationTaskSettingsRequest } from './task-settings-request.js';
export type ScheduleView = 'runs' | 'overview';
/**
 * 视图切换页签与内容面板共用的面板 id。
 * 执行记录与任务总览同一时刻只渲染一个面板，所有页签的 `aria-controls` 都指向它，
 * 避免未挂载面板造成悬空引用；调用方渲染面板时必须带上 `id` 与 `role="tabpanel"`。
 */
export declare const SCHEDULE_VIEW_PANEL_ID = "dsh-st-rail-panel";
export declare function ScheduleViewSwitch({ t, view, onChange, }: {
    readonly t: Translate;
    readonly view: ScheduleView;
    readonly onChange: (view: ScheduleView) => void;
}): JSX.Element;
/** 侧栏任务总览：点击卡片打开任务设置，右上角开关直接切换任务状态。 */
export declare function ScheduleOverview({ t, automations, serverNow, openTaskSettings, openCreateTask, onToggleAutomation, }: {
    readonly t: Translate;
    readonly automations: readonly AutomationViewModel[];
    readonly serverNow?: string;
    readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void;
    readonly openCreateTask?: () => void;
    readonly onToggleAutomation?: (automationId: string, mutation: 'pause' | 'resume') => void | Promise<void>;
}): JSX.Element;
