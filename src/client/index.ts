import { createElement, useEffect, type ComponentType } from 'react'
import { AutomationView } from './AutomationView.js'
import type { ClientContext, NativeSwitcherProps } from './contracts.js'
import { en, NS, zh } from './locales.js'
import {
  attachNativeTabRegistry,
  createNativeTabRegistry,
  findNativeTabRegistry,
  isForeignSidebarHost,
} from './native-tabs.js'
import { applyPrefillToDom, peekChatPrefill, subscribeChatPrefill, takeChatPrefill } from './prefill.js'
import { createAutomationRuntime } from './runtime.js'
import { NativeScheduleSessionList } from './native-session-list.js'
import { NativeScheduleShell, ScheduleRail } from './ScheduleRail.js'
import { AUTOMATION_SESSION_PREFIX, hasCodexUiSidebar, pickWrappableWorkspacesEntry, resolveOfficialTreeComponent } from './schedule-rail-model.js'
import { installStyles } from './styles.js'

export const name = 'dsh-automation-client'
export const inject = ['slots', 'locale', 'connection', 'sessions']

type MutableSlotEntry = {
  component?: ComponentType<any>
  options?: { id?: unknown }
}

type HostComponent = ComponentType<any> & {
  displayName?: string
  __dshNativeTabHost?: boolean
  __dshAutomationWrapped?: boolean
  __dshAutomationOriginal?: ComponentType<any>
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => installStyles(), 'dsh-automation: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-automation: locale')
  const t = ctx.locale.bind(NS)
  const runtime = createAutomationRuntime(ctx.connection.rpc)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'scheduled-tasks',
    order: 28,
    locale: NS,
    label: () => t('tab'),
  }, function ScheduledTasksSettings(props: { close?: () => void }) {
    return createElement(AutomationView, { t, runtime, ...(props.close === undefined ? {} : { closeSettings: props.close }) })
  }))
  ctx.slots.inject('sidebar.schedule', () => ctx.slots.register({
    name: 'sidebar.schedule',
    id: 'dsh-automation-schedule',
    order: 10,
    locale: NS,
    label: () => t('sidebar.tab'),
  }, function AutomationScheduleRail(props: { openSession?: (sessionId: string) => void }) {
    return createElement(ScheduleRail, {
      t,
      runtime,
      ...(props.openSession === undefined ? {} : { openSession: props.openSession }),
    })
  }))
  ctx.slots.inject('sidebar.workspaces', () => {
    let wrappedEntry: MutableSlotEntry | undefined
    let originalComp: ComponentType<any> | undefined
    let removeInsertedTab = (): void => undefined
    let removeFilter = (): void => undefined
    let syncing = false
    const unwrap = (): void => {
      removeInsertedTab()
      removeInsertedTab = (): void => undefined
      removeFilter()
      removeFilter = (): void => undefined
      if (wrappedEntry !== undefined && originalComp !== undefined) {
        try { wrappedEntry.component = originalComp } catch { /* ignore */ }
      }
      wrappedEntry = undefined
      originalComp = undefined
    }
    const insertScheduleTab = (entry: unknown, openSession?: (id: string) => void): boolean => {
      const registry = findNativeTabRegistry(entry)
      if (registry === undefined) return false
      if (registry.getTabs().some(item => item.id === 'schedule')) return true
      removeInsertedTab()
      removeInsertedTab = registry.insert({
        id: 'schedule',
        label: t('sidebar.tab'),
        order: 30,
        matchSession: (sessionId) => sessionId.startsWith(AUTOMATION_SESSION_PREFIX),
        render: (props) => {
          const opener = typeof props.openSession === 'function'
            ? props.openSession as (id: string) => void
            : typeof props.open === 'function'
              ? props.open as (id: string) => void
              : openSession
          return createElement(NativeScheduleSessionList, {
            t,
            runtime,
            ...(opener === undefined ? {} : { openSession: opener }),
            ...(typeof props.useSessions === 'function' ? { useSessions: props.useSessions as any } : {}),
            ...(typeof props.useWorkspaces === 'function' ? { useWorkspaces: props.useWorkspaces as any } : {}),
            ...(typeof props.renameSession === 'function' ? { renameSession: props.renameSession as any } : {}),
            ...(typeof props.archiveSession === 'function' ? { archiveSession: props.archiveSession as any } : {}),
            ...(typeof props.deleteSession === 'function' ? { deleteSession: props.deleteSession as any } : {}),
            ...(typeof props.forkSession === 'function' ? { forkSession: props.forkSession as any } : {}),
          })
        },
      })
      removeFilter()
      removeFilter = registry.addSessionFilter(id => !id.startsWith(AUTOMATION_SESSION_PREFIX))
      return true
    }
    const sync = (): void => {
      if (syncing) return
      syncing = true
      try {
        if (hasCodexUiSidebar(readSlotEntries(ctx, 'sidebar'))) {
          unwrap()
          return
        }
        const entries = readSlotEntries(ctx, 'sidebar.workspaces')
        const occupant = pickWrappableWorkspacesEntry(entries) as MutableSlotEntry | undefined
        const current = occupant?.component
        if (current !== undefined && isForeignSidebarHost(current)) {
          if (insertScheduleTab(occupant) || insertScheduleTab(current)) return
          return
        }
        if (wrappedEntry?.component !== undefined && (wrappedEntry.component as HostComponent).__dshAutomationWrapped === true) {
          insertScheduleTab(wrappedEntry)
          return
        }
        if (occupant?.component === undefined) return
        const resolved = resolveOfficialTreeComponent(occupant.component)
        if (resolved === undefined) return
        originalComp = resolved as ComponentType<any>
        const registry = createNativeTabRegistry(originalComp)
        attachNativeTabRegistry(occupant, registry)
        function AutomationNativeWorkspaceShell(innerProps: NativeSwitcherProps): JSX.Element | null {
          const openSession = innerProps.openSession ?? innerProps.open ?? ((id: string) => { ctx.sessions?.open(id) })
          return createElement(NativeScheduleShell, {
            t,
            runtime,
            hostProps: innerProps as Record<string, unknown>,
            openSession,
            tabRegistry: registry,
            ...(innerProps.wide === undefined ? {} : { wide: innerProps.wide }),
            hasChannels: () => slotHasEntries(ctx, 'sidebar.channels'),
            subscribeChannels: (listener: () => void) => ctx.slots.subscribe?.('sidebar.channels', listener) ?? (() => undefined),
            ...(innerProps.useSessions === undefined ? {} : { useSessions: innerProps.useSessions }),
            ...(innerProps.useWorkspaces === undefined ? {} : { useWorkspaces: innerProps.useWorkspaces }),
            ...(innerProps.renderSlot === undefined ? {} : { renderSlot: innerProps.renderSlot }),
            ...(originalComp === undefined ? {} : { officialTree: originalComp }),
          })
        }
        const marked = AutomationNativeWorkspaceShell as HostComponent
        marked.displayName = 'AutomationNativeWorkspaceShell'
        marked.__dshNativeTabHost = true
        marked.__dshAutomationWrapped = true
        marked.__dshAutomationOriginal = originalComp
        attachNativeTabRegistry(marked, registry)
        occupant.component = marked
        wrappedEntry = occupant
        insertScheduleTab(occupant, (id) => { ctx.sessions?.open(id) })
      } catch (error) {
        console.warn('[dsh-automation] 包裹官方任务树失败', error)
      } finally {
        syncing = false
      }
    }
    sync()
    const unsub = typeof ctx.slots.subscribe === 'function' ? ctx.slots.subscribe('sidebar.workspaces', sync) : () => undefined
    return () => { unsub(); unwrap() }
  })
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'dsh-automation-prefill',
    order: 80,
    locale: NS,
  }, PrefillBridge))
}

function PrefillBridge(props: { inputActions?: { setDraft(text: string): void } }): null {
  useEffect(() => {
    const applyPrefill = (text: string | null): void => {
      if (text === null || text === '') return
      if (props.inputActions !== undefined) {
        props.inputActions.setDraft(text)
        takeChatPrefill()
        return
      }
      if (applyPrefillToDom(text)) takeChatPrefill()
    }
    applyPrefill(peekChatPrefill())
    return subscribeChatPrefill(applyPrefill)
  }, [props.inputActions])
  return null
}

function readSlotEntries(ctx: ClientContext, name: string): readonly unknown[] {
  try {
    const read = ctx.slots.entriesOfSlot ?? ctx.slots.entries
    return read?.call(ctx.slots, name) ?? []
  } catch {
    return []
  }
}

function slotHasEntries(ctx: ClientContext, name: string): boolean {
  return readSlotEntries(ctx, name).length > 0
}
