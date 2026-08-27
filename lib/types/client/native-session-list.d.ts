import type { SessionSelector, Translate, WorkspaceSelector } from './contracts.js';
import type { AutomationRuntime } from './runtime.js';
import type { AutomationTaskSettingsRequest } from './task-settings-request.js';
export { nativeSessionMenuStyle, nextOpenSessionMenu, nextOpenSessionMenuId, pointerPoint, relativeTime, resolveEventElement, shouldCloseNativeSessionMenu, } from './native-session-menu.js';
export declare function NativeScheduleSessionList(props: {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly openSession?: (sessionId: string) => void;
    readonly useSessions?: SessionSelector;
    readonly useWorkspaces?: WorkspaceSelector;
    readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>;
    readonly archiveSession?: (sessionId: string) => void | Promise<void>;
    readonly deleteSession?: (sessionId: string) => void | Promise<void>;
    readonly forkSession?: (sessionId: string) => void | Promise<void>;
    readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void;
}): JSX.Element;
