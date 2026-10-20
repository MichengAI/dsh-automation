import assert from 'node:assert/strict'
import test from 'node:test'
import { createNativeTabRegistry } from '../src/client/native-tabs.ts'
// @ts-expect-error 组件级测试使用可控 Hook，不属于生产接口。
import { createShellHarness, findNode } from './sidebar-shell-harness.mjs'

test('点击已注册的频道必须渲染贡献组件，不能跨槽调用工作区 renderSlot', () => {
  const registry = createNativeTabRegistry(null)
  const calls: Record<string, unknown>[] = []
  registry.insert({ id: 'channels', label: '频道', order: 20, render: props => { calls.push(props); return 'channel-body' } })
  const shell = createShellHarness()
  const hostOpenCalls: string[] = []
  const props = {
    tabRegistry: registry,
    hostProps: { marker: 'host-props', open: (id: string) => { hostOpenCalls.push(id) } },
    renderSlot: (): never => assert.fail('频道不是工作区声明的子槽位，不允许跨槽调用'),
  }
  const initial = shell.render(props)
  const tabs = findNode(initial, (node: JSX.Element) => node.type === 'segmented-tabs')
  assert.ok(tabs.props.items.some((item: { value: string }) => item.value === 'channels'))
  tabs.props.onChange('channels')
  const selected = shell.render(props)
  assert.equal(findNode(selected, (node: JSX.Element) => node.props.role === 'tabpanel').props.children, 'channel-body')
  assert.equal(calls.length, 1)
  assert.equal(typeof calls[0]?.openSession, 'function')
  ;(calls[0]?.openSession as (id: string) => void)('session-1')
  assert.deepEqual(hostOpenCalls, ['session-1'])
  assert.equal(calls[0]?.marker, 'host-props')
})

test('频道槽有条目但贡献尚未就绪时不显示不可用入口，迟到注册后即可点击', () => {
  const registry = createNativeTabRegistry(null)
  const shell = createShellHarness()
  const props = { tabRegistry: registry, renderSlot: () => assert.fail('不允许跨槽调用') }
  let tree = shell.render(props)
  assert.equal(findNode(tree, (node: JSX.Element) => node.type === 'segmented-tabs').props.items.some((item: { value: string }) => item.value === 'channels'), false)
  registry.insert({ id: 'channels', label: '频道', render: () => 'late-channel-body' })
  tree = shell.render(props)
  const tabs = findNode(tree, (node: JSX.Element) => node.type === 'segmented-tabs')
  assert.equal(tabs.props.items.filter((item: { value: string }) => item.value === 'channels').length, 1)
  tabs.props.onChange('channels')
  assert.equal(findNode(shell.render(props), (node: JSX.Element) => node.props.role === 'tabpanel').props.children, 'late-channel-body')
})

test('已选频道卸载后回到任务树，重新注册后可恢复频道且不会跨槽渲染', () => {
  const registry = createNativeTabRegistry(null)
  const remove = registry.insert({ id: 'channels', label: '频道', render: () => 'channel-body' })
  const shell = createShellHarness()
  const Official = (): null => null
  const props = { officialTree: Official, tabRegistry: registry, renderSlot: () => assert.fail('不允许跨槽调用') }
  findNode(shell.render(props), (node: JSX.Element) => node.type === 'segmented-tabs').props.onChange('channels')
  remove()
  const tree = shell.render(props)
  assert.equal(findNode(tree, (node: JSX.Element) => node.type === 'segmented-tabs').props.value, 'tasks')
  assert.ok(findNode(tree, (node: JSX.Element) => node.type === Official))
  registry.insert({ id: 'channels', label: '频道', render: () => 'new-channel-body' })
  assert.equal(findNode(shell.render(props), (node: JSX.Element) => node.props.role === 'tabpanel').props.children, 'new-channel-body')
})

test('侧栏在展开(wide: true)与收起(wide: false)之间切换时，Hook 调用顺序和数量保持一致，不破坏外壳渲染', () => {
  const registry = createNativeTabRegistry(null)
  registry.insert({ id: 'channels', label: '频道', order: 20, render: () => 'channel-body' })
  const shell = createShellHarness()
  const Official = (props: Record<string, unknown>): JSX.Element => ({ type: 'official-tree', props } as unknown as JSX.Element)
  const propsWide = { officialTree: Official, tabRegistry: registry, wide: true }
  const propsNarrow = { officialTree: Official, tabRegistry: registry, wide: false }

  // 1. 初次渲染宽栏：应包含分段器
  const wide1 = shell.render(propsWide)
  assert.ok(findNode(wide1, (node: JSX.Element) => node.type === 'segmented-tabs'))

  // 2. 切换到收起窄栏（模拟收起侧栏 / 手机开抽屉）：Hook 数量必须严格一致，不抛 React #300/#310
  const narrow1 = shell.render(propsNarrow)
  assert.equal(findNode(narrow1, (node: JSX.Element) => node.type === 'segmented-tabs'), undefined)
  assert.ok(findNode(narrow1, (node: JSX.Element) => node.type === Official))

  // 3. 再次展开：Hook 数量依然一致，分段器重新正常呈现
  const wide2 = shell.render(propsWide)
  assert.ok(findNode(wide2, (node: JSX.Element) => node.type === 'segmented-tabs'))

  // 4. 反复多次切换保持稳定
  for (let i = 0; i < 5; i++) {
    shell.render(propsNarrow)
    shell.render(propsWide)
  }
})

