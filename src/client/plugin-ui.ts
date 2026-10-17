import React from 'react'
import { Input as HostInput } from '@deepseek-ai/dsh-client-ui-primitives'

/** 和技能行一致的 22px 描边图标按钮。尺寸写在 style 上，不靠额外 CSS 覆盖宿主按钮。 */
export const rowIconStyle: React.CSSProperties = {
  width: 22,
  minWidth: 22,
  height: 22,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--dsw-radius-sm, 8px)',
}

/** 宿主没有多行输入。行数由 rows 控制，不再接收 Ant 的 autoSize。 */
export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(props, ref) {
  const { className, rows, ...rest } = props
  return React.createElement('textarea', {
    ...rest,
    ref,
    className: ['dsh-st-textarea', className].filter(Boolean).join(' '),
    rows: rows || 4,
  })
})

export const Input = HostInput

/** 宿主 Modal 点遮罩会调用 onClose。捕获阶段拦住指定弹窗的遮罩点击，保留「点遮罩不关」。 */
export function blockHostModalBackdrop(event: MouseEvent, dialogClass: string): void {
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.getAttribute('aria-hidden') !== 'true') return
  const dialog = target.parentElement?.querySelector('[role="dialog"]')
  if (!(dialog instanceof HTMLElement) || !dialog.classList.contains(dialogClass)) return
  event.stopPropagation()
}
