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
import { createHostWorkspace, pickHostDirectory } from './workspace-create.js'
import { scheduledListHostActions } from './native-group-actions.js'
import { NativeScheduleSessionList } from './native-session-list.js'
import { NativeScheduleShell, ScheduleRail } from './ScheduleRail.js'
import { AUTOMATION_SESSION_PREFIX, canOpenClientSession, ensureOpenScheduledSession, hasCodexUiSidebar, openClientSession, pickWrappableWorkspacesEntry, resolveClientSessionOpenAccess, resolveOfficialTreeComponent } from './schedule-rail-model.js'
import { installStyles } from './styles.js'
import { openSettingsSection } from './settings-navigation.js'
import { requestAutomationTaskSettings, type AutomationTaskSettingsRequest } from './task-settings-request.js'
import { observePluginUpdate, type PluginUpdateIconName } from './plugin-update-ui.js'

export const name = 'dsh-automation-client'
export const inject = ['slots', 'locale', 'connection', 'sessions']

const UPDATE_ICON_PATHS: Record<PluginUpdateIconName, readonly string[]> = {
  refresh: ['M13.5 5.5V2.5m0 0h-3m3 0-2.1 2.1A5.5 5.5 0 1 0 13.2 12'],
  download: ['M8 2v8m0 0 3-3m-3 3-3-3M3 13v2h10v-2'],
  copy: ['M5 5h8v8H5z', 'M3 3h8'],
  close: ['m4 4 8 8M12 4 4 12'],
}

function createPluginUpdateIcon(name: PluginUpdateIconName): HTMLElement {
  const element = document.createElement('span')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.5')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  for (const d of UPDATE_ICON_PATHS[name]) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  element.append(svg)
  return element
}

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

