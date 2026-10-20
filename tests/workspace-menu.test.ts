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
