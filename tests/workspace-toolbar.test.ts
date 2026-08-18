import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { officialSearchIconSize } from '../src/client/workspace-toolbar.tsx'

test('官方搜索图标折叠 14px、展开 11px', () => {
  assert.equal(officialSearchIconSize(false), 14)
  assert.equal(officialSearchIconSize(true), 11)
})

test('折叠搜索时输入框不占点击层', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-n-search-input\{display:none/)
  assert.match(css, /\.dsh-st-n-search-slot\{[^}]*min-width:28px/)
  assert.match(css, /\.dsh-st-n-search-btn,\.dsh-st-n-head-btn\{[^}]*min-width:28px/)
})