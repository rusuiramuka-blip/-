/**
 * 正月のお守り — 取り置き・お渡し・残数の現場用画面（ウェブアプリ）
 *
 * 対象: 沖縄御守在庫_商品マスタ   1X6wgoVSlllxeSiL0PILD61wMfvqZSGVUrKqM5j6RDvM
 *       久留米御守在庫_商品マスタ 1EFqI4htpzKZJiMMKDJ39axMOOTbJ6keqev9bu61VCZ0
 *
 * 在庫ファイルに入っているスクリプトとは「別の」単独プロジェクトに置く。
 * 在庫側の onOpen / onEdit とは関数名が衝突せず、在庫側の処理を変えない。
 *
 * 書き込むのは次の列だけ。数式の列（A・I・L・M、準備シートの集計列）は触らない。
 *   取り置き一覧   : 1行追加（受付）／K 取り分けた数・N お支払い・O 状況・P お渡し日
 *   正月の準備     : U・V・W（終了後の残数）
 */

const SITES = Object.freeze({
  okinawa: {
    label: '沖縄',
    ssId: '1X6wgoVSlllxeSiL0PILD61wMfvqZSGVUrKqM5j6RDvM',
    list: '08-2_取り置き一覧',
    prep: '08_正月の準備・片付け',
    noPrefix: '沖',
    places: ['本堂', '屋外', 'その他'],
    countPlaces: ['本堂', '屋外', '取り置き'],   // 準備シート U・V・W の順
    qLastRow: 1001,                                // 準備シート Q列の式が数える最終行
    state: { WAIT: '準備待ち', READY: '取り分け済み', DONE: 'お渡し済み', CANCEL: '取消' },
    pay: { UNPAID: '未入金', PAID: '支払済み', ON_PICKUP: '受取時に支払う', FREE: '無料' }
  },
  kurume: {
    label: '久留米',
    ssId: '1EFqI4htpzKZJiMMKDJ39axMOOTbJ6keqev9bu61VCZ0',
    list: '08-2_正月取り置き受付',
    prep: '08_正月管理',
    noPrefix: '久',
    places: ['本堂', '下受付', 'その他'],
    countPlaces: ['本堂', '下受付', '取り置き'],
    qLastRow: 689,
    state: { WAIT: '受付', READY: '確保済', DONE: '受渡済', CANCEL: '取消' },
    pay: { UNPAID: '未納', PAID: '入金済', ON_PICKUP: '受取時支払', FREE: '免除' }
  }
});

/** 取り置き一覧の列（両拠点とも同じ並び。ヘッダ1行目 / データ2行目〜） */
const LIST = Object.freeze({
  FIRST: 2, WIDTH: 19,
  YEAR: 1, NO: 2, DATE: 3, NAME: 4, TEL: 5, PICKUP: 6, PLACE: 7,
  ITEM: 8, ITEM_ID: 9, QTY: 10, KEPT: 11, PRICE: 12, AMOUNT: 13,
  PAY: 14, STATE: 15, HANDED: 16, STAFF: 17, NOTE: 18, KEY: 19
});

/** 正月の準備シートの列（両拠点とも同じ並び） */
const PREP = Object.freeze({
  FIRST: 2, WIDTH: 29,
  ID: 3, NAME: 4, CATEGORY: 6, PLAN: 12, READY_FLAG: 14, PREPARED: 18,
  LEFT_1: 21, LEFT_2: 22, LEFT_HOLD: 23, SOLD: 28, STATUS: 29
});

/** 列番号の照合用。実シートの見出しにこの文字が含まれていなければ止める */
const LIST_HEADER_CHECK = [[LIST.NAME, '名'], [LIST.ITEM, '商品'], [LIST.QTY, '数'], [LIST.STATE, '状']];
const PREP_HEADER_CHECK = [[PREP.ID, '商品'], [PREP.LEFT_1, '本堂'], [PREP.LEFT_HOLD, '取り置き']];

