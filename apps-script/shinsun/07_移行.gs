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
  bindMigrationValidation_(ss, sh, '処理', ['未分類', '登録する', '既存に統合', '履歴のみ', '対象外']);
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
    '登録する＝新しく 90/91 へ入れる。既存に統合＝対象IDの行へまとめる。' +
    '履歴のみ＝90/91 は増やさず 92 の過年度行だけ作る（読上げ名簿）。対象外＝移行しない。'
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
    const direction = key_(configValue_(config, '読上げ順の方向'));
    // 「行方向」と読めれば行方向。空欄や読めない値のときは行方向を既定にする。
    const columnMajor = /列/.test(direction) && !/行/.test(direction);
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

    const needCheck = collected.filter(row => clean_(row.issue)).length;
    showImportReport_(report, total, columnMajor, keep.size, needCheck, direction);
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
  // 取り込みが入れた既定値。これしか入っていない行は「職員の判断あり」と数えない。
  const defaults = { '処理': '未分類', '反映状態': '未反映' };

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
      const text = clean_(value);
      if (!text) return;
      if (defaults[name] && text === defaults[name]) return;
      hasAny = true;
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

function showImportReport_(report, total, columnMajor, keptCount, needCheck, direction) {
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
  if (needCheck) lines.push('要確認が付いた行：' + needCheck + '件（内札欄だけの行、名前が空の行など）');
  lines.push('');
  lines.push('読上げ順は「' + (columnMajor ? '列方向（上から下、次の列へ）' : '行方向（左から右、次の行へ）') +
    '」で付けています。（99_設定 の値：' + (direction || '空欄') + '）');
  lines.push('印刷の並びと違う場合は setShinsunYomiageDirection を実行してから取り込み直してください。');
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
 * この資料は次のような形をしている。
 *   ・見出し行が資料の途中で何度も現れる（①②…と章が変わる）。
 *   ・章によって「前札名称」の列がずれる（①はE列、②以降はG列）。
 *   ・後の章の見出しは「前札名称・願意・札送・来山予定」しか書いていない。
 *     電話番号や備考の列は最初の見出しと同じ位置のまま。
 *   ・見出しは結合セルなので、値は結合の左上にしか入らない。
 *     「願意」は17列目だけに見出しがあり、実際の値は17・19・23列目に散る。
 *   ・前札名称の欄の中に「前札の名義」と「内札の名義」が並んでいる。
 *     内札だけの行が続く場合がある（一つの前札に内札が何名も付く）。
 *
 * そこで、
 *   ・見出しは上書きではなく積み上げる（後の章に書いていない列は前の章の位置を使う）。
 *   ・各見出しは「自分の列から次の見出しの列の手前まで」を受け持つ範囲とみなす。
 *   ・名称欄の中で内札が始まる列を、資料全体から数えて決める。
 *   ・内札だけの行は捨てず、別の行として 97_移行作業 に出し、要確認に親の前札名を書く。
 *
 * 元ファイルは読むだけ。並べ替えも書き込みもしない。
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
    const innerStart = detectMaebudaInnerStart_(values, lastColumn);

    let base = {};
    let map = null;
    let current = null;   // 続き行を足す先。前札でも内札でもよい。
    let parent = null;    // 直近の前札。内札だけの行の要確認に書く。

    for (let r = 0; r < lastRow; r++) {
      const row = values[r];

      const found = detectMaebudaHeader_(row);
      if (found) {
        Object.keys(found).forEach(field => { base[field] = found[field]; });
        map = maebudaSpans_(base, lastColumn);
        current = null;
        skipped++;
        continue;
      }
      if (!map) { skipped++; continue; }

      const nameCells = maebudaNameCells_(row, map['名称']);
      const names = [];
      const inners = [];
      nameCells.forEach(cell => {
        if (innerStart !== null && cell.index >= innerStart) inners.push(cell.text);
        else names.push(cell.text);
      });

      const gani = joinSpan_(row, map['願意']);
      const offering = joinSpan_(row, map['奉納品']);
      const note = joinSpan_(row, map['備考']);

      if (names.length) {
        current = {
          id: 'MIG-MAE-' + sheetName + '-' + (r + 1),
          label: source.label, kind: source.kind, sheet: sheetName,
          year: source.year, row: r + 1, column: map['名称'].start + 1,
          name: names[0],
          representative: inners.join('・'),
          phone: joinSpan_(row, map['電話番号']),
          postal: '', address: '',
          gani: gani, offering: offering,
          delivery: joinSpan_(row, map['札送り']) || joinSpan_(row, map['来山予定']),
          note: note,
          raw: rawRowText_(row),
          issue: names.length > 1 ? '名称欄に複数の記載（' + names.join(' / ') + '）' : ''
        };
        parent = current;
        rows.push(current);
        continue;
      }

      if (inners.length) {
        const text = inners.join('・');

        // 「お酒10本」「自宅お祀り分1万円」のような覚え書きは、名前ではなく前札の続き。
        if (SHINSUN.MAEBUDA_GOODS.digit.test(text) && SHINSUN.MAEBUDA_GOODS.unit.test(text)) {
          if (current) {
            current.offering = appendText_(current.offering, text);
            current.raw = appendText_(current.raw, rawRowText_(row));
            current.issue = appendText_(current.issue, '奉納品・金額として結合（' + (r + 1) + '行）');
          } else {
            skipped++;
          }
          continue;
        }

        // 内札だけの行。一人ずつ札を出すため、別の行として残す。
        current = {
          id: 'MIG-MAE-' + sheetName + '-' + (r + 1),
          label: source.label, kind: source.kind, sheet: sheetName,
          year: source.year, row: r + 1, column: innerStart + 1,
          name: text,
          representative: '',
          phone: joinSpan_(row, map['電話番号']),
          postal: '', address: '',
          gani: gani, offering: offering,
          delivery: joinSpan_(row, map['札送り']) || joinSpan_(row, map['来山予定']),
          note: note,
          raw: rawRowText_(row),
          issue: '内札欄だけの行。前札「' + (parent ? parent.name : '不明') + '」の内札として記載。'
        };
        rows.push(current);
        continue;
      }

      // 名前のない行。願意・奉納品・備考があれば直前の記録の続きとして足す。
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

/** 見出し行かどうかを、空白を除いたラベルの一致で判定し、ラベルと列の対応を返す。 */
function detectMaebudaHeader_(row) {
  const hits = {};
  let matched = 0;
  row.forEach((value, index) => {
    const label = key_(value);
    if (!label) return;
    const field = SHINSUN.MAEBUDA_LABELS[label];
    if (!field) return;
    if (!(field in hits)) hits[field] = index;   // 結合セルの左上を採る
    matched++;
  });
  // 「前札名称」を含み、ほかにも2つ以上ラベルがある行だけを見出しとみなす。
  return (typeof hits['名称'] === 'number' && matched >= 3) ? hits : null;
}

/** 積み上げた見出しから、各項目が受け持つ列の範囲を作る。 */
function maebudaSpans_(base, lastColumn) {
  const starts = [];
  Object.keys(base).forEach(field => {
    if (starts.indexOf(base[field]) < 0) starts.push(base[field]);
  });
  starts.sort((a, b) => a - b);

  const spans = {};
  Object.keys(base).forEach(field => {
    const start = base[field];
    let end = lastColumn - 1;
    for (let i = 0; i < starts.length; i++) {
      if (starts[i] > start) { end = starts[i] - 1; break; }
    }
    spans[field] = { start: start, end: end };
  });
  return spans;
}

/** 名称欄の中身。章見出しだけの行（「令和2年　新春特別祈願者」）は名前として扱わない。 */
function maebudaNameCells_(row, span) {
  const out = [];
  if (!span) return out;
  for (let i = span.start; i <= span.end && i < row.length; i++) {
    const text = clean_(row[i]);
    if (!text) continue;
    if (SHINSUN.MAEBUDA_NOISE.some(pattern => pattern.test(text))) continue;
    out.push({ index: i, text: text });
  }
  return out;
}

/**
 * 名称欄の中で、内札の名義が始まる列を資料全体から決める。
 * 前札と内札が並ぶ行では 2つめの記載が内札なので、その列を数えていちばん多いものを採る。
 * 見つからないときは null を返し、名称欄の中身はすべて前札名として扱う。
 */
function detectMaebudaInnerStart_(values, lastColumn) {
  const counts = {};
  let base = {};
  let map = null;

  values.forEach(row => {
    const found = detectMaebudaHeader_(row);
    if (found) {
      Object.keys(found).forEach(field => { base[field] = found[field]; });
      map = maebudaSpans_(base, lastColumn);
      return;
    }
    if (!map) return;
    const cells = maebudaNameCells_(row, map['名称']);
    if (cells.length < 2) return;
    counts[cells[1].index] = (counts[cells[1].index] || 0) + 1;
  });

  let best = null;
  let bestCount = 0;
  Object.keys(counts).forEach(key => {
    if (counts[key] > bestCount) { bestCount = counts[key]; best = Number(key); }
  });
  return best;
}

/** 受け持ち範囲の中身を「・」でつなぐ。結合セルで値が散っていても拾える。 */
function joinSpan_(row, span) {
  if (!span) return '';
  const parts = [];
  for (let i = span.start; i <= span.end && i < row.length; i++) {
    const text = clean_(row[i]);
    if (text && parts.indexOf(text) < 0) parts.push(text);
  }
  return parts.join('・');
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

/**
 * 要確認へ一言足す。同じ文が既にあれば足さない。
 * 反映や下書きは何度でも実行できるので、これがないと同じ文が積み上がる。
 */
function noteOnce_(current, addition) {
  const text = clean_(addition);
  if (!text) return current;
  const lines = String(current == null ? '' : current).split('\n').map(clean_).filter(Boolean);
  if (lines.indexOf(text) >= 0) return lines.join('\n');
  lines.push(text);
  return lines.join('\n');
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
      const phone = joinCells_(row, map['電話番号']);
      const postal = joinCells_(row, map['郵便番号']);
      const address = joinCells_(row, map['住所']);
      const gani = joinCells_(row, map['願意']);
      const amount = joinCells_(row, map['金額']);

      // 名前が空でも、住所・電話・金額があれば実在の申込。捨てずに要確認で拾う。
      if (!name && !phone && !postal && !address && !gani && !amount) { skipped++; continue; }

      rows.push({
        id: 'MIG-GEN-' + source.year + '-' + sheetName + '-' + (r + 1),
        label: source.label, kind: source.kind, sheet: sheetName,
        year: source.year, row: r + 1, column: (map['名称'] || map['会社名'] || [0])[0] + 1,
        name: name,
        representative: '',
        phone: phone,
        postal: postal,
        address: address,
        gani: gani,
        offering: '',
        delivery: '',
        note: amount ? '金額：' + amount : '',
        raw: rawRowText_(row),
        issue: name ? '' : '名前欄が空です。元資料で氏名を確認してください'
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

/* ── 読上げ順の設定 ───────────────────────────────────── */

/**
 * 99_設定 の「読上げ順の方向」を書き換える。管理者が Apps Script エディタから実行する。
 *
 * 引数なしで実行すると「行方向」（左から右、次の行へ）にする。
 * 元朝前札読み上げの実資料では、同じ家・同じ会社の名前が一つの行に連続して
 * 並んでいたため、行方向が正しい。
 *
 * 書き換えるのは 99_設定 のこの1セルだけ。ほかのシートも元ファイルも触らない。
 */
function setShinsunYomiageDirection(direction) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const wanted = clean_(direction) || '行方向';
  if (wanted !== '行方向' && wanted !== '列方向') {
    throw new Error('「行方向」か「列方向」を指定してください。指定された値：' + wanted);
  }
  return withScriptLock_(function () {
    const sh = shinsunSheet_(ss, SHINSUN.SHEETS.CONFIG);
    const row = findConfigRow_(sh, '読上げ順の方向');
    if (!row) throw new Error('99_設定 に「読上げ順の方向」の行がありません。setupShinsunStage2 を実行してください。');

    const cell = sh.getRange(row, 2);
    const before = clean_(cell.getValue());
    cell.setNumberFormat('@');
    cell.setValue(wanted);
    resetShinsunCache_();
    logShinsun_(ss, '読上げ順の方向を変更', SHINSUN.SHEETS.CONFIG, 1, before + ' → ' + wanted);
    SpreadsheetApp.getUi().alert(
      '99_設定 の「読上げ順の方向」を書き換えました。\n\n' +
      '　変更前：' + (before || '空欄') + '\n' +
      '　変更後：' + wanted + '\n\n' +
      'このあと importLegacyShinsunData を実行し直してください。'
    );
    return wanted;
  });
}

/* ══ 段階3｜分類の下書きと 90/91/92 への反映 ══════════════ */

/**
 * 段階3の初期設定。
 * 92_年度別案内対象 を作り、98_マスター へ「（過去実績）」を足し、
 * 97_移行作業 の「処理」に「履歴のみ」を足す。
 * 既に入っている値は上書きしない。
 */
function setupShinsunStage3() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    buildMasterSheet_(ss);      // 案内状態「（過去実績）」を足す（既存は消さない）
    buildChoicesSheet_(ss);
    buildGuideSheet_(ss);
    const migration = ss.getSheetByName(SHINSUN.SHEETS.MIGRATION);
    if (migration) {
      bindMigrationValidation_(ss, migration, '処理',
        ['未分類', '登録する', '既存に統合', '履歴のみ', '対象外']);
    }
    resetShinsunCache_();
    logShinsun_(ss, '初期設定（段階3）', SHINSUN.SHEETS.GUIDE, 1, SHINSUN.VERSION);
    toast_(ss, '92_年度別案内対象 を作りました。次に suggestShinsunClassification を実行してください。', 12);
    return SHINSUN.SHEETS.GUIDE;
  });
}

/**
 * 92_年度別案内対象。年度×宛先で1行。
 * F〜L は作成時点のコピー。マスターの住所を直しても過去年度の行は変わらない。
 *
 * 仕様書 §4 の列に加えて2列を持つ。
 *   読上げ順   … 仕様書 §13「過年度に入る項目」で必要。93 は段階6のためここに置く。
 *   移行元ID   … §13-2 の「元ファイル名と元の行番号」を反映後もたどれるようにする。
 */
function buildGuideSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.GUIDE);
  const headers = SHINSUN.HEADERS.GUIDE;
  ensureSize_(sh, 3000, headers.length);
  writeHeaders_(sh, headers, 1, '#3f6b4f');

  const map = headerMap_(sh);
  const rows = sh.getMaxRows() - 1;

  ['案内状態', '返答状態', '返答日', '職員メモ'].forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#fff4cc');
  });
  ['年度別案内ID', '年度', '対象区分', '対象ID', '案内ルート',
   '案内宛名', '郵便番号', '住所', '建物名', '敬称', '電話番号', '案内方法',
   '案内状の種類', '案内日', '前年度申込有無', '連続未申込年数', '要確認',
   '世帯ID', '集約先案内ID', '読上げ順', '移行元ID', '作成日時'].forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#f2f5f2').setFontColor('#4a544c');
  });

  ['郵便番号', '電話番号'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setNumberFormat('@');
  });
  ['案内日', '返答日'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd');
  });
  sh.getRange(2, col_(map, '作成日時', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(2, col_(map, '読上げ順', sh.getName()), rows, 1).setNumberFormat('0');
  sh.getRange(2, col_(map, '連続未申込年数', sh.getName()), rows, 1).setNumberFormat('0');
  ['住所', '要確認', '職員メモ'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setWrap(true).setVerticalAlignment('top');
  });

  bindGuideValidation_(ss, sh, '対象区分', '（なし）', ['信者様', '会社']);
  bindGuideValidation_(ss, sh, '案内ルート', '案内ルート', null);
  bindGuideValidation_(ss, sh, '案内状態', '案内状態', null);
  bindGuideValidation_(ss, sh, '返答状態', '返答状態', null);
  bindGuideValidation_(ss, sh, '案内方法', '案内方法', null);
  bindGuideValidation_(ss, sh, '敬称', '敬称', null);

  [130, 70, 80, 100, 90,
   220, 90, 260, 140, 60, 130, 90,
   150, 110, 90, 90, 90,
   110, 90, 240, 90, 130, 220, 80, 170, 130]
    .forEach((width, i) => { if (i < headers.length) sh.setColumnWidth(i + 1, width); });
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);

  sh.getRange(1, col_(map, '案内宛名', sh.getName())).setNote(
    '作成時点のコピーです。90/91 の住所を直しても、過去年度のこの行は変わりません。'
  );
  sh.getRange(1, col_(map, '案内状態', sh.getName())).setNote(
    '過年度の移行行は「（過去実績）」で固定します。案内対象の再生成では作り直しません。'
  );
  sh.getRange(1, col_(map, '読上げ順', sh.getName())).setNote(
    '元朝前札読み上げの並び順（仮）。翌年度の読上げ順の初期値に使います。'
  );
  return sh;
}

