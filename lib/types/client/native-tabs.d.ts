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
    readonly sessionOpeners: NativeSessionOpener[];
    getTabs(): NativeSidebarTab[];
    /** 页签、过滤器或会话打开器发生变化时递增，供外壳重新计算。 */
    getRevision(): number;
    subscribe(listener: () => void): () => void;
    insert(tab: NativeSidebarTab): () => void;
    addSessionFilter(filter: (id: string) => boolean): () => void;
    addSessionOpener(opener: NativeSessionOpener): () => void;
}
/** 按 order 选择第一个匹配的会话打开器；没有匹配时回退宿主打开。 */
export declare function openRegisteredSession(sessionId: string, registry?: NativeTabRegistry, hostOpen?: (id: string) => void): void;
export interface FilterableSessionState {
    readonly ids?: readonly string[];
    readonly byId?: Record<string, unknown>;
}
export interface NativeSessionOpener {
    readonly id: string;
    readonly order?: number;
    matchSession(sessionId: string): boolean;
    open(sessionId: string, hostOpen?: (id: string) => void): void;
}
/**
 * 统一应用注册表里的会话过滤器。
 * 没有过滤器时直接返回原 state，避免外壳为无人使用的过滤器付出重渲染成本。
 *
 * 缓存键是「注册表 + 快照 + revision」：换壳后的新注册表不会命中旧结果。
 * 旧版注册表没有 `getRevision` 时退化为每次重算（结果仍正确，只是不再复用）。
 */
export declare function applySessionFilters<T extends FilterableSessionState>(state: T, registry?: NativeTabRegistry): T;
export declare function createNativeTabRegistry(officialTree: unknown): NativeTabRegistry;
export declare function getNativeTabRegistry(target: unknown): NativeTabRegistry | undefined;
export declare function attachNativeTabRegistry<T>(target: T, registry: NativeTabRegistry): NativeTabRegistry;
export declare function findNativeTabRegistry(entry: unknown): NativeTabRegistry | undefined;
export declare function isForeignSidebarHost(component: unknown): boolean;
