import type { Translate } from './contracts.js';
import type { WorkspaceGroupMode, WorkspaceListSort } from './schedule-rail-model.js';
/** 官方 WorkspaceBrowser：折叠 14px，展开 11px。 */
export declare function officialSearchIconSize(expanded: boolean): 11 | 14;
export declare function WorkspaceToolbar({ t, query, sort, groupMode, onQueryChange, onSortChange, onGroupModeChange, }: {
    readonly t: Translate;
    readonly query: string;
    readonly sort: WorkspaceListSort;
    readonly groupMode: WorkspaceGroupMode;
    readonly onQueryChange: (query: string) => void;
    readonly onSortChange: (sort: WorkspaceListSort) => void;
    readonly onGroupModeChange: (mode: WorkspaceGroupMode) => void;
}): JSX.Element;
