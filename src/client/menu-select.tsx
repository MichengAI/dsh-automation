import * as React from 'react'
import { Menu, Button, type MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'
import { IconChevronDownOutline } from './host-icons.js'

export interface MenuSelectOption {
  value: string
  label: React.ReactNode
  /** 当 label 是复杂 ReactNode 时作为 aria-label 和纯文本回退 */
  text?: string
  disabled?: boolean
  danger?: boolean
}

export interface MenuSelectGroup {
  id: string
  label: string
  options: readonly MenuSelectOption[]
}

export interface MenuSelectProps {
  value: string
  label?: string
  placeholder?: string
  options?: readonly MenuSelectOption[]
  groups?: readonly MenuSelectGroup[]
  footer?: readonly MenuSelectOption[]
  onChange: (value: string) => void
  onFooter?: (id: string) => void
  disabled?: boolean
  compact?: boolean
  className?: string
  listClassName?: string
}

function optionItem(opt: MenuSelectOption): MenuEntry {
  return {
    id: opt.value,
    label: opt.label,
    ...(opt.disabled !== undefined ? { disabled: opt.disabled } : {}),
    ...(opt.danger !== undefined ? { danger: opt.danger } : {}),
  }
}

/** 宿主 Menu 下拉。分组用标签行，底部动作走 footer，不走选择值。 */
export function MenuSelect(props: MenuSelectProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const options = props.options ?? []

  React.useEffect(() => {
    if (!open) return undefined
    const width = rootRef.current?.getBoundingClientRect().width ?? 0
    if (width > 0) document.documentElement.style.setProperty('--dsh-st-menu-width', `${Math.round(width)}px`)
    return () => { document.documentElement.style.removeProperty('--dsh-st-menu-width') }
  }, [open])

  React.useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => { window.removeEventListener('keydown', onKey, true) }
  }, [open])

  const items: readonly MenuEntry[] = React.useMemo(() => {
    if (props.groups !== undefined && props.groups.length > 0) {
      return props.groups.flatMap(group => [
        { type: 'label' as const, id: `label-${group.id}`, text: group.label },
        ...group.options.map(optionItem),
      ])
    }
    return options.map(optionItem)
  }, [options, props.groups])

  const footer = props.footer?.map(optionItem)
  const selectedOption = options.find(opt => opt.value === props.value)
    ?? props.groups?.flatMap(group => [...group.options]).find(opt => opt.value === props.value)
  const currentText = selectedOption ? selectedOption.label : (props.placeholder ?? props.label ?? '')

  return React.createElement('div', {
    ref: rootRef,
    className: ['dsh-st-menu-select-wrap', props.compact === true ? 'is-compact' : '', props.className].filter(Boolean).join(' '),
  }, React.createElement(Menu, {
    open,
    onClose: () => { setOpen(false) },
    onSelect: (id: string) => {
      if (props.footer?.some(item => item.value === id) === true) {
        props.onFooter?.(id)
        setOpen(false)
        return
      }
      props.onChange(id)
      setOpen(false)
    },
    selectedId: props.value,
    align: 'start',
    portal: true,
    dense: true,
    listClassName: ['dsh-st-form-menu', props.listClassName].filter(Boolean).join(' '),
    ...(footer !== undefined ? { footer } : {}),
    anchor: React.createElement(Button, {
      variant: 'outline',
      ...(props.compact === true ? { size: 'sm' as const } : {}),
      role: 'combobox',
      'aria-label': props.label ?? (typeof currentText === 'string' ? currentText : selectedOption?.text) ?? props.placeholder ?? '',
      'aria-expanded': open,
      disabled: props.disabled,
      className: ['dsh-st-menu-select-trigger', open ? 'is-open' : ''].filter(Boolean).join(' '),
      onClick: () => {
        if (!props.disabled) setOpen(prev => !prev)
      },
    },
      React.createElement('span', { className: 'dsh-st-menu-select-label' }, currentText),
      // 宿主图标只转发 className；箭头旋转由 .is-open 下的样式表规则负责。
      React.createElement(IconChevronDownOutline, { className: 'dsh-st-menu-select-arrow', size: 12 }),
    ),
    items,
  }))
}
