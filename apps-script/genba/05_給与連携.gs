/**
 * 確定した予定シフトを給与ファイルへ送る
 *
 * 【最重要の修正】
 * 旧版は r[2]（＝C列 シフト名（自動））を送信先の「スタッフID」列へ書いていた。
 * 02_シフト入力 の実列は C＝シフト名、E＝スタッフID。
 * このため 01_勤怠承認!C に「本堂1｜早番 9:00～15:00」が入り、
 *   ・E 区分、R 確定基本時給、S 確定交通費 の INDEX/MATCH が全部外れる
 *   ・承認時に「時給が未設定です」で必ず停止する
 *   ・02_個人別給与 の COUNTIFS/SUMIFS が全員 0 になる
 * という形で給与計算が完全に止まっていた。ここでは E列（r[4]）を送る。
 */

function sendConfirmedShifts() {
  runSafely_('確定勤務を給与へ送信', function () {
    withDocumentLock_(function () {
      const field = SpreadsheetApp.getActive();
      const shift = requireSheet_(field, SH.SHIFT);
      const adminId = requireAdminFileId_(field);
      const actor = requireActor_();

      const rowCount = SHIFT.LAST - SHIFT.FIRST + 1;
      const data = shift.getRange(SHIFT.FIRST, 1, rowCount, SHIFT.WIDTH).getValues();
      assertUniqueWorkIds_(data, SHIFT.FIRST);

      const pending = [];
      const blocked = [];

      data.forEach(function (r, i) {
        const row = SHIFT.FIRST + i;
        const workId = String(r[SHIFT.ID - 1] || '').trim();
        const state = String(r[SHIFT.STATE - 1] || '').trim();
        const warn = String(r[SHIFT.WARN - 1] || '').trim();
        const send = String(r[SHIFT.SEND - 1] || '').trim();
        const staffId = String(r[SHIFT.STAFF_ID - 1] || '').trim();

        if (send === '変更あり' && state === '下書き') {
          blocked.push('行' + row + ': 送信済み勤務は「取消」にして再送してください。');
          return;
        }
        if (!workId || (state !== '確定' && state !== '取消')) return;
        if (send === '送信済' && state === '確定') return;
        if (send === '取消送信済' && state === '取消') return;

        if (state === '確定') {
          if (warn) { blocked.push('行' + row + ': ' + warn); return; }
          // 旧版はスタッフIDが空でも送っていた。給与側で紐づかなくなるため止める。
          if (!staffId) {
            blocked.push('行' + row + ': スタッフIDが空です。担当者が 01_スタッフ と一致しているか確認してください。');
            return;
          }
        }
        pending.push({ index: i, row: row, r: r, workId: workId, staffId: staffId, state: state });
      });

      if (blocked.length) {
        throw new Error('次の勤務は送信できません。\n' + blocked.slice(0, 10).join('\n') +
          (blocked.length > 10 ? '\n…ほか' + (blocked.length - 10) + '件' : ''));
      }
      if (!pending.length) {
        field.toast('送信が必要な確定・取消勤務はありません。', '給与連携', 6);
        return;
      }

      const admin = SpreadsheetApp.openById(adminId);
      const imported = requireSheet_(admin, PAY_SH.IMPORT);
      const attendance = requireSheet_(admin, PAY_SH.ATTENDANCE);
      const importLast = imported.getMaxRows();
      const importIndex = idRowIndexStrict_(imported, PAY_IMPORT.FIRST, importLast, PAY_IMPORT.ID);
      const attendanceIndex = idRowIndexStrict_(attendance, PAY_ATT.FIRST, PAY_ATT.LAST, PAY_ATT.ID);
      const now = new Date();

      // 承認済・締め済の勤務を現場側から黙って上書きしない
      pending.forEach(function (p) {
        const row = attendanceIndex[p.workId];
        if (!row) return;
        const approveState = String(attendance.getRange(row, PAY_ATT.APPROVE_STATE).getDisplayValue()).trim();
        const closeState = String(attendance.getRange(row, PAY_ATT.CLOSE_STATE).getDisplayValue()).trim();
        if (closeState === '締め済') {
          throw new Error(p.workId + ' は締め済みです。管理者側で締め解除してから再送してください。');
        }
        if (approveState === '承認済') {
          throw new Error(p.workId + ' は承認済みです。管理者側で承認解除してから再送してください。');
        }
      });

      // 空き行不足も書込み前に検出する
      const newImport = pending.filter(function (p) { return !importIndex[p.workId]; }).length;
      const newAttendance = pending.filter(function (p) { return !attendanceIndex[p.workId]; }).length;
      if (newImport > countBlankRows_(imported, PAY_IMPORT.FIRST, importLast, PAY_IMPORT.ID)) {
        throw new Error('給与側 _取込 に必要な空き行がありません。');
      }
      if (newAttendance > countBlankRows_(attendance, PAY_ATT.FIRST, PAY_ATT.LAST, PAY_ATT.ID)) {
        throw new Error('給与側 01_勤怠承認 に必要な空き行がありません。');
      }

      pending.forEach(function (p) {
        const r = p.r;
        const workId = p.workId;
        const staffId = p.staffId;                 // ← E列。旧版の r[2]（シフト名）から修正
        const assignee = r[SHIFT.ASSIGNEE - 1];
        const sourceUpdated = r[SHIFT.UPDATED - 1] || now;

        // _取込
        const importRow = importIndex[workId] ||
          nextBlankRow_(imported, PAY_IMPORT.FIRST, importLast, PAY_IMPORT.ID);
        imported.getRange(importRow, 1, 1, PAY_IMPORT.WIDTH).setValues([[
          workId, r[SHIFT.DATE - 1], staffId, assignee,
          r[SHIFT.IN - 1], r[SHIFT.OUT - 1], r[SHIFT.BREAK - 1],
          r[SHIFT.PLACE - 1], r[SHIFT.NOTE - 1], r[SHIFT.STATE - 1],
          now, actor, '取込済', r[SHIFT.WAGE_KIND - 1] || '通常', sourceUpdated
        ]]);
        importIndex[workId] = importRow;

        // 01_勤怠承認
        let attendanceRow = attendanceIndex[workId];
        if (!attendanceRow) {
          attendanceRow = nextBlankRow_(attendance, PAY_ATT.FIRST, PAY_ATT.LAST, PAY_ATT.ID);
          attendanceIndex[workId] = attendanceRow;
          attendance.getRange(attendanceRow, PAY_ATT.ID, 1, 4)
            .setValues([[workId, r[SHIFT.DATE - 1], staffId, assignee]]);
          // F〜P: 予定 / 実績の初期値 / 賃金区分 / 承認状態
          attendance.getRange(attendanceRow, PAY_ATT.PLAN_IN, 1, 11).setValues([[
            r[SHIFT.IN - 1], r[SHIFT.OUT - 1], r[SHIFT.BREAK - 1],
            '', '', '',                                   // 実績は当日勤怠から送る
            0, r[SHIFT.WAGE_KIND - 1] || '通常', 0,
            p.state === '取消' ? '取消' : '未確認', ''
          ]]);
          attendance.getRange(attendanceRow, PAY_ATT.ACTUAL_SEND).setValue('未送信');
        } else {
          attendance.getRange(attendanceRow, PAY_ATT.DATE, 1, 3)
            .setValues([[r[SHIFT.DATE - 1], staffId, assignee]]);
          attendance.getRange(attendanceRow, PAY_ATT.PLAN_IN, 1, 3)
            .setValues([[r[SHIFT.IN - 1], r[SHIFT.OUT - 1], r[SHIFT.BREAK - 1]]]);
          if (p.state === '取消') {
            attendance.getRange(attendanceRow, PAY_ATT.APPROVE_STATE).setValue('取消');
          }
        }
        attendance.getRange(attendanceRow, PAY_ATT.UPDATED).setValue(now);

        // 現場側の送信状態
        shift.getRange(p.row, SHIFT.SEND, 1, 2).setValues([[
          p.state === '取消' ? '取消送信済' : '送信済', now
        ]]);
      });

      syncActualSheet_(field, pending);
      SpreadsheetApp.flush();

      field.toast(pending.length + '件を管理者用へ送信しました。', '給与連携', 8);
      SpreadsheetApp.getUi().alert('確定勤務を給与へ送信',
        pending.length + '件を送信しました。\n\n' +
        '当日の実績は 02A_当日勤怠 に入力し、「当日実績を給与へ送信」で送ってください。\n' +
        '実績を送るまで給与側では承認できません。',
        SpreadsheetApp.getUi().ButtonSet.OK);
    });
  });
}

