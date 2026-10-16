import * as React from 'react';
export interface MenuSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    danger?: boolean;
}
export interface MenuSelectProps {
    value: string;
    label?: string;
    options: readonly MenuSelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    listClassName?: string;
    action?: boolean;
    icon?: React.ReactNode;
}
/**
 * 宿主官方原语 Menu 规范封装的下拉选择组件（对齐 dsh-skills-manager 的 SourceSelect 实现）。
 * 1. 触发器采用宿主 Button (variant="outline", size="sm")，右侧配旋转指示小箭头；
 * 2. 弹出层使用宿主原生 <Menu portal dense>，完全消除 Antd Select 的虚拟列表白底与样式打架。
 */
export declare function MenuSelect(props: MenuSelectProps): React.ReactElement;
