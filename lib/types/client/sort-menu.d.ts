import type { Translate } from './contracts.js';
import { type AutomationSortDirection, type AutomationSortKey, type SortPreferenceStorage } from './helpers.js';
/** 设置页与侧栏总览共用的排序菜单；当前选中行可一键保存为各自的默认排序。 */
export declare function SortMenu({ t, storage, storageKey, sortKey, sortDirection, onSelect, compact, iconOnly, className, }: {
    readonly t: Translate;
    readonly storage?: SortPreferenceStorage;
    readonly storageKey: string;
    readonly sortKey: AutomationSortKey;
    readonly sortDirection: AutomationSortDirection;
    readonly onSelect: (key: AutomationSortKey, direction: AutomationSortDirection) => void;
    readonly compact?: boolean;
    readonly iconOnly?: boolean;
    readonly className?: string;
}): JSX.Element;
