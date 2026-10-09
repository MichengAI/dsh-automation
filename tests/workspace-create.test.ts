import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AddedWorkspaceMissingError,
  addRegisteredWorkspace,
  createdWorkspaceId,
  resolveDirectoryPicker,
  resolveHostWorkspaceCreator,
  workspaceIdForPath,
} from '../src/client/workspace-create.ts'

test('新建后按路径匹配已登记工作区，斜杠和大小写不分开', () => {
  const listed = [{ id: 'ws-1', path: 'D:/work/demo' }]
  assert.equal(workspaceIdForPath(listed, 'D:\\work\\demo\\'), 'ws-1')
  assert.equal(createdWorkspaceId(listed, 'd:/work/demo'), 'ws-1')
})

test('刷新后仍不在登记表里就失败，不能选一个未登记目录', () => {
  assert.throws(() => createdWorkspaceId([], 'D:/DeepSeekHarness/Data/profiles/desktop'), AddedWorkspaceMissingError)
})

test('取消选目录不创建；创建后用刷新结果选中', async () => {
  let created = ''
  const creator = {
    async pickDirectory() { return undefined as string | undefined },
    async create(path: string) { created = path; return { path } },
  }
  assert.equal(await addRegisteredWorkspace({
    creator,
    refresh: async () => undefined,
    listed: () => [],
  }), undefined)
  assert.equal(created, '')

  creator.pickDirectory = async () => 'D:\\repo\\app'
  let refreshed = false
  const id = await addRegisteredWorkspace({
    creator,
    refresh: async () => { refreshed = true },
    listed: () => refreshed ? [{ id: 'new', path: 'D:/repo/app' }] : [],
  })
  assert.equal(id, 'new')
})

test('不硬读未注入的 workspaces，只探测 reflect/get', async () => {
  const ctx = {
    get workspaces(): unknown { throw new Error('hard read') },
    get(name: string): unknown {
      if (name === 'uiWorkspace') return { pickDirectory: () => 'D:/repo/app' }
      if (name === 'workspaces') return { create: (input: { path: string }) => ({ path: input.path }) }
      return undefined
    },
  }
  const creator = resolveHostWorkspaceCreator(ctx)
  assert.ok(creator)
  assert.equal(await creator.pickDirectory(), 'D:/repo/app')
  assert.deepEqual(await creator.create('D:/repo/app'), { path: 'D:/repo/app' })
  assert.equal(resolveHostWorkspaceCreator({ get: () => undefined }), undefined)
})

test('桌面原生选目录会弹出，取消则不创建', async () => {
  const host = globalThis as { __DSH_DIRECTORY_PICKER__?: { pick(): Promise<string | null> } }
  const previous = host.__DSH_DIRECTORY_PICKER__
  let nativeCalls = 0
  host.__DSH_DIRECTORY_PICKER__ = {
    async pick() {
      nativeCalls += 1
      return 'D:/work/app'
    },
  }
  try {
    const picker = resolveDirectoryPicker({
      get() { throw new Error('should not use the in-app picker') },
    })
    assert.equal(await picker?.pickDirectory(), 'D:/work/app')
    assert.equal(nativeCalls, 1)
    host.__DSH_DIRECTORY_PICKER__ = { async pick() { return null } }
    assert.equal(await resolveDirectoryPicker({})?.pickDirectory(), undefined)
  } finally {
    if (previous === undefined) delete host.__DSH_DIRECTORY_PICKER__
    else host.__DSH_DIRECTORY_PICKER__ = previous
  }
})
