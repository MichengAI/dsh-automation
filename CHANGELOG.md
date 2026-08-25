# Changelog

[简体中文](CHANGELOG.zh-CN.md)

The five most recent published versions are listed below. Git tags and GitHub Releases now mirror these entries; historical sections retain links to their original release commits.

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

## 0.1.13 — 2026-08-23

- Logged internal RPC failures instead of leaving automation failures silent.

Release commit: [`6f04ae9`](https://github.com/MichengAI/dsh-automation/commit/6f04ae9).
