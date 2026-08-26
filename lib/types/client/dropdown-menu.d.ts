import { type ReactNode } from 'react';
export interface DropdownMenuOption {
    readonly key: string;
    readonly label: string;
    readonly selected: boolean;
    readonly onSelect: () => void;
    readonly keepOpen?: boolean;
    readonly trailing?: {
        readonly label: string;
        readonly active: boolean;
        readonly onSelect: () => void;
    };
}
/** 设置页与侧栏共用的紧凑下拉菜单：显示当前选中项，支持点击外部与 Escape 关闭。 */
export declare function DropdownMenu({ ariaLabel, className, buttonClassName, menuClassName, options, trigger, }: {
    readonly ariaLabel: string;
    readonly className?: string;
    readonly buttonClassName?: string;
    readonly menuClassName?: string;
    readonly options: readonly DropdownMenuOption[];
    readonly trigger?: ReactNode;
}): JSX.Element;
