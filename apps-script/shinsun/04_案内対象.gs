/**
 * 新春祈願受付管理｜04_案内対象（段階4）
 *
 * 90_信者様マスター／91_会社マスター から、今年度の案内対象を
 * 92_年度別案内対象 へ作る。あわせて 01_今年度案内・受付一覧 を用意する。
 *
 * 決めごと（お伺いした内容のとおり）
 *   1. 行事ごとに別々の行を作る（新春・節分・暑中見舞）。
 *   2. 翌年度案内状態が「継続」の方が対象。
 *      前年に申込みがなかったことだけを理由に外すことはしない。
 *      外れるのは、辞退・死亡・転居不明・廃業・重複などの理由が入った方だけ。
 *   3. 「昨年申込済み／新規」は、前年度の同じ行事の実績で分ける。
 *
 * どの行事に案内を出すかは 99_設定 の「案内対象の範囲」で切り替える。
 *   実績のある行事のみ … その行事の実績が 92 に1年でもある方だけ（既定）
 *   継続の方全員       … 継続の方すべてに、すべての行事の行を作る
 * 既定を「実績のある行事のみ」にしたのは、節分の実績がない方まで
 * 節分の案内対象に入ってしまうのを避けるため。範囲を広げたいときは
 * 99_設定 の値を「継続の方全員」に変えて、もう一度実行してください。
 *
 * 触るのは 92 への追記だけ。既にある行は書き換えない。
 * 案内状態が「（過去実績）」の行（移行で入れた過年度の行）は決して触らない。
 * 何度実行しても、同じ 年度×行事×対象 の行が二重にできることはない。
 *
 * 管理者が Apps Script エディタから実行する。日常メニューには出さない。
 */

/* ── 段階4の初期設定 ──────────────────────────────────── */

/**
 * 92 の入力規則を貼り直し、01_今年度案内・受付一覧 を作る。
 * 98_マスター へ「案内状の種類」を足す（既にある値は上書きしない）。
 */
function setupShinsunStage4() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    buildMasterSheet_(ss);      // 案内状の種類 を足す
    buildChoicesSheet_(ss);
    buildConfigSheet_(ss);      // 案内対象の範囲 を足す
    resetShinsunCache_();
    buildGuideSheet_(ss);       // 92 の入力規則に「案内状の種類」を付ける
    const sh = buildGuideListSheet_(ss);
    orderStage4Sheets_(ss);
    resetShinsunCache_();
    logShinsun_(ss, '初期設定（段階4）', SHINSUN.SHEETS.GUIDE_LIST, 1, SHINSUN.VERSION);
    toast_(ss, '01_今年度案内・受付一覧 を作りました。次に generateShinsunGuideTargets を実行してください。', 12);
    return sh.getName();
  });
}

/**
 * 01_今年度案内・受付一覧。
 *
 * 中身は持たない。92_年度別案内対象 を今年度で絞って見せるだけの表示用シート。
 * こうしておくと、92 を直した内容がそのまま反映され、二重管理にならない。
 * 直すのは 92 のほう。この表は上書きしない。
 *
 * QUERY の Col番号 は 92 の見出しから作る。列を足したり並べ替えたときは、
 * setupShinsunStage4 をもう一度実行すると数式が作り直される。
 */
