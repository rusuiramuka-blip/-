/**
 * 祈願・案内管理｜06_楽まる取込（段階6）
 *
 * 楽まる寺務（Microsoft Access）のバックアップから変換したスプレッドシートを、
 * 90_信者様マスター／91_会社マスター／92_年度別案内対象／
 * 93_申込台帳／94_祈願・御札明細 へ取り込む。
 *
 * 取り込み元は 99_設定 の「移行元_楽まる寺務DB」。3つのシートを持つ。
 *   申込     … 整理番号の単位。施主マスタの内容を結合済み
 *   祈願者   … 札の単位。願意・祈願料・外札名・内札名
 *   施主     … 祈願の申込に出てくる施主だけ
 *
 * 決めごと（お伺いした内容のとおり）
 *   1. すでに 90/91 に入っている433件は、楽まる寺務の値で上書きする。
 *      ただし元が空欄のときは上書きしない。入っている値を消さないため。
 *   2. 敬称が「様」でも会社名があれば 91_会社マスター へ入れる。
 *      家名が「僧」の方は、寺院名があっても 90 へ入れて名簿区分を僧侶にする。
 *   3. R8 の過去実績は作り直す。
 *
 * ただし案内停止（辞退・死亡・転居不明・廃業・重複）だけは上書きしない。
 * 楽まる寺務にはこの区別がなく、職員が付けた判断だけが持っている。
 * 消してしまうと、亡くなった方や辞退された方に案内状が出てしまう。
 *
 * 取り込むのは R5〜R8 の実績だけ。
 * R9（令和9年）の144件は楽まる寺務が翌年度へ繰り越した仮の行で、
 * 確定も入金もゼロなので申込としては入れない。R9 の案内対象は段階4で作る。
 * ただし金額が入っている行だけは、取りこぼさないよう要確認に出す。
 *
 * 90／91／92 は書き換える前に「_取込前」の控えを取る。元の内容は消えない。
 * 97_移行作業（古い紙資料からの取り込み）には一切触らない。
 *
 * 名前・住所・願意・札の記載名は label_ で読む。clean_ は NFKC 正規化で
 * 「（株）」を「(株)」に変えてしまうため、寺院の書き方が失われる。
 * 突き合わせに使う 施主CD・申込ID・整理番号・年度だけ clean_ を通す。
 *
 * 管理者が Apps Script エディタから実行する。
 */

/* ── 段階6の初期設定 ──────────────────────────────────── */

/**
 * 90/91 に列を足し、93/94 を作り、98 へ足りない値を足す。
 * 書き換える前に 90／91／92 の控えを取る。
 */
function setupShinsunStage6() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    [SHINSUN.SHEETS.PERSON, SHINSUN.SHEETS.COMPANY, SHINSUN.SHEETS.GUIDE]
      .forEach(name => backupShinsunSheet_(ss, name));

    buildMasterSheet_(ss);       // 申込状態「保留」を足す
    buildChoicesSheet_(ss);
    buildConfigSheet_(ss);       // 移行元_楽まる寺務DB を足す
    ensureStage6Config_(ss);     // 復元元_取込前コピー を足す
    resetShinsunCache_();
    buildPersonSheet_(ss);       // 所属・役職・施主CD の列が増える
    buildCompanySheet_(ss);      // 役職・施主CD の列が増える
    buildGuideSheet_(ss);
    buildApplicationSheet_(ss);
    buildDetailSheet_(ss);
    resetShinsunCache_();

    logShinsun_(ss, '初期設定（段階6）', SHINSUN.STAGE6_SHEETS.join('、'), 2, SHINSUN.VERSION);
    toast_(ss, '93_申込台帳 と 94_祈願・御札明細 を作りました。次に importRakumaruAll を実行してください。', 12);
    return SHINSUN.STAGE6_SHEETS;
  });
}

/**
 * 段階6で使う設定を 99_設定 へ足す。既にある値は上書きしない。
 * 00_定数 の CONFIG_SEED ではなくここで足しているのは、
 * あとから決めた復旧用の設定だから。00 を貼り替えずに増やせるようにしてある。
 */
function ensureStage6Config_(ss) {
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.CONFIG);
  const items = [
    ['復元元_取込前コピー', '',
     '版の履歴から作った取り込み前のコピーのID。restoreShinsunStopReasons が'
     + 'そのファイルの 90/91 を読む。空欄なら「_取込前」の控えを読む']
  ];
  items.forEach(item => {
    if (findConfigRow_(sh, item[0])) return;
    const row = Math.max(2, lastRowByColumn_(sh, 1) + 1);
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), row - sh.getMaxRows());
    sh.getRange(row, 1, 1, 3).setValues([item]);
  });
  resetShinsunConfigCache_();
}

/**
 * シートの控えを取る。「◯◯_取込前」という名前で複製する。
 *
 * **既に控えがあれば作り直さない。** 控えは「取り込む前の姿」を残すためのもので、
 * 取り込んだあとにもう一度取ると、上書き済みの内容で控えを潰してしまう。
 * 最初の版はここで作り直しており、実運用で職員が付けた案内停止17件が
 * 取り返せなくなった。控えは最初の1回だけ取り、あとは触らない。
 *
 * 取り直したいときは、シートを手で消してから実行する。
 */
function backupShinsunSheet_(ss, name) {
  const source = ss.getSheetByName(name);
  if (!source) return '';
  const backupName = name + SHINSUN.BACKUP_SUFFIX;
  if (ss.getSheetByName(backupName)) return backupName;   // 既にある控えは潰さない
  const copy = source.copyTo(ss);
  copy.setName(backupName);
  // 控えは入力規則も条件付き書式も要らない。見るだけ。
  copy.getRange(1, 1, copy.getMaxRows(), copy.getMaxColumns()).clearDataValidations();
  copy.setConditionalFormatRules([]);
  if (!copy.isSheetHidden()) copy.hideSheet();
  return backupName;
}

/** 93_申込台帳。1申込1行。 */
function buildApplicationSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.APPLICATION);
  const headers = SHINSUN.HEADERS.APPLICATION;
  ensureSize_(sh, 4000, headers.length);
  writeHeaders_(sh, headers, 1, '#3f6b4f');
  // 列を足したときに古い入力規則が別の列へ残らないよう、いったん全部消す。
  sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getMaxColumns()).clearDataValidations();

  const map = headerMap_(sh);
  const rows = sh.getMaxRows() - 1;
  const name = sh.getName();
  ['郵便番号', '電話番号'].forEach(header => {
    const column = map[clean_(header)];
    if (column) sh.getRange(2, column, rows, 1).setNumberFormat('@');
  });
  ['申込日', '参列日', '入金日', '登録日時'].forEach(header => {
    const column = map[clean_(header)];
    if (column) sh.getRange(2, column, rows, 1).setNumberFormat('yyyy/mm/dd');
  });
  ['金額合計', '入金額'].forEach(header => {
    const column = map[clean_(header)];
    if (column) sh.getRange(2, column, rows, 1).setNumberFormat('#,##0');
  });
  ['職員メモ', '要確認'].forEach(header => {
    const column = map[clean_(header)];
    if (column) sh.getRange(2, column, rows, 1).setWrap(true).setVerticalAlignment('top');
  });

  bindGuideValidation_(ss, sh, '行事', '行事', null);
  bindGuideValidation_(ss, sh, '案内ルート', '案内ルート', null);
  bindGuideValidation_(ss, sh, '対象区分', '（なし）', ['信者様', '会社']);
  bindGuideValidation_(ss, sh, '申込経路', '申込経路', null);
  bindGuideValidation_(ss, sh, '申込状態', '申込状態', null);
  bindGuideValidation_(ss, sh, '参列区分', '参列区分', null);
  bindGuideValidation_(ss, sh, '入金状態', '入金状態', null);
  bindGuideValidation_(ss, sh, '受渡方法', '受渡方法', null);
  bindGuideValidation_(ss, sh, '領収書要否', '要否', null);

  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  sh.getRange(1, col_(map, '申込者名', name)).setNote(
    '作成時点のコピーです。90/91 を直しても、過去年度のこの行は変わりません。'
  );
  sh.getRange(1, col_(map, '楽まる申込ID', name)).setNote(
    '楽まる寺務の 申込ID。取り込みの目印。同じ値の行は二重に作りません。'
  );
  return sh;
}

