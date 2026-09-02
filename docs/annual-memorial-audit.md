# 年間法会受付 v21 実シート突合レビュー

対象: `年間法会受付管理｜春彼岸・お盆・秋彼岸` — `14WpiSyv_4MfAJH81M6L_YBxVX6l0oYGNcVuWYUxZZn8`
（2026/09/02 01:52 時点のスナップショット）

検証方法: ファイルを xlsx として書き出し、20 シートすべてのヘッダ行・数式・実データを
スクリプトの前提と 1 列ずつ突合した。`設定` の料金表（A5:E9）・フォーム連携（A17:N20）・
通知決済設定（A23:B41）、`申込管理` A:AT（46 列）、`フォーム回答` A:Y、`作札一覧` A:W、
`読経対象一覧` A:W、`一般信者名簿` A:U、`納骨壇名簿` A:V、`入金履歴` A:O、`受付入力` の
セル配置と非表示行列、`未納確認` の実数式は、下記を除きコードと一致していた。

---

## 結論

列の対応・行位置・状態遷移の設計は正しい。ただし **`clean_()` の NFKC 正規化が
2 か所で文字列比較を静かに壊しており、その 1 つは既に本番で被害が出て手作業で
復旧された記録がシートに残っている。** さらに名簿の数式列をスクリプトが 1 行ずつ
静的値で潰しており、433 行中最大 108 行が既に数式を失っている。

優先度の高い順に 3 つ。

1. **訂正機能が「合同供養＋納骨壇前読経」を認識できない**（A-1）。志納料が読経加算分だけ
   不足し、読経対象一覧の行が消える。実害の記録あり
2. **「〇〇家先祖代々」が「〇〇家先祖代々家先祖」になる**（A-2）。要確認にもならず札に出る。
   該当データが名簿に実在
3. **名簿の自動計算数式をスクリプトが上書きしている**（A-3）。同じ列が行ごとに
   自動更新／固定に分裂している

---

## 設計として良くできている点

- **状態を 5 本に分けた。** 受付状態（AD）／内容確認（AE）／通知状態（AF）／入金状況（T）／
  督促状態（AR）。「内容に不備がある」と「金が入っていない」と「連絡していない」を
  混ぜていない。`initialPaymentStatus_` にコメントで明記してあるのも良い。
- **検証で受付を拒否しない。** すべて「要確認」に落として台帳には必ず載せる。
  窓口業務で申込を取りこぼさない方針が全体で一貫している。
- **日程設定が不完全ならフォームを開かない。** `syncFormAcceptingStatusSafely_` が
  設定シートで「受付中」でも安全側に倒す。安全弁の向きが正しい。
- **`writeFirstEmptyIdRow_` の空行判定。** チェックボックスの FALSE が入った行を
  「入力済み」と誤認しない。`lastDataRowByColumn_` も同じ問題を潰している。
  ここは実際に踏んでから直した跡が見える。
- **入金を履歴テーブルの合計から導出している。** 分割入金・返金・過入金に耐える。
  過入金時に未収額セルへメモを付けるのも良い。
- **再実行に対する冪等性。** `findIdRow_` で既存行を探し、`isNewSubmission` で
  メール二重送信を防いでいる。
- **訂正の監査ログ。** 誰が・いつ・何を→何に、を備考へ残す。実データにも残っている。

---

## A. 致命的 — 実データで既に被害が出ている

### A-1. `clean_()` が「合同供養＋納骨壇前読経」を別物にする

`clean_()` は `normalize('NFKC')` を通す。NFKC は全角プラス `＋`（U+FF0B）を
半角 `+`（U+002B）へ変換する。実シートの `申込管理!K3` を確認したところ、
格納されているのは U+FF0B、`clean_()` 通過後は U+002B だった。

`applyApplicationCorrection_` だけが、この値を `clean_()` に通してから比較している。

