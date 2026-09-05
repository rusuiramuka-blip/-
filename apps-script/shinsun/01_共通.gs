/**
 * 新春祈願受付管理｜01_共通
 *
 * 列は必ず見出し名から解決する。固定列番号は使わない。
 * 設定とマスタは1回の実行中だけキャッシュし、書き換えたら捨てる。
 */

/** 1回の実行中だけ有効な読み取りキャッシュ。 */
const SHINSUN_CACHE = {};

function resetShinsunCache_() {
  Object.keys(SHINSUN_CACHE).forEach(key => { delete SHINSUN_CACHE[key]; });
}

/* ── 文字列 ───────────────────────────────────────────── */

function clean_(value) {
  return String(value == null ? '' : value)
    .normalize('NFKC').replace(/[\r\n]+/g, ' ').trim();
}

/** 氏名・会社名の照合キー。空白を落として小文字化する。 */
function key_(value) {
  return clean_(value).replace(/[\s　]/g, '').toLowerCase();
}

function cleanMultiline_(value) {
  return String(value == null ? '' : value)
    .normalize('NFKC').replace(/\r\n?/g, '\n')
    .split('\n').map(line => line.trim()).filter(Boolean).join('\n');
}

/** フォームや外部台帳から来た「=IMPORTRANGE(...)」を数式として実行させない。 */
function safeSheetValue_(value) {
  if (typeof value !== 'string') return value;
  return /^[=+@-]/.test(value) ? "'" + value : value;
}

function formatYen_(value) {
  return Number(value || 0).toLocaleString('ja-JP') + '円';
}

/* ── シートと列 ───────────────────────────────────────── */

function shinsunSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('必要なシート「' + name + '」がありません。「設定状態を確認」の結果を管理担当者へお知らせください。');
  return sh;
}

/**
 * 1行目の見出しから {見出し名: 列番号} を作る。
 * 同じ見出しが2つあれば例外にする（どちらを読むか決められないため）。
 */
function headerMap_(sh) {
  const cacheKey = 'header|' + sh.getParent().getId() + '|' + sh.getName();
  if (SHINSUN_CACHE[cacheKey]) return SHINSUN_CACHE[cacheKey];

  const width = sh.getLastColumn();
  if (width < 1) throw new Error('シート「' + sh.getName() + '」に見出しがありません。');
  const row = sh.getRange(1, 1, 1, width).getDisplayValues()[0];

  const map = {};
  const duplicated = [];
  row.forEach((value, index) => {
    const name = clean_(value);
    if (!name) return;
    if (Object.prototype.hasOwnProperty.call(map, name)) duplicated.push(name);
    else map[name] = index + 1;
  });
  if (duplicated.length) {
    throw new Error('シート「' + sh.getName() + '」に同じ見出しが複数あります：' + [...new Set(duplicated)].join('、'));
  }
  SHINSUN_CACHE[cacheKey] = map;
  return map;
}

function col_(map, name, sheetName) {
  // map のキーは clean_ 済み。引数も同じ正規化を通してから引く。
  // clean_ は NFKC 正規化を含むため、全角括弧などが片側だけ残ると一致しなくなる。
  const column = map[clean_(name)];
  if (!column) {
    throw new Error('見出し「' + name + '」が' + (sheetName ? 'シート「' + sheetName + '」に' : '') + 'ありません。');
  }
  return column;
}

/** 見出しが期待どおり並んでいるか（順序も含めて）確認する。 */
function headersMatch_(sh, headers) {
  if (!sh || sh.getLastColumn() < headers.length) return false;
  const current = sh.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  return current.every((value, index) => clean_(value) === clean_(headers[index]));
}

/** 指定列の、値が入っている最終行。空行を挟んでも正しく返す。 */
function lastRowByColumn_(sh, column) {
  if (!sh || sh.getMaxRows() < 2) return 1;
  const values = sh.getRange(2, column, sh.getMaxRows() - 1, 1).getDisplayValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (clean_(values[i][0])) return i + 2;
  }
  return 1;
}

