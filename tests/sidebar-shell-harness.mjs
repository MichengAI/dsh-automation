// 运行真实外壳组件，控制 Hook 状态和快照；不替代浏览器或宿主集成验收。
import { readFileSync } from 'node:fs'
import { createElement, Component, Fragment } from 'react'
import ts from 'typescript'
import * as model from '../src/client/schedule-rail-model.ts'
import * as recordsStore from '../src/client/records-view-store.ts'
import * as nativeTabs from '../src/client/native-tabs.ts'
import * as taskGroupArchive from '../src/client/task-group-archive.ts'

export function createShellHarness(browser = {}) {
  const state = []
  let cursor = 0
  let effects
  let menuOptions
  let dirty = false
  const react = {
    Component, Fragment, createElement,
    useState(initial) {
      const index = cursor++
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial
      return [state[index], next => {
        const value = typeof next === 'function' ? next(state[index]) : next
        if (state[index] !== value) { state[index] = value; dirty = true }
      }]
    },
    useRef(value) {
      const index = cursor++
      if (!(index in state)) state[index] = { current: value }
      return state[index]
    },
    useMemo: calculate => calculate(),
    useCallback: callback => callback,
    useEffect(callback, deps) {
      const index = cursor++
      const old = state[index]
      if (old && deps && deps.length === old.deps?.length && deps.every((value, i) => Object.is(value, old.deps[i]))) return
      effects?.push(() => { old?.cleanup?.(); state[index] = { deps, cleanup: callback() } })
    },
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  }
  const source = readFileSync(new URL('../src/client/ScheduleRail.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, jsxFactory: 'createElement', jsxFragmentFactory: 'Fragment', target: ts.ScriptTarget.ES2022 },
  }).outputText
  const modules = {
    react,
    '@deepseek-ai/dsh-client-ui-primitives': { SegmentedTabs: 'segmented-tabs', Modal: 'modal', Button: 'button' },
    './schedule-rail-model.js': model,
    './records-view-store.js': recordsStore,
    './native-tabs.js': nativeTabs,
    './workspace-menu.js': {
      installTaskGroupOption: () => () => undefined,
      installTaskSettingsMenuInjector: options => { menuOptions = options; return () => {} },
    },
    './task-group-archive.js': taskGroupArchive,
    './host-icons.js': { IconClockOutline: 'clock-icon', IconFolderClose: 'folder-icon', IconQueueOutline: 'queue-icon' },
    './schedule-overview.js': { SCHEDULE_VIEW_PANEL_ID: 'schedule-panel', ScheduleViewSwitch: 'view-switch', ScheduleOverview: 'overview' },
  }
  const exports = {}
  new Function('require', 'exports', 'Fragment', 'window', 'document', 'Element', code)(name => {
    if (!(name in modules)) throw new Error(`外壳测试尚未声明依赖：${name}`)
    return modules[name]
  }, exports, Fragment, browser.window, browser.document, browser.Element)
  const snapshot = { phase: 'ready', snapshot: { automations: [], runs: [] } }
  const defaults = {
    t: key => key,
    runtime: { source: { subscribe: () => () => {}, getSnapshot: () => snapshot } },
  }
  return {
    renderWithEffects(props) {
      for (let attempt = 0; attempt < 10; attempt++) {
        cursor = 0; effects = []; dirty = false
        const tree = exports.NativeScheduleShell({ ...defaults, ...props })
        const pending = effects
        effects = undefined
        for (const effect of pending) effect()
        if (!dirty) return tree
      }
      throw new Error('自动化外壳状态未收敛')
    },
    renderRecords(props) {
      cursor = 0
      menuOptions = undefined
      effects = []
      const result = exports.ScheduledRecordsView({
        t: key => key,
        runtime: { source: { subscribe: () => () => {}, getSnapshot: () => snapshot } },
        ...props,
      })
      const pending = effects
      effects = undefined
      for (const effect of pending) effect()
      return result
    },
    menuOptions: () => menuOptions,
    render(props) {
      cursor = 0
      return exports.NativeScheduleShell({
        t: key => key,
        runtime: { source: { subscribe: () => () => {}, getSnapshot: () => snapshot } },
        ...props,
      })
    },
  }
}

export function findNode(node, predicate) {
  if (node == null || typeof node !== 'object') return undefined
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNode(child, predicate)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (predicate(node)) return node
  return findNode(node.props?.children, predicate)
}
