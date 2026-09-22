import type { Locale } from 'antd/es/locale/index.js';
import type { ButtonProps } from 'antd/es/button/Button.js';
import type { CheckboxProps } from 'antd/es/checkbox/Checkbox.js';
import type { ConfigProviderProps } from 'antd/es/config-provider/index.js';
import type { DropdownProps } from 'antd/es/dropdown/dropdown.js';
import type { InputProps } from 'antd/es/input/Input.js';
import type { TextAreaProps, TextAreaRef } from 'antd/es/input/TextArea.js';
import type { ModalProps } from 'antd/es/modal/interface.js';
import type { ProgressProps } from 'antd/es/progress/progress.js';
import type { SegmentedProps } from 'antd/es/segmented/index.js';
import type { SelectProps } from 'antd/es/select/index.js';
import type { SwitchProps } from 'antd/es/switch/index.js';
import type { TabsProps } from 'antd/es/tabs/index.js';
import React from 'react';
export declare const Input: React.ComponentType<InputProps> & {
    TextArea: React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<TextAreaRef>>;
};
/** 操作按钮默认用中等尺寸和圆角。标题栏和小按钮可以传入 size、shape 覆盖。 */
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
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
export declare const Switch: React.ComponentType<SwitchProps>;
export declare const Tabs: React.ComponentType<TabsProps>;
/** 按钮不插汉字空格，亮暗跟随宿主的 data-ds-dark-theme。 */
export declare function AntdProvider(props: {
    locale?: Locale;
    children?: React.ReactNode;
}): React.ReactElement;
