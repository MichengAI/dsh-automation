import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTOMATION_SESSION_PREFIX,
  collectScheduledSessionIds,
  deriveTaskOverviewRows,
  isAutomationSidebarSession,
  groupScheduledSessions,
  keepScheduledSessionLink,
  scheduledSessionVisible,
  scheduledSessionNeedsSnapshotRefresh,
  scheduledSessionTitle,
  sessionUpdatedAtIso,
  canOpenClientSession,
  ensureOpenScheduledSession,
  openClientSession,
  openScheduledSession,
  resolveClientSessionOpenAccess,
  resolveCurrentSessionId,
  hasCodexUiSidebar,
  readNativeSidebarTab,
  filterTaskSessionState,
  filterWorkspaceListState,
  isMarkedWorkspaceWrapper,
  pickWrappableWorkspacesEntry,
  resolveOfficialTreeComponent,
  applyWorkspaceBrowserQuery,
  groupScheduledSessionsByWorkspaceTree,
  owningParentFolder,
  ownedSidebarTabIds,
  resolveVisibleSidebarTab,
  shouldFollowSessionTab,
  tabForSessionId,
  scheduledOnlySessionState,
  scheduledRealWorkspaceState,
  syntheticTaskWorkspaceState,
  automationTaskWorkspaceId,
  automationIdFromTaskWorkspaceId,
} from '../src/client/schedule-rail-model.ts'
import { createRecordsViewStore } from '../src/client/records-view-store.ts'

test('当前会话没变时不要抢用户点的定时页签', () => {
  assert.equal(shouldFollowSessionTab('im:wecom:1', 'im:wecom:1'), false)
  assert.equal(shouldFollowSessionTab('im:wecom:1', 'im:wecom:2'), true)
  assert.equal(shouldFollowSessionTab(null, 'im:wecom:1'), true)
  assert.equal(shouldFollowSessionTab('im:wecom:1', null), false)
})

test('自己做宿主时定时页签不依赖协作注册表', () => {
  assert.deepEqual(ownedSidebarTabIds({ extraTabIds: ['channels'], channelsReady: true }), ['tasks', 'channels', 'schedule'])
  assert.deepEqual(ownedSidebarTabIds({ extraTabIds: ['schedule', 'channels'], channelsReady: false }), ['tasks', 'channels', 'schedule'])
  assert.deepEqual(ownedSidebarTabIds({ extraTabIds: [], channelsReady: false }), ['tasks', 'schedule'])
})

test('频道若已作为协作页签注册，即使 slot 未就绪也不能打回任务', () => {
  assert.equal(resolveVisibleSidebarTab({ tab: 'channels', channelsReady: false, extraTabIds: ['channels', 'schedule'] }), 'channels')
  assert.equal(resolveVisibleSidebarTab({ tab: 'schedule', channelsReady: false, extraTabIds: ['channels', 'schedule'] }), 'schedule')
  assert.equal(resolveVisibleSidebarTab({ tab: 'channels', channelsReady: false, extraTabIds: ['schedule'] }), 'tasks')
  assert.equal(resolveVisibleSidebarTab({ tab: 'channels', channelsReady: true, extraTabIds: [] }), 'channels')
  assert.equal(resolveVisibleSidebarTab({ tab: 'tasks', channelsReady: false, extraTabIds: ['channels'] }), 'tasks')
})

test('已注销的协作页签回落到任务页，避免分段页签没有选中项', () => {
  assert.equal(resolveVisibleSidebarTab({ tab: 'im-removed', channelsReady: false, extraTabIds: ['channels', 'schedule'] }), 'tasks')
  assert.equal(resolveVisibleSidebarTab({ tab: 'stale-foreign-tab', channelsReady: true, extraTabIds: ['tasks', 'channels', 'schedule'] }), 'tasks')
})
test('schedule rail groups runs by task name', () => {
  const groups = groupScheduledSessions(
    [
      { id: 'a1', name: 'auto-report', timeZone: 'Asia/Shanghai' },
      { id: 'a2', name: 'empty' },
    ],
    [
      { automationId: 'a1', sessionId: AUTOMATION_SESSION_PREFIX + '1', status: 'running', startedAt: '2026-08-16T02:30:00.000Z', scheduledFor: '2026-08-16T02:30:00.000Z' },
      { automationId: 'a1', sessionId: AUTOMATION_SESSION_PREFIX + '2', status: 'succeeded', startedAt: '2026-08-15T02:30:00.000Z', scheduledFor: '2026-08-15T02:30:00.000Z' },
      { automationId: 'a1', status: 'failed', scheduledFor: '2026-08-14T02:30:00.000Z' },
      { automationId: 'a2', status: 'queued', scheduledFor: '2026-08-16T03:00:00.000Z' },
    ],
  )
  assert.equal(groups.length, 1)
  assert.equal(groups[0]?.name, 'auto-report')
  assert.equal(groups[0]?.sessions.length, 2)
  assert.equal(groups[0]?.sessions[0]?.running, true)
  assert.equal(groups[0]?.sessions[0]?.label, '2026-08-16 10:30 - auto-report')
})

