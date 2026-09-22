import { type ReactNode } from 'react';
import type { SessionSelector, Translate, WorkspaceSelector } from './contracts.js';
import type { AutomationRuntime } from './runtime.js';
import type { AutomationTaskSettingsRequest } from './task-settings-request.js';
interface SessionStatusLike {
    readonly running?: boolean;
    readonly completionUnread?: boolean;
    readonly pendingInteraction?: {
        readonly kind?: string;
    };
}
export declare function NativeScheduleSessionList(props: {
    readonly t: Translate;
    readonly runtime: AutomationRuntime;
    readonly openSession?: (sessionId: string) => void;
    readonly useSessions?: SessionSelector;
    readonly useWorkspaces?: WorkspaceSelector;
    readonly renameSession?: (sessionId: string, title: string) => void | Promise<void>;
    readonly archiveSession?: (sessionId: string) => void | Promise<void>;
    readonly unarchiveSession?: (sessionId: string) => void | Promise<void>;
    readonly deleteSession?: (sessionId: string) => void | Promise<void>;
    readonly forkSession?: (sessionId: string) => void | Promise<void>;
    readonly pinSession?: (sessionId: string) => void | Promise<void>;
    readonly unpinSession?: (sessionId: string) => void | Promise<void>;
    readonly notifyArchivedNotOpenable?: () => void;
    readonly openTaskSettings?: (request: AutomationTaskSettingsRequest) => void;
    readonly renderSlot?: (name: string, props?: Record<string, unknown>, opts?: {
        readonly hookContext?: unknown;
        readonly only?: string;
    }) => ReactNode;
    readonly useSessionStatus?: <T>(selector: (state: ReadonlyMap<string, SessionStatusLike>) => T) => T;
}): JSX.Element;
export {};
