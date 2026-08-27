import type { AutomationRunViewModel, AutomationViewModel } from './protocol.js'

export const AUTOMATION_TASK_SETTINGS_EVENT = 'dsh-automation:open-task-settings'
export const AUTOMATION_TASK_SETTINGS_STORAGE_KEY = 'dsh-automation:pending-task-settings'

export type AutomationTaskSettingsRequest = {
  automationId?: string
  name: string
  sessionIds: string[]
}

export function parseAutomationTaskSettingsRequest(value: unknown): AutomationTaskSettingsRequest | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as { automationId?: unknown; name?: unknown; sessionIds?: unknown }
  if (typeof record.name !== 'string' || record.name.trim() === '' || !Array.isArray(record.sessionIds) || record.sessionIds.some(id => typeof id !== 'string')) return undefined
  if (record.automationId !== undefined && (typeof record.automationId !== 'string' || record.automationId.trim() === '')) return undefined
  return {
    ...(typeof record.automationId === 'string' ? { automationId: record.automationId } : {}),
    name: record.name,
    sessionIds: [...record.sessionIds],
  }
}

export function writeAutomationTaskSettingsRequest(storage: Storage | undefined, request: AutomationTaskSettingsRequest): void {
  try { storage?.setItem(AUTOMATION_TASK_SETTINGS_STORAGE_KEY, JSON.stringify(request)) } catch { /* unavailable storage */ }
}

export function requestAutomationTaskSettings(request: AutomationTaskSettingsRequest): void {
  if (typeof window === 'undefined') return
  writeAutomationTaskSettingsRequest(window.sessionStorage, request)
  window.dispatchEvent(new CustomEvent(AUTOMATION_TASK_SETTINGS_EVENT, { detail: request }))
}

export function readAutomationTaskSettingsRequest(storage: Storage | undefined): AutomationTaskSettingsRequest | undefined {
  if (storage === undefined) return undefined
  try {
    const raw = storage.getItem(AUTOMATION_TASK_SETTINGS_STORAGE_KEY)
    return raw === null ? undefined : parseAutomationTaskSettingsRequest(JSON.parse(raw))
  } catch {
    return undefined
  }
}

export function clearAutomationTaskSettingsRequest(storage: Storage | undefined): void {
  try { storage?.removeItem(AUTOMATION_TASK_SETTINGS_STORAGE_KEY) } catch { /* unavailable storage */ }
}

export function resolveAutomationTaskSettings(
  request: AutomationTaskSettingsRequest,
  automations: readonly AutomationViewModel[],
  runs: readonly AutomationRunViewModel[],
): AutomationViewModel | undefined {
  if (request.automationId !== undefined) {
    const exact = automations.find(item => item.id === request.automationId)
    if (exact !== undefined) return exact
  }
  const sessionIds = new Set(request.sessionIds)
  const automationId = runs.find(run => run.sessionId !== undefined && sessionIds.has(run.sessionId))?.automationId
  const mapped = automations.find(item => item.id === automationId)
  if (mapped !== undefined) return mapped
  const named = automations.filter(item => item.name === request.name)
  return named.length === 1 ? named[0] : undefined
}
