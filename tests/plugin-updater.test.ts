import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { handlePluginUpdateEscape, manualPluginUpdateCommand } from '../src/client/plugin-update-ui.ts'
import { isDshCliEntry, isNewerVersion, isTrustedUpdateRequest, PLUGIN_UPDATE_HEADER } from '../src/plugin-updater.ts'

test('定时任务独立更新只接受同源专用请求', () => {
  assert.equal(isNewerVersion('0.1.32', '0.1.33'), true)
  assert.equal(isNewerVersion('0.1.32', '0.1.32'), false)
  assert.equal(isNewerVersion('0.1.0-rc.2', '0.1.0-rc.10'), true)
  assert.equal(isNewerVersion('0.1.0-rc.10', '0.1.0-rc.2'), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', origin: 'http://localhost:3000', host: 'localhost:3000' }, socket: { remoteAddress: '127.0.0.1' } }), true)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', host: 'localhost:3000' }, socket: { remoteAddress: '127.0.0.1' } }), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', origin: 'http://localhost:3000', host: 'localhost:3000' }, socket: { remoteAddress: '172.16.0.5' } }), false)
  assert.equal(manualPluginUpdateCommand('web', '@michengai/dsh-automation', '0.1.33'), 'dsh plugin --profile web add @michengai/dsh-automation@0.1.33 --registry=https://registry.npmjs.org/')
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: '@deepseek-ai/dsh', bin: { dsh: 'lib/bin.js' } }, 'C:/tools/dsh'), true)
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: '@deepseek-ai/dsh', bin: { dsh: 'lib/other.js' } }, 'C:/tools/dsh'), false)
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: 'other-cli', bin: { dsh: 'lib/bin.js' } }, 'C:/tools/dsh'), false)
})

test('定时更新弹窗消费 ESC，避免继续关闭底层设置页', () => {
  const calls: string[] = []
  assert.equal(handlePluginUpdateEscape({
    key: 'Escape',
    preventDefault: () => { calls.push('prevent') },
    stopPropagation: () => { calls.push('stop') },
    stopImmediatePropagation: () => { calls.push('stopImmediate') },
  }, () => { calls.push('close') }), true)
  assert.deepEqual(calls, ['prevent', 'stop', 'stopImmediate', 'close'])
})

test('定时任务客户端与 Host 绑定自身更新入口', async () => {
  const client = await readFile(new URL('../src/client/index.ts', import.meta.url), 'utf8')
  const updateUi = await readFile(new URL('../src/client/plugin-update-ui.ts', import.meta.url), 'utf8')
  const host = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    dsh?: { client?: { inject?: string[] } }
  }
  assert.match(client, /packageName: '@michengai\/dsh-automation'/)
  assert.match(client, /titleRowSelector: '\.dsh-st-heading-row'/)
  assert.match(client, /createIcon: createPluginUpdateIcon/)
  assert.match(client, /UPDATE_ICON_PATHS/)
  assert.match(client, /document\.createElementNS\('http:\/\/www\.w3\.org\/2000\/svg', 'svg'\)/)
  assert.doesNotMatch(client, /react-dom\/client/)
  assert.ok(manifest.dsh?.client?.inject?.includes('@deepseek-ai/dsh-client-ui-primitives'))
  assert.match(updateUi, /data-mpi-label/)
  assert.match(updateUi, /overlay\.addEventListener\('keydown'/)
  assert.match(updateUi, /<header class="mpi-head"><h2><\/h2><button type="button" class="mpi-dialog-close" data-action="close"><\/button><\/header>/)
  assert.match(updateUi, /<footer class="mpi-actions"><div class="mpi-actions-group">/)
  assert.match(updateUi, /background:var\(--dsw-alias-bg-layer-2/)
  assert.match(updateUi, /box-shadow:var\(--dsw-shadow-lv3/)
  assert.match(updateUi, /border-radius:14px/)
  assert.match(updateUi, /if \(version\.textContent !== versionLabel\)/)
  assert.match(updateUi, /else if \(payload\.latestCheckFailed\)/)
  assert.match(host, /endpoint: '\/api\/michengai\/dsh-automation\/update'/)
  assert.match(await readFile(new URL('../src/plugin-updater.ts', import.meta.url), 'utf8'), /const notifyParent = target\.desktopPnpm === undefined && typeof process\.send === 'function'/)
  assert.match(await readFile(new URL('../src/plugin-updater.ts', import.meta.url), 'utf8'), /isDshCliEntry/)
})