const SETTINGS_CLOCK_SVG = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-dsh-schedule-icon="1"><path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"/><path d="M8 4.667V8l2.333 2.333"/></svg>'

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
  ctx.effect(() => observePluginUpdate({
    endpoint: '/api/michengai/dsh-automation/update',
    packageName: '@michengai/dsh-automation',
    titleRowSelector: '.dsh-st-heading-row',
    linksSelector: '.dsh-st-heading-links',
    zhName: '定时任务',
    enName: 'Scheduled tasks',
    createIcon: createPluginUpdateIcon,
  }), 'dsh-automation: plugin update ui')
  const t = ctx.locale.bind(NS)
  const permissionT = ctx.locale.bind('permission.access')
  const modelT = ctx.locale.bind('model')
  const runtime = createAutomationRuntime(ctx.connection.rpc)
  const addWorkspace = async (): Promise<string | undefined> => {
    const picked = await pickHostDirectory(ctx)
    if (picked === undefined) return undefined
    // 前端通知宿主工作区服务创建并即时刷新侧栏/下拉视图；后端 RPC 确保定时任务调度器持久化登记
    await createHostWorkspace(ctx, picked)
    const registered = await runtime.registerWorkspace(picked)
    return registered.id
  }
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
    order: 35,
    locale: NS,
    label: () => t('tab'),
    icon: 'schedule',
    inject: () => ({
      createWorkspace: (input: { path: string }) => createHostWorkspace(ctx, input.path),
      pickDirectory: () => pickHostDirectory(ctx),
      permissionT,
      modelT,
    }),
  }, function ScheduledTasksSettings(props: { close?: () => void }) {
    return createElement(AutomationView, {
      t,
      permissionT,
      modelT,
      runtime,
      ...(props.close === undefined ? {} : { closeSettings: props.close }),
      addWorkspace,
    })
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
    let ownedWrapper: HostComponent | undefined
    let ownedRegistry: ReturnType<typeof createNativeTabRegistry> | undefined
    let insertedRegistry: ReturnType<typeof createNativeTabRegistry> | undefined
    let removeInsertedTab = (): void => undefined
    let syncing = false
    let retryTimer: number | undefined
    // 直接替换 component 不触发宿主插槽通知；与 IM 共用事件，在本次同步完成后重新协调。
    const notifyPeers = (): void => { queueMicrotask(() => window.dispatchEvent(new Event('dsh-native-sidebar-change'))) }
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
      insertedRegistry = undefined
      if (wrappedEntry !== undefined) {
        if (originalComp !== undefined && wrappedEntry.component === ownedWrapper) wrappedEntry.component = originalComp
        const record = wrappedEntry as MutableSlotEntry & { __dshNativeTabs?: unknown }
        if (record.__dshNativeTabs === ownedRegistry) delete record.__dshNativeTabs
        notifyPeers()
      }
      wrappedEntry = undefined
      originalComp = undefined
      ownedWrapper = undefined
      ownedRegistry = undefined
    }
    const insertScheduleTab = (entry: unknown, openSession?: (id: string) => void): boolean => {
      const registry = findNativeTabRegistry(entry)
      if (registry === undefined) return false
      if (insertedRegistry !== registry) {
        removeInsertedTab()
        removeInsertedTab = (): void => undefined
        insertedRegistry = registry
      }
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
            ...(typeof props.renderSlot === 'function' ? { renderSlot: props.renderSlot as (name: string, owner?: Record<string, unknown>, opts?: { readonly hookContext?: unknown }) => ReturnType<typeof createElement> } : {}),
            ...(typeof props.useSessionStatus === 'function' ? { useSessionStatus: props.useSessionStatus as NonNullable<Parameters<typeof NativeScheduleSessionList>[0]['useSessionStatus']> } : {}),
            ...scheduledListHostActions(props as Record<string, unknown>),
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
      // 当前显示外壳不再提供旧表时立即释放自有贡献，等待新表就绪通知。
      removeInsertedTab()
      removeInsertedTab = (): void => undefined
      insertedRegistry = undefined
      return false
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
        const active = entries.find(entry => (entry as MutableSlotEntry)?.component !== undefined) as MutableSlotEntry | undefined
        if (wrappedEntry !== undefined && (active !== wrappedEntry || active.component !== ownedWrapper)) unwrap()
        if (active === wrappedEntry && active?.component === ownedWrapper && ownedWrapper !== undefined) {
          ensureScheduleTab()
          return
        }
        if (active === undefined) { unwrap(); return }
        const occupant = pickWrappableWorkspacesEntry(entries) as MutableSlotEntry | undefined
        const current = occupant?.component
        if (current !== undefined && isForeignSidebarHost(current)) {
          ensureScheduleTab()
          return
        }
        if (occupant?.component === undefined) return
        const resolved = resolveOfficialTreeComponent(occupant.component)
        if (resolved === undefined) return
        originalComp = resolved as ComponentType<any>
        const registry = createNativeTabRegistry(originalComp)
        ownedRegistry = registry
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
            ...(innerProps.useSessions === undefined ? {} : { useSessions: innerProps.useSessions }),
            ...(innerProps.useWorkspaces === undefined ? {} : { useWorkspaces: innerProps.useWorkspaces }),
            ...(innerProps.renderSlot === undefined ? {} : { renderSlot: innerProps.renderSlot }),
            officialTree: tree,
          })
        }
        const marked = AutomationNativeWorkspaceShell as HostComponent
        marked.displayName = 'AutomationNativeWorkspaceShell'
        marked.__dshNativeTabHost = true
        marked.__dshAutomationWrapped = true
        marked.__dshAutomationOriginal = originalComp
        const tree = originalComp
        attachNativeTabRegistry(marked, registry)
        occupant.component = marked
        ownedWrapper = marked
        wrappedEntry = occupant
        ensureScheduleTab()
        notifyPeers()
      } catch (error) {
        console.warn('[dsh-automation] 包裹官方任务树失败', error)
      } finally {
        syncing = false
      }
    }
    sync()
    const unsub = typeof ctx.slots.subscribe === 'function' ? ctx.slots.subscribe('sidebar.workspaces', sync) : () => undefined
    const unsubSidebar = ctx.slots.subscribe?.('sidebar', sync) ?? (() => undefined)
    window.addEventListener('dsh-native-sidebar-change', sync)
    ensureScheduleTab()
    return () => { unsub(); unsubSidebar(); window.removeEventListener('dsh-native-sidebar-change', sync); unwrap() }
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
    const access = resolveClientSessionOpenAccess(ctx)
    void ensureOpenScheduledSession({
      id: sessionId,
      adopt: (id) => runtime.adoptSession(id),
      listed: (id) => {
        const snap = ctx.sessions?.list?.getSnapshot()
        return (snap?.ids ?? []).includes(id) || snap?.byId?.[id] !== undefined
      },
      ...(ctx.sessions?.refresh === undefined ? {} : { refresh: () => ctx.sessions!.refresh!() }),
      ...(canOpenClientSession(access) ? { openRuntime: (id: string) => { openClientSession(access, id) } } : {}),
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
