import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const path = `${dir}/${name}`
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path))
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) found.push(path)
  }
  return found
}

test('源码不再引入 antd', () => {
  const root = fileURLToPath(new URL('../src', import.meta.url))
  const files = sourceFiles(root)
  assert.ok(files.length > 0, '必须扫到源码')
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    assert.doesNotMatch(text, /from ["']antd/, `${file} 仍引入 antd`)
    assert.doesNotMatch(text, /antd\/es\//, `${file} 仍引用 antd/es`)
    assert.doesNotMatch(text, /ant-btn|ant-select|ant-tabs|ant-modal|ant-input|ant-collapse|--ant-btn/, `${file} 仍保留 ant 类名或变量`)
  }
})
