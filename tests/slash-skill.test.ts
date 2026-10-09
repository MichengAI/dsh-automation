import assert from 'node:assert/strict'
import test from 'node:test'
import { activeSlashQuery, applySlashSkill, filterSlashSkills } from '../src/client/helpers.ts'

const skills = [
  { id: 'web-search', name: '网页搜索' },
  { id: 'daily-briefing', name: '每日早报' },
]

test('输入 / 时召回技能，词中的斜杠不召回', () => {
  assert.deepEqual(activeSlashQuery('/', 1), { start: 0, query: '' })
  assert.deepEqual(activeSlashQuery('请用 /web', 7), { start: 3, query: 'web' })
  assert.equal(activeSlashQuery('http://web', 9), undefined)
  assert.equal(activeSlashQuery('请执行/web', 6), undefined)
  assert.equal(activeSlashQuery('/web-search 继续', 13), undefined)
})

test('召回按名称或 id 过滤，选中后替换正在输入的 /', () => {
  assert.deepEqual(filterSlashSkills(skills, '').map(item => item.id), ['web-search', 'daily-briefing'])
  assert.deepEqual(filterSlashSkills(skills, '早报').map(item => item.id), ['daily-briefing'])
  assert.deepEqual(filterSlashSkills(skills, 'web').map(item => item.id), ['web-search'])
  const applied = applySlashSkill('请用 /web', 7, '/web-search')
  assert.equal(applied.text, '请用 /web-search ')
  assert.equal(applied.caret, '请用 /web-search '.length)
})
