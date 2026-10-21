/**
 * 御守在庫 — シートの並び・色・入口を現場向けに整える（何度実行しても同じ結果）
 *
 * 対象: 沖縄御守在庫_商品マスタ   1X6wgoVSlllxeSiL0PILD61wMfvqZSGVUrKqM5j6RDvM
 *       久留米御守在庫_商品マスタ 1EFqI4htpzKZJiMMKDJ39axMOOTbJ6keqev9bu61VCZ0
 *
 * 在庫ファイルの「拡張機能 > Apps Script」に、ファイルを1つ追加して貼る。
 * 既存の onOpen / onEdit とぶつからないよう、関数名はすべて「御守_」で始める。
 * 実行はエディタから `御守_レイアウトを整える` を選んで ▶。
 *
 * 変えるもの : タブの並び・色 / 00_入口 の作り直し（元は非表示で保存）/
 *              正月シートの見出しの色・固定列
 * 変えないもの: シート名・列の並び・数式・入力済みの値
 */

const 御守_SITES = Object.freeze({
  okinawa: {
    title: '沖縄御守在庫管理',
    prep: '08_正月の準備・片付け',
    form: '08-1_取り置き受付',        // セルに書く受付票（沖縄だけ）
    list: '08-2_取り置き一覧',
    outside: '屋外'
  },
  kurume: {
    title: '久留米御守在庫管理',
    prep: '08_正月管理',
    form: null,                        // 久留米は一覧に直接書く
    list: '08-2_正月取り置き受付',
    outside: '下受付'
  }
});

/** タブの色（グループ）。上から順に左へ並べる */
const 御守_COLOR = Object.freeze({
  STAFF: '#34a853',     // 職員がふだん使う
  NEWYEAR: '#e06666',   // 正月
  ADMIN: '#4a86e8',     // 管理者
  ANALYSIS: '#b7b7b7'   // 分析（ときどき）
});

/** 見出しの色: 入力する列 / 自動計算の列 */
const 御守_HEAD = Object.freeze({ INPUT: '#fff2cc', AUTO: '#e8e8e8' });

function 御守_site_(ss) {
  if (ss.getSheetByName(御守_SITES.okinawa.list)) return 御守_SITES.okinawa;
  if (ss.getSheetByName(御守_SITES.kurume.list)) return 御守_SITES.kurume;
  throw new Error('取り置き一覧のシートが見つかりません。沖縄・久留米の在庫ファイルで実行してください。');
}

/** グループと並び順。存在しないシートは飛ばす */
function 御守_groups_(site) {
  return [
    { color: 御守_COLOR.STAFF, sheets: ['00_入口', '02 職員用スマホ検索', '00_使い方'] },
    { color: 御守_COLOR.NEWYEAR, sheets: [site.form, site.list, site.prep].filter(Boolean) },
    { color: 御守_COLOR.ADMIN, sheets: ['02 管理者用検索', '06_発注管理', '07_発注履歴', '01_商品マスタ',
                                       '03_在庫増減履歴', '十二支守護本尊入力'] },
    { color: 御守_COLOR.ANALYSIS, sheets: ['13_仕入分析', '14_授与額分析', '新商品検討'] }
  ];
}

// ---------------------------------------------------------------------------

/** まとめて実行する入口 */
function 御守_レイアウトを整える() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const site = 御守_site_(ss);
  const log = [];
  御守_タブを並べる_(ss, site, log);
  御守_入口を作り直す_(ss, site, log);
  御守_正月シートの見出し_(ss, site, log);
  SpreadsheetApp.flush();
  console.log(log.join('\n'));
  return log;
}

/** 実行前の確認用。何も変えずに、見つからないシートだけを表示する */
function 御守_確認だけする() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const site = 御守_site_(ss);
  const missing = [];
  御守_groups_(site).forEach(g => g.sheets.forEach(n => { if (!ss.getSheetByName(n)) missing.push(n); }));
  console.log('拠点: ' + site.title + '\n見つからないシート: ' + (missing.join('、') || 'なし'));
}

