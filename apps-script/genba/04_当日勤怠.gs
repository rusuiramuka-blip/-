/**
 * 02A_当日勤怠 — 実働が予定と違ったときの操作
 *
 * 00_ホーム に「メニューの『予定どおりを反映』が最短です」と書かれていたが、
 * そのメニューは存在していなかった。ここで実装する。
 *
 * 併せて、旧版に存在しなかった「実績を給与へ送信」も実装する。
 * これが無いため 01_勤怠承認!AL 実績連携 が「未送信」のままになり、
 * 給与側の承認が必ず失敗していた。
 */

// ───────────────────────────────── 予定どおり / 欠勤

function applyPlannedAsActual() {
  runSafely_('予定どおりを反映', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, SH.ACTUAL);
      const rows = selectedDataRows_(sheet, ACT.FIRST, ACT.LAST);
      const actor = requireActor_();
      const now = new Date();

      const applied = [];
      const skipped = [];

      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, ACT.WIDTH).getValues()[0];
        if (!v[ACT.ID - 1]) return;
        const state = String(v[ACT.STATE - 1] || '').trim();
        const send = String(v[ACT.SEND - 1] || '').trim();
        if (send === '実績送信済') { skipped.push('行' + row + '：送信済み'); return; }
        if (state === '勤務済') { skipped.push('行' + row + '：すでに勤務済'); return; }
        if (state === '欠勤確定' || state === '事前取消') {
          skipped.push('行' + row + '：' + state); return;
        }
        if (v[ACT.PLAN_IN - 1] === '' || v[ACT.PLAN_OUT - 1] === '') {
          skipped.push('行' + row + '：予定時刻が空'); return;
        }
        applied.push({ row: row, v: v });
      });

      if (!applied.length) {
        reportSkipped_('予定どおりを反映', 0, skipped);
        return;
      }

      applied.forEach(function (a) {
        sheet.getRange(a.row, ACT.STATE).setValue('勤務済');
        sheet.getRange(a.row, ACT.IN, 1, 3).setValues([[
          a.v[ACT.PLAN_IN - 1], a.v[ACT.PLAN_OUT - 1], a.v[ACT.PLAN_BREAK - 1]
        ]]);
        sheet.getRange(a.row, ACT.CHECKER, 1, 2).setValues([[actor, now]]);
      });

      SpreadsheetApp.flush();
      reportSkipped_('予定どおりを反映', applied.length, skipped);
    });
  });
}

function markAbsent() {
  runSafely_('欠勤にする', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, SH.ACTUAL);
      const rows = selectedDataRows_(sheet, ACT.FIRST, ACT.LAST);
      const reason = askRequired_('欠勤の記録', '欠勤の理由を入力してください。');
      const actor = requireActor_();
      const now = new Date();

      const applied = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, ACT.WIDTH).getValues()[0];
        if (!v[ACT.ID - 1]) return;
        if (String(v[ACT.SEND - 1] || '').trim() === '実績送信済') {
          skipped.push('行' + row + '：送信済み'); return;
        }
        applied.push(row);
      });

      if (!applied.length) { reportSkipped_('欠勤にする', 0, skipped); return; }

      applied.forEach(function (row) {
        sheet.getRange(row, ACT.STATE).setValue('欠勤確定');
        sheet.getRange(row, ACT.IN, 1, 3).setValues([['', '', '']]);
        sheet.getRange(row, ACT.REASON).setValue(reason);
        sheet.getRange(row, ACT.CHECKER, 1, 2).setValues([[actor, now]]);
      });

      SpreadsheetApp.flush();
      reportSkipped_('欠勤にする', applied.length, skipped);
    });
  });
}

// ───────────────────────────────── 枠の再募集 / 担当者の交代

/**
 * 前日までの取消。行を「取消」にすると枠そのものが消えて募集に出なくなるので、
 * 担当者だけを外して枠は残す。02B_募集状況 に「あと1人」として戻る。
 */
