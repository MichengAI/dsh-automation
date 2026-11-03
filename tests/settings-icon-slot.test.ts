import assert from 'node:assert/strict'
import test from 'node:test'
import { createSettingsNavIconSlot } from '../src/client/settings-icon-slot.js'

/** 统计注册/注销次数的最小桩，register 返回值可控。 */
function createHarness(options: { enabled?: () => boolean; register?: () => unknown } = {}) {
  const calls = { register: 0, dispose: 0, warn: [] as unknown[] }
  let enabled = true
  const controller = createSettingsNavIconSlot({
    isEnabled: options.enabled ?? (() => enabled),
    register: () => {
      calls.register += 1
      if (options.register) return options.register() as any
      return () => { calls.dispose += 1 }
    },
    warn: (reason: unknown) => { calls.warn.push(reason) },
  })
  return {
    calls,
    controller,
    setEnabled(next: boolean) { enabled = next },
  }
}

test('插槽未声明前不注册图标', () => {
  const h = createHarness()
  h.controller.sync()
  h.controller.sync()
  assert.equal(h.calls.register, 0)
})

test('槽位声明后注册一次，重复 sync 不重复注册', () => {
  const h = createHarness()
  h.controller.onInjected()
  assert.equal(h.calls.register, 1)
  h.controller.sync()
  h.controller.sync()
  assert.equal(h.calls.register, 1)
})

test('入口位置切出设置页时注销，切回时重新注册', () => {
  const h = createHarness()
  h.controller.onInjected()
  assert.equal(h.calls.register, 1)

  h.setEnabled(false)
  h.controller.sync()
  assert.equal(h.calls.dispose, 1)

  h.controller.sync()
  assert.equal(h.calls.register, 1, '关闭态下不应重复注册')

  h.setEnabled(true)
  h.controller.sync()
  assert.equal(h.calls.register, 2)
})

test('槽位声明撤销时注销，撤销后的 sync 不再注册', () => {
  const h = createHarness()
  const off = h.controller.onInjected()
  assert.equal(h.calls.register, 1)

  off()
  assert.equal(h.calls.dispose, 1)

  h.controller.sync()
  h.controller.sync()
  assert.equal(h.calls.register, 1)
})

test('注册抛错时只告警，下一次 sync 重试', () => {
  let attempts = 0
  const h = createHarness({
    register: () => {
      attempts += 1
      if (attempts === 1) throw new Error('boom')
      return () => undefined
    },
  })
  h.controller.onInjected()
  assert.equal(h.calls.warn.length, 1)
  assert.equal(h.calls.register, 1)

  h.controller.sync()
  assert.equal(h.calls.register, 2, '失败后必须允许重试')
  assert.equal(h.calls.warn.length, 1)
})

test('宿主 register 不返回注销函数时也不抛错', () => {
  const h = createHarness({ register: () => undefined })
  const off = h.controller.onInjected()
  assert.equal(h.calls.register, 1)

  h.setEnabled(false)
  h.controller.sync()
  h.setEnabled(true)
  h.controller.sync()
  assert.equal(h.calls.register, 2)

  assert.doesNotThrow(() => off())
})
