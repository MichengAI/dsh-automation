/** 定时任务表单里新增工作区：只探测宿主服务，不硬读未注入的 ctx.workspaces。 */

export class AddedWorkspaceMissingError extends Error {
  constructor() {
    super('added-workspace-missing')
    this.name = 'AddedWorkspaceMissingError'
  }
}

export class WorkspacePickerUnavailableError extends Error {
  readonly code = 'workspace/picker-unavailable'
  constructor() {
    super('workspace picker unavailable')
    this.name = 'WorkspacePickerUnavailableError'
  }
}

export interface HostWorkspaceCreator {
  pickDirectory(): Promise<string | undefined>
  create(path: string): Promise<unknown>
}

export interface WorkspaceProbe {
  readonly get?: (name: string) => unknown
  readonly reflect?: { readonly get?: (name: string) => unknown }
}

export function workspacePathKey(path: string): string {
  return path.replace(/[\\/]+$/, '').replace(/\\/g, '/').toLowerCase()
}

export function workspaceIdForPath(
  workspaces: readonly { readonly id: string; readonly path: string }[],
  path: string,
): string | undefined {
  const key = workspacePathKey(path)
  return workspaces.find(item => workspacePathKey(item.path) === key)?.id
}

export function createdWorkspaceId(
  workspaces: readonly { readonly id: string; readonly path: string }[],
  path: string,
): string {
  const id = workspaceIdForPath(workspaces, path)
  if (id === undefined) throw new AddedWorkspaceMissingError()
  return id
}

export function probeService(ctx: WorkspaceProbe | unknown, name: string): unknown {
  if (ctx === null || typeof ctx !== 'object') return undefined
  const target = ctx as { readonly reflect?: { readonly get?: (name: string) => unknown }; readonly get?: (name: string) => unknown }
  const reflect = target.reflect
  if (reflect && typeof reflect.get === 'function') {
    try {
      const found = reflect.get(name)
      if (found !== undefined) return found
    } catch { /* 未注入时不硬读 ctx[name]，改走 get */ }
  }
  if (typeof target.get === 'function') {
    try {
      const found = target.get(name)
      if (found !== undefined) return found
    } catch { return undefined }
  }
  if (reflect && typeof reflect.get === 'function') return undefined
  try {
    return (ctx as Record<string, unknown>)[name]
  } catch {
    return undefined
  }
}

export function parsePickedPath(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (value === null || typeof value !== 'object') return undefined
  const record = value as { readonly canceled?: unknown; readonly path?: unknown; readonly filePaths?: unknown }
  if (record.canceled === true) return undefined
  if (typeof record.path === 'string' && record.path.trim() !== '') return record.path
  const first = Array.isArray(record.filePaths) ? record.filePaths[0] : undefined
  return typeof first === 'string' && first.trim() !== '' ? first : undefined
}

export async function pickHostDirectory(ctx: WorkspaceProbe | unknown): Promise<string | undefined> {
  const host = typeof globalThis !== 'undefined' ? (globalThis as { __DSH_DIRECTORY_PICKER__?: { pick?: () => Promise<unknown> } }).__DSH_DIRECTORY_PICKER__ : undefined
  if (host && typeof host.pick === 'function') {
    return parsePickedPath(await host.pick())
  }
  const uiWorkspace = probeService(ctx, 'uiWorkspace')
  if (uiWorkspace && typeof (uiWorkspace as { pickDirectory?: () => Promise<unknown> }).pickDirectory === 'function') {
    return parsePickedPath(await (uiWorkspace as { pickDirectory: () => Promise<unknown> }).pickDirectory())
  }
  const dialog = probeService(ctx, 'dialog')
  if (dialog && typeof (dialog as { pickDirectory?: () => Promise<unknown> }).pickDirectory === 'function') {
    return parsePickedPath(await (dialog as { pickDirectory: () => Promise<unknown> }).pickDirectory())
  }
  const workspaces = probeService(ctx, 'workspaces')
  if (workspaces && typeof (workspaces as { pickDirectory?: () => Promise<unknown> }).pickDirectory === 'function') {
    return parsePickedPath(await (workspaces as { pickDirectory: () => Promise<unknown> }).pickDirectory())
  }
  try {
    const directWorkspaces = (ctx as { workspaces?: { pickDirectory?: () => Promise<unknown> } })?.workspaces
    if (directWorkspaces && typeof directWorkspaces.pickDirectory === 'function') {
      return parsePickedPath(await directWorkspaces.pickDirectory())
    }
  } catch { /* ignore */ }
  throw new WorkspacePickerUnavailableError()
}

