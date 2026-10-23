import { type ReactElement } from 'react';
import type { ClientContext } from './contracts.js';
export declare const BUNDLE_KEY = "@michengai/dsh-automation";
export declare const SIDEBAR_PANEL_ID = "dsh-automation";
export declare const SIDEBAR_PANEL_ORDER = 4;
export declare const HIDE_OFFICIAL_SCHEDULE_STYLE_ID = "dsh-automation-hide-official-schedule";
export declare function applyHideOfficialScheduleStyle(hidden: boolean): void;
export declare function AutomationSidebarIcon(props: {
    readonly size?: number;
}): ReactElement;
export interface BundleConfigCardProps {
    readonly t: (key: string) => string;
    readonly enabled: boolean;
    readonly disabled?: boolean;
    readonly onToggle: (next: boolean) => void;
    readonly onlineUpdateEnabled?: boolean;
    readonly onlineUpdateDisabled?: boolean;
    readonly onlineUpdateLocked?: boolean;
    readonly onToggleOnlineUpdate?: (next: boolean) => void;
    readonly hideOfficialScheduleEnabled?: boolean;
    readonly hideOfficialScheduleDisabled?: boolean;
    readonly onToggleHideOfficialSchedule?: (next: boolean) => void;
}
export declare function AutomationBundleConfigCard(props: BundleConfigCardProps): ReactElement;
export interface BundleConfigWrapperProps {
    readonly t: (key: string) => string;
    readonly getEnabled: () => boolean;
    readonly setSidebar: (next: boolean) => Promise<boolean>;
    readonly getOnlineUpdateEnabled?: () => boolean;
    readonly getOnlineUpdateLocked?: () => boolean;
    readonly setOnlineUpdate?: (next: boolean) => Promise<boolean>;
    readonly getHideOfficialScheduleEnabled?: () => boolean;
    readonly setHideOfficialSchedule?: (next: boolean) => Promise<boolean>;
    readonly subscribe: (listener: () => void) => () => void;
}
export declare function AutomationBundleConfigCardWrapper(props: BundleConfigWrapperProps): ReactElement;
export interface SetupSidebarEntryOptions {
    readonly callApi: (path: string, options?: RequestInit) => Promise<any>;
    readonly renderPanel: (ownerProps: any) => ReactElement;
    readonly ns: string;
    readonly injectProps?: Record<string, unknown> | (() => Record<string, unknown>);
    readonly onOnlineUpdateChange?: (enabled: boolean) => void;
}
export interface SidebarController {
    isEnabled(): boolean;
    isSupported(): boolean;
    setEnabled(next: boolean): Promise<boolean>;
    isOnlineUpdateEnabled(): boolean;
    isOnlineUpdateLocked(): boolean;
    setOnlineUpdate(next: boolean): Promise<boolean>;
    isHideOfficialScheduleEnabled(): boolean;
    setHideOfficialSchedule(next: boolean): Promise<boolean>;
    destroy(): void;
}
export declare function setupSidebarEntry(ctx: ClientContext, options: SetupSidebarEntryOptions): SidebarController;
