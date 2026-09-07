/**
 * 新春祈願受付管理｜09_初期設定（段階1）
 *
 * 作るのは 98_マスター / 98B_選択肢 / 99_設定・操作ログ / 90_信者様マスター / 91_会社マスター。
 * 92 以降は段階2〜8で追加する。
 *
 * setupShinsunStage1 は管理者が1回だけ実行する。日常メニューには出さない。
 */

/* ── メニュー ─────────────────────────────────────────── */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('新春祈願受付')
    .addItem('設定状態を確認', 'checkShinsunSetup')
    .addToUi();
}

/* ── 初期設定（管理者が1回だけ実行）───────────────────── */

function setupShinsunStage1() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const created = [];

    created.push(buildMasterSheet_(ss));
    created.push(buildConfigSheet_(ss));
    created.push(buildChoicesSheet_(ss));
    created.push(buildPersonSheet_(ss));
    created.push(buildCompanySheet_(ss));

    resetShinsunCache_();
    applyChoiceValidations_(ss);
    orderSheets_(ss);
    removeDefaultSheet_(ss);

    logShinsun_(ss, '初期設定（段階1）', SHINSUN.STAGE1_SHEETS.join('、'), created.length, SHINSUN.VERSION);
    toast_(ss, '段階1の初期設定が完了しました。「新春祈願受付 > 設定状態を確認」で確認してください。', 10);
    return created;
  });
}

function sheetOf_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureSize_(sh, rows, columns) {
  if (sh.getMaxColumns() < columns) sh.insertColumnsAfter(sh.getMaxColumns(), columns - sh.getMaxColumns());
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
}

function writeHeaders_(sh, headers, startColumn, background) {
  sh.getRange(1, startColumn, 1, headers.length)
    .setValues([headers])
    .setBackground(background)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
}

/* ── 98_マスター ──────────────────────────────────────── */

function buildMasterSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.MASTER);
  const headers = SHINSUN.HEADERS.MASTER;
  ensureSize_(sh, 400, headers.length);
  writeHeaders_(sh, headers, 1, '#4f6f8f');

  const seed = [];
  const orderByGroup = {};
  SHINSUN.MASTER_SEED.forEach(item => {
    const group = item[0];
    orderByGroup[group] = (orderByGroup[group] || 0) + 1;
    seed.push([group, item[1], item[2], orderByGroup[group], true, item[3]]);
  });
  SHINSUN.GANI_SEED.forEach((value, index) => {
    seed.push(['願意', value, '', index + 1, true, '']);
  });

  // 既存の追記を消さない。1回目だけ書き込み、2回目以降は不足分だけ足す。
  const last = lastRowByColumn_(sh, 1);
  if (last < 2) {
    sh.getRange(2, 1, seed.length, headers.length).setValues(seed);
  } else {
    const existing = new Set(
      sh.getRange(2, 1, last - 1, 2).getDisplayValues()
        .map(row => key_(row[0]) + '|' + key_(row[1]))
    );
    const missing = seed.filter(row => !existing.has(key_(row[0]) + '|' + key_(row[1])));
    if (missing.length) {
      ensureSize_(sh, last + missing.length, headers.length);
      sh.getRange(last + 1, 1, missing.length, headers.length).setValues(missing);
    }
  }

  const rows = sh.getMaxRows() - 1;
  sh.getRange(2, 3, rows, 1).setNumberFormat('#,##0"円"');
  sh.getRange(2, 4, rows, 1).setNumberFormat('0');
  sh.getRange(2, 5, rows, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  [120, 220, 110, 80, 70, 300].forEach((width, i) => sh.setColumnWidth(i + 1, width));
  sh.setFrozenRows(1);
  sh.getRange('A1').setNote(
    '選択肢の一覧です。1行が選択肢1件。追加するときは行を足し、区分・値・表示順・有効を入れてください。\n' +
    '祈願札区分の金額は 94_祈願・御札明細 の単価に使います。'
  );
  if (sh.isSheetHidden()) sh.showSheet();
  return SHINSUN.SHEETS.MASTER;
}