function method(owner: unknown, name: string): ((...args: unknown[]) => unknown) | undefined {
  if (owner === null || typeof owner !== 'object') return undefined
  const value = (owner as Record<string, unknown>)[name]
  return typeof value === 'function' ? value as (...args: unknown[]) => unknown : undefined
}

function pickedPath(value: unknown): string | undefined {
  return parsePickedPath(value)
}

function createdPath(value: unknown): string | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const record = value as { readonly path?: unknown; readonly cwd?: unknown }
  if (typeof record.path === 'string' && record.path.trim() !== '') return record.path
  if (typeof record.cwd === 'string' && record.cwd.trim() !== '') return record.cwd
  return undefined
}

/** 桌面壳把系统选目录暴露在这个全局对象上，设置弹窗里只能走它才会弹出窗口。 */
function nativeDirectoryPicker(): { pick(): Promise<string | null> } | undefined {
  const host = globalThis as { __DSH_DIRECTORY_PICKER__?: { pick?: unknown } }
  const pick = host.__DSH_DIRECTORY_PICKER__?.pick
  if (typeof pick !== 'function') return undefined
  return { pick: () => pick.call(host.__DSH_DIRECTORY_PICKER__) as Promise<string | null> }
}

export function hasHostDirectoryPicker(ctx: WorkspaceProbe | unknown): boolean {
  const host = typeof globalThis !== 'undefined' ? (globalThis as { __DSH_DIRECTORY_PICKER__?: { pick?: unknown } }).__DSH_DIRECTORY_PICKER__ : undefined
  if (host && typeof host.pick === 'function') return true
  const uiWorkspace = probeService(ctx, 'uiWorkspace')
  if (uiWorkspace && typeof (uiWorkspace as { pickDirectory?: unknown }).pickDirectory === 'function') return true
  const dialog = probeService(ctx, 'dialog')
  if (dialog && typeof (dialog as { pickDirectory?: unknown }).pickDirectory === 'function') return true
  const workspaces = probeService(ctx, 'workspaces')
  if (workspaces && typeof (workspaces as { pickDirectory?: unknown }).pickDirectory === 'function') return true
  try {
    const directWorkspaces = (ctx as { workspaces?: { pickDirectory?: unknown } })?.workspaces
    if (directWorkspaces && typeof directWorkspaces.pickDirectory === 'function') return true
  } catch { /* ignore */ }
  return false
}

/** 只探测选目录。桌面优先用原生窗口；否则再调宿主服务。照抄 IM pickHostDirectory。 */
export function resolveDirectoryPicker(ctx: WorkspaceProbe): { pickDirectory(): Promise<string | undefined> } | undefined {
  if (!hasHostDirectoryPicker(ctx)) return undefined
  return {
    async pickDirectory() {
      try {
        return await pickHostDirectory(ctx)
      } catch (err) {
        if (err instanceof WorkspacePickerUnavailableError || (err as { code?: string })?.code === 'workspace/picker-unavailable') {
          return undefined
        }
        throw err
      }
    },
  }
}

/** @deprecated 测试兼容。创建不再要求客户端 workspaces.create。 */
export function resolveHostWorkspaceCreator(ctx: WorkspaceProbe): HostWorkspaceCreator | undefined {
  const picker = resolveDirectoryPicker(ctx)
  if (picker === undefined) return undefined
  return {
    pickDirectory: () => picker.pickDirectory(),
    create(path: string) {
      return Promise.resolve({ path })
    },
  }
}

export async function addRegisteredWorkspace(input: {
  readonly creator: HostWorkspaceCreator
  readonly refresh: () => Promise<void>
  readonly listed: () => readonly { readonly id: string; readonly path: string }[]
}): Promise<string | undefined> {
  const picked = await input.creator.pickDirectory()
  if (picked === undefined) return undefined
  const created = await input.creator.create(picked)
  await input.refresh()
  return createdWorkspaceId(input.listed(), createdPath(created) ?? picked)
}
