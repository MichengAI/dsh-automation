# Changelog

[简体中文](CHANGELOG.zh-CN.md)

The five most recent published versions are listed below. Git tags and GitHub Releases now mirror these entries; historical sections retain links to their original release commits.

## 0.1.25 — 2026-09-03

- Fixed scheduled-task select menus so their backgrounds, borders, shadows, and hover states follow the DSH theme. Time options now remain readable in light mode.

## 0.1.24 — 2026-09-03

- Corrected the DSH peer range to `>=0.1.0-rc.5 <0.2.0`; the development test baseline remains `0.1.2-alpha.5`.

## 0.1.23 — 2026-09-02

- Declared the DSH peer compatibility range as `>=0.1.0-rc.5 <0.2.0` and pinned the development test baseline to `0.1.2-alpha.5`.
- Kept only common client injections so legacy hosts do not need alpha-only UI packages.
- Aligned the Settings GitHub and Issues links with Archive Manager, including icons, dimensions, and localized labels.

## 0.1.22 — 2026-08-28

- Enabled npm Trusted Publishing through the repository's GitHub Actions release workflow.

Published package: [`@michengai/dsh-automation@0.1.22`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.22).

## 0.1.21 — 2026-08-27

- Localized the scheduled-session more-actions accessibility label in both English and Chinese.
- Added regression coverage for opening the scheduled-task settings section, including delayed dialog mounting, cleanup, timeout handling, and cross-plugin request delivery.
- Replaced the native session and workspace hook `any` signatures with shared typed selectors and narrowed unknown Host props at the adapter boundary.
- Made legacy task-name fallback fail closed when multiple tasks share the same name, preventing the wrong task settings from opening.

Published package: [`@michengai/dsh-automation@0.1.21`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.21).

## 0.1.20 — 2026-08-27

- Merged [PR #4](https://github.com/MichengAI/dsh-automation/pull/4) by [@louishzwang](https://github.com/louishzwang), adding a read-only task overview beside execution history and persistent default sorting by created or planned time.
- Refined the native and Codex-style schedule sidebars with compact task cards, matching toolbar rhythm and typography, symmetric card gutters, and an icon-only sorting trigger.
- Added official-style scheduled-session folders that preserve existing session actions, keep stable group ordering, highlight only expanded folders containing the current session, and open the exact task settings directly.
- Added optional whole-group archiving with a confirmation step when Archive Manager is installed, while keeping long lists independently scrollable so the Settings footer remains available.

Published package: [`@michengai/dsh-automation@0.1.20`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.20).

## 0.1.19 — 2026-08-26

- Preserved time-zone and interval-anchor data while editing scheduled tasks, and made overdue recurrence recovery cadence-aware.
- Prevented stale concurrent updates from overwriting run history; safely reconciled deleted or missing scheduled sessions.
- Added a confirmation step before deleting a task, validated workspace ID and path agreement, and exposed interrupted runs in history filters.
- Aligned Agent creation and update with all supported schedule types, including hourly, monthly, and custom plans.

Published package: [`@michengai/dsh-automation@0.1.19`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.19).

## 0.1.18 — 2026-08-26

- Replaced the native task and status filters in run history with the same styled dropdown used for task sorting.
- Added consistent selected states, long-label truncation, scrolling, outside-click dismissal, and Escape handling for those filters.

Published package: [`@michengai/dsh-automation@0.1.18`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.18).

## 0.1.17 — 2026-08-26

- Removed the redundant full-width divider below the scheduled-task tabs while retaining the active-tab underline.
- Matched the sorting control to Qianwen with a filled pill trigger, compact four-option menu, smaller arrow, and neutral selected state.

Published package: [`@michengai/dsh-automation@0.1.17`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.17).

## 0.1.16 — 2026-08-26

- Added an Edit action to each scheduled-task card menu, reusing the existing task editor.
- Added a compact sorting dropdown for created time and planned time in ascending or descending order.
- Kept tasks without a next planned run at the end of the list and preserved created-time descending as the default.

Published package: [`@michengai/dsh-automation@0.1.16`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.16).

## 0.1.15 — 2026-08-26

- Restored localized built-in permission labels in the scheduled-task composer instead of exposing missing `preset.*` translation keys.
- Kept full-access confirmation copy in the Host-owned permission namespace while moving display labels into this plugin's bilingual dictionary.
- Moved the Changelog link from the README footer into the top navigation in both languages.

Published package: [`@michengai/dsh-automation@0.1.15`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.15).

## 0.1.14 — 2026-08-23

- Added bilingual changelogs covering the five most recent releases.
- Linked the release history from both README editions and included it in the npm package.

Published package: [`@michengai/dsh-automation@0.1.14`](https://www.npmjs.com/package/@michengai/dsh-automation/v/0.1.14).