function bindGuideValidation_(ss, sh, headerName, group, values) {
  const map = headerMap_(sh);
  const column = map[clean_(headerName)];
  if (!column) return;
  const range = sh.getRange(2, column, sh.getMaxRows() - 1, 1);
  if (values) {
    range.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true).setAllowInvalid(false).build());
    return;
  }
  const source = choiceRange_(ss, group);
  if (!source) return;
  range.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(source, true).setAllowInvalid(false)
    .setHelpText('98_マスター の「' + group + '」から選びます。').build());
}

/* ── 分類の下書き ─────────────────────────────────────── */

/**
 * 97_移行作業 の「区分」「確定名称」「処理」を下書きとして埋める。
 *
 * 埋めるのは空欄の行だけ。職員が入れた値には触らない。
 * 判定できない行は空欄のまま残し、要確認に理由を書く。
 * 何度実行しても、職員が直した内容は消えない。
 */
function suggestShinsunClassification() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const sh = shinsunSheet_(ss, SHINSUN.SHEETS.MIGRATION);
    const map = headerMap_(sh);
    const name = sh.getName();
    const iId = col_(map, '移行ID', name) - 1;
    const iKind = col_(map, '種別', name) - 1;
    const iRawName = col_(map, '名称（生）', name) - 1;
    const iRep = col_(map, '代表者名（生）', name) - 1;
    const iKubun = col_(map, '区分', name) - 1;
    const iFixed = col_(map, '確定名称', name) - 1;
    const iAction = col_(map, '処理', name) - 1;
    const iIssue = col_(map, '要確認', name) - 1;
    const iState = col_(map, '反映状態', name) - 1;

    const last = lastRowByColumn_(sh, iId + 1);
    if (last < 2) { SpreadsheetApp.getUi().alert('97_移行作業 に行がありません。'); return 0; }

    const width = sh.getLastColumn();
    const values = sh.getRange(2, 1, last - 1, width).getValues();

    let filledKubun = 0;
    let filledName = 0;
    let filledAction = 0;
    let undecided = 0;

    values.forEach(row => {
      if (!clean_(row[iId])) return;
      if (clean_(row[iState]) === '反映済') return;   // 反映後は触らない

      const kind = clean_(row[iKind]);
      const rawName = clean_(row[iRawName]);
      const rep = clean_(row[iRep]);
      const guess = guessShinsunKubun_(rawName, rep);

      if (!clean_(row[iKubun]) && guess.kubun) { row[iKubun] = guess.kubun; filledKubun++; }
      if (!clean_(row[iFixed]) && guess.name) { row[iFixed] = guess.name; filledName++; }

      const action = clean_(row[iAction]);
      if (!action || action === '未分類') {
        // 読上げ名簿は氏名しかないため 90/91 は増やさず、92 の過年度行だけ作る。
        const next = (kind === '読上げ名簿') ? '履歴のみ' : (guess.kubun ? '登録する' : '');
        if (next) { row[iAction] = next; filledAction++; }
      }

      if (!clean_(row[iKubun])) undecided++;
      if (guess.issue) row[iIssue] = noteOnce_(row[iIssue], guess.issue);
      else if (guess.kubun) row[iIssue] = noteOnce_(row[iIssue], '下書き（要確認）');
    });

    sh.getRange(2, 1, values.length, width).setValues(values.map(row => row.map(safeSheetValue_)));
    resetShinsunCache_();
    logShinsun_(ss, '分類の下書き', SHINSUN.SHEETS.MIGRATION, filledKubun,
      '区分' + filledKubun + '件／確定名称' + filledName + '件／処理' + filledAction + '件');

    SpreadsheetApp.getUi().alert([
      '■ 分類の下書き',
      '',
      '　区分を埋めた行：' + filledKubun + '件',
      '　確定名称を埋めた行：' + filledName + '件',
      '　処理を埋めた行：' + filledAction + '件',
      '　区分が決められなかった行：' + undecided + '件',
      '',
      'すべて下書きです。97_移行作業 を見て直してください。',
      '要確認に「下書き（要確認）」と入っている行が対象です。',
      '',
      '直し終えたら applyShinsunMigration を実行すると 90/91/92 へ反映します。'
    ].join('\n'));
    return filledKubun;
  });
}

