/**
 * 新春祈願受付管理｜03_移行反映（段階3）
 *
 * 97_移行作業 の分類を 90_信者様マスター／91_会社マスター／92_年度別案内対象 へ反映する。
 * 仕様書 §10 では 07_移行.gs に書き出しと反映をまとめているが、
 * 1ファイルが長くなりすぎるため反映だけをここへ分けた。動きは変わらない。
 *
 * 元ファイルは読みもしない。触るのは新しいスプレッドシートの中だけ。
 * 管理者が Apps Script エディタから実行する。日常メニューには出さない。
 */

/**
 * 要確認へ一言足す。同じ文が既にあれば足さない。
 * 下書きも反映も何度でも実行できるので、これがないと同じ文が積み上がる。
 */
function dropNote_(current, addition) {
  const text = clean_(addition);
  const lines = String(current == null ? '' : current).split('\n').map(clean_).filter(Boolean);
  return lines.filter(line => line !== text).join('\n');
}

function noteOnce_(current, addition) {
  const text = clean_(addition);
  if (!text) return current;
  const lines = String(current == null ? '' : current).split('\n').map(clean_).filter(Boolean);
  if (lines.indexOf(text) >= 0) return lines.join('\n');
  lines.push(text);
  return lines.join('\n');
}


/**
 * 段階3の初期設定。
 * 92_年度別案内対象 を作り、98_マスター へ「（過去実績）」を足し、
 * 97_移行作業 の「処理」に「履歴のみ」を足す。
 * 既に入っている値は上書きしない。
 */
function setupShinsunStage3() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    buildMasterSheet_(ss);      // 案内状態「（過去実績）」を足す（既存は消さない）
    buildChoicesSheet_(ss);
    buildGuideSheet_(ss);
    const migration = ss.getSheetByName(SHINSUN.SHEETS.MIGRATION);
    if (migration) {
      bindMigrationValidation_(ss, migration, '処理',
        ['未分類', '登録する', '既存に統合', '履歴のみ', '対象外']);
    }
    resetShinsunCache_();
    logShinsun_(ss, '初期設定（段階3）', SHINSUN.SHEETS.GUIDE, 1, SHINSUN.VERSION);
    toast_(ss, '92_年度別案内対象 を作りました。次に suggestShinsunClassification を実行してください。', 12);
    return SHINSUN.SHEETS.GUIDE;
  });
}

/**
 * 92_年度別案内対象。年度×宛先で1行。
 * F〜L は作成時点のコピー。マスターの住所を直しても過去年度の行は変わらない。
 *
 * 仕様書 §4 の列に加えて2列を持つ。
 *   読上げ順   … 仕様書 §13「過年度に入る項目」で必要。93 は段階6のためここに置く。
 *   移行元ID   … §13-2 の「元ファイル名と元の行番号」を反映後もたどれるようにする。
 */
function buildGuideSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.GUIDE);
  const headers = SHINSUN.HEADERS.GUIDE;
  ensureSize_(sh, 3000, headers.length);
  writeHeaders_(sh, headers, 1, '#3f6b4f');

  const map = headerMap_(sh);
  const rows = sh.getMaxRows() - 1;

  ['案内状態', '返答状態', '返答日', '職員メモ'].forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#fff4cc');
  });
  ['年度別案内ID', '年度', '対象区分', '対象ID', '案内ルート',
   '案内宛名', '郵便番号', '住所', '建物名', '敬称', '電話番号', '案内方法',
   '案内状の種類', '案内日', '前年度申込有無', '連続未申込年数', '要確認',
   '世帯ID', '集約先案内ID', '読上げ順', '移行元ID', '作成日時'].forEach(name => {
    const column = map[clean_(name)];
    if (column) sh.getRange(2, column, rows, 1).setBackground('#f2f5f2').setFontColor('#4a544c');
  });

  ['郵便番号', '電話番号'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setNumberFormat('@');
  });
  ['案内日', '返答日'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd');
  });
  sh.getRange(2, col_(map, '作成日時', sh.getName()), rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(2, col_(map, '読上げ順', sh.getName()), rows, 1).setNumberFormat('0');
  sh.getRange(2, col_(map, '連続未申込年数', sh.getName()), rows, 1).setNumberFormat('0');
  ['住所', '要確認', '職員メモ'].forEach(name => {
    sh.getRange(2, col_(map, name, sh.getName()), rows, 1).setWrap(true).setVerticalAlignment('top');
  });

  bindGuideValidation_(ss, sh, '対象区分', '（なし）', ['信者様', '会社']);
  bindGuideValidation_(ss, sh, '案内ルート', '案内ルート', null);
  bindGuideValidation_(ss, sh, '案内状態', '案内状態', null);
  bindGuideValidation_(ss, sh, '返答状態', '返答状態', null);
  bindGuideValidation_(ss, sh, '案内方法', '案内方法', null);
  bindGuideValidation_(ss, sh, '敬称', '敬称', null);

  [130, 70, 80, 100, 90,
   220, 90, 260, 140, 60, 130, 90,
   150, 110, 90, 90, 90,
   110, 90, 240, 90, 130, 220, 80, 170, 130]
    .forEach((width, i) => { if (i < headers.length) sh.setColumnWidth(i + 1, width); });
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);

  sh.getRange(1, col_(map, '案内宛名', sh.getName())).setNote(
    '作成時点のコピーです。90/91 の住所を直しても、過去年度のこの行は変わりません。'
  );
  sh.getRange(1, col_(map, '案内状態', sh.getName())).setNote(
    '過年度の移行行は「（過去実績）」で固定します。案内対象の再生成では作り直しません。'
  );
  sh.getRange(1, col_(map, '読上げ順', sh.getName())).setNote(
    '元朝前札読み上げの並び順（仮）。翌年度の読上げ順の初期値に使います。'
  );
  return sh;
}

function bindGuideValidation_(ss, sh, headerName, group, values) {
  const map = headerMap_(sh);
  const column = map[clean_(headerName)];
  if (!column) return;
  const range = sh.getRange(2, column, sh.getMaxRows() - 1, 1);
  if (values) {
    range.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true).setAllowInvalid(false).build());
    return;
  }
  const source = choiceRange_(ss, group);
  if (!source) return;
  range.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(source, true).setAllowInvalid(false)
    .setHelpText('98_マスター の「' + group + '」から選びます。').build());
}

/* ── 分類の下書き ─────────────────────────────────────── */

/**
 * 97_移行作業 の「区分」「確定名称」「処理」を下書きとして埋める。
 *
 * 埋めるのは空欄の行だけ。職員が入れた値には触らない。
 * 判定できない行は空欄のまま残し、要確認に理由を書く。
 * 何度実行しても、職員が直した内容は消えない。
 */
