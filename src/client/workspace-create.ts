/** 定时任务表单里新增工作区：只探测宿主服务，不硬读未注入的 ctx.workspaces。 */

export class WorkspacePickerUnavailableError extends Error {
  readonly code = 'workspace/picker-unavailable'
  constructor() {
    super('workspace picker unavailable')
    this.name = 'WorkspacePickerUnavailableError'
  }
}

/** 反射读成员：只接受对象，避免在未校验的形状上做断言访问。 */
function readMember(owner: unknown, key: string): unknown {
  if (owner === null || (typeof owner !== 'object' && typeof owner !== 'function')) return undefined
  try {
    return Reflect.get(owner, key)
  } catch {
    return undefined
  }
}

/**
 * 在运行期探测宿主服务。Cordis 未 inject 时直接读属性会抛，所以先走 reflect.get，
 * 再走 ctx.get；两者都不可用时才回退到普通属性读取。
 * reflect.get 存在却返回 undefined 时不越过它硬读属性，避免读未注入的服务。
 */
export function probeService(ctx: unknown, name: string): unknown {
  if (ctx === null || typeof ctx !== 'object') return undefined
  let reflect: unknown
  try {
    reflect = Reflect.get(ctx, 'reflect')
  } catch {
    reflect = undefined
  }
  const reflectGet = readMember(reflect, 'get')
  if (typeof reflectGet === 'function') {
    try {
      const found = reflectGet.call(reflect, name)
      if (found !== undefined) return found
    } catch { /* 未注入时不硬读 ctx[name]，改走 get */ }
  }
  const get = readMember(ctx, 'get')
  if (typeof get === 'function') {
    try {
      const found = get.call(ctx, name)
      if (found !== undefined) return found
    } catch {
      return undefined
    }
  }
  if (typeof reflectGet === 'function') return undefined
  try {
    return readMember(ctx, name)
  } catch {
    return undefined
  }
}

/** 统一解析宿主选目录的返回值：字符串、{ path }、{ filePaths }，取消则 undefined。 */
export function parsePickedPath(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (value === null || typeof value !== 'object') return undefined
  if (Reflect.get(value, 'canceled') === true) return undefined
  const path = Reflect.get(value, 'path')
  if (typeof path === 'string' && path.trim() !== '') return path
  const filePaths = Reflect.get(value, 'filePaths')
  const first = Array.isArray(filePaths) ? filePaths[0] : undefined
  return typeof first === 'string' && first.trim() !== '' ? first : undefined
}

/** undefined 表示该服务根本没有选目录方法；对象表示调用过，picked 可能被用户取消。 */
type PickedDirectory = { readonly picked: string | undefined }

async function pickThroughService(service: unknown): Promise<PickedDirectory | undefined> {
  const pick = readMember(service, 'pickDirectory')
  if (typeof pick !== 'function') return undefined
  return { picked: parsePickedPath(await pick.call(service)) }
}

/** 让宿主登记工作区；宿主没有该方法或拒绝时返回 false，调用方改走运行时登记。 */
export async function createHostWorkspace(ctx: unknown, path: string): Promise<boolean> {
  const service = probeService(ctx, 'workspaces')
  const create = readMember(service, 'create')
  if (typeof create !== 'function') return false
  try {
    await create.call(service, { path })
    return true
  } catch {
    return false
  }
}

/**
 * 选目录：桌面壳的原生窗口优先，其次依次尝试宿主暴露的选目录服务。
 * 一个都不存在时抛 WorkspacePickerUnavailableError，让调用方决定如何提示。
 */
export async function pickHostDirectory(ctx: unknown): Promise<string | undefined> {
  let host: unknown
  try {
    host = Reflect.get(globalThis, '__DSH_DIRECTORY_PICKER__')
  } catch {
    host = undefined
  }
  const nativePick = readMember(host, 'pick')
  if (typeof nativePick === 'function') {
    return parsePickedPath(await nativePick.call(host))
  }
  for (const name of ['uiWorkspace', 'dialog', 'workspaces']) {
    const picked = await pickThroughService(probeService(ctx, name))
    if (picked !== undefined) return picked.picked
  }
  try {
    const direct = await pickThroughService(readMember(ctx, 'workspaces'))
    if (direct !== undefined) return direct.picked
  } catch { /* 未注入时读属性会抛，忽略即可 */ }
  throw new WorkspacePickerUnavailableError()
}
