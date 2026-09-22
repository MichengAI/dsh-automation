import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'
import { pickHostIcon, type HostIcon } from './host-icon-resolve.js'

export type { HostIcon }
export { pickHostIcon }

const icons = primitives as unknown as Readonly<Record<string, unknown>>

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
export const IconWorkspaceTreeOutline = pickHostIcon(icons, 'IconWorkspaceTreeOutlineRegular')
export const IconFlatListOutline = pickHostIcon(icons, 'IconFlatListOutlineRegular')
export const IconChevronsUpDownOutline = pickHostIcon(icons, 'IconChevronsUpDownOutlineRegular')
export const IconClockOutline = pickHostIcon(icons, 'IconClockOutlineRegular', 'IconClockOutline16')
export const IconArchiveCheckOutline = pickHostIcon(icons, 'IconArchiveCheckOutlineRegular')