function buildGuideListSheet_(ss) {
  const guide = shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE);
  const sh = sheetOf_(ss, SHINSUN.SHEETS.GUIDE_LIST);

  // 表示する列。92 の見出し名で書く。
  const shown = [
    '年度別案内ID', '行事', '案内ルート', '案内状の種類',
    '案内宛名', '敬称', '郵便番号', '住所', '建物名', '電話番号', '案内方法',
    '案内状態', '案内日', '返答状態', '返答日',
    '前年度申込有無', '連続未申込年数', '要確認',
    '対象区分', '対象ID', '世帯ID', '読上げ順'
  ];

  // QUERY はここへ結果を流し込む。行が足りないと #REF! になるので広めに取る。
  ensureSize_(sh, 3000, shown.length);
  sh.clear();
  sh.clearNotes();
  writeHeaders_(sh, shown, 1, '#3f6b4f');
  sh.getRange(2, 1).setFormula(guideListFormula_(guide, shown));

  const rows = sh.getMaxRows() - 1;
  sh.getRange(2, 1, rows, shown.length).setBackground('#f2f5f2').setFontColor('#4a544c');
  const map = {};
  shown.forEach((name, i) => { map[clean_(name)] = i + 1; });
  ['郵便番号', '電話番号'].forEach(name => {
    sh.getRange(2, map[clean_(name)], rows, 1).setNumberFormat('@');
  });
  ['案内日', '返答日'].forEach(name => {
    sh.getRange(2, map[clean_(name)], rows, 1).setNumberFormat('yyyy/mm/dd');
  });
  ['住所', '要確認'].forEach(name => {
    sh.getRange(2, map[clean_(name)], rows, 1).setWrap(true).setVerticalAlignment('top');
  });

  [130, 70, 110, 150,
   220, 60, 90, 260, 140, 130, 90,
   100, 100, 90, 100,
   90, 90, 240,
   80, 100, 110, 80]
    .forEach((width, i) => { if (i < shown.length) sh.setColumnWidth(i + 1, width); });
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);

  sh.getRange(1, 1).setNote(
    '92_年度別案内対象 を今年度（99_設定 の「現在年度」）で絞って表示しているだけの表です。\n' +
    'ここへ直接書き込まないでください。直すのは 92 のほうです。\n' +
    '「（過去実績）」の行は表示しません。'
  );

  /*
   * 数式のセルを職員がうっかり消してしまうと表が空になる。
   * 編集を止めきってしまうと直せなくなるので、警告だけ出す形にする。
   * 貼り直すたびに保護が増えないよう、先に古い保護を外す。
   */
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => p.remove());
  sh.protect()
    .setDescription('01_今年度案内・受付一覧 は 92 の表示専用です')
    .setWarningOnly(true);
  return sh;
}

/**
 * 01 に置く QUERY 式を作る。
 * 年度は 99_設定 の「現在年度」を毎回引くので、年度が変わっても式は直さなくてよい。
 */
function guideListFormula_(guide, shown) {
  const map = headerMap_(guide);
  const name = guide.getName();
  const at = header => 'Col' + col_(map, header, name);

  const select = shown.map(at).join(',');
  const where = at('年度') + " = '\"&" +
    'VLOOKUP("現在年度",' + "'" + SHINSUN.SHEETS.CONFIG + "'!A:B,2,FALSE)" + '&"\' and ' +
    at('案内状態') + " <> '（過去実績）'";
  const order = [at('行事'), at('案内ルート'), at('案内宛名')].join(', ');
  const last = columnLetter_(guide.getLastColumn());

  return '=IFERROR(QUERY(' + "'" + name + "'!A2:" + last + ', ' +
    '"select ' + select + ' where ' + where + ' order by ' + order + '", 0), "")';
}

/** 01 を先頭に置く。90 以降の並びは段階1で決めた順のまま。 */
function orderStage4Sheets_(ss) {
  const sh = ss.getSheetByName(SHINSUN.SHEETS.GUIDE_LIST);
  if (!sh) return;
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);
}


/* ── 案内対象の生成 ───────────────────────────────────── */

/**
 * 99_設定 の「現在年度」の案内対象を 92 へ作る。
 *
 * 行事ごとに、翌年度案内状態が「継続」の方の行を1行ずつ足す。
 * 既に同じ 年度×行事×対象 の行があれば飛ばす。何度実行してもよい。
 */