const TZ = 'Asia/Tokyo';

// ---------------------------------------------------------------------------
// 入口

function doGet(e) {
  const key = String((e && e.parameter && e.parameter.site) || '').toLowerCase();
  if (!SITES[key]) {
    return HtmlService.createHtmlOutput(
      '<p style="font:18px sans-serif;padding:24px">URL の最後に ?site=okinawa または ?site=kurume を付けて開いてください。</p>');
  }
  const t = HtmlService.createTemplateFromFile('index');
  t.siteKey = key;
  return t.evaluate()
    .setTitle('正月のお守り（' + SITES[key].label + '）')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/** 画面を開いたときに一度だけ呼ぶ。商品候補と選択肢を返す */
function apiInit(siteKey) {
  const site = site_(siteKey);
  const ss = SpreadsheetApp.openById(site.ssId);
  checkHeaders_(sheet_(ss, site.list), LIST_HEADER_CHECK);

  const master = sheet_(ss, '01_商品マスタ');
  const rows = master.getRange(2, 1, Math.max(master.getLastRow() - 1, 1), 9).getValues();
  const products = [];
  rows.forEach(r => {
    const id = String(r[0]).trim();
    if (!id || r[8] !== '使用中') return;
    products.push({
      id: id,
      name: String(r[1]),
      category: String(r[3]),
      price: typeof r[5] === 'number' ? r[5] : null,
      newYear: r[7] === true
    });
  });
  // 正月対象を先に並べる
  products.sort((a, b) => (b.newYear - a.newYear) || a.id.localeCompare(b.id));

  return {
    site: siteKey,
    label: site.label,
    places: site.places,
    countPlaces: site.countPlaces,
    state: site.state,
    pay: site.pay,
    today: today_(),
    defaultPickup: (newYearOf_(new Date())) + '-01-01',
    products: products
  };
}

// ---------------------------------------------------------------------------
// 受付

/**
 * お一人分をまとめて登録する。
 * p = { token, name, tel, pickup:'yyyy-mm-dd', place, pay, note, staff, items:[{id, qty}] }
 */
function apiRegister(siteKey, p) {
  const site = site_(siteKey);
  const name = String(p.name || '').trim();
  const staff = String(p.staff || '').trim();
  const items = (p.items || []).filter(it => it && it.id && Number(it.qty) > 0);

  // 書き込み前にすべて検証する
  if (!name) throw new Error('お名前を入力してください。');
  if (!staff) throw new Error('受付した職員の名前を入力してください。');
  if (!items.length) throw new Error('商品を1つ以上選んでください。');
  items.forEach(it => {
    if (!Number.isInteger(Number(it.qty))) throw new Error('数量は整数で入力してください。');
  });
  if (site.places.indexOf(p.place) < 0) throw new Error('お渡し場所を選んでください。');
  const payValues = Object.keys(site.pay).map(k => site.pay[k]);
  if (payValues.indexOf(p.pay) < 0) throw new Error('お支払いを選んでください。');
  const pickup = p.pickup ? parseDate_(p.pickup) : '';
  if (p.pickup && !pickup) throw new Error('受取予定日の形式が正しくありません。');

  return withLock_(() => {
    const ss = SpreadsheetApp.openById(site.ssId);
    const sh = sheet_(ss, site.list);
    checkHeaders_(sh, LIST_HEADER_CHECK);
    const data = readList_(sh);

    // 同じ画面から二重に送られたら、先に登録した受付を返す
    if (p.token) {
      const dup = data.find(r => r.key === p.token);
      if (dup) return { no: dup.no, duplicated: true };
    }

    const master = productMap_(ss);
    const labels = items.map(it => {
      const m = master[it.id];
      if (!m) throw new Error('商品が見つかりません: ' + it.id);
      return it.id + '｜【' + m.category + '】' + m.name;
    });

    const no = nextNo_(site, data);
    const now = new Date();
    const first = data.length ? data[data.length - 1].row + 1 : LIST.FIRST;
    if (first + items.length - 1 > sh.getMaxRows()) {
      sh.insertRowsAfter(sh.getMaxRows(), first + items.length - 1 - sh.getMaxRows());
    }

    const values = items.map((it, i) => {
      const r = first + i;
      return [
        '=IF($C' + r + '="","",YEAR($C' + r + ')+IF(MONTH($C' + r + ')>=4,1,0))',
        no, now, name, String(p.tel || '').trim(), pickup, p.place,
        labels[i],
        '=IF($H' + r + '="","",IFERROR(LEFT($H' + r + ',FIND("｜",$H' + r + ')-1),"商品選択要確認"))',
        Number(it.qty), '',
        '=IF($I' + r + '="","",IFNA(VLOOKUP($I' + r + ',\'01_商品マスタ\'!$A:$F,6,FALSE),""))',
        '=IF(OR($J' + r + '="",$L' + r + '=""),"",$J' + r + '*$L' + r + ')',
        p.pay, site.state.WAIT, '', staff, String(p.note || '').trim(),
        p.token || ''
      ];
    });
    sh.getRange(first, 1, values.length, LIST.WIDTH).setValues(values);
    sh.getRange(first, LIST.DATE, values.length, 1).setNumberFormat('yyyy/mm/dd');
    if (pickup) sh.getRange(first, LIST.PICKUP, values.length, 1).setNumberFormat('yyyy/mm/dd');
    if (!String(sh.getRange(1, LIST.KEY).getValue())) sh.getRange(1, LIST.KEY).setValue('受付の重複防止キー（自動）');

    const last = first + values.length - 1;
    return {
      no: no,
      warning: last > site.qLastRow
        ? '一覧が ' + site.qLastRow + ' 行を超えました。正月の準備シートの「取り置き」の式の範囲を広げてください（管理者へ連絡）。'
        : ''
    };
  });
}

// ---------------------------------------------------------------------------
// さがす・お渡し

/**
 * 受付ごとにまとめて返す。
 * filter: 'active'（お渡し前すべて）| 'today' | 'wait' | 'ready' | 'done' | 'all'
 */
function apiSearch(siteKey, query, filter) {
  const site = site_(siteKey);
  const ss = SpreadsheetApp.openById(site.ssId);
  const groups = groupByNo_(site, readList_(sheet_(ss, site.list)));
  const q = norm_(query);
  const qDigits = String(query || '').replace(/[^0-9]/g, '');
  const today = today_();

  return groups.filter(g => {
    if (q) {
      const hit = norm_(g.name).indexOf(q) >= 0 ||
        norm_(g.no).indexOf(q) >= 0 ||
        (qDigits.length >= 3 && g.tel.replace(/[^0-9]/g, '').indexOf(qDigits) >= 0);
      if (!hit) return false;
    }
    switch (filter) {
      case 'today': return g.pickup === today && g.summary !== 'done' && g.summary !== 'cancel';
      case 'wait': return g.summary === 'wait';
      case 'ready': return g.summary === 'ready';
      case 'done': return g.summary === 'done';
      case 'all': return true;
      default: return g.summary === 'wait' || g.summary === 'ready';
    }
  }).sort((a, b) => (a.pickup || '9999').localeCompare(b.pickup || '9999') || a.no.localeCompare(b.no))
    .slice(0, 200);
}

/**
 * 受付1件への操作。同じ受付番号の行をまとめて更新する。
 * action: 'ready'（取り分けた）| 'paid'（代金を受け取った）| 'handover'（お渡しした）
 *         | 'cancel'（取り消す）| 'undo'（ひとつ前に戻す）
 */
function apiAct(siteKey, no, action, staff) {
  const site = site_(siteKey);
  const S = site.state, P = site.pay;
  if (!String(staff || '').trim()) throw new Error('職員の名前を入力してください。');

  return withLock_(() => {
    const ss = SpreadsheetApp.openById(site.ssId);
    const sh = sheet_(ss, site.list);
    const rows = readList_(sh).filter(r => r.no === no);
    if (!rows.length) throw new Error('受付番号 ' + no + ' が見つかりません。画面を更新してください。');

    const today = parseDate_(today_());
    // 「戻す」は一番進んだ段階の行だけを一段戻す（取消した商品まで復活させない）
    const has = st => rows.some(r => r.state === st);
    const undoFrom = has(S.DONE) ? S.DONE : has(S.READY) ? S.READY : S.CANCEL;
    let changed = 0;
    rows.forEach(r => {
      if (action === 'undo' && r.state !== undoFrom) return;
      if (r.state === S.CANCEL && action !== 'undo') return;
      let kept = r.kept, pay = r.pay, state = r.state, handed = r.handedRaw;
      switch (action) {
        case 'ready':
          if (state !== S.WAIT && state !== '') return;
          kept = r.qty; state = S.READY;
          break;
        case 'paid':
          if (pay === P.PAID || pay === P.FREE) return;
          pay = P.PAID;
          break;
        case 'handover':
          if (state === S.DONE) return;
          if (kept === '' || kept === null) kept = r.qty;
          if (pay === P.UNPAID || pay === P.ON_PICKUP) pay = P.PAID;
          state = S.DONE; handed = today;
          break;
        case 'cancel':
          if (state === S.DONE) return;
          state = S.CANCEL;
          break;
        case 'undo':
          if (state === S.DONE) { state = S.READY; handed = ''; }
          else if (state === S.READY) { state = S.WAIT; kept = ''; }
          else if (state === S.CANCEL) { state = S.WAIT; }
          else return;
          break;
        default:
          throw new Error('不明な操作です: ' + action);
      }
      // L・M は数式なので K と N〜P を分けて書く
      sh.getRange(r.row, LIST.KEPT).setValue(kept);
      sh.getRange(r.row, LIST.PAY, 1, 3).setValues([[pay, state, handed]]);
      if (handed) sh.getRange(r.row, LIST.HANDED).setNumberFormat('yyyy/mm/dd');
      changed++;
    });
    if (!changed) throw new Error('この受付には、その操作で変わる行がありません。');

    const fresh = groupByNo_(site, readList_(sh).filter(r => r.no === no));
    return fresh[0];
  });
}

/** 取り分け表: まだ取り分けていない取り置きを商品ごとに合計する */
function apiPickList(siteKey) {
  const site = site_(siteKey);
  const ss = SpreadsheetApp.openById(site.ssId);
  const byItem = {};
  readList_(sheet_(ss, site.list)).forEach(r => {
    if (r.state !== site.state.WAIT && r.state !== '') return;
    const k = r.itemId || r.item;
    if (!byItem[k]) byItem[k] = { id: r.itemId, item: r.item, qty: 0, people: [] };
    byItem[k].qty += Number(r.qty) || 0;
    byItem[k].people.push(r.no + ' ' + r.name + '（' + r.qty + '）');
  });
  return Object.keys(byItem).map(k => byItem[k]).sort((a, b) => a.item.localeCompare(b.item));
}

// ---------------------------------------------------------------------------
// 終了後の残数

/** 準備シートの対象商品と、場所ごとの残数を返す */
function apiCountLoad(siteKey) {
  const site = site_(siteKey);
  const ss = SpreadsheetApp.openById(site.ssId);
  const sh = sheet_(ss, site.prep);
  checkHeaders_(sh, PREP_HEADER_CHECK);
  const n = sh.getLastRow() - PREP.FIRST + 1;
  if (n <= 0) return [];
  const v = sh.getRange(PREP.FIRST, 1, n, PREP.WIDTH).getValues();

  // お渡し前で取り分け済みの取り置き = 取り置きの残りの目安
  const hold = {};
  readList_(sheet_(ss, site.list)).forEach(r => {
    if (r.state === site.state.READY) hold[r.itemId] = (hold[r.itemId] || 0) + (Number(r.kept) || 0);
  });

  const out = [];
  v.forEach((r, i) => {
    const id = String(r[PREP.ID - 1]).trim();
    if (!id) return;
    const plan = r[PREP.PLAN - 1], prepared = r[PREP.PREPARED - 1];
    const ready = r[PREP.READY_FLAG - 1] === true;
    if (!ready && !(typeof plan === 'number' && plan > 0)) return;
    out.push({
      row: PREP.FIRST + i,
      id: id,
      name: String(r[PREP.NAME - 1]),
      category: String(r[PREP.CATEGORY - 1]),
      prepared: typeof prepared === 'number' ? prepared : (typeof plan === 'number' ? plan : ''),
      left: [r[PREP.LEFT_1 - 1], r[PREP.LEFT_2 - 1], r[PREP.LEFT_HOLD - 1]].map(x => typeof x === 'number' ? x : ''),
      holdHint: hold[id] || 0,
      status: String(r[PREP.STATUS - 1] || '')
    });
  });
  return out;
}

/**
 * 1か所ぶんの残数を保存する。
 * place: 0=本堂 1=屋外/下受付 2=取り置き / counts: [{row, id, value}]（value は数値か ''）
 */
function apiCountSave(siteKey, place, counts) {
  const site = site_(siteKey);
  const col = [PREP.LEFT_1, PREP.LEFT_2, PREP.LEFT_HOLD][Number(place)];
  if (!col) throw new Error('場所を選んでください。');
  counts.forEach(c => {
    if (c.value !== '' && !(Number.isInteger(c.value) && c.value >= 0)) {
      throw new Error('残数は0以上の整数で入力してください: ' + c.id);
    }
  });

  return withLock_(() => {
    const ss = SpreadsheetApp.openById(site.ssId);
    const sh = sheet_(ss, site.prep);
    checkHeaders_(sh, PREP_HEADER_CHECK);
    const n = sh.getLastRow() - PREP.FIRST + 1;
    const ids = sh.getRange(PREP.FIRST, PREP.ID, n, 1).getValues();
    const range = sh.getRange(PREP.FIRST, col, n, 1);
    const cur = range.getValues();     // 他の人が入れた値を消さないよう、変えた行だけ差し替える
    let saved = 0;
    counts.forEach(c => {
      const i = c.row - PREP.FIRST;
      if (i < 0 || i >= n || String(ids[i][0]).trim() !== c.id) {
        throw new Error('行がずれています。画面を更新してからもう一度保存してください: ' + c.id);
      }
      if (cur[i][0] !== c.value) { cur[i][0] = c.value; saved++; }
    });
    range.setValues(cur);
    return { saved: saved };
  });
}

// ---------------------------------------------------------------------------
// 共通

function site_(key) {
  const s = SITES[String(key || '').toLowerCase()];
  if (!s) throw new Error('拠点が分かりません。URL の ?site= を確認してください。');
  return s;
}

function sheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('シート「' + name + '」が見つかりません。');
  return sh;
}

