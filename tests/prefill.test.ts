import assert from 'node:assert/strict'
import test from 'node:test'
import { peekChatPrefill, setChatPrefill, subscribeChatPrefill, takeChatPrefill } from '../src/client/prefill.ts'

test('通过对话创建会暂存提示词并只领取一次', () => {
  const seen: Array<string | null> = []
  const stop = subscribeChatPrefill(value => { seen.push(value) })
  setChatPrefill('我要创建一个定时任务，每【时间间隔】执行【具体任务】')
  assert.equal(peekChatPrefill()?.includes('时间间隔'), true)
  assert.equal(takeChatPrefill()?.includes('具体任务'), true)
  assert.equal(takeChatPrefill(), null)
  stop()
  assert.equal(seen.at(-1)?.includes('定时任务'), true)
})
