import assert from 'node:assert/strict'
import test from 'node:test'
import { pickSettingsLauncher, pickSettingsSectionButton } from '../src/client/settings-navigation.js'

function button(text: string, aria = '') {
  return {
    textContent: text,
    getAttribute(name: string) { return name === 'aria-label' ? aria : null },
    click() {},
  }
}

test('设置分区按本地化可访问名称精确选择', () => {
  const general = button('通用设置')
  const scheduled = button('定时任务')
  assert.equal(pickSettingsSectionButton([general, scheduled], ['Scheduled tasks', '定时任务']), scheduled)
})

test('设置入口优先匹配设置名称，单入口时允许兼容回退', () => {
  const help = button('帮助', '帮助')
  const settings = button('设置', '')
  assert.equal(pickSettingsLauncher([help, settings]), settings)
  assert.equal(pickSettingsLauncher([help]), help)
  assert.equal(pickSettingsLauncher([help, button('关于')]), undefined)
})
