import assert from 'node:assert/strict'
import test from 'node:test'
import { archiveTaskSessions } from '../src/client/task-group-archive.ts'

test('任务组归档只串行提交去重后的未归档真实会话 ID', async () => {
  const calls: string[] = []
  let active = false
  await archiveTaskSessions(['a', 'archived', 'a', '', 'b'], new Set(['archived']), async id => {
    assert.equal(active, false)
    active = true
    calls.push(id)
    await Promise.resolve()
    active = false
  })
  assert.deepEqual(calls, ['a', 'b'])
})

test('任务组归档失败时保留错误并停止，重试时跳过已成功归档会话', async () => {
  const archived = new Set<string>()
  const calls: string[] = []
  const failure = new Error('archive failed')
  await assert.rejects(archiveTaskSessions(['a', 'b', 'c'], archived, async id => {
    calls.push(id)
    if (id === 'b') throw failure
    archived.add(id)
  }), error => error === failure)
  assert.deepEqual(calls, ['a', 'b'])
  calls.length = 0
  await archiveTaskSessions(['a', 'b', 'c'], archived, async id => { calls.push(id) })
  assert.deepEqual(calls, ['b', 'c'])
})
