/**
 * 04_日別30分配置 を「配置の入力画面」にする
 *
 * 考え方: 常時連動ではなく「開く → 塗る → 保存」。
 *  - 開く: AX列に勤務IDを静的値で書き、グリッドに現在の配置を値として流し込む。
 *          スピル数式をやめることで行の並びが固定され、塗ったセルが別人にずれない。
 *  - 塗る: 61行目以降の不足マトリクスはグリッド自身を COUNTIF しているため、
 *          保存前でもその場で不足数が動く。
 *  - 保存: 連続する同じ配置をまとめ、最初の区間を 02_シフト入力!J 主配置、
 *          2つ目以降を 03_配置変更 へ書く。時刻は一切書き換えない。
 */

const GRID_PROP_KEY = 'dailyGrid';

// ───────────────────────────────── 開く

function openDailyGrid() {
  runSafely_('この日の配置表を開く', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireSheet_(ss, SH.DAILY);
      const date = sheet.getRange(GRID.DATE_CELL).getValue();
      if (!(date instanceof Date)) {
        throw new Error('04_日別30分配置!' + GRID.DATE_CELL + ' に日付を入れてください。');
      }
      const mode = String(sheet.getRange(GRID.MODE_CELL).getDisplayValue()).trim();
      const onlyConfirmed = (mode === '確定のみ');

      const slots = loadSlotsForDate_(ss, date, onlyConfirmed);
      const capacity = GRID.LAST - GRID.FIRST + 1;
      if (slots.length > capacity) {
        throw new Error('この日の枠は' + slots.length + '件ですが、配置表は' + capacity + '行までです。\n' +
          '「移行」メニューで配置表の行数を拡張してください。');
      }

      const changes = loadPlaceChanges_(ss);
      writeGrid_(sheet, date, slots, changes);
      applyGridValidation_(ss, sheet, slots.length);
      rememberGridState_(ss, date, slots);

      sheet.getRange(GRID.LOADED_CELL)
        .setValue('読込 ' + formatDate_(new Date(), 'M/d HH:mm'));

      SpreadsheetApp.flush();
      ss.toast(slots.length + '件の枠を読み込みました。配置を塗ったら「配置を保存」を実行してください。',
        '配置表', 8);
    });
  });
}

/** 指定日にかかる枠を 02_シフト入力 から取り出す（日跨ぎの枠は前後どちらの日にも出る） */
function loadSlotsForDate_(ss, date, onlyConfirmed) {
  const sheet = requireSheet_(ss, SH.SHIFT);
  const rowCount = SHIFT.LAST - SHIFT.FIRST + 1;
  const data = sheet.getRange(SHIFT.FIRST, 1, rowCount, SHIFT.WIDTH).getValues();

  const dayStart = startOfDay_(date);
  const dayEnd = addDays_(dayStart, 1);
  const order = {};
  placeMaster_(ss).forEach(function (p, i) { order[p.name] = i; });

  const slots = [];
  data.forEach(function (r, i) {
    const id = String(r[SHIFT.ID - 1] || '').trim();
    if (!id) return;
    const state = String(r[SHIFT.STATE - 1] || '').trim();
    if (state === '取消') return;
    if (onlyConfirmed ? state !== '確定' : ['下書き', '確定'].indexOf(state) === -1) return;

    const start = r[SHIFT.START_AT - 1];
    const end = r[SHIFT.END_AT - 1];
    if (!(start instanceof Date) || !(end instanceof Date)) return;
    if (!(start < dayEnd && end > dayStart)) return;

    slots.push({
      row: SHIFT.FIRST + i,
      id: id,
      date: r[SHIFT.DATE - 1],
      assignee: String(r[SHIFT.ASSIGNEE - 1] || '').trim(),
      staffId: String(r[SHIFT.STAFF_ID - 1] || '').trim(),
      label: String(r[SHIFT.LABEL - 1] || '').trim(),
      place: String(r[SHIFT.PLACE - 1] || '').trim(),
      band: String(r[SHIFT.BAND - 1] || '').trim(),
      start: start,
      end: end,
      updated: r[SHIFT.UPDATED - 1]
    });
  });

  slots.sort(function (a, b) {
    const oa = (a.place in order) ? order[a.place] : 999;
    const ob = (b.place in order) ? order[b.place] : 999;
    if (oa !== ob) return oa - ob;
    if (a.start - b.start !== 0) return a.start - b.start;
    return a.id < b.id ? -1 : 1;
  });
  return slots;
}

