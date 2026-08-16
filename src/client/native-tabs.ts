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
  getTabs(): NativeSidebarTab[]
  subscribe(listener: () => void): () => void
  insert(tab: NativeSidebarTab): () => void
  addSessionFilter(filter: (id: string) => boolean): () => void
}

export function createNativeTabRegistry(officialTree: unknown): NativeTabRegistry {
  const tabs = new Map<string, NativeSidebarTab>()
  const sessionFilters: Array<(id: string) => boolean> = []
  const listeners = new Set<() => void>()
  let cachedTabs: NativeSidebarTab[] = []
  const rebuild = (): void => {
    cachedTabs = [...tabs.values()].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  }
  const emit = (): void => { for (const listener of listeners) listener() }
  return {
    version: 1,
    officialTree,
    sessionFilters,
    getTabs() {
      return cachedTabs
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
      return () => { tabs.delete(tab.id); rebuild(); emit() }
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
  }
}

export function getNativeTabRegistry(target: unknown): NativeTabRegistry | undefined {
  if (target === undefined || target === null || (typeof target !== 'object' && typeof target !== 'function')) return undefined
  const registry = (target as Record<string, unknown>)[NATIVE_TABS_KEY]
  if (registry === undefined || registry === null || typeof registry !== 'object') return undefined
  return typeof (registry as NativeTabRegistry).insert === 'function' ? registry as NativeTabRegistry : undefined
}

export function attachNativeTabRegistry<T>(target: T, registry: NativeTabRegistry): NativeTabRegistry {
  try { (target as Record<string, unknown>)[NATIVE_TABS_KEY] = registry } catch { /* ignore */ }
  return registry
}

export function findNativeTabRegistry(entry: unknown): NativeTabRegistry | undefined {
  const record = entry as { component?: unknown } | undefined
  return getNativeTabRegistry(entry) ?? getNativeTabRegistry(record?.component)
}

export function isForeignSidebarHost(component: unknown): boolean {
  if (component === undefined || component === null) return false
  const flags = component as { __dshNativeTabHost?: unknown; __imConnectWrapped?: unknown }
  if (flags.__dshNativeTabHost === true) return true
  if (flags.__imConnectWrapped === true) return true
  return getNativeTabRegistry(component) !== undefined
}
