/**
 * 巫女勤怠・給与管理 — 管理者用 Apps Script
 *
 * 対象: 巫女勤怠・給与管理（再構築版・完成）
 *       1GOBCBElaR586D6roa4_JlHfl3Sup5XR3KGAcaXYbYGM
 *
 * 注意: 現場用プロジェクトとは必ず別の Apps Script に置くこと。
 *
 * 旧版からの主な修正
 *  - 承認条件を「実績送信済」だけでなく「管理者修正」も許すようにした。
 *    旧版は onEdit が AL に「変更あり」を書いたあと戻す処理が無く、
 *    一度実績を直すと二度と承認できない片道切符になっていた。
 *  - onEdit を行ごとの逐次処理から範囲一括処理へ。
 *  - 締め済み行を編集したときに履歴を残し、値を書き戻すようにした。
 *  - 条件に合わず飛ばした行を必ず報告するようにした。
 *  - 必須シートに _設定 を追加（T〜AB 列の数式が参照している）。
 *  - _履歴 は末尾追記にし、満杯で全操作が止まらないようにした。
 *  - PDF 出力の応答コードを確認するようにした。
 */

const PAY = Object.freeze({
  HOME: '00_給与ホーム',
  ATTENDANCE: '01_勤怠承認',
  PERSONAL: '02_個人別給与',
  SETTLEMENT: '03_本日の最終日精算',
  CASH: '04_出金・支給記録',
  SLIP: '05_給与明細',
  ERROR: '06_労務・エラー',
  STAFF: '07_スタッフ・賃金',
  IMPORT: '_取込',
  SETTING: '_設定',
  HISTORY: '_履歴'
});

/** 01_勤怠承認（ヘッダ4行目 / データ5行目〜 / A〜AL） */
const ATT = Object.freeze({
  FIRST: 5, LAST: 503, WIDTH: 38,
  ID: 1, DATE: 2, STAFF_ID: 3, NAME: 4, KIND: 5,
  PLAN_IN: 6, PLAN_OUT: 7, PLAN_BREAK: 8,
  ACT_IN: 9, ACT_OUT: 10, ACT_BREAK: 11, NIGHT_BREAK: 12,
  WAGE_KIND: 13, OTHER_PAY: 14,
  APPROVE_STATE: 15, APPROVER: 16, APPROVED_AT: 17,
  RATE: 18, TRANSPORT: 19,
  HOURS: 20, OVERTIME: 21, NIGHT: 22,
  BASE_PAY: 23, OT_PAY: 24, NIGHT_PAY: 25, TRANSPORT_PAY: 26, OTHER: 27, GROSS: 28,
  CLOSE_STATE: 29, CLOSE_ID: 30, WARN: 31, UPDATED: 32,
  DIFF_KIND: 33, DIFF_MIN: 34, REASON: 35,
  CHECKER: 36, CHECKED_AT: 37, ACTUAL_SEND: 38
});

/** 02_個人別給与（ヘッダ4行目 / データ5行目〜） */
const PER = Object.freeze({
  FIRST: 5, LAST: 204, WIDTH: 14,
  STAFF_ID: 1, NAME: 2, LAST_DATE: 3, APPROVED_COUNT: 4, HOURS: 5,
  GROSS: 6, TAX: 7, LEGAL_DEDUCTION: 8, NET: 9,
  SETTLEMENT_DATE: 10, CLOSE_STATE: 11, CLOSE_ID: 12, PAY_STATE: 13, WARN: 14
});

/** 04_出金・支給記録 */
const CASH = Object.freeze({
  OUT_FIRST: 6, OUT_LAST: 106, OUT_WIDTH: 9,
  OUT_ID: 1, OUT_AT: 2, AMOUNT: 3, PURPOSE: 4, PAYER: 5,
  VERIFIER: 6, PLACE: 7, BALANCE: 8, OUT_NOTE: 9,

  LOG_FIRST: 111, LOG_LAST: 610, LOG_WIDTH: 12,
  PAY_ID: 1, STAFF_ID: 2, NAME: 3, PAID_AT: 4, PAY_AMOUNT: 5,
  CASH_AMOUNT: 6, METHOD: 7, PAYER2: 8,
  RECEIVE_STATE: 9, RECEIVED_AT: 10, RECEIVER: 11, LOG_NOTE: 12
});

