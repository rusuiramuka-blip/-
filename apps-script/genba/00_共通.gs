/**
 * 巫女シフト・現場運営 — 共通定義とユーティリティ
 *
 * 対象: 巫女シフト・現場運営（再構築版・完成）
 *       1jIb8Z72DsSJc-92iHvMSm_5K7JcS1ESZPT3AEj4MZ2E
 *
 * 注意: このプロジェクトと給与側プロジェクトは必ず「別の」Apps Script に置くこと。
 *       同名の関数（onOpen / onEdit / requireSheet_ など）を持つため、
 *       1つのプロジェクトに同居させると後から読まれた定義が勝って壊れる。
 */

const SH = Object.freeze({
  HOME: '00_ホーム',
  STAFF: '01_スタッフ',
  SHIFT: '02_シフト入力',
  ACTUAL: '02A_当日勤怠',
  RECRUIT: '02B_募集状況',
  PLACE_CHANGE: '03_配置変更',
  DAILY: '04_日別30分配置',
  PERSON: '05_本人別・配布',
  LEDGER: '06_食事・貸与',
  NEED: '07_必要人数',
  CHECK: '08_管理チェック',
  APPLY: '09_申込',
  SETTING: '_設定'
});

/** 給与側（管理者用ファイル）のシート名 */
const PAY_SH = Object.freeze({
  IMPORT: '_取込',
  ATTENDANCE: '01_勤怠承認',
  PERSONAL: '02_個人別給与'
});

/** 給与側 01_勤怠承認 の列（ヘッダ4行目 / データ5行目〜 / A〜AL の38列） */
const PAY_ATT = Object.freeze({
  FIRST: 5, LAST: 503, WIDTH: 38,
  ID: 1, DATE: 2, STAFF_ID: 3, NAME: 4, KIND: 5,
  PLAN_IN: 6, PLAN_OUT: 7, PLAN_BREAK: 8,
  ACT_IN: 9, ACT_OUT: 10, ACT_BREAK: 11, NIGHT_BREAK: 12,
  WAGE_KIND: 13, OTHER_PAY: 14,
  APPROVE_STATE: 15, APPROVER: 16, APPROVED_AT: 17,
  RATE: 18, TRANSPORT: 19,
  CLOSE_STATE: 29, CLOSE_ID: 30, WARN: 31, UPDATED: 32,
  DIFF_KIND: 33, DIFF_MIN: 34, REASON: 35,
  CHECKER: 36, CHECKED_AT: 37, ACTUAL_SEND: 38
});

/** 給与側 _取込 の列（ヘッダ2行目 / データ3行目〜） */
const PAY_IMPORT = Object.freeze({
  FIRST: 3, WIDTH: 15,
  ID: 1, DATE: 2, STAFF_ID: 3, NAME: 4, IN: 5, OUT: 6, BREAK: 7,
  PLACE: 8, NOTE: 9, PLAN_STATE: 10, SENT_AT: 11, SENDER: 12,
  IMPORT_STATE: 13, WAGE_KIND: 14, SRC_UPDATED: 15
});

/** 給与側 02_個人別給与 の列（ヘッダ4行目 / データ5行目〜） */
const PAY_PERSONAL = Object.freeze({
  FIRST: 5, LAST: 204, WIDTH: 14,
  STAFF_ID: 1, NAME: 2, PAY_STATE: 13
});

/** 02_シフト入力（ヘッダ4行目 / データ5行目〜） */
const SHIFT = Object.freeze({
  FIRST: 5,
  LAST: 3004,          // 移行前は 504。migrate_行数を拡張() で拡張する
  WIDTH: 22,           // V列（時間帯）を追加して 22 列
  ID: 1, DATE: 2, LABEL: 3, ASSIGNEE: 4, STAFF_ID: 5,
  IN: 6, OUT: 7, BREAK: 8, HOURS: 9, PLACE: 10, WAGE_KIND: 11,
  LUNCH: 12, DINNER: 13, STATE: 14, NOTE: 15, WARN: 16,
  SEND: 17, UPDATED: 18, START_AT: 19, END_AT: 20, NIGHT: 21, BAND: 22
});

