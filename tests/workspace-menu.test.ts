import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

test('合成任务组只隐藏原生写操作和无效的工作区归档，保留第三方菜单', () => {
  const source = readFileSync(new URL('../src/client/workspace-menu.ts', import.meta.url), 'utf8')
  const start = source.indexOf('function hideOtherItems(')
  const end = source.indexOf('\n/**', start)
  assert.ok(start >= 0 && end > start)
  const code = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const hide = new Function('MENU_ITEM_SELECTOR', code + '; return hideOtherItems;')('button[role="menuitem"]')
  const item = (textContent: string, archive = false) => ({
    textContent,
    style: { display: '' },
    attributes: new Map<string, string>(),
    hasAttribute: (name: string) => archive && name === 'data-dsham-archive-workspace',
    getAttribute(name: string) { return this.attributes.get(name) ?? null },
    setAttribute(name: string, value: string) { this.attributes.set(name, value) },
  })
  const ours = item('任务设置')
  const rename = item('重命名')
  const remove = item('Delete workspace')
  const archive = item('归档全部会话', true)
  const extension = item('导出会话')
  const hiddenItems = new Map()
  const menu = { querySelectorAll: () => [ours, rename, remove, archive, extension] }
  hide(menu, ours, hiddenItems)
  hide(menu, ours, hiddenItems)
  for (const hidden of [rename, remove, archive]) {
    assert.equal(hidden.style.display, 'none')
    assert.equal(hidden.attributes.get('aria-hidden'), 'true')
  }
  assert.equal(extension.style.display, '')
  assert.equal(ours.style.display, '')
  assert.deepEqual(hiddenItems.get(rename), { display: '', ariaHidden: null })
  assert.equal(hiddenItems.size, 3)
})

