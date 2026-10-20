import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createHostWorkspace,
  parsePickedPath,
  pickHostDirectory,
  probeService,
  resolveHostArchiveSession,
  WorkspacePickerUnavailableError,
} from '../src/client/workspace-create.ts'

test('probeService 先走 reflect.get，再走 ctx.get', () => {
  const calls: string[] = []
  const uiWorkspace = { openSession() {} }
  const ctx = {
    reflect: {
      get(name: string) {
        calls.push(`reflect:${name}`)
        return name === 'uiWorkspace' ? uiWorkspace : undefined
      },
    },
    get(name: string) {
      calls.push(`get:${name}`)
      return name === 'uiWorkspace' ? uiWorkspace : undefined
    },
  }
  assert.equal(probeService(ctx, 'uiWorkspace'), uiWorkspace)
  assert.equal(calls.at(0), 'reflect:uiWorkspace')
  // reflect 返回 undefined 时仍允许 get 兜底，但绝不回退到硬读属性
  assert.equal(probeService(ctx, 'workspaces'), undefined)
  assert.deepEqual(calls, ['reflect:uiWorkspace', 'reflect:workspaces', 'get:workspaces'])
})

test('probeService 未注入时吞掉反射异常，且不硬读属性', () => {
  const ctx = {
    get workspaces(): unknown {
      throw new Error('hard read')
    },
    reflect: {
      get() {
        throw new Error('not injected')
      },
    },
  }
  assert.equal(probeService(ctx, 'workspaces'), undefined)
})

test('probeService 没有反射面时才回退到 get 和属性读取', () => {
  assert.equal(probeService({ get: () => undefined }, 'dialog'), undefined)
  assert.deepEqual(probeService({ get: () => ({ a: 1 }) }, 'dialog'), { a: 1 })
  assert.deepEqual(probeService({ dialog: { b: 2 } }, 'dialog'), { b: 2 })
  assert.equal(probeService(null, 'dialog'), undefined)
  assert.equal(probeService('text', 'dialog'), undefined)
})

test('resolveHostArchiveSession 从宿主服务解析归档方法并保留 this', async () => {
  const calls: string[] = []
  const service = {
    marker: 'ui-workspace',
    archiveSession(this: { marker: string }, sessionId: string) {
      calls.push(`${this.marker}:${sessionId}`)
    },
  }
  const archiveSession = resolveHostArchiveSession({
    get: (name: string) => name === 'uiWorkspace' ? service : undefined,
  })

  assert.equal(typeof archiveSession, 'function')
  await archiveSession?.('session-1')
  assert.deepEqual(calls, ['ui-workspace:session-1'])
  assert.equal(resolveHostArchiveSession({ get: () => ({}) }), undefined)
})

test('parsePickedPath 统一解析字符串、path、filePaths 和取消状态', () => {
  assert.equal(parsePickedPath('D:/repo/app'), 'D:/repo/app')
  assert.equal(parsePickedPath({ path: 'D:/repo/app' }), 'D:/repo/app')
  assert.equal(parsePickedPath({ filePaths: ['D:/repo/app'] }), 'D:/repo/app')
  assert.equal(parsePickedPath({ canceled: true, path: 'D:/repo/app' }), undefined)
  assert.equal(parsePickedPath({ path: '   ' }), undefined)
  assert.equal(parsePickedPath({ filePaths: [] }), undefined)
  assert.equal(parsePickedPath(null), undefined)
  assert.equal(parsePickedPath(42), undefined)
})

test('pickHostDirectory 桌面原生窗口优先，取消即返回 undefined', async () => {
  const host = globalThis as { __DSH_DIRECTORY_PICKER__?: { pick(): Promise<string | null> } }
  const previous = host.__DSH_DIRECTORY_PICKER__
  let nativeCalls = 0
  let serviceCalls = 0
  const ctx = {
    get(name: string) {
      if (name !== 'uiWorkspace') return undefined
      return {
        pickDirectory() {
          serviceCalls += 1
          return 'D:/from-service'
        },
      }
    },
  }
  try {
    host.__DSH_DIRECTORY_PICKER__ = {
      async pick() {
        nativeCalls += 1
        return 'D:/work/app'
      },
    }
    assert.equal(await pickHostDirectory(ctx), 'D:/work/app')
    assert.equal(nativeCalls, 1)
    assert.equal(serviceCalls, 0)

    host.__DSH_DIRECTORY_PICKER__ = { async pick() { return null } }
    assert.equal(await pickHostDirectory(ctx), undefined)
    assert.equal(serviceCalls, 0)
  } finally {
    if (previous === undefined) delete host.__DSH_DIRECTORY_PICKER__
    else host.__DSH_DIRECTORY_PICKER__ = previous
  }
})

test('pickHostDirectory 依次回退 uiWorkspace、dialog、workspaces', async () => {
  const uiWorkspace = { pickDirectory: () => ({ path: 'D:/ui' }) }
  assert.equal(await pickHostDirectory({ get: (name: string) => (name === 'uiWorkspace' ? uiWorkspace : undefined) }), 'D:/ui')

  const dialog = { pickDirectory: () => 'D:/dialog' }
  assert.equal(await pickHostDirectory({ get: (name: string) => (name === 'dialog' ? dialog : undefined) }), 'D:/dialog')

  const workspaces = { pickDirectory: () => ({ filePaths: ['D:/workspaces'] }) }
  assert.equal(await pickHostDirectory({ get: (name: string) => (name === 'workspaces' ? workspaces : undefined) }), 'D:/workspaces')

  assert.equal(await pickHostDirectory({ workspaces: { pickDirectory: () => 'D:/direct' } }), 'D:/direct')
})

test('pickHostDirectory 一个选目录服务都没有时抛出可识别的错误', async () => {
  await assert.rejects(() => pickHostDirectory({ get: () => undefined }), WorkspacePickerUnavailableError)
  await assert.rejects(() => pickHostDirectory({ get: () => ({ create: () => undefined }) }), (caught: unknown) =>
    caught instanceof WorkspacePickerUnavailableError && caught.code === 'workspace/picker-unavailable')
})

test('createHostWorkspace 通过探测到的服务创建，失败只返回 false', async () => {
  const calls: unknown[] = []
  const service = {
    async create(input: { readonly path: string }) {
      calls.push(input)
      return { id: 'ws-1', path: input.path }
    },
  }
  assert.equal(await createHostWorkspace({ get: (name: string) => (name === 'workspaces' ? service : undefined) }, 'D:/repo/app'), true)
  assert.deepEqual(calls, [{ path: 'D:/repo/app' }])

  assert.equal(await createHostWorkspace({ get: () => ({}) }, 'D:/repo/app'), false)
  assert.equal(await createHostWorkspace({ get: () => ({ workspaces: { create() { throw new Error('exists') } } }) }, 'D:/repo/app'), false)
})