/**
 * 名称から個人か会社かを見立てる。あくまで下書きで、職員が上書きできる。
 *
 * 実資料（前札祈願者マスターR2）を見て、次の順で判定する。
 *   1. 法人格・業種の語があれば会社。「(株)〜災害防止協議会」のように
 *      肩書きの語も含む名前があるため、肩書きより先に見る。
 *   2. 肩書き・自治体名（久留米市長／衆議院議員／北九州市）は名義が個人。
 *      内札欄に個人名があればそれを確定名称にし、なければ区分を決めない。
 *   3. 法人格の語がなくても、内札欄に別の名前があれば団体とみなす。
 *      「テクノ／中園孝一」「松尾プロパン／松尾元伸」のような屋号が拾える。
 *      「小林康子／川瀬露秋」のような例外もあるため必ず要確認を付ける。
 *   4. どれにも当たらなければ個人。
 */
function guessShinsunKubun_(rawName, representative) {
  const name = clean_(rawName);
  const inner = clean_(representative);
  if (!name) {
    return { kubun: '', name: '', issue: '名称が空です。元資料で確認してください' };
  }

  const flat = key_(name);
  if (SHINSUN.COMPANY_WORDS.some(word => flat.indexOf(key_(word)) >= 0)) {
    return { kubun: '会社', name: name, issue: '' };
  }

  const isTitle = SHINSUN.TITLE_WORDS.some(word => flat.indexOf(key_(word)) >= 0);
  if (isTitle || SHINSUN.MUNICIPALITY.test(name)) {
    if (inner) {
      return {
        kubun: '信者様',
        name: inner,
        issue: '名称欄が「' + name + '」（肩書き・自治体名）です。' +
          '確定名称に内札欄の「' + inner + '」を入れました。確認してください'
      };
    }
    return {
      kubun: '',
      name: name,
      issue: '名称欄が「' + name + '」（肩書き・自治体名）です。個人か団体かを確認してください'
    };
  }

  if (inner && key_(inner) !== flat) {
    return {
      kubun: '会社',
      name: name,
      issue: '法人格の語はありませんが、内札欄に別の名前「' + inner + '」があるため団体としました。' +
        '個人であれば区分を信者様に直してください'
    };
  }

  return { kubun: '信者様', name: name, issue: '' };
}