function generateShinsunGuideTargets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const config = getShinsunConfig_(ss);
    const yearLabel = clean_(configValue_(config, '現在年度'));
    const yearNum = reiwaNumber_(yearLabel);
    if (!yearNum) {
      throw new Error('99_設定 の「現在年度」が「R9」の形になっていません：' + (yearLabel || '（空欄）'));
    }

    const scope = clean_(configValue_(config, '案内対象の範囲')) || '実績のある行事のみ';
    const allYears = scope === '継続の方全員';
    const warnYears = Number(configValue_(config, '未申込要確認年数')) || 0;

    const guide = shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE);
    const history = readGuideHistory_(guide);
    const targets = readMasterTargets_(ss);
    const events = masterValues_(ss, '行事');
    if (!events.length) throw new Error('98_マスター に「行事」がありません。');

    const allowed = {
      routes: masterValues_(ss, '案内ルート'),
      states: masterValues_(ss, '案内状態'),
      answers: masterValues_(ss, '返答状態'),
      kinds: masterValues_(ss, '案内状の種類'),
      honorifics: masterValues_(ss, '敬称'),
      methods: masterValues_(ss, '案内方法')
    };

    const pending = [];
    const report = {
      year: yearLabel, scope: scope, events: [],
      stopped: 0, skipped: 0, noHistory: 0, blankState: 0
    };

    // 継続でない方は、行事にかかわらず対象から外れる。理由は 90/91 に書いてある。
    const active = targets.filter(target => {
      if (target.state === '継続') return true;
      if (!target.state) { report.blankState += 1; return true; }
      report.stopped += 1;
      return false;
    });

    events.forEach(event => {
      const line = generateGuideForEvent_({
        event: event, yearLabel: yearLabel, yearNum: yearNum,
        history: history, allowed: allowed, allYears: allYears,
        warnYears: warnYears, pending: pending
      }, active);
      report.events.push(line);
      report.skipped += line.skipped;
      report.noHistory += line.noHistory;
    });

    if (pending.length) appendGuideTargetRows_(guide, pending, new Date());

    resetShinsunCache_();
    logShinsun_(ss, '案内対象の生成', yearLabel, pending.length, scope);
    showGuideReport_(ss, report, pending.length);
    return pending.length;
  });
}

/**
 * 1つの行事について、案内対象の行を組み立てる。
 * ここでは 92 へ書かない。呼び出し側でまとめて追記する。
 */
function generateGuideForEvent_(ctx, targets) {
  const line = { event: ctx.event, added: 0, skipped: 0, noHistory: 0, renewed: 0, fresh: 0 };
  const years = ctx.history.yearsByEvent[ctx.event] || [];
  const previous = ctx.yearNum - 1;

  targets.forEach(target => {
    const key = ctx.event + '|' + target.kubun + '|' + target.id;
    const entry = ctx.history.byKey[key];

    // 既にこの年度の行があるなら作らない。職員が直した行を壊さないため。
    if (ctx.history.existing[ctx.yearNum + '|' + key]) { line.skipped += 1; return; }
    if (!entry) {
      line.noHistory += 1;
      if (!ctx.allYears) return;   // 実績のある行事のみ
    }

    const lastApplied = entry && entry.years[previous] && entry.years[previous].replied;
    const kind = pickAllowed_(ctx.allowed.kinds,
      lastApplied ? '昨年申込済み' : '新規（昨年未申込）', '');
    if (lastApplied) line.renewed += 1; else line.fresh += 1;

    const misses = consecutiveMisses_(entry, years, ctx.yearNum);
    const notes = [];
    if (ctx.warnYears && misses > ctx.warnYears) {
      notes.push('連続未申込 ' + misses + '年です。案内を続けるか確認してください（自動では外しません）');
    }
    if (!target.address) notes.push('住所が空欄です。90/91 で確認してください');
    if (!target.label) notes.push('案内宛名が空欄です。90/91 で確認してください');
    if (target.method === '不要') notes.push('案内方法が「不要」です。案内状態を「案内不要」にしました');
    if (!target.state) notes.push('90/91 の翌年度案内状態が空欄です。「継続」として扱いました');

    const inherited = entry ? entry.latest : null;
    ctx.pending.push({
      year: ctx.yearLabel,
      event: ctx.event,
      kubun: target.kubun,
      targetId: target.id,
      route: guideRouteFor_(ctx, target, inherited),
      label: target.label,
      postal: target.postal,
      address: target.address,
      building: target.building,
      honorific: pickAllowed_(ctx.allowed.honorifics, target.honorific,
        target.kubun === '会社' ? '御中' : '様'),
      phone: target.phone,
      method: pickAllowed_(ctx.allowed.methods, target.method, '郵送'),
      kind: kind,
      state: pickAllowed_(ctx.allowed.states,
        target.method === '不要' ? '案内不要' : '案内予定', '案内予定'),
      answer: pickAllowed_(ctx.allowed.answers, '未回答', ''),
      applied: lastApplied ? 'あり' : 'なし',
      misses: misses,
      household: target.household,
      order: inherited ? inherited.order : '',
      issue: notes.join('\n')
    });
    line.added += 1;
  });
  return line;
}