function suggestShinsunClassification() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const sh = shinsunSheet_(ss, SHINSUN.SHEETS.MIGRATION);
    const map = headerMap_(sh);
    const name = sh.getName();
    const iId = col_(map, '移行ID', name) - 1;
    const iKind = col_(map, '種別', name) - 1;
    const iRawName = col_(map, '名称（生）', name) - 1;
    const iRep = col_(map, '代表者名（生）', name) - 1;
    const iKubun = col_(map, '区分', name) - 1;
    const iFixed = col_(map, '確定名称', name) - 1;
    const iAction = col_(map, '処理', name) - 1;
    const iIssue = col_(map, '要確認', name) - 1;
    const iState = col_(map, '反映状態', name) - 1;

    const last = lastRowByColumn_(sh, iId + 1);
    if (last < 2) { SpreadsheetApp.getUi().alert('97_移行作業 に行がありません。'); return 0; }

    const width = sh.getLastColumn();
    const values = sh.getRange(2, 1, last - 1, width).getValues();

    let looked = 0;
    let alreadyApplied = 0;
    let filledKubun = 0;
    let keptKubun = 0;
    let filledName = 0;
    let filledAction = 0;
    let undecided = 0;
    let withIssue = 0;
    const byKubun = { '信者様': 0, '会社': 0 };

    values.forEach(row => {
      if (!clean_(row[iId])) return;
      if (clean_(row[iState]) === '反映済') { alreadyApplied++; return; }   // 反映後は触らない
      looked++;

      const kind = clean_(row[iKind]);
      const rawName = clean_(row[iRawName]);
      const rep = clean_(row[iRep]);
      const guess = guessShinsunKubun_(rawName, rep);

      if (clean_(row[iKubun])) keptKubun++;
      else if (guess.kubun) { row[iKubun] = guess.kubun; filledKubun++; }
      if (!clean_(row[iFixed]) && guess.name) { row[iFixed] = guess.name; filledName++; }

      const settled = clean_(row[iKubun]);
      if (settled in byKubun) byKubun[settled]++;

      const action = clean_(row[iAction]);
      if (!action || action === '未分類') {
        // 読上げ名簿は氏名しかないため 90/91 は増やさず、92 の過年度行だけ作る。
        const next = (kind === '読上げ名簿') ? '履歴のみ' : (guess.kubun ? '登録する' : '');
        if (next) { row[iAction] = next; filledAction++; }
      }

      if (!clean_(row[iKubun])) undecided++;

      // 以前は下書きした行すべてに「下書き（要確認）」を書いていたが、
      // 全行に付いて絞り込みに使えなくなったのでやめた。古い行からは消す。
      row[iIssue] = dropNote_(row[iIssue], '下書き（要確認）');
      if (guess.issue) row[iIssue] = noteOnce_(row[iIssue], guess.issue);
      if (guess.issue) withIssue++;
    });

    sh.getRange(2, 1, values.length, width).setValues(values.map(row => row.map(safeSheetValue_)));
    resetShinsunCache_();
    logShinsun_(ss, '分類の下書き', SHINSUN.SHEETS.MIGRATION, filledKubun,
      '区分' + filledKubun + '件／確定名称' + filledName + '件／処理' + filledAction + '件');

    SpreadsheetApp.getUi().alert([
      '■ 分類の下書き',
      '',
      '　見た行：' + looked + '件（反映済のため触らなかった行：' + alreadyApplied + '件）',
      '',
      '　今回この実行で埋めた行',
      '　　区分：' + filledKubun + '件　／　確定名称：' + filledName + '件　／　処理：' + filledAction + '件',
      '　　すでに区分が入っていた行：' + keptKubun + '件（前回の下書きか、職員が入れた値。触っていません）',
      '',
      '　いまの区分の内訳',
      '　　信者様：' + byKubun['信者様'] + '件　／　会社：' + byKubun['会社'] + '件　／　空欄：' + undecided + '件',
      '',
      '　迷いのある行（要確認に理由を書きました）：' + withIssue + '件',
      '',
      'すべて下書きです。97_移行作業 の要確認に文が入っている行を見て直してください。',
      '',
      '直し終えたら applyShinsunMigration を実行すると 90/91/92 へ反映します。'
    ].join('\n'));
    return filledKubun;
  });
}

/**
 * 名称から個人か会社かを見立てる。あくまで下書きで、職員が上書きできる。
 *
 * 実資料（前札祈願者マスターR2）を見て、次の順で判定する。
 *   1. 法人格・業種の語があれば会社。「(株)〜災害防止協議会」のように
 *      肩書きの語も含む名前があるため、肩書きより先に見る。
 *   2. 肩書き・自治体名（久留米市長／衆議院議員／北九州市）は名義が個人。
 *      内札欄に個人名があればそれを確定名称にし、なければ区分を決めない。
 *   3. 法人格の語がなくても、内札欄に別の名前があれば団体とみなす。
 *      「テクノ／中園孝一」「松尾プロパン／松尾元伸」のような屋号が拾える。
 *      「小林康子／川瀬露秋」のような例外もあるため必ず要確認を付ける。
 *   4. どれにも当たらなければ個人。
 */
