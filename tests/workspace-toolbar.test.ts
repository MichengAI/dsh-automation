import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { automationToggleMutation } from '../src/client/schedule-rail-model.ts'
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

test('定时文件夹与宿主任务文件夹使用相同的 8px 行内起点', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-n-row\{[^}]*padding-left:8px/)
})

test('任务总览开关按当前状态选择暂停或恢复操作', () => {
  assert.equal(automationToggleMutation('active'), 'pause')
  assert.equal(automationToggleMutation('paused'), 'resume')
})

test('任务总览使用独立开关控制状态且不再显示状态徽标', () => {
  const overview = readFileSync(new URL('../src/client/schedule-overview.tsx', import.meta.url), 'utf8')
  const rail = readFileSync(new URL('../src/client/ScheduleRail.tsx', import.meta.url), 'utf8')
  const nativeList = readFileSync(new URL('../src/client/native-session-list.tsx', import.meta.url), 'utf8')

  assert.match(overview, /role="switch"/)
  assert.match(overview, /aria-checked=\{!paused\}/)
  assert.match(overview, /onToggleAutomation\?\.\(row\.id, automationToggleMutation\(row\.status\)\)/)
  assert.doesNotMatch(overview, /dsh-st-overview-status/)
  assert.match(rail, /onToggleAutomation=\{\(automationId, mutation\) => runtime\.mutateAutomation\(automationId, mutation\)\}/)
  assert.match(nativeList, /onToggleAutomation=\{\(automationId, mutation\) => runtime\.mutateAutomation\(automationId, mutation\)\}/)
})

test('任务总览卡片压缩高度并为详情入口和开关保留独立点击区域', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  const overview = readFileSync(new URL('../src/client/schedule-overview.tsx', import.meta.url), 'utf8')

  assert.match(css, /\.dsh-st-overview-row\{[^}]*min-height:56px/)
  assert.match(css, /\.dsh-st-overview-open\{[^}]*grid-template-rows:18px 18px;[^}]*gap:4px 8px;[^}]*min-height:56px/)
  assert.match(css, /\.dsh-st-overview-copy\{display:contents\}/)
  assert.match(css, /\.dsh-st-overview-name\{[^}]*grid-column:1\/4;[^}]*grid-row:1;[^}]*padding-right:44px/)
  assert.match(css, /\.dsh-st-overview-schedule\{[^}]*grid-column:1;[^}]*grid-row:2/)
  assert.match(css, /\.dsh-st-overview-next\{[^}]*grid-row:2;[^}]*flex-direction:row;[^}]*align-items:baseline/)
  assert.match(css, /\.dsh-st-overview-chevron\{[^}]*grid-row:2/)
  assert.match(css, /\.dsh-st-overview-toggle\{[^}]*position:absolute;[^}]*top:3px;[^}]*right:2px;[^}]*width:44px;[^}]*height:28px/)
  assert.match(overview, /<div className=\{`dsh-st-overview-row/)
  assert.match(overview, /<button[\s\S]*?className="dsh-st-overview-open"/)
})
