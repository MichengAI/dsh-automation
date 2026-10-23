import type { Context } from '@deepseek-ai/cordis'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { resolveUpdateRuntime } from './plugin-updater.ts'

export const SETTINGS_API_HEADER = 'x-michengai-client'
const MAX_SETTINGS_BODY_BYTES = 64 * 1024

export interface PersistedSettings {
  sidebarEntry?: boolean | undefined
  onlineUpdate?: boolean | undefined
}

type UpdateContext = Context & {
  webServer: { register(route: { kind: 'exact'; path: string; handler(request: any, response: any): Promise<void> }): () => void }
  get?(name: string): unknown
}

function resolveProfileDir(ctx: Context): string {
  try {
    return resolveUpdateRuntime(ctx as any).profileDir
  } catch {
    const env = process.env
    const home = process.env.USERPROFILE ?? process.env.HOME ?? ''
    return resolve(env.DSH_PROFILE_DIR ?? resolve(home, '.dsh', 'profiles', 'web'))
  }
}

function header(request: { headers?: Record<string, string | string[] | undefined> }, name: string): string | undefined {
  const value = request.headers?.[name]
  return Array.isArray(value) ? value[0] : value
}

function validateApiMutation(request: { method?: string; headers?: Record<string, string | string[] | undefined> }): { status: number; error: string } | undefined {
  const method = (request.method ?? 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD') return undefined
  const marker = header(request, SETTINGS_API_HEADER)
  if (marker !== '1') return { status: 403, error: 'forbidden mutation request' }
  const contentType = header(request, 'content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') return { status: 415, error: 'content-type must be application/json' }
  return undefined
}

export class SettingsManager {
  private readonly file: string
  private readonly hostUpdateDisabled: boolean
  private store: PersistedSettings = {}

  constructor(options: {
    ctx: Context
    stateDir?: string
    hostUpdateDisabled?: boolean
  }) {
    this.hostUpdateDisabled = options.hostUpdateDisabled === true
    if (options.stateDir !== undefined && options.stateDir !== '') {
      this.file = isAbsolute(options.stateDir) ? join(options.stateDir, 'settings.json') : resolve(options.stateDir, 'settings.json')
    } else {
      const profileDir = resolveProfileDir(options.ctx)
      this.file = join(profileDir, 'automation-settings.json')
    }
    this.load()
  }

  private load(): void {
    if (!existsSync(this.file)) return
    try {
      const content = readFileSync(this.file, 'utf8')
      const parsed = JSON.parse(content) as unknown
      if (typeof parsed === 'object' && parsed !== null) {
        const item = parsed as Record<string, unknown>
        this.store = {
          sidebarEntry: typeof item.sidebarEntry === 'boolean' ? item.sidebarEntry : undefined,
          onlineUpdate: typeof item.onlineUpdate === 'boolean' ? item.onlineUpdate : undefined,
        }
      }
    } catch {
      this.store = {}
    }
  }

  private flush(): void {
    try {
      const dir = dirname(this.file)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(this.file, JSON.stringify(this.store, null, 2), 'utf8')
    } catch {
      // 存储写入失败降级为内存保留，不阻断运行
    }
  }

  getSidebarEntry(): boolean {
    return this.store.sidebarEntry === true
  }

  async setSidebarEntry(enabled: boolean): Promise<boolean> {
    if (typeof enabled !== 'boolean') throw new Error('enabled 必须是布尔值')
    this.store.sidebarEntry = enabled
    this.flush()
    return enabled
  }

  isHostUpdateDisabled(): boolean {
    return this.hostUpdateDisabled
  }

  isUpdateEnabled(): boolean {
    if (this.hostUpdateDisabled) return false
    return this.store.onlineUpdate !== false
  }

  async setOnlineUpdate(enabled: boolean): Promise<boolean> {
    if (typeof enabled !== 'boolean') throw new Error('enabled 必须是布尔值')
    if (this.hostUpdateDisabled) throw new Error('在线更新已被宿主配置锁定禁用')
    this.store.onlineUpdate = enabled
    this.flush()
    return enabled
  }
}

export function registerSettingsApi(ctx: Context, manager: SettingsManager): () => void {
  const host = ctx as UpdateContext
  if (typeof host.webServer?.register !== 'function') return () => {}

  const json = (res: any, status: number, body: unknown) => {
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    })
    res.end(JSON.stringify(body))
  }

  const checkAuthAndMutation = (request: any, response: any): boolean => {
    const connection = (typeof ctx.get === 'function' ? ctx.get('connection') : undefined) as {
      requestRejection?: (request: { headers: any }) => 401 | 403 | undefined
    } | undefined
    if (typeof connection?.requestRejection === 'function') {
      const rejection = connection.requestRejection(request)
      if (rejection !== undefined) {
        json(response, rejection, { ok: false, error: rejection === 401 ? '请先登录 DSH / Sign in to DSH first' : '宿主拒绝此请求 / Request forbidden' })
        return false
      }
    }
    const mutationError = validateApiMutation(request)
    if (mutationError !== undefined) {
      json(response, mutationError.status, { ok: false, error: mutationError.error })
      return false
    }
    return true
  }

  const readBody = (req: any): Promise<{ ok: boolean; status?: number; data?: any; error?: string }> => new Promise((resolveBody) => {
    const chunks: Buffer[] = []
    let received = 0
    let oversized = false

    req.on('data', (chunk: Buffer) => {
      received += chunk.length
      if (received > MAX_SETTINGS_BODY_BYTES) {
        oversized = true
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      if (oversized) {
        resolveBody({ ok: false, status: 413, error: 'payload too large' })
        return
      }
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolveBody({ ok: true, data: raw ? JSON.parse(raw) : {} })
      } catch {
        resolveBody({ ok: false, status: 400, error: 'invalid json' })
      }
    })

    req.on('error', () => resolveBody({ ok: false, status: 400, error: 'read error' }))
  })

  const offSidebar = host.webServer.register({
    kind: 'exact',
    path: '/api/michengai/dsh-automation/sidebar-entry',
    handler: async (request: any, response: any) => {
      if (!checkAuthAndMutation(request, response)) return
      const method = request.method
      if (method === 'GET' || method === 'HEAD') {
        if (method === 'HEAD') {
          response.writeHead(200, { 'cache-control': 'no-store' })
          response.end()
          return
        }
        json(response, 200, { ok: true, enabled: manager.getSidebarEntry() })
        return
      }
      if (method === 'POST') {
        const bodyRes = await readBody(request)
        if (!bodyRes.ok || !bodyRes.data || typeof bodyRes.data.enabled !== 'boolean') {
          json(response, bodyRes.status ?? 400, { ok: false, error: bodyRes.error ?? 'enabled 必须是布尔值' })
          return
        }
        const enabled = await manager.setSidebarEntry(bodyRes.data.enabled)
        json(response, 200, { ok: true, enabled })
        return
      }
      response.writeHead(405, { allow: 'GET, HEAD, POST' })
      response.end()
    },
  })

  const offUpdate = host.webServer.register({
    kind: 'exact',
    path: '/api/michengai/dsh-automation/online-update',
    handler: async (request: any, response: any) => {
      if (!checkAuthAndMutation(request, response)) return
      const method = request.method
      if (method === 'GET' || method === 'HEAD') {
        if (method === 'HEAD') {
          response.writeHead(200, { 'cache-control': 'no-store' })
          response.end()
          return
        }
        json(response, 200, {
          ok: true,
          enabled: manager.isUpdateEnabled(),
          locked: manager.isHostUpdateDisabled(),
        })
        return
      }
      if (method === 'POST') {
        if (manager.isHostUpdateDisabled()) {
          json(response, 403, { ok: false, error: '在线更新已被宿主配置锁定禁用' })
          return
        }
        const bodyRes = await readBody(request)
        if (!bodyRes.ok || !bodyRes.data || typeof bodyRes.data.enabled !== 'boolean') {
          json(response, bodyRes.status ?? 400, { ok: false, error: bodyRes.error ?? 'enabled 必须是布尔值' })
          return
        }
        const enabled = await manager.setOnlineUpdate(bodyRes.data.enabled)
        json(response, 200, { ok: true, enabled })
        return
      }
      response.writeHead(405, { allow: 'GET, HEAD, POST' })
      response.end()
    },
  })

  return () => {
    try { offSidebar() } catch {}
    try { offUpdate() } catch {}
  }
}