/** 03_配置変更 を勤務IDごとにまとめて返す */
function loadPlaceChanges_(ss) {
  const sheet = requireSheet_(ss, SH.PLACE_CHANGE);
  const rowCount = PLC.LAST - PLC.FIRST + 1;
  const data = sheet.getRange(PLC.FIRST, 1, rowCount, PLC.WIDTH).getValues();
  const map = {};
  data.forEach(function (r, i) {
    const workId = String(r[PLC.WORK_ID - 1] || '').trim();
    if (!workId) return;
    const from = r[PLC.START_AT - 1];
    const to = r[PLC.END_AT - 1];
    if (!(from instanceof Date) || !(to instanceof Date)) return;
    if (!map[workId]) map[workId] = [];
    map[workId].push({ row: PLC.FIRST + i, from: from, to: to, place: String(r[PLC.PLACE - 1] || '').trim() });
  });
  return map;
}

function writeGrid_(sheet, date, slots, changes) {
  const capacity = GRID.LAST - GRID.FIRST + 1;
  const dayStart = startOfDay_(date);
  const slotMs = 1800000; // 30分

  const labels = [];
  const grid = [];
  const ids = [];
  const assignees = [];
  const staffIds = [];

  for (let i = 0; i < capacity; i++) {
    const slot = slots[i];
    if (!slot) {
      labels.push(['']);
      grid.push(new Array(GRID.COL_COUNT).fill(''));
      ids.push(['']); assignees.push(['']); staffIds.push(['']);
      continue;
    }
    labels.push([slot.assignee || ('未割当｜' + (slot.label || '仮枠'))]);
    ids.push([slot.id]);
    assignees.push([slot.assignee]);
    staffIds.push([slot.staffId]);

    const row = new Array(GRID.COL_COUNT).fill('');
    const list = changes[slot.id] || [];
    for (let c = 0; c < GRID.COL_COUNT; c++) {
      const at = new Date(dayStart.getTime() + c * slotMs);
      if (at < slot.start || at >= slot.end) continue;     // 勤務時間外は空欄
      let place = slot.place;
      for (let k = 0; k < list.length; k++) {
        if (list[k].from <= at && at < list[k].to) { place = list[k].place; break; }
      }
      row[c] = place;
    }
    grid.push(row);
  }

  sheet.getRange(GRID.FIRST, 1, capacity, 1).setValues(labels);
  sheet.getRange(GRID.FIRST, GRID.COL_FIRST, capacity, GRID.COL_COUNT).setValues(grid);
  sheet.getRange(GRID.FIRST, GRID.ID_COL, capacity, 1).setValues(ids);
  sheet.getRange(GRID.FIRST, GRID.ASSIGNEE_COL, capacity, 1).setValues(assignees);
  sheet.getRange(GRID.FIRST, GRID.STAFF_ID_COL, capacity, 1).setValues(staffIds);
}

function applyGridValidation_(ss, sheet, slotCount) {
  const capacity = GRID.LAST - GRID.FIRST + 1;
  const places = placeMaster_(ss).map(function (p) { return p.name; });
  const placeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(places, true).setAllowInvalid(false)
    .setHelpText('配置マスタ（_設定）にある売場から選んでください。').build();
  sheet.getRange(GRID.FIRST, GRID.COL_FIRST, capacity, GRID.COL_COUNT)
    .setDataValidation(placeRule);

  const names = staffNames_(ss);
  const nameRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(names, true).setAllowInvalid(false)
    .setHelpText('01_スタッフ の氏名から選んでください。空欄にすると枠が再募集に戻ります。').build();
  sheet.getRange(GRID.FIRST, GRID.ASSIGNEE_COL, capacity, 1).setDataValidation(nameRule);

  if (slotCount < capacity) {
    sheet.getRange(GRID.FIRST + slotCount, GRID.COL_FIRST, capacity - slotCount, GRID.COL_COUNT)
      .clearDataValidations();
    sheet.getRange(GRID.FIRST + slotCount, GRID.ASSIGNEE_COL, capacity - slotCount, 1)
      .clearDataValidations();
  }
}

function staffNames_(ss) {
  const sheet = requireSheet_(ss, SH.STAFF);
  const n = STAFF.LAST - STAFF.FIRST + 1;
  return sheet.getRange(STAFF.FIRST, STAFF.NAME, n, 1).getDisplayValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(function (v) { return v; });
}

/** 読込時点を控える。保存時に「読込後に他の人が変更した」を検出するため。 */
function rememberGridState_(ss, date, slots) {
  let maxUpdated = 0;
  slots.forEach(function (s) {
    if (s.updated instanceof Date) maxUpdated = Math.max(maxUpdated, s.updated.getTime());
  });
  PropertiesService.getDocumentProperties().setProperty(GRID_PROP_KEY, JSON.stringify({
    date: dateKey_(date),
    loadedAt: Date.now(),
    maxUpdated: maxUpdated,
    ids: slots.map(function (s) { return s.id; })
  }));
}

