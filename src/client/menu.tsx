import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface MenuOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly icon?: ReactNode
}

function useFloatingMenu(): {
  readonly open: boolean
  readonly setOpen: (value: boolean | ((current: boolean) => boolean)) => void
  readonly root: React.RefObject<HTMLDivElement>
  readonly style: { top: number; left: number; minWidth: number }
} {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({ top: 0, left: 0, minWidth: 168 })

  useLayoutEffect(() => {
    if (!open || root.current === null) return
    const place = (): void => {
      const rect = root.current?.getBoundingClientRect()
      if (rect === undefined) return
      const minWidth = Math.max(196, rect.width)
      const estimatedHeight = 220
      const openUp = rect.top > window.innerHeight - rect.bottom && rect.top > estimatedHeight
      const top = openUp ? Math.max(8, rect.top - estimatedHeight - 6) : rect.bottom + 6
      let left = rect.left
      if (left + minWidth > window.innerWidth - 8) left = window.innerWidth - minWidth - 8
      if (left < 8) left = 8
      setStyle({ top, left, minWidth })
    }
    place()
    window.addEventListener('resize', place)
    document.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      document.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      const target = event.target as Node
      if (root.current?.contains(target)) return
      if (target instanceof Element && target.closest('.dsh-st-select-menu') !== null) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [open])

  return { open, setOpen, root, style }
}

function FloatingPanel({
  style,
  children,
}: {
  readonly style: { top: number; left: number; minWidth: number }
  readonly children: ReactNode
}): JSX.Element {
  return createPortal(
    <div
      className="dsh-st-select-menu is-float"
      style={{ top: style.top, left: style.left, minWidth: style.minWidth }}
      onMouseDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
    >
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
  onClick,
}: {
  readonly icon?: ReactNode
  readonly label: ReactNode
  readonly hint?: ReactNode
  readonly active?: boolean
  readonly chevron?: boolean
  readonly onClick: () => void
}): JSX.Element {
  return (
    <button type="button" className={`dsh-st-menu-row${active === true ? ' is-on' : ''}`} onClick={onClick}>
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
  icon,
}: {
  readonly value: T
  readonly options: readonly MenuOption<T>[]
  readonly onChange: (value: T) => void
  readonly wide?: boolean
  readonly pill?: boolean
  readonly icon?: ReactNode
}): JSX.Element {
  const menu = useFloatingMenu()
  const current = options.find(item => item.value === value)?.label ?? value
  return (
    <div className={`dsh-st-select${wide === true ? ' is-wide' : ''}${pill === true ? ' is-pill' : ''}`} ref={menu.root}>
      <button type="button" className="dsh-st-select-btn" onClick={() => menu.setOpen(value => !value)}>
        {icon}
        <span>{current}</span>
        <em />
      </button>
      {menu.open && (
        <FloatingPanel style={menu.style}>
          {options.map(item => (
            <MenuRow
              key={item.value}
              icon={item.icon}
              label={item.label}
              active={item.value === value}
              onClick={() => { onChange(item.value); menu.setOpen(false) }}
            />
          ))}
        </FloatingPanel>
      )}
    </div>
  )
}

export function MenuPanel({
  label,
  children,
  ghost,
}: {
  readonly label: ReactNode
  readonly children: ReactNode
  readonly ghost?: boolean
}): JSX.Element {
  const menu = useFloatingMenu()
  return (
    <div className={`dsh-st-select${ghost === true ? ' is-pill' : ''}`} ref={menu.root}>
      <button type="button" className="dsh-st-chip-btn" onClick={() => menu.setOpen(value => !value)}>
        {label}
        {ghost === true && <em />}
      </button>
      {menu.open && (
        <FloatingPanel style={menu.style}>
          <div onClick={() => menu.setOpen(false)}>{children}</div>
        </FloatingPanel>
      )}
    </div>
  )
}

export function useMenuState(): ReturnType<typeof useFloatingMenu> {
  return useFloatingMenu()
}

export function MenuSurface({
  style,
  children,
}: {
  readonly style: { top: number; left: number; minWidth: number }
  readonly children: ReactNode
}): JSX.Element {
  return <FloatingPanel style={style}>{children}</FloatingPanel>
}
