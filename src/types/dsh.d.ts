/** Host 运行时由 DSH 提供的最小编译期声明。 */

declare module '@deepseek-ai/cordis' {
  export interface Context {
    readonly agents: any
    readonly agentDefaultModel: any
    readonly agentPresets: any
    readonly permissionPresets: import('../permission-presets.ts').PermissionPresetService
    readonly sessions: any
    readonly sessionTitle?: { rename(session: unknown, title: string): unknown }
    readonly workspaceRegistry: any
    readonly storageDomain: any
    readonly connection: any
    readonly tools: any
    readonly llm?: any
    readonly systemPrompt?: { section(input: { name: string; order: number; text: string }): () => void }
    readonly logger: { warn(message: string): void }
    effect<T>(factory: () => T | Promise<T>, label?: string): T
    on(name: string, listener: (...args: any[]) => any): () => void
    get(name: string): unknown
  }
}

declare module '@deepseek-ai/schemastery' {
  const z: any
  export default z
}

declare module '@deepseek-ai/dsh-agent' {
  export interface ModelSelection {
    provider: string
    model: string
    reasoningEffort?: string
  }
  export function installModelSelection(agentCtx: unknown, selection: {
    current: ModelSelection | undefined
    assembled: ModelSelection | undefined
  }): () => void
}

declare module '@deepseek-ai/dsh-agent-default-model' {}
declare module '@deepseek-ai/dsh-agent-presets' {}
declare module '@deepseek-ai/dsh-permission-presets' {}
declare module '@deepseek-ai/dsh-client-connection' {}

declare module '@deepseek-ai/dsh-llm' {
  export function createUserMessage(value: {
    content: readonly { type: 'text'; text: string }[]
    source: unknown
  }): unknown
}

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ReactNode } from 'react'
  export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'toolbar'
  export type MenuEntry =
    | { readonly id: string; readonly label: ReactNode; readonly icon?: ReactNode; readonly danger?: boolean; readonly disabled?: boolean }
    | { readonly id: string; readonly type: 'separator' }
    | { readonly id: string; readonly type: 'label'; readonly text: string }
  export function Button(props: {
    readonly variant?: ButtonVariant | string | undefined
    readonly size?: 'md' | 'sm' | string | undefined
    readonly icon?: ReactNode
    readonly className?: string | undefined
    readonly disabled?: boolean | undefined
    readonly onClick?: ((event?: any) => void) | undefined
    readonly children?: ReactNode
  } & ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element
  export function Input(props: {
    readonly icon?: ReactNode
    readonly className?: string | undefined
  } & import('react').InputHTMLAttributes<HTMLInputElement>): JSX.Element
  export function SegmentedControl<Value extends string>(props: {
    readonly id: string
    readonly value: Value
    readonly options: readonly { readonly value: Value; readonly label: string; readonly disabled?: boolean; readonly title?: string }[]
    readonly onChange: (next: Value) => void
    readonly label: string
    readonly disabled?: boolean
    readonly className?: string | undefined
  }): JSX.Element
  export function Checkbox(props: {
    readonly checked: boolean
    readonly onChange: (next: boolean) => void
    readonly label: string
    readonly disabled?: boolean
    readonly title?: string
    readonly className?: string
  }): JSX.Element
  export function Switch(props: {
    readonly checked: boolean
    readonly onChange: (next: boolean) => void
    readonly label: string
    readonly disabled?: boolean | undefined
    readonly title?: string | undefined
    readonly className?: string | undefined
  }): JSX.Element
  export function HoverCard(props: { readonly anchor: ReactNode; readonly content: ReactNode; readonly openDelayMs?: number; readonly disabled?: boolean; readonly copyText?: string; readonly copyLabel?: string; readonly copiedLabel?: string }): JSX.Element
  export function Tooltip(props: { readonly label: ReactNode; readonly children: ReactNode; readonly side?: 'top' | 'bottom' | 'left' | 'right' | string; readonly align?: 'center' | 'end'; readonly portal?: boolean; readonly delayMs?: number; readonly disabled?: boolean; readonly shortcutKeys?: readonly string[] }): JSX.Element
  export function StateDot(props: { readonly state: 'done' | 'warning' | 'ongoing' | 'error' | 'idle'; readonly size?: number }): JSX.Element
  export function Tag(props: { readonly tone?: 'info' | 'success' | 'warning' | 'error' | string; readonly children: ReactNode; readonly className?: string }): JSX.Element
  export function Menu(props: { readonly open: boolean; readonly onClose: () => void; readonly items?: readonly MenuEntry[]; readonly footer?: readonly MenuEntry[]; readonly children?: ReactNode; readonly onSelect: (id: string) => void; readonly anchor: ReactNode; readonly portal?: boolean; readonly dense?: boolean; readonly compact?: boolean; readonly closeOnPointerLeave?: boolean; readonly selectedId?: string; readonly selectedIds?: readonly string[]; readonly align?: 'start' | 'end'; readonly listClassName?: string }): JSX.Element
  export function Modal(props: { readonly open: boolean; readonly onClose: () => void; readonly closeLabel: string; readonly title: string; readonly footer?: ReactNode; readonly children?: ReactNode; readonly className?: string; readonly description?: string }): JSX.Element
  export function RiskConfirmation(props: {
    readonly open: boolean
    readonly title: string
    readonly description: string
    readonly acknowledgeLabel: string
    readonly cancelLabel: string
    readonly closeLabel: string
    readonly confirmLabel: string
    readonly acknowledged: boolean
    readonly disabled?: boolean
    readonly onAcknowledgedChange: (acknowledged: boolean) => void
    readonly onCancel: () => void
    readonly onConfirm: () => void
  }): JSX.Element
}

