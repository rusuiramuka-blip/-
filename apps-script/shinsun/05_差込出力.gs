/**
 * 祈願・案内管理｜05_差込出力（段階5）
 *
 * 92_年度別案内対象 の今年度の行から、宛名印刷用のデータを書き出す。
 * 長3封筒の宛名を筆ぐるめで印刷し、中に案内文を入れる想定。
 *
 * 決めごと（お伺いした内容のとおり）
 *   1. 筆ぐるめ に取り込む。列名は 氏名／敬称／郵便番号／住所1／住所2／電話番号。
 *   2. 案内ルートごとに分ける。さらに「昨年申込済み」「新規」で分ける（文面が違うため）。
 *   3. 前年の祈願者名を1つのセルに改行で並べる。
 *   4. 願意も入れる。
 *
 * 願意について。
 *   楽まる寺務のエクスポート（Q101_申込一覧_エクセル・30列）には
 *   願意・金額・祈願日・入金の列がない。そのため令和8年の願意は空欄になる。
 *   列だけ用意してあるので、
 *     ・楽まる寺務のクエリに願意の列を足して出し直す
 *     ・段階6で 94_祈願・御札明細 ができる
 *   のどちらかで埋まる。前者を選ぶ場合は取り込みを別に足す。
 *
 * 出力は「差込_」で始まる作業用シート。印刷が終わったら
 * deleteShinsunMergeSheets で片づけてよい。何度でも作り直せる。
 * 92 は読むだけ。書き換えるのは markShinsunGuidePrinted を実行したときだけ。
 *
 * 管理者が Apps Script エディタから実行する。
 */

/*
 * 書き出し先のシート名の頭。
 * 00_定数 ではなくここに置いているのは、印刷が終われば消す作業用シートで、
 * 台帳の構成には入らないため。
 */
const SHINSUN_MERGE_PREFIX = '差込_';

/** 住所がなくて出せない行を集めるシート。 */
const SHINSUN_MERGE_ISSUE_SHEET = '差込_要確認';


/* ── 段階5の初期設定 ──────────────────────────────────── */

/**
 * 99_設定 へ段階5の項目を足す。既にある値は上書きしない。
 * シートは作らない。書き出しは exportShinsunMergeData が行う。
 */
function setupShinsunStage5() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    ensureStage5Config_(ss);
    resetShinsunCache_();
    logShinsun_(ss, '初期設定（段階5）', '99_設定', 1, SHINSUN.VERSION);
    toast_(ss, '段階5の設定を足しました。次に exportShinsunMergeData を実行してください。', 12);
    return true;
  });
}

function ensureStage5Config_(ss) {
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.CONFIG);
  const items = [
    ['差込に含める案内方法', '郵送、手渡し',
     'この案内方法の行だけ書き出す。読点で複数指定。メールは段階9で別に送る'],
    ['差込の並び順', '郵便番号',
     '郵便番号／読上げ順／案内宛名 のいずれか'],
    ['郵便番号のハイフン', 'つける',
     'つける＝123-4567／つけない＝1234567。筆ぐるめの取り込みに合わせる']
  ];
  items.forEach(item => {
    if (findConfigRow_(sh, item[0])) return;
    const row = Math.max(2, lastRowByColumn_(sh, 1) + 1);
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), row - sh.getMaxRows());
    sh.getRange(row, 1, 1, 3).setValues([item]);
  });
  resetShinsunConfigCache_();
}


/* ── 差込データの書き出し ─────────────────────────────── */

/** 書き出す列。先頭6列が筆ぐるめの宛名、そのあとが案内文の差込に使う項目。 */
function mergeHeaders_() {
  return [
    '氏名', '敬称', '郵便番号', '住所1', '住所2', '電話番号',
    '行事', '案内ルート', '案内状の種類', '前年度申込有無',
    '前年の件数', '前年の祈願者名', '前年の願意',
    '連続未申込年数', '年度別案内ID', '対象区分', '対象ID', '要確認'
  ];
}

/**
 * 今年度の案内対象を、案内ルート×案内状の種類ごとのシートへ書き出す。
 *
 * 住所が空欄で出せない行は 差込_要確認 へまとめる。捨てない。
 * 何度実行してもよい。作業用シートは毎回作り直す。
 */