function guessShinsunKubun_(rawName, representative) {
  const name = clean_(rawName);
  const inner = clean_(representative);
  if (!name) {
    return { kubun: '', name: '', issue: '名称が空です。元資料で確認してください' };
  }

  const flat = key_(name);
  if (SHINSUN.COMPANY_WORDS.some(word => flat.indexOf(key_(word)) >= 0)) {
    return { kubun: '会社', name: name, issue: '' };
  }

  const isTitle = SHINSUN.TITLE_WORDS.some(word => flat.indexOf(key_(word)) >= 0);
  if (isTitle || SHINSUN.MUNICIPALITY.test(name)) {
    if (inner) {
      return {
        kubun: '信者様',
        name: inner,
        issue: '名称欄が「' + name + '」（肩書き・自治体名）です。' +
          '確定名称に内札欄の「' + inner + '」を入れました。確認してください'
      };
    }
    return {
      kubun: '',
      name: name,
      issue: '名称欄が「' + name + '」（肩書き・自治体名）です。個人か団体かを確認してください'
    };
  }

  if (inner && key_(inner) !== flat) {
    return {
      kubun: '会社',
      name: name,
      issue: '法人格の語はありませんが、内札欄に別の名前「' + inner + '」があるため団体としました。' +
        '個人であれば区分を信者様に直してください'
    };
  }

  return { kubun: '信者様', name: name, issue: '' };
}

/* ── 90/91/92 への反映 ────────────────────────────────── */

/**
 * 97_移行作業 の分類にしたがって 90/91/92 へ反映する。
 *
 *   登録する    … 90 または 91 へ新しい行を作り、その年度の 92 の過年度行も作る
 *   既存に統合  … 対象ID の既存行の空欄だけ埋め、92 の過年度行を作る
 *   履歴のみ    … 90/91 は増やさず 92 の過年度行だけ作る（読上げ名簿）
 *   対象外      … 何もしない
 *   未分類      … 何もしない。97 に残す
 *
 * 反映した行は 97 の 反映状態＝反映済、対象ID、反映日時 を書き戻す。
 * すでに反映済の行は読み飛ばすので、何度実行しても二重には入らない。
 * 元ファイルには一切書き込まない。
 */
function applyShinsunMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const sh = shinsunSheet_(ss, SHINSUN.SHEETS.MIGRATION);
    const person = shinsunSheet_(ss, SHINSUN.SHEETS.PERSON);
    const company = shinsunSheet_(ss, SHINSUN.SHEETS.COMPANY);
    const guide = ss.getSheetByName(SHINSUN.SHEETS.GUIDE);
    if (!guide) throw new Error('92_年度別案内対象 がありません。先に setupShinsunStage3 を実行してください。');

    const map = headerMap_(sh);
    const name = sh.getName();
    const idx = {};
    ['移行ID', '移行元', '元シート', '種別', '年度', '名称（生）', '代表者名（生）',
     '電話番号（生）', '郵便番号（生）', '住所（生）', '備考（生）', '生データ',
     '区分', '確定名称', '対象ID', '処理', '反映状態', '反映日時', '要確認']
      .forEach(header => { idx[header] = col_(map, header, name) - 1; });

    const last = lastRowByColumn_(sh, idx['移行ID'] + 1);
    if (last < 2) { SpreadsheetApp.getUi().alert('97_移行作業 に行がありません。'); return 0; }
    const width = sh.getLastColumn();
    const rows = sh.getRange(2, 1, last - 1, width).getValues();

    const index = buildMasterIndex_(person, company);
    const now = new Date();
    const count = { person: 0, company: 0, merged: 0, guide: 0, skipped: 0, unmatched: 0, noYear: 0 };
    const newPersons = [];
    const newCompanies = [];
    const newGuides = [];

    // 実行前の反映状態を控える。1周目で「反映済」に変えるため、
    // これを見ないと再実行のときに 92 の行が二重に増える。
    const wasApplied = rows.map(row => clean_(row[idx['反映状態']]) === '反映済');

    // この実行で 92 を作る行だけ印を付ける。
    const makeGuide = rows.map(() => false);

    const seq = {
      person: nextSerial_(person, '信者ID', SHINSUN.ID.PERSON),
      company: nextSerial_(company, '会社ID', SHINSUN.ID.COMPANY)
    };

    // 1周目：90/91 へ登録する行。読上げ名簿が新しいIDへ結べるよう先に済ませる。
    rows.forEach((row, i) => {
      if (!clean_(row[idx['移行ID']])) return;
      if (wasApplied[i]) return;
      const action = clean_(row[idx['処理']]);
      if (action !== '登録する' && action !== '既存に統合') return;

      const kubun = clean_(row[idx['区分']]);
      const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
      if (!kubun || !label) {
        row[idx['要確認']] = noteOnce_(row[idx['要確認']], '区分か確定名称が空欄です。反映していません');
        count.skipped++;
        return;
      }

      if (action === '既存に統合') {
        const targetId = clean_(row[idx['対象ID']]);
        if (!targetId) {
          row[idx['要確認']] = noteOnce_(row[idx['要確認']], '既存に統合ですが対象IDが空欄です');
          count.skipped++;
          return;
        }
        count.merged++;
        makeGuide[i] = true;
        row[idx['反映状態']] = '反映済';
        row[idx['反映日時']] = now;
        return;
      }

      const built = (kubun === '会社')
        ? buildCompanyRecord_(row, idx, newCompanies, index, seq)
        : buildPersonRecord_(row, idx, newPersons, index, seq);
      if (kubun === '会社') count.company++; else count.person++;

      row[idx['対象ID']] = built.id;
      row[idx['反映状態']] = '反映済';
      row[idx['反映日時']] = now;
      makeGuide[i] = true;
      if (built.issue) row[idx['要確認']] = noteOnce_(row[idx['要確認']], built.issue);
      indexAdd_(index, label, kubun, built.id, built.snapshot);
    });

    // 2周目：92 の過年度行。1周目で登録した行と、まだ反映していない「履歴のみ」の行。
    rows.forEach((row, i) => {
      if (!clean_(row[idx['移行ID']])) return;
      const action = clean_(row[idx['処理']]);
      const historyOnly = (action === '履歴のみ' && !wasApplied[i]);
      if (!makeGuide[i] && !historyOnly) return;

      const year = migrationYear_(row[idx['年度']], row[idx['元シート']]);
      if (!year) {
        row[idx['要確認']] = noteOnce_(row[idx['要確認']], '年度が決められません（元シート「' + clean_(row[idx['元シート']]) + '」）。97 の年度欄に R8 のように入れると 92 へ反映します');
        count.noYear++;
        if (historyOnly) return;   // 90/91 へは入れていないので反映済にしない
        return;
      }

      const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
      if (!label) { count.skipped++; return; }

      let kubun = clean_(row[idx['区分']]);
      let targetId = clean_(row[idx['対象ID']]);
      let issue = '';

      if (!targetId) {
        const hit = indexFind_(index, label, kubun);
        if (hit.id) { targetId = hit.id; kubun = kubun || hit.kubun; }
        else if (hit.many) { issue = '同じ名称が 90/91 に ' + hit.many + '件あり、対象IDを決められません'; count.unmatched++; }
        else { issue = '90/91 に同じ名称がありません。対象IDは空欄です'; count.unmatched++; }
      }

      const snapshot = index.byId[targetId] || {};
      newGuides.push({
        year: year,
        kubun: kubun || snapshot.kubun || '',
        targetId: targetId,
        route: migrationRoute_(row[idx['種別']]),
        label: label,
        postal: snapshot.postal || clean_(row[idx['郵便番号（生）']]),
        address: snapshot.address || clean_(row[idx['住所（生）']]),
        building: snapshot.building || '',
        honorific: snapshot.honorific || (kubun === '会社' ? '御中' : '様'),
        phone: snapshot.phone || clean_(row[idx['電話番号（生）']]),
        method: snapshot.method || '',
        order: yomiageOrder_(row[idx['生データ']]),
        migrationId: clean_(row[idx['移行ID']]),
        issue: issue
      });
      count.guide++;

      if (issue) row[idx['要確認']] = noteOnce_(row[idx['要確認']], issue);
      if (historyOnly) {
        row[idx['対象ID']] = targetId;
        row[idx['反映状態']] = '反映済';
        row[idx['反映日時']] = now;
      }
    });

    appendRows_(person, newPersons, SHINSUN.HEADERS.PERSON);
    appendRows_(company, newCompanies, SHINSUN.HEADERS.COMPANY);
    appendGuideRows_(guide, newGuides, now);
    sh.getRange(2, 1, rows.length, width).setValues(rows.map(row => row.map(safeSheetValue_)));

    resetShinsunCache_();
    const note = '信者様' + count.person + '／会社' + count.company + '／統合' + count.merged +
      '／92' + count.guide + '／対象ID未特定' + count.unmatched + '／年度不明' + count.noYear;
    logShinsun_(ss, '移行の反映', SHINSUN.SHEETS.GUIDE, count.guide, note);

    SpreadsheetApp.getUi().alert([
      '■ 90/91/92 への反映',
      '',
      '　90_信者様マスター へ登録：' + count.person + '件',
      '　91_会社マスター へ登録：' + count.company + '件',
      '　既存へ統合として印を付けた行：' + count.merged + '件',
      '　92_年度別案内対象 の過年度行：' + count.guide + '件',
      '',
      '　対象IDを決められなかった行：' + count.unmatched + '件（92 は作り、対象IDは空欄）',
      '　年度が決められず 92 に入れなかった行：' + count.noYear + '件',
      '　区分・確定名称が空で見送った行：' + count.skipped + '件',
      '',
      '92 の過年度行は案内状態「（過去実績）」で固定です。案内対象の再生成では作り直しません。',
      '反映した行は 97_移行作業 の反映状態が「反映済」になります。もう一度実行しても二重には入りません。'
    ].join('\n'));
    return count.guide;
  });
}