```js
const requestType = firstObon ? '初盆供養' : clean_(appValues[10]);
//                                           ↑ ここで ＋ が + になる
```

以降の比較はすべてソース上の全角 `＋` と突き合わせるので、4 つが同時に外れる。

| 箇所 | 本来 | 実際 |
| --- | --- | --- |
| `allowedRequests.includes(requestType)` | 通る | 外れて「ご希望の供養が不正」を追加 |
| `calculateFeeFromRule_` の読経加算 | +1,000 円 | 加算されず 3,000 円 |
| `needsAltarReading_` | true | false → 読経の必須チェックを全部素通り |
| `buildReadingTargetsFromMaster_` | 対象者を返す | 空配列 |

最後が一番重い。`rebuildCorrectionReadingRows_` は先に既存行を
`clearContent()` してから書き戻すので、**読経対象一覧からその申込の行が消える。**

**実証。** `申込管理` 3 行目（深町 美穂／秋彼岸／納骨壇）は
`K=合同供養＋納骨壇前読経`、`AA=TRUE`（修正反映済）、`AB=2026/08/31 16:01`。
その `Y` 列備考にこう残っている。

```
契約者名修正:深町英紀 → 深町 美穂(2026/08/31 15:58/rusuiramuka@gmail.com)
申込内容修正:再確認(2026/08/31 16:01/rusuiramuka@gmail.com)
不具合修正:供養区分表記を統一、志納料4,000円、読経対象を反映(2026/09/01)
```

3 行目の「不具合修正」は職員が手で書いたものだ。**志納料 4,000 円と読経対象、
つまり上の表の 2 行目と 4 行目を、翌日に手作業で戻している。**

現在この区分は 2 件。2027 年の春彼岸・お盆フォームを開けば当然増える。

**修正。** 正規化後の表記へ寄せる関数を 1 つ置き、訂正側で使う。

```js
/** 台帳に全角＋で入っていても NFKC 後の半角＋でも、同じ正準表記へ寄せる。 */
function canonicalRequestType_(value) {
  const raw = clean_(value);
  if (/^合同供養[+＋]納骨壇前読経$/.test(raw)) return '合同供養＋納骨壇前読経';
  return raw;   // 合同供養のみ／納骨壇前読経のみ／初盆供養 は ＋ を含まない
}

// applyApplicationCorrection_
const requestType = firstObon ? '初盆供養' : canonicalRequestType_(appValues[10]);
```

あわせて `needsAltarReading_` と `calculateFeeFromRule_` の入口でも
`canonicalRequestType_` を通しておくと、他の経路から半角＋が混ざっても耐える。

なお `normalizeRequestType_` の 1 行目も同じ理由で常に false になっている。

```js
if (raw.includes('合同供養＋') || (raw.includes('合同供養') && ...)) {
//  ↑ raw は clean_ 済みなので半角＋。この条件は死んでいる
```

こちらは後半の条件が拾うので結果は正しい。ただし読む人を確実に誤らせるので消す。

### A-2. 「〇〇家先祖代々」が「〇〇家先祖代々家先祖」になる

`resolveMemorial_` の先祖処理。

```js
if (/先祖/.test(name) || /家$/.test(name)) {
  if (/家$/.test(name)) name += '先祖';
  if (!/家先祖$/.test(name)) name = name.replace(/先祖$/, '') + '家先祖';
  return { name, type: '先祖', issue: '' };
}
```

`小川家先祖代々` を入れると、`/家$/` に当たらず、`/家先祖$/` にも当たらず、
`replace(/先祖$/, '')` は末尾が `代々` なので何も削らない。結果は
**`小川家先祖代々家先祖`**。`先祖` 単独なら `家先祖` になる。

しかも `issue` が空なので判定は「作成可」。要確認にならず、そのまま
`作札一覧!H`（札記載供養名）へ載って経木塔婆に出る。

**実データにある。**

