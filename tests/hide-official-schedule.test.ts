import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyHideOfficialScheduleStyle,
  BUNDLE_KEY,
  HIDE_OFFICIAL_SCHEDULE_STYLE_TAG,
  hideOfficialScheduleCss,
  resolveOfficialScheduleLabels,
} from '../src/client/bundle-config.tsx'

/**
 * 宿主 `@deepseek-ai/dsh-client-ui-schedule` 的 `schedule.manager` 词典里 `panel` 词条的 8 语取值，
 * 侧栏行的 aria-label 就是这个值。清单写死在用例里当契约哨兵：宿主改译文时这里先红。
 */
const HOST_PANEL_LABELS = [
  '自动化任务',
  'Automation tasks',
  '自動化タスク',
  'Tareas de automatización',
  "Tâches d'automatisation",
  'Automatisierungsaufgaben',
  'Задачи автоматизации',
  'Tarefas de automação',
]

test('屏蔽官方入口的规则覆盖宿主 8 语面板标签，且同时作用于 nav 侧栏容器与取消固定后的更多菜单', () => {
  const css = hideOfficialScheduleCss()
  for (const label of HOST_PANEL_LABELS) {
    assert.ok(css.includes(`nav button[aria-label="${label}"]`), `缺少 nav 语言标签: ${label}`)
    assert.ok(css.includes(`[role="menuitem"][aria-label="${label}"]`), `缺少 menuitem 语言标签: ${label}`)
  }
  assert.equal(css.match(/nav button\[aria-label=/g)?.length, HOST_PANEL_LABELS.length)
  assert.equal(css.match(/\[role="menuitem"\]\[aria-label=/g)?.length, HOST_PANEL_LABELS.length)
  assert.match(css, /display: none !important/)
})

test('传入的标签清单去空白、去重并转义属性值', () => {
  const css = hideOfficialScheduleCss(['自動化タスク', '  ', 'Quote"Label', 'Back\\slash', 'Line\nBreak', '自動化タスク'])
  assert.equal(css.match(/aria-label="Quote\\"Label"/g)?.length, 2)
  assert.equal(css.match(/aria-label="Back\\\\slash"/g)?.length, 2)
  // 换行符被安全替换为空格
  assert.equal(css.match(/aria-label="Line Break"/g)?.length, 2)
  // 重复标签只出现一次，空白项被丢弃
  assert.equal(css.match(/aria-label="自動化タスク"/g)?.length, 2)
  assert.equal(css.match(/nav button\[aria-label=/g)?.length, 4)
  assert.equal(css.match(/\[role="menuitem"\]\[aria-label=/g)?.length, 4)
})

test('标签列表为空或全为空白时返回空字符串', () => {
  assert.equal(hideOfficialScheduleCss([]), '')
  assert.equal(hideOfficialScheduleCss(['   ', '']), '')
})

test('语言切换后原地更新同一张样式表，关闭与销毁时移除', () => {
  const originalDocument = (globalThis as { document?: unknown }).document
  const created: Array<{ dataset: Record<string, string>; textContent: string; removed: boolean; remove(): void }> = []
  let current: (typeof created)[number] | null = null
  const head = {
    appendChild(element: (typeof created)[number]) {
      current = element
      created.push(element)
    },
  }
  ;(globalThis as { document?: unknown }).document = {
    querySelector: (selector: string) =>
      selector.includes(HIDE_OFFICIAL_SCHEDULE_STYLE_TAG) ? current : null,
    createElement: () => {
      const element = {
        dataset: {} as Record<string, string>,
        textContent: '',
        removed: false,
        remove() {
          this.removed = true
          if (current === this) current = null
        },
      }
      return element
    },
    head,
    documentElement: head,
  }

  try {
    applyHideOfficialScheduleStyle(true, [' erste Sprache '])
    assert.equal(created.length, 1)
    const style = created[0]!
    assert.equal(style.dataset.plugin, BUNDLE_KEY)
    assert.equal(style.dataset.pluginCss, HIDE_OFFICIAL_SCHEDULE_STYLE_TAG)
    assert.match(style.textContent, /aria-label="erste Sprache"/)

    applyHideOfficialScheduleStyle(true, ['zweite Sprache'])
    assert.equal(created.length, 1, '已有样式表时不能重复插入')
    assert.match(style.textContent, /aria-label="zweite Sprache"/)
    assert.doesNotMatch(style.textContent, /erste Sprache/)

    applyHideOfficialScheduleStyle(false)
    assert.equal(style.removed, true)
    assert.equal(current, null)
  } finally {
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document
    } else {
      (globalThis as { document?: unknown }).document = originalDocument
    }
  }
})

test('词条缺失回退裸键名 panel 或带命名空间键名时，生产守卫阻断其写入选择器', () => {
  // 模拟宿主词条缺失回退裸 panel
  const mockBindRaw = (ns: string) => (key: string) => {
    if (ns === 'schedule.manager' && key === 'panel') return 'panel'
    return ''
  }
  const labels1 = resolveOfficialScheduleLabels({ locale: { bind: mockBindRaw } })
  assert.equal(labels1.includes('panel'), false, '裸 panel 键名必须被阻断，不得写入')
  const css1 = hideOfficialScheduleCss(labels1)
  assert.equal(css1.includes('aria-label="panel"'), false)

  // 模拟宿主词条缺失回退 schedule.manager:panel
  const mockBindNs = (ns: string) => (key: string) => {
    if (ns === 'schedule.manager' && key === 'panel') return 'schedule.manager:panel'
    return ''
  }
  const labels2 = resolveOfficialScheduleLabels({ locale: { bind: mockBindNs } })
  assert.equal(labels2.includes('schedule.manager:panel'), false, '带命名空间的键名必须被阻断')
  const css2 = hideOfficialScheduleCss(labels2)
  assert.equal(css2.includes('aria-label="schedule.manager:panel"'), false)
})

test('宿主 bind 为类方法且依赖 this 时，必须正确保留上下文并取得标签', () => {
  class HostLocaleClass {
    private readonly boundMap = new Map<string, (key: string) => string>()
    bind(ns: string) {
      if (!this.boundMap.has(ns)) {
        this.boundMap.set(ns, (key: string) => (key === 'panel' ? 'Geplante Aufgaben' : key))
      }
      return this.boundMap.get(ns)!
    }
  }

  const ctx = { locale: new HostLocaleClass() }
  const labels = resolveOfficialScheduleLabels(ctx)
  assert.ok(labels.includes('Geplante Aufgaben'), '必须正确调用类方法并取得运行时标签')
})