/**
 * 送信した確定勤務を 02A_当日勤怠 にも並べる。
 * 現場が当日その場で実績を入れられるようにするため。
 */
function syncActualSheet_(field, pending) {
  const sheet = requireSheet_(field, SH.ACTUAL);
  const rowCount = ACT.LAST - ACT.FIRST + 1;
  const ids = sheet.getRange(ACT.FIRST, ACT.ID, rowCount, 1).getDisplayValues();
  const known = {};
  ids.forEach(function (r, i) {
    const id = String(r[0] || '').trim();
    if (id) known[id] = ACT.FIRST + i;
  });

  pending.forEach(function (p) {
    const r = p.r;
    if (p.state === '取消') {
      const existing = known[p.workId];
      if (existing) {
        sheet.getRange(existing, ACT.STATE).setValue('事前取消');
      }
      return;
    }
    if (known[p.workId]) {
      sheet.getRange(known[p.workId], ACT.PLAN_IN, 1, 3)
        .setValues([[r[SHIFT.IN - 1], r[SHIFT.OUT - 1], r[SHIFT.BREAK - 1]]]);
      return;
    }
    const row = nextBlankRow_(sheet, ACT.FIRST, ACT.LAST, ACT.ID);
    sheet.getRange(row, ACT.ID, 1, 7).setValues([[
      p.workId, r[SHIFT.DATE - 1], p.staffId, r[SHIFT.ASSIGNEE - 1],
      r[SHIFT.IN - 1], r[SHIFT.OUT - 1], r[SHIFT.BREAK - 1]
    ]]);
    sheet.getRange(row, ACT.STATE).setValue('未入力');
    sheet.getRange(row, ACT.SEND).setValue('未送信');
    known[p.workId] = row;
  });
}

