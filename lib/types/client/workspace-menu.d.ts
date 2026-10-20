/**
 * 官方工作区 … 菜单没有 slot，只有写死的「重命名 / 删除工作区」。
 * 记录视图的合成任务组需要「任务设置」，因此像归档插件一样监听菜单节点并注入。
 * 真实工作区不处理；合成任务组由记录视图按真实会话 ID 归档。
 */
export interface WorkspaceTaskSettingsTarget {
    readonly id: string;
    readonly name: string;
    readonly sessionIds: readonly string[];
}
export interface TaskSettingsMenuInjectorOptions {
    /** 菜单打开时才取文案，避免插件 apply 阶段语言尚未就绪时固化英文。 */
    readonly label: string | (() => string);
    readonly resolveTask: (workspaceId: string) => WorkspaceTaskSettingsTarget | undefined;
    readonly openTaskSettings: (request: {
        automationId: string;
        name: string;
        sessionIds: string[];
    }) => void;
    readonly archive?: {
        readonly label: string;
        readonly request: (task: WorkspaceTaskSettingsTarget) => void;
    };
}
/**
 * 安装工作区菜单注入器。
 * @param options 菜单文案、分组解析和打开任务设置的回调。
 * @returns 卸载函数。
 */
export declare function installTaskSettingsMenuInjector(options: TaskSettingsMenuInjectorOptions): () => void;
export interface TaskGroupOptionOptions {
    readonly label: string;
    readonly groupLabel: string;
    readonly workspaceLabel: string;
    readonly checked: boolean;
    readonly onSelect: () => void;
}
/**
 * 在官方视图选项菜单里注入第四个分组选项「按任务」。
 * 官方菜单只有工作区/工作区树/平铺，没有新增模式的 slot，因此用 DOM 注入。
 */
export declare function installTaskGroupOption(options: TaskGroupOptionOptions): () => void;
