/** 原生侧栏页签协作协议。两套插件各自复制这份约定，不互相 import。 */

export const NATIVE_TABS_KEY = '__dshNativeTabs'

export interface NativeSidebarTab {
  readonly id: string
  readonly label: string
  readonly order?: number
  matchSession?(sessionId: string): boolean
  render(props: Record<string, unknown>): unknown
}

export interface NativeTabRegistry {
  readonly version: 1
  officialTree: unknown
  readonly sessionFilters: Array<(id: string) => boolean>
  readonly sessionOpeners: NativeSessionOpener[]
  getTabs(): NativeSidebarTab[]
  /** 页签、过滤器或会话打开器发生变化时递增，供外壳重新计算。 */
  getRevision(): number
  subscribe(listener: () => void): () => void
  insert(tab: NativeSidebarTab): () => void
  addSessionFilter(filter: (id: string) => boolean): () => void
  addSessionOpener(opener: NativeSessionOpener): () => void
}

/** 按 order 选择第一个匹配的会话打开器；没有匹配时回退宿主打开。 */
export function openRegisteredSession(
  sessionId: string,
  registry?: NativeTabRegistry,
  hostOpen?: (id: string) => void,
): void {
  const opener = registry?.sessionOpeners
    ?.slice()
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .find(item => item.matchSession(sessionId))
  if (opener === undefined) {
    hostOpen?.(sessionId)
    return
  }
  try {
    opener.open(sessionId, hostOpen)
  } catch {
    hostOpen?.(sessionId)
  }
}

export interface FilterableSessionState {
  readonly ids?: readonly string[]
  readonly byId?: Record<string, unknown>
}

export interface NativeSessionOpener {
  readonly id: string
  readonly order?: number
  matchSession(sessionId: string): boolean
  open(sessionId: string, hostOpen?: (id: string) => void): void
}

const sessionFilterCache = new WeakMap<object, { readonly revision: number; readonly result: unknown }>()

/**
 * 统一应用注册表里的会话过滤器。
 * 没有过滤器时直接返回原 state，避免外壳为无人使用的过滤器付出重渲染成本。
 */
export function applySessionFilters<T extends FilterableSessionState>(state: T, registry?: NativeTabRegistry): T {
  if (state === null || typeof state !== 'object') return state
  const filters = registry?.sessionFilters ?? []
  if (filters.length === 0) return state
  const revision = typeof registry?.getRevision === 'function' ? registry.getRevision() : null
  if (revision !== null) {
    const cached = sessionFilterCache.get(state)
    if (cached !== undefined && cached.revision === revision) return cached.result as T
  }
  const ids = (state.ids ?? []).filter(id => filters.every(filter => filter(String(id))))
  if (ids.length === (state.ids ?? []).length) {
    if (revision !== null) sessionFilterCache.set(state, { revision, result: state })
    return state
  }
  const byId: Record<string, unknown> = {}
  for (const id of ids) {
    const row = state.byId?.[id]
    if (row !== undefined) byId[id] = row
  }
  const result = { ...state, ids, byId } as T
  if (revision !== null) sessionFilterCache.set(state, { revision, result })
  return result
}

export function createNativeTabRegistry(officialTree: unknown): NativeTabRegistry {
  const tabs = new Map<string, NativeSidebarTab>()
  const sessionFilters: Array<(id: string) => boolean> = []
  const sessionOpeners: NativeSessionOpener[] = []
  const listeners = new Set<() => void>()
  let cachedTabs: NativeSidebarTab[] = []
  let revision = 0
  const rebuild = (): void => {
    cachedTabs = [...tabs.values()].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  }
  const emit = (): void => {
    revision += 1
    for (const listener of listeners) listener()
  }
  return {
    version: 1,
    officialTree,
    sessionFilters,
    sessionOpeners,
    getTabs() {
      return cachedTabs
    },
    getRevision() {
      return revision
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    insert(tab: NativeSidebarTab) {
      if (tab.id === '') return () => undefined
      const existed = tabs.get(tab.id)
      tabs.set(tab.id, tab)
      if (existed !== tab) {
        rebuild()
        emit()
      }
      return () => {
        // 旧注册的清理只能移除自己，不能误删同 ID 的替代页签。
        if (tabs.get(tab.id) !== tab) return
        tabs.delete(tab.id)
        rebuild()
        emit()
      }
    },
    addSessionFilter(filter: (id: string) => boolean) {
      sessionFilters.push(filter)
      emit()
      return () => {
        const index = sessionFilters.indexOf(filter)
        if (index >= 0) sessionFilters.splice(index, 1)
        emit()
      }
    },
    addSessionOpener(opener: NativeSessionOpener) {
      sessionOpeners.push(opener)
      emit()
      return () => {
        const index = sessionOpeners.indexOf(opener)
        if (index >= 0) sessionOpeners.splice(index, 1)
        emit()
      }
    },
  }
}

export function getNativeTabRegistry(target: unknown): NativeTabRegistry | undefined {
  if (target === undefined || target === null || (typeof target !== 'object' && typeof target !== 'function')) return undefined
  const registry = (target as Record<string, unknown>)[NATIVE_TABS_KEY]
  if (registry === undefined || registry === null || typeof registry !== 'object') return undefined
  const candidate = registry as Partial<NativeTabRegistry>
  return candidate.version === 1
    && typeof candidate.getTabs === 'function'
    && typeof candidate.subscribe === 'function'
    && typeof candidate.insert === 'function'
    ? registry as NativeTabRegistry
    : undefined
}

export function attachNativeTabRegistry<T>(target: T, registry: NativeTabRegistry): NativeTabRegistry {
  try { (target as Record<string, unknown>)[NATIVE_TABS_KEY] = registry } catch { /* ignore */ }
  return registry
}

export function findNativeTabRegistry(entry: unknown): NativeTabRegistry | undefined {
  if (entry === undefined || entry === null || (typeof entry !== 'object' && typeof entry !== 'function')) return undefined
  // entry 上的缓存可能属于被换下的外壳；当前显示组件才拥有有效注册表。
  return getNativeTabRegistry('component' in entry ? (entry as { component?: unknown }).component : entry)
}

export function isForeignSidebarHost(component: unknown): boolean {
  if (component === undefined || component === null) return false
  const flags = component as { __dshNativeTabHost?: unknown; __dshNativeTabWrapped?: unknown; __imConnectWrapped?: unknown }
  if (flags.__dshNativeTabHost === true) return true
  if (flags.__dshNativeTabWrapped === true) return true
  if (flags.__imConnectWrapped === true) return true
  return getNativeTabRegistry(component) !== undefined
}
