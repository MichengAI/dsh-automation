<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **Run standalone coding tasks on a schedule in DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [Apache-2.0](LICENSE)

  [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation is a community-maintained DeepSeek Harness (DSH) plugin, not an official DeepSeek AI product.

## Features

- Manage scheduled tasks from **Settings → Scheduled Tasks**.
- Create, pause, resume, run now, and delete rules from the Web UI or Agent tools.
- Start each occurrence in a fresh root Agent and Session. Source-chat history is not inherited.
- Support once, interval, hourly, daily, weekly, monthly, and custom-every-N-days schedules.
- Pick workspace, model, skills, and `read-only` / `workspace-write` in the create dialog.
- Create from chat: describe the schedule in any conversation, then confirm with the official approval card.
- Keep durable run history: `queued`, `running`, `succeeded`, `failed`, `skipped`, `cancelled`.
- Add a sidebar **Scheduled** tab. Folders are task names and child sessions are run times. On stock DSH it wraps the official workspace tree and does not depend on `dsh-codex-ui`.

## Interface

Scheduled tasks live in the workspace **Scheduled** tab, next to **Tasks** and **Channels**:

![Scheduled sidebar](assets/screenshots/workspace-scheduled.png)

Open **Settings → Scheduled Tasks** to search, create, pause, and inspect rules:

![Scheduled tasks settings](assets/screenshots/settings-tasks.png)

Describe the job in chat. The agent calls `automation_create` and asks through the official approval card:

![Create a scheduled task from chat](assets/screenshots/chat-create.png)

![Official approval for automation_create](assets/screenshots/chat-approval.png)

After approval, the rule is saved and summarized in the conversation:

![Scheduled task created](assets/screenshots/chat-created.png)

Run history stays in Settings and can be filtered by day, week, month, task, or status:

![Run history](assets/screenshots/settings-runs.png)

## Prerequisites

- A working DeepSeek Harness Web installation with `dsh` available in PowerShell.
- Examples use the `web` profile; replace it with the target profile.
- Source installation and development require Node.js 22.19+. npm installation does not require running `npm install` in an arbitrary directory.

## Installation

`dsh plugin add` forwards to `pnpm add` in the profile directory. If you omit a version or the official registry, a local mirror may leave you on an old build.

### Install from npm

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Restart DSH Web and hard-refresh the browser. Pin a version with `@0.1.4` instead of `@latest` when needed.

### Install from source

Use this for debugging or unpublished changes. The cloned directory becomes the plugin source path:

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

Restart DSH Web and hard-refresh the browser. Local installation reads and applies `cordis.patch.yml`; do not copy `lib` files manually.

## Usage

Open **Settings → Scheduled Tasks**, then use the panel as follows:

| Goal | Action | Scope |
| --- | --- | --- |
| Create a rule | Select **New scheduled task**, then set name, schedule, prompt, workspace, model, skills, and permission. | Host-wide |
| Create from chat | Describe the schedule in any conversation, or select **Create in chat**. | Current conversation |
| Pause or resume | Use the switch on a task card. | One rule |
| Run now | Open the card menu and select **Run now**. | One rule |
| Delete | Open the card menu and select **Delete task**. Run history is kept. | Definition only |
| Inspect runs | Open **Run history**, then filter by day, week, month, task, or status. | Host-wide |

Each dispatched run uses the saved prompt, workspace, model, and permission boundary. It does not reuse approvals from the source chat.

## Safety boundary

| Item | Behavior |
| --- | --- |
| Permission | Default is `read-only`. File writes require an explicit `workspace-write` choice. |
| Full access | Unattended `danger-full-access` is not offered. |
| Approval | Chat create follows the session policy. Full access (`never`) proceeds; Workspace Write / Read Only (`ask`) shows the official card. Unattended runs stay fail-closed `never`. |
| Retry | No automatic retry after a started run. |
| Host restart | Leftover `queued` / `running` records become `failed(host_interrupted)`. |
| Overlap | One active run per rule. A colliding occurrence is recorded as `skipped(overlap)`. |

A schedule stores future intent. It is not a cached permission grant.

## Development

Current sources live in `src` and build into `lib`:

- [src\index.ts](src/index.ts): Host plugin, tools, and RPC.
- [src\service.ts](src/service.ts): Durable definitions, clock, and run admission.
- [src\client\index.ts](src/client/index.ts): Settings page and chat prefill.
- `tests\*.test.ts`: Domain, recurrence, service, client, and package-contract tests.

After changing files, run tests, rebuild, and reinstall from the local directory:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm check
dsh plugin --profile web add .
```

Keep the at-most-once dispatch policy, workspace scoping for Agent tools, and fail-closed unattended approval when changing execution code.

## Verification

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm build
```

`pnpm check` runs typecheck, tests, and build together.

## Project docs and license

Start from the [documentation entry](docs/00-交接入口/00-阅读导航.md) for project status, architecture, and the current iteration. Product notes live in NOTICE.

This project uses [Apache License 2.0](LICENSE).