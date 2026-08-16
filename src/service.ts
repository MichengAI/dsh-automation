/** 持久化定义、occurrence 认领、时钟与执行调度。 */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type {} from '@deepseek-ai/dsh-agent-presets'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { Domain, KvTable } from '@deepseek-ai/dsh-storage-domain'
import type {} from '@deepseek-ai/dsh-workspace'
import {
  automationDomainSpec,
  createDefinition,
  createManualRun,
  createScheduledRun,
  deleteDefinition,
  updateDefinition,
} from './domain.ts'
import { executeAutomationRun } from './executor.ts'
import { latestDueOccurrence, nextOccurrence } from './recurrence.ts'
import type {
  AutomationDefinition,
  AutomationRun,
  AutomationSchedule,
  PermissionPreset,
  UpdateAutomationInput,
} from './types.ts'

const MAX_TIMER_DELAY_MS = 2_147_483_647
export const AUTOMATION_SESSION_PREFIX = 'dsh-automation-session-'

export interface AutomationConfig {
  readonly maxConcurrentRuns: number
  readonly runTimeoutMs: number
  readonly misfireGraceMs: number
  readonly historyLimit: number
}

export interface WorkspaceOption {
  readonly id: string
  readonly title: string
  readonly path: string
}

export interface ModelOption {
  readonly provider: string
  readonly model: string
  readonly label: string
}

export interface CreateRequest {
  readonly name: string
  readonly prompt: string
  readonly schedule: AutomationSchedule
  readonly permissionPreset?: PermissionPreset
  readonly workspaceId?: string
  readonly cwd?: string
  readonly provider?: string | null
  readonly model?: string | null
  readonly agentPreset?: string
}

export interface AutomationScope {
  readonly sessionId: string
  readonly creatorKind: 'agent' | 'web'
  readonly hostWide?: boolean
}

export interface AutomationSnapshot {
  readonly generatedAt: string
  readonly workspace: WorkspaceOption | null
  readonly workspaces: readonly WorkspaceOption[]
  readonly models: readonly ModelOption[]
  readonly defaultModel: ModelOption | null
  readonly skills: readonly { readonly id: string; readonly name: string }[]
  readonly definitions: readonly AutomationDefinitionView[]
  readonly runs: readonly AutomationRun[]
}

export interface AutomationDefinitionView extends AutomationDefinition {
  readonly nextRunAt: string | null
  readonly lastRun: AutomationRun | null
}

interface SessionEventLike {
  readonly type: string
  readonly data: unknown
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function toIso(ms = Date.now()): string {
  return new Date(ms).toISOString()
}

function throwIfCancelled(signal?: AbortSignal): void {
  if (signal?.aborted === true) throw new Error('自动化请求已取消。')
}

function compareRuns(left: AutomationRun, right: AutomationRun): number {
  return Date.parse(right.scheduledFor) - Date.parse(left.scheduledFor)
    || right.id.localeCompare(left.id)
}

export class AutomationService {
  private definitions!: KvTable<string, AutomationDefinition>
  private runs!: KvTable<string, AutomationRun>
  private timer: ReturnType<typeof setTimeout> | undefined
  private operationTail: Promise<void> = Promise.resolve()
  private pumpScheduled = false
  private requested = false
  private started = false
  private stopping = false
  private readonly active = new Map<string, { readonly abort: AbortController; readonly promise: Promise<void> }>()

  private constructor(
    private readonly ctx: Context,
    private readonly domain: Domain<typeof automationDomainSpec>,
    private readonly config: AutomationConfig,
  ) {}

  static async open(ctx: Context, config: AutomationConfig): Promise<AutomationService> {
    const domain = await ctx.storageDomain.open(automationDomainSpec)
    try {
      const service = new AutomationService(ctx, domain, config)
      service.definitions = domain.table('definitions') as KvTable<string, AutomationDefinition>
      service.runs = domain.table('runs') as KvTable<string, AutomationRun>
      await service.recoverInterruptedRuns()
      await service.pruneAllHistory()
      return service
    } catch (error) {
      await domain.close().catch(() => {})
      throw error
    }
  }

