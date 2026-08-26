type SettingsButton = {
    readonly textContent: string | null;
    readonly getAttribute: (name: string) => string | null;
    click(): void;
};
export declare function pickSettingsSectionButton<T extends Pick<SettingsButton, 'textContent'>>(buttons: readonly T[], labels: readonly string[]): T | undefined;
export declare function pickSettingsLauncher<T extends Pick<SettingsButton, 'textContent' | 'getAttribute'>>(buttons: readonly T[]): T | undefined;
/** 打开宿主设置弹窗并选择定时任务分区；宿主提供公开 section API 后可集中替换。 */
export declare function openSettingsSection(labels: readonly string[], onSelected?: () => void, onMissing?: () => void): void;
export {};
