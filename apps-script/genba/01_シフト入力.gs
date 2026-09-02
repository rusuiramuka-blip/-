/**
 * 02_シフト入力 — 自動数式、編集監視、枠の自動生成
 *
 * 変更点（旧版からの主な修正）
 *  - 勤務IDを行番号依存の数式から「作成時に採番した静的値」へ（旧A-4）
 *  - onEdit を行ごとの逐次処理から範囲一括処理へ（旧B-2）
 *  - 深夜時間帯を _設定 参照に統一（旧C-5）
 *  - 同日複数勤務の警告を「時間が重なる場合のみ」に（旧C-4）
 *  - V列（時間帯）を追加し、07_必要人数 と同じ呼び名で集計できるように
 */

/** 自動数式を入れる列（勤務IDのA列はここに含めない＝静的値で保持する） */
const SHIFT_AUTO_COLUMNS = Object.freeze([
  SHIFT.LABEL, SHIFT.STAFF_ID, SHIFT.HOURS, SHIFT.LUNCH, SHIFT.DINNER,
  SHIFT.WARN, SHIFT.START_AT, SHIFT.END_AT, SHIFT.NIGHT, SHIFT.BAND
]);

function shiftFormula_(column, row) {
  const r = String(row);
  const last = String(SHIFT.LAST);
  switch (column) {
    case SHIFT.LABEL:
      return `=IF(OR($J${r}="",$F${r}="",$G${r}=""),"",$J${r}&"｜"&IF($V${r}="","",$V${r}&" ")&TEXT($F${r},"h:mm")&"～"&TEXT($G${r},"h:mm")&IF($G${r}<=$F${r},"（翌日）",""))`;

    case SHIFT.STAFF_ID:
      return `=IF($D${r}="","",IFERROR(INDEX('01_スタッフ'!$A$3:$A$202,MATCH($D${r},'01_スタッフ'!$B$3:$B$202,0)),""))`;

    case SHIFT.HOURS:
      return `=IF(OR($S${r}="",$T${r}=""),"",MAX(0,(ROUND(($T${r}-$S${r})*1440,0)-N($H${r}))/60))`;

    case SHIFT.LUNCH:
      return `=IF(OR($B${r}="",$S${r}="",$T${r}=""),"",IF(AND($S${r}<$B${r}+'_設定'!$H$2,$T${r}>$B${r}+'_設定'!$F$2),IFERROR(INDEX('_設定'!$C$14:$C$60,MATCH($B${r},'_設定'!$A$14:$A$60,0)),"要確認"),"不要"))`;

    case SHIFT.DINNER:
      return `=IF(OR($B${r}="",$S${r}="",$T${r}=""),"",IF(AND($S${r}<$B${r}+'_設定'!$H$3,$T${r}>$B${r}+'_設定'!$F$3),IFERROR(INDEX('_設定'!$D$14:$D$60,MATCH($B${r},'_設定'!$A$14:$A$60,0)),"要確認"),"不要"))`;

    // 警告。同日複数勤務は「時間が実際に重なる場合」だけに絞る。
    case SHIFT.WARN:
      return `=IF($B${r}="","",` +
        `IF($F${r}="","出勤未入力・","")&` +
        `IF($G${r}="","退勤未入力・","")&` +
        `IF($J${r}="","配置未入力・","")&` +
        `IF(AND($N${r}="確定",$D${r}=""),"担当者未設定・","")&` +
        `IF(AND($D${r}<>"",$E${r}=""),"スタッフ台帳未一致・","")&` +
        `IF(AND($I${r}>6,$I${r}<=8,N($H${r})<45),"休憩45分未満・","")&` +
        `IF(AND($I${r}>8,N($H${r})<60),"休憩60分未満・","")&` +
        `IF(AND($U${r}>0,IFERROR(INDEX('01_スタッフ'!$F$3:$F$202,MATCH($E${r},'01_スタッフ'!$A$3:$A$202,0)),"要確認")<>"18歳以上"),"18歳未満の深夜・","")&` +
        `IF(AND($I${r}>8,IFERROR(INDEX('01_スタッフ'!$F$3:$F$202,MATCH($E${r},'01_スタッフ'!$A$3:$A$202,0)),"要確認")<>"18歳以上"),"18歳未満8h超・","")&` +
        `IF(AND($E${r}<>"",$S${r}<>"",$T${r}<>"",` +
        `SUMPRODUCT(N($E$5:$E$${last}=$E${r}),N($N$5:$N$${last}<>"取消"),N($S$5:$S$${last}<$T${r}),N($T$5:$T$${last}>$S${r}))>1),"勤務時間の重複・",""))`;

    case SHIFT.START_AT:
      return `=IF(OR($B${r}="",$F${r}=""),"",$B${r}+$F${r})`;

    case SHIFT.END_AT:
      return `=IF(OR($B${r}="",$F${r}="",$G${r}=""),"",$B${r}+$G${r}+IF($G${r}<=$F${r},1,0))`;

    // 深夜時間。22:00/5:00 のハードコードをやめ _設定!B6・B7 を参照する。
    case SHIFT.NIGHT:
      return `=IF(OR($S${r}="",$T${r}=""),"",ROUND((MAX(0,MIN($T${r},INT($S${r})+1+'_設定'!$B$7)-MAX($S${r},INT($S${r})+'_設定'!$B$6))+MAX(0,MIN($T${r},INT($S${r})+'_設定'!$B$7)-MAX($S${r},INT($S${r}))))*1440,0)/60)`;

    // 時間帯。07_必要人数 の開始時刻と突き合わせて同じ呼び名を得る。
    case SHIFT.BAND:
      return `=IF(OR($B${r}="",$F${r}=""),"",IFERROR(INDEX('07_必要人数'!$E$5:$E$204,MATCH($F${r},'07_必要人数'!$F$5:$F$204,0)),"その他"))`;

    default:
      return '';
  }
}

