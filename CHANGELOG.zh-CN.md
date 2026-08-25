# 更新日志

[English](CHANGELOG.md)

以下记录最近发布的五个版本。Git 标签与 GitHub Release 现已和这些条目同步；历史条目继续保留原始发布提交链接。

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

## 0.1.13 — 2026-08-23

- 记录内部 RPC 失败，避免自动化执行错误被静默吞掉。

发布提交：[`6f04ae9`](https://github.com/MichengAI/dsh-automation/commit/6f04ae9)。

## 0.1.12 — 2026-08-23

- 使自动化权限行为与交互式聊天保持一致。

发布提交：[`d116209`](https://github.com/MichengAI/dsh-automation/commit/d116209)。
