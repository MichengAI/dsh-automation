/** 定时任务表单里新增工作区：只探测宿主服务，不硬读未注入的 ctx.workspaces。 */
export declare class WorkspacePickerUnavailableError extends Error {
    readonly code = "workspace/picker-unavailable";
    constructor();
}
/**
 * 在运行期探测宿主服务。Cordis 未 inject 时直接读属性会抛，所以先走 reflect.get，
 * 再走 ctx.get；两者都不可用时才回退到普通属性读取。
 * reflect.get 存在却返回 undefined 时不越过它硬读属性，避免读未注入的服务。
 */
export declare function probeService(ctx: unknown, name: string): unknown;
/** 解析宿主归档接口并保留服务实例作为 this；菜单仅在接口可用时显示归档项。 */
export declare function resolveHostArchiveSession(ctx: unknown): ((sessionId: string) => void | Promise<void>) | undefined;
/** 统一解析宿主选目录的返回值：字符串、{ path }、{ filePaths }，取消则 undefined。 */
export declare function parsePickedPath(value: unknown): string | undefined;
/** 让宿主登记工作区；宿主没有该方法或拒绝时返回 false，调用方改走运行时登记。 */
export declare function createHostWorkspace(ctx: unknown, path: string): Promise<boolean>;
/**
 * 选目录：桌面壳的原生窗口优先，其次依次尝试宿主暴露的选目录服务。
 * 一个都不存在时抛 WorkspacePickerUnavailableError，让调用方决定如何提示。
 */
export declare function pickHostDirectory(ctx: unknown): Promise<string | undefined>;
