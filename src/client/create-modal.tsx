import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ModelTranslate, Translate } from './contracts.js'
import type { ModelCatalogFailure, ModelOption, PermissionOption } from './protocol.js'
import { permissionLabel, type PermissionTranslate } from './permissions.js'
import {
  AutomationFormError,
  activeSlashQuery,
  applySlashSkill,
  defaultFormState,
  filterSlashSkills,
  splitSkillTokens,
  skillGestureToken,
  type AutomationFormState,
  type ScheduleKind,
} from './helpers.js'
import { shouldConfirmFullAccess } from './create-modal-logic.js'
import { WorkspacePickerUnavailableError } from './workspace-create.js'
import { PlusIcon } from './icons.js'
import { Button, Checkbox, Modal, RiskConfirmation, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import { blockHostModalBackdrop, Input, TextArea } from './plugin-ui.js'
import { MenuSelect, type MenuSelectOption } from './menu-select.js'

function formatProviderLabel(provider: string, defaultLabel: string, modelT: ModelTranslate, t: Translate): string {
  if (provider === 'deepseek-account') {
    const localized = modelT('provider.account')
    if (localized && localized !== 'provider.account') return localized
    return t('form.providerAccount')
  }
  return defaultLabel
}

function orderProviders(left: string, right: string): number {
  const leftRank = left === 'deepseek-account' ? 0 : left === 'deepseek-official' ? 1 : 2
  const rightRank = right === 'deepseek-account' ? 0 : right === 'deepseek-official' ? 1 : 2
  return leftRank - rightRank
}

function renderModelOptionLabel(item: ModelOption): React.ReactNode {
  const isOfficialFlash = (item.provider === 'deepseek-account' || item.provider === 'deepseek-official') && item.model === 'deepseek-flash'
  if (!isOfficialFlash) return item.label
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{item.label}</span>
      <Tag tone="info">1017</Tag>
    </span>
  )
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
const KINDS: readonly ScheduleKind[] = ['once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom']
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

export function CreateModal({
  t, permissionT, modelT, busy, workspaces, models, modelFailures, defaultModel, skills, permissions, defaultPermission, draft, editing, onClose, onSubmit, onAddWorkspace,
}: {
  readonly t: Translate
  readonly permissionT: PermissionTranslate
  readonly modelT: ModelTranslate
  readonly busy: boolean
  readonly workspaces: readonly { id: string; title: string; path: string }[]
  readonly models: readonly ModelOption[]
  readonly modelFailures: readonly ModelCatalogFailure[]
  readonly defaultModel: ModelOption | null
  readonly skills: readonly { id: string; name: string }[]
  readonly permissions: readonly PermissionOption[]
  readonly defaultPermission: string
  readonly draft?: Partial<AutomationFormState>
  readonly editing?: boolean
  readonly onClose: () => void
  readonly onSubmit: (form: AutomationFormState) => Promise<void>
  readonly onAddWorkspace?: () => Promise<string | undefined>
}): JSX.Element {
  const [form, setForm] = useState<AutomationFormState>(() => ({ ...defaultFormState(new Date(), workspaces, defaultModel, defaultPermission), ...draft }))
  const [validationError, setValidationError] = useState<string>()
  const [confirmingPermission, setConfirmingPermission] = useState<string>()
  const [fullAccessAcknowledged, setFullAccessAcknowledged] = useState(false)
  const [addingWorkspace, setAddingWorkspace] = useState(false)
  const [caret, setCaret] = useState(0)
  const [slashIndex, setSlashIndex] = useState(0)
  const [slashDismissed, setSlashDismissed] = useState<string>()
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const caretRef = useRef(0)
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      if (document.querySelector('[role="menu"]') !== null) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      if (confirmingPermission !== undefined) {
        setFullAccessAcknowledged(false)
        setConfirmingPermission(undefined)
        return
      }
      onClose()
    }
    const onClick = (event: MouseEvent): void => { blockHostModalBackdrop(event, 'dsh-st-create-dialog') }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [confirmingPermission, onClose])
  const update = (patch: Partial<AutomationFormState>): void => {
    setForm(current => ({ ...current, ...patch }))
    setValidationError(undefined)
  }
  const workspaceReady = workspaces.some(item => item.id === form.workspaceId)
  const handleAddWorkspace = async (): Promise<void> => {
    if (onAddWorkspace === undefined || addingWorkspace) return
    setAddingWorkspace(true)
    setValidationError(undefined)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    try {
      const id = await onAddWorkspace()
      if (id !== undefined) update({ workspaceId: id })
    } catch (caught) {
      if (caught instanceof WorkspacePickerUnavailableError) {
        setValidationError(t('form.workspaceUnavailable'))
      } else if (caught instanceof Error && caught.message !== '') {
        setValidationError(caught.message)
      } else {
        setValidationError(t('form.addWorkspaceFailed'))
      }
    } finally {
      setAddingWorkspace(false)
    }
  }
  const choosePermission = (permission: AutomationFormState['permission']): void => {
    if (shouldConfirmFullAccess(form.permission, permission)) {
      setFullAccessAcknowledged(false)
      setConfirmingPermission(permission)
      return
    }
    update({ permission })
  }
  const handleSubmit = async (event?: FormEvent): Promise<void> => {
    event?.preventDefault()
    try {
      await onSubmit(form)
    } catch (caught) {
      if (caught instanceof AutomationFormError) {
        setValidationError(t(caught.key))
        return
      }
      setValidationError(caught instanceof Error ? caught.message : t('error.action'))
    }
  }
  const datePart = form.onceAt.slice(0, 10)
  const timePart = form.onceAt.slice(11, 16) || '09:00'
  const today = localDateValue(new Date())
  const selected = models.find(item => `${item.provider}::${item.model}` === form.modelKey)
  const reasoning = selected?.reasoning
  const slash = activeSlashQuery(form.prompt, caret)
  const slashMatches = slash === undefined || slashDismissed === slash.query ? [] : filterSlashSkills(skills, slash.query)
  const slashActive = Math.min(slashIndex, Math.max(slashMatches.length - 1, 0))
  const rememberCaret = (value: number): void => {
    caretRef.current = value
    setCaret(value)
  }
  useEffect(() => {
    const selected = document.querySelector('.dsh-st-skill-menu [aria-selected="true"]')
    if (selected instanceof HTMLElement) selected.scrollIntoView({ block: 'nearest' })
  }, [slashActive, slash?.query])
  const chooseSlashSkill = (skill: { id: string; name: string }): void => {
    const next = applySlashSkill(form.prompt, caretRef.current, skillGestureToken(skill))
    update({ prompt: next.text })
    setSlashDismissed(undefined)
    queueMicrotask(() => {
      const el = promptRef.current
      if (el == null) return
      el.focus()
      el.setSelectionRange(next.caret, next.caret)
      rememberCaret(next.caret)
    })
  }

  return (
    <>
      <Modal
        open
        className="dsh-st-create-dialog"
        title={editing === true ? t('modal.edit') : t('modal.title')}
        closeLabel={t('form.cancel')}
        onClose={onClose}
        footer={(
          <>
            <Button variant="outline" className="dsh-st-modal-action" disabled={busy} onClick={onClose}>{t('form.cancel')}</Button>
            <Button variant="primary" className="dsh-st-modal-action" type="submit" form="dsh-st-create-form" disabled={busy || addingWorkspace || !workspaceReady}>{t('modal.save')}</Button>
          </>
        )}
      >
        <form id="dsh-st-create-form" className="dsh-st-form" onSubmit={(event) => { void handleSubmit(event) }}>
          <p>{t('form.subtitle')}</p>
          <label className="dsh-st-field">
            {t('form.name')}
            <Input value={form.name} placeholder={t('form.namePlaceholder')} onChange={event => update({ name: event.target.value })} />
          </label>
          <div className="dsh-st-plan-row">
            <div className="dsh-st-field">
              {t('form.planTime')}
              <div className="dsh-st-inline">
                <MenuSelect
                  value={form.scheduleKind}
                  options={KINDS.map(kind => ({ value: kind, label: t(`form.${kind}`) }))}
                  onChange={value => update({ scheduleKind: value as ScheduleKind })}
                />
                {form.scheduleKind === 'once' && (
                  <Input type="date" min={today} value={datePart} onChange={event => update({ onceAt: clampOnceAt(`${event.target.value}T${timePart}`) })} />
                )}
                {(form.scheduleKind === 'once' || form.scheduleKind === 'daily' || form.scheduleKind === 'weekly' || form.scheduleKind === 'monthly') && (
                  <TimeSelect
                    value={form.scheduleKind === 'once' ? timePart : form.time}
                    onChange={value => {
                      if (form.scheduleKind === 'once') update({ onceAt: clampOnceAt(`${datePart}T${value}`) })
                      else update({ time: value })
                    }}
                  />
                )}
                {form.scheduleKind === 'interval' && (
                  <>
                    <span className="dsh-st-suffix">{t('form.every')}</span>
                    <span className="dsh-st-amount"><Input type="number" min={1} value={form.everyMinutes} onChange={event => update({ everyMinutes: event.target.value })} /><span className="dsh-st-suffix">{t('form.minutes')}</span></span>
                  </>
                )}
                {form.scheduleKind === 'hourly' && (
                  <>
                    <MenuSelect value={form.hourlyMinute} options={MINUTES.map(item => ({ value: item, label: item }))} onChange={value => update({ hourlyMinute: value })} />
                    <span className="dsh-st-suffix">{t('form.minutesShort')}</span>
                  </>
                )}
                {form.scheduleKind === 'monthly' && (
                  <MenuSelect
                    value={form.monthDay}
                    options={Array.from({ length: 31 }, (_, index) => {
                      const day = String(index + 1)
                      return { value: day, label: t('form.monthDay', { day }) }
                    })}
                    onChange={value => update({ monthDay: value })}
                  />
                )}
                {form.scheduleKind === 'custom' && (
                  <>
                    <span className="dsh-st-suffix">{t('form.every')}</span>
                    <span className="dsh-st-amount"><Input type="number" min={1} value={form.customDays} onChange={event => update({ customDays: event.target.value })} /><span className="dsh-st-suffix">{t('form.daysShort')}</span></span>
                    <span className="dsh-st-suffix">{t('form.atTime')}</span>
                    <TimeSelect value={form.time} onChange={value => update({ time: value })} />
                  </>
                )}
              </div>
              {form.scheduleKind === 'interval' && <span className="dsh-st-plan-hint">{t('form.intervalHint')}</span>}
              {form.scheduleKind === 'custom' && <span className="dsh-st-plan-hint">{t('form.customHint')}</span>}
            </div>
            <label className="dsh-st-field dsh-st-concurrency" title={t('form.maxConcurrentRunsHint')}>
              {t('form.maxConcurrentRuns')}
              <Input type="number" min={1} step={1} value={form.maxConcurrentRuns} onChange={event => update({ maxConcurrentRuns: event.target.value })} />
            </label>
          </div>
          {form.scheduleKind === 'weekly' && (
            <div className="dsh-st-weekdays">
              {WEEKDAYS.map(day => (
                <Checkbox
                  key={day}
                  checked={form.weekdays.includes(day)}
                  label={t(`day.${day}`)}
                  onChange={checked => update({ weekdays: checked ? [...form.weekdays, day] : form.weekdays.filter(item => item !== day) })}
                />
              ))}
            </div>
          )}
          <div className="dsh-st-settings">
            <label className="dsh-st-picker-field">
              <span>{t('form.fieldWorkspace')}</span>
              {workspaces.length === 0 ? (
                <div className="dsh-st-workspace-empty">
                  <Button
                    variant="primary"
                    icon={<PlusIcon width={14} height={14} />}
                    disabled={addingWorkspace}
                    onClick={() => { void handleAddWorkspace() }}
                  >{t('form.addWorkspace')}</Button>
                  <span className="dsh-st-workspace-note">{t('form.workspaceRequired')}</span>
                </div>
              ) : (
                <MenuSelect
                  value={form.workspaceId}
                  label={t('form.fieldWorkspace')}
                  placeholder={t('form.workspace')}
                  options={workspaces.map(item => ({ value: item.id, label: item.title }))}
                  footer={[{ value: 'add-workspace', label: t('form.addWorkspace'), disabled: addingWorkspace }]}
                  onFooter={() => { void handleAddWorkspace() }}
                  onChange={value => update({ workspaceId: value })}
                />
              )}
            </label>
            <label className="dsh-st-picker-field">
              <span>{t('form.fieldModel')}</span>
              <MenuSelect
                value={form.modelKey}
                label={t('form.fieldModel')}
                groups={Array.from(models.reduce((groups, item) => {
                  const providerName = formatProviderLabel(item.provider, item.providerLabel, modelT, t)
                  const group = groups.get(item.provider) ?? { label: providerName, options: [] as MenuSelectOption[] }
                  group.options.push({
                    value: `${item.provider}::${item.model}`,
                    label: renderModelOptionLabel(item),
                    text: item.label,
                  })
                  groups.set(item.provider, group)
                  return groups
                }, new Map<string, { label: string; options: MenuSelectOption[] }>()))
                  .sort(([leftId], [rightId]) => orderProviders(leftId, rightId))
                  .map(([id, group]) => ({ id, label: group.label, options: group.options }))}
                onChange={value => {
                  const item = models.find(model => `${model.provider}::${model.model}` === value)
                  update({ modelKey: value, reasoningEffort: item?.reasoning?.defaultEffort ?? 'none' })
                }}
              />
            </label>
            <label className="dsh-st-picker-field">
              <span>{t('form.fieldEffort')}</span>
              <MenuSelect
                disabled={reasoning === undefined}
                value={reasoning === undefined ? '' : form.reasoningEffort}
                label={t('form.fieldEffort')}
                placeholder={modelT('effort.providerDefault')}
                options={reasoning === undefined ? [] : [
                  ...(reasoning.defaultEffort === undefined ? [{ value: 'none', label: modelT('effort.providerDefault') }] : []),
                  ...reasoning.efforts.map(item => ({ value: item.id, label: item.name })),
                ]}
                onChange={value => update({ reasoningEffort: value })}
              />
            </label>
            <label className="dsh-st-picker-field">
              <span>{t('form.fieldPermission')}</span>
              <MenuSelect
                value={form.permission}
                options={permissions.map(option => ({ value: option.value, label: permissionLabel(option, t) }))}
                onChange={value => choosePermission(value)}
              />
            </label>
          </div>
          <div className="dsh-st-field">
            <span className="dsh-st-prompt-label">{t('form.prompt')}<em>{t('form.slashHint')}</em></span>
            <div className="dsh-st-prompt-anchor">
              {slash !== undefined && slashDismissed !== slash.query && (
                <div className="dsh-st-skill-menu" role="listbox">
                  {slashMatches.length === 0 ? <p>{t('form.slashEmpty')}</p> : slashMatches.map((item, index) => (
                    <button
                      type="button"
                      key={item.id}
                      role="option"
                      aria-selected={index === slashActive}
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => chooseSlashSkill(item)}
                    >
                      <span>{item.name}</span>
                      <code>{skillGestureToken(item)}</code>
                    </button>
                  ))}
                </div>
              )}
              <div className="dsh-st-prompt-card">
              <div className="dsh-st-prompt-backdrop" aria-hidden="true">{splitSkillTokens(form.prompt, skills).map((part, index) => part.kind === 'skill' ? <span key={index} className="dsh-st-skill-token">{part.text}</span> : <span key={index}>{part.text}</span>)}</div>
              <TextArea
                ref={promptRef}
                spellCheck={false}
                className="dsh-st-prompt-input"
                value={form.prompt}
                placeholder={t('form.promptPlaceholder')}
                rows={4}
                onChange={event => { rememberCaret(event.target.selectionStart); update({ prompt: event.target.value }); setSlashDismissed(undefined) }}
                onSelect={event => rememberCaret(event.currentTarget.selectionStart)}
                onScroll={event => {
                  const backdrop = event.currentTarget.closest('.dsh-st-prompt-card')?.querySelector('.dsh-st-prompt-backdrop')
                  if (backdrop instanceof HTMLElement) backdrop.scrollTop = event.currentTarget.scrollTop
                }}
                onKeyDown={event => {
                  if (slash === undefined) return
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    setSlashDismissed(slash.query)
                    return
                  }
                  if (slashMatches.length === 0) return
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    setSlashIndex(current => (Math.min(current, slashMatches.length - 1) + 1) % slashMatches.length)
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setSlashIndex(current => (Math.min(current, slashMatches.length - 1) + slashMatches.length - 1) % slashMatches.length)
                  } else if (event.key === 'Enter' || event.key === 'Tab') {
                    event.preventDefault()
                    const chosen = slashMatches[slashActive]
                    if (chosen !== undefined) chooseSlashSkill(chosen)
                  }
                }}
              />
            </div>
            </div>
          </div>
          {modelFailures.map(failure => (
            <p key={failure.provider} className="dsh-st-error">{modelT('warning.groupLoad', { name: failure.providerLabel, message: failure.message })}</p>
          ))}
          {validationError !== undefined && <p className="dsh-st-error">{validationError}</p>}
        </form>
      </Modal>
      <RiskConfirmation
        open={confirmingPermission !== undefined}
        title={permissionT('confirm.title')}
        description={permissionT('confirm.description')}
        acknowledgeLabel={permissionT('confirm.acknowledge')}
        cancelLabel={permissionT('confirm.cancel')}
        closeLabel={permissionT('confirm.cancel')}
        confirmLabel={permissionT('confirm.enable')}
        acknowledged={fullAccessAcknowledged}
        onAcknowledgedChange={setFullAccessAcknowledged}
        onCancel={() => { setFullAccessAcknowledged(false); setConfirmingPermission(undefined) }}
        onConfirm={() => {
          if (!fullAccessAcknowledged || confirmingPermission === undefined) return
          update({ permission: confirmingPermission })
          setFullAccessAcknowledged(false)
          setConfirmingPermission(undefined)
        }}
      />
    </>
  )
}

function TimeSelect({ value, onChange }: { readonly value: string; readonly onChange: (value: string) => void }): JSX.Element {
  const [hour, minute] = value.split(':') as [string, string]
  return (
    <span className="dsh-st-time">
      <MenuSelect value={hour} options={HOURS.map(item => ({ value: item, label: item }))} onChange={next => onChange(`${next}:${minute}`)} />
      <span className="dsh-st-time-sep">:</span>
      <MenuSelect value={minute} options={MINUTES.map(item => ({ value: item, label: item }))} onChange={next => onChange(`${hour}:${next}`)} />
    </span>
  )
}

function localDateValue(now: Date): string {
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function clampOnceAt(value: string): string {
  const selected = new Date(value)
  const now = new Date()
  if (!Number.isFinite(selected.getTime()) || selected.getTime() > now.getTime()) return value
  const next = new Date(now.getTime() + 60_000)
  next.setSeconds(0, 0)
  const offset = next.getTimezoneOffset() * 60_000
  return new Date(next.getTime() - offset).toISOString().slice(0, 16)
}
