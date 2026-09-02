/**
 * 一度だけ実行する移行処理
 *
 * スクリプトからシート側の変更（行数拡張・列追加・新シート作成・数式の差し替え）を行う。
 * 実行前に必ずファイルのコピーを取ること。
 *
 * 実行順:
 *   1. migrate_00_全部まとめて()   … 下の 1〜6 を順に実行する
 *   もしくは個別に
 *   1. migrate_01_行数を拡張()
 *   2. migrate_02_参照範囲を広げる()
 *   3. migrate_03_列を追加()
 *   4. migrate_04_新しいシートを作る()
 *   5. migrate_05_配置変更の日跨ぎを直す()
 *   6. migrate_06_配置表を広げる()
 *   最後に setupAndCheck() → generateSlots() → rebuildRecruitmentSheet()
 */

function migrate_00_全部まとめて() {
  runSafely_('移行', function () {
    if (!confirm_('移行を実行します',
      'シートの行数・列・数式を書き換えます。\n' +
      '実行前にファイルのコピーを取りましたか？\n\n' +
      '（ファイル > コピーを作成）')) {
      throw new Error('移行を中止しました。コピーを取ってから実行してください。');
    }
    const log = [];
    log.push(migrateExpandRows_());
    log.push(migrateWidenRanges_());
    log.push(migrateAddColumns_());
    log.push(migrateNewSheets_());
    log.push(migrateFixPlaceChangeDayWrap_());
    log.push(migrateExpandGrid_());
    SpreadsheetApp.flush();
    SpreadsheetApp.getUi().alert('移行が完了しました',
      log.join('\n') + '\n\n続けて次を実行してください。\n' +
      '1. 初回設定・接続確認\n2. 期間の枠を作成\n3. 募集状況を作り直す',
      SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

function migrate_01_行数を拡張() { runSafely_('行数の拡張', function () { alertLine_(migrateExpandRows_()); }); }
function migrate_02_参照範囲を広げる() { runSafely_('参照範囲', function () { alertLine_(migrateWidenRanges_()); }); }
function migrate_03_列を追加() { runSafely_('列の追加', function () { alertLine_(migrateAddColumns_()); }); }
function migrate_04_新しいシートを作る() { runSafely_('新しいシート', function () { alertLine_(migrateNewSheets_()); }); }
function migrate_05_配置変更の日跨ぎを直す() { runSafely_('配置変更', function () { alertLine_(migrateFixPlaceChangeDayWrap_()); }); }
function migrate_06_配置表を広げる() { runSafely_('配置表', function () { alertLine_(migrateExpandGrid_()); }); }

function alertLine_(line) { SpreadsheetApp.getUi().alert(line); }

// ───────────────────────────────── 1. 行数の拡張

/**
 * 42名/日 なので 500 行では 12 日分で満杯になる。
 * 02_シフト入力・02A_当日勤怠 を 3,000 行、03_配置変更 を 1,000 行へ。
 */
function migrateExpandRows_() {
  const ss = SpreadsheetApp.getActive();
  const done = [];
  done.push(expandSheetRows_(ss, SH.SHIFT, SHIFT.FIRST, SHIFT.LAST));
  done.push(expandSheetRows_(ss, SH.ACTUAL, ACT.FIRST, ACT.LAST));
  done.push(expandSheetRows_(ss, SH.PLACE_CHANGE, PLC.FIRST, PLC.LAST));
  return '1. 行数の拡張: ' + done.join(' / ');
}

function expandSheetRows_(ss, name, firstRow, targetLast) {
  const sheet = requireSheet_(ss, name);
  const current = sheet.getMaxRows();
  if (current >= targetLast) return name + ' は拡張不要（' + current + '行）';

  // 複製元は「旧・最終行」。入力は空で自動数式だけが入っている行なので、
  // そのまま下へコピーすれば新しい行にも数式と書式が入る。
  const templateRow = current;
  const width = sheet.getMaxColumns();
  sheet.insertRowsAfter(current, targetLast - current);
  sheet.getRange(templateRow, 1, 1, width).copyTo(
    sheet.getRange(current + 1, 1, targetLast - current, width),
    SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);

  return name + ' を ' + targetLast + ' 行へ';
}

// ───────────────────────────────── 2. 参照範囲を広げる

/**
 * 行を増やしても、数式が $504 のままでは新しい行を見てくれない。
 *
 * 注意: 単純に「504 を 3004 に置換」してはいけない。
 * 04_日別30分配置 は '07_必要人数'!$B$5:$B$304 のように、行を増やしていないシートも
 * 304 で参照している。参照先のシート名まで見て、拡張したシートの範囲だけを書き換える。
 */
const RANGE_RULES = Object.freeze([
  { sheet: SH.SHIFT, from: 504, to: SHIFT.LAST },
  { sheet: SH.ACTUAL, from: 504, to: ACT.LAST },
  { sheet: SH.PLACE_CHANGE, from: 304, to: PLC.LAST }
]);

/** 'シート名'!A5:A504 / $A$5:$A$504 の末尾行番号だけを差し替える */
const RANGE_PATTERN = /(?:('[^']+'|[A-Za-z0-9_一-龥ぁ-んァ-ヶ]+)!)?(\$?[A-Z]{1,2}\$?\d+:\$?[A-Z]{1,2}\$?)(\d+)\b/g;

function rewriteRanges_(formula, currentSheetName) {
  return formula.replace(RANGE_PATTERN, function (whole, prefix, head, tail) {
    const target = prefix ? prefix.replace(/^'|'$/g, '') : currentSheetName;
    const rule = RANGE_RULES.filter(function (x) { return x.sheet === target; })[0];
    if (!rule || Number(tail) !== rule.from) return whole;
    return (prefix ? prefix + '!' : '') + head + rule.to;
  });
}

function migrateWidenRanges_() {
  const ss = SpreadsheetApp.getActive();
  let changed = 0;

  ss.getSheets().forEach(function (sheet) {
    const name = sheet.getName();
    if (name === SH.RECRUIT) return;   // 作り直すので対象外
    const range = sheet.getDataRange();
    const formulas = range.getFormulas();
    const updates = [];

    for (let r = 0; r < formulas.length; r++) {
      for (let c = 0; c < formulas[r].length; c++) {
        const f = formulas[r][c];
        if (!f) continue;
        const next = rewriteRanges_(f, name);
        if (next !== f) {
          updates.push({ row: range.getRow() + r, col: range.getColumn() + c, formula: next });
          changed++;
        }
      }
    }
    // 変わったセルだけ書き戻す（値のセルには触らない）
    updates.forEach(function (u) { sheet.getRange(u.row, u.col).setFormula(u.formula); });
  });

  return '2. 参照範囲: ' + changed + 'セルの数式を新しい行数に合わせました';
}

// ───────────────────────────────── 3. 列の追加

function migrateAddColumns_() {
  const ss = SpreadsheetApp.getActive();
  const added = [];

  // 02_シフト入力 V列（時間帯）
  const shift = requireSheet_(ss, SH.SHIFT);
  if (shift.getMaxColumns() < SHIFT.BAND) {
    shift.insertColumnsAfter(shift.getMaxColumns(), SHIFT.BAND - shift.getMaxColumns());
  }
  if (!String(shift.getRange(4, SHIFT.BAND).getDisplayValue()).trim()) {
    shift.getRange(4, SHIFT.BAND).setValue('時間帯').setFontWeight('bold');
    added.push('02_シフト入力 V列（時間帯）');
  }

  // 01_スタッフ I列（メールアドレス）
  const staff = requireSheet_(ss, SH.STAFF);
  if (staff.getMaxColumns() < STAFF.EMAIL) {
    staff.insertColumnsAfter(staff.getMaxColumns(), STAFF.EMAIL - staff.getMaxColumns());
  }
  if (!String(staff.getRange(2, STAFF.EMAIL).getDisplayValue()).trim()) {
    staff.getRange(2, STAFF.EMAIL).setValue('メールアドレス').setFontWeight('bold');
    staff.getRange(2, STAFF.EMAIL).setNote(
      '巫女が自分で枠に入るウェブアプリで本人を判別するために使います。');
    added.push('01_スタッフ I列（メールアドレス）');
  }

  // シフト名の呼び名を 07_必要人数 に合わせる（遅番 → 時間帯列を参照）
  repairShiftFormulasOnSheet_(shift, SHIFT.FIRST, SHIFT.LAST);
  added.push('自動数式を更新');

  // 勤務IDを行番号依存の数式から静的値へ。
  // 数式のままだと行の挿入・削除で既存IDと衝突する。
  const idRowCount = SHIFT.LAST - SHIFT.FIRST + 1;
  const idRange = shift.getRange(SHIFT.FIRST, SHIFT.ID, idRowCount, 1);
  const idFormulas = idRange.getFormulas();
  const idValues = idRange.getDisplayValues();
  const out = [];
  let frozen = 0;
  for (let i = 0; i < idRowCount; i++) {
    if (idFormulas[i][0]) {
      // 数式で出ていたIDは、値が出ているものだけ静的値として残す
      out.push([idValues[i][0] || '']);
      frozen++;
    } else {
      out.push([idValues[i][0] || '']);
    }
  }
  idRange.setValues(out);
  added.push('勤務ID ' + frozen + '件を静的値へ');

  return '3. 列の追加: ' + (added.length ? added.join(' / ') : '追加不要');
}

// ───────────────────────────────── 4. 新しいシート

function migrateNewSheets_() {
  const ss = SpreadsheetApp.getActive();
  const made = [];

  if (!ss.getSheetByName(SH.APPLY)) {
    const sheet = ss.insertSheet(SH.APPLY, ss.getNumSheets());
    sheet.getRange(1, 1).setValue('申込・割当の記録（自動追記）')
      .setFontWeight('bold').setFontSize(13);
    sheet.getRange(2, 1, 1, APPLY.WIDTH).setValues([[
      '申込ID', '送信日時', 'スタッフID', '氏名', '勤務ID', '操作', '結果', '理由', '処理者'
    ]]).setFontWeight('bold').setBackground('#F0EEEB');
    sheet.setFrozenRows(2);
    sheet.autoResizeColumns(1, APPLY.WIDTH);
    made.push(SH.APPLY);
  }

  if (!ss.getSheetByName(SH.RECRUIT)) {
    ss.insertSheet(SH.RECRUIT, sheetIndexAfter_(ss, SH.ACTUAL));
    made.push(SH.RECRUIT + '（枠だけ。「募集状況を作り直す」で中身を作ります）');
  }

  return '4. 新しいシート: ' + (made.length ? made.join(' / ') : '作成不要');
}

// ───────────────────────────────── 5. 配置変更の日跨ぎ

/**
 * 03_配置変更 の I列（開始日時）は「勤務日 + 開始時刻」で計算していたため、
 * 深夜枠（23:00〜翌8:00）で 2:00 の配置変更を入れると前日の 2:00 になってしまう。
 * 開始時刻が勤務の出勤時刻より早い場合は翌日として扱うよう直す。
 */
function migrateFixPlaceChangeDayWrap_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = requireSheet_(ss, SH.PLACE_CHANGE);
  const rowCount = PLC.LAST - PLC.FIRST + 1;
  const last = String(SHIFT.LAST);
  const formulas = [];

  for (let i = 0; i < rowCount; i++) {
    const r = String(PLC.FIRST + i);
    formulas.push([
      `=IF(OR($B${r}="",$D${r}=""),"",` +
      `IFERROR(INDEX('02_シフト入力'!$B$5:$B$${last},MATCH($B${r},'02_シフト入力'!$A$5:$A$${last},0)),"")` +
      `+$D${r}` +
      `+IF($D${r}<IFERROR(INDEX('02_シフト入力'!$F$5:$F$${last},MATCH($B${r},'02_シフト入力'!$A$5:$A$${last},0)),0),1,0))`
    ]);
  }
  sheet.getRange(PLC.FIRST, PLC.START_AT, rowCount, 1).setFormulas(formulas);

  const endFormulas = [];
  for (let i = 0; i < rowCount; i++) {
    const r = String(PLC.FIRST + i);
    endFormulas.push([`=IF(OR($I${r}="",$E${r}=""),"",INT($I${r})+$E${r}+IF($E${r}<=$D${r},1,0))`]);
  }
  sheet.getRange(PLC.FIRST, PLC.END_AT, rowCount, 1).setFormulas(endFormulas);

  return '5. 配置変更: 日跨ぎ（深夜枠）の開始日時を修正';
}

// ───────────────────────────────── 6. 配置表の拡張

/**
 * 04_日別30分配置 のグリッドを 52 行 → 80 行へ。
 * あわせて AX（勤務ID）のスピル数式を消す。入力画面にするには行が固定されている必要がある。
 */
function migrateExpandGrid_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = requireSheet_(ss, SH.DAILY);
  const capacity = GRID.LAST - GRID.FIRST + 1;

  // 不足マトリクスは 61 行目以降にあるので、グリッドを広げるぶんだけ行を挿入する
  const oldLast = 57;
  if (GRID.LAST > oldLast) {
    sheet.insertRowsAfter(oldLast, GRID.LAST - oldLast);
    sheet.getRange(oldLast, 1, 1, sheet.getMaxColumns())
      .copyTo(sheet.getRange(oldLast + 1, 1, GRID.LAST - oldLast, sheet.getMaxColumns()),
        SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  }

  // グリッドと補助列を「値」に変える（スピル数式・セル数式をやめる）
  sheet.getRange(GRID.FIRST, 1, capacity, 1).clearContent();
  sheet.getRange(GRID.FIRST, GRID.COL_FIRST, capacity, GRID.COL_COUNT).clearContent();
  sheet.getRange(GRID.FIRST, GRID.ID_COL, capacity, 3).clearContent();

  sheet.getRange(GRID.LOADED_CELL).setValue('未読込');
  sheet.getRange(GRID.HEAD_ROW, 1).setValue('担当者／未割当枠');

  // 不足マトリクスは B$6:B$57 を数えているので、新しい行範囲に合わせる
  const gapFirst = GRID.LAST + 4;   // 「配置別人数」見出しの下
  const note = sheet.getRange(gapFirst - 1, 1);
  if (String(note.getDisplayValue()).trim() === '') {
    note.setValue('配置別人数').setFontWeight('bold');
  }

  return '6. 配置表: グリッドを ' + capacity + ' 行にし、勤務ID列を静的値へ' +
    '（不足マトリクスの参照行は手で ' + GRID.FIRST + '〜' + GRID.LAST + ' に直してください）';
}

// ───────────────────────────────── 点検

/** 旧上限を参照したままの数式が残っていないか調べる */
function checkRemainingOldRanges() {
  runSafely_('参照範囲の点検', function () {
    const ss = SpreadsheetApp.getActive();
    const hits = [];
    ss.getSheets().forEach(function (sheet) {
      const formulas = sheet.getDataRange().getFormulas();
      formulas.forEach(function (row, r) {
        row.forEach(function (f, c) {
          if (!f) return;
          if (/\$504\b/.test(f) || /\$304\b/.test(f)) {
            hits.push(sheet.getName() + '!' +
              sheet.getRange(r + 1, c + 1).getA1Notation());
          }
        });
      });
    });
    SpreadsheetApp.getUi().alert('参照範囲の点検',
      hits.length ? '旧上限のままの数式が ' + hits.length + ' セルあります:\n' +
        hits.slice(0, 30).join('\n') : '旧上限を参照している数式はありません。',
      SpreadsheetApp.getUi().ButtonSet.OK);
  });
}
