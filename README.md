<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **Run standalone coding tasks on a schedule in DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [Changelog](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![npm downloads](https://img.shields.io/npm/dt/%40michengai%2Fdsh-automation.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation is a community-maintained DeepSeek Harness (DSH) plugin, not an official DeepSeek AI product.

## Features

Let DSH handle work on a schedule. Set up tasks in Settings or describe the timing and requirements in a conversation, then review each run.

- **Run once or repeat**: choose intervals, hourly, daily, weekly, monthly, or every N days.
- **Choose the working environment**: set the directory, model, skills, and permissions.
- **Adjust the schedule anytime**: create, pause, resume, run immediately, or delete tasks.
- **Review results**: browse task conversations by name and run time in the **Scheduled** tab, or filter run history in Settings.
- **Keep each run independent**: each run uses the saved task instructions and does not inherit the conversation that created it.

## Interface

Scheduled tasks live in the workspace **Scheduled** tab, next to **Tasks** and **Channels**:

![Scheduled sidebar](assets/screenshots/workspace-scheduled.png)

Open **Settings → Scheduled Tasks** to search, create, pause, and inspect rules:

![Scheduled tasks settings](assets/screenshots/settings-tasks.png)

Describe the job in chat. DSH handles approval according to the selected permission mode:

![Create a scheduled task from chat](assets/screenshots/chat-create.png)

![Official approval for automation_create](assets/screenshots/chat-approval.png)

After approval, the rule is saved and summarized in the conversation:

![Scheduled task created](assets/screenshots/chat-created.png)

Run history stays in Settings and can be filtered by day, week, month, task, or status:

![Run history](assets/screenshots/settings-runs.png)

## DSH product ecosystem

For a ready-to-use workbench, download [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). If you already use [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), install any of these eight plugins individually. The desktop app includes all eight.

| Plugin | What you can do |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organize projects and conversations, search tasks, and navigate chat turns |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Send tasks and receive replies through your usual messenger |
| [Automation](https://github.com/MichengAI/dsh-automation) | Schedule tasks and review each run |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Find, enable, create, and import local skills |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Search, restore, or clean up archived conversations |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Choose and summon specialists for your task |
| [BTW](https://github.com/MichengAI/dsh-btw) | Ask side questions without interrupting the main task |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Use /simplify to improve code within your Git changes |

## Prerequisites

- The current source uses DSH `0.1.5-rc.2` for development and real Host compatibility tests, while retaining the legacy Agent setup callback and session-list formats. Back up automation storage and sessions in the Profile before upgrading the Host; V3 sessions cannot be read after downgrading.
- Official DSH peerDependencies are exactly `0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2`; development dependencies remain pinned to `0.1.5-rc.2`. Use one consistent official package version within each Host.
- Other versions are outside the declared compatibility range. Installers may warn, and strict peer validation rejects them. Extend and pass the version matrix before adding a new rc.
- The Connection patch replaces the Web bundle's configured injection list with `[webServer, webRuntime]`; Loader still merges dependencies declared by the plugin source. Custom Hosts with additional configured injections must retain these two entries and their extra dependencies in a later Profile patch. This patch does not automatically merge other bundles' lists.
- A working DeepSeek Harness Web installation with `dsh` available in PowerShell.
- Examples use the `web` profile; replace it with the target profile.
- Source installation and development require Node.js 22.19+. npm installation does not require running `npm install` in an arbitrary directory.

## Installation

The installation commands below use the official npm registry.

### Ask an agent to install it (recommended)

Send the prompt below to any agent that can run terminal commands on your computer. Replace `web` with your actual profile. Once installed, use the plugin in DSH.

```text
Install the DSH plugin @michengai/dsh-automation into my local web profile by running: dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/. Then run dsh --profile web --dump-config, confirm the configuration includes dsh-automation, and explain how to reload DSH and start using the plugin.
```

### Install from npm

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Restart DSH Web and hard-refresh the browser. Pin a version with `@0.1.5` instead of `@latest` when needed.

## Updates

The settings title shows the installed version and a **Check for updates** button. When a newer release is available, **Update automatically** runs only when the DSH CLI or Desktop update service is available; otherwise, the dialog provides a profile-specific manual command to copy and run.

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
| Permission | Options and the default come directly from the Host `permissionPresets` service, including custom presets. |
| Tool calls | Follow Host tool availability, permission, and approval checks without an additional fixed tool allowlist or a background-shell ban. The Host manages background processes. |
| Full access | The official `danger-full-access` option uses the same risk confirmation and orange warning as Chat. |
| Approval | Chat create follows the session policy. Full access (`never`) proceeds; Workspace Write / Read Only (`ask`) shows the official card. Unattended runs stay fail-closed `never`. |
| Retry | No automatic retry after a started run. |
| Host restart | Leftover `queued` / `running` records become `failed(host_interrupted)`. |
| Concurrency | Different automations have no plugin-level global concurrency cap, including those in the same directory. The legacy `maxConcurrentRuns` setting no longer takes effect. |
| Overlap | One active run per rule. A colliding occurrence is recorded as `skipped(overlap)`. |

A schedule stores future intent. It is not a cached permission grant.

## Development

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

`pnpm check` runs typecheck, unit tests, real Host compatibility tests, and build. `pnpm test:host` bypasses runtime stubs and uses the official AgentLoop, Session V3, and permission service with a fixed local model adapter; it makes no external model calls. Browser interactions and real model calls require separate acceptance testing.

`pnpm test:matrix` builds the package, then creates separate temporary npm environments for all four versions using network access. It checks strict peer installation, every official dependency version, the packaged entry point, real AgentLoop execution, and service regressions. All four versions pass. Persistence enumeration in service regressions uses in-memory fixtures for both cold-session formats; it does not validate on-disk migration of a real Profile. The printed evidence directory retains installation lockfiles, test logs, and `results.json`. The matrix does not modify development dependencies or connect to the user's Profile.

## License

Additional notices are in [NOTICE](NOTICE).

This project uses [Apache License 2.0](LICENSE).
