import { createElement, Fragment, useEffect, useState, type ReactElement } from 'react'
import { SegmentedControl, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import { IconClockOutline } from './host-icons.js'
import type { ClientContext } from './contracts.js'
import type { EntryLocation } from '../settings-manager.js'

export const BUNDLE_KEY = '@michengai/dsh-automation'
export const SIDEBAR_PANEL_ID = 'dsh-automation'
export const SIDEBAR_PANEL_ORDER = 4
export const HIDE_OFFICIAL_SCHEDULE_STYLE_TAG = 'dsh-automation-hide-official-schedule'
export const STORAGE_KEY_HIDE_OFFICIAL = 'dsh-automation.hide-official-schedule'
export const STORAGE_KEY_SIDEBAR_ENTRY = 'dsh-automation.sidebar-entry'
export const STORAGE_KEY_ENTRY_LOCATION = 'dsh-automation.entry-location'
export const STORAGE_KEY_TASK_TREE_SESSIONS = 'dsh-automation.task-tree-sessions'

const HIDE_OFFICIAL_SCHEDULE_CSS = `
nav button[aria-label="自动化任务"],
nav button[aria-label="Automation tasks"] {
  display: none !important;
}
`

export function readCachedEntryLocation(): EntryLocation {
  if (typeof localStorage === 'undefined') return 'both'
  try {
    const cached = localStorage.getItem(STORAGE_KEY_ENTRY_LOCATION)
    if (cached === 'both' || cached === 'sidebar' || cached === 'settings') return cached
    const sidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR_ENTRY)
    if (sidebar === 'false') return 'settings'
  } catch {}
  return 'both'
}

export function readCachedSidebarEntry(): boolean {
  return readCachedEntryLocation() !== 'settings'
}

export function readCachedHideOfficial(): boolean {
  if (typeof localStorage === 'undefined') return true
  try {
    const cached = localStorage.getItem(STORAGE_KEY_HIDE_OFFICIAL)
    if (cached === 'true') return true
    if (cached === 'false') return false
  } catch {}
  return readCachedSidebarEntry()
}

export function readCachedTaskTreeSessions(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    const cached = localStorage.getItem(STORAGE_KEY_TASK_TREE_SESSIONS)
    if (cached === 'true') return true
  } catch {}
  return false
}

export function applyHideOfficialScheduleStyle(hidden: boolean): void {
  if (typeof document === 'undefined') return
  const selector = `style[data-plugin="${BUNDLE_KEY}"][data-plugin-css="${HIDE_OFFICIAL_SCHEDULE_STYLE_TAG}"]`
  const existing = document.querySelector(selector)
  if (hidden) {
    if (!existing) {
      const style = document.createElement('style')
      style.dataset.plugin = BUNDLE_KEY
      style.dataset.pluginCss = HIDE_OFFICIAL_SCHEDULE_STYLE_TAG
      style.textContent = HIDE_OFFICIAL_SCHEDULE_CSS
      const container = document.head ?? document.documentElement
      if (container) {
        container.appendChild(style)
      }
    }
  } else {
    if (existing) {
      existing.remove()
    }
  }
}

export function AutomationSidebarIcon(props: { readonly size?: number }): ReactElement {
  const size = props.size !== undefined && typeof props.size === 'number' ? props.size : 16
  return createElement(IconClockOutline, { size })
}

export interface BundleConfigCardProps {
  readonly t: (key: string) => string
  readonly location?: EntryLocation
  readonly onLocationChange?: (location: EntryLocation) => void
  readonly enabled?: boolean
  readonly disabled?: boolean
  readonly onToggle?: (next: boolean) => void
  readonly onlineUpdateEnabled?: boolean
  readonly onlineUpdateDisabled?: boolean
  readonly onlineUpdateLocked?: boolean
  readonly onToggleOnlineUpdate?: (next: boolean) => void
  readonly hideOfficialScheduleEnabled?: boolean
  readonly hideOfficialScheduleDisabled?: boolean
  readonly onToggleHideOfficialSchedule?: (next: boolean) => void
  readonly taskTreeSessionsEnabled?: boolean
  readonly taskTreeSessionsDisabled?: boolean
  readonly onToggleTaskTreeSessions?: (next: boolean) => void
}

