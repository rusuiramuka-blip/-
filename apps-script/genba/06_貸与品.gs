/**
 * 06_食事・貸与 の襦袢台帳
 *
 * 【重要な修正】旧版は列番号が実シートと全部ずれていた。
 *   実シート: A スタッフID / B 氏名 / C 襦袢 / D 貸出状態 / E 返却状態 /
 *             F 直接回収状態 / G 回収日時 / H 回収担当 / I 備考
 *   旧コード: 貸出=E, 返却=F, 直接回収=N, 回収日時=O, 回収担当=Q
 * このため「貸出済にする」が返却状態と直接回収状態を書き潰し、
 * 「返却済にする」は判定が常に外れて例外になっていた。
 */

function markSelectedJubanLoaned() {
  runSafely_('襦袢の貸出', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, SH.LEDGER);
      const items = ledgerItems_(sheet, selectedDataRows_(sheet, LEDGER.FIRST, LEDGER.LAST));

      const targets = [];
      const skipped = [];
      items.forEach(function (item) {
        if (item.v[LEDGER.JUBAN - 1] !== '貸与') {
          skipped.push('行' + item.row + '：襦袢が「貸与」ではありません'); return;
        }
        if (item.v[LEDGER.LOAN - 1] === '貸出済') {
          skipped.push('行' + item.row + '：すでに貸出済'); return;
        }
        targets.push(item);
      });

      targets.forEach(function (item) {
        // D 貸出状態 / E 返却状態
        sheet.getRange(item.row, LEDGER.LOAN, 1, 2).setValues([['貸出済', '未返却']]);
        // F 直接回収状態 / G 回収日時 / H 回収担当
        sheet.getRange(item.row, LEDGER.COLLECT, 1, 3).setValues([['未回収', '', '']]);
      });

      SpreadsheetApp.flush();
      reportSkipped_('襦袢の貸出', targets.length, skipped);
    });
  });
}

function markSelectedJubanReturned() {
  runSafely_('襦袢の返却', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, SH.LEDGER);
      const items = ledgerItems_(sheet, selectedDataRows_(sheet, LEDGER.FIRST, LEDGER.LAST));

      const targets = [];
      const skipped = [];
      items.forEach(function (item) {
        if (item.v[LEDGER.JUBAN - 1] !== '貸与') {
          skipped.push('行' + item.row + '：襦袢が「貸与」ではありません'); return;
        }
        if (item.v[LEDGER.LOAN - 1] !== '貸出済') {
          skipped.push('行' + item.row + '：貸出記録がありません'); return;
        }
        if (item.v[LEDGER.RETURN - 1] === '返却済') {
          skipped.push('行' + item.row + '：すでに返却済'); return;
        }
        targets.push(item);
      });

      targets.forEach(function (item) {
        sheet.getRange(item.row, LEDGER.RETURN).setValue('返却済');
      });

      SpreadsheetApp.flush();
      reportSkipped_('襦袢の返却', targets.length, skipped);
    });
  });
}

/**
 * クリーニング代などを給与手渡しのあとに本人から直接受け取ったときの記録。
 * 給与側の支給状態を確認してからでないと記録できない。
 */