/** 07_スタッフ・賃金 */
const WAGE = Object.freeze({ FIRST: 5, LAST: 204, WIDTH: 16, STAFF_ID: 1, TAX_KIND: 12 });

/** 承認済とみなす状態 */
const RESOLVED = Object.freeze(['承認済', '欠勤確定', '事前取消', '取消', '除外']);
/** 承認を認める実績連携の状態 */
const SENDABLE = Object.freeze(['実績送信済', '管理者修正']);

// ───────────────────────────────── メニュー

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('勤怠・給与')
    .addItem('初回設定・動作確認', 'setupAndCheck')
    .addItem('計算式を修復', 'repairAttendanceFormulas')
    .addSeparator()
    .addItem('選択した勤怠を承認', 'approveSelectedAttendance')
    .addItem('選択した勤怠の承認を解除', 'releaseSelectedApproval')
    .addSeparator()
    .addItem('選択した人を個人締め', 'closeSelectedPayroll')
    .addItem('選択した人の締めを解除', 'releaseSelectedClose')
    .addItem('選択した人の給与明細を表示', 'preparePayslipForSelected')
    .addItem('給与明細をPDF', 'exportPayslipPdf')
    .addSeparator()
    .addItem('現金出金を記録', 'recordCashOutflow')
    .addItem('選択した人を支給済みにする', 'markSelectedPaid')
    .addItem('支給を取り消す', 'cancelSelectedPayment')
    .addItem('選択した支給を受領済みにする', 'markSelectedReceived')
    .addToUi();
}

function setupAndCheck() {
  runSafely_('初回設定・動作確認', function () {
    const ss = SpreadsheetApp.getActive();
    // 旧版は _設定 が抜けていた。T〜AB 列の数式が参照している。
    [PAY.HOME, PAY.ATTENDANCE, PAY.PERSONAL, PAY.SETTLEMENT, PAY.CASH, PAY.SLIP,
     PAY.ERROR, PAY.STAFF, PAY.IMPORT, PAY.SETTING, PAY.HISTORY].forEach(function (name) {
      requireSheet_(ss, name);
    });
    ensureWarningProtections_(ss);
    SpreadsheetApp.getUi().alert(
      '動作確認が完了しました。\n\n' +
      '1. 現場から確定シフトを受信\n' +
      '2. 現場から当日実績を受信（AL 実績連携＝実績送信済）\n' +
      '3. 差異と警告を確認\n4. 承認\n5. 個人締め\n6. 支給・受領記録');
  });
}

// ───────────────────────────────── 編集監視

