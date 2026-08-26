import { useEffect } from 'react'
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
}): JSX.Element | null {
  useEffect(() => {
    if (target === undefined || busy) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [busy, onCancel, target])

  if (target === undefined) return null
  return (
    <div className="dsh-st-mask" onMouseDown={event => event.stopPropagation()}>
      <section
        className="dsh-st-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dsh-st-confirm-delete-title"
        aria-describedby="dsh-st-confirm-delete-description"
        onMouseDown={event => event.stopPropagation()}
      >
        <h2 id="dsh-st-confirm-delete-title">{t('card.confirmDelete')}</h2>
        <p className="dsh-st-confirm-target">{target.name}</p>
        <p id="dsh-st-confirm-delete-description">{t('card.confirmDeleteHint')}</p>
        <div className="dsh-st-modal-actions">
          <button type="button" className="dsh-st-btn" autoFocus disabled={busy} onClick={onCancel}>{t('card.cancel')}</button>
          <button type="button" className="dsh-st-btn dsh-st-btn--danger" disabled={busy} onClick={onConfirm}>{t('card.confirm')}</button>
        </div>
      </section>
    </div>
  )
}
