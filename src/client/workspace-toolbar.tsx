import { useEffect, useRef, useState } from 'react'
import type { Translate } from './contracts.js'
import { CheckOutlineIcon, CloseOutlineIcon, SearchOutlineIcon, SlidersIcon } from './icons.js'
import type { WorkspaceGroupMode, WorkspaceListSort } from './schedule-rail-model.js'

/** 官方 WorkspaceBrowser：折叠 14px，展开 11px。 */
export function officialSearchIconSize(expanded: boolean): 11 | 14 {
  return expanded ? 11 : 14
}

export function WorkspaceToolbar({
  t,
  query,
  sort,
  groupMode,
  onQueryChange,
  onSortChange,
  onGroupModeChange,
}: {
  readonly t: Translate
  readonly query: string
  readonly sort: WorkspaceListSort
  readonly groupMode: WorkspaceGroupMode
  readonly onQueryChange: (query: string) => void
  readonly onSortChange: (sort: WorkspaceListSort) => void
  readonly onGroupModeChange: (mode: WorkspaceGroupMode) => void
}): JSX.Element {
  const [searching, setSearching] = useState(query.trim() !== '')
  const [filterOpen, setFilterOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchSize = officialSearchIconSize(searching)
  useEffect(() => {
    if (searching) inputRef.current?.focus()
  }, [searching])
  useEffect(() => {
    if (!filterOpen) return
    const close = (event: MouseEvent): void => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      setFilterOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [filterOpen])
  const openSearch = (): void => {
    setFilterOpen(false)
    setSearching(true)
  }
  const closeSearch = (): void => {
    onQueryChange('')
    setSearching(false)
  }
  return (
    <div className={searching ? 'dsh-st-n-toolbar is-search' : 'dsh-st-n-toolbar'} ref={rootRef}>
      <span className="dsh-st-n-head-label">{t('sidebar.workspaces')}</span>
      <div className="dsh-st-n-search-slot">
        <div className="dsh-st-n-search" onClick={openSearch}>
          <button type="button" className="dsh-st-n-search-btn" aria-label={t('sidebar.search')} aria-expanded={searching} onClick={openSearch}>
            <SearchOutlineIcon width={searchSize} height={searchSize} />
          </button>
          <input ref={inputRef} className="dsh-st-n-search-input" value={query} placeholder={t('sidebar.searchSessions')} aria-label={t('sidebar.searchSessions')} tabIndex={searching ? 0 : -1} aria-hidden={!searching} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Escape') closeSearch()
          }} />
          {searching && (
            <button type="button" className="dsh-st-n-search-clear" aria-label={t('sidebar.clearSearch')} onClick={(event) => { event.stopPropagation(); closeSearch() }}>
              <CloseOutlineIcon width={14} height={14} />
            </button>
          )}
        </div>
      </div>
      <div className="dsh-st-n-head-acts">
        <div className="dsh-st-n-head-filter">
          <button type="button" className={filterOpen ? 'dsh-st-n-head-btn is-on' : 'dsh-st-n-head-btn'} aria-label={t('sidebar.filter')} aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
            <SlidersIcon width={16} height={16} />
          </button>
          {filterOpen && (
            <div className="dsh-st-n-filter-menu" role="menu">
              <div className="dsh-st-n-filter-label">{t('sidebar.groupBy')}</div>
              <FilterRow label={t('sidebar.groupWorkspace')} selected={groupMode === 'workspace'} onSelect={() => { onGroupModeChange('workspace'); setFilterOpen(false) }} />
              <FilterRow label={t('sidebar.groupList')} selected={groupMode === 'list'} onSelect={() => { onGroupModeChange('list'); setFilterOpen(false) }} />
              <div className="dsh-st-n-filter-split" />
              <div className="dsh-st-n-filter-label">{t('sidebar.sortBy')}</div>
              <FilterRow label={t('sidebar.sortManual')} selected={sort === 'manual'} onSelect={() => { onSortChange('manual'); setFilterOpen(false) }} />
              <FilterRow label={t('sidebar.sortTime')} selected={sort === 'time'} onSelect={() => { onSortChange('time'); setFilterOpen(false) }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterRow({
  label,
  selected,
  onSelect,
}: {
  readonly label: string
  readonly selected: boolean
  readonly onSelect: () => void
}): JSX.Element {
  return (
    <button type="button" role="menuitemradio" aria-checked={selected} className={selected ? 'is-on' : undefined} onClick={onSelect}>
      <span>{label}</span>
      {selected ? <CheckOutlineIcon width={16} height={16} /> : <span className="dsh-st-n-filter-tick" />}
    </button>
  )
}