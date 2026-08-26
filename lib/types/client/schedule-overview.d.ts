import type { Translate } from './contracts.js';
import type { AutomationViewModel } from './protocol.js';
import { type ScheduleRunLike } from './schedule-rail-model.js';
export type ScheduleView = 'runs' | 'overview';
export declare function ScheduleViewSwitch({ t, view, onChange, }: {
    readonly t: Translate;
    readonly view: ScheduleView;
    readonly onChange: (view: ScheduleView) => void;
}): JSX.Element;
/** 侧栏任务总览：只读列表，有上次会话的任务可点开，其余仅展示。 */
export declare function ScheduleOverview({ t, automations, runs, openSession, serverNow, archived, presentIds, }: {
    readonly t: Translate;
    readonly automations: readonly AutomationViewModel[];
    readonly runs: readonly ScheduleRunLike[];
    readonly openSession?: (sessionId: string) => void;
    readonly serverNow?: string;
    readonly archived?: ReadonlySet<string>;
    readonly presentIds?: ReadonlySet<string>;
}): JSX.Element;
