import type { CSSProperties } from 'react';
export type HostIcon = (props: {
    readonly size?: number;
    readonly className?: string;
    readonly style?: CSSProperties;
}) => JSX.Element | null;
export declare function pickHostIcon(source: Readonly<Record<string, unknown>>, ...names: readonly string[]): HostIcon;
