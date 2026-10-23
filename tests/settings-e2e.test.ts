import test from 'node:test'
import assert from 'node:assert'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { registerSettingsApi, SettingsManager } from '../src/settings-manager.ts'

test('SettingsManager HTTP API 真实服务端端到端 (13项用例覆盖)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-automation-e2e-'))

  let rejectionCode: 401 | 403 | undefined = undefined
  const routes: any[] = []
  const mockWebServer = {
    register(route: any) {
      routes.push(route)
      return () => {}
    },
  }

  const fakeCtx: any = {
    webServer: mockWebServer,
    get(name: string) {
      if (name === 'connection') {
        return {
          requestRejection: () => rejectionCode,
        }
      }
      return undefined
    },
    root: {
      config: {},
    },
  }

  const manager = new SettingsManager({ ctx: fakeCtx, stateDir: tmpDir, hostUpdateDisabled: false })
  registerSettingsApi(fakeCtx, manager)

  const server = http.createServer(async (req, res) => {
    const match = routes.find(r => r.path === req.url)
    if (!match) {
      res.statusCode = 404
      res.end('Not Found')
      return
    }
    await match.handler(req, res)
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const addr = server.address() as any
  const base = `http://127.0.0.1:${addr.port}`

  try {
    // 1. GET /sidebar-entry -> 200 放行，默认开启（enabled: true，平替接管官方入口）
    const res1 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`)
    assert.strictEqual(res1.status, 200)
    const d1 = await res1.json() as any
    assert.strictEqual(d1.ok, true)
    assert.strictEqual(d1.enabled, true)

    // 2. GET /online-update -> 200 放行
    const res2 = await fetch(`${base}/api/michengai/dsh-automation/online-update`)
    assert.strictEqual(res2.status, 200)
    const d2 = await res2.json() as any
    assert.strictEqual(d2.ok, true)
    assert.strictEqual(d2.enabled, true)
    assert.strictEqual(d2.locked, false)

    // 3. POST /sidebar-entry 缺少 x-michengai-client
    const res3 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    })
    assert.strictEqual(res3.status, 403)

    // 4. POST /online-update 伪造跨站 text/plain
    const res4 = await fetch(`${base}/api/michengai/dsh-automation/online-update`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'enabled=true',
    })
    assert.strictEqual(res4.status, 403)

    // 5. POST /sidebar-entry 带有标记头但非 application/json (415)
    const res5 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'text/plain' },
      body: JSON.stringify({ enabled: true }),
    })
    assert.strictEqual(res5.status, 415)

    // 6. POST /sidebar-entry 合法修改 -> 200
    const res6 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    })
    assert.strictEqual(res6.status, 200)
    const d6 = await res6.json() as any
    assert.strictEqual(d6.ok, true)
    assert.strictEqual(d6.enabled, true)

    // 7. 验证磁盘上的真实文件落盘
    const diskSettings = JSON.parse(fs.readFileSync(path.join(tmpDir, 'settings.json'), 'utf8'))
    assert.strictEqual(diskSettings.sidebarEntry, true)

    // 8. POST /online-update 合法修改为 false -> 200
    const res8 = await fetch(`${base}/api/michengai/dsh-automation/online-update`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    })
    assert.strictEqual(res8.status, 200)
    const d8 = await res8.json() as any
    assert.strictEqual(d8.ok, true)
    assert.strictEqual(d8.enabled, false)

    // 9. GET /online-update 读取确认关闭状态
    const res9 = await fetch(`${base}/api/michengai/dsh-automation/online-update`)
    const d9 = await res9.json() as any
    assert.strictEqual(d9.enabled, false)

    // 9.1 GET /official-schedule -> 200，默认开启（enabled: true）
    const resOfficialGet = await fetch(`${base}/api/michengai/dsh-automation/official-schedule`)
    assert.strictEqual(resOfficialGet.status, 200)
    const dOfficialGet = await resOfficialGet.json() as any
    assert.strictEqual(dOfficialGet.ok, true)
    assert.strictEqual(dOfficialGet.enabled, true)

    // 9.2 POST /official-schedule 修改为 false -> 200 且数据落盘
    const resOfficialPost = await fetch(`${base}/api/michengai/dsh-automation/official-schedule`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    })
    assert.strictEqual(resOfficialPost.status, 200)
    const dOfficialPost = await resOfficialPost.json() as any
    assert.strictEqual(dOfficialPost.ok, true)
    assert.strictEqual(dOfficialPost.enabled, false)

    const diskSettingsUpdated = JSON.parse(fs.readFileSync(path.join(tmpDir, 'settings.json'), 'utf8'))
    assert.strictEqual(diskSettingsUpdated.hideOfficialSchedule, false)

    // 9.3 GET /official-schedule 再次读取确认
    const resOfficialGetAfter = await fetch(`${base}/api/michengai/dsh-automation/official-schedule`)
    const dOfficialGetAfter = await resOfficialGetAfter.json() as any
    assert.strictEqual(dOfficialGetAfter.enabled, false)

    // 9.4 验证老用户升级防死区：若曾存 sidebarEntry=false 且无 hideOfficialSchedule，默认不隐藏官方入口
    const legacyUserDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-legacy-user-'))
    fs.writeFileSync(path.join(legacyUserDir, 'settings.json'), JSON.stringify({ sidebarEntry: false }), 'utf8')
    const legacyManager = new SettingsManager({ ctx: fakeCtx, stateDir: legacyUserDir })
    assert.strictEqual(legacyManager.getSidebarEntry(), false)
    assert.strictEqual(legacyManager.getHideOfficialSchedule(), false, '老用户关闭侧栏时新键缺失默认跟随 sidebarEntry 保持 false，杜绝无入口死区')
    fs.rmSync(legacyUserDir, { recursive: true, force: true })

    // 10. connection.requestRejection = 401 拦截
    rejectionCode = 401
    const res10 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`)
    assert.strictEqual(res10.status, 401)
    rejectionCode = undefined

    // 11. 超大 body (70KB > 64KB) -> 413
    const hugeBody = JSON.stringify({ enabled: true, pad: 'x'.repeat(70 * 1024) })
    const res11 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: hugeBody,
    })
    assert.strictEqual(res11.status, 413)
  } finally {
    server.close()
  }

  // 12 & 13: 宿主锁定模式 (hostUpdateDisabled: true)
  const lockedRoutes: any[] = []
  const lockedWebServer = {
    register(route: any) {
      lockedRoutes.push(route)
      return () => {}
    },
  }
  const lockedCtx: any = { webServer: lockedWebServer, root: { config: {} } }
  const lockedManager = new SettingsManager({ ctx: lockedCtx, stateDir: tmpDir, hostUpdateDisabled: true })
  registerSettingsApi(lockedCtx, lockedManager)

  const lockedServer = http.createServer(async (req, res) => {
    const match = lockedRoutes.find(r => r.path === req.url)
    if (match) await match.handler(req, res)
  })
  await new Promise<void>((resolve) => lockedServer.listen(0, '127.0.0.1', () => resolve()))
  const lockedBase = `http://127.0.0.1:${(lockedServer.address() as any).port}`

  try {
    // 12. 宿主锁定 onlineUpdate: false
    const res12 = await fetch(`${lockedBase}/api/michengai/dsh-automation/online-update`)
    const d12 = await res12.json() as any
    assert.strictEqual(d12.locked, true)
    assert.strictEqual(d12.enabled, false)

    // 13. 宿主锁定时尝试 POST 修改 -> 403 Forbidden
    const res13 = await fetch(`${lockedBase}/api/michengai/dsh-automation/online-update`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    })
    assert.strictEqual(res13.status, 403)
  } finally {
    lockedServer.close()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
