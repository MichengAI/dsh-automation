import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')

test('向 Codex UI 的定时插槽注册自动化任务总览', () => {
  assert.match(source, /ctx\.slots\.inject\('sidebar\.schedule'/, '定时任务插件必须填充 Codex UI 使用的 sidebar.schedule 插槽')
  assert.match(source, /id:\s*'dsh-automation-schedule-overview'/, '定时总览插槽必须使用稳定的唯一 ID')
  assert.match(source, /ScheduleOverview/, '定时插槽必须渲染自动化任务总览')
})
