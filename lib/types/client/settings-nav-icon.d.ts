/**
 * 设置页导航图标的非侵入式替换。
 *
 * 宿主会用自己的 svg 渲染设置导航图标；插件若直接改写宿主 svg 的 outerHTML，
 * 会与宿主/皮肤的内容级图标规则互相覆盖。这里改为插入独立的宿主时钟图标，
 * 只通过 marker 属性隐藏宿主 svg，卸载时可以完整还原。
 */
export declare const SETTINGS_NAV_ICON_MARKER = "data-dsh-schedule-nav";
/**
 * 100% 对齐 dshmarket：用纯属性标记控制 ::before 伪元素渲染图标。
 * 不修改任何 DOM 节点，避免移动端列表项排版下与文字重叠冲突。
 */
export declare function applySettingsNavIcon(button: HTMLButtonElement, labels: () => readonly string[], _markup?: () => string): boolean;
/**
 * 还原导航按钮：移除 marker，宿主 svg 恢复显示。
 */
export declare function restoreSettingsNavIcon(button: HTMLButtonElement): boolean;
/**
 * 安装设置导航图标补丁；返回卸载函数。
 *
 * 通过 MutationObserver 覆盖设置弹窗异步挂载、语言切换和宿主重渲染的场景。
 */
export declare function installSettingsNavIcon(labels: () => readonly string[], markup?: () => string): () => void;
