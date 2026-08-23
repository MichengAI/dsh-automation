import type { ComponentType, ReactNode } from 'react'
import type { AutomationLocaleKey } from './locales.js'
import type { AutomationRuntime } from './runtime.js'
import type { PermissionTranslate } from './permissions.js'

export type Translate = (key: AutomationLocaleKey, params?: Record<string, unknown>) => string
export type ModelTranslate = (key: string, params?: Record<string, unknown>) => string

export interface AutomationViewProps {
  readonly t: Translate
  readonly permissionT: PermissionTranslate
  readonly modelT: ModelTranslate
  readonly runtime: AutomationRuntime
  readonly closeSettings?: () => void
}

export interface ClientRpc {
  call(channel: string, endpoint: string, payload: unknown, signal?: AbortSignal): Promise<unknown>
}

export interface SlotRegisterOptions {
  readonly name: string
  readonly id?: string
  readonly order?: number
  readonly locale?: string
  readonly label?: () => string
  readonly icon?: string
  readonly priority?: number
  readonly children?: Record<string, { readonly kind: string; readonly scope: string }>
  readonly inject?: () => Record<string, unknown>
}

export interface ClientContext {
  effect(factory: () => void | (() => void), label?: string): void
  connection: { readonly rpc: ClientRpc }
  sessions?: {
    open(id: string): void
    refresh?: () => Promise<void>
    list?: {
      getSnapshot(): { ids?: readonly string[]; byId?: Record<string, unknown>; current?: string | null }
    }
  }
  locale: {
    register(
      namespace: string,
      dictionaries: { readonly zh: Record<string, string>; readonly en: Record<string, string> },
    ): () => void
    bind(namespace: string): (key: string, params?: Record<string, unknown>) => string
  }
  slots: {
    inject(name: string, register: () => void | (() => void)): void
    register(options: SlotRegisterOptions, component: ComponentType<any>): () => void
    entries?(name: string): readonly unknown[]
    entriesOfSlot?(name: string): readonly unknown[]
    subscribe?(name: string, listener: () => void): () => void
  }
}

export interface NativeSwitcherProps {
  readonly wide?: boolean
  readonly openSession?: (sessionId: string) => void
  readonly open?: (sessionId: string) => void
  readonly useSessions?: (select: (state: any) => any) => any
  readonly useWorkspaces?: (select: (state: any) => any) => any
  readonly renderSlot?: (name: string, props?: Record<string, unknown>) => ReactNode
}


