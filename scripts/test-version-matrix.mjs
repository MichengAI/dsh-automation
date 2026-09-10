// 每版使用独立 npm 依赖树，验证发布入口和真实宿主执行；不读取开发 node_modules。
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const versions = ['0.1.0-rc.8', '0.1.1-rc.2', '0.1.2-rc.1', '0.1.5-rc.1']
const range = versions.join(' || ')
for (const [name, value] of Object.entries(manifest.peerDependencies)) {
  if (name.startsWith('@deepseek-ai/dsh-')) assert.equal(value, range, name)
}
const directory = await mkdtemp(join(tmpdir(), 'dsh-automation-matrix-'))
console.log(`矩阵证据目录：${directory}`)
function run(command, args, cwd, env = {}) {
  // Windows 的 npm.cmd 由 PowerShell 调用，避免依赖 cmd /c 的参数转义。
  const quote = value => `'${value.replaceAll("'", "''")}'`
  const result = process.platform === 'win32' && command === 'npm'
    ? spawnSync('powershell.exe', ['-NoProfile', '-Command', `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; & npm ${args.map(quote).join(' ')}; exit $LASTEXITCODE`], { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
    : spawnSync(command, args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
  return result.stdout
}
run('npm', ['pack', '--ignore-scripts', '--pack-destination', directory], root)
const archive = (await readdir(directory)).find(name => name.endsWith('.tgz'))
assert.ok(archive)
const results = []
for (const version of versions) {
  const cwd = join(directory, version)
  await mkdir(cwd)
  try {
    const dependencies = { [manifest.name]: `file:${join(directory, archive)}`, '@deepseek-ai/cordis': '4.0.2', '@deepseek-ai/schemastery': '3.18.2', react: '18.3.1', tsx: '4.23.12', ...manifest.dependencies }
    for (const name of ['js-yaml', '@deepseek-ai/cordis-plugin-include']) dependencies[name] = manifest.devDependencies[name]
    for (const name of Object.keys(manifest.devDependencies)) {
      if (name.startsWith('@deepseek-ai/dsh-')) dependencies[name] = version
    }
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies }, null, 2))
    console.log(`${version}：安装独立依赖`)
    run('npm', ['install', '--ignore-scripts', '--strict-peer-deps', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'], cwd)
    const lock = JSON.parse(await readFile(join(cwd, 'package-lock.json'), 'utf8'))
    const official = Object.entries(lock.packages).filter(([path]) => /node_modules\/@deepseek-ai\/dsh-/.test(path))
    for (const [path, pkg] of official) assert.equal(pkg.version, version, `混入其他宿主版本：${path}`)
    await cp(join(root, 'src'), join(cwd, 'src'), { recursive: true })
    await cp(join(root, 'cordis.patch.yml'), join(cwd, 'cordis.patch.yml'))
    await mkdir(join(cwd, 'tests'))
    await cp(join(root, 'tests', 'host-compatibility.test.mjs'), join(cwd, 'tests', 'host-compatibility.test.mjs'))
    await cp(join(root, 'tests', 'service.test.ts'), join(cwd, 'tests', 'service.test.ts'))
    run(process.execPath, ['--input-type=module', '-e', `import assert from 'node:assert/strict'; const m = await import('${manifest.name}'); assert.equal(typeof m.apply, 'function')`], cwd)
    const output = run(process.execPath, ['--import', 'tsx', '--test', 'tests/host-compatibility.test.mjs', 'tests/service.test.ts'], cwd, { DSH_TEST_VERSION: version })
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
