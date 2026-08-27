import type { AutomationViewProps, ModelTranslate, Translate } from './contracts.js';
import type { PermissionTranslate } from './permissions.js';
import type { AutomationViewModel } from './protocol.js';
import type { AutomationSnapshot } from './protocol.js';
export declare function AutomationView({ t, permissionT, modelT, runtime, closeSettings }: AutomationViewProps): JSX.Element;
export declare function AutomationTaskEditor({ item, snapshot, t, permissionT, modelT, runtime, onClose }: {
    readonly item: AutomationViewModel;
    readonly snapshot: AutomationSnapshot;
    readonly t: Translate;
    readonly permissionT: PermissionTranslate;
    readonly modelT: ModelTranslate;
    readonly runtime: AutomationViewProps['runtime'];
    readonly onClose: () => void;
}): JSX.Element;
export declare function AutomationTaskCreator({ snapshot, t, permissionT, modelT, runtime, onClose }: {
    readonly snapshot: AutomationSnapshot;
    readonly t: Translate;
    readonly permissionT: PermissionTranslate;
    readonly modelT: ModelTranslate;
    readonly runtime: AutomationViewProps['runtime'];
    readonly onClose: () => void;
}): JSX.Element;
