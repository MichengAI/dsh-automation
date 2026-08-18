import type { CSSProperties } from 'react';
/** 把点击目标收成元素节点，避免标题文本节点没有 closest 导致关闭逻辑中断。 */
export declare function resolveEventElement(target: unknown): object | null;
/** 点击不在当前行或当前菜单内时，应关闭已打开的菜单。 */
export declare function shouldCloseNativeSessionMenu(target: unknown, keepInside: readonly unknown[]): boolean;
/** 侧栏同一时间只保留一条会话菜单。再点同一条则关闭。 */
export declare function nextOpenSessionMenuId(current: string | null, clicked: string): string | null;
/** 用视口坐标固定菜单，避免被侧栏 overflow 裁切后叠到下一条会话上。 */
export declare function nativeSessionMenuStyle(box: {
    readonly bottom: number;
    readonly right: number;
}, viewportWidth: number): CSSProperties;
export declare function relativeTime(value: string): string;
