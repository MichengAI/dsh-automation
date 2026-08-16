<h1 align="center">DSH Automation</h1>

<p align="center">
  <strong>A DeepSeek Harness Web plugin for running standalone coding tasks on a schedule.</strong>
</p>

<p align="center">
  <a href="https://github.com/MichengAI/dsh-automation/issues">Report an issue</a>
  · <a href="https://www.npmjs.com/package/@michengai/dsh-automation">View on npm</a>
  · <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Apache License 2.0"></a>
  <a href="https://www.npmjs.com/package/@michengai/dsh-automation"><img src="https://img.shields.io/npm/v/%40michengai/dsh-automation?label=npm" alt="npm package"></a>
  <img src="https://img.shields.io/badge/DSH-Web%20Plugin-10b981" alt="DSH Web Plugin">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A522.19-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22.19 or later">
</p>

> DSH Automation is a community-maintained plugin, not an official DeepSeek AI product.

## Features

- Manages scheduled tasks from **Settings → Scheduled Tasks**.
- Creates, pauses, resumes, runs now, and deletes rules from the Web UI or Agent tools.
- Starts each occurrence in a fresh root Agent and Session. Source-chat history is not inherited.
- Supports once, interval, hourly, daily, weekly, monthly, and custom-every-N-days schedules.
- Lets you pick workspace, model, skills, and `read-only` / `workspace-write` permission in the create dialog.
- Fills a chat draft from **Create in chat**: `I want to create a scheduled task that runs every [interval] and does [the actual task]`.
- Keeps durable run history with `queued`, `running`, `succeeded`, `failed`, `skipped`, and `cancelled`.
- Adds a sidebar **Scheduled** tab. Folders are task names and child sessions are run times. On stock DSH it wraps the official workspace tree instead of replacing it, and it does not depend on `dsh-codex-ui`.

## Prerequisites

- A working DeepSeek Harness Web installation with `dsh` available in PowerShell.
- Examples use the `web` profile; replace it with the target profile.
- Source installation and development require Node.js 22.19+. npm installation does not require running `npm install` in an arbitrary directory.

## Installation

### Install from npm

Run this from any PowerShell directory. Install into the DSH profile through `dsh plugin`:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation
dsh --profile web --dump-config
```

Restart DSH Web or reload the active Web profile. If a package mirror is behind, append `--registry=https://registry.npmjs.org/`.

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

Restart DSH Web or reload the active Web profile. Local installation reads and applies `cordis.patch.yml`; do not copy `lib` files manually.

## Usage

Open **Settings → Scheduled Tasks**, then use the panel as follows:

| Goal | Action | Scope |
| --- | --- | --- |
| Create a rule | Select **New scheduled task**, then set name, schedule, prompt, workspace, model, skills, and permission. | Host-wide |
| Create from chat | Select **Create in chat**. Settings close and the composer is filled with a template prompt. | Current conversation |
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
| Approval | Unattended runs use fail-closed `never` and do not wait for a missing human. |
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
