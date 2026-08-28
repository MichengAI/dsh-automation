import type { ModelTranslate, SessionSelector, Translate, WorkspaceSelector } from './contracts.js';
import type { PermissionTranslate } from './permissions.js';
import type { AutomationRuntime } from './runtime.js';
export { nativeSessionMenuStyle, nextOpenSessionMenu, nextOpenSessionMenuId, pointerPoint, relativeTime, resolveEventElement, shouldCloseNativeSessionMenu, } from './native-session-menu.js';
export declare function NativeScheduleSessionList(props: {
    readonly t: Translate;
    readonly permissionT?: PermissionTranslate;
    readonly modelT?: ModelTranslate;
    readonly runtime: AutomationRuntime;
    readonly openSession?: (sessionId: string) => void;
    readonly useSessions?: SessionSelector;
    readonly useWorkspaces?: WorkspaceSelector;
    readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>;
    readonly archiveSession?: (sessionId: string) => void | Promise<void>;
    readonly deleteSession?: (sessionId: string) => void | Promise<void>;
    readonly forkSession?: (sessionId: string) => void | Promise<void>;
}): JSX.Element;