/* ── 90/91/92 への反映 ────────────────────────────────── */

/**
 * 97_移行作業 の分類にしたがって 90/91/92 へ反映する。
 *
 *   登録する    … 90 または 91 へ新しい行を作り、その年度の 92 の過年度行も作る
 *   既存に統合  … 対象ID の既存行の空欄だけ埋め、92 の過年度行を作る
 *   履歴のみ    … 90/91 は増やさず 92 の過年度行だけ作る（読上げ名簿）
 *   対象外      … 何もしない
 *   未分類      … 何もしない。97 に残す
 *
 * 反映した行は 97 の 反映状態＝反映済、対象ID、反映日時 を書き戻す。
 * すでに反映済の行は読み飛ばすので、何度実行しても二重には入らない。
 * 元ファイルには一切書き込まない。
 */
function applyShinsunMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const sh = shinsunSheet_(ss, SHINSUN.SHEETS.MIGRATION);
    const person = shinsunSheet_(ss, SHINSUN.SHEETS.PERSON);
    const company = shinsunSheet_(ss, SHINSUN.SHEETS.COMPANY);
    const guide = ss.getSheetByName(SHINSUN.SHEETS.GUIDE);
    if (!guide) throw new Error('92_年度別案内対象 がありません。先に setupShinsunStage3 を実行してください。');

    const map = headerMap_(sh);
    const name = sh.getName();
    const idx = {};
    ['移行ID', '移行元', '元シート', '種別', '年度', '名称（生）', '代表者名（生）',
     '電話番号（生）', '郵便番号（生）', '住所（生）', '備考（生）', '生データ',
     '区分', '確定名称', '対象ID', '処理', '反映状態', '反映日時', '要確認']
      .forEach(header => { idx[header] = col_(map, header, name) - 1; });

    const last = lastRowByColumn_(sh, idx['移行ID'] + 1);
    if (last < 2) { SpreadsheetApp.getUi().alert('97_移行作業 に行がありません。'); return 0; }
    const width = sh.getLastColumn();
    const rows = sh.getRange(2, 1, last - 1, width).getValues();

    const index = buildMasterIndex_(person, company);
    const now = new Date();
    const count = { person: 0, company: 0, merged: 0, guide: 0, skipped: 0, unmatched: 0, noYear: 0 };
    const newPersons = [];
    const newCompanies = [];
    const newGuides = [];

    // 実行前の反映状態を控える。1周目で「反映済」に変えるため、
    // これを見ないと再実行のときに 92 の行が二重に増える。
    const wasApplied = rows.map(row => clean_(row[idx['反映状態']]) === '反映済');

    // この実行で 92 を作る行だけ印を付ける。
    const makeGuide = rows.map(() => false);

    const seq = {
      person: nextSerial_(person, '信者ID', SHINSUN.ID.PERSON),
      company: nextSerial_(company, '会社ID', SHINSUN.ID.COMPANY)
    };

    // 1周目：90/91 へ登録する行。読上げ名簿が新しいIDへ結べるよう先に済ませる。
    rows.forEach((row, i) => {
      if (!clean_(row[idx['移行ID']])) return;
      if (wasApplied[i]) return;
      const action = clean_(row[idx['処理']]);
      if (action !== '登録する' && action !== '既存に統合') return;

      const kubun = clean_(row[idx['区分']]);
      const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
      if (!kubun || !label) {
        row[idx['要確認']] = noteOnce_(row[idx['要確認']], '区分か確定名称が空欄です。反映していません');
        count.skipped++;
        return;
      }

      if (action === '既存に統合') {
        const targetId = clean_(row[idx['対象ID']]);
        if (!targetId) {
          row[idx['要確認']] = noteOnce_(row[idx['要確認']], '既存に統合ですが対象IDが空欄です');
          count.skipped++;
          return;
        }
        count.merged++;
        makeGuide[i] = true;
        row[idx['反映状態']] = '反映済';
        row[idx['反映日時']] = now;
        return;
      }

      const built = (kubun === '会社')
        ? buildCompanyRecord_(row, idx, newCompanies, index, seq)
        : buildPersonRecord_(row, idx, newPersons, index, seq);
      if (kubun === '会社') count.company++; else count.person++;

      row[idx['対象ID']] = built.id;
      row[idx['反映状態']] = '反映済';
      row[idx['反映日時']] = now;
      makeGuide[i] = true;
      if (built.issue) row[idx['要確認']] = noteOnce_(row[idx['要確認']], built.issue);
      indexAdd_(index, label, kubun, built.id, built.snapshot);
    });

    // 2周目：92 の過年度行。1周目で登録した行と、まだ反映していない「履歴のみ」の行。
    rows.forEach((row, i) => {
      if (!clean_(row[idx['移行ID']])) return;
      const action = clean_(row[idx['処理']]);
      const historyOnly = (action === '履歴のみ' && !wasApplied[i]);
      if (!makeGuide[i] && !historyOnly) return;

      const year = migrationYear_(row[idx['年度']], row[idx['元シート']]);
      if (!year) {
        row[idx['要確認']] = noteOnce_(row[idx['要確認']], '年度が決められません（元シート「' + clean_(row[idx['元シート']]) + '」）。97 の年度欄に R8 のように入れると 92 へ反映します');
        count.noYear++;
        if (historyOnly) return;   // 90/91 へは入れていないので反映済にしない
        return;
      }

      const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
      if (!label) { count.skipped++; return; }

      let kubun = clean_(row[idx['区分']]);
      let targetId = clean_(row[idx['対象ID']]);
      let issue = '';

      if (!targetId) {
        const hit = indexFind_(index, label, kubun);
        if (hit.id) { targetId = hit.id; kubun = kubun || hit.kubun; }
        else if (hit.many) { issue = '同じ名称が 90/91 に ' + hit.many + '件あり、対象IDを決められません'; count.unmatched++; }
        else { issue = '90/91 に同じ名称がありません。対象IDは空欄です'; count.unmatched++; }
      }

      const snapshot = index.byId[targetId] || {};
      newGuides.push({
        year: year,
        kubun: kubun || snapshot.kubun || '',
        targetId: targetId,
        route: migrationRoute_(row[idx['種別']]),
        label: label,
        postal: snapshot.postal || clean_(row[idx['郵便番号（生）']]),
        address: snapshot.address || clean_(row[idx['住所（生）']]),
        building: snapshot.building || '',
        honorific: snapshot.honorific || (kubun === '会社' ? '御中' : '様'),
        phone: snapshot.phone || clean_(row[idx['電話番号（生）']]),
        method: snapshot.method || '',
        order: yomiageOrder_(row[idx['生データ']]),
        migrationId: clean_(row[idx['移行ID']]),
        issue: issue
      });
      count.guide++;

      if (issue) row[idx['要確認']] = noteOnce_(row[idx['要確認']], issue);
      if (historyOnly) {
        row[idx['対象ID']] = targetId;
        row[idx['反映状態']] = '反映済';
        row[idx['反映日時']] = now;
      }
    });

    appendRows_(person, newPersons, SHINSUN.HEADERS.PERSON);
    appendRows_(company, newCompanies, SHINSUN.HEADERS.COMPANY);
    appendGuideRows_(guide, newGuides, now);
    sh.getRange(2, 1, rows.length, width).setValues(rows.map(row => row.map(safeSheetValue_)));

    resetShinsunCache_();
    const note = '信者様' + count.person + '／会社' + count.company + '／統合' + count.merged +
      '／92' + count.guide + '／対象ID未特定' + count.unmatched + '／年度不明' + count.noYear;
    logShinsun_(ss, '移行の反映', SHINSUN.SHEETS.GUIDE, count.guide, note);

    SpreadsheetApp.getUi().alert([
      '■ 90/91/92 への反映',
      '',
      '　90_信者様マスター へ登録：' + count.person + '件',
      '　91_会社マスター へ登録：' + count.company + '件',
      '　既存へ統合として印を付けた行：' + count.merged + '件',
      '　92_年度別案内対象 の過年度行：' + count.guide + '件',
      '',
      '　対象IDを決められなかった行：' + count.unmatched + '件（92 は作り、対象IDは空欄）',
      '　年度が決められず 92 に入れなかった行：' + count.noYear + '件',
      '　区分・確定名称が空で見送った行：' + count.skipped + '件',
      '',
      '92 の過年度行は案内状態「（過去実績）」で固定です。案内対象の再生成では作り直しません。',
      '反映した行は 97_移行作業 の反映状態が「反映済」になります。もう一度実行しても二重には入りません。'
    ].join('\n'));
    return count.guide;
  });
}