// ───────────────────────────────── 編集監視

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const name = sheet.getName();
  if (name === SH.LEDGER) { handleLedgerEdit_(e); return; }
  if (name === SH.SHIFT) { handleShiftEdit_(e); return; }
}

/**
 * 旧版は 1 行ずつ getRange/setValue を繰り返していたため、
 * 数十行の貼り付けで簡易トリガの 30 秒制限を超えていた。
 * ここでは編集範囲をまとめて読み、まとめて書き戻す。
 */
function handleShiftEdit_(e) {
  const sheet = e.range.getSheet();
  const first = Math.max(e.range.getRow(), SHIFT.FIRST);
  const last = Math.min(e.range.getLastRow(), SHIFT.LAST);
  if (first > last) return;
  if (e.range.getLastColumn() < 1 || e.range.getColumn() > SHIFT.WIDTH) return;

  const rowCount = last - first + 1;
  const range = sheet.getRange(first, 1, rowCount, SHIFT.WIDTH);
  const values = range.getValues();
  const now = new Date();

  const states = [];
  const sends = [];
  const updated = [];
  let touched = false;
  let blockedDraft = false;

  values.forEach(function (row) {
    const hasDate = row[SHIFT.DATE - 1] !== '' && row[SHIFT.DATE - 1] !== null;
    let state = String(row[SHIFT.STATE - 1] || '').trim();
    let send = String(row[SHIFT.SEND - 1] || '').trim();

    if (!hasDate) {
      states.push([row[SHIFT.STATE - 1]]);
      sends.push([row[SHIFT.SEND - 1]]);
      updated.push([row[SHIFT.UPDATED - 1]]);
      return;
    }

    // 送信済みの勤務を「下書き」へ戻すのは認めない。取消にして再送させる。
    if ((send === '送信済' || send === '取消送信済' || send === '変更あり') && state === '下書き') {
      state = (send === '取消送信済') ? '取消' : '確定';
      send = '変更あり';
      blockedDraft = true;
    } else {
      if (!state) state = '下書き';
      if (!send) send = '未送信';
      else if (send === '送信済' || send === '取消送信済') send = '変更あり';
    }

    states.push([state]);
    sends.push([send]);
    updated.push([now]);
    touched = true;
  });

  if (!touched) return;

  sheet.getRange(first, SHIFT.STATE, rowCount, 1).setValues(states);
  sheet.getRange(first, SHIFT.SEND, rowCount, 1).setValues(sends);
  sheet.getRange(first, SHIFT.UPDATED, rowCount, 1).setValues(updated);

  // 自動列が直接編集されたときだけ数式を戻す（毎回全列を書き直さない）
  if (editedAutoColumn_(e.range)) {
    repairShiftFormulasOnSheet_(sheet, first, last);
  }

  if (blockedDraft) {
    (e.source || SpreadsheetApp.getActive()).toast(
      '送信済みの勤務は下書きへ戻せません。「取消」にして給与へ送信してください。', '給与連携', 8);
  }
}