test('任务总览包含从未运行的任务并保留下次执行时间', () => {
  const rows = deriveTaskOverviewRows(
    [
      { id: 'a1', name: 'ran', status: 'active', nextRunAt: '2026-08-20T09:00:00+08:00' },
      { id: 'a2', name: 'never', status: 'paused' },
    ],
  )
  assert.equal(rows.length, 2)
  assert.equal(rows[0]?.nextRunAt, '2026-08-20T09:00:00+08:00')
  assert.equal(rows[1]?.nextRunAt, undefined)
})

test('任务树按前缀和定时标题隐藏自动化会话', () => {
  assert.equal(isAutomationSidebarSession('dsh-automation-session-abc'), true)
  assert.equal(isAutomationSidebarSession('chat-1', { id: 'chat-1', displayTitle: '2026-08-18 09:40 - 给我报表信息' }), true)
  assert.equal(isAutomationSidebarSession('chat-1', { id: 'chat-1', title: '审查本项目代码' }), false)
})
test('native tabs follow session prefixes and detect Codex UI sidebar', () => {
  assert.equal(readNativeSidebarTab('schedule'), 'schedule')
  assert.equal(readNativeSidebarTab('nope'), 'tasks')
  assert.equal(tabForSessionId(AUTOMATION_SESSION_PREFIX + 'abc'), 'schedule')
  assert.equal(tabForSessionId('im:wecom:1'), 'channels')
  assert.equal(tabForSessionId('chat-1'), 'tasks')
  assert.equal(hasCodexUiSidebar([{ options: { locale: 'michengai.codexUi' } }]), true)
  assert.equal(hasCodexUiSidebar([{ options: { locale: 'sidebar' } }]), false)
})

test('过滤结果必须保持同一引用，避免任务页卡死', () => {
  const state = { ids: ['chat-1', 'dsh-automation-session-1'], byId: { 'chat-1': { id: 'chat-1' }, 'dsh-automation-session-1': { id: 'dsh-automation-session-1' } } }
  const first = filterTaskSessionState(state)
  const second = filterTaskSessionState(state)
  assert.equal(first, second)
  const clean = { ids: ['chat-1'], byId: { 'chat-1': { id: 'chat-1' } } }
  assert.equal(filterTaskSessionState(clean), clean)
})

test('工作区列表过滤必须保持引用稳定，避免任务树重绘卡死', () => {
  const state = { items: [{ id: 'ws', sessionIds: ['chat-1', 'im:1'] }], archivedSessionIds: [] }
  const first = filterWorkspaceListState(state)
  const second = filterWorkspaceListState(state)
  assert.equal(first, second)
  const clean = { items: [{ id: 'ws', sessionIds: ['chat-1'] }], archivedSessionIds: [] }
  assert.equal(filterWorkspaceListState(clean), clean)
})

test('official task tree hides automation and im sessions', () => {
  const filtered = filterTaskSessionState({
    ids: ['chat-1', AUTOMATION_SESSION_PREFIX + '1', 'im:wecom:1'],
    byId: {
      'chat-1': { id: 'chat-1' },
      [AUTOMATION_SESSION_PREFIX + '1']: { id: AUTOMATION_SESSION_PREFIX + '1' },
      'im:wecom:1': { id: 'im:wecom:1' },
    },
  }, new Set([AUTOMATION_SESSION_PREFIX + '1']))
  if (filtered.ids === undefined) throw new Error('missing ids')
  if (filtered.ids.length !== 1 || filtered.ids[0] !== 'chat-1') throw new Error('filter failed')
})


