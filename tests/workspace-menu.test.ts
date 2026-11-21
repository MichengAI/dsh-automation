import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

test('合成任务组隐藏所有非任务设置菜单项（在文件夹显示、归档、删除等）及多余分割线', () => {
  const source = readFileSync(new URL('../src/client/workspace-menu.ts', import.meta.url), 'utf8')
  const start = source.indexOf('function hideOtherItems(')
  const end = source.indexOf('\n/**', start)
  assert.ok(start >= 0 && end > start)
  const code = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const hide = new Function('MENU_ITEM_SELECTOR', 'MENU_SELECTOR', code + '; return hideOtherItems;')('button[role="menuitem"]', '[role="menu"]')
  const item = (textContent: string, isSeparator = false) => ({
    textContent,
    style: { display: '' },
    attributes: new Map<string, string>(isSeparator ? [['role', 'separator']] : []),
    hasAttribute(name: string) { return this.attributes.has(name) },
    getAttribute(name: string) { return this.attributes.get(name) ?? null },
    setAttribute(name: string, value: string) { this.attributes.set(name, value) },
    matches(sel: string) {
      if (sel.includes('separator')) return isSeparator
      return !isSeparator
    },
    parentElement: null as unknown,
  })
  const ours = item('任务设置')
  const rename = item('重命名')
  const reveal = item('在文件夹显示')
  const remove = item('Delete workspace')
  const archive = item('归档工作区')
  const separator = item('', true)
  const hiddenItems = new Map()
  const menu = {
    querySelectorAll: (sel: string) => {
      if (sel.includes('separator') || sel.includes('hr')) return [separator]
      return [ours, rename, reveal, remove, archive]
    },
  }
  hide(menu, ours, hiddenItems)
  hide(menu, ours, hiddenItems)
  for (const hidden of [rename, reveal, remove, archive, separator]) {
    assert.equal(hidden.style.display, 'none', `${hidden.textContent || '分割线'} 必须被隐藏`)
    assert.equal(hidden.attributes.get('aria-hidden'), 'true')
  }
  assert.equal(ours.style.display, '', '任务设置必须保持可见')
  assert.deepEqual(hiddenItems.get(rename), { display: '', ariaHidden: null })
  assert.equal(hiddenItems.size, 5)
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

test('hideOtherItems 在真实宿主 .viewport 嵌套结构下必须隐藏 itemWrap，且隐藏 footer 分割线容器', async () => {
  const { hideOtherItems } = await import('../src/client/workspace-menu.js') as any
  assert.equal(typeof hideOtherItems, 'function', 'hideOtherItems 必须导出供测试与维护')

  class DomNode {
    tagName: string
    className: string
    style: Record<string, string> = {}
    attributes = new Map<string, string>()
    children: DomNode[] = []
    parentElement: DomNode | null = null
    isConnected = true

    constructor(tagName: string, className = '') {
      this.tagName = tagName.toUpperCase()
      this.className = className
      if (className) this.attributes.set('class', className)
    }

    setAttribute(k: string, v: string) { this.attributes.set(k, v) }
    getAttribute(k: string) { return this.attributes.get(k) ?? null }
    removeAttribute(k: string) { this.attributes.delete(k) }

    appendChild(child: DomNode) {
      child.parentElement = this
      this.children.push(child)
      return child
    }

    contains(other: DomNode | null): boolean {
      let curr = other
      while (curr) {
        if (curr === this) return true
        curr = curr.parentElement
      }
      return false
    }

    matches(sel: string): boolean {
      if (sel === '[role="menu"]') return this.getAttribute('role') === 'menu'
      if (sel === 'button[role="menuitem"]') return this.tagName === 'BUTTON' && this.getAttribute('role') === 'menuitem'
      if (sel === '[role="separator"]') return this.getAttribute('role') === 'separator'
      if (sel.includes('footer') || sel.includes('Footer')) {
        return this.className.includes('footer') || this.className.includes('Footer') || this.getAttribute('data-slot') === 'footer'
      }
      if (sel.includes('separator') || sel.includes('divider') || sel === 'hr') {
        return this.className.includes('separator') || this.className.includes('divider') || this.tagName === 'HR'
      }
      return false
    }

    closest(sel: string): DomNode | null {
      let curr: DomNode | null = this
      while (curr) {
        if (curr.matches(sel)) return curr
        curr = curr.parentElement
      }
      return null
    }

    querySelectorAll(sel: string): DomNode[] {
      const parts = sel.split(',').map(s => s.trim())
      const res: DomNode[] = []
      const traverse = (node: DomNode) => {
        for (const child of node.children) {
          if (parts.some(p => child.matches(p))) res.push(child)
          traverse(child)
        }
      }
      traverse(this)
      return res
    }
  }

  // 模拟真实宿主结构：menu -> viewport -> itemWrap -> button
  const menu = new DomNode('div')
  menu.setAttribute('role', 'menu')

  const viewport = new DomNode('div', '_viewport_70kcw_19')
  menu.appendChild(viewport)

  const oursWrap = new DomNode('div', '_itemWrap_70kcw_100')
  const oursBtn = new DomNode('button', '_item_70kcw_173')
  oursBtn.setAttribute('role', 'menuitem')
  oursWrap.appendChild(oursBtn)
  viewport.appendChild(oursWrap)

  const renameWrap = new DomNode('div', '_itemWrap_70kcw_100')
  const renameBtn = new DomNode('button', '_item_70kcw_173')
  renameBtn.setAttribute('role', 'menuitem')
  renameWrap.appendChild(renameBtn)
  viewport.appendChild(renameWrap)

  // 带有 afterContent 的 footer 容器（自带 0.5px border-top 分割线）
  const footer = new DomNode('div', '_footer_70kcw_300')
  const afterBtn = new DomNode('button', '_item_70kcw_173')
  afterBtn.setAttribute('role', 'menuitem')
  footer.appendChild(afterBtn)
  menu.appendChild(footer)

  const hiddenMap = new Map()
  hideOtherItems(menu as any, oursBtn as any, hiddenMap)

  // 1. 验证 viewport 下的 renameWrap 必须被设置 display: none 与 aria-hidden: true（非死代码）
  assert.equal(renameWrap.style.display, 'none', '宿主 .viewport 内部的 itemWrap 必须被隐藏')
  assert.equal(renameWrap.getAttribute('aria-hidden'), 'true', 'itemWrap 必须标记 aria-hidden')

  // 2. 验证 footer 容器必须被隐藏，消除 0.5px 残留线
  assert.equal(footer.style.display, 'none', 'footer 容器必须被隐藏以消除残留分割线')

  // 3. 验证 oursWrap 绝不能被隐藏
  assert.equal(oursWrap.style.display || '', '', 'oursWrap 必须保持可见')

  // 4. 验证 hiddenItems 清理：当旧节点被宿主从 DOM 树移除后（isConnected: false），再次调用必须清理掉
  renameWrap.isConnected = false
  renameBtn.isConnected = false
  viewport.children = viewport.children.filter(c => c !== renameWrap)
  hideOtherItems(menu as any, oursBtn as any, hiddenMap)
  assert.equal(hiddenMap.has(renameWrap), false, '已断开连接的 renameWrap 必须被从 hiddenItems 清理')
  assert.equal(hiddenMap.has(renameBtn), false, '已断开连接的 renameBtn 必须被从 hiddenItems 清理')
})

test('replaceMenuItemContent 在无 .itemIcon 结构的模板行上绝不丢失图标', async () => {
  const { replaceMenuItemContent } = await import('../src/client/workspace-menu.js')

  // 场景 A：模板只有一个 label span，无显式 itemIcon 容器
  class SimpleMockNode {
    tagName: string
    className: string
    children: SimpleMockNode[] = []
    parentElement: SimpleMockNode | null = null
    _textContent = ''
    _innerHTML = ''

    constructor(tagName: string, className = '') {
      this.tagName = tagName.toUpperCase()
      this.className = className
    }

    get firstElementChild(): SimpleMockNode | null { return this.children[0] ?? null }
    get lastElementChild(): SimpleMockNode | null { return this.children[this.children.length - 1] ?? null }

    get textContent(): string {
      if (this.children.length === 0) return this._textContent
      return this.children.map(c => c.textContent).join('')
    }
    set textContent(v: string) {
      this._textContent = v
      this.children = []
    }

    get innerHTML() { return this._innerHTML }
    set innerHTML(v: string) {
      this._innerHTML = v
      this._textContent = v
    }

    cloneNode(_deep = true): SimpleMockNode {
      const copy = new SimpleMockNode(this.tagName, this.className)
      copy._textContent = this._textContent
      copy._innerHTML = this._innerHTML
      for (const c of this.children) copy.appendChild(c.cloneNode(true))
      return copy
    }

    appendChild(child: SimpleMockNode) {
      child.parentElement = this
      this.children.push(child)
      return child
    }

    insertBefore(newNode: SimpleMockNode, refNode: SimpleMockNode | null) {
      newNode.parentElement = this
      const idx = refNode ? this.children.indexOf(refNode) : -1
      if (idx === -1) this.children.push(newNode)
      else this.children.splice(idx, 0, newNode)
      return newNode
    }

    querySelector(sel: string): SimpleMockNode | null {
      for (const c of this.children) {
        if (sel === 'span' && c.tagName === 'SPAN') return c
        if (sel.includes('itemIcon') && c.className.includes('itemIcon')) return c
        if (sel.includes('itemLabel') && c.className.includes('itemLabel')) return c
        const found = c.querySelector(sel)
        if (found) return found
      }
      return null
    }

    querySelectorAll(sel: string): SimpleMockNode[] {
      const res: SimpleMockNode[] = []
      for (const c of this.children) {
        if (sel.includes('span') && c.tagName === 'SPAN') res.push(c)
        res.push(...c.querySelectorAll(sel))
      }
      return res
    }

    contains(other: SimpleMockNode | null): boolean {
      let curr = other
      while (curr) {
        if (curr === this) return true
        curr = curr.parentElement
      }
      return false
    }
  }

  const btn = new SimpleMockNode('button')
  const labelSpan = new SimpleMockNode('span')
  labelSpan.textContent = '重命名'
  btn.appendChild(labelSpan)

  const iconSvg = '<svg class="icon"><path d="task"></path></svg>'
  replaceMenuItemContent(btn as any, '重命名', '任务设置', iconSvg)

  // 必须同时具备图标和文案
  assert.equal(btn.children.length, 2, '必须有 2 个子节点（图标容器与文案容器）')
  assert.match(btn.children[0]!.innerHTML, /<svg/, '第一个子节点必须是图标容器且写入了 svg 图标')
  assert.equal(btn.children[1]!.textContent, '任务设置', '第二个子节点必须是文案容器且文案为「任务设置」')
})