/** シート全体を {headers, map, rows} で一括読み取りする。1行ずつ読まない。 */
function readTable_(sh) {
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const last = sh.getLastRow();
  const rows = last >= 2 ? sh.getRange(2, 1, last - 1, width).getValues() : [];
  return { map: map, width: width, rows: rows, firstRow: 2 };
}

/**
 * ID列の空欄を探して1行だけ確保し、見出し名で値を書き込む。
 * 空きがなければ末尾に1行足し、書式と入力規則を引き継ぐ。
 */
function writeRowByHeader_(sh, idHeader, values) {
  const map = headerMap_(sh);
  const idColumn = col_(map, idHeader, sh.getName());
  const maxRows = sh.getMaxRows();
  const ids = maxRows >= 2 ? sh.getRange(2, idColumn, maxRows - 1, 1).getDisplayValues() : [];
  const emptyIndex = ids.findIndex(row => clean_(row[0]) === '');

  let target;
  if (emptyIndex >= 0) {
    target = emptyIndex + 2;
  } else {
    sh.insertRowAfter(maxRows);
    target = maxRows + 1;
    if (maxRows >= 2) {
      const width = sh.getMaxColumns();
      const source = sh.getRange(maxRows, 1, 1, width);
      const dest = sh.getRange(target, 1, 1, width);
      source.copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
      source.copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    }
  }

  Object.keys(values).forEach(name => {
    const column = map[clean_(name)];
    if (!column) return;
    sh.getRange(target, column).setValue(safeSheetValue_(values[name]));
  });
  return target;
}

/* ── ID 採番 ──────────────────────────────────────────── */

/**
 * 連番IDを1つ発行する。
 * 採番と書込みを同じロックの中で行うため、呼び出し側でロックを取ること。
 */
