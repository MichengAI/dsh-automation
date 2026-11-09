import { type ReactElement } from 'react';
import type { ClientContext } from './contracts.js';
import type { EntryLocation } from '../settings-manager.js';
export declare const BUNDLE_KEY = "@michengai/dsh-automation";
export declare const SIDEBAR_PANEL_ID = "dsh-automation";
export declare const SIDEBAR_PANEL_ORDER = 4;
export declare const HIDE_OFFICIAL_SCHEDULE_STYLE_TAG = "dsh-automation-hide-official-schedule";
export declare const STORAGE_KEY_HIDE_OFFICIAL = "dsh-automation.hide-official-schedule";
export declare const STORAGE_KEY_SIDEBAR_ENTRY = "dsh-automation.sidebar-entry";
export declare const STORAGE_KEY_ENTRY_LOCATION = "dsh-automation.entry-location";
export declare const STORAGE_KEY_TASK_TREE_SESSIONS = "dsh-automation.task-tree-sessions";
export declare function readCachedEntryLocation(): EntryLocation;
export declare function readCachedSidebarEntry(): boolean;
export declare function readCachedHideOfficial(): boolean;
export declare function readCachedTaskTreeSessions(): boolean;
export declare function applyHideOfficialScheduleStyle(hidden: boolean): void;
export declare function AutomationSidebarIcon(props: {
    readonly size?: number;
}): ReactElement;
export interface BundleConfigCardProps {
    readonly t: (key: string) => string;
    readonly location?: EntryLocation;
    readonly onLocationChange?: (location: EntryLocation) => void;
    readonly enabled?: boolean;
    readonly disabled?: boolean;
    readonly onToggle?: (next: boolean) => void;
    readonly hideOfficialScheduleEnabled?: boolean;
    readonly hideOfficialScheduleDisabled?: boolean;
    readonly onToggleHideOfficialSchedule?: (next: boolean) => void;
    readonly taskTreeSessionsEnabled?: boolean;
    readonly taskTreeSessionsDisabled?: boolean;
    readonly onToggleTaskTreeSessions?: (next: boolean) => void;
}
export declare function AutomationBundleConfigCard(props: BundleConfigCardProps): ReactElement;
export interface BundleConfigWrapperProps {
    readonly t: (key: string) => string;
    readonly getLocation: () => EntryLocation;
    readonly setLocation: (next: EntryLocation) => Promise<EntryLocation>;
    readonly getEnabled?: () => boolean;
    readonly setSidebar?: (next: boolean) => Promise<boolean>;
    readonly getHideOfficialScheduleEnabled?: () => boolean;
    readonly setHideOfficialSchedule?: (next: boolean) => Promise<boolean>;
    readonly getTaskTreeSessionsEnabled?: () => boolean;
    readonly setTaskTreeSessions?: (next: boolean) => Promise<boolean>;
    readonly subscribe: (listener: () => void) => () => void;
}
export declare function AutomationBundleConfigCardWrapper(props: BundleConfigWrapperProps): ReactElement;
export interface SetupSidebarEntryOptions {
    readonly callApi: (path: string, options?: RequestInit) => Promise<any>;
    readonly renderPanel: (ownerProps: any) => ReactElement;
    readonly ns: string;
    readonly injectProps?: Record<string, unknown> | (() => Record<string, unknown>);
    readonly onTaskTreeSessionsChange?: (enabled: boolean) => void;
    readonly onLocationChange?: (location: EntryLocation) => void;
}
export interface SidebarController {
    getLocation(): EntryLocation;
    setLocation(next: EntryLocation): Promise<EntryLocation>;
    isSettingsSectionEnabled(): boolean;
    isEnabled(): boolean;
    isSupported(): boolean;
    setEnabled(next: boolean): Promise<boolean>;
    isHideOfficialScheduleEnabled(): boolean;
    setHideOfficialSchedule(next: boolean): Promise<boolean>;
    isTaskTreeSessionsEnabled(): boolean;
    setTaskTreeSessions(next: boolean): Promise<boolean>;
    destroy(): void;
}
export declare function setupSidebarEntry(ctx: ClientContext, options: SetupSidebarEntryOptions): SidebarController;
