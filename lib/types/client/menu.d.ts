import { type ReactNode } from 'react';
export interface MenuOption<T extends string> {
    readonly value: T;
    readonly label: string;
}
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
