// 运行真实外壳组件，控制 Hook 状态和快照；不替代浏览器或宿主集成验收。
import { readFileSync } from 'node:fs'
import { createElement, Component, Fragment } from 'react'
import ts from 'typescript'
import * as model from '../src/client/schedule-rail-model.ts'
import * as recordsStore from '../src/client/records-view-store.ts'

export function createShellHarness() {
  const state = []
  let cursor = 0
  const react = {
    Component, Fragment, createElement,
    useState(initial) {
      const index = cursor++
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next }]
    },
    useRef: value => ({ current: value }),
    useMemo: calculate => calculate(),
    useCallback: callback => callback,
    useEffect() {},
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  }
  const source = readFileSync(new URL('../src/client/ScheduleRail.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, jsxFactory: 'createElement', target: ts.ScriptTarget.ES2022 },
  }).outputText
  const modules = {
    react,
    '@deepseek-ai/dsh-client-ui-primitives': { SegmentedTabs: 'segmented-tabs' },
    './schedule-rail-model.js': model,
    './records-view-store.js': recordsStore,
    './workspace-menu.js': { installTaskGroupOption: () => () => undefined },
    './host-icons.js': { IconClockOutline: 'clock-icon', IconFolderClose: 'folder-icon' },
    './schedule-overview.js': { SCHEDULE_VIEW_PANEL_ID: 'schedule-panel', ScheduleViewSwitch: 'view-switch', ScheduleOverview: 'overview' },
  }
  const exports = {}
  new Function('require', 'exports', code)(name => {
    if (!(name in modules)) throw new Error(`外壳测试尚未声明依赖：${name}`)
    return modules[name]
  }, exports)
  const snapshot = { phase: 'ready', snapshot: { automations: [], runs: [] } }
  return {
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
