export type PluginUpdateUiOptions = {
    readonly endpoint: string;
    readonly packageName: string;
    readonly titleRowSelector: string;
    readonly linksSelector: string;
    readonly zhName: string;
    readonly enName: string;
    readonly createIcon: (name: PluginUpdateIconName) => HTMLElement;
};
export type PluginUpdateIconName = 'refresh' | 'download' | 'copy' | 'close';
export declare function manualPluginUpdateCommand(profileName: string, packageName: string, version: string): string;
interface PluginUpdateEscapeEvent {
    readonly key: string;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}
export declare function handlePluginUpdateEscape(event: PluginUpdateEscapeEvent, close: () => void): boolean;
export declare function observePluginUpdate(options: PluginUpdateUiOptions): () => void;
export {};
