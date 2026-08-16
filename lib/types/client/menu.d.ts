import { type ReactNode } from 'react';
export interface MenuOption<T extends string> {
    readonly value: T;
    readonly label: string;
    readonly icon?: ReactNode;
}
declare function useFloatingMenu(): {
    readonly open: boolean;
    readonly setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
    readonly root: React.RefObject<HTMLDivElement>;
    readonly style: {
        top: number;
        left: number;
        minWidth: number;
    };
};
export declare function MenuRow({ icon, label, hint, active, chevron, onClick, }: {
    readonly icon?: ReactNode;
    readonly label: ReactNode;
    readonly hint?: ReactNode;
    readonly active?: boolean;
    readonly chevron?: boolean;
    readonly onClick: () => void;
}): JSX.Element;
export declare function MenuSelect<T extends string>({ value, options, onChange, wide, pill, icon, }: {
    readonly value: T;
    readonly options: readonly MenuOption<T>[];
    readonly onChange: (value: T) => void;
    readonly wide?: boolean;
    readonly pill?: boolean;
    readonly icon?: ReactNode;
}): JSX.Element;
export declare function MenuPanel({ label, children, ghost, }: {
    readonly label: ReactNode;
    readonly children: ReactNode;
    readonly ghost?: boolean;
}): JSX.Element;
export declare function useMenuState(): ReturnType<typeof useFloatingMenu>;
export declare function MenuSurface({ style, children, }: {
    readonly style: {
        top: number;
        left: number;
        minWidth: number;
    };
    readonly children: ReactNode;
}): JSX.Element;
export {};
