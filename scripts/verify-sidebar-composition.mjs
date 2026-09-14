// 显式指定 IM 检出目录，执行两仓库真实接入闭包的组合回归；不安装插件或启动宿主。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import * as tabs from '../src/client/native-tabs.ts'
import * as model from '../src/client/schedule-rail-model.ts'
import { createHarness } from '../tests/sidebar-lifecycle-harness.mjs'

if (!process.argv[2]) throw new Error('请提供 dsh-im-connect 检出目录')
const auto = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
const im = readFileSync(resolve(process.argv[2], 'client.js'), 'utf8')
const block = auto.slice(auto.indexOf('    let wrappedEntry:'), auto.indexOf("\n  ctx.slots.inject('conversation.input.left'"))
const autoBody = ts.transpileModule(block.slice(0, block.lastIndexOf('\n  })')), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const imStart = im.indexOf('        let wrappedEntry = null;')
const imBody = im.slice(imStart, im.indexOf('\n      });', imStart))
const registryStart = im.indexOf('    function createNativeTabRegistry(')
const registryEnd = im.indexOf('    function applyRegistryFilters(', registryStart)
const imHelpers = new Function(im.slice(registryStart, registryEnd) + '; return { createNativeTabRegistry, attachNativeTabRegistry, findNativeTabRegistry };')()
const permutations = list => list.length < 2 ? [list] : list.flatMap((p, i) => permutations(list.filter((_, j) => i !== j)).map(rest => [p, ...rest]))
let scenarios = 0
for (const group of ['A', 'I', 'T', 'AI', 'AT', 'IT', 'AIT']) {
  for (const withCodex of [false, true]) {
    for (const order of permutations([...group, ...(withCodex ? ['C'] : [])])) {
      for (const delayed of [false, true]) {
        const h = createHarness(autoBody, 'automation'), official = h.add(), original = official.component
        const disposers = new Map(), installed = new Set()
        let archive, codex
        const check = () => {
          const entry = h.winner()[0], ids = h.find(entry)?.getTabs().map(t => t.id) ?? []
          if (installed.has('C')) {
            assert.equal(entry, codex)
            assert.equal(!!entry.component.__dshNativeTabHost, false)
            return
          }
          if (installed.has('I')) assert.ok(entry.component.__imConnectWrapped || ids.includes('channels'), `${order}: 缺频道`)
          if (installed.has('T')) assert.ok(ids.includes('schedule'), `${order}: 缺定时`)
          assert.equal(new Set(ids).size, ids.length)
        }
        for (const p of order) {
          if (p === 'A') archive = h.add(-0.5)
          if (p === 'C') { h.setCodex(true); codex = h.add(-1) }
          if (p === 'I') disposers.set(p, h.start(imBody, imHelpers))
          if (p === 'T') disposers.set(p, h.start(autoBody, { ...tabs, ...model, hasCodexUiSidebar: () => installed.has('C') }))
          installed.add(p)
          if (delayed) { await h.settle(); for (let i = 0; i < 21; i++) h.tick(); await h.settle(); check() }
        }
        await h.settle(); check()
        // 卸载先加载的插件，验证仍在运行的另一个插件能够接管。
        for (const p of order) {
          if (p === 'A') h.remove(archive)
          if (p === 'C') { h.remove(codex); installed.delete(p); h.setCodex(false) }
          disposers.get(p)?.(); installed.delete(p)
          await h.settle(); check()
        }
        assert.equal(official.component, original)
        assert.equal(h.find(official), undefined)
        scenarios++
      }
    }
  }
}
console.log(`侧栏组合回归通过：${scenarios} 个场景（含全部注册顺序、通知延迟、Codex UI 切换及卸载接管）`)