```
納骨壇名簿!Q91  = 小川家先祖代々      (お盆前回供養内容)
納骨壇名簿!Q92  = 小川家先祖代々
納骨壇名簿!C208 = 高橋家先祖代々      (俗名)
申込履歴索引!E18, E204 = 小川家先祖代々
```

`Q` 列は `findPreviousManualMemorialsInMaster_` が読み、受付入力の `B14` へ
自動表示される欄そのものだ。職員が前回内容をそのまま採用して登録した瞬間に壊れる。

**修正。**

```js
function normalizeAncestorName_(value) {
  const text = clean_(value);
  if (/家(?:先祖代々|先祖|代々)$/.test(text)) return text;  // 既に整っている
  if (/家$/.test(text)) return text + '先祖';
  const base = text.replace(/(?:家)?(?:先祖代々|先祖|代々)$/, '');
  return base ? base + '家先祖' : text;                      // 「先祖」単独は触らない
}
```

- `小川家先祖代々` → そのまま
- `深町家` → `深町家先祖`
- `大石家先祖` → そのまま
- `先祖` → `先祖`

### A-3. 名簿の自動計算数式をスクリプトが 1 行ずつ潰している

`納骨壇名簿` の `Q`（お盆前回供養内容）・`R`（お盆最終年）・`U`（供養履歴更新日）・
`V`（お盆直近3年）には、`申込履歴索引` から引く数式が入っている。

```
Q2 = IF(A2="","",IFERROR(INDEX(FILTER('申込履歴索引'!$E$2:$E$1000, …), 1),""))
R2 = IF(A2="","",IFERROR(MAX(FILTER('申込履歴索引'!$A$2:$A$1000, …)),""))
U2 = IF(R2="","",DATE(2026,8,19))
```

一方 `updateMemorialHistoryMaster_` と `syncRecentHistoryToMasters_` は
同じセルへ `setValue()` する。

```js
sh.getRange(row, cols.contentCol).setValue(content);  // Q
sh.getRange(row, cols.yearCol).setValue(year);        // R
sh.getRange(row, 21).setValue(updatedAt);             // U
nokotsu.getRange(index + 2, 22).setValue(compactRecentHistoryText_(…));  // V
```

**現状（433 行）。**

| 列 | 数式が残っている | 静的値に潰された |
| --- | --- | --- |
| Q お盆前回供養内容 | 375 | 58 |
| R お盆最終年 | 402 | 31 |
| U 供養履歴更新日 | 396 | 37 |
| V お盆直近3年 | 325 | 108 |

同じ列が、行によって「索引から自動更新される」ものと「あの日の値で凍っている」ものに
分裂している。索引を作り直しても静的行は追随しないので、時間が経つほどズレる。
`syncRecentApplicationHistory()` を 1 回叩くたびに静的行が増える。

**どちらかに寄せる。** 索引を正本にするなら、`納骨壇名簿` O:V への書き戻しを外す。

```js
// updateMemorialHistoryMaster_ の納骨壇分岐と
// syncRecentHistoryToMasters_ の nokotsu ループを削除し、
// ensureMemorialMasterHeaders_ で O:V に数式を貼り直す係へ変える
```

スクリプトを正本にするなら、残っている 375 行の数式を先に値へ確定させてから
書き戻しを続ける。混在のまま運用を続けるのが一番まずい。
`一般信者名簿` の E/G/H/I は現状すべて静的値なので、こちらは今のままでよい。

---

## B. 重要 — まだ表に出ていないが確実に効く

### B-1. 要確認理由の分割が効かず、訂正しても「要確認」が消えない

要確認理由は `／`（U+FF0F 全角スラッシュ）で連結される。分割側はこう。

```js
function splitIssueText_(value) {
  return String(value ?? '').split(/／/).map(clean_).filter(Boolean);
}
```

ところが呼び出し側は `clean_()` を通してから渡す。