// ---------------------------------------------------------------------------
// 1. タブの並びと色

function 御守_タブを並べる_(ss, site, log) {
  const active = ss.getActiveSheet();
  let pos = 1;
  const placed = {};
  御守_groups_(site).forEach(g => {
    g.sheets.forEach(name => {
      const sh = ss.getSheetByName(name);
      if (!sh || sh.isSheetHidden()) return;     // 非表示のシートは動かさない（表示に戻ってしまうため）
      sh.setTabColor(g.color);
      ss.setActiveSheet(sh);
      ss.moveActiveSheet(pos++);
      placed[name] = true;
    });
  });
  // 一覧にない表示中のシートは、色を付けずに後ろへ（並びは今のまま）
  ss.getSheets().forEach(sh => {
    if (!placed[sh.getName()] && !sh.isSheetHidden()) log.push('並び替え対象外（そのまま）: ' + sh.getName());
  });
  ss.setActiveSheet(active);
  log.push('タブを ' + (pos - 1) + ' 枚並べ替え・色付けしました');
}

// ---------------------------------------------------------------------------
// 2. 00_入口

/**
 * 入口の行。target は シート名 / 'form:B5'（99_設定のURL）/ 'keep'（今の C列の式をそのまま使う）
 * desc を空にすると、今の入口に同じ名前の行があればその説明を引き継ぐ
 */
function 御守_入口の行_(site) {
  const okinawa = site === 御守_SITES.okinawa;
  return [
    { head: 'ふだん使う（職員）', color: 御守_COLOR.STAFF },
    { label: '在庫をさがす・増減を入れる', target: '02 職員用スマホ検索',
      desc: 'スマホで商品をさがし「在庫増減」から入力します。黄色い検索欄だけ使います。' },
    { label: '在庫増減フォーム', target: 'form:B5', desc: '' },
    { label: '使い方（詳しい説明）', target: '00_使い方', desc: '' },

    { head: '正月', color: 御守_COLOR.NEWYEAR },
    okinawa
      ? { label: '① 取り置きを受け付ける', target: site.form,
          desc: 'お名前を一度入れ、商品と数量をまとめて登録します。' }
      : { label: '① 取り置きを受け付ける', target: site.list,
          desc: '1商品につき1行。お名前・商品・申込数を入れます。' },
    { label: '② 取り置き一覧・お渡し', target: site.list,
      desc: '「状況」を選ぶだけで進みます（取り分けた → お渡しした）。同じ受付の商品はまとめて変わります。' },
    { label: '正月の準備・片付け（管理者）', target: site.prep,
      desc: '本堂・' + site.outside + 'の予定数、準備完了、終了後の残りを入れます。' },

    { head: '管理者', color: 御守_COLOR.ADMIN },
    { label: '管理者用検索・入力', target: '02 管理者用検索', desc: '' },
    { label: '発注管理', target: '06_発注管理', desc: '' },
    { label: '発注履歴', target: '07_発注履歴', desc: '発注ごとの記録。未納残の取消もここで行います。' },
    { label: '商品マスタ', target: '01_商品マスタ', desc: '' },
    { label: '棚卸フォーム', target: 'form:B6', desc: '' },
    { label: '在庫確認（集計）', target: '04_在庫確認', desc: '' },
    { label: '棚卸履歴', target: '05_棚卸履歴', desc: '' },
    { label: '年度別集計', target: '11_年度別集計', desc: '' },

    { head: '分析・ほか', color: 御守_COLOR.ANALYSIS },
    { label: '仕入分析', target: '13_仕入分析', desc: '' },
    { label: '授与額分析', target: '14_授与額分析', desc: '授与額ごとの年度別の動きを比べます。' },
    { label: '新商品検討', target: '新商品検討', desc: '新しく扱う候補の商品を比べます。' },
    { label: '祈願札・供物の準備', target: 'keep', desc: '' },
    { label: '移行元在庫の照合', target: '12_移行元在庫', desc: '' }
  ];
}