  start(): void {
    if (this.started || this.stopping) return
    this.started = true
    this.requestPump()
  }

  ownsSession(sessionId: string, events: readonly SessionEventLike[] = []): boolean {
    if (sessionId.startsWith(AUTOMATION_SESSION_PREFIX)) return true
    if ([...this.runs.entries()].some(([, run]) => run.sessionId === sessionId)) return true
    return events.some((event) => {
      if (event.type !== 'user/message' || typeof event.data !== 'object' || event.data === null) return false
      const source = (event.data as { readonly source?: unknown }).source
      return typeof source === 'object' && source !== null
        && (source as { readonly kind?: unknown }).kind === 'automation'
    })
  }

  async dispose(): Promise<void> {
    this.stopping = true
    this.clearTimer()
    const handles = [...this.active.values()]
    for (const handle of handles) handle.abort.abort()
    await Promise.allSettled(handles.map(handle => handle.promise))
    this.active.clear()
    await this.domain.close()
  }

  async snapshot(scope: AutomationScope, signal?: AbortSignal): Promise<AutomationSnapshot> {
    return this.serialize(async () => {
      throwIfCancelled(signal)
      const now = toIso()
      const options = this.collectOptions()
      const scoped = scope.hostWide === true ? undefined : await this.resolveScope(scope)
      const workspaceId = scoped?.workspace.id
      const definitions = [...this.definitions.entries()]
        .map(([, definition]) => definition)
        .filter(definition => workspaceId === undefined || definition.workspaceId === workspaceId)
        .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
      const runs = [...this.runs.entries()]
        .map(([, run]) => run)
        .filter(run => workspaceId === undefined || run.targetSnapshot.workspaceId === workspaceId)
        .sort(compareRuns)
      const lastByAutomation = new Map<string, AutomationRun>()
      for (const run of [...runs].reverse()) lastByAutomation.set(run.automationId, run)
      return {
        generatedAt: now,
        workspace: scoped === undefined
          ? null
          : { id: scoped.workspace.id, title: scoped.workspace.title ?? scoped.workspace.id, path: scoped.workspace.path },
        workspaces: options.workspaces,
        models: options.models,
        defaultModel: options.defaultModel,
        skills: options.skills,
        definitions: definitions.map(definition => ({
          ...definition,
          nextRunAt: definition.status === 'active'
            ? nextOccurrence(definition.schedule, now)
            : null,
          lastRun: lastByAutomation.get(definition.id) ?? null,
        })),
        runs,
      }
    }, signal)
  }

  async create(scope: AutomationScope, request: CreateRequest, signal?: AbortSignal): Promise<AutomationDefinition> {
    const definition = await this.serialize(async () => {
      throwIfCancelled(signal)
      const now = toIso()
      if (request.schedule.kind === 'once'
        && nextOccurrence(request.schedule, now) === null) {
        throw new Error('一次性自动化必须安排在未来时间。')
      }
      const target = await this.resolveCreateTarget(scope, request)
      const value = createDefinition({
        id: `automation_${randomUUID()}`,
        name: request.name,
        prompt: request.prompt,
        schedule: request.schedule,
        workspaceId: target.workspaceId,
        cwd: target.cwd,
        agentPreset: target.agentPreset,
        provider: target.provider,
        model: target.model,
        permissionPreset: request.permissionPreset ?? 'read-only',
        createdBy: { kind: scope.creatorKind, sessionId: scope.sessionId },
        now,
      })
      await this.definitions.put(value.id, value)
      return value
    }, signal)
    this.requestPump()
    return definition
  }

