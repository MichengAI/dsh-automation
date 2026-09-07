import type { Context } from '@deepseek-ai/cordis';
export declare const PLUGIN_UPDATE_HEADER = "x-michengai-plugin-update";
export declare const PLUGIN_UPDATE_IPC = "apply-plugin-updates";
type HostRequest = {
    method?: string;
    url?: string;
    headers?: Record<string, string | string[] | undefined>;
    socket?: {
        remoteAddress?: string;
    };
};
export type PluginUpdaterOptions = {
    readonly endpoint: string;
    readonly packageName: string;
    readonly manifestUrl: URL;
};
export declare function isTrustedUpdateRequest(request: HostRequest): boolean;
export declare function isDshCliEntry(entry: string, manifest: unknown, packageRoot: string): boolean;
export declare function isNewerVersion(currentValue: string, candidateValue: string): boolean;
export declare function registerPluginUpdater(ctx: Context, options: PluginUpdaterOptions): () => void;
export {};