function editedAutoColumn_(range) {
  const from = range.getColumn();
  const to = range.getLastColumn();
  return SHIFT_AUTO_COLUMNS.some(function (c) { return c >= from && c <= to; });
}

// ───────────────────────────────── 数式修復

function repairShiftFormulas() {
  runSafely_('数式修復', function () {
    const ss = SpreadsheetApp.getActive();
    const sheet = requireSheet_(ss, SH.SHIFT);
    const count = repairShiftFormulasOnSheet_(sheet, SHIFT.FIRST, SHIFT.LAST);
    const defaults = fillDefaultStates_(sheet);
    SpreadsheetApp.flush();
    ss.toast(count + 'セルの自動数式を確認・復元しました。' +
      (defaults ? ' 初期値' + defaults + '件も補いました。' : ''), '数式修復', 8);
  });
}

/**
 * 自動列の数式だけを復元する。A列（勤務ID）は静的値なので触らない。
 */
function repairShiftFormulasOnSheet_(sheet, firstRow, lastRow) {
  const rows = lastRow - firstRow + 1;
  let repaired = 0;

  SHIFT_AUTO_COLUMNS.forEach(function (column) {
    const range = sheet.getRange(firstRow, column, rows, 1);
    const current = range.getFormulas();
    const formulas = [];
    let dirty = false;
    for (let i = 0; i < rows; i++) {
      const formula = shiftFormula_(column, firstRow + i);
      if (current[i][0] !== formula) { repaired++; dirty = true; }
      formulas.push([formula]);
    }
    if (dirty) range.setFormulas(formulas);
  });

  return repaired;
}

function fillDefaultStates_(sheet) {
  const rows = SHIFT.LAST - SHIFT.FIRST + 1;
  const dates = sheet.getRange(SHIFT.FIRST, SHIFT.DATE, rows, 1).getValues();
  const states = sheet.getRange(SHIFT.FIRST, SHIFT.STATE, rows, 1).getDisplayValues();
  const sends = sheet.getRange(SHIFT.FIRST, SHIFT.SEND, rows, 1).getDisplayValues();
  let filled = 0;
  dates.forEach(function (r, i) {
    if (!r[0]) return;
    if (!states[i][0]) { states[i][0] = '下書き'; filled++; }
    if (!sends[i][0]) { sends[i][0] = '未送信'; filled++; }
  });
  if (filled) {
    sheet.getRange(SHIFT.FIRST, SHIFT.STATE, rows, 1).setValues(states);
    sheet.getRange(SHIFT.FIRST, SHIFT.SEND, rows, 1).setValues(sends);
  }
  return filled;
}

// ───────────────────────────────── 勤務IDの採番

/**
 * 勤務ID: WK-{yyyyMMdd}-S{連番}
 * 枠を作った時点で静的値として確定させる。行の挿入・削除・並べ替えでも変わらない。
 */
function buildWorkIdIssuer_(existingRows) {
  const maxSeq = {};
  existingRows.forEach(function (r) {
    const id = String(r[SHIFT.ID - 1] || '').trim();
    const m = /^WK-(\d{8})-S(\d+)$/.exec(id);
    if (!m) return;
    const key = m[1];
    const seq = Number(m[2]);
    if (!maxSeq[key] || seq > maxSeq[key]) maxSeq[key] = seq;
  });
  return function (date) {
    const key = dateKey_(date);
    maxSeq[key] = (maxSeq[key] || 0) + 1;
    return 'WK-' + key + '-S' + ('00' + maxSeq[key]).slice(-3);
  };
}

// ───────────────────────────────── 枠の自動生成

/**
 * 07_必要人数 から、担当者を空欄にした仮枠を必要人数ぶん作る。
 * 「日付 × 配置 × 時間帯」で既存の枠を数え、不足ぶんだけ追加するので
 * 何度実行しても増殖しない。
 */