test('从定时页移除后，任务树仍不展示自动化会话', () => {
  const autoId = AUTOMATION_SESSION_PREFIX + 'kept'
  assert.deepEqual([...collectScheduledSessionIds([{ sessionId: autoId }, { sessionId: null }])], [autoId])
  const filtered = filterTaskSessionState({
    ids: ['chat-1', autoId],
    byId: {
      'chat-1': { id: 'chat-1' },
      [autoId]: { id: autoId, title: 'forgotten-run' },
    },
  }, new Set())
  if (filtered.ids === undefined || filtered.ids.includes(autoId)) throw new Error('automation session must stay off the task tree')
  assert.equal(tabForSessionId(autoId, new Set()), 'tasks')
  assert.equal(tabForSessionId(autoId, new Set([autoId])), 'schedule')
})
test('workspace wrap skips this plugin shell and keeps official occupant', () => {
  const official = { options: { id: 'workspace-browser' }, component: function WorkspaceBrowser() { return null } }
  const wrapped = { options: { id: 'dsh-automation-wrap-bump' }, component: function AutomationWrapBump() { return null } }
  const picked = pickWrappableWorkspacesEntry([wrapped, official])
  if (picked !== official) throw new Error('did not pick official tree')
})

test('already wrapped official trees are not wrapped again', () => {
  function Wrapped() { return null }
  Wrapped.__dshAutomationWrapped = true
  const official = { options: { id: 'workspace-browser' }, component: Wrapped }
  if (isMarkedWorkspaceWrapper(Wrapped) !== true) throw new Error('missing wrap mark')
  if (pickWrappableWorkspacesEntry([official]) !== undefined) throw new Error('should skip wrapped occupant')
})

test('im-connect wrap can be unwrapped back to official tree', () => {
  function Official() { return null }
  function ImShell() { return null }
  ImShell.__imConnectWrapped = true
  ImShell.__imConnectOriginal = Official
  const picked = pickWrappableWorkspacesEntry([{ options: { id: 'im' }, component: ImShell }])
  if (picked === undefined) throw new Error('should pick im-connect occupant so we can add schedule tab')
  if (resolveOfficialTreeComponent(ImShell) !== Official) throw new Error('should recover official tree')
})

test('walks nested wrap chain back to official tree', () => {
  function Official() { return null }
  function OurShell() { return null }
  function ImShell() { return null }
  OurShell.__dshAutomationWrapped = true
  OurShell.__dshAutomationOriginal = Official
  ImShell.__imConnectWrapped = true
  ImShell.__imConnectOriginal = OurShell
  if (resolveOfficialTreeComponent(ImShell) !== Official) throw new Error('should unwrap to official')
})

test('scheduled sessions open through the runtime, not the filtered host tree', () => {
  const opened: string[] = []
  const host: string[] = []
  openScheduledSession('dsh-automation-session-abc', (id) => { opened.push(id) }, (id) => { host.push(id) })
  openScheduledSession('im:wecom:1', (id) => { opened.push(id) }, (id) => { host.push(id) })
  openScheduledSession('normal-session', (id) => { opened.push(id) }, (id) => { host.push(id) })
  assert.deepEqual(opened, ['dsh-automation-session-abc', 'im:wecom:1'])
  assert.deepEqual(host, ['normal-session'])
})
test('scheduled session open falls back to host when runtime select rejects', () => {
  const host: string[] = []
  openScheduledSession('dsh-automation-session-abc', () => { throw new Error('sessions.select: unknown session') }, (id) => { host.push(id) })
  assert.deepEqual(host, ['dsh-automation-session-abc'])
})


test('打开定时会话前先挂载并刷新，未入簿时不会空点', async () => {
  const steps: string[] = []
  let listed = false
  await ensureOpenScheduledSession({
    id: 'dsh-automation-session-abc',
    adopt: async (id) => { steps.push('adopt:' + id) },
    listed: () => listed,
    refresh: async () => { steps.push('refresh'); listed = true },
    openRuntime: (id) => {
      if (!listed) throw new Error('sessions.select: unknown session ' + id)
      steps.push('open:' + id)
    },
  })
  assert.deepEqual(steps, ['adopt:dsh-automation-session-abc', 'refresh', 'open:dsh-automation-session-abc'])
})

test('忽略已删除的 list.current，只按 retainedBy.mainView 反查主视图会话', () => {
  assert.equal(resolveCurrentSessionId({
    byId: {
      parked: { retainedBy: {} },
      main: { id: 'main-view', retainedBy: { mainView: 1 } },
    },
  }), 'main-view')
  assert.equal(resolveCurrentSessionId({
    byId: { parked: { retainedBy: {} } },
  }), null)
  assert.equal(resolveCurrentSessionId({
    current: 'legacy-current',
    byId: { main: { id: 'main-view', retainedBy: { mainView: 1 } } },
  } as never), 'main-view')
})

