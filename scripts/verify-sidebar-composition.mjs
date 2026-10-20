// 显式指定 IM 检出目录，执行两仓库真实接入闭包的组合回归；不安装插件或启动宿主。
// 先构建 IM，再在本仓运行 node --import tsx scripts/verify-sidebar-composition.mjs <IM 检出目录>。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
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
const registry = extractBlock(im, '    function openRegisteredSession(', '    function applySessionFilters(', 'IM 注册表', ['function createNativeTabRegistry(', 'function attachNativeTabRegistry(', 'function findNativeTabRegistry('])
const imHelpers = new Function(registry + '; return { openRegisteredSession, createNativeTabRegistry, attachNativeTabRegistry, findNativeTabRegistry };')()
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
            HostThemeProvider: 'host-theme',
            ChannelOfficialView: () => createElement('im-channel-rail'),
            openChannelSettings() {}, openImSettings() {},
          })
          : h.start(autoBody, {
            ...tabs, ...model, createElement,
            hasCodexUiSidebar: () => installed.has('C'),
            createScheduledSessionOpener: (_ctx, _runtime, open) => open,
            ScheduledRecordsView: 'scheduled-records',
            openCreateTask() {},
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
          if (!installed.has('I')) assert.ok(!ids.includes('channels'), `${order}: 未加载 IM 却出现频道页签`)
          if (!installed.has('T')) assert.ok(!ids.includes('schedule'), `${order}: 未加载自动化却出现定时页签`)
          const isChannelNode = node => node.type === 'im-channel-rail' || node.type?.name === 'ChannelOfficialView'
          if (installed.has('I') && ids.includes('channels')) {
            const channel = contributions.find(tab => tab.id === 'channels').render({})
            assert.ok(findNode(channel, isChannelNode), `${order}: 频道贡献无法渲染`)
            if (entry.component.__dshAutomationWrapped) {
              const shell = createShellHarness()
              const props = { tabRegistry: registry, renderSlot: () => assert.fail('频道不得跨槽渲染') }
              findNode(shell.render(props), node => node.type === 'segmented-tabs').props.onChange('channels')
              assert.ok(findNode(shell.render(props), isChannelNode), `${order}: 点击频道没有走贡献组件`)
            }
          }
          if (installed.has('T')) {
            assert.equal(contributions.find(tab => tab.id === 'schedule').render({}).type, 'scheduled-records', `${order}: 定时贡献无法渲染`)
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

// 同时运行双方真实外壳及 effect，覆盖仅检查注册表无法发现的页签状态冲突。
const { createImShellHarness } = await import(pathToFileURL(resolve(process.argv[2], 'tests/sidebar-shell-harness.mjs')).href)
for (const owners of [['automation', 'im'], ['im', 'automation']]) {
  const values = new Map([
    [`dsh-${owners[0] === 'im' ? 'im-connect' : 'automation'}.sidebar-tab`, 'channels'],
    [`dsh-${owners[1] === 'im' ? 'im-connect' : 'automation'}.sidebar-tab`, 'tasks'],
  ])
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  let current = 'normal'
  const useSessions = select => select({ current, byId: { [current]: { retainedBy: { mainView: 1 } } } })
  const create = owner => {
    const registry = owner === 'im' ? imHelpers.createNativeTabRegistry(null) : tabs.createNativeTabRegistry(null)
    const contributions = {
      channels: { id: 'channels', label: '频道', matchSession: id => id.startsWith('im:'), render: () => createElement('channel-view') },
      schedule: { id: 'schedule', label: '定时', matchSession: id => id.startsWith(model.AUTOMATION_SESSION_PREFIX), render: () => createElement('schedule-view') },
    }
    const removers = Object.fromEntries(Object.entries(contributions).map(([id, tab]) => [id, registry.insert(tab)]))
    const listeners = new Set()
    class Button {
      constructor(row) { this.row = row; this.innerText = this.textContent = 'New chat' }
      getAttribute() { return null }
      closest(selector) { return selector === 'button' || this.row ? this : null }
    }
    const shell = owner === 'im'
      ? createImShellHarness(storage, im)
      : createShellHarness({
          window: { localStorage: storage }, Element: Button,
          document: { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) },
        })
    const props = owner === 'im' ? { nativeTabs: registry, useSessions } : { tabRegistry: registry, useSessions }
    const render = () => owner === 'im' ? shell.render(props) : shell.renderWithEffects(props)
    const control = () => findNode(render(), node => node.type === 'segmented-tabs')
    return {
      value: () => control().props.value,
      select: id => { control().props.onChange(id); render() },
      remove: id => removers[id](), restore: id => { removers[id] = registry.insert(contributions[id]) },
      click: row => {
        const button = new Button(row)
        if (owner === 'im') shell.click(button)
        else for (const listener of [...listeners]) listener({ target: button })
      },
    }
  }
  const first = create(owners[0])
  assert.equal(first.value(), 'channels', `${owners}: 旧存储未恢复`)
  first.select('schedule')
  const second = create(owners[1])
  assert.equal(second.value(), 'schedule', `${owners}: 换壳丢失页签`)
  assert.equal(values.get('dsh-native-sidebar.tab'), 'schedule')
  for (const [owner, shell] of [[owners[0], first], [owners[1], second]]) {
    shell.select('schedule')
    current = 'im:channel'
    assert.equal(shell.value(), 'schedule', `${owner}: 频道会话抢页签`)
    shell.click(true)
    assert.equal(shell.value(), 'schedule', `${owner}: 会话行被当作新建控件`)
    shell.click(false)
    assert.equal(shell.value(), 'tasks', `${owner}: 新建控件没有切回任务`)
    const foreign = owner === 'im' ? 'schedule' : 'channels'
    shell.select(foreign)
    shell.remove(foreign)
    assert.equal(shell.value(), 'tasks', `${owner}: 失效页签未回退`)
    shell.restore(foreign)
    assert.equal(shell.value(), foreign, `${owner}: 重新接入未恢复选择`)
  }
}
console.log('双方真实外壳状态回归通过：2 种接管顺序，覆盖旧值迁移、换壳恢复、会话跟随、新建识别及贡献注销/重接入')