/** 94_祈願・御札明細。1祈願者1行。前札は外札と内札の両方を1行に持つ。 */
function buildDetailSheet_(ss) {
  const sh = sheetOf_(ss, SHINSUN.SHEETS.DETAIL);
  const headers = SHINSUN.HEADERS.DETAIL;
  ensureSize_(sh, 4000, headers.length);
  writeHeaders_(sh, headers, 1, '#5b3a29');
  sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getMaxColumns()).clearDataValidations();

  const map = headerMap_(sh);
  const rows = sh.getMaxRows() - 1;
  const name = sh.getName();
  ['郵便番号', '電話番号'].forEach(header => {
    const column = map[clean_(header)];
    if (column) sh.getRange(2, column, rows, 1).setNumberFormat('@');
  });
  const amount = map[clean_('金額')];
  if (amount) sh.getRange(2, amount, rows, 1).setNumberFormat('#,##0');
  const stamp = map[clean_('登録日時')];
  if (stamp) sh.getRange(2, stamp, rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  ['願意', '住所', '職員メモ', '要確認',
   '外札の記載名', '内札の記載名'].forEach(header => {
    const column = map[clean_(header)];
    if (column) sh.getRange(2, column, rows, 1).setWrap(true).setVerticalAlignment('top');
  });

  bindGuideValidation_(ss, sh, '行事', '行事', null);
  bindGuideValidation_(ss, sh, '案内ルート', '案内ルート', null);
  bindGuideValidation_(ss, sh, '祈願札区分', '祈願札区分', null);
  bindGuideValidation_(ss, sh, '準備状態', '準備状態', null);

  /*
   * 願意は自由入力。実データに255種類あり、98_マスター の38件に収まらない。
   * 「古賀家先祖」「部員の健康」のような一度きりの願意が普通にある。
   * 候補は出すが、ほかの値も入れられるようにする（setAllowInvalid(true)）。
   */
  const ganiColumn = map[clean_('願意')];
  const ganiRange = choiceRange_(ss, '願意');
  if (ganiColumn && ganiRange) {
    sh.getRange(2, ganiColumn, rows, 1).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInRange(ganiRange, true)
        .setAllowInvalid(true)
        .setHelpText('98_マスター の願意が候補です。ここにない願意もそのまま入れられます。')
        .build()
    );
  }

  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  sh.getRange(1, col_(map, '外札の記載名', name)).setNote(
    '前札の外札に書く名前。自治体名や会社の略称＋個人名になることがあります。'
  );
  sh.getRange(1, col_(map, '内札の記載名', name)).setNote(
    '内札に書く名前。正式名称＋役職＋個人名になることがあります。空欄なら外札と同じ。'
  );
  sh.getRange(1, col_(map, '願意', name)).setNote(
    '自由入力です。98_マスター にない願意もそのまま入れられます。'
  );
  return sh;
}


/* ── 楽まる寺務DBを開く ───────────────────────────────── */

function openRakumaruDb_(ss) {
  const config = getShinsunConfig_(ss);
  const id = clean_(configValue_(config, '移行元_楽まる寺務DB'));
  if (!id) {
    throw new Error('99_設定 の「移行元_楽まる寺務DB」にスプレッドシートIDを入れてください。');
  }
  try {
    return SpreadsheetApp.openById(id);
  } catch (error) {
    throw new Error('移行元_楽まる寺務DB のスプレッドシートを開けません：' + id +
      '（IDが正しいか、閲覧できるかを確認してください）');
  }
}

/**
 * 取り込み元のシートを1回で読む。
 * 見出し名から列を引く at() を付けて返す。
 */
function readDbSheet_(book, sheetName) {
  const sh = book.getSheetByName(sheetName);
  if (!sh) {
    throw new Error('楽まる寺務DB に「' + sheetName + '」のシートがありません。');
  }
  const last = sh.getLastRow();
  const width = sh.getLastColumn();
  if (last < 2 || width < 1) return { rows: [], at: () => -1 };
  const values = sh.getRange(1, 1, last, width).getValues();
  const map = {};
  values[0].forEach((value, index) => {
    const header = clean_(value);
    if (header && map[header] === undefined) map[header] = index;
  });
  const at = function (header) {
    const index = map[clean_(header)];
    if (index === undefined) {
      throw new Error('楽まる寺務DB の「' + sheetName + '」に見出し「' + header + '」がありません。');
    }
    return index;
  };
  return { rows: values.slice(1), at: at, has: h => map[clean_(h)] !== undefined };
}

/** 取り込む年度かどうか。R9 は楽まる寺務の繰越なので入れない。 */
function rakumaruYearWanted_(yearLabel) {
  const n = reiwaNumber_(yearLabel);
  return n >= 5 && n <= 8;
}


/* ── 施主 → 90／91 ────────────────────────────────────── */

/**
 * 施主491件を 90_信者様マスター と 91_会社マスター へ入れ直す。
 *
 *   家名が「僧」        → 90（名簿区分＝僧侶）。寺院名は「所属」へ
 *   会社名がある        → 91
 *   会社名がない        → 90（名簿区分＝一般）
 *
 * 90/91 は中身を入れ替える。実行前に「_取込前」の控えができている。
 * 空欄では上書きしない（入っている値を消さないため）。
 */
