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
export declare function relativeTime(value: string, t: Translate, now?: number): string;
