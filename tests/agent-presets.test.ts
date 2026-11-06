import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAgentPreset } from '../src/agent-presets.ts'
import { agentPresetLabel } from '../src/client/agent-presets.ts'

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
