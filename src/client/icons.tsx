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
  return <FillIcon {...props}><path fill='currentColor' d='M14.478 4.841 14.214 10.115c-.104 2.072-.147 2.896-.827 3.846a3.53 3.53 0 0 1-1.044.993c-.519.333-1.101.478-1.784.546-.671.067-1.509.066-2.559.066s-1.887.001-2.558-.066c-.683-.068-1.266-.213-1.784-.546a3.53 3.53 0 0 1-1.044-.993c-.681-.95-.724-1.774-.828-3.846L1.522 4.841l1.368-.068.263 5.273c.109 2.176.171 2.556.573 3.117a2.16 2.16 0 0 0 .673.64c.263.169.603.277 1.179.334.587.059 1.345.06 2.422.06s1.834-.001 2.422-.06c.575-.057.916-.165 1.179-.335.262-.168.49-.386.672-.64.402-.56.464-.94.573-3.116l.263-5.273 1.369.068ZM5.43 6.228h1.37v5.163H5.43V6.228Zm3.77 0h1.37v5.163H9.2V6.228ZM8.536.434c.644 0 1.116-.007 1.56.137.14.045.276.101.406.168.416.212.745.552 1.2 1.007l.796.795h2.876v1.37H.626V2.541h2.876l.796-.795c.456-.455.784-.795 1.2-1.007.13-.067.266-.123.405-.168C6.348.427 6.82.434 7.464.434h1.072Zm-1.072 1.37c-.732 0-.948.008-1.138.07a2.2 2.2 0 0 0-.206.085c-.156.08-.296.204-.678.583h5.117c-.382-.379-.522-.503-.679-.583a2.2 2.2 0 0 0-.205-.085c-.191-.062-.406-.07-1.138-.07H7.464Z' /></FillIcon>
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

function FillIcon({ children, width = 16, height = 16 }: IconProps & { children: JSX.Element | JSX.Element[] }): JSX.Element {
  return <svg viewBox='0 0 16 16' width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>{children}</svg>
}

export function FolderClosedIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' d='M6.556 3.377 6.007 3.725l.549-.348ZM14.5 12.342h.65V6.397h-.65-.65v5.945h.65Zm-1.674-7.618v-.65H8.023v.65h4.803Zm-5.746-.519.55-.347-.525-.828-.549.348-.549.348.525.828.55-.348ZM5.613 2.858h0H3.174v.65h2.439v-.65ZM3 4.532v8.46h.65V4.532H3Zm11.326 9.484v-.65H4.674v.65h9.652ZM3 12.342h-.65A2.324 2.324 0 0 0 4.674 14.666v-1.3A.824.824 0 0 1 3.65 12.342H3Zm.174-9.484h0A2.324 2.324 0 0 0 2.35 4.532h1.3A.824.824 0 0 1 4.674 3.508h0V2.858Zm3.382.519.549-.348A1.824 1.824 0 0 0 5.613 2.208v1.3c.16 0 .308.082.394.217l.549-.348Zm1.467 1.347h0c-.16 0-.308-.082-.393-.216l-.55.347-.549.348A1.824 1.824 0 0 0 8.023 5.374v-1.3ZM14.5 6.397h.65A2.324 2.324 0 0 0 12.826 4.073v1.3c.565 0 1.024.458 1.024 1.024h.65Zm0 5.945h-.65c0 .565-.458 1.024-1.024 1.024v1.3A2.324 2.324 0 0 0 15.15 12.342h-.65Z' /></FillIcon>
}

export function FolderOpenIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' d='M5.196 1.571c.615 0 1.19.308 1.532.819l.471.708c.086.128.23.205.383.205h4.588A2.666 2.666 0 0 1 14.586 5.72v.907c.683.4 1.074 1.223.852 2.06l-1.053 3.971A2.666 2.666 0 0 1 12.05 14.453H2.917A2.416 2.416 0 0 1 .502 11.952V3.987A2.416 2.416 0 0 1 2.918 1.571h2.278Zm-1.417 6.185c-.469 0-.88.316-1.001.77l-.862 3.247c-.174.657.322 1.301 1.001 1.301H12.05c.469 0 .88-.316 1.001-.77l1.053-3.97c.078-.291-.142-.577-.444-.577H3.779Zm-.861-4.804c-.572 0-1.035.464-1.035 1.035v3.307a2.67 2.67 0 0 1 1.896-.919h9.426V5.72c0-.572-.464-1.035-1.035-1.035H7.582c-.615 0-1.19-.309-1.531-.82L5.579 3.156a.666.666 0 0 0-.383-.204H2.918Z' /></FillIcon>
}

export function ChevronIcon(props: IconProps): JSX.Element {
  return <svg viewBox='0 0 14 14' width={props.width || 14} height={props.height || 14} fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><path fill='currentColor' d='M4.25 2.828v8.344c0 .49.592.735.939.389l4.172-4.172a.55.55 0 0 0 0-.778L5.189 2.439c-.347-.347-.939-.101-.939.389Z' /></svg>
}

