import type { AutomationSchedule } from './types.ts';
export declare function assertValidSchedule(schedule: AutomationSchedule): void;
export declare function normalizeSchedule(schedule: AutomationSchedule): AutomationSchedule;
/** 按计划字段比较语义，避免对象字段顺序影响变更判断。 */
export declare function isEqualSchedule(left: AutomationSchedule, right: AutomationSchedule): boolean;
export declare function scheduleToRRule(schedule: AutomationSchedule): string;
export declare function nextOccurrence(schedule: AutomationSchedule, afterExclusive: string): string | null;
export declare function latestDueOccurrence(schedule: AutomationSchedule, now: string): string | null;
export declare function occurrencesBetween(schedule: AutomationSchedule, afterExclusive: string, untilInclusive: string, limit?: number): string[];