/**
 * 案内ルート。前年までの同じ行事のルートをそのまま引き継ぐ。
 * 引き継ぐものがなければ行事と名簿区分から決める。
 */
function guideRouteFor_(ctx, target, inherited) {
  if (inherited && inherited.route) {
    const kept = pickAllowed_(ctx.allowed.routes, inherited.route, '');
    if (kept) return kept;
  }
  let guess = '';
  if (ctx.event === '新春') guess = '新春一般';
  else if (ctx.event === '節分') guess = '節分一般';
  else if (ctx.event === '暑中見舞') {
    guess = (target.kubun === '信者様' && target.roster === '僧侶')
      ? '暑中見舞（僧侶）' : '暑中見舞（一般）';
  }
  return pickAllowed_(ctx.allowed.routes, guess, '');
}

/**
 * 連続未申込年数。
 *
 * 数えるのは 92 にその行事の行が実際にある年度だけ。
 * 移行で抜けている年度（R3・R4 など）を数に入れると、
 * 申込みを続けている方まで「何年も申込みがない」ことになってしまう。
 * 申込済の年に当たったところで止める。
 */
function consecutiveMisses_(entry, years, targetYearNum) {
  let count = 0;
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    if (year >= targetYearNum) continue;      // 今年度以降は数えない
    const hit = entry && entry.years[year];
    if (hit && hit.replied) break;
    count += 1;
  }
  return count;
}


/* ── 92 と 90/91 の読み取り ───────────────────────────── */

/**
 * 92 を1回だけ読む。
 *   existing    … 年度×行事×対象 が既にあるか
 *   byKey       … 行事×対象 ごとの年度別の実績と、いちばん新しい年の値
 *   yearsByEvent… 行事ごとに 92 にある年度（新しい順）
 *
 * 行事が空欄の過年度行（移行で入れた読上げ名簿など）は、
 * どの行事の実績かが決められないので数に入れない。
 */
function readGuideHistory_(sh) {
  const map = headerMap_(sh);
  const name = sh.getName();
  const idColumn = col_(map, '年度別案内ID', name);
  const last = lastRowByColumn_(sh, idColumn);
  const history = { existing: {}, byKey: {}, yearsByEvent: {}, rows: 0 };
  if (last < 2) return history;

  const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  const at = header => col_(map, header, name) - 1;
  const iYear = at('年度');
  const iEvent = at('行事');
  const iKubun = at('対象区分');
  const iTarget = at('対象ID');
  const iRoute = at('案内ルート');
  const iAnswer = at('返答状態');
  const iOrder = at('読上げ順');

  const seenYears = {};
  values.forEach(row => {
    const targetId = clean_(row[iTarget]);
    const event = clean_(row[iEvent]);
    const yearNum = reiwaNumber_(row[iYear]);
    history.rows += 1;
    if (!event || !yearNum) return;
    if (!seenYears[event]) seenYears[event] = {};
    seenYears[event][yearNum] = true;
    if (!targetId) return;

    const key = event + '|' + clean_(row[iKubun]) + '|' + targetId;
    history.existing[yearNum + '|' + key] = true;

    if (!history.byKey[key]) history.byKey[key] = { years: {}, latest: null, latestYear: 0 };
    const entry = history.byKey[key];
    const item = {
      replied: clean_(row[iAnswer]) === '申込済',
      route: clean_(row[iRoute]),
      order: row[iOrder] === '' ? '' : row[iOrder]
    };
    // 同じ年度に複数行あるときは、申込済のほうを残す。
    if (!entry.years[yearNum] || (item.replied && !entry.years[yearNum].replied)) {
      entry.years[yearNum] = item;
    }
    if (yearNum >= entry.latestYear) { entry.latestYear = yearNum; entry.latest = item; }
  });

  Object.keys(seenYears).forEach(event => {
    history.yearsByEvent[event] = Object.keys(seenYears[event])
      .map(Number).sort((a, b) => b - a);
  });
  return history;
}

/**
 * 90/91 から案内先を読む。
 * 90 は 信者ID、91 は 拠点ID を対象IDにする（92 の移行行と同じ決め方）。
 */