/** 90/91 を名称で引ける形に読む。同じ名称が複数あれば件数を持っておく。 */
function buildMasterIndex_(person, company) {
  const index = { byName: {}, byId: {} };

  const read = function (sh, kubun, idHeader, nameHeaders, fields) {
    const map = headerMap_(sh);
    const name = sh.getName();
    const idColumn = col_(map, idHeader, name);
    const last = lastRowByColumn_(sh, idColumn);
    if (last < 2) return;
    const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    values.forEach(row => {
      const id = clean_(row[idColumn - 1]);
      if (!id) return;
      const snapshot = { kubun: kubun };
      Object.keys(fields).forEach(key => {
        const column = map[clean_(fields[key])];
        snapshot[key] = column ? clean_(row[column - 1]) : '';
      });
      index.byId[id] = snapshot;
      nameHeaders.forEach(header => {
        const column = map[clean_(header)];
        if (!column) return;
        const label = key_(row[column - 1]);
        if (!label) return;
        if (!index.byName[label]) index.byName[label] = [];
        if (!index.byName[label].some(item => item.id === id)) {
          index.byName[label].push({ id: id, kubun: kubun });
        }
      });
    });
  };

  read(person, '信者様', '信者ID', ['氏名', '案内宛名'], {
    postal: '郵便番号', address: '住所', building: '建物名',
    phone: '電話番号', honorific: '敬称', method: '案内方法'
  });
  read(company, '会社', '拠点ID', ['会社・法人・団体名', '案内状の宛名'], {
    postal: '郵便番号', address: '住所', building: '建物名',
    phone: '電話番号', honorific: '敬称', method: '案内方法'
  });
  return index;
}