function importRakumaruOwners() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const book = openRakumaruDb_(ss);
    const src = readDbSheet_(book, SHINSUN.RAKUMARU_DB.OWNER);
    const at = src.at;

    const person = shinsunSheet_(ss, SHINSUN.SHEETS.PERSON);
    const company = shinsunSheet_(ss, SHINSUN.SHEETS.COMPANY);
    backupShinsunSheet_(ss, SHINSUN.SHEETS.PERSON);
    backupShinsunSheet_(ss, SHINSUN.SHEETS.COMPANY);

    // 上書きしても消さないために、いまの値を名前で引けるようにしておく。
    const before = { person: readMasterByName_(person, ['氏名', '案内宛名']),
                     company: readMasterByName_(company, ['会社・法人・団体名', '案内状の宛名']) };

    const honorifics = masterValues_(ss, '敬称');
    const rosters = masterValues_(ss, '名簿区分');
    const methods = masterValues_(ss, '案内方法');
    const states = masterValues_(ss, '翌年度案内状態');
    const now = new Date();

    const people = [];
    const companies = [];
    const report = { priest: 0, personal: 0, company: 0, skipped: 0, issues: 0,
                     kept: 0, stopped: 0 };

    src.rows.forEach(row => {
      const cd = clean_(row[at('施主CD')]);
      if (!cd || cd === '0') { report.skipped += 1; return; }
      const house = label_(row[at('家名')]);
      const owner = label_(row[at('施主名')]);
      const corp = label_(row[at('会社名')]);
      const title = label_(row[at('役職')]);
      const rawHonorific = label_(row[at('敬称')]);
      const priest = house === SHINSUN.RAKUMARU_DB.PRIEST_HOUSE;
      const notes = [];
      const issues = [];

      const shared = {
        postal: label_(row[at('郵便番号')]),
        address: label_(row[at('住所1')]),
        building: label_(row[at('住所2')]),
        phone: label_(row[at('電話番号')]),
        phone2: label_(row[at('電話番号2')]),
        fax: label_(row[at('FAX番号')]),
        mobile: label_(row[at('携帯電話')]),
        mail: label_(row[at('メールアドレス')]),
        kana: label_(row[at('施主フリガナ')]),
        corpKana: label_(row[at('会社名フリガナ')]),
        count: Number(row[at('祈願の申込件数')]) || 0
      };
      if (shared.mobile) notes.push('携帯：' + shared.mobile);
      if (label_(row[at('連名1')])) notes.push('連名1：' + label_(row[at('連名1')]));
      if (label_(row[at('連名2')])) notes.push('連名2：' + label_(row[at('連名2')]));
      if (label_(row[at('対応')])) notes.push('楽まる寺務の対応欄：' + label_(row[at('対応')]));

      // 案内停止は職員の判断。楽まる寺務は持っていないので、前の値をそのまま使う。
      const stop = function (label) {
        const kept = rememberedStop_(before, label);
        if (!kept) return { state: pickAllowed_(states, '継続', '継続'), reason: '' };
        report.stopped += 1;
        return { state: pickAllowed_(states, kept.state, '継続'), reason: kept.reason };
      };

      if (priest || !corp) {
        // ── 90_信者様マスター ──
        const label = owner || house || corp;
        if (!label) issues.push('名前が空欄です。楽まる寺務で確認してください');
        if (priest && corp) notes.push('寺院：' + corp);
        /*
         * 敬称。楽まる寺務が空欄のときは、前に 90 へ入っていた値を使う。
         * それもなければ、名前に「猊下」などが含まれていれば「なし」、ほかは「様」。
         * 「岸田 照泰貫首猊下 様」のように敬称が重ならないようにする。
         */
        const wanted = rawHonorific
          || rememberedValue_(before.person, label, '敬称')
          || (SHINSUN.HONORIFIC_IN_NAME.test(label) ? 'なし' : '様');
        const honorific = pickAllowed_(honorifics, wanted, '様');
        if (!rawHonorific) {
          issues.push('楽まる寺務の敬称が空欄です。「' + honorific + '」にしました');
        }
        if (key_(wanted) !== key_(honorific)) {
          issues.push('敬称「' + wanted + '」が 98_マスター にないため「' + honorific + '」にしました');
        }
        /*
         * 案内宛名は役職を前に付ける。「久留米市長　原口 新五 様」の形。
         * 氏名の欄は名前だけにしておき、役職は別の欄にも残す。
         * 僧侶の「主監」なども同じ扱いになる。
         */
        const mailTo = title ? (title + '　' + label) : label;
        const keep = stop(label);
        people.push({
          '氏名': label,
          'フリガナ': shared.kana,
          '名簿区分': pickAllowed_(rosters, priest ? '僧侶' : '一般', ''),
          '郵便番号': shared.postal,
          '住所': shared.address,
          '建物名': shared.building,
          '電話番号': shared.phone,
          '電話番号2': shared.phone2,
          'メールアドレス': shared.mail,
          '案内宛名': mailTo,
          '敬称': honorific,
          '案内方法': pickAllowed_(methods, '郵送', '郵送'),
          '翌年度案内状態': keep.state,
          '案内停止理由': keep.reason,
          '所属': priest ? corp : '',
          '役職': title,
          '施主CD': cd,
          '職員メモ': notes.join('\n'),
          '登録日時': now,
          _issue: issues.join('\n')
        });
        if (priest) report.priest += 1; else report.personal += 1;
      } else {
        // ── 91_会社マスター ──
        // 敬称が「様」なら宛名は「会社名　役職　個人名」。「御中」なら会社名だけ。
        const wanted = rawHonorific
          || rememberedValue_(before.company, corp, '敬称')
          || (owner ? '様' : '御中');
        const honorific = pickAllowed_(honorifics, wanted, owner ? '様' : '御中');
        if (!rawHonorific) {
          issues.push('楽まる寺務の敬称が空欄です。「' + honorific + '」にしました');
        }
        if (key_(wanted) !== key_(honorific)) {
          issues.push('敬称「' + wanted + '」が 98_マスター にないため「' + honorific + '」にしました');
        }
        const mailTo = (key_(honorific) === key_('御中') || !owner)
          ? corp
          : [corp, title, owner].filter(Boolean).join('　');
        const keep = stop(corp);
        companies.push({
          '拠点区分': '本社',
          '会社・法人・団体名': corp,
          'フリガナ': shared.corpKana,
          '代表者名': owner,
          '役職': title,
          '郵便番号': shared.postal,
          '住所': shared.address,
          '建物名': shared.building,
          '電話番号': shared.phone,
          'FAX': shared.fax,
          'メールアドレス': shared.mail,
          '案内状の宛名': mailTo,
          '敬称': honorific,
          '請求書の宛名': corp,
          '領収書の宛名': corp,
          '案内方法': pickAllowed_(methods, '郵送', '郵送'),
          '翌年度案内状態': keep.state,
          '案内停止理由': keep.reason,
          '施主CD': cd,
          '職員メモ': notes.join('\n'),
          '登録日時': now,
          _issue: issues.join('\n')
        });
        report.company += 1;
      }
      if (issues.length) report.issues += 1;
    });

    // 空欄では上書きしない。前に入っていた値を引き継ぐ。
    report.kept += carryForward_(people, before.person, '氏名',
      ['フリガナ', '郵便番号', '住所', '建物名', '電話番号', '電話番号2',
       'メールアドレス', '世帯ID', '年間法会の人物ID', '外札の記載名', '内札の記載名']);
    report.kept += carryForward_(companies, before.company, '会社・法人・団体名',
      ['フリガナ', '郵便番号', '住所', '建物名', '電話番号', 'FAX', 'メールアドレス',
       '担当部署', '担当者名', '拠点区分', '外札の記載名', '内札の記載名']);

    writeMasterSheet_(person, SHINSUN.HEADERS.PERSON, '信者ID',
      SHINSUN.ID.PERSON, people);
    writeCompanySheet_(company, companies);

    resetShinsunCache_();
    logShinsun_(ss, '楽まる寺務DB取込（施主）',
      SHINSUN.SHEETS.PERSON + '／' + SHINSUN.SHEETS.COMPANY,
      people.length + companies.length, '');
    showOwnerReport_(ss, report, people.length, companies.length);
    return people.length + companies.length;
  });
}

/** いまのマスターを名前で引ける形に読む。上書きで値を消さないために使う。 */
function readMasterByName_(sh, nameHeaders) {
  const map = headerMap_(sh);
  const name = sh.getName();
  const idColumn = map[clean_(nameHeaders[0])] ? 1 : 1;
  const last = lastRowByColumn_(sh, idColumn);
  const bag = {};
  if (last < 2) return bag;
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(clean_);
  const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  values.forEach(row => {
    const record = {};
    headers.forEach((header, i) => { if (header) record[header] = row[i]; });
    nameHeaders.forEach(header => {
      const label = key_(record[clean_(header)]);
      if (label && !bag[label]) bag[label] = record;
    });
  });
  return bag;
}

/**
 * 前の 90/91 から案内停止を引く。
 * 取り込みで信者様と会社の分け方が変わることがあるので、両方から探す。
 * 「継続」と空欄は停止ではないので返さない。
 */
function rememberedStop_(before, label) {
  const flat = key_(label);
  if (!flat) return null;
  const record = before.person[flat] || before.company[flat];
  if (!record) return null;
  const state = label_(record[clean_('翌年度案内状態')]);
  if (!state || key_(state) === key_('継続')) return null;
  return { state: state, reason: label_(record[clean_('案内停止理由')]) };
}

/** 名前で引いて、前に入っていた値を返す。見つからなければ空。 */
function rememberedValue_(bag, label, header) {
  const record = bag[key_(label)];
  if (!record) return '';
  return label_(record[clean_(header)]);
}