function checkHeaders_(sh, checks) {
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  checks.forEach(([col, word]) => {
    if (String(head[col - 1] || '').indexOf(word) < 0) {
      throw new Error('「' + sh.getName() + '」の列の並びが想定と違います（' + col + '列目: ' + head[col - 1] + '）。管理者へ連絡してください。');
    }
  });
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('ほかの方が保存中です。少し待ってからもう一度押してください。');
  try {
    const result = fn();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}

/** 取り置き一覧を読む。数式だけ入った空行は含めない */
function readList_(sh) {
  const n = sh.getLastRow() - LIST.FIRST + 1;
  if (n <= 0) return [];
  const width = Math.min(LIST.WIDTH, sh.getLastColumn());
  const v = sh.getRange(LIST.FIRST, 1, n, width).getValues();
  const out = [];
  v.forEach((r, i) => {
    const get = c => (c <= width ? r[c - 1] : '');
    if (!String(get(LIST.NAME)).trim() && !String(get(LIST.ITEM)).trim()) return;
    out.push({
      row: LIST.FIRST + i,
      no: String(get(LIST.NO)),
      date: fmt_(get(LIST.DATE)),
      name: String(get(LIST.NAME)),
      tel: String(get(LIST.TEL)),
      pickup: fmt_(get(LIST.PICKUP)),
      place: String(get(LIST.PLACE)),
      item: String(get(LIST.ITEM)),
      // I列の式と同じ取り出し方。書き込み直後で式が未計算でも商品番号が取れる
      itemId: String(get(LIST.ITEM)).split('｜')[0].trim() || String(get(LIST.ITEM_ID)),
      qty: get(LIST.QTY),
      kept: get(LIST.KEPT),
      price: get(LIST.PRICE),
      amount: get(LIST.AMOUNT),
      pay: String(get(LIST.PAY)),
      state: String(get(LIST.STATE)),
      handedRaw: get(LIST.HANDED),
      handed: fmt_(get(LIST.HANDED)),
      staff: String(get(LIST.STAFF)),
      note: String(get(LIST.NOTE)),
      key: String(get(LIST.KEY))
    });
  });
  return out;
}

/** 受付番号でまとめる。番号が空の古い行は行番号で1件扱い */
function groupByNo_(site, rows) {
  const S = site.state;
  const map = {}, order = [];
  rows.forEach(r => {
    const k = r.no || ('行' + r.row);
    if (!map[k]) {
      map[k] = {
        no: k, name: r.name, tel: r.tel, pickup: r.pickup, place: r.place,
        pay: r.pay, note: r.note, staff: r.staff, date: r.date, items: [], total: 0
      };
      order.push(k);
    }
    const g = map[k];
    g.items.push({ item: r.item, qty: r.qty, kept: r.kept, amount: r.amount, state: r.state, handed: r.handed });
    if (r.state !== S.CANCEL && typeof r.amount === 'number') g.total += r.amount;
    if (r.pay && r.state !== S.CANCEL) g.pay = r.pay;
  });
  return order.map(k => {
    const g = map[k];
    const live = g.items.filter(it => it.state !== S.CANCEL);
    if (!live.length) g.summary = 'cancel';
    else if (live.every(it => it.state === S.DONE)) g.summary = 'done';
    else if (live.every(it => it.state === S.DONE || it.state === S.READY)) g.summary = 'ready';
    else g.summary = 'wait';
    g.handed = (live.find(it => it.handed) || {}).handed || '';
    return g;
  });
}

function productMap_(ss) {
  const sh = sheet_(ss, '01_商品マスタ');
  const v = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 6).getValues();
  const map = {};
  v.forEach(r => {
    const id = String(r[0]).trim();
    if (id) map[id] = { name: String(r[1]), category: String(r[3]), price: r[5] };
  });
  return map;
}

/** 受付番号: 拠点の一文字 + 正月の西暦下2桁 + 3桁の連番（例: 沖27-001） */
function nextNo_(site, rows) {
  const head = site.noPrefix + String(newYearOf_(new Date())).slice(-2) + '-';
  let max = 0;
  rows.forEach(r => {
    if (r.no.indexOf(head) === 0) max = Math.max(max, Number(r.no.slice(head.length)) || 0);
  });
  return head + ('00' + (max + 1)).slice(-3);
}

/** 4月〜12月の受付は翌年の正月、1〜3月はその年の正月 */
function newYearOf_(d) {
  const y = Number(Utilities.formatDate(d, TZ, 'yyyy'));
  const m = Number(Utilities.formatDate(d, TZ, 'M'));
  return m >= 4 ? y + 1 : y;
}

function today_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function fmt_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : String(v);
}

function parseDate_(s) {
  const m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** 検索用に表記をそろえる（全角半角・ひらがなカタカナ・空白） */
function norm_(s) {
  return String(s || '').normalize('NFKC').toLowerCase()
    .replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[\s　]/g, '');
}
