import type { Translate } from './contracts.js';
import { type AutomationFormState } from './helpers.js';
export declare function CreateModal({ t, busy, workspaces, models, defaultModel, skills, draft, onClose, onSubmit, }: {
    readonly t: Translate;
    readonly busy: boolean;
    readonly workspaces: readonly {
        id: string;
        title: string;
        path: string;
    }[];
    readonly models: readonly {
        provider: string;
        model: string;
        label: string;
    }[];
    readonly defaultModel: {
        provider: string;
        model: string;
        label: string;
    } | null;
    readonly skills: readonly {
        id: string;
        name: string;
    }[];
    readonly draft?: Partial<AutomationFormState>;
    readonly onClose: () => void;
    readonly onSubmit: (form: AutomationFormState) => Promise<void>;
}): JSX.Element;