/** 楽まる寺務が空欄の項目に、前に入っていた値を戻す。何件戻したかを返す。 */
function carryForward_(records, bag, nameHeader, headers) {
  let kept = 0;
  records.forEach(record => {
    const previous = bag[key_(record[nameHeader])];
    if (!previous) return;
    headers.forEach(header => {
      if (clean_(record[header])) return;
      const value = previous[clean_(header)];
      if (value === undefined || clean_(value) === '') return;
      record[header] = value;
      kept += 1;
    });
  });
  return kept;
}

/** 90 の中身を入れ替える。IDは頭から振り直す。 */
function writeMasterSheet_(sh, headers, idHeader, spec, records) {
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const last = sh.getMaxRows();
  if (last >= 2) sh.getRange(2, 1, last - 1, width).clearContent();
  ensureSize_(sh, records.length + 50, width);
  if (!records.length) return;

  const body = records.map((record, i) => {
    const line = new Array(width).fill('');
    record[idHeader] = spec.prefix + String(i + 1).padStart(spec.digits, '0');
    record['要確認'] = record._issue || '';
    headers.forEach(header => {
      const column = map[clean_(header)];
      if (column && header in record) line[column - 1] = safeSheetValue_(record[header]);
    });
    // 要確認の列が 90/91 にないときは職員メモへ回す。
    if (!map[clean_('要確認')] && record._issue) {
      const memo = map[clean_('職員メモ')];
      if (memo) line[memo - 1] = safeSheetValue_(noteOnce_(record['職員メモ'], record._issue));
    }
    return line;
  });
  sh.getRange(2, 1, body.length, width).setValues(body);
}

/** 91 の中身を入れ替える。会社IDと拠点IDを振り直す。 */
function writeCompanySheet_(sh, records) {
  const headers = SHINSUN.HEADERS.COMPANY;
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const last = sh.getMaxRows();
  if (last >= 2) sh.getRange(2, 1, last - 1, width).clearContent();
  ensureSize_(sh, records.length + 50, width);
  if (!records.length) return;

  const body = records.map((record, i) => {
    const companyId = SHINSUN.ID.COMPANY.prefix +
      String(i + 1).padStart(SHINSUN.ID.COMPANY.digits, '0');
    record['会社ID'] = companyId;
    record['拠点ID'] = companyId + '-' + String(1).padStart(SHINSUN.ID.SITE.digits, '0');
    const line = new Array(width).fill('');
    headers.forEach(header => {
      const column = map[clean_(header)];
      if (column && header in record) line[column - 1] = safeSheetValue_(record[header]);
    });
    if (record._issue) {
      const memo = map[clean_('職員メモ')];
      if (memo) line[memo - 1] = safeSheetValue_(noteOnce_(record['職員メモ'], record._issue));
    }
    return line;
  });
  sh.getRange(2, 1, body.length, width).setValues(body);
}

function showOwnerReport_(ss, report, people, companies) {
  const lines = [];
  lines.push('■ 楽まる寺務DB → 90／91');
  lines.push('　90_信者様マスター：' + people + '件（僧侶 ' + report.priest +
    '／一般 ' + report.personal + '）');
  lines.push('　91_会社マスター：' + companies + '件');
  lines.push('');
  lines.push('　案内停止（辞退・死亡など）を引き継いだ行：' + report.stopped);
  lines.push('　施主CDが空の行（入れませんでした）：' + report.skipped);
  lines.push('　要確認を付けた行：' + report.issues);
  lines.push('　楽まる寺務が空欄で、前の値を残した項目：' + report.kept);
  lines.push('');
  lines.push('※ 書き換える前の内容は「90_信者様マスター_取込前」「91_会社マスター_取込前」に');
  lines.push('　控えてあります（非表示）。');
  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('施主の取り込み', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}


/* ── 申込 → 93_申込台帳 と 92_年度別案内対象 ────────────── */

/**
 * 申込（R5〜R8）を 93_申込台帳 へ入れ、あわせて 92 の過去実績を作り直す。
 *
 * 92 は R5〜R9 の行を消してから入れ直す。
 * R2・R3 など楽まる寺務にない年度の行（古い紙資料から入れたもの）は残す。
 * R9 の案内対象は段階4（generateShinsunGuideTargets）で作り直す。
 */
function importRakumaruApplications() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const book = openRakumaruDb_(ss);
    const src = readDbSheet_(book, SHINSUN.RAKUMARU_DB.APPLICATION);
    const at = src.at;
    const targets = readOwnerIndex_(ss);

    const allowed = {
      events: masterValues_(ss, '行事'),
      routes: masterValues_(ss, '案内ルート'),
      states: masterValues_(ss, '案内状態'),
      answers: masterValues_(ss, '返答状態'),
      apply: masterValues_(ss, '申込状態'),
      pay: masterValues_(ss, '入金状態'),
      attend: masterValues_(ss, '参列区分'),
      hand: masterValues_(ss, '受渡方法'),
      need: masterValues_(ss, '要否'),
      honorifics: masterValues_(ss, '敬称'),
      methods: masterValues_(ss, '案内方法')
    };

    const now = new Date();
    const apps = [];
    const guides = [];
    const report = { total: 0, skippedYear: 0, noOwner: 0, issues: 0,
                     carried: 0, carriedPaid: 0, byYear: {} };

    src.rows.forEach(row => {
      const yearLabel = clean_(row[at('年度')]);
      const appId = clean_(row[at('申込ID')]);
      if (!appId) return;
      if (!rakumaruYearWanted_(yearLabel)) {
        report.skippedYear += 1;
        // R9 は繰越の仮行。ただし金額が入っている行は取りこぼさないよう数える。
        if (reiwaNumber_(yearLabel) === 9) {
          report.carried += 1;
          if (Number(row[at('金額計')]) > 0) report.carriedPaid += 1;
        }
        return;
      }

      const cd = clean_(row[at('施主CD')]);
      const owner = targets[cd] || null;
      if (!owner) report.noOwner += 1;

      const event = pickAllowed_(allowed.events, clean_(row[at('行事')]), '');
      const route = pickAllowed_(allowed.routes, clean_(row[at('案内ルート')]), '');
      const total = Number(row[at('金額計')]) || 0;
      const paid = Number(row[at('入金額')]) || 0;
      const label = owner ? owner.label
        : (label_(row[at('施主_会社名')]) || label_(row[at('施主_施主名')])
           || label_(row[at('施主_家名')]));

      const issues = [];
      if (!owner) {
        issues.push('施主CD「' + (cd || '空欄') + '」が 90/91 にありません。'
          + '楽まる寺務で申込者を確認してください');
      }
      if (!event || !route) issues.push('行事か案内ルートを 98_マスター から決められませんでした');

      const declined = row[at('辞退')] === true;
      const held = row[at('保留')] === true;
      const fixed = row[at('確定')] === true;
      const applyState = declined ? '取消' : (fixed ? '確定' : (held ? '保留' : '受付中'));

      let payState = '未入金';
      if (paid > 0 && total > 0 && paid >= total) payState = paid > total ? '過入金' : '入金済';
      else if (paid > 0) payState = total > 0 ? '一部入金' : '入金済';

      apps.push({
        year: yearLabel, event: event, route: route,
        kubun: owner ? owner.kubun : '', targetId: owner ? owner.id : '',
        label: label,
        applyDate: row[at('作成日時')],
        applyState: pickAllowed_(allowed.apply, applyState, '受付中'),
        attend: row[at('参列')] === true ? pickAllowed_(allowed.attend, '参列', '') : '',
        attendDate: row[at('参列日')],
        attendTime: rakumaruTime_(row[at('参列時')], row[at('参列分')]),
        people: Number(row[at('参加人数')]) || '',
        total: total || '',
        payState: pickAllowed_(allowed.pay, payState, ''),
        payDate: row[at('入金日')],
        paid: paid || '',
        goma: row[at('護摩')] === true,
        miki: row[at('神酒渡し')] === true,
        sake: Number(row[at('酒奉納数')]) || '',
        omamori: row[at('お守取置')] === true,
        flag: row[at('安全旗渡し')] === true,
        hand: row[at('送付済み')] === true ? pickAllowed_(allowed.hand, '郵送', '') : '',
        receipt: pickAllowed_(allowed.need,
          row[at('領収書有無')] === true ? '要' : '不要', ''),
        receiptTo: label_(row[at('領収書宛名')]),
        memo: label_(row[at('備考')]),
        issue: issues.join('\n'),
        serial: clean_(row[at('整理番号')]),
        appId: appId,
        cd: cd,
        owner: owner,
        declined: declined
      });
      report.total += 1;
      report.byYear[yearLabel] = (report.byYear[yearLabel] || 0) + 1;
      if (issues.length) report.issues += 1;
    });

    // 92 は R5〜R9 の行を消してから入れ直す。それ以外の年度は残す。
    const removed = clearGuideYears_(ss, 5, 9);

    // 93 と 92 に番号を振る。年度ごとの通し番号。
    const serial = {};
    const guideSerial = {};
    apps.sort((a, b) => {
      if (a.year !== b.year) return a.year < b.year ? -1 : 1;
      if (a.route !== b.route) return a.route < b.route ? -1 : 1;
      return Number(a.serial) - Number(b.serial);
    });
    apps.forEach(item => {
      const key = item.year;
      serial[key] = (serial[key] || 0) + 1;
      item.id = 'A-' + key + '-' + String(serial[key]).padStart(4, '0');

      const yearKey = key.replace(/^R(\d+)$/, (all, n) => 'R' + String(Number(n)).padStart(2, '0'));
      guideSerial[yearKey] = (guideSerial[yearKey] || 0) + 1;
      item.guideId = 'G-' + yearKey + '-' + String(guideSerial[yearKey]).padStart(4, '0');

      const o = item.owner || {};
      guides.push({
        '年度別案内ID': item.guideId, '年度': item.year, '行事': item.event,
        '対象区分': item.kubun, '対象ID': item.targetId, '案内ルート': item.route,
        '案内宛名': item.label, '郵便番号': o.postal || '', '住所': o.address || '',
        '建物名': o.building || '',
        '敬称': pickAllowed_(allowed.honorifics, o.honorific || '', ''),
        '電話番号': o.phone || '',
        '案内方法': pickAllowed_(allowed.methods, o.method || '郵送', '郵送'),
        '案内状の種類': '',
        '案内状態': pickAllowed_(allowed.states, '（過去実績）', ''),
        '返答状態': pickAllowed_(allowed.answers, item.declined ? '辞退' : '申込済', ''),
        '前年度申込有無': '', '連続未申込年数': '',
        '要確認': item.issue,
        '世帯ID': '', '集約先案内ID': '', '職員メモ': '',
        '読上げ順': '', '移行元ID': 'RAKDB-' + item.appId,
        '作成日時': now
      });
    });

    writeApplicationRows_(ss, apps, now);
    appendByHeader_(shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE),
      SHINSUN.HEADERS.GUIDE, '年度別案内ID', guides);

    resetShinsunCache_();
    logShinsun_(ss, '楽まる寺務DB取込（申込）', SHINSUN.SHEETS.APPLICATION, apps.length, '');
    showApplicationReport_(ss, report, apps.length, removed);
    return apps.length;
  });
}

