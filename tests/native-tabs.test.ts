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
