/**
 * 新春祈願受付管理｜07_移行（段階2）
 *
 * 旧データを 97_移行作業 へ「元ファイル名・元の行と列を付けて」書き出す。
 * ここでは 90/91/92 へは一切書かない。反映は段階3で職員が分類してから行う。
 *
 * 元ファイルは読み取りだけ。変更も削除もしない。
 * Apps Script は .xlsx を直接開けないため、Google スプレッドシートへ変換した
 * コピーのIDを 99_設定 の「移行元_〜」へ入れておく。元の .xlsx はそのまま残る。
 *
 * 管理者が Apps Script エディタから実行する。日常メニューには出さない。
 */

/* ── 段階2の初期設定 ──────────────────────────────────── */

function setupShinsunStage2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    buildConfigSheet_(ss);   // 移行元の設定行を足す（既存の値は上書きしない）
    buildMigrationSheet_(ss);
    resetShinsunCache_();
    logShinsun_(ss, '初期設定（段階2）', SHINSUN.SHEETS.MIGRATION, 1, SHINSUN.VERSION);
    toast_(ss, '97_移行作業 を作りました。99_設定 の「移行元_〜」へ変換済みコピーのIDを入れてください。', 12);
    return SHINSUN.SHEETS.MIGRATION;
  });
}

function buildMigrationSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.MIGRATION);
  const headers = SHINSUN.HEADERS.MIGRATION;
  ensureSize_(sh, 2000, headers.length);
  writeHeaders_(sh, headers, 1, '#8a5a2b');

  const map = headerMap_(sh);
  const rows = sh.getMaxRows() - 1;

  // 職員が入力する4列だけ色を変える。ほかは取り込み結果。
  ['区分', '確定名称', '対象ID', '処理'].forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#fff4cc');
  });
  ['移行ID', '取込日時', '移行元', '元シート', '元行', '元列', '種別', '年度',
   '反映状態', '反映日時', '要確認'].forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#f3efe9').setFontColor('#5b534c');
  });

  sh.getRange(2, col_(map, '取込日時', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(2, col_(map, '反映日時', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  ['電話番号（生）', '郵便番号（生）'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setNumberFormat('@');
  });
  ['願意（生）', '奉納品（生）', '備考（生）', '生データ', '要確認'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setWrap(true).setVerticalAlignment('top');
  });

  bindMigrationValidation_(ss, sh, '区分', ['信者様', '会社']);
  bindMigrationValidation_(ss, sh, '処理', ['未分類', '登録する', '既存に統合', '対象外']);
  bindMigrationValidation_(ss, sh, '反映状態', ['未反映', '反映済', '対象外']);

  [150, 130, 170, 100, 60, 60, 110, 70,
   240, 150, 130, 100, 260,
   220, 200, 110, 260, 320,
   90, 220, 130, 110, 90, 130, 260]
    .forEach((width, i) => { if (i < headers.length) sh.setColumnWidth(i + 1, width); });
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);

  sh.getRange(1, col_(map, '生データ', sh.getName())).setNote(
    '元の行にあった値をそのまま残しています。取り込みが取りこぼした情報はここで確認できます。'
  );
  sh.getRange(1, col_(map, '区分', sh.getName())).setNote(
    '信者様か会社かを職員が判断します。前札マスター(R2) は両方が混在しています。'
  );
  sh.getRange(1, col_(map, '処理', sh.getName())).setNote(
    '登録する＝新しく 90/91 へ入れる。既存に統合＝対象IDの行へまとめる。対象外＝移行しない。'
  );
  if (sh.isSheetHidden()) sh.showSheet();
  return sh;
}

function bindMigrationValidation_(ss, sh, headerName, values) {
  const map = headerMap_(sh);
  const column = map[clean_(headerName)];
  if (!column) return;
  sh.getRange(2, column, sh.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true).setAllowInvalid(false).build()
  );
}

/* ── 取り込み本体 ─────────────────────────────────────── */

/**
 * 移行元をすべて読み、97_移行作業 へ書き出す。
 * 既に取り込み済みの移行元は、いったんその行だけ消してから入れ直す。
 * 職員が入力した区分・確定名称・対象ID・処理は、同じ移行IDへ引き継ぐ。
 */
