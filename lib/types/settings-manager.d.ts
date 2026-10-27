import type { Context } from '@deepseek-ai/cordis';
export declare const SETTINGS_API_HEADER = "x-michengai-client";
export interface PersistedSettings {
    sidebarEntry?: boolean | undefined;
    onlineUpdate?: boolean | undefined;
    hideOfficialSchedule?: boolean | undefined;
    taskTreeSessions?: boolean | undefined;
}
export declare class SettingsManager {
    private readonly file;
    private readonly hostUpdateDisabled;
    private store;
    constructor(options: {
        ctx: Context;
        stateDir?: string;
        hostUpdateDisabled?: boolean;
    });
    private load;
    private flush;
    getSidebarEntry(): boolean;
    setSidebarEntry(enabled: boolean): Promise<boolean>;
    getHideOfficialSchedule(): boolean;
    setHideOfficialSchedule(enabled: boolean): Promise<boolean>;
    getTaskTreeSessions(): boolean;
    setTaskTreeSessions(enabled: boolean): Promise<boolean>;
    isHostUpdateDisabled(): boolean;
    isUpdateEnabled(): boolean;
    setOnlineUpdate(enabled: boolean): Promise<boolean>;
}
export declare function registerSettingsApi(ctx: Context, manager: SettingsManager): () => void;