/* ── 98B_選択肢（入力規則の参照元）──────────────────── */

function buildChoicesSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.CHOICES);
  const groups = SHINSUN.CHOICE_GROUPS;
  ensureSize_(sh, 200, groups.length);
  sh.getRange(1, 1, 1, groups.length).setValues([groups.slice()])
    .setBackground('#44546a').setFontColor('#ffffff').setFontWeight('bold');

  const master = SHINSUN.SHEETS.MASTER;
  const formulas = groups.map((group, index) => {
    const header = sh.getRange(1, index + 1).getA1Notation();
    return "=IFERROR(FILTER('" + master + "'!$B$2:$B," +
      "'" + master + "'!$A$2:$A=" + header + "," +
      "'" + master + "'!$E$2:$E<>FALSE),\"\")";
  });
  sh.getRange(2, 1, 1, groups.length).setFormulas([formulas]);
  sh.setFrozenRows(1);
  sh.getRange('A1').setNote('98_マスター から自動生成しています。直接編集しないでください。');
  if (!sh.isSheetHidden()) sh.hideSheet();
  return SHINSUN.SHEETS.CHOICES;
}

function choiceRange_(ss, group) {
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.CHOICES);
  const index = SHINSUN.CHOICE_GROUPS.indexOf(group);
  if (index < 0) return null;
  return sh.getRange(2, index + 1, sh.getMaxRows() - 1, 1);
}

function applyChoiceValidations_(ss) {
  SpreadsheetApp.flush();
  const bind = function (sh, headerName, group, allowInvalid) {
    const range = choiceRange_(ss, group);
    if (!range) return;
    const map = headerMap_(sh);
    const column = map[clean_(headerName)];
    if (!column) return;
    sh.getRange(2, column, sh.getMaxRows() - 1, 1).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInRange(range, true)
        .setAllowInvalid(allowInvalid === true)
        .setHelpText('98_マスター の「' + group + '」から選びます。追加するときは 98_マスター に行を足してください。')
        .build()
    );
  };

  const person = shinsunSheet_(ss, SHINSUN.SHEETS.PERSON);
  bind(person, '名簿区分', '名簿区分');
  bind(person, '敬称', '敬称');
  bind(person, '案内方法', '案内方法');
  bind(person, '翌年度案内状態', '翌年度案内状態');

  const company = shinsunSheet_(ss, SHINSUN.SHEETS.COMPANY);
  bind(company, '拠点区分', '拠点区分');
  bind(company, '敬称', '敬称');
  bind(company, '案内方法', '案内方法');
  bind(company, '翌年度案内状態', '翌年度案内状態');
}

/* ── 99_設定・操作ログ ────────────────────────────────── */

function buildConfigSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.CONFIG);
  ensureSize_(sh, 500, 10);
  writeHeaders_(sh, SHINSUN.HEADERS.CONFIG, 1, '#5b3a29');
  writeHeaders_(sh, SHINSUN.HEADERS.LOG, 5, '#355e3b');

  const last = lastRowByColumn_(sh, 1);
  if (last < 2) {
    const seed = SHINSUN.CONFIG_SEED.map(row => [row[0], row[1], row[2]]);
    sh.getRange(2, 1, seed.length, 3).setValues(seed);
  } else {
    // 既存の値は上書きしない。不足している項目だけ足す。
    // 照合はどちらも clean_ を通す。片側だけ全角括弧が残ると、
    // 同じ項目を「不足」と誤判定して行が重複し、getShinsunConfig_ が例外になる。
    const existing = new Set(sh.getRange(2, 1, last - 1, 1).getDisplayValues().map(row => clean_(row[0])));
    const missing = SHINSUN.CONFIG_SEED.filter(row => !existing.has(clean_(row[0])));
    if (missing.length) {
      sh.getRange(last + 1, 1, missing.length, 3)
        .setValues(missing.map(row => [row[0], row[1], row[2]]));
    }
  }

  repairTextConfig_(sh);

  const mailRow = findConfigRow_(sh, '自動メール有効');
  if (mailRow) {
    sh.getRange(mailRow, 2).setDataValidation(
      SpreadsheetApp.newDataValidation().requireCheckbox().build()
    );
  }
  sh.getRange(2, 5, sh.getMaxRows() - 1, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  [190, 220, 420, 30, 150, 210, 190, 220, 70, 320]
    .forEach((width, i) => sh.setColumnWidth(i + 1, width));
  sh.setFrozenRows(1);
  sh.getRange('A1').setNote(
    '年度・料金・時間枠・フォームID・アカウントはすべてここで管理します。コードには書きません。'
  );
  if (!sh.isSheetHidden()) sh.hideSheet();
  return SHINSUN.SHEETS.CONFIG;
}

