import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
// @ts-expect-error 测试环境闭包模拟器使用 JavaScript，不属于生产接口。
import { lifecycleCases } from './sidebar-lifecycle-harness.mjs'

const source = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
const start = source.indexOf('    let wrappedEntry:')
const end = source.indexOf("\n  ctx.slots.inject('conversation.input.left'", start)
const block = source.slice(start, end)
const body = block.slice(0, block.lastIndexOf('\n  })'))
lifecycleCases(test, ts.transpileModule(body, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, 'automation')