declare module '@deepseek-ai/dsh-session' {
  export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
  export type SessionId = string & { readonly __sessionId: unique symbol }
  export function SessionId(value: string): SessionId
}

declare module '@deepseek-ai/dsh-user-approval' {
  export function setApprovalPolicy(session: unknown, policy: 'ask' | 'never'): void
}

declare module '@deepseek-ai/dsh-workspace' {
  export type WorkspaceId = string & { readonly __workspaceId: unique symbol }
  export function WorkspaceId(value: string): WorkspaceId
}

declare module '@deepseek-ai/dsh-storage-domain' {
  import type { ZodType } from 'zod'
  export interface DomainSpec {
    readonly name: string
    readonly version: number
    readonly tables: Record<string, { readonly valueSchema: ZodType }>
  }
  export function defineDomain<S extends DomainSpec>(spec: S): S
  export function domainTable<K extends string, V>(schema: ZodType<V>): {
    readonly valueSchema: ZodType<V>
    readonly __key?: K
  }
  export interface KvTable<K extends string, V> {
    get(key: K): V | undefined
    entries(): IterableIterator<[K, V]>
    keys(): IterableIterator<K>
    readonly size: number
    put(key: K, value: V): Promise<void>
    delete(key: K): Promise<boolean>
    update(key: K, transform: (current: V) => V): Promise<V>
  }
  export interface Domain<S> {
    readonly name: string
    readonly table(name: string): KvTable<string, any>
    close(): Promise<void>
  }
}

declare module '@deepseek-ai/dsh-tools' {
  import type { JsonValue } from '@deepseek-ai/dsh-session'
  export type { JsonValue } from '@deepseek-ai/dsh-session'
  export interface ToolRunContext {
    readonly signal: AbortSignal
    readonly agent?: { readonly id: string }
  }
  export interface ToolExecution {
    readonly name: string
    readonly arguments: unknown
  }
  export function defineTool(definition: any): any
}


declare module "react-dom" {
  import type { ReactNode, ReactPortal } from "react"
  export function createPortal(children: ReactNode, container: Element | DocumentFragment): ReactPortal
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react'

  export function createRoot(container: Element): {
    render(node: ReactNode): void
  }
}