function findConfigRow_(sh, name) {
  const last = lastRowByColumn_(sh, 1);
  if (last < 2) return 0;
  const target = clean_(name);
  const values = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (clean_(values[i][0]) === target) return i + 2;
  }
  return 0;
}

/**
 * 「1/1」「9:00」を文字列のまま保つ。
 * すでに日付・時刻へ変換されてしまった値は、元の書き方へ戻す。
 * 職員が後から変えた値を捨てないよう、シードではなく現在値から復元する。
 */
function repairTextConfig_(sh) {
  SHINSUN.TEXT_CONFIG.forEach(name => {
    const row = findConfigRow_(sh, name);
    if (!row) return;
    const cell = sh.getRange(row, 2);
    const current = cell.getValue();
    let text;
    if (current instanceof Date && !isNaN(current.getTime())) {
      const pattern = /時刻/.test(name) ? 'H:mm' : 'M/d';
      text = Utilities.formatDate(current, SHINSUN.TIMEZONE, pattern);
    } else {
      text = clean_(current);
    }
    if (!text) {
      const seed = SHINSUN.CONFIG_SEED.find(item => clean_(item[0]) === clean_(name));
      text = seed ? String(seed[1]) : '';
    }
    cell.setNumberFormat('@');
    cell.setValue(text);
  });
}

/* ── 90_信者様マスター ────────────────────────────────── */

function buildPersonSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.PERSON);
  const headers = SHINSUN.HEADERS.PERSON;
  ensureSize_(sh, 1000, headers.length);
  writeHeaders_(sh, headers, 1, '#365f91');

  /*
   * 列を足したり順番を変えたりすると、見出しは書き換わるのに
   * 行に付いた入力規則は元の列位置に残る。
   * ずれた規則が別の列の値を弾いてしまうので、いったん全部消してから付け直す。
   */
  sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getMaxColumns()).clearDataValidations();

  const map = headerMap_(sh);
  const rows = sh.getMaxRows() - 1;
  const auto = ['直近3年の申込', '最終申込年度', '連続未申込年数', '最終確認日', '登録日時'];
  auto.forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#eef1f4').setFontColor('#5b534c');
  });
  sh.getRange(2, col_(map, '最終確認日', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd');
  sh.getRange(2, col_(map, '登録日時', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(2, col_(map, '郵便番号', sh.getName()), rows, 1).setNumberFormat('@');
  ['電話番号', '電話番号2'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setNumberFormat('@');
  });

  [110, 170, 160, 90, 100, 100, 260, 160, 130, 130,
   210, 170, 80, 100, 200, 200, 130, 200, 260, 140, 170, 100, 110, 110, 140]
    .forEach((width, i) => { if (i < headers.length) sh.setColumnWidth(i + 1, width); });
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  applyMasterConditionalFormats_(sh, '翌年度案内状態', '案内停止理由', headers.length);

  sh.getRange(1, col_(map, '外札の記載名', sh.getName())).setNote(
    '前札（五万円）の外札に書く名前です。案内の宛名とは一致しません。' +
    '「飯塚市　小鶴照美」のように自治体名と個人名で上げる方がいます。空欄なら氏名を使います。'
  );
  sh.getRange(1, col_(map, '内札の記載名', sh.getName())).setNote(
    '前札（五万円）の内札に書く名前です。空欄なら氏名を使います。' +
    '新春一般の祈願には外札がなく、一般札だけを作ります。'
  );

  sh.getRange(1, col_(map, '信者ID', sh.getName())).setNote('氏名を入力すると自動で採番します。');
  sh.getRange(1, col_(map, '世帯ID', sh.getName())).setNote(
    '一括領収書・同封の単位です。案内は個人単位で出します。空欄で構いません。'
  );
  sh.getRange(1, col_(map, '案内停止理由', sh.getName())).setNote(
    '翌年度案内状態が「継続」以外のときは必ず入力してください。'
  );
  sh.getRange(1, col_(map, '名簿区分', sh.getName())).setNote(
    '一般か僧侶かを分けます。暑中見舞（僧侶）の名簿から入った方は「僧侶」になります。' +
    '案内状の文面と宛名を分けるために使います。'
  );
  sh.getRange(1, col_(map, '年間法会の人物ID', sh.getName())).setNote(
    '任意。年間法会受付管理と将来そろえるための予備列です。'
  );
  if (sh.isSheetHidden()) sh.showSheet();
  return SHINSUN.SHEETS.PERSON;
}

/* ── 91_会社マスター ──────────────────────────────────── */

function buildCompanySheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.COMPANY);
  const headers = SHINSUN.HEADERS.COMPANY;
  ensureSize_(sh, 1000, headers.length);
  writeHeaders_(sh, headers, 1, '#6b4f3a');

  /*
   * 列を足したり順番を変えたりすると、見出しは書き換わるのに
   * 行に付いた入力規則は元の列位置に残る。
   * ずれた規則が別の列の値を弾いてしまうので、いったん全部消してから付け直す。
   */
  sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getMaxColumns()).clearDataValidations();

  const map = headerMap_(sh);
  const rows = sh.getMaxRows() - 1;
  ['直近3年の申込', '最終申込年度', '連続未申込年数', '最終確認日', '登録日時'].forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#f3efe9').setFontColor('#5b534c');
  });
  // 宛名4種は前札マスター(R2)の実態そのまま。色を分けて役割を見分けやすくする。
  ['案内状の宛名', '請求書の宛名', '領収書の宛名', '外札の記載名', '内札の記載名'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setBackground('#fff8e8');
  });
  sh.getRange(2, col_(map, '最終確認日', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd');
  sh.getRange(2, col_(map, '登録日時', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  ['郵便番号', '電話番号', 'FAX'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setNumberFormat('@');
  });

  [110, 130, 90, 250, 190, 150, 150, 150, 100, 260, 160,
   130, 130, 210, 220, 80, 200, 200, 220, 220,
   100, 130, 200, 260, 170, 100, 110, 110, 140]
    .forEach((width, i) => { if (i < headers.length) sh.setColumnWidth(i + 1, width); });
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  applyMasterConditionalFormats_(sh, '翌年度案内状態', '案内停止理由', headers.length);

  sh.getRange(1, col_(map, '会社ID', sh.getName())).setNote('会社名を入力すると自動で採番します。');
  sh.getRange(1, col_(map, '拠点ID', sh.getName())).setNote(
    '本社は -01。同じ会社の支店・営業所・工場は、会社IDを同じにして拠点IDを分けます。'
  );
  sh.getRange(1, col_(map, '案内状の宛名', sh.getName())).setNote(
    '別人・別法人を指定できます（例：案内状は後援会長様宛）。空欄なら会社名を使います。'
  );
  sh.getRange(1, col_(map, '内札の記載名', sh.getName())).setNote('空欄なら外札の記載名を使います。');
  if (sh.isSheetHidden()) sh.showSheet();
  return SHINSUN.SHEETS.COMPANY;
}

/** 翌年度案内状態が「継続」以外なのに理由が空欄の行を赤くする。 */
function applyMasterConditionalFormats_(sh, stateHeader, reasonHeader, width) {
  const map = headerMap_(sh);
  const stateColumn = map[stateHeader];
  const reasonColumn = map[reasonHeader];
  if (!stateColumn || !reasonColumn) return;

  const stateRef = '$' + columnLetter_(stateColumn) + '2';
  const reasonRef = '$' + columnLetter_(reasonColumn) + '2';
  const formula = '=AND(' + stateRef + '<>"",' + stateRef + '<>"継続",' + reasonRef + '="")';

  const target = sh.getRange(2, reasonColumn, sh.getMaxRows() - 1, 1);
  const kept = sh.getConditionalFormatRules().filter(rule => {
    const condition = rule.getBooleanCondition();
    const values = condition && condition.getCriteriaValues();
    return !(values && String(values[0] || '') === formula);
  });
  kept.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground('#fce8e6').setFontColor('#b3261e').setBold(true)
      .setRanges([target]).build()
  );
  sh.setConditionalFormatRules(kept);
}

function columnLetter_(column) {
  let result = '';
  let value = Number(column);
  while (value > 0) {
    value--;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

/* ── シートの並びと初期シートの後始末 ─────────────────── */

function orderSheets_(ss) {
  SHINSUN.STAGE1_SHEETS.forEach((name, index) => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(index + 1);
  });
  const person = ss.getSheetByName(SHINSUN.SHEETS.PERSON);
  if (person) ss.setActiveSheet(person);
}

/** 新規ファイルに残る「シート1」を、空のときだけ消す。 */
function removeDefaultSheet_(ss) {
  ['シート1', 'Sheet1'].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    if (sh.getLastRow() > 0 || sh.getLastColumn() > 0) return;
    if (ss.getSheets().length <= 1) return;
    ss.deleteSheet(sh);
  });
}