  async update(
    scope: AutomationScope,
    id: string,
    input: Omit<UpdateAutomationInput, 'now'> & { readonly status?: 'active' | 'paused' },
    signal?: AbortSignal,
  ): Promise<AutomationDefinition> {
    const next = await this.serialize(async () => {
      const current = await this.ownedDefinition(scope, id)
      throwIfCancelled(signal)
      const now = toIso()
      const { status, ...fields } = input
      if (fields.schedule?.kind === 'once'
        && nextOccurrence(fields.schedule, now) === null) {
        throw new Error('一次性自动化必须安排在未来时间。')
      }
      const statusChanged = status !== undefined && status !== current.status
      const value = Object.keys(fields).length === 0 && !statusChanged
        ? current
        : updateDefinition(current, { ...fields, ...(status === undefined ? {} : { status }), now })
      if (value !== current) await this.definitions.put(id, value)
      return value
    }, signal)
    this.requestPump()
    return next
  }

  async delete(
    scope: AutomationScope,
    id: string,
    signal?: AbortSignal,
  ): Promise<{ readonly id: string; readonly deleted: boolean }> {
    const deleted = await this.serialize(async () => {
      const current = await this.ownedDefinition(scope, id)
      throwIfCancelled(signal)
      deleteDefinition(current)
      return this.definitions.delete(id)
    }, signal)
    this.requestPump()
    return { id, deleted }
  }

  async runNow(scope: AutomationScope, id: string, signal?: AbortSignal): Promise<AutomationRun> {
    const run = await this.serialize(async () => {
      const definition = await this.ownedDefinition(scope, id)
      throwIfCancelled(signal)
      const alreadyActive = [...this.runs.entries()].some(([, candidate]) => (
        candidate.automationId === id
        && (candidate.status === 'queued' || candidate.status === 'running')
      ))
      if (alreadyActive) throw new Error('该自动化已有排队或运行中的任务。')
      const value = createManualRun(definition, toIso())
      await this.runs.put(value.id, value)
      return value
    }, signal)
    this.requestPump()
    return run
  }

  async markRead(scope: AutomationScope, runId: string, signal?: AbortSignal): Promise<AutomationRun> {
    return this.serialize(async () => {
      const run = this.runs.get(runId)
      if (run === undefined) throw new Error(`unknown automation run '${runId}'`)
      throwIfCancelled(signal)
      if (scope.hostWide !== true) {
        const { workspace } = await this.resolveScope(scope)
        if (run.targetSnapshot.workspaceId !== workspace.id) {
          throw new Error('该运行记录属于其他工作区。')
        }
      }
      if (!run.unread) return run
      const next = { ...run, unread: false }
      await this.runs.put(runId, next)
      return next
    }, signal)
  }

  private collectOptions(): {
    readonly workspaces: WorkspaceOption[]
    readonly models: ModelOption[]
    readonly defaultModel: ModelOption | null
    readonly skills: { readonly id: string; readonly name: string }[]
  } {
    const registry = this.ctx.workspaceRegistry as {
      list?: () => Iterable<any>
      values?: () => Iterable<any>
      entries?: () => Iterable<[string, any]>
    }
    const raw = registry.list !== undefined
      ? [...registry.list()]
      : registry.values !== undefined
        ? [...registry.values()]
        : registry.entries !== undefined
          ? [...registry.entries()].map(([, value]) => value)
          : []
    const workspaces = raw
      .map((item) => ({
        id: String(item.id ?? item.workspaceId ?? ''),
        title: String(item.title ?? item.name ?? item.id ?? item.path ?? ''),
        path: String(item.path ?? item.cwd ?? ''),
      }))
      .filter(item => item.id !== '' && item.path !== '')
    const defaultSelection = this.ctx.agentDefaultModel?.currentSelection?.()
    const catalog = this.ctx.agentDefaultModel?.listSelections?.()
      ?? this.ctx.agentDefaultModel?.catalog?.()
      ?? this.ctx.agentDefaultModel?.available?.()
      ?? []
    const models: ModelOption[] = []
    const seen = new Set<string>()
    for (const item of [defaultSelection, ...catalog]) {
      if (item === undefined || item === null) continue
      const provider = String(item.provider ?? '')
      const model = String(item.model ?? '')
      if (provider === '' || model === '') continue
      const key = `${provider}/${model}`
      if (seen.has(key)) continue
      seen.add(key)
      models.push({ provider, model, label: String(item.label ?? item.displayName ?? `${provider} / ${model}`) })
    }
    const skills: { readonly id: string; readonly name: string }[] = []
    const skillHost = this.ctx.get?.('skill') as { list?: () => Iterable<any>; catalog?: () => Iterable<any> } | undefined
    const rawSkills = skillHost?.list?.() ?? skillHost?.catalog?.() ?? []
    for (const item of rawSkills) {
      const id = String(item.id ?? item.slug ?? item.name ?? '')
      if (id === '') continue
      skills.push({ id, name: String(item.name ?? item.title ?? id) })
    }
    return {
      workspaces,
      models,
      defaultModel: models[0] ?? null,
      skills,
    }
  }

