import type { ModelTranslate, Translate } from './contracts.js';
import type { ModelCatalogFailure, ModelOption, PermissionOption } from './protocol.js';
import { type PermissionTranslate } from './permissions.js';
import { type AutomationFormState } from './helpers.js';
export declare function CreateModal({ t, permissionT, modelT, busy, workspaces, models, modelFailures, defaultModel, skills, permissions, defaultPermission, draft, editing, onClose, onSubmit, onAddWorkspace, pickWorkspaceDirectory, }: {
    readonly t: Translate;
    readonly permissionT: PermissionTranslate;
    readonly modelT: ModelTranslate;
    readonly busy: boolean;
    readonly workspaces: readonly {
        id: string;
        title: string;
        path: string;
    }[];
    readonly models: readonly ModelOption[];
    readonly modelFailures: readonly ModelCatalogFailure[];
    readonly defaultModel: ModelOption | null;
    readonly skills: readonly {
        id: string;
        name: string;
    }[];
    readonly permissions: readonly PermissionOption[];
    readonly defaultPermission: string;
    readonly draft?: Partial<AutomationFormState>;
    readonly editing?: boolean;
    readonly onClose: () => void;
    readonly onSubmit: (form: AutomationFormState) => Promise<void>;
    readonly onAddWorkspace?: (path: string) => Promise<string>;
    readonly pickWorkspaceDirectory?: () => Promise<string | null>;
}): JSX.Element;
