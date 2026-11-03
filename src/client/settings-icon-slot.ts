/**
 * `settings.section.icon` 槽位的声明式生命周期控制。
 *
 * 宿主只有在声明了该槽位时才会消费插件注册的图标；而入口位置开关（侧栏 / 设置页）
 * 决定图标此刻该不该存在。两者组合起来是「声明 → 注册 → 位置变化 → 注销 →
 * 声明撤销 → 清空」的状态机，放在闭包里既不好测也容易漏掉注销，这里收敛成一个
 * 可单测的小控制器。
 */
export interface SettingsNavIconSlotOptions {
  /** 注册图标条目；返回宿主给的注销函数（老宿主可能什么都不返回） */
  register(): (() => void) | undefined | void
  /** 当前入口位置是否仍包含设置页分区 */
  isEnabled(): boolean
  /** 注册失败时的告警出口 */
  warn?(reason: unknown): void
}

export interface SettingsNavIconSlotController {
  /** 宿主声明该槽位时调用；返回值为该声明的清理函数 */
  onInjected(): () => void
  /** 入口位置变化后按最新状态同步 */
  sync(): void
}

export function createSettingsNavIconSlot(options: SettingsNavIconSlotOptions): SettingsNavIconSlotController {
  let off: (() => void) | null = null
  let injected = false

  const dispose = (): void => {
    if (!off) return
    const current = off
    off = null
    try { current() } catch {}
  }

  const sync = (): void => {
    if (!injected) return
    if (!options.isEnabled()) {
      dispose()
      return
    }
    if (off) return
    try {
      const result = options.register()
      // 老宿主可能返回 undefined：仍视为已注册，避免每次 sync 重复注册。
      off = typeof result === 'function' ? result : () => {}
    } catch (reason) {
      off = null
      options.warn?.(reason)
    }
  }

  return {
    onInjected(): () => void {
      injected = true
      sync()
      return () => {
        injected = false
        dispose()
      }
    },
    sync,
  }
}