test('打开定时会话走官方 uiWorkspace.openSession', () => {
  const opened: string[] = []
  openClientSession({
    uiWorkspace: { openSession: (id) => { opened.push(id) } },
  }, 'dsh-automation-session-abc')
  assert.deepEqual(opened, ['dsh-automation-session-abc'])
})

test('没有 uiWorkspace 时不能打开，交给宿主兜底', () => {
  assert.equal(canOpenClientSession({}), false)
  assert.throws(
    () => openClientSession({}, 'dsh-automation-session-abc'),
    /no client session opener/,
  )
})

test('未注入 uiWorkspace 时从 ctx.get 取官方 openSession', () => {
  const opened: string[] = []
  const access = resolveClientSessionOpenAccess({
    get: (name) => name === 'uiWorkspace' ? { openSession: (id: string) => { opened.push(id) } } : undefined,
  })
  assert.equal(typeof access.uiWorkspace?.openSession, 'function')
  assert.equal(canOpenClientSession(access), true)
  openClientSession(access, 'dsh-automation-session-abc')
  assert.deepEqual(opened, ['dsh-automation-session-abc'])
})

test('读取 ctx.uiWorkspace 抛 without inject 时改走 reflect.get', () => {
  const opened: string[] = []
  const ctx = {
    get uiWorkspace(): { openSession(id: string): void } { throw new Error('cannot get property "uiWorkspace" without inject') },
    get: () => { throw new Error('should prefer reflect.get') },
    reflect: { get: (name: string) => name === 'uiWorkspace' ? { openSession: (id: string) => { opened.push(id) } } : undefined },
  }
  const access = resolveClientSessionOpenAccess(ctx)
  openClientSession(access, 'dsh-automation-session-abc')
  assert.deepEqual(opened, ['dsh-automation-session-abc'])
})

test('reflect.get 与 get 都在时优先 reflect.get', () => {
  const viaReflect: string[] = []
  const viaGet: string[] = []
  const access = resolveClientSessionOpenAccess({
    get: (name) => name === 'uiWorkspace' ? { openSession: (id: string) => { viaGet.push(id) } } : undefined,
    reflect: { get: (name) => name === 'uiWorkspace' ? { openSession: (id: string) => { viaReflect.push(id) } } : undefined },
  })
  openClientSession(access, 'dsh-automation-session-abc')
  assert.deepEqual(viaReflect, ['dsh-automation-session-abc'])
  assert.deepEqual(viaGet, [])
})

test('刷新后仍未入簿则回退到宿主打开', async () => {
  const steps: string[] = []
  await ensureOpenScheduledSession({
    id: 'dsh-automation-session-abc',
    adopt: async () => { steps.push('adopt') },
    listed: () => false,
    refresh: async () => { steps.push('refresh') },
    openRuntime: () => { throw new Error('sessions.select: unknown session') },
    openHost: (id) => { steps.push('host:' + id) },
  })
  assert.deepEqual(steps, ['adopt', 'refresh', 'host:dsh-automation-session-abc'])
})
test('定时会话标题优先用真实 Session 名，和任务树一致', () => {
  assert.equal(scheduledSessionTitle('集成本地Agents到dsh评估', '2026-08-17 01:37 - 哈哈哈'), '集成本地Agents到dsh评估')
  assert.equal(scheduledSessionTitle('   ', '2026-08-17 01:37 - 哈哈哈'), '2026-08-17 01:37 - 哈哈哈')
  assert.equal(sessionUpdatedAtIso('2026-08-17T01:37:00.000Z', 'fallback'), '2026-08-17T01:37:00.000Z')
  assert.equal(sessionUpdatedAtIso(undefined, 'fallback'), 'fallback')
})

test('删除任务后仍保留会话文件夹', () => {
  const groups = groupScheduledSessions([], [
    {
      automationId: 'gone',
      automationName: '哈哈哈',
      sessionId: AUTOMATION_SESSION_PREFIX + 'keep',
      status: 'succeeded',
      startedAt: '2026-08-17T01:37:00.000Z',
      scheduledFor: '2026-08-17T01:37:00.000Z',
    },
  ])
  assert.equal(groups.length, 1)
  assert.equal(groups[0]?.id, 'gone')
  assert.equal(groups[0]?.name, '哈哈哈')
  assert.equal(groups[0]?.sessions.length, 1)
})



