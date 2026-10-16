import type { Locale } from 'antd/es/locale/index.js';
import { Button as PrimitiveButton, Switch as PrimitiveSwitch, type ButtonVariant } from '@deepseek-ai/dsh-client-ui-primitives';
export { PrimitiveButton, PrimitiveSwitch };
import type { CheckboxProps } from 'antd/es/checkbox/Checkbox.js';
import type { ConfigProviderProps } from 'antd/es/config-provider/index.js';
import type { DropdownProps } from 'antd/es/dropdown/dropdown.js';
import type { InputProps } from 'antd/es/input/Input.js';
import type { TextAreaProps, TextAreaRef } from 'antd/es/input/TextArea.js';
import type { ModalProps } from 'antd/es/modal/interface.js';
import type { ProgressProps } from 'antd/es/progress/progress.js';
import type { SegmentedProps } from 'antd/es/segmented/index.js';
import type { SelectProps } from 'antd/es/select/index.js';
import type { TabsProps } from 'antd/es/tabs/index.js';
import React from 'react';
export declare const Input: React.ComponentType<InputProps> & {
    TextArea: React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<TextAreaRef>>;
};
export interface UnifiedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    variant?: ButtonVariant;
    type?: 'primary' | 'ghost' | 'outline' | 'toolbar' | 'default' | 'text' | 'link' | 'button' | 'submit' | 'reset';
    danger?: boolean;
    loading?: boolean;
    block?: boolean;
    size?: 'md' | 'sm' | 'middle' | 'small' | 'large';
    icon?: React.ReactNode;
    shape?: string;
    href?: string;
    target?: string;
    rel?: string;
    htmlType?: 'button' | 'submit' | 'reset';
}
/** 桥接宿主官方原语 Button，自动映射 Antd 常用属性（type="primary", danger, size 等），彻底淘汰 Antd 按钮包装 */
export declare function Button({ variant, type, danger, loading, block, size, shape, className, children, href, target, rel, icon, htmlType, ...props }: UnifiedButtonProps): React.ReactElement;
export declare const Checkbox: React.ComponentType<CheckboxProps> & {
    Group: React.ComponentType<{
        options: readonly {
            label: string;
            value: string;
        }[];
        value: readonly string[];
        onChange: (value: string[]) => void;
    }>;
};
export declare const ConfigProvider: React.ComponentType<ConfigProviderProps>;
export declare const Dropdown: React.ComponentType<DropdownProps>;
export declare const Modal: React.ComponentType<ModalProps>;
export declare const Progress: React.ComponentType<ProgressProps>;
export declare const Segmented: React.ComponentType<SegmentedProps<import("antd/es/segmented/index.js").SegmentedValue>>;
export declare const Select: React.ComponentType<SelectProps<any, import("antd/es/select/index.js").DefaultOptionType>>;
export interface UnifiedSwitchProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    loading?: boolean;
    'aria-label'?: string;
    className?: string;
    title?: string;
    size?: 'small' | 'default';
}
/** 桥接宿主官方原语 Switch，自动对齐 36x20 尺寸、滑块与语义颜色，彻底淘汰 Ant Design Switch */
export declare function Switch({ checked, onChange, disabled, loading, 'aria-label': ariaLabel, className, title, }: UnifiedSwitchProps): React.ReactElement;
export declare const Tabs: React.ComponentType<TabsProps>;
/** 按钮不插汉字空格，亮暗跟随宿主的 data-ds-dark-theme。 */
export declare function AntdProvider(props: {
    locale?: Locale;
    children?: React.ReactNode;
}): React.ReactElement;
