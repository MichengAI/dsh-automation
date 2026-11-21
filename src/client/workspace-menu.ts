import { hostIconMarkup } from './host-icon-markup.js'
import { IconCheckOutline, IconListPenOutline, IconSettingsOutline } from './host-icons.js'

/**
 * 官方工作区 … 菜单没有 slot，只有写死的「重命名 / 删除工作区」。
 * 记录视图的合成任务组需要「任务设置」，因此像归档插件一样监听菜单节点并注入。
 * 真实工作区不处理；只为合成任务组提供任务设置入口。
 */

export interface WorkspaceTaskSettingsTarget {
  readonly id: string
  readonly name: string
  readonly sessionIds: readonly string[]
}

export interface TaskSettingsMenuInjectorOptions {
  /** 菜单打开时才取文案，避免插件 apply 阶段语言尚未就绪时固化英文。 */
  readonly label: string | (() => string)
  readonly resolveTask: (workspaceId: string) => WorkspaceTaskSettingsTarget | undefined
  readonly openTaskSettings: (request: { automationId: string; name: string; sessionIds: string[] }) => void
}

const ITEM_ATTRIBUTE = 'data-dsh-automation-task-settings'
const WORKSPACE_ROW_SELECTOR = '[data-row-key^="workspace:"]'
const MENU_SELECTOR = '[role="menu"]'
const MENU_ITEM_SELECTOR = 'button[role="menuitem"]'
let settingsIconMarkup: string | undefined
let taskGroupIconMarkup: string | undefined
let checkIconMarkup: string | undefined
function settingsIcon(): string {
  return settingsIconMarkup ??= hostIconMarkup(IconSettingsOutline)
}
function taskGroupIcon(): string {
  return taskGroupIconMarkup ??= hostIconMarkup(IconListPenOutline)
}
function checkIcon(): string {
  return checkIconMarkup ??= hostIconMarkup(IconCheckOutline)
}

function hideOtherItems(
  menu: HTMLElement,
  ours: HTMLButtonElement,
  hiddenItems: Map<HTMLElement, { display: string; ariaHidden: string | null }>,
): void {
  const hideElement = (el: HTMLElement | null | undefined): void => {
    if (!el || typeof el.getAttribute !== 'function') return
    if (!hiddenItems.has(el)) {
      hiddenItems.set(el, { display: el.style.display || '', ariaHidden: el.getAttribute('aria-hidden') })
    }
    el.style.display = 'none'
    el.setAttribute('aria-hidden', 'true')
  }

  for (const item of menu.querySelectorAll<HTMLButtonElement>(MENU_ITEM_SELECTOR)) {
    if (item === ours) continue
    hideElement(item)
    const wrapper = item.parentElement
    if (wrapper !== null && wrapper !== menu && wrapper.parentElement === menu && !wrapper.contains(ours)) {
      hideElement(wrapper)
    }
  }

  for (const sep of menu.querySelectorAll<HTMLElement>('[role="separator"], hr, [class*="separator"], [class*="divider"]')) {
    hideElement(sep)
  }
}

/**
 * 替换菜单项内的图标与文案，兼容各种带有嵌套包装、CSS Module 类名或纯结构节点的宿主 DOM。
 */
export function replaceMenuItemContent(
  button: HTMLElement,
  templateText: string,
  label: string,
  icon?: string,
): void {
  const iconContainer = (button.querySelector<HTMLElement>('[class*="itemIcon"], [class*="Icon"]') ?? button.firstElementChild) as HTMLElement | null | undefined
  const isInsideIcon = (el: Element): boolean => Boolean(iconContainer && typeof iconContainer.contains === 'function' && iconContainer.contains(el))
  const labelContainer = (button.querySelector<HTMLElement>('[class*="itemLabel"], [class*="Label"]')
    ?? [...button.querySelectorAll<HTMLElement>('span, div')].find((el) => el !== iconContainer && !isInsideIcon(el) && (el.textContent ?? '').trim() === templateText)
    ?? (button.children.length > 1 ? button.children[1] : null)
    ?? button.lastElementChild) as HTMLElement | null | undefined

  if (iconContainer && icon !== undefined) {
    iconContainer.innerHTML = icon
  }
  if (labelContainer && labelContainer !== iconContainer) {
    labelContainer.textContent = label
  } else {
    const directChildren = [...button.children] as HTMLElement[]
    const firstChild = directChildren[0]
    const secondChild = directChildren[1]
    if (firstChild !== undefined && secondChild !== undefined) {
      if (icon !== undefined) firstChild.innerHTML = icon
      secondChild.textContent = label
    } else {
      button.textContent = label
    }
  }
}