function nextSequentialId_(sh, idHeader, prefix, digits) {
  const map = headerMap_(sh);
  const idColumn = col_(map, idHeader, sh.getName());
  const last = lastRowByColumn_(sh, idColumn);
  let max = 0;
  if (last >= 2) {
    sh.getRange(2, idColumn, last - 1, 1).getDisplayValues().forEach(row => {
      const m = clean_(row[0]).match(new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$'));
      if (m) max = Math.max(max, Number(m[1]));
    });
  }
  return prefix + String(max + 1).padStart(digits, '0');
}

/** 会社IDの下に拠点IDを採番する。C-0001 → C-0001-01 */
function nextSiteId_(sh, companyId) {
  const map = headerMap_(sh);
  const companyColumn = col_(map, '会社ID', sh.getName());
  const siteColumn = col_(map, '拠点ID', sh.getName());
  const last = Math.max(lastRowByColumn_(sh, companyColumn), lastRowByColumn_(sh, siteColumn));
  let max = 0;
  if (last >= 2) {
    const width = Math.max(companyColumn, siteColumn);
    sh.getRange(2, 1, last - 1, width).getDisplayValues().forEach(row => {
      if (clean_(row[companyColumn - 1]) !== clean_(companyId)) return;
      const m = clean_(row[siteColumn - 1]).match(/-(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
  }
  return companyId + '-' + String(max + 1).padStart(SHINSUN.ID.SITE.digits, '0');
}

/** 採番と書込みをまとめてロックの中で行う。 */
function withScriptLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/* ── 設定とマスタ ─────────────────────────────────────── */

/** 99_設定 を {設定項目: 値} で読む。実行中はキャッシュする。 */
function getShinsunConfig_(ss) {
  if (SHINSUN_CACHE.config) return SHINSUN_CACHE.config;
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.CONFIG);
  const last = lastRowByColumn_(sh, 1);
  const config = {};
  const duplicated = [];
  if (last >= 2) {
    sh.getRange(2, 1, last - 1, 2).getValues().forEach(row => {
      const name = clean_(row[0]);
      if (!name) return;
      if (Object.prototype.hasOwnProperty.call(config, name)) duplicated.push(name);
      config[name] = row[1];
    });
  }
  if (duplicated.length) {
    throw new Error('99_設定 に重複した設定項目があります：' + [...new Set(duplicated)].join('、'));
  }
  SHINSUN_CACHE.config = config;
  return config;
}

function resetShinsunConfigCache_() {
  delete SHINSUN_CACHE.config;
}

/**
 * 設定値を引く。
 * getShinsunConfig_ のキーは clean_ 済みなので、引数も同じ正規化を通す。
 * 「西暦（現在年度）」「枠の刻み（分）」のように全角括弧を含む項目名は、
 * 正規化しないと片側が半角になって一致しない。
 */
function configValue_(config, name) {
  return config[clean_(name)];
}

function hasConfig_(config, name) {
  return Object.prototype.hasOwnProperty.call(config, clean_(name));
}

function asBoolean_(value) {
  return value === true || ['true', 'yes', '1', '有効'].includes(clean_(value).toLowerCase());
}

/** 98_マスター を {区分: [{値, 金額, 備考}]} で読む。有効=FALSE の行は除く。 */
function getShinsunMaster_(ss) {
  if (SHINSUN_CACHE.master) return SHINSUN_CACHE.master;
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.MASTER);
  const table = readTable_(sh);
  const map = table.map;
  const iGroup = col_(map, '区分', sh.getName()) - 1;
  const iValue = col_(map, '値', sh.getName()) - 1;
  const iAmount = col_(map, '金額', sh.getName()) - 1;
  const iOrder = col_(map, '表示順', sh.getName()) - 1;
  const iActive = col_(map, '有効', sh.getName()) - 1;
  const iNote = col_(map, '備考', sh.getName()) - 1;

  const master = {};
  table.rows.forEach(row => {
    const group = clean_(row[iGroup]);
    const value = clean_(row[iValue]);
    if (!group || !value) return;
    if (row[iActive] === false) return;
    if (!master[group]) master[group] = [];
    master[group].push({
      value: value,
      amount: row[iAmount] === '' ? null : Number(row[iAmount]),
      order: Number(row[iOrder]) || 0,
      note: clean_(row[iNote])
    });
  });
  Object.keys(master).forEach(group => master[group].sort((a, b) => a.order - b.order));
  SHINSUN_CACHE.master = master;
  return master;
}

function masterValues_(ss, group) {
  return (getShinsunMaster_(ss)[group] || []).map(item => item.value);
}

/** 祈願札区分から金額を引く。見つからなければ 0。 */
function feeOf_(ss, fudaClass) {
  const hit = (getShinsunMaster_(ss)['祈願札区分'] || [])
    .find(item => key_(item.value) === key_(fudaClass));
  return hit && Number.isFinite(hit.amount) ? hit.amount : 0;
}

function resetShinsunMasterCache_() {
  delete SHINSUN_CACHE.master;
}

/* ── 操作ログ ─────────────────────────────────────────── */

/** 99_設定・操作ログ の右側（E列以降）へ追記する。 */
function logShinsun_(ss, action, target, count, note) {
  try {
    const sh = ss.getSheetByName(SHINSUN.SHEETS.CONFIG);
    if (!sh) return;
    const logStart = 5; // E列
    const last = lastRowByColumn_(sh, logStart);
    const row = Math.max(2, last + 1);
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), row - sh.getMaxRows());
    sh.getRange(row, logStart, 1, SHINSUN.HEADERS.LOG.length).setValues([[
      new Date(), currentUserLabel_(), clean_(action), clean_(target),
      Number(count) || 0, clean_(note)
    ]]);
  } catch (error) {
    // ログが書けなくても本処理は止めない。
  }
}

function currentUserLabel_() {
  try {
    const email = clean_(Session.getActiveUser().getEmail());
    if (email) return email;
  } catch (error) {
    // 実行環境によって取得できない。
  }
  return '職員（メール取得不可）';
}

function toast_(ss, message, seconds) {
  try {
    ss.toast(message, '新春祈願受付', seconds || 6);
  } catch (error) {
    // トーストが出せない環境でも処理は続ける。
  }
}
