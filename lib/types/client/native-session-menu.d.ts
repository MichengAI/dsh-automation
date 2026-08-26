import type { CSSProperties } from 'react';
import type { Translate } from './contracts.js';
/** 把点击目标收成元素节点，避免标题文本节点没有 closest 导致关闭逻辑中断。 */
export declare function resolveEventElement(target: unknown): object | null;
/** 点击不在当前行或当前菜单内时，应关闭已打开的菜单。 */
export declare function shouldCloseNativeSessionMenu(target: unknown, keepInside: readonly unknown[]): boolean;
/** 侧栏同一时间只保留一条会话菜单。再点同一条则关闭。 */
export declare function nextOpenSessionMenuId(current: string | null, clicked: string): string | null;
export type NativeSessionMenuState = {
    readonly id: string;
    readonly x: number;
    readonly y: number;
} | null;
export declare function pointerPoint(event: {
    readonly clientX?: unknown;
    readonly clientY?: unknown;
} | null | undefined): {
    x: number;
    y: number;
};
export declare function clampMenuPoint(x: number, y: number, width: number, height: number, viewport: {
    readonly width: number;
    readonly height: number;
}): {
    x: number;
    y: number;
};
export declare function nextOpenSessionMenu(current: NativeSessionMenuState, clicked: string, point: {
    readonly x: number;
    readonly y: number;
}): NativeSessionMenuState;
/** 和 IM 一样：菜单出现在指针处，再用真实尺寸限制在视口内。 */
export declare function nativeSessionMenuStyle(point: {
    readonly x: number;
    readonly y: number;
}, size?: {
    readonly width: number;
    readonly height: number;
}, viewport?: {
    readonly width: number;
    readonly height: number;
}): CSSProperties;
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
export declare function relativeTime(value: string, t: Translate, now?: number): string;
