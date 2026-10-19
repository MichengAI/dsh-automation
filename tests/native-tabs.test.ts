import assert from 'node:assert/strict'
import test from 'node:test'
import {
  attachNativeTabRegistry,
  createNativeTabRegistry,
  findNativeTabRegistry,
  isForeignSidebarHost,
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
