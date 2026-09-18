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

test('定时文件夹与宿主任务文件夹使用官方 padding-inline-start', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-n-row,\.dsh-st-n-sess\{[^}]*padding:0 8px;[^}]*padding-inline-start:calc\(8px \+ var\(--dsh-workspace-indent,0px\)\)/)
  assert.doesNotMatch(css, /\.dsh-st-n-row\{padding-left:8px\}/)
  assert.doesNotMatch(css, /\.dsh-st-n-sess\{padding-left:8px\}/)
  assert.doesNotMatch(css, /\.dsh-st-n-row,\.dsh-st-n-sess\{[^}]*padding:0 8px 0 12px/)
})

test('定时会话列表跟随官方文件夹悬停、滚动槽和悬停卡片', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  const nativeList = readFileSync(new URL('../src/client/native-session-list.tsx', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-n-row:hover \.dsh-st-n-folder/)
  assert.match(css, /\.dsh-st-n-folder\{display:none\}/)
  assert.match(css, /\.dsh-st-n-row:hover \.dsh-st-n-chevron/)
  assert.match(css, /\.dsh-st-n-chevron\{display:inline-flex\}/)
  assert.doesNotMatch(css, /\.dsh-st-n-row\.is-menu \.dsh-st-n-chevron/)
  assert.doesNotMatch(css, /\.dsh-st-n-row\.is-menu \.dsh-st-n-folder/)
  assert.match(css, /\.dsh-st-n-row\.has-current-session \.dsh-st-n-folder\{color:var\(--dsw-alias-state-business-primary/)
  assert.match(css, /\.dsh-st-n-sess\.is-flat-idle \.dsh-st-n-title\{margin-left:0\}/)
  assert.match(css, /\.dsh-st-n\{[^}]*--dsh-session-list-edge-inset:var\(--dsh-sidebar-inline-padding/)
  assert.match(css, /\.dsh-st-n-list-area\{[^}]*margin-right:calc\(-1 \* var\(--dsh-session-list-edge-inset\)\)/)
  assert.match(css, /\.dsh-st-n-tree\{[^}]*scrollbar-gutter:stable/)
  assert.doesNotMatch(css, /\.dsh-st-n-tree\{[^}]*margin-right:calc\(-1 \* var\(--dsh-session-list-edge-inset\)/)
  assert.match(css, /\.dsh-st-n-hover\{[^}]*width:244px;[^}]*padding:12px 16px;[^}]*background:#2C2C2E/)
  assert.match(css, /\.dsh-st-n-toolbar\.is-search \.dsh-st-n-search\{border:\.5px solid var\(--dsw-alias-border-l4\)/)
  assert.match(css, /\.dsh-st-n-toolbar\.is-search \.dsh-st-n-search\{[^}]*color:var\(--dsw-alias-label-caption/)
  assert.match(css, /\.dsh-st-n-empty\{padding:16px 12px;[^}]*font-size:13px\}/)
  assert.match(css, /\.dsh-st-n-hover-dot\{width:10px;height:10px/)
  assert.match(css, /\.dsh-st-n-group\{[^}]*position:relative/)
  assert.match(nativeList, /dsh-st-n-list-area/)
})

test('定时文件夹与会话选中条跟随官方 2px 行距', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-n-group>\*\+\*\{margin-top:2px\}/)
  assert.match(css, /\.dsh-st-n-group\+\.dsh-st-n-group\{margin-top:4px\}/)
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

test('任务总览卡片点击打开任务设置并让下次运行贴右显示', () => {
  const css = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  const overview = readFileSync(new URL('../src/client/schedule-overview.tsx', import.meta.url), 'utf8')
  const rail = readFileSync(new URL('../src/client/ScheduleRail.tsx', import.meta.url), 'utf8')
  const nativeList = readFileSync(new URL('../src/client/native-session-list.tsx', import.meta.url), 'utf8')

  assert.match(css, /\.dsh-st-overview-row\{[^}]*min-height:56px/)
  assert.match(css, /\.dsh-st-overview-open\{[^}]*grid-template-columns:minmax\(0,1fr\) auto;[^}]*grid-template-rows:18px 18px;[^}]*gap:4px 8px;[^}]*min-height:56px/)
  assert.match(css, /\.dsh-st-overview-copy\{display:contents\}/)
  assert.match(css, /\.dsh-st-overview-name\{[^}]*grid-column:1\/3;[^}]*grid-row:1;[^}]*padding-right:44px/)
  assert.match(css, /\.dsh-st-overview-schedule\{[^}]*grid-column:1;[^}]*grid-row:2/)
  assert.match(css, /\.dsh-st-overview-schedule svg\{flex:none\}/)
  assert.match(css, /\.dsh-st-overview-schedule>span\{[^}]*overflow:hidden;[^}]*text-overflow:ellipsis/)
  assert.match(css, /\.dsh-st-overview-next\{[^}]*grid-column:2;[^}]*grid-row:2;[^}]*justify-self:end;[^}]*align-items:center/)
  assert.doesNotMatch(css, /\.dsh-st-overview-chevron/)
  assert.match(css, /\.dsh-st-overview-toggle\{[^}]*position:absolute;[^}]*top:3px;[^}]*right:2px;[^}]*width:44px;[^}]*height:28px/)
  assert.match(overview, /<div className=\{`dsh-st-overview-row/)
  assert.match(overview, /<button[\s\S]*?className="dsh-st-overview-open"/)
  assert.match(overview, /onClick=\{\(\) => \{ openTaskSettings\?\.\(\{ automationId: row\.id, name: row\.name, sessionIds: \[\] \}\) \}\}/)
  assert.match(overview, /const nextRunCompact = row\.nextRunAt === undefined \? t\('stats\.noneScheduled'\) : formatRelativeTime\(row\.nextRunAt, now, t\)/)
  assert.match(overview, /const nextRunLabel = `\$\{t\('stats\.next'\)\}: \$\{nextRun\}`/)
  assert.match(overview, /<span className="dsh-st-overview-next" title=\{nextRunLabel\} aria-label=\{nextRunLabel\}><strong>\{nextRunCompact\}<\/strong><\/span>/)
  assert.doesNotMatch(overview, /<span>\{t\('stats\.next'\)\}<\/span>/)
  assert.doesNotMatch(overview, /openSession|ChevronIcon|lastSessionId/)
  assert.match(rail, /\.\.\.\(openTaskSettings === undefined \? \{\} : \{ openTaskSettings \}\)/)
  assert.match(nativeList, /\.\.\.\(openTaskSettings === undefined \? \{\} : \{ openTaskSettings \}\)/)
})
