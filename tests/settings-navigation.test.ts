import assert from 'node:assert/strict'
import test from 'node:test'
import { openSettingsSection, pickSettingsLauncher, pickSettingsSectionButton } from '../src/client/settings-navigation.js'

function replaceGlobal(name: string, value: unknown): () => void {
  const original = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  return () => {
    if (original === undefined) delete (globalThis as Record<string, unknown>)[name]
    else Object.defineProperty(globalThis, name, original)
  }
}

function settingsDom(options: { targetAppearsAfterMutation?: boolean; hasTarget?: boolean } = {}) {
  let dialogOpen = options.targetAppearsAfterMutation !== true
  let launcherClicks = 0
  let targetClicks = 0
  let observerCallback: MutationCallback | undefined
  let frameCallback: FrameRequestCallback | undefined
  let timeoutCallback: (() => void) | undefined
  let observerDisconnects = 0
  const launcher = {
    textContent: '设置',
    getAttribute(name: string) { return name === 'aria-label' ? '设置' : null },
    click() { launcherClicks += 1 },
  }
  const target = {
    textContent: '定时任务',
    getAttribute() { return null },
    click() { targetClicks += 1 },
  }
  const documentValue = {
    body: {},
    querySelector(selector: string) { return selector === '[role="dialog"]' && dialogOpen ? {} : null },
    querySelectorAll(selector: string) {
      if (selector === 'button[aria-haspopup="dialog"]') return [launcher]
      if (selector === '[role="dialog"] nav button') return dialogOpen && options.hasTarget !== false ? [target] : []
      return []
    },
  }
  class FakeMutationObserver {
    constructor(callback: MutationCallback) { observerCallback = callback }
    observe() {}
    disconnect() { observerDisconnects += 1 }
    takeRecords(): MutationRecord[] { return [] }
  }
  const windowValue = {
    requestAnimationFrame(callback: FrameRequestCallback) { frameCallback = callback; return 1 },
    cancelAnimationFrame() { frameCallback = undefined },
    setTimeout(callback: () => void) { timeoutCallback = callback; return 2 },
    clearTimeout() { timeoutCallback = undefined },
  }
  const restoreDocument = replaceGlobal('document', documentValue)
  const restoreWindow = replaceGlobal('window', windowValue)
  const restoreObserver = replaceGlobal('MutationObserver', FakeMutationObserver)
  return {
    counts: () => ({ launcherClicks, targetClicks, observerDisconnects }),
    flushFrame() { const callback = frameCallback; frameCallback = undefined; callback?.(0) },
    flushTimeout() { const callback = timeoutCallback; timeoutCallback = undefined; callback?.() },
    showDialog() { dialogOpen = true; observerCallback?.([], {} as MutationObserver) },
    restore() { restoreObserver(); restoreWindow(); restoreDocument() },
  }
}

function button(text: string, aria = '') {
  return {
    textContent: text,
    getAttribute(name: string) { return name === 'aria-label' ? aria : null },
    click() {},
  }
}

test('设置分区按本地化可访问名称精确选择', () => {
  const general = button('通用设置')
  const scheduled = button('定时任务')
  assert.equal(pickSettingsSectionButton([general, scheduled], ['Scheduled tasks', '定时任务']), scheduled)
})

test('设置入口优先匹配设置名称，单入口时允许兼容回退', () => {
  const help = button('帮助', '帮助')
  const settings = button('设置', '')
  assert.equal(pickSettingsLauncher([help, settings]), settings)
  assert.equal(pickSettingsLauncher([help]), help)
  assert.equal(pickSettingsLauncher([help, button('关于')]), undefined)
})