// ───────────────────────────────── 保存

function saveDailyGrid() {
  runSafely_('配置を保存', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const sheet = requireSheet_(ss, SH.DAILY);
      const date = sheet.getRange(GRID.DATE_CELL).getValue();
      if (!(date instanceof Date)) throw new Error('確認日が空です。配置表を開き直してください。');

      const saved = readGridState_();
      if (!saved || saved.date !== dateKey_(date)) {
        throw new Error('この日の配置表を開いてから保存してください。\n' +
          '（メニューの「この日の配置表を開く」を実行します）');
      }

      const capacity = GRID.LAST - GRID.FIRST + 1;
      const ids = sheet.getRange(GRID.FIRST, GRID.ID_COL, capacity, 1).getDisplayValues();
      const cells = sheet.getRange(GRID.FIRST, GRID.COL_FIRST, capacity, GRID.COL_COUNT).getDisplayValues();
      const assignees = sheet.getRange(GRID.FIRST, GRID.ASSIGNEE_COL, capacity, 1).getDisplayValues();

      const shift = requireSheet_(ss, SH.SHIFT);
      const slots = loadSlotsForDate_(ss, date, false);
      const byId = {};
      slots.forEach(function (s) { byId[s.id] = s; });

      // 読込後に誰かが 02_シフト入力 を触っていないか
      let maxUpdated = 0;
      slots.forEach(function (s) {
        if (s.updated instanceof Date) maxUpdated = Math.max(maxUpdated, s.updated.getTime());
      });
      if (maxUpdated > saved.maxUpdated + 1000) {
        throw new Error('読み込んだ後に、他の方がシフトを変更しています。\n' +
          '「この日の配置表を開く」で読み直してから保存してください。');
      }

      const actor = requireActor_();
      const now = new Date();
      const placeUpdates = [];   // 02_シフト入力!J
      const assigneeUpdates = [];// 02_シフト入力!D
      const applyLogs = [];
      const changeRows = [];     // 03_配置変更 へ書く行
      const touchedIds = {};
      const skipped = [];

      for (let i = 0; i < capacity; i++) {
        const id = String(ids[i][0] || '').trim();
        if (!id) continue;
        const slot = byId[id];
        if (!slot) { skipped.push(id); continue; }
        touchedIds[id] = true;

        // 担当者の変更
        const newAssignee = String(assignees[i][0] || '').trim();
        if (newAssignee !== slot.assignee) {
          assigneeUpdates.push({ row: slot.row, value: newAssignee });
          applyLogs.push({
            staffId: slot.staffId, name: newAssignee || slot.assignee, workId: id,
            op: newAssignee ? '割当' : '割当解除',
            result: '確定', reason: '配置表から変更', actor: actor
          });
        }

        // 配置の区間化
        const segments = compressSegments_(cells[i], date, slot);
        if (!segments.length) continue;

        // 主配置を書き換えてよいのは「この日に始まる枠」だけ。
        // 日跨ぎの枠を翌日の画面から保存したときに、前日の主配置を壊さないため。
        const startsToday = dateKey_(slot.start) === dateKey_(date);
        let rest = segments;
        if (startsToday) {
          placeUpdates.push({ row: slot.row, value: segments[0].place });
          rest = segments.slice(1);
        }
        rest.forEach(function (seg) {
          changeRows.push({ workId: id, slot: slot, seg: seg });
        });
      }

      writePlaceChanges_(ss, touchedIds, changeRows, date);

      placeUpdates.forEach(function (u) { shift.getRange(u.row, SHIFT.PLACE).setValue(u.value); });
      assigneeUpdates.forEach(function (u) { shift.getRange(u.row, SHIFT.ASSIGNEE).setValue(u.value); });
      [].concat(placeUpdates, assigneeUpdates).forEach(function (u) {
        shift.getRange(u.row, SHIFT.UPDATED).setValue(now);
        const send = String(shift.getRange(u.row, SHIFT.SEND).getDisplayValue()).trim();
        if (send === '送信済' || send === '取消送信済') {
          shift.getRange(u.row, SHIFT.SEND).setValue('変更あり');
        }
      });

      appendApplyLog_(ss, applyLogs);
      rememberGridState_(ss, date, loadSlotsForDate_(ss, date, false));
      SpreadsheetApp.flush();

      let message = '配置を保存しました。\n' +
        '主配置の更新 ' + placeUpdates.length + '件 / 配置変更 ' + changeRows.length + '件 / ' +
        '担当者の変更 ' + assigneeUpdates.length + '件';
      if (skipped.length) {
        message += '\n\n次の勤務IDは対象の日に見つからないため飛ばしました:\n' + skipped.join(', ');
      }
      SpreadsheetApp.getUi().alert('配置を保存', message, SpreadsheetApp.getUi().ButtonSet.OK);
    });
  });
}

