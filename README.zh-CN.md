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

工作区左侧「任务 / 频道 / 定时」分列。定时会话会同时出现在「任务」的官方工作区树和「定时」页签；空闲的定时会话在「任务」里带官方时钟图标。「定时 → 记录」默认按任务分组，可切换按工作区、工作区树或平铺；按工作区模式保留工作区，只把会话过滤为定时会话；头部「＋」直接打开新建定时任务。分组不可新增、重命名或删除：

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

想使用桌面工作台，可下载 [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases)；已有 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 环境，可按各项目 README 按需安装。以下列出 11 个自研插件；桌面端实际随附范围以对应版本的发行说明和内置清单为准。

| 插件 | 你可以用它做什么 |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | 整理项目与会话、搜索任务、跳转对话轮次 |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | 按任务选择并召唤专业角色 |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | 统一查找、启停、创建和导入本机技能 |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | 搜索、恢复或清理已归档会话 |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | 从消息平台下任务、收回复 |
| [Automation](https://github.com/MichengAI/dsh-automation) | 按计划执行任务，查看每次运行的结果 |
| [BTW](https://github.com/MichengAI/dsh-btw) | 在当前上下文中临时旁问，不打断主任务 |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | 用 `/simplify` 整理 Git 改动范围内的代码 |
| [PUA](https://github.com/MichengAI/dsh-pua) | 引导 Agent 在失败时换方法、查原因，并在完成前验证结果 |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | 用 `/review` 发起独立 Agent 代码审查，在当前会话接收报告 |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | 通过桌面宠物查看会话提醒、处理工具审批和问题回答 |

## 前置条件

- 宿主支持范围：DeepSeek Harness `0.2.x` 全系列（`>=0.2.0-rc.1 <0.3.0-0`），已验证兼容 `0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`、`0.2.1-rc.2`、`0.2.1-rc.3`，并自动支持后续日常小版本、alpha 与 RC，同代宿主升级无需重复等待发版。仍停在 `0.1.x` 的宿主请继续使用插件 `0.1.66`。升级宿主前备份 Profile 中的自动化存储和会话目录。`0.2.0` 写入 V4 会话，V4 会话不支持降级读取。
- 官方 DSH peerDependencies 放宽至代际范围 `>=0.2.0-rc.1 <0.3.0-0`。开发依赖统一对齐固定为 `0.2.1-rc.3`。早期版本与 `0.3.0` 代际破坏性更新由版本门拦截。同一宿主中的官方包应使用一致版本。
- 其他版本不在声明兼容范围内；安装器可能提示 peer 警告，启用严格 peer 校验时会失败。支持新 rc 前需扩展版本矩阵并通过验证。
- 自动化 bundle 不覆盖官方 Connection 条目，各版宿主保留自己的启动依赖、可信地址表达式和自定义配置；自动化在自身插件作用域注册 RPC 路由。
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
- **反向代理部署**：支持将 DSH 部署在带路径前缀的反向代理后面（如 `/app/dsh/`），插件 API 与更新检查端点统一自动按页面基址（`document.baseURI`）相对解析，避免丢失代理路径前缀导致 404。

## 插件配置与可选开关

插件遵循 DSH 官方扩展配置规范，配置项位于：
> **主界面侧边栏「插件」→ 点击 `@michengai/dsh-automation` 详情页**（对应宿主 `plugins.bundle.config` 槽位）。

此处提供四个原生扁平行开关：

### 1. 侧边栏入口 (`sidebarEntry`)
- **默认状态**：开启（`true`）/ 新装默认平替接管
- **功能说明**：在宿主左侧主活动栏常驻 **「定时任务」** 图标入口。
- **生效效果**：
  - **960px 居中版心**：开启后，在侧边栏点击即可直达定时任务中心，并在主工作区以 **960px 居中版心**（对齐官方插件管理与市场规范）展开完整大面板，彻底告别在设置弹窗狭窄视口内滚动的局限，便于集中管理长任务指令、定时计划与执行记录；
  - **安全平滑收退**：关闭后安全注销侧栏槽位；若当前正停留在定时任务面板，会自动安全切回默认视图，防止悬空和白屏；
  - **双入口数据同步**：无论是否开启侧栏入口，DSH 原有的「设置 → 定时任务」弹窗以及会话侧栏内的「任务与定时」页签均始终保留，两处界面数据与状态 100% 实时同步。

### 2. 在线更新 (`onlineUpdate` / `updater`)
- **默认状态**：开启（`true`）
- **功能说明**：控制是否允许在线检查并安装定时任务插件的新版本。
- **生效效果**：
  - **界面联动**：关闭开关后，定时任务设置标题旁的「检查更新」按钮与版本提示将即时隐藏，无需刷新页面；开启后自动恢复展示；
  - **接口安全拦截**：关闭后，服务端的更新路由对任何版本检查和安装请求均返回 `HTTP 403` 禁用状态，彻底杜绝在插件内安装未审核版本；
  - **宿主/平台级锁定**：面向精选插件索引（如 VibeDev）或企业安全合规环境，支持直接在 Cordis 配置文件（bundle patch）中声明，无需进入界面手动配置：
    ```yaml
    updater: false # 或 onlineUpdate: false
    ```
    配置生效后，更新器在启动时即被完全禁用，且更新入口默认保持隐藏，前端 Switch 显示为锁定置灰状态；
  - **更新模式**：发现新版后，只有检测到 DSH CLI 或 Desktop 更新服务时才可使用“自动更新”；其他环境会在弹窗中提供可复制、与当前 Profile 对应的手工更新命令。

### 3. 屏蔽官方自动化入口 (`hideOfficialSchedule`)
- **默认状态**：开启（`true`，与侧栏入口协同平替）
- **功能说明**：控制是否隐藏宿主自带的「自动化任务」（`ui-schedule`）活动栏入口，避免与本插件功能冲突。
- **生效效果**：
  - **默认清爽与平滑平替**：安装本插件后，宿主自带的自动化任务活动栏按钮默认隐藏，由本插件侧栏入口自动点亮接管，避免界面出现两个相似入口；
  - **活动区智能复位**：隐藏生效时，若主工作区正处于官方自动化页面，系统自动将其安全切回默认会话，杜绝页面孤立悬空；
  - **本地持久化防闪烁**：前端支持本地缓存优先读取，弱网或离线环境下首帧绝不出现图标闪烁跳变；
  - **无损自愈与卸载复原**：关闭开关或通过标准命令卸载本插件后，官方自带的自动化入口将自动完好无损地复现，绝无残留修改；
  - **老用户升级防死区保护**：若升级前曾手动关闭侧栏入口，新版本将智能继承关闭状态，不隐藏官方入口，杜绝出现活动栏两头皆空的死区。

### 4. 在任务树显示定时会话 (`taskTreeSessions`)
- **默认状态**：关闭（`false`，默认在任务树隐藏定时会话，保持日常工作区清爽）
- **功能说明**：控制是否在官方工作区任务树中显示定时任务运行历史会话。
- **生效效果**：
  - **降噪隔离**：关闭后，定时生成的历史会话（以 `dsh-automation-session-` 开头或属于当前定时任务运行记录的会话）自动从左侧官方工作区树中过滤，避免高频任务的历史会话刷满日常开发工作区；
  - **无损复盘**：关闭仅作用于主任务树，在「定时 → 记录」面板中依然完整保留并可随时打开复盘全部运行历史；
  - **轻量管道协同**：基于 `NativeTabRegistry.sessionFilters` 标准协作协议实现，无需深度劫持宿主组件，切换即时生效，与 IM 插件及归档管理等第三方插件完全兼容。未支持该协议的外壳会自动安全降级并提示。

### 5. 存储与宿主参数配置 (`cordis.patch.yml`)
支持在 Profile 的 `cordis.patch.yml` 中定制以下参数：
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # 可选：自定义设置文件 settings.json 存储路径，默认当前 Profile 目录
    runTimeoutMinutes: 60              # 可选：单次任务超时时间（分钟），默认 60，上限 1440
    misfireGraceMinutes: 15            # 可选：错过执行时间的宽限期（分钟），默认 15，上限 10080
    historyLimit: 200                  # 可选：历史运行记录保留上限，默认 200，上限 5000
    updater: false                     # 可选：企业级锁定更新（同 onlineUpdate: false）
```

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

`automation_create` 和 `automation_update` 支持与设置页相同的模型参数：`provider`、`model`、`reasoning_effort`。提供方和模型使用 ID，推理等级使用该模型公布的 `reasoningEfforts` 值。创建时省略 provider/model 会继承当前会话的完整配对；会话配对不完整时整对回退全局，不会把两边拼在一起。两边都没有完整配对时拒绝创建，而不是写成跟随全局。保存时去掉 ID 首尾空白。省略推理等级使用模型默认。更新时省略字段保持原值。将 `provider` 和 `model` 都设为 `null`，任务就会在每次运行时跟随当时的全局选择；`reasoning_effort=null` 清除固定推理等级，恢复模型默认。创建、更新和 `automation_list` 的返回定义包含保存的目标字段（返回中的推理等级字段为 `reasoningEffort`）。

指定或修改模型时，必须成对传入非空的 `provider` 和 `model` ID，或两项都设为 `null`，不完整配对会被拒绝。先查询 `automation_list`：`models` 包含可选 ID 和 `reasoning.efforts`，`defaultModel` 是全局选择，`modelFailures` 提示目录加载失败。切换保存的模型配对时，若没有显式传入 `reasoning_effort`，会清除旧等级；重复提交相同配对则保留。保存时不会依据目录校验模型 ID 和推理等级；Agent 可通过目录查询选择宿主公布的选项。

## 权限与安全边界

| 项目 | 行为 |
| --- | --- |
| 权限 | 列表和默认值直接来自 Host 官方 `permissionPresets` 服务；支持 Host 注册的自定义预设。 |
| 工具调用 | 遵循 Host 的工具可用性、权限和审批检查，不额外维护固定工具白名单或禁止后台 shell；后台进程由 Host 管理。 |
| 完全访问 | 选择官方 `danger-full-access` 时显示与 Chat 一致的风险确认和橙色提示。 |
| 审批 | 对话创建跟随当前会话策略。Full access（`never`）直接创建；Workspace Write / Read Only（`ask`）走官方授权卡。无人值守运行仍是 fail-closed 的 `never`。 |
| 重试 | 已经开始的运行不会自动重试。 |
| Host 重启 | 遗留的 `queued` / `running` 会变成 `failed(host_interrupted)`。 |
| 并发 | 不同自动化任务不设插件级全局并发上限，同一目录下也可同时运行。旧插件级全局并发配置（插件 config 中的 `maxConcurrentRuns`）不再生效，与下方任务级字段不同。 |
| 最短间隔 | 自 `0.1.40` 起，间隔计划支持最短 `1` 分钟，仅接受整数分钟。恢复时仅处理补跑窗口内最近的到期点，不逐次补齐漏掉的触发。 |
| 单任务并发 | 自 `0.1.40` 起支持。在任务的新建/编辑页设置“并发数量”（正整数，默认 `1`）。同一任务的排队及运行记录共用此上限；满额时定时触发记为 `skipped(overlap)`，手动运行返回上限提示。调低上限不取消已有运行。Agent 创建/更新工具使用 `max_concurrent_runs`，Web RPC 使用 `maxConcurrentRuns`；旧任务默认 `1`。 |

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

跨插件侧栏回归可运行 `pnpm test:composition <dsh-im-connect 检出目录>`。请先构建 IM 检出目录，脚本读取其中的 `lib/client.js`。它执行两仓库的接入逻辑和页签注册表，覆盖归档、IM、定时及 Codex UI 的注册顺序、延迟通知与卸载接管；插槽和计时器使用模拟环境，不替代 Desktop 渲染验收，也不安装插件。该检查需要外部检出目录，独立于 `pnpm check`；请固定 IM revision，以便复现结果。

`pnpm test:matrix` 先构建发布包，再联网为上述已声明版本分别建立临时 npm 环境，执行严格 peer 安装、整棵官方依赖树版本检查、发布入口加载、真实 AgentLoop 执行和服务回归。各声明版本均通过；服务回归中的持久化枚举使用内存夹具，覆盖新旧冷会话格式，不等同于真实 Profile 的磁盘迁移验收。脚本输出证据目录，保留各版安装锁文件、测试日志和 `results.json`。矩阵不修改开发依赖，也不连接用户 Profile。

## 许可证

补充说明见 [NOTICE](NOTICE)。

本项目采用 [Apache License 2.0](LICENSE)。
