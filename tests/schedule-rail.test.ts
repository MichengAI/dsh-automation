import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTOMATION_SESSION_PREFIX,
  formatRunStamp,
  groupNativeTaskSessions,
  groupScheduledSessions,
  openScheduledSession,
  hasCodexUiSidebar,
  isNativeTaskSession,
  readNativeSidebarTab,
  filterTaskSessionState,
  isMarkedWorkspaceWrapper,
  pickWrappableWorkspacesEntry,
  resolveOfficialTreeComponent,
  tabForSessionId,
} from '../src/client/schedule-rail-model.ts'
import { relativeTime } from '../src/client/native-session-list.tsx'

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

test('native task list filters im, subagent and automation sessions', () => {
  assert.equal(isNativeTaskSession({ id: 'chat-1', title: 'normal' }), true)
  assert.equal(isNativeTaskSession({ id: AUTOMATION_SESSION_PREFIX + 'x', title: 'scheduled' }), false)
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
  }, 'ungrouped')
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

test('official task tree hides automation and im sessions', () => {
  const filtered = filterTaskSessionState({
    ids: ['chat-1', AUTOMATION_SESSION_PREFIX + '1', 'im:wecom:1'],
    byId: {
      'chat-1': { id: 'chat-1' },
      [AUTOMATION_SESSION_PREFIX + '1']: { id: AUTOMATION_SESSION_PREFIX + '1' },
      'im:wecom:1': { id: 'im:wecom:1' },
    },
    current: 'chat-1',
  })
  if (filtered.ids === undefined) throw new Error('missing ids')
  if (filtered.ids.length !== 1 || filtered.ids[0] !== 'chat-1') throw new Error('filter failed')
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