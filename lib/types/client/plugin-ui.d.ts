import React from 'react';
import { Input as HostInput } from '@deepseek-ai/dsh-client-ui-primitives';
/** 和技能行一致的 22px 描边图标按钮。尺寸写在 style 上，不靠额外 CSS 覆盖宿主按钮。 */
export declare const rowIconStyle: React.CSSProperties;
/** 宿主没有多行输入。令牌由调用处的 class 对齐，不桥接成 Ant TextArea。 */
export declare const TextArea: React.ForwardRefExoticComponent<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    autoSize?: {
        minRows?: number;
        maxRows?: number;
    };
} & React.RefAttributes<HTMLTextAreaElement>>;
export declare const Input: typeof HostInput;
/** 宿主 Modal 点遮罩会调用 onClose。捕获阶段拦住指定弹窗的遮罩点击，保留「点遮罩不关」。 */
export declare function blockHostModalBackdrop(event: MouseEvent, dialogClass: string): void;
