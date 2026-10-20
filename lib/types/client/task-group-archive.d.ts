/** 按真实会话 ID 串行归档；失败向调用方传递，避免把部分成功显示为全部成功。 */
export declare function archiveTaskSessions(sessionIds: readonly string[], archivedIds: ReadonlySet<string>, archiveSession: (sessionId: string) => void | Promise<void>): Promise<void>;