function reopenSlot() {
  runSafely_('枠を再募集する', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, SH.SHIFT);
      const rows = selectedDataRows_(sheet, SHIFT.FIRST, SHIFT.LAST);
      const reason = askRequired_('枠の再募集', '担当者を外す理由を入力してください。');
      const actor = requireActor_();
      const now = new Date();

      const targets = [];
      const skipped = [];
      rows.forEach(function (row) {
        const v = sheet.getRange(row, 1, 1, SHIFT.WIDTH).getValues()[0];
        if (!v[SHIFT.ID - 1]) return;
        if (!String(v[SHIFT.ASSIGNEE - 1] || '').trim()) {
          skipped.push('行' + row + '：担当者が空欄'); return;
        }
        if (String(v[SHIFT.STATE - 1] || '').trim() === '取消') {
          skipped.push('行' + row + '：取消済みの枠'); return;
        }
        targets.push({ row: row, v: v });
      });

      if (!targets.length) { reportSkipped_('枠を再募集する', 0, skipped); return; }

      const logs = [];
      targets.forEach(function (t) {
        sheet.getRange(t.row, SHIFT.ASSIGNEE).setValue('');
        sheet.getRange(t.row, SHIFT.UPDATED).setValue(now);
        const send = String(t.v[SHIFT.SEND - 1] || '').trim();
        if (send === '送信済' || send === '取消送信済') {
          sheet.getRange(t.row, SHIFT.SEND).setValue('変更あり');
        }
        logs.push({
          staffId: String(t.v[SHIFT.STAFF_ID - 1] || ''),
          name: String(t.v[SHIFT.ASSIGNEE - 1] || ''),
          workId: String(t.v[SHIFT.ID - 1]),
          op: '割当解除', result: '確定', reason: reason, actor: actor
        });
      });
      appendApplyLog_(ss, logs);

      SpreadsheetApp.flush();
      reportSkipped_('枠を再募集する', targets.length, skipped,
        '枠は残したまま担当者だけ外しました。02B_募集状況 に不足として戻ります。');
    });
  });
}

/** 代わりの人が入った場合。元の行は取消にし、新しい行に元勤務IDを残す。 */
function replaceAssignee() {
  runSafely_('担当者を交代', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireActiveSheet_(ss, SH.SHIFT);
      const rows = selectedDataRows_(sheet, SHIFT.FIRST, SHIFT.LAST);
      if (rows.length !== 1) throw new Error('交代する勤務を1行だけ選択してください。');
      const row = rows[0];
      const v = sheet.getRange(row, 1, 1, SHIFT.WIDTH).getValues()[0];
      if (!v[SHIFT.ID - 1]) throw new Error('勤務の行を選択してください。');

      const names = staffNames_(ss);
      const newName = askRequired_('担当者を交代',
        '交代して入る方の氏名を入力してください。\n（01_スタッフ に登録された氏名）');
      if (names.indexOf(newName) === -1) {
        throw new Error(newName + ' は 01_スタッフ に登録されていません。');
      }
      const reason = askRequired_('担当者を交代', '交代の理由を入力してください。');
      const actor = requireActor_();
      const now = new Date();

      const rowCount = SHIFT.LAST - SHIFT.FIRST + 1;
      const all = sheet.getRange(SHIFT.FIRST, 1, rowCount, SHIFT.WIDTH).getValues();
      const issueId = buildWorkIdIssuer_(all);
      const newRow = nextBlankRow_(sheet, SHIFT.FIRST, SHIFT.LAST, SHIFT.ID);
      const newId = issueId(v[SHIFT.DATE - 1]);

      // 新しい枠（元の枠の内容をそのまま、担当者だけ差し替え）
      sheet.getRange(newRow, SHIFT.ID).setValue(newId);
      sheet.getRange(newRow, SHIFT.DATE).setValue(v[SHIFT.DATE - 1]);
      sheet.getRange(newRow, SHIFT.ASSIGNEE).setValue(newName);
      sheet.getRange(newRow, SHIFT.IN, 1, 3).setValues([[
        v[SHIFT.IN - 1], v[SHIFT.OUT - 1], v[SHIFT.BREAK - 1]
      ]]);
      sheet.getRange(newRow, SHIFT.PLACE).setValue(v[SHIFT.PLACE - 1]);
      sheet.getRange(newRow, SHIFT.WAGE_KIND).setValue(v[SHIFT.WAGE_KIND - 1]);
      sheet.getRange(newRow, SHIFT.STATE).setValue(v[SHIFT.STATE - 1] || '下書き');
      sheet.getRange(newRow, SHIFT.NOTE).setValue('元勤務ID ' + v[SHIFT.ID - 1] + ' から交代');
      sheet.getRange(newRow, SHIFT.SEND).setValue('未送信');
      sheet.getRange(newRow, SHIFT.UPDATED).setValue(now);
      repairShiftFormulasOnSheet_(sheet, newRow, newRow);

      // 元の枠を取消に
      sheet.getRange(row, SHIFT.STATE).setValue('取消');
      sheet.getRange(row, SHIFT.NOTE).setValue('交代のため取消（後継 ' + newId + '）');
      sheet.getRange(row, SHIFT.UPDATED).setValue(now);
      const send = String(v[SHIFT.SEND - 1] || '').trim();
      if (send === '送信済') sheet.getRange(row, SHIFT.SEND).setValue('変更あり');

      appendApplyLog_(ss, [
        { staffId: String(v[SHIFT.STAFF_ID - 1] || ''), name: String(v[SHIFT.ASSIGNEE - 1] || ''),
          workId: String(v[SHIFT.ID - 1]), op: '交代（外れる）', result: '確定', reason: reason, actor: actor },
        { staffId: '', name: newName, workId: newId,
          op: '交代（入る）', result: '確定', reason: reason, actor: actor }
      ]);

      SpreadsheetApp.flush();
      SpreadsheetApp.getUi().alert('担当者を交代しました。\n\n' +
        '元の勤務 ' + v[SHIFT.ID - 1] + ' … 取消\n' +
        '新しい勤務 ' + newId + ' … ' + newName + '\n\n' +
        '元の勤務が送信済みだった場合は「確定勤務を給与へ送信」で取消を送ってください。');
    });
  });
}

