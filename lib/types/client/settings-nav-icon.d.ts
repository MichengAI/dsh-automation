/**
 * 设置页导航图标的非侵入式替换。
 *
 * 宿主会用自己的 svg 渲染设置导航图标；插件若直接改写宿主 svg 的 outerHTML，
 * 会与宿主/皮肤的内容级图标规则互相覆盖。这里改为插入独立的宿主时钟图标，
 * 只通过 marker 属性隐藏宿主 svg，卸载时可以完整还原。
 */
export declare const SETTINGS_NAV_ICON_CLASS = "dsh-st-nav-icon-schedule";
export declare const SETTINGS_NAV_ICON_MARKER = "data-dsh-schedule-nav";
/**
 * 为目标导航按钮注入 mask 图标。
 *
 * @param button 设置弹窗导航按钮
 * @param labels 返回当前语言下目标分区名称的函数
 * @returns 是否发生了实际变更；重复调用保持幂等
 */
export declare function applySettingsNavIcon(button: HTMLButtonElement, labels: () => readonly string[], markup?: () => string): boolean;
/**
 * 还原导航按钮：移除 marker 与插件插入的图标，宿主 svg 从未被修改。
 *
 * @returns 是否清理了插件留下的内容
 */
export declare function restoreSettingsNavIcon(button: HTMLButtonElement): boolean;
/**
 * 安装设置导航图标补丁；返回卸载函数。
 *
 * 通过 MutationObserver 覆盖设置弹窗异步挂载、语言切换和宿主重渲染的场景。
 */
export declare function installSettingsNavIcon(labels: () => readonly string[], markup?: () => string): () => void;
