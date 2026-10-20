import { hostIconMarkup } from './host-icon-markup.js'
import { IconArchiveOutline, IconCheckOutline, IconListPenOutline, IconSettingsOutline } from './host-icons.js'

/**
 * 官方工作区 … 菜单没有 slot，只有写死的「重命名 / 删除工作区」。
 * 记录视图的合成任务组需要「任务设置」，因此像归档插件一样监听菜单节点并注入。
 * 真实工作区不处理；合成任务组由记录视图按真实会话 ID 归档。
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
  readonly archive?: {
    readonly label: string
    readonly request: (task: WorkspaceTaskSettingsTarget) => void
  }
}

const ITEM_ATTRIBUTE = 'data-dsh-automation-task-settings'
const ARCHIVE_ITEM_ATTRIBUTE = 'data-dsh-automation-archive-task'
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
  hiddenItems: Map<HTMLButtonElement, { display: string; ariaHidden: string | null }>,
): void {
  for (const item of menu.querySelectorAll<HTMLButtonElement>(MENU_ITEM_SELECTOR)) {
    if (item === ours) continue
    // 归档插件按真实工作区查成员，无法处理合成组；改用本插件传递真实会话 ID 的入口。
    if (!item.hasAttribute('data-dsham-archive-workspace')
      && !/^(重命名|Rename|删除工作区|Delete workspace)$/i.test((item.textContent ?? '').trim())) continue
    if (!hiddenItems.has(item)) hiddenItems.set(item, { display: item.style.display, ariaHidden: item.getAttribute('aria-hidden') })
    item.style.display = 'none'
    item.setAttribute('aria-hidden', 'true')
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
  const hiddenItems = new Map<HTMLButtonElement, { display: string; ariaHidden: string | null }>()

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
    button.disabled = false
    button.style.display = ''
    button.removeAttribute('aria-hidden')
    button.style.opacity = ''
    button.style.cursor = ''
    button.setAttribute(ITEM_ATTRIBUTE, 'true')
    button.classList.remove('danger')
    const label = typeof options.label === 'function' ? options.label() : options.label
    const spans = button.querySelectorAll('span')
    if (spans[0] !== undefined) spans[0].innerHTML = settingsIcon()
    if (spans[1] !== undefined) spans[1].textContent = label
    else button.textContent = label
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
    if (options.archive !== undefined) {
      const archiveClone = clone.cloneNode(true) as HTMLElement
      const archiveButton = archiveClone.querySelector<HTMLButtonElement>(MENU_ITEM_SELECTOR)
      if (archiveButton !== null) {
        archiveButton.removeAttribute(ITEM_ATTRIBUTE)
        archiveButton.setAttribute(ARCHIVE_ITEM_ATTRIBUTE, 'true')
        const archiveSpans = archiveButton.querySelectorAll('span')
        if (archiveSpans[0] !== undefined) archiveSpans[0].innerHTML = hostIconMarkup(IconArchiveOutline)
        if (archiveSpans[1] !== undefined) archiveSpans[1].textContent = options.archive.label
        else archiveButton.textContent = options.archive.label
        archiveButton.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          closeMenu()
          window.setTimeout(() => options.archive?.request(task), 0)
        })
        wrapper.parentElement?.insertBefore(archiveClone, wrapper)
      }
    }
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
    for (const item of document.querySelectorAll(`[${ITEM_ATTRIBUTE}="true"], [${ARCHIVE_ITEM_ATTRIBUTE}="true"]`)) item.parentElement?.remove()
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
    button.disabled = false
    button.classList.remove('danger')
    for (const svg of button.querySelectorAll(':scope > svg')) svg.remove()
    const spans = button.querySelectorAll('span')
    if (spans[0] !== undefined) spans[0].innerHTML = taskGroupIcon()
    if (spans[1] !== undefined) spans[1].textContent = options.label
    else button.textContent = options.label
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
