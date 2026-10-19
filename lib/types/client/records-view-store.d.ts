/** 记录视图独立的视图状态；分组/排序/筛选不再借用官方任务树的 store。 */
export type RecordsGroupBy = 'task' | 'workspace' | 'workspace-tree' | 'flat';
export type RecordsOrderBy = 'manual' | 'updated';
export type RecordsArchivedFilter = 'default' | 'show' | 'only';
export interface RecordsViewState {
    readonly groupBy: RecordsGroupBy;
    readonly orderBy: RecordsOrderBy;
    readonly groupExpansion: Readonly<Record<string, boolean>>;
    readonly sessionOrderByAccount: Readonly<Record<string, readonly string[]>>;
    readonly archivedFilter: RecordsArchivedFilter;
}
export interface RecordsViewActions {
    setGroupBy(mode: RecordsGroupBy): void;
    setOrderBy(mode: RecordsOrderBy, initialOrders: Readonly<Record<string, readonly string[]>>): void;
    setGroupExpanded(key: string, expanded: boolean): void;
    retainAccountKeys(workspaceKeys: readonly string[]): void;
    setSessionOrder(accountKey: string, order: readonly string[], initialOrders: Readonly<Record<string, readonly string[]>>): void;
    syncSessionOrders(orders: Readonly<Record<string, readonly string[]>>): void;
    pinSessionOrder(sessionId: string, accountKeys: readonly string[], source: {
        readonly members: Readonly<Record<string, readonly string[]>>;
    }): void;
    setArchivedFilter(filter: RecordsArchivedFilter): void;
    ensureExpanded(keys: readonly string[]): void;
}
export interface RecordsViewStore {
    getSnapshot(): RecordsViewState;
    subscribe(listener: () => void): () => void;
    actions: RecordsViewActions;
}
export declare function createRecordsViewStore(): RecordsViewStore;
/** 记录视图在页签切换后仍保留分组/排序选择。 */
export declare function getRecordsViewStore(): RecordsViewStore;