/** 02A_当日勤怠（ヘッダ4行目 / データ5行目〜） */
const ACT = Object.freeze({
  FIRST: 5, LAST: 3004, WIDTH: 19,
  ID: 1, DATE: 2, STAFF_ID: 3, NAME: 4,
  PLAN_IN: 5, PLAN_OUT: 6, PLAN_BREAK: 7, STATE: 8,
  IN: 9, OUT: 10, BREAK: 11, DIFF_KIND: 12, DIFF_MIN: 13,
  REASON: 14, SRC_ID: 15, CHECKER: 16, CHECKED_AT: 17,
  SEND: 18, WARN: 19
});

/** 03_配置変更（ヘッダ4行目 / データ5行目〜） */
const PLC = Object.freeze({
  FIRST: 5, LAST: 1004, WIDTH: 10,
  DETAIL_ID: 1, WORK_ID: 2, NAME: 3, START: 4, END: 5,
  PLACE: 6, NOTE: 7, WARN: 8, START_AT: 9, END_AT: 10
});

/** 06_食事・貸与 の貸与台帳（ヘッダ24行目 / データ25行目〜）＝実シートに合わせた列 */
const LEDGER = Object.freeze({
  FIRST: 25, LAST: 224, WIDTH: 9,
  STAFF_ID: 1, NAME: 2, JUBAN: 3, LOAN: 4, RETURN: 5,
  COLLECT: 6, COLLECTED_AT: 7, COLLECTOR: 8, NOTE: 9
});

/** 07_必要人数（ヘッダ4行目 / データ5行目〜） */
const NEED = Object.freeze({
  FIRST: 5, LAST: 204, WIDTH: 14,
  ID: 1, DATE: 2, PLACE_ID: 3, PLACE: 4, BAND: 5,
  START: 6, END: 7, COUNT: 8, LIMIT: 9, NOTE: 10, STATE: 11
});

/** 01_スタッフ（ヘッダ2行目 / データ3行目〜） */
const STAFF = Object.freeze({
  FIRST: 3, LAST: 202, WIDTH: 9,
  ID: 1, NAME: 2, KANA: 3, KIND: 4, EXP: 5, ADULT: 6, JUBAN: 7, NOTE: 8,
  EMAIL: 9            // 移行で追加する列
});

/** 09_申込（ヘッダ2行目 / データ3行目〜） */
const APPLY = Object.freeze({
  FIRST: 3, WIDTH: 9,
  ID: 1, AT: 2, STAFF_ID: 3, NAME: 4, WORK_ID: 5,
  OP: 6, RESULT: 7, REASON: 8, ACTOR: 9
});

/** 04_日別30分配置 のグリッド */
const GRID = Object.freeze({
  DATE_CELL: 'B2',
  MODE_CELL: 'B4',
  LOADED_CELL: 'D2',      // 読込日時を表示するセル
  HEAD_ROW: 5,
  FIRST: 6,
  LAST: 85,               // 移行前は 57。42名/日＋交代を入力できるよう 80 行へ
  COL_FIRST: 2,           // B列 = 0:00
  COL_COUNT: 48,          // 30分 × 48 = 24時間
  ID_COL: 50,             // AX 勤務ID
  ASSIGNEE_COL: 51,       // AY 担当者
  STAFF_ID_COL: 52        // AZ スタッフID
});

/** 配置マスタ（_設定 65行目ヘッダ / 66行目〜） */
const PLACE_MASTER = Object.freeze({ FIRST: 66, LAST: 128, ID: 1, NAME: 2, ORDER: 5, STATE: 6 });