  private async resolveCreateTarget(scope: AutomationScope, request: CreateRequest) {
    const fallback = this.ctx.agentDefaultModel?.currentSelection?.()
    let workspaceId = request.workspaceId?.trim() ?? ''
    let cwd = request.cwd?.trim() ?? ''
    let agentPreset = request.agentPreset?.trim() || 'standard'
    let provider = request.provider ?? fallback?.provider ?? null
    let model = request.model ?? fallback?.model ?? null
    if (workspaceId !== '' || cwd !== '') {
      const workspace = workspaceId !== ''
        ? this.ctx.workspaceRegistry.get?.(workspaceId)
          ?? await this.ctx.workspaceRegistry.resolveByPath?.(cwd)
        : await this.ctx.workspaceRegistry.resolveByPath?.(cwd)
      if (workspace === undefined) throw new Error('所选工作区不存在或目录未注册。')
      workspaceId = String(workspace.id)
      cwd = String(workspace.path)
    } else {
      const resolved = await this.resolveScope(scope)
      workspaceId = resolved.workspace.id
      cwd = resolved.workspace.path
      agentPreset = this.ctx.agentPresets.composedPreset(resolved.agent.ctx)
        ?? resolved.agent.session.header.agentPreset
        ?? agentPreset
      const loggedSelection = resolved.agent.session.requestHeader()?.config
      provider = request.provider ?? loggedSelection?.provider ?? provider
      model = request.model ?? loggedSelection?.model ?? model
    }
    return { workspaceId, cwd, agentPreset, provider, model }
  }

  private async resolveScope(scope: AutomationScope) {
    const agent = this.ctx.agents.get(SessionId(scope.sessionId))
    if (agent === undefined) throw new Error('自动化界面或工具需要一个存活的来源 Session。')
    const cwd = agent.session.header.cwd
    if (cwd === undefined) throw new Error('来源 Session 没有工作区目录。')
    const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
    if (workspace === undefined) throw new Error('来源 Session 目录尚未注册为 DSH 工作区。')
    if (this.ctx.agents.get(SessionId(scope.sessionId)) !== agent) {
      throw new Error('自动化界面或工具需要一个存活的来源 Session。')
    }
    return { agent, workspace }
  }

  private async ownedDefinition(scope: AutomationScope, id: string): Promise<AutomationDefinition> {
    const definition = this.definitions.get(id)
    if (definition === undefined) throw new Error(`unknown automation '${id}'`)
    if (scope.hostWide === true) return definition
    const { workspace } = await this.resolveScope(scope)
    if (definition.workspaceId !== workspace.id) throw new Error('该自动化属于其他工作区。')
    return definition
  }

  private requestPump(): void {
    if (this.stopping || !this.started) return
    this.clearTimer()
    this.requested = true
    if (this.pumpScheduled) return
    this.pumpScheduled = true
    void this.serialize(async () => {
      try {
        while (this.requested && !this.stopping) {
          this.requested = false
          await this.pumpOnce()
        }
      } catch (error: unknown) {
        this.ctx.logger.warn(`dsh-automation: scheduler pump failed: ${asMessage(error)}`)
        this.armRetryTimer()
      } finally {
        this.pumpScheduled = false
      }
    }).catch((error: unknown) => {
      if (!this.stopping) this.ctx.logger.warn(`dsh-automation: scheduler admission failed: ${asMessage(error)}`)
    })
  }