/* ── 編集時の自動処理（単純トリガー）───────────────────── */

function onEdit(e) {
  if (!e || !e.range || e.range.getRow() < 2) return;
  const sh = e.range.getSheet();
  const name = sh.getName();
  try {
    if (name === SHINSUN.SHEETS.PERSON) handlePersonEdit_(e, sh);
    else if (name === SHINSUN.SHEETS.COMPANY) handleCompanyEdit_(e, sh);
  } catch (error) {
    // 入力そのものは妨げない。不整合は「設定状態を確認」で拾う。
  }
}

function touchesHeader_(e, map, headerName) {
  const column = map[clean_(headerName)];
  if (!column) return false;
  const first = e.range.getColumn();
  const last = first + e.range.getNumColumns() - 1;
  return column >= first && column <= last;
}

function handlePersonEdit_(e, sh) {
  const map = headerMap_(sh);
  const idColumn = col_(map, '信者ID', sh.getName());
  const nameColumn = col_(map, '氏名', sh.getName());
  const firstRow = e.range.getRow();
  const lastRow = firstRow + e.range.getNumRows() - 1;

  if (touchesHeader_(e, map, '氏名')) {
    withScriptLock_(function () {
      for (let row = firstRow; row <= lastRow; row++) {
        const personName = clean_(sh.getRange(row, nameColumn).getValue());
        if (!personName) continue;
        if (!clean_(sh.getRange(row, idColumn).getValue())) {
          sh.getRange(row, idColumn).setValue(
            nextSequentialId_(sh, '信者ID', SHINSUN.ID.PERSON.prefix, SHINSUN.ID.PERSON.digits)
          );
          stampRegistered_(sh, map, row);
          setDefaultIfBlank_(sh, map, row, '敬称', '様');
          setDefaultIfBlank_(sh, map, row, '案内方法', '郵送');
          setDefaultIfBlank_(sh, map, row, '翌年度案内状態', '継続');
        }
      }
    });
    warnDuplicateNames_(sh, map, '氏名', firstRow, lastRow, '同じ氏名の方が既に登録されています');
  }

  if (touchesHeader_(e, map, '翌年度案内状態')) {
    noteStopReason_(sh, map, firstRow, lastRow);
  }
}