/** 90/91 を名称で引ける形に読む。同じ名称が複数あれば件数を持っておく。 */
function buildMasterIndex_(person, company) {
  const index = { byName: {}, byId: {} };

  const read = function (sh, kubun, idHeader, nameHeaders, fields) {
    const map = headerMap_(sh);
    const name = sh.getName();
    const idColumn = col_(map, idHeader, name);
    const last = lastRowByColumn_(sh, idColumn);
    if (last < 2) return;
    const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    values.forEach(row => {
      const id = clean_(row[idColumn - 1]);
      if (!id) return;
      const snapshot = { kubun: kubun };
      Object.keys(fields).forEach(key => {
        const column = map[clean_(fields[key])];
        snapshot[key] = column ? clean_(row[column - 1]) : '';
      });
      index.byId[id] = snapshot;
      nameHeaders.forEach(header => {
        const column = map[clean_(header)];
        if (!column) return;
        const label = key_(row[column - 1]);
        if (!label) return;
        if (!index.byName[label]) index.byName[label] = [];
        if (!index.byName[label].some(item => item.id === id)) {
          index.byName[label].push({ id: id, kubun: kubun });
        }
      });
    });
  };

  read(person, '信者様', '信者ID', ['氏名', '案内宛名'], {
    postal: '郵便番号', address: '住所', building: '建物名',
    phone: '電話番号', honorific: '敬称', method: '案内方法'
  });
  read(company, '会社', '拠点ID', ['会社・法人・団体名', '案内状の宛名'], {
    postal: '郵便番号', address: '住所', building: '建物名',
    phone: '電話番号', honorific: '敬称', method: '案内方法'
  });
  return index;
}

function indexAdd_(index, label, kubun, id, snapshot) {
  const flat = key_(label);
  if (!flat) return;
  if (!index.byName[flat]) index.byName[flat] = [];
  index.byName[flat].push({ id: id, kubun: kubun });
  index.byId[id] = Object.assign({ kubun: kubun }, snapshot || {});
}

/** 名称で1件だけ見つかったときだけ結ぶ。同名が複数あるときは結ばない。 */
function indexFind_(index, label, kubun) {
  const found = index.byName[key_(label)] || [];
  const narrowed = kubun ? found.filter(item => item.kubun === kubun) : found;
  const list = narrowed.length ? narrowed : found;
  if (list.length === 1) return { id: list[0].id, kubun: list[0].kubun, many: 0 };
  return { id: '', kubun: '', many: list.length };
}

