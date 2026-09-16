type SettingsButton = {
    readonly textContent: string | null;
    readonly getAttribute: (name: string) => string | null;
    click(): void;
};
export declare function pickSettingsSectionButton<T extends Pick<SettingsButton, 'textContent'>>(buttons: readonly T[], labels: readonly string[]): T | undefined;
export declare function pickSettingsLauncher<T extends Pick<SettingsButton, 'textContent' | 'getAttribute'>>(buttons: readonly T[]): T | undefined;
export declare const SETTINGS_CODEX_TRIGGER_SELECTOR = "[data-dcu-settings-trigger]";
export declare const SETTINGS_CODEX_PAGE_SELECTOR = "[data-dcu-settings-page]";
export declare const SETTINGS_OPEN_SECTION_EVENT = "dcu-settings-open-section";
/** 打开 Codex 设置页或官方设置弹窗，并选择定时任务分区。 */
export declare function openSettingsSection(labels: readonly string[], onSelected?: () => void, onMissing?: () => void): void;
export {};
