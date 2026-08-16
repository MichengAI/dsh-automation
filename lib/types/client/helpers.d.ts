import type { Translate } from './contracts.js';
import type { AutomationSchedule, AutomationSnapshot, CreateAutomationInput, ModelOption, WorkspaceOption } from './protocol.js';
export type ScheduleKind = 'once' | 'interval' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
export interface AutomationFormState {
    readonly name: string;
    readonly prompt: string;
    readonly scheduleKind: ScheduleKind;
    readonly onceAt: string;
    readonly everyMinutes: string;
    readonly time: string;
    readonly weekdays: readonly number[];
    readonly hourlyMinute: string;
    readonly monthDay: string;
    readonly customDays: string;
    readonly timeZone: string;
    readonly permission: CreateAutomationInput['permission'];
    readonly workspaceId: string;
    readonly modelKey: string;
    readonly reasoningEffort: string;
    readonly skills: readonly string[];
}
export type FormErrorKey = 'form.error.name' | 'form.error.prompt' | 'form.error.once' | 'form.error.interval' | 'form.error.weekdays' | 'form.error.workspace';
export declare class AutomationFormError extends Error {
    readonly key: FormErrorKey;
    constructor(key: FormErrorKey);
}
/** Chat 点选技能后写入输入框的 `/name` 文本。优先用合法技能名，否则回退到目录 id。 */
export declare function skillGestureToken(skill: {
    readonly id: string;
    readonly name: string;
}): string;
/** 在光标处插入技能手势；已存在相同 token 时不重复插入。 */
export declare function insertSkillGesture(prompt: string, token: string, caret: number): {
    readonly text: string;
    readonly caret: number;
};
export declare function localDateTimeValue(date?: Date): string;
export declare function defaultFormState(now?: Date, workspaces?: readonly WorkspaceOption[], defaultModel?: ModelOption | null): AutomationFormState;
export declare function buildCreateInput(form: AutomationFormState, workspaces: readonly WorkspaceOption[], models: readonly ModelOption[], now?: Date, options?: {
    readonly allowPastOnce?: boolean;
}): CreateAutomationInput;
export interface OverviewStats {
    readonly total: number;
    readonly active: number;
    readonly attention: number;
    readonly nextRunAt?: string;
}
export declare function deriveOverview(snapshot: AutomationSnapshot): OverviewStats;
export declare function formatRelativeTime(iso: string, now: Date, t: Translate): string;
export declare function shortSessionId(sessionId: string): string;
export declare function formatSchedule(schedule: AutomationSchedule, t: Translate): string;
export declare function workspaceLabel(item: {
    readonly workspaceId?: string;
    readonly cwd?: string;
}, workspaces: readonly WorkspaceOption[]): string;
export declare function formatWithin(iso: string, now: Date, t: Translate): string;
export declare function formatDuration(startedAt?: string, finishedAt?: string): string | undefined;
export declare function clockTime(iso: string): string;
export type HistoryRange = 'day' | 'week' | 'month';
export interface HistoryGroup {
    readonly key: string;
    readonly label: string;
    readonly items: readonly import('./protocol.js').AutomationRunViewModel[];
}
export declare function groupHistory(runs: readonly import('./protocol.js').AutomationRunViewModel[], range: HistoryRange, now: Date, t: Translate): HistoryGroup[];
export declare function formFromAutomation(item: import('./protocol.js').AutomationViewModel, workspaces?: readonly WorkspaceOption[], defaultModel?: ModelOption | null): AutomationFormState;
export declare function prettyModelName(model: string): string;