function generateSlots() {
  runSafely_('期間の枠を作成', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireSheet_(ss, SH.SHIFT);
      const cfg = settings_(ss);
      const dates = eachDate_(cfg.periodFrom, cfg.periodTo);
      const rules = needRules_(ss);
      if (!rules.length) throw new Error('07_必要人数 に「使用」の行がありません。');

      const rowCount = SHIFT.LAST - SHIFT.FIRST + 1;
      const data = sheet.getRange(SHIFT.FIRST, 1, rowCount, SHIFT.WIDTH).getValues();

      // 既存の枠数を「日付|配置|時間帯」で数える（取消は除く）
      const existing = {};
      data.forEach(function (r) {
        const d = r[SHIFT.DATE - 1];
        if (!(d instanceof Date)) return;
        if (String(r[SHIFT.STATE - 1] || '').trim() === '取消') return;
        const key = dateKey_(d) + '|' + String(r[SHIFT.PLACE - 1]).trim() + '|' + String(r[SHIFT.BAND - 1]).trim();
        existing[key] = (existing[key] || 0) + 1;
      });

      const issueId = buildWorkIdIssuer_(data);
      const additions = [];

      dates.forEach(function (date) {
        const key = dateKey_(date);
        // その日を名指しした行があれば、その日はその行だけを使う
        const specific = rules.filter(function (r) { return r.date === key; });
        const applicable = specific.length ? specific : rules.filter(function (r) { return !r.date; });

        applicable.forEach(function (rule) {
          const mapKey = key + '|' + rule.place + '|' + rule.band;
          const have = existing[mapKey] || 0;
          const short = rule.count - have;
          for (let i = 0; i < short; i++) {
            additions.push({ date: date, rule: rule, id: issueId(date) });
          }
          if (short > 0) existing[mapKey] = rule.count;
        });
      });

      if (!additions.length) {
        ss.toast('必要人数を満たしているため、追加する枠はありません。', '枠の作成', 6);
        return;
      }

      const blank = countBlankRows_(sheet, SHIFT.FIRST, SHIFT.LAST, SHIFT.ID);
      if (additions.length > blank) {
        throw new Error('必要な枠は' + additions.length + '件ですが、空き行が' + blank + '行しかありません。\n' +
          '「移行」メニューで 02_シフト入力 の行数を拡張してください。');
      }

      const startRow = nextBlankRow_(sheet, SHIFT.FIRST, SHIFT.LAST, SHIFT.ID);
      const defaultBreak = defaultBreakMinutes_(ss);

      // A/B/F/G/H/J/K/N/Q を値で、自動列は数式で入れる
      additions.forEach(function (a, i) {
        const row = startRow + i;
        sheet.getRange(row, SHIFT.ID).setValue(a.id);
        sheet.getRange(row, SHIFT.DATE).setValue(a.date);
        sheet.getRange(row, SHIFT.IN).setValue(a.rule.start);
        sheet.getRange(row, SHIFT.OUT).setValue(a.rule.end);
        sheet.getRange(row, SHIFT.BREAK).setValue(defaultBreak);
        sheet.getRange(row, SHIFT.PLACE).setValue(a.rule.place);
        sheet.getRange(row, SHIFT.WAGE_KIND).setValue('通常');
        sheet.getRange(row, SHIFT.STATE).setValue('下書き');
        sheet.getRange(row, SHIFT.SEND).setValue('未送信');
        sheet.getRange(row, SHIFT.UPDATED).setValue(new Date());
      });

      repairShiftFormulasOnSheet_(sheet, startRow, startRow + additions.length - 1);
      SpreadsheetApp.flush();

      ss.toast(additions.length + '件の仮枠を作成しました（担当者は空欄）。', '枠の作成', 8);
      SpreadsheetApp.getUi().alert(
        '仮枠を' + additions.length + '件作成しました。\n\n' +
        '担当者は空欄です。02B_募集状況 で不足を確認し、\n' +
        '巫女の申込または配置表から担当者を割り当ててください。');
    });
  });
}

/** 休憩分の既定値。_設定 に「既定休憩」があればそれを使う。 */
function defaultBreakMinutes_(ss) {
  const s = requireSheet_(ss, SH.SETTING);
  const values = s.getRange(5, 1, 30, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === '既定休憩') {
      const n = Number(values[i][1]);
      if (isFinite(n) && n >= 0) return n;
    }
  }
  return 60;
}
