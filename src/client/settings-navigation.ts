type SettingsButton = {
  readonly textContent: string | null
  readonly getAttribute: (name: string) => string | null
  click(): void
}

export function pickSettingsSectionButton<T extends Pick<SettingsButton, 'textContent'>>(
  buttons: readonly T[],
  labels: readonly string[],
): T | undefined {
  for (const label of labels) {
    const target = label.trim()
    if (target === '') continue
    const match = buttons.find(button => button.textContent?.replace(/\s+/g, ' ').trim() === target)
    if (match !== undefined) return match
  }
  return undefined
}

export function pickSettingsLauncher<T extends Pick<SettingsButton, 'textContent' | 'getAttribute'>>(
  buttons: readonly T[],
): T | undefined {
  const named = buttons.find((button) => {
    const label = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`.trim()
    return /(^|\s)(设置|settings)(\s|$)/i.test(label)
  })
  return named ?? (buttons.length === 1 ? buttons[0] : undefined)
}

let cancelPendingNavigation: (() => void) | undefined

/** 打开宿主设置弹窗并选择定时任务分区；宿主提供公开 section API 后可集中替换。 */
export function openSettingsSection(
  labels: readonly string[],
  onSelected?: () => void,
  onMissing?: () => void,
): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    onMissing?.()
    return
  }
  const launchers = [...document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="dialog"]')]
  const launcher = pickSettingsLauncher(launchers)
  const dialogOpen = document.querySelector('[role="dialog"]') !== null
  if (!dialogOpen && launcher === undefined) {
    onMissing?.()
    return
  }

  cancelPendingNavigation?.()
  if (!dialogOpen) launcher?.click()
  let frame: number | undefined
  let finished = false
  const observer = new MutationObserver(() => { schedule() })
  const cleanup = (): void => {
    if (finished) return
    finished = true
    observer.disconnect()
    window.clearTimeout(timeout)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    if (cancelPendingNavigation === cleanup) cancelPendingNavigation = undefined
  }
  const select = (): boolean => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] nav button')]
    const target = pickSettingsSectionButton(buttons, labels)
    if (target === undefined) return false
    cleanup()
    target.click()
    onSelected?.()
    return true
  }
  const schedule = (): void => {
    if (finished || frame !== undefined) return
    frame = window.requestAnimationFrame(() => { frame = undefined; select() })
  }
  const timeout = window.setTimeout(() => {
    if (select()) return
    cleanup()
    onMissing?.()
  }, 1_500)
  observer.observe(document.body, { childList: true, subtree: true })
  cancelPendingNavigation = cleanup
  schedule()
}
