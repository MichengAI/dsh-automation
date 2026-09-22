import type { Translate } from './contracts.js';
import type { ArchivedSessionFilter, WorkspaceGroupMode, WorkspaceListSort } from './schedule-rail-model.js';
import { officialSearchIconSize } from './workspace-toolbar-metrics.js';
export { officialSearchIconSize };
export declare function WorkspaceToolbar({ t, query, sort, groupMode, archivedFilter, onQueryChange, onSortChange, onGroupModeChange, onArchivedFilterChange, }: {
    readonly t: Translate;
    readonly query: string;
    readonly sort: WorkspaceListSort;
    readonly groupMode: WorkspaceGroupMode;
    readonly archivedFilter?: ArchivedSessionFilter;
    readonly onQueryChange: (query: string) => void;
    readonly onSortChange: (sort: WorkspaceListSort) => void;
    readonly onGroupModeChange: (mode: WorkspaceGroupMode) => void;
    readonly onArchivedFilterChange?: (filter: ArchivedSessionFilter) => void;
}): JSX.Element;