function buildPersonRecord_(row, idx, pending, index, seq) {
  const id = SHINSUN.ID.PERSON.prefix + String(seq.person++).padStart(SHINSUN.ID.PERSON.digits, '0');
  const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
  const inner = clean_(row[idx['代表者名（生）']]);
  const rawName = clean_(row[idx['名称（生）']]);
  const notes = [];

  /*
   * 元資料の「前札名称」は外札に書く名前、「内札名称」は内札に書く名前。
   * どちらも案内の宛名とは一致しない。
   *   ・外札は「飯塚市　小鶴照美」のように自治体名と個人名で上げる方がいる。
   *   ・議員でも個人名で上げてほしい方がいる。
   *   ・内札は個人名だけのこともあれば、会社名や社長名のこともある。
   * そのまま「外札の記載名」「内札の記載名」へ移す。
   *
   * 案内宛名は別に作る。名称欄が「久留米市長」「衆議院議員」のような肩書きなら
   * 「肩書き　個人名」、「飯塚市」のような自治体名なら個人名だけにする。
   */
  const differs = rawName && key_(rawName) !== key_(label);
  const isTitle = differs &&
    SHINSUN.TITLE_WORDS.some(word => key_(rawName).indexOf(key_(word)) >= 0);
  const mailTo = isTitle ? (rawName + '　' + label) : label;

  // 前札の内札欄だけに書かれていた行（井町千春さまなど）は、外札ではなく内札の名前。
  // この文は 07_移行.gs の取り込みが書いたもので、職員が書いた文ではない。
  const innerOnly = clean_(row[idx['要確認']]).indexOf('内札欄だけの行') >= 0;
  const outerName = innerOnly ? '' : rawName;
  const innerName = innerOnly ? rawName : inner;

  const source = clean_(row[idx['備考（生）']]);
  if (source) notes.push(source);

  const duplicate = indexFind_(index, label, '信者様');
  const values = {
    '信者ID': id,
    '氏名': label,
    '郵便番号': clean_(row[idx['郵便番号（生）']]),
    '住所': clean_(row[idx['住所（生）']]),
    '電話番号': clean_(row[idx['電話番号（生）']]),
    '案内宛名': mailTo,
    '敬称': '様',
    '案内方法': '郵送',
    '外札の記載名': outerName,
    '内札の記載名': innerName,
    '翌年度案内状態': '継続',
    '職員メモ': notes.join('\n'),
    '登録日時': new Date()
  };
  pending.push(values);

  return {
    id: id,
    mailTo: mailTo,
    issue: duplicate.many ? '同じ名称が 90 に既にあります（' + duplicate.many + '件）。名寄せを確認してください' : '',
    snapshot: {
      postal: values['郵便番号'], address: values['住所'], building: '',
      phone: values['電話番号'], honorific: '様', method: '郵送'
    }
  };
}

function buildCompanyRecord_(row, idx, pending, index, seq) {
  const companyId = SHINSUN.ID.COMPANY.prefix + String(seq.company++).padStart(SHINSUN.ID.COMPANY.digits, '0');
  const siteId = companyId + '-' + String(1).padStart(SHINSUN.ID.SITE.digits, '0');
  const label = clean_(row[idx['確定名称']]) || clean_(row[idx['名称（生）']]);
  const inner = clean_(row[idx['代表者名（生）']]);
  const rawName = clean_(row[idx['名称（生）']]);
  const notes = [];
  const source = clean_(row[idx['備考（生）']]);
  if (source) notes.push(source);

  const duplicate = indexFind_(index, label, '会社');
  const values = {
    '会社ID': companyId,
    '拠点ID': siteId,
    '拠点区分': '本社',
    '会社・法人・団体名': label,
    '郵便番号': clean_(row[idx['郵便番号（生）']]),
    '住所': clean_(row[idx['住所（生）']]),
    '電話番号': clean_(row[idx['電話番号（生）']]),
    '案内状の宛名': label,
    '敬称': '御中',
    '外札の記載名': rawName,
    '内札の記載名': inner,
    '案内方法': '郵送',
    '翌年度案内状態': '継続',
    '職員メモ': notes.join('\n'),
    '登録日時': new Date()
  };
  pending.push(values);

  return {
    id: siteId,
    issue: duplicate.many ? '同じ名称が 91 に既にあります（' + duplicate.many + '件）。名寄せを確認してください' : '',
    snapshot: {
      postal: values['郵便番号'], address: values['住所'], building: '',
      phone: values['電話番号'], honorific: '御中', method: '郵送'
    }
  };
}

