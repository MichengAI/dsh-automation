/**
 * 设置页导航图标的非侵入式替换。
 *
 * 宿主会用自己的 svg 渲染设置导航图标；插件若直接改写宿主 svg 的 outerHTML，
 * 会与宿主/皮肤的内容级图标规则互相覆盖。这里改为插入独立的 mask 图标，
 * 只通过 marker 属性隐藏宿主 svg，卸载时可以完整还原。
 */
export const SETTINGS_NAV_ICON_CLASS = 'dsh-st-nav-icon-schedule'
export const SETTINGS_NAV_ICON_MARKER = 'data-dsh-schedule-nav'

function wantedLabels(labels: () => readonly string[]): Set<string> {
  return new Set(labels().map(item => item.trim()).filter(item => item !== ''))
}

/**
 * 为目标导航按钮注入 mask 图标。
 *
 * @param button 设置弹窗导航按钮
 * @param labels 返回当前语言下目标分区名称的函数
 * @returns 是否发生了实际变更；重复调用保持幂等
 */
export function applySettingsNavIcon(button: HTMLButtonElement, labels: () => readonly string[]): boolean {
  const text = (button.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!wantedLabels(labels).has(text)) return false
  if (button.querySelector('svg') === null) return false
  if (
    button.getAttribute(SETTINGS_NAV_ICON_MARKER) === '1'
    && button.querySelector(`.${SETTINGS_NAV_ICON_CLASS}`) !== null
  ) return false

  button.setAttribute(SETTINGS_NAV_ICON_MARKER, '1')
  if (button.querySelector(`.${SETTINGS_NAV_ICON_CLASS}`) === null) {
    const icon = document.createElement('span')
    icon.className = SETTINGS_NAV_ICON_CLASS
    icon.setAttribute('aria-hidden', 'true')
    button.prepend(icon)
  }
  return true
}

/**
 * 还原导航按钮：移除 marker 与插件插入的图标，宿主 svg 从未被修改。
 *
 * @returns 是否清理了插件留下的内容
 */
export function restoreSettingsNavIcon(button: HTMLButtonElement): boolean {
  const marked = button.hasAttribute(SETTINGS_NAV_ICON_MARKER)
  const icon = button.querySelector(`.${SETTINGS_NAV_ICON_CLASS}`)
  if (!marked && icon === null) return false
  button.removeAttribute(SETTINGS_NAV_ICON_MARKER)
  icon?.remove()
  return true
}

/**
 * 安装设置导航图标补丁；返回卸载函数。
 *
 * 通过 MutationObserver 覆盖设置弹窗异步挂载、语言切换和宿主重渲染的场景。
 */
export function installSettingsNavIcon(labels: () => readonly string[]): () => void {
  const decorated = new Set<HTMLButtonElement>()
  const applyButton = (button: HTMLButtonElement): void => {
    if (applySettingsNavIcon(button, labels)) decorated.add(button)
  }
  const scan = (root: ParentNode): void => {
    if (root instanceof HTMLButtonElement) applyButton(root)
    for (const button of root.querySelectorAll?.('button') ?? []) applyButton(button as HTMLButtonElement)
  }
  scan(document)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement
      const owner = target?.closest('button')
      if (owner instanceof HTMLButtonElement) applyButton(owner)
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scan(node)
      }
    }
  })
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true })
  return () => {
    observer.disconnect()
    for (const button of decorated) restoreSettingsNavIcon(button)
    decorated.clear()
  }
}
