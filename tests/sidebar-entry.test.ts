import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import {
  setupSidebarEntry,
  BUNDLE_KEY,
  SIDEBAR_PANEL_ID,
  SIDEBAR_PANEL_ORDER,
  readCachedSidebarEntry,
  readCachedHideOfficial,
  STORAGE_KEY_SIDEBAR_ENTRY,
  STORAGE_KEY_HIDE_OFFICIAL,
} from '../src/client/bundle-config.tsx'

test('客户端侧边栏入口与 bundle.config 开关槽位生命周期', async () => {
  const slotRegistrations = new Map<string, { meta: any; component: any }>()
  const slotInjections = new Map<string, () => void>()
  let currentActivePanel: string | null = null

  const mockCtx = {
    locale: {
      bind: (ns: string) => (key: string) => `${ns}:${key}`,
    },
    slots: {
      register: (meta: any, component: any) => {
        slotRegistrations.set(meta.name, { meta, component })
        return () => {
          if (slotRegistrations.get(meta.name)?.meta === meta) {
            slotRegistrations.delete(meta.name)
          }
        }
      },
      inject: (name: string, handler: () => void) => {
        slotInjections.set(name, handler)
        return () => { slotInjections.delete(name) }
      },
    },
    inject: (names: string[], callback: (scoped: any) => void) => {
      if (names.includes('layout')) {
        callback({
          layout: {
            panelInfo: {
              getSnapshot: () => ({ activePanelId: currentActivePanel }),
            },
            selectPanel: (id: string | null) => {
              currentActivePanel = id
            },
          },
        })
      }
    },
  } as any

  let clientSidebar = false
  let clientUpdate = true
  let clientLocked = false
  const mockWorkspaces = { create: (input: any) => ({ id: 'ws-mock-id', ...input }) }

  const controller = setupSidebarEntry(mockCtx, {
    callApi: async (path: string, options?: RequestInit) => {
      if (path === '/sidebar-entry') {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body as string)
          clientSidebar = body.enabled
          return { ok: true, enabled: clientSidebar }
        }
        return { ok: true, enabled: clientSidebar }
      }
      if (path === '/online-update') {
        if (options?.method === 'POST') {
          if (clientLocked) throw new Error('locked')
          const body = JSON.parse(options.body as string)
          clientUpdate = body.enabled
          return { ok: true, enabled: clientUpdate }
        }
        return { ok: true, enabled: clientUpdate, locked: clientLocked }
      }
      throw new Error('unexpected path: ' + path)
    },
    renderPanel: (ownerProps: any) => createElement('div', { id: 'panel' }, JSON.stringify(ownerProps)),
    ns: 'dsh-automation',
    injectProps: () => ({
      createWorkspace: (input: any) => mockWorkspaces.create(input),
      pickDirectory: async () => 'D:/mock-dir',
      permissionT: (k: string) => 'perm:' + k,
      modelT: (k: string) => 'model:' + k,
    }),
  })

  // 1. 默认平替接管开启状态
  assert.equal(controller.isEnabled(), true)
  assert.equal(controller.isSupported(), false)
  assert.equal(slotRegistrations.has('main'), false)
  assert.equal(slotRegistrations.has('sidebar.panellist'), false)

  // 触发 sidebar.panellist 插槽注入事件
  const panellistHandler = slotInjections.get('sidebar.panellist')
  assert.ok(panellistHandler, '必须注入 sidebar.panellist')
  panellistHandler!()
  assert.equal(controller.isSupported(), true)
  assert.ok(slotRegistrations.has('main'), '平替接管：插槽支持后自动注册 main 槽位')
  assert.equal(slotRegistrations.get('main')?.meta.key, SIDEBAR_PANEL_ID)

  // 验证 Bug 1 修复：main 槽位 inject 注入了完整的工作区与目录选择函数
  const mainMeta = slotRegistrations.get('main')!.meta
  assert.equal(typeof mainMeta.inject, 'function', 'main 必须包含 inject 函数')
  const injected = mainMeta.inject()
  assert.equal(typeof injected.createWorkspace, 'function', 'main 必须注入 createWorkspace')
  assert.equal(injected.createWorkspace({ name: 'demo' }).id, 'ws-mock-id')
  assert.equal(typeof injected.pickDirectory, 'function', 'main 必须注入 pickDirectory')
  assert.equal(typeof injected.permissionT, 'function', 'main 必须注入 permissionT')
  assert.equal(typeof injected.modelT, 'function', 'main 必须注入 modelT')

  // 验证 sidebar.panellist 注册
  assert.ok(slotRegistrations.has('sidebar.panellist'), '平替接管：插槽支持后自动注册 sidebar.panellist 槽位')
  assert.equal(slotRegistrations.get('sidebar.panellist')?.meta.id, SIDEBAR_PANEL_ID)
  assert.equal(slotRegistrations.get('sidebar.panellist')?.meta.order, SIDEBAR_PANEL_ORDER)

  // 2. 当前处于该面板时关闭侧边栏入口，验证触发 selectPanel(null)
  currentActivePanel = SIDEBAR_PANEL_ID
  await controller.setEnabled(false)
  assert.equal(controller.isEnabled(), false)
  assert.equal(slotRegistrations.has('main'), false, '关闭后注销 main')
  assert.equal(slotRegistrations.get('sidebar.panellist'), undefined, '关闭后注销 sidebar.panellist')
  assert.equal(currentActivePanel, null, '关闭面板时如果当前激活该面板，安全调用 selectPanel(null)')

  // 3. 再次开启侧边栏入口
  await controller.setEnabled(true)
  assert.equal(controller.isEnabled(), true)
  assert.ok(slotRegistrations.has('main'), '重新开启后注册 main')
  assert.ok(slotRegistrations.has('sidebar.panellist'), '重新开启后注册 sidebar.panellist')
  assert.equal(currentActivePanel, null, '关闭面板时如果当前激活该面板，安全调用 selectPanel(null)')

  // 4. 验证 plugins.bundle.config 插槽卡片
  const bundleHandler = slotInjections.get('plugins.bundle.config')
  assert.ok(bundleHandler, '必须注入 plugins.bundle.config')
  bundleHandler!()
  assert.ok(slotRegistrations.has('plugins.bundle.config'))
  const configEntry = slotRegistrations.get('plugins.bundle.config')!
  assert.equal(configEntry.meta.key, BUNDLE_KEY)

  // 验证 summary 视图返回 null
  const summaryRender = configEntry.component({ view: 'summary' })
  assert.equal(summaryRender, null, 'view 为 summary 时返回 null')

  // 5. 在线更新控制与 Bug 3 修复验证
  assert.equal(controller.isOnlineUpdateEnabled(), true)
  assert.equal(controller.isOnlineUpdateLocked(), false)
  let changeCount = 0
  const toggleController = setupSidebarEntry(mockCtx, {
    callApi: async (path: string, options?: RequestInit) => {
      if (path === '/online-update') {
        if (options?.method === 'POST') {
          return { ok: true, enabled: false }
        }
        return { ok: true, enabled: true, locked: false }
      }
      return { ok: true, enabled: false }
    },
    renderPanel: () => createElement('div'),
    ns: 'dsh-automation',
    onOnlineUpdateChange: () => { changeCount += 1 },
  })
  await toggleController.setOnlineUpdate(false)
  assert.equal(toggleController.isOnlineUpdateEnabled(), false)
  assert.ok(changeCount >= 2, '乐观更新与保存成功后均派发变更通知')
  toggleController.destroy()

  controller.destroy()

  // 6. 验证宿主锁定场景（locked: true）
  const lockedController = setupSidebarEntry(mockCtx, {
    callApi: async (path: string) => {
      if (path === '/sidebar-entry') return { ok: true, enabled: true }
      if (path === '/online-update') return { ok: true, enabled: false, locked: true }
      return {}
    },
    renderPanel: () => createElement('div'),
    ns: 'dsh-automation',
  })
  await new Promise((r) => setTimeout(r, 10))
  assert.equal(lockedController.isOnlineUpdateLocked(), true, '感知宿主锁定状态')
  await lockedController.setOnlineUpdate(true)
  assert.equal(lockedController.isOnlineUpdateEnabled(), false, '宿主锁定状态下拒绝开启在线更新')
  lockedController.destroy()

  // 7. 验证屏蔽官方自动化入口的生命周期与样式标签清理及激活态重置
  let styleCreated = false
  let styleRemoved = false
  let styleContent = ''
  const mockStyleElement: any = {
    dataset: {},
    set textContent(val: string) {
      styleContent = val
    },
    get textContent() {
      return styleContent
    },
    remove: () => {
      styleRemoved = true
      styleCreated = false
    },
  }
  ;(globalThis as any).document = {
    querySelector: (selector: string) => {
      if (selector.includes('dsh-automation-hide-official-schedule')) {
        return styleCreated ? mockStyleElement : null
      }
      return null
    },
    createElement: (tag: string) => {
      if (tag === 'style') {
        return mockStyleElement
      }
      return {}
    },
    head: {
      appendChild: (el: any) => {
        if (el === mockStyleElement) {
          styleCreated = true
          styleRemoved = false
        }
      },
    },
  }

  // 模拟当前正停留在官方 schedules 页面
  currentActivePanel = 'schedules'

  const officialController = setupSidebarEntry(mockCtx, {
    callApi: async (path: string, options?: RequestInit) => {
      if (path === '/official-schedule') {
        if (options?.method === 'POST') return { ok: true, enabled: false }
        return { ok: true, enabled: true }
      }
      return {}
    },
    renderPanel: () => createElement('div'),
    ns: 'dsh-automation',
  })

  assert.equal(officialController.isHideOfficialScheduleEnabled(), true, '默认开启屏蔽官方自动化入口')
  assert.equal(styleCreated, true, '默认挂载隐藏样式标签')
  assert.ok(styleContent.includes('nav button[aria-label='), 'CSS 选择器精准限定在 nav 侧栏容器内')
  assert.equal(currentActivePanel, null, '隐藏官方入口时自动将官方 schedules 面板重置切回默认会话')

  await officialController.setHideOfficialSchedule(false)
  assert.equal(officialController.isHideOfficialScheduleEnabled(), false, '成功关闭屏蔽')
  assert.equal(styleRemoved, true, '关闭屏蔽后样式标签被立即移除')

  await officialController.setHideOfficialSchedule(true)
  assert.equal(officialController.isHideOfficialScheduleEnabled(), true, '重新开启屏蔽')

  officialController.destroy()
  assert.equal(styleRemoved, true, '插件销毁/卸载时样式标签被自动清理复原')

  // 8. 验证缓存推导：无 hideOfficial 缓存时跟随 sidebarEntry 缓存，杜绝升级死区
  const origLocal = (globalThis as any).localStorage
  const memStore = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => memStore.get(k) ?? null,
    setItem: (k: string, v: string) => memStore.set(k, v),
  }
  assert.equal(readCachedSidebarEntry(), true)
  assert.equal(readCachedHideOfficial(), true)
  memStore.set(STORAGE_KEY_SIDEBAR_ENTRY, 'false')
  assert.equal(readCachedHideOfficial(), false, '无 hideOfficial 缓存且 sidebarEntry 为 false 时安全回退为 false')
  memStore.set(STORAGE_KEY_HIDE_OFFICIAL, 'true')
  assert.equal(readCachedHideOfficial(), true, '显式设置 hideOfficial=true 时优先遵循显式值')
  ;(globalThis as any).localStorage = origLocal
})
