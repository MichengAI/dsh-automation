import type { ClientContext } from './contracts.js';
export declare const name = "dsh-automation-client";
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
export { resolveApiUrl } from './api-base.js';
export { setupSidebarEntry } from './bundle-config.js';
