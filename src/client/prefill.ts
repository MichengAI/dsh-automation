/** 设置页「通过对话创建」交给会话输入框的待填草稿。 */

import { probeService } from './workspace-create.js'

let pending: string | null = null
const listeners = new Set<(text: string | null) => void>()

export function setChatPrefill(text: string): void {
  pending = text
  for (const listener of [...listeners]) listener(pending)
}

export function takeChatPrefill(): string | null {
  const value = pending
  pending = null
  return value
}

export function peekChatPrefill(): string | null {
  return pending
}

export function subscribeChatPrefill(listener: (text: string | null) => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function dispatchInputEvents(el: HTMLElement): void {
  try {
    if (typeof InputEvent !== 'undefined') {
      el.dispatchEvent(new InputEvent('input', { bubbles: true }))
    } else if (typeof Event !== 'undefined') {
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
  } catch {}
  try {
    if (typeof Event !== 'undefined') {
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
  } catch {}
}

export function applyPrefillToDom(text: string): boolean {
  if (typeof document === 'undefined') return false

  // 1. 优先检测 DSH Lexical / contenteditable 富文本输入区
  const editable =
    document.querySelector<HTMLElement>('[data-composer-seat] [contenteditable="true"]') ??
    document.querySelector<HTMLElement>('[data-composer-card] [contenteditable="true"]') ??
    document.querySelector<HTMLElement>('.dsh-composer [contenteditable="true"]') ??
    document.querySelector<HTMLElement>('[contenteditable="true"]:not([aria-label*="提示词"]):not(.agt-prompt)')

  if (editable) {
    editable.focus()
    try {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(editable)
      selection?.removeAllRanges()
      selection?.addRange(range)
      document.execCommand('insertText', false, text)
    } catch {
      editable.textContent = text
      dispatchInputEvents(editable)
    }
    return true
  }

  // 2. 检测原生 textarea 输入区
  const seat =
    document.querySelector('[data-composer-seat] textarea') ??
    document.querySelector('[data-composer-card] textarea') ??
    document.querySelector('.dsh-composer textarea') ??
    document.querySelector('[data-chat-input] textarea') ??
    document.querySelector('textarea:not(.aag-textarea):not(.agt-prompt)') ??
    document.querySelector('textarea')

  if (
    (typeof HTMLTextAreaElement !== 'undefined' && seat instanceof HTMLTextAreaElement) ||
    (seat !== null && typeof seat === 'object' && 'value' in seat && typeof (seat as unknown as HTMLElement).focus === 'function')
  ) {
    const el = seat as unknown as HTMLElement & { value: string; selectionStart?: number; selectionEnd?: number }
    el.focus()
    const descriptor = typeof HTMLTextAreaElement !== 'undefined'
      ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
      : undefined
    if (descriptor?.set) {
      descriptor.set.call(el, text)
    } else {
      el.value = text
    }
    dispatchInputEvents(el)
    try {
      el.selectionStart = el.selectionEnd = text.length
    } catch {}
    return true
  }

  return false
}

export function createPanelCloseSettings(ctx: unknown, ownerProps?: { close?: () => void }): () => void {
  return () => {
    if (typeof ownerProps?.close === 'function') {
      try {
        ownerProps.close()
      } catch {}
      return
    }
    const layout = probeService(ctx, 'layout') as { selectPanel?: (id: string | null) => void } | undefined
    if (typeof layout?.selectPanel === 'function') {
      try {
        layout.selectPanel(null)
      } catch {}
    }
  }
}

export function triggerChatCreation(text: string, closeSettings?: () => void): void {
  setChatPrefill(text)

  // 1. 如果传入了关闭/退出回调（例如关闭设置页弹窗或 layout.selectPanel(null)），直接执行
  if (typeof closeSettings === 'function') {
    try {
      closeSettings()
    } catch {}
  }

  if (typeof document !== 'undefined') {
    // 2. 查找 Codex UI 设置页返回按钮 (button.dcu-settings-back)
    const codexBackBtn = document.querySelector<HTMLElement>(
      'button.dcu-settings-back, [data-dcu-settings-page] .dcu-settings-back',
    )
    if (codexBackBtn) {
      try {
        codexBackBtn.click()
      } catch {}
    }

    // 3. 查找常规对话框关闭按钮
    const closeBtn = document.querySelector<HTMLElement>(
      '[role="dialog"] button[aria-label*="关闭"], [role="dialog"] button[aria-label*="Close"], [role="dialog"] [data-modal-close], [role="dialog"] .dsh-modal-close',
    )
    if (closeBtn) {
      try {
        closeBtn.click()
      } catch {}
    }

    // 4. 派发 Escape 键盘事件，让可能阻挡的弹窗或设置页关闭
    try {
      if (typeof KeyboardEvent !== 'undefined') {
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            bubbles: true,
            cancelable: true,
          }),
        )
      }
    } catch {}

    // 5. 点击侧栏会话以激活主聊天视图
    const sessionItem = document.querySelector<HTMLElement>(
      '[data-session-id], .dsh-session-item, [role="tab"][aria-label*="会话"], [role="tab"][aria-label*="Chat"]',
    )
    if (sessionItem) {
      try {
        sessionItem.click()
      } catch {}
    }
  }

  // 6. 梯次重试填入并聚焦输入框（30ms, 120ms, 300ms, 600ms）
  if (typeof setTimeout !== 'undefined') {
    const tryApply = (): void => {
      if (applyPrefillToDom(text)) {
        takeChatPrefill()
      }
    }
    setTimeout(tryApply, 30)
    setTimeout(tryApply, 120)
    setTimeout(tryApply, 300)
    setTimeout(tryApply, 600)
  }
}
