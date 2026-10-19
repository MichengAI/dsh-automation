/** 记录视图独立的视图状态；分组/排序/筛选不再借用官方任务树的 store。 */

export type RecordsGroupBy = 'task' | 'workspace' | 'workspace-tree' | 'flat'
export type RecordsOrderBy = 'manual' | 'updated'
export type RecordsArchivedFilter = 'default' | 'show' | 'only'

export interface RecordsViewState {
  readonly groupBy: RecordsGroupBy
  readonly orderBy: RecordsOrderBy
  readonly groupExpansion: Readonly<Record<string, boolean>>
  readonly sessionOrderByAccount: Readonly<Record<string, readonly string[]>>
  readonly archivedFilter: RecordsArchivedFilter
}

export interface RecordsViewActions {
  setGroupBy(mode: RecordsGroupBy): void
  setOrderBy(mode: RecordsOrderBy, initialOrders: Readonly<Record<string, readonly string[]>>): void
  setGroupExpanded(key: string, expanded: boolean): void
  retainAccountKeys(workspaceKeys: readonly string[]): void
  setSessionOrder(accountKey: string, order: readonly string[], initialOrders: Readonly<Record<string, readonly string[]>>): void
  syncSessionOrders(orders: Readonly<Record<string, readonly string[]>>): void
  pinSessionOrder(
    sessionId: string,
    accountKeys: readonly string[],
    source: { readonly members: Readonly<Record<string, readonly string[]>> },
  ): void
  setArchivedFilter(filter: RecordsArchivedFilter): void
  ensureExpanded(keys: readonly string[]): void
}

export interface RecordsViewStore {
  getSnapshot(): RecordsViewState
  subscribe(listener: () => void): () => void
  actions: RecordsViewActions
}

function copyOrders(
  orders: Readonly<Record<string, readonly string[]>>,
): Record<string, string[]> {
  return Object.fromEntries(Object.entries(orders).map(([key, order]) => [key, [...order]]))
}

export function createRecordsViewStore(): RecordsViewStore {
  let state: RecordsViewState = {
    groupBy: 'task',
    orderBy: 'updated',
    groupExpansion: {},
    sessionOrderByAccount: {},
    archivedFilter: 'default',
  }
  const listeners = new Set<() => void>()
  const publish = (next: RecordsViewState): void => {
    state = next
    for (const listener of listeners) listener()
  }
  const actions: RecordsViewActions = {
    setGroupBy(mode) {
      if (mode !== state.groupBy) publish({ ...state, groupBy: mode })
    },
    setOrderBy(mode, initialOrders) {
      if (mode === state.orderBy) return
      publish({
        ...state,
        orderBy: mode,
        sessionOrderByAccount: mode === 'manual' ? copyOrders(initialOrders) : {},
      })
    },
    setGroupExpanded(key, expanded) {
      if (state.groupExpansion[key] === expanded) return
      publish({ ...state, groupExpansion: { ...state.groupExpansion, [key]: expanded } })
    },
    retainAccountKeys(workspaceKeys) {
      const retained = new Set(workspaceKeys)
      const groupExpansion = Object.fromEntries(
        Object.entries(state.groupExpansion).filter(([key]) => retained.has(key)),
      )
      const sessionOrderByAccount = Object.fromEntries(
        Object.entries(state.sessionOrderByAccount).filter(([key]) => retained.has(key)),
      )
      if (
        Object.keys(groupExpansion).length === Object.keys(state.groupExpansion).length
        && Object.keys(sessionOrderByAccount).length === Object.keys(state.sessionOrderByAccount).length
      ) return
      publish({ ...state, groupExpansion, sessionOrderByAccount })
    },
    setSessionOrder(accountKey, order, initialOrders) {
      const sessionOrderByAccount = state.orderBy === 'manual'
        ? { ...state.sessionOrderByAccount, [accountKey]: [...order] }
        : { ...copyOrders(initialOrders), [accountKey]: [...order] }
      publish({ ...state, orderBy: 'manual', sessionOrderByAccount })
    },
    syncSessionOrders(orders) {
      if (state.orderBy !== 'manual') return
      publish({ ...state, sessionOrderByAccount: { ...state.sessionOrderByAccount, ...copyOrders(orders) } })
    },
    pinSessionOrder(sessionId, accountKeys, source) {
      const selected = new Set(accountKeys)
      const sessionOrderByAccount = Object.fromEntries(
        Object.entries(source.members).map(([key, members]) => {
          const current = state.sessionOrderByAccount[key] ?? members
          const order = selected.has(key)
            ? [sessionId, ...current.filter(id => id !== sessionId)]
            : [...current]
          return [key, order]
        }),
      )
      publish({ ...state, sessionOrderByAccount })
    },
    setArchivedFilter(filter) {
      if (filter !== state.archivedFilter) publish({ ...state, archivedFilter: filter })
    },
    ensureExpanded(keys) {
      let changed = false
      const groupExpansion = { ...state.groupExpansion }
      for (const key of keys) {
        if (key === '' || groupExpansion[key] !== undefined) continue
        groupExpansion[key] = true
        changed = true
      }
      if (changed) publish({ ...state, groupExpansion })
    },
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    actions,
  }
}

let sharedStore: RecordsViewStore | undefined

/** 记录视图在页签切换后仍保留分组/排序选择。 */
export function getRecordsViewStore(): RecordsViewStore {
  sharedStore ??= createRecordsViewStore()
  return sharedStore
}