```js
// extractCorrectionIssues_
.map(clean_).filter(…)      // ここで ／ が / に化ける
.flatMap(splitIssueText_);  // /／/ では割れない
```

NFKC は `／` → `/` も変換する。結果、複数の理由が 1 本の長い文字列のまま残り、
`isCorrectionRecheckIssue_` のどの候補とも一致しない。**再判定で消えるはずの
古い理由が `preservedIssues` に丸ごと残り、訂正しても判定が「要確認」から戻らない。**
`buildCorrectionNotes_` でも同じ理由で旧行が保存対象になり、備考が肥大する。

実データ側の傍証。`申込管理!Y3` の監査行は `契約者名修正:` と半角コロン、
`(2026/08/31 15:58/…)` と半角括弧になっている。書き込み時は全角 `：` `（）` なので、
2 回目の訂正で `buildCorrectionNotes_` の `.map(clean_)` が既存行を正規化した跡だ。

**修正。** 両方受ける。

```js
function splitIssueText_(value) {
  return String(value == null ? '' : value).split(/[／/]/).map(clean_).filter(Boolean);
}
```

`isCorrectionAuditLine_` が `[:：]` を両方見ているのは正しい。同じ扱いに揃える。

### B-2. Z:AC（訂正欄）をスクリプトが作らない

`ANNUAL.CORRECTION.HEADERS`（確定契約者名・修正反映・修正日時・修正者）は
`checkAnnualMemorialSetup` の検査にしか使われていない。`ensureApplicationV16Schema_` は
30 列目（AD）から書き始めるので、**Z:AC のヘッダも AA のチェックボックス書式も
どの関数も作らない。**

現物には手作業で入っているので今は動く。ただし新年度用にシートを作り直すと
訂正機能ごと消える。`ensureApplicationV16Schema_` に足す。

```js
sh.getRange(1, ANNUAL.CORRECTION.NAME_COLUMN, 1, ANNUAL.CORRECTION.HEADERS.length)
  .setValues([ANNUAL.CORRECTION.HEADERS]);
sh.getRange(2, ANNUAL.CORRECTION.APPLY_COLUMN, rows, 1).setDataValidation(
  SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build()
);
sh.getRange(2, ANNUAL.CORRECTION.AT_COLUMN, rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
```

### B-3. 訂正の入力欄が非表示列にある

`simplifyAnnualWorkbookV20_` の `hideColumns` と、現物の非表示列は一致している。

```
申込管理 非表示: B I J M O X AB AC AF AH AK AL AM AN AO AP AQ AS AT
```

このうち 3 つは、コードが職員に入力を求めている列だ。

- **AS 確定申込者名** — 一般区分の申込者名訂正はここが唯一の入口。未入力だと
  `applyApplicationCorrection_` が「確定申込者名を入力してください。」で throw する。
  さらに訂正成功時に背景色とメモを付けるが、隠れているので誰も見ない
- **AM 取消・除外理由** — `onAnnualMemorialEdit` が「取消・重複・テストの理由を
  入力してください。」と黄色＋メモで催促する。見えない
- **AH 今回入金額** — 申込管理から追加入金を入れる際の watched 列

`hideColumns` の対象から `34`(AH)・`39`(AM)・`45,46`(AS,AT) を外す。

### B-4. `simplifyAnnualWorkbookV20_` が毎回レイアウトを強制上書きする

現物と比較すると、職員が手で調整した跡がいくつも残っている。

- `作札一覧` は R・V・W が表示されているが、コードは `[[5,2],[13,6],[20,4]]` で
  M:R と T:W を隠す
- `申込管理` の AI は表示されているが、コードは `[34,2]` で AH:AI を隠す
- `未納確認!A6` の現物数式は `申込管理!B2:B1000` と行数を切ってあるが、
  コードは開放参照 `申込管理!B2:B` へ戻す