// ───────────────────────────────── 実績を給与へ送信

/**
 * 02A_当日勤怠 → 給与ファイル 01_勤怠承認
 *
 * 旧版に無かった処理。これが 01_勤怠承認!AL 実績連携 を「実績送信済」にする。
 */
function sendActualResults() {
  runSafely_('当日実績を給与へ送信', function () {
    withDocumentLock_(function () {
      const field = SpreadsheetApp.getActive();
      const sheet = requireSheet_(field, SH.ACTUAL);
      const adminId = requireAdminFileId_(field);
      const actor = requireActor_();

      const rowCount = ACT.LAST - ACT.FIRST + 1;
      const data = sheet.getRange(ACT.FIRST, 1, rowCount, ACT.WIDTH).getValues();

      const pending = [];
      const blocked = [];
      data.forEach(function (r, i) {
        const id = String(r[ACT.ID - 1] || '').trim();
        if (!id) return;
        const state = String(r[ACT.STATE - 1] || '').trim();
        const send = String(r[ACT.SEND - 1] || '').trim();
        const warn = String(r[ACT.WARN - 1] || '').trim();
        if (send === '実績送信済') return;
        if (state === '' || state === '未入力') return;
        if (warn) { blocked.push('行' + (ACT.FIRST + i) + ': ' + warn); return; }
        if (state === '勤務済' && (r[ACT.IN - 1] === '' || r[ACT.OUT - 1] === '')) {
          blocked.push('行' + (ACT.FIRST + i) + ': 実出勤・実退勤を入力してください。');
          return;
        }
        if ((state === '欠勤確定' || state === '事前取消') && !String(r[ACT.REASON - 1] || '').trim()) {
          blocked.push('行' + (ACT.FIRST + i) + ': ' + state + ' には変更理由が必要です。');
          return;
        }
        pending.push({ index: i, row: ACT.FIRST + i, r: r, id: id, state: state });
      });

      if (blocked.length) {
        throw new Error('警告が残っている実績は送信できません。\n' + blocked.slice(0, 10).join('\n') +
          (blocked.length > 10 ? '\n…ほか' + (blocked.length - 10) + '件' : ''));
      }
      if (!pending.length) {
        field.toast('送信が必要な実績はありません。', '給与連携', 6);
        return;
      }

      const admin = SpreadsheetApp.openById(adminId);
      const attendance = requireSheet_(admin, PAY_SH.ATTENDANCE);
      const index = idRowIndexStrict_(attendance, PAY_ATT.FIRST, PAY_ATT.LAST, PAY_ATT.ID);
      const now = new Date();

      // 先に全件を検証し、途中まで送信された状態を作らない
      const missing = [];
      pending.forEach(function (p) {
        const row = index[p.id];
        if (!row) { missing.push(p.id); return; }
        const closeState = String(attendance.getRange(row, PAY_ATT.CLOSE_STATE).getDisplayValue()).trim();
        if (closeState === '締め済') {
          throw new Error(p.id + ' は給与側で締め済みです。締めを解除してから再送してください。');
        }
      });
      if (missing.length) {
        throw new Error('給与側に該当の勤務がありません。先に「確定勤務を給与へ送信」を実行してください。\n' +
          missing.slice(0, 10).join(', '));
      }

      pending.forEach(function (p) {
        const row = index[p.id];
        const r = p.r;
        const approveState = payApproveStateFor_(p.state);

        if (p.state === '勤務済') {
          attendance.getRange(row, PAY_ATT.ACT_IN, 1, 3).setValues([[
            r[ACT.IN - 1], r[ACT.OUT - 1], r[ACT.BREAK - 1] === '' ? 0 : r[ACT.BREAK - 1]
          ]]);
        } else {
          attendance.getRange(row, PAY_ATT.ACT_IN, 1, 3).setValues([['', '', '']]);
        }
        attendance.getRange(row, PAY_ATT.APPROVE_STATE).setValue(approveState);
        attendance.getRange(row, PAY_ATT.REASON).setValue(r[ACT.REASON - 1] || '');
        attendance.getRange(row, PAY_ATT.CHECKER, 1, 2).setValues([[
          r[ACT.CHECKER - 1] || actor, r[ACT.CHECKED_AT - 1] || now
        ]]);
        attendance.getRange(row, PAY_ATT.ACTUAL_SEND).setValue('実績送信済');
        attendance.getRange(row, PAY_ATT.UPDATED).setValue(now);

        sheet.getRange(p.row, ACT.SEND).setValue('実績送信済');
      });

      SpreadsheetApp.flush();
      field.toast(pending.length + '件の実績を給与へ送信しました。', '給与連携', 8);
      SpreadsheetApp.getUi().alert('当日実績を給与へ送信',
        pending.length + '件を送信しました。\n給与側で「選択した勤怠を承認」を実行してください。',
        SpreadsheetApp.getUi().ButtonSet.OK);
    });
  });
}

/** 02A の実績状態 → 01_勤怠承認 の承認状態 */
function payApproveStateFor_(state) {
  if (state === '欠勤確定') return '欠勤確定';
  if (state === '事前取消') return '事前取消';
  return '未確認';   // 勤務済 → 管理者がこれから承認する
}

// ───────────────────────────────── 共通の結果表示

/**
 * 旧版は条件に合わない行を filter で黙って捨て、0件でも完了トーストを出していた。
 * 何件処理し、何を飛ばしたかを必ず見せる。
 */
function reportSkipped_(title, doneCount, skipped, extra) {
  const ui = SpreadsheetApp.getUi();
  let message = doneCount + '件を処理しました。';
  if (extra) message += '\n' + extra;
  if (skipped && skipped.length) {
    message += '\n\n次の行は対象外のため飛ばしました:\n' + skipped.slice(0, 15).join('\n');
    if (skipped.length > 15) message += '\n…ほか' + (skipped.length - 15) + '件';
  }
  if (doneCount === 0 && (!skipped || !skipped.length)) {
    message = '対象の行がありませんでした。データ行を選択してから実行してください。';
  }
  ui.alert(title, message, ui.ButtonSet.OK);
}