function importLegacyShinsunData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const sh = ss.getSheetByName(SHINSUN.SHEETS.MIGRATION);
    if (!sh) throw new Error('97_移行作業 がありません。先に setupShinsunStage2 を実行してください。');

    const config = getShinsunConfig_(ss);
    const columnMajor = clean_(configValue_(config, '読上げ順の方向')) !== '行方向';
    const keep = readMigrationDecisions_(sh);

    const collected = [];
    const report = [];

    SHINSUN.MIGRATION_SOURCES.forEach(source => {
      const opened = openMigrationSource_(config, source);
      if (opened.error) {
        report.push({ label: source.label, source: 0, imported: 0, skipped: 0, error: opened.error });
        return;
      }
      let result;
      if (source.parser === 'yomiage') result = parseYomiage_(opened.book, source, columnMajor);
      else if (source.parser === 'maebuda') result = parseMaebuda_(opened.book, source);
      else result = parseSimpleList_(opened.book, source);

      result.rows.forEach(row => collected.push(row));
      report.push({
        label: source.label, source: result.sourceRows,
        imported: result.rows.length, skipped: result.skipped, error: ''
      });
    });

    writeMigrationRows_(sh, collected, keep);
    const total = collected.length;
    logShinsun_(ss, '旧データ取込', SHINSUN.SHEETS.MIGRATION, total,
      report.map(r => r.label + ' ' + r.imported + '件').join('／'));

    showImportReport_(report, total, columnMajor, keep.size);
    return total;
  });
}

function openMigrationSource_(config, source) {
  const id = clean_(configValue_(config, source.configKey));
  if (!id) return { error: '99_設定 の「' + source.configKey + '」が空欄です' };
  try {
    return { book: SpreadsheetApp.openById(id) };
  } catch (error) {
    return {
      error: 'ID ' + id + ' を開けません。.xlsx のままなら、ドライブで Google ' +
        'スプレッドシートへ変換したコピーのIDを入れてください（' + error.message + '）'
    };
  }
}

/** 職員が入力した判断を移行IDごとに覚えておく。取り込み直しても消さない。 */
function readMigrationDecisions_(sh) {
  const keep = new Map();
  const map = headerMap_(sh);
  const idColumn = col_(map, '移行ID', sh.getName());
  const last = lastRowByColumn_(sh, idColumn);
  if (last < 2) return keep;

  const width = sh.getLastColumn();
  const values = sh.getRange(2, 1, last - 1, width).getValues();
  const fields = ['区分', '確定名称', '対象ID', '処理', '反映状態', '反映日時'];
  values.forEach(row => {
    const id = clean_(row[idColumn - 1]);
    if (!id) return;
    const saved = {};
    let hasAny = false;
    fields.forEach(name => {
      const column = map[clean_(name)];
      if (!column) return;
      const value = row[column - 1];
      saved[name] = value;
      if (clean_(value)) hasAny = true;
    });
    if (hasAny) keep.set(id, saved);
  });
  return keep;
}

/** 新しい内容を作ってから書き換え、余った旧行だけ消す。 */
function writeMigrationRows_(sh, collected, keep) {
  const headers = SHINSUN.HEADERS.MIGRATION;
  const now = new Date();
  const body = collected.map(item => {
    const saved = keep.get(item.id) || {};
    return headers.map(name => {
      switch (name) {
        case '移行ID': return item.id;
        case '取込日時': return now;
        case '移行元': return item.label;
        case '元シート': return item.sheet;
        case '元行': return item.row;
        case '元列': return item.column;
        case '種別': return item.kind;
        case '年度': return item.year;
        case '名称（生）': return item.name;
        case '代表者名（生）': return item.representative;
        case '電話番号（生）': return item.phone;
        case '郵便番号（生）': return item.postal;
        case '住所（生）': return item.address;
        case '願意（生）': return item.gani;
        case '奉納品（生）': return item.offering;
        case '札送り（生）': return item.delivery;
        case '備考（生）': return item.note;
        case '生データ': return item.raw;
        case '区分': return saved['区分'] || '';
        case '確定名称': return saved['確定名称'] || '';
        case '対象ID': return saved['対象ID'] || '';
        case '処理': return saved['処理'] || '未分類';
        case '反映状態': return saved['反映状態'] || '未反映';
        case '反映日時': return saved['反映日時'] || '';
        case '要確認': return item.issue;
        default: return '';
      }
    }).map(safeSheetValue_);
  });

  const idColumn = col_(headerMap_(sh), '移行ID', sh.getName());
  const previousLast = lastRowByColumn_(sh, idColumn);
  const needed = body.length + 1;
  if (sh.getMaxRows() < needed) sh.insertRowsAfter(sh.getMaxRows(), needed - sh.getMaxRows());
  if (body.length) sh.getRange(2, 1, body.length, headers.length).setValues(body);
  if (previousLast > needed) {
    sh.getRange(needed + 1, 1, previousLast - needed, headers.length).clearContent();
  }
}

