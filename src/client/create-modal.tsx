import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ModelTranslate, Translate } from './contracts.js'
import type { ModelCatalogFailure, ModelOption, PermissionOption } from './protocol.js'
import { permissionLabel, type PermissionTranslate } from './permissions.js'
import {
  AutomationFormError,
  defaultFormState,
  insertSkillGesture,
  prettyModelName,
  skillGestureToken,
  type AutomationFormState,
  type ScheduleKind,
} from './helpers.js'
import { shouldConfirmFullAccess } from './create-modal-logic.js'
import { FolderIcon, ShieldIcon, SparkleIcon } from './icons.js'
import { MenuHostProvider, MenuPanel, MenuPopup, MenuRow, MenuSelect, useMenuState } from './menu.js'
import { IconCheckOutline16, IconChevronDownOutline14, RiskConfirmation } from '@deepseek-ai/dsh-client-ui-primitives'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
const KINDS: readonly ScheduleKind[] = ['once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom']
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

export function CreateModal({
  t, permissionT, modelT, busy, workspaces, models, modelFailures, defaultModel, skills, permissions, defaultPermission, draft, editing, onClose, onSubmit,
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
}): JSX.Element {
  const [form, setForm] = useState<AutomationFormState>(() => ({ ...defaultFormState(new Date(), workspaces, defaultModel, defaultPermission), ...draft }))
  const [validationError, setValidationError] = useState<string>()
  const [confirmingPermission, setConfirmingPermission] = useState<string>()
  const [fullAccessAcknowledged, setFullAccessAcknowledged] = useState(false)
  const update = (patch: Partial<AutomationFormState>): void => {
    setForm(current => ({ ...current, ...patch }))
    setValidationError(undefined)
  }
  const choosePermission = (permission: AutomationFormState['permission']): void => {
    if (shouldConfirmFullAccess(form.permission, permission)) {
      setFullAccessAcknowledged(false)
      setConfirmingPermission(permission)
      return
    }
    update({ permission })
  }
  const cancelFullAccessConfirmation = (): void => {
    setFullAccessAcknowledged(false)
    setConfirmingPermission(undefined)
  }
  const confirmFullAccess = (): void => {
    if (!fullAccessAcknowledged || confirmingPermission === undefined) return
    update({ permission: confirmingPermission })
    cancelFullAccessConfirmation()
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      if (document.querySelector('.dsh-st-model-select-menu') !== null) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => { window.removeEventListener('keydown', onKey, true) }
  }, [onClose])

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
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
  const minOnceTime = datePart === today ? localTimeValue(new Date()) : undefined
  const [menuHost, setMenuHost] = useState<HTMLDivElement | null>(null)
  const workspace = workspaces.find(item => item.id === form.workspaceId)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const caretRef = useRef(0)
  const rememberCaret = (): void => {
    const el = promptRef.current
    if (el !== null) caretRef.current = el.selectionStart
  }
  const insertSkill = (skill: { id: string; name: string }): void => {
    const next = insertSkillGesture(form.prompt, skillGestureToken(skill), caretRef.current)
    update({ prompt: next.text })
    queueMicrotask(() => {
      const el = promptRef.current
      if (el === null) return
      el.focus()
      el.setSelectionRange(next.caret, next.caret)
      caretRef.current = next.caret
    })
  }
  return (
    <div className="dsh-st-mask" role="presentation">
      <MenuHostProvider host={menuHost}>
      <form className="dsh-st-modal" onClick={event => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="dsh-st-modal-head">
          <div>
            <h2>{editing === true ? t('modal.edit') : t('modal.title')}</h2>
            <p>{t('form.subtitle')}</p>
          </div>
          <button type="button" className="dsh-st-icon" onClick={onClose} aria-label={t('form.cancel')}>×</button>
        </div>

        <label className="dsh-st-field">
          {t('form.name')}
          <input value={form.name} placeholder={t('form.namePlaceholder')} onChange={event => update({ name: event.target.value })} />
        </label>

        <div className="dsh-st-field">
          {t('form.planTime')}
          <div className="dsh-st-inline">
            <MenuSelect
              value={form.scheduleKind}
              options={KINDS.map(kind => ({ value: kind, label: t(`form.${kind}`) }))}
              onChange={value => update({ scheduleKind: value })}
            />
            {form.scheduleKind === 'once' && (
              <>
                <input type="date" min={today} value={datePart} onChange={event => update({ onceAt: clampOnceAt(`${event.target.value}T${timePart}`) })} />
                <TimeSelect value={timePart} {...(minOnceTime === undefined ? {} : { minTime: minOnceTime })} onChange={value => update({ onceAt: clampOnceAt(`${datePart}T${value}`) })} />
              </>
            )}
            {form.scheduleKind === 'interval' && (
              <>
                <input className="is-narrow" type="number" min={5} value={form.everyMinutes} onChange={event => update({ everyMinutes: event.target.value })} />
                <span className="dsh-st-suffix">{t('form.minutesShort')}</span>
              </>
            )}
            {form.scheduleKind === 'hourly' && (
              <>
                <MenuSelect value={form.hourlyMinute} options={MINUTES.map(item => ({ value: item, label: item }))} onChange={value => update({ hourlyMinute: value })} />
                <span className="dsh-st-suffix">{t('form.minutesShort')}</span>
              </>
            )}
            {(form.scheduleKind === 'daily' || form.scheduleKind === 'weekly') && (
              <TimeSelect value={form.time} onChange={value => update({ time: value })} />
            )}
            {form.scheduleKind === 'monthly' && (
              <>
                <MenuSelect
                  value={form.monthDay}
                  options={Array.from({ length: 31 }, (_, index) => {
                    const day = String(index + 1)
                    return { value: day, label: t('form.monthDay', { day }) }
                  })}
                  onChange={value => update({ monthDay: value })}
                />
                <TimeSelect value={form.time} onChange={value => update({ time: value })} />
              </>
            )}
            {form.scheduleKind === 'custom' && (
              <>
                <input className="is-narrow" type="number" min={1} value={form.customDays} onChange={event => update({ customDays: event.target.value })} />
                <span className="dsh-st-suffix">{t('form.daysShort')}</span>
                <TimeSelect value={form.time} onChange={value => update({ time: value })} />
              </>
            )}
          </div>
        </div>

        {form.scheduleKind === 'weekly' && (
          <div className="dsh-st-weekdays">
            {WEEKDAYS.map(day => (
              <button
                key={day}
                type="button"
                className={form.weekdays.includes(day) ? 'is-on' : ''}
                onClick={() => update({
                  weekdays: form.weekdays.includes(day) ? form.weekdays.filter(value => value !== day) : [...form.weekdays, day],
                })}
              >
                {t(`day.${day}`)}
              </button>
            ))}
          </div>
        )}

        <div className="dsh-st-field">
          <span>{t('form.prompt')}</span>
          <div className="dsh-st-prompt-card">
            <textarea ref={promptRef} value={form.prompt} placeholder={t('form.promptPlaceholder')} onChange={event => { rememberCaret(); update({ prompt: event.target.value }) }} onSelect={rememberCaret} onClick={rememberCaret} onKeyUp={rememberCaret} />
            <div className="dsh-st-composer">
              <div className="dsh-st-composer-left">
                <MenuPanel ghost up label={<><FolderIcon width={14} height={14} />{workspace?.title || t('form.workspace')}</>}>
                  {workspaces.length === 0 && <div className="dsh-st-select-empty">{t('form.error.workspace')}</div>}
                  {workspaces.map(item => (
                    <MenuRow
                      key={item.id}
                      icon={<FolderIcon width={14} height={14} />}
                      label={item.title}
                      active={item.id === form.workspaceId}
                      onClick={() => update({ workspaceId: item.id })}
                    />
                  ))}
                </MenuPanel>
                <MenuPanel ghost up label={<><SparkleIcon width={14} height={14} />{t('form.skills')}</>}>
                  {skills.length === 0 && <div className="dsh-st-select-empty">{t('form.skillsEmpty')}</div>}
                  {skills.map(item => (
                    <MenuRow
                      key={item.id}
                      icon={<SparkleIcon width={14} height={14} />}
                      label={item.name}
                      onClick={() => insertSkill(item)}
                    />
                  ))}
                </MenuPanel>
                <MenuSelect
                  pill
                  up
                  icon={<ShieldIcon width={14} height={14} />}
                  value={form.permission}
                  options={permissions.map(option => ({
                    value: option.value,
                    label: permissionLabel(option, t),
                    icon: <ShieldIcon width={14} height={14} />,
                  }))}
                  onChange={choosePermission}
                />
              </div>
              <div className="dsh-st-composer-right">
                <ModelPicker
                  modelT={modelT}
                  models={models}
                  failures={modelFailures}
                  modelKey={form.modelKey}
                  reasoningEffort={form.reasoningEffort}
                  onSelection={(modelKey, reasoningEffort) => update({ modelKey, reasoningEffort })}
                />
              </div>
            </div>
          </div>
        </div>


        {validationError !== undefined && <p className="dsh-st-error">{validationError}</p>}
        <div className="dsh-st-modal-actions">
          <button type="button" className="dsh-st-btn" onClick={onClose} disabled={busy}>{t('form.cancel')}</button>
          <button type="submit" className="dsh-st-btn dsh-st-btn--primary" disabled={busy}>{t('modal.save')}</button>
        </div>
      </form>
      <div className="dsh-st-flyout-root" ref={setMenuHost} />
      <RiskConfirmation
        open={confirmingPermission !== undefined}
        title={permissionT('confirm.title')}
        description={permissionT('confirm.description')}
        acknowledgeLabel={permissionT('confirm.acknowledge')}
        cancelLabel={permissionT('confirm.cancel')}
        confirmLabel={permissionT('confirm.enable')}
        acknowledged={fullAccessAcknowledged}
        onAcknowledgedChange={setFullAccessAcknowledged}
        onCancel={cancelFullAccessConfirmation}
        onConfirm={confirmFullAccess}
      />
      </MenuHostProvider>
    </div>
  )
}

