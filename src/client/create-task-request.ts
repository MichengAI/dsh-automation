/**
 * 记录视图的“新建”按钮与设置里的新建任务弹窗之间的跨组件请求。
 * 宿主 WorkspaceBrowser 没有创建定时任务的 slot，因此沿用任务设置的事件桥。
 */

export const AUTOMATION_CREATE_TASK_EVENT = 'dsh-automation:create-task'
export const AUTOMATION_CREATE_TASK_STORAGE_KEY = 'dsh-automation:pending-create-task'

export function requestAutomationCreateTask(): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.setItem(AUTOMATION_CREATE_TASK_STORAGE_KEY, '1') } catch { /* unavailable storage */ }
  window.dispatchEvent(new Event(AUTOMATION_CREATE_TASK_EVENT))
}

export function readAutomationCreateTaskRequest(storage: Storage | undefined): boolean {
  if (storage === undefined) return false
  try { return storage.getItem(AUTOMATION_CREATE_TASK_STORAGE_KEY) === '1' } catch { return false }
}

export function clearAutomationCreateTaskRequest(storage: Storage | undefined): void {
  try { storage?.removeItem(AUTOMATION_CREATE_TASK_STORAGE_KEY) } catch { /* unavailable storage */ }
}