function handleCompanyEdit_(e, sh) {
  const map = headerMap_(sh);
  const companyIdColumn = col_(map, '会社ID', sh.getName());
  const siteIdColumn = col_(map, '拠点ID', sh.getName());
  const nameColumn = col_(map, '会社・法人・団体名', sh.getName());
  const firstRow = e.range.getRow();
  const lastRow = firstRow + e.range.getNumRows() - 1;

  if (touchesHeader_(e, map, '会社・法人・団体名') || touchesHeader_(e, map, '会社ID')) {
    withScriptLock_(function () {
      for (let row = firstRow; row <= lastRow; row++) {
        const companyName = clean_(sh.getRange(row, nameColumn).getValue());
        if (!companyName) continue;
        let companyId = clean_(sh.getRange(row, companyIdColumn).getValue());
        if (!companyId) {
          companyId = nextSequentialId_(sh, '会社ID', SHINSUN.ID.COMPANY.prefix, SHINSUN.ID.COMPANY.digits);
          sh.getRange(row, companyIdColumn).setValue(companyId);
        }
        if (!clean_(sh.getRange(row, siteIdColumn).getValue())) {
          sh.getRange(row, siteIdColumn).setValue(nextSiteId_(sh, companyId));
        }
        stampRegistered_(sh, map, row);
        setDefaultIfBlank_(sh, map, row, '拠点区分', '本社');
        setDefaultIfBlank_(sh, map, row, '敬称', '御中');
        setDefaultIfBlank_(sh, map, row, '案内方法', '郵送');
        setDefaultIfBlank_(sh, map, row, '翌年度案内状態', '継続');
      }
    });
  }

  if (touchesHeader_(e, map, '翌年度案内状態')) {
    noteStopReason_(sh, map, firstRow, lastRow);
  }
}

function stampRegistered_(sh, map, row) {
  const now = new Date();
  const registered = map['登録日時'];
  const confirmed = map['最終確認日'];
  if (registered && !sh.getRange(row, registered).getValue()) sh.getRange(row, registered).setValue(now);
  if (confirmed) sh.getRange(row, confirmed).setValue(now);
}

function setDefaultIfBlank_(sh, map, row, headerName, value) {
  const column = map[clean_(headerName)];
  if (!column) return;
  const cell = sh.getRange(row, column);
  if (!clean_(cell.getValue())) cell.setValue(value);
}

function noteStopReason_(sh, map, firstRow, lastRow) {
  const stateColumn = map['翌年度案内状態'];
  const reasonColumn = map['案内停止理由'];
  if (!stateColumn || !reasonColumn) return;
  const missing = [];
  for (let row = firstRow; row <= lastRow; row++) {
    const state = clean_(sh.getRange(row, stateColumn).getValue());
    if (!state || state === '継続') continue;
    if (!clean_(sh.getRange(row, reasonColumn).getValue())) missing.push(row);
  }
  if (missing.length) {
    toast_(sh.getParent(),
      '案内停止理由を入力してください（' + missing.join('・') + '行）。理由のない停止は行いません。', 10);
  }
}

/**
 * 同姓同名は登録を止めない。既に同じ氏名があることを知らせるだけにする。
 * 別人を登録できる必要があるため、これは警告であってエラーではない。
 */
function warnDuplicateNames_(sh, map, headerName, firstRow, lastRow, message) {
  const column = map[clean_(headerName)];
  if (!column) return;
  const last = lastRowByColumn_(sh, column);
  if (last < 2) return;
  const values = sh.getRange(2, column, last - 1, 1).getDisplayValues();
  const count = {};
  values.forEach(row => {
    const k = key_(row[0]);
    if (!k) return;
    count[k] = (count[k] || 0) + 1;
  });
  const hits = [];
  for (let row = firstRow; row <= lastRow; row++) {
    if (row > last) break;
    const value = clean_(values[row - 2][0]);
    if (value && count[key_(value)] > 1) hits.push(value);
  }
  if (hits.length) {
    toast_(sh.getParent(),
      message + '：' + [...new Set(hits)].join('、') +
      '。別人であればそのまま登録して構いません。同一人物なら既存行を更新してください。', 10);
  }
}

/* ── 設定状態を確認 ───────────────────────────────────── */

