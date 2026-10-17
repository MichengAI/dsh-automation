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

export const IconEllipsisOutline = pickHostIcon(icons, 'IconEllipsisOutlineRegular')
export const IconSettingsOutline = pickHostIcon(icons, 'IconSettingsOutlineRegular')
export const IconArchiveOutline = pickHostIcon(icons, 'IconArchiveOutlineRegular')
export const IconBranchOutline = pickHostIcon(icons, 'IconBranchOutlineRegular')
export const IconEditOutline = pickHostIcon(icons, 'IconEditOutlineRegular')
export const IconTrashOutline = pickHostIcon(icons, 'IconTrashOutlineRegular')
export const IconCheckOutline = pickHostIcon(icons, 'IconCheckOutlineRegular')
export const IconChevronDownOutline = pickHostIcon(icons, 'IconChevronDownOutlineRegular')
export const IconListPenOutline = pickHostIcon(icons, 'IconListPenOutlineRegular')
export const IconSearchOutline = pickHostIcon(icons, 'IconSearchOutlineRegular')
export const IconCloseFill = pickHostIcon(icons, 'IconCloseFillRegular')
export const IconSlidersTwoOutline = pickHostIcon(icons, 'IconSlidersTwoOutlineRegular')
export const IconFolderClose = pickHostIcon(icons, 'IconFolderCloseRegular')
export const IconFolderOpen = pickHostIcon(icons, 'IconFolderOpenRegular')
export const IconTriangleRightFill = pickHostIcon(icons, 'IconTriangleRightFillRegular')
export const IconUnarchiveOutline = pickHostIcon(icons, 'IconUnarchiveOutlineRegular')
export const IconWorkspaceTreeOutline = hostOrFallback(pickHostIcon(icons, 'IconWorkspaceTreeOutlineRegular'), treeFallback)
export const IconFlatListOutline = hostOrFallback(pickHostIcon(icons, 'IconFlatListOutlineRegular'), listFallback)
export const IconChevronsUpDownOutline = pickHostIcon(icons, 'IconChevronsUpDownOutlineRegular')
export const IconClockOutline = pickHostIcon(icons, 'IconClockOutlineRegular')
export const IconArchiveCheckOutline = hostOrFallback(pickHostIcon(icons, 'IconArchiveCheckOutlineRegular'), archiveCheckFallback)
