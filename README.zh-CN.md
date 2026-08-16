# dsh-automation

在独立 DSH Session 中按计划执行编码任务，并从 Web 或 Agent 管理这些规则。

[简体中文](README.zh-CN.md) · [交接入口](docs/00-交接入口/00-阅读导航.md) · [Apache-2.0](LICENSE)

这是 DeepSeek Harness 的社区插件，不是 DeepSeek 官方产品。

## 它解决什么

DSH Core Schedule 适合“十分钟后回到当前对话”。本插件适合另一类工作：

- 每天 09:00 检查依赖和测试，结果写进一条新 Session
- 每周一生成仓库健康报告

每次触发都会创建全新 root Agent 和 Session，不会继承来源对话。

## 功能

- Web 会话页 **自动化** 标签：创建、暂停、恢复、立即运行、删除、查看历史
- 6 个工作区作用域工具：`automation_create` / `list` / `update` / `runs` / `run_now` / `delete`
- 计划类型：单次、固定间隔、每天、每周
- 运行状态：`queued` / `running` / `succeeded` / `failed` / `skipped` / `cancelled`
- 默认只读；需要改文件时必须显式选择 `workspace-write`


## 安装

安装到 Web profile 后重启 `dsh web`：

```powershell
dsh plugin --profile web add github:MichengAI/dsh-automation
dsh web
```

本地开发：

```powershell
dsh plugin --profile web add .\
dsh web
```

## 安全边界

- 计划不是授权。每次运行都会重新解析工作区、preset 和权限。
- 无人值守审批策略为 `never`，不会永久等待一个不存在的人。
- 禁止 `danger-full-access`。
- 没有自动重试，避免重复产生副作用。
- Host 重启后，遗留的 `queued`/`running` 会变成 `failed(host_interrupted)`。

## 开发

```powershell
pnpm install
pnpm check
```

## 许可

[Apache-2.0](LICENSE)。产品模型参考了社区中的独立自动化实践，详见 [NOTICE](NOTICE)。