// ───────────────────────────────── 初回設定

function setupAndCheck() {
  runSafely_('初回設定・接続確認', function () {
    const ss = SpreadsheetApp.getActive();
    [SH.HOME, SH.STAFF, SH.SHIFT, SH.ACTUAL, SH.PLACE_CHANGE, SH.DAILY,
     SH.PERSON, SH.LEDGER, SH.NEED, SH.CHECK, SH.SETTING].forEach(function (name) {
      requireSheet_(ss, name);
    });
    if (!ss.getSheetByName(SH.RECRUIT)) {
      throw new Error('02B_募集状況 がありません。「移行」メニューの初期設定を先に実行してください。');
    }
    if (!ss.getSheetByName(SH.APPLY)) {
      throw new Error('09_申込 がありません。「移行」メニューの初期設定を先に実行してください。');
    }

    const adminId = requireAdminFileId_(ss);
    const admin = SpreadsheetApp.openById(adminId);
    [PAY_SH.IMPORT, PAY_SH.ATTENDANCE, PAY_SH.PERSONAL].forEach(function (name) {
      requireSheet_(admin, name);
    });

    repairShiftFormulasOnSheet_(requireSheet_(ss, SH.SHIFT), SHIFT.FIRST, SHIFT.LAST);
    ensureFieldProtections_(ss);

    requireSheet_(ss, SH.SETTING).getRange('D3')
      .setValue('接続確認済 ' + formatDate_(new Date(), 'yyyy/MM/dd HH:mm'));

    SpreadsheetApp.getUi().alert('接続確認が完了しました。\n管理者用: ' + admin.getName());
  });
}

function ensureFieldProtections_(ss) {
  const shift = requireSheet_(ss, SH.SHIFT);
  const last = SHIFT.LAST;
  ensureWarningProtection_(shift, 'C' + SHIFT.FIRST + ':C' + last, '自動数式：シフト名');
  ensureWarningProtection_(shift, 'E' + SHIFT.FIRST + ':E' + last, '自動数式：スタッフID');
  ensureWarningProtection_(shift, 'I' + SHIFT.FIRST + ':I' + last, '自動数式：実働予定');
  ensureWarningProtection_(shift, 'L' + SHIFT.FIRST + ':M' + last, '自動数式：食事判定');
  ensureWarningProtection_(shift, 'P' + SHIFT.FIRST + ':P' + last, '自動数式：警告');
  ensureWarningProtection_(shift, 'S' + SHIFT.FIRST + ':V' + last, '自動数式：日時・深夜・時間帯');

  const ledger = requireSheet_(ss, SH.LEDGER);
  // 旧版は N25:Q224（空列）を保護していた。実際の直接回収欄は F〜I。
  ensureWarningProtection_(ledger, 'F' + LEDGER.FIRST + ':I' + LEDGER.LAST, '直接回収列（メニュー操作）');

  const apply = ss.getSheetByName(SH.APPLY);
  if (apply) ensureWarningProtection_(apply, 'A:I', '申込ログ（自動追記）');
}
