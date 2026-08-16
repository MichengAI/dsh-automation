import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MenuOption<T extends string> {
  readonly value: T
  readonly label: string
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
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [open])
  const current = options.find(item => item.value === value)?.label ?? value
  return (
    <div className={`dsh-st-select${wide === true ? ' is-wide' : ''}${pill === true ? ' is-pill' : ''}`} ref={root}>
      <button type="button" className="dsh-st-select-btn" onClick={() => setOpen(value => !value)}>
        {icon}
        <span>{current}</span>
        <em />
      </button>
      {open && (
        <div className="dsh-st-select-menu">
          {options.map(item => (
            <button
              key={item.value}
              type="button"
              className={item.value === value ? 'is-on' : ''}
              onClick={() => { onChange(item.value); setOpen(false) }}
            >
              {item.label}
            </button>
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
}: {
  readonly label: ReactNode
  readonly children: ReactNode
  readonly ghost?: boolean
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [open])
  return (
    <div className={`dsh-st-select${ghost === true ? ' is-pill' : ''}`} ref={root}>
      <button type="button" className="dsh-st-chip-btn" onClick={() => setOpen(value => !value)}>
        {label}
        {ghost === true && <em />}
      </button>
      {open && <div className="dsh-st-select-menu">{children}</div>}
    </div>
  )
}
