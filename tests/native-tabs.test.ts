import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applySessionFilters,
  attachNativeTabRegistry,
  createNativeTabRegistry,
  findNativeTabRegistry,
  isForeignSidebarHost,
  openRegisteredSession,
} from '../src/client/native-tabs.ts'

test('later plugin inserts a tab instead of wrapping again', () => {
  const official = function Official() { return null }
  const registry = createNativeTabRegistry(official)
  const host = function Host() { return null }
  host.__dshNativeTabHost = true
  attachNativeTabRegistry(host, registry)
  const entry = { component: host }
  assert.equal(isForeignSidebarHost(host), true)
  assert.equal(findNativeTabRegistry(entry), registry)
  const dispose = registry.insert({
    id: 'schedule',
    label: '定时',
    order: 30,
    render: () => 'rail',
  })
  assert.deepEqual(registry.getTabs().map(item => item.id), ['schedule'])
  dispose()
  assert.deepEqual(registry.getTabs().map(item => item.id), [])
})

test('session filters hide automation sessions from the host task tree', () => {
  const registry = createNativeTabRegistry(null)
  registry.addSessionFilter(id => !id.startsWith('dsh-automation-session-'))
  assert.equal(registry.sessionFilters[0]?.('chat-1'), true)
  assert.equal(registry.sessionFilters[0]?.('dsh-automation-session-1'), false)
})

test('统一过滤器保留当前会话，并在增删过滤器后随 revision 重新计算', () => {
  const registry = createNativeTabRegistry(null)
  const state = {
    ids: ['a', 'b'],
    byId: { a: { id: 'a' }, b: { id: 'b' } },
    current: 'a',
  }
  assert.equal(applySessionFilters(state, registry), state)
  const dispose = registry.addSessionFilter(id => id !== 'b')
  assert.equal(registry.getRevision(), 1)
  const filtered = applySessionFilters(state, registry)
  assert.deepEqual(filtered.ids, ['a'])
  assert.deepEqual(Object.keys(filtered.byId ?? {}), ['a'])
  assert.equal(filtered.current, 'a')
  dispose()
  assert.equal(registry.getRevision(), 2)
  assert.equal(applySessionFilters(state, registry), state)
})

test('同一快照在相同 revision 的不同注册表之间不能串用过滤缓存', () => {
  const state = { ids: ['a', 'b'], byId: { a: {}, b: {} } }
  const first = createNativeTabRegistry(null)
  const second = createNativeTabRegistry(null)
  first.addSessionFilter(id => id !== 'b')
  second.addSessionFilter(id => id !== 'a')
  const filtered = applySessionFilters(state, first)
  assert.equal(applySessionFilters(state, first), filtered)
  assert.equal(first.getRevision(), second.getRevision())
  assert.deepEqual(applySessionFilters(state, second).ids, ['b'])
  assert.equal(applySessionFilters(state, first), filtered)
})

test('会话打开器按 order 分发，未匹配时回退宿主', () => {
  const registry = createNativeTabRegistry(null)
  const calls: string[] = []
  registry.addSessionOpener({
    id: 'im',
    order: 20,
    matchSession: () => true,
    open: id => { calls.push(`im:${id}`) },
  })
  const dispose = registry.addSessionOpener({
    id: 'automation',
    order: 10,
    matchSession: id => id.startsWith('dsh-automation-session-'),
    open: id => { calls.push(`automation:${id}`) },
  })
  openRegisteredSession('dsh-automation-session-1', registry, id => { calls.push(`host:${id}`) })
  openRegisteredSession('normal', registry, id => { calls.push(`host:${id}`) })
  dispose()
  openRegisteredSession('dsh-automation-session-2', registry, id => { calls.push(`host:${id}`) })
  assert.deepEqual(calls, [
    'automation:dsh-automation-session-1',
    'im:normal',
    'im:dsh-automation-session-2',
  ])
})

test('旧页签的卸载不会删除同 ID 的新页签，也不会发送多余通知', () => {
  const registry = createNativeTabRegistry(null)
  const oldTab = { id: 'schedule', label: '旧页签', render: () => null }
  const newTab = { id: 'schedule', label: '新页签', render: () => null }
  let notifications = 0
  registry.subscribe(() => { notifications += 1 })
  const removeOld = registry.insert(oldTab)
  const removeNew = registry.insert(newTab)
  const snapshot = registry.getTabs()
  removeOld()
  assert.deepEqual(registry.getTabs(), [newTab])
  assert.equal(registry.getTabs(), snapshot)
  assert.equal(notifications, 2)
  removeNew()
  assert.deepEqual(registry.getTabs(), [])
  assert.equal(notifications, 3)
  removeNew()
  removeOld()
  assert.equal(notifications, 3)
})

test('侧栏切换后只认当前组件的注册表，不使用 entry 残留缓存', () => {
  const stale = createNativeTabRegistry(null)
  const current = createNativeTabRegistry(null)
  const component = function CurrentShell(): null { return null }
  attachNativeTabRegistry(component, current)
  const entry = { component, __dshNativeTabs: stale }
  assert.equal(findNativeTabRegistry(entry), current)
  entry.component = function NewTree(): null { return null }
  assert.equal(findNativeTabRegistry(entry), undefined)
  assert.equal(findNativeTabRegistry({ __dshNativeTabs: current }), current)
  assert.equal(findNativeTabRegistry(component), current)
})

test('不完整或不兼容的注册表不参与协作', () => {
  const valid = createNativeTabRegistry(null)
  for (const invalid of [{ insert() {} }, { ...valid, version: 2 }, { ...valid, getTabs: null }, { ...valid, subscribe: null }]) {
    assert.equal(findNativeTabRegistry({ __dshNativeTabs: invalid }), undefined)
  }
})

test('task-tree-sessions 开关状态与 applySessionFilters 协同：与 IM 并存过滤与独立恢复', () => {
  const registry = createNativeTabRegistry(null)
  const state = {
    ids: ['chat-normal', 'im:wecom:1', 'dsh-automation-session-run-1'],
    byId: {
      'chat-normal': { id: 'chat-normal' },
      'im:wecom:1': { id: 'im:wecom:1' },
      'dsh-automation-session-run-1': { id: 'dsh-automation-session-run-1' },
    },
  }

  // 1. 默认状态：没有过滤定时会话，所有会话可见
  assert.deepEqual(applySessionFilters(state, registry).ids, ['chat-normal', 'im:wecom:1', 'dsh-automation-session-run-1'])

  // 2. 模拟 IM 插件注册自己的频道过滤器
  const disposeIm = registry.addSessionFilter(id => !id.startsWith('im:'))
  assert.deepEqual(applySessionFilters(state, registry).ids, ['chat-normal', 'dsh-automation-session-run-1'])

  // 3. 用户在自动化设置中关闭「在任务树显示定时会话」：注册定时会话过滤器
  const disposeAutomation = registry.addSessionFilter(id => !id.startsWith('dsh-automation-session-'))
  assert.deepEqual(applySessionFilters(state, registry).ids, ['chat-normal'], '同时过滤 IM 会话与定时会话')

  // 4. 用户重新开启「在任务树显示定时会话」：注销定时过滤器，IM 过滤仍保留
  disposeAutomation()
  assert.deepEqual(applySessionFilters(state, registry).ids, ['chat-normal', 'dsh-automation-session-run-1'])

  // 5. IM 卸载或关闭：全部恢复
  disposeIm()
  assert.deepEqual(applySessionFilters(state, registry).ids, ['chat-normal', 'im:wecom:1', 'dsh-automation-session-run-1'])
})
