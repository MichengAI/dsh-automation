import * as React from 'react'
import { Menu, Button, type MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'

export interface MenuSelectOption {
  value: string
  label: string
  disabled?: boolean
  danger?: boolean
}

export interface MenuSelectProps {
  value: string
  label?: string
  options: readonly MenuSelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  listClassName?: string
  action?: boolean
  icon?: React.ReactNode
}

/**
 * 宿主官方原语 Menu 规范封装的下拉选择组件（对齐 dsh-skills-manager 的 SourceSelect 实现）。
 * 1. 触发器采用宿主 Button (variant="outline", size="sm")，右侧配旋转指示小箭头；
 * 2. 弹出层使用宿主原生 <Menu portal dense>，完全消除 Antd Select 的虚拟列表白底与样式打架。
 */
export function MenuSelect(props: MenuSelectProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)

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
    return props.options.map(opt => ({
      id: opt.value,
      label: opt.label,
      ...(opt.disabled !== undefined ? { disabled: opt.disabled } : {}),
      ...(opt.danger !== undefined ? { danger: opt.danger } : {}),
    }))
  }, [props.options])

  const selectedOption = props.options.find(opt => opt.value === props.value)
  const currentText = selectedOption ? selectedOption.label : (props.label ?? '')

  return React.createElement('div', {
    className: ['dsh-st-menu-select-wrap', props.className].filter(Boolean).join(' '),
    style: { display: 'inline-flex', verticalAlign: 'middle' },
  }, React.createElement(Menu, {
    open,
    onClose: () => { setOpen(false) },
    onSelect: (id: string) => {
      props.onChange(id)
      setOpen(false)
    },
    selectedId: props.value,
    align: 'start',
    portal: true,
    dense: true,
    ...(props.listClassName !== undefined ? { listClassName: props.listClassName } : {}),
    anchor: React.createElement(Button, {
      variant: 'outline',
      size: 'sm',
      role: 'combobox',
      'aria-label': props.label,
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