  private async pumpOnce(): Promise<void> {
    if (this.stopping) return
    const now = toIso()
    for (const [, definition] of this.definitions.entries()) {
      if (definition.status !== 'active') continue
      await this.claimLatestDue(definition, now)
    }
    if (this.stopping) return
    await this.startQueuedRuns()
    if (this.stopping) return
    this.armNextTimer(now)
  }

  private async claimLatestDue(definition: AutomationDefinition, now: string): Promise<void> {
    const scheduledFor = latestDueOccurrence(definition.schedule, now)
    if (scheduledFor === null || Date.parse(scheduledFor) <= Date.parse(definition.updatedAt)) return
    const related = [...this.runs.entries()].map(([, run]) => run)
      .filter(run => run.automationId === definition.id)
    if (related.some(run => run.trigger === 'schedule' && run.scheduledFor === scheduledFor)) return
    const candidate = createScheduledRun(definition, scheduledFor)
    if (this.runs.get(candidate.id) !== undefined) return
    const overlapping = related.some(run => run.status === 'queued' || run.status === 'running')
    const age = Date.parse(now) - Date.parse(scheduledFor)
    if (overlapping || age > this.config.misfireGraceMs) {
      const reason = overlapping
        ? { code: 'overlap', message: '上一次运行仍在进行，本次已跳过。' }
        : { code: 'misfire', message: 'Host 恢复时已超出补跑窗口，本次已跳过。' }
      await this.runs.put(candidate.id, {
        ...candidate,
        status: 'skipped',
        finishedAt: now,
        error: reason,
      })
      await this.pruneWorkspaceHistory(candidate.targetSnapshot.workspaceId)
      return
    }
    await this.runs.put(candidate.id, candidate)
  }

  private async startQueuedRuns(): Promise<void> {
    if (this.stopping) return
    const capacity = Math.max(0, this.config.maxConcurrentRuns - this.active.size)
    if (capacity === 0) return
    const activeAutomationIds = new Set(
      [...this.active.keys()]
        .map(id => this.runs.get(id)?.automationId)
        .filter((id): id is string => id !== undefined),
    )
    const candidates = [...this.runs.entries()].map(([, run]) => run)
      .filter(run => run.status === 'queued' && !this.active.has(run.id))
      .sort((left, right) => Date.parse(left.scheduledFor) - Date.parse(right.scheduledFor))
    const queued: AutomationRun[] = []
    for (const run of candidates) {
      if (activeAutomationIds.has(run.automationId)) continue
      activeAutomationIds.add(run.automationId)
      queued.push(run)
      if (queued.length === capacity) break
    }
    for (const run of queued) this.startRun(run)
  }

  private startRun(run: AutomationRun): void {
    const abort = new AbortController()
    const promise = this.executeRun(run, abort.signal)
      .catch(async (error: unknown) => {
        this.ctx.logger.warn(`dsh-automation: run '${run.id}' failed outside its execution boundary: ${asMessage(error)}`)
        try {
          const current = this.runs.get(run.id)
          if (current === undefined || (current.status !== 'queued' && current.status !== 'running')) return
          await this.runs.put(run.id, {
            ...current,
            status: 'failed',
            finishedAt: toIso(),
            error: { code: 'executor_error', message: asMessage(error) },
            unread: true,
          })
        } catch (persistError: unknown) {
          this.ctx.logger.warn(`dsh-automation: failed to persist run failure: ${asMessage(persistError)}`)
        }
      })
      .finally(() => {
        this.active.delete(run.id)
        this.requestPump()
      })
    this.active.set(run.id, { abort, promise })
  }

