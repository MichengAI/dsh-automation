import { useState, type ReactElement } from 'react'
import type { Translate } from './contracts.js'
import { AntdProvider, Button, Dropdown, Select } from './antd-ui.js'
import {
  readSortDefault,
  writeSortDefault,
  type AutomationSortDirection,
  type AutomationSortKey,
  type SortPreferenceStorage,
} from './helpers.js'

const SORT_OPTIONS: readonly (readonly [AutomationSortKey, AutomationSortDirection])[] = [
  ['created', 'desc'],
  ['created', 'asc'],
  ['planned', 'asc'],
  ['planned', 'desc'],
]

/** 设置页与侧栏总览共用的排序菜单。当前项可以存成默认。 */
export function SortMenu({
  t,
  storage,
  storageKey,
  sortKey,
  sortDirection,
  onSelect,
  iconOnly = false,
  className,
}: {
  readonly t: Translate
  readonly storage?: SortPreferenceStorage
  readonly storageKey: string
  readonly sortKey: AutomationSortKey
  readonly sortDirection: AutomationSortDirection
  readonly onSelect: (key: AutomationSortKey, direction: AutomationSortDirection) => void
  readonly compact?: boolean
  readonly iconOnly?: boolean
  readonly className?: string
}): JSX.Element {
  const [saved, setSaved] = useState(() => readSortDefault(storage, storageKey))
  const currentLabel = t(sortKey === 'planned' ? `sort.planned.${sortDirection}` : `sort.created.${sortDirection}`)
  const savedAlready = saved?.key === sortKey && saved.direction === sortDirection
  const saveDefault = (): void => {
    if (storage === undefined || savedAlready) return
    writeSortDefault(storage, storageKey, sortKey, sortDirection)
    setSaved({ key: sortKey, direction: sortDirection })
  }
  const items = [
    ...SORT_OPTIONS.map(([key, direction]) => ({
      key: `${key}-${direction}`,
      label: t(key === 'planned' ? `sort.planned.${direction}` : `sort.created.${direction}`),
      onClick: () => onSelect(key, direction),
    })),
    ...(storage === undefined ? [] : [{ type: 'divider' as const }, {
      key: 'default',
      label: savedAlready ? t('sort.default.saved') : t('sort.default.save'),
      disabled: savedAlready,
      onClick: saveDefault,
    }]),
  ]
  if (iconOnly) {
    return (
      <AntdProvider>
        <span className={className}>
          <Dropdown menu={{ selectable: true, selectedKeys: [`${sortKey}-${sortDirection}`], items }}>
            <Button type="text" shape="default" aria-label={currentLabel} icon={<SortMark />} />
          </Dropdown>
        </span>
      </AntdProvider>
    )
  }
  return (
    <AntdProvider>
      <Select
        className={className ?? 'dsh-st-sort-select'}
        value={`${sortKey}-${sortDirection}`}
        popupMatchSelectWidth={false}
        options={SORT_OPTIONS.map(([key, direction]) => ({
          value: `${key}-${direction}`,
          label: t(key === 'planned' ? `sort.planned.${direction}` : `sort.created.${direction}`),
        }))}
        onChange={value => {
          const [key, direction] = String(value).split('-') as [AutomationSortKey, AutomationSortDirection]
          onSelect(key, direction)
        }}
        {...(storage === undefined ? {} : { popupRender: (menu: ReactElement) => (
          <>
            {menu}
            <button type="button" className="dsh-st-sort-default" disabled={savedAlready} onMouseDown={event => event.preventDefault()} onClick={saveDefault}>
              {savedAlready ? t('sort.default.saved') : t('sort.default.save')}
            </button>
          </>
        ) })}
      />
    </AntdProvider>
  )
}

function SortMark(): JSX.Element {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 3v10M4.5 3 2.5 5.2M4.5 3l2 2.2M11.5 13V3M11.5 13l-2-2.2M11.5 13l2-2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
