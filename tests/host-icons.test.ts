import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { hostOrFallback, pickHostExport, pickHostIcon, type HostIcon } from '../src/client/host-icon-resolve.ts'

const modern = () => null

test('只认 0.2 的 Regular 导出名，不回退带尺寸的旧名字', () => {
  const modern = () => null
  const legacy = () => null
  assert.equal(pickHostIcon({
    IconEllipsisOutlineRegular: modern,
    IconEllipsisOutline16: legacy,
  }, 'IconEllipsisOutlineRegular'), modern)
  assert.notEqual(pickHostIcon({
    IconEllipsisOutline16: legacy,
  }, 'IconEllipsisOutlineRegular'), legacy)
})

test('旧宿主没有官方组件时不拿 undefined 去渲染', () => {
  assert.equal(pickHostExport({}, 'Button'), undefined)
  assert.equal(typeof pickHostExport({ Button: modern }, 'Button'), 'function')
})

test('宿主图标返回 null 时改用自绘兜底', () => {
  const fallback: HostIcon = () => createElement('span', { 'data-local': '' })
  const native: HostIcon = () => createElement('span', { 'data-host': '' })
  const missing: HostIcon = () => null
  assert.deepEqual((hostOrFallback(missing, fallback)({}) as JSX.Element).props, { 'data-local': '' })
  assert.deepEqual((hostOrFallback(native, fallback)({}) as JSX.Element).props, { 'data-host': '' })
})

test('导出名不存在时不把 undefined 交给 React', () => {
  const icon = pickHostIcon({}, 'IconEllipsisOutlineRegular')
  assert.equal(typeof icon, 'function')
  assert.equal(icon({}), null)
})