export function AutomationBundleConfigCard(props: BundleConfigCardProps): ReactElement {
  const {
    t,
    location: propLocation,
    onLocationChange,
    enabled = true,
    disabled = false,
    onToggle,
    onlineUpdateEnabled = true,
    onlineUpdateDisabled = false,
    onlineUpdateLocked = false,
    onToggleOnlineUpdate,
    hideOfficialScheduleEnabled = true,
    hideOfficialScheduleDisabled = false,
    onToggleHideOfficialSchedule,
    taskTreeSessionsEnabled = false,
    taskTreeSessionsDisabled = false,
    onToggleTaskTreeSessions,
  } = props

  const effectiveLocation: EntryLocation = propLocation ?? (enabled ? 'both' : 'settings')

  const handleLocationChange = (next: string) => {
    if (next === 'both' || next === 'sidebar' || next === 'settings') {
      if (typeof onLocationChange === 'function') {
        onLocationChange(next)
      } else if (typeof onToggle === 'function') {
        onToggle(next !== 'settings')
      }
    }
  }

  const rows = [
    createElement('div', { key: 'entry-location', className: 'dsh-st-bundle-row' },
      createElement('div', { className: 'dsh-st-bundle-label-box' },
        createElement('span', { className: 'dsh-st-bundle-title' }, t('entry.location.title') || t('sidebar.entry.title')),
        createElement('span', { className: 'dsh-st-bundle-desc' }, t('entry.location.desc') || t('sidebar.entry.desc')),
      ),
      createElement(SegmentedControl, {
        id: 'dsh-st-bundle-entry-location',
        value: effectiveLocation,
        onChange: handleLocationChange,
        label: t('entry.location.title') || t('sidebar.entry.title'),
        disabled,
        options: [
          { value: 'both', label: t('entry.location.both') || '两边显示' },
          { value: 'sidebar', label: t('entry.location.sidebar') || '仅侧边栏' },
          { value: 'settings', label: t('entry.location.settings') || '仅设置' },
        ],
      }),
    ),
  ]

  if (typeof onToggleOnlineUpdate === 'function') {
    const updateDesc = onlineUpdateLocked
      ? `${t('update.entry.desc')} (${t('error.update.disabled')})`
      : t('update.entry.desc')
    rows.push(
      createElement('div', { key: 'online-update', className: 'dsh-st-bundle-row' },
        createElement('div', { className: 'dsh-st-bundle-label-box' },
          createElement('span', { className: 'dsh-st-bundle-title' }, t('update.entry.title')),
          createElement('span', { className: 'dsh-st-bundle-desc' }, updateDesc),
        ),
        createElement(Switch, {
          checked: onlineUpdateEnabled,
          onChange: onToggleOnlineUpdate,
          label: t('update.entry.toggle'),
          disabled: onlineUpdateDisabled || onlineUpdateLocked,
        }),
      ),
    )
  }

  if (typeof onToggleHideOfficialSchedule === 'function') {
    rows.push(
      createElement('div', { key: 'official-schedule', className: 'dsh-st-bundle-row' },
        createElement('div', { className: 'dsh-st-bundle-label-box' },
          createElement('span', { className: 'dsh-st-bundle-title' }, t('officialSchedule.entry.title')),
          createElement('span', { className: 'dsh-st-bundle-desc' }, t('officialSchedule.entry.desc')),
        ),
        createElement(Switch, {
          checked: hideOfficialScheduleEnabled,
          onChange: onToggleHideOfficialSchedule,
          label: t('officialSchedule.entry.toggle'),
          disabled: hideOfficialScheduleDisabled,
        }),
      ),
    )
  }

  if (typeof onToggleTaskTreeSessions === 'function') {
    rows.push(
      createElement('div', { key: 'task-tree-sessions', className: 'dsh-st-bundle-row' },
        createElement('div', { className: 'dsh-st-bundle-label-box' },
          createElement('span', { className: 'dsh-st-bundle-title' }, t('taskTreeSessions.entry.title')),
          createElement('span', { className: 'dsh-st-bundle-desc' }, t('taskTreeSessions.entry.desc')),
        ),
        createElement(Switch, {
          checked: taskTreeSessionsEnabled,
          onChange: onToggleTaskTreeSessions,
          label: t('taskTreeSessions.entry.toggle'),
          disabled: taskTreeSessionsDisabled,
        }),
      ),
    )
  }

  return createElement(Fragment, null, rows)
}

