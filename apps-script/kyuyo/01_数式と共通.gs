/**
 * 管理者用 — 計算式の復元と共通ユーティリティ
 *
 * 旧版には「数式修復」メニューが無く、承認・締めの解除で戻る列以外
 * （E / T〜AB の未処理行 / AD / AE / AG / AH）は壊れたら手作業だった。
 */

// ───────────────────────────────── 計算式の復元

function repairAttendanceFormulas() {
  runSafely_('計算式を修復', function () {
    const ss = SpreadsheetApp.getActive();
    const sheet = requireSheet_(ss, PAY.ATTENDANCE);
    const rowCount = ATT.LAST - ATT.FIRST + 1;
    const data = sheet.getRange(ATT.FIRST, 1, rowCount, ATT.WIDTH).getValues();

    let repaired = 0;
    let skippedClosed = 0;
    let skippedApproved = 0;

    for (let i = 0; i < rowCount; i++) {
      const row = ATT.FIRST + i;
      const v = data[i];
      if (!v[ATT.ID - 1]) continue;

      // 締め済み・承認済みは金額を固定してあるので触らない
      if (String(v[ATT.CLOSE_STATE - 1]).trim() === '締め済') { skippedClosed++; continue; }
      if (String(v[ATT.APPROVE_STATE - 1]).trim() === '承認済') {
        // 承認済みでも T〜AB（計算列）は式に戻してよい。R・S は固定値のまま。
        restoreAttendanceCalculationFormulas_(sheet, row);
        skippedApproved++;
        repaired++;
        continue;
      }
      sheet.getRange(row, ATT.RATE).setFormula(rateFormula_(row));
      sheet.getRange(row, ATT.TRANSPORT).setFormula(transportFormula_(row));
      restoreAttendanceCalculationFormulas_(sheet, row);
      repaired++;
    }

    SpreadsheetApp.flush();
    SpreadsheetApp.getUi().alert('計算式を修復',
      repaired + '行の計算式を復元しました。\n' +
      '締め済みのため触らなかった行: ' + skippedClosed + '\n' +
      '承認済みのため時給・交通費を固定のままにした行: ' + skippedApproved,
      SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

function restorePayrollFormulas_(sheet, row) {
  const r = String(row);
  const last = String(ATT.LAST);
  sheet.getRange(row, PER.LAST_DATE).setFormula(
    `=IF(COUNTIFS('01_勤怠承認'!$C$5:$C$${last},$A${r},'01_勤怠承認'!$O$5:$O$${last},"承認済")=0,"",` +
    `MAXIFS('01_勤怠承認'!$B$5:$B$${last},'01_勤怠承認'!$C$5:$C$${last},$A${r},'01_勤怠承認'!$O$5:$O$${last},"承認済"))`);
  sheet.getRange(row, PER.APPROVED_COUNT).setFormula(
    `=IF($A${r}="","",COUNTIFS('01_勤怠承認'!$C$5:$C$${last},$A${r},'01_勤怠承認'!$O$5:$O$${last},"承認済"))`);
  sheet.getRange(row, PER.HOURS).setFormula(
    `=IF($A${r}="","",SUMIFS('01_勤怠承認'!$T$5:$T$${last},'01_勤怠承認'!$C$5:$C$${last},$A${r},'01_勤怠承認'!$O$5:$O$${last},"承認済"))`);
  sheet.getRange(row, PER.GROSS).setFormula(
    `=IF($A${r}="","",SUMIFS('01_勤怠承認'!$AB$5:$AB$${last},'01_勤怠承認'!$C$5:$C$${last},$A${r},'01_勤怠承認'!$O$5:$O$${last},"承認済"))`);
  sheet.getRange(row, PER.NET).setFormula(
    `=IF($F${r}="","",$F${r}-N($G${r})-N($H${r}))`);
  sheet.getRange(row, PER.SETTLEMENT_DATE).setFormula(
    `=IF($A${r}="","",IF(COUNTIFS('01_勤怠承認'!$C$5:$C$${last},$A${r},'01_勤怠承認'!$A$5:$A$${last},"<>",'01_勤怠承認'!$O$5:$O$${last},"未確認")>0,"",` +
    `IFERROR(MAX(FILTER('01_勤怠承認'!$B$5:$B$${last},'01_勤怠承認'!$C$5:$C$${last}=$A${r},` +
    `REGEXMATCH('01_勤怠承認'!$O$5:$O$${last},"^(承認済|欠勤確定|事前取消|取消|除外)$"))),"")))`);
}

function restoreAttendanceCalculationFormulas_(sheet, row) {
  const r = String(row);
  sheet.getRange(row, ATT.HOURS).setFormula(
    `=IF(OR($B${r}="",$I${r}="",$J${r}=""),"",MAX(0,(ROUND((($J${r}+IF($J${r}<=$I${r},1,0))-$I${r})*1440,0)-N($K${r}))/60))`);
  sheet.getRange(row, ATT.OVERTIME).setFormula(
    `=IF($T${r}="","",MAX(0,$T${r}-8))`);
  sheet.getRange(row, ATT.NIGHT).setFormula(
    `=IF(OR($B${r}="",$I${r}="",$J${r}=""),"",MAX(0,(ROUND((MAX(0,MIN($B${r}+$J${r}+IF($J${r}<=$I${r},1,0),$B${r}+1+'_設定'!$B$7)-MAX($B${r}+$I${r},$B${r}+'_設定'!$B$6))+MAX(0,MIN($B${r}+$J${r}+IF($J${r}<=$I${r},1,0),$B${r}+'_設定'!$B$7)-MAX($B${r}+$I${r},$B${r})))*1440,0)-N($L${r}))/60))`);
  sheet.getRange(row, ATT.BASE_PAY).setFormula(
    `=IF(OR($R${r}="",$T${r}=""),"",ROUND($R${r}*$T${r},0))`);
  sheet.getRange(row, ATT.OT_PAY).setFormula(
    `=IF(OR($R${r}="",$U${r}=""),"",ROUND($R${r}*$U${r}*('_設定'!$B$4-1),0))`);
  sheet.getRange(row, ATT.NIGHT_PAY).setFormula(
    `=IF(OR($R${r}="",$V${r}=""),"",ROUND($R${r}*$V${r}*('_設定'!$B$5-1),0))`);
  sheet.getRange(row, ATT.TRANSPORT_PAY).setFormula(
    `=IF(OR($C${r}="",$I${r}="",$J${r}=""),"",N($S${r}))`);
  sheet.getRange(row, ATT.OTHER).setFormula(
    `=IF(OR($C${r}="",$I${r}="",$J${r}=""),"",N($N${r}))`);
  sheet.getRange(row, ATT.GROSS).setFormula(
    `=IF(OR($C${r}="",$I${r}="",$J${r}=""),"",SUM($W${r}:$AA${r}))`);
}

/**
 * 勤務日に有効な賃金のうち、適用開始日がいちばん新しいものを取る。
 * SORT の第3引数 FALSE ＝ 降順なので、先頭が最新の適用行になる。
 */
function rateFormula_(row) {
  const r = String(row);
  const W = "'07_スタッフ・賃金'";
  return `=IF($C${r}="","",IFERROR(INDEX(SORT(FILTER({` +
    `${W}!$I$5:$I$204,` +
    `IF($M${r}="研修",${W}!$E$5:$E$204,IF($M${r}="特別",${W}!$G$5:$G$204,${W}!$F$5:$F$204))},` +
    `${W}!$A$5:$A$204=$C${r},` +
    `${W}!$K$5:$K$204="有効",` +
    `${W}!$I$5:$I$204<=$B${r},` +
    `((${W}!$J$5:$J$204="")+(${W}!$J$5:$J$204>=$B${r}))>0),1,FALSE),1,2),""))`;
}

function transportFormula_(row) {
  const r = String(row);
  const W = "'07_スタッフ・賃金'";
  return `=IF($C${r}="","",IFERROR(INDEX(SORT(FILTER({` +
    `${W}!$I$5:$I$204,${W}!$H$5:$H$204},` +
    `${W}!$A$5:$A$204=$C${r},` +
    `${W}!$K$5:$K$204="有効",` +
    `${W}!$I$5:$I$204<=$B${r},` +
    `((${W}!$J$5:$J$204="")+(${W}!$J$5:$J$204>=$B${r}))>0),1,FALSE),1,2),0))`;
}

// ───────────────────────────────── 履歴

/**
 * _履歴 への追記。
 * 旧版は固定範囲の空き行を探し、満杯になると全操作が例外で止まっていた。
 * 末尾追記に変え、足りなければ行を足す。
 */
function appendHistoryRows_(ss, entries, user) {
  if (!entries || !entries.length) return;
  const sheet = requireSheet_(ss, PAY.HISTORY);
  const now = new Date();
  const stamp = formatDate_(now, 'yyyyMMdd-HHmmss');
  const startRow = Math.max(sheet.getLastRow() + 1, 3);

  if (startRow + entries.length - 1 > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(),
      startRow + entries.length - sheet.getMaxRows() + 100);
  }

  const rows = entries.map(function (e, i) {
    return [
      'LOG-' + stamp + '-' + ('00' + (i + 1)).slice(-3),
      now, e[0], e[1] || '', e[2] || '', e[3] || '',
      e[4] || '', e[5] || '', e[6] || '', user || activeUser_()
    ];
  });
  sheet.getRange(startRow, 1, rows.length, 10).setValues(rows);
}

// ───────────────────────────────── 保護

function ensureWarningProtections_(ss) {
  const att = requireSheet_(ss, PAY.ATTENDANCE);
  ensureWarningProtection_(att, 'A5:H' + ATT.LAST, '自動列・予定列（スクリプト管理）');
  ensureWarningProtection_(att, 'O5:AL' + ATT.LAST, '承認・計算・締め列（スクリプト管理）');
  const per = requireSheet_(ss, PAY.PERSONAL);
  ensureWarningProtection_(per, 'A5:F' + PER.LAST, '個人別給与の自動集計列');
  ensureWarningProtection_(per, 'I5:N' + PER.LAST, '個人別給与の計算・状態列');
  ensureWarningProtection_(requireSheet_(ss, PAY.SLIP), 'A:H', '本人交付用明細（自動表示）');
  ensureWarningProtection_(requireSheet_(ss, PAY.IMPORT), 'A:O', '現場連携取込（自動更新）');
  ensureWarningProtection_(requireSheet_(ss, PAY.HISTORY), 'A:J', '操作履歴（自動追記）');
}

function ensureWarningProtection_(sheet, a1, description) {
  sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (protection) {
    if (protection.getDescription() === description) protection.remove();
  });
  sheet.getRange(a1).protect().setDescription(description).setWarningOnly(true);
}

// ───────────────────────────────── 共通ユーティリティ

function runSafely_(title, fn) {
  try {
    fn();
  } catch (err) {
    const message = (err && err.message) ? err.message : String(err);
    SpreadsheetApp.getUi().alert(title + '\n\n' + message);
    console.error(title + ': ' + message + '\n' + (err && err.stack ? err.stack : ''));
  }
}

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
  throw new Error(sheet.getName() + ' に空き行がありません。');
}

function countBlankRows_(sheet, first, last, column) {
  return sheet.getRange(first, column, last - first + 1, 1).getDisplayValues()
    .filter(function (r) { return !r[0]; }).length;
}

function askRequired_(title, prompt) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(title, prompt, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) throw new Error('処理を中止しました。');
  const text = response.getResponseText().trim();
  if (!text) throw new Error('入力が必要です。');
  return text;
}