test('工作区搜索按名称过滤，筛选可按时间或名称排序', () => {
  const groups = [
    { name: '报表', sessions: [{ title: '早报', updatedAt: '2026-08-18T01:00:00.000Z' }] },
    { name: '审查', sessions: [{ title: '代码', updatedAt: '2026-08-18T03:00:00.000Z' }] },
  ]
  assert.deepEqual(applyWorkspaceBrowserQuery(groups, '审', 'manual').map((item) => item.name), ['审查'])
  assert.deepEqual(applyWorkspaceBrowserQuery(groups, '', 'time').map((item) => item.name), ['审查', '报表'])
  assert.deepEqual(applyWorkspaceBrowserQuery(groups, '', 'manual').map((item) => item.name), ['报表', '审查'])
  assert.equal(applyWorkspaceBrowserQuery(groups, '', 'time', 'list').length, 1)
  assert.equal(applyWorkspaceBrowserQuery(groups, '', 'time', 'list')[0]?.sessions.length, 2)
})


test('定时页只立刻隐藏已归档会话，宿主会话簿滞后时仍显示新执行记录', () => {
  const archived = new Set(['gone-archived'])
  const present = new Set(['older-session'])
  assert.equal(keepScheduledSessionLink('brand-new-run', archived, present), true)
  assert.equal(keepScheduledSessionLink('gone-archived', archived, present), false)
  assert.equal(keepScheduledSessionLink('unknown-but-no-presence-map', archived), true)
  assert.equal(keepScheduledSessionLink('', archived, present), false)
})

test('归档筛选对齐会话列表，定时列表不把置顶排到前面', () => {
  const archived = new Set(['gone'])
  assert.equal(scheduledSessionVisible('live', archived, 'default'), true)
  assert.equal(scheduledSessionVisible('gone', archived, 'default'), false)
  assert.equal(scheduledSessionVisible('gone', archived, 'show'), true)
  assert.equal(scheduledSessionVisible('live', archived, 'only'), false)
  assert.equal(scheduledSessionVisible('gone', archived, 'only'), true)
  assert.equal(scheduledSessionVisible('', archived, 'show'), false)
})

test('按工作区树把子目录挂到路径最长的父工作区下', () => {
  assert.equal(owningParentFolder('D:/repo/plugin', ['D:/repo', 'D:/other']), 'D:/repo')
  assert.equal(owningParentFolder('D:/repo', ['D:/repo']), undefined)
  const groups = groupScheduledSessionsByWorkspaceTree(
    [{ id: 'run-child' }],
    [
      { workspaceId: 'parent', title: 'repo', path: 'D:/repo', sessionIds: [] },
      { workspaceId: 'child', title: 'plugin', path: 'D:/repo/plugin', sessionIds: ['run-child'] },
    ],
    '未分组',
  )
  assert.deepEqual(groups.map((group) => [group.name, group.depth, group.sessions.map((session) => session.id)]), [
    ['repo', 0, []],
    ['plugin', 1, ['run-child']],
  ])
})

test('当前已打开的定时会话若还没进快照，应立刻再拉一次执行记录', () => {
  assert.equal(scheduledSessionNeedsSnapshotRefresh('dsh-automation-session-new', []), true)
  assert.equal(scheduledSessionNeedsSnapshotRefresh('dsh-automation-session-new', [{ sessionId: 'dsh-automation-session-new' }]), false)
  assert.equal(scheduledSessionNeedsSnapshotRefresh('chat-1', []), false)
  assert.equal(scheduledSessionNeedsSnapshotRefresh(null, []), false)
})

test('官方任务树保留定时会话，只过滤 IM 会话', () => {
  const state = {
    ids: ['dsh-automation-session-a', 'im:wecom:1', 'normal'],
    byId: {
      'dsh-automation-session-a': { id: 'dsh-automation-session-a', title: '2026-10-19 12:00 - 巡检' },
      'normal': { id: 'normal', title: '普通会话' },
    },
  }
  assert.deepEqual(filterTaskSessionState(state, new Set(), { includeScheduled: true }).ids, ['dsh-automation-session-a', 'normal'])
  const workspaces = { items: [{ workspaceId: 'w', sessionIds: ['dsh-automation-session-a', 'im:wecom:1', 'normal'] }] }
  assert.deepEqual(
    filterWorkspaceListState(workspaces, new Set(), { includeScheduled: true }).items?.[0]?.sessionIds,
    ['dsh-automation-session-a', 'normal'],
  )
})

