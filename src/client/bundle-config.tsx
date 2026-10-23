import { createElement, Fragment, useEffect, useState, type ReactElement } from 'react'
import { Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import { IconClockOutline } from './host-icons.js'
import type { ClientContext } from './contracts.js'

export const BUNDLE_KEY = '@michengai/dsh-automation'
export const SIDEBAR_PANEL_ID = 'dsh-automation'
export const SIDEBAR_PANEL_ORDER = 4

export function AutomationSidebarIcon(props: { readonly size?: number }): ReactElement {
  const size = props.size !== undefined && typeof props.size === 'number' ? props.size : 16
  return createElement(IconClockOutline, { size })
}

export interface BundleConfigCardProps {
  readonly t: (key: string) => string
  readonly enabled: boolean
  readonly disabled?: boolean
  readonly onToggle: (next: boolean) => void
  readonly onlineUpdateEnabled?: boolean
  readonly onlineUpdateDisabled?: boolean
  readonly onlineUpdateLocked?: boolean
  readonly onToggleOnlineUpdate?: (next: boolean) => void
}

export function AutomationBundleConfigCard(props: BundleConfigCardProps): ReactElement {
  const {
    t,
    enabled,
    disabled = false,
    onToggle,
    onlineUpdateEnabled = true,
    onlineUpdateDisabled = false,
    onlineUpdateLocked = false,
    onToggleOnlineUpdate,
  } = props

  const rows = [
    createElement('div', { key: 'sidebar-entry', className: 'dsh-st-bundle-row' },
      createElement('div', { className: 'dsh-st-bundle-label-box' },
        createElement('span', { className: 'dsh-st-bundle-title' }, t('sidebar.entry.title')),
        createElement('span', { className: 'dsh-st-bundle-desc' }, t('sidebar.entry.desc')),
      ),
      createElement(Switch, {
        checked: enabled,
        onChange: onToggle,
        label: t('sidebar.entry.toggle'),
        disabled,
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

  return createElement(Fragment, null, rows)
}

export interface BundleConfigWrapperProps {
  readonly t: (key: string) => string
  readonly getEnabled: () => boolean
  readonly setSidebar: (next: boolean) => Promise<boolean>
  readonly getOnlineUpdateEnabled?: () => boolean
  readonly getOnlineUpdateLocked?: () => boolean
  readonly setOnlineUpdate?: (next: boolean) => Promise<boolean>
  readonly subscribe: (listener: () => void) => () => void
}

export function AutomationBundleConfigCardWrapper(props: BundleConfigWrapperProps): ReactElement {
  const [enabled, setEnabled] = useState(props.getEnabled)
  const [onlineUpdateEnabled, setOnlineUpdateEnabled] = useState(props.getOnlineUpdateEnabled ? props.getOnlineUpdateEnabled : () => true)
  const [onlineUpdateLocked, setOnlineUpdateLocked] = useState(props.getOnlineUpdateLocked ? props.getOnlineUpdateLocked : () => false)
  const [savingSidebar, setSavingSidebar] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(false)

  useEffect(() => {
    setEnabled(props.getEnabled())
    if (props.getOnlineUpdateEnabled) {
      setOnlineUpdateEnabled(props.getOnlineUpdateEnabled())
    }
    if (props.getOnlineUpdateLocked) {
      setOnlineUpdateLocked(props.getOnlineUpdateLocked())
    }
    const unsub = props.subscribe(() => {
      setEnabled(props.getEnabled())
      if (props.getOnlineUpdateEnabled) {
        setOnlineUpdateEnabled(props.getOnlineUpdateEnabled())
      }
      if (props.getOnlineUpdateLocked) {
        setOnlineUpdateLocked(props.getOnlineUpdateLocked())
      }
    })
    return () => { unsub() }
  }, [props])

  const onToggleSidebar = (next: boolean): void => {
    setSavingSidebar(true)
    setEnabled(next)
    props.setSidebar(next).catch(() => {
      setEnabled(props.getEnabled())
    }).finally(() => {
      setSavingSidebar(false)
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

  return createElement(AutomationBundleConfigCard, {
    t: props.t,
    enabled,
    disabled: savingSidebar,
    onToggle: onToggleSidebar,
    onlineUpdateEnabled,
    onlineUpdateDisabled: savingUpdate,
    onlineUpdateLocked,
    ...(onToggleOnlineUpdate !== undefined ? { onToggleOnlineUpdate } : {}),
  })
}

export interface SetupSidebarEntryOptions {
  readonly callApi: (path: string, options?: RequestInit) => Promise<any>
  readonly renderPanel: (ownerProps: any) => ReactElement
  readonly ns: string
  readonly injectProps?: Record<string, unknown> | (() => Record<string, unknown>)
  readonly onOnlineUpdateChange?: (enabled: boolean) => void
}

export interface SidebarController {
  isEnabled(): boolean
  isSupported(): boolean
  setEnabled(next: boolean): Promise<boolean>
  isOnlineUpdateEnabled(): boolean
  isOnlineUpdateLocked(): boolean
  setOnlineUpdate(next: boolean): Promise<boolean>
  destroy(): void
}

export function setupSidebarEntry(ctx: ClientContext, options: SetupSidebarEntryOptions): SidebarController {
  if (!ctx.locale) {
    return {
      isEnabled: () => false,
      isSupported: () => false,
      setEnabled: async () => false,
      isOnlineUpdateEnabled: () => true,
      isOnlineUpdateLocked: () => false,
      setOnlineUpdate: async () => false,
      destroy: () => {},
    }
  }

  const { callApi, renderPanel, ns } = options
  let sidebarEntryEnabled = false
  let sidebarSupported = false
  let offPanel: (() => void) | null = null
  let offRow: (() => void) | null = null
  let epoch = 0
  let layoutService: { panelInfo?: { getSnapshot(): { activePanelId?: string } }; selectPanel?(id: string | null): void } | undefined
  const listeners = new Set<() => void>()

  const notify = (): void => {
    for (const listener of listeners) {
      try { listener() } catch {}
    }
  }

  const sync = (): void => {
    if (sidebarSupported && sidebarEntryEnabled) {
      if (!offPanel) {
        const res = ctx.slots.register({
          name: 'main',
          key: SIDEBAR_PANEL_ID,
          locale: ns,
          inject: () => {
            const extra = typeof options.injectProps === 'function' ? options.injectProps() : options.injectProps
            return Object.assign({ t: ctx.locale?.bind ? ctx.locale.bind(ns) : undefined }, extra)
          },
        }, (ownerProps: any) => createElement('div', { className: 'dsh-st-main-panel' }, renderPanel(ownerProps)))
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

  const setEnabled = async (next: boolean): Promise<boolean> => {
    const currentEpoch = ++epoch
    sidebarEntryEnabled = next
    sync()
    notify()
    try {
      await callApi('/sidebar-entry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      return next
    } catch (err) {
      if (currentEpoch === epoch) {
        sidebarEntryEnabled = !next
        sync()
        notify()
      }
      throw err
    }
  }

  let onlineUpdateEnabled = true
  let onlineUpdateLocked = false
  let updateEpoch = 0

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
      if (epoch === loadEpoch && res && typeof res.enabled === 'boolean') {
        sidebarEntryEnabled = res.enabled
        sync()
        notify()
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

  if (typeof (ctx as any).inject === 'function') {
    (ctx as any).inject(['layout'], (scoped: any) => {
      layoutService = scoped.layout
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
        getEnabled: () => sidebarEntryEnabled,
        setSidebar: setEnabled,
        getOnlineUpdateEnabled: () => onlineUpdateEnabled,
        getOnlineUpdateLocked: () => onlineUpdateLocked,
        setOnlineUpdate: setOnlineUpdate,
        subscribe: (fn) => {
          listeners.add(fn)
          return () => { listeners.delete(fn) }
        },
      })
    })
  })

  return {
    isEnabled: () => sidebarEntryEnabled,
    isSupported: () => sidebarSupported,
    setEnabled,
    isOnlineUpdateEnabled: () => onlineUpdateEnabled,
    isOnlineUpdateLocked: () => onlineUpdateLocked,
    setOnlineUpdate,
    destroy: () => {
      listeners.clear()
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
