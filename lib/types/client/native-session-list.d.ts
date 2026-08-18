import type { Translate } from './contracts.js';
import type { AutomationRuntime } from './runtime.js';
export { nativeSessionMenuStyle, nextOpenSessionMenu, nextOpenSessionMenuId, pointerPoint, relativeTime, resolveEventElement, shouldCloseNativeSessionMenu, } from './native-session-menu.js';
export declare function NativeScheduleSessionList(props: {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly openSession?: (sessionId: string) => void;
    readonly useSessions?: (select: (state: any) => any) => any;
    readonly useWorkspaces?: (select: (state: any) => any) => any;
    readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>;
    readonly archiveSession?: (sessionId: string) => void | Promise<void>;
    readonly deleteSession?: (sessionId: string) => void | Promise<void>;
    readonly forkSession?: (sessionId: string) => void | Promise<void>;
}): JSX.Element;