function exportShinsunMergeData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    ensureStage5Config_(ss);
    const config = getShinsunConfig_(ss);
    const yearLabel = clean_(configValue_(config, '現在年度'));
    const yearNum = reiwaNumber_(yearLabel);
    if (!yearNum) {
      throw new Error('99_設定 の「現在年度」が「R9」の形になっていません：' + (yearLabel || '（空欄）'));
    }

    const methods = clean_(configValue_(config, '差込に含める案内方法'))
      .split(/[、,]/).map(key_).filter(Boolean);
    const order = clean_(configValue_(config, '差込の並び順')) || '郵便番号';
    const hyphen = clean_(configValue_(config, '郵便番号のハイフン')) !== 'つけない';

    // 前年の祈願者名と願意。今は 97_移行作業 から読む（段階6で 94 に移る）。
    const prior = readPriorDetails_(ss, yearNum - 1);

    const sh = shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE);
    const map = headerMap_(sh);
    const name = sh.getName();
    const last = lastRowByColumn_(sh, col_(map, '年度別案内ID', name));
    if (last < 2) throw new Error('92_年度別案内対象 に行がありません。');

    const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    const at = header => col_(map, header, name) - 1;
    const idx = {
      id: at('年度別案内ID'), year: at('年度'), event: at('行事'),
      kubun: at('対象区分'), target: at('対象ID'), route: at('案内ルート'),
      label: at('案内宛名'), postal: at('郵便番号'), address: at('住所'),
      building: at('建物名'), honorific: at('敬称'), phone: at('電話番号'),
      method: at('案内方法'), kind: at('案内状の種類'), state: at('案内状態'),
      applied: at('前年度申込有無'), misses: at('連続未申込年数'),
      issue: at('要確認'), order: at('読上げ順')
    };

    const groups = {};        // シート名 → 行の配列
    const issues = [];        // 住所がなくて出せない行
    const report = { year: yearLabel, groups: [], skipped: {}, issues: 0, total: 0 };
    const skip = function (reason) {
      report.skipped[reason] = (report.skipped[reason] || 0) + 1;
    };

    values.forEach(row => {
      if (reiwaNumber_(row[idx.year]) !== yearNum) return;
      const state = label_(row[idx.state]);
      if (key_(state) === key_('（過去実績）')) return;
      if (key_(state) === key_('案内不要')) { skip('案内状態が「案内不要」'); return; }

      const method = label_(row[idx.method]);
      if (methods.length && methods.indexOf(key_(method)) < 0) {
        skip('案内方法が「' + (method || '空欄') + '」');
        return;
      }

      const route = label_(row[idx.route]);
      const kind = label_(row[idx.kind]);
      const targetId = clean_(row[idx.target]);
      const detail = prior[targetId + '|' + key_(route)] || [];

      // 封筒に刷る値は寺院の書き方のまま。clean_ は「（株）」を「(株)」に変える。
      const line = {
        '氏名': label_(row[idx.label]),
        '敬称': label_(row[idx.honorific]),
        '郵便番号': formatPostal_(row[idx.postal], hyphen),
        '住所1': label_(row[idx.address]),
        '住所2': label_(row[idx.building]),
        '電話番号': label_(row[idx.phone]),
        '行事': label_(row[idx.event]),
        '案内ルート': route,
        '案内状の種類': kind,
        '前年度申込有無': label_(row[idx.applied]),
        '前年の件数': detail.length || '',
        '前年の祈願者名': detail.map(item => item.name).filter(Boolean).join('\n'),
        '前年の願意': detail.map(item => item.gani).filter(Boolean).join('\n'),
        '連続未申込年数': row[idx.misses],
        '年度別案内ID': clean_(row[idx.id]),
        '対象区分': label_(row[idx.kubun]),
        '対象ID': targetId,
        '要確認': cleanMultiline_(row[idx.issue]),
        _order: row[idx.order]
      };
      report.total += 1;

      // 宛名として成り立たない行は分けて出す。黙って落とさない。
      const missing = [];
      if (!line['氏名']) missing.push('案内宛名');
      if (!line['住所1']) missing.push('住所');
      if (missing.length) {
        line['要確認'] = noteOnce_(line['要確認'],
          missing.join('と') + 'が空欄です。92 で埋めてから出し直してください');
        issues.push(line);
        report.issues += 1;
        return;
      }

      const sheetName = mergeSheetName_(route, kind);
      if (!groups[sheetName]) groups[sheetName] = [];
      groups[sheetName].push(line);
    });

    deleteShinsunMergeSheets_(ss);

    const headers = mergeHeaders_();
    Object.keys(groups).sort().forEach(sheetName => {
      const rows = sortMergeRows_(groups[sheetName], order);
      buildMergeSheet_(ss, sheetName, headers, rows);
      report.groups.push({ name: sheetName, count: rows.length });
    });
    if (issues.length) {
      buildMergeSheet_(ss, SHINSUN_MERGE_ISSUE_SHEET, headers, sortMergeRows_(issues, order));
    }

    resetShinsunCache_();
    logShinsun_(ss, '差込データの書き出し', yearLabel, report.total, order);
    showMergeReport_(ss, report);
    return report.total;
  });
}