`setupAnnualMemorialV21()` は `runV16Setup`〜`runV21Setup` すべての別名から呼ばれ、
そのたびにこれらが巻き戻る。列幅・色・非表示の整形は初回だけ実行するか
（`PropertiesService` にフラグ）、「画面レイアウトを初期化」という別メニュー項目へ
切り出したほうがいい。スキーマ保証（ヘッダ・入力規則）とは目的が違う。

### B-5. 未納確認の現物数式が 1000 行止め

`未納確認!A6` は `申込管理!B2:B1000` で切ってある。`申込管理` は現在 1985 行まで
枠がある。**1001 行目以降の未入金は未納確認に出てこない。** 現在の申込は 8 件なので
実害はないが、放置すると気づけない種類の欠落になる。

コード側の開放参照が正しい。B-4 とあわせて「数式の正本はコード側」と決めてから
setup を 1 回流すのが筋。

### B-6. 並べ替えが非表示シートを activate する

```js
order.forEach((name, index) => {
  const sh = ss.getSheetByName(name);
  if (!sh) return;
  ss.setActiveSheet(sh);      // ← 読経対象一覧 は現在 hidden
  ss.moveActiveSheet(index + 1);
});
```

`order` には `ANNUAL.SHEETS.READING`（読経対象一覧）が入っているが、現物は非表示。
非表示シートのアクティブ化は失敗しうる。`simplifyAnnualWorkbookV20_` は
`setupAnnualMemorialV21` の末尾なので致命傷ではないが、完了アラートが出ないまま
例外終了すると「setup が失敗した」と誤解される。

```js
if (!sh || sh.isSheetHidden()) return;
```

なお職員が実際に法会当日に見る `読経用一覧` は `ANNUAL.SHEETS` に登録がなく、
並べ替えの対象外なので毎回末尾へ押し出される。`読経対象一覧!U:W`（読経申込者名・
申込者フリガナ・読経名フリガナ）の配列数式に依存しているシートなので、
スクリプト側にも存在を認識させておきたい。

### B-7. 設定不備のとき、その 1 件がどこにも載らない

`onAnnualMemorialFormSubmit` は冒頭で 3 回 throw しうる。

- `ensureAnnualV16Schemas_` → `assertAnnualV17SchemaReady_`
- `getFormRecords_`（受付状態が「受付中」「停止」以外なら throw）
- `validateAnnualConfig_`（URL・口座・支払期限日数など）

throw するとフォームの標準回答タブには残るが、`フォーム回答`・`申込管理`・
`作札一覧`・`読経対象一覧` はすべて空、自動返信も飛ばない。職員に届くのは
Apps Script の実行失敗通知メールだけで、台帳を見ても欠落に気づけない。

設計方針は「拒否せず要確認」なのだから、ここも揃えたい。最上位を try で包み、
失敗時は最低限の行を `フォーム回答` へ書いて `寺院通知先` へ通知する。

### B-8. 数式インジェクション

`setValue`/`setValues` に `=` で始まる文字列を渡すと数式として評価される。
供養内容・施主名・連絡事項はフォームの自由記述で、`clean_()` は `=` を落とさない。

`=IMPORTRANGE("...","...")` や `=HYPERLINK(...)` を入力されると、台帳側で評価される。
外部への送信を伴う関数もあるので、寺院の名簿を扱う台帳としては塞いでおきたい。

```js
function asText_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
```

または `申込管理!L`・`作札一覧!H,R`・`フォーム回答!L:P` を
`setNumberFormat('@')` にしておく。

### B-9. `getFeeRule_` の A5:E8 固定

```js
const values = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS).getRange('A5:E8').getValues();
```

現物は A5:E8 に 4 行（春彼岸/納骨壇・お盆/納骨壇・お盆/一般・秋彼岸/納骨壇）、
A9 が初盆でちょうど収まっている。ここに 1 行足した瞬間、料金 0 →
「志納料設定が不正」で全件が要確認になる。原因は設定シートの見た目から追えない。