export interface BundleConfigWrapperProps {
  readonly t: (key: string) => string
  readonly getLocation: () => EntryLocation
  readonly setLocation: (next: EntryLocation) => Promise<EntryLocation>
  readonly getEnabled?: () => boolean
  readonly setSidebar?: (next: boolean) => Promise<boolean>
  readonly getOnlineUpdateEnabled?: () => boolean
  readonly getOnlineUpdateLocked?: () => boolean
  readonly setOnlineUpdate?: (next: boolean) => Promise<boolean>
  readonly getHideOfficialScheduleEnabled?: () => boolean
  readonly setHideOfficialSchedule?: (next: boolean) => Promise<boolean>
  readonly getTaskTreeSessionsEnabled?: () => boolean
  readonly setTaskTreeSessions?: (next: boolean) => Promise<boolean>
  readonly subscribe: (listener: () => void) => () => void
}

export function AutomationBundleConfigCardWrapper(props: BundleConfigWrapperProps): ReactElement {
  const [location, setLocation] = useState<EntryLocation>(props.getLocation)
  const [onlineUpdateEnabled, setOnlineUpdateEnabled] = useState(props.getOnlineUpdateEnabled ? props.getOnlineUpdateEnabled : () => true)
  const [onlineUpdateLocked, setOnlineUpdateLocked] = useState(props.getOnlineUpdateLocked ? props.getOnlineUpdateLocked : () => false)
  const [hideOfficialScheduleEnabled, setHideOfficialScheduleEnabled] = useState(props.getHideOfficialScheduleEnabled ? props.getHideOfficialScheduleEnabled : () => true)
  const [taskTreeSessionsEnabled, setTaskTreeSessionsEnabled] = useState(props.getTaskTreeSessionsEnabled ? props.getTaskTreeSessionsEnabled : () => false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(false)
  const [savingOfficialSchedule, setSavingOfficialSchedule] = useState(false)
  const [savingTaskTreeSessions, setSavingTaskTreeSessions] = useState(false)

  useEffect(() => {
    setLocation(props.getLocation())
    if (props.getOnlineUpdateEnabled) {
      setOnlineUpdateEnabled(props.getOnlineUpdateEnabled())
    }
    if (props.getOnlineUpdateLocked) {
      setOnlineUpdateLocked(props.getOnlineUpdateLocked())
    }
    if (props.getHideOfficialScheduleEnabled) {
      setHideOfficialScheduleEnabled(props.getHideOfficialScheduleEnabled())
    }
    if (props.getTaskTreeSessionsEnabled) {
      setTaskTreeSessionsEnabled(props.getTaskTreeSessionsEnabled())
    }
    const unsub = props.subscribe(() => {
      setLocation(props.getLocation())
      if (props.getOnlineUpdateEnabled) {
        setOnlineUpdateEnabled(props.getOnlineUpdateEnabled())
      }
      if (props.getOnlineUpdateLocked) {
        setOnlineUpdateLocked(props.getOnlineUpdateLocked())
      }
      if (props.getHideOfficialScheduleEnabled) {
        setHideOfficialScheduleEnabled(props.getHideOfficialScheduleEnabled())
      }
      if (props.getTaskTreeSessionsEnabled) {
        setTaskTreeSessionsEnabled(props.getTaskTreeSessionsEnabled())
      }
    })
    return () => { unsub() }
  }, [props])

  const onLocationChange = (next: EntryLocation): void => {
    setSavingLocation(true)
    setLocation(next)
    props.setLocation(next).catch(() => {
      setLocation(props.getLocation())
    }).finally(() => {
      setSavingLocation(false)
    })
  }

  const setOnlineUpdateFn = props.setOnlineUpdate
  const onToggleOnlineUpdate = setOnlineUpdateFn ? (next: boolean): void => {
    if (onlineUpdateLocked) return
    setSavingUpdate(true)
    setOnlineUpdateEnabled(next)
    setOnlineUpdateFn(next).catch(() => {
      if (props.getOnlineUpdateEnabled) {
        setOnlineUpdateEnabled(props.getOnlineUpdateEnabled())
      }
    }).finally(() => {
      setSavingUpdate(false)
    })
  } : undefined

  const setHideOfficialScheduleFn = props.setHideOfficialSchedule
  const onToggleHideOfficialSchedule = setHideOfficialScheduleFn ? (next: boolean): void => {
    setSavingOfficialSchedule(true)
    setHideOfficialScheduleEnabled(next)
    setHideOfficialScheduleFn(next).catch(() => {
      if (props.getHideOfficialScheduleEnabled) {
        setHideOfficialScheduleEnabled(props.getHideOfficialScheduleEnabled())
      }
    }).finally(() => {
      setSavingOfficialSchedule(false)
    })
  } : undefined

  const setTaskTreeSessionsFn = props.setTaskTreeSessions
  const onToggleTaskTreeSessions = setTaskTreeSessionsFn ? (next: boolean): void => {
    setSavingTaskTreeSessions(true)
    setTaskTreeSessionsEnabled(next)
    setTaskTreeSessionsFn(next).catch(() => {
      if (props.getTaskTreeSessionsEnabled) {
        setTaskTreeSessionsEnabled(props.getTaskTreeSessionsEnabled())
      }
    }).finally(() => {
      setSavingTaskTreeSessions(false)
    })
  } : undefined

  return createElement(AutomationBundleConfigCard, {
    t: props.t,
    location,
    disabled: savingLocation,
    onLocationChange,
    onlineUpdateEnabled,
    onlineUpdateDisabled: savingUpdate,
    onlineUpdateLocked,
    ...(onToggleOnlineUpdate !== undefined ? { onToggleOnlineUpdate } : {}),
    hideOfficialScheduleEnabled,
    hideOfficialScheduleDisabled: savingOfficialSchedule,
    ...(onToggleHideOfficialSchedule !== undefined ? { onToggleHideOfficialSchedule } : {}),
    taskTreeSessionsEnabled,
    taskTreeSessionsDisabled: savingTaskTreeSessions,
    ...(onToggleTaskTreeSessions !== undefined ? { onToggleTaskTreeSessions } : {}),
  })
}

export interface SetupSidebarEntryOptions {
  readonly callApi: (path: string, options?: RequestInit) => Promise<any>
  readonly renderPanel: (ownerProps: any) => ReactElement
  readonly ns: string
  readonly injectProps?: Record<string, unknown> | (() => Record<string, unknown>)
  readonly onOnlineUpdateChange?: (enabled: boolean) => void
  readonly onTaskTreeSessionsChange?: (enabled: boolean) => void
  readonly onLocationChange?: (location: EntryLocation) => void
}

export interface SidebarController {
  getLocation(): EntryLocation
  setLocation(next: EntryLocation): Promise<EntryLocation>
  isSettingsSectionEnabled(): boolean
  isEnabled(): boolean
  isSupported(): boolean
  setEnabled(next: boolean): Promise<boolean>
  isOnlineUpdateEnabled(): boolean
  isOnlineUpdateLocked(): boolean
  setOnlineUpdate(next: boolean): Promise<boolean>
  isHideOfficialScheduleEnabled(): boolean
  setHideOfficialSchedule(next: boolean): Promise<boolean>
  isTaskTreeSessionsEnabled(): boolean
  setTaskTreeSessions(next: boolean): Promise<boolean>
  destroy(): void
}

export function setupSidebarEntry(ctx: ClientContext, options: SetupSidebarEntryOptions): SidebarController {
  if (!ctx.locale) {
    return {
      getLocation: () => 'both',
      setLocation: async () => 'both',
      isSettingsSectionEnabled: () => true,
      isEnabled: () => false,
      isSupported: () => false,
      setEnabled: async () => false,
      isOnlineUpdateEnabled: () => true,
      isOnlineUpdateLocked: () => false,
      setOnlineUpdate: async () => false,
      isHideOfficialScheduleEnabled: () => true,
      setHideOfficialSchedule: async () => false,
      isTaskTreeSessionsEnabled: () => false,
      setTaskTreeSessions: async () => false,
      destroy: () => {},
    }
  }

  const { callApi, renderPanel, ns } = options
  let entryLocation = readCachedEntryLocation()
  let sidebarSupported = false
  let offPanel: (() => void) | null = null
  let offRow: (() => void) | null = null
  let epoch = 0
  let layoutService: { panelInfo?: { getSnapshot(): { activePanelId?: string } }; selectPanel?(id: string | null): void } | undefined
  const listeners = new Set<() => void>()

  const isSidebarEnabled = () => entryLocation === 'both' || entryLocation === 'sidebar'
  const isSettingsSectionEnabled = () => entryLocation === 'both' || entryLocation === 'settings'

  const notify = (): void => {
    for (const listener of listeners) {
      try { listener() } catch {}
    }
  }

  const sync = (): void => {
    if (sidebarSupported && isSidebarEnabled()) {
      if (!offPanel) {
        const res = ctx.slots.register({
          name: 'main',
          key: SIDEBAR_PANEL_ID,
          locale: ns,
          inject: () => {
            const extra = typeof options.injectProps === 'function' ? options.injectProps() : options.injectProps
            return Object.assign({ t: ctx.locale?.bind ? ctx.locale.bind(ns) : undefined }, extra)
          },
        }, (ownerProps: any) => createElement('div', { className: 'dsh-st-main-panel' }, renderPanel({
          ...ownerProps,
          close: typeof ownerProps?.close === 'function'
            ? ownerProps.close
            : () => {
                if (typeof layoutService?.selectPanel === 'function') {
                  try { layoutService.selectPanel(null) } catch {}
                }
              },
        })))
        offPanel = typeof res === 'function' ? res : () => {}
      }
      if (!offRow) {
        const res = ctx.slots.register({
          name: 'sidebar.panellist',
          id: SIDEBAR_PANEL_ID,
          order: SIDEBAR_PANEL_ORDER,
          label: () => (ctx.locale?.bind ? ctx.locale.bind(ns)('tab') : '定时任务'),
          locale: ns,
        }, (ownerProps: any) => createElement(AutomationSidebarIcon, ownerProps))
        offRow = typeof res === 'function' ? res : () => {}
      }
    } else {
      if (layoutService?.panelInfo && typeof layoutService.selectPanel === 'function') {
        try {
          if (layoutService.panelInfo.getSnapshot().activePanelId === SIDEBAR_PANEL_ID) {
            layoutService.selectPanel(null)
          }
        } catch {}
      }
      if (offRow) {
        try { offRow() } catch {}
        offRow = null
      }
      if (offPanel) {
        try { offPanel() } catch {}
        offPanel = null
      }
    }
  }

  const setLocation = async (next: EntryLocation): Promise<EntryLocation> => {
    const currentEpoch = ++epoch
    const previous = entryLocation
    entryLocation = next
    try {
      localStorage.setItem(STORAGE_KEY_ENTRY_LOCATION, next)
      localStorage.setItem(STORAGE_KEY_SIDEBAR_ENTRY, String(isSidebarEnabled()))
    } catch {}
    sync()
    notify()
    if (typeof options.onLocationChange === 'function') {
      try { options.onLocationChange(next) } catch {}
    }
    try {
      await callApi('/sidebar-entry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ location: next }),
      })
      return next
    } catch (err) {
      if (currentEpoch === epoch) {
        entryLocation = previous
        try {
          localStorage.setItem(STORAGE_KEY_ENTRY_LOCATION, previous)
          localStorage.setItem(STORAGE_KEY_SIDEBAR_ENTRY, String(isSidebarEnabled()))
        } catch {}
        sync()
        notify()
        if (typeof options.onLocationChange === 'function') {
          try { options.onLocationChange(previous) } catch {}
        }
      }
      throw err
    }
  }

  const setEnabled = async (next: boolean): Promise<boolean> => {
    await setLocation(next ? 'both' : 'settings')
    return isSidebarEnabled()
  }

  let onlineUpdateEnabled = true
  let onlineUpdateLocked = false
  let updateEpoch = 0

  let hideOfficialScheduleEnabled = readCachedHideOfficial()
  let officialEpoch = 0
  applyHideOfficialScheduleStyle(hideOfficialScheduleEnabled)

  const syncOfficialPanelReset = (hidden: boolean): void => {
    if (hidden && layoutService?.panelInfo && typeof layoutService.selectPanel === 'function') {
      try {
        if (layoutService.panelInfo.getSnapshot().activePanelId === 'schedules') {
          layoutService.selectPanel(null)
        }
      } catch {}
    }
  }

  const setHideOfficialSchedule = async (next: boolean): Promise<boolean> => {
    const currentEpoch = ++officialEpoch
    hideOfficialScheduleEnabled = next
    try { localStorage.setItem(STORAGE_KEY_HIDE_OFFICIAL, String(next)) } catch {}
    applyHideOfficialScheduleStyle(next)
    syncOfficialPanelReset(next)
    notify()
    try {
      await callApi('/official-schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      return next
    } catch (err) {
      if (currentEpoch === officialEpoch) {
        hideOfficialScheduleEnabled = !next
        try { localStorage.setItem(STORAGE_KEY_HIDE_OFFICIAL, String(!next)) } catch {}
        applyHideOfficialScheduleStyle(!next)
        notify()
      }
      throw err
    }
  }

  const setOnlineUpdate = async (next: boolean): Promise<boolean> => {
    if (onlineUpdateLocked) return onlineUpdateEnabled
    const currentEpoch = ++updateEpoch
    onlineUpdateEnabled = next
    notify()
    if (typeof options.onOnlineUpdateChange === 'function') {
      try { options.onOnlineUpdateChange(next) } catch {}
    }
    try {
      await callApi('/online-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (typeof options.onOnlineUpdateChange === 'function') {
        try { options.onOnlineUpdateChange(next) } catch {}
      }
      return next
    } catch (err) {
      if (currentEpoch === updateEpoch) {
        onlineUpdateEnabled = !next
        notify()
        if (typeof options.onOnlineUpdateChange === 'function') {
          try { options.onOnlineUpdateChange(!next) } catch {}
        }
      }
      throw err
    }
  }

  const loadEpoch = epoch
  callApi('/sidebar-entry')
    .then((res: any) => {
      if (epoch === loadEpoch && res) {
        if (res.location === 'both' || res.location === 'sidebar' || res.location === 'settings') {
          entryLocation = res.location
          try {
            localStorage.setItem(STORAGE_KEY_ENTRY_LOCATION, res.location)
            localStorage.setItem(STORAGE_KEY_SIDEBAR_ENTRY, String(isSidebarEnabled()))
          } catch {}
        } else if (typeof res.enabled === 'boolean') {
          entryLocation = res.enabled ? 'both' : 'settings'
          try {
            localStorage.setItem(STORAGE_KEY_ENTRY_LOCATION, entryLocation)
            localStorage.setItem(STORAGE_KEY_SIDEBAR_ENTRY, String(res.enabled))
          } catch {}
        }
        sync()
        notify()
        if (typeof options.onLocationChange === 'function') {
          try { options.onLocationChange(entryLocation) } catch {}
        }
      }
    })
    .catch(() => {})

  const loadUpdateEpoch = updateEpoch
  callApi('/online-update')
    .then((res: any) => {
      if (updateEpoch === loadUpdateEpoch && res) {
        if (typeof res.enabled === 'boolean') onlineUpdateEnabled = res.enabled
        if (typeof res.locked === 'boolean') onlineUpdateLocked = res.locked
        notify()
        if (typeof options.onOnlineUpdateChange === 'function') {
          try { options.onOnlineUpdateChange(onlineUpdateEnabled) } catch {}
        }
      }
    })
    .catch(() => {})

  const loadOfficialEpoch = officialEpoch
  callApi('/official-schedule')
    .then((res: any) => {
      if (officialEpoch === loadOfficialEpoch && res && typeof res.enabled === 'boolean') {
        hideOfficialScheduleEnabled = res.enabled
        try { localStorage.setItem(STORAGE_KEY_HIDE_OFFICIAL, String(res.enabled)) } catch {}
        applyHideOfficialScheduleStyle(hideOfficialScheduleEnabled)
        syncOfficialPanelReset(hideOfficialScheduleEnabled)
        notify()
      }
    })
    .catch(() => {})

  let taskTreeSessionsEnabled = readCachedTaskTreeSessions()
  let taskTreeEpoch = 0

  const setTaskTreeSessions = async (next: boolean): Promise<boolean> => {
    const currentEpoch = ++taskTreeEpoch
    taskTreeSessionsEnabled = next
    try { localStorage.setItem(STORAGE_KEY_TASK_TREE_SESSIONS, String(next)) } catch {}
    notify()
    if (typeof options.onTaskTreeSessionsChange === 'function') {
      try { options.onTaskTreeSessionsChange(next) } catch {}
    }
    try {
      await callApi('/task-tree-sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (typeof options.onTaskTreeSessionsChange === 'function') {
        try { options.onTaskTreeSessionsChange(next) } catch {}
      }
      return next
    } catch (err) {
      if (currentEpoch === taskTreeEpoch) {
        taskTreeSessionsEnabled = !next
        try { localStorage.setItem(STORAGE_KEY_TASK_TREE_SESSIONS, String(!next)) } catch {}
        notify()
        if (typeof options.onTaskTreeSessionsChange === 'function') {
          try { options.onTaskTreeSessionsChange(!next) } catch {}
        }
      }
      throw err
    }
  }

  const loadTaskTreeEpoch = taskTreeEpoch
  callApi('/task-tree-sessions')
    .then((res: any) => {
      if (taskTreeEpoch === loadTaskTreeEpoch && res && typeof res.enabled === 'boolean') {
        taskTreeSessionsEnabled = res.enabled
        try { localStorage.setItem(STORAGE_KEY_TASK_TREE_SESSIONS, String(res.enabled)) } catch {}
        notify()
        if (typeof options.onTaskTreeSessionsChange === 'function') {
          try { options.onTaskTreeSessionsChange(res.enabled) } catch {}
        }
      }
    })
    .catch(() => {})

  if (typeof (ctx as any).inject === 'function') {
    (ctx as any).inject(['layout'], (scoped: any) => {
      layoutService = scoped.layout
      syncOfficialPanelReset(hideOfficialScheduleEnabled)
    })
  }

  ctx.slots.inject('sidebar.panellist', () => {
    sidebarSupported = true
    sync()
  })

  ctx.slots.inject('plugins.bundle.config', () => {
    return ctx.slots.register({
      name: 'plugins.bundle.config',
      key: BUNDLE_KEY,
      locale: ns,
    }, (ownerProps: any) => {
      if (ownerProps && ownerProps.view === 'summary') return null
      return createElement(AutomationBundleConfigCardWrapper, {
        t: ctx.locale.bind(ns),
        getLocation: () => entryLocation,
        setLocation,
        getEnabled: () => isSidebarEnabled(),
        setSidebar: setEnabled,
        getOnlineUpdateEnabled: () => onlineUpdateEnabled,
        getOnlineUpdateLocked: () => onlineUpdateLocked,
        setOnlineUpdate: setOnlineUpdate,
        getHideOfficialScheduleEnabled: () => hideOfficialScheduleEnabled,
        setHideOfficialSchedule: setHideOfficialSchedule,
        getTaskTreeSessionsEnabled: () => taskTreeSessionsEnabled,
        setTaskTreeSessions: setTaskTreeSessions,
        subscribe: (fn) => {
          listeners.add(fn)
          return () => { listeners.delete(fn) }
        },
      })
    })
  })

  return {
    getLocation: () => entryLocation,
    setLocation,
    isSettingsSectionEnabled,
    isEnabled: () => isSidebarEnabled(),
    isSupported: () => sidebarSupported,
    setEnabled,
    isOnlineUpdateEnabled: () => onlineUpdateEnabled,
    isOnlineUpdateLocked: () => onlineUpdateLocked,
    setOnlineUpdate,
    isHideOfficialScheduleEnabled: () => hideOfficialScheduleEnabled,
    setHideOfficialSchedule,
    isTaskTreeSessionsEnabled: () => taskTreeSessionsEnabled,
    setTaskTreeSessions,
    destroy: () => {
      listeners.clear()
      applyHideOfficialScheduleStyle(false)
      if (offRow) {
        try { offRow() } catch {}
        offRow = null
      }
      if (offPanel) {
        try { offPanel() } catch {}
        offPanel = null
      }
    },
  }
}
