import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { registerPluginUpdater } from '../src/plugin-updater.ts'
import { registerSettingsApi, SettingsManager } from '../src/settings-manager.ts'

test('在线更新与侧边栏配置：SettingsManager、持久化、HTTP API 与更新器门控', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-auto-settings-'))
  const routes = new Map<string, (req: any, res: any) => Promise<void>>()
  const fakeCtx = {
    webServer: {
      register(route: { kind: string; path: string; handler: any }) {
        routes.set(route.path, route.handler)
        return () => { routes.delete(route.path) }
      },
    },
    logger: { warn() {} },
  } as any

  try {
    // 1. 默认设置测试
    const manager = new SettingsManager({
      ctx: fakeCtx,
      stateDir: dir,
      hostUpdateDisabled: false,
    })
    assert.equal(manager.getSidebarEntry(), false, '默认侧边栏入口为 false')
    assert.equal(manager.isUpdateEnabled(), true, '默认在线更新为 true')
    assert.equal(manager.isHostUpdateDisabled(), false, '默认未被宿主锁定')

    // 2. 状态变更与落盘
    await manager.setSidebarEntry(true)
    assert.equal(manager.getSidebarEntry(), true)
    await manager.setOnlineUpdate(false)
    assert.equal(manager.isUpdateEnabled(), false)

    // 重新从磁盘加载同一个 stateDir
    const reloaded = new SettingsManager({
      ctx: fakeCtx,
      stateDir: dir,
      hostUpdateDisabled: false,
    })
    assert.equal(reloaded.getSidebarEntry(), true, '持久化加载侧边栏入口')
    assert.equal(reloaded.isUpdateEnabled(), false, '持久化加载在线更新状态')

    // 3. HTTP API 交互
    const offApi = registerSettingsApi(fakeCtx, manager)
    assert.ok(routes.has('/api/michengai/dsh-automation/sidebar-entry'))
    assert.ok(routes.has('/api/michengai/dsh-automation/online-update'))

    // 辅助测试 HTTP 请求
    const callHandler = async (path: string, method: string, body?: unknown, reqHeaders?: Record<string, string>) => {
      const handler = routes.get(path)
      assert.ok(handler, `route must exist: ${path}`)
      let status = 0
      let headers: Record<string, string> = {}
      let responseBody = ''
      const res = {
        writeHead(st: number, hdrs?: Record<string, string>) {
          status = st
          if (hdrs) headers = hdrs
        },
        end(data?: string) {
          if (data) responseBody = data
        },
      }
      const rawBody = body !== undefined ? JSON.stringify(body) : ''
      const defaultHeaders = method === 'POST' ? {
        'x-michengai-client': '1',
        'content-type': 'application/json',
      } : {}
      const req = {
        method,
        headers: { ...defaultHeaders, ...reqHeaders },
        on(event: string, cb: any) {
          if (event === 'data' && rawBody) cb(Buffer.from(rawBody, 'utf8'))
          if (event === 'end') cb()
          return this
        },
      }
      await handler(req, res)
      return { status, headers, json: responseBody ? JSON.parse(responseBody) : undefined }
    }

    // 测试 GET sidebar-entry
    const sideGet = await callHandler('/api/michengai/dsh-automation/sidebar-entry', 'GET')
    assert.equal(sideGet.status, 200)
    assert.equal(sideGet.json.ok, true)
    assert.equal(sideGet.json.enabled, true)

    // 测试 POST sidebar-entry
    const sidePost = await callHandler('/api/michengai/dsh-automation/sidebar-entry', 'POST', { enabled: false })
    assert.equal(sidePost.status, 200)
    assert.equal(sidePost.json.enabled, false)
    assert.equal(manager.getSidebarEntry(), false)

    // 测试 GET online-update：必须返回 locked 字段（避免 Bug 3）
    const updateGet = await callHandler('/api/michengai/dsh-automation/online-update', 'GET')
    assert.equal(updateGet.status, 200)
    assert.equal(updateGet.json.ok, true)
    assert.equal(updateGet.json.enabled, false)
    assert.equal(updateGet.json.locked, false, '未锁定时 locked 为 false')

    // 测试 POST online-update 重新开启
    const updatePost = await callHandler('/api/michengai/dsh-automation/online-update', 'POST', { enabled: true })
    assert.equal(updatePost.status, 200)
    assert.equal(updatePost.json.enabled, true)
    assert.equal(manager.isUpdateEnabled(), true)

    // 测试写请求防御：缺少 x-michengai-client 标记头应返回 403
    const noMarkerPost = await callHandler('/api/michengai/dsh-automation/online-update', 'POST', { enabled: true }, {
      'x-michengai-client': '',
      'content-type': 'application/json',
    })
    assert.equal(noMarkerPost.status, 403, '无标记头写请求必须被 403 拒绝')

    // 测试写请求防御：非法 content-type 应返回 415
    const badTypePost = await callHandler('/api/michengai/dsh-automation/online-update', 'POST', { enabled: true }, {
      'x-michengai-client': '1',
      'content-type': 'text/plain',
    })
    assert.equal(badTypePost.status, 415, '非法 content-type 必须被 415 拒绝')

    offApi()

    // 宿主 connection.requestRejection 门禁拦截测试
    const authedCtx = {
      ...fakeCtx,
      get: (name: string) => (name === 'connection' ? {
        requestRejection: () => 401 as const,
      } : undefined),
    }
    const offAuthApi = registerSettingsApi(authedCtx, manager)
    const rejectGet = await callHandler('/api/michengai/dsh-automation/sidebar-entry', 'GET')
    assert.equal(rejectGet.status, 401, '宿主认证未通过时必须返回 401')
    offAuthApi()

    // 4. 宿主锁定测试（hostUpdateDisabled = true）
    const lockedManager = new SettingsManager({
      ctx: fakeCtx,
      stateDir: dir,
      hostUpdateDisabled: true,
    })
    assert.equal(lockedManager.isHostUpdateDisabled(), true)
    assert.equal(lockedManager.isUpdateEnabled(), false, '宿主锁定时 isUpdateEnabled 必为 false')
    await assert.rejects(
      async () => { await lockedManager.setOnlineUpdate(true) },
      /在线更新已被宿主配置锁定禁用/,
    )

    const offLockedApi = registerSettingsApi(fakeCtx, lockedManager)
    const lockedGet = await callHandler('/api/michengai/dsh-automation/online-update', 'GET')
    assert.equal(lockedGet.status, 200)
    assert.equal(lockedGet.json.enabled, false)
    assert.equal(lockedGet.json.locked, true, '宿主锁定返回 locked: true')

    const lockedPost = await callHandler('/api/michengai/dsh-automation/online-update', 'POST', { enabled: true })
    assert.equal(lockedPost.status, 403, '宿主锁定下拒绝 POST 修改')
    assert.equal(lockedPost.json.ok, false)

    offLockedApi()

    // 5. 测试更新器 registerPluginUpdater 的 isEnabled 门控
    const offUpdater = registerPluginUpdater(fakeCtx, {
      endpoint: '/api/michengai/dsh-automation/update',
      packageName: '@michengai/dsh-automation',
      manifestUrl: new URL('../package.json', import.meta.url),
      isEnabled: () => false,
    })
    const updateRes = await callHandler('/api/michengai/dsh-automation/update', 'GET')
    assert.equal(updateRes.status, 403, '禁用时返回 403')
    assert.equal(updateRes.json.ok, false)
    assert.equal(updateRes.json.error, '在线更新已被禁用。')
    offUpdater()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
