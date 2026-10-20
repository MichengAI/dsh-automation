import { createElement, useEffect, useMemo, useSyncExternalStore, type ComponentType } from 'react'
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
import { NativeScheduleShell, ScheduledRecordsView } from './ScheduleRail.js'
import { AUTOMATION_SESSION_PREFIX, automationIdFromTaskWorkspaceId, canOpenClientSession, collectScheduledSessionIds, ensureOpenScheduledSession, groupScheduledSessions, hasCodexUiSidebar, openClientSession, pickWrappableWorkspacesEntry, resolveClientSessionOpenAccess, resolveOfficialTreeComponent } from './schedule-rail-model.js'
import { IconClockOutline } from './host-icons.js'
import { hostIconMarkup } from './host-icon-markup.js'
import { installTaskSettingsMenuInjector } from './workspace-menu.js'
import { installStyles } from './styles.js'
import { openSettingsSection } from './settings-navigation.js'
import { installSettingsNavIcon } from './settings-nav-icon.js'
import { requestAutomationTaskSettings, type AutomationTaskSettingsRequest } from './task-settings-request.js'
import { requestAutomationCreateTask } from './create-task-request.js'
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

function isSessionSelector(value: unknown): value is SessionSelector {
  return typeof value === 'function'
}

function isWorkspaceSelector(value: unknown): value is WorkspaceSelector {
  return typeof value === 'function'
}