function indexAdd_(index, label, kubun, id, snapshot) {
  const flat = key_(label);
  if (!flat) return;
  if (!index.byName[flat]) index.byName[flat] = [];
  index.byName[flat].push({ id: id, kubun: kubun });
  index.byId[id] = Object.assign({ kubun: kubun }, snapshot || {});
}

/** 名称で1件だけ見つかったときだけ結ぶ。同名が複数あるときは結ばない。 */
function indexFind_(index, label, kubun) {
  const found = index.byName[key_(label)] || [];
  const narrowed = kubun ? found.filter(item => item.kubun === kubun) : found;
  const list = narrowed.length ? narrowed : found;
  if (list.length === 1) return { id: list[0].id, kubun: list[0].kubun, many: 0 };
  return { id: '', kubun: '', many: list.length };
}

function buildPersonRecord_(row, idx, pending, index, seq) {
  const id = SHINSUN.ID.PERSON.prefix + String(seq.person++).padStart(SHINSUN.ID.PERSON.digits, '0');
  const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
  const inner = clean_(row[idx['代表者名（生）']]);
  const notes = [];
  if (inner && key_(inner) !== key_(label)) notes.push('内札欄の記載：' + inner);
  const source = clean_(row[idx['備考（生）']]);
  if (source) notes.push(source);

  const duplicate = indexFind_(index, label, '信者様');
  const values = {
    '信者ID': id,
    '氏名': label,
    '郵便番号': clean_(row[idx['郵便番号（生）']]),
    '住所': clean_(row[idx['住所（生）']]),
    '電話番号': clean_(row[idx['電話番号（生）']]),
    '案内宛名': label,
    '敬称': '様',
    '案内方法': '郵送',
    '翌年度案内状態': '継続',
    '職員メモ': notes.join('\n'),
    '登録日時': new Date()
  };
  pending.push(values);

  return {
    id: id,
    issue: duplicate.many ? '同じ名称が 90 に既にあります（' + duplicate.many + '件）。名寄せを確認してください' : '',
    snapshot: {
      postal: values['郵便番号'], address: values['住所'], building: '',
      phone: values['電話番号'], honorific: '様', method: '郵送'
    }
  };
}

