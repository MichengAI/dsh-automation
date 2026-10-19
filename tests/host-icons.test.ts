import assert from 'node:assert/strict'
import test from 'node:test'
import { pickHostIcon } from '../src/client/host-icon-resolve.ts'

test('只认 0.2 的 Regular 导出名，不回退带尺寸的旧名字', () => {
  const modern = () => null
  const legacy = () => null
  assert.equal(pickHostIcon({
    IconEllipsisOutlineRegular: modern,
    IconEllipsisOutline16: legacy,
  }, 'IconEllipsisOutlineRegular'), modern)
  assert.throws(() => pickHostIcon({
    IconEllipsisOutline16: legacy,
  }, 'IconEllipsisOutlineRegular'), /Missing host icon export/)
})

test('导出名不存在时直接报错，不返回空图标', () => {
  assert.throws(() => pickHostIcon({}, 'IconEllipsisOutlineRegular'), /Missing host icon export/)
})
