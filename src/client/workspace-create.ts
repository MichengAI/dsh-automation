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

/** 只探测选目录。新建走 Host RPC，不因为客户端没有 workspaces.create 就把按钮禁用。 */
export function resolveDirectoryPicker(ctx: WorkspaceProbe): { pickDirectory(): Promise<string | undefined> } | undefined {
  const uiWorkspace = probeService(ctx, 'uiWorkspace')
  const dialog = probeService(ctx, 'dialog')
  const pick = method(uiWorkspace, 'pickDirectory') ?? method(dialog, 'pickDirectory')
  const owner = method(uiWorkspace, 'pickDirectory') === undefined ? dialog : uiWorkspace
  if (pick === undefined) return undefined
  return {
    async pickDirectory() {
      return pickedPath(await pick.call(owner))
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
