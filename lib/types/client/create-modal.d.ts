import type { ModelTranslate, Translate } from './contracts.js';
import type { AgentPresetOption, ModelCatalogFailure, ModelOption, PermissionOption } from './protocol.js';
import { type PermissionTranslate } from './permissions.js';
import { type PresetTranslate } from './agent-presets.js';
import { type AutomationFormState } from './helpers.js';
export declare function CreateModal({ t, permissionT, modelT, busy, workspaces, models, modelFailures, defaultModel, skills, permissions, defaultPermission, agentPresets, defaultAgentPreset, presetT, draft, editing, onClose, onSubmit, onAddWorkspace, }: {
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
    readonly agentPresets: readonly AgentPresetOption[];
    readonly defaultAgentPreset: string;
    readonly presetT?: PresetTranslate | undefined;
    readonly draft?: Partial<AutomationFormState>;
    readonly editing?: boolean;
    readonly onClose: () => void;
    readonly onSubmit: (form: AutomationFormState) => Promise<void>;
    readonly onAddWorkspace?: () => Promise<string | undefined>;
}): JSX.Element;
