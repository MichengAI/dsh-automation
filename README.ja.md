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

定期実行セッションは公式の「タスク」ツリーと「定期タスク」タブの両方に表示されます。アイドル状態の定期セッションには「タスク」内に公式の時計アイコンが表示されます。「定期タスク → 履歴」はデフォルトでタスク別にグループ化され、ワークスペース別、ワークスペースツリー、フラット表示に切り替え可能です。ワークスペース別モードではワークスペースを表示したままセッションを定期実行のみに絞り込み、ヘッダーの「＋」から直接新規タスクを作成できます。グループの追加・名前変更・削除はできません：

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

- 宿主の互換性：DeepSeek Harness `0.2.x` 全系列（`>=0.2.0-rc.1 <0.3.0-0`）。`0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`〜`0.2.1-rc.5`、`0.2.2-rc.1` で検証済みであり、以降の 0.2.x RC 版とも互換性があります。`0.1.x` をご利用の場合はプラグイン `0.1.66` を維持してください。宿主アップグレード前に Profile 内の自動化データとセッションをバックアップしてください。`0.2.0` は V4 セッションを書き込むため、ダウングレード後は V4 セッションを読み取れません。
- 宿主の peerDependencies は `>=0.2.0-rc.1 <0.3.0-0` の代際範囲を許容します。開発依存関係は `0.2.2-rc.1` に固定されています。旧バージョンおよび `0.3.0` 代の破壊的変更はバージョンゲートで拒否されます。`@deepseek-ai/dsh-agent-presets` および `@deepseek-ai/dsh-agent-preset-registry` は peer ではなく、宿主の `agentPresets` サービスを利用します。同一宿主内では統一された公式パッケージバージョンを使用してください。
- その他のバージョンはサポート対象外です。インストーラが警告を出す場合があり、厳格な peer 検証では拒否されます。新しい RC を追加する前にバージョンマトリクスを拡張して検証を通過させてください。
- 自動化バンドルは公式の Connection エントリを上書きしません。各宿主は独自の起動依存関係、信頼できるホスト式、カスタム設定を維持し、自動化は自身のプラグインスコープで RPC チャネルを登録します。
- PowerShell で `dsh` コマンドが利用可能な正常稼働する DeepSeek Harness Web。
- 例示では `web` プロファイルを使用しています。実際の対象プロファイルに適宜読み替えてください。
- ソースビルドや開発には Node.js 22.19+ が必要です。npm からの通常利用では任意ディレクトリでの `npm install` は不要です。

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

DSH Web を再起動し、ブラウザを強制再読み込み（Ctrl+F5）してください。バージョンを固定したい場合は `@latest` の代わりに `@0.1.5` などの固定バージョンを指定します。
- **リバースプロキシ環境**：パスプレフィックス付きリバースプロキシ配下での配置に対応。API は `document.baseURI` を基準に相対解決されます。

## プラグイン設定と切り替えスイッチ

設定は以下の場所にあります：
> **サイドバー「プラグイン」→「@michengai/dsh-automation」詳細**（宿主の `plugins.bundle.config` スロット）。

ここでは、2 つのネイティブスイッチと 1 つの表示位置セレクターが用意されています：

### 1. サイドバーエントリー (`sidebarEntry`)
- **デフォルト**：有効（`true`）/ 新規インストール時にシームレスに引き継ぎ
- **説明**：左側のアクティビティバーに専用の **「定期タスク」** アイコンを表示します。
- **効果**：
  - **960px 中央寄せビュー**：クリックで 960px 中央寄せの広いパネルでタスクセンターを展開。狭い設定モーダル内スクロールの制約を解消します。
  - **クリーンな登録解除**：トグルをオフにするとスロットを安全に登録解除し、パネルがアクティブだった場合は安全に別ビューへ退避します。
  - **同期の維持**：標準の設定モーダルやワークスペースのレールタブは常に利用可能で、双方向で完全同期されます。

### 2. 公式自動化エントリの非表示 (`hideOfficialSchedule`)
- **デフォルト**：有効（`true`、サイドバーエントリと協調して動作）
- **説明**：宿主組み込みの「自動化タスク」（`ui-schedule`）活動バーエントリを非表示にし、重複を防ぎます。
- **効果**：
  - **シームレスな平替**：新規インストール時に公式エントリが隠れ、本プラグインのエントリに一本化されます。
  - **スマートなビュー復位**：非表示化時、メイン画面が公式スケジュールを表示していた場合は自動でデフォルトセッションに戻します。
  - **ちらつき防止キャッシュ**：クライアント側にローカルストレージキャッシュを備え、低速環境でもアイコンのちらつきを防ぎます。
  - **完全なクリーン復元**：オフまたはアンインストールで公式エントリが自動復元します。
  - **アップグレードの安全性**：以前に `sidebarEntry` を無効化していたユーザー環境では、公式エントリを表示状態のまま維持します。

