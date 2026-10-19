import type { CSSProperties } from 'react';
export type HostIcon = (props: {
    readonly size?: number;
    readonly className?: string;
    readonly style?: CSSProperties;
}) => JSX.Element | null;
/** 没有对应导出时返回 undefined，调用方再退回自绘。 */
export declare function pickHostExport(source: Readonly<Record<string, unknown>>, name: string): unknown;
export declare function pickHostIcon(source: Readonly<Record<string, unknown>>, ...names: readonly string[]): HostIcon;
