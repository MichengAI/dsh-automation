/** 定时任务表单里新增工作区：只探测宿主服务，不硬读未注入的 ctx.workspaces。 */
export declare class AddedWorkspaceMissingError extends Error {
    constructor();
}
export interface HostWorkspaceCreator {
    pickDirectory(): Promise<string | undefined>;
    create(path: string): Promise<unknown>;
}
export interface WorkspaceProbe {
    readonly get?: (name: string) => unknown;
    readonly reflect?: {
        readonly get?: (name: string) => unknown;
    };
}
export declare function workspacePathKey(path: string): string;
export declare function workspaceIdForPath(workspaces: readonly {
    readonly id: string;
    readonly path: string;
}[], path: string): string | undefined;
export declare function createdWorkspaceId(workspaces: readonly {
    readonly id: string;
    readonly path: string;
}[], path: string): string;
/** 只探测选目录。桌面优先用原生窗口；否则再调宿主服务。 */
export declare function resolveDirectoryPicker(ctx: WorkspaceProbe): {
    pickDirectory(): Promise<string | undefined>;
} | undefined;
/** @deprecated 测试兼容。创建不再要求客户端 workspaces.create。 */
export declare function resolveHostWorkspaceCreator(ctx: WorkspaceProbe): HostWorkspaceCreator | undefined;
export declare function addRegisteredWorkspace(input: {
    readonly creator: HostWorkspaceCreator;
    readonly refresh: () => Promise<void>;
    readonly listed: () => readonly {
        readonly id: string;
        readonly path: string;
    }[];
}): Promise<string | undefined>;
