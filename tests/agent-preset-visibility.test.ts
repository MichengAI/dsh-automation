import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { en, zh } from '../src/client/locales.ts'

test('不可用预设的括号跟随当前语言', () => {
  assert.equal(en['form.agentPresetUnavailable'], ' (Unavailable)')
  assert.equal(zh['form.agentPresetUnavailable'], '（不可用）')
})

test('零预设说明有中英文案', () => {
  assert.match(en['form.agentPresetMissing'], /has not declared any Agent preset/)
  assert.match(zh['form.agentPresetMissing'], /未声明任何 Agent 预设/)
})

test('卡片脚三项都带 title，窄卡片截断不会是静默的', () => {
  const view = readFileSync(new URL('../src/client/AutomationView.tsx', import.meta.url), 'utf8')
  assert.match(view, /className="dsh-st-chip" title=\{scheduleText\}/)
  assert.match(view, /className="dsh-st-chip" title=\{`\$\{t\('card\.agentPreset'\)\}: \$\{presetName\}`\}/)
  assert.match(view, /className="dsh-st-card-next" title=\{nextRunText\}/)
})

test('预设 chip 比下次运行先收缩', () => {
  const styles = readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(styles, /\.dsh-st-card-foot \.dsh-st-chip\{flex:0 2 auto/)
  assert.match(styles, /\.dsh-st-card-next\{flex:0 1 auto/)
})