/** 職員向けの短い手順（入口の下に載せる） */
function 御守_職員の手順_(site) {
  const okinawa = site === 御守_SITES.okinawa;
  return [
    ['売場へ出した', '在庫をさがす → 商品の「在庫増減」→ 区分「出庫」と数量'],
    ['納品された', '同じく 区分「入荷」と数量'],
    ['売場から戻した', '同じく 区分「戻入」（出庫の取消ではありません）'],
    ['破損・数が合わない', '同じく 区分「破損・汚損」または「不足・紛失」'],
    ['正月の取り置き', okinawa
      ? '① 受付票に記入して「受付を登録する」→ ② 一覧の「状況」を選ぶ'
      : '① 一覧に1商品1行で記入 → 「予約状態」を選ぶ'],
    ['正月の期間中', '正月の分は在庫増減フォームに「出庫」で入れません（二重になります）']
  ];
}

function 御守_入口を作り直す_(ss, site, log) {
  const sh = ss.getSheetByName('00_入口');
  if (!sh) { log.push('00_入口 がないため入口は作りませんでした'); return; }

  // 元の入口を保存（同じ日に2回実行しても1つだけ）
  const backupName = '00_入口_整理前_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  if (!ss.getSheetByName(backupName)) {
    sh.copyTo(ss).setName(backupName).hideSheet();
    log.push('元の入口を「' + backupName + '」に保存（非表示）');
  }

  // 今の入口から、説明文・式・運用方針を引き継ぐ
  const old = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 3);
  const oldVals = old.getValues(), oldFx = old.getFormulas();
  const oldDesc = {}, oldC = {}, notes = [];
  oldVals.forEach((r, i) => {
    const a = String(r[0]).trim();
    if (!a) return;
    if (a.indexOf('※') === 0) { notes.push(a); return; }
    if (r[1]) oldDesc[a] = String(r[1]);
    if (oldFx[i][2]) oldC[a] = oldFx[i][2];
  });
  const descOf = (label, fallbacks) => {
    for (const k of [label].concat(fallbacks || [])) if (oldDesc[k]) return oldDesc[k];
    return '';
  };
  // 旧ラベル → 新ラベルの対応（説明の引き継ぎ用）
  const alias = {
    '使い方（詳しい説明）': ['使い方'],
    '在庫確認（集計）': ['在庫確認（集計）'],
    '正月の準備・片付け（管理者）': ['正月の準備・片付け', '正月管理']
  };

  const base = ss.getUrl().replace(/\/edit.*$/, '') + '/edit#gid=';
  const rows = [], styles = [];
  rows.push([site.title, '', '']); styles.push('title');
  rows.push(['ふだんは緑のタブだけ使います。黄色い欄が入力するところです。', '', '']); styles.push('lead');

  御守_入口の行_(site).forEach(it => {
    if (it.head) { rows.push(['【 ' + it.head + ' 】', '', '']); styles.push({ head: it.color }); return; }
    let c = '';
    if (it.target === 'keep') {
      c = oldC[it.label] || '';
    } else if (it.target.indexOf('form:') === 0) {
      const cell = it.target.slice(5);
      c = '=IF(\'99_設定\'!' + cell + '="","フォーム設定待ち",HYPERLINK(\'99_設定\'!' + cell + ',"フォームを開く"))';
    } else {
      const t = ss.getSheetByName(it.target);
      if (!t) return;                                   // その拠点にないシートは行ごと出さない
      c = t.isSheetHidden() ? '（非表示）'
        : '=HYPERLINK("' + base + t.getSheetId() + '","開く")';
    }
    rows.push([it.label, it.desc || descOf(it.label, alias[it.label]), c]);
    styles.push('item');
  });

  rows.push(['', '', '']); styles.push('blank');
  rows.push(['■ 職員がよく使う手順', '', '']); styles.push({ head: 御守_COLOR.STAFF });
  御守_職員の手順_(site).forEach(r => { rows.push([r[0], r[1], '']); styles.push('step'); });

  if (notes.length) {
    rows.push(['', '', '']); styles.push('blank');
    rows.push(['■ 運用方針', '', '']); styles.push({ head: 御守_COLOR.ANALYSIS });
    notes.forEach(n => { rows.push([n, '', '']); styles.push('note'); });
  }

  // 書き込み（値・書式を消してから）
  sh.getRange(1, 1, sh.getMaxRows(), Math.max(sh.getMaxColumns(), 3)).breakApart();
  sh.clear();
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
  sh.setColumnWidth(1, 230).setColumnWidth(2, 560).setColumnWidth(3, 120);
  sh.getRange(1, 1, rows.length, 3).setFontSize(12).setVerticalAlignment('middle').setWrap(true);

  styles.forEach((st, i) => {
    const r = i + 1, line = sh.getRange(r, 1, 1, 3);
    if (st === 'title') {
      line.merge().setFontSize(18).setFontWeight('bold'); sh.setRowHeight(r, 44);
    } else if (st === 'lead') {
      line.merge().setFontColor('#555555'); sh.setRowHeight(r, 28);
    } else if (st && st.head) {
      line.merge().setBackground(st.head).setFontColor('#ffffff').setFontWeight('bold'); sh.setRowHeight(r, 30);
    } else if (st === 'item') {
      sh.getRange(r, 1).setFontWeight('bold');
      sh.getRange(r, 3).setHorizontalAlignment('center').setFontWeight('bold');
      line.setBorder(null, null, true, null, null, null, '#dddddd', SpreadsheetApp.BorderStyle.SOLID);
      sh.setRowHeight(r, 36);
    } else if (st === 'step') {
      sh.getRange(r, 2, 1, 2).merge();
      sh.getRange(r, 1).setFontWeight('bold'); sh.setRowHeight(r, 30);
    } else if (st === 'note') {
      line.merge().setFontSize(11).setFontColor('#555555'); sh.setRowHeight(r, 30);
    }
  });
  sh.setFrozenRows(0);
  sh.setHiddenGridlines(true);
  log.push('00_入口 を作り直しました（' + rows.length + ' 行）');
}