function activeUser_() {
  return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || '';
}

/** 履歴に残す操作者。取得できないときは入力を求める（「利用者」のまま残さない）。 */
function requireActor_() {
  const user = activeUser_();
  if (user) return user;
  return askRequired_('担当者の確認', 'アカウントを判別できませんでした。担当者名を入力してください。');
}

function formatDate_(date, pattern) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), pattern);
}

function safeName_(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, '_');
}

/** 処理件数と、飛ばした行の理由を必ず見せる */
function reportSkipped_(title, doneCount, skipped, extra) {
  const ui = SpreadsheetApp.getUi();
  let message = doneCount + '件を処理しました。';
  if (extra) message += '\n' + extra;
  if (skipped && skipped.length) {
    message += '\n\n次は対象外のため飛ばしました:\n' + skipped.slice(0, 15).join('\n');
    if (skipped.length > 15) message += '\n…ほか' + (skipped.length - 15) + '件';
  }
  if (doneCount === 0 && (!skipped || !skipped.length)) {
    message = '対象の行がありませんでした。データ行を選択してから実行してください。';
  }
  ui.alert(title, message, ui.ButtonSet.OK);
}

// ───────────────────────────────── PDF

function exportSheetPdf_(ss, sheet, baseName, options) {
  options = options || {};
  const params = {
    format: 'pdf', gid: sheet.getSheetId(), size: options.size || 'A4',
    portrait: options.portrait || 'true',
    fitw: 'true', sheetnames: 'false', printtitle: 'false', pagenumbers: 'true',
    gridlines: 'false', fzr: 'true', top_margin: '0.35', bottom_margin: '0.35',
    left_margin: '0.35', right_margin: '0.35'
  };
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

/**
 * 給与明細の出力先。
 * _設定 に「明細フォルダID」があればそこへ、無ければスプレッドシートと同じ場所へ。
 * 同じ場所は共有設定を継承するので、本番では専用の非共有フォルダを設定すること。
 */
function saveBesideSpreadsheet_(ss, blob) {
  const setting = ss.getSheetByName(PAY.SETTING);
  if (setting) {
    const values = setting.getRange(3, 1, 40, 2).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() === '明細フォルダID') {
        const id = String(values[i][1]).trim();
        if (id) return DriveApp.getFolderById(id).createFile(blob);
      }
    }
  }
  const source = DriveApp.getFileById(ss.getId());
  const parents = source.getParents();
  return parents.hasNext() ? parents.next().createFile(blob) : DriveApp.createFile(blob);
}

function showCreatedFile_(file) {
  SpreadsheetApp.getUi().alert('PDFを作成しました。\n' + file.getName() + '\n' + file.getUrl() +
    '\n\n※ 出力先フォルダの共有範囲を確認してください。');
}