export function EllipsisIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' d='M4.55146 8.00001C4.55146 8.63513 4.03659 9.15001 3.40146 9.15001C2.76634 9.15001 2.25146 8.63513 2.25146 8.00001C2.25146 7.36488 2.76634 6.85001 3.40146 6.85001C4.03659 6.85001 4.55146 7.36488 4.55146 8.00001Z' /><path fill='currentColor' d='M9.1476 8.00001C9.1476 8.63513 8.63273 9.15001 7.9976 9.15001C7.36248 9.15001 6.8476 8.63513 6.8476 8.00001C6.8476 7.36488 7.36248 6.85001 7.9976 6.85001C8.63273 6.85001 9.1476 7.36488 9.1476 8.00001Z' /><path fill='currentColor' d='M13.7486 8.00001C13.7486 8.63513 13.2338 9.15001 12.5986 9.15001C11.9635 9.15001 11.4486 8.63513 11.4486 8.00001C11.4486 7.36488 11.9635 6.85001 12.5986 6.85001C13.2338 6.85001 13.7486 7.36488 13.7486 8.00001Z' /></FillIcon>
}

export function PencilIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' d='M9.941 1.349a2.54 2.54 0 0 1 2.473 0c.292.171.555.442.897.784.341.341.612.604.783.896a2.54 2.54 0 0 1 0 2.473c-.171.292-.442.555-.784.896L6.659 13.05c-.378.378-.652.661-.994.86-.341.199-.722.298-1.238.44l-1.183.326c-.469.13-.899.25-1.243.292-.349.043-.821.033-1.19-.336-.369-.369-.379-.841-.336-1.19.042-.344.163-.774.292-1.243l.326-1.183c.143-.516.242-.897.44-1.238.199-.342.482-.615.86-.994l6.652-6.651c.341-.342.604-.613.896-.784Zm1.759 1.222a1.16 1.16 0 0 0-1.045 0c-.095.056-.206.158-.61.562L9.456 3.721l2.265 2.265.589-.588c.404-.403.507-.515.562-.61a1.16 1.16 0 0 0 0-1.045c-.056-.095-.158-.206-.562-.61-.404-.404-.515-.507-.61-.562ZM3.394 9.784c-.429.429-.551.56-.637.706-.085.147-.138.318-.3.903l-.326 1.183c-.129.468-.209.766-.242.978.212-.033.51-.112.979-.241l1.183-.327c.585-.161.756-.214.902-.3.147-.085.277-.208.706-.636l5.062-5.063-2.265-2.265-5.062 5.062Z' /></FillIcon>
}

export function BranchIcon(props: IconProps): JSX.Element {
  return <FillIcon {...props}><path fill='currentColor' fillRule='evenodd' clipRule='evenodd' d='M13.076 1.372c1.008 0 1.826.819 1.826 1.827s-.818 1.826-1.826 1.826c-.78 0-1.444-.488-1.706-1.175H4.355c.439.415.804.915 1.062 1.485l1.69 3.733a4.83 4.83 0 0 0 4.312 2.97c.29-.626.923-1.061 1.658-1.061 1.008 0 1.826.818 1.826 1.826s-.818 1.826-1.826 1.826c-.823 0-1.519-.545-1.747-1.293a6.34 6.34 0 0 1-5.406-3.731L4.232 5.871A3.83 3.83 0 0 0 1.098 3.85V2.549h10.272c.263-.687.927-1.177 1.706-1.177Zm0 10.904a.525.525 0 1 0 0 1.052.525.525 0 0 0 0-1.052Zm0-9.603a.526.526 0 1 0 0 1.053.526.526 0 0 0 0-1.053Z' /></FillIcon>
}

export function ArchiveIcon(props: IconProps): JSX.Element {
  return <svg viewBox='0 0 20 20' width={props.width || 16} height={props.height || 16} fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><path fill='currentColor' fillRule='evenodd' clipRule='evenodd' d='M15.866 2.06a2.526 2.526 0 0 1 2.525 2.525v.902c0 .54-.172 1.04-.461 1.45l.009.085v5.866c0 .746 0 1.35-.039 1.837-.035.434-.106.825-.262 1.189l-.072.154a3.03 3.03 0 0 1-1.262 1.366l-.236.132c-.408.208-.848.294-1.344.334-.488.04-1.091.04-1.837.04H7.111c-.746 0-1.35 0-1.837-.04-.434-.035-.825-.105-1.189-.261l-.154-.073a3.03 3.03 0 0 1-1.366-1.262l-.132-.235a2.53 2.53 0 0 1-.335-1.344c-.04-.487-.039-1.091-.039-1.837V7.022c0-.029.005-.057.008-.086A2.48 2.48 0 0 1 1.609 5.487v-.902A2.526 2.526 0 0 1 4.134 2.06h11.732Zm.632 5.87a2.48 2.48 0 0 1-.632.083H4.134a2.48 2.48 0 0 1-.634-.083v4.959c0 .77 0 1.304.034 1.72.034.406.095.635.182.806l.076.137c.191.311.465.565.792.731l.141.061c.156.055.361.096.666.121.415.034.95.035 1.72.035h5.775c.77 0 1.305 0 1.72-.035.407-.033.636-.095.807-.182l.138-.077c.311-.191.565-.464.731-.791l.06-.142c.056-.155.097-.36.122-.665.034-.415.034-.95.034-1.72V7.93ZM4.134 3.5a1.086 1.086 0 0 0-1.085 1.085v.902c0 .599.486 1.085 1.085 1.085h11.732c.599 0 1.085-.486 1.085-1.085v-.902A1.086 1.086 0 0 0 15.866 3.5H4.134Z' /><path fill='currentColor' d='M12.796 12.566v-1.483H7.205v1.483h5.591Z' /></svg>
}