// ───────────────────────────────── メニュー

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('巫女シフト')
    .addItem('初回設定・接続確認', 'setupAndCheck')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('シフトを作る')
      .addItem('期間の枠を作成', 'generateSlots')
      .addItem('募集状況を作り直す', 'rebuildRecruitmentSheet')
      .addItem('シフト入力の数式を修復', 'repairShiftFormulas'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('当日の配置')
      .addItem('この日の配置表を開く', 'openDailyGrid')
      .addItem('配置を保存', 'saveDailyGrid'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('当日の勤怠')
      .addItem('予定どおりを反映', 'applyPlannedAsActual')
      .addItem('欠勤にする', 'markAbsent')
      .addItem('枠を再募集する', 'reopenSlot')
      .addItem('担当者を交代', 'replaceAssignee'))
    .addSeparator()
    .addItem('確定勤務を給与へ送信', 'sendConfirmedShifts')
    .addItem('当日実績を給与へ送信', 'sendActualResults')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('貸与品')
      .addItem('選択者の襦袢を貸出済みにする', 'markSelectedJubanLoaned')
      .addItem('選択者の襦袢を返却済みにする', 'markSelectedJubanReturned')
      .addItem('給与手渡し後の直接回収を記録', 'markSelectedCleaningCollected'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('PDF')
      .addItem('選択中の本人シフトをPDF', 'exportIndividualSchedulePdf')
      .addItem('選択日の配置表をPDF', 'exportDailySchedulePdf'))
    .addToUi();
}

// ───────────────────────────────── エラーの見せ方

/**
 * メニュー関数を包み、Apps Script の英語例外ではなく日本語の案内を出す。
 * 戻り値が必要な内部呼び出しでは使わない。
 */
function runSafely_(title, fn) {
  try {
    fn();
  } catch (err) {
    const message = (err && err.message) ? err.message : String(err);
    SpreadsheetApp.getUi().alert(title + '\n\n' + message);
    console.error(title + ': ' + message + '\n' + (err && err.stack ? err.stack : ''));
  }
}

/** ドキュメントロック。取得できないときは日本語で理由を返す。 */
function withDocumentLock_(fn) {
  const lock = LockService.getDocumentLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    throw new Error('他の方が処理中です。30秒ほど待ってからもう一度実行してください。');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ───────────────────────────────── シート・範囲

function requireSheet_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('必要なシートがありません: ' + name);
  return sheet;
}

function requireActiveSheet_(ss, name) {
  const sheet = ss.getActiveSheet();
  if (sheet.getName() !== name) throw new Error(name + ' を開き、処理する行を選択してください。');
  return sheet;
}

/** 選択範囲のうち、データ行に収まる行番号の配列 */
function selectedDataRows_(sheet, first, last) {
  const range = sheet.getActiveRange();
  if (!range) throw new Error('処理する行を選択してください。');
  const start = Math.max(first, range.getRow());
  const end = Math.min(last, range.getLastRow());
  if (start > end) throw new Error('見出しではなくデータ行を選択してください。');
  const rows = [];
  for (let row = start; row <= end; row++) rows.push(row);
  return rows;
}

function nextBlankRow_(sheet, first, last, column) {
  const values = sheet.getRange(first, column, last - first + 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) if (!values[i][0]) return first + i;
  throw new Error(sheet.getName() + ' に空き行がありません。行を追加してください。');
}

function countBlankRows_(sheet, first, last, column) {
  return sheet.getRange(first, column, last - first + 1, 1).getDisplayValues()
    .filter(function (r) { return !r[0]; }).length;
}

/** ID → 行番号。重複があれば例外。 */
function idRowIndexStrict_(sheet, first, last, column) {
  const values = sheet.getRange(first, column, last - first + 1, 1).getDisplayValues();
  const out = {};
  values.forEach(function (r, i) {
    const id = String(r[0] || '').trim();
    if (!id) return;
    if (out[id]) {
      throw new Error(sheet.getName() + ' でIDが重複しています: ' + id +
        '（行' + out[id] + '・行' + (first + i) + '）');
    }
    out[id] = first + i;
  });
  return out;
}

function assertUniqueWorkIds_(rows, firstRow) {
  const found = {};
  rows.forEach(function (r, i) {
    const id = String(r[0] || '').trim();
    if (!id) return;
    const row = firstRow + i;
    if (found[id]) {
      throw new Error('勤務IDが重複しています: ' + id + '（行' + found[id] + '・行' + row + '）');
    }
    found[id] = row;
  });
}

// ───────────────────────────────── 設定

