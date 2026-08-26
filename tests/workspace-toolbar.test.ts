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

test('任务总览与执行记录的内容起点使用同一 36px 控制行节奏', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-overview\{[^}]*padding:2px 8px 14px/)
  assert.match(css, /\.dsh-st-overview-head\{[^}]*height:36px;[^}]*min-height:36px;[^}]*margin-bottom:4px;[^}]*padding:6px 0/)
  assert.match(css, /\.dsh-st-n-toolbar\{[^}]*height:36px;[^}]*margin:2px [^}]* 4px 0/)
})

test('任务总览标题与工作区共用弱化颜色，排序使用同款图标按钮', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  const overview = readFileSync(new URL('../src/client/schedule-overview.tsx', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-overview-title\{[^}]*color:var\(--dsw-alias-label-tertiary/)
  assert.match(css, /\.dsh-st-overview-title strong\{font-size:14px;font-weight:400;line-height:20px\}/)
  assert.match(overview, /<SortMenu[\s\S]*?compact[\s\S]*?iconOnly[\s\S]*?className="dsh-st-overview-sort"/)
})
