import { createElement } from 'react'
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'
import { hostOrFallback, pickHostIcon, type HostIcon } from './host-icon-resolve.js'

export type { HostIcon }
export { pickHostIcon }

const icons = primitives as unknown as Readonly<Record<string, unknown>>

function treeFallback(): JSX.Element {
  return createElement('svg', { viewBox: '0 0 16 16', width: 16, height: 16, fill: 'none', 'aria-hidden': true },
    createElement('path', { d: 'M3 3h4v3H3V3Zm6 1h4M3 10h4v3H3v-3Zm6 1.5h4M7 4.5h2M7 11.5h2', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }))
}

function listFallback(): JSX.Element {
  return createElement('svg', { viewBox: '0 0 16 16', width: 16, height: 16, fill: 'none', 'aria-hidden': true },
    createElement('path', { d: 'M3 4h10M3 8h10M3 12h10', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }))
}

function archiveCheckFallback(): JSX.Element {
  return createElement('svg', { viewBox: '0 0 16 16', width: 16, height: 16, fill: 'none', 'aria-hidden': true },
    createElement('path', { d: 'M3 6.5h10v6H3v-6Zm1.2-2.5h7.6L13 6.5H3L4.2 4Zm2.3 5.2 1.3 1.3 2.6-2.6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }))
}

export const IconEllipsisOutline = pickHostIcon(icons, 'IconEllipsisOutlineRegular', 'IconEllipsisOutline16')
export const IconSettingsOutline = pickHostIcon(icons, 'IconSettingsOutlineRegular', 'IconSettingsOutline16')
export const IconArchiveOutline = pickHostIcon(icons, 'IconArchiveOutlineRegular', 'IconArchiveOutline20')
export const IconBranchOutline = pickHostIcon(icons, 'IconBranchOutlineRegular', 'IconBranchOutline16')
export const IconEditOutline = pickHostIcon(icons, 'IconEditOutlineRegular', 'IconEditOutline16')
export const IconTrashOutline = pickHostIcon(icons, 'IconTrashOutlineRegular', 'IconTrashOutline16')
export const IconCheckOutline = pickHostIcon(icons, 'IconCheckOutlineRegular', 'IconCheckOutline16')
export const IconChevronDownOutline = pickHostIcon(icons, 'IconChevronDownOutlineRegular', 'IconChevronDownOutline14')
export const IconListPenOutline = pickHostIcon(icons, 'IconListPenOutlineRegular', 'IconListPenOutline16')
export const IconSearchOutline = pickHostIcon(icons, 'IconSearchOutlineRegular', 'IconSearchOutline16')
export const IconCloseFill = pickHostIcon(icons, 'IconCloseFillRegular', 'IconCloseOutline16')
export const IconSlidersTwoOutline = pickHostIcon(icons, 'IconSlidersTwoOutlineRegular', 'IconSlidersOutline16')
export const IconFolderClose = pickHostIcon(icons, 'IconFolderCloseRegular', 'IconFolderOutline16')
export const IconWorkspaceTreeOutline = hostOrFallback(pickHostIcon(icons, 'IconWorkspaceTreeOutlineRegular'), treeFallback)
export const IconFlatListOutline = hostOrFallback(pickHostIcon(icons, 'IconFlatListOutlineRegular'), listFallback)
export const IconChevronsUpDownOutline = pickHostIcon(icons, 'IconChevronsUpDownOutlineRegular')
export const IconClockOutline = pickHostIcon(icons, 'IconClockOutlineRegular', 'IconClockOutline16')
export const IconArchiveCheckOutline = hostOrFallback(pickHostIcon(icons, 'IconArchiveCheckOutlineRegular'), archiveCheckFallback)

/** 0.1.7 的 Menu 会渲染 children。同一版才出现不带尺寸的图标名，旧 Menu 只认 items。 */
export function hostMenuRendersChildren(): boolean {
  return typeof icons.IconEllipsisOutlineRegular === 'function'
}