/**
 * シート名。案内ルートと案内状の種類から作る。
 * カッコは名前が長くなるだけなので落とす。
 *   暑中見舞（一般） × 新規（昨年未申込） → 差込_暑中見舞一般_新規
 */
function mergeSheetName_(route, kind) {
  const short = String(route || '未設定').replace(/[（）()]/g, '');
  let tail = '';
  if (/新規/.test(kind)) tail = '_新規';
  else if (/昨年/.test(kind)) tail = '_昨年';
  else if (clean_(kind)) tail = '_' + String(kind).replace(/[（）()]/g, '');
  return SHINSUN_MERGE_PREFIX + short + tail;
}

function sortMergeRows_(rows, order) {
  const copy = rows.slice();
  if (order === '読上げ順') {
    copy.sort((a, b) => {
      const x = Number(a._order), y = Number(b._order);
      const ax = Number.isFinite(x) && a._order !== '' ? x : Infinity;
      const by = Number.isFinite(y) && b._order !== '' ? y : Infinity;
      if (ax !== by) return ax - by;
      return String(a['氏名']).localeCompare(String(b['氏名']), 'ja');
    });
    return copy;
  }
  if (order === '案内宛名') {
    copy.sort((a, b) => String(a['氏名']).localeCompare(String(b['氏名']), 'ja'));
    return copy;
  }
  // 既定は郵便番号順。まとめて差し出すときに区分けしやすい。
  copy.sort((a, b) => {
    const ax = String(a['郵便番号']), by = String(b['郵便番号']);
    if (ax !== by) return ax < by ? -1 : 1;
    return String(a['氏名']).localeCompare(String(b['氏名']), 'ja');
  });
  return copy;
}

function buildMergeSheet_(ss, sheetName, headers, rows) {
  const sh = sheetOf_(ss, sheetName);
  sh.clear();
  sh.clearNotes();
  ensureSize_(sh, Math.max(rows.length + 10, 50), headers.length);
  writeHeaders_(sh, headers, 1, '#5b3a29');

  if (rows.length) {
    const body = rows.map(line => headers.map(header => safeSheetValue_(line[header])));
    sh.getRange(2, 1, body.length, headers.length).setValues(body);
  }

  const width = sh.getMaxRows() - 1;
  // 列は見出し名から解決する。列の順番を変えても直さなくてよい。
  const columnOf = header => headers.indexOf(header) + 1;
  // 郵便番号と電話番号は文字列のまま。頭の 0 を落とさない。
  ['郵便番号', '電話番号'].forEach(header => {
    const column = columnOf(header);
    if (column) sh.getRange(2, column, width, 1).setNumberFormat('@');
  });
  ['前年の祈願者名', '前年の願意', '要確認'].forEach(header => {
    const column = columnOf(header);
    if (column) sh.getRange(2, column, width, 1).setWrap(true).setVerticalAlignment('top');
  });
  [180, 60, 100, 260, 160, 130,
   70, 110, 150, 90,
   80, 260, 200,
   90, 130, 80, 100, 260]
    .forEach((size, i) => { if (i < headers.length) sh.setColumnWidth(i + 1, size); });
  sh.setFrozenRows(1);
  sh.getRange(1, 1).setNote(
    '筆ぐるめへ取り込む作業用シートです。左から6列が長3封筒の宛名、そのあとが案内文の差込項目です。\n' +
    'ここを直しても 92_年度別案内対象 には戻りません。直すのは 92 のほうで、そのあと書き出し直してください。\n' +
    '印刷が終わったら deleteShinsunMergeSheets で消せます。'
  );
  return sh;
}

/** 郵便番号を 123-4567 の形にそろえる。7桁でないときはそのまま返す。 */
function formatPostal_(value, hyphen) {
  const digits = clean_(value).replace(/[^0-9]/g, '');
  if (digits.length !== 7) return clean_(value);
  return hyphen ? digits.slice(0, 3) + '-' + digits.slice(3) : digits;
}


/* ── 前年の祈願者名と願意 ─────────────────────────────── */

