/** Host 官方 Agent 预设服务的最小结构契约。 */
export interface AgentPresetOption {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    /** 激活失败时为一行诊断；可用预设不带该字段。 */
    readonly broken?: string;
}
export interface AgentPresetRoster {
    readonly presets: readonly AgentPresetOption[];
}
export interface AgentPresetService {
    /** 未指定预设时，新会话默认使用它。 */
    readonly defaultId: string;
    /** 读取当前声明名册，含激活失败的项。 */
    remoteExportList(): Promise<AgentPresetRoster>;
    /** 读取存活会话已绑定的预设 id。 */
    composedPreset(ctx: unknown): string | undefined;
    /** 将 Agent 绑定到指定预设。 */
    mount(ctx: unknown, id?: string): Promise<unknown>;
}
/** 只接受 Host 当前名册里的 id；空串和未知值返回 undefined。 */
export declare function normalizeAgentPreset(input: unknown, options: readonly {
    readonly id: string;
}[]): string | undefined;
