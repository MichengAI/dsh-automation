import { useEffect } from 'react'
import { AntdProvider, Button, Modal } from './antd-ui.js'
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
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel, target])
  return (
    <AntdProvider>
      <Modal
        open={target !== undefined}
        title={t('card.confirmDelete')}
        onCancel={onCancel}
        maskClosable={false}
        keyboard={false}
        footer={[
          <Button key="cancel" disabled={busy} onClick={onCancel}>{t('card.cancel')}</Button>,
          <Button key="delete" danger type="primary" disabled={busy} onClick={onConfirm}>{t('card.confirm')}</Button>,
        ]}
      >
        {target !== undefined && <p>{target.name}</p>}
        <p>{t('card.confirmDeleteHint')}</p>
      </Modal>
    </AntdProvider>
  )
}