/**
 * 前年の祈願者名と願意を {対象ID|ルート: [{name, gani, order}]} で読む。
 *
 * いまの出どころは 97_移行作業。
 *   申込者の行 … 外部整理番号 と 対象ID を持つ
 *   祈願者の行 … 同じ外部整理番号を持ち、名称（生）が札に書く名前
 * この2つを 移行元＋外部整理番号 で結ぶ。整理番号はファイルをまたぐと
 * 別番号になるため、移行元も鍵に入れないと前札と新春一般が混ざる。
 *
 * 段階6で 94_祈願・御札明細 ができたら、そちらから読むように差し替える。
 * 楽まる寺務のエクスポートに願意の列がないため、令和8年の願意は空欄になる。
 */
function readPriorDetails_(ss, prevYearNum) {
  const bag = {};
  const sh = ss.getSheetByName(SHINSUN.SHEETS.MIGRATION);
  if (!sh || prevYearNum <= 0) return bag;

  const map = headerMap_(sh);
  const name = sh.getName();
  const last = lastRowByColumn_(sh, col_(map, '移行ID', name));
  if (last < 2) return bag;

  // 移行元の名前から案内ルートを引く。00_定数 の移行元の定義をそのまま使う。
  const routeOf = {};
  SHINSUN.MIGRATION_SOURCES.forEach(source => {
    if (!source.route) return;
    routeOf[key_(source.label)] = source.route;
  });

  const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  const at = header => col_(map, header, name) - 1;
  const iSource = at('移行元');
  const iKind = at('種別');
  const iYear = at('年度');
  const iSerial = at('外部整理番号');
  const iTarget = at('対象ID');
  const iName = at('名称（生）');
  const iGani = at('願意（生）');
  const iDetail = at('明細番号');

  const owners = {};        // 移行元|整理番号 → 対象ID
  const details = {};       // 移行元|整理番号 → [{name, gani, order}]

  values.forEach(row => {
    if (reiwaNumber_(row[iYear]) !== prevYearNum) return;
    const serial = clean_(row[iSerial]);
    if (!serial) return;
    const source = clean_(row[iSource]);
    const pairKey = key_(source) + '|' + serial;
    const kind = clean_(row[iKind]);

    if (/申込者/.test(kind)) {
      const targetId = clean_(row[iTarget]);
      if (targetId) owners[pairKey] = targetId;
      return;
    }
    if (!/祈願者/.test(kind)) return;

    if (!details[pairKey]) details[pairKey] = [];
    details[pairKey].push({
      name: clean_(row[iName]),
      gani: clean_(row[iGani]),
      order: Number(row[iDetail]) || 0
    });
  });

  Object.keys(details).forEach(pairKey => {
    const targetId = owners[pairKey];
    if (!targetId) return;                       // 対象IDが決まっていない申込は結べない
    const source = pairKey.split('|')[0];
    const route = routeOf[source];
    if (!route) return;
    const bagKey = targetId + '|' + key_(route);
    if (!bag[bagKey]) bag[bagKey] = [];
    details[pairKey].forEach(item => bag[bagKey].push(item));
  });

  // 元資料の申込番号の順に並べる。札を作る順と合わせるため。
  Object.keys(bag).forEach(bagKey => {
    bag[bagKey].sort((a, b) => a.order - b.order);
  });
  return bag;
}


/* ── 印刷したあと ─────────────────────────────────────── */

/**
 * 書き出したシートに載っている行を、92 で「印刷済」にして案内日を入れる。
 *
 * 対象は 差込_ で始まるシートに実際に出た 年度別案内ID だけ。
 * 差込_要確認 は印刷していないので対象にしない。
 * 既に印刷済・郵送済などになっている行は触らない。
 */
