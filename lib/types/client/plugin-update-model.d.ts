export declare function manualPluginUpdateCommand(profileName: string, packageName: string, version: string): string;
interface PluginUpdateEscapeEvent {
    readonly key: string;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}
export declare function handlePluginUpdateEscape(event: PluginUpdateEscapeEvent, close: () => void): boolean;
export {};