/**
 * 承認後に実績を直したら未確認へ戻す。
 * 旧版は 1 行ずつ読み書きしていたため、貼り付けで 30 秒制限を超えていた。
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== PAY.ATTENDANCE) return;

  const first = Math.max(e.range.getRow(), ATT.FIRST);
  const last = Math.min(e.range.getLastRow(), ATT.LAST);
  if (first > last) return;
  // I〜N（実績・深夜休憩・賃金区分・その他手当）の編集だけを見る
  if (e.range.getLastColumn() < ATT.ACT_IN || e.range.getColumn() > ATT.OTHER_PAY) return;

  const rowCount = last - first + 1;
  const values = sheet.getRange(first, 1, rowCount, ATT.WIDTH).getValues();
  const now = new Date();
  const ss = e.source || SpreadsheetApp.getActive();

  const reverted = [];
  const closed = [];
  const history = [];

  for (let i = 0; i < rowCount; i++) {
    const v = values[i];
    const row = first + i;
    if (!v[ATT.ID - 1]) continue;

    // 締め済みは金額が凍結済み。編集しても給与は動かないので、必ず記録に残す。
    if (String(v[ATT.CLOSE_STATE - 1]).trim() === '締め済') {
      closed.push(row);
      history.push(['締め後編集の検出', v[ATT.ID - 1], v[ATT.STAFF_ID - 1], v[ATT.DATE - 1],
        '締め済', '締め済（編集あり）', '締め済みの勤怠が編集されました。個人締めを解除して確認してください。']);
      continue;
    }

    const before = String(v[ATT.APPROVE_STATE - 1] || '').trim();
    if (RESOLVED.indexOf(before) === -1) continue;

    reverted.push({ row: row, v: v, before: before });
    history.push(['実績確定後修正', v[ATT.ID - 1], v[ATT.STAFF_ID - 1], v[ATT.DATE - 1],
      before, '未確認', '実績欄が編集されたため再確認が必要']);
  }

  reverted.forEach(function (t) {
    sheet.getRange(t.row, ATT.APPROVE_STATE, 1, 3).setValues([['未確認', '', '']]);
    sheet.getRange(t.row, ATT.RATE).setFormula(rateFormula_(t.row));
    sheet.getRange(t.row, ATT.TRANSPORT).setFormula(transportFormula_(t.row));
    sheet.getRange(t.row, ATT.UPDATED).setValue(now);
    // 「変更あり」ではなく「管理者修正」。承認側がこれを受け付けるので詰まらない。
    sheet.getRange(t.row, ATT.ACTUAL_SEND).setValue('管理者修正');
  });

  if (closed.length) {
    sheet.getRangeList(closed.map(function (r) {
      return 'I' + r + ':N' + r;
    })).setNote('締め済みの勤怠です。個人締めを解除してから修正してください。');
    ss.toast('行' + closed.join('・') + ' は締め済みです。個人締めを解除して確認してください。', '勤怠保護', 10);
  }

  if (history.length) appendHistoryRows_(ss, history, activeUser_());
}

// ───────────────────────────────── 承認

function approveSelectedAttendance() {
  runSafely_('勤怠承認', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, PAY.ATTENDANCE);
      SpreadsheetApp.flush();
      const rows = selectedDataRows_(sheet, ATT.FIRST, ATT.LAST);
      const user = requireActor_();
      const now = new Date();

      const items = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, ATT.WIDTH).getValues()[0];
        if (!String(v[ATT.ID - 1] || '').trim()) return;
        if (String(v[ATT.APPROVE_STATE - 1]).trim() === '承認済') {
          skipped.push('行' + row + '：すでに承認済');
          return;
        }
        items.push({ row: row, v: v });
      });

      // 先に全行を検証し、途中まで承認される状態を防ぐ
      items.forEach(function (item) {
        const row = item.row;
        const v = item.v;
        const state = String(v[ATT.APPROVE_STATE - 1] || '').trim();
        if (['欠勤確定', '事前取消', '取消', '除外'].indexOf(state) !== -1) {
          throw new Error('行' + row + ': ' + state + ' の行は勤務承認できません。');
        }
        if (String(v[ATT.CLOSE_STATE - 1]).trim() === '締め済') {
          throw new Error('行' + row + ': 締め済みです。先に個人締めを解除してください。');
        }
        if (SENDABLE.indexOf(String(v[ATT.ACTUAL_SEND - 1] || '').trim()) === -1) {
          throw new Error('行' + row + ': 現場側から当日実績を送信してください。\n' +
            '（現場ファイルの「当日実績を給与へ送信」）');
        }
        if (String(v[ATT.WARN - 1] || '').trim()) {
          throw new Error('行' + row + ': 警告を解消してください。\n' + v[ATT.WARN - 1]);
        }
        if (v[ATT.ACT_IN - 1] === '' || v[ATT.ACT_OUT - 1] === '' || v[ATT.ACT_BREAK - 1] === '') {
          throw new Error('行' + row + ': 実出勤・実退勤・実休憩を入力してください。');
        }
        const rate = Number(v[ATT.RATE - 1]);
        if (!isFinite(rate) || rate <= 0) {
          throw new Error('行' + row + ': 時給が未設定です。\n' +
            'スタッフID（C列）が 07_スタッフ・賃金 と一致しているか確認してください。');
        }
      });

      const history = [];
      items.forEach(function (item) {
        const row = item.row;
        const v = item.v;
        // 承認した時点の時給・交通費を静的値で固定する（後日のマスタ改定から守る）
        sheet.getRange(row, ATT.RATE, 1, 2)
          .setValues([[Number(v[ATT.RATE - 1]), Number(v[ATT.TRANSPORT - 1] || 0)]]);
        sheet.getRange(row, ATT.APPROVE_STATE, 1, 3).setValues([['承認済', user, now]]);
        sheet.getRange(row, ATT.UPDATED).setValue(now);
        history.push(['勤怠承認', v[ATT.ID - 1], v[ATT.STAFF_ID - 1], v[ATT.DATE - 1],
          String(v[ATT.APPROVE_STATE - 1] || '未確認'), '承認済', '']);
      });
      appendHistoryRows_(ss, history, user);

      SpreadsheetApp.flush();
      reportSkipped_('勤怠承認', items.length, skipped);
    });
  });
}

function releaseSelectedApproval() {
  runSafely_('承認解除', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, PAY.ATTENDANCE);
      const reason = askRequired_('承認解除の理由', '理由を入力してください。');
      const rows = selectedDataRows_(sheet, ATT.FIRST, ATT.LAST);
      const user = requireActor_();
      const now = new Date();

      const items = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, ATT.WIDTH).getValues()[0];
        if (!v[ATT.ID - 1]) return;
        if (String(v[ATT.APPROVE_STATE - 1]).trim() !== '承認済') {
          skipped.push('行' + row + '：承認済ではありません'); return;
        }
        items.push({ row: row, v: v });
      });

      items.forEach(function (item) {
        if (String(item.v[ATT.CLOSE_STATE - 1]).trim() === '締め済') {
          throw new Error('行' + item.row + ': 締め済みです。先に個人締めを解除してください。');
        }
      });

      const history = [];
      items.forEach(function (item) {
        const row = item.row;
        const v = item.v;
        sheet.getRange(row, ATT.APPROVE_STATE, 1, 3).setValues([['未確認', '', '']]);
        sheet.getRange(row, ATT.RATE).setFormula(rateFormula_(row));
        sheet.getRange(row, ATT.TRANSPORT).setFormula(transportFormula_(row));
        sheet.getRange(row, ATT.UPDATED).setValue(now);
        history.push(['勤怠承認解除', v[ATT.ID - 1], v[ATT.STAFF_ID - 1], v[ATT.DATE - 1],
          '承認済', '未確認', reason]);
      });
      appendHistoryRows_(ss, history, user);

      SpreadsheetApp.flush();
      reportSkipped_('承認解除', items.length, skipped);
    });
  });
}

// ───────────────────────────────── 個人締め

function closeSelectedPayroll() {
  runSafely_('個人締め', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, PAY.PERSONAL);
      SpreadsheetApp.flush();
      const rows = selectedDataRows_(sheet, PER.FIRST, PER.LAST);
      const settlementDate = requireSheet_(ss, PAY.SETTLEMENT).getRange('B3').getValue();
      if (!(settlementDate instanceof Date)) {
        throw new Error('03_本日の最終日精算!B3 に精算日を入れてください。');
      }
      const user = requireActor_();
      const now = new Date();

      const items = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, PER.WIDTH).getValues()[0];
        if (!v[PER.STAFF_ID - 1]) return;
        const name = v[PER.NAME - 1] || v[PER.STAFF_ID - 1];
        if (String(v[PER.CLOSE_STATE - 1]).trim() === '締め済') {
          skipped.push(name + '：すでに締め済'); return;
        }
        if (Number(v[PER.APPROVED_COUNT - 1] || 0) <= 0) {
          skipped.push(name + '：承認済の勤怠がありません'); return;
        }
        // 精算予定日は「未確認の勤怠が残っていると空になる」数式。
        // 旧版はここで黙って除外していたが、いちばん締めてはいけない人なので理由を出す。
        if (!(v[PER.SETTLEMENT_DATE - 1] instanceof Date)) {
          skipped.push(name + '：精算予定日が空です（未確認の勤怠が残っています）'); return;
        }
        items.push({ row: row, v: v, name: name });
      });

      items.forEach(function (item) {
        const v = item.v;
        if (v[PER.SETTLEMENT_DATE - 1] > settlementDate) {
          throw new Error(item.name + ': 精算予定日が選択した精算日より後です。');
        }
        if (String(v[PER.WARN - 1] || '').trim()) {
          throw new Error(item.name + ': 警告を解消してください。\n' + v[PER.WARN - 1]);
        }
        if (v[PER.TAX - 1] === '') {
          throw new Error(item.name + ': 源泉所得税を、0円の場合も含めて入力してください。');
        }
        assertTaxKindDecided_(ss, String(v[PER.STAFF_ID - 1]).trim(), item.name);
        ensureAllAttendanceApproved_(ss, String(v[PER.STAFF_ID - 1]).trim(), v[PER.SETTLEMENT_DATE - 1]);
      });

      const history = [];
      items.forEach(function (item) {
        const row = item.row;
        const v = item.v;
        const staffId = String(v[PER.STAFF_ID - 1]).trim();
        const closeId = 'CL-' + formatDate_(v[PER.SETTLEMENT_DATE - 1], 'yyyyMMdd') +
          '-' + staffId + '-' + formatDate_(now, 'HHmmss');

        // C〜J を数式から静的値へ（締めた時点の金額を固定する）
        const frozen = sheet.getRange(row, PER.LAST_DATE, 1, 8).getValues();
        sheet.getRange(row, PER.LAST_DATE, 1, 8).setValues(frozen);
        sheet.getRange(row, PER.CLOSE_STATE, 1, 2).setValues([['締め済', closeId]]);

        markAttendanceClosed_(ss, staffId, closeId, v[PER.SETTLEMENT_DATE - 1], now);
        history.push(['個人締め', '', staffId, v[PER.SETTLEMENT_DATE - 1],
          '未締め', '締め済 ' + closeId, '']);
      });
      appendHistoryRows_(ss, history, user);

      SpreadsheetApp.flush();
      reportSkipped_('個人締め', items.length, skipped);
    });
  });
}

function releaseSelectedClose() {
  runSafely_('締め解除', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, PAY.PERSONAL);
      const reason = askRequired_('締め解除の理由', '理由を入力してください。');
      const rows = selectedDataRows_(sheet, PER.FIRST, PER.LAST);
      const user = requireActor_();
      const attendance = requireSheet_(ss, PAY.ATTENDANCE);

      const items = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, PER.WIDTH).getValues()[0];
        if (!v[PER.STAFF_ID - 1]) return;
        if (String(v[PER.CLOSE_STATE - 1]).trim() !== '締め済') {
          skipped.push('行' + row + '：締め済ではありません'); return;
        }
        items.push({ row: row, v: v });
      });

      items.forEach(function (item) {
        if (String(item.v[PER.PAY_STATE - 1]).trim() === '支給済') {
          throw new Error('行' + item.row + ': 支給済みです。先に「支給を取り消す」を実行してください。');
        }
      });

      // 旧版は 1 件ごとに 01_勤怠承認 の全行を読み直していた。1 回だけ読む。
      const attRowCount = ATT.LAST - ATT.FIRST + 1;
      const attData = attendance.getRange(ATT.FIRST, 1, attRowCount, ATT.WIDTH).getValues();
      const now = new Date();
      const history = [];

      items.forEach(function (item) {
        const row = item.row;
        const v = item.v;
        const staffId = String(v[PER.STAFF_ID - 1]).trim();
        const closeId = String(v[PER.CLOSE_ID - 1] || '');

        sheet.getRange(row, PER.CLOSE_STATE, 1, 2).setValues([['未締め', '']]);
        restorePayrollFormulas_(sheet, row);

        attData.forEach(function (r, i) {
          if (String(r[ATT.STAFF_ID - 1]) !== staffId) return;
          if (String(r[ATT.CLOSE_ID - 1]) !== closeId) return;
          const attRow = ATT.FIRST + i;
          attendance.getRange(attRow, ATT.CLOSE_STATE, 1, 2).setValues([['未締め', '']]);
          restoreAttendanceCalculationFormulas_(attendance, attRow);
          attendance.getRange(attRow, ATT.ACT_IN, 1, 6).clearNote();
          attendance.getRange(attRow, ATT.UPDATED).setValue(now);
        });

        history.push(['個人締め解除', '', staffId, v[PER.SETTLEMENT_DATE - 1],
          '締め済 ' + closeId, '未締め', reason]);
      });
      appendHistoryRows_(ss, history, user);

      SpreadsheetApp.flush();
      reportSkipped_('締め解除', items.length, skipped);
    });
  });
}

function ensureAllAttendanceApproved_(ss, staffId, settlementDate) {
  const sheet = requireSheet_(ss, PAY.ATTENDANCE);
  const rowCount = ATT.LAST - ATT.FIRST + 1;
  const rows = sheet.getRange(ATT.FIRST, 1, rowCount, ATT.APPROVE_STATE).getValues();
  const bad = rows.filter(function (r) {
    return String(r[ATT.STAFF_ID - 1]) === String(staffId) && r[ATT.ID - 1] &&
      r[ATT.DATE - 1] instanceof Date && r[ATT.DATE - 1] <= settlementDate &&
      RESOLVED.indexOf(String(r[ATT.APPROVE_STATE - 1])) === -1;
  });
  if (bad.length) {
    throw new Error(staffId + ': 未確認の勤怠が' + bad.length + '件あります。先に承認してください。');
  }
}

/** 源泉区分が未判定のまま締めさせない */
function assertTaxKindDecided_(ss, staffId, name) {
  const sheet = requireSheet_(ss, PAY.STAFF);
  const rowCount = WAGE.LAST - WAGE.FIRST + 1;
  const rows = sheet.getRange(WAGE.FIRST, 1, rowCount, WAGE.WIDTH).getDisplayValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][WAGE.STAFF_ID - 1]).trim() !== staffId) continue;
    const kind = String(rows[i][WAGE.TAX_KIND - 1] || '').trim();
    if (!kind || kind === '未判定') {
      throw new Error(name + ': 07_スタッフ・賃金 の源泉区分が「' + (kind || '空欄') + '」です。\n' +
        '日額表の丙欄・甲欄などを確定してから締めてください。');
    }
    return;
  }
  throw new Error(name + ': 07_スタッフ・賃金 に登録がありません。');
}

