import type { CSSProperties } from 'react';
import type { Translate } from './contracts.js';
export declare function nativeSessionHoverStyle(row: {
    readonly right: number;
    readonly top: number;
}, card: {
    readonly width: number;
    readonly height: number;
}, viewport: {
    readonly width: number;
    readonly height: number;
}): CSSProperties;
export interface SessionHoverStatus {
    readonly state: 'ongoing' | 'warning' | 'done' | 'idle' | 'archived';
    readonly label: string;
    readonly trailing?: string;
}
/** 对齐官方 SessionHoverContent：待处理优先，其次运行和子代理，完成只在未读时出现；已归档不再重复空闲或完成。 */
export declare function scheduledSessionHoverStatuses(input: {
    readonly running: boolean;
    readonly archived: boolean;
    readonly pendingKind?: string;
    readonly runningSubagentCount?: number;
    readonly completed?: boolean;
}, t: Translate): SessionHoverStatus[];
export interface ScheduledChildRow {
    readonly id: string;
    readonly title: string;
    readonly updatedAt: string;
}
/** 官方任务行把子代理挂在父会话下面，标题是「标签 | 会话名」。 */
export declare function scheduledSessionChildRows(catalog: readonly {
    readonly id?: string;
    readonly label?: string;
    readonly createdAt?: number;
}[] | undefined, summaries: Readonly<Record<string, {
    readonly title?: string;
    readonly displayTitle?: string;
    readonly updatedAt?: number | string;
} | undefined>>): ScheduledChildRow[];
/** 行内时间不带「前」，和官方 timeLabel 一样。 */
export declare function sessionRowTime(value: string, t: Translate, now?: number): string;
/** 悬停卡用官方 hoverTimeLabel：刚刚保持原样，其余套「前」。 */
export declare function sessionHoverTime(value: string, t: Translate, now?: number): string;
export declare function relativeTime(value: string, t: Translate, now?: number): string;