test('记录视图只保留定时会话，并保留源快照的启动状态', () => {
  const state = {
    phase: 'ready' as const,
    ids: ['dsh-automation-session-a', 'normal'],
    byId: {
      'dsh-automation-session-a': { id: 'dsh-automation-session-a' },
      'normal': { id: 'normal' },
    },
  }
  const result = scheduledOnlySessionState(state, new Set(['dsh-automation-session-a']))
  assert.deepEqual(result.ids, ['dsh-automation-session-a'])
  assert.deepEqual(Object.keys(result.byId ?? {}), ['dsh-automation-session-a'])
  assert.equal(result.phase, 'ready')
})

test('记录视图把自动化任务合成为官方工作区分组', () => {
  const source = {
    items: [{ workspaceId: 'real', sessionIds: ['normal'] }],
    archivedSessionIds: ['archived'],
    pinnedSessionIds: ['dsh-automation-session-a'],
    phase: 'ready' as const,
    state: 'idle' as const,
  }
  const groups = [{
    id: 'task-1',
    name: '每日巡检',
    sessionIds: ['dsh-automation-session-a'],
    createdAt: '2026-10-19T00:00:00.000Z',
  }]
  const result = syntheticTaskWorkspaceState(source, groups)
  assert.deepEqual(result.items, [{
    workspaceId: automationTaskWorkspaceId('task-1'),
    id: automationTaskWorkspaceId('task-1'),
    title: '每日巡检',
    path: '',
    sessionIds: ['dsh-automation-session-a'],
    createdAt: '2026-10-19T00:00:00.000Z',
    updatedAt: '2026-10-19T00:00:00.000Z',
  }])
  assert.equal(result.phase, 'ready')
  assert.deepEqual(result.archivedSessionIds, ['archived'])
  assert.deepEqual(result.pinnedSessionIds, ['dsh-automation-session-a'])
  assert.equal(syntheticTaskWorkspaceState(source, groups), result)
  assert.equal(automationIdFromTaskWorkspaceId(automationTaskWorkspaceId('task-1')), 'task-1')
  assert.equal(automationIdFromTaskWorkspaceId('real-workspace'), undefined)
})

test('定时会话不再自动切到定时页签', () => {
  const scheduled = new Set(['dsh-automation-session-a'])
  assert.equal(tabForSessionId('dsh-automation-session-a', scheduled, { followSchedule: false }), undefined)
  assert.equal(tabForSessionId('dsh-automation-session-a', scheduled), 'schedule')
  assert.equal(tabForSessionId('im:wecom:1', scheduled, { followSchedule: false }), 'channels')
})

test('记录视图按真实工作区分组时只保留定时会话，但保留工作区', () => {
  const source = {
    items: [
      { workspaceId: 'work', title: 'repo', path: 'D:/repo', sessionIds: ['dsh-automation-session-a', 'normal'] },
      { workspaceId: 'empty', title: 'other', path: 'D:/other', sessionIds: ['normal'] },
    ],
    archivedSessionIds: [],
    pinnedSessionIds: [],
    phase: 'ready' as const,
    state: 'idle' as const,
  }
  const result = scheduledRealWorkspaceState(source, new Set(['dsh-automation-session-a']), 'default')
  assert.deepEqual(result.items, [
    { workspaceId: 'work', title: 'repo', path: 'D:/repo', sessionIds: ['dsh-automation-session-a'] },
    { workspaceId: 'empty', title: 'other', path: 'D:/other', sessionIds: [] },
  ])
  assert.equal(result.phase, 'ready')
  assert.equal(result.state, 'idle')
})

test('记录视图默认按定时任务分组，可切换到按工作区，并默认展开新分组', () => {
  const store = createRecordsViewStore()
  assert.equal(store.getSnapshot().groupBy, 'task')
  store.actions.setGroupBy('workspace')
  assert.equal(store.getSnapshot().groupBy, 'workspace')
  store.actions.ensureExpanded(['group-a', 'group-b'])
  assert.equal(store.getSnapshot().groupExpansion['group-a'], true)
  assert.equal(store.getSnapshot().groupExpansion['group-b'], true)
  store.actions.setGroupExpanded('group-a', false)
  store.actions.ensureExpanded(['group-a'])
  assert.equal(store.getSnapshot().groupExpansion['group-a'], false)
  store.actions.setSessionOrder('gone', ['session-a'], {})
  store.actions.retainAccountKeys(['group-a', 'group-b'])
  assert.equal(store.getSnapshot().groupExpansion['group-a'], false)
  assert.equal(store.getSnapshot().groupExpansion['group-b'], true)
  assert.equal(store.getSnapshot().sessionOrderByAccount.gone, undefined)
})
