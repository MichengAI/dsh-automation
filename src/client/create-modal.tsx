import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ModelTranslate, Translate } from './contracts.js'
import type { ModelCatalogFailure, ModelOption, PermissionOption } from './protocol.js'
import { permissionLabel, type PermissionTranslate } from './permissions.js'
import {
  AutomationFormError,
  defaultFormState,
  insertSkillGesture,
  skillGestureToken,
  type AutomationFormState,
  type ScheduleKind,
} from './helpers.js'
import { shouldConfirmFullAccess } from './create-modal-logic.js'
import { FolderIcon, ShieldIcon, SparkleIcon } from './icons.js'
import type { TextAreaRef } from 'antd/es/input/TextArea.js'
import { AntdProvider, Button, Checkbox, Dropdown, Input, Modal, Select } from './antd-ui.js'

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
  const promptRef = useRef<TextAreaRef>(null)
  const caretRef = useRef(0)
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      if (document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden), .ant-dropdown:not(.ant-dropdown-hidden)') !== null) return
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
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [confirmingPermission, onClose])
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
  const insertSkill = (skill: { id: string; name: string }): void => {
    const next = insertSkillGesture(form.prompt, skillGestureToken(skill), caretRef.current)
    update({ prompt: next.text })
    queueMicrotask(() => {
      const el = promptRef.current?.resizableTextArea?.textArea
      if (el == null) return
      el.focus()
      el.setSelectionRange(next.caret, next.caret)
      caretRef.current = next.caret
    })
  }

  return (
    <AntdProvider>
      <Modal
        open
        title={editing === true ? t('modal.edit') : t('modal.title')}
        onCancel={onClose}
        maskClosable={false}
        keyboard={false}
        width={720}
        destroyOnHidden
        footer={[
          <Button key="cancel" disabled={busy} onClick={onClose}>{t('form.cancel')}</Button>,
          <Button key="save" htmlType="submit" form="dsh-st-create-form" type="primary" disabled={busy}>{t('modal.save')}</Button>,
        ]}
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
                <Select
                  value={form.scheduleKind}
                  options={KINDS.map(kind => ({ value: kind, label: t(`form.${kind}`) }))}
                  onChange={value => update({ scheduleKind: value })}
                />
                {form.scheduleKind === 'once' && (
                  <Input type="date" min={today} value={datePart} onChange={event => update({ onceAt: clampOnceAt(`${event.target.value}T${timePart}`) })} />
                )}
                {(form.scheduleKind === 'once' || form.scheduleKind === 'daily' || form.scheduleKind === 'weekly' || form.scheduleKind === 'monthly' || form.scheduleKind === 'custom') && (
                  <TimeSelect
                    value={form.scheduleKind === 'once' ? timePart : form.time}
                    onChange={value => {
                      if (form.scheduleKind === 'once') update({ onceAt: clampOnceAt(`${datePart}T${value}`) })
                      else update({ time: value })
                    }}
                  />
                )}
                {form.scheduleKind === 'interval' && (
                  <Input type="number" min={1} value={form.everyMinutes} addonAfter={t('form.minutesShort')} onChange={event => update({ everyMinutes: event.target.value })} />
                )}
                {form.scheduleKind === 'hourly' && (
                  <>
                    <Select value={form.hourlyMinute} options={MINUTES.map(item => ({ value: item, label: item }))} onChange={value => update({ hourlyMinute: value })} />
                    <span className="dsh-st-suffix">{t('form.minutesShort')}</span>
                  </>
                )}
                {form.scheduleKind === 'monthly' && (
                  <Select
                    value={form.monthDay}
                    options={Array.from({ length: 31 }, (_, index) => {
                      const day = String(index + 1)
                      return { value: day, label: t('form.monthDay', { day }) }
                    })}
                    onChange={value => update({ monthDay: value })}
                  />
                )}
                {form.scheduleKind === 'custom' && (
                  <Input type="number" min={1} value={form.customDays} addonAfter={t('form.daysShort')} onChange={event => update({ customDays: event.target.value })} />
                )}
              </div>
            </div>
            <label className="dsh-st-field dsh-st-concurrency" title={t('form.maxConcurrentRunsHint')}>
              {t('form.maxConcurrentRuns')}
              <Input type="number" min={1} step={1} value={form.maxConcurrentRuns} onChange={event => update({ maxConcurrentRuns: event.target.value })} />
            </label>
          </div>
          {form.scheduleKind === 'weekly' && (
            <Checkbox.Group
              options={WEEKDAYS.map(day => ({ label: t(`day.${day}`), value: String(day) }))}
              value={form.weekdays.map(String)}
              onChange={value => update({ weekdays: value.map(item => Number(item)) })}
            />
          )}
          <div className="dsh-st-field">
            <span>{t('form.prompt')}</span>
            <div className="dsh-st-prompt-card">
              <Input.TextArea
                ref={promptRef}
                variant="borderless"
                value={form.prompt}
                placeholder={t('form.promptPlaceholder')}
                autoSize={{ minRows: 4, maxRows: 10 }}
                onChange={event => { caretRef.current = event.target.selectionStart; update({ prompt: event.target.value }) }}
                onSelect={event => { caretRef.current = event.currentTarget.selectionStart }}
              />
              <div className="dsh-st-composer">
                <div className="dsh-st-composer-left">
                  <Select
                    variant="borderless"
                    size="small"
                    prefix={<FolderIcon width={14} height={14} />}
                    value={form.workspaceId}
                    placeholder={t('form.workspace')}
                    popupMatchSelectWidth={false}
                    options={workspaces.map(item => ({ value: item.id, label: item.title }))}
                    onChange={value => update({ workspaceId: value })}
                  />
                  <Dropdown
                    menu={{ items: skills.length === 0 ? [{ key: 'empty', label: t('form.skillsEmpty'), disabled: true }] : skills.map(item => ({ key: item.id, label: item.name, onClick: () => insertSkill(item) })) }}
                  >
                    <Button type="text" icon={<SparkleIcon width={14} height={14} />}>{t('form.skills')}</Button>
                  </Dropdown>
                  <Select
                    variant="borderless"
                    size="small"
                    prefix={<ShieldIcon width={14} height={14} />}
                    value={form.permission}
                    popupMatchSelectWidth={false}
                    options={permissions.map(option => ({ value: option.value, label: permissionLabel(option, t) }))}
                    onChange={value => choosePermission(value)}
                  />
                </div>
                <div className="dsh-st-composer-right">
                  <Select
                    variant="borderless"
                    size="small"
                    value={form.modelKey}
                    popupMatchSelectWidth={false}
                    options={Array.from(models.reduce((groups, item) => {
                      const group = groups.get(item.provider) ?? { label: item.providerLabel, options: [] as { value: string; label: string }[] }
                      group.options.push({ value: `${item.provider}::${item.model}`, label: item.label })
                      groups.set(item.provider, group)
                      return groups
                    }, new Map<string, { label: string; options: { value: string; label: string }[] }>()), ([, group]) => group)}
                    onChange={value => {
                      const item = models.find(model => `${model.provider}::${model.model}` === value)
                      update({ modelKey: value, reasoningEffort: item?.reasoning?.defaultEffort ?? 'none' })
                    }}
                  />
                  {reasoning !== undefined && (
                    <Select
                      variant="borderless"
                      size="small"
                      value={form.reasoningEffort}
                      popupMatchSelectWidth={false}
                      options={[
                        ...(reasoning.defaultEffort === undefined ? [{ value: 'none', label: modelT('effort.providerDefault') }] : []),
                        ...reasoning.efforts.map(item => ({ value: item.id, label: item.name })),
                      ]}
                      onChange={value => update({ reasoningEffort: value })}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          {modelFailures.map(failure => (
            <p key={failure.provider} className="dsh-st-error">{modelT('warning.groupLoad', { name: failure.providerLabel, message: failure.message })}</p>
          ))}
          {validationError !== undefined && <p className="dsh-st-error">{validationError}</p>}
        </form>
        <Modal
          open={confirmingPermission !== undefined}
          title={permissionT('confirm.title')}
          keyboard={false}
          maskClosable={false}
          okText={permissionT('confirm.enable')}
          cancelText={permissionT('confirm.cancel')}
          okButtonProps={{ disabled: !fullAccessAcknowledged }}
          onCancel={() => { setFullAccessAcknowledged(false); setConfirmingPermission(undefined) }}
          onOk={() => {
            if (!fullAccessAcknowledged || confirmingPermission === undefined) return
            update({ permission: confirmingPermission })
            setFullAccessAcknowledged(false)
            setConfirmingPermission(undefined)
          }}
        >
          <p>{permissionT('confirm.description')}</p>
          <Checkbox checked={fullAccessAcknowledged} onChange={event => setFullAccessAcknowledged(event.target.checked)}>{permissionT('confirm.acknowledge')}</Checkbox>
        </Modal>
      </Modal>
    </AntdProvider>
  )
}

function TimeSelect({ value, onChange }: { readonly value: string; readonly onChange: (value: string) => void }): JSX.Element {
  const [hour, minute] = [value.slice(0, 2) || '09', value.slice(3, 5) || '00']
  return (
    <span className="dsh-st-time">
      <Select value={hour} options={HOURS.map(item => ({ value: item, label: item }))} onChange={next => onChange(`${next}:${minute}`)} />
      <span className="dsh-st-time-sep">:</span>
      <Select value={minute} options={MINUTES.map(item => ({ value: item, label: item }))} onChange={next => onChange(`${hour}:${next}`)} />
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
