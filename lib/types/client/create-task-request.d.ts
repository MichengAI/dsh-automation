/**
 * 记录视图的“新建”按钮与设置里的新建任务弹窗之间的跨组件请求。
 * 宿主 WorkspaceBrowser 没有创建定时任务的 slot，因此沿用任务设置的事件桥。
 */
export declare const AUTOMATION_CREATE_TASK_EVENT = "dsh-automation:create-task";
export declare const AUTOMATION_CREATE_TASK_STORAGE_KEY = "dsh-automation:pending-create-task";
export declare function requestAutomationCreateTask(): void;
export declare function readAutomationCreateTaskRequest(storage: Storage | undefined): boolean;
export declare function clearAutomationCreateTaskRequest(storage: Storage | undefined): void;
