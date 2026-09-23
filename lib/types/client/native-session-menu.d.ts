import type { CSSProperties, ReactNode } from 'react';
import type { Translate } from './contracts.js';
type SlotRenderer = (name: string, props?: Record<string, unknown>, opts?: {
    readonly hookContext?: unknown;
    readonly only?: string;
}) => ReactNode;
/** 旧宿主的 renderSlot 在条目未声明该子插槽时抛 SlotOwnershipError。接住它，避免定时页整页失败。 */
export declare function renderOwnedSlot(renderSlot: SlotRenderer | undefined, name: string, props?: Record<string, unknown>, opts?: {
    readonly hookContext?: unknown;
    readonly only?: string;
}): ReactNode;
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
/** 0.1.7 会话标题在悬停时匀速滚到末尾，并交给样式做两端淡出。 */
export declare function placeSessionTitle(title: HTMLElement, left: number, range: number): void;
export declare function restSessionTitle(title: HTMLElement): void;
export declare function startSessionTitleMarquee(title: HTMLElement | null, frame: {
    id: number;
}): void;
export declare function stopSessionTitleMarquee(title: HTMLElement | null, frame: {
    id: number;
}): void;
/** 行内时间不带「前」，和官方 timeLabel 一样。 */
export declare function sessionRowTime(value: string, t: Translate, now?: number): string;
/** 悬停卡用官方 hoverTimeLabel：刚刚保持原样，其余套「前」。 */
export declare function sessionHoverTime(value: string, t: Translate, now?: number): string;
export declare function relativeTime(value: string, t: Translate, now?: number): string;
export {};
