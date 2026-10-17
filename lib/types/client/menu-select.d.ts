import * as React from 'react';
export interface MenuSelectOption {
    value: string;
    label: React.ReactNode;
    text?: string;
    disabled?: boolean;
    danger?: boolean;
}
export interface MenuSelectGroup {
    id: string;
    label: string;
    options: readonly MenuSelectOption[];
}
export interface MenuSelectProps {
    value: string;
    label?: string;
    placeholder?: string;
    options?: readonly MenuSelectOption[];
    groups?: readonly MenuSelectGroup[];
    footer?: readonly MenuSelectOption[];
    onChange: (value: string) => void;
    onFooter?: (id: string) => void;
    disabled?: boolean;
    compact?: boolean;
    className?: string;
    listClassName?: string;
}
/** 宿主 Menu 下拉。分组用标签行，底部动作走 footer，不走选择值。 */
export declare function MenuSelect(props: MenuSelectProps): React.ReactElement;