/** 90/91 を 施主CD で引ける形に読む。 */
function readOwnerIndex_(ss) {
  const index = {};
  const read = function (sheetName, kubun, idHeader, nameHeaders) {
    const sh = shinsunSheet_(ss, sheetName);
    const map = headerMap_(sh);
    const cdColumn = map[clean_('施主CD')];
    if (!cdColumn) {
      throw new Error('シート「' + sheetName + '」に「施主CD」の列がありません。'
        + '先に setupShinsunStage6 を実行してください。');
    }
    const idColumn = col_(map, idHeader, sheetName);
    const last = lastRowByColumn_(sh, idColumn);
    if (last < 2) return;
    const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    // 宛名・住所は寺院の書き方のまま持ち回る。label_ は NFKC 正規化を通さない。
    const pick = function (row, header) {
      const column = map[clean_(header)];
      return column ? label_(row[column - 1]) : '';
    };
    values.forEach(row => {
      const cd = clean_(row[cdColumn - 1]);
      if (!cd) return;
      let label = '';
      for (let i = 0; i < nameHeaders.length && !label; i++) label = pick(row, nameHeaders[i]);
      index[cd] = {
        kubun: kubun, id: clean_(row[idColumn - 1]), label: label,
        postal: pick(row, '郵便番号'), address: pick(row, '住所'),
        building: pick(row, '建物名'), phone: pick(row, '電話番号'),
        honorific: pick(row, '敬称'), method: pick(row, '案内方法')
      };
    });
  };
  read(SHINSUN.SHEETS.PERSON, '信者様', '信者ID', ['案内宛名', '氏名']);
  read(SHINSUN.SHEETS.COMPANY, '会社', '拠点ID', ['案内状の宛名', '会社・法人・団体名']);
  return index;
}

/** 92 から、指定した令和の年の範囲の行を消す。消した件数を返す。 */
function clearGuideYears_(ss, fromYear, toYear) {
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE);
  const map = headerMap_(sh);
  const name = sh.getName();
  const idColumn = col_(map, '年度別案内ID', name);
  const yearColumn = col_(map, '年度', name);
  const last = lastRowByColumn_(sh, idColumn);
  if (last < 2) return 0;

  const width = sh.getLastColumn();
  const values = sh.getRange(2, 1, last - 1, width).getValues();
  const keep = values.filter(row => {
    const n = reiwaNumber_(row[yearColumn - 1]);
    return !(n >= fromYear && n <= toYear);
  });
  const removed = values.length - keep.length;
  if (!removed) return 0;

  sh.getRange(2, 1, values.length, width).clearContent();
  if (keep.length) sh.getRange(2, 1, keep.length, width).setValues(keep);
  return removed;
}

/** 楽まる寺務の 参列時・参列分 から「9:30」を作る。0時0分は空欄にする。 */
function rakumaruTime_(hour, minute) {
  const h = Number(hour) || 0;
  const m = Number(minute) || 0;
  if (!h && !m) return '';
  return h + ':' + String(m).padStart(2, '0');
}

function writeApplicationRows_(ss, apps, now) {
  const sh = shinsunSheet_(ss, SHINSUN.SHEETS.APPLICATION);
  const rows = apps.map(item => ({
    '申込ID': item.id, '年度': item.year, '行事': item.event, '案内ルート': item.route,
    '対象区分': item.kubun, '対象ID': item.targetId, '申込者名': item.label,
    '申込日': item.applyDate, '申込経路': '', '申込状態': item.applyState,
    '参列区分': item.attend, '参列日': item.attendDate, '参列時刻': item.attendTime,
    '参加人数': item.people,
    '金額合計': item.total, '入金状態': item.payState,
    '入金日': item.payDate, '入金額': item.paid,
    '護摩': item.goma, '神酒渡し': item.miki, '酒奉納数': item.sake,
    'お守取置': item.omamori, '安全旗渡し': item.flag,
    '受渡方法': item.hand, '領収書要否': item.receipt, '領収書宛名': item.receiptTo,
    '年度別案内ID': item.guideId, '職員メモ': item.memo, '要確認': item.issue,
    '外部整理番号': item.serial, '楽まる申込ID': item.appId, '施主CD': item.cd,
    '登録日時': now
  }));
  replaceByHeader_(sh, SHINSUN.HEADERS.APPLICATION, rows);
}