// ---------------------------------------------------------------------------
// 3. 正月シートの見出し

/**
 * 2行目に式がある列＝自動（灰）、ない列＝入力（黄）。
 * 受付番号・重複防止キーのようにスクリプトが書く列は、見出しの文字で自動とみなす。
 * 列の固定は商品名・お名前（D列）まで。
 */
function 御守_正月シートの見出し_(ss, site, log) {
  [site.prep, site.list].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const width = sh.getLastColumn();
    const fx = sh.getRange(2, 1, 1, width).getFormulas()[0];
    const head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
    const isAuto = (f, i) => !!f || head[i].indexOf('自動') >= 0 || head[i].indexOf('受付番号') === 0;
    const colors = [fx.map((f, i) => (isAuto(f, i) ? 御守_HEAD.AUTO : 御守_HEAD.INPUT))];
    sh.getRange(1, 1, 1, width).setBackgrounds(colors).setFontWeight('bold').setWrap(true)
      .setVerticalAlignment('middle');
    sh.setRowHeight(1, 48);
    if (sh.getFrozenRows() < 1) sh.setFrozenRows(1);
    // 商品名（準備シート D列）・お名前（一覧 D列）が横に送っても見えるように
    if (sh.getFrozenColumns() < 4) sh.setFrozenColumns(4);
    log.push(name + ': 見出しを色分け（黄=入力 / 灰=自動）');
  });
}
