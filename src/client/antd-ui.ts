import type { Locale } from 'antd/es/locale/index.js'
import darkAlgorithmImport from 'antd/es/theme/themes/dark/index.js'
import defaultAlgorithmImport from 'antd/es/theme/themes/default/index.js'
import type { ButtonProps } from 'antd/es/button/Button.js'
import ButtonImport from 'antd/es/button/index.js'
import type { CheckboxProps } from 'antd/es/checkbox/Checkbox.js'
import CheckboxImport from 'antd/es/checkbox/index.js'
import type { ConfigProviderProps } from 'antd/es/config-provider/index.js'
import ConfigProviderImport from 'antd/es/config-provider/index.js'
import type { DropdownProps } from 'antd/es/dropdown/dropdown.js'
import DropdownImport from 'antd/es/dropdown/index.js'
import type { InputProps } from 'antd/es/input/Input.js'
import InputImport from 'antd/es/input/index.js'
import type { TextAreaProps, TextAreaRef } from 'antd/es/input/TextArea.js'
import TextAreaImport from 'antd/es/input/TextArea.js'
import type { ModalProps } from 'antd/es/modal/interface.js'
import ModalImport from 'antd/es/modal/index.js'
import type { ProgressProps } from 'antd/es/progress/progress.js'
import ProgressImport from 'antd/es/progress/index.js'
import type { SegmentedProps } from 'antd/es/segmented/index.js'
import SegmentedImport from 'antd/es/segmented/index.js'
import type { SelectProps } from 'antd/es/select/index.js'
import SelectImport from 'antd/es/select/index.js'
import type { SwitchProps } from 'antd/es/switch/index.js'
import SwitchImport from 'antd/es/switch/index.js'
import type { TabsProps } from 'antd/es/tabs/index.js'
import TabsImport from 'antd/es/tabs/index.js'
import React from 'react'
import { antdLocale } from './antd-locale.js'
import { useHostDark, useHostLocale } from './host-theme.js'

function unwrap<T>(mod: unknown): T {
  const value = mod as { default?: T }
  return value.default ?? (mod as T)
}

const TextArea = unwrap<React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<TextAreaRef>>>(TextAreaImport)
export const Input = Object.assign(unwrap<React.ComponentType<InputProps>>(InputImport), { TextArea })
const ButtonBase = unwrap<React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>>(ButtonImport)

/** 操作按钮默认用中等尺寸和圆角。标题栏和小按钮可以传入 size、shape 覆盖。 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return React.createElement(ButtonBase, { shape: 'round', size: 'middle', ...props, ref })
})
export const Checkbox = unwrap<React.ComponentType<CheckboxProps> & { Group: React.ComponentType<{ options: readonly { label: string; value: string }[]; value: readonly string[]; onChange: (value: string[]) => void }> }>(CheckboxImport)
export const ConfigProvider = unwrap<React.ComponentType<ConfigProviderProps>>(ConfigProviderImport)
export const Dropdown = unwrap<React.ComponentType<DropdownProps>>(DropdownImport)
export const Modal = unwrap<React.ComponentType<ModalProps>>(ModalImport)
export const Progress = unwrap<React.ComponentType<ProgressProps>>(ProgressImport)
export const Segmented = unwrap<React.ComponentType<SegmentedProps>>(SegmentedImport)
export const Select = unwrap<React.ComponentType<SelectProps>>(SelectImport)
export const Switch = unwrap<React.ComponentType<SwitchProps>>(SwitchImport)
export const Tabs = unwrap<React.ComponentType<TabsProps>>(TabsImport)
const darkAlgorithm = unwrap<NonNullable<ConfigProviderProps['theme']> extends { algorithm?: infer Algorithm } ? Algorithm : never>(darkAlgorithmImport)
const defaultAlgorithm = unwrap<NonNullable<ConfigProviderProps['theme']> extends { algorithm?: infer Algorithm } ? Algorithm : never>(defaultAlgorithmImport)

/** 按钮不插汉字空格，亮暗跟随宿主的 data-ds-dark-theme。 */
export function AntdProvider(props: { locale?: Locale; children?: React.ReactNode }): React.ReactElement {
  const dark = useHostDark()
  const active = useHostLocale()
  return React.createElement(ConfigProvider, {
    locale: props.locale ?? antdLocale(active),
    button: { autoInsertSpace: false },
    theme: {
      algorithm: dark ? darkAlgorithm : defaultAlgorithm,
      components: { Button: { borderRadius: 8 } },
    },
  }, props.children)
}
