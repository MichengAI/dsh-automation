import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { de, en, es, fr, ja, LOCALE_DICTIONARIES, pt, ru, zh } from '../src/client/locales.ts'

const ALL_LOCALES = {
  zh,
  en,
  ja,
  es,
  fr,
  de,
  ru,
  pt,
} as const

type LangCode = keyof typeof ALL_LOCALES
const LANG_CODES: readonly LangCode[] = ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt']

test('8 门内置语言键集 100% 对应且无空文案', () => {
  const enKeys = Object.keys(en) as Array<keyof typeof en>
  assert.ok(enKeys.length >= 200, `en 词条数过少: ${enKeys.length}`)

  for (const code of LANG_CODES) {
    const dict = ALL_LOCALES[code]
    const keys = Object.keys(dict)
    assert.equal(keys.length, enKeys.length, `[${code}] 键数量 (${keys.length}) 与 en (${enKeys.length}) 不一致`)

    for (const key of enKeys) {
      assert.ok(key in dict, `[${code}] 缺失键: ${key}`)
      const val = dict[key]
      assert.equal(typeof val, 'string', `[${code}][${key}] 值必须是字符串`)
      assert.ok(val.trim().length > 0, `[${code}][${key}] 文案不能为空`)
    }
  }
})

test('8 门内置语言占位符严格与 en 保持一致', () => {
  const extractPlaceholders = (text: string): Set<string> => {
    const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g) ?? []
    return new Set(matches)
  }

  const enKeys = Object.keys(en) as Array<keyof typeof en>
  for (const key of enKeys) {
    const expected = extractPlaceholders(en[key])
    for (const code of LANG_CODES) {
      const actual = extractPlaceholders(ALL_LOCALES[code][key])
      assert.deepEqual(
        actual,
        expected,
        `[${code}][${key}] 占位符不匹配: 期望 ${JSON.stringify([...expected])}, 实际 ${JSON.stringify([...actual])}`,
      )
    }
  }
})

test('非中日语言严格禁止 CJK 残留', () => {
  const cjkRegex = /[\u4e00-\u9fff\u3040-\u30ff]/
  const nonCjkLangs: readonly LangCode[] = ['en', 'es', 'fr', 'de', 'ru', 'pt']

  for (const code of nonCjkLangs) {
    const dict = ALL_LOCALES[code]
    for (const [key, val] of Object.entries(dict)) {
      assert.equal(
        cjkRegex.test(val),
        false,
        `[${code}][${key}] 包含非预期的 CJK 字符: "${val}"`,
      )
    }
  }
})

test('客户端注册用的语言映射与 8 门具名词典一一对应', () => {
  assert.deepEqual(Object.keys(LOCALE_DICTIONARIES).sort(), [...LANG_CODES].sort())
  for (const code of LANG_CODES) {
    assert.equal(LOCALE_DICTIONARIES[code], ALL_LOCALES[code], `[${code}] 注册映射必须引用同一份词典`)
  }
})

test('locale/*.json 8 语元数据齐备且格式合法', async () => {
  const localeFiles = await readdir(new URL('../locale', import.meta.url))
  for (const code of LANG_CODES) {
    const fileName = `${code}.json`
    assert.ok(localeFiles.includes(fileName), `locale/ 缺少元数据文件: ${fileName}`)
    const raw = await readFile(new URL(`../locale/${fileName}`, import.meta.url), 'utf8')
    const parsed = JSON.parse(raw) as { meta?: { title?: string; description?: string; detail?: string } }
    assert.ok(parsed.meta, `[${fileName}] 缺少 meta 节点`)
    assert.equal(parsed.meta.title, 'Automation')
    assert.ok(typeof parsed.meta.description === 'string' && parsed.meta.description.length > 0)
    assert.ok(typeof parsed.meta.detail === 'string' && parsed.meta.detail.endsWith('.md'))
  }
})
