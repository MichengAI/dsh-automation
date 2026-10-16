import { useState } from 'react'
import type { Translate } from './contracts.js'
import { Menu, type MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'
import { Button } from './antd-ui.js'
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

/** 设置页与侧栏总览共用的排序菜单。当前项可以存成默认。基于官方原语 Menu 重构。 */
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
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(() => readSortDefault(storage, storageKey))
  const currentLabel = t(sortKey === 'planned' ? `sort.planned.${sortDirection}` : `sort.created.${sortDirection}`)
  const savedAlready = saved?.key === sortKey && saved.direction === sortDirection
  const saveDefault = (): void => {
    if (storage === undefined || savedAlready) return
    writeSortDefault(storage, storageKey, sortKey, sortDirection)
    setSaved({ key: sortKey, direction: sortDirection })
  }

  const items: readonly MenuEntry[] = [
    ...SORT_OPTIONS.map(([key, direction]) => ({
      id: `${key}-${direction}`,
      label: t(key === 'planned' ? `sort.planned.${direction}` : `sort.created.${direction}`),
    })),
    ...(storage === undefined ? [] : [
      { type: 'separator' as const, id: 'sort-default-sep' },
      {
        id: 'save-default',
        label: savedAlready ? t('sort.default.saved') : t('sort.default.save'),
      },
    ]),
  ]

  const trigger = iconOnly ? (
    <Button
      variant="ghost"
      size="sm"
      aria-label={currentLabel}
      title={currentLabel}
      onClick={() => setOpen(prev => !prev)}
      icon={<SortMark />}
    />
  ) : (
    <Button
      variant="outline"
      size="sm"
      role="combobox"
      aria-label={currentLabel}
      aria-expanded={open}
      className={['dsh-st-menu-select-trigger', open ? 'is-open' : ''].filter(Boolean).join(' ')}
      onClick={() => setOpen(prev => !prev)}
    >
      <span className="dsh-st-menu-select-label">{currentLabel}</span>
      <svg
        className="dsh-st-menu-select-arrow"
        viewBox="0 0 16 16"
        width={12}
        height={12}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginLeft: 4, transition: 'transform 150ms ease', transform: open ? 'rotate(180deg)' : 'none' }}
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </Button>
  )

  return (
    <div className={['dsh-st-menu-select-wrap', className].filter(Boolean).join(' ')} style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        selectedId={`${sortKey}-${sortDirection}`}
        align={iconOnly ? 'end' : 'start'}
        portal
        dense
        anchor={trigger}
        items={items}
        onSelect={(id) => {
          if (id === 'save-default') {
            saveDefault()
            setOpen(false)
            return
          }
          const [key, direction] = id.split('-') as [AutomationSortKey, AutomationSortDirection]
          onSelect(key, direction)
          setOpen(false)
        }}
      />
    </div>
  )
}

function SortMark(): JSX.Element {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 3v10M4.5 3 2.5 5.2M4.5 3l2 2.2M11.5 13V3M11.5 13l-2-2.2M11.5 13l2-2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
