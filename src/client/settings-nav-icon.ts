import React from 'react'

/**
 * 设置页导航图标的非侵入式替换。
 *
 * 宿主会用自己的 svg 渲染设置导航图标；插件若直接改写宿主 svg 的 outerHTML，
 * 会与宿主/皮肤的内容级图标规则互相覆盖。这里改为插入独立的宿主时钟图标，
 * 只通过 marker 属性隐藏宿主 svg，卸载时可以完整还原。
 */
export const SETTINGS_NAV_ICON_MARKER = 'data-dsh-schedule-nav'
const SETTINGS_NAV_ROW_SELECTOR = '[role="dialog"] nav button'

/** 原生 settings.section.icon 插槽图标组件 */
export function AutomationNavIcon({ size = 16 }: { size?: number }): React.ReactElement {
  return React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 16 16',
      width: size,
      height: size,
      fill: 'currentColor',
    },
    React.createElement('path', {
      d: 'M8 1.15A6.85 6.85 0 1 0 8 14.85 6.85 6.85 0 0 0 8 1.15Zm0 1.4a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9Z',
    }),
    React.createElement('path', {
      d: 'M8.62 4.35H7.28v4.2l3.02 1.78.67-1.13-2.35-1.39V4.35Z',
    }),
  )
}

function wantedLabels(labels: () => readonly string[]): Set<string> {
  return new Set(labels().map(item => item.trim()).filter(item => item !== ''))
}

/**
 * 100% 对齐 dshmarket：用纯属性标记控制 ::before 伪元素渲染图标。
 * 不修改任何 DOM 节点，避免移动端列表项排版下与文字重叠冲突。
 */
export function applySettingsNavIcon(button: HTMLButtonElement, labels: () => readonly string[], _markup?: () => string): boolean {
  const text = (button.textContent ?? '').replace(/\s+/g, ' ').trim()
  const isOwn = wantedLabels(labels).has(text)
  if (isOwn) {
    // 只认宿主插槽容器（span[class*=navIcon]）。老宿主把 navIcon 类挂在宿主自己的
    // <svg> 上（菜单行 = [<svg class="…navIcon">, <span class="…navLabel">]），
    // 用宽判据 [class*=navIcon] 会把原生图标误判成插槽容器，于是永远不写 marker，
    // 时钟图标退回宿主默认齿轮。
    const hasSlotIcon = Boolean(button.querySelector?.('span[class*="navIcon"]'))
    if (hasSlotIcon) {
      if (button.hasAttribute(SETTINGS_NAV_ICON_MARKER)) {
        button.removeAttribute(SETTINGS_NAV_ICON_MARKER)
        return true
      }
      return false
    }
    if (button.getAttribute(SETTINGS_NAV_ICON_MARKER) === '') return false
    button.setAttribute(SETTINGS_NAV_ICON_MARKER, '')
    return true
  }
  if (button.hasAttribute(SETTINGS_NAV_ICON_MARKER)) {
    button.removeAttribute(SETTINGS_NAV_ICON_MARKER)
    return true
  }
  return false
}

/**
 * 还原导航按钮：移除 marker，宿主 svg 恢复显示。
 */
export function restoreSettingsNavIcon(button: HTMLButtonElement): boolean {
  if (!button.hasAttribute(SETTINGS_NAV_ICON_MARKER)) return false
  button.removeAttribute(SETTINGS_NAV_ICON_MARKER)
  return true
}

/**
 * 安装设置导航图标补丁；返回卸载函数。
 *
 * 通过 MutationObserver 覆盖设置弹窗异步挂载、语言切换和宿主重渲染的场景。
 */
export function installSettingsNavIcon(labels: () => readonly string[], markup?: () => string): () => void {
  const decorated = new Set<HTMLButtonElement>()
  const applyButton = (button: HTMLButtonElement): void => {
    if (applySettingsNavIcon(button, labels, markup)) decorated.add(button)
  }
  const scan = (root: ParentNode): void => {
    if (root instanceof HTMLButtonElement) {
      if (root.matches(SETTINGS_NAV_ROW_SELECTOR)) applyButton(root)
      return
    }
    for (const button of root.querySelectorAll?.(SETTINGS_NAV_ROW_SELECTOR) ?? []) {
      applyButton(button as HTMLButtonElement)
    }
  }
  scan(document)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement
      const owner = target?.closest(SETTINGS_NAV_ROW_SELECTOR)
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
