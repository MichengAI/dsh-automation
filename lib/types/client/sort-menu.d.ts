import type { Translate } from './contracts.js';
import { type AutomationSortDirection, type AutomationSortKey, type SortPreferenceStorage } from './helpers.js';
/** 设置页与侧栏总览共用的排序菜单。当前项可以存成默认。 */
export declare function SortMenu({ t, storage, storageKey, sortKey, sortDirection, onSelect, iconOnly, }: {
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