test('任务分组右键菜单克隆重命名模板后，文案必须正确替换为「任务设置」，不能残留「重命名」', () => {
  const source = readFileSync(new URL('../src/client/workspace-menu.ts', import.meta.url), 'utf8')
  const start = source.indexOf('const ITEM_ATTRIBUTE =')
  const end = source.indexOf('export interface TaskGroupOptionOptions', start)
  assert.ok(start >= 0 && end > start)
  
  let codeRaw = source.slice(start, end)
  codeRaw = codeRaw.replace(/export function/g, 'function')
  codeRaw = codeRaw.replace(/function settingsIcon\(\)[^{]*\{[\s\S]*?\}/, 'function settingsIcon() { return "<svg><path d=\\"settings\\"></path></svg>"; }')
  const code = ts.transpileModule(codeRaw, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText

  class MockNode {
    tagName: string
    className: string
    children: MockNode[] = []
    parentElement: MockNode | null = null
    attributes = new Map<string, string>()
    style: Record<string, string> = {}
    listeners = new Map<string, Array<(e: unknown) => void>>()
    _textContent = ''

    constructor(tagName = 'div', className = '') {
      this.tagName = tagName.toUpperCase()
      this.className = className
      if (className) this.attributes.set('class', className)
    }

    get textContent(): string {
      if (this.children.length === 0) return this._textContent
      return this.children.map(c => c.textContent).join('')
    }

    get firstElementChild(): MockNode | null {
      return this.children[0] ?? null
    }

    get lastElementChild(): MockNode | null {
      return this.children[this.children.length - 1] ?? null
    }

    set textContent(val: string) {
      this._textContent = val
      this.children = []
    }

    set innerHTML(_val: string) {
      this.children = []
      this._textContent = ''
    }

    setAttribute(name: string, val: string) { this.attributes.set(name, String(val)) }
    getAttribute(name: string) { return this.attributes.get(name) ?? null }
    removeAttribute(name: string) { this.attributes.delete(name) }
    hasAttribute(name: string) { return this.attributes.has(name) }

    appendChild(child: MockNode) {
      child.parentElement = this
      this.children.push(child)
      return child
    }

    remove() {
      if (this.parentElement) {
        this.parentElement.children = this.parentElement.children.filter(c => c !== this)
        this.parentElement = null
      }
    }

    insertBefore(newNode: MockNode, refNode: MockNode | null) {
      newNode.parentElement = this
      const idx = refNode ? this.children.indexOf(refNode) : -1
      if (idx === -1) this.children.push(newNode)
      else this.children.splice(idx, 0, newNode)
      return newNode
    }

    cloneNode(_deep = true): MockNode {
      const copy = new MockNode(this.tagName.toLowerCase(), this.className)
      for (const [k, v] of this.attributes) copy.setAttribute(k, v)
      for (const [k, v] of Object.entries(this.style)) copy.style[k] = v
      copy._textContent = this._textContent
      for (const child of this.children) copy.appendChild(child.cloneNode(true))
      return copy
    }

    matches(sel: string): boolean {
      if (sel.includes('[data-dsh-automation-task-settings="true"]')) {
        return this.getAttribute('data-dsh-automation-task-settings') === 'true'
      }
      if (sel.includes('[data-dsh-automation-task-menu="true"]')) {
        return this.getAttribute('data-dsh-automation-task-menu') === 'true'
      }
      if (sel === 'button[role="menuitem"]') {
        return this.tagName === 'BUTTON' && this.getAttribute('role') === 'menuitem'
      }
      if (sel === '[data-row-key^="workspace:"]') {
        return (this.getAttribute('data-row-key') ?? '').startsWith('workspace:')
      }
      if (sel === 'div[role="menu"]' || sel === '[role="menu"]') {
        return this.getAttribute('role') === 'menu'
      }
      if (sel.startsWith('.')) {
        const cls = sel.slice(1)
        return this.className.split(/\s+/).includes(cls)
      }
      if (sel.startsWith('[class*="') && sel.endsWith('"]')) {
        const part = sel.slice(9, -2)
        return this.className.includes(part)
      }
      if (sel === 'span') {
        return this.tagName === 'SPAN'
      }
      if (sel === 'span, div') {
        return this.tagName === 'SPAN' || this.tagName === 'DIV'
      }
      return false
    }

    closest(sel: string): MockNode | null {
      let curr: MockNode | null = this
      while (curr) {
        if (curr.matches(sel)) return curr
        curr = curr.parentElement
      }
      return null
    }

    querySelector(sel: string): MockNode | null {
      for (const child of this.children) {
        if (child.matches(sel)) return child
        const found = child.querySelector(sel)
        if (found) return found
      }
      return null
    }

    querySelectorAll(sel: string): MockNode[] {
      if (sel.includes(',')) {
        const parts = sel.split(',').map(s => s.trim())
        const set = new Set<MockNode>()
        for (const p of parts) {
          for (const node of this.querySelectorAll(p)) set.add(node)
        }
        return [...set]
      }
      const results: MockNode[] = []
      const traverse = (node: MockNode) => {
        for (const child of node.children) {
          if (child.matches(sel)) results.push(child)
          traverse(child)
        }
      }
      traverse(this)
      return results
    }

    contains(other: MockNode | null): boolean {
      let curr = other
      while (curr) {
        if (curr === this) return true
        curr = curr.parentElement
      }
      return false
    }

    get classList() {
      return {
        remove: (cls: string) => {
          this.className = this.className.split(/\s+/).filter(c => c !== cls).join(' ')
        },
        add: (cls: string) => {
          if (!this.className.includes(cls)) this.className = `${this.className} ${cls}`.trim()
        },
        contains: (cls: string) => this.className.split(/\s+/).includes(cls),
      }
    }

    addEventListener(event: string, handler: (e: unknown) => void) {
      if (!this.listeners.has(event)) this.listeners.set(event, [])
      this.listeners.get(event)!.push(handler)
    }

    removeEventListener(event: string, handler: (e: unknown) => void) {
      const list = this.listeners.get(event)
      if (!list) return
      this.listeners.set(event, list.filter(h => h !== handler))
    }

    dispatchEvent(event: { type: string; target?: MockNode }) {
      event.target = event.target || this
      const list = this.listeners.get(event.type)
      if (list) for (const h of list) h(event)
    }
  }

  const document = new MockNode('document')
  const body = new MockNode('body')
  document.appendChild(body)

  let rafCallback: (() => void) | null = null
  const window = {
    requestAnimationFrame: (cb: () => void) => { rafCallback = cb; return 1 },
    cancelAnimationFrame: () => { rafCallback = null },
    setTimeout: (cb: () => void) => cb(),
  }

  let observerCallback: (() => void) | null = null
  class MockMutationObserver {
    constructor(cb: () => void) {
      observerCallback = cb
    }
    observe() {}
    disconnect() {}
  }

  const performance = { now: () => 1000 }

  const installFn = new Function(
    'document',
    'window',
    'MutationObserver',
    'performance',
    'Element',
    `${code}; return installTaskSettingsMenuInjector;`
  )(
    document,
    window,
    MockMutationObserver,
    performance,
    MockNode
  )

  const taskRow = new MockNode('div')
  taskRow.setAttribute('data-row-key', 'workspace:dsh-automation:task-123')
  body.appendChild(taskRow)

  const menu = new MockNode('div')
  menu.setAttribute('role', 'menu')

  const renameWrap = new MockNode('div')
  const renameBtn = new MockNode('button', '_item_70kcw_173')
  renameBtn.setAttribute('type', 'button')
  renameBtn.setAttribute('role', 'menuitem')

  const iconSpan = new MockNode('span', '_itemIcon_70kcw_233')
  const glyphSpan = new MockNode('span', 'glyph')
  glyphSpan.textContent = 'glyph-inner'
  iconSpan.appendChild(glyphSpan)

  const labelSpan = new MockNode('span', '_itemLabel_70kcw_276')
  labelSpan.textContent = '重命名'

  renameBtn.appendChild(iconSpan)
  renameBtn.appendChild(labelSpan)
  renameWrap.appendChild(renameBtn)
  menu.appendChild(renameWrap)

  const deleteWrap = new MockNode('div')
  const deleteBtn = new MockNode('button', '_item_70kcw_173')
  deleteBtn.setAttribute('role', 'menuitem')
  deleteBtn.textContent = 'Delete workspace'
  deleteWrap.appendChild(deleteBtn)
  menu.appendChild(deleteWrap)

  body.appendChild(menu)

  const options = {
    label: '任务设置',
    resolveTask: (id: string) => ({ id, name: '测试任务', sessionIds: [] }),
    openTaskSettings: () => {},
  }

  const dispose = installFn(options)
  document.dispatchEvent({ type: 'pointerdown', target: taskRow })
  if (observerCallback) (observerCallback as () => void)()
  if (rafCallback) (rafCallback as () => void)()

  const injectedItem = menu.querySelector('button[data-dsh-automation-task-settings="true"]')
  assert.ok(injectedItem, '必须成功注入任务设置菜单项')
  if (!injectedItem) throw new Error('injectedItem not found')
  const injectedLabel = injectedItem.querySelector('._itemLabel_70kcw_276')
  assert.ok(injectedLabel, '必须存在 label 节点')
  if (!injectedLabel) throw new Error('injectedLabel not found')
  assert.equal(injectedLabel.textContent, '任务设置', '文案必须是「任务设置」')
  assert.doesNotMatch(injectedItem.textContent, /重命名/, '不能残留「重命名」')

  dispose()
})

test('installTaskGroupOption 正确注入「按任务」分组项，并清理模板原有的 check 图标', () => {
  const source = readFileSync(new URL('../src/client/workspace-menu.ts', import.meta.url), 'utf8')
  const start = source.indexOf('export function replaceMenuItemContent(')
  const end = source.length
  assert.ok(start >= 0 && end > start)

  let codeRaw = source.slice(start, end)
  codeRaw = codeRaw.replace(/export /g, '')
  codeRaw = `function taskGroupIcon() { return "<svg><path d=\\"task\\"></path></svg>"; }\nfunction checkIcon() { return "<svg><path d=\\"check\\"></path></svg>"; }\n${codeRaw}`
  const code = ts.transpileModule(codeRaw, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText

  class MockNode {
    tagName: string
    className: string
    children: MockNode[] = []
    parentElement: MockNode | null = null
    attributes = new Map<string, string>()
    style: Record<string, string> = {}
    listeners = new Map<string, Array<(e: unknown) => void>>()
    _textContent = ''

    constructor(tagName = 'div', className = '') {
      this.tagName = tagName.toUpperCase()
      this.className = className
      if (className) this.attributes.set('class', className)
    }

    get textContent(): string {
      if (this.children.length === 0) return this._textContent
      return this.children.map(c => c.textContent).join('')
    }

    get firstElementChild(): MockNode | null {
      return this.children[0] ?? null
    }

    get lastElementChild(): MockNode | null {
      return this.children[this.children.length - 1] ?? null
    }

    set textContent(val: string) {
      this._textContent = val
      this.children = []
    }

    set innerHTML(_val: string) {
      this.children = []
      this._textContent = ''
    }

    setAttribute(name: string, val: string) { this.attributes.set(name, String(val)) }
    getAttribute(name: string) { return this.attributes.get(name) ?? null }
    removeAttribute(name: string) { this.attributes.delete(name) }
    hasAttribute(name: string) { return this.attributes.has(name) }

    appendChild(child: MockNode) {
      child.parentElement = this
      this.children.push(child)
      return child
    }

    remove() {
      if (this.parentElement) {
        this.parentElement.children = this.parentElement.children.filter(c => c !== this)
        this.parentElement = null
      }
    }

    insertBefore(newNode: MockNode, refNode: MockNode | null) {
      newNode.parentElement = this
      const idx = refNode ? this.children.indexOf(refNode) : -1
      if (idx === -1) this.children.push(newNode)
      else this.children.splice(idx, 0, newNode)
      return newNode
    }

    cloneNode(_deep = true): MockNode {
      const copy = new MockNode(this.tagName.toLowerCase(), this.className)
      for (const [k, v] of this.attributes) copy.setAttribute(k, v)
      for (const [k, v] of Object.entries(this.style)) copy.style[k] = v
      copy._textContent = this._textContent
      for (const child of this.children) copy.appendChild(child.cloneNode(true))
      return copy
    }

    matches(sel: string): boolean {
      if (sel.includes('[data-dsh-automation-group-task="true"]')) {
        return this.getAttribute('data-dsh-automation-group-task') === 'true'
      }
      if (sel === 'button[role="menuitem"]') {
        return this.tagName === 'BUTTON' && this.getAttribute('role') === 'menuitem'
      }
      if (sel === 'div[role="menu"]' || sel === '[role="menu"]') {
        return this.getAttribute('role') === 'menu'
      }
      if (sel.startsWith('.')) {
        const cls = sel.slice(1)
        return this.className.split(/\s+/).includes(cls)
      }
      if (sel.startsWith('[class*="') && sel.endsWith('"]')) {
        const part = sel.slice(9, -2)
        return this.className.includes(part)
      }
      if (sel === 'span') {
        return this.tagName === 'SPAN'
      }
      if (sel === 'span, div') {
        return this.tagName === 'SPAN' || this.tagName === 'DIV'
      }
      return false
    }

    querySelector(sel: string): MockNode | null {
      for (const child of this.children) {
        if (child.matches(sel)) return child
        const found = child.querySelector(sel)
        if (found) return found
      }
      return null
    }

    querySelectorAll(sel: string): MockNode[] {
      if (sel.includes(',')) {
        const parts = sel.split(',').map(s => s.trim())
        const set = new Set<MockNode>()
        for (const p of parts) {
          for (const node of this.querySelectorAll(p)) set.add(node)
        }
        return [...set]
      }
      const results: MockNode[] = []
      const traverse = (node: MockNode) => {
        for (const child of node.children) {
          if (child.matches(sel)) results.push(child)
          traverse(child)
        }
      }
      traverse(this)
      return results
    }

    contains(other: MockNode | null): boolean {
      let curr = other
      while (curr) {
        if (curr === this) return true
        curr = curr.parentElement
      }
      return false
    }

    get classList() {
      return {
        remove: (cls: string) => {
          this.className = this.className.split(/\s+/).filter(c => c !== cls).join(' ')
        },
        add: (cls: string) => {
          if (!this.className.includes(cls)) this.className = `${this.className} ${cls}`.trim()
        },
        contains: (cls: string) => this.className.split(/\s+/).includes(cls),
      }
    }

    addEventListener(event: string, handler: (e: unknown) => void) {
      if (!this.listeners.has(event)) this.listeners.set(event, [])
      this.listeners.get(event)!.push(handler)
    }

    removeEventListener(event: string, handler: (e: unknown) => void) {
      const list = this.listeners.get(event)
      if (!list) return
      this.listeners.set(event, list.filter(h => h !== handler))
    }

    dispatchEvent(event: { type: string; target?: MockNode }) {
      event.target = event.target || this
      const list = this.listeners.get(event.type)
      if (list) for (const h of list) h(event)
    }
  }

  const document = new MockNode('document')
  const body = new MockNode('body')
  document.appendChild(body)

  let rafCallback: (() => void) | null = null
  const window = {
    requestAnimationFrame: (cb: () => void) => { rafCallback = cb; return 1 },
    cancelAnimationFrame: () => { rafCallback = null },
    setTimeout: (cb: () => void) => cb(),
  }

  let observerCallback: (() => void) | null = null
  class MockMutationObserver {
    constructor(cb: () => void) {
      observerCallback = cb
    }
    observe() {}
    disconnect() {}
  }

  const installGroupOptionFn = new Function(
    'document',
    'window',
    'MutationObserver',
    'MENU_ITEM_SELECTOR',
    'MENU_SELECTOR',
    `${code}; return installTaskGroupOption;`
  )(
    document,
    window,
    MockMutationObserver,
    'button[role="menuitem"]',
    '[role="menu"]'
  )

  const menu = new MockNode('div')
  menu.setAttribute('role', 'menu')

  const titleNode = new MockNode('div')
  titleNode.textContent = '分组方式'
  menu.appendChild(titleNode)

  const optWrap = new MockNode('div')
  const optBtn = new MockNode('button', '_item_70kcw_173')
  optBtn.setAttribute('role', 'menuitem')

  const iconSpan = new MockNode('span', '_itemIcon_70kcw_233')
  const labelSpan = new MockNode('span', '_itemLabel_70kcw_276')
  labelSpan.textContent = '工作区'
  const oldCheck = new MockNode('span', '_check_70kcw_265')
  oldCheck.textContent = 'check-svg'

  optBtn.appendChild(iconSpan)
  optBtn.appendChild(labelSpan)
  optBtn.appendChild(oldCheck)
  optWrap.appendChild(optBtn)
  menu.appendChild(optWrap)
  body.appendChild(menu)

  const options = {
    label: '按任务',
    groupLabel: '分组方式',
    workspaceLabel: '工作区',
    checked: false,
    onSelect: () => {},
  }

  const dispose = installGroupOptionFn(options)
  if (observerCallback) (observerCallback as () => void)()
  if (rafCallback) (rafCallback as () => void)()

  const injectedBtn = menu.querySelector('button[data-dsh-automation-group-task="true"]')
  assert.ok(injectedBtn, '必须注入按任务分组项')
  if (!injectedBtn) throw new Error('injectedBtn not found')
  const label = injectedBtn.querySelector('._itemLabel_70kcw_276')
  assert.ok(label, '必须包含 label 节点')
  if (!label) throw new Error('label not found')
  assert.equal(label.textContent, '按任务')
  assert.doesNotMatch(injectedBtn.textContent, /工作区/)
  assert.equal(injectedBtn.querySelectorAll('._check_70kcw_265').length, 0, '原有模板的 check 必须被清理')

  dispose()
})

