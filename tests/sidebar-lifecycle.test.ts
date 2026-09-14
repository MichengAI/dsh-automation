import { readFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
// @ts-expect-error 测试环境闭包模拟器使用 JavaScript，不属于生产接口。
import { extractBlock, lifecycleCases } from './sidebar-lifecycle-harness.mjs'

const source = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
const block = extractBlock(source, '    let wrappedEntry:', "\n  ctx.slots.inject('conversation.input.left'", '定时生命周期')
const body = extractBlock(block, '    let wrappedEntry:', '\n  })', '定时生命周期闭包', ['notifyPeers', 'ownedWrapper'])
lifecycleCases(test, ts.transpileModule(body, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, 'automation')

test('源码提取拒绝缺失、重复、倒序标记和残缺闭包', () => {
  for (const invalid of ['', 'BEGIN body', 'body END', 'END BEGIN', 'BEGIN BEGIN END', 'BEGIN END END']) {
    assert.throws(() => extractBlock(invalid, 'BEGIN', 'END', '测试闭包'), /测试闭包.*标记/)
  }
  assert.throws(() => extractBlock('BEGIN partial END', 'BEGIN', 'END', '测试闭包', ['notifyPeers']), /缺少 notifyPeers/)
  assert.throws(() => extractBlock('BEGIN notifyPeers END', 'BEGIN', 'END', '测试闭包', ['ownedWrapper']), /缺少 ownedWrapper/)
  assert.equal(extractBlock('BEGIN\r\nbody\r\nEND', 'BEGIN', '\nEND', '测试闭包'), 'BEGIN\nbody')
})
