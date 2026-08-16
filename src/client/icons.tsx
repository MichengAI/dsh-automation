import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconFrame({ children, ...props }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function AutomationIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><circle cx="12" cy="12" r="8.25" /><path d="M12 7.7v4.7l3.15 1.85" /><path d="M5.6 4.9 4.2 6.3M18.4 4.9l1.4 1.4" /></IconFrame>
}

export function PlusIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M12 5v14M5 12h14" /></IconFrame>
}

export function RefreshIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M19 7v5h-5" /><path d="M18.1 15.5A7.5 7.5 0 1 1 19 12" /></IconFrame>
}

export function PlayIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="m9 7 8 5-8 5V7Z" /></IconFrame>
}

export function PauseIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M9 7v10M15 7v10" /></IconFrame>
}

export function TrashIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M5.5 7.5h13M9 7.5V5.7h6v1.8M8 10.5l.5 7h7l.5-7" /></IconFrame>
}

export function ShieldIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M12 3.8 19 6v5.1c0 4.3-2.6 7.4-7 9.1-4.4-1.7-7-4.8-7-9.1V6l7-2.2Z" /><path d="m9.4 12 1.7 1.7 3.7-4" /></IconFrame>
}

export function CalendarIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3.8v3.4M16 3.8v3.4M4 9.5h16" /></IconFrame>
}

export function CheckIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="m5.5 12.5 4 4 9-9" /></IconFrame>
}

export function AlertIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M12 4.2 21 19H3L12 4.2Z" /><path d="M12 9v4.5M12 16.5h.01" /></IconFrame>
}

export function MoreIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></IconFrame>
}

export function InfoIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><circle cx="12" cy="12" r="8.25" /><path d="M12 10.4V16" /><path d="M12 7.6h.01" /></IconFrame>
}

export function ClockIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><circle cx="12" cy="12" r="8.25" /><path d="M12 7.6v4.6l3 1.8" /></IconFrame>
}

export function ChatIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M5.5 6.5h13v9.2H9.2L5.5 18.8V6.5Z" /></IconFrame>
}

export function FolderIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M4 7.2h6.1l1.7 1.8H20V18H4V7.2Z" /></IconFrame>
}

export function SparkleIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M12 3.6 13.3 8.7 18.4 10 13.3 11.3 12 16.4 10.7 11.3 5.6 10 10.7 8.7 12 3.6Z" /></IconFrame>
}