`getFirstObonFee_` は `getRange(5, 1, lastRow - 4, 3)` で名前検索している。
同じ方式に揃える。

### B-10. 「テスト」判定が広すぎる

```js
function isExplicitTestApplication_(application) {
  const values = [ …, application.note, application.auditNote, …];
  return values.some(value => /(^|[\s　])テスト($|[\s　])|^テスト|テスト$/.test(clean_(value)));
}
```

`note`（連絡事項）と `auditNote`（受付メモ）まで見る。連絡事項の末尾に
「〇〇のテスト」と書かれただけで受付状態が「テスト」になり、未納確認からも
重複チェックからも作札からも外れる。しかも職員に警告は出ない。

対象を氏名系（契約者・申込者・施主）に絞るか、判定をやめて `AD` 列で明示する運用へ。

---

## C. 性能・保守

### C-1. O(n²) になっている箇所

- **`migrateApplicationV16Data_`** — 行ごとに `findManualApplicantRecord_`（名簿全読み）と
  `migrateExistingPaymentForRow_`（入金履歴全読み）。納骨壇 433 行・一般 64 行の現状なら
  耐えるが、申込が数百件になると 6 分制限に当たる
- **`syncRecentHistoryToMasters_`** — 名簿 497 行それぞれについて
  `compactRecentHistoryText_` が `申込管理` と `申込履歴索引` をフルスキャンする。
  約 1,000 回のシート走査
- **`syncPaymentSummaryForApplication_`** — 毎回 `collectPaymentSummaries_` で
  入金履歴を全読み。`onAnnualMemorialEdit` の行ループから呼ばれるので、
  10 行貼り付けると 10 回

いずれも Map を 1 回作って引数で回せば済む。`syncAllPaymentSummaries_` は
既にその形になっているので、単発側をそちらへ寄せる。

### C-2. `getScheduleRules_` が毎回シート全体を読む

`settings.getDataRange().getDisplayValues()` に加えて内部で `getAnnualConfig_` も呼ぶ。
`manualTargetYear_` / `manualAvailableYears_` / `getScheduleRule_` /
`getScheduleRuleForForm_` から呼ばれるので、受付入力を 1 セル編集するだけで数回走る。
実行ごとのメモ化（グローバル変数か `CacheService`）で足りる。

### C-3. 設定シートの日付表示形式に依存している

`getScheduleRules_` は `getDisplayValues()` を使う。現物の `H18:H20` は日付値＋
書式 `yyyy/mm/dd` なので「2026/09/23」で読めており、`受付入力!D7` にも
`2026年9月23日（水） 11:00 ［フォーム受付中］` と正しく出ている。

ただしこの書式を `yyyy年m月d日` に変えると `parseScheduleDateKey_` が 0 を返し、
`validateScheduleConfig_` が「合同供養日を確認してください」を立て、
**`syncFormAcceptingStatusSafely_` がフォームを自動停止する。** セルの表示形式を
変えただけで受付が止まる、というのは追跡しづらい。

`getValues()` で Date のまま受ける（`parseScheduleDateKey_` は Date 対応済み）か、
`(\d{4})年(\d{1,2})月(\d{1,2})日` を正規表現に足す。

### C-4. 到達しないコード

`readManualReception_` は `email = ''`、`guideMethod = 'らくまる寺務'` を固定で返す。
したがって以下は実行されない。

- `registerManualReception_` の `if (application.guideMethod === 'メール')` 分岐
- `sendManualApplicantGuide_` 全体
- `noticeState` の三項連鎖のうち メール／印刷／郵送 の 3 本

ほかに、

- `initialPaymentStatus_(issues)` の引数が未使用
- `normalizeRequestType_` の 1 行目（A-1 参照）
- `受付入力!E21`「今回入金額」＋ `F21` — 実際の入力欄は `B23`。ラベルが二重で、
  `F21` に打った値はどこにも読まれない。E:G は非表示なので実害はないが消したい

