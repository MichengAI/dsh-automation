import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error 与侧栏测试共用真实外壳的 Hook harness。
import { createShellHarness, findNode } from './sidebar-shell-harness.mjs'
import { createNativeTabRegistry } from '../src/client/native-tabs.ts'
import { readStoredSidebarTab } from '../src/client/schedule-rail-model.ts'

test('自动化外壳迁移 IM 旧页签，首个主会话不抢选择，频道注销后安全回落', () => {
  const values = new Map([['dsh-im-connect.sidebar-tab', 'channels']])
  const listeners = new Set<(event: unknown) => void>()
  class Button {
    textContent = 'New chat'
    row = true
    getAttribute() { return null }
    closest(selector: string) { return selector === 'button' || this.row ? this : null }
  }
  const shell = createShellHarness({
    window: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } },
    document: { addEventListener: (_: string, fn: (event: unknown) => void) => listeners.add(fn), removeEventListener: (_: string, fn: (event: unknown) => void) => listeners.delete(fn) },
    Element: Button,
  })
  const registry = createNativeTabRegistry(null)
  const removeChannel = registry.insert({ id: 'channels', label: '频道', render: () => null })
  let current: string | null = null
  const props = { tabRegistry: registry, useSessions: (select: (state: unknown) => unknown) => select({ byId: current ? { [current]: { retainedBy: { mainView: 1 } } } : {} }) }
  const selected = () => findNode(shell.renderWithEffects(props), (node: any) => node.type === 'segmented-tabs').props.value
  assert.equal(selected(), 'channels')
  current = 'normal'
  assert.equal(selected(), 'channels')
  assert.equal(values.get('dsh-native-sidebar.tab'), 'channels')
  const button = new Button()
  for (const listener of listeners) listener({ target: button })
  assert.equal(selected(), 'channels')
  removeChannel()
  assert.equal(selected(), 'tasks')
  registry.insert({ id: 'channels', label: '频道', render: () => null })
  assert.equal(selected(), 'channels')
  button.row = false
  for (const listener of listeners) listener({ target: button })
  assert.equal(selected(), 'tasks')
})

test('页签迁移保留 IM 旧键、只清本插件旧键，存储不可用时回落任务页', () => {
  const legacyOnly = new Map([['dsh-automation.sidebar-tab', 'schedule']])
  const storage = {
    getItem: (key: string) => legacyOnly.get(key) ?? null,
    setItem: (key: string, value: string) => { legacyOnly.set(key, value) },
    removeItem: (key: string) => { legacyOnly.delete(key) },
  }
  assert.equal(readStoredSidebarTab(storage), 'schedule')
  assert.equal(legacyOnly.get('dsh-native-sidebar.tab'), 'schedule')
  assert.equal(legacyOnly.has('dsh-automation.sidebar-tab'), false)

  // IM 的旧键属于 IM：旧版 IM 仍会读它，本插件不能删。
  const imOwned = new Map([['dsh-im-connect.sidebar-tab', 'channels']])
  const imStorage = {
    getItem: (key: string) => imOwned.get(key) ?? null,
    setItem: (key: string, value: string) => { imOwned.set(key, value) },
    removeItem: (key: string) => { imOwned.delete(key) },
  }
  assert.equal(readStoredSidebarTab(imStorage), 'channels')
  assert.equal(imOwned.get('dsh-im-connect.sidebar-tab'), 'channels')

  assert.equal(readStoredSidebarTab(undefined), 'tasks')
  assert.equal(readStoredSidebarTab({
    getItem() { throw new Error('denied') },
    setItem() { throw new Error('denied') },
    removeItem() { throw new Error('denied') },
  }), 'tasks')
})

test('新键已存在时不再回退旧键', () => {
  const values = new Map([['dsh-native-sidebar.tab', 'tasks'], ['dsh-automation.sidebar-tab', 'schedule']])
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
  assert.equal(readStoredSidebarTab(storage), 'tasks')
  assert.equal(values.get('dsh-im-connect.sidebar-tab'), undefined)
})
