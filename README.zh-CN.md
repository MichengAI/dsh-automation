<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **在独立 DSH Session 中按计划执行编码任务**

  [English](README.md) · [更新日志](CHANGELOG.zh-CN.md) · [Apache-2.0](LICENSE)

  [![许可证：Apache-2.0](https://img.shields.io/badge/许可证-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![npm 下载量](https://img.shields.io/npm/dt/%40michengai%2Fdsh-automation.svg?label=npm%20%E4%B8%8B%E8%BD%BD%E9%87%8F)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation 是社区维护的 DeepSeek Harness（DSH）插件，并非 DeepSeek AI 官方产品。

## 功能概览

把需要按时重复的工作交给 DSH。你可以在设置页安排任务，也可以在对话中说明执行时间和要求，再回看每次运行的结果。

- **安排一次或重复执行**：支持间隔、每小时、每天、每周、每月和自定义间隔天数。
- **选择工作环境**：设置工作目录、模型、技能和权限。
- **随时调整安排**：创建、暂停、恢复、立即运行或删除任务。
- **查看执行结果**：在侧栏「定时」中按任务和执行时间回看会话，在设置页筛选运行记录。
- **每次独立运行**：使用已保存的任务说明，不继承创建任务时的整段对话。

## 界面预览

工作区左侧「任务 / 频道 / 定时」分列。定时任务只出现在「定时」：

![工作区定时侧栏](assets/screenshots/workspace-scheduled.png)

打开「设置 → 定时任务」可搜索、新建、暂停和查看规则：

![定时任务设置页](assets/screenshots/settings-tasks.png)

在对话里描述任务。DSH 会按所选权限模式处理授权：

![通过对话创建定时任务](assets/screenshots/chat-create.png)

![创建定时任务的官方授权](assets/screenshots/chat-approval.png)

确认后规则会保存，并在对话里汇总：

![定时任务创建成功](assets/screenshots/chat-created.png)

执行记录留在设置页，可按天、周、月、任务或状态筛选：

![执行记录](assets/screenshots/settings-runs.png)

## DSH 产品生态

想直接使用完整工作台，可下载 [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases)；已有 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 环境，可按需独立安装以下 8 个自研插件。桌面端已随附这些插件。

| 插件 | 你可以用它做什么 |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | 整理项目与会话、搜索任务、跳转对话轮次 |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | 从微信、飞书、钉钉等消息平台下任务、收回复 |
| [Automation](https://github.com/MichengAI/dsh-automation) | 按计划执行任务，查看每次运行的结果 |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | 统一查找、启停、创建和导入本机技能 |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | 搜索、恢复或清理已归档会话 |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | 按任务选择并召唤专业角色 |
| [BTW](https://github.com/MichengAI/dsh-btw) | 在当前上下文中临时旁问，不打断主任务 |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | 用 /simplify 整理 Git 改动范围内的代码 |

## 前置条件

- 当前源码以 DSH `0.1.5-rc.1` 为开发和真实宿主测试基线，保留旧版 Agent 创建回调及会话列表格式的兼容。升级宿主前备份 Profile 中的自动化存储和会话目录；V3 会话不支持降级读取。
- 官方 DSH peerDependencies 精确限定为 `0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1`；开发依赖固定为 `0.1.5-rc.1`。同一宿主中的官方包应使用一致版本。
- 其他版本不在声明兼容范围内；安装器可能提示 peer 警告，启用严格 peer 校验时会失败。支持新 rc 前需扩展版本矩阵并通过验证。
- Connection 补丁替换 Web bundle 的配置注入列表为 `[webServer, webRuntime]`，Loader 仍会合并插件源码声明的依赖。自定义宿主若增加了其他配置注入，需在后置 Profile 补丁中保留这两项并补齐自定义依赖；本补丁不自动合并其他 bundle 的列表。
- 已可正常运行 DeepSeek Harness Web，且可在 PowerShell 中使用 `dsh`。
- 以下示例使用 `web` profile；请替换为实际目标 profile。
- 从源码安装或二次开发需要 Node.js 22.19+；仅从 npm 安装无需在任意目录执行 `npm install`。

## 安装

以下安装命令使用官方 npm 源。

### 让 Agent 帮你安装（推荐）

把下面这段话发给任意能够执行本机终端命令的 Agent。将 `web` 替换为实际使用的 profile；安装完成后，在 DSH 中使用本插件。

```text
请将 DSH 插件 @michengai/dsh-automation 安装到本机 web profile，执行：dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/。安装后执行 dsh --profile web --dump-config，确认配置包含 dsh-automation，并告诉我如何重新加载 DSH 和开始使用。
```

### 从 npm 安装

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

安装后重启 DSH Web，并在浏览器硬刷新。需要钉死某一版时，把 `@latest` 换成 `@0.1.5`。

## 在线更新

设置标题会显示当前版本和“检查更新”按钮。发现新版后，只有检测到 DSH CLI 或 Desktop 更新服务时才可使用“自动更新”；其他环境会在弹窗中提供可复制、与当前 Profile 对应的手工更新命令。

## 使用

打开「设置 → 定时任务」，再按下表操作：

| 目标 | 操作 | 范围 |
| --- | --- | --- |
| 创建规则 | 点击「新建定时任务」，填写名称、计划、任务说明、工作目录、模型、技能和权限。 | 当前 Host |
| 通过对话创建 | 在任意对话描述定时任务，或点击「通过对话创建」。 | 当前对话 |
| 暂停或恢复 | 使用任务卡片上的开关。 | 单条规则 |
| 立即运行 | 打开卡片菜单，选择「立即执行」。 | 单条规则 |
| 删除 | 打开卡片菜单，选择「删除任务」。运行历史会保留。 | 仅定义 |
| 查看记录 | 打开「执行记录」，再按天、周、月、任务或状态筛选。 | 当前 Host |

每次派发都使用保存的任务说明、工作区、模型和权限边界，不会复用来源对话中的批准。

## 权限与安全边界

| 项目 | 行为 |
| --- | --- |
| 权限 | 列表和默认值直接来自 Host 官方 `permissionPresets` 服务；支持 Host 注册的自定义预设。 |
| 工具调用 | 遵循 Host 的工具可用性、权限和审批检查，不额外维护固定工具白名单或禁止后台 shell；后台进程由 Host 管理。 |
| 完全访问 | 选择官方 `danger-full-access` 时显示与 Chat 一致的风险确认和橙色提示。 |
| 审批 | 对话创建跟随当前会话策略。Full access（`never`）直接创建；Workspace Write / Read Only（`ask`）走官方授权卡。无人值守运行仍是 fail-closed 的 `never`。 |
| 重试 | 已经开始的运行不会自动重试。 |
| Host 重启 | 遗留的 `queued` / `running` 会变成 `failed(host_interrupted)`。 |
| 重叠 | 同一规则同时最多一个 active run。冲突 occurrence 记为 `skipped(overlap)`。 |

计划只表达未来意图，不是缓存下来的授权。

## 二次开发

### 从源码安装

适用于调试或使用未发布改动。克隆后的目录会直接作为插件安装路径：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location D:\Repository\deepseek-harness-plugin
git clone https://github.com/MichengAI/dsh-automation.git
Set-Location .\dsh-automation
pnpm install
pnpm test
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

完成后重启 DSH Web 并硬刷新浏览器。`dsh plugin ... add .` 会自动读取并应用 `cordis.patch.yml`；不要手工复制 `lib` 文件。

当前源码在 `src`，构建产物在 `lib`：

- [src\index.ts](src/index.ts)：Host 插件、工具和 RPC。
- [src\service.ts](src/service.ts)：持久化定义、时钟和运行准入。
- [src\client\index.ts](src/client/index.ts)：设置页和对话预填。
- `tests\*.test.ts`：领域、周期、服务、客户端和包契约测试。

修改后运行测试、重新构建，并以本地目录安装验证：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm check
dsh plugin --profile web add .
```

修改执行逻辑时必须保留 at-most-once 派发、Agent 工具的工作区边界，以及无人值守 fail-closed 审批。

## 验证

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm build
```

`pnpm check` 会连续执行类型检查、单元测试、真实宿主兼容测试和构建。`pnpm test:host` 不加载宿主运行时桩，使用官方 AgentLoop、Session V3 和权限服务，模型响应由本地固定适配器提供，不调用外部模型。浏览器交互和真实模型调用需另行验收。

`pnpm test:matrix` 先构建发布包，再联网为上述四个版本分别建立临时 npm 环境，执行严格 peer 安装、整棵官方依赖树版本检查、发布入口加载、真实 AgentLoop 执行和服务回归。四版均通过；服务回归中的持久化枚举使用内存夹具，覆盖新旧冷会话格式，不等同于真实 Profile 的磁盘迁移验收。脚本输出证据目录，保留各版安装锁文件、测试日志和 `results.json`。矩阵不修改开发依赖，也不连接用户 Profile。

## 许可证

补充说明见 [NOTICE](NOTICE)。

本项目采用 [Apache License 2.0](LICENSE)。
