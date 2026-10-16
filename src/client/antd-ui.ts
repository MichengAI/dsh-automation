import type { Locale } from 'antd/es/locale/index.js'
import darkAlgorithmImport from 'antd/es/theme/themes/dark/index.js'
import defaultAlgorithmImport from 'antd/es/theme/themes/default/index.js'
import { Button as PrimitiveButton, Switch as PrimitiveSwitch, type ButtonVariant } from '@deepseek-ai/dsh-client-ui-primitives'
export { PrimitiveButton, PrimitiveSwitch }
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

export interface UnifiedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant
  type?: 'primary' | 'ghost' | 'outline' | 'toolbar' | 'default' | 'text' | 'link' | 'button' | 'submit' | 'reset'
  danger?: boolean
  loading?: boolean
  block?: boolean
  size?: 'md' | 'sm' | 'middle' | 'small' | 'large'
  icon?: React.ReactNode
  shape?: string
  href?: string
  target?: string
  rel?: string
  htmlType?: 'button' | 'submit' | 'reset'
}

/** 桥接宿主官方原语 Button，自动映射 Antd 常用属性（type="primary", danger, size 等），彻底淘汰 Antd 按钮包装 */
export function Button({
  variant,
  type,
  danger,
  loading,
  block,
  size,
  shape,
  className,
  children,
  href,
  target,
  rel,
  icon,
  htmlType,
  ...props
}: UnifiedButtonProps): React.ReactElement {
  let mappedVariant: ButtonVariant = variant ?? 'outline'
  if (type === 'primary') mappedVariant = 'primary'
  else if (type === 'text' || type === 'link') mappedVariant = 'ghost'

  const isPrimary = mappedVariant === 'primary'
  const mappedSize = (size === 'small' || size === 'sm') ? 'sm' : 'md'

  const classes = [
    'dsh-st-btn',
    href ? 'dsh-st-link-btn' : '',
    className,
    isPrimary ? 'is-primary' : '',
    danger ? 'is-danger' : '',
    block ? 'is-block' : '',
    loading ? 'is-loading' : '',
  ].filter(Boolean).join(' ')

  const hasChildren = children !== undefined && children !== null && children !== false
  const iconElement = icon ? React.createElement('span', {
    key: 'icon',
    className: 'dsh-st-btn-icon',
    style: { display: 'inline-flex', alignItems: 'center', marginRight: (hasChildren && !href) ? 6 : undefined },
  }, icon) : null

  const content = [iconElement, children]

  if (href) {
    return React.createElement('a', {
      ...(props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>),
      href,
      target,
      rel: rel || (target === '_blank' ? 'noreferrer' : undefined),
      className: classes || undefined,
      'aria-label': props['aria-label'],
      style: Object.assign({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }, props.style),
    }, content)
  }

  return React.createElement(PrimitiveButton, {
    ...props,
    type: htmlType ?? (type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button'),
    variant: mappedVariant,
    size: mappedSize,
    className: classes || undefined,
    disabled: props.disabled || loading,
  }, content)
}
export const Checkbox = unwrap<React.ComponentType<CheckboxProps> & { Group: React.ComponentType<{ options: readonly { label: string; value: string }[]; value: readonly string[]; onChange: (value: string[]) => void }> }>(CheckboxImport)
export const ConfigProvider = unwrap<React.ComponentType<ConfigProviderProps>>(ConfigProviderImport)
export const Dropdown = unwrap<React.ComponentType<DropdownProps>>(DropdownImport)
export const Modal = function UnifiedModal(props: ModalProps): React.ReactElement {
  const mergedRootClass = ['dsh-st-modal-root', props.rootClassName].filter(Boolean).join(' ')
  const mergedWrapClass = ['dsh-st-modal-wrap', props.wrapClassName].filter(Boolean).join(' ')
  return React.createElement(unwrap<React.ComponentType<ModalProps>>(ModalImport), {
    ...props,
    rootClassName: mergedRootClass,
    wrapClassName: mergedWrapClass,
  })
}
export const Progress = unwrap<React.ComponentType<ProgressProps>>(ProgressImport)
export const Segmented = unwrap<React.ComponentType<SegmentedProps>>(SegmentedImport)
export const Select = unwrap<React.ComponentType<SelectProps>>(SelectImport)
export interface UnifiedSwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  'aria-label'?: string
  className?: string
  title?: string
  size?: 'small' | 'default'
}

