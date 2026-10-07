import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { handlePluginUpdateEscape, manualPluginUpdateCommand } from '../src/client/plugin-update-model.ts'
import { isDshCliEntry, isNewerVersion, isTrustedUpdateRequest, PLUGIN_UPDATE_HEADER, resolveUpdateRuntime, shouldNotifyParent } from '../src/plugin-updater.ts'

test('定时任务独立更新只接受同源专用请求', () => {
  assert.equal(isNewerVersion('0.1.32', '0.1.33'), true)
  assert.equal(isNewerVersion('0.1.32', '0.1.32'), false)
  assert.equal(isNewerVersion('0.1.0-rc.2', '0.1.0-rc.10'), true)
  assert.equal(isNewerVersion('0.1.0-rc.10', '0.1.0-rc.2'), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', origin: 'http://localhost:3000', host: 'localhost:3000' }, socket: { remoteAddress: '127.0.0.1' } }), true)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', host: '127.0.0.1:19387' }, socket: { remoteAddress: '127.0.0.1' } }), true)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', host: 'example.com' }, socket: { remoteAddress: '127.0.0.1' } }), false)
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
  assert.match(updateUi, /size: 'small', shape: 'default'/)
  assert.match(updateUi, /className: 'mpi-dialog'/)
  assert.match(updateUi, /document\.addEventListener\('keydown', onKey, true\)/)
  assert.match(updateUi, /if \(version\.textContent !== versionLabel\)/)
  assert.match(updateUi, /else if \(payload\.latestCheckFailed\)/)
  assert.match(updateUi, /color: '#e8b15a'/)
  assert.match(updateUi, /manualHintDesktop/)
  assert.match(host, /endpoint: '\/api\/michengai\/dsh-automation\/update'/)
  assert.match(await readFile(new URL('../src/plugin-updater.ts', import.meta.url), 'utf8'), /const notifyParent = shouldNotifyParent\(target\)/)
  assert.match(await readFile(new URL('../src/plugin-updater.ts', import.meta.url), 'utf8'), /isDshCliEntry/)
})

test('官方 Desktop 在线更新指向 desktop profile，且不通知父进程', () => {
  const profileDir = resolve('/dsh-profile/desktop')
  const runtime = resolveUpdateRuntime({
    get(name) {
      if (name === 'profileContext') return {
        name: 'desktop',
        dir: profileDir,
        packageManager: { command: resolve('/dsh-tools/DeepSeek Harness.exe'), args: ['--expose-internals', resolve('/dsh-runtime/pnpm.mjs')], env: { ELECTRON_RUN_AS_NODE: '1' } },
      }
      return undefined
    },
  }, {
    argv: ['node', resolve('/dsh-app/node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js'), resolve('/dsh-runtime'), profileDir],
    env: {},
    cwd: profileDir,
    homeDir: resolve('/dsh-home'),
  })
  assert.equal(runtime.profileName, 'desktop')
  assert.equal(runtime.profileDir, profileDir)
  assert.equal(runtime.officialDesktop, true)
  assert.equal(runtime.canAutoUpdate, true)
  assert.equal(shouldNotifyParent(runtime, () => {}), false)
})
