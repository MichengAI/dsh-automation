import type { HostIcon } from './host-icon-resolve.js';
/** 把宿主图标组件渲染成可直接注入官方 DOM 的 SVG 字符串。 */
export declare function hostIconMarkup(icon: HostIcon, size?: number): string;
