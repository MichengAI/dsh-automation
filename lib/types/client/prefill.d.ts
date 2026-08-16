/** 设置页「通过对话创建」交给会话输入框的待填草稿。 */
export declare function setChatPrefill(text: string): void;
export declare function takeChatPrefill(): string | null;
export declare function peekChatPrefill(): string | null;
export declare function subscribeChatPrefill(listener: (text: string | null) => void): () => void;
export declare function applyPrefillToDom(text: string): boolean;
