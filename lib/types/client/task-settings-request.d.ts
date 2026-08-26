import type { AutomationRunViewModel, AutomationViewModel } from './protocol.js';
export declare const AUTOMATION_TASK_SETTINGS_EVENT = "dsh-automation:open-task-settings";
export declare const AUTOMATION_TASK_SETTINGS_STORAGE_KEY = "dsh-automation:pending-task-settings";
export type AutomationTaskSettingsRequest = {
    automationId?: string;
    name: string;
    sessionIds: string[];
};
export declare function parseAutomationTaskSettingsRequest(value: unknown): AutomationTaskSettingsRequest | undefined;
export declare function writeAutomationTaskSettingsRequest(storage: Storage | undefined, request: AutomationTaskSettingsRequest): void;
export declare function requestAutomationTaskSettings(request: AutomationTaskSettingsRequest): void;
export declare function readAutomationTaskSettingsRequest(storage: Storage | undefined): AutomationTaskSettingsRequest | undefined;
export declare function clearAutomationTaskSettingsRequest(storage: Storage | undefined): void;
export declare function resolveAutomationTaskSettings(request: AutomationTaskSettingsRequest, automations: readonly AutomationViewModel[], runs: readonly AutomationRunViewModel[]): AutomationViewModel | undefined;
