import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Translate } from './contracts.js'
import type { PermissionOption } from './protocol.js'
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
import { adoptPickedWorkspace, shouldConfirmFullAccess } from './create-modal-logic.js'
import { CheckOutlineIcon, FolderIcon, PlusIcon, ShieldIcon, SparkleIcon } from './icons.js'
import { MenuHostProvider, MenuPanel, MenuPopup, MenuRow, MenuSelect, useMenuState } from './menu.js'
import { RiskConfirmation } from '@deepseek-ai/dsh-client-ui-primitives'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
const KINDS: readonly ScheduleKind[] = ['once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom']
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))
const EFFORTS = ['none', 'low', 'medium', 'high'] as const

export function CreateModal({
  t, permissionT, busy, workspaces, models, defaultModel, skills, permissions, defaultPermission, draft, editing, onClose, onSubmit, onAddWorkspace, pickWorkspaceDirectory,
}: {
  readonly t: Translate
  readonly permissionT: PermissionTranslate
  readonly busy: boolean
  readonly workspaces: readonly { id: string; title: string; path: string }[]
  readonly models: readonly { provider: string; model: string; label: string }[]
  readonly defaultModel: { provider: string; model: string; label: string } | null
  readonly skills: readonly { id: string; name: string }[]
  readonly permissions: readonly PermissionOption[]
  readonly defaultPermission: string
  readonly draft?: Partial<AutomationFormState>
  readonly editing?: boolean
  readonly onClose: () => void
  readonly onSubmit: (form: AutomationFormState) => Promise<void>
  readonly onAddWorkspace?: (path: string) => Promise<string>
  readonly pickWorkspaceDirectory?: () => Promise<string | null>
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
    if (!fullAccessAcknowledged) return
    if (confirmingPermission === undefined) return
    update({ permission: confirmingPermission })
    cancelFullAccessConfirmation()
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
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
                  {pickWorkspaceDirectory !== undefined && onAddWorkspace !== undefined && (
                    <>
                  <div className="dsh-st-menu-split" />
                    <MenuRow
                      icon={<PlusIcon width={14} height={14} />}
                      label={t('form.addWorkspace')}
                      onClick={() => {
                        void (async () => {
                          try {
                            const id = await adoptPickedWorkspace({
                              pick: pickWorkspaceDirectory,
                              add: onAddWorkspace,
                            })
                            if (id !== null) update({ workspaceId: id })
                          } catch (caught) {
                            setValidationError(caught instanceof Error ? caught.message : t('error.action'))
                          }
                        })()
                      }}
                    />
                    </>
                  )}
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
                    label: permissionLabel(option, permissionT),
                    icon: <ShieldIcon width={14} height={14} />,
                  }))}
                  onChange={choosePermission}
                />
              </div>
              <div className="dsh-st-composer-right">
                <ModelPicker
                  t={t}
                  models={models}
                  modelKey={form.modelKey}
                  effort={form.reasoningEffort}
                  onModelKey={value => update({ modelKey: value })}
                  onEffort={value => update({ reasoningEffort: value })}
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
  t, models, modelKey, effort, onModelKey, onEffort,
}: {
  readonly t: Translate
  readonly models: readonly { provider: string; model: string; label: string }[]
  readonly modelKey: string
  readonly effort: string
  readonly onModelKey: (value: string) => void
  readonly onEffort: (value: string) => void
}): JSX.Element {
  const menu = useMenuState()
  const [pane, setPane] = useState<'root' | 'model' | 'effort'>('root')
  const selected = models.find(item => `${item.provider}::${item.model}` === modelKey)
  const modelLabel = selected === undefined ? t('form.modelDefault') : selected.label
  const effortLabel = t(`form.effort.${effort}` as 'form.effort.high')
  const trigger = effort === 'none' ? modelLabel : `${modelLabel} ${effortLabel}`
  const modelGroups = Array.from(models.reduce((groups, item) => {
    const group = groups.get(item.provider) ?? []
    group.push(item)
    groups.set(item.provider, group)
    return groups
  }, new Map<string, { provider: string; model: string; label: string }[]>()))

  const open = (next: 'root' | 'model' | 'effort'): void => {
    setPane(next)
    menu.setOpen(true)
  }

  return (
    <div className={`dsh-st-model-select${menu.open ? " is-open" : ""}`} ref={menu.root}>
      <button
        type="button"
        className="dsh-st-model-select-trigger"
        onMouseDown={event => event.stopPropagation()}
        onClick={() => {
          if (menu.open) {
            menu.setOpen(false)
            return
          }
          open('root')
        }}
      >
        <span>{trigger}</span>
        <em />
      </button>
      <MenuPopup open={menu.open} anchor={menu.root} menuRef={menu.menu} up end className="dsh-st-model-select-menu is-up is-end">
          {pane === 'root' && (
            <>
              <MenuRow kv label={t('form.model')} hint={modelLabel} chevron onClick={() => setPane('model')} />
              <MenuRow kv label={t('form.effort')} hint={effortLabel} chevron onClick={() => setPane('effort')} />
            </>
          )}
          {pane === 'model' && (
            <>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={modelKey === 'default'}
                className="dsh-st-model-option"
                onClick={() => { onModelKey('default'); menu.setOpen(false) }}
              >
                <span className="dsh-st-model-option-copy"><span className="dsh-st-model-name">{t('form.modelDefault')}</span></span>
                <span className="dsh-st-model-check">{modelKey === 'default' && <CheckOutlineIcon width={16} height={16} />}</span>
              </button>
              {modelGroups.map(([provider, group]) => (
                <section key={provider} role="group" aria-label={provider} className="dsh-st-model-group">
                  <div className="dsh-st-model-group-title">{provider}</div>
                  {group.map(item => {
                    const value = `${item.provider}::${item.model}`
                    return (
                      <button
                        key={value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={value === modelKey}
                        className="dsh-st-model-option"
                        title={item.label}
                        onClick={() => { onModelKey(value); menu.setOpen(false) }}
                      >
                        <span className="dsh-st-model-option-copy"><span className="dsh-st-model-name">{item.label}</span></span>
                        <span className="dsh-st-model-check">{value === modelKey && <CheckOutlineIcon width={16} height={16} />}</span>
                      </button>
                    )
                  })}
                </section>
              ))}
            </>
          )}
          {pane === 'effort' && EFFORTS.map(item => (
            <MenuRow
              key={item}
              label={t(`form.effort.${item}` as 'form.effort.high')}
              active={item === effort}
              onClick={() => { onEffort(item); menu.setOpen(false) }}
            />
          ))}
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




