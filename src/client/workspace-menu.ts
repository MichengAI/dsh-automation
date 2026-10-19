/**
 * 官方工作区 … 菜单没有 slot，只有写死的「重命名 / 删除工作区」。
 * 记录视图的合成任务组需要「任务设置」，因此像归档插件一样监听菜单节点并注入。
 * 真实工作区不处理，归档全部会话仍由归档插件注入。
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
const SETTINGS_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke-width="1.2" stroke="currentColor"><path d="M8 9.75012C8.9665 9.75012 9.75 8.96662 9.75 8.00012C9.75 7.03362 8.9665 6.25012 8 6.25012C7.0335 6.25012 6.25 7.03362 6.25 8.00012C6.25 8.96662 7.0335 9.75012 8 9.75012Z"/><path d="M13.0107 7.79377C12.9505 7.89401 12.9205 7.94413 12.9205 7.99951C12.9205 8.0549 12.9505 8.10502 13.0106 8.20528L13.9849 9.83006C14.045 9.93029 14.0751 9.9804 14.0751 10.0358C14.0751 10.0911 14.045 10.1413 13.9849 10.2415L13.0037 11.8777C12.9468 11.9726 12.9184 12.0201 12.8725 12.0461C12.8267 12.072 12.7713 12.072 12.6607 12.072H10.6704C10.5598 12.072 10.5045 12.072 10.4586 12.098C10.4128 12.1239 10.3843 12.1714 10.3274 12.2662L9.33825 13.9142C9.28133 14.009 9.25287 14.0564 9.20703 14.0823C9.16118 14.1083 9.10588 14.1083 8.99529 14.1083H7.00486C6.89426 14.1083 6.83896 14.1083 6.79312 14.0823C6.74727 14.0564 6.71881 14.009 6.6619 13.9142L5.67273 12.2662C5.61581 12.1714 5.58735 12.1239 5.54151 12.098C5.49566 12.072 5.44036 12.072 5.32977 12.072H3.33945C3.2288 12.072 3.17347 12.072 3.12761 12.0461C3.08176 12.0201 3.0533 11.9726 2.9964 11.8777L2.0152 10.2415C1.9551 10.1413 1.92505 10.0911 1.92505 10.0358C1.92505 9.9804 1.9551 9.93029 2.0152 9.83006L2.98951 8.20528C3.04963 8.10502 3.07969 8.0549 3.07969 7.99951C3.07968 7.94413 3.04961 7.89401 2.98946 7.79377L2.01529 6.17011C1.95514 6.06987 1.92507 6.01975 1.92507 5.96437C1.92506 5.90899 1.95512 5.85886 2.01524 5.7586L2.9964 4.1224C3.0533 4.0275 3.08176 3.98005 3.12761 3.95408C3.17347 3.92811 3.2288 3.92811 3.33945 3.92811H5.32977C5.44036 3.92811 5.49566 3.92811 5.54151 3.90216C5.58735 3.87621 5.61581 3.82879 5.67273 3.73397L6.6619 2.08599C6.71881 1.99116 6.74727 1.94375 6.79312 1.9178C6.83896 1.89185 6.89426 1.89185 7.00486 1.89185H8.99529C9.10588 1.89185 9.16118 1.89185 9.20703 1.9178C9.25287 1.94375 9.28133 1.99116 9.33825 2.08599L10.3274 3.73397C10.3843 3.82879 10.4128 3.87621 10.4586 3.90216C10.5045 3.92811 10.5598 3.92811 10.6704 3.92811H12.6607C12.7713 3.92811 12.8267 3.92811 12.8725 3.95408C12.9184 3.98005 12.9468 4.0275 13.0037 4.1224L13.9849 5.7586C14.045 5.85886 14.0751 5.90899 14.0751 5.96437C14.0751 6.01975 14.045 6.06987 13.9849 6.17011L13.0107 7.79377Z" stroke-miterlimit="10"/></svg>'

function hideOtherItems(menu: HTMLElement, ours: HTMLButtonElement): void {
  for (const item of menu.querySelectorAll<HTMLButtonElement>(MENU_ITEM_SELECTOR)) {
    if (item === ours) continue
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
      hideOtherItems(menu, existing)
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
    if (wrapper === null) return
    const clone = wrapper.cloneNode(true) as HTMLElement
    const button = clone.querySelector<HTMLButtonElement>(MENU_ITEM_SELECTOR)
    if (button === null) return
    clone.removeAttribute('data-dsham-archive-workspace')
    button.removeAttribute('data-dsham-archive-workspace')
    button.removeAttribute('aria-disabled')
    button.removeAttribute('disabled')
    button.disabled = false
    button.style.opacity = ''
    button.style.cursor = ''
    button.setAttribute(ITEM_ATTRIBUTE, 'true')
    button.classList.remove('danger')
    const label = typeof options.label === 'function' ? options.label() : options.label
    const spans = button.querySelectorAll('span')
    if (spans[0] !== undefined) spans[0].innerHTML = SETTINGS_ICON
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
    hideOtherItems(menu, button)
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
const TASK_GROUP_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h10M3 8h10M3 12h6"/></svg>'
const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5 6 11.5 13 4.5"/></svg>'

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
    if (wrapper === null) return
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
    if (spans[0] !== undefined) spans[0].innerHTML = TASK_GROUP_ICON
    if (spans[1] !== undefined) spans[1].textContent = options.label
    else button.textContent = options.label
    if (options.checked) {
      const check = document.createElement('span')
      check.innerHTML = CHECK_ICON
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
