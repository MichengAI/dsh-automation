import { handlePluginUpdateEscape, manualPluginUpdateCommand } from './plugin-update-model.js';
export { handlePluginUpdateEscape, manualPluginUpdateCommand };
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
export declare function observePluginUpdate(options: PluginUpdateUiOptions): () => void;
