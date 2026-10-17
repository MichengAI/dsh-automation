import { useEffect } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { blockHostModalBackdrop } from './plugin-ui.js'
import type { Translate } from './contracts.js'

export function DeleteConfirmation({
  target,
  t,
  busy,
  onCancel,
  onConfirm,
}: {
  readonly target: { readonly id: string; readonly name: string } | undefined
  readonly t: Translate
  readonly busy: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}): JSX.Element {
  useEffect(() => {
    if (target === undefined) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      onCancel()
    }
    const onClick = (event: MouseEvent): void => { blockHostModalBackdrop(event, 'dsh-st-delete-dialog') }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [onCancel, target])
  return (
    <Modal
      open={target !== undefined}
      className="dsh-st-delete-dialog"
      title={t('card.confirmDelete')}
      {...(target === undefined ? {} : { description: `${target.name} ${t('card.confirmDeleteHint')}` })}
      closeLabel={t('card.cancel')}
      onClose={onCancel}
      footer={(
        <>
          <Button variant="outline" className="dsh-st-modal-action" disabled={busy} onClick={onCancel}>{t('card.cancel')}</Button>
          <Button variant="outline" className="dsh-st-modal-action dsh-st-btn-danger" disabled={busy} onClick={onConfirm}>{t('card.confirm')}</Button>
        </>
      )}
    />
  )
}
