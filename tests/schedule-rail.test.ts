import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AUTOMATION_SESSION_PREFIX,
  collectScheduledSessionIds,
  deriveTaskOverviewRows,
  isAutomationSidebarSession,
  groupNativeTaskSessions,
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
  isNativeTaskSession,
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
} from '../src/client/schedule-rail-model.ts'
import { relativeTime, nativeSessionHoverStyle, renderOwnedSlot, scheduledSessionHoverStatuses, sessionRowTime } from '../src/client/native-session-menu.ts'
import { en, zh } from '../src/client/locales.ts'
import { archiveScheduledGroup, canDeleteScheduledSession, hasArchiveManagerPlugin, scheduledGroupShowsActiveFolder, scheduledListHostActions, scheduledSessionMenuActions, scheduledSessionOmitsStatusSlot } from '../src/client/native-group-actions.ts'

test('会话更多操作的无障碍标签提供中英文模板', () => {
  assert.equal(en['session.moreActions'], 'More actions for {title}')
  assert.equal(zh['session.moreActions'], '“{title}”的更多操作')
})

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
  const translate = (dictionary: Record<string, string>) => (key: string, params?: Record<string, unknown>) => (
    (dictionary[key] ?? key).replace('{count}', String(params?.count ?? ''))
  )
  const now = Date.parse('2026-08-26T12:00:00.000Z')
  assert.equal(relativeTime('2026-08-26T11:59:30.000Z', translate(zh) as never, now), '刚刚')
  assert.equal(relativeTime('2026-08-26T11:55:00.000Z', translate(en) as never, now), '5m ago')
  const row = (key: string, params?: Record<string, unknown>) => {
    const dict: Record<string, string> = { 'time.now': '刚刚', 'time.months': '{count}个月', 'time.years': '{count}年' }
    return (dict[key] ?? key).replace('{count}', String(params?.count ?? ''))
  }
  assert.equal(sessionRowTime('2026-06-26T12:00:00.000Z', row as never, now), '2个月')
  assert.equal(sessionRowTime('2024-08-26T12:00:00.000Z', row as never, now), '2年')
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

test('旧宿主仍用 list.current 作为当前会话', () => {
  assert.equal(resolveCurrentSessionId({ current: 'legacy-current', byId: {} }), 'legacy-current')
})

test('alpha.2 无 current 时按 retainedBy.mainView 反查主视图会话', () => {
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
  }), 'legacy-current')
})

test('打开定时会话优先走官方 uiWorkspace.openSession', () => {
  const opened: string[] = []
  const legacy: string[] = []
  openClientSession({
    uiWorkspace: { openSession: (id) => { opened.push(id) } },
    sessions: { open: (id) => { legacy.push(id) } },
  }, 'dsh-automation-session-abc')
  assert.deepEqual(opened, ['dsh-automation-session-abc'])
  assert.deepEqual(legacy, [])
})

test('没有 uiWorkspace 时回退 sessions.open', () => {
  const legacy: string[] = []
  openClientSession({
    sessions: { open: (id) => { legacy.push(id) } },
  }, 'dsh-automation-session-abc')
  assert.deepEqual(legacy, ['dsh-automation-session-abc'])
})

test('官方 sessions 已无 open 且没有 uiWorkspace 时抛错，交给宿主兜底', () => {
  assert.throws(
    () => openClientSession({ sessions: {} }, 'dsh-automation-session-abc'),
    /no client session opener/,
  )
})