function checkShinsunSetup() {
  resetShinsunCache_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const issues = [];
  const lines = [];

  // シートと見出し
  SHINSUN.STAGE1_SHEETS.forEach(name => {
    if (!ss.getSheetByName(name)) issues.push('シート「' + name + '」がありません');
  });
  const headerChecks = [
    [SHINSUN.SHEETS.PERSON, SHINSUN.HEADERS.PERSON],
    [SHINSUN.SHEETS.COMPANY, SHINSUN.HEADERS.COMPANY],
    [SHINSUN.SHEETS.MASTER, SHINSUN.HEADERS.MASTER]
  ];
  headerChecks.forEach(item => {
    const sh = ss.getSheetByName(item[0]);
    if (sh && !headersMatch_(sh, item[1])) issues.push('「' + item[0] + '」の見出しが一致しません');
  });
  const configSh = ss.getSheetByName(SHINSUN.SHEETS.CONFIG);
  if (configSh && !headersMatch_(configSh, SHINSUN.HEADERS.CONFIG)) {
    issues.push('「' + SHINSUN.SHEETS.CONFIG + '」の設定見出しが一致しません');
  }

  // 98_マスター の区分
  let masterGroups = 0;
  let ganiCount = 0;
  let fudaCount = 0;
  try {
    const master = getShinsunMaster_(ss);
    masterGroups = Object.keys(master).length;
    ganiCount = (master['願意'] || []).length;
    fudaCount = (master['祈願札区分'] || []).length;
    SHINSUN.CHOICE_GROUPS.forEach(group => {
      if (!master[group] || !master[group].length) issues.push('98_マスター に「' + group + '」がありません');
    });
    (master['祈願札区分'] || []).forEach(item => {
      if (!Number.isFinite(item.amount) || item.amount <= 0) {
        issues.push('祈願札区分「' + item.value + '」の金額を確認してください');
      }
    });
  } catch (error) {
    issues.push('98_マスター を読めません：' + error.message);
  }

  // 99_設定
  let config = {};
  try {
    config = getShinsunConfig_(ss);
    SHINSUN.REQUIRED_CONFIG.forEach(name => {
      if (!hasConfig_(config, name)) issues.push('99_設定 に「' + name + '」がありません');
      else if (name !== '自動メール有効' && clean_(configValue_(config, name)) === '') {
        issues.push('99_設定 の「' + name + '」が空欄です');
      }
    });
    if (asBoolean_(configValue_(config, '自動メール有効'))) {
      issues.push('自動メールが有効になっています。段階9の承認まで FALSE にしてください');
    }
    const slot = Number(configValue_(config, '枠の刻み（分）'));
    if (!Number.isInteger(slot) || slot <= 0) issues.push('99_設定 の「枠の刻み（分）」を確認してください');
    ['1枠の人数上限', '1枠の組数上限', '未申込要確認年数'].forEach(name => {
      const value = Number(configValue_(config, name));
      if (!Number.isInteger(value) || value <= 0) issues.push('99_設定 の「' + name + '」を確認してください');
    });
    // 枠の日付・時刻は文字列で持つ。日付値になっていると年が西暦（現在年度）とずれる。
    SHINSUN.TEXT_CONFIG.forEach(name => {
      if (configValue_(config, name) instanceof Date) {
        issues.push('99_設定 の「' + name + '」が日付値になっています。文字列に直してください');
      }
    });
  } catch (error) {
    issues.push('99_設定 を読めません：' + error.message);
  }

  // 入力規則
  try {
    const person = shinsunSheet_(ss, SHINSUN.SHEETS.PERSON);
    const map = headerMap_(person);
    const validation = person.getRange(2, col_(map, '翌年度案内状態', person.getName())).getDataValidation();
    if (!validation) issues.push('90_信者様マスター の「翌年度案内状態」に入力規則がありません');
  } catch (error) {
    issues.push('入力規則を確認できません：' + error.message);
  }

  // 停止理由の未入力
  const missingReasons = findMissingStopReasons_(ss);
  missingReasons.forEach(item => issues.push(item));

  // トリガー（段階1では0本が正常。段階8で4本になる）
  const triggers = ScriptApp.getProjectTriggers();
  const formTriggers = triggers.filter(t => t.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT);
  const editTriggers = triggers.filter(t => t.getEventType() === ScriptApp.EventType.ON_EDIT);
  const changeTriggers = triggers.filter(t => t.getEventType() === ScriptApp.EventType.ON_CHANGE);

  const personCount = countRows_(ss, SHINSUN.SHEETS.PERSON, '信者ID');
  const companyCount = countRows_(ss, SHINSUN.SHEETS.COMPANY, '会社ID');

  lines.push('■ 段階1（マスターの枠）');
  lines.push('シート：' + SHINSUN.STAGE1_SHEETS.filter(n => ss.getSheetByName(n)).length + '/' + SHINSUN.STAGE1_SHEETS.length);
  lines.push('98_マスター：' + masterGroups + '区分（願意 ' + ganiCount + '／祈願札区分 ' + fudaCount + '）');
  lines.push('90_信者様マスター：' + personCount + '件');
  lines.push('91_会社マスター：' + companyCount + '件');
  lines.push('');
  lines.push('■ 99_設定 の主な値');
  ['現在年度', '西暦（現在年度）', '枠開始日', '枠終了日', '枠開始時刻', '枠終了時刻',
   '枠の刻み（分）', '1枠の人数上限', '1枠の組数上限', '未申込要確認年数',
   '管理用アカウント'].forEach(name => {
    if (hasConfig_(config, name)) lines.push('　' + name + '：' + clean_(configValue_(config, name)));
  });
  lines.push('　自動メール有効：' + (asBoolean_(configValue_(config, '自動メール有効')) ? '有効' : '無効（段階9まで）'));
  lines.push('');
  lines.push('■ トリガー（この実行アカウントが作成した分だけ確認できます）');
  lines.push('　フォーム送信 ' + formTriggers.length + ' ／ 編集 ' + editTriggers.length + ' ／ 変更 ' + changeTriggers.length);
  lines.push('　段階1では 0／0／0 が正常です。段階8で フォーム送信2・編集1・変更1 になります。');
  lines.push('　インストール型トリガーは作成者アカウントごとに管理されます。');
  lines.push('　設定した管理用アカウント（' + (clean_(configValue_(config, '管理用アカウント')) || '未設定') + '）で実行してください。');

  const header = issues.length
    ? '要確認：' + issues.length + '件\n\n' + issues.map(x => '・' + x).join('\n') + '\n\n'
    : '段階1の設定は正常です。\n\n';
  SpreadsheetApp.getUi().alert(header + lines.join('\n'));
  logShinsun_(ss, '設定状態を確認', '段階1', issues.length, issues.length ? '要確認あり' : '正常');
}