/** _設定 の固定セル */
function settings_(ss) {
  const s = requireSheet_(ss, SH.SETTING);
  return {
    sheet: s,
    periodFrom: s.getRange('B2').getValue(),
    periodTo: s.getRange('D2').getValue(),
    defaultDate: s.getRange('B3').getValue(),
    adminFileId: String(s.getRange('J3').getDisplayValue()).trim()
  };
}

function requireAdminFileId_(ss) {
  const id = settings_(ss).adminFileId;
  if (!id) throw new Error('_設定!J3 に管理者ファイルIDがありません。');
  return id;
}

/** 配置マスタ（状態="使用"）を表示順で返す */
function placeMaster_(ss) {
  const s = requireSheet_(ss, SH.SETTING);
  const n = PLACE_MASTER.LAST - PLACE_MASTER.FIRST + 1;
  return s.getRange(PLACE_MASTER.FIRST, 1, n, 6).getValues()
    .filter(function (r) { return r[0] && String(r[5]).trim() === '使用'; })
    .map(function (r) { return { id: String(r[0]).trim(), name: String(r[1]).trim(), order: Number(r[4] || 999) }; })
    .sort(function (a, b) { return a.order - b.order; });
}

/** 07_必要人数（状態="使用"）を読む */
function needRules_(ss) {
  const s = requireSheet_(ss, SH.NEED);
  const n = NEED.LAST - NEED.FIRST + 1;
  return s.getRange(NEED.FIRST, 1, n, NEED.WIDTH).getValues()
    .filter(function (r) { return r[NEED.ID - 1] && String(r[NEED.STATE - 1]).trim() === '使用'; })
    .map(function (r) {
      return {
        id: String(r[NEED.ID - 1]).trim(),
        date: r[NEED.DATE - 1] instanceof Date ? dateKey_(r[NEED.DATE - 1]) : '',
        place: String(r[NEED.PLACE - 1]).trim(),
        band: String(r[NEED.BAND - 1]).trim(),
        start: r[NEED.START - 1],
        end: r[NEED.END - 1],
        count: Number(r[NEED.COUNT - 1] || 0)
      };
    });
}

/** 07_必要人数 に出てくる時間帯を、開始時刻の早い順で返す */
function bands_(ss) {
  const seen = {};
  const list = [];
  needRules_(ss).forEach(function (r) {
    if (!r.band || seen[r.band]) return;
    seen[r.band] = true;
    list.push({ name: r.band, start: r.start, end: r.end });
  });
  list.sort(function (a, b) { return timeValue_(a.start) - timeValue_(b.start); });
  return list;
}

// ───────────────────────────────── 日付・時刻

function formatDate_(date, pattern) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), pattern);
}

/** 日付のみのキー（yyyyMMdd） */
function dateKey_(date) {
  return formatDate_(date, 'yyyyMMdd');
}

/** 時刻セル（1899/12/30 起点の Date、または数値）を「1日=1」の小数へ */
function timeValue_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (v instanceof Date) return (v.getHours() * 60 + v.getMinutes()) / 1440;
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

/** 日付(Date) + 時刻(0〜1) → Date */
function atTime_(date, frac) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return new Date(d.getTime() + Math.round(frac * 86400000));
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays_(date, days) {
  const d = startOfDay_(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** from〜to の各日を Date 配列で返す */
function eachDate_(from, to) {
  if (!(from instanceof Date) || !(to instanceof Date)) {
    throw new Error('_設定!B2（対象開始日）と _設定!D2（対象終了日）に日付を入れてください。');
  }
  const out = [];
  let cur = startOfDay_(from);
  const end = startOfDay_(to);
  let guard = 0;
  while (cur <= end && guard++ < 400) {
    out.push(new Date(cur));
    cur = addDays_(cur, 1);
  }
  return out;
}

function activeUser_() {
  const email = Session.getActiveUser().getEmail();
  return email || Session.getEffectiveUser().getEmail() || '';
}

/** 履歴に残す操作者。取得できない場合は入力を求める。 */
function requireActor_() {
  const user = activeUser_();
  if (user) return user;
  return askRequired_('担当者の確認', 'アカウントを判別できませんでした。担当者名を入力してください。');
}

function askRequired_(title, prompt) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(title, prompt, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) throw new Error('処理を中止しました。');
  const text = response.getResponseText().trim();
  if (!text) throw new Error('入力が必要です。');
  return text;
}

function confirm_(title, message) {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, message, ui.ButtonSet.OK_CANCEL) === ui.Button.OK;
}

