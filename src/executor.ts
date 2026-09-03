/** 已认领 run 的独立 Agent 执行边界。 */

import { installModelSelection, type ModelSelection } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type {} from '@deepseek-ai/dsh-agent-presets'
import type { Context } from '@deepseek-ai/cordis'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import { setApprovalPolicy } from '@deepseek-ai/dsh-user-approval'
import { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import type { ToolExecution } from '@deepseek-ai/dsh-tools'
import { automationSessionTitle } from './run-title.ts'
import type { PermissionPresetService } from './permission-presets.ts'
import type { AutomationDefinition, AutomationRun } from './types.ts'

interface TextBlock { readonly type: string; readonly text?: string }
export interface SessionEventLike {
  readonly seq: number
  readonly type: string
  readonly data: Record<string, any>
}

interface SessionEventReader {
  readonly events?: readonly SessionEventLike[]
  snapshotEvents?(): readonly SessionEventLike[]
}

const UNATTENDED_TOOL_ALLOWLIST = new Set([
  'run_code',
  'bash', 'pwsh',
  'read', 'read_image', 'write', 'edit', 'str_replace_editor',
  'glob', 'grep', 'lsp',
  'web_search', 'web_fetch',
  'skill',
  'session_search', 'session_trace', 'session_event_read', 'session_event_search', 'session_event_trace',
])
const CANCEL_CONVERGENCE_TIMEOUT_MS = 10_000

/** 对不保证及时响应 AbortSignal 的宿主任务设置第二道退出上限。 */
export async function settlesWithin(promise: Promise<unknown>, timeoutMs: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise.then(() => true, () => false),
      new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), timeoutMs) }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export function unattendedToolGuardReason(name: string, args: unknown): string | undefined {
  if ((name === 'bash' || name === 'pwsh')
    && typeof args === 'object' && args !== null
    && (args as Record<string, unknown>).run_in_background === true) {
    return '无人值守运行不允许启动后台进程。'
  }
  return UNATTENDED_TOOL_ALLOWLIST.has(name)
    ? undefined
    : `工具 '${name}' 不在无人值守自动化允许列表中。`
}

export interface RunCompletion {
  readonly sessionId?: string
  readonly status: 'succeeded' | 'failed' | 'cancelled'
  readonly summary?: string
  readonly error?: { readonly code: string; readonly message: string }
}

export interface ExecutorConfig {
  readonly runTimeoutMs: number
  readonly sessionId: string
  readonly signal?: AbortSignal
}

/** 先应用官方预设的完整语义，再让无人值守审批 fail-closed。 */
export function applyUnattendedPermission(
  presets: PermissionPresetService,
  session: unknown,
  permission: AutomationDefinition['permissionPreset'],
): void {
  presets.set(session, permission)
  setApprovalPolicy(session, 'never')
}

/** 优先读取新版按需快照，避免保留旧版 Session.events 的内部日志引用。 */
export function readSessionEvents(session: SessionEventReader): readonly SessionEventLike[] {
  if (typeof session.snapshotEvents === 'function') return session.snapshotEvents()
  return session.events ?? []
}

export function summarizeRun(events: readonly SessionEventLike[], firstSeq: number): {
  readonly text: string
  readonly reason?: Record<string, any>
} {
  let started = false
  let text = ''
  let reason: Record<string, any> | undefined
  for (const event of events) {
    if (event.seq < firstSeq) continue
    if (event.type === 'turn/start') {
      started = true
      continue
    }
    if (!started) continue
    if (event.type === 'assistant/message') {
      const blocks = (event.data.message?.content ?? []) as readonly TextBlock[]
      const joined = blocks.filter(block => block.type === 'text')
        .map(block => block.text ?? '')
        .join('')
      if (joined !== '') text = joined
    }
    if (event.type === 'turn/end') reason = event.data.reason as Record<string, any>
  }
  return { text, ...(reason === undefined ? {} : { reason }) }
}

function boundSummary(value: string): string | undefined {
  const normalized = value.trim()
  if (normalized === '') return undefined
  return normalized.length <= 2_000 ? normalized : `${normalized.slice(0, 1_999)}…`
}

function reasonError(reason: Record<string, any> | undefined): { readonly code: string; readonly message: string } {
  if (reason === undefined) return { code: 'no_turn_result', message: '本次自动化没有产生完整 turn。' }
  if (reason.kind === 'error') {
    return {
      code: typeof reason.error?.code === 'string' ? reason.error.code : 'agent_error',
      message: typeof reason.error?.message === 'string'
        ? reason.error.message
        : '自动化 Agent 执行失败。',
    }
  }
  return { code: `turn_${String(reason.kind)}`, message: `自动化以 ${String(reason.kind)} 结束。` }
}