### C-5. 空の catch が多い

`onOpen` / `correctionEditor_` / `recentHistoryYears_` / `onEdit` と、
`syncRecentApplicationHistory` の外部ブック取込 4 箇所。

特に後者は、外部 4 ブックを個別に try で握りつぶしたうえで最後に
「直近申込履歴を N 件同期し、名簿にも反映しました。」と toast を出す。
1 ブックも読めなくても成功に見える。せめて `console.error(error)` を入れ、
toast に失敗元を並べる。

### C-6. `onOpen` がシートを書き換える

`renameLegacyPaymentDashboardV20_` / `ensureWorkSheetSchema_` /
`ensureManualApplicantCandidateFormula_` / `updateManualReceptionMode_` /
`renderRecentApplicationHistory_` が、ファイルを開くたびに走る。

閲覧権限のユーザーが開くと毎回例外（catch で握りつぶされてメニューだけ出る）。
書き込み権限があっても起動が重い。スキーマ保証は明示実行のメニュー項目へ寄せ、
`onOpen` はメニュー作成だけにする。

### C-7. 受付入力は同時に 1 件しか扱えない

固定セル方式なので、2 人目は 1 人目が `finishManualReception_` で消した後の
空欄を読んでエラーになる。`使い方` シートに明記済みなので運用でカバーする前提だが、
複数人で受け付ける日が来るならサイドバー（`HtmlService`）へ移すのが本筋。

### C-8. ハードコードされた値

- `rusuiramuka@gmail.com`（`repairAnnualFormConnections` のアラート文）
- `0942-21-7500`（`buildApplicantEmailHtml_` の既定値）
- 初盆 20,000 円（`updateManualReceptionMode_` のメモ文言。実値は `設定!C9` から
  取得しているので二重管理。設定を変えると説明文だけ古くなる）
- 外部スプレッドシート ID 5 件、廃止済みフォーム ID 1 件

設定シートか `PropertiesService` へ。特に `removeObonGeneralRouteFromWorkbook_` は
`DriveApp.setTrashed(true)` を毎回実行する破壊的処理なので、一度成功したら
フラグを立てて二度と走らせない形にしたい。

### C-9. 単一ファイル約 3,000 行

定義 / フォーム受付 / 受付入力 / 訂正 / 入金 / 名簿・履歴 / セットアップ の
7 ファイル程度に割る。副作用のない関数（`resolveMemorial_`、`normalizeRequestType_`、
`parseSchedule*`、`splitIssueText_`、`calculateFeeFromRule_`、`normalizeAncestorName_`）は
そのまま単体テストが書ける。A-1・A-2・B-1 はどれも 1 行の入出力テストで捕まる種類のバグで、
それが本番まで抜けたのがこの構成のコストになっている。

---

## 対応順

| 順 | 項目 | 規模 |
| --- | --- | --- |
| 1 | A-1 訂正の供養区分 | ヘルパー 1 つ＋呼び出し 1 行 |
| 2 | A-2 先祖代々 | 関数 1 つ差し替え |
| 3 | B-1 要確認理由の分割 | 正規表現 1 文字 |
| 4 | B-3 訂正入力欄の非表示解除 | 配列 1 行 |
| 5 | B-2 Z:AC の自動生成 | 数行 |
| 6 | B-8 数式インジェクション | 書式指定または 1 関数 |
| 7 | B-7 送信時 throw の握り | try の追加 |
| 8 | A-3 名簿数式の方針決定 | **運用判断が要る。要相談** |
| 9 | B-4/B-5/B-6、B-9、B-10 | 各数行 |
| 10 | C 系 | 順次 |

1〜7 は独立していて、どれも既存データを壊さずに入れられる。8 だけは
「索引の数式」と「スクリプトの書き戻し」のどちらを正本にするかを先に決める必要がある。
