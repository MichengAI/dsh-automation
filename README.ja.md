<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **DeepSeek Harness で定期実行される独立したコーディングタスクを自動化**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [更新履歴](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![ライセンス: Apache-2.0](https://img.shields.io/badge/ライセンス-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![npm ダウンロード数](https://img.shields.io/npm/dt/%40michengai%2Fdsh-automation.svg?label=npm%20ダウンロード数)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation はコミュニティによって保守されている DeepSeek Harness（DSH）向けプラグインであり、DeepSeek AI 公式の製品ではありません。

## 機能概要

定期的に繰り返す必要のある作業を DSH に任せましょう。設定ページでタスクをスケジュールすることも、会話の中で実行時間や要件を指定することもできます。実行結果はいつでも確認可能です。

- **単発実行または繰り返し実行**：指定間隔（分単位）、毎時、毎日、毎週、毎月、およびカスタム間隔（数日ごと）に対応。
- **実行環境の柔軟な選択**：作業ディレクトリ、モデル、スキル、および権限境界を個別に設定可能。
- **いつでもスケジュール調整**：タスクの作成、一時停止、再開、即時実行、削除を自在に操作。
- **実行結果の振り返り**：サイドバーの「定期タスク」タブでタスク名と実行時間順に会話を確認。設定ページで実行履歴の絞り込みも可能。
- **独立したセッション実行**：保存されたタスク指示書を使用して新規セッションで実行され、タスク作成時の不要な会話文脈を引き継ぎません。
- **8 言語インターフェース**：日本語、英語、中国語、スペイン語、フランス語、ドイツ語、ロシア語、ポルトガル語に対応し、DSH のグローバル言語設定に追従します（非中英言語は DSH `0.2.2-rc.1` 以降の宿主言語パックが必要です）。

## 画面プレビュー

定期実行セッションは公式の「タスク」ツリーと「定期タスク」タブの両方に表示されます。アイドル状態の定期セッションには「タスク」内に公式の時計アイコンが表示されます。「定期タスク → 履歴」はデフォルトでタスク別にグループ化され、ワークスペース別、ワークスペースツリー、フラット表示に切り替え可能です。グループの追加・名前変更・削除はできません：

![サイドバーの定期タスク](assets/screenshots/workspace-scheduled.png)

「設定 → 定期タスク」を開き、ルールの検索、新規作成、一時停止、詳細確認を行います：

![定期タスク設定ページ](assets/screenshots/settings-tasks.png)

チャットでタスク内容を伝えます。DSH は選択された権限モードに従って承認を処理します：

![対話による定期タスク作成](assets/screenshots/chat-create.png)

![automation_create の公式承認](assets/screenshots/chat-approval.png)

確認後、ルールが保存され、会話内で概要が報告されます：

![定期タスク作成完了](assets/screenshots/chat-created.png)

実行履歴は設定ページに保持され、日、週、月、タスク、またはステータス別にフィルタリングできます：

![実行履歴](assets/screenshots/settings-runs.png)

## DSH 製品エコシステム

デスクトップワークベンチをご利用の場合は、[DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) をダウンロードしてください。既存の [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 環境には、各プロジェクトの README に従ってプラグインを追加できます。以下は 11 種類の自社製プラグインです：

| プラグイン | 主な機能 |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | プロジェクトと会話の整理、タスク検索、会話ターンのナビゲーション |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | タスクに応じて専門家エージェントを選択・呼び出し |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | ローカルスキルの検索、有効化/無効化、作成、インポートを一元管理 |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | アーカイブされたセッションの検索、復元、クリーンアップ |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | メッセージングプラットフォーム（DingTalk、WeChat、Feishu等）連携 |
| [Automation](https://github.com/MichengAI/dsh-automation) | タスクのスケジュール自動実行と各実行履歴の確認 |
| [BTW](https://github.com/MichengAI/dsh-btw) | メインタスクを中断せずに現在のコンテキストで一時的な質問を行う |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | `/simplify` を使用して Git 変更箇所のコード品質を向上 |
| [PUA](https://github.com/MichengAI/dsh-pua) | エラー発生時に別アプローチを促し、原因を究明して完了前に検証を徹底 |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | `/review` で独立したエージェントコードレビューを要求し、現在の会話で受領 |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | デスクトップペットを通じて会話通知を確認し、ツール承認や質問に対応 |

## 前提条件

- 宿主の互換性：DeepSeek Harness `0.2.x` 全系列（`>=0.2.0-rc.1 <0.3.0-0`）。`0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`〜`0.2.1-rc.5`、`0.2.2-rc.1` で検証済みであり、以降の 0.2.x RC 版とも互換性があります。`0.1.x` をご利用の場合はプラグイン `0.1.66` を維持してください。宿主アップグレード前に Profile 内の自動化データとセッションをバックアップしてください。
- 宿主の peerDependencies は `>=0.2.0-rc.1 <0.3.0-0` の範囲を許容します。開発依存関係は `0.2.2-rc.1` に固定されています。
- PowerShell で `dsh` コマンドが利用可能な正常稼働する DeepSeek Harness Web。
- ソースビルドや開発には Node.js 22.19+ が必要です。

## インストール

以下のインストールコマンドは公式の npm レジストリを使用します。

### エージェントに依頼してインストール（推奨）

ターミナルコマンドを実行できるエージェントに次のプロンプトを送信してください（`web` を実際のプロファイル名に置き換えてください）：

```text
DSH プラグイン @michengai/dsh-automation をローカルの web プロファイルにインストールしてください。実行コマンド：dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/。インストール後、dsh --profile web --dump-config を実行して設定に dsh-automation が含まれていることを確認し、DSH の再読み込み方法と使用開始手順を説明してください。
```

### npm からの直接インストール

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

DSH Web を再起動し、ブラウザを強制再読み込み（Ctrl+F5）してください。
- **リバースプロキシ環境**：パスプレフィックス付きリバースプロキシ配下での配置に対応。API は `document.baseURI` を基準に相対解決されます。

## プラグイン設定と切り替えスイッチ

設定は以下の場所にあります：
> **サイドバー「プラグイン」→「@michengai/dsh-automation」詳細**（宿主の `plugins.bundle.config` スロット）。

ここでは、2 つのネイティブスイッチと 1 つの表示位置セレクターが用意されています：

### 1. サイドバーエントリー (`sidebarEntry`)
- **デフォルト**：有効（`true`）/ 新規インストール時にシームレスに引き継ぎ
- **説明**：左側のアクティビティバーに専用の **「定期タスク」** アイコンを表示します。
- **効果**：クリックで 960px 中央寄せの広いパネルでタスクセンターを展開。オフにすると安全にスロット登録を解除します。

### 2. 公式自動化エントリの非表示 (`hideOfficialSchedule`)
- **デフォルト**：有効（`true`）
- **説明**：宿主組み込みの「自動化タスク」（`ui-schedule`）活動バーエントリを非表示にし、重複を防ぎます。
- **効果**：公式エントリが隠れ、本プラグインのエントリに一本化されます。オフまたはアンインストールで自動復帰します。

### 3. タスクツリーでの定期セッション表示 (`taskTreeSessions`)
- **デフォルト**：無効（`false`）
- **説明**：定期タスクの実行セッションをワークスペースのタスクツリーに表示するかどうかを制御します。無効時はツリーをクリーンに保ち、ノイズを排除します。

### 4. ストレージおよび宿主設定 (`cordis.patch.yml`)
プロファイルの `cordis.patch.yml` で以下のパラメータを設定できます：
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # 任意：設定の保存ディレクトリ
    runTimeoutMinutes: 60              # 任意：タスクタイムアウト（分、デフォルト：60）
    misfireGraceMinutes: 15            # 任意：遅延実行の許容時間（分、デフォルト：15）
    historyLimit: 200                  # 任意：保持する実行履歴件数（デフォルト：200）
    updater: false                     # 任意：エンタープライズ向け更新ロック（alias: onlineUpdate: false）
```

## アップデート方法

設定ヘッダーにあったインプラグイン更新ボタンは廃止されました。インストール時と同様に `dsh plugin --profile web add @michengai/dsh-automation@latest` コマンドで再インストールし、DSH を再起動してブラウザを強制更新してください。
エンタープライズ環境では、Cordis 設定で `updater: false` を指定することで更新 API を遮断（HTTP 403）できます。

## 使用方法

「設定 → 定期タスク」を開き、パネルを利用します：

| 目的 | 操作 | 適用範囲 |
| --- | --- | --- |
| ルール作成 | **新規タスク** を選択し、名前、スケジュール、プロンプト、ワークスペース、モデル、権限を設定 | 宿主全体 |
| チャットから作成 | 任意の会話で要件を伝えるか、**対話から作成** を選択 | 現在の会話 |
| 一時停止 / 再開 | タスクカードのスイッチを切り替え | 単一ルール |
| 今すぐ実行 | カードメニューから **今すぐ実行** を選択 | 単一ルール |
| 削除 | カードメニューから **タスクを削除** を選択（履歴は保持） | 定義のみ |
| 履歴確認 | **実行履歴** を開き、日付やステータスで絞り込み | 宿主全体 |

## セキュリティ境界

- **権限設定**：宿主の `permissionPresets` サービスに完全準拠。
- **Agent プリセット**：宿主の `agentPresets` 名簿から選択。
- **完全アクセス**：`danger-full-access` 選択時は Chat と同様のリスク確認ダイアログが表示されます。
- **無人実行時の承認**：無人バックグラウンド実行時は安全のため自動承認を要求せずフェイルクローズします。

## ライセンス

本プロジェクトは [Apache License 2.0](LICENSE) の下で公開されています。詳細な告知事項は [NOTICE](NOTICE) をご覧ください。
