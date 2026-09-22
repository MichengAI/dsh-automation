export type HostIcon = (props: {
    readonly size?: number;
    readonly className?: string;
}) => JSX.Element | null;
/** 0.1.7 把尺寸从组件名里拿掉了。旧宿主仍导出带尺寸的名字，缺哪个就用另一个。没有对应导出时返回 undefined，调用方再退回自绘。 */
export declare function pickHostExport(source: Readonly<Record<string, unknown>>, name: string): unknown;
/** 宿主图标渲染出 null 时改用自绘。 */
export declare function hostOrFallback(icon: HostIcon, fallback: HostIcon): HostIcon;
export declare function pickHostIcon(source: Readonly<Record<string, unknown>>, ...names: readonly string[]): HostIcon;
