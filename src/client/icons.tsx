import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconFrame({ children, ...props }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function PlusIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M12 5v14M5 12h14" /></IconFrame>
}

export function RefreshIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M19 7v5h-5" /><path d="M18.1 15.5A7.5 7.5 0 1 1 19 12" /></IconFrame>
}

export function ShieldIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M12 3.8 19 6v5.1c0 4.3-2.6 7.4-7 9.1-4.4-1.7-7-4.8-7-9.1V6l7-2.2Z" /><path d="m9.4 12 1.7 1.7 3.7-4" /></IconFrame>
}

export function CalendarIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3.8v3.4M16 3.8v3.4M4 9.5h16" /></IconFrame>
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

export function GithubIcon(props: IconProps): JSX.Element {
  return <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true" focusable="false" {...props}><path fill="currentColor" d="M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z" /></svg>
}

export function FolderIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M4 7.2h6.1l1.7 1.8H20V18H4V7.2Z" /></IconFrame>
}

export function SparkleIcon(props: IconProps): JSX.Element {
  return <IconFrame {...props}><path d="M12 3.6 13.3 8.7 18.4 10 13.3 11.3 12 16.4 10.7 11.3 5.6 10 10.7 8.7 12 3.6Z" /></IconFrame>
}

function FillIcon({ children, width = 16, height = 16 }: IconProps & { children: JSX.Element | JSX.Element[] }): JSX.Element {
  return <svg viewBox='0 0 16 16' width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>{children}</svg>
}

export function UnarchiveOutlineIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' d='M2 6.2h12v7.2H2V6.2Zm1.2 1.2v4.8h9.6V7.4H3.2ZM6.1 9.2h3.8v1.2H6.1V9.2ZM3.4 2.2h9.2L14 4.6H2L3.4 2.2Z' /></FillIcon>
}

export function FolderClosedIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' transform='translate(1.5 2.429)' d='M5.05582 0.518756L4.50669 0.86654L5.05582 0.518756ZM13 9.4837L13.65 9.4837L13.65 3.53962L13 3.53962L12.35 3.53962L12.35 9.4837L13 9.4837ZM11.3264 1.86603L11.3264 1.21603L6.52313 1.21603L6.52313 1.86603L6.52313 2.51603L11.3264 2.51603L11.3264 1.86603ZM5.58054 1.34727L6.12968 0.999489L5.60495 0.170972L5.05582 0.518756L4.50669 0.86654L5.03141 1.69506L5.58054 1.34727ZM4.11323 1.23058e-13L4.11323 -0.65L1.67359 -0.65L1.67359 5.00699e-14L1.67359 0.65L4.11323 0.65L4.11323 1.23058e-13ZM0 1.67359L-0.65 1.67359L-0.65 9.4837L0 9.4837L0.65 9.4837L0.65 1.67359L0 1.67359ZM11.3264 11.1573L11.3264 10.5073L1.67359 10.5073L1.67359 11.1573L1.67359 11.8073L11.3264 11.8073L11.3264 11.1573ZM0 9.4837L-0.65 9.4837C-0.65 10.767 0.390308 11.8073 1.67359 11.8073L1.67359 11.1573L1.67359 10.5073C1.10828 10.5073 0.65 10.049 0.65 9.4837L0 9.4837ZM1.67359 5.00699e-14L1.67359 -0.65C0.390307 -0.65 -0.65 0.390309 -0.65 1.67359L0 1.67359L0.65 1.67359C0.65 1.10828 1.10828 0.65 1.67359 0.65L1.67359 5.00699e-14ZM5.05582 0.518756L5.60495 0.170972C5.28121 -0.340193 4.71829 -0.65 4.11323 -0.65L4.11323 1.23058e-13L4.11323 0.65C4.27282 0.65 4.4213 0.731715 4.50669 0.86654L5.05582 0.518756ZM6.52313 1.86603L6.52313 1.21603C6.36354 1.21603 6.21507 1.13431 6.12968 0.999489L5.58054 1.34727L5.03141 1.69506C5.35515 2.20622 5.91808 2.51603 6.52313 2.51603L6.52313 1.86603ZM13 3.53962L13.65 3.53962C13.65 2.25634 12.6097 1.21603 11.3264 1.21603L11.3264 1.86603L11.3264 2.51603C11.8917 2.51603 12.35 2.97431 12.35 3.53962L13 3.53962ZM13 9.4837L12.35 9.4837C12.35 10.049 11.8917 10.5073 11.3264 10.5073L11.3264 11.1573L11.3264 11.8073C12.6097 11.8073 13.65 10.767 13.65 9.4837L13 9.4837Z' /></FillIcon>
}