/**
 * 安装工作区菜单注入器。
 * @param options 菜单文案、分组解析和打开任务设置的回调。
 * @returns 卸载函数。
 */
export function installTaskSettingsMenuInjector(options: TaskSettingsMenuInjectorOptions): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => undefined
  let workspaceId: string | undefined
  let rememberedAt = 0
  let frame: number | undefined
  const hiddenItems = new Map<HTMLElement, { display: string; ariaHidden: string | null }>()

  const rememberWorkspace = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : undefined
    if (target === undefined) return
    const row = target.closest<HTMLElement>(WORKSPACE_ROW_SELECTOR)
    if (row !== null) {
      const key = row.getAttribute('data-row-key') ?? ''
      workspaceId = key.slice('workspace:'.length)
      rememberedAt = performance.now()
      return
    }
    // 点会话行菜单时清掉上一次的工作区，避免把任务设置注入到会话菜单。
    if (target.closest(MENU_SELECTOR) === null) workspaceId = undefined
  }

  const closeMenu = (): void => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  }

  const inject = (menu: HTMLElement, task: WorkspaceTaskSettingsTarget): void => {
    const existing = menu.querySelector<HTMLButtonElement>(`[${ITEM_ATTRIBUTE}="true"]`)
    if (existing !== null) {
      hideOtherItems(menu, existing, hiddenItems)
      return
    }
    const items = [...menu.querySelectorAll<HTMLButtonElement>(MENU_ITEM_SELECTOR)]
    const [first] = items
    if (first === undefined) return
    // 只处理工作区分组菜单，避免键盘打开会话菜单时沿用上一次工作区。
    const menuText = items.map(item => item.textContent ?? '').join(' ')
    if (!/(删除工作区|Delete workspace)/i.test(menuText)) return
    // 优先克隆官方「重命名」，不要克隆归档插件可能处于 disabled 状态的注入项。
    const template = items.find(item => /^(重命名|Rename)$/i.test((item.textContent ?? '').trim()))
      ?? items.find(item => !item.disabled && !/(danger|删除|Delete)/i.test(item.textContent ?? ''))
      ?? first
    const wrapper = template.parentElement
    if (wrapper === null || wrapper === menu || wrapper.parentElement === null) return
    const clone = wrapper.cloneNode(true) as HTMLElement
    const button = clone.querySelector<HTMLButtonElement>(MENU_ITEM_SELECTOR)
    if (button === null) return
    clone.removeAttribute('data-dsham-archive-workspace')
    button.removeAttribute('data-dsham-archive-workspace')
    button.removeAttribute('aria-disabled')
    button.removeAttribute('disabled')
    button.removeAttribute('aria-keyshortcuts')
    button.removeAttribute('aria-describedby')
    button.disabled = false
    button.style.display = ''
    button.removeAttribute('aria-hidden')
    button.style.opacity = ''
    button.style.cursor = ''
    button.setAttribute(ITEM_ATTRIBUTE, 'true')
    button.classList.remove('danger')
    for (const extra of button.querySelectorAll('[class*="check"], [class*="shortcut"]')) extra.remove()
    const label = typeof options.label === 'function' ? options.label() : options.label
    replaceMenuItemContent(button, (template.textContent ?? '').trim(), label, settingsIcon())
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
      const request = {
        automationId: task.id,
        name: task.name,
        sessionIds: [...task.sessionIds],
      }
      // 菜单关闭后再打开设置，避免同一次点击被设置弹窗当成外部点击立刻关掉。
      window.setTimeout(() => {
        try {
          options.openTaskSettings(request)
        } catch (error: unknown) {
          console.warn('[dsh-automation] open task settings from workspace menu failed', error)
        }
      }, 0)
    })
    wrapper.parentElement?.insertBefore(clone, wrapper)
    hideOtherItems(menu, button, hiddenItems)
  }

  const scan = (): void => {
    frame = undefined
    if (workspaceId === undefined || performance.now() - rememberedAt > 2_000) return
    const task = options.resolveTask(workspaceId)
    if (task === undefined) return
    for (const menu of document.querySelectorAll<HTMLElement>(MENU_SELECTOR)) inject(menu, task)
  }

  const schedule = (): void => {
    if (frame !== undefined) return
    frame = window.requestAnimationFrame(scan)
  }

  document.addEventListener('pointerdown', rememberWorkspace, true)
  document.addEventListener('click', rememberWorkspace, true)
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => {
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    observer.disconnect()
    document.removeEventListener('pointerdown', rememberWorkspace, true)
    document.removeEventListener('click', rememberWorkspace, true)
    for (const item of document.querySelectorAll(`[${ITEM_ATTRIBUTE}="true"]`)) item.parentElement?.remove()
    for (const [item, original] of hiddenItems) {
      item.style.display = original.display
      if (original.ariaHidden === null) item.removeAttribute('aria-hidden')
      else item.setAttribute('aria-hidden', original.ariaHidden)
    }
  }
}