  private async executeRun(run: AutomationRun, signal: AbortSignal): Promise<void> {
    const definition = this.definitions.get(run.automationId)
    if (definition === undefined) {
      await this.runs.put(run.id, {
        ...run,
        status: 'failed',
        finishedAt: toIso(),
        error: { code: 'definition_deleted', message: '自动化定义在本次运行启动前已被删除。' },
      })
      await this.pruneWorkspaceHistory(run.targetSnapshot.workspaceId)
      return
    }
    const startedAt = toIso()
    const sessionId = `${AUTOMATION_SESSION_PREFIX}${randomUUID()}`
    const running: AutomationRun = { ...run, status: 'running', startedAt, sessionId }
    await this.runs.put(run.id, running)
    const completion = await executeAutomationRun(this.ctx, definition, run, {
      runTimeoutMs: this.config.runTimeoutMs,
      sessionId,
      signal,
    })
    const finishedAt = toIso()
    await this.runs.put(run.id, {
      ...running,
      status: completion.status,
      sessionId: completion.sessionId ?? null,
      finishedAt,
      summary: completion.summary ?? null,
      error: completion.error ?? null,
      unread: true,
    })
    await this.pruneWorkspaceHistory(run.targetSnapshot.workspaceId)
  }

  private armNextTimer(now: string): void {
    if (this.stopping) return
    let target: number | undefined
    for (const [, definition] of this.definitions.entries()) {
      if (definition.status !== 'active') continue
      const next = nextOccurrence(definition.schedule, now)
      if (next === null) continue
      const candidate = Date.parse(next)
      if (target === undefined || candidate < target) target = candidate
    }
    if (target === undefined) return
    const delay = Math.max(1, Math.min(target - Date.parse(now), MAX_TIMER_DELAY_MS))
    this.timer = setTimeout(() => {
      this.timer = undefined
      this.requestPump()
    }, delay)
  }

  private armRetryTimer(): void {
    if (this.stopping || this.timer !== undefined) return
    const delay = Math.max(1_000, Math.min(60_000, this.config.misfireGraceMs || 60_000))
    this.timer = setTimeout(() => {
      this.timer = undefined
      this.requestPump()
    }, delay)
  }

  private clearTimer(): void {
    if (this.timer === undefined) return
    clearTimeout(this.timer)
    this.timer = undefined
  }

  private serialize<T>(operation: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (this.stopping) return Promise.reject(new Error('自动化服务正在停止。'))
    if (signal?.aborted === true) return Promise.reject(new Error('自动化请求已取消。'))
    const result = this.operationTail.then(async () => {
      throwIfCancelled(signal)
      return operation()
    })
    this.operationTail = result.then(() => {}, () => {})
    return result
  }

  private async recoverInterruptedRuns(): Promise<void> {
    const finishedAt = toIso()
    for (const [id, run] of this.runs.entries()) {
      if (run.status !== 'queued' && run.status !== 'running') continue
      await this.runs.put(id, {
        ...run,
        status: 'failed',
        finishedAt,
        error: {
          code: 'host_interrupted',
          message: 'DSH Host 在本次运行到达终态前停止。',
        },
        unread: true,
      })
    }
  }

  private async pruneWorkspaceHistory(workspaceId: string): Promise<void> {
    const terminalByAutomation = new Map<string, AutomationRun[]>()
    for (const run of [...this.runs.entries()]
      .map(([, run]) => run)
      .filter(run => run.targetSnapshot.workspaceId === workspaceId
        && run.status !== 'queued' && run.status !== 'running')
    ) {
      const existing = terminalByAutomation.get(run.automationId) ?? []
      existing.push(run)
      terminalByAutomation.set(run.automationId, existing)
    }
    for (const terminal of terminalByAutomation.values()) {
      terminal.sort(compareRuns)
      for (const run of terminal.slice(this.config.historyLimit)) await this.runs.delete(run.id)
    }
  }

  private async pruneAllHistory(): Promise<void> {
    const workspaces = new Set(
      [...this.runs.entries()].map(([, run]) => run.targetSnapshot.workspaceId),
    )
    for (const workspaceId of workspaces) await this.pruneWorkspaceHistory(workspaceId)
  }
}


