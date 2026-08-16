/** 原生侧栏页签协作协议。两套插件各自复制这份约定，不互相 import。 */
export declare const NATIVE_TABS_KEY = "__dshNativeTabs";
export interface NativeSidebarTab {
    readonly id: string;
    readonly label: string;
    readonly order?: number;
    matchSession?(sessionId: string): boolean;
    render(props: Record<string, unknown>): unknown;
}
export interface NativeTabRegistry {
    readonly version: 1;
    officialTree: unknown;
    readonly sessionFilters: Array<(id: string) => boolean>;
    getTabs(): NativeSidebarTab[];
    subscribe(listener: () => void): () => void;
    insert(tab: NativeSidebarTab): () => void;
    addSessionFilter(filter: (id: string) => boolean): () => void;
}
export declare function createNativeTabRegistry(officialTree: unknown): NativeTabRegistry;
export declare function getNativeTabRegistry(target: unknown): NativeTabRegistry | undefined;
export declare function attachNativeTabRegistry<T>(target: T, registry: NativeTabRegistry): NativeTabRegistry;
export declare function findNativeTabRegistry(entry: unknown): NativeTabRegistry | undefined;
export declare function isForeignSidebarHost(component: unknown): boolean;
