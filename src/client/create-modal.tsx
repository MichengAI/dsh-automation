import { useEffect, useState, type FormEvent } from 'react'
import type { Translate } from './contracts.js'
import {
  AutomationFormError,
  defaultFormState,
  type AutomationFormState,
  type ScheduleKind,
} from './helpers.js'
import { FolderIcon, ShieldIcon, SparkleIcon } from './icons.js'
import { MenuPanel, MenuSelect } from './menu.js'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
const KINDS: readonly ScheduleKind[] = ['once', 'interval', 'hourly', 'daily', 'weekly', 'monthly', 'custom']
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

export function CreateModal({
  t, busy, workspaces, models, defaultModel, skills, draft, editing, onClose, onSubmit,
}: {
  readonly t: Translate
  readonly busy: boolean
  readonly workspaces: readonly { id: string; title: string; path: string }[]
  readonly models: readonly { provider: string; model: string; label: string }[]
  readonly defaultModel: { provider: string; model: string; label: string } | null
  readonly skills: readonly { id: string; name: string }[]
  readonly draft?: Partial<AutomationFormState>
  readonly editing?: boolean
  readonly onClose: () => void
  readonly onSubmit: (form: AutomationFormState) => Promise<void>
}): JSX.Element {
  const [form, setForm] = useState<AutomationFormState>(() => ({ ...defaultFormState(new Date(), workspaces, defaultModel), ...draft }))
  const [validationError, setValidationError] = useState<string>()
  const update = (patch: Partial<AutomationFormState>): void => {
    setForm(current => ({ ...current, ...patch }))
    setValidationError(undefined)
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
  const workspace = workspaces.find(item => item.id === form.workspaceId)
  const skillLabel = form.skills.length === 1
    ? (skills.find(item => item.id === form.skills[0])?.name ?? t('form.skills'))
    : form.skills.length > 1
      ? `${t('form.skills')} ${form.skills.length}`
      : t('form.skills')
  return (
    <div className="dsh-st-mask" role="presentation" onClick={onClose}>
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
                <input type="date" value={datePart} onChange={event => update({ onceAt: `${event.target.value}T${timePart}` })} />
                <input type="time" value={timePart} onChange={event => update({ onceAt: `${datePart}T${event.target.value}` })} />
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
              <input type="time" value={form.time} onChange={event => update({ time: event.target.value })} />
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
                <input type="time" value={form.time} onChange={event => update({ time: event.target.value })} />
              </>
            )}
            {form.scheduleKind === 'custom' && (
              <>
                <input className="is-narrow" type="number" min={1} value={form.customDays} onChange={event => update({ customDays: event.target.value })} />
                <span className="dsh-st-suffix">{t('form.daysShort')}</span>
                <input type="time" value={form.time} onChange={event => update({ time: event.target.value })} />
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

        <label className="dsh-st-field">
          {t('form.prompt')}
          <div className="dsh-st-prompt-card">
            <textarea value={form.prompt} placeholder={t('form.promptPlaceholder')} onChange={event => update({ prompt: event.target.value })} />
            <div className="dsh-st-composer">
              <div className="dsh-st-composer-left">
                {editing === true ? (
                  <span className="dsh-st-chip-btn is-static"><FolderIcon width={14} height={14} />{workspace?.title || t('form.workspace')}</span>
                ) : (
                  <MenuPanel ghost label={<><FolderIcon width={14} height={14} />{workspace?.title || t('form.workspace')}</>}>
                    {workspaces.map(item => (
                      <button key={item.id} type="button" className={item.id === form.workspaceId ? 'is-on' : ''} onClick={() => update({ workspaceId: item.id })}>
                        {item.title}
                        <small>{item.path}</small>
                      </button>
                    ))}
                  </MenuPanel>
                )}
                <MenuPanel ghost label={<><SparkleIcon width={14} height={14} />{skillLabel}</>}>
                  {skills.length === 0 && <div className="dsh-st-select-empty">{t('form.skillsEmpty')}</div>}
                  {skills.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className={form.skills.includes(item.id) ? 'is-on' : ''}
                      onClick={() => update({
                        skills: form.skills.includes(item.id)
                          ? form.skills.filter(id => id !== item.id)
                          : [...form.skills, item.id],
                      })}
                    >
                      {item.name}
                    </button>
                  ))}
                </MenuPanel>
                <MenuSelect
                  pill
                  icon={<ShieldIcon width={14} height={14} />}
                  value={form.permission}
                  options={[
                    { value: 'read-only', label: t('form.readOnly') },
                    { value: 'workspace-write', label: t('form.workspaceWrite') },
                  ]}
                  onChange={value => update({ permission: value })}
                />
              </div>
              <div className="dsh-st-composer-right">
                <MenuSelect
                  pill
                  value={form.modelKey}
                  options={[
                    { value: 'default', label: t('form.modelDefault') },
                    ...models.map(item => ({ value: `${item.provider}::${item.model}`, label: item.label })),
                  ]}
                  onChange={value => update({ modelKey: value })}
                />
              </div>
            </div>
          </div>
        </label>

        {validationError !== undefined && <p className="dsh-st-error">{validationError}</p>}
        <div className="dsh-st-modal-actions">
          <button type="button" className="dsh-st-btn" onClick={onClose} disabled={busy}>{t('form.cancel')}</button>
          <button type="submit" className="dsh-st-btn dsh-st-btn--primary" disabled={busy}>{t('modal.save')}</button>
        </div>
      </form>
    </div>
  )
}
