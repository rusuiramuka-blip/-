# 年間法会受付（春彼岸・お盆・秋彼岸）Apps Script

対象スプレッドシート：`年間法会受付管理｜春彼岸・お盆・秋彼岸`（`14WpiSyv…`）

```
apps-script/
  nenkan-hoe/
    年間法会受付.gs   このファイル1本で完結（既存コードと全文差し替え）
```

> **巫女勤怠（`genba/` `kyuyo/`）とは別のApps Scriptプロジェクトに置くこと。**
> `onOpen` `onEdit` `clean_` などが同名なので、同居させると後から読まれた定義が勝つ。

## 差し替え手順

1. 既存コードを全選択して、`年間法会受付.gs` の内容で置き換えて保存。
2. スプレッドシートを開き直す。
3. 「通年法会受付 > 管理（初期設定・同期）> 計算ロジックの自己診断」で正常を確認。
4. 「管理（初期設定・同期）> 初期設定を実行（v22）」を1回実行。
5. 「設定状態を確認」で全項目が正常であることを確認。

## メニュー構成（v22.2）

| メニュー | 関数 | 用途 |
| --- | --- | --- |
| 受付入力の内容を登録 | `registerManualReceptionFromMenu` | 登録チェックが反応しないときの代替 |
| フォーム設定を反映 | `syncFormScheduleInfo` | 日程・対象年・受付中/停止をフォームへ反映 |
| 設定状態を確認 | `checkAnnualMemorialSetup` | 連携・トリガー・列構成・志納料表の点検 |
| 管理 > 初期設定を実行（v22） | `runV22Setup` | 列構成・トリガー・履歴・入金集計の再構築 |
| 管理 > フォーム連携を確認・修復 | `repairAnnualFormConnections` | 回答先とフォーム送信トリガーの修復 |
| 管理 > 入金合計・未収額を再計算 | `syncAllPaymentSummaries` | 入金履歴から申込管理を再集計 |
| 管理 > 直近3年の申込履歴を同期 | `syncRecentApplicationHistory` | 旧台帳・現行台帳から申込履歴索引を再構築 |
| 管理 > 一般信者名簿を同期 | `syncGeneralApplicantMaster` | 92_人物・世帯台帳から一般信者を取込 |
| 管理 > 旧台帳の前回供養内容を取込 | `syncMemorialHistoryMasters` | 01_受付台帳/02_供養祈願明細から前回内容を移行 |
| 管理 > 計算ロジックの自己診断 | `selfTestAnnualMemorialV22` | 外部ファイルを開かずに純粋ロジックを検証 |

## トリガー

| 種別 | 関数 | 備考 |
| --- | --- | --- |
| 単純トリガー | `onOpen` | メニュー＋受付入力の画面整理のみ |
| 単純トリガー | `onEdit` | 受付入力の候補切替・自動表示（登録は行わない） |
| インストール型（編集時） | `onAnnualMemorialEdit` | 受付登録・訂正反映・入金同期 |
| インストール型（変更時） | `onAnnualMemorialChange` | 入金履歴の行削除後の再集計 |
| インストール型（フォーム送信） | `onAnnualMemorialFormSubmit` | 3フォーム分 |

詳細なレビュー内容は `docs/nenkan-hoe-review.md` を参照。
