import { readFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
// @ts-expect-error 测试环境闭包模拟器使用 JavaScript，不属于生产接口。
import { createHarness, extractBlock, lifecycleCases } from './sidebar-lifecycle-harness.mjs'

const source = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
const block = extractBlock(source, '    let wrappedEntry:', "\n  ctx.slots.inject('conversation.input.left'", '定时生命周期')
const body = extractBlock(block, '    let wrappedEntry:', '\n  })', '定时生命周期闭包', ['notifyPeers', 'ownedWrapper'])
const compiledBody = ts.transpileModule(body, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
lifecycleCases(test, compiledBody, 'automation')

test('外壳替换且新注册表迟到时先清理旧贡献，收到通知后接入新表', async () => {
  const h = createHarness(compiledBody, 'automation')
  const entry = h.add()
  const oldRegistry = h.registry(null)
  entry.component = Object.assign(function ForeignHost() {}, { __dshNativeTabHost: true, __dshNativeTabs: oldRegistry })
  entry.__dshNativeTabs = oldRegistry
  const stop = h.start()
  try {
    assert.equal(oldRegistry.getTabs().length, 1)
    entry.component = Object.assign(function NextHost() {}, { __dshNativeTabHost: true })
    h.window.dispatchEvent(new Event('dsh-native-sidebar-change'))
    await h.settle()
    assert.deepEqual(oldRegistry.getTabs(), [], '外壳切换后不能继续持有旧表中的贡献')
    const currentRegistry = h.registry(null)
    entry.component.__dshNativeTabs = currentRegistry
    h.window.dispatchEvent(new Event('dsh-native-sidebar-change'))
    await h.settle()
    assert.deepEqual(currentRegistry.getTabs().map((tab: { id: string }) => tab.id), ['schedule'])
  } finally { stop() }
})

test('源码提取拒绝缺失、重复、倒序标记和残缺闭包', () => {
  for (const invalid of ['', 'BEGIN body', 'body END', 'END BEGIN', 'BEGIN BEGIN END', 'BEGIN END END']) {
    assert.throws(() => extractBlock(invalid, 'BEGIN', 'END', '测试闭包'), /测试闭包.*标记/)
  }
  assert.throws(() => extractBlock('BEGIN partial END', 'BEGIN', 'END', '测试闭包', ['notifyPeers']), /缺少 notifyPeers/)
  assert.throws(() => extractBlock('BEGIN notifyPeers END', 'BEGIN', 'END', '测试闭包', ['ownedWrapper']), /缺少 ownedWrapper/)
  assert.equal(extractBlock('BEGIN\r\nbody\r\nEND', 'BEGIN', '\nEND', '测试闭包'), 'BEGIN\nbody')
})