test('设置弹窗异步挂载后选择定时任务分区并清理观察器', () => {
  const dom = settingsDom({ targetAppearsAfterMutation: true })
  let selected = 0
  let missing = 0
  try {
    openSettingsSection(['Scheduled tasks', '定时任务'], () => { selected += 1 }, () => { missing += 1 })
    dom.flushFrame()
    assert.deepEqual(dom.counts(), { launcherClicks: 1, targetClicks: 0, observerDisconnects: 0 })

    dom.showDialog()
    dom.flushFrame()

    assert.equal(selected, 1)
    assert.equal(missing, 0)
    assert.deepEqual(dom.counts(), { launcherClicks: 1, targetClicks: 1, observerDisconnects: 1 })
  } finally {
    dom.restore()
  }
})

test('Codex 设置页通过分区事件打开定时任务，不再依赖官方 dialog', () => {
  let selected = 0
  let missing = 0
  let received: unknown
  const trigger = {
    dispatchEvent(event: Event) {
      received = (event as CustomEvent).detail
      event.preventDefault()
      return false
    },
  }
  const restoreDocument = replaceGlobal('document', {
    body: {},
    querySelector(selector: string) { return selector === '[data-dcu-settings-trigger]' ? trigger : null },
    querySelectorAll() { return [] },
  })
  const restoreWindow = replaceGlobal('window', {
    requestAnimationFrame() { return 1 },
    cancelAnimationFrame() {},
    setTimeout() { return 2 },
    clearTimeout() {},
  })
  try {
    openSettingsSection(['定时任务', 'Scheduled tasks'], () => { selected += 1 }, () => { missing += 1 })
    assert.deepEqual(received, { labels: ['定时任务', 'Scheduled tasks'] })
    assert.equal(selected, 1)
    assert.equal(missing, 0)
  } finally {
    restoreWindow()
    restoreDocument()
  }
})

test('Codex trigger 在事件未被取消时回退到设置页导航', () => {
  let selected = 0
  let missing = 0
  let triggerClicks = 0
  let targetClicks = 0
  let pageOpen = false
  let frameCallback: FrameRequestCallback | undefined
  const trigger = {
    dispatchEvent() { return true },
    click() { triggerClicks += 1; pageOpen = true },
  }
  const target = {
    textContent: '定时任务',
    click() { targetClicks += 1 },
  }
  const restoreDocument = replaceGlobal('document', {
    body: {},
    querySelector(selector: string) {
      if (selector === '[data-dcu-settings-trigger]') return trigger
      if (selector === '[data-dcu-settings-page]') return pageOpen ? {} : null
      return null
    },
    querySelectorAll(selector: string) {
      if (selector === '[data-dcu-settings-page] nav button') return pageOpen ? [target] : []
      return []
    },
  })
  const restoreWindow = replaceGlobal('window', {
    requestAnimationFrame(callback: FrameRequestCallback) { frameCallback = callback; return 1 },
    cancelAnimationFrame() { frameCallback = undefined },
    setTimeout() { return 2 },
    clearTimeout() {},
  })
  const restoreObserver = replaceGlobal('MutationObserver', class {
    observe() {}
    disconnect() {}
    takeRecords(): MutationRecord[] { return [] }
  })
  try {
    openSettingsSection(['定时任务', 'Scheduled tasks'], () => { selected += 1 }, () => { missing += 1 })
    assert.equal(triggerClicks, 1)
    assert.equal(selected, 0)
    frameCallback?.(0)
    assert.equal(selected, 1)
    assert.equal(missing, 0)
    assert.equal(targetClicks, 1)
  } finally {
    restoreObserver()
    restoreWindow()
    restoreDocument()
  }
})

test('设置分区在超时前仍不存在时报告缺失并清理观察器', () => {
  const dom = settingsDom({ hasTarget: false })
  let selected = 0
  let missing = 0
  try {
    openSettingsSection(['Scheduled tasks', '定时任务'], () => { selected += 1 }, () => { missing += 1 })
    dom.flushFrame()
    dom.flushTimeout()

    assert.equal(selected, 0)
    assert.equal(missing, 1)
    assert.equal(dom.counts().observerDisconnects, 1)
  } finally {
    dom.restore()
  }
})
