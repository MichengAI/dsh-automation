// 每版使用独立 npm 依赖树，验证发布入口和真实宿主执行；不读取开发 node_modules。
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const versions = ['0.1.2-rc.1', '0.1.5-rc.1', '0.1.5-rc.2', '0.1.5-rc.3', '0.1.7-rc.1', '0.1.7-rc.2', '0.2.0-rc.1', '0.2.0-rc.2', '0.2.1-alpha.2', '0.2.1-alpha.3']
const versionsToRun = process.env.DSH_MATRIX_ONLY ? process.env.DSH_MATRIX_ONLY.split(',') : versions
const legacyPreset = '@deepseek-ai/dsh-agent-presets'
const presetRegistry = '@deepseek-ai/dsh-agent-preset-registry'
const modernHosts = new Set(['0.1.7-rc.1', '0.1.7-rc.2', '0.2.0-rc.1', '0.2.0-rc.2', '0.2.1-alpha.2', '0.2.1-alpha.3'])
const range = versions.join(' || ')
assert.equal(manifest.peerDependencies[legacyPreset], undefined, '旧包名不能进 peer，安装门不看 optional')
assert.equal(manifest.peerDependencies[presetRegistry], undefined, '新包名也不能进 peer，否则旧宿主会被拒')
for (const [name, value] of Object.entries(manifest.peerDependencies)) {
  if (!name.startsWith('@deepseek-ai/dsh-')) continue
  assert.equal(value, range, name)
}
const directory = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), 'dsh-automation-matrix-'))
console.log(`矩阵证据目录：${directory}`)
function run(command, args, cwd, env = {}) {
  // Windows 直接调用 Node 随附 npm，避免全局旧版及 npm.cmd 的转义问题。
  const npmCli = process.env.DSH_MATRIX_NPM_CLI ?? (process.platform === 'win32'
    ? fileURLToPath(new URL('./node_modules/npm/bin/npm-cli.js', pathToFileURL(process.execPath))) : undefined)
  const useNpmCli = command === 'npm' && npmCli !== undefined
  const executable = useNpmCli ? process.execPath : command
  const parameters = useNpmCli ? [npmCli, ...args] : args
  const result = spawnSync(executable, parameters, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
  return result.stdout
}
run('npm', ['pack', '--ignore-scripts', '--pack-destination', directory], root)
const archive = (await readdir(directory)).find(name => name.endsWith('.tgz'))
assert.ok(archive)
const results = []
// 官方间接 peer 使用 ^ 范围；新版发布后也必须保持每组宿主依赖完整同版。
async function pinOfficialDependencies(dependencies, version) {
  const visited = new Set()
  while (true) {
    const pending = Object.keys(dependencies).filter(name => name.startsWith('@deepseek-ai/dsh-') && !visited.has(name))
    if (pending.length === 0) return
    const manifests = await Promise.all(pending.map(async name => {
      const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`
      let metadata
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          metadata = await response.json()
          break
        } catch (error) {
          if (attempt === 3) throw new Error(`读取 ${name}@${version} 失败`, { cause: error })
          console.warn(`读取 ${name}@${version} 暂时失败，重试 ${attempt}/2`)
        }
      }
      assert.equal(metadata.version, version, name)
      visited.add(name)
      return metadata
    }))
    for (const metadata of manifests) {
      for (const name of Object.keys({ ...metadata.dependencies, ...metadata.peerDependencies, ...metadata.optionalDependencies })) {
        if (name.startsWith('@deepseek-ai/dsh-')) dependencies[name] = version
      }
    }
  }
}
for (const version of versionsToRun) {
  const cwd = join(directory, version)
  await mkdir(cwd)
  try {
    const toolchain = version === '0.2.1-alpha.3'
      ? { '@deepseek-ai/cordis': '4.0.5-alpha.2', '@deepseek-ai/schemastery': '3.18.5-alpha.2', '@deepseek-ai/cordis-plugin-loader': '1.0.6-alpha.2', '@deepseek-ai/cordis-plugin-include': '1.0.10-alpha.2', '@deepseek-ai/cordis-plugin-group': '1.0.5-alpha.2', '@deepseek-ai/cordis-plugin-timer': '1.1.7-alpha.2' }
      : version === '0.2.1-alpha.2'
      ? { '@deepseek-ai/cordis': '4.0.5-alpha.1', '@deepseek-ai/schemastery': '3.18.5-alpha.1', '@deepseek-ai/cordis-plugin-loader': '1.0.6-alpha.1', '@deepseek-ai/cordis-plugin-include': '1.0.10-alpha.1', '@deepseek-ai/cordis-plugin-group': '1.0.5-alpha.1', '@deepseek-ai/cordis-plugin-timer': '1.1.7-alpha.1' }
      : modernHosts.has(version)
      ? { '@deepseek-ai/cordis': '4.0.4', '@deepseek-ai/schemastery': '3.18.4', '@deepseek-ai/cordis-plugin-loader': '1.0.5', '@deepseek-ai/cordis-plugin-include': '1.0.9', '@deepseek-ai/cordis-plugin-group': '1.0.4' }
      : { '@deepseek-ai/cordis': '4.0.2', '@deepseek-ai/schemastery': '3.18.2', '@deepseek-ai/cordis-plugin-loader': '1.0.3', '@deepseek-ai/cordis-plugin-include': '1.0.7', '@deepseek-ai/cordis-plugin-group': '1.0.2' }
    const dependencies = { [manifest.name]: `file:${join(directory, archive)}`, react: '18.3.1', 'react-dom': '18.3.1', tsx: '4.23.12', ...manifest.dependencies, ...toolchain }
    for (const name of ['js-yaml']) dependencies[name] = manifest.devDependencies[name]
    for (const name of Object.keys(manifest.devDependencies)) {
      if (!name.startsWith('@deepseek-ai/dsh-')) continue
      if (name === presetRegistry || name === legacyPreset) {
        if (modernHosts.has(version)) dependencies[presetRegistry] = version
        continue
      }
      dependencies[name] = version
    }
    await pinOfficialDependencies(dependencies, version)
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies }, null, 2))
    console.log(`${version}：安装独立依赖`)
    run('npm', ['install', '--ignore-scripts', '--strict-peer-deps', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'], cwd)
    const lock = JSON.parse(await readFile(join(cwd, 'package-lock.json'), 'utf8'))
    const official = Object.entries(lock.packages).filter(([path]) => /(?:^|\/)node_modules\/@deepseek-ai\/dsh-[^/]+$/.test(path))
    for (const [path, pkg] of official) assert.equal(pkg.version, version, `混入其他宿主版本：${path}`)
    await cp(join(root, 'src'), join(cwd, 'src'), { recursive: true })
    await cp(join(root, 'cordis.patch.yml'), join(cwd, 'cordis.patch.yml'))
    await mkdir(join(cwd, 'tests'))
    await cp(join(root, 'tests', 'host-compatibility.test.mjs'), join(cwd, 'tests', 'host-compatibility.test.mjs'))
    await cp(join(root, 'tests', 'connection-loader.test.mjs'), join(cwd, 'tests', 'connection-loader.test.mjs'))
    await cp(join(root, 'tests', 'service.test.ts'), join(cwd, 'tests', 'service.test.ts'))
    run(process.execPath, ['--input-type=module', '-e', `import assert from 'node:assert/strict'; const m = await import('${manifest.name}'); assert.equal(typeof m.apply, 'function')`], cwd)
    const output = run(process.execPath, ['--import', 'tsx', '--test', 'tests/host-compatibility.test.mjs', 'tests/connection-loader.test.mjs', 'tests/service.test.ts'], cwd, { DSH_TEST_VERSION: version })
    await writeFile(join(cwd, 'host-test.log'), output)
    results.push({ version, status: 'passed', officialPackages: official.length })
    console.log(`${version}：通过（${official.length} 个官方包版本一致）`)
  } catch (error) {
    results.push({ version, status: 'failed', error: String(error) })
    console.error(`${version}：${error}`)
  }
}
await writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2))
console.table(results.map(({ version, status, officialPackages }) => ({ version, status, officialPackages })))
if (results.some(result => result.status !== 'passed')) process.exitCode = 1
