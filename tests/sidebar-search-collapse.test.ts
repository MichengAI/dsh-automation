import assert from 'node:assert/strict'
import test from 'node:test'
import { createNativeTabRegistry } from '../src/client/native-tabs.ts'
// @ts-expect-error 组件级测试使用可控 Hook
import { createShellHarness, findNode } from './sidebar-shell-harness.mjs'

test('侧栏收起时(wide: false)阻断官方任务树因历史搜索请求而在首帧挂载时误调用 expandSidebar 导致侧栏自动弹回', () => {
  const registry = createNativeTabRegistry(null)
  const shell = createShellHarness()
  
  let expandSidebarCalls = 0
  let searchRequest = 0
  
  // 模拟官方 WorkspaceBrowser 的行为
  const MockOfficialWorkspaceBrowser = (props: Record<string, unknown>): JSX.Element => {
    // 官方在组件挂载首帧执行 useEffect，若检测到 !wide 且 searchRequest > 0 则会调用 expandSidebar()
    if (props.wide === false && searchRequest > 0) {
      if (typeof props.expandSidebar === 'function') {
        (props.expandSidebar as () => void)()
      }
    }
    return { type: 'mock-official-tree', props } as unknown as JSX.Element
  }

  const hostProps = {
    expandSidebar: () => {
      expandSidebarCalls++
    },
  }

  // 1. 展开状态下渲染并切换到 schedule 页签
  const wideTree = shell.render({
    officialTree: MockOfficialWorkspaceBrowser,
    tabRegistry: registry,
    hostProps,
    wide: true,
  })
  const tabs = findNode(wideTree, (node: JSX.Element) => node.type === 'segmented-tabs')
  assert.ok(tabs)
  tabs.props.onChange('schedule')
  shell.render({
    officialTree: MockOfficialWorkspaceBrowser,
    tabRegistry: registry,
    hostProps,
    wide: true,
  })

  // 2. 模拟用户在展开视图下点击了搜索框（导致宿主全局 searchRequest 增加）
  searchRequest = 1

  // 3. 用户点击侧栏收起按钮，宿主传入 wide = false
  const narrowTree = shell.render({
    officialTree: MockOfficialWorkspaceBrowser,
    tabRegistry: registry,
    hostProps,
    wide: false,
  })

  // 执行子组件渲染与初始 effect
  const officialNode = findNode(narrowTree, (node: JSX.Element) => node.type === MockOfficialWorkspaceBrowser)
  assert.ok(officialNode, '收起侧栏后必须渲染 Official')
  ;(officialNode.type as (props: Record<string, unknown>) => JSX.Element)(officialNode.props)

  // 4. 断言：收起侧边栏时不能触发 expandSidebar，侧边栏必须保持收起状态！
  assert.equal(expandSidebarCalls, 0, '侧栏收起时不应调用 expandSidebar，防止侧栏自动弹回！')

  // 5. 断言：传给 Official 的 useWorkspaceShortcuts 中 searchRequest 必须为 0，防止激活会话搜索框
  const useWorkspaceShortcuts = officialNode.props.useWorkspaceShortcuts as ((select: (state: { searchRequest: number }) => number) => number) | undefined
  if (typeof useWorkspaceShortcuts === 'function') {
    const isolatedSearchRequest = useWorkspaceShortcuts(s => s.searchRequest)
    assert.equal(isolatedSearchRequest, 0, '传给 Official 的 searchRequest 必须被隔离重置为 0')
  }
})

test('定时记录视图(ScheduledRecordsView)下收起或有搜索请求时，也绝不调用 expandSidebar 弹开侧栏', () => {
  const registry = createNativeTabRegistry(null)
  const shell = createShellHarness()

  let expandSidebarCalls = 0
  const MockOfficialWorkspaceBrowser = (props: Record<string, unknown>): JSX.Element => {
    if (typeof props.expandSidebar === 'function') {
      (props.expandSidebar as () => void)()
    }
    return { type: 'mock-official-tree', props } as unknown as JSX.Element
  }

  const hostProps = {
    expandSidebar: () => {
      expandSidebarCalls++
    },
    useWorkspaceShortcuts: <T,>(select: (state: { searchRequest: number }) => T): T => select({ searchRequest: 2 }),
  }

  // 在记录视图下渲染
  const recordsTree = shell.renderRecords({
    officialTree: MockOfficialWorkspaceBrowser,
    hostProps,
    wide: true,
  })

  const recordsOfficialNode = findNode(recordsTree, (node: JSX.Element) => node.type === MockOfficialWorkspaceBrowser)
  assert.ok(recordsOfficialNode, '记录视图下应渲染 Official')
  ;(recordsOfficialNode.type as (props: Record<string, unknown>) => JSX.Element)(recordsOfficialNode.props)

  // 断言：在记录视图下，Official 调用 expandSidebar 也必须被 noop 吸收，不能向宿主触发展开
  assert.equal(expandSidebarCalls, 0, '记录视图下的 Official 也绝不能调用 expandSidebar 导致侧栏秒弹回！')
})

test('语言字典就绪或语言刷新后，分段器页签文字应同步显示中文，不能被旧缓存锁死为英文', () => {
  const registry = createNativeTabRegistry(null)
  const shell = createShellHarness()
  
  let currentLang = 'en'
  const t = (key: string): string => {
    if (currentLang === 'zh') {
      if (key === 'sidebar.tasksTab') return '任务'
      if (key === 'sidebar.tab') return '定时'
      if (key === 'sidebar.tabs') return '工作区分类'
    }
    if (key === 'sidebar.tasksTab') return 'Tasks'
    if (key === 'sidebar.tab') return 'Scheduled'
    if (key === 'sidebar.tabs') return 'Workspace views'
    return key
  }

  // 首次渲染处于英文状态
  const enTree = shell.render({
    officialTree: (): null => null,
    tabRegistry: registry,
    t,
    wide: true,
  })
  const enTabs = findNode(enTree, (node: JSX.Element) => node.type === 'segmented-tabs')
  assert.ok(enTabs)
  
  // 切换为中文环境
  currentLang = 'zh'
  const zhTree = shell.render({
    officialTree: (): null => null,
    tabRegistry: registry,
    t,
    wide: true,
  })
  const zhTabs = findNode(zhTree, (node: JSX.Element) => node.type === 'segmented-tabs')
  assert.ok(zhTabs)
  
  // 验证页签文本应更新为中文
  const taskTab = zhTabs.props.items.find((item: { value: string }) => item.value === 'tasks')
  const scheduleTab = zhTabs.props.items.find((item: { value: string }) => item.value === 'schedule')
  assert.ok(taskTab)
  assert.ok(scheduleTab)
  
  const extractText = (labelNode: unknown): string => {
    if (labelNode == null) return ''
    if (typeof labelNode === 'string') return labelNode
    if (typeof labelNode === 'object' && 'props' in (labelNode as any)) {
      const children = (labelNode as any).props.children
      if (Array.isArray(children)) return children.map(extractText).join('')
      return extractText(children)
    }
    return ''
  }

  assert.equal(extractText(taskTab.label), '任务', '任务标签应为中文')
  assert.equal(extractText(scheduleTab.label), '定时', '定时标签应为中文')
})
