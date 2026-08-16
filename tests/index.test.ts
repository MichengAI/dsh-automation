import assert from 'node:assert/strict'
import test from 'node:test'
import { humanApprovalReason, needsHumanApproval } from '../src/index.ts'

test('审批只作用于已挂载 Agent 的变更工具，纯暂停不需要确认', () => {
  const signal = new AbortController().signal
  assert.equal(needsHumanApproval({ name: 'automation_create', signal }, true), true)
  assert.equal(needsHumanApproval({ name: 'automation_delete', signal }, true), true)
  assert.equal(needsHumanApproval({
    name: 'automation_update',
    arguments: { id: 'automation-1', status: 'paused' },
    signal,
  }, true), false)
  assert.equal(needsHumanApproval({ name: 'automation_create', signal }, false), false)

  const cancelled = new AbortController()
  cancelled.abort()
  assert.equal(needsHumanApproval({ name: 'automation_run_now', signal: cancelled.signal }, true), false)
  assert.match(humanApprovalReason('automation_delete'), /永久删除/)
})
