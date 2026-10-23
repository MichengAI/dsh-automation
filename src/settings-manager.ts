import type { Context } from '@deepseek-ai/cordis'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'

export interface PersistedSettings {
  sidebarEntry?: boolean | undefined
  onlineUpdate?: boolean | undefined
}

type UpdateContext = Context & { webServer: { register(route: { kind: 'exact'; path: string; handler(request: any, response: any): Promise<void> }): () => void }; get?(name: string): unknown }

function isLoopbackAddress(value: string | undefined): boolean {
  const address = value?.toLowerCase().replace(/^\[|\]$/g, '')
  return address === 'localhost' || address === 'localhost.' || address === '::1'
    || address?.startsWith('127.') === true || address?.startsWith('::ffff:127.') === true
}

function resolveProfileDir(ctx: Context): string {
  const optionalService = (serviceContext: Context, name: string): unknown => {
    try {
      return (serviceContext as UpdateContext).get?.(name)
    } catch {
      return undefined
    }
  }
  const profiles = optionalService(ctx, 'desktopProfiles') as { current?: { dir?: unknown } } | undefined
  if (profiles?.current?.dir !== undefined && typeof profiles.current.dir === 'string') {
    return resolve(profiles.current.dir)
  }
  const launched = optionalService(ctx, 'profileContext') as { dir?: unknown } | undefined
  if (launched?.dir !== undefined && typeof launched.dir === 'string') {
    return resolve(launched.dir)
  }
  const env = process.env
  const home = homedir()
  return resolve(env.DSH_PROFILE_DIR ?? resolve(home, '.dsh', 'profiles', 'web'))
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

  const readBody = (req: any): Promise<any> => new Promise((resolveBody) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolveBody(raw ? JSON.parse(raw) : {})
      } catch {
        resolveBody(null)
      }
    })
    req.on('error', () => resolveBody(null))
  })

  const offSidebar = host.webServer.register({
    kind: 'exact',
    path: '/api/michengai/dsh-automation/sidebar-entry',
    handler: async (request: any, response: any) => {
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
        const body = await readBody(request)
        if (!body || typeof body.enabled !== 'boolean') {
          json(response, 400, { ok: false, error: 'enabled 必须是布尔值' })
          return
        }
        const enabled = await manager.setSidebarEntry(body.enabled)
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
        const body = await readBody(request)
        if (!body || typeof body.enabled !== 'boolean') {
          json(response, 400, { ok: false, error: 'enabled 必须是布尔值' })
          return
        }
        const enabled = await manager.setOnlineUpdate(body.enabled)
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
