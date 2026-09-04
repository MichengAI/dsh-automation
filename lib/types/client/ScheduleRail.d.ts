import { type ComponentType, type ReactNode } from 'react';
import type { SessionSelector, Translate, WorkspaceSelector } from './contracts.js';
import type { AutomationRuntime } from './runtime.js';
import { type ScheduleView } from './schedule-overview.js';
import type { NativeTabRegistry } from './native-tabs.js';
import type { AutomationTaskSettingsRequest } from './task-settings-request.js';
export declare function ScheduleRail({ t, runtime, openSession, openTaskSettings, view: controlledView, showViewSwitch, }: {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly openSession?: (sessionId: string) => void;
    readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void;
    readonly view?: ScheduleView;
    readonly showViewSwitch?: boolean;
}): JSX.Element;
export declare function NativeScheduleShell({ t, runtime, officialTree, hostProps, openSession, openTaskSettings, useSessions, useWorkspaces, renderSlot, hasChannels, subscribeChannels, tabRegistry, wide, }: {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly officialTree?: ComponentType<any>;
    readonly hostProps?: Record<string, unknown>;
    readonly openSession?: (sessionId: string) => void;
    readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void;
    readonly useSessions?: SessionSelector;
    readonly useWorkspaces?: WorkspaceSelector;
    readonly renderSlot?: (name: string, props?: Record<string, unknown>) => ReactNode;
    readonly hasChannels?: () => boolean;
    readonly subscribeChannels?: (listener: () => void) => () => void;
    readonly tabRegistry?: NativeTabRegistry;
    readonly wide?: boolean;
}): JSX.Element | null;