function markAttendanceClosed_(ss, staffId, closeId, settlementDate, now) {
  const sheet = requireSheet_(ss, PAY.ATTENDANCE);
  const rowCount = ATT.LAST - ATT.FIRST + 1;
  const rows = sheet.getRange(ATT.FIRST, 1, rowCount, ATT.WIDTH).getValues();
  const notes = [];

  rows.forEach(function (r, i) {
    if (String(r[ATT.STAFF_ID - 1]) !== String(staffId)) return;
    if (!r[ATT.ID - 1] || !(r[ATT.DATE - 1] instanceof Date)) return;
    if (r[ATT.DATE - 1] > settlementDate) return;
    if (RESOLVED.indexOf(String(r[ATT.APPROVE_STATE - 1])) === -1) return;

    const row = ATT.FIRST + i;
    if (String(r[ATT.APPROVE_STATE - 1]) === '承認済') {
      // T〜AB を静的値へ（締めた時点の金額を固定する）
      const frozen = sheet.getRange(row, ATT.HOURS, 1, 9).getValues();
      sheet.getRange(row, ATT.HOURS, 1, 9).setValues(frozen);
    }
    sheet.getRange(row, ATT.CLOSE_STATE, 1, 2).setValues([['締め済', closeId]]);
    sheet.getRange(row, ATT.UPDATED).setValue(now);
    notes.push('I' + row + ':N' + row);
  });

  if (notes.length) {
    sheet.getRangeList(notes).setNote('締め済みの勤怠です。修正する場合は先に個人締めを解除してください。');
  }
}