/** シートにある最大の通し番号の次を返す。以降はこの数を持ち回って増やす。 */
function nextSerial_(sh, idHeader, spec) {
  const next = nextSequentialId_(sh, idHeader, spec.prefix, spec.digits);
  return Number(next.slice(spec.prefix.length));
}

/** 移行元の年度表記を R7 の形にそろえる。西暦は 令和＝西暦−2018 で換算する。 */
function migrationYear_(yearValue, sheetName) {
  const raw = clean_(yearValue) || clean_(sheetName);
  if (!raw) return '';
  const western = raw.match(/^(20\d{2})$/);
  if (western) {
    const reiwa = Number(western[1]) - 2018;
    return reiwa >= 1 ? 'R' + reiwa : '';
  }
  const reiwa = raw.match(/^R(\d{1,2})$/i);
  if (reiwa) return 'R' + Number(reiwa[1]);
  return '';   // 「編集中」など、年度が決められないもの
}

function migrationRoute_(kind) {
  return /一般/.test(clean_(kind)) ? '新春一般' : '前札';
}

/** 生データに残した「読上げ順（仮）N」から番号を取り出す。ないときは空欄。 */
function yomiageOrder_(rawText) {
  // clean_ は NFKC 正規化で「（仮）」を「(仮)」に変えるため、括弧に依存しない形で拾う。
  const m = clean_(rawText).match(/読上げ順\D*(\d+)/);
  return m ? Number(m[1]) : '';
}

/** まとめて末尾へ足す。1行ずつ書かない。 */
function appendRows_(sh, pending, headers) {
  if (!pending.length) return;
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const idColumn = col_(map, headers[0], sh.getName());
  const start = Math.max(2, lastRowByColumn_(sh, idColumn) + 1);
  ensureSize_(sh, start + pending.length + 50, width);

  const body = pending.map(values => {
    const line = new Array(width).fill('');
    Object.keys(values).forEach(header => {
      const column = map[clean_(header)];
      if (column) line[column - 1] = safeSheetValue_(values[header]);
    });
    return line;
  });
  sh.getRange(start, 1, body.length, width).setValues(body);
}

/** 92 の過年度行を作る。年度ごとに通し番号を振る。 */
function appendGuideRows_(sh, pending, now) {
  if (!pending.length) return;
  const headers = SHINSUN.HEADERS.GUIDE;
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const idColumn = col_(map, '年度別案内ID', sh.getName());
  const start = Math.max(2, lastRowByColumn_(sh, idColumn) + 1);

  // 年度ごとの現在の最大番号を読む。
  const serial = {};
  if (start > 2) {
    sh.getRange(2, idColumn, start - 2, 1).getDisplayValues().forEach(row => {
      const m = clean_(row[0]).match(/^G-(R\d{2})-(\d+)$/);
      if (!m) return;
      serial[m[1]] = Math.max(serial[m[1]] || 0, Number(m[2]));
    });
  }

  ensureSize_(sh, start + pending.length + 50, width);
  const body = pending.map(item => {
    const yearKey = item.year.replace(/^R(\d+)$/, (all, n) => 'R' + String(Number(n)).padStart(2, '0'));
    serial[yearKey] = (serial[yearKey] || 0) + 1;
    const values = {
      '年度別案内ID': 'G-' + yearKey + '-' + String(serial[yearKey]).padStart(4, '0'),
      '年度': item.year,
      '対象区分': item.kubun,
      '対象ID': item.targetId,
      '案内ルート': item.route,
      '案内宛名': item.label,
      '郵便番号': item.postal,
      '住所': item.address,
      '建物名': item.building,
      '敬称': item.honorific,
      '電話番号': item.phone,
      '案内方法': item.method,
      '案内状の種類': '',
      '案内状態': '（過去実績）',
      '返答状態': '申込済',
      '前年度申込有無': '',
      '要確認': item.issue,
      '読上げ順': item.order,
      '移行元ID': item.migrationId,
      '作成日時': now
    };
    const line = new Array(width).fill('');
    headers.forEach(header => {
      const column = map[clean_(header)];
      if (column && header in values) line[column - 1] = safeSheetValue_(values[header]);
    });
    return line;
  });
  sh.getRange(start, 1, body.length, width).setValues(body);
}
