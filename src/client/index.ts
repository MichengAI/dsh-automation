import { createElement, useEffect, type ComponentType } from 'react'
import { AutomationView } from './AutomationView.js'
import type { ClientContext, NativeSwitcherProps, SessionSelector, WorkspaceSelector } from './contracts.js'
import { en, NS, zh } from './locales.js'
import {
  attachNativeTabRegistry,
  createNativeTabRegistry,
  findNativeTabRegistry,
  isForeignSidebarHost,
} from './native-tabs.js'
import { applyPrefillToDom, peekChatPrefill, subscribeChatPrefill, takeChatPrefill } from './prefill.js'
import { createAutomationRuntime, installAutomationSessionSync } from './runtime.js'
import { NativeScheduleSessionList } from './native-session-list.js'
import { NativeScheduleShell, ScheduleRail } from './ScheduleRail.js'
import { AUTOMATION_SESSION_PREFIX, ensureOpenScheduledSession, hasCodexUiSidebar, pickWrappableWorkspacesEntry, resolveOfficialTreeComponent } from './schedule-rail-model.js'
import { installStyles } from './styles.js'
import { openSettingsSection } from './settings-navigation.js'
import { requestAutomationTaskSettings, type AutomationTaskSettingsRequest } from './task-settings-request.js'

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

const SETTINGS_CLOCK_SVG = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" data-dsh-schedule-icon="1"><path fill="currentColor" d="M8 1.15A6.85 6.85 0 1 0 8 14.85 6.85 6.85 0 0 0 8 1.15Zm0 1.4a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9Z"/><path fill="currentColor" d="M8.62 4.35H7.28v4.2l3.02 1.78.67-1.13-2.35-1.39V4.35Z"/></svg>'

function isSessionSelector(value: unknown): value is SessionSelector {
  return typeof value === 'function'
}

function isWorkspaceSelector(value: unknown): value is WorkspaceSelector {
  return typeof value === 'function'
}

