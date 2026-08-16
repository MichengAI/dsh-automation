import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

export interface MenuOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly icon?: ReactNode
}

function useMenuOpen(): {
  readonly open: boolean
  readonly setOpen: (value: boolean | ((current: boolean) => boolean)) => void
  readonly root: React.RefObject<HTMLDivElement>
  readonly menu: React.RefObject<HTMLDivElement>
} {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      const target = event.target as Node
      if (root.current !== null && root.current.contains(target)) return
      if (menu.current !== null && menu.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [open])

  return { open, setOpen, root, menu }
}

function flyoutStyle(anchor: HTMLElement, up?: boolean, end?: boolean): CSSProperties {
  const box = anchor.getBoundingClientRect()
  const gap = 6
  return {
    position: 'fixed',
    zIndex: 80,
    top: up === true ? 'auto' : `${box.bottom + gap}px`,
    bottom: up === true ? `${window.innerHeight - box.top + gap}px` : 'auto',
    left: end === true ? 'auto' : `${box.left}px`,
    right: end === true ? `${window.innerWidth - box.right}px` : 'auto',
  }
}

export function MenuPopup({
  open,
  anchor,
  menuRef,
  up,
  end,
  className,
  children,
  onClick,
}: {
  readonly open: boolean
  readonly anchor: RefObject<HTMLElement>
  readonly menuRef: RefObject<HTMLDivElement>
  readonly up?: boolean | undefined
  readonly end?: boolean | undefined
  readonly className: string
  readonly children: ReactNode
  readonly onClick?: () => void
}): JSX.Element | null {
  const [style, setStyle] = useState<CSSProperties>({})

  useLayoutEffect(() => {
    if (!open || anchor.current === null) return
    const update = (): void => {
      if (anchor.current !== null) setStyle(flyoutStyle(anchor.current, up, end))
    }
    update()
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      document.removeEventListener('scroll', update, true)
    }
  }, [open, anchor, up, end])

  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div ref={menuRef} className={`${className} is-float`} style={style} onClick={onClick}>
      {children}
    </div>,
    document.body,
  )
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
      <MenuPopup
        open={menu.open}
        anchor={menu.root}
        menuRef={menu.menu}
        up={up}
        end={up}
        className={`dsh-st-select-menu${pill === true ? ' is-composer' : ''}${up === true ? ' is-up' : ''}${up === true ? ' is-end' : ''}`}
      >
        {options.map(item => (
          <MenuRow
            key={item.value}
            icon={item.icon}
            label={item.label}
            active={item.value === value}
            onClick={() => { onChange(item.value); menu.setOpen(false) }}
          />
        ))}
      </MenuPopup>
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
      <MenuPopup
        open={menu.open}
        anchor={menu.root}
        menuRef={menu.menu}
        up={up}
        className={`dsh-st-select-menu is-composer${up === true ? ' is-up' : ''}`}
        onClick={() => { if (persist !== true) menu.setOpen(false) }}
      >
        {children}
      </MenuPopup>
    </div>
  )
}

export function useMenuState(): ReturnType<typeof useMenuOpen> {
  return useMenuOpen()
}