function readMasterTargets_(ss) {
  const list = [];

  const read = function (sheetName, kubun, idHeader, nameHeaders, rosterHeader) {
    const sh = shinsunSheet_(ss, sheetName);
    const map = headerMap_(sh);
    const idColumn = col_(map, idHeader, sheetName);
    const last = lastRowByColumn_(sh, idColumn);
    if (last < 2) return;
    const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    const pick = function (row, header) {
      const column = map[clean_(header)];
      return column ? clean_(row[column - 1]) : '';
    };
    values.forEach(row => {
      const id = clean_(row[idColumn - 1]);
      if (!id) return;
      let label = '';
      for (let i = 0; i < nameHeaders.length && !label; i++) label = pick(row, nameHeaders[i]);
      list.push({
        kubun: kubun,
        id: id,
        label: label,
        roster: rosterHeader ? pick(row, rosterHeader) : '',
        household: pick(row, '世帯ID'),
        postal: pick(row, '郵便番号'),
        address: pick(row, '住所'),
        building: pick(row, '建物名'),
        phone: pick(row, '電話番号'),
        honorific: pick(row, '敬称'),
        method: pick(row, '案内方法'),
        state: pick(row, '翌年度案内状態'),
        reason: pick(row, '案内停止理由')
      });
    });
  };

  read(SHINSUN.SHEETS.PERSON, '信者様', '信者ID', ['案内宛名', '氏名'], '名簿区分');
  read(SHINSUN.SHEETS.COMPANY, '会社', '拠点ID', ['案内状の宛名', '会社・法人・団体名'], null);
  return list;
}


/* ── 92 への追記 ──────────────────────────────────────── */

/**
 * 今年度の案内対象を 92 の末尾へ足す。
 * 年度ごとの通し番号は、既にある行の最大値の次から続ける。
 * 1行ずつ書かず、まとめて1回で書く。
 */