export function FolderOpenIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' d='M5.19629 1.57104C5.81144 1.5711 6.38623 1.8786 6.72754 2.39038L7.19922 3.09839C7.28454 3.22635 7.42824 3.30344 7.58203 3.30347H12.1699C13.5039 3.30348 14.5859 4.38548 14.5859 5.71948V6.62671C15.2694 7.02689 15.6605 7.85012 15.4385 8.68726L14.3848 12.658C14.1037 13.7164 13.1449 14.4527 12.0498 14.4529H2.91699C1.51651 14.4529 0.451662 13.2814 0.501954 11.9519V3.98706C0.501954 2.65305 1.58396 1.57104 2.91797 1.57104H5.19629ZM3.7793 7.75562C3.30994 7.75562 2.89883 8.07153 2.77832 8.52515L1.91602 11.7722C1.74167 12.4291 2.23734 13.073 2.91699 13.073H12.0498C12.5191 13.0728 12.9304 12.757 13.0508 12.3035L14.1045 8.33374C14.1819 8.04202 13.9619 7.756 13.6602 7.75562H3.7793ZM2.91797 2.9519C2.34625 2.9519 1.88281 3.41534 1.88281 3.98706V7.2937C2.33068 6.7269 3.02249 6.37476 3.7793 6.37476H13.2051V5.71948C13.2051 5.14777 12.7416 4.68434 12.1699 4.68433H7.58203C6.96675 4.6843 6.39209 4.37595 6.05078 3.86401L5.5791 3.15601C5.49379 3.02821 5.34995 2.95196 5.19629 2.9519H2.91797Z' /><path fill='currentColor' opacity='0.2' d='M13.6602 7.75525C13.9618 7.7556 14.1815 8.04179 14.1045 8.33337L13.0508 12.3031C12.9304 12.7567 12.5191 13.0725 12.0498 13.0726H2.91701C2.23744 13.0725 1.7417 12.4287 1.91603 11.7719L2.77834 8.52478C2.89898 8.07146 3.31018 7.75532 3.77931 7.75525H13.6602ZM5.1963 2.95154C5.34985 2.95159 5.49377 3.02803 5.57912 3.15564L6.0508 3.86365C6.39205 4.37553 6.96685 4.68385 7.58205 4.68396H12.1699C12.7416 4.68396 13.2049 5.14754 13.2051 5.71912V6.37439H3.77931C3.02267 6.37444 2.33067 6.72671 1.88283 7.29333V3.98669C1.88299 3.4152 2.34649 2.95168 2.91798 2.95154H5.1963Z' /></FillIcon>
}

export function ChevronIcon(props: IconProps): JSX.Element {
  return <svg viewBox='0 0 14 14' width={props.width || 14} height={props.height || 14} fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' {...props}><path fill='currentColor' d='M4.25 2.828v8.344c0 .49.592.735.939.389l4.172-4.172a.55.55 0 0 0 0-.778L5.189 2.439c-.347-.347-.939-.101-.939.389Z' /></svg>
}

const RUNNING_CELLS: readonly (readonly [number, number])[] = [
  [0, 0], [4, 0], [8, 0], [8, 4], [8, 8], [4, 8], [0, 8], [0, 4],
]

/** 复刻官方任务树 running StateDot：3x3 像素绕圈。 */
export function RunningStateDot(): JSX.Element {
  return (
    <svg className="dsh-st-run-dot" width={10} height={10} viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
      {RUNNING_CELLS.map(([x, y], index) => (
        <rect
          key={`${x}-${y}`}
          className="dsh-st-run-dot-cell"
          x={x}
          y={y}
          width="2"
          height="2"
          style={{ animationDelay: `${(index - RUNNING_CELLS.length) * 125}ms` }}
        />
      ))}
    </svg>
  )
}