function buildCompanyRecord_(row, idx, pending, index, seq) {
  const companyId = SHINSUN.ID.COMPANY.prefix + String(seq.company++).padStart(SHINSUN.ID.COMPANY.digits, '0');
  const siteId = companyId + '-' + String(1).padStart(SHINSUN.ID.SITE.digits, '0');
  const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
  const inner = clean_(row[idx['代表者名（生）']]);
  const notes = [];
  if (inner) notes.push('内札名義：' + inner + '（代表者名の可能性あり。確認してください）');
  const source = clean_(row[idx['備考（生）']]);
  if (source) notes.push(source);

  const duplicate = indexFind_(index, label, '会社');
  const values = {
    '会社ID': companyId,
    '拠点ID': siteId,
    '拠点区分': '本社',
    '会社・法人・団体名': label,
    '郵便番号': clean_(row[idx['郵便番号（生）']]),
    '住所': clean_(row[idx['住所（生）']]),
    '電話番号': clean_(row[idx['電話番号（生）']]),
    '案内状の宛名': label,
    '敬称': '御中',
    '内札の記載名': inner,
    '案内方法': '郵送',
    '翌年度案内状態': '継続',
    '職員メモ': notes.join('\n'),
    '登録日時': new Date()
  };
  pending.push(values);

  return {
    id: siteId,
    issue: duplicate.many ? '同じ名称が 91 に既にあります（' + duplicate.many + '件）。名寄せを確認してください' : '',
    snapshot: {
      postal: values['郵便番号'], address: values['住所'], building: '',
      phone: values['電話番号'], honorific: '御中', method: '郵送'
    }
  };
}

