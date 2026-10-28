import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyPrefillToDom,
  createPanelCloseSettings,
  peekChatPrefill,
  setChatPrefill,
  subscribeChatPrefill,
  takeChatPrefill,
  triggerChatCreation,
} from '../src/client/prefill.ts'

test('通过对话创建会暂存提示词并只领取一次', () => {
  takeChatPrefill()
  const seen: Array<string | null> = []
  const stop = subscribeChatPrefill(value => { seen.push(value) })
  setChatPrefill('我要创建一个定时任务，每【时间间隔】执行【具体任务】')
  assert.equal(peekChatPrefill()?.includes('时间间隔'), true)
  assert.equal(takeChatPrefill()?.includes('具体任务'), true)
  assert.equal(takeChatPrefill(), null)
  stop()
  assert.equal(seen.at(-1)?.includes('定时任务'), true)
})

test('triggerChatCreation 会触发 closeSettings 回调并暂存提示词', () => {
  takeChatPrefill()
  let closed = false
  triggerChatCreation('通过对话创建测试任务', () => { closed = true })
  assert.equal(closed, true, '必须执行 closeSettings 回调')
  assert.equal(peekChatPrefill(), '通过对话创建测试任务')
  assert.equal(takeChatPrefill(), '通过对话创建测试任务')
})

test('applyPrefillToDom 支持 contenteditable 富文本输入框', () => {
  const originalDoc = globalThis.document
  const originalWindow = globalThis.window

  try {
    let focused = false
    let dispatched: string[] = []
    let insertedText = ''

    const fakeEditable = {
      focus: () => { focused = true },
      dispatchEvent: (e: any) => { dispatched.push(e.type) },
      textContent: '',
    }

    globalThis.document = {
      querySelector: (selector: string) => {
        if (selector.includes('contenteditable="true"')) {
          return fakeEditable
        }
        return null
      },
      execCommand: (command: string, _showUi: boolean, text: string) => {
        if (command === 'insertText') {
          insertedText = text
          fakeEditable.textContent = text
          return true
        }
        return false
      },
      createRange: () => ({ selectNodeContents: () => {} }),
    } as any

    globalThis.window = {
      getSelection: () => ({
        removeAllRanges: () => {},
        addRange: () => {},
      }),
    } as any

    const success = applyPrefillToDom('富文本定时任务提示词')
    assert.equal(success, true)
    assert.equal(focused, true)
    assert.equal(insertedText, '富文本定时任务提示词')
  } finally {
    globalThis.document = originalDoc
    globalThis.window = originalWindow
  }
})

test('applyPrefillToDom 支持 textarea 输入框', () => {
  const originalDoc = globalThis.document

  try {
    let focused = false
    let dispatched: string[] = []
    let value = ''

    const fakeTextarea = {
      tagName: 'TEXTAREA',
      focus: () => { focused = true },
      dispatchEvent: (e: any) => { dispatched.push(e.type) },
      get value() { return value },
      set value(v: string) { value = v },
    }

    globalThis.document = {
      querySelector: (selector: string) => {
        if (selector.includes('contenteditable="true"')) return null
        if (selector.includes('textarea')) return fakeTextarea
        return null
      },
    } as any

    const success = applyPrefillToDom('原生输入框定时任务提示词')
    assert.equal(success, true)
    assert.equal(focused, true)
    assert.equal(value, '原生输入框定时任务提示词')
    assert.ok(dispatched.includes('input'))
  } finally {
    globalThis.document = originalDoc
  }
})

test('createPanelCloseSettings 优先调用 ownerProps.close', () => {
  let ownerClosed = false
  let layoutPanel: string | null = 'not-called'

  const mockCtx = {
    get: (name: string) => {
      if (name === 'layout') return { selectPanel: (id: string | null) => { layoutPanel = id } }
      return undefined
    },
  }

  const closeSettings = createPanelCloseSettings(mockCtx, {
    close: () => { ownerClosed = true },
  })

  closeSettings()
  assert.equal(ownerClosed, true)
  assert.equal(layoutPanel, 'not-called', 'ownerProps.close 存在时不应触发 layout.selectPanel')
})

test('createPanelCloseSettings 在缺少 ownerProps.close 时回退到 layout.selectPanel(null)', () => {
  let layoutPanel: string | null = 'scheduled-tasks'

  const mockCtx = {
    reflect: {
      get: (name: string) => {
        if (name === 'layout') return { selectPanel: (id: string | null) => { layoutPanel = id } }
        return undefined
      },
    },
  }

  const closeSettings = createPanelCloseSettings(mockCtx, {})
  closeSettings()
  assert.equal(layoutPanel, null, '必须将激活的面板重置为 null 以退出主面板并切回对话')
})