export async function executeAutomationRun(
  ctx: Context,
  definition: AutomationDefinition,
  run: AutomationRun,
  config: ExecutorConfig,
): Promise<RunCompletion> {
  if (config.signal?.aborted === true) {
    return { status: 'cancelled', error: { code: 'cancelled', message: '自动化在启动前已被取消。' } }
  }
  const target = run.targetSnapshot
  const workspace = ctx.workspaceRegistry.get(WorkspaceId(target.workspaceId))
  if (workspace === undefined) {
    return { status: 'failed', error: { code: 'workspace_not_found', message: '目标工作区已不存在。' } }
  }
  if (await workspace.status() !== 'ok' || workspace.path !== target.cwd) {
    return { status: 'failed', error: { code: 'workspace_unavailable', message: '目标工作区目录不可用或已变更。' } }
  }

  const fallbackSelection = ctx.agentDefaultModel.currentSelection()
  const selection: ModelSelection = target.provider !== null && target.model !== null
    ? {
        provider: target.provider,
        model: target.model,
        ...(target.reasoningEffort ? { reasoningEffort: target.reasoningEffort } : {}),
      }
    : fallbackSelection
  const sessionId = SessionId(config.sessionId)
  let handle: Awaited<ReturnType<Context['agents']['create']>> | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  let removeCancellationListener = () => {}
  try {
    handle = await ctx.agents.withoutInitiator(() => ctx.agents.create({
      sessionId,
      ...(config.signal === undefined ? {} : { signal: config.signal }),
      meta: { cwd: target.cwd, agentPreset: target.agentPreset },
      agentOptions: { provider: selection.provider, model: selection.model },
      setup: async (agentCtx: Context) => {
        await ctx.agentPresets.mount(agentCtx, target.agentPreset)
        installModelSelection(agentCtx, { current: selection, assembled: undefined })
        const agent = agentCtx.agent
        if (agent === undefined) throw new Error('automation setup has no scoped Agent')
        applyUnattendedPermission(ctx.permissionPresets, agent.session, target.permissionPreset)
        agentCtx.tools.guard((exec: ToolExecution) => unattendedToolGuardReason(exec.name, exec.arguments))
      },
    }))
    await handle.agent.whenIdle()
    await workspace.attachSession(sessionId)
    pinAutomationSessionTitle(ctx, handle.agent.session, automationSessionTitle(definition.name, run.startedAt ?? run.scheduledFor))
    const firstSeq = handle.agent.session.seq
    handle.agent.followup(createUserMessage({
      content: [{ type: 'text', text: run.promptSnapshot }],
      source: {
        kind: 'automation',
        automationId: definition.id,
        runId: run.id,
        scheduledFor: run.scheduledFor,
      },
    }))

    let timedOut = false
    let aborted = false
    const idle = handle.agent.whenIdle()
    const deadline = new Promise<void>((resolve) => {
      timeout = setTimeout(() => {
        timedOut = true
        handle?.agent.cancel({ kind: 'hook', reason: 'automation run timeout' })
        resolve()
      }, config.runTimeoutMs)
    })
    const cancellation = new Promise<void>((resolve) => {
      if (config.signal === undefined) return
      const cancel = () => {
        aborted = true
        handle?.agent.cancel({ kind: 'hook', reason: 'automation service disposed' })
        resolve()
      }
      if (config.signal.aborted) cancel()
      else {
        config.signal.addEventListener('abort', cancel, { once: true })
        removeCancellationListener = () => { config.signal?.removeEventListener('abort', cancel) }
      }
    })
    await Promise.race([idle, deadline, cancellation])
    removeCancellationListener()
    if ((timedOut || aborted) && !await settlesWithin(idle, CANCEL_CONVERGENCE_TIMEOUT_MS)) {
      return {
        sessionId: String(sessionId),
        status: aborted ? 'cancelled' : 'failed',
        error: {
          code: 'cancel_convergence_timeout',
          message: '自动化取消后未能在安全时限内停止。',
        },
      }
    }
    if (timeout !== undefined) clearTimeout(timeout)
    await ctx.sessions.flush(handle.agent.session)
    const outcome = summarizeRun(readSessionEvents(handle.agent.session), firstSeq)
    const summary = boundSummary(outcome.text)
    if (aborted) {
      return {
        sessionId: String(sessionId),
        status: 'cancelled',
        ...(summary === undefined ? {} : { summary }),
        error: { code: 'cancelled', message: '自动化因其所属服务停止而被取消。' },
      }
    }
    if (timedOut) {
      return {
        sessionId: String(sessionId),
        status: 'failed',
        ...(summary === undefined ? {} : { summary }),
        error: { code: 'timeout', message: '自动化超过最大运行时限。' },
      }
    }
    if (outcome.reason?.kind === 'completed') {
      return { sessionId: String(sessionId), status: 'succeeded', ...(summary === undefined ? {} : { summary }) }
    }
    return {
      sessionId: String(sessionId),
      status: 'failed',
      ...(summary === undefined ? {} : { summary }),
      error: reasonError(outcome.reason),
    }
  } catch (error: unknown) {
    return {
      ...(handle === undefined ? {} : { sessionId: String(sessionId) }),
      status: 'failed',
      error: {
        code: 'executor_error',
        message: error instanceof Error ? error.message : '自动化执行器失败。',
      },
    }
  } finally {
    removeCancellationListener()
    if (timeout !== undefined) clearTimeout(timeout)
    if (handle !== undefined) {
      await settlesWithin(handle.dispose().catch(() => {}), CANCEL_CONVERGENCE_TIMEOUT_MS)
    }
  }
}

export function pinAutomationSessionTitle(ctx: Context, session: unknown, title: string): void {
  // Cordis 未 inject 时直接读 ctx.sessionTitle 会抛错，必须走可选查询。
  const service = ctx.get('sessionTitle') as { rename?(target: unknown, value: string): unknown } | undefined
  if (service === undefined || typeof service.rename !== 'function') return
  try {
    service.rename(session, title)
  } catch (error: unknown) {
    ctx.logger.warn(`dsh-automation: failed to pin session title: ${error instanceof Error ? error.message : String(error)}`)
  }
}