/** シートにある最大の通し番号の次を返す。以降はこの数を持ち回って増やす。 */
function nextSerial_(sh, idHeader, spec) {
  const next = nextSequentialId_(sh, idHeader, spec.prefix, spec.digits);
  return Number(next.slice(spec.prefix.length));
}

/** 移行元の年度表記を R7 の形にそろえる。西暦は 令和＝西暦−2018 で換算する。 */
function migrationYear_(yearValue, sheetName) {
  const raw = clean_(yearValue) || clean_(sheetName);
  if (!raw) return '';
  const western = raw.match(/^(20\d{2})$/);
  if (western) {
    const reiwa = Number(western[1]) - 2018;
    return reiwa >= 1 ? 'R' + reiwa : '';
  }
  const reiwa = raw.match(/^R(\d{1,2})$/i);
  if (reiwa) return 'R' + Number(reiwa[1]);
  return '';   // 「編集中」など、年度が決められないもの
}

function migrationRoute_(kind) {
  return /一般/.test(clean_(kind)) ? '新春一般' : '前札';
}

/** 生データに残した「読上げ順（仮）N」から番号を取り出す。ないときは空欄。 */
function yomiageOrder_(rawText) {
  // clean_ は NFKC 正規化で「（仮）」を「(仮)」に変えるため、括弧に依存しない形で拾う。
  const m = clean_(rawText).match(/読上げ順\D*(\d+)/);
  return m ? Number(m[1]) : '';
}

/** まとめて末尾へ足す。1行ずつ書かない。 */
function appendRows_(sh, pending, headers) {
  if (!pending.length) return;
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const idColumn = col_(map, headers[0], sh.getName());
  const start = Math.max(2, lastRowByColumn_(sh, idColumn) + 1);
  ensureSize_(sh, start + pending.length + 50, width);

  const body = pending.map(values => {
    const line = new Array(width).fill('');
    Object.keys(values).forEach(header => {
      const column = map[clean_(header)];
      if (column) line[column - 1] = safeSheetValue_(values[header]);
    });
    return line;
  });
  sh.getRange(start, 1, body.length, width).setValues(body);
}

/** 92 の過年度行を作る。年度ごとに通し番号を振る。 */
function appendGuideRows_(sh, pending, now) {
  if (!pending.length) return;
  const headers = SHINSUN.HEADERS.GUIDE;
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const idColumn = col_(map, '年度別案内ID', sh.getName());
  const start = Math.max(2, lastRowByColumn_(sh, idColumn) + 1);

  // 年度ごとの現在の最大番号を読む。
  const serial = {};
  if (start > 2) {
    sh.getRange(2, idColumn, start - 2, 1).getDisplayValues().forEach(row => {
      const m = clean_(row[0]).match(/^G-(R\d{2})-(\d+)$/);
      if (!m) return;
      serial[m[1]] = Math.max(serial[m[1]] || 0, Number(m[2]));
    });
  }

  ensureSize_(sh, start + pending.length + 50, width);
  const body = pending.map(item => {
    const yearKey = item.year.replace(/^R(\d+)$/, (all, n) => 'R' + String(Number(n)).padStart(2, '0'));
    serial[yearKey] = (serial[yearKey] || 0) + 1;
    const values = {
      '年度別案内ID': 'G-' + yearKey + '-' + String(serial[yearKey]).padStart(4, '0'),
      '年度': item.year,
      '対象区分': item.kubun,
      '対象ID': item.targetId,
      '案内ルート': item.route,
      '案内宛名': item.label,
      '郵便番号': item.postal,
      '住所': item.address,
      '建物名': item.building,
      '敬称': item.honorific,
      '電話番号': item.phone,
      '案内方法': item.method,
      '案内状の種類': '',
      '案内状態': '（過去実績）',
      '返答状態': '申込済',
      '前年度申込有無': '',
      '要確認': item.issue,
      '読上げ順': item.order,
      '移行元ID': item.migrationId,
      '作成日時': now
    };
    const line = new Array(width).fill('');
    headers.forEach(header => {
      const column = map[clean_(header)];
      if (column && header in values) line[column - 1] = safeSheetValue_(values[header]);
    });
    return line;
  });
  sh.getRange(start, 1, body.length, width).setValues(body);
}