// ───────────────────────────────── 給与明細

function preparePayslipForSelected() {
  runSafely_('給与明細の表示', function () {
    const ss = SpreadsheetApp.getActive();
    const personal = requireActiveSheet_(ss, PAY.PERSONAL);
    const row = selectedDataRows_(personal, PER.FIRST, PER.LAST)[0];
    const v = personal.getRange(row, 1, 1, PER.WIDTH).getValues()[0];
    if (!v[PER.STAFF_ID - 1]) throw new Error('スタッフの行を選択してください。');
    const slip = requireSheet_(ss, PAY.SLIP);
    slip.getRange('B3').setValue(v[PER.STAFF_ID - 1]);
    ss.setActiveSheet(slip);
  });
}

function exportPayslipPdf() {
  runSafely_('給与明細PDF', function () {
    // 05_給与明細!B3 は共有状態。2人が同時に操作すると他人の明細が出るので直列化する。
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireSheet_(ss, PAY.SLIP);
      SpreadsheetApp.flush();
      const name = String(sheet.getRange('D3').getDisplayValue()).trim();
      const warning = String(sheet.getRange('A11').getDisplayValue()).trim();
      if (!name) throw new Error('給与明細で氏名を選んでください。');
      if (warning) throw new Error(warning);
      const blob = exportSheetPdf_(ss, sheet, '給与明細_' + safeName_(name));
      showCreatedFile_(saveBesideSpreadsheet_(ss, blob));
    });
  });
}

