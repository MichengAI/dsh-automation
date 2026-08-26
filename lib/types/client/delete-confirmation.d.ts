import type { Translate } from './contracts.js';
export declare function DeleteConfirmation({ target, t, busy, onCancel, onConfirm, }: {
    readonly target: {
        readonly id: string;
        readonly name: string;
    } | undefined;
    readonly t: Translate;
    readonly busy: boolean;
    readonly onCancel: () => void;
    readonly onConfirm: () => void;
}): JSX.Element | null;
