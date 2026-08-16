import type { ComponentType } from 'react';
import type { AutomationLocaleKey } from './locales.js';
import type { AutomationRuntime } from './runtime.js';
export type Translate = (key: AutomationLocaleKey, params?: Record<string, unknown>) => string;
export interface AutomationViewProps {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly closeSettings?: () => void;
}
export interface ClientRpc {
    call(channel: string, endpoint: string, payload: unknown, signal?: AbortSignal): Promise<unknown>;
}
export interface ClientContext {
    effect(factory: () => void | (() => void), label?: string): void;
    connection: {
        readonly rpc: ClientRpc;
    };
    locale: {
        register(namespace: string, dictionaries: {
            readonly zh: Record<string, string>;
            readonly en: Record<string, string>;
        }): () => void;
        bind(namespace: string): Translate;
    };
    slots: {
        inject(name: string, register: () => void | (() => void)): void;
        register(options: {
            readonly name: string;
            readonly id: string;
            readonly order: number;
            readonly locale: string;
            readonly label?: () => string;
        }, component: ComponentType<any>): () => void;
    };
}