function showApplicationReport_(ss, report, total, removed) {
  const lines = [];
  lines.push('■ 楽まる寺務DB → 93_申込台帳');
  lines.push('　入れた申込：' + total + '件');
  Object.keys(report.byYear).sort().forEach(year => {
    lines.push('　　' + year + '：' + report.byYear[year]);
  });
  lines.push('');
  lines.push('■ 92_年度別案内対象');
  lines.push('　消した行（R5〜R9）：' + removed);
  lines.push('　入れた過去実績：' + total);
  lines.push('　※ R2・R3 など楽まる寺務にない年度の行は残しています。');
  lines.push('');
  lines.push('■ 入れなかった行');
  lines.push('　R9 の繰越（申込ではありません）：' + report.carried + '件');
  if (report.carriedPaid) {
    lines.push('　　うち金額が入っている行：' + report.carriedPaid + '件');
    lines.push('　　早めに納めていただいた分の可能性があります。楽まる寺務で確認してください。');
  }
  lines.push('');
  lines.push('■ 確認が要る行');
  lines.push('　施主CDが 90/91 にない：' + report.noOwner);
  lines.push('　要確認を付けた行：' + report.issues);
  lines.push('');
  lines.push('※ 次に importRakumaruDetails を実行してください。');
  lines.push('　そのあと generateShinsunGuideTargets で R9 の案内対象を作り直します。');
  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('申込の取り込み', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}


/* ── 祈願者 → 94_祈願・御札明細 ─────────────────────────── */

/**
 * 祈願者を 94_祈願・御札明細 へ入れる。1祈願者1行。
 * 前札は1人に外札と内札の両方が出るので、両方の記載名を同じ行に持つ。
 */
function importRakumaruDetails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    const book = openRakumaruDb_(ss);
    const src = readDbSheet_(book, SHINSUN.RAKUMARU_DB.DETAIL);
    const at = src.at;

    // 93 から 楽まる申込ID → 申込ID を引けるようにする。
    const apps = shinsunSheet_(ss, SHINSUN.SHEETS.APPLICATION);
    const map = headerMap_(apps);
    const name = apps.getName();
    const last = lastRowByColumn_(apps, col_(map, '申込ID', name));
    const byRakumaru = {};
    if (last >= 2) {
      const values = apps.getRange(2, 1, last - 1, apps.getLastColumn()).getValues();
      const pick = (row, header) => clean_(row[col_(map, header, name) - 1]);
      values.forEach(row => {
        const key = pick(row, '楽まる申込ID');
        if (!key) return;
        byRakumaru[key] = {
          id: pick(row, '申込ID'), year: pick(row, '年度'),
          event: pick(row, '行事'), route: pick(row, '案内ルート')
        };
      });
    }
    if (!Object.keys(byRakumaru).length) {
      throw new Error('93_申込台帳 が空です。先に importRakumaruApplications を実行してください。');
    }

    const fudaClasses = getShinsunMaster_(ss)['祈願札区分'] || [];
    const now = new Date();
    const rows = [];
    const report = { total: 0, noParent: 0, gani: 0, outer: 0, inner: 0,
                     noClass: 0, issues: 0, byYear: {} };
    const serial = {};

    src.rows.forEach(row => {
      const appKey = clean_(row[at('申込ID')]);
      const parent = byRakumaru[appKey];
      if (!parent) { report.noParent += 1; return; }

      const issues = [];
      const amount = Number(row[at('祈願料')]) || 0;
      // 金額から 98_マスター の祈願札区分を引く。決められないときは空欄。
      const hit = fudaClasses.find(item => Number.isFinite(item.amount) && item.amount === amount);
      if (!hit && amount) { report.noClass += 1; issues.push('祈願料 ' + formatYen_(amount)
        + ' に合う祈願札区分が 98_マスター にありません'); }

      const outer = joinFudaName_(row[at('前札_会社名')], row[at('前札_役職')], row[at('前札_氏名')]);
      const inner = joinFudaName_(row[at('内札_会社名')], row[at('内札_役職')], row[at('内札_氏名')]);
      const gani = label_(row[at('願意')]);
      const label = joinFudaName_(row[at('会社名')], row[at('役職')], row[at('氏名')]);
      if (!label && !outer && !inner) {
        issues.push('札に書く名前が見当たりません。楽まる寺務で確認してください');
      }
      if (gani) report.gani += 1;
      if (outer) report.outer += 1;
      if (inner) report.inner += 1;

      const key = parent.year;
      serial[key] = (serial[key] || 0) + 1;
      rows.push({
        '明細ID': 'D-' + key + '-' + String(serial[key]).padStart(4, '0'),
        '申込ID': parent.id, '年度': parent.year,
        '行事': parent.event, '案内ルート': parent.route,
        '明細番号': Number(row[at('申込番号')]) || '',
        '祈願札区分': hit ? hit.value : '', '金額': amount || '', '願意': gani,
        '記載名': label,
        '会社名': label_(row[at('会社名')]), '役職': label_(row[at('役職')]),
        '敬称': label_(row[at('敬称')]), 'フリガナ': label_(row[at('フリガナ')]),
        '家名': label_(row[at('家名')]),
        '郵便番号': label_(row[at('郵便番号')]), '住所': rakumaruAddress_(row[at('住所1')], row[at('住所2')]),
        '電話番号': label_(row[at('電話番号')]),
        '外札の記載名': outer,
        '外札_会社名': label_(row[at('前札_会社名')]),
        '外札_役職': label_(row[at('前札_役職')]),
        '外札_氏名': label_(row[at('前札_氏名')]),
        '内札の記載名': inner,
        '内札_会社名': label_(row[at('内札_会社名')]),
        '内札_役職': label_(row[at('内札_役職')]),
        '内札_氏名': label_(row[at('内札_氏名')]),
        '札持帰り': Number(row[at('札持帰り')]) || '',
        '準備状態': '', '祈願代表者': row[at('祈願代表者')] === true,
        '職員メモ': label_(row[at('備考')]), '要確認': issues.join('\n'),
        '楽まる申込サブID': clean_(row[at('申込サブID')]),
        '登録日時': now
      });
      report.total += 1;
      report.byYear[key] = (report.byYear[key] || 0) + 1;
      if (issues.length) report.issues += 1;
    });

    replaceByHeader_(shinsunSheet_(ss, SHINSUN.SHEETS.DETAIL), SHINSUN.HEADERS.DETAIL, rows);

    resetShinsunCache_();
    logShinsun_(ss, '楽まる寺務DB取込（祈願者）', SHINSUN.SHEETS.DETAIL, rows.length, '');
    showDetailReport_(ss, report, rows.length);
    return rows.length;
  });
}

/**
 * 住所1と住所2をつなぐ。
 * 07_移行.gs の joinAddress_ と同じことをするが、そちらは段階2のファイルで
 * 移行が終われば消せるようにしてある。ここから呼ぶと消せなくなるので分けた。
 */
function rakumaruAddress_(first, second) {
  return [label_(first), label_(second)].filter(Boolean).join(' ');
}

/** 札に書く名前を組み立てる。会社名・役職・氏名を全角空白でつなぐ。 */
function joinFudaName_(corp, title, name) {
  // 札に書く名前は寺院の書き方のまま。label_ は NFKC 正規化を通さない。
  const parts = [corp, title, name].map(label_).filter(Boolean);
  const seen = [];
  parts.forEach(part => { if (seen.indexOf(part) < 0) seen.push(part); });
  return seen.join('　');
}

