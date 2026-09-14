// 执行真实接入闭包，以可控插槽、计时器验证加载顺序和卸载，不模拟 React 渲染。
import assert from 'node:assert/strict'
import { createNativeTabRegistry, attachNativeTabRegistry, findNativeTabRegistry } from '../src/client/native-tabs.ts'

// 定位失败或标记重复时立即报错，避免执行空片段或另一个同名闭包。
export function extractBlock(source, startMarker, endMarker, label, required = []) {
  source = source.replace(/\r\n/g, '\n')
  const start = source.indexOf(startMarker), end = source.indexOf(endMarker)
  if (start < 0 || end <= start || source.indexOf(startMarker, start + 1) >= 0 || source.indexOf(endMarker, end + 1) >= 0) {
    throw new Error(`${label}：抽取标记缺失、重复或顺序错误，请更新测试定位`)
  }
  const body = source.slice(start, end)
  assert.ok(body.trim().length > 0, `${label}：提取内容为空`)
  for (const marker of required) assert.ok(body.includes(marker), `${label}：缺少 ${marker}，请更新测试定位`)
  return body
}

export function createHarness(body, kind) {
  let entries = [], codex = false
  const subscriptions = new Map(), timers = new Map()
  let timerId = 0
  const window = new EventTarget()
  window.setInterval = callback => { timers.set(++timerId, callback); return timerId }
  window.clearInterval = id => timers.delete(id)
  const winner = () => [...entries].sort((a, b) => a.priority - b.priority).slice(0, 1)
  const slots = {
    entriesOfSlot: name => name === 'sidebar.workspaces' ? winner() : [],
    subscribe(name, callback) {
      if (!subscriptions.has(name)) subscriptions.set(name, new Set())
      subscriptions.get(name).add(callback)
      return () => subscriptions.get(name).delete(callback)
    },
  }
  const registry = createNativeTabRegistry
  const find = findNativeTabRegistry
  const ownFlag = kind === 'automation' ? '__dshAutomationWrapped' : '__imConnectWrapped'
  const ctx = { slots }
  const env = {
    ctx, window, t: key => key, runtime: {}, openTaskSettings() {}, channelSkin: 'native',
    readSlotEntries: (_, name) => slots.entriesOfSlot(name), slotHasEntries: () => false,
    hasCodexUiSidebar: () => codex, hasDshCodexUiSidebar: () => codex,
    pickWrappableWorkspacesEntry: list => list.find(e => !e.component?.__dshAutomationWrapped),
    pickOfficialWorkspaces: () => winner().find(e => !e.component?.__dshNativeTabHost),
    isForeignSidebarHost: component => !!component?.__dshNativeTabHost,
    resolveOfficialTreeComponent: component => component,
    createNativeTabRegistry: registry,
    attachNativeTabRegistry,
    findNativeTabRegistry: find,
    subscribeLocale: () => () => {}, subscribeChannelMembership: () => () => {},
    isChannelSession: () => false,
  }
  const emit = name => { for (const f of [...(subscriptions.get(name) ?? [])]) f() }
  return {
    window, winner, find, registry, emit,
    add(priority = 0) {
      const entry = { priority, component: function Tree() {} }
      entries.push(entry); emit('sidebar.workspaces'); return entry
    },
    remove(entry) { entries = entries.filter(e => e !== entry); emit('sidebar.workspaces') },
    setCodex(value) { codex = value; emit('sidebar') },
    start(otherBody = body, overrides = {}) {
      const scope = { ...env, ...overrides }
      return new Function(...Object.keys(scope), otherBody)(...Object.values(scope))
    },
    async settle() { for (let i = 0; i < 8; i++) await Promise.resolve() },
    tick() { for (const f of [...timers.values()]) f() },
    assertAttached(entry) {
      const id = kind === 'automation' ? 'schedule' : 'channels'
      assert.ok(entry.component[ownFlag] || find(entry)?.getTabs().some(t => t.id === id), `${id} 未接入当前显示项`)
    },
  }
}

export function lifecycleCases(test, body, kind) {
  for (const trigger of ['event', 'sidebar.workspaces', 'sidebar', 'timer']) {
    test(`卸载后不响应 ${trigger}，也不重新接入侧栏`, async () => {
      const h = createHarness(body, kind), entry = h.add(), original = entry.component
      const stop = h.start()
      stop()
      await h.settle()
      assert.equal(entry.component, original)
      assert.equal(h.find(entry), undefined)
      if (trigger === 'event') h.window.dispatchEvent(new Event('dsh-native-sidebar-change'))
      else if (trigger === 'timer') h.tick()
      else h.emit(trigger)
      await h.settle()
      assert.equal(entry.component, original)
      assert.equal(h.find(entry), undefined)
    })
  }
  test('后注册的高优先级侧栏接入页签，移除后恢复官方侧栏', async () => {
    const h = createHarness(body, kind), official = h.add(), original = official.component
    const stop = h.start(); h.assertAttached(official)
    const archive = h.add(-0.5)
    await h.settle(); h.assertAttached(archive)
    assert.equal(official.component, original)
    assert.equal(h.find(official), undefined)
    h.remove(archive); await h.settle(); h.assertAttached(official)
    stop(); await h.settle(); assert.equal(official.component, original)
  })
  test('只变更 sidebar 时也退出和恢复原生包裹', async () => {
    const h = createHarness(body, kind), entry = h.add(), original = entry.component
    const stop = h.start()
    h.setCodex(true); await h.settle(); assert.equal(entry.component, original)
    h.setCodex(false); await h.settle(); h.assertAttached(entry)
    stop()
  })
  test('重复通知不会重复包裹，卸载不会覆盖其他插件后来替换的组件', async () => {
    const h = createHarness(body, kind), entry = h.add()
    const stop = h.start(), wrapped = entry.component
    h.window.dispatchEvent(new Event('dsh-native-sidebar-change'))
    h.emit('sidebar.workspaces'); h.emit('sidebar')
    await h.settle(); assert.equal(entry.component, wrapped)
    const replacement = function Replacement() {}
    entry.component = replacement
    stop(); await h.settle(); assert.equal(entry.component, replacement)
  })
  test('组件直接替换后通过协作通知接入新注册表', async () => {
    const h = createHarness(body, kind), entry = h.add()
    const stop = h.start()
    const host = function ForeignHost() {}
    host.__dshNativeTabHost = true
    host.__dshNativeTabs = h.registry(null)
    entry.component = host
    // 模拟协作插件发布的新组件和注册表。
    entry.__dshNativeTabs = host.__dshNativeTabs
    h.window.dispatchEvent(new Event('dsh-native-sidebar-change'))
    await h.settle(); h.assertAttached(entry)
    assert.equal(entry.component, host)
    stop(); await h.settle(); assert.equal(entry.component, host)
    assert.deepEqual(host.__dshNativeTabs.getTabs(), [])
  })
}
