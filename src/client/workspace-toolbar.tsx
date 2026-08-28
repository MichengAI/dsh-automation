import { useEffect, useRef, useState } from 'react'
import type { Translate } from './contracts.js'
import { CloseOutlineIcon, PlusIcon, SearchOutlineIcon } from './icons.js'

/** 官方 WorkspaceBrowser：折叠 14px，展开 11px。 */
export function officialSearchIconSize(expanded: boolean): 11 | 14 {
  return expanded ? 11 : 14
}

export function WorkspaceToolbar({
  t,
  query,
  onQueryChange,
  onCreateTask,
}: {
  readonly t: Translate
  readonly query: string
  readonly onQueryChange: (query: string) => void
  readonly onCreateTask?: () => void
}): JSX.Element {
  const [searching, setSearching] = useState(query.trim() !== '')
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchSize = officialSearchIconSize(searching)
  useEffect(() => {
    if (searching) inputRef.current?.focus()
  }, [searching])
  const openSearch = (): void => {
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
        {onCreateTask !== undefined && <button type="button" className="dsh-st-n-head-btn" aria-label={t('action.create')} title={t('action.create')} onClick={onCreateTask}><PlusIcon width={16} height={16} /></button>}
      </div>
    </div>
  )
}
