import type { Translate } from './contracts.js';
import type { AutomationViewModel } from './protocol.js';
import { type ScheduleRunLike } from './schedule-rail-model.js';
export type ScheduleView = 'runs' | 'overview';
export declare function ScheduleViewSwitch({ t, view, onChange, }: {
    readonly t: Translate;
    readonly view: ScheduleView;
    readonly onChange: (view: ScheduleView) => void;
}): JSX.Element;
/** 侧栏任务总览：任务状态可直接切换，有上次会话的任务可点开执行记录。 */
export declare function ScheduleOverview({ t, automations, runs, openSession, serverNow, archived, presentIds, onToggleAutomation, }: {
    readonly t: Translate;
    readonly automations: readonly AutomationViewModel[];
    readonly runs: readonly ScheduleRunLike[];
    readonly openSession?: (sessionId: string) => void;
    readonly serverNow?: string;
    readonly archived?: ReadonlySet<string>;
    readonly presentIds?: ReadonlySet<string>;
    readonly onToggleAutomation?: (automationId: string, mutation: 'pause' | 'resume') => void | Promise<void>;
}): JSX.Element;
