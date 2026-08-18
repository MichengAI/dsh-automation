/** 给模型看的定时任务入口说明，避免把「定时任务」理解成操作系统 cron。 */
export declare const AUTOMATION_PROMPT_NAME = "tool:automation";
export declare const AUTOMATION_PROMPT_ORDER = 118;
export declare const AUTOMATION_PROMPT_TEXT: string;
export declare const AUTOMATION_CREATE_DESCRIPTION: string;
export declare function shouldUseAutomationCreate(userText: string): boolean;
