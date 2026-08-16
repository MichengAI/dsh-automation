<h1 align="center">DSH Automation</h1>

<p align="center">
  <strong>在独立 Session 中按计划执行编码任务的 DeepSeek Harness Web 插件。</strong>
</p>

<p align="center">
  <a href="https://github.com/MichengAI/dsh-automation/issues">反馈问题</a>
  · <a href="https://www.npmjs.com/package/@michengai/dsh-automation">在 npm 查看</a>
  · <a href="README.md">English</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Apache License 2.0"></a>
  <a href="https://www.npmjs.com/package/@michengai/dsh-automation"><img src="https://img.shields.io/npm/v/%40michengai/dsh-automation?label=npm" alt="npm 包"></a>
  <img src="https://img.shields.io/badge/DSH-Web%20Plugin-10b981" alt="DSH Web Plugin">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A522.19-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22.19 或更高版本">
</p>

> DSH Automation 是社区维护的插件，并非 DeepSeek AI 官方产品。

## 功能概览

- 在「设置 → 定时任务」集中管理规则和运行历史。
- 支持从 Web 或 Agent 工具创建、暂停、恢复、立即运行和删除。
- 每次到期都启动全新 root Agent 和 Session，不继承来源对话。
- 计划类型包括不重复、间隔、每小时、每天、每周、每月和自定义间隔天数。
- 新建弹窗可选择工作目录、模型、技能，以及 `read-only` / `workspace-write`。
- 「通过对话创建」会关闭设置页，并在输入框填入：`我要创建一个定时任务，每【时间间隔】执行【具体任务】`。
- 运行状态包含 `queued`、`running`、`succeeded`、`failed`、`skipped`、`cancelled`。
- 侧栏提供「定时」页签：文件夹是任务名称，子会话是执行时间。原生下只包裹官方任务树，不替换搜索和工作区，也不依赖 `dsh-codex-ui`。

## 前置条件

- 已可正常运行 DeepSeek Harness Web，且可在 PowerShell 中使用 `dsh`。
- 以下示例使用 `web` profile；请替换为实际目标 profile。
- 从源码安装或二次开发需要 Node.js 22.19+；仅从 npm 安装无需在任意目录执行 `npm install`。

## 安装

### 从 npm 安装

在任意 PowerShell 目录执行。请通过 `dsh plugin` 安装到 DSH profile：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation
dsh --profile web --dump-config
```

安装或升级后重启 DSH Web，或重新加载当前 Web profile。若镜像未同步最新版本，可在安装命令末尾追加 `--registry=https://registry.npmjs.org/`。

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

完成后重启 DSH Web 或重新加载当前 Web profile。`dsh plugin ... add .` 会自动读取并应用 `cordis.patch.yml`；不要手工复制 `lib` 文件。

## 使用

打开「设置 → 定时任务」，再按下表操作：

| 目标 | 操作 | 范围 |
| --- | --- | --- |
| 创建规则 | 点击「新建定时任务」，填写名称、计划、任务说明、工作目录、模型、技能和权限。 | 当前 Host |
| 通过对话创建 | 点击「通过对话创建」。设置页关闭，输入框填入模板提示词。 | 当前对话 |
| 暂停或恢复 | 使用任务卡片上的开关。 | 单条规则 |
| 立即运行 | 打开卡片菜单，选择「立即执行」。 | 单条规则 |
| 删除 | 打开卡片菜单，选择「删除任务」。运行历史会保留。 | 仅定义 |
| 查看记录 | 打开「执行记录」，再按天、周、月、任务或状态筛选。 | 当前 Host |

每次派发都使用保存的任务说明、工作区、模型和权限边界，不会复用来源对话中的批准。

## 权限与安全边界

| 项目 | 行为 |
| --- | --- |
| 权限 | 默认 `read-only`。改文件必须显式选择 `workspace-write`。 |
| 完全访问 | 不提供无人值守 `danger-full-access`。 |
| 审批 | 无人值守使用 fail-closed 的 `never`，不会等待一个不存在的人。 |
| 重试 | 已经开始的运行不会自动重试。 |
| Host 重启 | 遗留的 `queued` / `running` 会变成 `failed(host_interrupted)`。 |
| 重叠 | 同一规则同时最多一个 active run。冲突 occurrence 记为 `skipped(overlap)`。 |

计划只表达未来意图，不是缓存下来的授权。

## 二次开发

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

`pnpm check` 会连续执行类型检查、测试和构建。

## 项目文档与许可证

项目状态、使用边界、技术架构和迭代记录从[文档交接入口](docs/00-交接入口/00-阅读导航.md)开始。补充说明见 NOTICE。

本项目采用 [Apache License 2.0](LICENSE)。
