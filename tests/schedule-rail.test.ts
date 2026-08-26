import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTOMATION_SESSION_PREFIX,
  collectScheduledSessionIds,
  deriveTaskOverviewRows,
  isAutomationSidebarSession,
  formatRunStamp,
  groupNativeTaskSessions,
  groupScheduledSessions,
  keepScheduledSessionLink,
  scheduledSessionTitle,
  sessionUpdatedAtIso,
  ensureOpenScheduledSession,
  openScheduledSession,
  hasCodexUiSidebar,
  isNativeTaskSession,
  readNativeSidebarTab,
  filterTaskSessionState,
  filterWorkspaceListState,
  isMarkedWorkspaceWrapper,
  pickWrappableWorkspacesEntry,
  resolveOfficialTreeComponent,
  applyWorkspaceBrowserQuery,
  ownedSidebarTabIds,
  resolveVisibleSidebarTab,
  shouldFollowSessionTab,
  tabForSessionId,
} from '../src/client/schedule-rail-model.ts'
import { relativeTime, nextOpenSessionMenuId, nextOpenSessionMenu, shouldCloseNativeSessionMenu, nativeSessionMenuStyle, nativeSessionHoverStyle, pointerPoint, clampMenuPoint, } from '../src/client/native-session-menu.ts'


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
test('schedule rail groups runs by task name', () => {
  const groups = groupScheduledSessions(
    [
      { id: 'a1', name: 'auto-report' },
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
  assert.ok((groups[0]?.sessions[0]?.label ?? '').includes('auto-report'))
  assert.ok(formatRunStamp('2026-08-16T02:30:00.000Z').includes('2026-08-16'))
})

test('任务总览包含从未运行的任务，并用最近会话作为可点开入口', () => {
  const rows = deriveTaskOverviewRows(
    [
      { id: 'a1', name: 'ran', status: 'active', nextRunAt: '2026-08-20T09:00:00+08:00' },
      { id: 'a2', name: 'never', status: 'paused' },
    ],
    [
      { automationId: 'a1', sessionId: AUTOMATION_SESSION_PREFIX + 'old', status: 'succeeded', startedAt: '2026-08-15T01:00:00.000Z', scheduledFor: '2026-08-15T01:00:00.000Z' },
      { automationId: 'a1', sessionId: AUTOMATION_SESSION_PREFIX + 'new', status: 'succeeded', startedAt: '2026-08-16T01:00:00.000Z', scheduledFor: '2026-08-16T01:00:00.000Z' },
      { automationId: 'a2', status: 'queued', scheduledFor: '2026-08-16T03:00:00.000Z' },
    ],
  )
  assert.equal(rows.length, 2)
  assert.equal(rows[0]?.lastSessionId, AUTOMATION_SESSION_PREFIX + 'new')
  assert.equal(rows[0]?.nextRunAt, '2026-08-20T09:00:00+08:00')
  assert.equal(rows[1]?.lastSessionId, undefined)
  assert.equal(rows[1]?.nextRunAt, undefined)
})

test('任务树按前缀和定时标题隐藏自动化会话', () => {
  assert.equal(isAutomationSidebarSession('dsh-automation-session-abc'), true)
  assert.equal(isAutomationSidebarSession('chat-1', { id: 'chat-1', displayTitle: '2026-08-18 09:40 - 给我报表信息' }), true)
  assert.equal(isAutomationSidebarSession('chat-1', { id: 'chat-1', title: '审查本项目代码' }), false)
})
test('native task list filters im, subagent and automation sessions', () => {
  assert.equal(isNativeTaskSession({ id: 'chat-1', title: 'normal' }), true)
  const listedId = AUTOMATION_SESSION_PREFIX + 'x'
  assert.equal(isNativeTaskSession({ id: listedId, title: 'scheduled' }, new Set([listedId])), false)
  assert.equal(isNativeTaskSession({ id: listedId, title: 'forgotten' }, new Set()), false)
  assert.equal(isNativeTaskSession({ id: 'im:wecom:1', origin: 'im' }), false)
  assert.equal(isNativeTaskSession({ id: 'sub-1', origin: 'subagent' }), false)
  const autoId = AUTOMATION_SESSION_PREFIX + '1'
  const groups = groupNativeTaskSessions({
    ids: ['ws-session', autoId, 'im:1', 'loose'],
    byId: {
      'ws-session': { id: 'ws-session', title: 'workspace-task' },
      [autoId]: { id: autoId, title: 'scheduled-run' },
      'im:1': { id: 'im:1', origin: 'im', title: 'channel' },
      loose: { id: 'loose', title: 'loose-task' },
    },
  }, {
    items: [{ id: 'ws1', title: 'demo', sessionIds: ['ws-session', autoId] }],
    archivedSessionIds: [],
  }, 'ungrouped', new Set([autoId]))
  assert.deepEqual(groups.map(group => ({ id: group.id, titles: group.sessions.map(item => item.title) })), [
    { id: 'ws1', titles: ['workspace-task'] },
    { id: '', titles: ['loose-task'] },
  ])
})

test('native tabs follow session prefixes and detect Codex UI sidebar', () => {
  assert.equal(readNativeSidebarTab('schedule'), 'schedule')
  assert.equal(readNativeSidebarTab('nope'), 'tasks')
  assert.equal(tabForSessionId(AUTOMATION_SESSION_PREFIX + 'abc'), 'schedule')
  assert.equal(tabForSessionId('im:wecom:1'), 'channels')
  assert.equal(tabForSessionId('chat-1'), undefined)
  assert.equal(hasCodexUiSidebar([{ options: { locale: 'michengai.codexUi' } }]), true)
  assert.equal(hasCodexUiSidebar([{ options: { locale: 'sidebar' } }]), false)
})

test('过滤结果必须保持同一引用，避免任务页卡死', () => {
  const state = { ids: ['chat-1', 'dsh-automation-session-1'], byId: { 'chat-1': { id: 'chat-1' }, 'dsh-automation-session-1': { id: 'dsh-automation-session-1' } }, current: 'chat-1' }
  const first = filterTaskSessionState(state)
  const second = filterTaskSessionState(state)
  assert.equal(first, second)
  const clean = { ids: ['chat-1'], byId: { 'chat-1': { id: 'chat-1' } }, current: 'chat-1' }
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
    current: 'chat-1',
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
    current: autoId,
  }, new Set())
  if (filtered.ids === undefined || filtered.ids.includes(autoId)) throw new Error('automation session must stay off the task tree')
  assert.equal(tabForSessionId(autoId, new Set()), undefined)
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

test('native session relative time matches official labels', () => {
  assert.equal(relativeTime(new Date().toISOString()), '刚刚')
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


test('同一时间只允许一条定时会话菜单打开', () => {
  assert.equal(nextOpenSessionMenuId(null, 'sess-a'), 'sess-a')
  assert.equal(nextOpenSessionMenuId('sess-a', 'sess-a'), null)
  assert.equal(nextOpenSessionMenuId('sess-a', 'sess-b'), 'sess-b')
})

test('点第二条会话标题或更多按钮时应关闭第一条菜单', () => {
  const firstRow = {
    nodeType: 1,
    contains(other: { id?: string }): boolean { return other.id === 'first-btn' },
  }
  const firstBtn = { id: 'first-btn', nodeType: 1, parentElement: firstRow }
  const secondTitleText = {
    nodeType: 3,
    parentElement: { id: 'second-title', nodeType: 1, parentElement: { nodeType: 1 } },
  }
  const secondBtn = { id: 'second-btn', nodeType: 1, parentElement: { nodeType: 1 } }
  assert.equal(shouldCloseNativeSessionMenu(firstBtn, [firstRow]), false)
  assert.equal(shouldCloseNativeSessionMenu(secondTitleText, [firstRow]), true)
  assert.equal(shouldCloseNativeSessionMenu(secondBtn, [firstRow]), true)
})

test('菜单定位使用视口固定坐标，避免被侧栏裁切后叠在下一条上', () => {
  const style = nativeSessionMenuStyle({ x: 280, y: 120 }, { width: 218, height: 176 }, { width: 1000, height: 800 })
  assert.equal(style.position, 'fixed')
  assert.equal(style.left, '280px')
  assert.equal(style.top, '120px')
})

test('右键菜单落在指针处，并被限制在视口内', () => {
  assert.deepEqual(pointerPoint({ clientX: 40, clientY: 80 }), { x: 40, y: 80 })
  assert.deepEqual(clampMenuPoint(990, 790, 218, 176, { width: 1000, height: 800 }), { x: 774, y: 616 })
  const next = nextOpenSessionMenu(null, 'sess-a', { x: 40, y: 80 })
  assert.deepEqual(next, { id: 'sess-a', x: 40, y: 80 })
  assert.equal(nextOpenSessionMenu(next, 'sess-a', { x: 41, y: 81 }), null)
})







test('会话悬停预览卡贴在行右侧，避免挡住列表', () => {
  const style = nativeSessionHoverStyle({ right: 240, top: 80 }, { width: 200, height: 90 }, { width: 1000, height: 800 })
  assert.equal(style.left, '248px')
  assert.equal(style.top, '80px')
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


test('定时页不展示已归档或宿主已不认识的会话', () => {
  const archived = new Set(['gone-archived'])
  const present = new Set(['still-live'])
  assert.equal(keepScheduledSessionLink('still-live', archived, present), true)
  assert.equal(keepScheduledSessionLink('gone-archived', archived, present), false)
  assert.equal(keepScheduledSessionLink('physically-deleted', archived, present), false)
  assert.equal(keepScheduledSessionLink('unknown-but-no-presence-map', archived), true)
  assert.equal(keepScheduledSessionLink('', archived, present), false)
})
