import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAgentPreset } from '../src/agent-presets.ts'
import { agentPresetLabel, buildAgentPresetOptions } from '../src/client/agent-presets.ts'

const options = [{ id: 'standard' }, { id: 'minimal' }, { id: 'ptc' }]

test('Agent 预设名册校验只接受当前已知 id', () => {
  assert.equal(normalizeAgentPreset(' standard ', options), 'standard')
  assert.equal(normalizeAgentPreset('minimal', options), 'minimal')
  assert.equal(normalizeAgentPreset('unknown', options), undefined)
  assert.equal(normalizeAgentPreset('', options), undefined)
  assert.equal(normalizeAgentPreset(undefined, options), undefined)
  assert.equal(normalizeAgentPreset(42, options), undefined)
})

test('内置预设走官方词条，自建预设保留自报名称', () => {
  const translate = ((key: string) => `t:${key}`) as never
  assert.equal(agentPresetLabel({ id: 'standard' }, translate), 't:presetStandardName')
  assert.equal(agentPresetLabel({ id: 'minimal', name: 'minimal' }, translate), 't:presetMinimalName')
  assert.equal(agentPresetLabel({ id: 'custom', name: '我的预设' }, translate), '我的预设')
  assert.equal(agentPresetLabel({ id: 'custom' }, translate), 'custom')
})

test('宿主命名空间可用时优先使用其词条，缺失时回退本地词典', () => {
  const local = ((key: string) => `local:${key}`) as never
  const host = ((key: string) => key === 'presetStandardName' ? '标准模式（宿主）' : key) as never
  assert.equal(agentPresetLabel({ id: 'standard' }, local, host), '标准模式（宿主）')
  assert.equal(agentPresetLabel({ id: 'minimal' }, local, host), 'local:presetMinimalName')
})

test('预设下拉项：损坏禁用、当前值补项、说明文案来自词条', () => {
  const local = ((key: string) => key === 'form.agentPresetUnavailable' ? ' (Unavailable)' : `local:${key}`) as never
  const host = ((key: string) => key === 'presetStandardName' ? '标准模式' : key === 'presetStandardDescription' ? '标准说明' : key) as never
  const options = buildAgentPresetOptions(
    [{ id: 'standard' }, { id: 'broken', broken: '无法加载' }],
    'deleted-preset',
    local,
    host,
  )
  assert.equal(options[0]?.text, '标准模式')
  assert.notEqual(typeof options[0]?.label, 'string')
  assert.equal(options[1]?.disabled, true)
  assert.equal(options[1]?.text, 'broken')
  assert.equal(options[1]?.label, 'broken (Unavailable)')
  assert.equal(options[2]?.value, 'deleted-preset')
  assert.equal(options[2]?.text, 'deleted-preset')
})