### 3. タスクツリーでの定期セッション表示 (`taskTreeSessions`)
- **デフォルト**：無効（`false`、既定で定期セッションを非表示にしワークスペースを整理）
- **説明**：定期タスクの実行セッションをワークスペースの公式タスクツリーに表示するかどうかを制御します。
- **効果**：
  - **ノイズ低減と隔離**：無効時、定期セッション（`dsh-automation-session-` プレフィックスまたは追跡中の実行）がメインツリーから自動除外され、頻繁な実行によるツリーの圧迫を防ぎます。
  - **完全な履歴保持**：フィルタリング対象はメインツリーのみです。すべての過去の実行は「定期タスク → 履歴」に一覧表示され、いつでも確認可能です。
  - **プラグイン間協調プロトコル**：侵入的なホスト改変を行わず、標準の `NativeTabRegistry.sessionFilters` 契約で動作し、IM Connect や Archive Manager などの他プラグインと円滑に共存します。

### 4. ストレージおよび宿主設定 (`cordis.patch.yml`)
プロファイルの `cordis.patch.yml` で以下のパラメータを設定できます：
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # 任意：設定の保存ディレクトリ（デフォルトはアクティブな profile）
    runTimeoutMinutes: 60              # 任意：タスクタイムアウト（分、デフォルト：60、最大：1440）
    misfireGraceMinutes: 15            # 任意：遅延実行の許容時間（分、デフォルト：15、最大：10080）
    historyLimit: 200                  # 任意：保持する実行履歴件数（デフォルト：200、最大：5000）
    updater: false                     # 任意：エンタープライズ向け更新ロック（alias: onlineUpdate: false）
```

## アップデート方法

設定ヘッダーにあったインプラグイン更新ボタン（バージョンバッジと更新確認ボタン）は廃止されました。インストール時と同様に `dsh plugin … add @latest` コマンドで再インストールし、DSH を再起動してブラウザを強制更新してください。

企業管理環境や VibeDev などのインデックスでは、Cordis 設定で `updater: false` または `onlineUpdate: false` を指定することで、サーバー側の更新 API を拒否（HTTP 403）できます。

## 使用方法

「設定 → 定期タスク」を開き、パネルを利用します：

| 目的 | 操作 | 適用範囲 |
| --- | --- | --- |
| ルール作成 | **新規タスク** を選択し、名前、スケジュール、プロンプト、ワークスペース、モデル、権限、Agent プリセットを設定 | 宿主全体 |
| チャットから作成 | 任意の会話で要件を伝えるか、**対話から作成** を選択 | 現在の会話 |
| 一時停止 / 再開 | タスクカードのスイッチを切り替え | 単一ルール |
| 今すぐ実行 | カードメニューから **今すぐ実行** を選択 | 単一ルール |
| 削除 | カードメニューから **タスクを削除** を選択（履歴は保持） | 定義のみ |
| 履歴確認 | **実行履歴** を開き、日、週、月、タスク、またはステータスで絞り込み | 宿主全体 |

各実行は保存されたプロンプト、ワークスペース、モデル、権限境界を使用し、作成元のチャットで付与された承認は再利用されません。

`automation_create` と `automation_update` は設定画面と同じモデル制御（`provider`、`model`、`reasoning_effort`）をサポートします。`agent_preset` でプリセットを選択し、省略時は宿主デフォルトが適用されます。モデル指定時は `provider` と `model` を空でない ID としてペアで指定するか、両方を `null` としてグローバル追従を指定してください（不完全なペアは拒否されます）。保存された ID はトリミングされ、モデル変更時は明示的な指定がない限り前回の推論レベル上書きが解除されます。 `automation_list` はデフォルトでメタデータと `lastRun` の要約（ステータス、時刻、240文字以内の `summary`、エラー）のみを返し、`prompt` 全文は返出しません（代わりに `promptChars` を返します）。プロンプトの完全な原文が必要な場合は `include_prompt: true` を指定してください。

## セキュリティ境界

| 項目 | 動作 |
| --- | --- |
| 権限 | 選択肢とデフォルト値は宿主の `permissionPresets` サービス（カスタムプリセットを含む）から直接取得されます。 |
| Agent プリセット | 作成・編集時に宿主の `agentPresets` 名簿から選択。タスクカードには現在のプリセットが表示され、実行履歴には各実行で実際に使用されたプリセットが記録されます。破損したプリセットは無効化表示されます。 |
| ツール呼び出し | 固定の許可リストやバックグラウンドシェルの禁止などの独自制約を設けず、宿主のツール可用性、権限、承認チェックに完全に準拠します。バックグラウンドプロセスは宿主が管理します。 |
| 完全アクセス | 公式の `danger-full-access` オプションは、Chat と同様のリスク確認とオレンジ色の警告を表示します。 |
| 承認 | 対話作成はセッションポリシーに従います。完全アクセス（`never`）はそのまま進行し、ワークスペース書き込み / 読み取り専用（`ask`）は公式カードを表示します。無人実行は安全のため fail-closed の `never` を維持します。 |
| 再試行 | 実行開始後の自動再試行は行いません。 |
| 宿主再起動 | 残存した `queued` / `running` 記録は `failed(host_interrupted)` に移行します。 |
| 全体並行数 | 同一ディレクトリ内であっても、異なる自動化タスク間でプラグインレベルの大域的な同時実行制限はありません。旧プラグイン設定の `maxConcurrentRuns` は効力を失っており、後述のタスク単位並行数フィールドとは異なります。 |
| 最小間隔 | `0.1.40` 以降、インターバルスケジュールは 1 分以上の整数値を受け付けます。見逃されたトリガーは個別に再実行されず、復旧ウィンドウ内の最新期日のみが実行されます。 |
| タスク並行上限 | `0.1.40` 以降利用可能。作成・編集ダイアログで同時実行数（正の整数、デフォルト `1`）を設定。キューおよび実行中がこの上限を共有し、満杯時の定期トリガーは `skipped(overlap)` となり、手動実行は上限エラーを返します。上限を引き下げても実行中のタスクはキャンセルされません。Agent ツールは `max_concurrent_runs`、Web RPC は `maxConcurrentRuns` を使用し、既存タスクはデフォルト `1` です。 |
| ワークスペース境界 | 既定で起点セッションのワークスペースに拘束されます。Agent ツールは `workspace` パラメータ（名前、ID、パス、または末尾のディレクトリ名）を介してタスクの指定や移行が可能です。不正な越境を防ぐため、変更操作（`update` / `run_now` / `delete`）には明示的に `cross_workspace: true` が要求され、`automation_list` は `all_workspaces: true` による横断検索をサポートします。 |

スケジュールは将来の実行意図を保存するものであり、キャッシュされた永続的な権限付与ではありません。

## 開発

### ソースコードからのインストール

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

DSH Web を再起動し、ブラウザを強制再読み込みしてください。

現在のソースコードは `src` にあり、`lib` にビルドされます：

- [src\index.ts](src/index.ts): 宿主プラグイン、ツール、RPC。
- [src\service.ts](src/service.ts): 永続化定義、クロック、実行管理。
- [src\client\index.ts](src/client/index.ts): 設定ページと対話入力補完。
- `tests\*.test.ts`: ドメイン、反復、サービス、クライアント、パッケージ契約テスト。

ローカルインストールは `cordis.patch.yml` を読み込んで適用します。`lib` ファイルを手動でコピーしないでください。

ファイルを変更した後は、テストを実行し、再ビルドしてローカルディレクトリから再インストールしてください：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm check
dsh plugin --profile web add .
```

