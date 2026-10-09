/** 定时任务表单里新增工作区：只探测宿主服务，不硬读未注入的 ctx.workspaces。 */

export class AddedWorkspaceMissingError extends Error {
  constructor() {
    super('added-workspace-missing')
    this.name = 'AddedWorkspaceMissingError'
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

function probeService(ctx: WorkspaceProbe, name: string): unknown {
  const reflectGet = ctx.reflect?.get
  if (typeof reflectGet === 'function') {
    try { return reflectGet.call(ctx.reflect, name) } catch { /* 未提供时保持按钮可解释，不让点击崩掉 */ }
  }
  if (typeof ctx.get === 'function') {
    try { return ctx.get(name) } catch { /* 未注入时 Cordis get 也可能抛 */ }
  }
  return undefined
}

function method(owner: unknown, name: string): ((...args: unknown[]) => unknown) | undefined {
  if (owner === null || typeof owner !== 'object') return undefined
  const value = (owner as Record<string, unknown>)[name]
  return typeof value === 'function' ? value as (...args: unknown[]) => unknown : undefined
}

function pickedPath(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (value === null || typeof value !== 'object') return undefined
  const record = value as { readonly path?: unknown; readonly filePaths?: unknown; readonly canceled?: unknown }
  if (record.canceled === true) return undefined
  if (typeof record.path === 'string' && record.path.trim() !== '') return record.path
  const first = Array.isArray(record.filePaths) ? record.filePaths[0] : undefined
  return typeof first === 'string' && first.trim() !== '' ? first : undefined
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

/** 只探测选目录。桌面优先用原生窗口；否则再调宿主服务。 */
export function resolveDirectoryPicker(ctx: WorkspaceProbe): { pickDirectory(): Promise<string | undefined> } | undefined {
  const native = nativeDirectoryPicker()
  if (native !== undefined) {
    return {
      async pickDirectory() {
        return pickedPath(await native.pick())
      },
    }
  }
  const uiWorkspace = probeService(ctx, 'uiWorkspace')
  const dialog = probeService(ctx, 'dialog')
  const owner = method(uiWorkspace, 'pickDirectory') !== undefined ? uiWorkspace : dialog
  const pick = method(owner, 'pickDirectory')
  if (pick === undefined || owner === undefined) return undefined
  return {
    async pickDirectory() {
      return pickedPath(await (owner as { pickDirectory(): Promise<unknown> }).pickDirectory())
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