// ───────────────────────────────── 現金・支給

function recordCashOutflow() {
  runSafely_('現金出金', function () {
    withDocumentLock_(function () {
      const amountText = askRequired_('現金出金', '出金額を数字で入力してください。');
      const amount = Number(String(amountText).replace(/[,，円¥￥\s]/g, ''));
      if (!isFinite(amount) || amount <= 0) throw new Error('正しい出金額を入力してください。');
      const verifier = askRequired_('現金出金', '確認者を入力してください。');
      const location = askRequired_('現金出金', '保管場所を入力してください。');

      const ss = SpreadsheetApp.getActive();
      const sheet = requireSheet_(ss, PAY.CASH);
      const row = nextBlankRow_(sheet, CASH.OUT_FIRST, CASH.OUT_LAST, CASH.OUT_ID);
      const now = new Date();
      const id = 'OUT-' + formatDate_(now, 'yyyyMMdd-HHmmss');
      const user = requireActor_();

      sheet.getRange(row, 1, 1, CASH.OUT_WIDTH).setValues([[
        id, now, amount, '給与準備', user, verifier, location, '', ''
      ]]);
      // 残額は静的値ではなく式にする。支給するたびに減る。
      sheet.getRange(row, CASH.BALANCE).setFormula(
        '=$C' + row + '-SUMIFS($F$' + CASH.LOG_FIRST + ':$F$' + CASH.LOG_LAST +
        ',$G$' + CASH.LOG_FIRST + ':$G$' + CASH.LOG_LAST + ',"現金手渡し")');

      appendHistoryRows_(ss, [['現金出金', '', '', now, '', String(amount), '保管: ' + location]], user);
      SpreadsheetApp.getUi().alert('出金記録を保存しました。\n' + id);
    });
  });
}