function countRows_(ss, sheetName, idHeader) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return 0;
  try {
    const map = headerMap_(sh);
    const column = map[idHeader];
    if (!column) return 0;
    return Math.max(0, lastRowByColumn_(sh, column) - 1);
  } catch (error) {
    return 0;
  }
}

function findMissingStopReasons_(ss) {
  const result = [];
  [[SHINSUN.SHEETS.PERSON, '氏名'], [SHINSUN.SHEETS.COMPANY, '会社・法人・団体名']].forEach(item => {
    const sh = ss.getSheetByName(item[0]);
    if (!sh) return;
    try {
      const table = readTable_(sh);
      const iState = col_(table.map, '翌年度案内状態', sh.getName()) - 1;
      const iReason = col_(table.map, '案内停止理由', sh.getName()) - 1;
      const iName = col_(table.map, item[1], sh.getName()) - 1;
      const hits = [];
      table.rows.forEach((row, index) => {
        const state = clean_(row[iState]);
        if (!state || state === '継続') return;
        if (clean_(row[iReason])) return;
        hits.push((index + 2) + '行：' + (clean_(row[iName]) || '氏名未入力'));
      });
      if (hits.length) {
        result.push('「' + item[0] + '」で案内停止理由が未入力：' + hits.slice(0, 10).join('、') +
          (hits.length > 10 ? ' ほか' + (hits.length - 10) + '件' : ''));
      }
    } catch (error) {
      result.push('「' + item[0] + '」を確認できません：' + error.message);
    }
  });
  return result;
}
