import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applySettingsNavIcon,
  restoreSettingsNavIcon,
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

/**
 * 极简 DOM 元素：按真实 DOM 语义支持「标签 + class 子串」选择器。
 *
 * 旧夹具的 querySelector 只认 `svg` / `:scope > svg`，对 `[class*="navIcon"]`
 * 一律返回 null —— 这正是「判据被放宽后用例依然全绿」的原因。夹具必须能真实
 * 匹配 class，才能锁住判据的宽窄。
 */
type FakeEl = {
  tagName: string
  className: string
  attributes: Map<string, string>
  children: FakeEl[]
  parent?: FakeEl
  textContent: string
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
  hasAttribute(name: string): boolean
  appendChild(child: FakeEl): void
  querySelector(selector: string): FakeEl | null
  remove(): void
}

type Selector = { tag?: string; classContains?: string }

function parseSelector(selector: string): Selector | null {
  const match = /^([a-zA-Z]*)(?:\[class\*="([^"]+)"\])?$/.exec(selector.trim())
  if (!match) return null
  const tag = match[1] ?? ''
  const classContains = match[2]
  if (tag === '' && classContains === undefined) return null
  return {
    ...(tag === '' ? {} : { tag: tag.toLowerCase() }),
    ...(classContains === undefined ? {} : { classContains }),
  }
}

function matches(node: FakeEl, selector: Selector): boolean {
  if (selector.tag !== undefined && node.tagName.toLowerCase() !== selector.tag) return false
  if (selector.classContains !== undefined && !node.className.includes(selector.classContains)) return false
  return true
}

function findDescendant(nodes: readonly FakeEl[], selector: Selector): FakeEl | null {
  for (const node of nodes) {
    if (matches(node, selector)) return node
    const nested = findDescendant(node.children, selector)
    if (nested) return nested
  }
  return null
}

function el(tagName: string, className = '', attributes: Record<string, string> = {}): FakeEl {
  const attrs = new Map<string, string>(Object.entries(attributes))
  const node: FakeEl = {
    tagName: tagName.toUpperCase(),
    className,
    attributes: attrs,
    children: [],
    textContent: '',
    getAttribute(name) { return attrs.has(name) ? attrs.get(name) ?? null : null },
    setAttribute(name, value) { attrs.set(name, String(value)) },
    removeAttribute(name) { attrs.delete(name) },
    hasAttribute(name) { return attrs.has(name) },
    appendChild(child) { child.parent = node; node.children.push(child) },
    remove() {
      const siblings = node.parent?.children
      const index = siblings?.indexOf(node) ?? -1
      if (siblings && index >= 0) siblings.splice(index, 1)
    },
    querySelector(selector) {
      // 真实宿主里插件只用过这三种形状；`:scope > svg` 是历史选择器，保留兼容。
      if (selector === ':scope > svg') return node.children.find(child => child.tagName === 'SVG') ?? null
      const parsed = parseSelector(selector)
      if (parsed === null) return null
      return findDescendant(node.children, parsed)
    },
  }
  return node
}

function installFakeDocument(): () => void {
  return replaceGlobal('document', {
    createElement(): FakeEl {
      return el('DIV')
    },
  })
}

function button(textContent: string): FakeEl {
  const node = el('button', 'navCell')
  node.textContent = textContent
  return node
}

/**
 * 桌面内嵌宿主（D:/Tools/DeepSeek Harness/resources/app.asar）的设置导航行：
 * children = [navIcon(row.id) -> <svg class="…navIcon">, <span class="…navLabel">]。
 * 该宿主未声明 settings.section.icon 槽位，图标只能靠 DOM 补丁替换。
 */
function desktopHostButton(): FakeEl {
  const node = button('定时任务')
  node.appendChild(el('svg', 'AnXs9G_navIcon'))
  node.appendChild(el('span', 'LXq1aa'))
  return node
}

/**
 * 全局 dsh 0.2.2-alpha.3 的设置导航行：
 * <span class="…navIcon" aria-hidden="true">{renderSlot("settings.section.icon")}</span>
 */
function globalHostButton(): FakeEl {
  const node = button('定时任务')
  const iconSpan = el('span', 'VOzbGW_navIcon', { 'aria-hidden': 'true' })
  iconSpan.appendChild(el('svg', 'VOzbGW_navIcon'))
  node.appendChild(iconSpan)
  node.appendChild(el('span', 'LXq1aa'))
  return node
}

const labels = () => ['Scheduled tasks', '定时任务']

test('桌面老宿主：宿主 svg 自带 navIcon 类时仍写 marker，显示插件时钟图标', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = desktopHostButton()
    const hostSvg = node.children[0]!
    const before = node.children.length

    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, labels), true)
    assert.equal(node.getAttribute(SETTINGS_NAV_ICON_MARKER), '')
    assert.equal(node.children.length, before, '禁止向 button 插入任何真实 DOM 节点')
    assert.equal(hostSvg.tagName, 'SVG', '宿主 svg 必须保持原样')
  } finally {
    restoreDocument()
  }
})

test('桌面老宿主：图标旁还有普通 aria-hidden 容器时仍写 marker', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = button('定时任务')
    node.appendChild(el('svg', 'AnXs9G_navIcon'))
    node.appendChild(el('span', 'LXq1aa', { 'aria-hidden': 'true' }))

    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, labels), true)
    assert.equal(node.getAttribute(SETTINGS_NAV_ICON_MARKER), '')
  } finally {
    restoreDocument()
  }
})

test('新宿主：存在 span.navIcon 插槽容器时不写 marker，避免双图标', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = globalHostButton()

    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, labels), false)
    assert.equal(node.hasAttribute(SETTINGS_NAV_ICON_MARKER), false)
  } finally {
    restoreDocument()
  }
})

test('新宿主：已有 marker 在识别到插槽容器时被清除', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = globalHostButton()
    node.setAttribute(SETTINGS_NAV_ICON_MARKER, '')

    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, labels), true)
    assert.equal(node.hasAttribute(SETTINGS_NAV_ICON_MARKER), false)
  } finally {
    restoreDocument()
  }
})

test('设置导航图标重复应用保持幂等', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = desktopHostButton()
    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, labels), true)
    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, labels), false)
  } finally {
    restoreDocument()
  }
})

test('不匹配的导航项时不标记', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = button('通用设置')
    node.appendChild(el('svg', 'AnXs9G_navIcon'))
    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, labels), false)
  } finally {
    restoreDocument()
  }
})

test('标签匹配忽略多余空白', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = button('  定时\n任务  ')
    node.appendChild(el('svg', 'AnXs9G_navIcon'))
    assert.equal(applySettingsNavIcon(node as unknown as HTMLButtonElement, () => ['定时 任务']), true)
  } finally {
    restoreDocument()
  }
})

test('恢复设置导航图标时移除标记与注入元素', () => {
  const restoreDocument = installFakeDocument()
  try {
    const node = desktopHostButton()
    applySettingsNavIcon(node as unknown as HTMLButtonElement, labels)

    assert.equal(restoreSettingsNavIcon(node as unknown as HTMLButtonElement), true)
    assert.equal(node.hasAttribute(SETTINGS_NAV_ICON_MARKER), false)
    assert.equal(node.children.length, 2)
    assert.equal(restoreSettingsNavIcon(node as unknown as HTMLButtonElement), false)
  } finally {
    restoreDocument()
  }
})
