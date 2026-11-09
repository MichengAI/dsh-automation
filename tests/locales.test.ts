import assert from 'node:assert/strict'
import { access, readdir, readFile } from 'node:fs/promises'
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

test('周几分隔符与相对时间双重近似校验', () => {
  // CJK 用顿号，西文用逗号+空格
  for (const code of ['zh', 'ja'] as const) {
    assert.equal(ALL_LOCALES[code]['schedule.weekdaySeparator'], '、', `[${code}] 需使用顿号`)
  }
  for (const code of ['en', 'de', 'es', 'fr', 'pt', 'ru'] as const) {
    assert.equal(ALL_LOCALES[code]['schedule.weekdaySeparator'], ', ', `[${code}] 需使用逗号+空格`)
  }

  // history.nextApprox 与 time.withinDay 组合不能出现双重近似词（如 about about / 约 约 / environ environ 等）
  for (const code of LANG_CODES) {
    const nextApprox = ALL_LOCALES[code]['history.nextApprox']
    const within = ALL_LOCALES[code]['time.withinDay'].replace('{count}', '3')
    const combined = nextApprox.replace('{when}', within)

    assert.doesNotMatch(combined, /about\s+about/i, `[${code}] 出现 about about 重复`)
    assert.doesNotMatch(combined, /约\s*约/, `[${code}] 出现 约 约 重复`)
    assert.doesNotMatch(combined, /etwa\s+etwa/i, `[${code}] 出现 etwa etwa 重复`)
    assert.doesNotMatch(combined, /environ\s+environ/i, `[${code}] 出现 environ environ 重复`)
    assert.doesNotMatch(combined, /cerca\s+de\s+em\s+cerca/i, `[${code}] 出现 cerca de cerca 重复`)
    assert.doesNotMatch(combined, /примерно.*примерно/i, `[${code}] 出现 примерно примерно 重复`)
  }
})

test('客户端注册用的语言映射与 8 门具名词典一一对应', () => {
  assert.deepEqual(Object.keys(LOCALE_DICTIONARIES).sort(), [...LANG_CODES].sort())
  for (const code of LANG_CODES) {
    assert.equal(LOCALE_DICTIONARIES[code], ALL_LOCALES[code], `[${code}] 注册映射必须引用同一份词典`)
  }
})

test('locale/*.json 8 语元数据齐备且格式合法，指向的文件真实存在', async () => {
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

    // 验证 detail 指向的文件必须真实存在于根目录
    const detailUrl = new URL(`../${parsed.meta.detail}`, import.meta.url)
    await assert.doesNotReject(access(detailUrl), `[${fileName}] meta.detail 指向的文件不存在: ${parsed.meta.detail}`)
  }
})

test('package.json 清单资源契约与文件列表', async () => {
  const pkgRaw = await readFile(new URL('../package.json', import.meta.url), 'utf8')
  const pkg = JSON.parse(pkgRaw) as {
    icon?: string
    exports?: Record<string, string>
    files?: string[]
  }

  // 1. icon 存在性
  assert.ok(pkg.icon, 'package.json 必须声明 icon')
  await assert.doesNotReject(access(new URL(`../${pkg.icon}`, import.meta.url)), `icon 文件不存在: ${pkg.icon}`)

  // 2. exports["./icon"] 存在性
  assert.ok(pkg.exports?.['./icon'], 'package.json exports 缺少 ./icon')
  await assert.doesNotReject(access(new URL(`../${pkg.exports['./icon']}`, import.meta.url)), `exports["./icon"] 文件不存在`)

  // 3. files 不得包含不存在的 docs
  assert.ok(!pkg.files?.includes('docs'), 'files 包含不存在的 docs 目录')
})