function readGridState_() {
  const raw = PropertiesService.getDocumentProperties().getProperty(GRID_PROP_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/**
 * 30分セルの並びを、連続する同じ配置の区間へまとめる。
 * 勤務時間の外へははみ出さないよう、必ず slot.start〜slot.end でクランプする。
 */
function compressSegments_(rowCells, date, slot) {
  const dayStart = startOfDay_(date);
  const slotMs = 1800000;
  const segments = [];
  let cur = null;

  for (let c = 0; c < GRID.COL_COUNT; c++) {
    const place = String(rowCells[c] || '').trim();
    const from = new Date(dayStart.getTime() + c * slotMs);
    const to = new Date(from.getTime() + slotMs);
    if (!place || from < slot.start || from >= slot.end) {
      cur = null;
      continue;
    }
    if (cur && cur.place === place && cur.to.getTime() === from.getTime()) {
      cur.to = to;
    } else {
      cur = { place: place, from: from, to: to };
      segments.push(cur);
    }
  }

  // 端を実際の勤務時間に合わせる（30分刻みで表現できない 16:10 などを壊さない）
  segments.forEach(function (s) {
    if (s.from < slot.start) s.from = new Date(slot.start.getTime());
    if (s.to > slot.end) s.to = new Date(slot.end.getTime());
  });
  return segments.filter(function (s) { return s.to > s.from; });
}

/**
 * 03_配置変更 を書き換える。
 * 表示中の日に重なる行だけを消してから書き直すので、
 * 日跨ぎ勤務の「前日ぶん」を消してしまわない。
 */
function writePlaceChanges_(ss, touchedIds, changeRows, date) {
  const sheet = requireSheet_(ss, SH.PLACE_CHANGE);
  const rowCount = PLC.LAST - PLC.FIRST + 1;
  const data = sheet.getRange(PLC.FIRST, 1, rowCount, PLC.WIDTH).getValues();
  const dayStart = startOfDay_(date);
  const dayEnd = addDays_(dayStart, 1);

  // 残す行を集める
  const keep = [];
  data.forEach(function (r) {
    const workId = String(r[PLC.WORK_ID - 1] || '').trim();
    if (!workId) return;
    const from = r[PLC.START_AT - 1];
    const to = r[PLC.END_AT - 1];
    const overlapsDay = (from instanceof Date && to instanceof Date) && (from < dayEnd && to > dayStart);
    if (touchedIds[workId] && overlapsDay) return;   // 今回書き直す対象
    keep.push([
      r[PLC.WORK_ID - 1], r[PLC.START - 1], r[PLC.END - 1],
      r[PLC.PLACE - 1], r[PLC.NOTE - 1]
    ]);
  });

  // 新しい行。開始・終了は「時刻」として書く。
  // 日跨ぎの判定は 03_配置変更 の I列・J列の数式が行う（移行で I列を修正済み）。
  changeRows.forEach(function (c) {
    keep.push([
      c.workId,
      timeOfDayFraction_(c.seg.from),
      timeOfDayFraction_(c.seg.to),
      c.seg.place,
      '配置表から保存'
    ]);
  });

  if (keep.length > rowCount) {
    throw new Error('03_配置変更 の行数が足りません（必要 ' + keep.length + ' 行 / 現在 ' + rowCount + ' 行）。\n' +
      '「移行」メニューで行数を拡張してください。');
  }

  // B・D・E・F・G のみ書く。A・C・H・I・J は数式なので触らない。
  const out = [];
  for (let i = 0; i < rowCount; i++) {
    out.push(i < keep.length ? keep[i] : ['', '', '', '', '']);
  }
  sheet.getRange(PLC.FIRST, PLC.WORK_ID, rowCount, 1)
    .setValues(out.map(function (r) { return [r[0]]; }));
  sheet.getRange(PLC.FIRST, PLC.START, rowCount, 2)
    .setValues(out.map(function (r) { return [r[1], r[2]]; }));
  sheet.getRange(PLC.FIRST, PLC.PLACE, rowCount, 2)
    .setValues(out.map(function (r) { return [r[3], r[4]]; }));
}

/** Date → その日の 0:00 からの経過を「1日=1」で表した小数 */
function timeOfDayFraction_(d) {
  return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
}
