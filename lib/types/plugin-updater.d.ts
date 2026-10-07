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
type DesktopPnpmHandle = {
    done: Promise<{
        exitCode: number | null;
        signal: NodeJS.Signals | null;
    }>;
    cancel(): void;
};
type DesktopPnpm = {
    runPlugin(args: readonly string[], invokingDir: string, signal?: AbortSignal): DesktopPnpmHandle;
};
type PackageManagerLaunch = {
    command: string;
    args: readonly string[];
    env?: NodeJS.ProcessEnv;
};
type PluginManagerInstall = {
    installBundle(spec: string): Promise<{
        application?: string;
        error?: {
            message?: string;
        };
        packageResult?: {
            output?: string;
        };
    }>;
};
export type PluginUpdaterOptions = {
    readonly endpoint: string;
    readonly packageName: string;
    readonly manifestUrl: URL;
};
type Runtime = {
    profileName: string;
    profileDir: string;
    desktopPnpm?: DesktopPnpm;
    cliEntry?: string;
    packageManager?: PackageManagerLaunch;
    pluginManager?: PluginManagerInstall;
    officialDesktop: boolean;
    canAutoUpdate: boolean;
};
export declare function isTrustedUpdateRequest(request: HostRequest): boolean;
export declare function isDshCliEntry(entry: string, manifest: unknown, packageRoot: string): boolean;
export declare function resolveUpdateRuntime(ctx: {
    get?: (name: string) => unknown;
}, options?: {
    argv?: readonly string[];
    env?: NodeJS.ProcessEnv;
    cwd?: string;
    homeDir?: string;
    exists?: (path: string) => boolean;
    execPath?: string;
}): Runtime;
export declare function shouldNotifyParent(target: Runtime, send?: NodeJS.Process['send']): boolean;
export declare function isNewerVersion(currentValue: string, candidateValue: string): boolean;
export declare function registerPluginUpdater(ctx: Context, options: PluginUpdaterOptions): () => void;
export {};