function markSelectedCleaningCollected() {
  runSafely_('直接回収の記録', function () {
    withDocumentLock_(function () {
      const field = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(field, SH.LEDGER);
      const items = ledgerItems_(sheet, selectedDataRows_(sheet, LEDGER.FIRST, LEDGER.LAST));

      const targets = [];
      const skipped = [];
      items.forEach(function (item) {
        if (item.v[LEDGER.COLLECT - 1] === '回収済') {
          skipped.push('行' + item.row + '：すでに回収済'); return;
        }
        if (item.v[LEDGER.JUBAN - 1] !== '貸与') {
          skipped.push('行' + item.row + '：襦袢の借用者ではありません'); return;
        }
        if (item.v[LEDGER.LOAN - 1] !== '貸出済') {
          skipped.push('行' + item.row + '：貸出記録がありません'); return;
        }
        if (item.v[LEDGER.RETURN - 1] !== '返却済') {
          skipped.push('行' + item.row + '：先に襦袢の返却を記録してください'); return;
        }
        targets.push(item);
      });

      if (!targets.length) { reportSkipped_('直接回収の記録', 0, skipped); return; }

      // 給与が支給済みかを管理者ファイルで確認する
      const admin = SpreadsheetApp.openById(requireAdminFileId_(field));
      const personal = requireSheet_(admin, PAY_SH.PERSONAL);
      const n = PAY_PERSONAL.LAST - PAY_PERSONAL.FIRST + 1;
      const states = personal.getRange(PAY_PERSONAL.FIRST, 1, n, PAY_PERSONAL.WIDTH).getDisplayValues();
      const paid = {};
      states.forEach(function (r) {
        const id = String(r[PAY_PERSONAL.STAFF_ID - 1] || '').trim();
        if (id) paid[id] = String(r[PAY_PERSONAL.PAY_STATE - 1] || '').trim();
      });

      const unpaid = [];
      targets.forEach(function (item) {
        const staffId = String(item.v[LEDGER.STAFF_ID - 1]).trim();
        if (paid[staffId] !== '支給済') {
          unpaid.push(item.v[LEDGER.NAME - 1] + '（' + staffId + '）');
        }
      });
      if (unpaid.length) {
        throw new Error('次の方は給与が支給済みになっていません。給与手渡しのあとに実行してください。\n' +
          unpaid.join('\n'));
      }

      const now = new Date();
      const actor = requireActor_();
      targets.forEach(function (item) {
        sheet.getRange(item.row, LEDGER.COLLECT, 1, 3).setValues([['回収済', now, actor]]);
      });

      SpreadsheetApp.flush();
      reportSkipped_('直接回収の記録', targets.length, skipped,
        '金額は給与側へは連携していません。');
    });
  });
}

/** 台帳の編集監視。回収済みは必ずメニュー経由にする。 */
function handleLedgerEdit_(e) {
  const sheet = e.range.getSheet();
  const first = Math.max(e.range.getRow(), LEDGER.FIRST);
  const last = Math.min(e.range.getLastRow(), LEDGER.LAST);
  if (first > last) return;

  const fromCol = e.range.getColumn();
  const toCol = e.range.getLastColumn();
  const editedLoan = fromCol <= LEDGER.LOAN && toCol >= LEDGER.LOAN;
  const editedCollect = fromCol <= LEDGER.COLLECT && toCol >= LEDGER.COLLECT;
  if (!editedLoan && !editedCollect) return;

  const rowCount = last - first + 1;
  const values = sheet.getRange(first, 1, rowCount, LEDGER.WIDTH).getDisplayValues();
  let warned = false;

  for (let i = 0; i < rowCount; i++) {
    const row = first + i;
    const v = values[i];
    if (!v[LEDGER.STAFF_ID - 1]) continue;

    if (editedCollect && v[LEDGER.COLLECT - 1] === '回収済') {
      const fallback = v[LEDGER.LOAN - 1] === '貸出済' ? '未回収' : '対象外';
      sheet.getRange(row, LEDGER.COLLECT).setValue(fallback);
      warned = true;
    }
    if (!editedLoan) continue;

    if (v[LEDGER.LOAN - 1] === '貸出済' && v[LEDGER.JUBAN - 1] === '貸与' &&
        v[LEDGER.COLLECT - 1] !== '回収済') {
      sheet.getRange(row, LEDGER.COLLECT).setValue('未回収');
    } else if (v[LEDGER.LOAN - 1] === '未貸出') {
      sheet.getRange(row, LEDGER.RETURN).setValue('未返却');
      sheet.getRange(row, LEDGER.COLLECT, 1, 3).setValues([['対象外', '', '']]);
    }
  }

  if (warned) {
    (e.source || SpreadsheetApp.getActive()).toast(
      '回収済みは「給与手渡し後の直接回収を記録」メニューから登録してください。', '直接回収', 8);
  }
}

function ledgerItems_(sheet, rows) {
  const items = rows.map(function (row) {
    return { row: row, v: sheet.getRange(row, 1, 1, LEDGER.WIDTH).getDisplayValues()[0] };
  }).filter(function (item) {
    return String(item.v[LEDGER.STAFF_ID - 1] || '').trim();
  });
  if (!items.length) throw new Error('スタッフのデータ行を選択してください。');
  return items;
}
