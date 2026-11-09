import assert from 'node:assert/strict'
import test from 'node:test'

const OWNER = '@michengai/dsh-automation'

class StyleElement {
  id = ''
  textContent = ''
  parent: { children: StyleElement[] } | null = null
  private readonly attributes = new Map<string, string>()

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  remove(): void {
    const parent = this.parent
    if (parent === null) return
    parent.children.splice(parent.children.indexOf(this), 1)
    this.parent = null
  }
}

class StyleParent {
  readonly children: StyleElement[] = []

  append(style: StyleElement): void {
    style.parent = this
    this.children.push(style)
  }
}

function claimUntagged(owner: string): void {
  for (const style of head.children) {
    if (style.getAttribute('data-plugin') === null) style.setAttribute('data-plugin', owner)
  }
}

function removeOwned(owner: string): void {
  for (const style of [...head.children]) {
    if (style.getAttribute('data-plugin') === owner) style.remove()
  }
}

const head = new StyleParent()
const documentValue = {
  head,
  documentElement: head,
  getElementById(id: string): StyleElement | null {
    return head.children.find(style => style.id === id) ?? null
  },
  createElement(tag: string): StyleElement {
    if (tag !== 'style') throw new Error(`unexpected element ${tag}`)
    return new StyleElement()
  },
}

Object.defineProperty(globalThis, 'HTMLStyleElement', { configurable: true, writable: true, value: StyleElement })
Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: documentValue })

const { installStyles } = await import('../src/client/styles.ts')

test('侧栏样式表归属本插件，不会被其它插件重载整批删除', () => {
  const dispose = installStyles()
  const style = documentValue.getElementById('dsh-automation-styles')
  assert.ok(style instanceof StyleElement)
  assert.equal(style.getAttribute('data-plugin'), OWNER)
  assert.match(style.textContent, /\.dsh-st-shell-rail\{display:flex/)

  claimUntagged('dsh-chat-import')
  removeOwned('dsh-chat-import')

  assert.equal(documentValue.getElementById('dsh-automation-styles'), style)
  assert.equal(style.getAttribute('data-plugin'), OWNER)
  dispose()
  assert.equal(documentValue.getElementById('dsh-automation-styles'), null)
})

test('已被其它插件认领的侧栏样式表会改回本插件', () => {
  const style = documentValue.createElement('style')
  style.id = 'dsh-automation-styles'
  style.setAttribute('data-plugin', 'dsh-chat-import')
  head.append(style)

  installStyles()

  assert.equal(style.getAttribute('data-plugin'), OWNER)
  removeOwned('dsh-chat-import')
  assert.equal(documentValue.getElementById('dsh-automation-styles'), style)
  style.remove()
})
