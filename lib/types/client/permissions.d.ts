import type { PermissionOption } from './protocol.js';
export type PermissionTranslate = (key: string, params?: Record<string, unknown>) => string;
/** 与 Chat 一致：只本地化官方内置原名，自定义预设保留 Host 提供的名称。 */
export declare function permissionLabel(option: PermissionOption, t: PermissionTranslate): string;
