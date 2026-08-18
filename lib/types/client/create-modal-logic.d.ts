/** 新建/编辑弹窗只允许取消或 ESC 关闭，点旁边不能关。 */
export declare function shouldCloseCreateModal(reason: 'backdrop' | 'escape' | 'cancel'): boolean;
/** 和 Chat 一样：先选目录，取消则不登记；没有手输路径这条路。 */
export declare function adoptPickedWorkspace(input: {
    readonly pick: () => Promise<string | null>;
    readonly add: (path: string) => Promise<string>;
}): Promise<string | null>;
