import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeRun, unattendedToolGuardReason } from '../src/executor.ts'

test('无人值守守卫拒绝未知工具和后台 shell', () => {
  assert.equal(unattendedToolGuardReason('read', {}), undefined)
  assert.equal(unattendedToolGuardReason('automation_create', {}), "工具 'automation_create' 不在无人值守自动化允许列表中。")
  assert.match(unattendedToolGuardReason('bash', { run_in_background: true }) ?? '', /后台进程/)
})

test('运行摘要只取本 run 区间内的最后一条助手文本和 turn 结束原因', () => {
  const result = summarizeRun([
    { seq: 1, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '旧内容' }] } } },
    { seq: 2, type: 'turn/start', data: {} },
    { seq: 3, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: '新结果' }] } } },
    { seq: 4, type: 'turn/end', data: { reason: { kind: 'completed' } } },
  ], 2)
  assert.equal(result.text, '新结果')
  assert.equal(result.reason?.kind, 'completed')
})
