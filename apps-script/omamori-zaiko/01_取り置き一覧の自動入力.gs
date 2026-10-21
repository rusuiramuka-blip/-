/**
 * 御守在庫 — 取り置き一覧は「状況」「お支払い」を選ぶだけで進むようにする
 *
 * メニューや行の選択はスマホのスプレッドシートアプリでは動かないが、
 * セルの編集で動くトリガーはスマホでも動く。そこで、プルダウンを選んだときに
 *   - 同じ受付番号の商品をまとめて同じ状況にする（取り消した商品は除く）
 *   - 取り分けた    → 「取り分けた数」が空なら頼まれた数を入れる
 *   - お渡しした    → お渡し日に今日を入れ、受取時払い・未入金なら支払済みにする
 *   - お渡し前に戻す → お渡し日を消す
 * を自動で行う。
 *
 * 既存の onEdit とぶつからないよう、インストール型トリガーで動かす。
 * 有効にするには、エディタで `御守_取り置きの自動入力を有効にする` を1回実行する。
 */

/** 取り置き一覧の列（両拠点とも同じ並び） */
const 御守_LIST = Object.freeze({
  FIRST: 2, NO: 2, QTY: 10, KEPT: 11, PAY: 14, STATE: 15, HANDED: 16
});

/** 拠点ごとの言葉（一覧のプルダウンの値） */
const 御守_WORDS = Object.freeze({
  '08-2_取り置き一覧': {
    state: { WAIT: '準備待ち', READY: '取り分け済み', DONE: 'お渡し済み', CANCEL: '取消' },
    pay: { UNPAID: '未入金', PAID: '支払済み', ON_PICKUP: '受取時に支払う', FREE: '無料' }
  },
  '08-2_正月取り置き受付': {
    state: { WAIT: '受付', READY: '確保済', DONE: '受渡済', CANCEL: '取消' },
    pay: { UNPAID: '未納', PAID: '入金済', ON_PICKUP: '受取時支払', FREE: '免除' }
  }
});

const 御守_TRIGGER_FN = '御守_取り置き一覧_編集時';

function 御守_取り置きの自動入力を有効にする() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const exists = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 御守_TRIGGER_FN);
  if (!exists) ScriptApp.newTrigger(御守_TRIGGER_FN).forSpreadsheet(ss).onEdit().create();
  console.log(exists ? 'すでに有効です' : '有効にしました');
}

function 御守_取り置きの自動入力を止める() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 御守_TRIGGER_FN)
    .forEach(t => ScriptApp.deleteTrigger(t));
  console.log('止めました');
}

function 御守_取り置き一覧_編集時(e) {
  if (!e || !e.range) return;
  const r = e.range, sh = r.getSheet();
  const words = 御守_WORDS[sh.getName()];
  if (!words) return;
  // 1セルだけの変更に限る（貼り付けや一括削除では動かさない）
  if (r.getNumRows() !== 1 || r.getNumColumns() !== 1 || r.getRow() < 御守_LIST.FIRST) return;
  const col = r.getColumn();
  if (col !== 御守_LIST.STATE && col !== 御守_LIST.PAY) return;

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) return;
  try {
    const n = 御守_変更を反映_(sh, r.getRow(), col, String(r.getValue()), words);
    if (n > 1) e.source.toast('同じ受付の ' + n + ' 行をまとめて更新しました', '取り置き', 4);
  } finally {
    lock.releaseLock();
  }
}

/** 編集した行と同じ受付番号の行に反映する。更新した行数を返す */
function 御守_変更を反映_(sh, editedRow, col, value, words) {
  const S = words.state, P = words.pay;
  const last = sh.getLastRow();
  const width = 御守_LIST.HANDED;
  const v = sh.getRange(御守_LIST.FIRST, 1, last - 御守_LIST.FIRST + 1, width).getValues();
  const no = String(v[editedRow - 御守_LIST.FIRST][御守_LIST.NO - 1]).trim();

  // 対象: 同じ受付番号の行（番号が空なら編集した行だけ）。取り消した商品は巻き込まない
  const targets = [];
  v.forEach((row, i) => {
    const r = 御守_LIST.FIRST + i;
    if (r === editedRow) { targets.push(r); return; }
    if (!no || String(row[御守_LIST.NO - 1]).trim() !== no) return;
    if (row[御守_LIST.STATE - 1] === S.CANCEL) return;
    targets.push(r);
  });
  // 取り消しは商品ごと（1商品だけ取り消すことがあるため、他の行には広げない）
  if (col === 御守_LIST.STATE && value === S.CANCEL) return 1;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let count = 0;
  targets.forEach(r => {
    const row = v[r - 御守_LIST.FIRST];
    let kept = row[御守_LIST.KEPT - 1], pay = row[御守_LIST.PAY - 1];
    let state = row[御守_LIST.STATE - 1], handed = row[御守_LIST.HANDED - 1];

    if (col === 御守_LIST.PAY) {
      if (pay === value && r !== editedRow) return;
      pay = value;
    } else {
      state = value;
      if (value === S.READY || value === S.DONE) {
        if (kept === '' || kept === null) kept = row[御守_LIST.QTY - 1];
      }
      if (value === S.DONE) {
        if (!handed) handed = today;
        if (pay === P.UNPAID || pay === P.ON_PICKUP) pay = P.PAID;
      } else {
        handed = '';
      }
    }
    // L・M 列は数式なので、K と N〜P を分けて書く
    sh.getRange(r, 御守_LIST.KEPT).setValue(kept);
    sh.getRange(r, 御守_LIST.PAY, 1, 3).setValues([[pay, state, handed]]);
    if (handed) sh.getRange(r, 御守_LIST.HANDED).setNumberFormat('yyyy/mm/dd');
    count++;
  });
  return count;
}
