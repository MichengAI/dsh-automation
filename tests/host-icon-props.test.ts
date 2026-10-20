import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

const CLIENT_DIR = new URL('../src/client/', import.meta.url)

/**
 * 宿主图标组件只解构 `size` / `className` / `strokeWidth`，
 * 其余 props（尤其是 `style`）会被静默丢弃，样式必须在样式表里表达。
 */
async function clientSources(): Promise<{ file: string; source: string }[]> {
  const names = (await readdir(CLIENT_DIR)).filter(name => /\.(ts|tsx)$/.test(name) && name !== 'locales.ts')
  return Promise.all(names.map(async (name) => ({
    file: name,
    source: await readFile(new URL(name, CLIENT_DIR), 'utf8'),
  })))
}

/** 找出把 style 传给 host-icons 导出组件的调用点。 */
export function styleThroughHostIcon(file: string, source: string): string[] {
  const imported = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/host-icons\.js'/g)]
    .flatMap(match => (match[1] ?? '').split(','))
    .map(name => name.trim())
    .filter(name => name.startsWith('Icon'))
  const offenders: string[] = []
  for (const name of imported) {
    const jsx = new RegExp(`<${name}\\b[^>]*?\\bstyle=`, 's')
    const factory = new RegExp(`createElement\\(${name}\\s*,\\s*\\{[^}]*?\\bstyle:`, 's')
    if (jsx.test(source) || factory.test(source)) offenders.push(`${file}: ${name}`)
  }
  return offenders
}

test('调用宿主图标时不传 style：宿主图标只转发 className', async () => {
  const offenders = (await clientSources()).flatMap(({ file, source }) => styleThroughHostIcon(file, source))
  assert.deepEqual(offenders, [], `宿主图标会丢弃 style，请改用样式表：\n${offenders.join('\n')}`)
})

test('检测逻辑能识别旧的 style 传参写法', () => {
  const jsx = [
    "import { IconChevronDownOutline } from './host-icons.js'",
    '<IconChevronDownOutline',
    '  className="dsh-st-menu-select-arrow"',
    '  size={12}',
    "  style={{ transform: 'rotate(180deg)' }}",
    '/>',
  ].join('\n')
  assert.deepEqual(styleThroughHostIcon('sort-menu.tsx', jsx), ['sort-menu.tsx: IconChevronDownOutline'])
  const factory = [
    "import { IconChevronDownOutline } from './host-icons.js'",
    "React.createElement(IconChevronDownOutline, { className: 'arrow', size: 12, style: { marginLeft: 4 } })",
  ].join('\n')
  assert.deepEqual(styleThroughHostIcon('menu-select.tsx', factory), ['menu-select.tsx: IconChevronDownOutline'])
  const clean = [
    "import { IconChevronDownOutline } from './host-icons.js'",
    '<IconChevronDownOutline className="dsh-st-menu-select-arrow" size={12} />',
  ].join('\n')
  assert.deepEqual(styleThroughHostIcon('ok.tsx', clean), [])
})

test('下拉箭头旋转由 .is-open 样式表规则驱动', async () => {
  const css = await readFile(new URL('../src/client/styles.ts', import.meta.url), 'utf8')
  assert.match(css, /\.dsh-st-menu-select-arrow\{[^}]*transition:transform/)
  assert.match(css, /\.dsh-st-menu-select-trigger\.is-open \.dsh-st-menu-select-arrow\{transform:rotate\(180deg\)\}/)
})
