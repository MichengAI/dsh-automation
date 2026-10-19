import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTOMATION_CREATE_TASK_EVENT,
  AUTOMATION_CREATE_TASK_STORAGE_KEY,
  clearAutomationCreateTaskRequest,
  readAutomationCreateTaskRequest,
  requestAutomationCreateTask,
} from '../src/client/create-task-request.js'

test('新建定时任务请求可在设置弹窗挂载前后读取并清理', () => {
  const values = new Map<string, string>()
  const storage = {
    getItem(key: string) { return values.get(key) ?? null },
    setItem(key: string, value: string) { values.set(key, value) },
    removeItem(key: string) { values.delete(key) },
  } as Storage

  assert.equal(readAutomationCreateTaskRequest(storage), false)
  values.set(AUTOMATION_CREATE_TASK_STORAGE_KEY, '1')
  assert.equal(readAutomationCreateTaskRequest(storage), true)
  clearAutomationCreateTaskRequest(storage)
  assert.equal(readAutomationCreateTaskRequest(storage), false)
})

test('新建定时任务请求同时写入 sessionStorage 并派发事件', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  let storedKey = ''
  let storedValue = ''
  const storage = {
    setItem(key: string, value: string) { storedKey = key; storedValue = value },
  } as Storage
  const fakeWindow = Object.assign(new EventTarget(), { sessionStorage: storage })
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: fakeWindow })
  try {
    let received = 0
    fakeWindow.addEventListener(AUTOMATION_CREATE_TASK_EVENT, () => { received += 1 })
    requestAutomationCreateTask()
    assert.equal(storedKey, AUTOMATION_CREATE_TASK_STORAGE_KEY)
    assert.equal(storedValue, '1')
    assert.equal(received, 1)
  } finally {
    if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window
    else Object.defineProperty(globalThis, 'window', originalWindow)
  }
})
