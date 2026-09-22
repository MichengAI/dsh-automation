import assert from 'node:assert/strict'
import test from 'node:test'
import { pickHostExport, pickHostIcon } from '../src/client/host-icon-resolve.ts'

const modern = () => null
const legacy = () => null

test('0.1.7 图标名优先于带尺寸的旧导出名', () => {
  assert.equal(pickHostIcon({
    IconEllipsisOutlineRegular: modern,
    IconEllipsisOutline16: legacy,
  }, 'IconEllipsisOutlineRegular', 'IconEllipsisOutline16'), modern)
})

test('旧宿主没有 Regular 导出名时回退尺寸后缀', () => {
  assert.equal(pickHostIcon({
    IconEllipsisOutline16: legacy,
  }, 'IconEllipsisOutlineRegular', 'IconEllipsisOutline16'), legacy)
})

test('旧宿主没有官方组件时不拿 undefined 去渲染', () => {
  assert.equal(pickHostExport({}, 'Button'), undefined)
  assert.equal(typeof pickHostExport({ Button: modern }, 'Button'), 'function')
})

test('两个导出名都不存在时不把 undefined 交给 React', () => {
  const icon = pickHostIcon({}, 'IconEllipsisOutlineRegular', 'IconEllipsisOutline16')
  assert.equal(typeof icon, 'function')
  assert.equal(icon({}), null)
})