function installSettingsNavIcon(labels: () => readonly string[]): () => void {
  const wanted = new Set(labels().map(item => item.trim()).filter(item => item !== ''))
  const applyButton = (button: HTMLButtonElement): void => {
    const text = (button.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!wanted.has(text)) return
    const svg = button.querySelector('svg')
    if (svg === null || svg.getAttribute('data-dsh-schedule-icon') === '1') return
    svg.outerHTML = SETTINGS_CLOCK_SVG
  }
  const scan = (root: ParentNode): void => {
    if (root instanceof HTMLButtonElement) applyButton(root)
    for (const button of root.querySelectorAll?.('button') ?? []) applyButton(button as HTMLButtonElement)
  }
  scan(document)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement
      const owner = target?.closest('button')
      if (owner instanceof HTMLButtonElement) applyButton(owner)
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scan(node)
      }
    }
  })
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true })
  return () => { observer.disconnect() }
}
export function apply(ctx: ClientContext): void {
  ctx.effect(() => installStyles(), 'dsh-automation: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-automation: locale')
  const t = ctx.locale.bind(NS)
  const permissionT = ctx.locale.bind('permission.access')
  const modelT = ctx.locale.bind('model')
  const runtime = createAutomationRuntime(ctx.connection.rpc)
  const openTaskSettings = (request: AutomationTaskSettingsRequest): void => {
    requestAutomationTaskSettings(request)
    openSettingsSection(
      [t('tab'), 'Scheduled tasks', '定时任务'],
      () => { requestAutomationTaskSettings(request) },
    )
  }
  ctx.effect(() => installAutomationSessionSync(runtime, () => ctx.sessions), 'dsh-automation: session sync')
  ctx.effect(() => installSettingsNavIcon(() => [t('tab'), 'Scheduled tasks', '定时任务']), 'dsh-automation: settings icon')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'scheduled-tasks',
    order: 28,
    locale: NS,
    label: () => t('tab'),
    icon: 'schedule',
  }, function ScheduledTasksSettings(props: { close?: () => void }) {
    return createElement(AutomationView, { t, permissionT, modelT, runtime, ...(props.close === undefined ? {} : { closeSettings: props.close }) })
  }))
  ctx.slots.inject('sidebar.schedule', () => ctx.slots.register({
    name: 'sidebar.schedule',
    id: 'dsh-automation-schedule',
    order: 10,
    locale: NS,
    label: () => t('sidebar.tab'),
  }, function AutomationScheduleRail(props: { openSession?: (sessionId: string) => void; view?: 'runs' | 'overview'; showViewSwitch?: boolean }) {
    return createElement(ScheduleRail, {
      t,
      runtime,
      openSession: createScheduledSessionOpener(ctx, runtime, props.openSession),
      openTaskSettings,
      ...(props.view === undefined ? {} : { view: props.view }),
      ...(props.showViewSwitch === undefined ? {} : { showViewSwitch: props.showViewSwitch }),
    })
  }))
  ctx.slots.inject('sidebar.workspaces', () => {
    let wrappedEntry: MutableSlotEntry | undefined
    let originalComp: ComponentType<any> | undefined
    let removeInsertedTab = (): void => undefined
    let wrapped = false
    let syncing = false
    let retryTimer: number | undefined
    const listenChannels = (listener: () => void) => ctx.slots.subscribe?.('sidebar.channels', listener) ?? (() => undefined)
    const stopRetry = (): void => {
      if (retryTimer !== undefined) {
        window.clearInterval(retryTimer)
        retryTimer = undefined
      }
    }
    const unwrap = (): void => {
      stopRetry()
      removeInsertedTab()
      removeInsertedTab = (): void => undefined
      if (wrappedEntry !== undefined && originalComp !== undefined) {
        try { wrappedEntry.component = originalComp } catch { /* ignore */ }
      }
      wrappedEntry = undefined
      originalComp = undefined
      wrapped = false
    }
    const insertScheduleTab = (entry: unknown, openSession?: (id: string) => void): boolean => {
      const registry = findNativeTabRegistry(entry)
      if (registry === undefined) return false
      if (registry.getTabs().some(item => item.id === 'schedule')) return true
      removeInsertedTab = registry.insert({
        id: 'schedule',
        label: t('sidebar.tab'),
        order: 30,
        matchSession: (sessionId) => sessionId.startsWith(AUTOMATION_SESSION_PREFIX),
        render: (props) => {
          const hostOpen = typeof props.openSession === 'function'
            ? props.openSession as (id: string) => void
            : typeof props.open === 'function'
              ? props.open as (id: string) => void
              : openSession
          const opener = createScheduledSessionOpener(ctx, runtime, hostOpen)
          return createElement(NativeScheduleSessionList, {
            t,
            runtime,
            openSession: opener,
            ...(isSessionSelector(props.useSessions) ? { useSessions: props.useSessions } : {}),
            ...(isWorkspaceSelector(props.useWorkspaces) ? { useWorkspaces: props.useWorkspaces } : {}),
            ...(typeof props.renameSession === 'function' ? { renameSession: props.renameSession as any } : {}),
            ...(typeof props.archiveSession === 'function' ? { archiveSession: props.archiveSession as any } : {}),
            ...(typeof props.deleteSession === 'function' ? { deleteSession: props.deleteSession as any } : {}),
            ...(typeof props.forkSession === 'function' ? { forkSession: props.forkSession as any } : {}),
            openTaskSettings,
          })
        },
      })
      return true
    }
    const insertIntoKnownHosts = (): boolean => {
      const entries = readSlotEntries(ctx, 'sidebar.workspaces')
      for (const entry of entries) {
        const record = entry as { component?: unknown }
        if (insertScheduleTab(entry) || insertScheduleTab(record.component)) return true
      }
      return wrappedEntry !== undefined && insertScheduleTab(wrappedEntry)
    }
    const ensureScheduleTab = (): void => {
      if (insertIntoKnownHosts()) {
        stopRetry()
        return
      }
      if (retryTimer !== undefined) return
      let tries = 0
      retryTimer = window.setInterval(() => {
        tries += 1
        if (insertIntoKnownHosts() || tries >= 20) stopRetry()
      }, 250)
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
          ensureScheduleTab()
          return
        }
        if (wrappedEntry?.component !== undefined && (wrappedEntry.component as HostComponent).__dshAutomationWrapped === true) {
          ensureScheduleTab()
          return
        }
        if (occupant?.component === undefined || wrapped) return
        const resolved = resolveOfficialTreeComponent(occupant.component)
        if (resolved === undefined) return
        originalComp = resolved as ComponentType<any>
        const registry = createNativeTabRegistry(originalComp)
        attachNativeTabRegistry(occupant, registry)
        function AutomationNativeWorkspaceShell(innerProps: NativeSwitcherProps): JSX.Element | null {
          const openSession = createScheduledSessionOpener(ctx, runtime, innerProps.openSession ?? innerProps.open)
          return createElement(NativeScheduleShell, {
            t,
            runtime,
            hostProps: innerProps as Record<string, unknown>,
            openSession,
            openTaskSettings,
            tabRegistry: registry,
            ...(innerProps.wide === undefined ? {} : { wide: innerProps.wide }),
            hasChannels: () => slotHasEntries(ctx, 'sidebar.channels'),
            subscribeChannels: listenChannels,
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
        wrapped = true
        ensureScheduleTab()
      } catch (error) {
        console.warn('[dsh-automation] 包裹官方任务树失败', error)
      } finally {
        syncing = false
      }
    }
    sync()
    const unsub = typeof ctx.slots.subscribe === 'function' ? ctx.slots.subscribe('sidebar.workspaces', sync) : () => undefined
    ensureScheduleTab()
    return () => { unsub(); unwrap() }
  })
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'dsh-automation-prefill',
    order: 80,
    locale: NS,
  }, PrefillBridge))
}

function createScheduledSessionOpener(
  ctx: ClientContext,
  runtime: ReturnType<typeof createAutomationRuntime>,
  hostOpen?: (sessionId: string) => void,
): (sessionId: string) => void {
  return (sessionId) => {
    void ensureOpenScheduledSession({
      id: sessionId,
      adopt: (id) => runtime.adoptSession(id),
      listed: (id) => {
        const snap = ctx.sessions?.list?.getSnapshot()
        return snap?.byId?.[id] !== undefined || (snap?.ids ?? []).some(item => item === id)
      },
      ...(ctx.sessions?.refresh === undefined ? {} : { refresh: () => ctx.sessions!.refresh!() }),
      ...(ctx.sessions === undefined ? {} : { openRuntime: (id) => { ctx.sessions!.open(id) } }),
      ...(hostOpen === undefined ? {} : { openHost: hostOpen }),
    })
  }
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
