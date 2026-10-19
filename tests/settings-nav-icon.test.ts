import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applySettingsNavIcon,
  restoreSettingsNavIcon,
  SETTINGS_NAV_ICON_CLASS,
  SETTINGS_NAV_ICON_MARKER,
} from '../src/client/settings-nav-icon.js'

function replaceGlobal(name: string, value: unknown): () => void {
  const original = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  return () => {
    if (original === undefined) delete (globalThis as Record<string, unknown>)[name]
    else Object.defineProperty(globalThis, name, original)
  }
}

type FakeIcon = {
  className: string
  attributes: Map<string, string>
  parent?: { children: FakeIcon[] }
  setAttribute(name: string, value: string): void
  remove(): void
}

type FakeButton = {
  textContent: string
  children: FakeIcon[]
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
  hasAttribute(name: string): boolean
  querySelector(selector: string): FakeIcon | { innerHTML: string } | null
  prepend(node: FakeIcon): void
}

function installFakeDocument(): () => void {
  return replaceGlobal('document', {
    createElement(): FakeIcon {
      const attributes = new Map<string, string>()
      const node: FakeIcon = {
        className: '',
        attributes,
        setAttribute(name, value) { attributes.set(name, String(value)) },
        remove() {
          const index = node.parent?.children.indexOf(node) ?? -1
          if (index >= 0) node.parent?.children.splice(index, 1)
        },
      }
      return node
    },
  })
}

function fakeButton(textContent: string, hostSvg = true, nestedSvg = false) {
  const attributes = new Map<string, string>()
  const svg = { innerHTML: '<path d="host"/>' }
  const children: FakeIcon[] = []
  const button: FakeButton = {
    textContent,
    children,
    getAttribute(name) { return attributes.has(name) ? attributes.get(name) ?? null : null },
    setAttribute(name, value) { attributes.set(name, value) },
    removeAttribute(name) { attributes.delete(name) },
    hasAttribute(name) { return attributes.has(name) },
    querySelector(selector) {
      if (selector === ':scope > svg') return hostSvg ? svg : null
      if (selector === 'svg') return hostSvg || nestedSvg ? svg : null
      if (selector === `.${SETTINGS_NAV_ICON_CLASS}`) {
        return children.find(node => node.className === SETTINGS_NAV_ICON_CLASS) ?? null
      }
      return null
    },
    prepend(node) {
      children.unshift(node)
      node.parent = button
    },
  }
  return { button, svg, attributes }
}

test('设置导航图标插入独立宿主图标元素，不改写宿主 svg', () => {
  const restoreDocument = installFakeDocument()
  try {
    const { button, svg, attributes } = fakeButton('定时任务')
    const labels = () => ['Scheduled tasks', '定时任务']

    assert.equal(applySettingsNavIcon(button as unknown as HTMLButtonElement, labels), true)
    assert.equal(attributes.get(SETTINGS_NAV_ICON_MARKER), '1')
    assert.equal(button.children.length, 1)
    const icon = button.children[0]
    assert.equal(icon?.className, SETTINGS_NAV_ICON_CLASS)
    assert.equal(icon?.attributes.get('aria-hidden'), 'true')
    assert.equal(svg.innerHTML, '<path d="host"/>', '宿主 svg 内容必须保持原样')
  } finally {
    restoreDocument()
  }
})

test('设置导航图标重复应用保持幂等', () => {
  const restoreDocument = installFakeDocument()
  try {
    const { button } = fakeButton('Scheduled tasks')
    const labels = () => ['Scheduled tasks']

    assert.equal(applySettingsNavIcon(button as unknown as HTMLButtonElement, labels), true)
    assert.equal(applySettingsNavIcon(button as unknown as HTMLButtonElement, labels), false)
    assert.equal(button.children.length, 1)
  } finally {
    restoreDocument()
  }
})

test('不匹配的导航项或缺少宿主 svg 时不注入', () => {
  const restoreDocument = installFakeDocument()
  try {
    const labels = () => ['定时任务']
    assert.equal(applySettingsNavIcon(fakeButton('通用设置').button as unknown as HTMLButtonElement, labels), false)
    assert.equal(applySettingsNavIcon(fakeButton('定时任务', false).button as unknown as HTMLButtonElement, labels), false)
    assert.equal(fakeButton('通用设置').button.children.length, 0)
  } finally {
    restoreDocument()
  }
})

test('图标包在容器里时不注入，避免打乱侧栏网格布局', () => {
  const restoreDocument = installFakeDocument()
  try {
    const { button } = fakeButton('定时任务', false, true)
    assert.equal(applySettingsNavIcon(button as unknown as HTMLButtonElement, () => ['定时任务']), false)
    assert.equal(button.children.length, 0)
    assert.equal(button.hasAttribute(SETTINGS_NAV_ICON_MARKER), false)
  } finally {
    restoreDocument()
  }
})

test('标签匹配忽略多余空白', () => {
  const restoreDocument = installFakeDocument()
  try {
    const { button } = fakeButton('  定时\n任务  ')
    assert.equal(applySettingsNavIcon(button as unknown as HTMLButtonElement, () => ['定时 任务']), true)
  } finally {
    restoreDocument()
  }
})

test('恢复设置导航图标时移除标记与注入元素', () => {
  const restoreDocument = installFakeDocument()
  try {
    const { button, attributes } = fakeButton('定时任务')
    const labels = () => ['定时任务']
    applySettingsNavIcon(button as unknown as HTMLButtonElement, labels)

    assert.equal(restoreSettingsNavIcon(button as unknown as HTMLButtonElement), true)
    assert.equal(attributes.has(SETTINGS_NAV_ICON_MARKER), false)
    assert.equal(button.children.length, 0)
    assert.equal(restoreSettingsNavIcon(button as unknown as HTMLButtonElement), false)
  } finally {
    restoreDocument()
  }
})