export interface TaskGroupOptionOptions {
  readonly label: string
  readonly groupLabel: string
  readonly workspaceLabel: string
  readonly checked: boolean
  readonly onSelect: () => void
}

const GROUP_TASK_ATTRIBUTE = 'data-dsh-automation-group-task'

/**
 * 在官方视图选项菜单里注入第四个分组选项「按任务」。
 * 官方菜单只有工作区/工作区树/平铺，没有新增模式的 slot，因此用 DOM 注入。
 */
export function installTaskGroupOption(options: TaskGroupOptionOptions): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => undefined
  let frame: number | undefined

  const closeMenu = (): void => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  }

  const inject = (menu: HTMLElement): void => {
    const text = menu.textContent ?? ''
    if (options.groupLabel === '' || options.workspaceLabel === ''
      || !text.includes(options.groupLabel) || !text.includes(options.workspaceLabel)) return
    if (menu.querySelector(`[${GROUP_TASK_ATTRIBUTE}="true"]`) !== null) return
    const items = [...menu.querySelectorAll<HTMLButtonElement>(MENU_ITEM_SELECTOR)]
    const [first] = items
    if (first === undefined) return
    const wrapper = first.parentElement
    if (wrapper === null || wrapper === menu || wrapper.parentElement === null) return
    const clone = wrapper.cloneNode(true) as HTMLElement
    const button = clone.querySelector<HTMLButtonElement>(MENU_ITEM_SELECTOR)
    if (button === null) return
    button.setAttribute(GROUP_TASK_ATTRIBUTE, 'true')
    button.removeAttribute('aria-disabled')
    button.removeAttribute('disabled')
    button.removeAttribute('aria-keyshortcuts')
    button.removeAttribute('aria-describedby')
    button.disabled = false
    button.classList.remove('danger')
    for (const svg of button.querySelectorAll(':scope > svg')) svg.remove()
    for (const check of button.querySelectorAll('[class*="check"], svg[class*="check"]')) check.remove()
    replaceMenuItemContent(button, (first.textContent ?? '').trim(), options.label, taskGroupIcon())
    if (options.checked) {
      const check = document.createElement('span')
      check.innerHTML = checkIcon()
      const svg = check.firstElementChild
      if (svg !== null) {
        if (svg instanceof SVGElement) svg.style.marginLeft = 'auto'
        button.append(svg)
      }
    }
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
      window.setTimeout(options.onSelect, 0)
    })
    wrapper.parentElement?.insertBefore(clone, wrapper)
  }

  const scan = (): void => {
    frame = undefined
    for (const menu of document.querySelectorAll<HTMLElement>(MENU_SELECTOR)) inject(menu)
  }

  const schedule = (): void => {
    if (frame !== undefined) return
    frame = window.requestAnimationFrame(scan)
  }

  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => {
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    observer.disconnect()
    for (const item of document.querySelectorAll(`[${GROUP_TASK_ATTRIBUTE}="true"]`)) item.parentElement?.remove()
  }
}
