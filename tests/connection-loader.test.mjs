// 使用真实 Loader 和 Connection，验证配置表达式、RPC 归属及卸载，不启动本机宿主。
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import { load } from 'js-yaml'
import { applyEntryPatches } from '@deepseek-ai/cordis-plugin-include'
import * as Connection from '@deepseek-ai/dsh-client-connection'
import { registerAutomationRpc } from '../src/rpc.ts'

const require = createRequire(import.meta.resolve('@deepseek-ai/cordis-plugin-include'))
const { default: Loader, EntryTree } = await import(pathToFileURL(require.resolve('@deepseek-ai/cordis-plugin-loader')).href)
const version = process.env.DSH_TEST_VERSION ?? '0.2.0-rc.2'
const startupService = version === '0.2.1-alpha.2' ? 'webStartup' : 'webRuntime'

test(`${version} 真实 Loader 保留可信地址表达式并按消费者生命周期卸载 RPC`, async (t) => {
  const ctx = new Context()
  t.after(() => ctx.fiber.dispose())
  const routes = new Set()
  const trustedHosts = ['automation.example:3080']
  let configuration
  let record
  ctx.provide('credentials', {
    async readRecord() { return record },
    async modifyRecord(_key, mutate) { record = await mutate(record); return record },
  })
  await ctx.plugin(Loader)
  const connection = {
    ...Connection,
    apply(owner, config) {
      configuration = config
      return Connection.apply(owner, config)
    },
  }
  ctx.loader.builtins.consumer = {
    inject: ['connection', 'webServer'],
    apply(owner) { registerAutomationRpc(owner, {}) },
  }
  class MemoryTree extends EntryTree {
    write() {}
    import(name, stack) {
      if (name === '@deepseek-ai/dsh-client-connection') return connection
      return super.import(name, stack)
    }
  }
  const tree = new MemoryTree(ctx)
  const base = [{
    id: 'connection',
    name: '@deepseek-ai/dsh-client-connection',
    inject: [startupService],
    config: { trustedHosts: { __jsExpr: `ctx.${startupService}.trustedHosts` } },
  }]
  const patches = load(await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8'))
  const entries = applyEntryPatches(base, patches, () => assert.fail('补丁不应告警'))
  // 只挂载本测试关注的 Connection；自动化路由使用生产注册函数。
  await tree.root.update([entries[0], { id: 'consumer', name: 'cordis:consumer' }])
  await tree.await()
  assert.equal(configuration, undefined, '启动服务未就绪时不能求值或激活')
  await ctx.plugin({
    apply(owner) {
      owner.provide(startupService, { trustedHosts })
      owner.provide('webServer', {
        host: '127.0.0.1', port: 3080,
        register(route) { routes.add(route); return () => routes.delete(route) },
        registerUpgrade() { return () => {} },
        tapIndex() { return () => {} },
      })
    },
  })
  await tree.await()
  await ctx.loader.await()
  assert.deepEqual(configuration?.trustedHosts, trustedHosts)
  assert.ok([...routes].some(route => route.path === '/dsh-automation'))
  assert.equal(ctx.get('connection').requestRejection({
    headers: { host: trustedHosts[0], origin: `http://${trustedHosts[0]}` },
    socket: { remoteAddress: '203.0.113.10' },
  }), 401, '可信远端仍必须经过官方浏览器认证')
  tree.remove('consumer')
  await tree.await()
  assert.ok(![...routes].some(route => route.path === '/dsh-automation'))
  assert.ok([...routes].some(route => route.path === '/api'), '消费者卸载不应移除官方 API')
})
