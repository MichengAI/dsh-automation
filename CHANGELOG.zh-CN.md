# 更新日志

[English](CHANGELOG.md)

以下记录最近发布的五个版本。Git 标签与 GitHub Release 现已和这些条目同步；历史条目继续保留原始发布提交链接。

## 0.1.21 — 2026-08-27

- 为定时会话的“更多操作”无障碍标签补齐中英文翻译。
- 补充打开定时任务设置分区的回归测试，覆盖弹窗延迟挂载、资源清理、超时处理和跨插件请求传递。
- 将原生会话与工作区 Hook 的 `any` 签名替换为共享强类型 Selector，并在宿主适配边界收窄未知参数。
- 旧执行记录按任务名回退时若遇到多个同名任务将安全失败，避免打开错误的任务设置。

发布包：[`@michengai/dsh-automation@0.1.21`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.21)。

## 0.1.20 — 2026-08-27

- 合并 [PR #4](https://github.com/MichengAI/dsh-automation/pull/4)，感谢 [@louishzwang](https://github.com/louishzwang) 贡献：在执行记录旁增加只读任务总览，并支持按创建时间或计划时间保存默认排序。
- 统一原生侧栏与 Codex 风格侧栏的紧凑任务卡片、工具栏节奏和标题字体，使用对称卡片边距与图标式排序入口。
- 增加官方风格的定时会话文件夹，保留原有会话操作，稳定文件夹顺序，仅在展开且包含当前会话时显示蓝色文件夹，并可直接打开对应任务设置。
- 安装归档管理插件时提供带二次确认的整组会话归档，同时让长列表独立滚动，确保底部设置入口始终可用。

发布包：[`@michengai/dsh-automation@0.1.20`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.20)。

## 0.1.19 — 2026-08-26

- 编辑定时任务时保留时区与间隔锚点，并让错过执行后的补偿计算按计划周期正确回溯。
- 防止并发更新使用过期快照覆盖执行记录，并安全处理已删除或宿主缺失的定时会话。
- 删除任务前增加确认，校验工作区 ID 与路径必须一致，并在执行记录筛选中提供 interrupted 状态。
- 让 Agent 的创建和更新入口覆盖全部受支持的计划类型，包括每小时、每月和自定义计划。

发布包：[`@michengai/dsh-automation@0.1.19`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.19)。

## 0.1.18 — 2026-08-26

- 将执行记录中的“全部任务”和“全部状态”从原生下拉框替换为与任务排序一致的自定义样式菜单。
- 为这些筛选菜单增加统一的选中状态、长名称省略、滚动、点击外部关闭和 Escape 关闭行为。

发布包：[`@michengai/dsh-automation@0.1.18`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.18)。

## 0.1.17 — 2026-08-26

- 移除定时任务标签栏下方多余的整行分隔线，同时保留当前标签的短下划线。
- 参照千问重做排序控件，采用填充胶囊按钮、紧凑四选项菜单、更小的箭头和中性的选中状态。

发布包：[`@michengai/dsh-automation@0.1.17`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.17)。

## 0.1.16 — 2026-08-26

- 在每个定时任务卡片菜单中增加“编辑任务”，复用现有任务编辑器。
- 增加紧凑的排序下拉菜单，支持按创建时间或计划时间升序、倒序排列。
- 无下次计划时间的任务固定排在末尾，并继续以创建时间倒序作为默认值。

发布包：[`@michengai/dsh-automation@0.1.16`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.16)。

## 0.1.15 — 2026-08-26

- 恢复定时任务输入区内置权限预设的中文显示，不再暴露缺失的 `preset.*` 翻译键。
- 完全访问风险确认继续使用宿主管理的权限翻译域，显示名称则改用本插件自己的中英文词典。
- 将中英文 README 的更新日志入口从底部移到顶部导航。

发布包：[`@michengai/dsh-automation@0.1.15`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.15)。

## 0.1.14 — 2026-08-23

- 新增中英文更新日志，展示最近五个发布版本。
- 在中英文 README 中加入更新日志入口，并将日志纳入 npm 包。

发布包：[`@michengai/dsh-automation@0.1.14`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.14)。
