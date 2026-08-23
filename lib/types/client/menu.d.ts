import { type ReactNode, type RefObject } from 'react';
export interface MenuOption<T extends string> {
    readonly value: T;
    readonly label: string;
    readonly icon?: ReactNode;
}
declare function useMenuOpen(): {
    readonly open: boolean;
    readonly setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
    readonly root: React.RefObject<HTMLDivElement>;
    readonly menu: React.RefObject<HTMLDivElement>;
};
export declare function MenuPopup({ open, anchor, menuRef, up, end, className, ariaLabel, children, onClick, }: {
    readonly open: boolean;
    readonly anchor: RefObject<HTMLElement>;
    readonly menuRef: RefObject<HTMLDivElement>;
    readonly up?: boolean | undefined;
    readonly end?: boolean | undefined;
    readonly className: string;
    readonly ariaLabel?: string;
    readonly children: ReactNode;
    readonly onClick?: () => void;
}): JSX.Element | null;
export declare function MenuHostProvider({ host, children, }: {
    readonly host: HTMLElement | null;
    readonly children: ReactNode;
}): JSX.Element;
export declare function MenuRow({ icon, label, hint, active, chevron, kv, onClick, }: {
    readonly icon?: ReactNode;
    readonly label: ReactNode;
    readonly hint?: ReactNode;
    readonly active?: boolean;
    readonly chevron?: boolean;
    readonly kv?: boolean;
    readonly onClick: () => void;
}): JSX.Element;
export declare function MenuSelect<T extends string>({ value, options, onChange, wide, pill, up, icon, }: {
    readonly value: T;
    readonly options: readonly MenuOption<T>[];
    readonly onChange: (value: T) => void;
    readonly wide?: boolean;
    readonly pill?: boolean;
    readonly up?: boolean;
    readonly icon?: ReactNode;
}): JSX.Element;
export declare function MenuPanel({ label, children, ghost, up, persist, }: {
    readonly label: ReactNode;
    readonly children: ReactNode;
    readonly ghost?: boolean;
    readonly up?: boolean;
    readonly persist?: boolean;
}): JSX.Element;
export declare function useMenuState(): ReturnType<typeof useMenuOpen>;
export {};
