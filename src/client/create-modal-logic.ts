/** 新建/编辑弹窗只允许取消或 ESC 关闭，点旁边不能关。 */
export function shouldCloseCreateModal(reason: 'backdrop' | 'escape' | 'cancel'): boolean {
  return reason !== 'backdrop'
}