/** 桥接宿主官方原语 Switch，自动对齐 36x20 尺寸、滑块与语义颜色，彻底淘汰 Ant Design Switch */
export function Switch({
  checked = false,
  onChange,
  disabled,
  loading,
  'aria-label': ariaLabel,
  className,
  title,
}: UnifiedSwitchProps): React.ReactElement {
  return React.createElement(PrimitiveSwitch, {
    checked,
    onChange: (next: boolean) => { onChange?.(next) },
    label: ariaLabel ?? '',
    disabled: disabled || loading,
    title,
    className,
  })
}

export const Tabs = unwrap<React.ComponentType<TabsProps>>(TabsImport)
const darkAlgorithm = unwrap<NonNullable<ConfigProviderProps['theme']> extends { algorithm?: infer Algorithm } ? Algorithm : never>(darkAlgorithmImport)
const defaultAlgorithm = unwrap<NonNullable<ConfigProviderProps['theme']> extends { algorithm?: infer Algorithm } ? Algorithm : never>(defaultAlgorithmImport)

/** 宿主令牌写在 body 上，documentElement 上经常是空的。 */
function hostToken(name: string): string {
  if (typeof document === 'undefined') return ''
  const body = getComputedStyle(document.body).getPropertyValue(name).trim()
  if (body !== '') return body
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** 按钮不插汉字空格，亮暗跟随宿主的 data-ds-dark-theme。 */
export function AntdProvider(props: { locale?: Locale; children?: React.ReactNode }): React.ReactElement {
  const dark = useHostDark()
  const active = useHostLocale()
  const link = hostToken('--dsw-alias-link')
  return React.createElement(ConfigProvider, {
    locale: props.locale ?? antdLocale(active),
    button: { autoInsertSpace: false },
    theme: {
      algorithm: dark ? darkAlgorithm : defaultAlgorithm,
      token: {
        fontFamily: 'var(--dsw-font-family, system-ui)',
        colorText: 'var(--dsw-alias-label-primary)',
        colorTextSecondary: 'var(--dsw-alias-label-secondary)',
        colorTextTertiary: 'var(--dsw-alias-label-tertiary)',
        colorTextPlaceholder: 'var(--dsw-alias-label-tertiary)',
        colorBgContainer: 'var(--dsw-alias-bg-layer-1)',
        colorBorder: 'var(--dsw-alias-border-l2)',
        borderRadius: 8,
        borderRadiusSM: 4,
        borderRadiusLG: 12,
        controlOutline: 'var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4c8dff))',
        colorPrimary: 'var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary))',
        colorPrimaryHover: 'var(--dsw-alias-button-primary-hover, var(--dsw-alias-interactive-bg-active))',
        ...(link === '' ? {} : { colorLink: link, colorLinkHover: link, colorLinkActive: link }),
      },
      components: {
        Button: { borderRadius: 8 },
        Input: {
          controlHeight: 32,
          colorBgContainer: 'var(--dsw-alias-bg-layer-1)',
          colorBorder: 'var(--dsw-alias-border-l2)',
          colorText: 'var(--dsw-alias-label-primary)',
          colorTextPlaceholder: 'var(--dsw-alias-label-tertiary)',
          borderRadius: 8,
        },
        Select: {
          controlHeight: 32,
          colorBgContainer: 'var(--dsw-alias-bg-layer-1)',
          colorBorder: 'var(--dsw-alias-border-l2)',
          colorText: 'var(--dsw-alias-label-primary)',
          borderRadius: 8,
        },
      },
    },
  }, props.children)
}