function ModelPicker({
  modelT, models, failures, modelKey, reasoningEffort, onSelection,
}: {
  readonly modelT: ModelTranslate
  readonly models: readonly ModelOption[]
  readonly failures: readonly ModelCatalogFailure[]
  readonly modelKey: string
  readonly reasoningEffort: string
  readonly onSelection: (modelKey: string, reasoningEffort: string) => void
}): JSX.Element {
  const menu = useMenuState()
  const [pane, setPane] = useState<'root' | 'model' | 'effort'>('root')
  const selected = models.find(item => `${item.provider}::${item.model}` === modelKey)
  const reasoning = selected?.reasoning
  const effectiveEffort = reasoningEffort === 'none'
    ? reasoning?.defaultEffort
    : reasoningEffort
  const effortLabel = reasoning === undefined
    ? undefined
    : effectiveEffort === undefined
      ? modelT('effort.providerDefault')
      : reasoning.efforts.find(item => item.id === effectiveEffort)?.name ?? effectiveEffort
  const trigger = selected?.label ?? modelT('trigger.fallback')
  const modelGroups = Array.from(models.reduce((groups, item) => {
    const group = groups.get(item.provider) ?? { label: item.providerLabel, models: [] }
    group.models.push(item)
    groups.set(item.provider, group)
    return groups
  }, new Map<string, { label: string; models: ModelOption[] }>()))

  useEffect(() => {
    if (!menu.open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      if (pane !== 'root') setPane('root')
      else menu.setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => { window.removeEventListener('keydown', onKey, true) }
  }, [menu.open, menu.setOpen, pane])

  const selectModel = (item: ModelOption): void => {
    onSelection(
      `${item.provider}::${item.model}`,
      item.reasoning?.defaultEffort ?? 'none',
    )
    menu.setOpen(false)
    setPane('root')
  }

  const selectEffort = (effort: string): void => {
    onSelection(modelKey, effort)
    menu.setOpen(false)
    setPane('root')
  }

  return (
    <div className={`dsh-st-model-select${menu.open ? " is-open" : ""}`} ref={menu.root}>
      <button
        type="button"
        className="dsh-st-model-select-trigger"
        aria-label={selected === undefined
          ? modelT('trigger.selectAria')
          : effortLabel === undefined
            ? modelT('trigger.aria', { model: selected.label })
            : modelT('trigger.ariaEffort', { model: selected.label, effort: effortLabel })}
        onMouseDown={event => event.stopPropagation()}
        onClick={() => {
          if (menu.open) {
            menu.setOpen(false)
            return
          }
          setPane('root')
          menu.setOpen(true)
        }}
      >
        <span>{trigger}</span>
        {effortLabel !== undefined && <span className="dsh-st-model-trigger-effort">{effortLabel}</span>}
        <IconChevronDownOutline14 className={`dsh-st-model-trigger-chevron${menu.open ? ' is-open' : ''}`} />
      </button>
      <MenuPopup open={menu.open} anchor={menu.root} menuRef={menu.menu} up end className="dsh-st-model-select-menu is-up is-end" ariaLabel={modelT('menu.aria')}>
        {pane === 'root' && (
          <>
            <MenuRow
              kv
              label={modelT('menu.model')}
              hint={selected?.label ?? modelT('trigger.fallback')}
              chevron
              onClick={() => setPane('model')}
            />
            {reasoning !== undefined && (
              <MenuRow
                kv
                label={modelT('menu.effort')}
                hint={effortLabel ?? modelT('effort.providerDefault')}
                chevron
                onClick={() => setPane('effort')}
              />
            )}
          </>
        )}
        {pane === 'model' && (
          <>
            {failures.map(failure => (
              <div key={failure.provider} className="dsh-st-model-warning">
                {modelT('warning.groupLoad', { name: failure.providerLabel, message: failure.message })}
              </div>
            ))}
            {modelGroups.map(([provider, group]) => (
          <section key={provider} role="group" aria-label={group.label} className="dsh-st-model-group">
            <div className="dsh-st-model-group-title">{group.label}</div>
            {group.models.map(item => {
              const value = `${item.provider}::${item.model}`
              return (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={value === modelKey}
                  className="dsh-st-model-option"
                  title={item.label}
                  onClick={() => selectModel(item)}
                >
                  <span className="dsh-st-model-option-copy">
                    <span className="dsh-st-model-name">{item.label}</span>
                    {item.description !== undefined && <span className="dsh-st-model-description">{item.description}</span>}
                  </span>
                  <span className="dsh-st-model-check">{value === modelKey && <IconCheckOutline16 />}</span>
                </button>
              )
            })}
          </section>
            ))}
            {modelGroups.length === 0 && failures.length === 0 && <div className="dsh-st-model-empty">{modelT('empty.models')}</div>}
          </>
        )}
        {pane === 'effort' && reasoning !== undefined && (
          <>
            {reasoning.defaultEffort === undefined && (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={reasoningEffort === 'none'}
                className="dsh-st-model-option"
                onClick={() => selectEffort('none')}
              >
                <span className="dsh-st-model-option-copy"><span className="dsh-st-model-name">{modelT('effort.providerDefault')}</span></span>
                <span className="dsh-st-model-check">{reasoningEffort === 'none' && <IconCheckOutline16 />}</span>
              </button>
            )}
            {reasoning.efforts.map(item => (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={effectiveEffort === item.id}
                className="dsh-st-model-option"
                onClick={() => selectEffort(item.id)}
              >
                <span className="dsh-st-model-option-copy">
                  <span className="dsh-st-model-name">{item.name}</span>
                  {item.description !== undefined && <span className="dsh-st-model-description">{item.description}</span>}
                </span>
                <span className="dsh-st-model-check">{effectiveEffort === item.id && <IconCheckOutline16 />}</span>
              </button>
            ))}
            {reasoning.efforts.length === 0 && reasoning.defaultEffort !== undefined && <div className="dsh-st-model-empty">{modelT('empty.efforts')}</div>}
          </>
        )}
      </MenuPopup>
    </div>
  )
}


function TimeSelect({
  value,
  onChange,
  minTime,
}: {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly minTime?: string
}): JSX.Element {
  const hour = value.slice(0, 2) || '09'
  const minute = value.slice(3, 5) || '00'
  const minHour = minTime?.slice(0, 2)
  const minMinute = minTime?.slice(3, 5)
  const hours = HOURS.filter(item => minHour === undefined || item >= minHour)
  const minutes = MINUTES.filter(item => minHour === undefined || hour > minHour || minMinute === undefined || item >= minMinute)
  return (
    <div className="dsh-st-time">
      <MenuSelect value={hour} options={hours.map(item => ({ value: item, label: item }))} onChange={next => onChange(`${next}:${minute}`)} />
      <span className="dsh-st-time-sep">:</span>
      <MenuSelect value={minute} options={minutes.map(item => ({ value: item, label: item }))} onChange={next => onChange(`${hour}:${next}`)} />
    </div>
  )
}

function localDateValue(now: Date): string {
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function localTimeValue(now: Date): string {
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(11, 16)
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




