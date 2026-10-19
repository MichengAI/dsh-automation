import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import type { HostIcon } from './host-icon-resolve.js'

/** 把宿主图标组件渲染成可直接注入官方 DOM 的 SVG 字符串。 */
export function hostIconMarkup(icon: HostIcon, size = 14): string {
  const host = document.createElement('div')
  const root = createRoot(host)
  flushSync(() => { root.render(createElement(icon, { size })) })
  const markup = host.innerHTML
  root.unmount()
  return markup
}