function markSelectedPaid() {
  runSafely_('給与支給', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const personal = requireActiveSheet_(ss, PAY.PERSONAL);
      const methodInput = askRequired_('給与支給', '支払方法を「現金手渡し」または「振込」で入力してください。');
      const method = methodInput === '現金' ? '現金手渡し' : methodInput;
      if (method !== '現金手渡し' && method !== '振込') {
        throw new Error('支払方法は「現金手渡し」または「振込」です。');
      }
      const rows = selectedDataRows_(personal, PER.FIRST, PER.LAST);
      const cash = requireSheet_(ss, PAY.CASH);
      const user = requireActor_();

      const items = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = personal.getRange(row, 1, 1, PER.WIDTH).getValues()[0];
        if (!v[PER.STAFF_ID - 1]) return;
        const name = v[PER.NAME - 1] || v[PER.STAFF_ID - 1];
        if (String(v[PER.PAY_STATE - 1]).trim() === '支給済') {
          skipped.push(name + '：すでに支給済'); return;
        }
        items.push({ row: row, v: v, name: name });
      });

      items.forEach(function (item) {
        if (String(item.v[PER.CLOSE_STATE - 1]).trim() !== '締め済') {
          throw new Error(item.name + ': 個人締めが未完了です。');
        }
        const net = Number(item.v[PER.NET - 1]);
        if (!isFinite(net) || net < 0) throw new Error(item.name + ': 差引支給額を確認してください。');
      });

      if (items.length > countBlankRows_(cash, CASH.LOG_FIRST, CASH.LOG_LAST, CASH.PAY_ID)) {
        throw new Error('04_出金・支給記録 の個人別支給欄に必要な空き行がありません。');
      }

      // 現金手渡しは手許残高を超えないか確認する
      if (method === '現金手渡し') {
        const total = items.reduce(function (s, item) { return s + Number(item.v[PER.NET - 1] || 0); }, 0);
        const balance = cashBalance_(cash);
        if (total > balance) {
          throw new Error('現金の残額が不足しています。\n' +
            '支給合計 ' + total.toLocaleString() + '円 / 残額 ' + balance.toLocaleString() + '円\n' +
            '先に「現金出金を記録」を実行してください。');
        }
      }

      const history = [];
      items.forEach(function (item) {
        const v = item.v;
        const now = new Date();
        const payId = 'PAY-' + formatDate_(now, 'yyyyMMdd-HHmmss') + '-' + v[PER.STAFF_ID - 1];
        const logRow = nextBlankRow_(cash, CASH.LOG_FIRST, CASH.LOG_LAST, CASH.PAY_ID);
        const amount = Number(v[PER.NET - 1] || 0);

        cash.getRange(logRow, 1, 1, CASH.LOG_WIDTH).setValues([[
          payId, v[PER.STAFF_ID - 1], v[PER.NAME - 1], now, amount,
          method === '現金手渡し' ? amount : 0, method, user, '未受領', '', '', ''
        ]]);
        personal.getRange(item.row, PER.PAY_STATE).setValue('支給済');
        history.push(['給与支給', '', v[PER.STAFF_ID - 1], v[PER.SETTLEMENT_DATE - 1],
          '未支給', '支給済 ' + payId, method]);
      });
      appendHistoryRows_(ss, history, user);

      SpreadsheetApp.flush();
      reportSkipped_('給与支給', items.length, skipped);
    });
  });
}

