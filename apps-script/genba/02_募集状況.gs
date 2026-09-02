/**
 * 02B_募集状況 — 期間ぜんぶの不足を1画面で見るシート
 *
 * 行＝日付、列＝時間帯（07_必要人数 の呼び名をそのまま使う）。
 * セルは「あと何人」。04_日別30分配置 が1日の詳細を見る場所であるのに対し、
 * こちらは「どの日に募集をかけるか」を決めるための粗い一覧。
 */

const RECRUIT = Object.freeze({
  TITLE_ROW: 1,
  NOTE_ROW: 2,
  HEAD_ROW: 4,
  FIRST: 5,
  DATE_COL: 1,
  DOW_COL: 2,
  BAND_FIRST: 3      // C列から時間帯が並ぶ
});

function rebuildRecruitmentSheet() {
  runSafely_('募集状況を作り直す', function () {
    withDocumentLock_(function () {
      const ss = SpreadsheetApp.getActive();
      const cfg = settings_(ss);
      const dates = eachDate_(cfg.periodFrom, cfg.periodTo);
      const bandList = bands_(ss);
      if (!bandList.length) throw new Error('07_必要人数 に時間帯がありません。');

      let sheet = ss.getSheetByName(SH.RECRUIT);
      if (!sheet) {
        sheet = ss.insertSheet(SH.RECRUIT, sheetIndexAfter_(ss, SH.ACTUAL));
      }
      sheet.clear();
      sheet.clearConditionalFormatRules();

      const bandCount = bandList.length;
      const totalCol = RECRUIT.BAND_FIRST + bandCount;      // 合計不足
      const slotCol = totalCol + 1;                          // 枠数
      const stateCol = totalCol + 2;                         // 状態
      const width = stateCol;

      sheet.getRange(RECRUIT.TITLE_ROW, 1).setValue('募集状況（期間ぜんぶ）')
        .setFontWeight('bold').setFontSize(14);
      sheet.getRange(RECRUIT.NOTE_ROW, 1).setValue(
        '「あと」＝必要人数 − 担当者が決まっている枠。赤は不足、緑は充足。' +
        '数字を減らすには 02_シフト入力 に枠を足すか、担当者を割り当てます。');

      // 見出し
      const head = ['日付', '曜日'];
      bandList.forEach(function (b) { head.push(b.name); });
      head.push('合計不足', '枠数', '状態');
      sheet.getRange(RECRUIT.HEAD_ROW, 1, 1, width).setValues([head])
        .setFontWeight('bold').setBackground('#F0EEEB');

      // 本体
      const last = String(SHIFT.LAST);
      const needLast = String(NEED.LAST);
      dates.forEach(function (date, i) {
        const row = RECRUIT.FIRST + i;
        sheet.getRange(row, RECRUIT.DATE_COL).setValue(date).setNumberFormat('m/d');
        sheet.getRange(row, RECRUIT.DOW_COL).setFormula(`=TEXT($A${row},"ddd")`);

        bandList.forEach(function (b, j) {
          const col = RECRUIT.BAND_FIRST + j;
          const colA1 = columnLetter_(col);
          sheet.getRange(row, col).setFormula(
            `=LET(d,$A${row},band,${colA1}$${RECRUIT.HEAD_ROW},` +
            `spec,SUMPRODUCT(N('07_必要人数'!$B$5:$B$${needLast}=d),N('07_必要人数'!$E$5:$E$${needLast}=band),N('07_必要人数'!$K$5:$K$${needLast}="使用"),N('07_必要人数'!$H$5:$H$${needLast})),` +
            `hasSpec,SUMPRODUCT(N('07_必要人数'!$B$5:$B$${needLast}=d),N('07_必要人数'!$E$5:$E$${needLast}=band),N('07_必要人数'!$K$5:$K$${needLast}="使用")),` +
            `gen,SUMPRODUCT(N('07_必要人数'!$B$5:$B$${needLast}=""),N('07_必要人数'!$E$5:$E$${needLast}=band),N('07_必要人数'!$K$5:$K$${needLast}="使用"),N('07_必要人数'!$H$5:$H$${needLast})),` +
            `need,IF(hasSpec>0,spec,gen),` +
            `filled,COUNTIFS('02_シフト入力'!$B$5:$B$${last},d,'02_シフト入力'!$V$5:$V$${last},band,'02_シフト入力'!$D$5:$D$${last},"<>",'02_シフト入力'!$N$5:$N$${last},"<>取消"),` +
            `need-filled)`);
        });

        // 合計不足＝各時間帯の不足（マイナスは0として扱う）の合計
        const parts = [];
        for (let k = 0; k < bandCount; k++) {
          parts.push(`MAX(0,${columnLetter_(RECRUIT.BAND_FIRST + k)}${row})`);
        }
        sheet.getRange(row, totalCol).setFormula('=' + parts.join('+'));

        sheet.getRange(row, slotCol).setFormula(
          `=COUNTIFS('02_シフト入力'!$B$5:$B$${last},$A${row},'02_シフト入力'!$N$5:$N$${last},"<>取消")`);
        sheet.getRange(row, stateCol).setFormula(
          `=IF($${columnLetter_(slotCol)}${row}=0,"枠が未作成",` +
          `IF($${columnLetter_(totalCol)}${row}<=0,"充足",` +
          `IF($${columnLetter_(totalCol)}${row}<=2,"あと少し","募集中")))`);
      });

      applyRecruitFormatting_(sheet, dates.length, bandCount, totalCol, stateCol);
      sheet.setFrozenRows(RECRUIT.HEAD_ROW);
      sheet.setFrozenColumns(2);
      sheet.autoResizeColumns(1, stateCol);

      ensureWarningProtection_(sheet, 'A1:' + columnLetter_(stateCol) + (RECRUIT.FIRST + dates.length),
        '募集状況（自動計算）');

      SpreadsheetApp.flush();
      ss.setActiveSheet(sheet);
      ss.toast(dates.length + '日分の募集状況を作成しました。', '募集状況', 6);
    });
  });
}

function applyRecruitFormatting_(sheet, dateCount, bandCount, totalCol, stateCol) {
  const firstRow = RECRUIT.FIRST;
  const gap = sheet.getRange(firstRow, RECRUIT.BAND_FIRST, dateCount, bandCount + 1); // 時間帯＋合計
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(5).setBackground('#B93B2B').setFontColor('#FFFFFF')
      .setRanges([gap]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberBetween(1, 4).setBackground('#F6EDDC').setFontColor('#8A6011')
      .setRanges([gap]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(0).setBackground('#E4EDE6').setFontColor('#3D6B51')
      .setRanges([gap]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('枠が未作成').setBackground('#F6E7E3').setFontColor('#B93B2B')
      .setRanges([sheet.getRange(firstRow, stateCol, dateCount, 1)]).build()
  ];
  sheet.setConditionalFormatRules(rules);
}

function sheetIndexAfter_(ss, name) {
  const sheet = ss.getSheetByName(name);
  return sheet ? sheet.getIndex() : ss.getNumSheets();
}

function columnLetter_(column) {
  let s = '';
  let n = column;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
