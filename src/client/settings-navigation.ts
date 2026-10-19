type SettingsButton = {
  readonly textContent: string | null
  readonly getAttribute: (name: string) => string | null
  click(): void
}

function normalizedText(button: Pick<SettingsButton, 'textContent'>): string {
  return (button.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function pickSettingsSectionButton<T extends Pick<SettingsButton, 'textContent'>>(
  buttons: readonly T[],
  labels: readonly string[],
): T | undefined {
  for (const label of labels) {
    const target = label.trim()
    if (target === '') continue
    const match = buttons.find(button => normalizedText(button) === target)
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

export const SETTINGS_CODEX_TRIGGER_SELECTOR = '[data-dcu-settings-trigger]'
export const SETTINGS_CODEX_PAGE_SELECTOR = '[data-dcu-settings-page]'
export const SETTINGS_OPEN_SECTION_EVENT = 'dcu-settings-open-section'

function requestCodexSettingsSection(labels: readonly string[]): boolean {
  const trigger = document.querySelector<HTMLButtonElement>(SETTINGS_CODEX_TRIGGER_SELECTOR)
  if (trigger === null) return false
  const request = new CustomEvent(SETTINGS_OPEN_SECTION_EVENT, {
    detail: { labels: [...labels] },
    cancelable: true,
  })
  return !trigger.dispatchEvent(request)
}

/** 已展开的设置菜单项（账号菜单里的「设置」），或当前可见的「设置」菜单项。 */
function findSettingsMenuItem(): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('[role="menu"] button')]
    .find((button) => {
      const text = normalizedText(button)
      return text.startsWith('设置') || /^Settings(\s|$)/i.test(text)
    })
}

/** 账号菜单入口；设置入口在宿主里藏在这个菜单里，而不是 aria-haspopup=dialog。 */
function findAccountMenuTrigger(): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="menu"]')]
    .find((button) => {
      const text = `${button.getAttribute('aria-label') ?? ''} ${button.textContent ?? ''}`
      return /账号|账户|account|user/i.test(text)
    })
}

/**
 * 设置分区按钮：先查官方弹窗/Codex 设置页，再回退到任何 nav。
 * 新版桌面设置是普通 div 面板，不是 role=dialog，因此不能只认弹窗选择器。
 */
function findSettingsSectionButton(labels: readonly string[]): HTMLButtonElement | undefined {
  const scoped = [
    ...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] nav button'),
    ...document.querySelectorAll<HTMLButtonElement>(`${SETTINGS_CODEX_PAGE_SELECTOR} nav button`),
  ]
  const scopedTarget = pickSettingsSectionButton(scoped, labels)
  if (scopedTarget !== undefined) return scopedTarget
  return pickSettingsSectionButton(
    [...document.querySelectorAll<HTMLButtonElement>('nav button')],
    labels,
  )
}

/** 新版桌面没有可点的设置启动按钮，Ctrl+Alt+, 是宿主自己的设置快捷键。 */
function dispatchSettingsShortcut(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: ',',
    code: 'Comma',
    ctrlKey: true,
    altKey: true,
    bubbles: true,
    cancelable: true,
  }))
}

/** 打开 Codex 设置页或官方设置弹窗，并选择定时任务分区。 */
export function openSettingsSection(
  labels: readonly string[],
  onSelected?: () => void,
  onMissing?: () => void,
): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    onMissing?.()
    return
  }
  if (requestCodexSettingsSection(labels)) {
    onSelected?.()
    return
  }

  cancelPendingNavigation?.()
  let frame: number | undefined
  let finished = false
  let menuClicked = false
  let pageClicked = false
  let launcherClicked = false
  let accountClicked = false
  let shortcutSent = false

  const cleanup = (): void => {
    if (finished) return
    finished = true
    observer.disconnect()
    window.clearTimeout(timeout)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    if (cancelPendingNavigation === cleanup) cancelPendingNavigation = undefined
  }
  const select = (): boolean => {
    const target = findSettingsSectionButton(labels)
    if (target === undefined) return false
    cleanup()
    target.click()
    onSelected?.()
    return true
  }
  const openSurface = (): void => {
    // 账号菜单已经展开：直接点「设置」。
    const menuItem = findSettingsMenuItem()
    if (menuItem !== undefined) {
      if (menuClicked) return
      menuClicked = true
      menuItem.click()
      return
    }
    const pageTrigger = document.querySelector<HTMLButtonElement>(SETTINGS_CODEX_TRIGGER_SELECTOR)
    if (pageTrigger !== null) {
      if (pageClicked) return
      pageClicked = true
      pageTrigger.click()
      return
    }
    // 只接受真正叫「设置」的 dialog 启动按钮，避免误点专家/PUA 等弹窗。
    const launchers = [...document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="dialog"]')]
      .filter(button => /设置|settings/i.test(`${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`))
    const launcher = pickSettingsLauncher(launchers)
    if (launcher !== undefined) {
      if (launcherClicked) return
      launcherClicked = true
      launcher.click()
      return
    }
    const account = findAccountMenuTrigger()
    if (account !== undefined) {
      if (accountClicked) return
      accountClicked = true
      account.click()
      return
    }
    if (shortcutSent) return
    shortcutSent = true
    dispatchSettingsShortcut()
  }
  const schedule = (): void => {
    if (finished || frame !== undefined) return
    frame = window.requestAnimationFrame(() => {
      frame = undefined
      if (select()) return
      openSurface()
    })
  }
  const observer = new MutationObserver(() => { schedule() })
  const timeout = window.setTimeout(() => {
    if (select()) return
    cleanup()
    onMissing?.()
  }, 3_000)
  observer.observe(document.body, { childList: true, subtree: true })
  cancelPendingNavigation = cleanup
  // 首次点击同步发生：宿主在同一个事件循环里就能展开菜单/设置页。
  if (!select()) openSurface()
  schedule()
}
