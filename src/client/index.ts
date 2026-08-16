import { createElement, useEffect } from 'react'
import { AutomationView } from './AutomationView.js'
import type { ClientContext } from './contracts.js'
import { en, NS, zh } from './locales.js'
import { createAutomationRuntime } from './runtime.js'
import { applyPrefillToDom, peekChatPrefill, subscribeChatPrefill, takeChatPrefill } from './prefill.js'
import { installStyles } from './styles.js'

export const name = 'dsh-automation-client'
export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => installStyles(), 'dsh-automation: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-automation: locale')
  const t = ctx.locale.bind(NS)
  const runtime = createAutomationRuntime(ctx.connection.rpc)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'scheduled-tasks',
    order: 28,
    locale: NS,
    label: () => t('tab'),
  }, function ScheduledTasksSettings(props: { close?: () => void }) {
    return createElement(AutomationView, { t, runtime, ...(props.close === undefined ? {} : { closeSettings: props.close }) })
  }))
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'dsh-automation-prefill',
    order: 80,
    locale: NS,
  }, PrefillBridge))
}

function PrefillBridge(props: { inputActions?: { setDraft(text: string): void } }): null {
  useEffect(() => {
    const apply = (text: string | null): void => {
      if (text === null || text === '') return
      if (props.inputActions !== undefined) {
        props.inputActions.setDraft(text)
        takeChatPrefill()
        return
      }
      if (applyPrefillToDom(text)) takeChatPrefill()
    }
    apply(peekChatPrefill())
    return subscribeChatPrefill(apply)
  }, [props.inputActions])
  return null
}
