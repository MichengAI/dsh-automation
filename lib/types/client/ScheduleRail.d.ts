import { type ComponentType, type ReactNode } from 'react';
import type { Translate } from './contracts.js';
import type { AutomationRuntime } from './runtime.js';
import { type NativeSessionLike, type NativeWorkspaceLike } from './schedule-rail-model.js';
import type { NativeTabRegistry } from './native-tabs.js';
type SessionSelector = <S>(select: (state: {
    ids?: string[];
    byId?: Record<string, NativeSessionLike>;
    current?: string | null;
}) => S) => S;
type WorkspaceSelector = <S>(select: (state: {
    items?: NativeWorkspaceLike[];
    archivedSessionIds?: string[];
}) => S) => S;
export declare function ScheduleRail({ t, runtime, openSession, }: {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly openSession?: (sessionId: string) => void;
}): JSX.Element;
export declare function NativeScheduleShell({ t, runtime, officialTree, hostProps, openSession, useSessions, useWorkspaces, renderSlot, hasChannels, subscribeChannels, tabRegistry, wide, }: {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly officialTree?: ComponentType<any>;
    readonly hostProps?: Record<string, unknown>;
    readonly openSession?: (sessionId: string) => void;
    readonly useSessions?: SessionSelector;
    readonly useWorkspaces?: WorkspaceSelector;
    readonly renderSlot?: (name: string, props?: Record<string, unknown>) => ReactNode;
    readonly hasChannels?: () => boolean;
    readonly subscribeChannels?: (listener: () => void) => () => void;
    readonly tabRegistry?: NativeTabRegistry;
    readonly wide?: boolean;
}): JSX.Element | null;
export {};