実行コードを変更する際は、最大 1 回のディスパッチポリシー、エージェントツールの明示的なクロスワークスペースガード（cross_workspace / all_workspaces）によるデフォルトのワークスペース拘束、および無人実行時のフェイルクローズ承認を維持してください。

## 検証

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm build
```

`pnpm check` は型チェック、ユニットテスト、実機宿主互換テスト、ビルドを一括実行します。`pnpm test:host` はランタイムスタブを迂回し、公式の AgentLoop、Session V3、および固定ローカルモデルアダプター付きパーミッションサービスを使用します（外部モデル呼び出しは行いません）。ブラウザ操作や実際のモデル呼び出しは別途受入テストが必要です。

プラグイン間のサイドバー回帰テストは `pnpm test:composition <dsh-im-connect チェックアウトディレクトリ>` で実行します。まず IM チェックアウトをビルドしてください。スクリプトはその `lib/client.js` を読み込みます。アーカイブ、IM、定期タスク、Codex UI プラグインにわたる両リポジトリの合成ロジックとタブ登録順序、遅延通知、アンインストール時の引き継ぎを検証します。スロットとタイマーはシミュレーション環境を使用するため、プラグインのインストールやデスクトップ描画の受入テストの代わりにはなりません。この個別検査には外部チェックアウトが必要であり、`pnpm check` には含まれません。結果を再現可能にするには、固定された IM リビジョンを使用してください。

`pnpm test:matrix` はパッケージをビルドし、ネットワークアクセスを使用して宣言された各宿主バージョンごとに独立した一時 npm 環境を作成します。厳格な peer インストール、公式依存関係の各バージョン、パッケージ化されたエントリポイント、実際の AgentLoop 実行、およびサービス回帰を検証します。宣言されたすべてのバージョンが合格しています。サービス回帰における永続化の列挙は、新旧両方のコールドセッション形式に対してインメモリフィクスチャを使用しており、実際の Profile のディスクマイグレーションを検証するものではありません。出力されるエビデンスディレクトリには、インストールのロックファイル、テストログ、および `results.json` が保持されます。マトリックスは開発依存関係を変更せず、ユーザーの Profile にも接続しません。

## ライセンス

本プロジェクトは [Apache License 2.0](LICENSE) の下で公開されています。詳細な告知事項は [NOTICE](NOTICE) をご覧ください。
