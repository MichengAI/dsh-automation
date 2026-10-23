import { createElement } from 'react'

export const Switch = (props) => createElement('input', {
  type: 'checkbox',
  checked: props.checked,
  disabled: props.disabled,
  onChange: (e) => props.onChange?.(e.target.checked),
})
export const Button = (props) => createElement('button', props, props.children)
export const Modal = (props) => props.open ? createElement('div', { className: props.className }, props.children, props.footer) : null
export const SegmentedTabs = (props) => createElement('div', props, props.children)
export const Input = (props) => createElement('input', props)
export const Menu = (props) => createElement('div', props, props.children)
export const Tooltip = (props) => createElement('div', props, props.children)

const dummyIcon = (props) => createElement('span', props)

export const IconEllipsisOutlineRegular = dummyIcon
export const IconSearchOutlineRegular = dummyIcon
export const IconProjectAddOutlineRegular = dummyIcon
export const IconCloseFillRegular = dummyIcon
export const IconSlidersTwoOutlineRegular = dummyIcon
export const IconFolderCloseRegular = dummyIcon
export const IconWorkspaceTreeOutlineRegular = dummyIcon
export const IconFlatListOutlineRegular = dummyIcon
export const IconClockOutlineRegular = dummyIcon
export const IconPlusOutlineRegular = dummyIcon
export const IconRefreshOutlineRegular = dummyIcon
export const IconInfoOutlineRegular = dummyIcon
export const IconNewChatOutlineRegular = dummyIcon
export const IconEditOutlineRegular = dummyIcon
export const IconChevronDownOutlineRegular = dummyIcon
export const IconSettingsOutlineRegular = dummyIcon
export const IconListPenOutlineRegular = dummyIcon
export const IconCheckOutlineRegular = dummyIcon
export const IconQueueOutlineRegular = dummyIcon

export default new Proxy({
  Switch,
  Button,
  Modal,
  SegmentedTabs,
  Input,
  Menu,
  Tooltip,
  IconEllipsisOutlineRegular,
  IconSearchOutlineRegular,
  IconProjectAddOutlineRegular,
  IconCloseFillRegular,
  IconSlidersTwoOutlineRegular,
  IconFolderCloseRegular,
  IconWorkspaceTreeOutlineRegular,
  IconFlatListOutlineRegular,
  IconClockOutlineRegular,
  IconPlusOutlineRegular,
  IconRefreshOutlineRegular,
  IconInfoOutlineRegular,
  IconNewChatOutlineRegular,
  IconEditOutlineRegular,
  IconChevronDownOutlineRegular,
  IconSettingsOutlineRegular,
  IconListPenOutlineRegular,
  IconCheckOutlineRegular,
  IconQueueOutlineRegular,
}, {
  get(target, prop) {
    if (prop in target) return target[prop]
    if (typeof prop === 'string' && prop.startsWith('Icon')) return dummyIcon
    return undefined
  },
})