function showDetailReport_(ss, report, total) {
  const lines = [];
  lines.push('■ 楽まる寺務DB → 94_祈願・御札明細');
  lines.push('　入れた祈願者：' + total + '件');
  Object.keys(report.byYear).sort().forEach(year => {
    lines.push('　　' + year + '：' + report.byYear[year]);
  });
  lines.push('');
  lines.push('　願意が入っている行：' + report.gani);
  lines.push('　外札の記載名がある行：' + report.outer);
  lines.push('　内札の記載名がある行：' + report.inner);
  lines.push('');
  lines.push('■ 確認が要る行');
  lines.push('　申込が 93 に見つからない（R9 の繰越など）：' + report.noParent);
  lines.push('　祈願料に合う祈願札区分がない：' + report.noClass);
  lines.push('　要確認を付けた行：' + report.issues);
  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('祈願者の取り込み', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}


/* ── まとめて実行と確認 ───────────────────────────────── */

/** 施主 → 申込 → 祈願者 の順にまとめて取り込む。 */
function importRakumaruAll() {
  const owners = importRakumaruOwners();
  const apps = importRakumaruApplications();
  const details = importRakumaruDetails();
  const text = '■ 楽まる寺務DB の取り込みが終わりました\n'
    + '　90／91：' + owners + '件\n'
    + '　93_申込台帳：' + apps + '件\n'
    + '　94_祈願・御札明細：' + details + '件\n\n'
    + '次に generateShinsunGuideTargets を実行して、R9 の案内対象を作り直してください。';
  try {
    SpreadsheetApp.getUi().alert('取り込み完了', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return { owners: owners, applications: apps, details: details };
}

/** 見出し名で1行ずつ組み立て、中身を入れ替える。1行ずつ書かない。 */
function replaceByHeader_(sh, headers, rows) {
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const last = sh.getMaxRows();
  if (last >= 2) sh.getRange(2, 1, last - 1, width).clearContent();
  ensureSize_(sh, rows.length + 50, width);
  if (!rows.length) return;
  const body = rows.map(record => {
    const line = new Array(width).fill('');
    headers.forEach(header => {
      const column = map[clean_(header)];
      if (column && header in record) line[column - 1] = safeSheetValue_(record[header]);
    });
    return line;
  });
  sh.getRange(2, 1, body.length, width).setValues(body);
}

/** 見出し名で組み立てて末尾へ足す。 */
function appendByHeader_(sh, headers, idHeader, rows) {
  if (!rows.length) return;
  const map = headerMap_(sh);
  const width = sh.getLastColumn();
  const idColumn = col_(map, idHeader, sh.getName());
  const start = Math.max(2, lastRowByColumn_(sh, idColumn) + 1);
  ensureSize_(sh, start + rows.length + 50, width);
  const body = rows.map(record => {
    const line = new Array(width).fill('');
    headers.forEach(header => {
      const column = map[clean_(header)];
      if (column && header in record) line[column - 1] = safeSheetValue_(record[header]);
    });
    return line;
  });
  sh.getRange(start, 1, body.length, width).setValues(body);
}

/** 取り込んだ結果を見る。書き換えはしない。 */
function checkShinsunRakumaru() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetShinsunCache_();
  const lines = ['■ 楽まる寺務DB の取り込み結果'];

  const count = function (sheetName, idHeader) {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) return -1;
    const map = headerMap_(sh);
    const column = map[clean_(idHeader)];
    if (!column) return -1;
    return Math.max(0, lastRowByColumn_(sh, column) - 1);
  };
  [[SHINSUN.SHEETS.PERSON, '信者ID'], [SHINSUN.SHEETS.COMPANY, '拠点ID'],
   [SHINSUN.SHEETS.GUIDE, '年度別案内ID'], [SHINSUN.SHEETS.APPLICATION, '申込ID'],
   [SHINSUN.SHEETS.DETAIL, '明細ID']].forEach(pair => {
    const n = count(pair[0], pair[1]);
    lines.push('　' + pair[0] + '：' + (n < 0 ? 'ありません' : n + '件'));
  });

  const apps = ss.getSheetByName(SHINSUN.SHEETS.APPLICATION);
  if (apps) {
    const map = headerMap_(apps);
    const name = apps.getName();
    const last = lastRowByColumn_(apps, col_(map, '申込ID', name));
    if (last >= 2) {
      const values = apps.getRange(2, 1, last - 1, apps.getLastColumn()).getValues();
      const at = header => col_(map, header, name) - 1;
      const byYear = {}, byRoute = {}, byPay = {};
      let total = 0, paid = 0, noTarget = 0, issues = 0;
      values.forEach(row => {
        const bump = function (bag, value) {
          const label = label_(value) || '（空欄）';
          bag[label] = (bag[label] || 0) + 1;
        };
        bump(byYear, row[at('年度')]);
        bump(byRoute, row[at('案内ルート')]);
        bump(byPay, row[at('入金状態')]);
        total += Number(row[at('金額合計')]) || 0;
        paid += Number(row[at('入金額')]) || 0;
        if (!label_(row[at('対象ID')])) noTarget += 1;
        if (label_(row[at('要確認')])) issues += 1;
      });
      const show = function (title, bag) {
        lines.push('');
        lines.push('■ ' + title);
        Object.keys(bag).sort().forEach(k => lines.push('　' + k + '：' + bag[k]));
      };
      show('年度（93_申込台帳）', byYear);
      show('案内ルート', byRoute);
      show('入金状態', byPay);
      lines.push('');
      lines.push('■ 金額');
      lines.push('　金額合計：' + formatYen_(total));
      lines.push('　入金額：' + formatYen_(paid));
      lines.push('');
      lines.push('■ 確認が要る行');
      lines.push('　対象IDが空欄：' + noTarget);
      lines.push('　要確認あり：' + issues);
    }
  }

  const text = lines.join('\n');
  try {
    SpreadsheetApp.getUi().alert('取り込み結果', text, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(text);
  }
  return text;
}


/* ── 取り込みのあとで、職員の判断を戻す ────────────────── */

/**
 * 「_取込前」の控えから、楽まる寺務が持っていない項目を 90/91 へ戻す。
 *
 * 楽まる寺務にあるのは名前・住所・電話・敬称まで。
 * 案内停止（辞退・死亡・転居不明・廃業・重複）や、案内方法「不要」、
 * 世帯ID・担当部署・外札内札の記載名は、職員が付けた判断で、
 * 取り込みで上書きすると消えてしまう。
 *
 *   案内停止   … 控えが「継続」以外なら、そのまま戻す（消してはいけない）
 *   案内方法   … 控えが「郵送」以外なら戻す（職員が変えたということ）
 *   そのほか   … いま空欄のところだけ戻す。入っている値は触らない
 *
 * 取り込みで信者様と会社の分け方が変わることがあるので、
 * 90 の控えと 91 の控えの両方から名前で探す。
 * 何度実行してもよい。
 */
function restoreShinsunStopReasons() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return withScriptLock_(function () {
    resetShinsunCache_();
    ensureStage6Config_(ss);
    /*
     * 読み先は2通り。
     *   99_設定 の「復元元_取込前コピー」にIDが入っていれば、そのファイルの
     *   90/91 から読む。版の履歴から作った取り込み前のコピーを指す想定。
     *   入っていなければ、このファイルの「_取込前」の控えから読む。
     */
    const config = getShinsunConfig_(ss);
    const fromId = clean_(configValue_(config, '復元元_取込前コピー'));
    let book = ss;
    let suffix = SHINSUN.BACKUP_SUFFIX;
    if (fromId) {
      try {
        book = SpreadsheetApp.openById(fromId);
      } catch (error) {
        throw new Error('99_設定 の「復元元_取込前コピー」のスプレッドシートを開けません：' + fromId);
      }
      suffix = '';   // コピー側は 90/91 そのままの名前
    }
    const before = {
      person: readBackupByName_(book, SHINSUN.SHEETS.PERSON, ['氏名', '案内宛名'], suffix),
      company: readBackupByName_(book, SHINSUN.SHEETS.COMPANY,
        ['会社・法人・団体名', '案内状の宛名'], suffix)
    };
    const source = fromId ? ('別のファイル（' + fromId + '）') : ('「_取込前」の控え');
    if (!Object.keys(before.person).length && !Object.keys(before.company).length) {
      throw new Error(source + 'に 90/91 が見つかりません。取り込み前の内容がないと戻せません。');
    }

    // 楽まる寺務が持っていない項目。いま空欄のところだけ戻す。
    const spare = ['世帯ID', '年間法会の人物ID', '外札の記載名', '内札の記載名',
                   '拠点区分', '担当部署', '担当者名', '電話番号2', 'FAX',
                   'メールアドレス', '建物名', '請求書の宛名', '領収書の宛名',
                   '最終確認日'];
    const report = { stopped: 0, method: 0, filled: 0, missing: 0, rows: 0 };

    [[SHINSUN.SHEETS.PERSON, '信者ID', ['案内宛名', '氏名']],
     [SHINSUN.SHEETS.COMPANY, '拠点ID', ['案内状の宛名', '会社・法人・団体名']]]
      .forEach(spec => {
        const sh = shinsunSheet_(ss, spec[0]);
        const map = headerMap_(sh);
        const name = sh.getName();
        const idColumn = col_(map, spec[1], name);
        const last = lastRowByColumn_(sh, idColumn);
        if (last < 2) return;

        const width = sh.getLastColumn();
        const range = sh.getRange(2, 1, last - 1, width);
        const values = range.getValues();
        let changed = false;

        values.forEach(row => {
          report.rows += 1;
          let label = '';
          for (let i = 0; i < spec[2].length && !label; i++) {
            const column = map[clean_(spec[2][i])];
            if (column) label = label_(row[column - 1]);
          }
          const flat = key_(label);
          const kept = before.person[flat] || before.company[flat];
          if (!kept) { report.missing += 1; return; }

          const put = function (header, value) {
            const column = map[clean_(header)];
            if (!column) return false;
            row[column - 1] = safeSheetValue_(value);
            changed = true;
            return true;
          };
          const now = function (header) {
            const column = map[clean_(header)];
            return column ? label_(row[column - 1]) : '';
          };

          // 案内停止は消してはいけない。控えが「継続」以外ならそのまま戻す。
          const state = label_(kept[clean_('翌年度案内状態')]);
          if (state && key_(state) !== key_('継続') && key_(now('翌年度案内状態')) !== key_(state)) {
            if (put('翌年度案内状態', state)) {
              put('案内停止理由', label_(kept[clean_('案内停止理由')]));
              report.stopped += 1;
            }
          }
          // 案内方法が「郵送」以外なら、職員が変えたということ。戻す。
          const method = label_(kept[clean_('案内方法')]);
          if (method && key_(method) !== key_('郵送') && key_(now('案内方法')) !== key_(method)) {
            if (put('案内方法', method)) report.method += 1;
          }
          // そのほかは空欄のところだけ。
          spare.forEach(header => {
            if (now(header)) return;
            const value = kept[clean_(header)];
            if (value === undefined || label_(value) === '') return;
            if (put(header, value)) report.filled += 1;
          });
        });

        if (changed) range.setValues(values);
      });

    resetShinsunCache_();
    logShinsun_(ss, '職員の判断を戻す',
      SHINSUN.SHEETS.PERSON + '／' + SHINSUN.SHEETS.COMPANY, report.stopped, '');

    const lines = [];
    lines.push('■ 職員の判断を戻しました');
    lines.push('　読み先：' + source);
    lines.push('　案内停止（辞退・死亡・転居不明・廃業など）：' + report.stopped + '件');
    lines.push('　案内方法（郵送以外）：' + report.method + '件');
    lines.push('　空欄に戻した項目：' + report.filled + '件');
    lines.push('');
    lines.push('　見た行：' + report.rows + '件');
    lines.push('　読み先に同じ名前がなかった行：' + report.missing + '件（新しく入った方など）');
    if (!report.missing && report.rows) {
      lines.push('');
      lines.push('※ 「なかった行」が0件です。読み先が取り込み後の内容になっている');
      lines.push('　おそれがあります。控えの件数をご確認ください。');
    }
    if (report.stopped) {
      lines.push('');
      lines.push('※ 案内停止の方の R9 の行が 92 に残っています。');
      lines.push('　rebuildShinsunGuideTargets を実行して作り直してください。');
    }
    const text = lines.join('\n');
    try {
      SpreadsheetApp.getUi().alert('職員の判断を戻す', text, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (err) {
      Logger.log(text);
    }
    return report.stopped;
  });
}

/**
 * 取り込み前の 90/91 を名前で引ける形に読む。
 * suffix が空なら別ファイルの 90/91 をそのまま読む。見つからなければ空を返す。
 */
function readBackupByName_(book, sheetName, nameHeaders, suffix) {
  const sh = book.getSheetByName(sheetName + (suffix === undefined ? SHINSUN.BACKUP_SUFFIX : suffix));
  const bag = {};
  if (!sh) return bag;
  const width = sh.getLastColumn();
  const last = sh.getLastRow();
  if (last < 2 || width < 1) return bag;
  const values = sh.getRange(1, 1, last, width).getValues();
  const headers = values[0].map(clean_);
  values.slice(1).forEach(row => {
    const record = {};
    headers.forEach((header, i) => { if (header) record[header] = row[i]; });
    nameHeaders.forEach(header => {
      const flat = key_(record[clean_(header)]);
      if (flat && !bag[flat]) bag[flat] = record;
    });
  });
  return bag;
}

/**
 * 今年度の案内対象を作り直す。
 *
 * 92 から今年度の行（案内状態が「（過去実績）」でないもの）を消してから、
 * generateShinsunGuideTargets（段階4）をもう一度実行する。
 *
 * 90/91 を入れ替えたあとは対象IDが変わっているので、
 * 足すだけでは古い行が残ってしまう。案内停止を戻したあとにも使う。
 */
function rebuildShinsunGuideTargets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const removed = withScriptLock_(function () {
    resetShinsunCache_();
    const config = getShinsunConfig_(ss);
    const yearNum = reiwaNumber_(clean_(configValue_(config, '現在年度')));
    if (!yearNum) throw new Error('99_設定 の「現在年度」が読めません。');

    const sh = shinsunSheet_(ss, SHINSUN.SHEETS.GUIDE);
    const map = headerMap_(sh);
    const name = sh.getName();
    const idColumn = col_(map, '年度別案内ID', name);
    const iYear = col_(map, '年度', name) - 1;
    const iState = col_(map, '案内状態', name) - 1;
    const last = lastRowByColumn_(sh, idColumn);
    if (last < 2) return 0;

    const width = sh.getLastColumn();
    const values = sh.getRange(2, 1, last - 1, width).getValues();
    // 過去実績は残す。今年度の作りかけの行だけ消す。
    const keep = values.filter(row =>
      reiwaNumber_(row[iYear]) !== yearNum ||
      key_(row[iState]) === key_('（過去実績）'));
    const gone = values.length - keep.length;
    if (gone) {
      sh.getRange(2, 1, values.length, width).clearContent();
      if (keep.length) sh.getRange(2, 1, keep.length, width).setValues(keep);
    }
    resetShinsunCache_();
    logShinsun_(ss, '今年度の案内対象を消す', SHINSUN.SHEETS.GUIDE, gone, '');
    return gone;
  });

  toast_(ss, '今年度の行を ' + removed + '件 消しました。続けて作り直します。', 8);
  const added = generateShinsunGuideTargets();
  return { removed: removed, added: added };
}
