import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { isDshCliEntry, isNewerVersion, isTrustedUpdateRequest, mergeMinimumReleaseAgeExclude, PLUGIN_UPDATE_HEADER, recordReleaseAgeExclude, resolveUpdateRuntime, shouldNotifyParent } from '../src/plugin-updater.ts'

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
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: '@deepseek-ai/dsh', bin: { dsh: 'lib/bin.js' } }, 'C:/tools/dsh'), true)
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: '@deepseek-ai/dsh', bin: { dsh: 'lib/other.js' } }, 'C:/tools/dsh'), false)
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: 'other-cli', bin: { dsh: 'lib/bin.js' } }, 'C:/tools/dsh'), false)
})

test('定时任务客户端不暴露在线更新入口，Host 保留更新服务', async () => {
  const client = await readFile(new URL('../src/client/index.ts', import.meta.url), 'utf8')
  const host = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /observePluginUpdate/)
  assert.doesNotMatch(client, /createPluginUpdateIcon/)
  assert.doesNotMatch(client, /UPDATE_ICON_PATHS/)
  assert.doesNotMatch(client, /react-dom\/client/)
  assert.match(host, /endpoint: '\/api\/michengai\/dsh-automation\/update'/)
  assert.match(host, /isEnabled: async \(\) => !hostUpdateDisabled && settingsManager\.isUpdateEnabled\(\)/)
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

test('自更新把刚安装的版本并进已有发布年龄白名单，不另起一行', () => {
  const created = mergeMinimumReleaseAgeExclude('packages:\n  - .\n', '@michengai/dsh-automation@1.0.0')
  assert.match(created, /minimumReleaseAgeExclude:\n  - '@michengai\/dsh-automation@1\.0\.0'\n/)
  const merged = mergeMinimumReleaseAgeExclude(
    "minimumReleaseAgeExclude:\n  - '@michengai/dsh-automation@0.1.66'\n  - keep@1.0.0\n",
    '@michengai/dsh-automation@1.0.0',
  )
  assert.match(merged, /'@michengai\/dsh-automation@0\.1\.66 \|\| 1\.0\.0'/)
  assert.match(merged, /keep@1\.0\.0/)
  assert.equal(merged.split('@michengai/dsh-automation').length - 1, 1)
  assert.throws(() => mergeMinimumReleaseAgeExclude('minimumReleaseAgeExclude: [keep@1.0.0]\n', '@michengai/dsh-automation@1.0.0'), /无法安全合并/)
})

test('白名单先写临时文件再替换，不留下临时文件', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-age-'))
  try {
    await writeFile(join(dir, 'pnpm-workspace.yaml'), "packages:\n  - .\nminimumReleaseAgeExclude:\n  - '@michengai/dsh-automation@0.1.66' # 保留\n", 'utf8')
    await recordReleaseAgeExclude(dir, '@michengai/dsh-automation@1.0.0')
    const text = await readFile(join(dir, 'pnpm-workspace.yaml'), 'utf8')
    assert.match(text, /0\.1\.66 \|\| 1\.0\.0' # 保留/)
    assert.deepEqual(await readdir(dir), ['pnpm-workspace.yaml'])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