function showImportReport_(report, total, columnMajor, keptCount) {
  const lines = ['■ 件数照合', ''];
  report.forEach(item => {
    if (item.error) {
      lines.push('× ' + item.label);
      lines.push('　　' + item.error);
      return;
    }
    lines.push('○ ' + item.label);
    lines.push('　　元の行数 ' + item.source + ' ／ 取り込み ' + item.imported +
      ' ／ 見出し・空行として除外 ' + item.skipped);
  });
  lines.push('');
  lines.push('97_移行作業 の合計：' + total + '件');
  if (keptCount) lines.push('職員が入力済みの判断を引き継いだ行：' + keptCount + '件');
  lines.push('');
  lines.push('読上げ順は「' + (columnMajor ? '列方向（上から下、次の列へ）' : '行方向（左から右、次の行へ）') +
    '」で付けています。');
  lines.push('印刷の並びと違う場合は 99_設定 の「読上げ順の方向」を変えて取り込み直してください。');
  lines.push('');
  lines.push('この時点では 90/91/92 へは何も書いていません。');
  lines.push('97_移行作業 で 区分・確定名称・処理 を入力してから、段階3で反映します。');
  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

/* ── 読上げ名簿 ───────────────────────────────────────── */

function isYomiageNoise_(text) {
  return SHINSUN.YOMIAGE_NOISE.some(pattern => pattern.test(text));
}

/**
 * シート名を年度として、1セル1名で読む。
 * 並びが印刷順と一致するか確かめられないため、元の行・列も残す。
 */
function parseYomiage_(book, source, columnMajor) {
  const rows = [];
  let sourceRows = 0;
  let skipped = 0;

  book.getSheets().forEach(sheet => {
    const sheetName = clean_(sheet.getName());
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (lastRow < 1 || lastColumn < 1) return;
    sourceRows += lastRow;

    const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
    const cells = [];
    if (columnMajor) {
      for (let c = 0; c < lastColumn; c++) {
        for (let r = 0; r < lastRow; r++) cells.push([r, c, values[r][c]]);
      }
    } else {
      for (let r = 0; r < lastRow; r++) {
        for (let c = 0; c < lastColumn; c++) cells.push([r, c, values[r][c]]);
      }
    }

    let order = 0;
    cells.forEach(cell => {
      const name = clean_(cell[2]);
      if (!name) return;
      if (isYomiageNoise_(name)) { skipped++; return; }
      order++;
      rows.push({
        id: 'MIG-YOM-' + sheetName + '-' + (cell[0] + 1) + '-' + (cell[1] + 1),
        label: source.label, kind: source.kind, sheet: sheetName,
        year: yomiageYear_(sheetName), row: cell[0] + 1, column: cell[1] + 1,
        name: name, representative: '', phone: '', postal: '', address: '',
        gani: '', offering: '', delivery: '', note: '',
        raw: '読上げ順（仮）' + order,
        issue: sheetName === '編集中' ? '「編集中」シート。年度を確認してください' : ''
      });
    });
  });
  return { rows: rows, sourceRows: sourceRows, skipped: skipped };
}

/** シート名から年度を作る。2025 のような西暦はそのまま年度欄へ入れる。 */
function yomiageYear_(sheetName) {
  const m = clean_(sheetName).match(/(20\d{2})/);
  return m ? m[1] : clean_(sheetName);
}

/* ── 前札祈願者マスター(R2) ───────────────────────────── */

/**
 * 見出し行が資料の途中で何度も現れるため、直近の見出しから列を決める。
 * 願意・奉納品だけの行は直前の記録の続きとして足す。
 */
function parseMaebuda_(book, source) {
  const rows = [];
  let sourceRows = 0;
  let skipped = 0;

  book.getSheets().forEach(sheet => {
    const sheetName = clean_(sheet.getName());
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (lastRow < 1 || lastColumn < 1) return;
    sourceRows += lastRow;

    const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
    let map = null;
    let current = null;

    for (let r = 0; r < lastRow; r++) {
      const row = values[r];
      const found = detectMaebudaHeader_(row);
      if (found) { map = found; skipped++; continue; }
      if (!map) { skipped++; continue; }

      const name = clean_(pickCell_(row, map['名称']));
      const gani = joinCells_(row, map['願意']);
      const offering = joinCells_(row, map['奉納品']);
      const note = joinCells_(row, map['備考']);

      if (name) {
        current = {
          id: 'MIG-MAE-' + sheetName + '-' + (r + 1),
          label: source.label, kind: source.kind, sheet: sheetName,
          year: source.year, row: r + 1, column: (map['名称'] || [0])[0] + 1,
          name: name,
          representative: joinCells_(row, map['代表者名']),
          phone: joinCells_(row, map['電話番号']),
          postal: '', address: '',
          gani: gani, offering: offering,
          delivery: joinCells_(row, map['札送り']) || joinCells_(row, map['来山予定']),
          note: note,
          raw: rawRowText_(row),
          issue: ''
        };
        rows.push(current);
        continue;
      }

      // 名称のない行。願意・奉納品・備考があれば直前の記録の続きとして足す。
      if (current && (gani || offering || note)) {
        current.gani = appendText_(current.gani, gani);
        current.offering = appendText_(current.offering, offering);
        current.note = appendText_(current.note, note);
        current.raw = appendText_(current.raw, rawRowText_(row));
        current.issue = appendText_(current.issue, '続き行を結合（' + (r + 1) + '行）');
      } else {
        skipped++;
      }
    }
  });
  return { rows: rows, sourceRows: sourceRows, skipped: skipped };
}

/** 見出し行かどうかを、空白を除いたラベルの一致で判定する。 */
function detectMaebudaHeader_(row) {
  const hits = {};
  let matched = 0;
  row.forEach((value, index) => {
    const label = key_(value);
    if (!label) return;
    const field = SHINSUN.MAEBUDA_LABELS[label];
    if (!field) return;
    if (!hits[field]) hits[field] = [];
    hits[field].push(index);
    matched++;
  });
  // 「前札名称」を含み、ほかにも2つ以上ラベルがある行だけを見出しとみなす。
  return (hits['名称'] && matched >= 3) ? hits : null;
}

function pickCell_(row, columns) {
  if (!columns || !columns.length) return '';
  return row[columns[0]];
}

function joinCells_(row, columns) {
  if (!columns || !columns.length) return '';
  const parts = [];
  columns.forEach(index => {
    const value = clean_(row[index]);
    if (value && parts.indexOf(value) < 0) parts.push(value);
  });
  return parts.join('・');
}

/** 取り込みが取りこぼした情報を確認できるよう、行の中身をそのまま残す。 */
function rawRowText_(row) {
  const parts = [];
  row.forEach((value, index) => {
    const text = clean_(value);
    if (text) parts.push(columnLetter_(index + 1) + ':' + text);
  });
  return parts.join(' / ').slice(0, 4000);
}

function appendText_(current, addition) {
  return [clean_(current), clean_(addition)].filter(Boolean).join('\n');
}

/* ── 一般の名簿（単純な表）───────────────────────────── */

const SIMPLE_LABELS = Object.freeze({
  '名前': '名称', '氏名': '名称', '会社名': '会社名',
  '金額': '金額', '祈願料': '金額',
  '願意': '願意',
  '郵便番号': '郵便番号', '〒': '郵便番号',
  '住所': '住所', '現住所': '住所',
  'tel': '電話番号', '電話': '電話番号', '電話番号': '電話番号'
});

function parseSimpleList_(book, source) {
  const rows = [];
  let sourceRows = 0;
  let skipped = 0;

  book.getSheets().forEach(sheet => {
    const sheetName = clean_(sheet.getName());
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (lastRow < 1 || lastColumn < 1) return;
    sourceRows += lastRow;

    const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
    let map = null;

    for (let r = 0; r < lastRow; r++) {
      const row = values[r];
      const found = detectSimpleHeader_(row);
      if (found) { map = found; skipped++; continue; }
      if (!map) { skipped++; continue; }

      const name = clean_(pickCell_(row, map['名称'])) || clean_(pickCell_(row, map['会社名']));
      if (!name) { skipped++; continue; }

      rows.push({
        id: 'MIG-GEN-' + source.year + '-' + sheetName + '-' + (r + 1),
        label: source.label, kind: source.kind, sheet: sheetName,
        year: source.year, row: r + 1, column: (map['名称'] || map['会社名'] || [0])[0] + 1,
        name: name,
        representative: '',
        phone: joinCells_(row, map['電話番号']),
        postal: joinCells_(row, map['郵便番号']),
        address: joinCells_(row, map['住所']),
        gani: joinCells_(row, map['願意']),
        offering: '',
        delivery: '',
        note: joinCells_(row, map['金額']) ? '金額：' + joinCells_(row, map['金額']) : '',
        raw: rawRowText_(row),
        issue: ''
      });
    }
  });
  return { rows: rows, sourceRows: sourceRows, skipped: skipped };
}

function detectSimpleHeader_(row) {
  const hits = {};
  let matched = 0;
  row.forEach((value, index) => {
    const label = key_(value);
    if (!label) return;
    const field = SIMPLE_LABELS[label];
    if (!field) return;
    if (!hits[field]) hits[field] = [];
    hits[field].push(index);
    matched++;
  });
  return ((hits['名称'] || hits['会社名']) && matched >= 2) ? hits : null;
}

/* ── 取り込み結果の確認 ───────────────────────────────── */

/** 97_移行作業 の状況を数える。段階3へ進んでよいかの目安。 */
function checkShinsunMigration() {
  resetShinsunCache_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHINSUN.SHEETS.MIGRATION);
  if (!sh) {
    SpreadsheetApp.getUi().alert('97_移行作業 がありません。先に setupShinsunStage2 を実行してください。');
    return;
  }
  const table = readTable_(sh);
  const iLabel = col_(table.map, '移行元', sh.getName()) - 1;
  const iKubun = col_(table.map, '区分', sh.getName()) - 1;
  const iAction = col_(table.map, '処理', sh.getName()) - 1;
  const iName = col_(table.map, '確定名称', sh.getName()) - 1;
  const iIssue = col_(table.map, '要確認', sh.getName()) - 1;
  const iRaw = col_(table.map, '名称（生）', sh.getName()) - 1;

  const byLabel = {};
  let unclassified = 0;
  let toRegister = 0;
  let toMerge = 0;
  let excluded = 0;
  let withIssue = 0;
  let missingName = 0;
  const duplicates = {};

  table.rows.forEach(row => {
    if (!clean_(row[iLabel])) return;
    byLabel[clean_(row[iLabel])] = (byLabel[clean_(row[iLabel])] || 0) + 1;

    const action = clean_(row[iAction]) || '未分類';
    if (action === '登録する') toRegister++;
    else if (action === '既存に統合') toMerge++;
    else if (action === '対象外') excluded++;
    else unclassified++;

    if (action !== '対象外') {
      if (!clean_(row[iKubun])) missingName++;
      const name = key_(row[iName]) || key_(row[iRaw]);
      if (name) duplicates[name] = (duplicates[name] || 0) + 1;
    }
    if (clean_(row[iIssue])) withIssue++;
  });

  const repeated = Object.keys(duplicates).filter(k => duplicates[k] > 1).length;
  const lines = ['■ 97_移行作業 の状況', ''];
  Object.keys(byLabel).forEach(label => lines.push('　' + label + '：' + byLabel[label] + '件'));
  lines.push('');
  lines.push('　未分類：' + unclassified);
  lines.push('　登録する：' + toRegister + '　／　既存に統合：' + toMerge + '　／　対象外：' + excluded);
  lines.push('　区分（信者様／会社）が未入力：' + missingName);
  lines.push('　同じ名称が複数行：' + repeated + '種');
  lines.push('　要確認あり：' + withIssue);
  lines.push('');
  lines.push(unclassified || missingName
    ? '未分類と区分未入力がなくなってから、段階3の反映へ進みます。'
    : '分類は済んでいます。段階3の反映へ進めます。');
  SpreadsheetApp.getUi().alert(lines.join('\n'));
  logShinsun_(ss, '移行状況を確認', SHINSUN.SHEETS.MIGRATION, table.rows.length,
    '未分類' + unclassified + '件');
}