/** 旧版には支給の取消が無く、間違えると手作業になっていた。 */
function cancelSelectedPayment() {
  runSafely_('支給の取消', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const cash = requireActiveSheet_(ss, PAY.CASH);
      const rows = selectedDataRows_(cash, CASH.LOG_FIRST, CASH.LOG_LAST);
      const reason = askRequired_('支給の取消', '取り消す理由を入力してください。');
      const user = requireActor_();
      const personal = requireSheet_(ss, PAY.PERSONAL);
      const perRowCount = PER.LAST - PER.FIRST + 1;
      const perData = personal.getRange(PER.FIRST, 1, perRowCount, PER.WIDTH).getDisplayValues();

      const items = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = cash.getRange(row, 1, 1, CASH.LOG_WIDTH).getValues()[0];
        if (!v[CASH.PAY_ID - 1]) return;
        if (String(v[CASH.RECEIVE_STATE - 1]).trim() === '受領済') {
          skipped.push('行' + row + '：本人受領済みのため取り消せません'); return;
        }
        items.push({ row: row, v: v });
      });

      if (!items.length) { reportSkipped_('支給の取消', 0, skipped); return; }

      const history = [];
      items.forEach(function (item) {
        const v = item.v;
        const staffId = String(v[CASH.STAFF_ID - 1]).trim();
        cash.getRange(item.row, 1, 1, CASH.LOG_WIDTH)
          .setValues([['', '', '', '', '', '', '', '', '', '', '', '']]);

        perData.forEach(function (r, i) {
          if (String(r[PER.STAFF_ID - 1]).trim() !== staffId) return;
          personal.getRange(PER.FIRST + i, PER.PAY_STATE).setValue('未支給');
        });
        history.push(['給与支給の取消', '', staffId, v[CASH.PAID_AT - 1],
          '支給済 ' + v[CASH.PAY_ID - 1], '未支給', reason]);
      });
      appendHistoryRows_(ss, history, user);

      SpreadsheetApp.flush();
      reportSkipped_('支給の取消', items.length, skipped);
    });
  });
}

function markSelectedReceived() {
  runSafely_('本人受領', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, PAY.CASH);
      const rows = selectedDataRows_(sheet, CASH.LOG_FIRST, CASH.LOG_LAST);
      const user = requireActor_();

      const items = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, CASH.LOG_WIDTH).getValues()[0];
        if (!v[CASH.PAY_ID - 1]) return;
        if (String(v[CASH.RECEIVE_STATE - 1]).trim() === '受領済') {
          skipped.push('行' + row + '：すでに受領済'); return;
        }
        items.push({ row: row, v: v });
      });

      const history = [];
      const now = new Date();
      items.forEach(function (item) {
        sheet.getRange(item.row, CASH.RECEIVE_STATE, 1, 3).setValues([['受領済', now, user]]);
        history.push(['本人受領', '', item.v[CASH.STAFF_ID - 1], item.v[CASH.PAID_AT - 1],
          '未受領', '受領済', String(item.v[CASH.PAY_ID - 1])]);
      });
      appendHistoryRows_(ss, history, user);

      SpreadsheetApp.flush();
      reportSkipped_('本人受領', items.length, skipped);
    });
  });
}

function cashBalance_(cash) {
  const rowCount = CASH.OUT_LAST - CASH.OUT_FIRST + 1;
  const out = cash.getRange(CASH.OUT_FIRST, CASH.AMOUNT, rowCount, 1).getValues();
  const total = out.reduce(function (s, r) { return s + (Number(r[0]) || 0); }, 0);
  const logCount = CASH.LOG_LAST - CASH.LOG_FIRST + 1;
  const paid = cash.getRange(CASH.LOG_FIRST, CASH.CASH_AMOUNT, logCount, 1).getValues();
  const used = paid.reduce(function (s, r) { return s + (Number(r[0]) || 0); }, 0);
  return total - used;
}
