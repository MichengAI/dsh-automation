import assert from 'node:assert/strict'
import test from 'node:test'
import type { AutomationRunViewModel, AutomationViewModel } from '../src/client/protocol.js'
import {
  AUTOMATION_TASK_SETTINGS_EVENT,
  AUTOMATION_TASK_SETTINGS_STORAGE_KEY,
  parseAutomationTaskSettingsRequest,
  requestAutomationTaskSettings,
  resolveAutomationTaskSettings,
  writeAutomationTaskSettingsRequest,
} from '../src/client/task-settings-request.js'

function automation(id: string, name: string): AutomationViewModel {
  return {
    id,
    revision: 1,
    name,
    prompt: name,
    status: 'active',
    schedule: { kind: 'daily', time: '09:00' },
    scheduleSummary: '09:00',
    timeZone: 'Asia/Shanghai',
    permission: 'read-only',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
  }
}

function run(automationId: string, sessionId: string): AutomationRunViewModel {
  return {
    id: `run-${sessionId}`,
    automationId,
    automationName: automationId,
    status: 'succeeded',
    trigger: 'schedule',
    scheduledFor: '2026-08-27T00:00:00.000Z',
    sessionId,
  }
}

test('具体任务设置优先通过执行会话定位 automation id', () => {
  const duplicateA = automation('a', '同名任务')
  const duplicateB = automation('b', '同名任务')
  const resolved = resolveAutomationTaskSettings(
    { name: '同名任务', sessionIds: ['session-b'] },
    [duplicateA, duplicateB],
    [run('b', 'session-b')],
  )
  assert.equal(resolved?.id, 'b')
})

test('原生任务文件夹使用 automation id 精确打开同名任务', () => {
  const duplicateA = automation('a', '同名任务')
  const duplicateB = automation('b', '同名任务')
  const resolved = resolveAutomationTaskSettings(
    { automationId: 'b', name: '同名任务', sessionIds: [] },
    [duplicateA, duplicateB],
    [],
  )
  assert.equal(resolved?.id, 'b')
})

test('任务设置请求可以跨设置弹窗挂载保存', () => {
  let stored = ''
  const storage = { setItem(_key: string, value: string) { stored = value } } as Storage
  writeAutomationTaskSettingsRequest(storage, { automationId: 'weather', name: '天气', sessionIds: ['session-1'] })
  assert.deepEqual(JSON.parse(stored), { automationId: 'weather', name: '天气', sessionIds: ['session-1'] })
})

test('任务设置请求同时写入 sessionStorage 并派发同一份事件详情', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  let storedKey = ''
  let storedValue = ''
  const storage = {
    setItem(key: string, value: string) { storedKey = key; storedValue = value },
  } as Storage
  const fakeWindow = Object.assign(new EventTarget(), { sessionStorage: storage })
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: fakeWindow })
  try {
    const request = { automationId: 'weather', name: '天气', sessionIds: ['session-1'] }
    let received: unknown
    fakeWindow.addEventListener(AUTOMATION_TASK_SETTINGS_EVENT, (event) => {
      received = (event as CustomEvent<unknown>).detail
    })

    requestAutomationTaskSettings(request)

    assert.equal(storedKey, AUTOMATION_TASK_SETTINGS_STORAGE_KEY)
    assert.deepEqual(JSON.parse(storedValue), request)
    assert.deepEqual(received, request)
  } finally {
    if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window
    else Object.defineProperty(globalThis, 'window', originalWindow)
  }
})

test('旧执行记录缺少运行映射时按任务名回退', () => {
  const item = automation('weather', '天气')
  assert.equal(resolveAutomationTaskSettings({ name: '天气', sessionIds: ['legacy'] }, [item], [])?.id, 'weather')
})

test('旧执行记录遇到多个同名任务时安全失败，不打开任意一条', () => {
  const duplicateA = automation('a', '同名任务')
  const duplicateB = automation('b', '同名任务')
  assert.equal(resolveAutomationTaskSettings({ name: '同名任务', sessionIds: ['legacy'] }, [duplicateA, duplicateB], []), undefined)
})

test('拒绝无效的跨插件任务设置请求', () => {
  assert.equal(parseAutomationTaskSettingsRequest({ name: '', sessionIds: [] }), undefined)
  assert.equal(parseAutomationTaskSettingsRequest({ name: '天气', sessionIds: [1] }), undefined)
  assert.equal(parseAutomationTaskSettingsRequest({ automationId: '', name: '天气', sessionIds: [] }), undefined)
})