type HostComponent = ComponentType<any> & {
  displayName?: string
  __dshNativeTabHost?: boolean
  __dshNativeTabWrapped?: boolean
  __dshNativeTabOriginal?: ComponentType<any>
  __dshNativeTabOwner?: string
  __dshAutomationWrapped?: boolean
  __dshAutomationOriginal?: ComponentType<any>
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
  const openCreateTask = (): void => {
    requestAutomationCreateTask()
    openSettingsSection(
      [t('tab'), 'Scheduled tasks', '定时任务'],
      () => { requestAutomationCreateTask() },
    )
  }
  ctx.effect(() => installAutomationSessionSync(runtime, () => ctx.sessions), 'dsh-automation: session sync')
  ctx.effect(() => installSettingsNavIcon(
    () => [t('tab'), 'Scheduled tasks', '定时任务'],
    () => hostIconMarkup(IconClockOutline, 16),
  ), 'dsh-automation: settings icon')
  ctx.effect(() => installTaskSettingsMenuInjector({
    label: () => t('session.taskSettings'),
    resolveTask: (workspaceId) => {
      const automationId = automationIdFromTaskWorkspaceId(workspaceId)
      if (automationId === undefined) return undefined
      const snapshot = runtime.source.getSnapshot().snapshot
      if (snapshot === undefined) return undefined
      const group = groupScheduledSessions(snapshot.automations, snapshot.runs)
        .find(item => item.id === automationId)
      return group === undefined
        ? undefined
        : {
            id: automationId,
            name: group.name,
            sessionIds: group.sessions.map(session => session.id),
          }
    },
    openTaskSettings,
  }), 'dsh-automation: task settings menu')
  // 官方任务树只在会话空闲时渲染 leading 槽位；这里用官方时钟图标标记定时会话。
  ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register({
    name: 'sidebar.session.row.leading',
    id: 'dsh-automation-session-clock',
    order: 20,
  }, function AutomationSessionClock(props: { readonly sessionId?: string }) {
    const state = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)
    const scheduledIds = useMemo(() => collectScheduledSessionIds(state.snapshot?.runs), [state.snapshot])
    if (props.sessionId === undefined || !scheduledIds.has(props.sessionId)) return null
    return createElement(
      'span',
      { className: 'dsh-st-session-clock', 'aria-hidden': 'true' },
      createElement(IconClockOutline, { size: 16 }),
    )
  }))
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
  ctx.slots.inject('sidebar.workspaces', () => {
    let wrappedEntry: MutableSlotEntry | undefined
    let originalComp: ComponentType<any> | undefined
    let ownedWrapper: HostComponent | undefined
    let ownedRegistry: ReturnType<typeof createNativeTabRegistry> | undefined
    let insertedRegistry: ReturnType<typeof createNativeTabRegistry> | undefined
    let removeInsertedTab = (): void => undefined
    let removeInsertedOpener = (): void => undefined
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
      removeInsertedOpener()
      removeInsertedOpener = (): void => undefined
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
    const installScheduledOpener = (registry: ReturnType<typeof createNativeTabRegistry>): (() => void) => {
      if (!Array.isArray(registry.sessionOpeners) || typeof registry.addSessionOpener !== 'function') return () => undefined
      if (registry.sessionOpeners.some(item => item.id === 'automation')) return () => undefined
      return registry.addSessionOpener({
        id: 'automation',
        order: 10,
        matchSession: (sessionId) => {
          if (sessionId.startsWith(AUTOMATION_SESSION_PREFIX)) return true
          const snapshot = runtime.source.getSnapshot().snapshot
          return snapshot?.runs?.some(run => run.sessionId === sessionId) === true
        },
        open: (sessionId, hostOpen) => {
          createScheduledSessionOpener(ctx, runtime, hostOpen)(sessionId)
        },
      })
    }
    const insertScheduleTab = (entry: unknown, openSession?: (id: string) => void): boolean => {
      const registry = findNativeTabRegistry(entry)
      if (registry === undefined) return false
      if (insertedRegistry !== registry) {
        removeInsertedTab()
        removeInsertedTab = (): void => undefined
        removeInsertedOpener()
        removeInsertedOpener = (): void => undefined
        insertedRegistry = registry
      }
      if (Array.isArray(registry.sessionOpeners) && !registry.sessionOpeners.some(item => item.id === 'automation')) {
        removeInsertedOpener = installScheduledOpener(registry)
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
          const hostTree = typeof registry.officialTree === 'function'
            ? registry.officialTree as ComponentType<Record<string, unknown>>
            : undefined
          // 复用宿主注册表里的官方树；没有官方树时才退回轻量分组列表。
          return createElement(ScheduledRecordsView, {
            t,
            runtime,
            ...(hostTree === undefined ? {} : { officialTree: hostTree }),
            hostProps: props,
            openSession: opener,
            ...(openTaskSettings === undefined ? {} : { openTaskSettings }),
            ...(openCreateTask === undefined ? {} : { openCreateTask }),
            ...(isSessionSelector(props.useSessions) ? { useSessions: props.useSessions } : {}),
            ...(isWorkspaceSelector(props.useWorkspaces) ? { useWorkspaces: props.useWorkspaces } : {}),
            ...(typeof props.wide === 'boolean' ? { wide: props.wide } : {}),
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
      removeInsertedOpener()
      removeInsertedOpener = (): void => undefined
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
        function DshNativeTabWorkspaceShell(innerProps: NativeSwitcherProps): JSX.Element | null {
          const openSession = createScheduledSessionOpener(ctx, runtime, innerProps.openSession ?? innerProps.open)
          return createElement(NativeScheduleShell, {
            t,
            runtime,
            hostProps: innerProps as Record<string, unknown>,
            openSession,
            openTaskSettings,
            openCreateTask,
            tabRegistry: registry,
            ...(innerProps.wide === undefined ? {} : { wide: innerProps.wide }),
            ...(innerProps.useSessions === undefined ? {} : { useSessions: innerProps.useSessions }),
            ...(innerProps.useWorkspaces === undefined ? {} : { useWorkspaces: innerProps.useWorkspaces }),
            ...(innerProps.renderSlot === undefined ? {} : { renderSlot: innerProps.renderSlot }),
            officialTree: tree,
          })
        }
        const marked = DshNativeTabWorkspaceShell as HostComponent
        marked.displayName = 'DshNativeTabWorkspaceShell'
        marked.__dshNativeTabHost = true
        marked.__dshNativeTabWrapped = true
        marked.__dshNativeTabOriginal = originalComp
        marked.__dshNativeTabOwner = 'automation'
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
