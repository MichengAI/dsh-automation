import test from 'node:test'
import assert from 'node:assert'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { registerSettingsApi, SettingsManager } from '../src/settings-manager.ts'

test('SettingsManager HTTP API 真实服务端端到端 (完整用例覆盖)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-automation-e2e-'))

  let rejectionCode: 401 | 403 | undefined = undefined
  let connectionMode: 'requestRejection' | 'admit' | 'error' = 'requestRejection'
  let passPeer = false
  let admitCalls = 0
  let requestRejectionCalls = 0
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
        if (connectionMode === 'error') {
          return {
            admit: () => {
              admitCalls++
              throw new Error('cannot get property "connection.authentication" without inject')
            },
          }
        }
        if (connectionMode === 'admit') {
          return {
            admit: () => {
              admitCalls++
              return rejectionCode !== undefined ? { rejection: rejectionCode } : {}
            },
          }
        }
        return {
          requestRejection: () => {
            requestRejectionCalls++
            return rejectionCode
          },
        }
      }
      return undefined
    },
    root: {
      config: {},
    },
  }

  const manager = new SettingsManager({ ctx: fakeCtx, stateDir: tmpDir })
  registerSettingsApi(fakeCtx, manager)

  const server = http.createServer(async (req, res) => {
    const match = routes.find(r => r.path === req.url)
    if (!match) {
      res.statusCode = 404
      res.end('Not Found')
      return
    }
    await match.handler(req, res, passPeer ? { principal: { kind: 'owner' } } : undefined)
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

    // 3. POST /sidebar-entry 缺少 x-michengai-client
    const res3 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    })
    assert.strictEqual(res3.status, 403)

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

    // 10.1 新版宿主 connection.admit = { rejection: 401 } / { rejection: 403 } 拦截
    connectionMode = 'admit'
    rejectionCode = 401
    const resAdmit401 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`)
    assert.strictEqual(resAdmit401.status, 401)
    rejectionCode = 403
    const resAdmit403 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`)
    assert.strictEqual(resAdmit403.status, 403)
    rejectionCode = undefined
    connectionMode = 'requestRejection'

    // 10.2 当宿主反射限制导致 admit 抛出异常时，无 peer 下安全降级，不让异常逃逸为 400
    connectionMode = 'error'
    const resAdmitError = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`)
    assert.strictEqual(resAdmitError.status, 200, 'admit 抛错时应安全降级，绝不能逃逸导致 400')
    connectionMode = 'requestRejection'

    // 10.3 真实宿主 WebServer 传入 peer 时，已准入请求直接放行，跳过底层 connection 检查（强差分力）
    // 验证无论处于 admit 模式还是 requestRejection 模式且设定 401 拒绝，有 peer 时均直接放行且不调用底层鉴权
    connectionMode = 'admit'
    rejectionCode = 401
    admitCalls = 0
    passPeer = true
    const resPeerAdmitted = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`)
    assert.strictEqual(resPeerAdmitted.status, 200, '传入已准入 peer 时直接放行，底层 rejection=401 不被执行')
    assert.strictEqual(admitCalls, 0, '传入 peer 时严禁触发 connection.admit')

    connectionMode = 'requestRejection'
    rejectionCode = 401
    requestRejectionCalls = 0
    const resPeerRejection = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`)
    assert.strictEqual(resPeerRejection.status, 200, '传入已准入 peer 时直接放行，底层 requestRejection=401 不被执行')
    assert.strictEqual(requestRejectionCalls, 0, '传入 peer 时严禁触发 connection.requestRejection')

    passPeer = false
    rejectionCode = undefined

    // 11. 超大 body (70KB > 64KB) -> 413
    const hugeBody = JSON.stringify({ enabled: true, pad: 'x'.repeat(70 * 1024) })
    const res11 = await fetch(`${base}/api/michengai/dsh-automation/sidebar-entry`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: hugeBody,
    })
    assert.strictEqual(res11.status, 413)

    // 11.1 GET /task-tree-sessions -> 200, 默认关闭 (enabled: false)
    const resTaskTree1 = await fetch(`${base}/api/michengai/dsh-automation/task-tree-sessions`)
    assert.strictEqual(resTaskTree1.status, 200)
    const dTaskTree1 = await resTaskTree1.json() as any
    assert.strictEqual(dTaskTree1.ok, true)
    assert.strictEqual(dTaskTree1.enabled, false)

    // 11.2 POST /task-tree-sessions 修改为 true -> 200
    const resTaskTree2 = await fetch(`${base}/api/michengai/dsh-automation/task-tree-sessions`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    })
    assert.strictEqual(resTaskTree2.status, 200)
    const dTaskTree2 = await resTaskTree2.json() as any
    assert.strictEqual(dTaskTree2.ok, true)
    assert.strictEqual(dTaskTree2.enabled, true)

    // 11.3 重新读取确认持久化
    const resTaskTree3 = await fetch(`${base}/api/michengai/dsh-automation/task-tree-sessions`)
    const dTaskTree3 = await resTaskTree3.json() as any
    assert.strictEqual(dTaskTree3.enabled, true)

    // 11.4 非法方法 PUT -> 405
    const resTaskTree4 = await fetch(`${base}/api/michengai/dsh-automation/task-tree-sessions`, {
      method: 'PUT',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    })
    assert.strictEqual(resTaskTree4.status, 405)

    // 11.5 非布尔值 body -> 400
    const resTaskTree5 = await fetch(`${base}/api/michengai/dsh-automation/task-tree-sessions`, {
      method: 'POST',
      headers: { 'x-michengai-client': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: 'not-a-boolean' }),
    })
    assert.strictEqual(resTaskTree5.status, 400)
  } finally {
    server.close()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
