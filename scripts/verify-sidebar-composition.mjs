// 显式指定 IM 检出目录，执行两仓库真实接入闭包的组合回归；不安装插件或启动宿主。
// 先构建 IM，再在本仓运行 node --import tsx scripts/verify-sidebar-composition.mjs <IM 检出目录>。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { createElement } from 'react'
import { createShellHarness, findNode } from '../tests/sidebar-shell-harness.mjs'
import * as tabs from '../src/client/native-tabs.ts'
import * as model from '../src/client/schedule-rail-model.ts'
import { createHarness, extractBlock } from '../tests/sidebar-lifecycle-harness.mjs'

if (!process.argv[2]) throw new Error('请提供 dsh-im-connect 检出目录')
const auto = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
const im = readFileSync(resolve(process.argv[2], 'lib/client.js'), 'utf8')
const block = extractBlock(auto, '    let wrappedEntry:', "\n  ctx.slots.inject('conversation.input.left'", '定时生命周期')
const autoBody = ts.transpileModule(extractBlock(block, '    let wrappedEntry:', '\n  })', '定时生命周期闭包', ['notifyPeers', 'ownedWrapper']), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const imBody = extractBlock(im, '        let wrappedEntry = null;', '\n      });\n    }\n\n    exports.apply', 'IM 生命周期', ['notifyPeers', 'ownedWrapper'])
const registry = extractBlock(im, '    function createNativeTabRegistry(', '    function applyRegistryFilters(', 'IM 注册表', ['function attachNativeTabRegistry(', 'function findNativeTabRegistry('])
const imHelpers = new Function(registry + '; return { createNativeTabRegistry, attachNativeTabRegistry, findNativeTabRegistry };')()
const permutations = list => list.length < 2 ? [list] : list.flatMap((p, i) => permutations(list.filter((_, j) => i !== j)).map(rest => [p, ...rest]))
let scenarios = 0
for (const group of ['A', 'I', 'T', 'AI', 'AT', 'IT', 'AIT']) {
  for (const withCodex of [false, true]) {
    for (const order of permutations([...group, ...(withCodex ? ['C'] : [])])) {
      for (const delayed of [false, true]) {
        const h = createHarness(autoBody, 'automation'), official = h.add(), original = official.component
        const disposers = new Map(), installed = new Set()
        let archive, codex
        // 执行真实贡献回调，只替代最终视图和宿主导航，不请求网络或启动服务。
        const start = p => p === 'I'
          ? h.start(imBody, {
            ...imHelpers, h: createElement,
            ImSidebarFallbackBoundary: 'im-boundary', LocalizedChannelRail: 'im-channel-rail',
          })
          : h.start(autoBody, {
            ...tabs, ...model, createElement,
            hasCodexUiSidebar: () => installed.has('C'),
            createScheduledSessionOpener: (_ctx, _runtime, open) => open,
            NativeScheduleSessionList: 'schedule-list',
            scheduledListHostActions: () => ({}),
            isSessionSelector: value => typeof value === 'function',
            isWorkspaceSelector: value => typeof value === 'function',
          })
        const check = () => {
          const entry = h.winner()[0], registry = h.find(entry), contributions = registry?.getTabs() ?? []
          const ids = contributions.map(t => t.id)
          if (installed.has('C')) {
            assert.equal(entry, codex)
            assert.equal(!!entry.component.__dshNativeTabHost, false)
            return
          }
          if (installed.has('I')) assert.ok(entry.component.__imConnectWrapped || ids.includes('channels'), `${order}: 缺频道`)
          if (installed.has('T')) assert.ok(ids.includes('schedule'), `${order}: 缺定时`)
          assert.equal(new Set(ids).size, ids.length)
          if (installed.has('I') && ids.includes('channels')) {
            const channel = contributions.find(tab => tab.id === 'channels').render({})
            assert.ok(findNode(channel, node => node.type === 'im-channel-rail'), `${order}: 频道贡献无法渲染`)
            if (entry.component.__dshAutomationWrapped) {
              const shell = createShellHarness()
              const props = { tabRegistry: registry, renderSlot: () => assert.fail('频道不得跨槽渲染') }
              findNode(shell.render(props), node => node.type === 'segmented-tabs').props.onChange('channels')
              assert.ok(findNode(shell.render(props), node => node.type === 'im-channel-rail'), `${order}: 点击频道没有走贡献组件`)
            }
          }
          if (installed.has('T')) {
            assert.equal(contributions.find(tab => tab.id === 'schedule').render({}).type, 'schedule-list', `${order}: 定时贡献无法渲染`)
          }
        }
        for (const p of order) {
          if (p === 'A') archive = h.add(-0.5)
          if (p === 'C') { h.setCodex(true); codex = h.add(-1) }
          if (p === 'I' || p === 'T') disposers.set(p, start(p))
          installed.add(p)
          if (delayed) { await h.settle(); for (let i = 0; i < 21; i++) h.tick(); await h.settle(); check() }
        }
        await h.settle(); check()
        // 超出启动重试窗口后再热卸载、启用，不能依赖启动计时器才能接入。
        for (const p of order.filter(p => p === 'I' || p === 'T')) {
          disposers.get(p)(); installed.delete(p)
          await h.settle(); check()
          for (let i = 0; i < 21; i++) h.tick()
          disposers.set(p, start(p)); installed.add(p)
          await h.settle(); check()
        }
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
