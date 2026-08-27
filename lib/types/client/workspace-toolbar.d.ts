import type { Translate } from './contracts.js';
/** 官方 WorkspaceBrowser：折叠 14px，展开 11px。 */
export declare function officialSearchIconSize(expanded: boolean): 11 | 14;
export declare function WorkspaceToolbar({ t, query, onQueryChange, onCreateTask, }: {
    readonly t: Translate;
    readonly query: string;
    readonly onQueryChange: (query: string) => void;
    readonly onCreateTask?: () => void;
}): JSX.Element;
