import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import {
  setupSidebarEntry,
  AutomationBundleConfigCard,
  BUNDLE_KEY,
  SIDEBAR_PANEL_ID,
  SIDEBAR_PANEL_ORDER,
  readCachedSidebarEntry,
  readCachedHideOfficial,
  STORAGE_KEY_SIDEBAR_ENTRY,
  STORAGE_KEY_HIDE_OFFICIAL,
} from '../src/client/bundle-config.tsx'
import { formatSchedule } from '../src/client/helpers.ts'
import { de, en, zh } from '../src/client/locales.ts'

test('客户端侧边栏入口与 bundle.config 开关槽位生命周期', async () => {
  const slotRegistrations = new Map<string, { meta: any; component: any }>()
  const slotInjections = new Map<string, () => void>()
  let currentActivePanel: string | null = null

  const mockCtx = {
    locale: {
      bind: (ns: string) => (key: string) => (ns === 'schedule.manager' && key === 'panel' ? 'Runtime Schedule Label' : key),
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

  controller.destroy()

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
  for (const label of [
    '自动化任务',
    'Automation tasks',
    '自動化タスク',
    'Tareas de automatización',
    "Tâches d'automatisation",
    'Automatisierungsaufgaben',
    'Задачи автоматизации',
    'Tarefas de automação',
  ]) {
    assert.ok(styleContent.includes(`nav button[aria-label="${label}"]`), `默认规则缺少宿主语言标签: ${label}`)
  }
  assert.ok(
    styleContent.includes('nav button[aria-label="Runtime Schedule Label"]'),
    '运行时标签必须通过宿主 schedule.manager 命名空间的 panel 词条读取',
  )
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

  // 9. 验证 taskTreeSessions 开关与缓存读取
  let taskTreeCallbackValue: boolean | undefined = undefined
  let backendTaskTreeState = false
  const taskTreeController = setupSidebarEntry(mockCtx, {
    callApi: async (path: string, options?: RequestInit) => {
      if (path === '/task-tree-sessions') {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body as string)
          backendTaskTreeState = body.enabled
          return { ok: true, enabled: backendTaskTreeState }
        }
        return { ok: true, enabled: backendTaskTreeState }
      }
      return {}
    },
    renderPanel: () => createElement('div'),
    ns: 'dsh-automation',
    onTaskTreeSessionsChange: (enabled: boolean) => {
      taskTreeCallbackValue = enabled
    },
  })

  assert.equal(taskTreeController.isTaskTreeSessionsEnabled(), false, '默认在任务树隐藏定时会话')
  await taskTreeController.setTaskTreeSessions(true)
  assert.equal(taskTreeController.isTaskTreeSessionsEnabled(), true, '成功开启在任务树显示')
  assert.equal(backendTaskTreeState, true, '后端状态同步更新为 true')
  assert.equal(taskTreeCallbackValue, true, 'onTaskTreeSessionsChange 回调收到通知')

  ;(globalThis as any).localStorage = origLocal
})

test('设置卡片仅渲染 2 个 Switch 与 1 个 SegmentedControl，共 3 行', () => {
  const card = AutomationBundleConfigCard({
    t: (k: string) => k,
    onLocationChange: () => {},
    onToggleHideOfficialSchedule: () => {},
    onToggleTaskTreeSessions: () => {},
  })

  // card 为 React.Fragment，包含 rows 数组
  const rows = card.props.children as Array<{ props?: { children?: any[] } }>
  assert.equal(rows.length, 3, '卡片必须严格包含 3 行配置')

  const controlRow0 = rows[0]?.props?.children?.[1]
  const switchRow1 = rows[1]?.props?.children?.[1]
  const switchRow2 = rows[2]?.props?.children?.[1]

  assert.equal(controlRow0?.type?.name, 'SegmentedControl', '首行必须是 SegmentedControl 位置选择器')
  assert.equal(switchRow1?.type?.name, 'Switch', '第 2 行必须是 Switch 原生开关')
  assert.equal(switchRow2?.type?.name, 'Switch', '第 3 行必须是 Switch 原生开关')
})

test('周几排程在不同语言下的分隔符测试（西文逗号空格 vs 中日文顿号）', () => {
  const schedule = {
    kind: 'weekly' as const,
    weekdays: [1, 3, 5] as const,
    time: '09:00',
  }

  const createT = (dict: Record<string, string>) => (k: string, params?: Record<string, string | number>) => {
    let text = dict[k] ?? k
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal))
      }
    }
    return text
  }

  // 中文：周一、周三、周五 · 09:00
  const zhText = formatSchedule(schedule, createT(zh as any) as any)
  assert.equal(zhText, '周一、周三、周五 · 09:00')

  // 英文：Mon, Wed, Fri · 09:00
  const enText = formatSchedule(schedule, createT(en as any) as any)
  assert.equal(enText, 'Mon, Wed, Fri · 09:00')

  // 德文：Mo, Mi, Fr · 09:00
  const deText = formatSchedule(schedule, createT(de as any) as any)
  assert.equal(deText, 'Mo, Mi, Fr · 09:00')

  // 当宿主缺失词条回退裸键名时，必须安全回退为逗号空格，不得泄漏键名
  const fallbackText = formatSchedule(schedule, ((k: string, p?: any) => {
    if (k === 'schedule.weeklyAt') return `{days} · {time}`.replace('{days}', p?.days).replace('{time}', p?.time)
    if (k.startsWith('day.')) return `D${k.slice(4)}`
    return k // 裸键名回退
  }) as any)
  assert.equal(fallbackText, 'D1, D3, D5 · 09:00', '裸键名必须被过滤，回退为逗号空格')
})
