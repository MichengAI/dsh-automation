import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MenuOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly icon?: ReactNode
}

function useMenuOpen(): {
  readonly open: boolean
  readonly setOpen: (value: boolean | ((current: boolean) => boolean)) => void
  readonly root: React.RefObject<HTMLDivElement>
} {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (root.current !== null && root.current.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [open])

  return { open, setOpen, root }
}

export function MenuRow({
  icon,
  label,
  hint,
  active,
  chevron,
  kv,
  onClick,
}: {
  readonly icon?: ReactNode
  readonly label: ReactNode
  readonly hint?: ReactNode
  readonly active?: boolean
  readonly chevron?: boolean
  readonly kv?: boolean
  readonly onClick: () => void
}): JSX.Element {
  return (
    <button type="button" className={`dsh-st-menu-row${active === true ? ' is-on' : ''}${kv === true ? ' is-kv' : ''}`} onClick={onClick}>
      <span className="dsh-st-menu-row-main">
        {icon}
        <span>{label}</span>
      </span>
      <span className="dsh-st-menu-row-side">
        {hint}
        {active === true && chevron !== true && <i className="dsh-st-tick" />}
        {chevron === true && <i className="dsh-st-next" />}
      </span>
    </button>
  )
}

export function MenuSelect<T extends string>({
  value,
  options,
  onChange,
  wide,
  pill,
  up,
  icon,
}: {
  readonly value: T
  readonly options: readonly MenuOption<T>[]
  readonly onChange: (value: T) => void
  readonly wide?: boolean
  readonly pill?: boolean
  readonly up?: boolean
  readonly icon?: ReactNode
}): JSX.Element {
  const menu = useMenuOpen()
  const current = options.find(item => item.value === value)?.label ?? value
  return (
    <div className={`dsh-st-select${wide === true ? ' is-wide' : ''}${pill === true ? ' is-pill' : ''}${menu.open ? ' is-open' : ''}`} ref={menu.root}>
      <button
        type="button"
        className="dsh-st-select-btn"
        onMouseDown={event => event.stopPropagation()}
        onClick={() => menu.setOpen(value => !value)}
      >
        {icon}
        <span>{current}</span>
        <em />
      </button>
      {menu.open && (
        <div className={`dsh-st-select-menu${pill === true ? ' is-composer' : ''}${up === true ? ' is-up' : ''}${up === true ? ' is-end' : ''}`}>
          {options.map(item => (
            <MenuRow
              key={item.value}
              icon={item.icon}
              label={item.label}
              active={item.value === value}
              onClick={() => { onChange(item.value); menu.setOpen(false) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MenuPanel({
  label,
  children,
  ghost,
  up,
  persist,
}: {
  readonly label: ReactNode
  readonly children: ReactNode
  readonly ghost?: boolean
  readonly up?: boolean
  readonly persist?: boolean
}): JSX.Element {
  const menu = useMenuOpen()
  return (
    <div className={`dsh-st-select${ghost === true ? ' is-pill' : ''}${menu.open ? ' is-open' : ''}`} ref={menu.root}>
      <button
        type="button"
        className="dsh-st-chip-btn"
        onMouseDown={event => event.stopPropagation()}
        onClick={() => menu.setOpen(value => !value)}
      >
        {label}
        {ghost === true && <em />}
      </button>
      {menu.open && (
        <div className={`dsh-st-select-menu is-composer${up === true ? ' is-up' : ''}`} onClick={() => { if (persist !== true) menu.setOpen(false) }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function useMenuState(): ReturnType<typeof useMenuOpen> {
  return useMenuOpen()
}