function markShinsunGuidePrinted() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const printed = {};
    let sheets = 0;
    ss.getSheets().forEach(sh => {
      const sheetName = sh.getName();
      if (sheetName.indexOf(SHINSUN_MERGE_PREFIX) !== 0) return;
      if (sheetName === SHINSUN_MERGE_ISSUE_SHEET) return;
      const map = headerMap_(sh);
      const column = map[clean_('年度別案内ID')];
      if (!column) return;
      sheets += 1;
      const last = lastRowByColumn_(sh, column);
      if (last < 2) return;
      sh.getRange(2, column, last - 1, 1).getDisplayValues().forEach(row => {
        const id = clean_(row[0]);
        if (id) printed[id] = true;
      });
    });
    if (!sheets) {
      throw new Error('差込_ で始まるシートがありません。先に exportShinsunMergeData を実行してください。');
    }

    const guide = shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE);
    const map = headerMap_(guide);
    const name = guide.getName();
    const iId = col_(map, '年度別案内ID', name);
    const iState = col_(map, '案内状態', name);
    const iDate = col_(map, '案内日', name);
    const last = lastRowByColumn_(guide, iId);
    if (last < 2) return 0;

    const state = pickAllowed_(masterValues_(ss, '案内状態'), '印刷済', '');
    if (!state) throw new Error('98_マスター の「案内状態」に「印刷済」がありません。');

    const ids = guide.getRange(2, iId, last - 1, 1).getDisplayValues();
    const states = guide.getRange(2, iState, last - 1, 1).getValues();
    const dates = guide.getRange(2, iDate, last - 1, 1).getValues();
    const today = new Date();
    let changed = 0;
    ids.forEach((row, i) => {
      if (!printed[clean_(row[0])]) return;
      // 案内予定のままの行だけ進める。郵送済などを巻き戻さない。
      if (key_(states[i][0]) !== key_('案内予定')) return;
      states[i][0] = state;
      dates[i][0] = today;
      changed += 1;
    });
    if (changed) {
      guide.getRange(2, iState, last - 1, 1).setValues(states);
      guide.getRange(2, iDate, last - 1, 1).setValues(dates);
    }

    resetShinsunCache_();
    logShinsun_(ss, '印刷済みにする', SHINSUN.SHEETS.GUIDE, changed, '');
    const text = '■ 印刷済みにしました\n'
      + '　差込シート：' + sheets + '枚\n'
      + '　92 を「印刷済」にした行：' + changed + '件\n'
      + '　案内日：' + Utilities.formatDate(today, SHINSUN.TIMEZONE, 'yyyy/MM/dd');
    try {
      SpreadsheetApp.getUi().alert('印刷済みにする', text, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (err) {
      Logger.log(text);
    }
    return changed;
  });
}

/** 差込_ で始まる作業用シートを消す。92 には触らない。 */
function deleteShinsunMergeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    const removed = deleteShinsunMergeSheets_(ss);
    logShinsun_(ss, '差込シートの片づけ', SHINSUN_MERGE_PREFIX + '*', removed, '');
    toast_(ss, '差込シートを ' + removed + '枚 片づけました。', 8);
    return removed;
  });
}

function deleteShinsunMergeSheets_(ss) {
  let removed = 0;
  ss.getSheets().forEach(sh => {
    if (sh.getName().indexOf(SHINSUN_MERGE_PREFIX) !== 0) return;
    // 最後の1枚は消せない。ふつうは 92 などが残っているのでここには来ない。
    if (ss.getSheets().length <= 1) return;
    ss.deleteSheet(sh);
    removed += 1;
  });
  return removed;
}


/* ── 結果の表示と確認 ─────────────────────────────────── */

function showMergeReport_(ss, report) {
  const lines = [];
  lines.push('■ 差込データの書き出し（' + report.year + '）');
  lines.push('　対象の行：' + report.total + '件');
  lines.push('');
  lines.push('■ 書き出したシート');
  if (report.groups.length) {
    report.groups.forEach(item => lines.push('　' + item.name + '：' + item.count + '件'));
  } else {
    lines.push('　ありません');
  }
  if (report.issues) {
    lines.push('');
    lines.push('■ ' + SHINSUN_MERGE_ISSUE_SHEET + '：' + report.issues + '件');
    lines.push('　宛名か住所が空欄で出せなかった行です。');
    lines.push('　92_年度別案内対象 で埋めてから、もう一度書き出してください。');
  }
  const skipped = Object.keys(report.skipped);
  if (skipped.length) {
    lines.push('');
    lines.push('■ 書き出さなかった行');
    skipped.sort().forEach(reason => lines.push('　' + reason + '：' + report.skipped[reason]));
  }
  lines.push('');
  lines.push('※ 前年の願意は、楽まる寺務のエクスポートに列がないため空欄です。');
  lines.push('　祈願者名は出ています。');

  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('差込データの書き出し', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}

/** 書き出したシートの状態を見る。書き換えはしない。 */
function checkShinsunMerge() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetShinsunCache_();
  const lines = ['■ 差込シート'];
  let total = 0, sheets = 0;
  ss.getSheets().forEach(sh => {
    const sheetName = sh.getName();
    if (sheetName.indexOf(SHINSUN_MERGE_PREFIX) !== 0) return;
    sheets += 1;
    const map = headerMap_(sh);
    const column = map[clean_('年度別案内ID')];
    const count = column ? Math.max(0, lastRowByColumn_(sh, column) - 1) : 0;
    if (sheetName !== SHINSUN_MERGE_ISSUE_SHEET) total += count;
    lines.push('　' + sheetName + '：' + count + '件');
  });
  if (!sheets) lines.push('　ありません。exportShinsunMergeData を実行してください。');
  else {
    lines.push('');
    lines.push('　印刷する合計（要確認を除く）：' + total + '件');
  }

  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('差込シートの状況', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}
