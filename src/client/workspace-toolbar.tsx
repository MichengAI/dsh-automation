import { useEffect, useRef, useState } from 'react'
import { Menu, type MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from './contracts.js'
import { hostHasWorkspaceTree, hostMenuRendersChildren, IconArchiveCheckOutline, IconArchiveOutline, IconClockOutline, IconCloseFill, IconFlatListOutline, IconFolderClose, IconSearchOutline, IconSlidersTwoOutline, IconWorkspaceTreeOutline } from './host-icons.js'
import type { ArchivedSessionFilter, WorkspaceGroupMode, WorkspaceListSort } from './schedule-rail-model.js'
import { officialSearchIconSize } from './workspace-toolbar-metrics.js'

export { officialSearchIconSize }

export function WorkspaceToolbar({
  t,
  query,
  sort,
  groupMode,
  archivedFilter = 'default',
  onQueryChange,
  onSortChange,
  onGroupModeChange,
  onArchivedFilterChange,
}: {
  readonly t: Translate
  readonly query: string
  readonly sort: WorkspaceListSort
  readonly groupMode: WorkspaceGroupMode
  readonly archivedFilter?: ArchivedSessionFilter
  readonly onQueryChange: (query: string) => void
  readonly onSortChange: (sort: WorkspaceListSort) => void
  readonly onGroupModeChange: (mode: WorkspaceGroupMode) => void
  readonly onArchivedFilterChange?: (filter: ArchivedSessionFilter) => void
}): JSX.Element {
  const [searching, setSearching] = useState(query.trim() !== '')
  const [filterOpen, setFilterOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchSize = officialSearchIconSize(searching)
  useEffect(() => {
    if (searching) inputRef.current?.focus()
  }, [searching])
  const openSearch = (): void => {
    setFilterOpen(false)
    setSearching(true)
  }
  const closeSearch = (): void => {
    onQueryChange('')
    setSearching(false)
  }
  const items: MenuEntry[] = [
    { type: 'label', id: 'group-by', text: t('sidebar.groupBy') },
    { id: 'workspace', label: t('sidebar.groupWorkspace'), icon: <IconFolderClose /> },
    ...(hostHasWorkspaceTree() ? [{ id: 'workspace-tree', label: t('sidebar.groupWorkspaceTree'), icon: <IconWorkspaceTreeOutline /> }] : []),
    { id: 'flat', label: t('sidebar.groupList'), icon: <IconFlatListOutline /> },
    { type: 'separator', id: 'order-by-separator' },
    { type: 'label', id: 'order-by', text: t('sidebar.sortBy') },
    { id: 'updated', label: t('sidebar.sortTime'), icon: <IconClockOutline /> },
    ...(hostMenuRendersChildren() && onArchivedFilterChange !== undefined ? [
      { type: 'separator' as const, id: 'archived-filter-separator' },
      { type: 'label' as const, id: 'filter-by', text: t('sidebar.filterBy') },
      { id: 'show-archived', label: t('sidebar.showArchived'), icon: <IconArchiveOutline /> },
      { id: 'only-archived', label: t('sidebar.onlyArchived'), icon: <IconArchiveCheckOutline /> },
    ] : []),
  ]
  const selectedIds = [
    groupMode === 'list' ? 'flat' : groupMode,
    'updated',
    ...(archivedFilter === 'show' ? ['show-archived'] : []),
    ...(archivedFilter === 'only' ? ['only-archived'] : []),
  ]
  return (
    <div className={searching ? 'dsh-st-n-toolbar is-search' : 'dsh-st-n-toolbar'}>
      <span className="dsh-st-n-head-label">{groupMode === 'list' ? t('sidebar.sessions') : t('sidebar.workspaces')}</span>
      <div className="dsh-st-n-search-slot">
        <div className="dsh-st-n-search" onClick={openSearch}>
          <button type="button" className="dsh-st-n-search-btn" aria-label={t('sidebar.search')} aria-expanded={searching} onClick={openSearch}>
            <IconSearchOutline size={searchSize} />
          </button>
          <input ref={inputRef} className="dsh-st-n-search-input" value={query} placeholder={t('sidebar.searchSessions')} aria-label={t('sidebar.searchSessions')} tabIndex={searching ? 0 : -1} aria-hidden={!searching} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Escape') closeSearch()
          }} />
          {searching && (
            <button type="button" className="dsh-st-n-search-clear" aria-label={t('sidebar.clearSearch')} onClick={(event) => { event.stopPropagation(); closeSearch() }}>
              <IconCloseFill size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="dsh-st-n-head-acts">
        <Menu
          open={filterOpen}
          onClose={() => { setFilterOpen(false) }}
          items={items}
          selectedIds={selectedIds}
          align="end"
          dense
          portal
          onSelect={(id) => {
            if (id === 'workspace' || id === 'workspace-tree') onGroupModeChange(id)
            if (id === 'flat') onGroupModeChange('list')
            if (id === 'updated') onSortChange('time')
            if (id === 'show-archived') onArchivedFilterChange?.(archivedFilter === 'show' ? 'default' : 'show')
            if (id === 'only-archived') onArchivedFilterChange?.(archivedFilter === 'only' ? 'default' : 'only')
            setFilterOpen(false)
          }}
          anchor={<button type="button" className={filterOpen ? 'dsh-st-n-head-btn is-on' : 'dsh-st-n-head-btn'} aria-label={t('sidebar.filter')} aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
            <IconSlidersTwoOutline size={16} />
          </button>}
        />
      </div>
    </div>
  )
}