function safeName_(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, '_');
}

// ───────────────────────────────── 申込ログ（09_申込）

/**
 * 担当者の増減をすべてここに記録する。
 * ウェブアプリ・配置グリッド・メニューのどこから変更しても同じ形で残す。
 */
function appendApplyLog_(ss, entries) {
  if (!entries || !entries.length) return;
  const sheet = requireSheet_(ss, SH.APPLY);
  const now = new Date();
  const stamp = formatDate_(now, 'yyyyMMdd-HHmmss');
  const rows = entries.map(function (e, i) {
    return [
      'AP-' + stamp + '-' + ('00' + (i + 1)).slice(-3),
      now, e.staffId || '', e.name || '', e.workId || '',
      e.op || '', e.result || '', e.reason || '', e.actor || ''
    ];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, APPLY.WIDTH).setValues(rows);
}

// ───────────────────────────────── PDF

function exportSheetPdf_(ss, sheet, baseName, options) {
  options = options || {};
  const params = {
    format: 'pdf', gid: sheet.getSheetId(), size: options.size || 'A4',
    portrait: options.portrait || 'false',
    fitw: 'true', sheetnames: 'false', printtitle: 'false', pagenumbers: 'true',
    gridlines: 'false', fzr: 'true', top_margin: '0.30', bottom_margin: '0.30',
    left_margin: '0.30', right_margin: '0.30'
  };
  if (options.range) params.range = options.range;
  const query = Object.keys(params).map(function (k) {
    return k + '=' + encodeURIComponent(params[k]);
  }).join('&');
  const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?' + query;
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('PDFを作成できませんでした（応答 ' + response.getResponseCode() + '）。' +
      '時間をおいてもう一度お試しください。');
  }
  return response.getBlob().setName(baseName + '.pdf');
}

function saveBesideSpreadsheet_(ss, blob) {
  const source = DriveApp.getFileById(ss.getId());
  const parents = source.getParents();
  return parents.hasNext() ? parents.next().createFile(blob) : DriveApp.createFile(blob);
}

function showCreatedFile_(file) {
  SpreadsheetApp.getUi().alert('PDFを作成しました。\n' + file.getName() + '\n' + file.getUrl());
}

function exportIndividualSchedulePdf() {
  runSafely_('本人シフトPDF', function () {
    const ss = SpreadsheetApp.getActive();
    const sheet = requireSheet_(ss, SH.PERSON);
    const name = String(sheet.getRange('B3').getDisplayValue()).trim();
    if (!name) throw new Error('05_本人別・配布!B3 で氏名を選んでください。');
    const blob = exportSheetPdf_(ss, sheet, '本人シフト_' + safeName_(name), { size: 'A4', portrait: 'false' });
    showCreatedFile_(saveBesideSpreadsheet_(ss, blob));
  });
}

function exportDailySchedulePdf() {
  runSafely_('配置表PDF', function () {
    const ss = SpreadsheetApp.getActive();
    const sheet = requireSheet_(ss, SH.DAILY);
    const date = sheet.getRange(GRID.DATE_CELL).getValue();
    const suffix = date instanceof Date ? formatDate_(date, 'yyyyMMdd') : '日別';
    const blob = exportSheetPdf_(ss, sheet, '日別配置_' + suffix, { size: 'A3', portrait: 'false' });
    showCreatedFile_(saveBesideSpreadsheet_(ss, blob));
  });
}

// ───────────────────────────────── 保護

function ensureWarningProtection_(sheet, a1, description) {
  sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (protection) {
    if (protection.getDescription() === description) protection.remove();
  });
  sheet.getRange(a1).protect().setDescription(description).setWarningOnly(true);
}
