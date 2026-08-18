import assert from 'node:assert/strict'
import test from 'node:test'
import {
  humanApprovalReason,
  needsHumanApproval,
  sessionApprovalPolicy,
} from '../src/index.ts'

test('Full access 的 never 策略不强制 ask，避免静默拒绝', () => {
  const signal = new AbortController().signal
  assert.equal(needsHumanApproval({ name: 'automation_create', signal }, true, 'never'), false)
  assert.equal(needsHumanApproval({ name: 'automation_delete', signal }, true, 'never'), false)
  assert.equal(needsHumanApproval({ name: 'automation_run_now', signal }, true), false)
})

test('Read Only / Workspace Write 的 ask 策略会走官方授权', () => {
  const signal = new AbortController().signal
  assert.equal(needsHumanApproval({ name: 'automation_create', signal }, true, 'ask'), true)
  assert.equal(needsHumanApproval({ name: 'automation_delete', signal }, true, 'ask'), true)
  assert.equal(needsHumanApproval({ name: 'automation_run_now', signal }, true, 'ask'), true)
  assert.equal(needsHumanApproval({
    name: 'automation_update',
    arguments: { id: 'automation-1', status: 'paused' },
    signal,
  }, true, 'ask'), false)
  assert.equal(needsHumanApproval({
    name: 'automation_update',
    arguments: { id: 'automation-1', name: '新名称' },
    signal,
  }, true, 'ask'), true)
  assert.equal(needsHumanApproval({ name: 'automation_list', signal }, true, 'ask'), false)
  assert.match(humanApprovalReason('automation_delete'), /永久删除/)
})

test('会话策略优先读 override，否则回退配置默认值', () => {
  assert.equal(sessionApprovalPolicy({
    overrideOf: () => 'never',
    config: { policy: 'ask' },
  }, {}), 'never')
  assert.equal(sessionApprovalPolicy({
    overrideOf: () => undefined,
    config: { policy: 'ask' },
  }, {}), 'ask')
  assert.equal(sessionApprovalPolicy(undefined, {}), undefined)
})