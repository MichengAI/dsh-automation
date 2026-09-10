import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { en, zh } from '../src/client/locales.ts'

test('设置标题旁提供仓库和反馈 GitHub 链接', async () => {
  const source = await readFile(new URL('../src/client/AutomationView.tsx', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client/styles.ts', import.meta.url), 'utf8')

  assert.match(source, /className="dsh-st-heading-row"/)
  assert.match(source, /href="https:\/\/github\.com\/MichengAI\/dsh-automation"/)
  assert.match(source, /href="https:\/\/github\.com\/MichengAI\/dsh-automation\/issues"/)
  assert.match(source, /IconListPenOutline16/)
  assert.match(source, /target="_blank"/)
  assert.match(source, /rel="noreferrer"/)
  assert.match(styles, /\.dsh-st-heading-links\{display:inline-flex;align-items:center;gap:4px/)
  assert.match(styles, /\.dsh-st-heading-link\{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:0 8px/)
  assert.match(styles, /\.dsh-st-heading-link svg\{flex:none\}/)
  assert.equal(en['header.githubProject'], 'GitHub')
  assert.equal(en['header.githubFeedback'], 'Issues')
  assert.equal(zh['header.githubFeedback'], '问题反馈')
})