test('alpha.2 未注入 uiWorkspace 时从 ctx.get 取官方 openSession', () => {
  const opened: string[] = []
  const access = resolveClientSessionOpenAccess({
    sessions: {},
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
    sessions: {},
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


test('当前会话所属文件夹即使折叠也保持官方高亮', () => {
  assert.equal(scheduledGroupShowsActiveFolder(['session-a', 'session-b'], 'session-b'), true)
  assert.equal(scheduledGroupShowsActiveFolder(['session-a'], 'session-b'), false)
  assert.equal(scheduledGroupShowsActiveFolder(['session-a'], null), false)
})

test('平铺列表空闲会话去掉状态槽，和工作区树对齐官方', () => {
  assert.equal(scheduledSessionOmitsStatusSlot(true, false), true)
  assert.equal(scheduledSessionOmitsStatusSlot(true, true), false)
  assert.equal(scheduledSessionOmitsStatusSlot(false, false), false)
  const nativeList = readFileSync(new URL('../src/client/native-session-list.tsx', import.meta.url), 'utf8')
  assert.match(nativeList, /dsh-st-n-chevron/)
  assert.match(nativeList, /dsh-st-n-project-text/)
  assert.match(nativeList, /is-flat-idle/)
})

test('只有归档插件标记存在时才显示整组归档能力', () => {
  const seen: string[] = []
  const root = { querySelector(selector: string) { seen.push(selector); return selector.includes('@michengai/dsh-archive-manager') ? {} : null } }
  assert.equal(hasArchiveManagerPlugin(root), true)
  assert.equal(hasArchiveManagerPlugin({ querySelector() { return null } }), false)
  assert.equal(seen.length, 1)
})

test('有归档插件且宿主提供删除时才出现删除会话', () => {
  const deleteSession = async () => undefined
  assert.equal(canDeleteScheduledSession(true, deleteSession), true)
  assert.equal(canDeleteScheduledSession(false, deleteSession), false)
  assert.equal(canDeleteScheduledSession(true, undefined), false)
  const idle = { canDelete: false, archived: false, canUnarchive: false }
  assert.deepEqual(scheduledSessionMenuActions(idle), ['rename', 'fork', 'archive'])
  assert.deepEqual(scheduledSessionMenuActions({ ...idle, canDelete: true }), ['rename', 'fork', 'archive', 'delete-session'])
  assert.deepEqual(scheduledSessionMenuActions({ ...idle, archived: true, canUnarchive: true }), ['rename', 'fork', 'unarchive'])
})

test('页签渲染和自绘回退共用宿主会话操作，而不是只在有 registry 时转发', () => {
  const renameSession = () => undefined
  const archiveSession = () => undefined
  const deleteSession = () => undefined
  const forkSession = () => undefined
  const actions = scheduledListHostActions({
    renameSession,
    archiveSession,
    deleteSession,
    forkSession,
    openSession: () => undefined,
    useSessions: () => undefined,
  })
  assert.equal(actions.renameSession, renameSession)
  assert.equal(actions.archiveSession, archiveSession)
  assert.equal(actions.deleteSession, deleteSession)
  assert.equal(actions.forkSession, forkSession)
  const unarchiveSession = () => undefined
  const notifyArchivedNotOpenable = () => undefined
  const extended = scheduledListHostActions({ unarchiveSession, notifyArchivedNotOpenable })
  assert.equal(extended.unarchiveSession, unarchiveSession)
  assert.equal(extended.notifyArchivedNotOpenable, notifyArchivedNotOpenable)
  assert.deepEqual(scheduledListHostActions({ renameSession: 'nope', archiveSession: 1 }), {})
  assert.deepEqual(scheduledListHostActions(undefined), {})
  const rail = readFileSync(new URL('../src/client/ScheduleRail.tsx', import.meta.url), 'utf8')
  const index = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
  assert.match(rail, /scheduledListHostActions\(hostProps\)/)
  assert.match(index, /scheduledListHostActions\(/)
  assert.doesNotMatch(index, /props\.renameSession as any/)
})

test('旧宿主未声明行内插槽时定时页不崩溃', () => {
  const undeclared = new Error("slot 'sidebar.workspaces.session.row.action' is not declared by this entry's children")
  undeclared.name = 'SlotOwnershipError'
  assert.equal(renderOwnedSlot(() => { throw undeclared }, 'sidebar.workspaces.session.row.action'), null)
  assert.equal(renderOwnedSlot(undefined, 'sidebar.workspaces.session.row.action'), null)
  assert.equal(renderOwnedSlot(() => 'archive', 'sidebar.workspaces.session.row.action'), 'archive')
  assert.throws(() => renderOwnedSlot(() => { throw new Error('boom') }, 'sidebar.workspaces.session.row.action'), /boom/)
  const nativeList = readFileSync(new URL('../src/client/native-session-list.tsx', import.meta.url), 'utf8')
  assert.match(nativeList, /renderOwnedSlot\(renderSlot, 'sidebar\.workspaces\.session\.row\.action'/)
})

test('定时文件夹和会话菜单跟随官方尺寸，不再使用 dense/compact', () => {
  const nativeList = readFileSync(new URL('../src/client/native-session-list.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(nativeList, /\bdense\b/)
  assert.doesNotMatch(nativeList, /\bcompact\b/)
  assert.match(nativeList, /closeOnPointerLeave/)
  assert.match(nativeList, /session\.deleteSession/)
  assert.equal(en['session.deleteSession'], 'Delete session')
  assert.equal(zh['session.deleteSession'], '删除会话')
})

test('整组归档串行执行，避免工作区状态写入互相覆盖', async () => {
  const archived: string[] = []
  await archiveScheduledGroup(['session-a', 'session-b'], async (id) => {
    archived.push('start:' + id)
    await Promise.resolve()
    archived.push('end:' + id)
  })
  assert.deepEqual(archived, ['start:session-a', 'end:session-a', 'start:session-b', 'end:session-b'])
})







test('会话悬停卡列出完成、待处理和已归档，而不只剩空闲', () => {
  const t = (key: string, params?: Record<string, unknown>) => params?.count === undefined ? key : `${key}:${String(params.count)}`
  assert.deepEqual(scheduledSessionHoverStatuses({ running: false, archived: false, completed: true }, t as never).map(item => item.label), ['session.completed'])
  assert.deepEqual(scheduledSessionHoverStatuses({ running: true, archived: false, pendingKind: 'approval', runningSubagentCount: 2 }, t as never).map(item => item.state), ['warning', 'ongoing'])
  assert.deepEqual(scheduledSessionHoverStatuses({ running: false, archived: true, completed: true }, t as never).map(item => item.state), ['archived'])
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