function appendGuideTargetRows_(sh, pending, now) {
  if (!pending.length) return;
  const headers = SHINSUN.HEADERS.GUIDE;
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const idColumn = col_(map, '年度別案内ID', sh.getName());
  const start = Math.max(2, lastRowByColumn_(sh, idColumn) + 1);

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
    const yearKey = clean_(item.year).replace(/^R(\d+)$/, (all, n) => 'R' + String(Number(n)).padStart(2, '0'));
    serial[yearKey] = (serial[yearKey] || 0) + 1;
    const values = {
      '年度別案内ID': 'G-' + yearKey + '-' + String(serial[yearKey]).padStart(4, '0'),
      '年度': item.year,
      '行事': item.event,
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
      '案内状の種類': item.kind,
      '案内状態': item.state,
      '返答状態': item.answer,
      '前年度申込有無': item.applied,
      '連続未申込年数': item.misses,
      '要確認': item.issue,
      '世帯ID': item.household,
      '読上げ順': item.order,
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


/* ── 年度の表記 ───────────────────────────────────────── */

/**
 * 「R9」「令和9年」「令和九年」「2027」から 9 を取り出す。
 * 西暦は 令和＝西暦−2018 で換算する。読めないときは 0。
 */
function reiwaNumber_(value) {
  const text = clean_(value);
  if (!text) return 0;
  const reiwa = text.match(/^R(\d{1,2})$/i) || text.match(/令和\s*(\d{1,2})/);
  if (reiwa) return Number(reiwa[1]);
  const kanji = text.match(/令和\s*([一二三四五六七八九十]+)/);
  if (kanji) {
    const digits = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    const body = kanji[1];
    if (body === '十') return 10;
    const m = body.match(/^十([一二三四五六七八九])$/);
    if (m) return 10 + digits[m[1]];
    if (digits[body]) return digits[body];
    return 0;
  }
  const seireki = text.match(/^(\d{4})/);
  if (seireki) {
    const year = Number(seireki[1]) - 2018;
    return year > 0 ? year : 0;
  }
  return 0;
}

function reiwaLabel_(number) {
  return number ? 'R' + number : '';
}


/* ── 結果の表示と確認 ─────────────────────────────────── */

function showGuideReport_(ss, report, added) {
  const lines = [];
  lines.push('■ 案内対象の生成（' + report.year + '）');
  lines.push('　範囲：' + report.scope);
  lines.push('　92 へ足した行：' + added + '件');
  lines.push('');
  report.events.forEach(line => {
    lines.push('・' + line.event +
      '　足した ' + line.added + '件' +
      '（昨年申込済み ' + line.renewed + '／新規 ' + line.fresh + '）' +
      '　既にあった ' + line.skipped + '件' +
      '　実績なし ' + line.noHistory + '件');
  });
  lines.push('');
  lines.push('■ 対象から外れた方');
  lines.push('　翌年度案内状態が「継続」以外：' + report.stopped + '件（理由は 90/91 の案内停止理由）');
  if (report.blankState) {
    lines.push('　翌年度案内状態が空欄：' + report.blankState + '件（「継続」として扱いました）');
  }
  lines.push('');
  lines.push('※「実績なし」は、その行事の過年度の行が 92 にない方です。');
  lines.push('　案内を出したいときは 99_設定 の「案内対象の範囲」を');
  lines.push('　「継続の方全員」に変えて、もう一度実行してください。');

  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('案内対象の生成', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}

/**
 * 今年度の 92 の状況を見る。書き換えはしない。
 * 生成のあと、案内状を出す前に確認するために使う。
 */
function checkShinsunGuide() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetShinsunCache_();
  const config = getShinsunConfig_(ss);
  const yearLabel = clean_(configValue_(config, '現在年度'));
  const yearNum = reiwaNumber_(yearLabel);
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE);
  const map = headerMap_(sh);
  const name = sh.getName();
  const last = lastRowByColumn_(sh, col_(map, '年度別案内ID', name));

  const lines = [];
  lines.push('■ ' + yearLabel + ' の案内対象');
  if (last < 2) {
    lines.push('　92_年度別案内対象 に行がありません。');
  } else {
    const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    const at = header => col_(map, header, name) - 1;
    const iYear = at('年度');
    const iEvent = at('行事');
    const iRoute = at('案内ルート');
    const iKind = at('案内状の種類');
    const iState = at('案内状態');
    const iMethod = at('案内方法');
    const iAddress = at('住所');
    const iIssue = at('要確認');
    const iTarget = at('対象ID');

    const byEvent = {}, byRoute = {}, byKind = {}, byState = {};
    let total = 0, noAddress = 0, issues = 0, noTarget = 0, duplicated = 0;
    const seen = {};
    values.forEach(row => {
      if (reiwaNumber_(row[iYear]) !== yearNum) return;
      if (clean_(row[iState]) === '（過去実績）') return;
      total += 1;
      const count = function (bag, value) {
        const label = clean_(value) || '（空欄）';
        bag[label] = (bag[label] || 0) + 1;
      };
      count(byEvent, row[iEvent]);
      count(byRoute, row[iRoute]);
      count(byKind, row[iKind]);
      count(byState, row[iState]);
      if (!clean_(row[iAddress]) && clean_(row[iMethod]) !== 'メール') noAddress += 1;
      if (clean_(row[iIssue])) issues += 1;
      const targetId = clean_(row[iTarget]);
      if (!targetId) { noTarget += 1; return; }
      const key = clean_(row[iEvent]) + '|' + targetId;
      if (seen[key]) duplicated += 1; else seen[key] = true;
    });

    const show = function (title, bag) {
      lines.push('');
      lines.push('■ ' + title);
      Object.keys(bag).sort().forEach(label => lines.push('　' + label + '：' + bag[label]));
    };
    lines.push('　合計：' + total + '件');
    show('行事', byEvent);
    show('案内ルート', byRoute);
    show('案内状の種類', byKind);
    show('案内状態', byState);
    lines.push('');
    lines.push('■ 確認が要る行');
    lines.push('　住所が空欄（案内方法がメール以外）：' + noAddress);
    lines.push('　要確認あり：' + issues);
    lines.push('　対象IDが空欄：' + noTarget);
    lines.push('　同じ行事で対象IDが重複：' + duplicated);
  }

  const listSheet = ss.getSheetByName(SHINSUN.SHEETS.GUIDE_LIST);
  lines.push('');
  lines.push('■ 01_今年度案内・受付一覧');
  lines.push('　' + (listSheet ? 'あります（92 の表示用）' : 'ありません。setupShinsunStage4 を実行してください'));

  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('案内対象の状況', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}
