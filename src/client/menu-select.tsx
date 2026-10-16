import * as React from 'react'
import { Menu, Button, type MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'

export interface MenuSelectOption {
  value: string
  label: string
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
  className?: string
  listClassName?: string
  action?: boolean
  icon?: React.ReactNode
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
  const options = props.options ?? []

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
    className: ['dsh-st-menu-select-wrap', props.className].filter(Boolean).join(' '),
    style: { display: 'inline-flex', verticalAlign: 'middle' },
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
    ...(props.listClassName !== undefined ? { listClassName: props.listClassName } : {}),
    ...(footer !== undefined ? { footer } : {}),
    anchor: React.createElement(Button, {
      variant: 'outline',
      size: 'sm',
      role: 'combobox',
      'aria-label': props.label ?? currentText,
      'aria-expanded': open,
      disabled: props.disabled,
      className: ['dsh-st-menu-select-trigger', open ? 'is-open' : ''].filter(Boolean).join(' '),
      onClick: () => {
        if (!props.disabled) setOpen(prev => !prev)
      },
    },
      React.createElement('span', { className: 'dsh-st-menu-select-label' }, currentText),
      React.createElement('svg', {
        className: 'dsh-st-menu-select-arrow',
        viewBox: '0 0 16 16',
        width: 12,
        height: 12,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { marginLeft: 4, transition: 'transform 150ms ease', transform: open ? 'rotate(180deg)' : 'none' },
      }, React.createElement('path', { d: 'm4 6 4 4 4-4' })),
    ),
    items,
  }))
}
