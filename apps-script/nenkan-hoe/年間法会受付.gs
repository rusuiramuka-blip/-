/**
 * 年間法会受付・運用版 v22.8
 *
 * v22.8 での追加修正
 *  1. 一般のお盆「対象範囲」を受付対象年固定から名簿の最新年基準へ変更。
 *     翌年度フォームを開いた時点で設定確認が常時「要確認」になる問題を解消。
 *  2. 履歴索引の再構築保護を、年を固定した必須条件から
 *     「既に確認済みの対象範囲を失わないこと」へ変更。
 *  3. フォーム送信トリガーの復旧入口 repairAnnualFormTriggers を管理者用に追加。
 *     フォームに紐づくトリガーはトリガー画面から作り直せないためです。
 *
 * v22.7 での追加修正
 *  1. 訂正時の読経日時を同じ表示形式で比較し、内容が同じ場合の誤った訂正ログを防止。
 *  2. 読経枠重複の新旧警告文を訂正時の再判定対象にし、解消済み警告を残さないよう修正。
 *  3. 申込管理の受付状態を変更した直後に、読経用一覧のチェック欄を現在の表示行へ再同期。
 *  4. 過去履歴の再取込は管理者用の実行入口を1つだけ公開し、初期設定・旧名簿移行は非公開を維持。
 *  5. 履歴索引は新しい内容の準備後に書き換え、余った旧行だけを消す方式へ変更。
 *  6. 通常受付の追記で、申込IDが空欄のCOVERAGE行を上書きしていた不具合を修正。
 * 春彼岸・お盆（納骨壇）・秋彼岸の3フォームと、職員用「受付入力」を同じ台帳へ統合します。
 * 一般のお盆供養と初盆は「受付入力」だけで受け付けます。
 *
 * v22.6 での追加修正
 *  1. 「読経用一覧」のタイトル照合で、全角記号の正規化により常に要確認になる誤判定を修正。
 *  2. 同じ照合を使う読経済チェックボックスの再同期も、確実に実行されるよう修正。
 *
 * v22.5 での追加修正
 *  1. 「通年法会受付」メニューを、職員が実際に使う4項目だけへ整理。
 *  2. 初期設定・フォーム連携修復・自己診断の操作入口を廃止。
 *  3. 起動時の構成修復と読経用一覧の再整備をやめ、ファイルを開く際の負荷を軽減。
 *  4. 残した4項目の用途と実行時期を「使い方」シートへ明記。
 *  5. 不足設定がある場合は自動修復せず、「設定状態を確認」で把握する方式へ統一。
 *
 * v22.4 での追加修正
 *  1. 申込内容訂正の完了状態を「処理済」へ統一し、フォーム回答X列の入力規則エラーを解消。
 *  2. 読経用一覧に明細があるのにA列のチェックボックスが欠けた場合、起動時に自動修復。
 *  3. 日常メニューを「受付登録」「設定確認」の2項目に絞り、保守項目を管理者用へ集約。
 *  4. 旧版の初期設定入口を削除し、実行対象を1つに統一。
 *  5. 読経用一覧の通常整備範囲を1,500行へ絞り、再設定時の書式処理を軽量化。
 *
 * v22.3 での修正点（v22.2 からの差分）
 *  1. 受付方法を必須項目として画面説明と登録判定を統一。
 *  2. 初盆を外して彼岸へ戻した際、B13の選択が消える切替順序を修正。
 *     彼岸を選んだ場合は初盆チェックを自動で外します。
 *  3. 初盆は合同供養会での読上げ受付に限定し、別日供養は通常受付を使う案内を表示。
 *  4. 受付日時は非表示セルの残値を使わず、登録処理を行った日時を自動記録。
 *  5. 「フォーム回答」を内部シートとして非表示化。
 *  6. 「読経用一覧」のA列で読経済を直接チェックし、申込管理まで同期。
 *  7. 受付入力の必須項目・色の意味・登録結果を見分けやすく整理。
 *  8. 「寺院一任」でも、寺院側で日時確定後は日付・時刻を記録し、
 *     「修正反映」から読経対象一覧・読経用一覧へ同期できるよう修正。
 *  9. 読経用一覧の結合セルと固定列が競合し、初期整備が停止する不具合を修正。
 * 10. 「参列する」「寺院一任」を問わず、確定した読経日時は1枠1組の重複チェック対象に変更。
 * 11. 受付入力のプレビューで、供養種別・読経参列・読経日時の不足を登録前に表示。
 * 12. 読経用一覧の年度候補を、読経対象が0件でもエラーにならない式へ変更。
 * 13. 「修正反映」がTRUEのまま修正日時・修正者が残っていない未処理行を設定確認で検出。
 *     「保留」は安全のため引き続き読経用一覧には表示しません。
 *
 * v22.2 までの主な修正点
 *  1. 初盆電話受付の入金一括同期が、申込IDではなく受付日時で照合していたため
 *     一度も反映されていなかった不具合を修正。
 *  2. 一般・初盆の受付で「オンライン決済の商品URLが未設定」が必ず付き、
 *     クレジット／コンビニ選択時に常に要確認になっていた判定を修正。
 *  3. 名簿の直近3年同期が1行ごとに全台帳を読み直していたため、
 *     件数が増えると実行時間上限で止まる可能性があった処理を一括読み取りへ変更。
 *  4. 受付入力で「今回入金額」を先に入力すると消えていた動きを、
 *     入金状況の自動判定（一部入金／入金済）へ変更。
 *  5. 志納料の参照範囲を固定（A5:E8）から名称照合へ変更し、
 *     設定シートに行を足しても金額がずれないようにしました。
 *  6. 設定シート・直近履歴の読み取りを実行中だけ再利用し、編集時の待ち時間を短縮。
 *  7. 職員が使う同期・修復処理を「通年法会受付」メニューの管理サブメニューへ集約。
 */
const ANNUAL = Object.freeze({
  SPREADSHEET_ID: '14WpiSyv_4MfAJH81M6L_YBxVX6l0oYGNcVuWYUxZZn8',
  SHEETS: {
    SETTINGS: '設定',
    RESPONSE: 'フォーム回答',
    APPLICATION: '申込管理',
    WORK: '作札一覧',
    MANUAL: '受付入力',
    FIRST_OBON: '初盆電話受付',
    MASTER: '納骨壇名簿',
    GENERAL_MASTER: '一般信者名簿',
    CONTRACT_CANDIDATES: '契約者候補',
    HISTORY_INDEX: '申込履歴索引',
    READING: '読経対象一覧',
    READING_VIEW: '読経用一覧',
    PAYMENT_HISTORY: '入金履歴',
    PAYMENT_DASHBOARD: '未納確認',
    RECEIVE_ERROR: '受信エラー'
  },
  HANDLER: 'onAnnualMemorialFormSubmit',
  RESPONSE_STATE: Object.freeze({
    RECEIVED: '受付済', REVIEW: '要確認', DONE: '処理済', LEGACY_CORRECTED: '修正済'
  }),
  TIMEZONE: 'Asia/Tokyo',
  GENERAL_SOURCE: Object.freeze({
    SPREADSHEET_ID: '1VLgoyz56cqWLq1h8Ct72WOrUTxPOWB0EC_kyInxQ7Fk',
    SHEET: '92_人物・世帯台帳'
  }),
  HISTORY_SOURCE: Object.freeze({
    SPREADSHEET_ID: '1VLgoyz56cqWLq1h8Ct72WOrUTxPOWB0EC_kyInxQ7Fk',
    APPLICATION_SHEET: '01_受付台帳',
    DETAIL_SHEET: '02_供養祈願明細'
  }),
  RECENT_HISTORY_SOURCE: Object.freeze({
    OBON_2026: Object.freeze({
      SPREADSHEET_ID: '1IH8r_RuuUva4Sgg8-nrGhixye9APSnZZ3pJ4zTvK9Mc',
      SHEET: '2026納骨壇'
    }),
    OBON_2025: Object.freeze({
      SPREADSHEET_ID: '15O3KJ9Q5UndyINCq34U5MvKM_2Ah8uh2AOmHPta7u70',
      APPLICATION_SHEET: '03_年度別申込管理',
      DETAIL_SHEET: '04_供養明細'
    }),
    MEMORIAL_2025: Object.freeze({
      SPREADSHEET_ID: '1CMIwATU8it1FCONALLrMw_03J_v_7c8oaIbyDpmuuf4',
      AUTUMN_RESPONSE_SHEET: '2025/07秋彼岸・回答'
    })
  }),
  FORM_LABELS: Object.freeze({
    SPRING_NOKOTSU: '春彼岸・納骨壇契約者専用',
    OBON_NOKOTSU: 'お盆・納骨壇契約者専用',
    AUTUMN_NOKOTSU: '秋彼岸・納骨壇契約者専用'
  }),
  CORRECTION: Object.freeze({
    NAME_COLUMN: 26,
    APPLY_COLUMN: 27,
    AT_COLUMN: 28,
    BY_COLUMN: 29,
    HEADERS: Object.freeze(['確定契約者名', '修正反映', '修正日時', '修正者'])
  }),
  CONFIG_KEYS: Object.freeze([
    '受付対象年', '寺院通知先', '自動返信有効',
    'EC会員登録URL', 'EC商品一覧URL',
    'お盆・納骨壇・合同供養URL', 'お盆・納骨壇・併申込読経URL',
    'お盆・納骨壇・読経のみURL',
    '春彼岸・合同供養URL', '秋彼岸・合同供養URL',
    '彼岸・併申込読経URL', '彼岸・読経のみURL',
    '銀行名', '支店名', '口座種別', '口座番号', '口座名義',
    '支払期限日数', '寺院電話'
  ])
});

/**
 * v22 はv16で追加した既存列 A:AC／AD:AT の配置を維持します。
 * 旧版の数式・帳票・列参照を保ったまま段階的に移行するための固定定義です。
 */
const ANNUAL_V16 = Object.freeze({
  APPLICATION_HEADERS: Object.freeze([
    '受付状態', '内容確認', '通知状態', '支払期限', '今回入金額', '入金合計', '未収額',
    '振込名義・決済番号', '入金確認者', '取消・除外理由', '人物ID', '世帯ID',
    '申込者メール', '案内方法', '督促状態', '確定申込者名', '確定人物ID'
  ]),
  COL: Object.freeze({
    RECEPTION_STATE: 30, CONTENT_STATE: 31, NOTICE_STATE: 32, PAYMENT_DUE: 33,
    PAYMENT_ENTRY: 34, PAYMENT_TOTAL: 35, BALANCE: 36, PAYMENT_REFERENCE: 37,
    PAYMENT_VERIFIER: 38, EXCLUSION_REASON: 39, PERSON_ID: 40, HOUSEHOLD_ID: 41,
    EMAIL: 42, GUIDE_METHOD: 43, REMINDER_STATE: 44,
    CONFIRMED_APPLICANT: 45, CONFIRMED_PERSON_ID: 46
  }),
  ACTIVE_RECEPTION_STATES: Object.freeze(['受付中', '保留']),
  EXCLUDED_RECEPTION_STATES: Object.freeze(['取消', '重複', 'テスト']),
  PAYMENT_STATUSES: Object.freeze(['未入金', '一部入金', '入金済', '免除', '要確認']),
  PAYMENT_HISTORY_HEADERS: Object.freeze([
    '入金ID', '申込ID', '入金日', '支払方法', '入金額', '入金区分', '入金者名',
    '振込名義・決済情報', '確認状態', '領収書', '御礼状', '確認者', '備考', '元データ', '最終更新'
  ]),
  GENERAL_MASTER_HEADERS: Object.freeze([
    '申込者名', 'フリガナ', '電話', '区分',
    'お盆前回供養内容', 'お盆廻向証', 'お盆最終年', '供養履歴更新日', 'お盆直近3年',
    '職員メモ', '人物ID', '世帯ID', '郵便番号', '住所', '建物名', '電話2',
    'メール', '案内方法', '案内可否', '参照元備考', '最終確認日'
  ]),
  MANUAL: Object.freeze({
    EMAIL: 'F5', GUIDE_METHOD: 'F6', RECEIVED_DATE: 'F7', PERSON_ID: 'F8',
    HOUSEHOLD_ID: 'F9', POSTAL_CODE: 'F10', ADDRESS: 'F11',
    PAYMENT_AMOUNT: 'B23', PAYMENT_REFERENCE: 'F22', PREVIEW: 'F23',
    FEE_DISPLAY: 'D22', NOTE: 'D23'
  })
});

/**
 * 1回の実行中だけ有効な読み取りキャッシュです。
 * 設定シートと直近履歴は1編集あたり何度も参照するため、同じ実行では読み直しません。
 * 設定シート・申込履歴索引を書き換えたときは、必ず該当のリセット関数を呼びます。
 */
const ANNUAL_RUNTIME_CACHE = {};

function resetAnnualRuntimeCache_() {
  Object.keys(ANNUAL_RUNTIME_CACHE).forEach(key => { delete ANNUAL_RUNTIME_CACHE[key]; });
}

function resetRecentHistoryCache_() {
  delete ANNUAL_RUNTIME_CACHE.recentHistory;
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('通年法会受付')
    .addItem('受付入力の内容を登録', 'registerManualReceptionFromMenu')
    .addSeparator()
    .addItem('フォームの受付設定を反映', 'syncFormScheduleInfo')
    .addItem('一般信者名簿を更新', 'syncGeneralApplicantMaster')
    .addItem('設定状態を確認', 'checkAnnualMemorialSetup')
    .addToUi();

  // 起動時は、現在入力中の受付画面だけを更新します。
  // シート構成・フォーム連携・読経用一覧の修復は行いません。
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss && ss.getSheetByName(ANNUAL.SHEETS.MANUAL);
    if (sh) {
      setManualApplicantValidation_(ss, clean_(sh.getRange('D5').getValue()));
      updateManualReceptionMode_(ss, sh);
      updateManualV16Preview_(ss, sh);
      renderRecentApplicationHistory_(ss, sh);
    }
  } catch (error) {
    // メニュー表示を優先し、受付画面の更新に失敗しても起動自体は止めません。
  }
}

function showAnnualStatus_(ss, message, seconds) {
  try {
    ss.toast(message, '通年法会受付', seconds || 5);
  } catch (error) {
    // トーストが表示できない環境でも本処理は継続します。
  }
}

/** 回答先未設定のフォームでは getDestinationId() が例外になるため、空欄として扱います。 */
function getFormDestinationId_(form) {
  try {
    return clean_(form.getDestinationId());
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    if (/no response destination/i.test(detail) || /回答先.*設定されていません/.test(detail)) {
      return '';
    }
    throw error;
  }
}

/** 明らかな試験申込は実務上の未納・作札・読経対象へ混ぜません。 */
function isExplicitTestApplication_(application) {
  const values = [
    application && application.contractor,
    application && application.applicantName,
    application && application.sponsor,
    application && application.requestType,
    application && application.note,
    application && application.auditNote,
    ...((application && Array.isArray(application.memorials)) ? application.memorials : [])
  ];
  return values.some(value => {
    const text = clean_(value);
    return /(^|[\s　])テスト($|[\s　])|^テスト|テスト$/.test(text) || /^test$/i.test(text);
  });
}

/** フォーム処理が途中で失敗しても、回答IDとエラー概要だけは裏方シートへ残します。 */
function ensureReceiveErrorSheet_(ss) {
  let sh = ss.getSheetByName(ANNUAL.SHEETS.RECEIVE_ERROR);
  if (!sh) sh = ss.insertSheet(ANNUAL.SHEETS.RECEIVE_ERROR);
  const headers = [
    '発生日時', 'フォームID', '回答ID', '回答日時', '回答者メール',
    'エラー内容', '回答内容', '最終記録'
  ];
  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }
  if (!sheetHeadersMatch_(sh, 1, 1, headers)) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#f4cccc');
  }
  if (!sh.isSheetHidden()) sh.hideSheet();
  return sh;
}

function formResponseSnapshot_(e) {
  if (!e || !e.response) return '';
  const values = [];
  try {
    e.response.getItemResponses().forEach(item => {
      const title = clean_(item.getItem().getTitle());
      const raw = item.getResponse();
      const value = Array.isArray(raw) ? raw.join('、') : String(raw == null ? '' : raw);
      values.push(`${title}：${value}`);
    });
  } catch (error) {}
  return values.join('\n').slice(0, 20000);
}

function logAnnualFormReceiveError_(e, error) {
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  const sh = ensureReceiveErrorSheet_(ss);
  let formId = '';
  let responseId = '';
  let responseAt = '';
  let email = '';
  try { formId = e && e.source ? clean_(e.source.getId()) : ''; } catch (ignore) {}
  try { responseId = e && e.response ? clean_(e.response.getId()) : ''; } catch (ignore) {}
  try { responseAt = e && e.response ? (e.response.getTimestamp() || '') : ''; } catch (ignore) {}
  try { email = e && e.response ? clean_(e.response.getRespondentEmail()) : ''; } catch (ignore) {}
  const detail = error && error.stack ? String(error.stack) :
    (error && error.message ? String(error.message) : String(error));
  const row = [
    new Date(), formId, responseId, responseAt, email,
    detail.slice(0, 10000), formResponseSnapshot_(e), new Date()
  ].map(safeSheetValue_);
  sh.appendRow(row);
  if (!sh.isSheetHidden()) sh.hideSheet();
}

/** インストール型フォーム送信トリガーから実行します。手動実行はしません。 */
function onAnnualMemorialFormSubmit(e) {
  if (!e || !e.response || !e.source) throw new Error('フォーム送信時にだけ実行される関数です。');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
    ensureAnnualV16Schemas_(ss, false);
    const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
    const rawSh = mustSheet_(ss, ANNUAL.SHEETS.RESPONSE);
    const appSh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
    const workSh = ensureWorkSheetSchema_(ss);
    const readingSh = mustSheet_(ss, ANNUAL.SHEETS.READING);
    const config = getAnnualConfig_(settings);
    validateAnnualConfig_(config);
    const context = resolveFormContext_(settings, e.source.getId(), config);
    const answers = {};
    e.response.getItemResponses().forEach(r => {
      const title = r.getItem().getTitle();
      const value = r.getResponse();
      const hasValue = Array.isArray(value) ? value.length > 0 : value !== '' && value != null;
      // 分岐先には同名の質問があります。未表示側の空回答で実回答を上書きしません。
      if (!(title in answers) || hasValue) answers[title] = value;
    });

    const timestamp = e.response.getTimestamp() || new Date();
    const responseId = e.response.getId() || Utilities.getUuid();
    const year = context.year;
    const eventName = context.eventName;
    const category = context.category;
    const contractor = clean_(answer_(answers, 'ご契約者様のお名前'));
    const enteredSponsor = clean_(answer_(answers, '今回施主様のお名前'));
    const sponsor = enteredSponsor || contractor;
    const sponsorKana = clean_(answer_(answers, '施主様ふりがな'));
    const phone = clean_(answer_(answers, '電話番号'));
    const requestType = normalizeRequestType_(answer_(answers, 'ご希望の供養'), category);
    const memorials = [1, 2, 3, 4, 5]
      .map(i => clean_(answer_(answers, `供養内容${i}`))).filter(Boolean);
    // 初盆は通常フォームでは受け付けず、職員用「受付入力」から登録するため常に false です。
    const firstObon = false;
    const obonConfirmation = clean_(answer_(answers, '初盆受付の確認'));
    const attend = normalizeAttendance_(answer_(answers, '読経への参列'), requestType);
    const readingDate = answer_(answers, '読経希望日') || '';
    const readingTime = answer_(answers, '読経希望時刻') || '';
    const paymentRaw = clean_(answer_(answers, 'お支払い方法'));
    const generalEko = clean_(answer_(answers, '廻向の証'));
    const note = clean_(answer_(answers, '連絡事項'));
    const email = e.response.getRespondentEmail() || '';
    const formConfirmation = clean_(answer_(answers, '申込対象の確認'));
    const expectedFormConfirmation = `${year}年 ${context.label}に申し込みます`;

    const application = {
      timestamp, responseId, email, year, eventName, category, contractor, sponsor,
      sponsorKana, phone, requestType, memorials, firstObon, obonConfirmation, attend, readingDate,
      readingTime, paymentRaw, generalEko, note, formConfirmation, expectedFormConfirmation
    };
    const issues = validateApplication_(application);
    if (context.status !== '受付中') issues.push('停止中のフォームから送信されています');
    const scheduleRule = context.schedule || getScheduleRule_(settings, year, eventName, category);
    validateReadingSchedule_(application, scheduleRule).forEach(issue => issues.push(issue));
    validateReadingLeadTime_(application, timestamp).forEach(issue => issues.push(issue));
    validateReadingSlotConflict_(appSh, application, scheduleRule).forEach(issue => issues.push(issue));
    const master = getMaster_(ss, contractor);
    if (category === '納骨壇' && contractor && !master.length) issues.push('契約者名を名簿で確認できません');
    const readingPlan = buildReadingTargetsFromMaster_(application, master);
    readingPlan.issues.forEach(issue => issues.push(issue));
    readingPlan.targets.forEach(item => { if (item.issue) issues.push(item.issue); });
    const fee = calculateFee_(ss, eventName, category, requestType, memorials.length);
    if (!Number.isFinite(fee) || fee <= 0) issues.push('志納料設定が不正');
    const paymentPlan = buildPaymentPlan_(ss, config, application, fee);
    if (requiresEcProductUrl_(application) && paymentPlan.items.some(item => !item.url)) {
      issues.push('オンライン決済の商品URLが未設定');
    }
    const globalIssues = [...issues];
    const resolved = memorials.map(raw => resolveMemorial_(raw, category, master));
    resolved.forEach(x => { if (x.issue) issues.push(x.issue); });

    const eko = eventName === 'お盆' && (category === '納骨壇' || generalEko === '希望する');
    const payMethod = paymentRaw.includes('銀行') ? '振込'
      : paymentRaw.includes('クレジット') ? 'クレジット'
      : paymentRaw.includes('コンビニ') ? 'コンビニ' : '現金';
    const uniqueIssues = [...new Set(issues.filter(Boolean))];
    const status = uniqueIssues.length ? '要確認' : '作成可';
    const issueText = uniqueIssues.join('／');
    Object.assign(application, { fee, paymentPlan, payMethod, eko, status, issues: uniqueIssues });
    const receptionState = isExplicitTestApplication_(application) ? 'テスト' : '受付中';
    if (category === '一般') upsertGeneralApplicantContact_(ss, application);

    const existingRawRow = findIdRow_(rawSh, 2, responseId);
    const rawRow = existingRawRow || writeFirstEmptyIdRow_(rawSh, 2, [
        timestamp, responseId, email, year, eventName, category, contractor, sponsor,
        sponsorKana, phone, requestType, ...pad_(memorials, 5), firstObon, attend,
        readingDate, readingTime, paymentRaw, generalEko, note,
        uniqueIssues.length ? '要確認' : '受付済', issueText
      ]);

    const existingAppRow = findIdRow_(appSh, 2, responseId);
    // どちらか一方の台帳に記録済みなら、再実行時にメールを重複送信しません。
    const isNewSubmission = !existingRawRow && !existingAppRow;
    const appRow = existingAppRow || writeFirstEmptyIdRow_(appSh, 2, [
        status, responseId, timestamp, year, eventName, category, contractor, sponsor,
        sponsorKana, phone, requestType, memorials.join('\n'), memorials.length, fee,
        eko, attend, readingDate, readingTime, 'フォーム', initialPaymentStatus_(uniqueIssues), payMethod, '', false, false,
        [note, issueText].filter(Boolean).join('\n')
      ]);
    const applicantRecord = findManualApplicantRecord_(
      ss, category, category === '一般' ? (sponsor || contractor) : contractor
    );
    writeApplicationV16Fields_(appSh, appRow, application, {
      receptionState,
      contentState: uniqueIssues.length ? '要確認' : '確認済',
      noticeState: asBoolean_(config['自動返信有効']) ? '送信処理中' : '自動返信無効',
      guideMethod: 'メール',
      personId: clean_(application.personId) || (applicantRecord ? applicantRecord.personId : ''),
      householdId: applicantRecord ? applicantRecord.householdId : '',
      email
    });

    const existingKeys = workKeys_(workSh, responseId);
    resolved.forEach((item, i) => {
      const branch = i + 1;
      if (existingKeys.has(branch)) return;
      const rowIssue = [...globalIssues, item.issue].filter(Boolean).join('／');
      writeFirstEmptyIdRow_(workSh, 5, [
        rowIssue ? '要確認' : '作成可', year, eventName, category, responseId, branch,
        sponsor, item.name, item.type, firstObon,
        category === '一般' ? '木札' : '経木塔婆', eko,
        false, false, false, false, contractor, memorials[i], rowIssue, timestamp
      ]);
    });

    const existingReadingKeys = readingKeys_(readingSh, responseId);
    readingPlan.targets.forEach((item, i) => {
      const branch = i + 1;
      if (existingReadingKeys.has(branch)) return;
      const rowIssue = [...new Set([...uniqueIssues, item.issue].filter(Boolean))].join('／');
      writeFirstEmptyIdRow_(readingSh, 4, [
        rowIssue ? '要確認' : '作成可', year, eventName, responseId, branch,
        contractor, item.altar, item.altarType, item.number, item.name, item.type,
        attend, readingDate, readingTime, false, rowIssue, timestamp
      ]);
    });

    updateMemorialHistoryMaster_(ss, Object.assign({}, application, {
      applicantName: category === '一般' ? sponsor : contractor,
      applicantKana: category === '一般' ? sponsorKana : ''
    }));

    if (isNewSubmission) {
      const mailIssues = sendAnnualMemorialEmails_(config, application);
      if (mailIssues.length) {
        markMailIssues_(rawSh, rawRow, appSh, appRow, mailIssues);
        updateApplicationNoticeState_(appSh, appRow, '送信失敗');
      } else {
        updateApplicationNoticeState_(
          appSh, appRow,
          asBoolean_(config['自動返信有効']) && email ? '送信済' : '自動返信無効'
        );
      }
    }
    syncOperationalStatus_(ss, responseId, receptionState, initialPaymentStatus_(uniqueIssues), '未督促');
    // 新しい読経対象を当日用画面へ直ちに反映します。
    syncReadingViewCheckboxes_(ss);
  } catch (error) {
    try {
      logAnnualFormReceiveError_(e, error);
    } catch (logError) {
      // エラー記録自体に失敗しても、元の例外を優先します。
    }
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/** 設定シートは行番号ではなく項目名で読み取ります。同じ実行中は読み直しません。 */
function getSettingsRows_(settings) {
  if (ANNUAL_RUNTIME_CACHE.settingsRows) return ANNUAL_RUNTIME_CACHE.settingsRows;
  const lastRow = settings.getLastRow();
  ANNUAL_RUNTIME_CACHE.settingsRows = lastRow ? settings.getRange(1, 1, lastRow, 7).getValues() : [];
  return ANNUAL_RUNTIME_CACHE.settingsRows;
}

function getAnnualConfig_(settings) {
  if (ANNUAL_RUNTIME_CACHE.config) return ANNUAL_RUNTIME_CACHE.config;
  const allowed = new Set(ANNUAL.CONFIG_KEYS);
  const duplicates = new Set();
  const config = getSettingsRows_(settings).reduce((result, row) => {
    const name = clean_(row[0]);
    if (!allowed.has(name)) return result;
    if (Object.prototype.hasOwnProperty.call(result, name)) duplicates.add(name);
    result[name] = row[1];
    return result;
  }, {});
  if (duplicates.size) {
    throw new Error(`設定シートに重複項目があります：${[...duplicates].join('、')}`);
  }
  ANNUAL_RUNTIME_CACHE.config = config;
  return config;
}

/** 誤通知・誤決済を避けるため、受付前に運用設定を検査します。 */
function validateAnnualConfig_(config) {
  const issues = [];
  const year = Number(config['受付対象年']);
  if (!Number.isInteger(year) || year < 2025 || year > 2100) {
    issues.push('受付対象年');
  }

  const templeEmail = clean_(config['寺院通知先']);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(templeEmail)) {
    issues.push('寺院通知先');
  }

  const replySetting = config['自動返信有効'];
  const replyText = clean_(replySetting).toLowerCase();
  if (!(replySetting === true || replySetting === false ||
    ['true', 'false', 'yes', 'no', '1', '0', '有効', '無効'].includes(replyText))) {
    issues.push('自動返信有効');
  }

  const requiredUrls = [
    'EC会員登録URL', 'EC商品一覧URL',
    'お盆・納骨壇・合同供養URL', 'お盆・納骨壇・併申込読経URL',
    'お盆・納骨壇・読経のみURL',
    '春彼岸・合同供養URL', '秋彼岸・合同供養URL',
    '彼岸・併申込読経URL', '彼岸・読経のみURL'
  ];
  requiredUrls.forEach(name => {
    if (!isTrustedEcUrl_(config[name])) issues.push(name);
  });
  ['銀行名', '支店名', '口座種別', '口座番号', '口座名義', '寺院電話']
    .forEach(name => { if (!clean_(config[name])) issues.push(name); });
  const paymentDeadline = Number(config['支払期限日数']);
  if (!Number.isInteger(paymentDeadline) || paymentDeadline < 1 || paymentDeadline > 30) {
    issues.push('支払期限日数');
  }

  if (issues.length) {
    throw new Error(`設定シートの次の項目を確認してください：${[...new Set(issues)].join('、')}`);
  }
  return true;
}

function isTrustedEcUrl_(value) {
  return /^https:\/\/www\.kurume-naritasan\.or\.jp\/ec\//i.test(clean_(value));
}

function getFormRecords_(settings) {
  if (ANNUAL_RUNTIME_CACHE.formRecords) return ANNUAL_RUNTIME_CACHE.formRecords;
  const duplicates = new Set();
  const records = getSettingsRows_(settings).reduce((result, row) => {
    const key = clean_(row[0]);
    if (!ANNUAL.FORM_LABELS[key]) return result;
    if (Object.prototype.hasOwnProperty.call(result, key)) duplicates.add(key);
    result[key] = {
      key,
      eventName: clean_(row[1]),
      category: clean_(row[2]),
      formId: clean_(row[3]),
      publishedUrl: clean_(row[4]),
      editUrl: clean_(row[5]),
      status: clean_(row[6])
    };
    return result;
  }, {});
  if (duplicates.size) {
    throw new Error(`設定シートに重複したフォームキーがあります：${[...duplicates].join('、')}`);
  }
  const idSeen = new Set();
  const duplicateIds = new Set();
  Object.values(records).forEach(record => {
    if (!record.formId) return;
    if (idSeen.has(record.formId)) duplicateIds.add(record.formId);
    idSeen.add(record.formId);
    if (!['受付中', '停止'].includes(record.status)) {
      throw new Error(`設定シートの受付状態を「受付中」または「停止」にしてください：${record.key}`);
    }
  });
  if (duplicateIds.size) {
    throw new Error('設定シートで同じフォームIDが複数の法会に登録されています。');
  }
  ANNUAL_RUNTIME_CACHE.formRecords = records;
  return records;
}

function resolveFormContext_(settings, formId, config) {
  const record = Object.values(getFormRecords_(settings))
    .find(item => item.formId === clean_(formId));
  if (!record) throw new Error('送信元フォームを設定シートの専用フォーム一覧で確認できません。');

  const schedule = getScheduleRuleForForm_(settings, record.key);
  const fallbackYear = Number(config['受付対象年']);
  const year = schedule && Number.isInteger(Number(schedule.year))
    ? Number(schedule.year)
    : fallbackYear;
  if (!Number.isInteger(year) || year < 2025 || year > 2100) {
    throw new Error('申込対象年をフォーム連携情報から判定できません。');
  }
  return {
    year,
    eventName: record.eventName,
    category: record.category,
    key: record.key,
    label: ANNUAL.FORM_LABELS[record.key],
    status: record.status,
    schedule
  };
}

/**
 * フォーム連携情報の右側（H:N）に置いた法会日時・読経受付設定を読み込みます。
 * A:G = フォーム連携情報
 * H:N = 合同供養日 / 開始時刻 / 読経受付期間 / 読経時間帯 /
 *       予約間隔 / 予約不可日時 / 補足
 *
 * 年度は各フォーム行の「合同供養日」または「読経受付期間」から判定します。
 * これにより、秋彼岸2026を受付中のまま、春彼岸・お盆だけ2027日程を先に設定しても
 * 「フォーム設定を反映（日程・年・受付状態）」で翌年度設定が消えません。
 * 日付から判定できない場合だけ「受付対象年」を補助的に使います。
 */
function scheduleDateText_(rawValue, displayValue) {
  if (rawValue instanceof Date && !isNaN(rawValue.getTime())) {
    return Utilities.formatDate(rawValue, ANNUAL.TIMEZONE, 'yyyy/M/d');
  }
  return clean_(displayValue != null ? displayValue : rawValue);
}

function scheduleTimeText_(rawValue, displayValue) {
  if (rawValue instanceof Date && !isNaN(rawValue.getTime())) {
    return Utilities.formatDate(rawValue, ANNUAL.TIMEZONE, 'HH:mm');
  }
  return clean_(displayValue != null ? displayValue : rawValue);
}

function getScheduleRules_(settings) {
  if (ANNUAL_RUNTIME_CACHE.scheduleRules) return ANNUAL_RUNTIME_CACHE.scheduleRules;
  const range = settings.getDataRange();
  const rawValues = range.getValues();
  const displayValues = range.getDisplayValues();
  const config = getAnnualConfig_(settings);
  const fallbackYear = Number(config['受付対象年']);

  const linkedHeaderIndex = displayValues.findIndex(row =>
    clean_(row[0]) === 'フォームキー' &&
    clean_(row[1]) === '法会' &&
    clean_(row[2]) === '区分' &&
    clean_(row[7]) === '合同供養日' &&
    clean_(row[8]) === '開始時刻'
  );

  if (linkedHeaderIndex >= 0) {
    const rules = [];
    for (let i = linkedHeaderIndex + 1; i < displayValues.length; i++) {
      const displayRow = displayValues[i];
      const rawRow = rawValues[i] || [];
      const key = clean_(displayRow[0]);
      if (!key) break;
      if (!ANNUAL.FORM_LABELS[key]) continue;
      const eventName = clean_(displayRow[1]);
      const category = clean_(displayRow[2]);
      if (!eventName || !category) continue;

      const jointDate = scheduleDateText_(rawRow[7], displayRow[7]);
      const readingPeriod = clean_(displayRow[9] != null ? displayRow[9] : rawRow[9]);
      const inferredYear = inferScheduleYear_(rawRow[7] || jointDate, readingPeriod, fallbackYear);
      rules.push({
        key,
        year: inferredYear,
        eventName,
        category,
        jointDate,
        jointTime: scheduleTimeText_(rawRow[8], displayRow[8]),
        readingPeriod,
        readingWindow: clean_(displayRow[10] != null ? displayRow[10] : rawRow[10]),
        slot: clean_(displayRow[11] != null ? displayRow[11] : rawRow[11]),
        blocked: clean_(displayRow[12] != null ? displayRow[12] : rawRow[12]),
        note: clean_(displayRow[13] != null ? displayRow[13] : rawRow[13])
      });
    }
    ANNUAL_RUNTIME_CACHE.scheduleRules = rules;
    return rules;
  }

  // v11までの旧形式を読み取るフォールバック。
  const legacyHeaderIndex = displayValues.findIndex(row =>
    clean_(row[0]) === '対象年' &&
    clean_(row[1]) === '法会' &&
    clean_(row[2]) === '区分' &&
    clean_(row[3]) === '合同供養日'
  );
  if (legacyHeaderIndex < 0) {
    ANNUAL_RUNTIME_CACHE.scheduleRules = [];
    return ANNUAL_RUNTIME_CACHE.scheduleRules;
  }
  const rules = [];
  for (let i = legacyHeaderIndex + 1; i < displayValues.length; i++) {
    const displayRow = displayValues[i];
    const rawRow = rawValues[i] || [];
    const yearText = clean_(displayRow[0]);
    if (!yearText) break;
    const legacyYear = Number(yearText);
    const eventName = clean_(displayRow[1]);
    const category = clean_(displayRow[2]);
    if (!Number.isInteger(legacyYear) || !eventName || !category) continue;
    rules.push({
      key: '',
      year: legacyYear,
      eventName,
      category,
      jointDate: scheduleDateText_(rawRow[3], displayRow[3]),
      jointTime: scheduleTimeText_(rawRow[4], displayRow[4]),
      readingPeriod: clean_(displayRow[5]),
      readingWindow: clean_(displayRow[6]),
      slot: clean_(displayRow[7]),
      blocked: clean_(displayRow[8]),
      note: clean_(displayRow[9])
    });
  }
  ANNUAL_RUNTIME_CACHE.scheduleRules = rules;
  return rules;
}

function inferScheduleYear_(jointDate, readingPeriod, fallbackYear) {
  if (jointDate instanceof Date && !isNaN(jointDate.getTime())) {
    return Number(Utilities.formatDate(jointDate, ANNUAL.TIMEZONE, 'yyyy'));
  }
  const candidates = [jointDate, readingPeriod].map(clean_).filter(Boolean);
  for (const text of candidates) {
    const match = text.match(/(^|[^0-9])(20\d{2})[\/-]/);
    if (match) return Number(match[2]);
  }
  return Number.isInteger(Number(fallbackYear)) ? Number(fallbackYear) : 0;
}

function getScheduleRule_(settings, year, eventName, category) {
  return getScheduleRules_(settings).find(rule =>
    rule.year === Number(year) &&
    rule.eventName === clean_(eventName) &&
    rule.category === clean_(category)
  ) || null;
}

function getScheduleRuleForForm_(settings, formKey) {
  return getScheduleRules_(settings).find(rule => rule.key === clean_(formKey)) || null;
}

function getScheduleRuleForEventCategory_(settings, eventName, category) {
  return getScheduleRules_(settings).find(rule =>
    rule.eventName === clean_(eventName) && rule.category === clean_(category)
  ) || null;
}

function manualTargetYear_(settings, eventName, category, explicitYear) {
  const selected = Number(explicitYear);
  if (Number.isInteger(selected) && selected >= 2025 && selected <= 2100) return selected;
  const config = getAnnualConfig_(settings);
  const fallback = Number(config['受付対象年']);
  if (Number.isInteger(fallback) && fallback >= 2025 && fallback <= 2100) return fallback;
  const schedule = getScheduleRuleForEventCategory_(settings, eventName, category);
  return schedule && Number.isInteger(Number(schedule.year)) ? Number(schedule.year) : 0;
}

function manualAvailableYears_(settings, eventName, category) {
  const config = getAnnualConfig_(settings);
  const years = getScheduleRules_(settings)
    .filter(rule => rule.eventName === clean_(eventName) && rule.category === clean_(category))
    .map(rule => Number(rule.year));
  years.push(Number(config['受付対象年']));
  return [...new Set(years.filter(year => Number.isInteger(year) && year >= 2025 && year <= 2100))]
    .sort((a, b) => a - b);
}

function scheduleValueIsUnset_(value) {
  return ['', '未設定', '対象外', 'なし'].includes(clean_(value));
}

function parseScheduleDateKey_(value, fallbackYear) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Number(Utilities.formatDate(value, ANNUAL.TIMEZONE, 'yyyyMMdd'));
  }
  const raw = clean_(value);
  let match = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  let key = 0;
  if (match) {
    key = Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
  } else {
    match = raw.match(/^(\d{1,2})[\/-](\d{1,2})/);
    if (match && Number(fallbackYear)) {
      key = Number(fallbackYear) * 10000 + Number(match[1]) * 100 + Number(match[2]);
    }
  }
  return key && Number.isFinite(dateKeyToUtcMs_(key)) ? key : 0;
}

function parseScheduleDateRange_(value, fallbackYear) {
  const raw = clean_(value);
  if (scheduleValueIsUnset_(raw)) return null;
  const parts = raw.split(/[～〜~]/).map(part => clean_(part)).filter(Boolean);
  if (parts.length !== 2) return null;
  const start = parseScheduleDateKey_(parts[0], fallbackYear);
  const end = parseScheduleDateKey_(parts[1], fallbackYear);
  return start && end && start <= end ? { start, end } : null;
}

function parseScheduleTimeMinutes_(value) {
  if (Array.isArray(value) && value.length >= 2) {
    const h = Number(value[0]);
    const m = Number(value[1]);
    return Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59
      ? h * 60 + m : -1;
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    const h = Number(Utilities.formatDate(value, ANNUAL.TIMEZONE, 'H'));
    const m = Number(Utilities.formatDate(value, ANNUAL.TIMEZONE, 'm'));
    return h * 60 + m;
  }
  const raw = clean_(value);
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) return -1;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59 ? h * 60 + m : -1;
}

function parseScheduleTimeRange_(value) {
  const raw = clean_(value);
  if (scheduleValueIsUnset_(raw)) return null;
  const parts = raw.split(/[～〜~]/).map(part => clean_(part)).filter(Boolean);
  if (parts.length !== 2) return null;
  const start = parseScheduleTimeMinutes_(parts[0]);
  const end = parseScheduleTimeMinutes_(parts[1]);
  return start >= 0 && end >= 0 && start <= end ? { start, end } : null;
}

function parseScheduleSlotMinutes_(value) {
  const match = clean_(value).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function parseBlockedSchedule_(value, year) {
  const raw = clean_(value);
  if (!raw) return [];
  return raw.split(/[\n、,]/).map(part => clean_(part)).filter(Boolean).map(part => {
    const match = part.match(/(?:(20\d{2})[\/-])?(\d{1,2})[\/-](\d{1,2})\s+(\d{1,2}:\d{2})\s*[～〜~]\s*(\d{1,2}:\d{2})/);
    if (!match) return null;
    const y = Number(match[1]) || Number(year);
    const date = y * 10000 + Number(match[2]) * 100 + Number(match[3]);
    if (!Number.isFinite(dateKeyToUtcMs_(date))) return null;
    const start = parseScheduleTimeMinutes_(match[4]);
    const end = parseScheduleTimeMinutes_(match[5]);
    if (start < 0 || end < 0 || start >= end) return null;
    return { date, start, end };
  }).filter(Boolean);
}

function validateReadingSchedule_(application, schedule) {
  const issues = [];
  if (!application || application.attend !== '参列する' || !needsAltarReading_(application.requestType)) {
    return issues;
  }
  if (!schedule) {
    issues.push('読経受付日時が設定シートにありません');
    return issues;
  }

  const dateRange = parseScheduleDateRange_(schedule.readingPeriod, application.year);
  const timeRange = parseScheduleTimeRange_(schedule.readingWindow);
  const slotMinutes = parseScheduleSlotMinutes_(schedule.slot);
  const dateKey = parseScheduleDateKey_(application.readingDate, application.year);
  const timeMinutes = parseScheduleTimeMinutes_(application.readingTime);

  if (!dateRange || !timeRange || !slotMinutes) {
    issues.push('読経受付日時が設定シートで未設定です');
    return issues;
  }
  if (!dateKey || dateKey < dateRange.start || dateKey > dateRange.end) {
    issues.push(`読経希望日が受付期間外です（${schedule.readingPeriod}）`);
  }
  if (timeMinutes < timeRange.start || timeMinutes > timeRange.end) {
    issues.push(`読経希望時刻が受付時間外です（${schedule.readingWindow}）`);
  } else if ((timeMinutes - timeRange.start) % slotMinutes !== 0) {
    issues.push(`読経希望時刻は${schedule.slot}単位で指定してください`);
  }

  parseBlockedSchedule_(schedule.blocked, application.year).forEach(block => {
    if (dateKey === block.date && timeMinutes >= block.start && timeMinutes < block.end) {
      issues.push(`選択した読経希望日時は予約不可時間です（${schedule.blocked}）`);
    }
  });
  return issues;
}

function dateKeyToUtcMs_(key) {
  const n = Number(key);
  if (!n) return NaN;
  const y = Math.floor(n / 10000);
  const md = n % 10000;
  const m = Math.floor(md / 100);
  const d = md % 100;
  const ms = Date.UTC(y, m - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() + 1 !== m || check.getUTCDate() !== d) {
    return NaN;
  }
  return ms;
}

function localDateKey_(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!(date instanceof Date) || isNaN(date.getTime())) return 0;
  return Number(Utilities.formatDate(date, ANNUAL.TIMEZONE, 'yyyyMMdd'));
}

/** 参列希望は希望日の7日前まで。違反時は拒否せず「要確認」にします。 */
function validateReadingLeadTime_(application, receivedAt) {
  const issues = [];
  if (!application || application.attend !== '参列する' || !needsAltarReading_(application.requestType)) {
    return issues;
  }
  const readingKey = parseScheduleDateKey_(application.readingDate, application.year);
  const receivedKey = localDateKey_(receivedAt || application.timestamp || new Date());
  const readingMs = dateKeyToUtcMs_(readingKey);
  const receivedMs = dateKeyToUtcMs_(receivedKey);
  if (!Number.isFinite(readingMs) || !Number.isFinite(receivedMs)) return issues;
  const days = Math.floor((readingMs - receivedMs) / 86400000);
  if (days < 7) {
    issues.push('参列希望は読経希望日の1週間前までにお申し込みください');
  }
  return issues;
}

function scheduleRequiresSingleParty_(schedule) {
  return !!schedule && scheduleNoteSentences_(schedule.note).some(sentence => /1枠1組/.test(sentence));
}

/** 同じ法会・同じ日時に既存の参列予約があれば「要確認」にします。 */
function validateReadingSlotConflict_(appSh, application, schedule) {
  const issues = [];
  if (!appSh || !application ||
      !needsAltarReading_(application.requestType) || !scheduleRequiresSingleParty_(schedule)) {
    return issues;
  }

  // 「参列する」は申込者の希望枠、「寺院一任」は寺院側で確定した枠として扱います。
  // 寺院一任で日時が未確定なら、dateKey/timeMinutes の判定で従来どおり素通りします。
  if (!['参列する', '寺院一任'].includes(clean_(application.attend))) return issues;
  const dateKey = parseScheduleDateKey_(application.readingDate, application.year);
  const timeMinutes = parseScheduleTimeMinutes_(application.readingTime);
  const lastRow = lastDataRowByColumn_(appSh, 2);
  if (!dateKey || timeMinutes < 0 || lastRow < 2) return issues;

  // 受付状態（AD列）まで読めない古い構成でも、日時照合だけは行えるようにします。
  const width = Math.min(ANNUAL_V16.COL.RECEPTION_STATE, appSh.getMaxColumns());
  if (width < 18) return issues;
  const rows = appSh.getRange(2, 1, lastRow - 1, width).getValues();
  const conflict = rows.some(row => {
    const responseId = clean_(row[1]);
    if (!responseId || responseId === clean_(application.responseId)) return false;
    if (ANNUAL_V16.EXCLUDED_RECEPTION_STATES.includes(
      clean_(row[ANNUAL_V16.COL.RECEPTION_STATE - 1])
    )) return false;
    if (Number(row[3]) !== Number(application.year)) return false;       // D 対象年
    if (clean_(row[4]) !== clean_(application.eventName)) return false; // E 法会
    if (!['参列する', '寺院一任'].includes(clean_(row[15]))) return false; // P 読経参列
    const existingDate = parseScheduleDateKey_(row[16], application.year); // Q 読経日
    const existingTime = parseScheduleTimeMinutes_(row[17]);               // R 読経時刻
    return existingDate === dateKey && existingTime === timeMinutes;
  });
  if (conflict) issues.push('同じ読経日時に先約があります');
  return issues;
}

function scheduleDateLabel_(value, year) {
  const key = parseScheduleDateKey_(value, year);
  if (!key) return clean_(value);
  const y = Math.floor(key / 10000);
  const md = key % 10000;
  const m = Math.floor(md / 100);
  const d = md % 100;
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekdaysJa = ['日', '月', '火', '水', '木', '金', '土'];
  return `${y}年${m}月${d}日（${weekdaysJa[date.getUTCDay()]}）`;
}

function schedulePeriodLabel_(value, year) {
  const raw = clean_(value);
  const parts = raw.split(/[～〜~]/).map(part => clean_(part)).filter(Boolean);
  if (parts.length !== 2) return raw;
  return `${scheduleDateLabel_(parts[0], year)}～${scheduleDateLabel_(parts[1], year)}`;
}

function blockedScheduleLabel_(value, year) {
  const raw = clean_(value);
  if (!raw) return '';
  return raw.split(/[\n、,]/).map(part => clean_(part)).filter(Boolean).map(part => {
    const match = part.match(/(?:(20\d{2})[\/-])?(\d{1,2})[\/-](\d{1,2})\s+(\d{1,2}:\d{2})\s*[～〜~]\s*(\d{1,2}:\d{2})/);
    if (!match) return part;
    const y = Number(match[1]) || Number(year);
    const dateLabel = scheduleDateLabel_(`${y}/${match[2]}/${match[3]}`, y);
    return `${dateLabel} ${match[4]}～${match[5]}`;
  }).join('、');
}

function scheduleNoteSentences_(note) {
  return clean_(note).split(/[。\n]+/).map(x => clean_(x)).filter(Boolean);
}

function humanizeScheduleNote_(sentence, year) {
  let text = clean_(sentence);
  if (!text) return '';
  const ennichi = text.match(/(\d{1,2})[\/-](\d{1,2})は御縁日のため希望に沿えない場合あり/);
  if (ennichi) {
    const label = scheduleDateLabel_(`${year}/${ennichi[1]}/${ennichi[2]}`, year);
    return `${label}は御縁日のため、ご希望に沿えない場合があります`;
  }
  if (/参列なしは当山指定/.test(text)) {
    return '参列なし（寺院一任）の場合は、当山で日時を指定して読経します';
  }
  if (/参列希望は希望日の1週間前までに調整し、当日申込・当日参列は不可/.test(text)) {
    return '参列をご希望の場合は、希望日の1週間前までにお申し込みください。当日申込・当日参列はできません';
  }
  if (/参列希望は希望日の1週間前までに調整/.test(text)) {
    text = text.replace(/参列希望は希望日の1週間前までに調整/, '参列をご希望の場合は、希望日の1週間前までにお申し込みください');
  }
  if (/当日申込・当日参列は不可/.test(text)) {
    text = text.replace(/当日申込・当日参列は不可/, '当日申込・当日参列はできません');
  }
  return text;
}

function buildFormScheduleInfo_(schedule) {
  if (!schedule) return '法会日時は設定シートで未設定です。';
  const lines = [];
  if (!scheduleValueIsUnset_(schedule.jointDate)) {
    const joint = scheduleDateLabel_(schedule.jointDate, schedule.year);
    const time = scheduleValueIsUnset_(schedule.jointTime) ? '' : ` ${schedule.jointTime}開始`;
    lines.push(`【合同供養会】${joint}${time}`);
  } else {
    lines.push('【合同供養会】日時未設定');
  }

  if (schedule.category === '納骨壇' && !scheduleValueIsUnset_(schedule.readingPeriod)) {
    let reading = `【納骨壇前読経（参列希望の場合）】${schedulePeriodLabel_(schedule.readingPeriod, schedule.year)}`;
    if (!scheduleValueIsUnset_(schedule.readingWindow)) reading += ` ${schedule.readingWindow}`;
    const extras = [];
    if (!scheduleValueIsUnset_(schedule.slot)) extras.push(`${schedule.slot}間隔`);
    if (scheduleNoteSentences_(schedule.note).some(x => /1枠1組/.test(x))) extras.push('1枠1組');
    if (extras.length) reading += `（${extras.join('・')}）`;
    lines.push(reading);
    if (schedule.blocked) lines.push(`※${blockedScheduleLabel_(schedule.blocked, schedule.year)}は受付できません。`);
  }

  scheduleNoteSentences_(schedule.note).forEach(sentence => {
    if (/^1枠1組$/.test(sentence)) return;
    const text = humanizeScheduleNote_(sentence, schedule.year);
    if (text) lines.push(`※${text}。`);
  });
  return lines.join('\n');
}

function updateFormReadingHelp_(form, schedule) {
  const result = { dateItems: 0, timeItems: 0, typeIssues: [] };
  if (!form || !schedule) return result;
  const dateHelpParts = [];
  const timeHelpParts = [];

  if (!scheduleValueIsUnset_(schedule.readingPeriod)) {
    dateHelpParts.push('参列して読経を希望される日を選択してください。');
    dateHelpParts.push(`受付期間：${schedulePeriodLabel_(schedule.readingPeriod, schedule.year)}`);
  }

  scheduleNoteSentences_(schedule.note).forEach(sentence => {
    const text = humanizeScheduleNote_(sentence, schedule.year);
    if (!text) return;
    if (/御縁日|1週間前|当日申込|当日参列/.test(text)) dateHelpParts.push(`※${text}。`);
    if (/1枠1組/.test(text)) timeHelpParts.push('1枠1組');
  });

  if (!scheduleValueIsUnset_(schedule.readingWindow)) {
    timeHelpParts.unshift(`受付時間：${schedule.readingWindow}`);
  }
  if (!scheduleValueIsUnset_(schedule.slot)) timeHelpParts.push(`${schedule.slot}間隔`);
  if (schedule.blocked) {
    timeHelpParts.push(`※${blockedScheduleLabel_(schedule.blocked, schedule.year)}は受付できません。`);
  }
  if (!scheduleValueIsUnset_(schedule.readingWindow)) {
    timeHelpParts.push('※先約がある場合は、寺院から日時変更のご連絡を差し上げます。');
  }

  form.getItems().forEach(item => {
    const title = clean_(item.getTitle());
    if (title === '読経希望日') {
      if (item.getType() === FormApp.ItemType.DATE) {
        item.asDateItem().setHelpText(dateHelpParts.join('\n'));
        result.dateItems++;
      } else {
        result.typeIssues.push('「読経希望日」の設問形式が日付ではありません');
      }
    }
    if (title === '読経希望時刻') {
      if (item.getType() === FormApp.ItemType.TIME) {
        item.asTimeItem().setHelpText(timeHelpParts.join('\n'));
        result.timeItems++;
      } else {
        result.typeIssues.push('「読経希望時刻」の設問形式が時刻ではありません');
      }
    }
  });
  return result;
}

function upsertFormScheduleHeader_(form, schedule) {
  const title = '法会日時のご案内';
  const info = buildFormScheduleInfo_(schedule);
  const existing = form.getItems(FormApp.ItemType.SECTION_HEADER)
    .filter(item => clean_(item.getTitle()) === title);
  let header;
  if (existing.length) {
    header = existing[0].asSectionHeaderItem();
  } else {
    header = form.addSectionHeaderItem().setTitle(title);
    try {
      form.moveItem(header.getIndex(), 0);
    } catch (error) {
      // 順序変更に失敗しても案内自体は残します。
    }
  }
  header.setHelpText(info);
  return { headerCount: existing.length || 1, duplicateHeaders: Math.max(0, existing.length - 1) };
}

function updateFormTargetConfirmation_(form, schedule, formKey) {
  const title = '申込対象の確認';
  const expected = `${schedule.year}年 ${ANNUAL.FORM_LABELS[formKey]}に申し込みます`;
  let updated = 0;
  const issues = [];
  form.getItems().forEach(item => {
    if (clean_(item.getTitle()) !== title) return;
    try {
      if (item.getType() === FormApp.ItemType.CHECKBOX) {
        item.asCheckboxItem().setChoiceValues([expected]);
        updated++;
      } else if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
        item.asMultipleChoiceItem().setChoiceValues([expected]);
        updated++;
      } else {
        issues.push('「申込対象の確認」の設問形式を確認してください');
      }
    } catch (error) {
      issues.push(`「申込対象の確認」の更新失敗：${error.message}`);
    }
  });
  if (!updated) issues.push('「申込対象の確認」が見つかりません');
  return { updated, issues };
}

function syncFormAcceptingStatus_(form, record) {
  const shouldAccept = clean_(record.status) === '受付中';
  if (form.isAcceptingResponses() !== shouldAccept) {
    form.setAcceptingResponses(shouldAccept);
  }
  return shouldAccept;
}

/** 日程設定が不完全なフォームは、設定シートが「受付中」でも安全のため開きません。 */
function syncFormAcceptingStatusSafely_(form, record, scheduleIssues) {
  const wantsOpen = clean_(record.status) === '受付中';
  if (wantsOpen && (scheduleIssues || []).length) {
    if (form.isAcceptingResponses()) form.setAcceptingResponses(false);
    return { accepting: false, blocked: true };
  }
  return { accepting: syncFormAcceptingStatus_(form, record), blocked: false };
}

function validateScheduleConfig_(record, schedule) {
  const issues = [];
  if (!schedule || !Number.isInteger(Number(schedule.year))) {
    issues.push('対象年を判定できません');
    return issues;
  }
  if (!parseScheduleDateKey_(schedule.jointDate, schedule.year)) {
    issues.push('合同供養日を確認してください');
  }
  if (parseScheduleTimeMinutes_(schedule.jointTime) < 0) {
    issues.push('合同供養の開始時刻を確認してください');
  }
  if (record.category === '納骨壇') {
    if (!parseScheduleDateRange_(schedule.readingPeriod, schedule.year)) {
      issues.push('読経受付期間を確認してください');
    }
    if (!parseScheduleTimeRange_(schedule.readingWindow)) {
      issues.push('読経時間帯を確認してください');
    }
    if (!parseScheduleSlotMinutes_(schedule.slot)) {
      issues.push('予約間隔を確認してください');
    }
    if (!scheduleValueIsUnset_(schedule.blocked) &&
        !parseBlockedSchedule_(schedule.blocked, schedule.year).length) {
      issues.push('予約不可日時の書式を確認してください');
    }
  }
  return issues;
}

/**
 * 設定シートの法会日時・読経受付時間を3つのGoogleフォームへ反映します。
 * 回答列を壊さないよう、既存設問は削除・作り直しません。
 */
function syncFormScheduleInfo() {
  const ui = SpreadsheetApp.getUi();
  let ss;
  try {
    resetAnnualRuntimeCache_();
    ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
    const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
    const config = getAnnualConfig_(settings);
    const records = Object.values(getFormRecords_(settings)).filter(record => record.formId);
    const results = [];

    records.forEach(record => {
      const schedule = getScheduleRuleForForm_(settings, record.key);
      const form = FormApp.openById(record.formId);
      const warnings = [];
      const scheduleIssues = validateScheduleConfig_(record, schedule);
      const acceptingResult = syncFormAcceptingStatusSafely_(form, record, scheduleIssues);

      if (scheduleIssues.length) {
        scheduleIssues.forEach(issue => warnings.push(issue));
        if (acceptingResult.blocked) warnings.push('日程設定に不備があるためフォーム受付を開始していません');
      } else {
        const headerResult = upsertFormScheduleHeader_(form, schedule);
        const helpResult = updateFormReadingHelp_(form, schedule);
        const confirmResult = updateFormTargetConfirmation_(form, schedule, record.key);

        if (headerResult.duplicateHeaders) {
          warnings.push(`「法会日時のご案内」が${headerResult.headerCount}件あります`);
        }
        if (record.category === '納骨壇' &&
            (!scheduleValueIsUnset_(schedule.readingPeriod) || !scheduleValueIsUnset_(schedule.readingWindow))) {
          if (helpResult.dateItems !== 1) warnings.push(`読経希望日=${helpResult.dateItems}件`);
          if (helpResult.timeItems !== 1) warnings.push(`読経希望時刻=${helpResult.timeItems}件`);
        }
        helpResult.typeIssues.forEach(issue => warnings.push(issue));
        confirmResult.issues.forEach(issue => warnings.push(issue));
      }

      const desiredState = clean_(record.status) === '受付中' ? '受付中' : '停止';
      const actualState = acceptingResult.accepting ? '受付中' : '停止';
      const stateLabel = desiredState === actualState ? actualState : `${desiredState}指定→安全停止`;
      results.push(
        `${record.eventName}・${record.category}：${schedule && !scheduleIssues.length ? `${schedule.year}年を反映` : '日時設定を要確認'}／${stateLabel}` +
        (warnings.length ? `／要確認：${warnings.join('、')}` : '')
      );
    });

    showAnnualStatus_(ss, 'フォームの日時・対象年・受付状態を反映しました。', 8);
    ui.alert(
      'フォームへの設定反映が完了しました。\n\n' + results.join('\n') +
      '\n\n反映対象は「法会日時のご案内」「読経希望日・時刻の補足」「申込対象の確認」「受付中／停止」です。' +
      '\nその他の手動編集した設問・選択肢・セクションは作り直しません。'
    );
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    if (ss) showAnnualStatus_(ss, `日時反映に失敗しました：${detail}`, 15);
    ui.alert(
      'フォームへの法会日時反映に失敗しました。\n\n' + detail +
      '\n\nフォーム所有者のアカウントで実行し、初回の権限承認を行ってください。'
    );
    throw error;
  }
}

function normalizeRequestType_(value, category) {
  if (category === '一般') return '合同供養のみ';
  const raw = clean_(value);
  if (raw.includes('納骨壇前読経のみ') || raw.includes('読経のみ')) return '納骨壇前読経のみ';
  if (raw.includes('合同供養のみ')) return '合同供養のみ';
  // clean_ のNFKC正規化で全角＋は半角+になるため、両方の表記を受け取ります。
  if (raw.includes('合同供養+') || raw.includes('合同供養＋') ||
      (raw.includes('合同供養') && raw.includes('読経') && !raw.includes('読経なし'))) {
    return '合同供養＋納骨壇前読経';
  }
  return raw;
}

function normalizeAttendance_(value, requestType) {
  if (requestType === '合同供養のみ') return '読経なし';
  const raw = clean_(value);
  if (raw.includes('寺院一任')) return '寺院一任';
  if (raw.includes('参列する')) return '参列する';
  return raw;
}

function needsAltarReading_(requestType) {
  return ['合同供養＋納骨壇前読経', '納骨壇前読経のみ'].includes(String(requestType || ''));
}

function isAllowedManualRequestType_(category, requestType) {
  const normalized = normalizeRequestType_(requestType, category);
  return category === '一般'
    ? normalized === '合同供養のみ'
    : ['合同供養のみ', '合同供養＋納骨壇前読経', '納骨壇前読経のみ'].includes(normalized);
}

function initialPaymentStatus_(issues) {
  // 内容の確認要否と入金状態は別管理です。内容に問題があっても未納は未入金として表示します。
  return '未入金';
}

/**
 * 壇前読経はフォームに入力された一部の方だけでなく、
 * 納骨壇名簿上で同じ契約者・壇に登録されている現在納骨者全員を対象にします。
 */
function buildReadingTargetsFromMaster_(application, master) {
  if (application.category !== '納骨壇' || !needsAltarReading_(application.requestType)) {
    return { targets: [], issues: [] };
  }
  if (!master.length) {
    return {
      targets: [{
        altar: '', altarType: '', number: '', name: '名簿要確認', type: '未照合',
        issue: '読経対象者を納骨壇名簿で確認できません'
      }],
      issues: []
    };
  }

  const altarKeys = [...new Set(master.map(row => [row[6], row[7], row[8]].map(clean_).join('|')))];
  const issues = altarKeys.length > 1
    ? ['同一契約者に複数の納骨壇があるため読経対象壇を確認してください']
    : [];
  const targets = master.map(row => {
    const secular = clean_(row[2]);
    const dharma = clean_(row[4]);
    const name = dharma || secular;
    const altar = clean_(row[6]);
    const altarType = clean_(row[7]);
    const number = clean_(row[8]);
    return {
      altar,
      altarType,
      number,
      name: name || '読経名未設定',
      type: dharma ? '戒名' : (secular ? '俗名' : '未設定'),
      issue: name ? '' : '納骨壇名簿の読経名が空欄'
    };
  });
  return { targets, issues };
}

function validateApplication_(application) {
  const issues = [];
  const {
    year, eventName, category, contractor, sponsor, phone, requestType, memorials,
    attend, readingDate, readingTime, paymentRaw, email, obonConfirmation,
    formConfirmation, expectedFormConfirmation
  } = application;
  if (!Number.isInteger(year) || year < 2025 || year > 2100) issues.push('対象年が不正');
  if (!['春彼岸', 'お盆', '秋彼岸'].includes(eventName)) issues.push('法会が不正');
  if (!['納骨壇', '一般'].includes(category)) issues.push('申込区分が不正');
  if (eventName !== 'お盆' && category !== '納骨壇') issues.push('彼岸は納骨壇契約者のみ');
  if (category === '納骨壇' && !contractor) issues.push('契約者名が空欄');
  if (!sponsor) issues.push('施主名が空欄');
  if (!phone) issues.push('電話番号が空欄');
  if (!email) issues.push('回答者メールアドレスが空欄');
  if (eventName === 'お盆' && obonConfirmation !== '今回の申込みは初盆ではありません') {
    issues.push('初盆受付の確認が不一致');
  }
  if (requestType === '納骨壇前読経のみ') {
    if (memorials.length) issues.push('読経のみの申込に合同供養の供養内容があります');
  } else if (!memorials.length) {
    issues.push('供養内容が空欄');
  }
  if (!paymentRaw) issues.push('支払方法が空欄');
  if (formConfirmation !== expectedFormConfirmation) issues.push('申込対象の確認が不一致');
  const allowedPayments = ['銀行振込', 'クレジット決済', 'コンビニ決済', '当日現地にてお支払い'];
  if (paymentRaw && !allowedPayments.includes(paymentRaw)) issues.push('支払方法が不正');

  const allowedRequests = category === '一般'
    ? ['合同供養のみ']
    : ['合同供養のみ', '合同供養＋納骨壇前読経', '納骨壇前読経のみ'];
  if (!allowedRequests.includes(requestType)) issues.push('ご希望の供養が不正');

  if (requestType === '合同供養のみ') {
    if (attend !== '読経なし' || hasValue_(readingDate) || hasValue_(readingTime)) {
      issues.push('合同供養のみの申込に読経情報があります');
    }
  } else {
    if (!['参列する', '寺院一任'].includes(attend)) issues.push('読経への参列方法が未選択');
    if (attend === '参列する' && (!hasValue_(readingDate) || !hasValue_(readingTime))) {
      issues.push('参列する場合は読経希望日時が必須');
    }
    if (attend === '寺院一任' && (hasValue_(readingDate) || hasValue_(readingTime))) {
      issues.push('寺院一任の申込に読経希望日時があります');
    }
  }
  if (hasValue_(readingDate)) {
    const readingYear = dateYear_(readingDate);
    if (readingYear && readingYear !== year) issues.push('読経希望日が申込対象年と一致しません');
  }
  return issues;
}

function hasValue_(value) {
  return value !== '' && value != null;
}

/** 日付・時刻のどちらか片方だけが入力されている状態を検出します。 */
function hasPartialReadingDateTime_(readingDate, readingTime) {
  return hasValue_(readingDate) !== hasValue_(readingTime);
}

function dateYear_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Number(Utilities.formatDate(value, ANNUAL.TIMEZONE, 'yyyy'));
  }
  const match = clean_(value).match(/^(\d{4})[\/-]/);
  return match ? Number(match[1]) : 0;
}

function isOnlinePayment_(paymentRaw) {
  return /クレジット|コンビニ|オンライン/.test(clean_(paymentRaw));
}

/**
 * EC決済の商品ページが必要なのは、納骨壇契約者の通常申込だけです。
 * 一般のお盆供養と初盆は「受付入力」で受け、EC商品を持たないため対象外にします。
 */
function requiresEcProductUrl_(application) {
  if (!application || !isOnlinePayment_(application.paymentRaw)) return false;
  if (application.firstObon || clean_(application.requestType) === '初盆供養') return false;
  return clean_(application.category) === '納骨壇';
}

/**
 * 志納料表は「法会」「対象区分」の名称で照合します。
 * 固定範囲を見ないため、設定シートに行を足しても金額がずれません。
 */
function getFeeRows_(ss) {
  if (ANNUAL_RUNTIME_CACHE.feeRows) return ANNUAL_RUNTIME_CACHE.feeRows;
  const sh = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const lastRow = sh.getLastRow();
  ANNUAL_RUNTIME_CACHE.feeRows = lastRow >= 5
    ? sh.getRange(5, 1, lastRow - 4, 5).getValues()
    : [];
  return ANNUAL_RUNTIME_CACHE.feeRows;
}

function getFeeRule_(ss, eventName, category) {
  const row = getFeeRows_(ss).find(item =>
    clean_(item[0]) === clean_(eventName) && clean_(item[1]) === clean_(category)
  );
  if (!row) return null;
  return {
    joint: Number(row[2]) || 0,
    addReading: Number(row[3]) || 0,
    readingOnly: Number(row[4]) || 0
  };
}

function getFirstObonFee_(ss) {
  const row = getFeeRows_(ss).find(item =>
    clean_(item[0]) === 'お盆' && clean_(item[1]).includes('初盆')
  );
  return row ? Number(row[2]) || 0 : 0;
}

function calculateFeeFromRule_(rule, requestType, count) {
  if (!rule) return 0;
  if (requestType === '納骨壇前読経のみ') return rule.readingOnly;
  return rule.joint * count + (requestType === '合同供養＋納骨壇前読経' ? rule.addReading : 0);
}

function buildPaymentPlan_(ss, config, application, total) {
  // 初盆は志納料が1件20,000円の固定で、EC商品も持ちません。
  if (application.firstObon || clean_(application.requestType) === '初盆供養') {
    return {
      total,
      items: [{
        label: `${application.eventName} 初盆供養`,
        quantity: 1,
        unitPrice: Number(total) || 0,
        url: ''
      }]
    };
  }

  const rule = getFeeRule_(ss, application.eventName, application.category) || {
    joint: 0, addReading: 0, readingOnly: 0
  };
  const count = application.memorials.length;
  const items = [];
  if (application.requestType !== '納骨壇前読経のみ') {
    items.push({
      label: `${application.eventName}${application.category === '一般' ? '一般供養' : '合同供養'}`,
      quantity: count,
      unitPrice: rule.joint,
      url: productUrl_(config, application, 'joint')
    });
  }
  if (application.requestType === '合同供養＋納骨壇前読経') {
    items.push({
      label: '合同供養と併せる納骨壇前読経',
      quantity: 1,
      unitPrice: rule.addReading,
      url: productUrl_(config, application, 'addReading')
    });
  }
  if (application.requestType === '納骨壇前読経のみ') {
    items.push({
      label: `${application.eventName} 納骨壇前読経のみ`,
      quantity: 1,
      unitPrice: rule.readingOnly,
      url: productUrl_(config, application, 'readingOnly')
    });
  }
  return { total, items };
}

function productUrl_(config, application, kind) {
  // 一般のお盆供養は職員用「受付入力」で完結し、フォーム決済URLは使用しません。
  if (application.category === '一般') return '';
  if (application.eventName === 'お盆') {
    const keys = {
      joint: 'お盆・納骨壇・合同供養URL',
      addReading: 'お盆・納骨壇・併申込読経URL',
      readingOnly: 'お盆・納骨壇・読経のみURL'
    };
    return clean_(config[keys[kind]]);
  }
  if (kind === 'joint') return clean_(config[`${application.eventName}・合同供養URL`]);
  if (kind === 'addReading') return clean_(config['彼岸・併申込読経URL']);
  return clean_(config['彼岸・読経のみURL']);
}

function sendAnnualMemorialEmails_(config, application) {
  if (!asBoolean_(config['自動返信有効'])) return [];
  const mailIssues = [];
  const temple = clean_(config['寺院通知先']);
  const requiredRecipients = (temple ? 1 : 0) + (application.email ? 1 : 0);
  if (MailApp.getRemainingDailyQuota() < requiredRecipients) {
    return ['メール送信上限のため自動通知できませんでした'];
  }

  const number = applicationNumber_(application);
  if (temple) {
    try {
      const html = buildTempleEmailHtml_(application, number);
      sendHtmlMail_(temple, `【${application.status}】${application.year}年${application.eventName}供養 ${application.sponsor}様`, html, temple);
    } catch (err) {
      mailIssues.push(`寺院通知メール送信失敗: ${err.message}`);
    }
  } else {
    mailIssues.push('寺院通知先が未設定');
  }

  if (application.email) {
    try {
      const html = buildApplicantEmailHtml_(config, application, number);
      const prefix = application.issues.length ? '【受付内容確認中】' : '【受付完了】';
      sendHtmlMail_(
        application.email,
        `${prefix}${application.year}年${application.eventName}供養のお申し込み`,
        html,
        temple
      );
    } catch (err) {
      mailIssues.push(`回答者メール送信失敗: ${err.message}`);
    }
  } else {
    mailIssues.push('回答者メールアドレスが空欄');
  }
  return mailIssues;
}

function buildApplicantEmailHtml_(config, application, number) {
  const rows = applicationSummaryRows_(application, number);
  const summary = htmlTable_(rows);
  const paymentAvailable = hasUsablePaymentInstructions_(config, application);
  const confirmationNotice = application.issues.length
    ? `<div style="padding:14px;background:#fff4e5;border-left:5px solid #d97706;">` +
      '<strong>申込内容に、寺院での確認事項があります。</strong><br>' +
      (paymentAvailable
        ? '寺院でも内容を確認しますが、ご選択のお支払い方法の案内を下記に記載しています。' +
          '案内に沿ってお手続きください。追加の確認が必要な場合は寺院からご連絡します。'
        : '寺院で申込内容と支払案内を確認し、必要な場合はご連絡します。') +
      '</div>'
    : '';
  const paymentInstructions = buildPaymentInstructionsHtml_(config, application);
  return '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;line-height:1.7;color:#222;max-width:720px;">' +
    `<p>${escapeHtml_(application.sponsor)} 様</p>` +
    '<p>この度はご供養のお申し込みをいただき、ありがとうございます。</p>' +
    summary + confirmationNotice + paymentInstructions +
    '<p>その他ご不明な点がございましたら、成田山久留米分院までご連絡ください。</p>' +
    '<hr><p>大本山 成田山 久留米分院<br>〒830-0052 福岡県久留米市上津町1386-22<br>' +
    `電話：${escapeHtml_(config['寺院電話'] || '0942-21-7500')}</p></div>`;
}

function hasUsablePaymentInstructions_(config, application) {
  if (!Number.isFinite(Number(application.fee)) || Number(application.fee) <= 0) return false;
  const payment = clean_(application.paymentRaw);
  if (payment.includes('銀行') || payment.includes('当日')) return true;
  if (!isOnlinePayment_(payment)) return false;
  const items = application.paymentPlan && Array.isArray(application.paymentPlan.items)
    ? application.paymentPlan.items : [];
  if (items.length > 0 && items.every(item => !!clean_(item.url))) return true;
  return ['銀行名', '支店名', '口座種別', '口座番号', '口座名義']
    .every(key => clean_(config && config[key]));
}

function buildTempleEmailHtml_(application, number) {
  const rows = applicationSummaryRows_(application, number).concat([
    ['回答者メール', application.email],
    ['電話番号', application.phone],
    ['判定', application.status],
    ['確認事項', application.issues.join('／') || 'なし'],
    ['連絡事項', application.note || 'なし']
  ]);
  return '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;line-height:1.6;max-width:760px;">' +
    `<h2>${escapeHtml_(application.year)}年 ${escapeHtml_(application.eventName)} 供養申込</h2>` +
    htmlTable_(rows) + '</div>';
}

function applicationSummaryRows_(application, number) {
  const attendance = application.attend === '読経なし' ? '読経なし' : application.attend;
  const memorialSummary = application.requestType === '納骨壇前読経のみ'
    ? '納骨壇名簿上の現在納骨者全員'
    : application.memorials.join('、');
  const dateTime = hasValue_(application.readingDate) && hasValue_(application.readingTime)
    ? `${displayDate_(application.readingDate)} ${displayTime_(application.readingTime)}`.trim()
    : (application.attend === '寺院一任' ? '寺院にて調整' : '―');
  return [
    ['受付番号', number],
    ['対象法会', `${application.year}年 ${application.eventName}`],
    ['申込区分', application.category],
    ['契約者名', application.contractor || '―'],
    ['施主名', application.sponsor],
    ['ご希望の供養', application.requestType],
    ['供養内容', memorialSummary],
    ['読経への参列', attendance],
    ['読経希望日時', dateTime],
    ['お支払い方法', application.paymentRaw],
    ['志納料合計', formatYen_(application.fee)]
  ];
}

function buildPaymentInstructionsHtml_(config, application) {
  const deadline = Number(config['支払期限日数']) || 5;
  let body = '<h3 style="margin-top:28px;">お支払いについて</h3>';
  if (!Number.isFinite(Number(application.fee)) || Number(application.fee) <= 0) {
    return body + '<p>志納料を確定できないため、寺院からの確認連絡をお待ちください。</p>';
  }
  if (application.paymentRaw.includes('銀行')) {
    body += `<p>申込日から<strong>${deadline}日以内</strong>に、合計<strong>${formatYen_(application.fee)}</strong>をお振り込みください。</p>` +
      '<div style="padding:12px;background:#f5f5f5;">' +
      `${escapeHtml_(config['銀行名'])} ${escapeHtml_(config['支店名'])}<br>` +
      `${escapeHtml_(config['口座種別'])}　口座番号 ${escapeHtml_(config['口座番号'])}<br>` +
      `${escapeHtml_(config['口座名義'])}</div>` +
      '<p>振込手数料は申込者様にてご負担ください。</p>';
    return body;
  }
  if (isOnlinePayment_(application.paymentRaw)) {
    const items = application.paymentPlan && Array.isArray(application.paymentPlan.items)
      ? application.paymentPlan.items : [];
    if (!items.length || items.some(item => !clean_(item.url))) {
      const bankReady = ['銀行名', '支店名', '口座種別', '口座番号', '口座名義']
        .every(key => clean_(config[key]));
      if (!bankReady) {
        return body + '<p>オンライン決済の商品ページを確認できないため、寺院からの案内をお待ちください。</p>';
      }
      return body +
        '<p>オンライン決済の商品ページを確認中です。お急ぎの場合は、下記の銀行振込をご利用いただけます。</p>' +
        `<p>申込日から<strong>${deadline}日以内</strong>に、合計<strong>${formatYen_(application.fee)}</strong>をお振り込みください。</p>` +
        '<div style="padding:12px;background:#f5f5f5;">' +
        `${escapeHtml_(config['銀行名'])} ${escapeHtml_(config['支店名'])}<br>` +
        `${escapeHtml_(config['口座種別'])}　口座番号 ${escapeHtml_(config['口座番号'])}<br>` +
        `${escapeHtml_(config['口座名義'])}</div>` +
        '<p>振込手数料は申込者様にてご負担ください。</p>';
    }
    body += `<p>申込日から<strong>${deadline}日以内</strong>に、下記の商品を数量どおりお申し込みください。</p>`;
    if (clean_(config['EC会員登録URL'])) {
      body += `<p><a href="${escapeAttribute_(config['EC会員登録URL'])}" style="display:inline-block;padding:10px 16px;background:#555;color:white;text-decoration:none;border-radius:4px;">初回の会員登録</a></p>`;
    }
    items.forEach(item => {
      body += '<div style="margin:12px 0;padding:12px;border:1px solid #ddd;border-radius:6px;">' +
        `<strong>${escapeHtml_(item.label)}</strong><br>` +
        `${formatYen_(item.unitPrice)} × ${item.quantity}点 ＝ ${formatYen_(item.unitPrice * item.quantity)}<br>` +
        `<a href="${escapeAttribute_(item.url)}" style="display:inline-block;margin-top:8px;padding:9px 14px;background:#7a1f1f;color:white;text-decoration:none;border-radius:4px;">この商品を申し込む</a>` +
        '</div>';
    });
    body += `<p><strong>合計：${formatYen_(application.fee)}</strong></p>`;
    return body;
  }
  if (application.paymentRaw.includes('当日')) {
    return body + `<p>法会当日、本堂受付にて合計<strong>${formatYen_(application.fee)}</strong>をお納めください。</p>`;
  }
  return body + '<p>選択された支払方法を確認できないため、寺院からの案内をお待ちください。</p>';
}

function sendHtmlMail_(to, subject, html, replyTo) {
  const options = {
    to,
    subject,
    body: stripHtml_(html),
    htmlBody: html,
    name: '大本山 成田山 久留米分院'
  };
  if (clean_(replyTo)) options.replyTo = clean_(replyTo);
  MailApp.sendEmail(options);
}

function markMailIssues_(rawSh, rawRow, appSh, appRow, mailIssues) {
  const text = mailIssues.join('／');
  // メール失敗は申込内容の判定を変えず、「通知状態」で管理します。
  rawSh.getRange(rawRow, 25).setValue(appendText_(rawSh.getRange(rawRow, 25).getValue(), text));
  appSh.getRange(appRow, 25).setValue(appendText_(appSh.getRange(appRow, 25).getValue(), text));
  updateApplicationNoticeState_(appSh, appRow, '送信失敗');
}

function htmlTable_(rows) {
  return '<table style="border-collapse:collapse;width:100%;margin:16px 0;">' + rows.map(row =>
    '<tr><th style="border:1px solid #ddd;padding:8px;text-align:left;background:#f6f3ef;width:34%;">' +
    `${escapeHtml_(row[0])}</th><td style="border:1px solid #ddd;padding:8px;">${escapeHtml_(row[1])}</td></tr>`
  ).join('') + '</table>';
}

function applicationNumber_(application) {
  return `${application.year}-${clean_(application.responseId).slice(-10).toUpperCase()}`;
}

function displayDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, ANNUAL.TIMEZONE, 'yyyy/MM/dd');
  }
  return clean_(value);
}

function displayTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, ANNUAL.TIMEZONE, 'HH:mm');
  }
  return clean_(value);
}

function formatYen_(value) {
  return `${Number(value || 0).toLocaleString('ja-JP')}円`;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '<br>');
}

function escapeAttribute_(value) {
  const url = clean_(value);
  return /^https:\/\//i.test(url) ? escapeHtml_(url) : '';
}

function stripHtml_(html) {
  return String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>|<\/div>|<\/tr>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function asBoolean_(value) {
  return value === true || ['true', 'yes', '1', '有効'].includes(clean_(value).toLowerCase());
}

function ensureWorkSheetSchema_(ss) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.WORK);
  const headers = [
    '判定', '対象年', '法会', '区分', '申込ID', '枝番',
    '札記載施主名', '札記載供養名', '表記種別', '初盆',
    '札種別', '廻向証必要', '最終照合',
    '札・塔婆作成済', '廻向証作成済', '短冊作成済',
    '契約者名', '入力供養内容', '要確認理由', '受付日時',
    '受付状態', '入金状態', '督促状態'
  ];
  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }

  const currentHeaders = sh.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  const schemaReady = currentHeaders.every((value, index) => clean_(value) === headers[index]);
  if (schemaReady) return sh;

  // 旧17列構造から新20列構造へ移行する場合だけ、既存データを読み直します。
  if (sh.getLastRow() >= 2) {
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 20).getValues();
    rows.forEach((row, index) => {
      const applicationId = clean_(row[4]);
      if (!applicationId) return;
      const hasNewTimestamp = hasValue_(row[19]); // T
      const legacyTimestamp = row[16];             // 旧Q
      const legacyTailLooksUsed = hasValue_(legacyTimestamp) &&
        !(typeof row[13] === 'boolean' && typeof row[14] === 'boolean' && typeof row[15] === 'boolean');
      if (hasNewTimestamp || !legacyTailLooksUsed) return;
      sh.getRange(index + 2, 14, 1, 7).setValues([[
        false, false, false,
        row[13] || '', row[14] || '', row[15] || '', legacyTimestamp
      ]]);
    });
  }

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  const maxRows = Math.max(2, sh.getMaxRows());
  const boolRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();
  sh.getRange(2, 14, maxRows - 1, 3).setDataValidation(boolRule);
  sh.getRange(2, 20, maxRows - 1, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(2, 17, maxRows - 1, 3).setWrap(true);
  const receptionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['受付中', '保留', '取消', '重複', 'テスト'], true)
    .setAllowInvalid(false).build();
  const paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ANNUAL_V16.PAYMENT_STATUSES, true)
    .setAllowInvalid(false).build();
  const reminderRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['未督促', '案内済', '再案内済', '連絡不要'], true)
    .setAllowInvalid(false).build();
  sh.getRange(2, 21, maxRows - 1, 1).setDataValidation(receptionRule);
  sh.getRange(2, 22, maxRows - 1, 1).setDataValidation(paymentRule);
  sh.getRange(2, 23, maxRows - 1, 1).setDataValidation(reminderRule);
  return sh;
}

function appendText_(current, addition) {
  return [clean_(current), clean_(addition)].filter(Boolean).join('\n');
}

function uniqueTexts_(values) {
  return [...new Set((values || []).map(clean_).filter(Boolean))];
}

function isContractorDerivedIssue_(issue) {
  const text = clean_(issue);
  return [
    '契約者名が空欄',
    '契約者名を名簿で確認できません',
    '読経対象者を納骨壇名簿で確認できません',
    '同一契約者に複数の納骨壇があるため読経対象壇を確認してください',
    '納骨壇名簿の読経名が空欄'
  ].includes(text) || /^供養名「.*」(?:を名簿で確認できません|が名簿で複数一致)$/.test(text);
}

function isCorrectionAuditLine_(value) {
  return /^(?:契約者名修正|申込者名修正|供養内容修正|読経内容修正|申込内容修正)[:：]/.test(clean_(value));
}

function isCorrectionRecheckIssue_(issue) {
  const text = clean_(issue);
  if (isContractorDerivedIssue_(text)) return true;
  return [
    '供養内容が空欄',
    '読経のみの申込に合同供養の供養内容があります',
    'ご希望の供養が不正',
    '合同供養のみの申込に読経情報があります',
    '読経への参列方法が未選択',
    '参列する場合は読経希望日時が必須',
    // 旧版で付与された要確認理由も訂正時に取り除けるよう残します。
    '寺院一任の申込に読経希望日時があります',
    '寺院一任の確定日時は日付・時刻を両方入力してください',
    '読経希望日が申込対象年と一致しません',
    '読経受付日時が設定シートにありません',
    '読経受付日時が設定シートで未設定です',
    '同じ読経希望日時に先約があります',
    '同じ読経日時に先約があります',
    '参列希望は読経希望日の1週間前までにお申し込みください',
    '志納料設定が不正',
    'オンライン決済の商品URLが未設定',
    '志納料が変更されています。入金額を確認してください',
    '初盆対象者の俗名または戒名を確認してください',
    '同じ法会・同じ申込者・同じ供養内容の受付が既にあります（重複要確認）'
  ].includes(text) ||
    /^読経希望日が受付期間外です/.test(text) ||
    /^読経希望時刻が受付時間外です/.test(text) ||
    /^読経希望時刻は.*単位で指定してください/.test(text) ||
    /^選択した読経希望日時は予約不可時間です/.test(text) ||
    /^供養名「.*」は戒名・俗名の併記を確認$/.test(text) ||
    /メール.*(?:送信失敗|送信上限|空欄|案内できません)/.test(text);
}

function splitIssueText_(value) {
  return String(value == null ? '' : value).split(/[／/]/).map(clean_).filter(Boolean);
}

function correctionAuditLines_(value) {
  return String(value == null ? '' : value).split(/\r?\n/)
    .map(clean_).filter(isCorrectionAuditLine_);
}

function extractCorrectionIssues_(value) {
  const parts = String(value == null ? '' : value).split(/\r?\n/)
    .map(clean_).filter(line => line && !isCorrectionAuditLine_(line))
    .flatMap(splitIssueText_);
  return uniqueTexts_(parts);
}

function buildContractorCorrectionPlan_(application, master, previousIssues) {
  const preservedIssues = uniqueTexts_(previousIssues)
    .filter(issue => !isContractorDerivedIssue_(issue));
  const readingPlan = buildReadingTargetsFromMaster_(application, master);
  const readingIssues = uniqueTexts_([
    ...readingPlan.issues,
    ...readingPlan.targets.map(item => item.issue)
  ]);
  const resolved = application.firstObon
    ? application.memorials.map(raw => ({
        name: clean_(raw),
        type: '初盆',
        issue: ''
      }))
    : application.memorials.map(raw => resolveMemorial_(raw, application.category, master));
  const baseIssues = uniqueTexts_([...preservedIssues, ...readingIssues]);
  const issues = uniqueTexts_([...baseIssues, ...resolved.map(item => item.issue)]);
  return { readingPlan, resolved, baseIssues, issues };
}

function buildCorrectionNotes_(currentNotes, previousIssueText, newIssueText, auditLine) {
  const previousIssueSet = new Set(extractCorrectionIssues_(previousIssueText));
  const preserved = String(currentNotes == null ? '' : currentNotes).split(/\r?\n/)
    .map(clean_).filter(line => {
      if (!line) return false;
      if (isCorrectionAuditLine_(line)) return true;
      const parts = uniqueTexts_(splitIssueText_(line));
      return !(parts.length && parts.every(part => previousIssueSet.has(part)));
    });
  return [...preserved, clean_(newIssueText), clean_(auditLine)].filter(Boolean).join('\n');
}

function correctionEditor_(e) {
  try {
    const eventEmail = e && e.user && e.user.getEmail ? clean_(e.user.getEmail()) : '';
    if (eventEmail) return eventEmail;
  } catch (error) {
    // 実行環境によって編集者メールを取得できない場合があります。
  }
  try {
    const activeEmail = clean_(Session.getActiveUser().getEmail());
    if (activeEmail) return activeEmail;
  } catch (error) {
    // 取得できない場合は職員表記で記録します。
  }
  return '職員（メール取得不可）';
}

function indexRowsByIdAndBranch_(sh, idColumn, branchColumn, applicationId) {
  const result = new Map();
  if (sh.getLastRow() < 2) return result;
  const width = branchColumn - idColumn + 1;
  sh.getRange(2, idColumn, sh.getLastRow() - 1, width).getValues().forEach((values, index) => {
    if (clean_(values[0]) !== clean_(applicationId)) return;
    const branch = Number(values[width - 1]);
    if (branch && !result.has(branch)) result.set(branch, index + 2);
  });
  return result;
}

function updateCorrectionWorkRows_(workSh, application, plan) {
  // 供養内容の件数が減った場合に古い枝番が残らないよう、
  // 同一申込IDの作札行をいったん空けてから現在内容で再構築します。
  if (workSh.getLastRow() >= 2) {
    workSh.getRange(2, 5, workSh.getLastRow() - 1, 1)
      .createTextFinder(String(application.responseId)).matchEntireCell(true).findAll()
      .forEach(hit => workSh.getRange(hit.getRow(), 1, 1, Math.min(23, workSh.getMaxColumns())).clearContent());
  }
  plan.resolved.forEach((item, index) => {
    const branch = index + 1;
    const rowIssue = uniqueTexts_([...plan.baseIssues, item.issue]).join('／');
    writeFirstEmptyIdRow_(workSh, 5, [
      rowIssue ? '要確認' : '作成可', application.year, application.eventName,
      application.category, application.responseId, branch, application.sponsor,
      item.name, item.type, application.firstObon, application.workType,
      application.eko, false, false, false, false, application.contractor,
      application.firstObon ? application.applicationContent : application.memorials[index],
      rowIssue, application.timestamp
    ]);
  });
}

function rebuildCorrectionReadingRows_(readingSh, application, plan) {
  if (readingSh.getLastRow() >= 2) {
    readingSh.getRange(2, 4, readingSh.getLastRow() - 1, 1)
      .createTextFinder(String(application.responseId)).matchEntireCell(true).findAll()
      .forEach(hit => readingSh.getRange(hit.getRow(), 1, 1, Math.min(20, readingSh.getMaxColumns())).clearContent());
  }
  plan.readingPlan.targets.forEach((item, index) => {
    const rowIssue = uniqueTexts_([...plan.issues, item.issue]).join('／');
    writeFirstEmptyIdRow_(readingSh, 4, [
      rowIssue ? '要確認' : '作成可', application.year, application.eventName,
      application.responseId, index + 1, application.contractor, item.altar,
      item.altarType, item.number, item.name, item.type, application.attend,
      application.readingDate, application.readingTime, false, rowIssue,
      application.timestamp
    ]);
  });
}

function applyApplicationCorrection_(ss, appSh, row, editor) {
  const correction = ANNUAL.CORRECTION;
  const appValues = appSh.getRange(row, 1, 1, ANNUAL_V16.COL.CONFIRMED_PERSON_ID).getValues()[0];
  const applicationId = clean_(appValues[1]);
  if (!applicationId) throw new Error('申込IDがありません。');

  const category = clean_(appValues[5]);
  if (!['納骨壇', '一般'].includes(category)) throw new Error('申込区分を確認してください。');

  const rawSh = mustSheet_(ss, ANNUAL.SHEETS.RESPONSE);
  const rawRow = findIdRow_(rawSh, 2, applicationId);
  if (!rawRow) throw new Error('フォーム回答で同じ申込IDを確認できません。');
  const rawValues = rawSh.getRange(rawRow, 1, 1, 25).getValues()[0];

  const previousName = clean_(appValues[6]) || clean_(rawValues[6]);
  let canonicalName = '';
  let master = [];
  let previousApplicantName = '';
  let confirmedPersonId = clean_(appValues[ANNUAL_V16.COL.CONFIRMED_PERSON_ID - 1]) ||
    clean_(appValues[ANNUAL_V16.COL.PERSON_ID - 1]);
  let confirmedApplicantName = '';
  if (category === '納骨壇') {
    const requestedName = clean_(appValues[correction.NAME_COLUMN - 1]) || previousName;
    if (!requestedName) throw new Error('確定契約者名を選択してください。');
    master = getMaster_(ss, requestedName);
    if (!master.length) throw new Error('確定契約者名を納骨壇名簿で確認できません。');
    canonicalName = clean_(master[0][0]);
    confirmedApplicantName = canonicalName;
  } else {
    const applicantLine = String(rawValues[22] == null ? '' : rawValues[22])
      .split(/\r?\n/).find(line => /^申込者名[:：]/.test(clean_(line)));
    const previousApplicant = applicantLine
      ? clean_(applicantLine.replace(/^申込者名[:：]\s*/, ''))
      : clean_(appValues[7]);
    previousApplicantName = previousApplicant;
    const requestedApplicant = clean_(appValues[ANNUAL_V16.COL.CONFIRMED_APPLICANT - 1]) || previousApplicant;
    if (!requestedApplicant) throw new Error('確定申込者名を入力してください。');
    const applicantRecord = findManualApplicantRecord_(ss, '一般', requestedApplicant, confirmedPersonId);
    confirmedApplicantName = applicantRecord ? applicantRecord.name : requestedApplicant;
    confirmedPersonId = (applicantRecord && applicantRecord.personId) || confirmedPersonId ||
      `PER-LOCAL-${Utilities.getUuid().slice(0, 12).toUpperCase()}`;
  }

  const firstObon = asBoolean_(rawValues[16]);
  const requestType = firstObon ? '初盆供養' : normalizeRequestType_(appValues[10], category);

  let firstObonSecular = '';
  let firstObonDharma = '';
  if (firstObon) {
    const parsed = parseFirstObonContent_(appValues[11]);
    firstObonSecular = parsed.secular;
    firstObonDharma = parsed.dharma;
    try {
      const firstSh = mustSheet_(ss, ANNUAL.SHEETS.FIRST_OBON);
      const firstRow = findFirstObonWorkRow_(firstSh, applicationId);
      if (firstRow) {
        const stored = firstSh.getRange(firstRow, 10, 1, 2).getValues()[0]; // J:K
        if (!firstObonSecular) firstObonSecular = clean_(stored[0]);
        if (!firstObonDharma) firstObonDharma = clean_(stored[1]);
      }
    } catch (error) {
      // 裏方シートが未整備でも申込管理側の訂正を優先します。
    }
  }

  const memorials = firstObon
    ? [firstObonDharma || firstObonSecular].filter(Boolean)
    : (requestType === '納骨壇前読経のみ'
        ? []
        : splitManualMemorialContent_(appValues[11]).slice(0, 5));
  const applicationContent = firstObon
    ? [
        firstObonSecular ? `俗名：${firstObonSecular}` : '',
        firstObonDharma ? `戒名：${firstObonDharma}` : ''
      ].filter(Boolean).join('\n')
    : memorials.join('\n');
  const workType = firstObon
    ? '木札＋塔婆'
    : (category === '一般' ? '木札' : '経木塔婆');
  const eventName = clean_(appValues[4]);
  const requestedEko = asBoolean_(appValues[14]);
  const eko = firstObon
    ? true
    : (eventName === 'お盆' && category === '納骨壇'
        ? true
        : (eventName === 'お盆' && category === '一般' ? requestedEko : false));
  const generalEko = category === '一般'
    ? (eko ? '希望する' : '希望しない')
    : clean_(rawValues[21]);
  let applicantName = category === '一般' ? confirmedApplicantName : canonicalName;
  let sponsor = clean_(appValues[7]);
  if (!sponsor ||
      (category === '納骨壇' && key_(sponsor) === key_(previousName)) ||
      (category === '一般' && key_(sponsor) === key_(previousApplicantName))) {
    sponsor = category === '一般' ? applicantName : canonicalName;
  }

  const application = {
    responseId: applicationId,
    timestamp: appValues[2],
    year: Number(appValues[3]),
    eventName,
    category,
    contractor: canonicalName,
    applicantName,
    enteredSponsor: sponsor && key_(sponsor) !== key_(applicantName) ? sponsor : '',
    sponsor,
    sponsorKana: clean_(appValues[8]),
    phone: clean_(appValues[9]),
    email: clean_(appValues[ANNUAL_V16.COL.EMAIL - 1]) || clean_(rawValues[2]),
    guideMethod: clean_(appValues[ANNUAL_V16.COL.GUIDE_METHOD - 1]),
    personId: confirmedPersonId,
    householdId: clean_(appValues[ANNUAL_V16.COL.HOUSEHOLD_ID - 1]),
    requestType,
    memorials,
    applicationContent,
    firstObon,
    firstObonSecular,
    firstObonDharma,
    eko,
    generalEko,
    attend: firstObon ? '読経なし' : normalizeAttendance_(appValues[15], requestType),
    readingDate: firstObon ? '' : (appValues[16] || ''),
    readingTime: firstObon ? '' : (appValues[17] || ''),
    receptionMethod: clean_(appValues[18]),
    payStatus: clean_(appValues[19]),
    payMethod: clean_(appValues[20]),
    payDate: appValues[21] || '',
    paymentRaw: manualPaymentLabel_(appValues[20]),
    auditNote: clean_(rawValues[22]),
    workType,
    status: ''
  };

  // 以前の要確認理由のうち、今回の訂正で再判定できるものは一度外します。
  const previousIssueText = rawValues[24];
  const preservedIssues = extractCorrectionIssues_(previousIssueText)
    .filter(issue => !isCorrectionRecheckIssue_(issue));

  const currentIssues = [];
  const allowedRequests = firstObon
    ? ['初盆供養']
    : (category === '一般'
        ? ['合同供養のみ']
        : ['合同供養のみ', '合同供養＋納骨壇前読経', '納骨壇前読経のみ']);
  if (!allowedRequests.includes(requestType)) currentIssues.push('ご希望の供養が不正');

  if (firstObon && !firstObonSecular && !firstObonDharma) {
    currentIssues.push('初盆対象者の俗名または戒名を確認してください');
  }

  if (requestType === '納骨壇前読経のみ') {
    if (clean_(appValues[11])) currentIssues.push('読経のみの申込に合同供養の供養内容があります');
  } else if (!memorials.length) {
    currentIssues.push('供養内容が空欄');
  }
  if (requestType === '合同供養のみ') {
    if (application.attend !== '読経なし' || hasValue_(application.readingDate) || hasValue_(application.readingTime)) {
      currentIssues.push('合同供養のみの申込に読経情報があります');
    }
  } else if (needsAltarReading_(requestType)) {
    if (!['参列する', '寺院一任'].includes(application.attend)) currentIssues.push('読経への参列方法が未選択');
    if (application.attend === '参列する' &&
        (!hasValue_(application.readingDate) || !hasValue_(application.readingTime))) {
      currentIssues.push('参列する場合は読経希望日時が必須');
    }
    // 寺院一任は、申込時点では日時未確定のままでもよく、
    // 寺院側で日時を確定した後は Q/R へ日付・時刻をセットで入力できます。
    if (application.attend === '寺院一任' &&
        hasPartialReadingDateTime_(application.readingDate, application.readingTime)) {
      currentIssues.push('寺院一任の確定日時は日付・時刻を両方入力してください');
    }
  }
  if (hasValue_(application.readingDate)) {
    const readingYear = dateYear_(application.readingDate);
    if (readingYear && readingYear !== application.year) {
      currentIssues.push('読経希望日が申込対象年と一致しません');
    }
  }

  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const schedule = getScheduleRule_(settings, application.year, application.eventName, application.category);
  validateReadingSchedule_(application, schedule).forEach(issue => currentIssues.push(issue));
  validateReadingLeadTime_(application, application.timestamp).forEach(issue => currentIssues.push(issue));
  validateReadingSlotConflict_(appSh, application, schedule).forEach(issue => currentIssues.push(issue));

  const readingPlan = buildReadingTargetsFromMaster_(application, master);
  readingPlan.issues.forEach(issue => currentIssues.push(issue));
  readingPlan.targets.forEach(item => { if (item.issue) currentIssues.push(item.issue); });

  const resolved = firstObon
    ? memorials.map(raw => ({
        name: clean_(raw),
        type: firstObonDharma ? '戒名' : '俗名',
        issue: ''
      }))
    : memorials.map(raw => resolveMemorial_(raw, category, master));
  resolved.forEach(item => { if (item.issue) currentIssues.push(item.issue); });

  const oldFee = Number(appValues[13]) || 0;
  const fee = firstObon
    ? getFirstObonFee_(ss)
    : calculateFee_(ss, application.eventName, application.category, requestType, memorials.length);
  if (!Number.isFinite(fee) || fee <= 0) currentIssues.push('志納料設定が不正');

  application.fee = fee;
  const paymentPlan = buildPaymentPlan_(ss, getAnnualConfig_(settings), application, fee);
  application.paymentPlan = paymentPlan;
  if (requiresEcProductUrl_(application) && paymentPlan.items.some(item => !item.url)) {
    currentIssues.push('オンライン決済の商品URLが未設定');
  }

  const paymentStatus = application.payStatus;
  if (oldFee && fee && oldFee !== fee && ['入金済', '免除'].includes(paymentStatus)) {
    currentIssues.push('志納料が変更されています。入金額を確認してください');
  }

  const issues = uniqueTexts_([...preservedIssues, ...currentIssues]);
  const status = issues.length ? '要確認' : '作成可';
  application.status = status;

  const baseIssues = uniqueTexts_([...preservedIssues, ...currentIssues]
    .filter(issue => !/^供養名「.*」/.test(issue)));
  const plan = { readingPlan, resolved, baseIssues, issues };

  const correctedAt = new Date();
  const auditLines = [];
  if (category === '納骨壇' && key_(previousName) !== key_(canonicalName)) {
    auditLines.push(`契約者名修正：${previousName || '未入力'} → ${canonicalName}`);
  }
  if (category === '一般') {
    const oldApplicantName = extractAuditValue_(rawValues[22], '申込者名') || clean_(rawValues[7]);
    if (key_(oldApplicantName) !== key_(applicantName)) {
      auditLines.push(`申込者名修正：${oldApplicantName || '未入力'} → ${applicantName}`);
    }
  }
  const oldMemorialText = rawValues.slice(11, 16).map(clean_).filter(Boolean).join('\n');
  const newMemorialText = application.applicationContent;
  if (key_(oldMemorialText) !== key_(newMemorialText)) {
    auditLines.push(`供養内容修正：${oldMemorialText || '未入力'} → ${newMemorialText || 'なし'}`);
  }
  // S列の読経希望日・T列の読経希望時刻はDate値になるため、
  // 新しい値と同じ表示形式へ揃えてから比較します。
  const oldReading = [
    clean_(rawValues[17]),
    displayDate_(rawValues[18]),
    displayTime_(rawValues[19])
  ].map(clean_).join('／');
  const newReading = [
    application.attend,
    displayDate_(application.readingDate),
    displayTime_(application.readingTime)
  ].map(clean_).join('／');
  if (key_(oldReading) !== key_(newReading)) {
    auditLines.push(`読経内容修正：${oldReading || '未入力'} → ${newReading || 'なし'}`);
  }
  if (!auditLines.length) auditLines.push('申込内容修正：再確認');
  const auditSuffix = `（${Utilities.formatDate(correctedAt, ANNUAL.TIMEZONE, 'yyyy/MM/dd HH:mm')}／${clean_(editor)}）`;
  const auditLine = auditLines.map(line => `${line}${auditSuffix}`).join('\n');

  // 統合ログ「フォーム回答」は訂正後の正本へ更新します。
  rawSh.getRange(rawRow, 3).setValue(application.email);
  rawSh.getRange(rawRow, 7).setValue(canonicalName);
  rawSh.getRange(rawRow, 8, 1, 3).setValues([[
    application.sponsor, application.sponsorKana, application.phone
  ]]);
  rawSh.getRange(rawRow, 11).setValue(requestType);
  rawSh.getRange(rawRow, 12, 1, 5).setValues([pad_(memorials, 5)]);
  rawSh.getRange(rawRow, 18, 1, 3).setValues([[
    application.attend, application.readingDate, application.readingTime
  ]]);
  rawSh.getRange(rawRow, 22).setValue(application.generalEko);
  rawSh.getRange(rawRow, 23).setValue(
    replaceAuditValue_(rawValues[22], '申込者名', application.applicantName)
  );
  rawSh.getRange(rawRow, 24, 1, 2).setValues([[
    // X列「処理状態」の入力規則は「受付済／要確認／処理済」です。
    // 旧版の「修正済」は規則外となるため、完了時は「処理済」に統一します。
    issues.length ? ANNUAL.RESPONSE_STATE.REVIEW : ANNUAL.RESPONSE_STATE.DONE,
    [issues.join('／'), auditLine].filter(Boolean).join('\n')
  ]]);

  updateCorrectionWorkRows_(mustSheet_(ss, ANNUAL.SHEETS.WORK), application, plan);
  rebuildCorrectionReadingRows_(mustSheet_(ss, ANNUAL.SHEETS.READING), application, plan);
  // 訂正で読経対象の件数・枝番が変わった場合も、当日用画面を現在内容へ合わせます。
  syncReadingViewCheckboxes_(ss);

  const notes = buildCorrectionNotes_(appValues[24], previousIssueText, issues.join('／'), auditLine);
  appSh.getRange(row, 1).setValue(status);
  appSh.getRange(row, 7).setValue(canonicalName);
  appSh.getRange(row, 8, 1, 3).setValues([[
    application.sponsor, application.sponsorKana, application.phone
  ]]);
  appSh.getRange(row, 11).setValue(requestType);
  appSh.getRange(row, 12).setValue(newMemorialText);
  appSh.getRange(row, 13).setValue(memorials.length);
  appSh.getRange(row, 14).setValue(fee);
  appSh.getRange(row, 15).setValue(application.eko);
  appSh.getRange(row, 16, 1, 3).setValues([[
    application.attend, application.readingDate, application.readingTime
  ]]);
  appSh.getRange(row, 23, 1, 2).setValues([[false, false]]);
  appSh.getRange(row, 25).setValue(notes);
  appSh.getRange(row, ANNUAL_V16.COL.CONTENT_STATE).setValue(issues.length ? '要確認' : '確認済');
  appSh.getRange(row, ANNUAL_V16.COL.PERSON_ID).setValue(application.personId || '');
  appSh.getRange(row, ANNUAL_V16.COL.EMAIL).setValue(application.email || '');
  appSh.getRange(row, ANNUAL_V16.COL.CONFIRMED_APPLICANT)
    .setValue(category === '一般' ? application.applicantName : canonicalName);
  appSh.getRange(row, ANNUAL_V16.COL.CONFIRMED_PERSON_ID).setValue(application.personId || '');
  appSh.getRange(row, correction.NAME_COLUMN, 1, 4)
    .setValues([[category === '納骨壇' ? canonicalName : '', true, correctedAt, clean_(editor)]]);
  appSh.getRange(row, correction.NAME_COLUMN)
    .setBackground('#e6f4ea').setNote(`修正反映済み：${auditLine}`);
  appSh.getRange(row, ANNUAL_V16.COL.CONFIRMED_APPLICANT)
    .setBackground('#e6f4ea').setNote(`修正反映済み：${auditLine}`);

  syncFirstObonCorrection_(ss, application, fee, auditLine);
  updateMemorialHistoryMaster_(ss, application);
  syncPaymentSummaryForApplication_(ss, applicationId);
  syncOperationalStatus_(
    ss, applicationId,
    clean_(appSh.getRange(row, ANNUAL_V16.COL.RECEPTION_STATE).getValue()) || '受付中',
    clean_(appSh.getRange(row, 20).getValue()) || paymentStatus || '未入金',
    clean_(appSh.getRange(row, ANNUAL_V16.COL.REMINDER_STATE).getValue()) || '未督促'
  );
  return { contractor: canonicalName, sponsor: application.sponsor, status, issues };
}

function resetContractorCorrectionApproval_(appSh, row) {
  const correction = ANNUAL.CORRECTION;
  appSh.getRange(row, correction.APPLY_COLUMN).setValue(false);
  appSh.getRange(row, correction.AT_COLUMN, 1, 2).clearContent();
  appSh.getRange(row, correction.NAME_COLUMN).setBackground('#fff2cc').clearNote();
  appSh.getRange(row, ANNUAL_V16.COL.CONFIRMED_APPLICANT).setBackground('#fff2cc').clearNote();
}

function markContractorCorrectionFailure_(ss, appSh, row, error) {
  const correction = ANNUAL.CORRECTION;
  const detail = error && error.message ? error.message : String(error);
  appSh.getRange(row, correction.APPLY_COLUMN).setValue(false);
  appSh.getRange(row, correction.NAME_COLUMN)
    .setBackground('#fce8e6').setNote(`修正できません：${detail}`);
  appSh.getRange(row, ANNUAL_V16.COL.CONFIRMED_APPLICANT)
    .setBackground('#fce8e6').setNote(`修正できません：${detail}`);
  ss.toast(`申込内容を修正できませんでした：${detail}`, '申込内容訂正', 10);
}

function handleContractorCorrectionEdit_(e, firstColumn, lastColumn) {
  const correction = ANNUAL.CORRECTION;
  const appSh = e.range.getSheet();
  const ss = appSh.getParent();
  const firstRow = e.range.getRow();
  const lastRow = firstRow + e.range.getNumRows() - 1;

  // H:J:施主・連絡先、K:L:供養、O:R:読経、Z:確定契約者、AP:メール、AS:AT:一般申込者。
  const correctionInputs = [
    8, 9, 10, 11, 12, 15, 16, 17, 18, correction.NAME_COLUMN,
    ANNUAL_V16.COL.EMAIL, ANNUAL_V16.COL.CONFIRMED_APPLICANT,
    ANNUAL_V16.COL.CONFIRMED_PERSON_ID
  ];
  const editedInput = correctionInputs.some(column => column >= firstColumn && column <= lastColumn);
  const editedApply = correction.APPLY_COLUMN >= firstColumn && correction.APPLY_COLUMN <= lastColumn;
  if (!editedInput && !editedApply) return false;

  if (editedInput && !editedApply) {
    for (let row = firstRow; row <= lastRow; row++) resetContractorCorrectionApproval_(appSh, row);
    return true;
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const editor = correctionEditor_(e);
    for (let row = firstRow; row <= lastRow; row++) {
      if (appSh.getRange(row, correction.APPLY_COLUMN).getValue() !== true) continue;
      try {
        const result = applyApplicationCorrection_(ss, appSh, row, editor);
        const target = result.contractor || result.sponsor || '申込';
        ss.toast(
          `${target}の申込内容を反映しました。判定：${result.status}`,
          '申込内容訂正', 8
        );
      } catch (error) {
        markContractorCorrectionFailure_(ss, appSh, row, error);
      }
    }
  } finally {
    lock.releaseLock();
  }
  return true;
}

/**
 * 電話・窓口・郵送の手入力受付を、既存の「フォーム回答」「申込管理」
 * 「作札一覧」「読経対象一覧」へ同じ申込IDで記録します。
 * 初盆も同じ「受付入力」で受け、既存の「初盆電話受付」は裏方の準備一覧として自動反映します。
 */

/**
 * 一般信者の参照元（久留米成田山｜お盆供養受付 の 92_人物・世帯台帳）を
 * このファイル内の「一般信者名簿」へ同期します。
 * 外部スプレッドシートを開くため、メニューから手動実行してください。
 */
function syncGeneralApplicantMaster() {
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  const target = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
  ensureMemorialMasterHeaders_(ss);

  // 人物IDを第一キー、氏名を旧データ用の補助キーとして、履歴・職員メモを安全に保持します。
  const localRows = target.getLastRow() >= 2
    ? target.getRange(2, 1, target.getLastRow() - 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length).getValues()
    : [];
  const localById = new Map();
  const localByName = new Map();
  localRows.forEach(row => {
    const personId = clean_(row[10]);
    const name = clean_(row[0]);
    if (personId && !localById.has(personId)) localById.set(personId, row);
    if (name && !localByName.has(key_(name))) localByName.set(key_(name), row);
  });

  const sourceSs = SpreadsheetApp.openById(ANNUAL.GENERAL_SOURCE.SPREADSHEET_ID);
  const source = mustSheet_(sourceSs, ANNUAL.GENERAL_SOURCE.SHEET);
  const lastRow = source.getLastRow();

  const records = new Map();
  if (lastRow >= 3) {
    // A:U = 人物ID、世帯ID、氏名、連絡先、区分、案内情報など。
    source.getRange(3, 1, lastRow - 2, 21).getValues().forEach(row => {
      const personId = clean_(row[0]);
      const householdId = clean_(row[1]);
      const name = clean_(row[2]);
      const kana = clean_(row[3]);
      const phone = clean_(row[7]);
      const category = clean_(row[10]);
      if (!name || category !== '一般信者') return;
      const recordKey = personId || `NAME:${key_(name)}`;
      if (records.has(recordKey)) return;
      const local = (personId && localById.get(personId)) || localByName.get(key_(name)) || [];
      records.set(recordKey, [
        name, kana || local[1] || '', phone || local[2] || '', '一般信者',
        local[4] || '', local[5] || '', local[6] || '', local[7] || '', local[8] || '', local[9] || '',
        personId || local[10] || '', householdId || local[11] || '', row[4] || local[12] || '',
        row[5] || local[13] || '', row[6] || local[14] || '', row[8] || local[15] || '',
        row[9] || local[16] || '', row[16] || local[17] || '', row[17] || local[18] || '',
        row[18] || local[19] || '', row[19] || local[20] || ''
      ]);
    });
  }

  // 参照元にまだない窓口・電話受付の新規信者も削除しません。
  const representedIds = new Set([...records.values()].map(row => clean_(row[10])).filter(Boolean));
  const representedNames = new Set([...records.values()].map(row => key_(row[0])).filter(Boolean));
  localRows.forEach(local => {
    const name = clean_(local[0]);
    if (!name) return;
    let personId = clean_(local[10]);
    if ((personId && representedIds.has(personId)) || representedNames.has(key_(name))) return;
    if (!personId) personId = `PER-LOCAL-${Utilities.getUuid().slice(0, 12).toUpperCase()}`;
    const preserved = Array.from({ length: ANNUAL_V16.GENERAL_MASTER_HEADERS.length }, (_, i) => local[i] || '');
    preserved[3] = preserved[3] || '一般信者';
    preserved[10] = personId;
    records.set(personId, preserved);
  });

  const rows = [...records.values()]
    .sort((a, b) => String(a[1] || a[0]).localeCompare(String(b[1] || b[0]), 'ja'));

  target.getRange(1, 1, 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length)
    .setValues([ANNUAL_V16.GENERAL_MASTER_HEADERS]);

  if (target.getMaxRows() < Math.max(1000, rows.length + 1)) {
    target.insertRowsAfter(target.getMaxRows(), Math.max(1000, rows.length + 1) - target.getMaxRows());
  }
  if (target.getMaxRows() >= 2) {
    target.getRange(2, 1, target.getMaxRows() - 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length).clearContent();
  }
  if (rows.length) {
    target.getRange(2, 1, rows.length, ANNUAL_V16.GENERAL_MASTER_HEADERS.length)
      .setValues(rows.map(row => row.map(safeSheetValue_)));
  }
  target.showSheet();
  target.setFrozenRows(1);
  target.getRange(1, 1, 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length)
    .setBackground('#5b3a29').setFontColor('#ffffff').setFontWeight('bold');
  target.getRange(2, 5, Math.max(1, target.getMaxRows() - 1), 6).setWrap(true).setVerticalAlignment('top');

  const manual = ss.getSheetByName(ANNUAL.SHEETS.MANUAL);
  if (manual && clean_(manual.getRange('D5').getValue()) === '一般') {
    setManualApplicantValidation_(ss, '一般');
  }
  ss.toast(`一般信者名簿を${rows.length}名で更新しました。人物ID・連絡先・履歴・職員メモを保持しています。`, '年間法会受付', 8);
}

function rangeTouchesCell_(range, row, column) {
  const firstRow = range.getRow();
  const lastRow = firstRow + range.getNumRows() - 1;
  const firstColumn = range.getColumn();
  const lastColumn = firstColumn + range.getNumColumns() - 1;
  return row >= firstRow && row <= lastRow && column >= firstColumn && column <= lastColumn;
}

/**
 * 申込者区分に応じた候補一覧を、入力規則が常に参照する1列へ集約します。
 * 編集トリガーが一時的に動かなくても、D5の変更だけで候補一覧が切り替わります。
 */
function ensureManualApplicantCandidateFormula_(ss) {
  const source = mustSheet_(ss, ANNUAL.SHEETS.CONTRACT_CANDIDATES);
  if (source.getMaxRows() < 1000) {
    source.insertRowsAfter(source.getMaxRows(), 1000 - source.getMaxRows());
  }
  source.getRange('A1').setValue('申込者名候補');
  source.getRange('A2').setFormula(
    '=IF(\'受付入力\'!D5="","",IFERROR(SORT(UNIQUE(FILTER(' +
    'INDIRECT(IF(\'受付入力\'!D5="納骨壇","\'納骨壇名簿\'!A2:A","\'一般信者名簿\'!A2:A")),' +
    'INDIRECT(IF(\'受付入力\'!D5="納骨壇","\'納骨壇名簿\'!A2:A","\'一般信者名簿\'!A2:A"))<>""))),""))'
  );
  source.hideSheet();
  return source;
}

function setManualApplicantValidation_(ss, category) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.MANUAL);
  const cell = sh.getRange('B9');
  cell.clearDataValidations();

  const source = ensureManualApplicantCandidateFormula_(ss);
  const sourceRange = source.getRange(2, 1, source.getMaxRows() - 1, 1);
  let allowInvalid = category !== '納骨壇';
  let help = '先に申込者区分を選択してください。';

  if (category === '納骨壇') {
    help = '納骨壇名簿の正式な契約者名を選択してください。';
  } else if (category === '一般') {
    // 一般は新規の方も受けられるため、名簿外の直接入力を許可します。
    allowInvalid = true;
    help = '一般信者名簿から選択します。名簿にない新規の方は直接入力できます。';
  }

  if (sourceRange) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(sourceRange, true)
      .setAllowInvalid(allowInvalid)
      .setHelpText(help)
      .build();
    cell.setDataValidation(rule);
  }
  cell.setNote(help);
}

function findManualApplicantRecord_(ss, category, applicantName, personId) {
  const name = clean_(applicantName);
  const requestedPersonId = clean_(personId);
  if (!name && !requestedPersonId) return null;
  const targetKey = key_(name);

  if (category === '納骨壇') {
    const master = getMaster_(ss, name);
    if (!master.length) return null;
    const row = master[0];
    return {
      name: clean_(row[0]),
      kana: clean_(row[1]),
      phone: clean_(row[13]) || clean_(row[12]),
      postalCode: clean_(row[9]),
      address: [clean_(row[10]), clean_(row[11])].filter(Boolean).join(' '),
      personId: '',
      householdId: '',
      inMaster: true
    };
  }

  if (category === '一般') {
    const sh = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
    if (sh.getLastRow() < 2) return null;
    const width = Math.min(ANNUAL_V16.GENERAL_MASTER_HEADERS.length, sh.getMaxColumns());
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, width).getValues();
    const hit = rows.find(row =>
      (requestedPersonId && clean_(row[10]) === requestedPersonId) ||
      (!requestedPersonId && key_(row[0]) === targetKey)
    );
    if (!hit) return null;
    return {
      name: clean_(hit[0]),
      kana: clean_(hit[1]),
      phone: clean_(hit[2]),
      previousMemorials: splitManualMemorialContent_(hit[4]),
      eko: clean_(hit[5]),
      previousYear: Number(hit[6]) || 0,
      note: clean_(hit[9]),
      personId: clean_(hit[10]),
      householdId: clean_(hit[11]),
      postalCode: clean_(hit[12]),
      address: [clean_(hit[13]), clean_(hit[14])].filter(Boolean).join(' '),
      phone2: clean_(hit[15]),
      email: clean_(hit[16]),
      guideMethod: clean_(hit[17]),
      guideAllowed: clean_(hit[18]),
      inMaster: true
    };
  }
  return null;
}

function fillManualApplicantInfo_(ss, sh) {
  const category = clean_(sh.getRange('D5').getValue());
  const eventName = clean_(sh.getRange('B5').getValue());
  const applicantName = clean_(sh.getRange('B9').getValue());
  const firstObon = sh.getRange('D13').getValue() === true;
  const record = findManualApplicantRecord_(ss, category, applicantName);

  if (!record) {
    sh.getRangeList([
      'B10', 'D10', ANNUAL_V16.MANUAL.EMAIL, ANNUAL_V16.MANUAL.PERSON_ID,
      ANNUAL_V16.MANUAL.HOUSEHOLD_ID, ANNUAL_V16.MANUAL.POSTAL_CODE,
      ANNUAL_V16.MANUAL.ADDRESS
    ]).clearContent();
    if (category === '一般' && eventName === 'お盆' && !firstObon) {
      sh.getRange('D16').clearContent();
      setManualEkoValidation_(sh.getRange('D16'));
    }
    return;
  }

  sh.getRange('B9').setValue(record.name || applicantName);
  sh.getRange('B10').setValue(record.kana || '');
  sh.getRange('D10').setValue(record.phone || '');
  sh.getRange(ANNUAL_V16.MANUAL.EMAIL).clearContent();
  sh.getRange(ANNUAL_V16.MANUAL.PERSON_ID).setValue(record.personId || '');
  sh.getRange(ANNUAL_V16.MANUAL.HOUSEHOLD_ID).setValue(record.householdId || '');
  sh.getRange(ANNUAL_V16.MANUAL.POSTAL_CODE).setValue(record.postalCode || '');
  sh.getRange(ANNUAL_V16.MANUAL.ADDRESS).setValue(record.address || '');
  sh.getRange(ANNUAL_V16.MANUAL.GUIDE_METHOD).setValue('らくまる寺務');

  if (category === '一般' && eventName === 'お盆' && !firstObon) {
    const ekoCell = sh.getRange('D16');
    setManualEkoValidation_(ekoCell);
    if (['希望する', '希望しない'].includes(record.eko)) {
      ekoCell.setValue(record.eko);
      ekoCell.setNote(`一般信者名簿の前回設定（${record.previousYear || '過去'}年）を表示しています。変更可能です。`);
    } else {
      ekoCell.clearContent();
      ekoCell.setNote('廻向の証を希望するか選択してください。登録後は一般信者名簿へ保存され、次回から自動表示します。');
    }
  }
}

function splitManualMemorialContent_(value) {
  return String(value == null ? '' : value)
    .split(/\r?\n/)
    .map(item => clean_(item))
    .filter(Boolean)
    .slice(0, 5);
}

function parseFirstObonContent_(value) {
  const result = { secular: '', dharma: '' };
  String(value == null ? '' : value).split(/\r?\n/).forEach(line => {
    const text = clean_(line);
    if (!text) return;
    const secular = text.match(/^俗名[:：]\s*(.+)$/);
    if (secular) result.secular = clean_(secular[1]);
    const dharma = text.match(/^戒名[:：]\s*(.+)$/);
    if (dharma) result.dharma = clean_(dharma[1]);
  });
  return result;
}

function writeManualMemorialCells_(sh, items, note) {
  const cells = ['B14', 'D14', 'B15', 'D15', 'B16'];
  cells.forEach((a1, index) => {
    sh.getRange(a1).setValue(items[index] || '');
  });
  sh.getRange('B14').setNote(note || '');
}

function setManualEkoValidation_(cell) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['希望する', '希望しない'], true)
    .setAllowInvalid(false)
    .setHelpText('廻向の証を希望するか選択してください。')
    .build();
  cell.clearDataValidations();
  cell.setDataValidation(rule);
}

function ensureMemorialMasterHeaders_(ss) {
  const general = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
  const nokotsu = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
  const nokotsuHeaders = [
    '春彼岸前回供養内容', '春彼岸最終年',
    'お盆前回供養内容', 'お盆最終年',
    '秋彼岸前回供養内容', '秋彼岸最終年',
    '供養履歴更新日', 'お盆直近3年'
  ];
  const generalReady = general.getMaxColumns() >= ANNUAL_V16.GENERAL_MASTER_HEADERS.length &&
    sheetHeadersMatch_(general, 1, 1, ANNUAL_V16.GENERAL_MASTER_HEADERS);
  const nokotsuReady = nokotsu.getMaxColumns() >= 22 &&
    sheetHeadersMatch_(nokotsu, 1, 15, nokotsuHeaders);
  if (generalReady && nokotsuReady) return;

  if (general.getMaxColumns() < ANNUAL_V16.GENERAL_MASTER_HEADERS.length) {
    general.insertColumnsAfter(
      general.getMaxColumns(), ANNUAL_V16.GENERAL_MASTER_HEADERS.length - general.getMaxColumns()
    );
  }
  general.getRange(1, 1, 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length)
    .setValues([ANNUAL_V16.GENERAL_MASTER_HEADERS]);

  if (nokotsu.getMaxColumns() < 22) {
    nokotsu.insertColumnsAfter(nokotsu.getMaxColumns(), 22 - nokotsu.getMaxColumns());
  }
  nokotsu.getRange(1, 15, 1, 8).setValues([nokotsuHeaders]);

  if (general.getMaxRows() > 1) {
    general.getRange(2, 5, general.getMaxRows() - 1, 1).setWrap(true).setVerticalAlignment('top');
  }
  if (nokotsu.getMaxRows() > 1) {
    nokotsu.getRange(2, 17, nokotsu.getMaxRows() - 1, 1).setWrap(true).setVerticalAlignment('top');
  }
}

function findPreviousManualMemorialsInMaster_(ss, category, applicantName, eventName) {
  const targetKey = key_(applicantName);
  if (!targetKey) return null;

  ensureMemorialMasterHeaders_(ss);

  if (category === '一般') {
    if (eventName !== 'お盆') return null;
    const sh = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
    if (sh.getLastRow() < 2) return null;
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues();
    const hit = rows.find(row => key_(row[0]) === targetKey);
    if (!hit) return null;
    const items = splitManualMemorialContent_(hit[4]);
    if (!items.length) return null;
    return {
      items,
      year: Number(hit[6]) || 0,
      source: '一般信者名簿',
      eko: clean_(hit[5])
    };
  }

  if (category === '納骨壇') {
    const sh = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
    if (sh.getLastRow() < 2) return null;
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 21).getValues();
    const hit = rows.find(row => key_(row[0]) === targetKey);
    if (!hit) return null;

    const map = {
      '春彼岸': { contentIndex: 14, yearIndex: 15 },
      'お盆': { contentIndex: 16, yearIndex: 17 },
      '秋彼岸': { contentIndex: 18, yearIndex: 19 }
    };
    const cols = map[eventName];
    if (!cols) return null;
    const items = splitManualMemorialContent_(hit[cols.contentIndex]);
    if (!items.length) return null;
    return {
      items,
      year: Number(hit[cols.yearIndex]) || 0,
      source: '納骨壇名簿'
    };
  }

  return null;
}

function historyIndexApplicantName_(application) {
  const category = clean_(application && application.category);
  if (category === '納骨壇') return clean_(application.contractor || application.applicantName);
  return clean_(application.applicantName || application.sponsor || application.contractor);
}

function syncCurrentApplicationToHistoryIndex_(ss, application) {
  if (!application) return false;
  const sh = ensureRecentHistoryIndex_(ss);
  const applicationId = clean_(application.responseId) || [
    'LEGACY', Number(application.year) || 0, clean_(application.eventName),
    clean_(application.category), historyIndexApplicantName_(application)
  ].join('|');

  if (sh.getLastRow() >= 2 && applicationId) {
    const ids = sh.getRange(2, 6, sh.getLastRow() - 1, 1).getDisplayValues();
    ids.forEach((item, index) => {
      if (clean_(item[0]) === applicationId) sh.getRange(index + 2, 1, 1, 9).clearContent();
    });
  }

  const category = clean_(application.category);
  const eventName = clean_(application.eventName);
  const applicantName = historyIndexApplicantName_(application);
  const requestType = application.firstObon ? '初盆供養' : normalizeRequestType_(application.requestType, category);
  const memorials = (application.memorials || []).map(clean_).filter(Boolean).slice(0, 5);
  const eligible = ['一般', '納骨壇'].includes(category) &&
    ['春彼岸', 'お盆', '秋彼岸'].includes(eventName) &&
    applicantName && Number(application.year) && !application.firstObon &&
    requestType !== '納骨壇前読経のみ' && memorials.length > 0 &&
    (!application.status || application.status === '作成可');
  // 索引を書き換えたので、直近3年の読み取りキャッシュを捨てます。
  resetRecentHistoryCache_();
  if (!eligible) return false;

  // COVERAGE行はF列の申込IDが空欄です。F列を空き行判定に使うと、通常受付のたびに
  // COVERAGE行を上書きしてしまうため、全行で必ず値を持つA列（対象年）を使います。
  writeFirstEmptyIdRow_(sh, 1, [
    Number(application.year), eventName, category, applicantName,
    memorials.join('\n'), applicationId, '現行申込管理', 'DATA', new Date()
  ]);
  if (!sh.isSheetHidden()) sh.hideSheet();
  return true;
}

function nokotsuObonHistoryFormulas_(row) {
  const indexEnd = 10000;
  const normalizedIndexName = `REGEXREPLACE(SUBSTITUTE('申込履歴索引'!$D$2:$D$${indexEnd},"　",""),"\\s","")`;
  const normalizedMasterName = `REGEXREPLACE(SUBSTITUTE(A${row},"　",""),"\\s","")`;
  const conditions = [
    `'申込履歴索引'!$B$2:$B$${indexEnd}="お盆"`,
    `'申込履歴索引'!$C$2:$C$${indexEnd}="納骨壇"`,
    `'申込履歴索引'!$H$2:$H$${indexEnd}="DATA"`,
    `${normalizedIndexName}=${normalizedMasterName}`
  ].join(',');
  const q = `=IF(A${row}="","",IFERROR(TEXTJOIN(CHAR(10),TRUE,UNIQUE(FILTER(` +
    `'申込履歴索引'!$E$2:$E$${indexEnd},${conditions},` +
    `'申込履歴索引'!$A$2:$A$${indexEnd}=R${row}))),""))`;
  const r = `=IF(A${row}="","",IFERROR(MAX(FILTER('申込履歴索引'!$A$2:$A$${indexEnd},${conditions})),""))`;
  const u = `=IF(R${row}="","",IFERROR(LET(m,MAX(FILTER('申込履歴索引'!$I$2:$I$${indexEnd},${conditions},'申込履歴索引'!$A$2:$A$${indexEnd}=R${row})),IF(m=0,"",m)),""))`;
  return { q, r, u };
}

/**
 * 納骨壇名簿のQ/R/U（お盆履歴）は申込履歴索引を参照する数式列です。
 * 全件復元は1行ずつではなく、列単位でまとめて書き戻します。
 */
function restoreNokotsuObonHistoryFormulas_(ss, applicantName) {
  ensureRecentHistoryIndex_(ss);
  const sh = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  const target = clean_(applicantName);
  const names = sh.getRange(2, 1, lastRow - 1, 1).getValues();

  if (target) {
    names.forEach((item, index) => {
      if (key_(item[0]) !== key_(target)) return;
      const row = index + 2;
      const formulas = nokotsuObonHistoryFormulas_(row);
      sh.getRange(row, 17).setFormula(formulas.q);
      sh.getRange(row, 18).setFormula(formulas.r);
      sh.getRange(row, 21).setFormula(formulas.u).setNumberFormat('yyyy/mm/dd hh:mm');
    });
    return;
  }

  const qr = [];
  const u = [];
  names.forEach((item, index) => {
    const row = index + 2;
    if (!clean_(item[0])) {
      qr.push(['', '']);
      u.push(['']);
      return;
    }
    const formulas = nokotsuObonHistoryFormulas_(row);
    qr.push([formulas.q, formulas.r]);
    u.push([formulas.u]);
  });
  sh.getRange(2, 17, qr.length, 2).setFormulas(qr);
  sh.getRange(2, 21, u.length, 1).setFormulas(u).setNumberFormat('yyyy/mm/dd hh:mm');
}

function updateMemorialHistoryMaster_(ss, application) {
  if (!application) return;
  if (clean_(application.category) === '一般' && !application.generalContactUpserted) {
    upsertGeneralApplicantContact_(ss, application);
    application.generalContactUpserted = true;
  }

  // 申込履歴索引を正本とし、訂正で対象外になった場合も同じ申込IDの旧索引を除去します。
  syncCurrentApplicationToHistoryIndex_(ss, application);

  if (application.firstObon) return;
  if (application.status && application.status !== '作成可') return;
  const requestType = normalizeRequestType_(application.requestType, clean_(application.category));
  if (requestType === '納骨壇前読経のみ') return;
  const memorials = (application.memorials || []).map(clean_).filter(Boolean).slice(0, 5);
  if (!memorials.length) return;

  ensureMemorialMasterHeaders_(ss);

  const category = clean_(application.category);
  const eventName = clean_(application.eventName);
  const year = Number(application.year) || '';
  const content = memorials.join('\n');
  const updatedAt = new Date();

  if (category === '一般') {
    if (eventName !== 'お盆') return;
    const sh = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
    const name = clean_(application.applicantName || application.sponsor);
    if (!name) return;

    let row = 0;
    if (sh.getLastRow() >= 2) {
      const values = sh.getRange(2, 1, sh.getLastRow() - 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length).getValues();
      const requestedPersonId = clean_(application.personId);
      const hit = values.findIndex(item =>
        (requestedPersonId && clean_(item[10]) === requestedPersonId) ||
        (!requestedPersonId && key_(item[0]) === key_(name))
      );
      if (hit >= 0) row = hit + 2;
    }
    if (!row) {
      row = Math.max(2, sh.getLastRow() + 1);
      sh.getRange(row, 1, 1, 4).setValues([[
        safeSheetValue_(name),
        safeSheetValue_(clean_(application.applicantKana || application.sponsorKana)),
        safeSheetValue_(clean_(application.phone)),
        '一般信者'
      ]]);
      sh.getRange(row, 11).setValue(
        clean_(application.personId) || `PER-LOCAL-${Utilities.getUuid().slice(0, 12).toUpperCase()}`
      );
    }

    sh.getRange(row, 1, 1, 4).setValues([[
      safeSheetValue_(name),
      safeSheetValue_(clean_(application.applicantKana || application.sponsorKana)),
      safeSheetValue_(clean_(application.phone)),
      '一般信者'
    ]]);
    if (clean_(application.personId)) sh.getRange(row, 11).setValue(safeSheetValue_(clean_(application.personId)));
    if (clean_(application.householdId)) sh.getRange(row, 12).setValue(safeSheetValue_(clean_(application.householdId)));
    if (clean_(application.postalCode)) sh.getRange(row, 13).setValue(safeSheetValue_(clean_(application.postalCode)));
    if (clean_(application.address)) sh.getRange(row, 14).setValue(safeSheetValue_(clean_(application.address)));
    if (clean_(application.email)) sh.getRange(row, 17).setValue(safeSheetValue_(clean_(application.email)));
    if (clean_(application.guideMethod)) sh.getRange(row, 18).setValue(safeSheetValue_(clean_(application.guideMethod)));

    const existingContent = cleanMultiline_(sh.getRange(row, 5).getValue());
    const existingYear = Number(sh.getRange(row, 7).getValue()) || 0;
    const legacyLikeSync = !application.status;
    if (existingYear > Number(year)) return;
    if (legacyLikeSync && existingYear === Number(year) && existingContent) return;

    let eko = clean_(application.generalEko);
    if (!['希望する', '希望しない'].includes(eko)) eko = application.eko ? '希望する' : '希望しない';
    sh.getRange(row, 5, 1, 4).setValues([[
      safeSheetValue_(content), eko, year, updatedAt
    ]]);
    updateMasterCompactHistoryForApplicant_(ss, '一般', name);
    return;
  }

  if (category === '納骨壇') {
    const sh = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
    const name = clean_(application.contractor || application.applicantName);
    if (!name || sh.getLastRow() < 2) return;

    // お盆のQ/R/Uは申込履歴索引を参照する数式専用列です。スクリプトで静的値を書きません。
    if (eventName === 'お盆') {
      restoreNokotsuObonHistoryFormulas_(ss, name);
      updateMasterCompactHistoryForApplicant_(ss, '納骨壇', name);
      return;
    }

    const map = {
      '春彼岸': { contentCol: 15, yearCol: 16 },
      '秋彼岸': { contentCol: 19, yearCol: 20 }
    };
    const cols = map[eventName];
    if (!cols) return;

    const names = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    const legacyLikeSync = !application.status;
    names.forEach((item, index) => {
      if (key_(item[0]) !== key_(name)) return;
      const row = index + 2;
      const existingContent = cleanMultiline_(sh.getRange(row, cols.contentCol).getValue());
      const existingYear = Number(sh.getRange(row, cols.yearCol).getValue()) || 0;
      if (existingYear > Number(year)) return;
      if (legacyLikeSync && existingYear === Number(year) && existingContent) return;
      sh.getRange(row, cols.contentCol).setValue(safeSheetValue_(content));
      sh.getRange(row, cols.yearCol).setValue(year);
    });
  }
}

function legacyEkoToChoice_(value) {
  const valueText = clean_(value);
  if (/要|希望する|必要/.test(valueText)) return '希望する';
  if (/不要|希望しない|無|なし/.test(valueText)) return '希望しない';
  return '';
}

/**
 * 旧台帳の前回供養内容を、今後の基準となる2つの名簿へ一括移行します。
 * 初回移行用の内部処理であり、現在の日常運用では実行しません。
 */
function syncMemorialHistoryMasters_() {
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  ensureMemorialMasterHeaders_(ss);

  const legacy = SpreadsheetApp.openById(ANNUAL.HISTORY_SOURCE.SPREADSHEET_ID);
  const appSh = mustSheet_(legacy, ANNUAL.HISTORY_SOURCE.APPLICATION_SHEET);
  const detailSh = mustSheet_(legacy, ANNUAL.HISTORY_SOURCE.DETAIL_SHEET);

  const appRows = appSh.getLastRow() >= 4
    ? appSh.getRange(4, 1, appSh.getLastRow() - 3, 28).getValues()
    : [];
  const detailRows = detailSh.getLastRow() >= 4
    ? detailSh.getRange(4, 1, detailSh.getLastRow() - 3, 13).getValues()
    : [];

  const detailsById = new Map();
  detailRows.forEach(row => {
    const id = clean_(row[0]);
    const eventName = clean_(row[3]);
    if (!id || !eventName) return;
    const value = clean_(row[12] || row[5] || row[9] || row[7]);
    if (!value) return;
    if (!detailsById.has(id)) detailsById.set(id, []);
    const list = detailsById.get(id);
    if (!list.some(item => key_(item) === key_(value))) list.push(value);
  });

  const latest = new Map();
  appRows.forEach((row, index) => {
    const id = clean_(row[0]);
    const year = Number(row[2]) || 0;
    const eventName = clean_(row[3]);
    const applicationType = clean_(row[5]);
    const applicantName = clean_(row[7]);
    if (!id || !applicantName || !['春彼岸', 'お盆', '秋彼岸'].includes(eventName)) return;
    if (/初盆/.test(applicationType)) return;

    let category = '';
    const contractType = clean_(row[11]);
    if (/一般/.test(applicationType) || /一般/.test(contractType)) category = '一般';
    if (/納骨/.test(applicationType) || /納骨/.test(contractType)) category = '納骨壇';
    if (!category) return;

    const memorials = (detailsById.get(id) || []).slice(0, 5);
    if (!memorials.length) return;

    const k = `${category}|${key_(applicantName)}|${eventName}`;
    const score = year * 100000 + index;
    const current = latest.get(k);
    if (!current || score >= current.score) {
      latest.set(k, {
        score,
        category,
        eventName,
        year,
        applicantName,
        memorials,
        generalEko: legacyEkoToChoice_(row[27]),
        applicantKana: clean_(row[8]),
        phone: clean_(row[9])
      });
    }
  });

  let generalCount = 0;
  let nokotsuCount = 0;
  latest.forEach(item => {
    updateMemorialHistoryMaster_(ss, {
      category: item.category,
      eventName: item.eventName,
      year: item.year,
      applicantName: item.applicantName,
      contractor: item.category === '納骨壇' ? item.applicantName : '',
      sponsor: item.applicantName,
      applicantKana: item.applicantKana,
      sponsorKana: item.applicantKana,
      phone: item.phone,
      memorials: item.memorials,
      requestType: '合同供養のみ',
      firstObon: false,
      generalEko: item.generalEko,
      eko: item.generalEko === '希望する'
    });
    if (item.category === '一般') generalCount++;
    if (item.category === '納骨壇') nokotsuCount++;
  });

  ss.toast(
    `前回供養内容を名簿へ同期しました。一般：${generalCount}件／納骨壇：${nokotsuCount}件`,
    '年間法会受付', 10
  );
}

/**
 * 受付画面の下部は「今年＋過去2年」の直近3年だけを見せます。
 * 詳細な履歴は申込管理に残し、受付画面へ列を増やし続けない設計です。
 */
function ensureRecentHistoryPanel_(sh) {
  // 旧版で27～30行に残っていた重複履歴パネルを除去します。
  const legacyArea = sh.getRange('A27:D30');
  legacyArea.breakApart();
  legacyArea.clearContent().clearNote().clearFormat();

  const area = sh.getRange('A31:D35');
  area.breakApart();

  sh.getRange('A31:D31').merge();
  sh.getRange('C32:D32').merge();
  sh.getRange('C33:D33').merge();
  sh.getRange('C34:D34').merge();
  sh.getRange('A35:D35').merge();

  sh.getRange('A31').setValue('直近3年の申込')
    .setBackground('#ead8c2')
    .setFontColor('#6b4527')
    .setFontWeight('bold')
    .setFontFamily('Noto Sans JP')
    .setFontSize(11);

  sh.getRange('A32:A34').setBackground('#f4f1ec')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setFontFamily('Noto Sans JP');

  sh.getRange('B32:B34').setHorizontalAlignment('center')
    .setFontFamily('Noto Sans JP')
    .setFontWeight('bold');

  sh.getRange('C32:D34').setFontFamily('Noto Sans JP')
    .setWrap(true);

  sh.getRange('A35').setValue('●＝申込あり　—＝申込なし　？＝履歴未取込　※選択中の法会だけを表示')
    .setFontFamily('Noto Sans JP')
    .setFontSize(9)
    .setFontColor('#666666')
    .setBackground('#fafafa');

  sh.setRowHeights(32, 3, 30);
  sh.setRowHeight(35, 24);
}

/** 過去申込の軽量な検索索引。職員が直接触らない裏方シートです。 */
function ensureRecentHistoryIndex_(ss) {
  let sh = ss.getSheetByName(ANNUAL.SHEETS.HISTORY_INDEX);
  if (!sh) sh = ss.insertSheet(ANNUAL.SHEETS.HISTORY_INDEX);
  const headers = ['対象年', '法会', '区分', '申込者名', '供養内容', '申込ID', '参照元', '種別', '更新日時'];
  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#e5e7eb');
  sh.getRange(2, 9, Math.max(1, sh.getMaxRows() - 1), 1).setNumberFormat('yyyy/mm/dd hh:mm');
  if (!sh.isSheetHidden()) sh.hideSheet();
  return sh;
}

function recentHistoryKey_(year, eventName, category, applicantName) {
  return [Number(year) || 0, clean_(eventName), clean_(category), key_(applicantName)].join('|');
}

function splitRecentHistoryContent_(value) {
  const text = String(value == null ? '' : value);
  return [...new Set(
    text.split(/\r?\n|[／/]/)
      .map(clean_)
      .filter(Boolean)
  )];
}

/** 申込管理1行が、どの申込者名で照合されるかを返します。 */
function currentApplicantNames_(row, category) {
  if (category === '納骨壇') return [clean_(row[4])].filter(Boolean); // G 契約者名
  const auditName = extractAuditValue_(row[22], '申込者名');           // Y 備考の申込者名
  return [...new Set([auditName, clean_(row[5])].filter(Boolean))];    // H 施主名
}

/**
 * 直近3年の照合表を、申込管理・申込履歴索引から1回だけ読み取ります。
 * 名簿の一括更新でも1行ごとに台帳を読み直さないための共通データです。
 */
function collectCurrentRecentHistoryAll_(ss, years, eventName) {
  const result = new Map();
  const sh = ss.getSheetByName(ANNUAL.SHEETS.APPLICATION);
  const lastRow = sh ? lastDataRowByColumn_(sh, 2) : 1;
  if (!sh || lastRow < 2) return result;

  const rows = sh.getRange(2, 3, lastRow - 1, 23).getValues(); // C:Y
  rows.forEach(row => {
    const year = Number(row[1]) || 0;        // D
    const event = clean_(row[2]);            // E
    const category = clean_(row[3]);         // F
    const requestType = clean_(row[8]);      // K
    const content = cleanMultiline_(row[9]); // L
    if (!years.includes(year) || event !== clean_(eventName)) return;
    if (!['一般', '納骨壇'].includes(category) || requestType === '初盆供養') return;

    const items = splitRecentHistoryContent_(content);
    if (!items.length) {
      if (requestType === '納骨壇前読経のみ') items.push('納骨壇前読経');
      else if (requestType) items.push('申込記録あり');
      else return;
    }
    currentApplicantNames_(row, category).forEach(name => {
      const key = recentHistoryKey_(year, event, category, name);
      if (!result.has(key)) result.set(key, []);
      const list = result.get(key);
      items.forEach(item => {
        if (!list.some(existing => key_(existing) === key_(item))) list.push(item);
      });
    });
  });
  return result;
}

function collectIndexedRecentHistoryAll_(ss, years, eventName) {
  const result = new Map();
  const coverage = new Set();
  const sh = ss.getSheetByName(ANNUAL.SHEETS.HISTORY_INDEX);
  if (!sh || sh.getLastRow() < 2) return { result, coverage };

  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues();
  rows.forEach(row => {
    const year = Number(row[0]) || 0;
    const event = clean_(row[1]);
    const category = clean_(row[2]);
    const name = clean_(row[3]);
    const content = cleanMultiline_(row[4]);
    const type = clean_(row[7]);
    if (!years.includes(year) || event !== clean_(eventName)) return;

    if (type === 'COVERAGE') {
      coverage.add([year, event, category].join('|'));
      return;
    }
    if (type !== 'DATA' || !name) return;

    const key = recentHistoryKey_(year, event, category, name);
    if (!result.has(key)) result.set(key, []);
    const list = result.get(key);
    splitRecentHistoryContent_(content).forEach(item => {
      if (!list.some(existing => key_(existing) === key_(item))) list.push(item);
    });
  });
  return { result, coverage };
}

function getRecentHistoryData_(ss, years, eventName) {
  if (!ANNUAL_RUNTIME_CACHE.recentHistory) ANNUAL_RUNTIME_CACHE.recentHistory = {};
  const cacheKey = `${years.join(',')}|${clean_(eventName)}`;
  if (!ANNUAL_RUNTIME_CACHE.recentHistory[cacheKey]) {
    ANNUAL_RUNTIME_CACHE.recentHistory[cacheKey] = {
      current: collectCurrentRecentHistoryAll_(ss, years, eventName),
      indexed: collectIndexedRecentHistoryAll_(ss, years, eventName)
    };
  }
  return ANNUAL_RUNTIME_CACHE.recentHistory[cacheKey];
}

function renderRecentApplicationHistory_(ss, sh) {
  if (!sh || sh.getName() !== ANNUAL.SHEETS.MANUAL) return;
  if (clean_(sh.getRange('A31').getValue()) !== '直近3年の申込') {
    ensureRecentHistoryPanel_(sh);
  }

  const eventName = clean_(sh.getRange('B5').getValue());
  const category = clean_(sh.getRange('D5').getValue());

  let currentYear = new Date().getFullYear();
  try {
    const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
    const selectedYear = manualTargetYear_(settings, eventName, category, sh.getRange('B7').getValue());
    if (Number.isInteger(selectedYear) && selectedYear >= 2025) {
      currentYear = selectedYear;
    }
  } catch (error) {
    // 表示だけは止めず、現在年を代替します。
  }

  const years = [currentYear, currentYear - 1, currentYear - 2];
  sh.getRange('A32:A34').setValues(years.map(year => [year]));

  const applicantName = clean_(sh.getRange('B9').getValue());

  if (!eventName || !category || !applicantName) {
    sh.getRange('B32:B34').setValues([['—'], ['—'], ['—']]).setBackground('#eeeeee');
    sh.getRange('C32:C34').setValues([
      ['申込者名を選ぶと表示します'],
      [''],
      ['']
    ]).setBackground('#fafafa');
    return;
  }

  const history = getRecentHistoryData_(ss, years, eventName);

  const statusValues = [];
  const contentValues = [];
  const backgrounds = [];

  years.forEach(year => {
    const key = recentHistoryKey_(year, eventName, category, applicantName);
    const items = [];
    (history.current.get(key) || []).forEach(item => {
      if (!items.some(existing => key_(existing) === key_(item))) items.push(item);
    });
    (history.indexed.result.get(key) || []).forEach(item => {
      if (!items.some(existing => key_(existing) === key_(item))) items.push(item);
    });

    if (items.length) {
      statusValues.push(['● 申込あり']);
      contentValues.push([items.join('／')]);
      backgrounds.push('#e6f4ea');
      return;
    }

    const coverageKey = [year, eventName, category].join('|');
    // 選択中の法会の対象年は、この通年台帳自体が受付の正本です。
    // そのためデータがなければ「申込なし」と確定し、過去年だけ履歴取込状況を参照します。
    if (year === currentYear || history.indexed.coverage.has(coverageKey)) {
      statusValues.push(['— 申込なし']);
      contentValues.push(['—']);
      backgrounds.push('#eeeeee');
    } else {
      statusValues.push(['？ 履歴未取込']);
      contentValues.push(['古い資料は未取込です']);
      backgrounds.push('#fff4cc');
    }
  });

  sh.getRange('B32:B34').setValues(statusValues);
  sh.getRange('C32:C34').setValues(contentValues);
  backgrounds.forEach((bg, index) => {
    sh.getRange(32 + index, 2, 1, 3).setBackground(bg);
  });
}

function recentHistoryYears_(ss, category) {
  let currentYear = new Date().getFullYear();
  try {
    const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
    const config = getAnnualConfig_(settings);
    const configured = Number(config['受付対象年']);
    if (Number.isInteger(configured)) currentYear = configured;

    // 翌年度フォームを「受付中」にしたら、名簿の直近3年もその年度へ自然に切り替えます。
    // 停止中の未来フォームを設定しただけでは現在表示を先送りしません。
    const targetCategory = clean_(category);
    if (targetCategory) {
      const records = Object.values(getFormRecords_(settings));
      const record = records.find(item =>
        item.eventName === 'お盆' &&
        item.category === targetCategory &&
        item.status === '受付中'
      );
      if (record) {
        const schedule = getScheduleRuleForForm_(settings, record.key);
        const scheduleYear = schedule ? Number(schedule.year) : 0;
        if (Number.isInteger(scheduleYear) && scheduleYear > currentYear) currentYear = scheduleYear;
      }
    }
  } catch (error) {}
  return [currentYear, currentYear - 1, currentYear - 2];
}

function compactRecentHistoryText_(ss, category, applicantName) {
  const years = recentHistoryYears_(ss, category);
  const history = getRecentHistoryData_(ss, years, 'お盆');

  return years.map(year => {
    const k = recentHistoryKey_(year, 'お盆', category, applicantName);
    const hasData = (history.current.get(k) || []).length > 0 ||
      (history.indexed.result.get(k) || []).length > 0;
    if (hasData) return `${year}●`;
    const coverageKey = [year, 'お盆', category].join('|');
    if (year === years[0] || history.indexed.coverage.has(coverageKey)) return `${year}—`;
    return `${year}？`;
  }).join(' / ');
}

function updateMasterCompactHistoryForApplicant_(ss, category, applicantName) {
  applicantName = clean_(applicantName);
  if (!applicantName) return;
  ensureMemorialMasterHeaders_(ss);
  const display = compactRecentHistoryText_(ss, category, applicantName);

  if (category === '一般') {
    const sh = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
    if (sh.getLastRow() < 2) return;
    const names = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    const hit = names.findIndex(item => key_(item[0]) === key_(applicantName));
    if (hit >= 0) sh.getRange(hit + 2, 9).setValue(display);
    return;
  }

  if (category === '納骨壇') {
    const sh = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
    if (sh.getLastRow() < 2) return;
    const names = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    names.forEach((item, index) => {
      if (key_(item[0]) === key_(applicantName)) sh.getRange(index + 2, 22).setValue(display);
    });
  }
}

/**
 * 名簿の「前回供養内容」「お盆直近3年」を一括更新します。
 * 台帳の読み取りは共通キャッシュから行い、書き込みも列単位でまとめます。
 */
function syncRecentHistoryToMasters_(ss) {
  ensureMemorialMasterHeaders_(ss);
  const indexSh = ensureRecentHistoryIndex_(ss);
  const records = indexSh.getLastRow() >= 2
    ? indexSh.getRange(2, 1, indexSh.getLastRow() - 1, 9).getValues()
    : [];

  const byCategory = { '一般': new Map(), '納骨壇': new Map() };
  records.forEach((row, index) => {
    const year = Number(row[0]) || 0;
    const eventName = clean_(row[1]);
    const category = clean_(row[2]);
    const applicantName = clean_(row[3]);
    const content = cleanMultiline_(row[4]);
    const type = clean_(row[7]);
    if (eventName !== 'お盆' || type !== 'DATA' || !year || !applicantName || !byCategory[category]) return;
    const k = key_(applicantName);
    const score = year * 1000000 + index;
    const current = byCategory[category].get(k);
    if (!current || score >= current.score) byCategory[category].set(k, { year, content, applicantName, score });
  });

  const updatedAt = new Date();
  const general = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
  if (general.getLastRow() >= 2) {
    const rows = general.getRange(2, 1, general.getLastRow() - 1, 9).getValues();
    // E:I（前回供養内容・廻向証・最終年・更新日・直近3年）をまとめて書き戻します。
    const block = rows.map(row => {
      const name = clean_(row[0]);
      if (!name) return [row[4], row[5], row[6], row[7], row[8]];
      const latest = byCategory['一般'].get(key_(name));
      return [
        latest ? safeSheetValue_(latest.content) : row[4],
        row[5],
        latest ? latest.year : row[6],
        latest ? updatedAt : row[7],
        compactRecentHistoryText_(ss, '一般', name)
      ];
    });
    if (block.length) general.getRange(2, 5, block.length, 5).setValues(block);
  }

  // 納骨壇名簿 Q/R/U は必ず数式へ戻し、Vだけをスクリプト表示列として更新します。
  restoreNokotsuObonHistoryFormulas_(ss);
  const nokotsu = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
  if (nokotsu.getLastRow() >= 2) {
    const names = nokotsu.getRange(2, 1, nokotsu.getLastRow() - 1, 1).getValues();
    const compact = nokotsu.getRange(2, 22, names.length, 1).getValues();
    const next = names.map((row, index) => {
      const name = clean_(row[0]);
      return name ? [compactRecentHistoryText_(ss, '納骨壇', name)] : [compact[index][0]];
    });
    if (next.length) nokotsu.getRange(2, 22, next.length, 1).setValues(next);
  }
}

function syncRecentApplicationHistory_() {
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  const indexSh = ensureRecentHistoryIndex_(ss);
  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const config = getAnnualConfig_(settings);
  let currentYear = Number(config['受付対象年']) || new Date().getFullYear();

  // 翌年度受付を先行開始しても、その年度の実績を索引から落とさない。
  try {
    Object.values(getFormRecords_(settings)).forEach(record => {
      if (record.status !== '受付中') return;
      const schedule = getScheduleRuleForForm_(settings, record.key);
      const year = schedule ? Number(schedule.year) : 0;
      if (Number.isInteger(year) && year > currentYear) currentYear = year;
    });
    const currentAppSh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
    if (currentAppSh.getLastRow() >= 2) {
      currentAppSh.getRange(2, 4, currentAppSh.getLastRow() - 1, 1).getValues().forEach(row => {
        const year = Number(row[0]) || 0;
        if (Number.isInteger(year) && year > currentYear) currentYear = year;
      });
    }
  } catch (error) {
    // 索引同期は基準年だけでも続行します。
  }

  const rows = [];
  const seen = new Set();
  const syncedAt = new Date();

  function pushData(year, eventName, category, applicantName, content, applicationId, source) {
    year = Number(year) || 0;
    applicantName = clean_(applicantName);
    if (!year || year > currentYear || !applicantName) return;
    const normalizedContent = cleanMultiline_(content);
    const k = [year, eventName, category, key_(applicantName), clean_(applicationId), normalizedContent].join('|');
    if (seen.has(k)) return;
    seen.add(k);
    rows.push([year, eventName, category, applicantName, normalizedContent, clean_(applicationId), source, 'DATA', syncedAt]);
  }

  function pushCoverage(year, eventName, category, source) {
    const k = ['COVERAGE', year, eventName, category].join('|');
    if (seen.has(k)) return;
    seen.add(k);
    rows.push([year, eventName, category, '', '', '', source, 'COVERAGE', syncedAt]);
  }

  // 2026お盆の納骨壇受付。現行の2026納骨壇シートは契約者全体表なので、申込・入金欄が
  // 「入金済」「未入金」の行を申込実績として扱います。未入金でも申込済みなので履歴には含めます。
  try {
    const src = ANNUAL.RECENT_HISTORY_SOURCE.OBON_2026;
    const book = SpreadsheetApp.openById(src.SPREADSHEET_ID);
    const sourceSh = mustSheet_(book, src.SHEET);
    const values = sourceSh.getLastRow() >= 2
      ? sourceSh.getRange(2, 1, sourceSh.getLastRow() - 1, 35).getValues()
      : [];

    const grouped = new Map();
    values.forEach((row, index) => {
      const paymentStatus = clean_(row[3]); // D 申込・入金
      if (paymentStatus !== '入金済' && paymentStatus !== '未入金') return;

      const applicant = clean_(row[0]); // A 契約者
      if (!applicant) return;

      const key = key_(applicant);
      if (!grouped.has(key)) {
        grouped.set(key, {
          applicant,
          contents: [],
          ids: [],
          sourceRows: [],
          joint: false,
          reading: false
        });
      }
      const item = grouped.get(key);
      item.sourceRows.push(index + 2);
      item.joint = item.joint || row[14] === true || clean_(row[14]) === 'TRUE';   // O 合同供養
      item.reading = item.reading || row[17] === true || clean_(row[17]) === 'TRUE'; // R 読経希望

      let content = clean_(row[15]); // P 供養内容
      if (!content) content = clean_(row[9]) || clean_(row[7]); // J 法名 → H 俗名
      if (content && !item.contents.some(existing => key_(existing) === key_(content))) {
        item.contents.push(content);
      }

      const responseId = clean_(row[32]); // AG 回答ID
      const branchRaw = clean_(row[33]);  // AH 回答枝番
      const branch = branchRaw.replace(/\.0$/, '');
      if (responseId) {
        const id = branch ? `${responseId}-${branch}` : responseId;
        if (!item.ids.includes(id)) item.ids.push(id);
      }
    });

    grouped.forEach(item => {
      let content = item.contents.join('\n');
      if (!content) {
        if (item.joint && item.reading) content = '合同供養＋納骨壇前読経';
        else if (item.joint) content = '合同供養';
        else if (item.reading) content = '納骨壇前読経';
        else content = '申込記録あり';
      }
      const applicationId = item.ids.length
        ? item.ids.join('／')
        : `2026-NK-${item.sourceRows.join(',')}`;
      pushData(2026, 'お盆', '納骨壇', item.applicant, content, applicationId, '2026納骨壇');
    });
    pushCoverage(2026, 'お盆', '納骨壇', '2026納骨壇');
  } catch (error) {
    // 2026年の履歴同期に失敗しても、2025年以前の同期を続けます。
  }

  // 一般信者名簿に保持している最新のお盆実績も索引へ入れます。
  // 名簿が持つ年は「申込あり」の根拠にできますが、その年の全員網羅までは保証しないため、
  // COVERAGE は受付対象年（通常は2026年）のみ付けます。
  try {
    const generalSh = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
    if (generalSh.getLastRow() >= 2) {
      const values = generalSh.getRange(2, 1, generalSh.getLastRow() - 1, 9).getValues();
      let latestGeneralYear = 0;
      values.forEach((row, index) => {
        const applicant = clean_(row[0]);
        const content = cleanMultiline_(row[4]);
        const year = Number(row[6]) || 0;
        if (!applicant || !year || year > currentYear) return;
        pushData(
          year, 'お盆', '一般', applicant,
          content || '申込記録あり',
          `GENERAL-MASTER-${index + 2}`,
          '一般信者名簿'
        );
        if (year > latestGeneralYear) latestGeneralYear = year;
      });
      // 一般信者名簿は「お盆最終年」を全員分保持する台帳です。記録がある最新年までは
      // その年度を確認済みとして扱えます。受付対象年に固定すると、翌年度フォームを
      // 開いた時点で対象範囲が付かなくなるため、名簿側の最新年を使います。
      if (latestGeneralYear) {
        pushCoverage(latestGeneralYear, 'お盆', '一般', '一般信者名簿');
      }
    }
  } catch (error) {
    // 一般名簿の履歴が読めなくても、他の履歴同期を続けます。
  }

  // 2025お盆の整理済み年度別台帳。2025年の納骨壇受付は全体表として扱えます。
  try {
    const src = ANNUAL.RECENT_HISTORY_SOURCE.OBON_2025;
    const book = SpreadsheetApp.openById(src.SPREADSHEET_ID);
    const appSh = mustSheet_(book, src.APPLICATION_SHEET);
    const detailSh = mustSheet_(book, src.DETAIL_SHEET);

    const applications = appSh.getLastRow() >= 2
      ? appSh.getRange(2, 1, appSh.getLastRow() - 1, 8).getValues()
      : [];
    const details = detailSh.getLastRow() >= 2
      ? detailSh.getRange(2, 1, detailSh.getLastRow() - 1, 14).getValues()
      : [];

    const detailsById = new Map();
    details.forEach(row => {
      const id = clean_(row[1]); // B 申込ID
      const display = clean_(row[6]); // G 供養表記
      if (!id || !display) return;
      if (!detailsById.has(id)) detailsById.set(id, []);
      const list = detailsById.get(id);
      if (!list.some(item => key_(item) === key_(display))) list.push(display);
    });

    let has2025Nokotsu = false;
    applications.forEach(row => {
      const id = clean_(row[0]);
      const year = Number(row[1]) || 0;
      const applicant = clean_(row[4]);
      const rawCategory = clean_(row[7]);
      let category = '';
      if (/納骨/.test(rawCategory)) category = '納骨壇';
      else if (/一般/.test(rawCategory)) category = '一般';
      if (!id || !category || !applicant || year !== 2025) return;

      const content = (detailsById.get(id) || []).join('\n');
      pushData(year, 'お盆', category, applicant, content || '申込記録あり', id, '2025お盆年度別台帳');
      if (year === 2025 && category === '納骨壇') has2025Nokotsu = true;
    });
    if (has2025Nokotsu) pushCoverage(2025, 'お盆', '納骨壇', '2025お盆年度別台帳');
  } catch (error) {
    // この資料が読めなくても、他の履歴同期を続けます。
  }

  // 2025秋彼岸のフォーム回答。これは申込が確認できる人だけを索引化し、未回答＝申込なしとは判定しません。
  try {
    const src = ANNUAL.RECENT_HISTORY_SOURCE.MEMORIAL_2025;
    const book = SpreadsheetApp.openById(src.SPREADSHEET_ID);
    const responseSh = book.getSheetByName(src.AUTUMN_RESPONSE_SHEET);
    if (responseSh && responseSh.getLastRow() >= 2) {
      const values = responseSh.getRange(2, 1, responseSh.getLastRow() - 1, Math.min(responseSh.getLastColumn(), 14)).getValues();
      values.forEach((row, index) => {
        const applicant = clean_(row[2]); // C 氏名
        if (!applicant) return;
        const memorials = [row[4], row[5], row[6]].map(clean_).filter(Boolean);
        const reading = clean_(row[8]);
        const content = memorials.length
          ? memorials.join('\n')
          : (/希望する/.test(reading) ? '納骨壇前読経' : '申込記録あり');
        pushData(2025, '秋彼岸', '納骨壇', applicant, content, `2025-AUT-${index + 2}`, '2025秋彼岸フォーム回答');
      });
    }
  } catch (error) {
    // 部分資料なので、読めない場合は「履歴未取込」のままにします。
  }

  // 現行の申込管理も索引へ含め、外部の旧資料より後に追加して同一年では現行を優先します。
  try {
    const currentAppSh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
    const lastRow = lastDataRowByColumn_(currentAppSh, 2);
    if (lastRow >= 2) {
      const width = Math.min(currentAppSh.getMaxColumns(), ANNUAL_V16.COL.CONFIRMED_PERSON_ID);
      const values = currentAppSh.getRange(2, 1, lastRow - 1, width).getValues();
      values.forEach(row => {
        const status = clean_(row[0]);
        const applicationId = clean_(row[1]);
        const year = Number(row[3]) || 0;
        const eventName = clean_(row[4]);
        const category = clean_(row[5]);
        const requestType = normalizeRequestType_(row[10], category);
        const content = cleanMultiline_(row[11]);
        const receptionState = clean_(row[ANNUAL_V16.COL.RECEPTION_STATE - 1]);
        if (status !== '作成可' || !applicationId || !year || !['春彼岸', 'お盆', '秋彼岸'].includes(eventName)) return;
        if (!['一般', '納骨壇'].includes(category) || ANNUAL_V16.EXCLUDED_RECEPTION_STATES.includes(receptionState)) return;
        if (requestType === '初盆供養' || requestType === '納骨壇前読経のみ' || !content) return;
        let applicant = category === '納骨壇' ? clean_(row[6]) : clean_(row[ANNUAL_V16.COL.CONFIRMED_APPLICANT - 1] || row[7]);
        if (!applicant) return;
        pushData(year, eventName, category, applicant, content, applicationId, '現行申込管理');
      });
    }
  } catch (error) {
    // 現行台帳の索引化に失敗しても、過去資料の同期結果は保存します。
  }

  // 外部資料の読み取り中は既存の索引を残します。新しい索引を準備できてから上書きし、
  // 新しい件数より下に残った旧行だけを消します。途中失敗で索引が空になるのを防ぎます。
  if (!rows.length) {
    throw new Error('申込履歴を1件も確認できなかったため、既存の申込履歴索引を保持しました。');
  }
  const rebuiltCoverage = new Set(rows
    .filter(row => clean_(row[7]) === 'COVERAGE')
    .map(row => [Number(row[0]) || 0, clean_(row[1]), clean_(row[2])].join('|')));
  // 年を固定せず「今ある対象範囲を失わないこと」を条件にします。年を書き足す保守が不要で、
  // 外部資料が一時的に読めなかった回に、過去年が「？ 履歴未取込」へ戻るのも防げます。
  const previousLastRow = lastDataRowByColumn_(indexSh, 1);
  const previousCoverage = new Set();
  if (previousLastRow >= 2) {
    indexSh.getRange(2, 1, previousLastRow - 1, 8).getDisplayValues().forEach(row => {
      if (clean_(row[7]) !== 'COVERAGE') return;
      previousCoverage.add([Number(row[0]) || 0, clean_(row[1]), clean_(row[2])].join('|'));
    });
  }
  const missingRequiredCoverage = [...previousCoverage]
    .filter(key => !rebuiltCoverage.has(key));
  if (missingRequiredCoverage.length) {
    throw new Error(
      `既に確認済みの履歴資料を読み取れなかったため、既存の申込履歴索引を保持しました：` +
      missingRequiredCoverage.map(key => key.replace(/\|/g, '・')).join('、')
    );
  }
  const requiredRows = rows.length + 1;
  if (indexSh.getMaxRows() < requiredRows) {
    indexSh.insertRowsAfter(indexSh.getMaxRows(), requiredRows - indexSh.getMaxRows());
  }
  indexSh.getRange(2, 1, rows.length, 9)
    .setValues(rows.map(row => row.map(safeSheetValue_)));
  const nextLastRow = rows.length + 1;
  if (previousLastRow > nextLastRow) {
    indexSh.getRange(nextLastRow + 1, 1, previousLastRow - nextLastRow, 9).clearContent();
  }
  indexSh.hideSheet();
  resetRecentHistoryCache_();

  syncRecentHistoryToMasters_(ss);

  const manualSh = ss.getSheetByName(ANNUAL.SHEETS.MANUAL);
  if (manualSh) renderRecentApplicationHistory_(ss, manualSh);
  ss.toast(`直近申込履歴を${rows.filter(row => row[7] === 'DATA').length}件同期し、名簿にも反映しました。`, '年間法会受付', 8);
}

function currentManualApplicantMatches_(row, category, applicantName) {
  const contractor = clean_(row[4]); // G
  const sponsor = clean_(row[5]);    // H
  const note = String(row[22] == null ? '' : row[22]); // Y
  if (category === '納骨壇') return key_(contractor) === key_(applicantName);

  if (key_(sponsor) === key_(applicantName)) return true;
  const line = note.split(/\r?\n/).find(item => /^申込者名[:：]/.test(clean_(item)));
  if (!line) return false;
  return key_(line.replace(/^申込者名[:：]\s*/, '')) === key_(applicantName);
}

function findPreviousManualMemorialsInCurrent_(ss, category, applicantName, eventName) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  if (sh.getLastRow() < 2) return null;

  const rows = sh.getRange(2, 3, sh.getLastRow() - 1, 23).getValues(); // C:Y
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const year = Number(row[1]) || 0;       // D
    const event = clean_(row[2]);           // E
    const rowCategory = clean_(row[3]);     // F
    const requestType = clean_(row[8]);     // K
    const content = row[9];                 // L
    if (event !== eventName || rowCategory !== category) continue;
    if (requestType === '初盆供養') continue;
    if (!currentManualApplicantMatches_(row, category, applicantName)) continue;
    const items = splitManualMemorialContent_(content);
    if (items.length) return { items, year, source: '年間法会受付管理' };
  }
  return null;
}

function findPreviousManualMemorials_(ss, category, applicantName, eventName) {
  if (!applicantName || !eventName || !category) return null;
  return findPreviousManualMemorialsInMaster_(ss, category, applicantName, eventName)
    || findPreviousManualMemorialsInCurrent_(ss, category, applicantName, eventName);
}

function fillPreviousManualMemorials_(ss, sh, force) {
  const eventName = clean_(sh.getRange('B5').getValue());
  const category = clean_(sh.getRange('D5').getValue());
  const applicantName = clean_(sh.getRange('B9').getValue());
  const firstObon = sh.getRange('D13').getValue() === true;
  const requestType = category === '一般' && eventName === 'お盆'
    ? '合同供養のみ'
    : normalizeRequestType_(sh.getRange('B13').getValue(), category);

  if (!applicantName || firstObon || requestType === '納骨壇前読経のみ') return null;

  const cells = ['B14', 'D14', 'B15', 'D15', 'B16'];
  const existing = cells.map(a1 => clean_(sh.getRange(a1).getValue())).filter(Boolean);
  if (!force && existing.length) return null;

  if (force) sh.getRangeList(cells).clearContent();

  const previous = findPreviousManualMemorials_(ss, category, applicantName, eventName);
  if (!previous || !previous.items.length) {
    sh.getRange('B14').setNote('過去の供養内容が見つかりません。今回分だけ入力してください。');
    return null;
  }

  writeManualMemorialCells_(
    sh,
    previous.items,
    `前回（${previous.year || '過去'}年）の供養内容を${previous.source || '名簿'}から自動表示しています。変更がある場合だけ修正してください。`
  );
  return previous;
}

function renderManualTargetYear_(ss, sh) {
  const eventName = clean_(sh.getRange('B5').getValue());
  const category = clean_(sh.getRange('D5').getValue());
  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const validCombination = category === '納骨壇' || (eventName === 'お盆' && category === '一般');
  const years = validCombination ? manualAvailableYears_(settings, eventName, category) : [];
  const current = Number(sh.getRange('B7').getValue());
  const year = validCombination
    ? manualTargetYear_(settings, eventName, category, years.includes(current) ? current : '')
    : 0;
  const schedule = year ? getScheduleRule_(settings, year, eventName, category) : null;
  const records = getFormRecords_(settings);
  const formStatus = schedule && schedule.key && records[schedule.key]
    ? clean_(records[schedule.key].status) : '';

  const needsYearChoice = years.length > 1;
  sh.getRange('A7').setValue(needsYearChoice ? '受付対象年 *' : '対象年（自動）');
  sh.getRange('C7').setValue('合同供養日時');
  const yearCell = sh.getRange('B7').clearDataValidations();
  if (needsYearChoice) {
    yearCell.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(years.map(String), true)
      .setAllowInvalid(false)
      .setHelpText('受付する年度を必ず確認してください。読経希望日は同じ年度の日付を指定します。')
      .build());
  }
  yearCell.setValue(year || '—').setBackground(
    validCombination ? (needsYearChoice ? '#fff4cc' : '#e6f4ea') : '#eeeeee'
  );

  if (eventName && category && !validCombination) {
    sh.getRange('D7').setValue('受付対象外');
    sh.getRange('B7').setNote('春彼岸・秋彼岸の一般受付はありません。');
    sh.getRange('D7').setNote('申込者区分を「納骨壇」に変更してください。');
  } else if (schedule && !scheduleValueIsUnset_(schedule.jointDate)) {
    const date = scheduleDateLabel_(schedule.jointDate, schedule.year);
    const time = scheduleValueIsUnset_(schedule.jointTime) ? '' : ` ${schedule.jointTime}`;
    const statusLabel = formStatus ? `［フォーム${formStatus}］` : '';
    sh.getRange('D7').setValue(`${date}${time} ${statusLabel}`.trim());
    sh.getRange('B7').setNote('職員が受付する年度です。法会日程とは別に、必ず年度を確認してください。');
    sh.getRange('D7').setNote('設定シートの合同供養日・開始時刻とフォーム状態を表示しています。職員の直接受付はフォーム停止中でも登録できます。');
  } else {
    sh.getRange('D7').setValue(year ? '日程未設定（登録後に要確認）' : '—');
    sh.getRange('B7').setNote('設定シートの受付対象年を初期値にしています。必要に応じて年度を選び直してください。');
    sh.getRange('D7').setNote('この年度の法会日程が設定されていません。読経を伴う申込は要確認として登録されます。');
  }
}

/**
 * 受付入力の画面を、法会・申込者区分・初盆・供養種別に応じて整理します。
 * 一般のお盆通常申込は「合同供養のみ」に固定し、壇前読経欄を入力不要にします。
 */
function updateManualReceptionMode_(ss, sh) {
  let eventName = clean_(sh.getRange('B5').getValue());
  const category = clean_(sh.getRange('D5').getValue());
  let firstObon = sh.getRange('D13').getValue() === true;

  // 初盆はお盆だけで受けるため、先に法会を統一してから年・日時を表示します。
  if (firstObon && eventName !== 'お盆') {
    sh.getRange('B5').setValue('お盆');
    eventName = 'お盆';
  }
  renderManualTargetYear_(ss, sh);

  const activeBg = '#fffbe6';
  const autoBg = '#e6f4ea';
  const disabledBg = '#eeeeee';
  const activeFont = '#222222';
  const disabledFont = '#777777';

  const requestCell = sh.getRange('B13');
  const firstObonCell = sh.getRange('D13');
  const memorialCells = sh.getRangeList(['B14', 'D14', 'B15', 'D15', 'B16']);
  const ekoCell = sh.getRange('D16');
  const firstObonCells = sh.getRangeList(['B17', 'D17']);
  const attendanceCell = sh.getRange('B19');
  const readingDateCell = sh.getRange('D19');
  const readingTimeCell = sh.getRange('B20');
  const firstObonNotice = sh.getRange('A24');

  const requestRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['合同供養のみ', '合同供養＋納骨壇前読経', '納骨壇前読経のみ'], true)
    .setAllowInvalid(false)
    .setHelpText('納骨壇契約者のみ選択します。一般のお盆通常申込は「合同供養のみ」に自動固定されます。')
    .build();
  const attendanceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['参列する', '寺院一任'], true)
    .setAllowInvalid(false)
    .setHelpText('納骨壇前読経を行う場合のみ選択します。')
    .build();

  firstObon = firstObonCell.getValue() === true;

  // いったん通常入力欄を標準状態へ戻します。
  requestCell.clearDataValidations().clearNote().setBackground(activeBg).setFontColor(activeFont);
  memorialCells.getRanges().forEach(cell => cell.clearNote().setBackground(activeBg).setFontColor(activeFont));
  setManualEkoValidation_(ekoCell);
  ekoCell.clearNote().setBackground(activeBg).setFontColor(activeFont);
  firstObonCells.getRanges().forEach(cell => cell.clearNote().setBackground(disabledBg).setFontColor(disabledFont));
  attendanceCell.clearDataValidations().clearNote().setBackground(activeBg).setFontColor(activeFont);
  readingDateCell.clearNote().setBackground(activeBg).setFontColor(activeFont);
  readingTimeCell.clearNote().setBackground(activeBg).setFontColor(activeFont);
  firstObonCell.setNote(
    '初盆の合同供養会で読上げる場合だけチェックします。別日での個別供養は通常の供養受付を使用してください。'
  );
  firstObonNotice.clearContent().clearNote();

  if (firstObon) {
    requestCell.setValue('初盆供養').setBackground(autoBg)
      .setNote('初盆は20,000円。木札＋塔婆・廻向の証・合同供養会での読上げ対象です。');
    memorialCells.clearContent();
    memorialCells.getRanges().forEach(cell => cell.setBackground(disabledBg).setFontColor(disabledFont));
    ekoCell.setValue('希望する').clearDataValidations().setBackground(autoBg)
      .setNote('初盆は廻向の証ありで固定です。');
    firstObonCells.getRanges().forEach(cell => cell.setBackground(activeBg).setFontColor(activeFont));
    sh.getRange('B17').setNote('初盆対象者の俗名を入力します。戒名がある場合は右欄へ入力してください。');
    sh.getRange('D17').setNote('初盆対象者の戒名を入力します。戒名が不明な場合は俗名だけでも登録できます。');
    attendanceCell.setValue('読経なし').clearDataValidations().setBackground(disabledBg)
      .setNote('初盆は納骨壇前読経の予約欄を使用しません。合同供養会で読上げます。');
    readingDateCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
    readingTimeCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
    firstObonNotice.setValue(
      '【初盆の受付範囲】このシートは合同供養会で読上げる初盆受付専用です。別日での個別供養を希望する場合は、ここでは登録せず通常の供養受付を使用してください。'
    ).setBackground('#fff2cc').setFontColor('#8a4b00').setFontWeight('bold');
    updateManualSimpleVisibility_(sh);
    return;
  }

  // 初盆でない場合は初盆専用欄を空欄にします。
  firstObonCells.clearContent();

  if (category === '一般' && eventName === 'お盆') {
    requestCell.setValue('合同供養のみ').clearDataValidations().setBackground(autoBg)
      .setNote('一般のお盆通常申込は「合同供養のみ」で固定です。');
    attendanceCell.setValue('読経なし').clearDataValidations().setBackground(disabledBg)
      .setNote('一般のお盆通常申込では納骨壇前読経はありません。');
    readingDateCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
    readingTimeCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
    setManualEkoValidation_(ekoCell);
    ekoCell.setBackground(activeBg)
      .setNote('一般のお盆通常申込は、一般信者名簿の前回設定を表示します。変更可能です。');
    updateManualSimpleVisibility_(sh);
    return;
  }

  if (category === '一般' && eventName && eventName !== 'お盆') {
    requestCell.clearContent().clearDataValidations().setBackground(disabledBg)
      .setNote('春彼岸・秋彼岸は納骨壇契約者のみ受付します。');
    memorialCells.clearContent();
    memorialCells.getRanges().forEach(cell => cell.setBackground(disabledBg).setFontColor(disabledFont));
    ekoCell.setValue('希望しない').clearDataValidations().setBackground(disabledBg)
      .setNote('この申込区分は受付対象外です。');
    attendanceCell.clearContent().clearDataValidations().setBackground(disabledBg);
    readingDateCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
    readingTimeCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
    updateManualSimpleVisibility_(sh);
    return;
  }

  if (category === '納骨壇') {
    if (!isAllowedManualRequestType_(category, requestCell.getValue())) requestCell.clearContent();
    requestCell.setDataValidation(requestRule).setBackground(activeBg)
      .setNote('合同供養のみ／合同供養＋納骨壇前読経／納骨壇前読経のみ から選択します。');
    const requestType = normalizeRequestType_(requestCell.getValue(), category);

    if (requestType === '納骨壇前読経のみ') {
      memorialCells.clearContent();
      memorialCells.getRanges().forEach(cell => cell.setBackground(disabledBg).setFontColor(disabledFont));
    }

    if (needsAltarReading_(requestType)) {
      attendanceCell.setDataValidation(attendanceRule).setBackground(activeBg).setFontColor(activeFont)
        .setNote('参列する／寺院一任のどちらかを選択してください。');
      if (!['参列する', '寺院一任'].includes(clean_(attendanceCell.getValue()))) {
        attendanceCell.clearContent();
      }
      if (clean_(attendanceCell.getValue()) === '寺院一任') {
        // 寺院一任でも、寺院側で日時を確定した後は入力できるようにします。
        // 未確定のまま登録する場合は日付・時刻とも空欄で構いません。
        readingDateCell.setBackground(activeBg).setFontColor(activeFont)
          .setNote('寺院一任：日時未確定なら空欄で登録できます。寺院側で確定した場合は、日付と時刻を両方入力してください。');
        readingTimeCell.setBackground(activeBg).setFontColor(activeFont)
          .setNote('寺院一任：日時を確定した場合は、読経日と時刻をセットで入力してください。');
      } else {
        readingDateCell.setBackground(activeBg).setFontColor(activeFont)
          .setNote('参列する場合は読経希望日を入力してください。');
        readingTimeCell.setBackground(activeBg).setFontColor(activeFont)
          .setNote('参列する場合は読経希望時刻を入力してください。');
      }
    } else {
      attendanceCell.setValue('読経なし').clearDataValidations().setBackground(disabledBg)
        .setNote('納骨壇前読経を含まない申込のため、この欄は使用しません。');
      readingDateCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
      readingTimeCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
    }

    if (eventName === 'お盆') {
      ekoCell.setValue('希望する').clearDataValidations().setBackground(autoBg)
        .setNote('納骨壇のお盆は廻向の証ありで固定です。');
    } else if (['春彼岸', '秋彼岸'].includes(eventName)) {
      ekoCell.setValue('希望しない').clearDataValidations().setBackground(disabledBg)
        .setNote('春彼岸・秋彼岸は廻向の証なしです。');
    }
    updateManualSimpleVisibility_(sh);
    return;
  }

  // 区分未選択時は、誤入力を避けるため選択欄だけ案内を残します。
  requestCell.clearContent().clearDataValidations().setBackground(disabledBg)
    .setNote('先に「申込者区分」を選択してください。');
  attendanceCell.clearContent().clearDataValidations().setBackground(disabledBg);
  readingDateCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
  readingTimeCell.clearContent().setBackground(disabledBg).setFontColor(disabledFont);
  updateManualSimpleVisibility_(sh);
}

/** 必要な行だけを表示し、詳細機能が受付画面を占有しないようにします。 */
function updateManualSimpleVisibility_(sh) {
  const firstObon = sh.getRange('D13').getValue() === true;
  const category = clean_(sh.getRange('D5').getValue());
  const requestType = firstObon ? '初盆供養' : normalizeRequestType_(sh.getRange('B13').getValue(), category);
  const needsReading = !firstObon && category === '納骨壇' && needsAltarReading_(requestType);
  const differentSponsor = !!clean_(sh.getRange('D9').getValue());

  const showOrHide = (row, visible) => {
    if (visible) sh.showRows(row);
    else sh.hideRows(row);
  };
  showOrHide(11, differentSponsor);
  showOrHide(17, firstObon);
  showOrHide(19, needsReading);
  // 寺院一任でも寺院側の確定日時を入力できるよう、読経を伴う申込では時刻行も表示します。
  showOrHide(20, needsReading);
  showOrHide(24, firstObon);

  // 入力欄の下は直近3年だけを常時表示します。毎編集時の再表示処理は必要な場合だけ行います。
  const maxRows = sh.getMaxRows();
  if (maxRows >= 27 && !sh.isRowHiddenByUser(27)) {
    sh.hideRows(27, Math.min(4, maxRows - 26));
  }
  if (maxRows >= 36 && !sh.isRowHiddenByUser(36)) {
    sh.hideRows(36, maxRows - 35);
  }
  if (maxRows >= 35 && [31, 32, 33, 34, 35].some(row => sh.isRowHiddenByUser(row))) {
    sh.showRows(31, 5);
  }
}

/** 受付中に迷いやすい名簿・入金項目だけを色で警告します。 */
function ensureManualSimpleConditionalFormats_(sh) {
  const formulas = new Set([
    '=AND($D$5="納骨壇",$B$9<>"",COUNTIF(INDIRECT("\'納骨壇名簿\'!A:A"),$B$9)=0)',
    '=$B$21="未入金"', '=$B$21="一部入金"', '=$B$21="入金済"', '=$B$21="要確認"',
    '=AND($B$21<>"免除",$D$21="")'
  ]);
  const kept = sh.getConditionalFormatRules().filter(rule => {
    const condition = rule.getBooleanCondition();
    const values = condition && condition.getCriteriaValues();
    return !(values && formulas.has(String(values[0] || '')));
  });
  const applicant = sh.getRange('B9');
  const payment = sh.getRange('B21');
  const method = sh.getRange('D21');
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($D$5="納骨壇",$B$9<>"",COUNTIF(INDIRECT("\'納骨壇名簿\'!A:A"),$B$9)=0)')
      .setBackground('#fce8e6').setFontColor('#b3261e').setRanges([applicant]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$B$21="未入金"')
      .setBackground('#fce8e6').setFontColor('#b3261e').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$B$21="一部入金"')
      .setBackground('#fff2cc').setFontColor('#8a4b00').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$B$21="入金済"')
      .setBackground('#e6f4ea').setFontColor('#1e7e34').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$B$21="要確認"')
      .setBackground('#eadcf8').setFontColor('#6a1b9a').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($B$21<>"免除",$D$21="")')
      .setBackground('#fce8e6').setFontColor('#b3261e').setRanges([method]).build()
  ];
  sh.setConditionalFormatRules([...kept, ...rules]);
}

function registerManualReceptionFromMenu() {
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  const sh = mustSheet_(ss, ANNUAL.SHEETS.MANUAL);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const result = registerManualReception_(ss, sh, correctionEditor_({}));
    finishManualReception_(sh, result);
    ss.toast(`受付を登録しました：${result.sponsor}様／${result.status}`, '年間法会受付', 8);
  } catch (error) {
    failManualReception_(ss, sh, error);
  } finally {
    lock.releaseLock();
  }
}

/** 法会と初盆が同時に矛盾した場合の優先順位を一か所で決めます。 */
function reconcileManualEventAndFirstObon_(eventName, firstObon, eventEdited, firstObonEdited) {
  let nextEvent = clean_(eventName);
  let nextFirstObon = firstObon === true;
  // 職員が法会を選び直した操作を最優先にします。
  if (eventEdited && nextEvent !== 'お盆') {
    nextFirstObon = false;
  } else if (firstObonEdited && nextFirstObon) {
    nextEvent = 'お盆';
  }
  return { eventName: nextEvent, firstObon: nextFirstObon };
}

function handleManualReceptionEdit_(e, allowRegistration) {
  const sh = e.range.getSheet();
  const ss = sh.getParent();

  // 次の受付を触り始めたら、前回の登録結果を残して誤認させない。
  const editStartRow = e.range.getRow();
  const editEndRow = editStartRow + e.range.getNumRows() - 1;
  if (editStartRow <= 23 && editEndRow >= 5) {
    sh.getRange('D26').clearContent().setBackground('#ffffff');
  }

  const eventCellEdited = rangeTouchesCell_(e.range, 5, 2);
  const firstObonEdited = rangeTouchesCell_(e.range, 13, 4);

  // 法会の選択を優先します。彼岸を選んだときは初盆を自動解除し、
  // 初盆を新たにチェックしたときだけ法会を「お盆」へ切り替えます。
  if (eventCellEdited || firstObonEdited) {
    const currentEvent = clean_(sh.getRange('B5').getValue());
    const reconciled = reconcileManualEventAndFirstObon_(
      currentEvent, sh.getRange('D13').getValue(), eventCellEdited, firstObonEdited
    );
    if (reconciled.eventName !== currentEvent) {
      sh.getRange('B5').setValue(reconciled.eventName);
      sh.getRange('B7').clearContent();
    }
    if (sh.getRange('D13').getValue() !== reconciled.firstObon) {
      sh.getRange('D13').setValue(reconciled.firstObon);
    }
    if (!reconciled.firstObon && clean_(sh.getRange('B13').getValue()) === '初盆供養') {
      sh.getRange('B13').clearContent();
    }
  }

  // 法会・区分・初盆・供養種別・参列方法が変わったら入力欄を自動整理します。
  const modeChanged = [
    [5, 2],  // 法会
    [5, 4],  // 申込者区分
    [7, 2],  // 受付対象年
    [13, 2], // ご希望の供養
    [13, 4], // 初盆
    [19, 2]  // 読経参列
  ].some(([row, column]) => rangeTouchesCell_(e.range, row, column));
  const recentHistoryChanged = [
    [5, 2],  // 法会
    [5, 4],  // 申込者区分
    [7, 2],  // 対象年
    [9, 2]   // 申込者名
  ].some(([row, column]) => rangeTouchesCell_(e.range, row, column));

  // 法会または申込者区分を変えたら、別の方の供養内容が残らないよう入力を整理します。
  if (eventCellEdited) {
    sh.getRange('B7').clearContent();
    sh.getRangeList(['B14', 'D14', 'B15', 'D15', 'B16']).clearContent();
  }
  if (rangeTouchesCell_(e.range, 5, 4)) {
    sh.getRange('B7').clearContent();
    sh.getRangeList([
      'B9', 'D9', 'B10', 'D10', 'B11', 'B14', 'D14', 'B15', 'D15', 'B16',
      ANNUAL_V16.MANUAL.EMAIL, ANNUAL_V16.MANUAL.PERSON_ID,
      ANNUAL_V16.MANUAL.HOUSEHOLD_ID, ANNUAL_V16.MANUAL.POSTAL_CODE,
      ANNUAL_V16.MANUAL.ADDRESS
    ]).clearContent();
    setManualApplicantValidation_(ss, clean_(sh.getRange('D5').getValue()));
  }

  if (modeChanged) {
    updateManualReceptionMode_(ss, sh);
    fillPreviousManualMemorials_(ss, sh, false);
  }

  // 申込者名を選んだら、フリガナ・電話と前回の供養内容を補完します。
  if (rangeTouchesCell_(e.range, 9, 2)) {
    fillManualApplicantInfo_(ss, sh);
    fillPreviousManualMemorials_(ss, sh, true);
  }

  // 今回施主名を消した場合は、異なる施主用のフリガナも消します。
  if (rangeTouchesCell_(e.range, 9, 4) && !clean_(sh.getRange('D9').getValue())) {
    sh.getRange('B11').clearContent();
  }

  // 受付入力上でも入金済と入金日の関係を補完します。
  const touchesPaymentStatus = rangeTouchesCell_(e.range, 21, 2);
  const touchesPaymentDate = rangeTouchesCell_(e.range, 22, 2);
  const touchesPaymentAmount = rangeTouchesCell_(e.range, 23, 2);
  if (touchesPaymentStatus || touchesPaymentDate) {
    const payStatus = sh.getRange('B21');
    const payDate = sh.getRange('B22');
    if (payStatus.getValue() === '入金済' && !payDate.getValue()) payDate.setValue(new Date());
    if (payDate.getValue() && ['', '未入金'].includes(String(payStatus.getValue()))) {
      payStatus.setValue('入金済');
    }
  }
  // 先に金額だけを入力した場合は、志納料と比べて入金状況を自動で選びます。
  if (touchesPaymentAmount) {
    const amount = Number(sh.getRange(ANNUAL_V16.MANUAL.PAYMENT_AMOUNT).getValue()) || 0;
    const payStatus = sh.getRange('B21');
    const fee = Number(sh.getRange(ANNUAL_V16.MANUAL.FEE_DISPLAY).getValue()) || 0;
    if (amount > 0 && ['', '未入金'].includes(clean_(payStatus.getValue()))) {
      payStatus.setValue(fee > 0 && amount >= fee ? '入金済' : '一部入金');
      const payDate = sh.getRange('B22');
      if (!payDate.getValue()) payDate.setValue(new Date());
    }
  }

  updateManualSimpleVisibility_(sh);
  if (recentHistoryChanged) renderRecentApplicationHistory_(ss, sh);
  if (editStartRow <= 23 && editEndRow >= 5) updateManualV16Preview_(ss, sh);
  if (allowRegistration === false) return;
  if (!rangeTouchesCell_(e.range, 26, 2) || sh.getRange('B26').getValue() !== true) return;

  // チェック直後に処理中表示を出し、二重操作を防ぎます。
  sh.getRange('D26').setValue('登録処理中…しばらくお待ちください').setBackground('#fff2cc');
  SpreadsheetApp.flush();

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const result = registerManualReception_(ss, sh, correctionEditor_(e));
    finishManualReception_(sh, result);
    ss.toast(`受付を登録しました：${result.sponsor}様／${result.status}`, '年間法会受付', 8);
  } catch (error) {
    failManualReception_(ss, sh, error);
  } finally {
    lock.releaseLock();
  }
}

function manualPaymentLabel_(payMethod) {
  const map = {
    '現金': '当日現地にてお支払い',
    '振込': '銀行振込',
    'クレジット': 'クレジット決済',
    'コンビニ': 'コンビニ決済'
  };
  return map[clean_(payMethod)] || '';
}

function readManualReception_(ss, sh, editor) {
  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);

  const timestamp = new Date();
  const responseId = `M_${Utilities.getUuid()}`;
  const eventName = clean_(sh.getRange('B5').getValue());
  const category = clean_(sh.getRange('D5').getValue());
  const year = manualTargetYear_(settings, eventName, category, sh.getRange('B7').getValue());
  if (!Number.isInteger(year) || year < 2025 || year > 2100) {
    throw new Error('選択した法会の対象年を設定シートから判定できません。');
  }
  const receptionMethodInput = clean_(sh.getRange('B6').getValue());
  const receptionMethod = ['電話', '窓口', '郵送'].includes(receptionMethodInput) ? receptionMethodInput : '';
  const receptionStaff = clean_(sh.getRange('D6').getValue()) || clean_(editor) || '職員';

  const applicantName = clean_(sh.getRange('B9').getValue());
  const applicantKana = clean_(sh.getRange('B10').getValue());
  const enteredSponsor = clean_(sh.getRange('D9').getValue());
  const sponsor = enteredSponsor || applicantName;
  const sponsorKana = enteredSponsor
    ? clean_(sh.getRange('B11').getValue())
    : applicantKana;
  const phone = clean_(sh.getRange('D10').getValue());
  const contractor = category === '納骨壇' ? applicantName : '';
  // 連絡先・案内は「らくまる寺務」で管理するため、受付入力では求めません。
  const email = '';
  const guideMethod = 'らくまる寺務';
  // 非表示セルの古い日付は使わず、登録処理を実行した日時を受付日時とします。
  const receivedDate = timestamp;
  const personId = clean_(sh.getRange(ANNUAL_V16.MANUAL.PERSON_ID).getValue());
  const householdId = clean_(sh.getRange(ANNUAL_V16.MANUAL.HOUSEHOLD_ID).getValue());
  const postalCode = clean_(sh.getRange(ANNUAL_V16.MANUAL.POSTAL_CODE).getValue());
  const address = clean_(sh.getRange(ANNUAL_V16.MANUAL.ADDRESS).getValue());

  const firstObon = sh.getRange('D13').getValue() === true;
  const firstObonSecular = clean_(sh.getRange('B17').getValue());
  const firstObonDharma = clean_(sh.getRange('D17').getValue());

  const normalRequestType = category === '一般' && eventName === 'お盆' && !firstObon
    ? '合同供養のみ'
    : normalizeRequestType_(sh.getRange('B13').getValue(), category);
  let normalMemorials = ['B14', 'D14', 'B15', 'D15', 'B16']
    .map(a1 => clean_(sh.getRange(a1).getValue())).filter(Boolean);
  const generalEkoInput = clean_(sh.getRange('D16').getValue());

  let reusedPrevious = null;
  if (!firstObon && normalRequestType !== '納骨壇前読経のみ' && !normalMemorials.length && applicantName) {
    reusedPrevious = findPreviousManualMemorials_(ss, category, applicantName, eventName);
    if (reusedPrevious && reusedPrevious.items.length) {
      normalMemorials = reusedPrevious.items.slice(0, 5);
      writeManualMemorialCells_(
        sh,
        normalMemorials,
        `前回（${reusedPrevious.year || '過去'}年）の供養内容を自動利用しました。変更がある場合だけ修正してください。`
      );
    }
  }

  const requestType = firstObon ? '初盆供養' : normalRequestType;
  const memorials = firstObon
    ? [firstObonDharma || firstObonSecular].filter(Boolean)
    : normalMemorials;
  const applicationContent = firstObon
    ? [
        firstObonSecular ? `俗名：${firstObonSecular}` : '',
        firstObonDharma ? `戒名：${firstObonDharma}` : ''
      ].filter(Boolean).join('\n')
    : memorials.join('\n');

  const attend = firstObon
    ? '読経なし'
    : normalizeAttendance_(sh.getRange('B19').getValue(), requestType);
  const readingDate = firstObon ? '' : (sh.getRange('D19').getValue() || '');
  const readingTime = firstObon ? '' : (sh.getRange('B20').getValue() || '');

  let payStatus = clean_(sh.getRange('B21').getValue()) || '未入金';
  const payMethod = clean_(sh.getRange('D21').getValue());
  let payDate = sh.getRange('B22').getValue() || '';
  const paymentAmount = Number(sh.getRange(ANNUAL_V16.MANUAL.PAYMENT_AMOUNT).getValue()) || 0;
  const paymentReference = clean_(sh.getRange(ANNUAL_V16.MANUAL.PAYMENT_REFERENCE).getValue());
  const userNote = clean_(sh.getRange(ANNUAL_V16.MANUAL.NOTE).getValue());

  if (payStatus === '入金済' && !payDate) payDate = new Date();
  if (payDate && ['', '未入金'].includes(payStatus)) payStatus = '入金済';

  const fatal = [];
  if (!['春彼岸', 'お盆', '秋彼岸'].includes(eventName)) fatal.push('法会を選択してください');
  if (!['納骨壇', '一般'].includes(category)) fatal.push('申込者区分を選択してください');
  if (!receptionMethod) fatal.push('受付方法を選択してください');
  if (!applicantName) fatal.push('申込者名を選択または入力してください');
  if (!sponsor) fatal.push('施主名を確認してください');

  const applicantRecord = findManualApplicantRecord_(ss, category, applicantName, personId);
  if (category === '納骨壇' && applicantName && !applicantRecord) {
    fatal.push('申込者名を納骨壇名簿で確認できません');
  }

  if (firstObon) {
    if (eventName !== 'お盆') fatal.push('初盆はお盆受付でのみ登録できます');
    if (!firstObonSecular && !firstObonDharma) {
      fatal.push('初盆対象者の俗名または戒名を入力してください');
    }
  } else {
    if (eventName && eventName !== 'お盆' && category && category !== '納骨壇') {
      fatal.push('春彼岸・秋彼岸は納骨壇契約者のみです');
    }

    if (!isAllowedManualRequestType_(category, requestType)) fatal.push('ご希望の供養を選択してください');

    if (requestType === '納骨壇前読経のみ') {
      if (memorials.length) fatal.push('読経のみの場合は供養内容①〜⑤を空欄にしてください');
    } else if (!memorials.length) {
      fatal.push('供養内容を入力してください（過去内容がある方は申込者名を選ぶと自動表示されます）');
    }

    if (needsAltarReading_(requestType)) {
      if (!['参列する', '寺院一任'].includes(attend)) fatal.push('読経参列を選択してください');
      if (attend === '参列する' && (!hasValue_(readingDate) || !hasValue_(readingTime))) {
        fatal.push('参列する場合は読経希望日・時刻を入力してください');
      }
      if (attend === '寺院一任' && hasPartialReadingDateTime_(readingDate, readingTime)) {
        fatal.push('寺院一任で日時を確定する場合は、読経日・時刻を両方入力してください');
      }
    }
    if (hasValue_(readingDate)) {
      const readingYear = dateYear_(readingDate);
      if (readingYear && readingYear !== year) fatal.push('読経希望日が申込対象年と一致しません');
    }
  }

  if (!ANNUAL_V16.PAYMENT_STATUSES.includes(payStatus)) fatal.push('入金状況を選択してください');
  if (payStatus !== '免除' && !['現金', '振込', 'クレジット', 'コンビニ'].includes(payMethod)) {
    fatal.push('支払方法を選択してください');
  }

  if (paymentAmount < 0) fatal.push('今回入金額を確認してください');
  if (fatal.length) throw new Error([...new Set(fatal)].join('／'));

  const generalEko = firstObon ? '希望する' : generalEkoInput;
  const eko = firstObon
    ? true
    : eventName === 'お盆' && (category === '納骨壇' || generalEko === '希望する');
  const paymentRaw = manualPaymentLabel_(payMethod);
  const auditNote = [
    `申込者名：${applicantName}`,
    `受付方法：${receptionMethod}`,
    `受付担当：${receptionStaff}`,
    '連絡先・案内：らくまる寺務で管理',
    firstObon ? '初盆：はい' : '',
    reusedPrevious ? `供養内容：${reusedPrevious.year || '過去'}年の内容を自動利用` : '',
    category === '一般' && !applicantRecord ? '一般信者名簿：新規・未登録' : '',
    userNote
  ].filter(Boolean).join('\n');

  return {
    timestamp, receivedDate, responseId, year, eventName, category, receptionMethod, receptionStaff,
    applicantName, applicantKana, contractor, enteredSponsor, sponsor, sponsorKana, phone,
    requestType, memorials, applicationContent, firstObon, firstObonSecular, firstObonDharma,
    generalEko, eko, attend, readingDate, readingTime, payStatus, payMethod, payDate,
    paymentRaw, paymentAmount, paymentReference, email, guideMethod, personId, householdId,
    postalCode, address, auditNote,
    workType: firstObon ? '木札＋塔婆' : (category === '一般' ? '木札' : '経木塔婆')
  };
}

/** 初盆電話受付は、備考（V列）に書いた「申込ID：〜」で申込管理と結び付けます。 */
function firstObonRowsByApplicationId_(sh) {
  const map = new Map();
  if (!sh || sh.getMaxColumns() < 22) return map;
  const lastRow = Math.max(lastDataRowByColumn_(sh, 2), lastDataRowByColumn_(sh, 22));
  if (lastRow < 2) return map;
  sh.getRange(2, 22, lastRow - 1, 1).getDisplayValues().forEach((row, index) => {
    const match = String(row[0] == null ? '' : row[0]).match(/申込ID[:：]\s*(\S+)/);
    if (!match) return;
    const applicationId = clean_(match[1]);
    if (applicationId && !map.has(applicationId)) map.set(applicationId, index + 2);
  });
  return map;
}

function findFirstObonWorkRow_(sh, applicationId) {
  if (!sh || sh.getLastRow() < 2 || !applicationId) return 0;
  const hit = sh.getRange(2, 22, sh.getLastRow() - 1, 1)
    .createTextFinder(`申込ID：${applicationId}`)
    .matchCase(true)
    .useRegularExpression(false)
    .findNext();
  return hit ? hit.getRow() : 0;
}

function writeFirstObonWorkRow_(sh, row, application, fee, correctionNote) {
  const sponsor = clean_(application.sponsor);
  const applicantName = clean_(application.applicantName);
  const enteredSponsor = clean_(application.enteredSponsor) ||
    (sponsor && key_(sponsor) !== key_(applicantName) ? sponsor : '');
  const notes = uniqueTexts_([
    `申込ID：${application.responseId}`,
    application.receptionMethod ? `受付方法：${application.receptionMethod}` : '',
    application.receptionStaff ? `受付担当：${application.receptionStaff}` : '',
    application.auditNote,
    correctionNote
  ]).join('\n');

  // A判定・G札記載施主名・L木札/読上げ名・M供養料はシート数式で算出します。
  // 数式列を上書きせず、入力元となる項目だけ更新します。
  sh.getRange(row, 2, 1, 5).setValues([[
    application.timestamp,
    application.year,
    application.category,
    applicantName,
    enteredSponsor
  ]]);
  sh.getRange(row, 8, 1, 4).setValues([[
    application.sponsorKana || '',
    application.phone || '',
    application.firstObonSecular || '',
    application.firstObonDharma || ''
  ]]);
  sh.getRange(row, 14, 1, 3).setValues([[
    application.payStatus || '未入金',
    application.payMethod || '',
    application.payDate || ''
  ]]);
  // 訂正時は作成済み状態を安全のため未完了へ戻します。
  sh.getRange(row, 17, 1, 5).setValues([[false, false, false, false, false]]);
  sh.getRange(row, 22).setValue(notes);
}

function appendFirstObonWorkRow_(ss, application, fee) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.FIRST_OBON);
  const existing = findFirstObonWorkRow_(sh, application.responseId);
  if (existing) {
    writeFirstObonWorkRow_(sh, existing, application, fee, '');
    return existing;
  }

  const maxRows = sh.getMaxRows();
  const values = sh.getRange(2, 2, maxRows - 1, 1).getDisplayValues();
  const emptyIndex = values.findIndex(row => clean_(row[0]) === '');
  let row = emptyIndex >= 0 ? emptyIndex + 2 : maxRows + 1;

  if (row > maxRows) {
    sh.insertRowAfter(maxRows);
    const source = sh.getRange(maxRows, 1, 1, 22);
    const target = sh.getRange(row, 1, 1, 22);
    source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
  }

  writeFirstObonWorkRow_(sh, row, application, fee, '');
  return row;
}

function syncFirstObonCorrection_(ss, application, fee, auditLine) {
  if (!application.firstObon) return;
  const sh = mustSheet_(ss, ANNUAL.SHEETS.FIRST_OBON);
  let row = findFirstObonWorkRow_(sh, application.responseId);
  if (!row) {
    row = appendFirstObonWorkRow_(ss, application, fee);
  } else {
    writeFirstObonWorkRow_(sh, row, application, fee, auditLine);
  }
}

function assertManualRegistrationReadyV21_(ss) {
  const appSh = ss.getSheetByName(ANNUAL.SHEETS.APPLICATION);
  const manualSh = ss.getSheetByName(ANNUAL.SHEETS.MANUAL);
  if (!appSh || !manualSh ||
      clean_(appSh.getRange(1, ANNUAL_V16.COL.RECEPTION_STATE).getValue()) !== '受付状態') {
    throw new Error('受付に必要なシートまたは列が不足しています。「設定状態を確認」の結果を管理担当者へお知らせください。');
  }
}

function registerManualReception_(ss, sh, editor) {
  // 登録のたびに全シートの構成確認を行わず、受付に必要な目印だけを確認します。
  assertManualRegistrationReadyV21_(ss);
  const application = readManualReception_(ss, sh, editor);
  const rawSh = mustSheet_(ss, ANNUAL.SHEETS.RESPONSE);
  const appSh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  const workSh = ensureWorkSheetSchema_(ss);
  const readingSh = mustSheet_(ss, ANNUAL.SHEETS.READING);

  const issues = [];
  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const scheduleRule = getScheduleRule_(settings, application.year, application.eventName, application.category);
  validateReadingSchedule_(application, scheduleRule).forEach(issue => issues.push(issue));
  validateReadingLeadTime_(application, application.timestamp).forEach(issue => issues.push(issue));
  validateReadingSlotConflict_(appSh, application, scheduleRule).forEach(issue => issues.push(issue));

  const master = application.category === '納骨壇'
    ? getMaster_(ss, application.contractor)
    : [];
  if (application.category === '納骨壇' && application.contractor && !master.length) {
    issues.push('申込者名を納骨壇名簿で確認できません');
  }

  const readingPlan = application.firstObon
    ? { targets: [], issues: [] }
    : buildReadingTargetsFromMaster_(application, master);
  readingPlan.issues.forEach(issue => issues.push(issue));
  readingPlan.targets.forEach(item => { if (item.issue) issues.push(item.issue); });

  const fee = application.firstObon
    ? getFirstObonFee_(ss)
    : calculateFee_(
        ss, application.eventName, application.category,
        application.requestType, application.memorials.length
      );
  if (!Number.isFinite(fee) || fee <= 0) issues.push('志納料設定が不正');
  const config = getAnnualConfig_(settings);
  const paymentPlan = buildPaymentPlan_(ss, config, application, fee);
  // 一般・初盆はEC商品を持たないため、オンライン決済の商品URLは要求しません。
  if (requiresEcProductUrl_(application) && paymentPlan.items.some(item => !item.url)) {
    issues.push('オンライン決済の商品URLが未設定');
  }
  findPotentialDuplicateIssues_(appSh, application).forEach(issue => issues.push(issue));

  const globalIssues = [...issues];
  const resolved = application.firstObon
    ? [{
        name: application.firstObonDharma || application.firstObonSecular,
        type: application.firstObonDharma ? '戒名' : '俗名',
        issue: ''
      }]
    : application.memorials.map(raw =>
        resolveMemorial_(raw, application.category, master)
      );
  resolved.forEach(item => { if (item.issue) issues.push(item.issue); });

  const uniqueIssues = [...new Set(issues.filter(Boolean))];
  const status = uniqueIssues.length ? '要確認' : '作成可';
  const issueText = uniqueIssues.join('／');
  const rawStatus = uniqueIssues.length ? '要確認' : '受付済';
  let payStatus = application.payStatus;
  if (payStatus === '入金済' && application.paymentAmount <= 0 && fee > 0) {
    application.paymentAmount = fee;
  }
  if (payStatus !== '免除') {
    if (application.paymentAmount <= 0) payStatus = '未入金';
    else if (application.paymentAmount < fee) payStatus = '一部入金';
    else if (application.paymentAmount === fee) payStatus = '入金済';
    else payStatus = '要確認';
  }
  if (application.paymentAmount > 0 && !application.payDate) application.payDate = new Date();
  application.payStatus = payStatus;
  Object.assign(application, { fee, paymentPlan, status, issues: uniqueIssues });
  const receptionState = isExplicitTestApplication_(application) ? 'テスト' : '受付中';

  // 新規の一般信者は、申込行を書き込む前に人物IDを確定させます。
  // これにより一般信者名簿と申込管理 AN/AT が初回登録時から同じIDになります。
  if (application.category === '一般') {
    upsertGeneralApplicantContact_(ss, application);
    application.generalContactUpserted = true;
  }

  writeFirstEmptyIdRow_(rawSh, 2, [
    application.timestamp, application.responseId, application.email, application.year,
    application.eventName, application.category, application.contractor,
    application.sponsor, application.sponsorKana, application.phone,
    application.requestType, ...pad_(application.memorials, 5), application.firstObon,
    application.attend, application.readingDate, application.readingTime,
    application.paymentRaw, application.generalEko, application.auditNote,
    rawStatus, issueText
  ]);

  const appRow = writeFirstEmptyIdRow_(appSh, 2, [
    status, application.responseId, application.timestamp, application.year,
    application.eventName, application.category, application.contractor,
    application.sponsor, application.sponsorKana, application.phone,
    application.requestType, application.applicationContent, application.memorials.length,
    fee, application.eko, application.attend, application.readingDate,
    application.readingTime, application.receptionMethod, application.payStatus,
    application.payMethod, application.payDate, false, false,
    [application.auditNote, issueText].filter(Boolean).join('\n')
  ]);
  const noticeState = application.guideMethod === 'メール' ? '送信処理中'
    : application.guideMethod === '印刷' ? '印刷待ち'
    : application.guideMethod === '郵送' ? '郵送待ち'
    : application.guideMethod === 'らくまる寺務' ? '外部管理' : '案内不要';
  writeApplicationV16Fields_(appSh, appRow, application, {
    receptionState,
    contentState: uniqueIssues.length ? '要確認' : '確認済',
    noticeState,
    guideMethod: application.guideMethod,
    paymentAmount: application.paymentAmount,
    paymentTotal: application.payStatus === '免除' ? 0 : application.paymentAmount,
    paymentReference: application.paymentReference,
    personId: application.personId,
    householdId: application.householdId,
    email: application.email,
    verifier: application.paymentAmount > 0 ? editor : ''
  });

  resolved.forEach((item, index) => {
    const rowIssue = [...new Set([...globalIssues, item.issue].filter(Boolean))].join('／');
    writeFirstEmptyIdRow_(workSh, 5, [
      rowIssue ? '要確認' : '作成可', application.year, application.eventName,
      application.category, application.responseId, index + 1, application.sponsor,
      item.name, item.type, application.firstObon,
      application.workType, application.eko,
      false, false, false, false, application.contractor,
      application.firstObon ? application.applicationContent : application.memorials[index],
      rowIssue, application.timestamp,
      receptionState, application.payStatus, '未督促'
    ]);
  });

  readingPlan.targets.forEach((item, index) => {
    const rowIssue = [...new Set([...uniqueIssues, item.issue].filter(Boolean))].join('／');
    writeFirstEmptyIdRow_(readingSh, 4, [
      rowIssue ? '要確認' : '作成可', application.year, application.eventName,
      application.responseId, index + 1, application.contractor, item.altar,
      item.altarType, item.number, item.name, item.type, application.attend,
      application.readingDate, application.readingTime, false, rowIssue,
      application.timestamp,
      receptionState, application.payStatus, '未督促'
    ]);
  });

  if (application.firstObon) {
    appendFirstObonWorkRow_(ss, application, fee);
  }

  updateMemorialHistoryMaster_(ss, application);

  // 新規受付の入金合計・未収額・各一覧の状態は上の書込みで確定済みです。
  // 全履歴の再集計と同一IDの再検索は行わず、登録待ち時間を短縮します。
  if (application.paymentAmount > 0) upsertMainPaymentHistory_(ss, application, editor);

  if (application.guideMethod === 'メール') {
    const mailIssue = sendManualApplicantGuide_(config, application);
    updateApplicationNoticeState_(appSh, appRow, mailIssue ? '送信失敗' : '送信済');
    if (mailIssue) {
      appSh.getRange(appRow, 25).setValue(appendText_(appSh.getRange(appRow, 25).getValue(), mailIssue));
    }
  }
  // 登録直後に「読経用一覧」のチェック列も新しい明細件数へ揃えます。
  syncReadingViewCheckboxes_(ss);
  return {
    id: application.responseId,
    sponsor: application.sponsor,
    status,
    fee,
    firstObon: application.firstObon,
    noticeState
  };
}

function resetManualPreviewV21_(sh) {
  sh.getRange('F15').setValue('未入力');
  sh.getRange('F16').clearContent();
  sh.getRange(ANNUAL_V16.MANUAL.FEE_DISPLAY).clearContent();
  sh.getRange('F17').setValue('未選択／未入金');
  sh.getRange('F18').setValue('らくまる寺務');
  sh.getRange('F19').setValue('要確認').setBackground('#fff2cc');
  sh.getRange(ANNUAL_V16.MANUAL.PREVIEW)
    .setValue('法会未選択\n区分未選択\n受付方法未選択\n申込者名未入力\n供養内容未入力\n支払方法未選択')
    .setBackground('#fff2cc');
}

function finishManualReception_(sh, result) {
  const resultText = `登録済：${Utilities.formatDate(new Date(), ANNUAL.TIMEZONE, 'yyyy/MM/dd HH:mm')}／` +
    `${result.sponsor}様／${result.firstObon ? '初盆／' : ''}${formatYen_(result.fee)}／${result.status}／${result.noticeState || '案内未処理'}`;
  sh.getRange('D26').setValue(resultText).setBackground('#e6f4ea');
  sh.getRange('B26').setValue(false);

  sh.getRangeList([
    'B5', 'D5', 'B6', 'D6', 'B7',
    'B9', 'D9', 'B10', 'D10', 'B11',
    'B13', 'B14', 'D14', 'B15', 'D15', 'B16', 'D16',
    'B17', 'D17',
    'B19', 'D19', 'B20',
    'B21', 'D21', 'B22', 'B23', ANNUAL_V16.MANUAL.NOTE
  ]).clearContent();
  sh.getRangeList([
    ANNUAL_V16.MANUAL.EMAIL, ANNUAL_V16.MANUAL.GUIDE_METHOD,
    ANNUAL_V16.MANUAL.RECEIVED_DATE, ANNUAL_V16.MANUAL.PERSON_ID,
    ANNUAL_V16.MANUAL.HOUSEHOLD_ID, ANNUAL_V16.MANUAL.POSTAL_CODE,
    ANNUAL_V16.MANUAL.ADDRESS, ANNUAL_V16.MANUAL.PAYMENT_AMOUNT,
    ANNUAL_V16.MANUAL.PAYMENT_REFERENCE, ANNUAL_V16.MANUAL.PREVIEW,
    ANNUAL_V16.MANUAL.FEE_DISPLAY
  ]).clearContent();
  sh.getRange(ANNUAL_V16.MANUAL.RECEIVED_DATE).clearContent()
    .setNote('受付日時は登録処理を行った時刻を自動記録します。');
  sh.getRange('D13').setValue(false);
  setManualApplicantValidation_(sh.getParent(), '');
  updateManualReceptionMode_(sh.getParent(), sh);
  resetManualPreviewV21_(sh);
  renderRecentApplicationHistory_(sh.getParent(), sh);
  // 次の受付へ前件の入金情報を持ち越さない。プレビュー更新後にも明示的に空欄を保証します。
  sh.getRangeList(['B21', 'B22', ANNUAL_V16.MANUAL.PAYMENT_AMOUNT]).clearContent();
  SpreadsheetApp.flush();
}

function failManualReception_(ss, sh, error) {
  const detail = error && error.message ? error.message : String(error);
  sh.getRange('B26').setValue(false);
  sh.getRange('D26').setValue(`登録できません：${detail}`).setBackground('#fce8e6');
  ss.toast(`受付を登録できませんでした：${detail}`, '年間法会受付', 10);
}

/**
 * 認可済みのインストール型編集トリガーから実行します。
 * 受付登録後のメール送信を含むため、単純 onEdit からは呼びません。
 */
function onAnnualMemorialEdit(e) {
  if (!e || !e.range) return;
  if (e.range.getRow() < 2) return;
  const sheetName = e.range.getSheet().getName();
  if (sheetName === ANNUAL.SHEETS.MANUAL) {
    // 通常の画面更新は単純onEditで行い、認可が必要な登録処理だけをここで実行します。
    if (rangeTouchesCell_(e.range, 26, 2) && e.range.getSheet().getRange('B26').getValue() === true) {
      handleManualReceptionEdit_(e, true);
    }
    return;
  }
  if (sheetName === ANNUAL.SHEETS.FIRST_OBON) {
    handleFirstObonPhoneEdit_(e);
    return;
  }
  if (sheetName === ANNUAL.SHEETS.READING_VIEW) {
    handleReadingViewEdit_(e);
    return;
  }
  if (sheetName === ANNUAL.SHEETS.READING) {
    handleReadingTargetEdit_(e);
    return;
  }
  if (sheetName === ANNUAL.SHEETS.PAYMENT_HISTORY) {
    handlePaymentHistoryEdit_(e);
    return;
  }
  if (sheetName !== ANNUAL.SHEETS.APPLICATION) return;
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  if (handleContractorCorrectionEdit_(e, firstColumn, lastColumn)) return;
  const watchedColumns = [
    20, 21, 22, 23,
    ANNUAL_V16.COL.RECEPTION_STATE, ANNUAL_V16.COL.PAYMENT_ENTRY,
    ANNUAL_V16.COL.PAYMENT_REFERENCE, ANNUAL_V16.COL.PAYMENT_VERIFIER,
    ANNUAL_V16.COL.EXCLUSION_REASON, ANNUAL_V16.COL.REMINDER_STATE
  ];
  if (!watchedColumns.some(column => column >= firstColumn && column <= lastColumn)) return;
  const sh = e.range.getSheet();
  const start = e.range.getRow();
  const end = start + e.range.getNumRows() - 1;
  const readingViewNeedsSync =
    ANNUAL_V16.COL.RECEPTION_STATE >= firstColumn &&
    ANNUAL_V16.COL.RECEPTION_STATE <= lastColumn;
  for (let row = start; row <= end; row++) {
    if ([20, 21, 22].some(column => column >= firstColumn && column <= lastColumn)) {
      const status = sh.getRange(row, 20);
      const payMethod = sh.getRange(row, 21);
      const payDate = sh.getRange(row, 22);
      if (status.getValue() === '入金済' && !payDate.getValue()) payDate.setValue(new Date());
      if (payDate.getValue() && ['', '未入金'].includes(String(status.getValue()))) status.setValue('入金済');
      const applicationId = clean_(sh.getRange(row, 2).getValue());
      if (applicationId) {
        syncFirstObonPaymentFromApplication_(
          sh.getParent(), applicationId, status.getValue(), payMethod.getValue(), payDate.getValue()
        );
      }
    }
    if ([
      ANNUAL_V16.COL.PAYMENT_ENTRY, ANNUAL_V16.COL.PAYMENT_REFERENCE,
      ANNUAL_V16.COL.PAYMENT_VERIFIER, 20, 21, 22
    ].some(column => column >= firstColumn && column <= lastColumn)) {
      const applicationId = clean_(sh.getRange(row, 2).getValue());
      if (applicationId) {
        upsertMainPaymentHistoryFromApplicationRow_(sh.getParent(), sh, row);
        syncPaymentSummaryForApplication_(sh.getParent(), applicationId);
      }
    }
    if ([ANNUAL_V16.COL.RECEPTION_STATE, ANNUAL_V16.COL.EXCLUSION_REASON, ANNUAL_V16.COL.REMINDER_STATE]
      .some(column => column >= firstColumn && column <= lastColumn)) {
      const applicationId = clean_(sh.getRange(row, 2).getValue());
      const receptionState = clean_(sh.getRange(row, ANNUAL_V16.COL.RECEPTION_STATE).getValue()) || '受付中';
      const paymentStatus = clean_(sh.getRange(row, 20).getValue()) || '未入金';
      const reminderState = clean_(sh.getRange(row, ANNUAL_V16.COL.REMINDER_STATE).getValue()) || '未督促';
      if (applicationId) syncOperationalStatus_(sh.getParent(), applicationId, receptionState, paymentStatus, reminderState);
      if (ANNUAL_V16.EXCLUDED_RECEPTION_STATES.includes(receptionState) &&
          !clean_(sh.getRange(row, ANNUAL_V16.COL.EXCLUSION_REASON).getValue())) {
        sh.getRange(row, ANNUAL_V16.COL.EXCLUSION_REASON)
          .setBackground('#fff2cc').setNote('取消・重複・テストの理由を入力してください。');
      }
    }
    if (23 >= firstColumn && 23 <= lastColumn) {
      const applicationId = clean_(sh.getRange(row, 2).getValue());
      if (applicationId) syncReadingCompletion_(sh.getParent(), applicationId, sh.getRange(row, 23).getValue() === true);
    }
  }
  // 受付状態が「取消・重複・テスト」等へ変わるとFILTERの表示行が入れ替わります。
  // A列の読経済チェックが別の申込へずれないよう、状態同期後に1回だけ貼り直します。
  if (readingViewNeedsSync) syncReadingViewCheckboxes_(sh.getParent());
}

function syncReadingCompletion_(ss, applicationId, done) {
  const readingSh = mustSheet_(ss, ANNUAL.SHEETS.READING);
  const lastRow = lastDataRowByColumn_(readingSh, 4);
  if (lastRow < 2) return;
  readingSh.getRange(2, 4, lastRow - 1, 1)
    .createTextFinder(String(applicationId)).matchEntireCell(true).findAll()
    .forEach(hit => readingSh.getRange(hit.getRow(), 15).setValue(done));
  syncReadingViewCheckboxes_(ss);
}

function syncFirstObonPaymentFromApplication_(ss, applicationId, payStatus, payMethod, payDate) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.FIRST_OBON);
  const row = findFirstObonWorkRow_(sh, applicationId);
  if (!row) return;
  sh.getRange(row, 14, 1, 3).setValues([[
    clean_(payStatus), clean_(payMethod), payDate || ''
  ]]);
}

function handleReadingTargetEdit_(e) {
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  if (!(15 >= firstColumn && 15 <= lastColumn)) return;
  const readingSh = e.range.getSheet();
  const appSh = mustSheet_(readingSh.getParent(), ANNUAL.SHEETS.APPLICATION);
  const readingLastRow = lastDataRowByColumn_(readingSh, 4);
  const ids = new Set();
  for (let row = e.range.getRow(); row < e.range.getRow() + e.range.getNumRows(); row++) {
    const applicationId = clean_(readingSh.getRange(row, 4).getValue());
    if (applicationId) ids.add(applicationId);
  }
  ids.forEach(applicationId => {
    if (readingLastRow < 2) return;
    const hits = readingSh.getRange(2, 4, readingLastRow - 1, 1)
      .createTextFinder(applicationId).matchEntireCell(true).findAll();
    const allDone = hits.length > 0 && hits.every(hit => readingSh.getRange(hit.getRow(), 15).getValue() === true);
    const appRow = findIdRow_(appSh, 2, applicationId);
    if (appRow) appSh.getRange(appRow, 23).setValue(allDone);
  });
}

/**
 * 職員が日常操作する読経画面です。
 * A列のチェックだけを書き込み欄とし、明細は「読経対象一覧」から自動表示します。
 */
function ensureReadingOperationViewV23_(ss) {
  let sh = ss.getSheetByName(ANNUAL.SHEETS.READING_VIEW);
  if (!sh) sh = ss.insertSheet(ANNUAL.SHEETS.READING_VIEW);

  if (sh.getMaxColumns() < 17) {
    sh.insertColumnsAfter(sh.getMaxColumns(), 17 - sh.getMaxColumns());
  }
  // 日常運用で十分な1,500行だけを書式対象にし、5,000行全体の再書式を避けます。
  // 既存データが1,500行を超えている場合は、その最終行までは安全に整備します。
  const baseViewRows = 1500;
  if (sh.getMaxRows() < baseViewRows) {
    sh.insertRowsAfter(sh.getMaxRows(), baseViewRows - sh.getMaxRows());
  }
  const viewLastRow = Math.min(sh.getMaxRows(), Math.max(
    baseViewRows,
    lastDataRowByColumn_(sh, 1),
    lastDataRowByColumn_(sh, 14)
  ));

  // A1:M1・A3:M3 の結合セルはA列をまたぐため、A列だけを固定すると
  // 「結合されたセルの一部だけを含む列を固定できない」例外になります。
  // 初期設定の再実行時も安全なよう、結合を作り直す前に列固定を解除します。
  if (sh.getFrozenColumns() !== 0) sh.setFrozenColumns(0);

  const savedYear = sh.getRange('B2').getValue();
  const savedEvent = clean_(sh.getRange('D2').getValue());
  const savedDisplay = clean_(sh.getRange('F2').getValue());
  const savedDate = sh.getRange('H2').getValue();
  const yearValue = clean_(savedYear) === 'すべて' ? 'すべて' : (Number(savedYear) || new Date().getFullYear());
  const eventValue = ['すべて', '春彼岸', 'お盆', '秋彼岸'].includes(savedEvent) ? savedEvent : 'すべて';
  const displayValue = ['すべて', '未読のみ', '読経済のみ'].includes(savedDisplay) ? savedDisplay : 'すべて';

  sh.getRange(1, 1, viewLastRow, 17).clearContent().clearNote().clearDataValidations();
  sh.getRange('A1:Q4').breakApart();
  sh.getRange('A1:M1').merge().setValue('読経管理｜法会当日用');
  sh.getRange('I2:M2').merge().setValue('A列のチェックで読経済を更新します。内容訂正は「申込管理」で行います。');
  sh.getRange('A3:M3').merge().setValue('年度・法会・表示・読経日で絞り込みできます。赤い確認事項がある行も表示し、A列のチェックは申込管理へ自動反映します。');
  sh.getRange('A2:H2').setValues([[
    '年度', yearValue, '法会', eventValue, '表示', displayValue, '読経日', savedDate || ''
  ]]);
  sh.getRange('A4:M4').setValues([[
    '読経済', '読経日', '時刻', '法会', '申込者名', '申込者フリガナ',
    '読経名', '読経名フリガナ', '表記', '納骨壇', '番号', '参列', '確認事項'
  ]]);

  sh.getRange('Q1').setValue('年度候補');
  sh.getRange('Q2').setFormula(
    '={"すべて";IFERROR(SORT(UNIQUE(FILTER(\'読経対象一覧\'!B2:B,\'読経対象一覧\'!B2:B<>""))),"")}'
  );
  sh.getRange('B2').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(sh.getRange(`Q2:Q${viewLastRow}`), true).setAllowInvalid(false).build());
  sh.getRange('D2').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['すべて', '春彼岸', 'お盆', '秋彼岸'], true).setAllowInvalid(false).build());
  sh.getRange('F2').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['すべて', '未読のみ', '読経済のみ'], true).setAllowInvalid(false).build());
  sh.getRange('H2').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireDate().setAllowInvalid(false).build()).setNumberFormat('yyyy/m/d');

  sh.getRange('B5').setFormula(
    `=IFERROR(SORT(FILTER({` +
    `'読経対象一覧'!M2:M,'読経対象一覧'!N2:N,'読経対象一覧'!C2:C,` +
    `'読経対象一覧'!U2:U,'読経対象一覧'!V2:V,'読経対象一覧'!J2:J,` +
    `'読経対象一覧'!W2:W,'読経対象一覧'!K2:K,'読経対象一覧'!G2:G,` +
    `'読経対象一覧'!I2:I,'読経対象一覧'!L2:L,'読経対象一覧'!P2:P,` +
    `'読経対象一覧'!D2:D,'読経対象一覧'!E2:E,'読経対象一覧'!O2:O},` +
    `REGEXMATCH('読経対象一覧'!A2:A,"^(作成可|要確認)$"),'読経対象一覧'!R2:R="受付中",` +
    `IF($B$2="すべて",ROW('読経対象一覧'!A2:A)>0,'読経対象一覧'!B2:B=$B$2),` +
    `IF($D$2="すべて",ROW('読経対象一覧'!A2:A)>0,'読経対象一覧'!C2:C=$D$2),` +
    `IF($F$2="すべて",ROW('読経対象一覧'!A2:A)>0,IF($F$2="未読のみ",'読経対象一覧'!O2:O=FALSE,'読経対象一覧'!O2:O=TRUE)),` +
    `IF($H$2="",ROW('読経対象一覧'!A2:A)>0,'読経対象一覧'!M2:M=$H$2)),` +
    `1,TRUE,2,TRUE,9,TRUE,10,TRUE),"")`
  );

  sh.getRange(`A1:M${viewLastRow}`).setFontFamily('Noto Sans JP').setFontSize(10)
    .setVerticalAlignment('middle');
  sh.getRange('A1:M1').setBackground('#1f4e78').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(15).setHorizontalAlignment('left');
  sh.getRange('A2:H2').setBackground('#fff4cc');
  sh.getRangeList(['A2', 'C2', 'E2', 'G2']).setBackground('#edf2f7').setFontWeight('bold');
  sh.getRange('I2:M2').setBackground('#eaf2f8').setFontColor('#34495e').setWrap(true);
  sh.getRange('A3:M3').setBackground('#fff8e1').setFontColor('#6b4f00').setWrap(true);
  sh.getRange('A4:M4').setBackground('#5b7fa3').setFontColor('#ffffff')
    .setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
  sh.getRange(`A5:M${viewLastRow}`).setBackground('#ffffff').setFontColor('#202124').setWrap(true);
  sh.getRange(`A5:A${viewLastRow}`).setHorizontalAlignment('center');
  sh.getRange(`B5:D${viewLastRow}`).setHorizontalAlignment('center');
  sh.getRange(`I5:L${viewLastRow}`).setHorizontalAlignment('center');
  sh.getRange(`B5:B${viewLastRow}`).setNumberFormat('m/d(ddd)');
  sh.getRange(`C5:C${viewLastRow}`).setNumberFormat('hh:mm');
  sh.getRange(`A4:M${viewLastRow}`).setBorder(true, true, true, true, false, true, '#d7dee5', SpreadsheetApp.BorderStyle.SOLID);
  [72, 92, 72, 88, 155, 155, 220, 200, 72, 88, 62, 95, 260]
    .forEach((width, index) => sh.setColumnWidth(index + 1, width));
  sh.setRowHeight(1, 40);
  sh.setRowHeight(2, 38);
  sh.setRowHeight(3, 30);
  sh.setRowHeight(4, 38);
  sh.setRowHeights(5, viewLastRow - 4, 32);
  sh.setFrozenRows(4);
  // タイトル・案内行の結合セルと競合するため、列固定は行いません。
  sh.setFrozenColumns(0);
  sh.setHiddenGridlines(true);

  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$A5=TRUE')
      .setBackground('#e6f4ea').setFontColor('#666666').setRanges([sh.getRange(`A5:M${viewLastRow}`)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$L5="参列する"')
      .setBackground('#fff2cc').setBold(true).setRanges([sh.getRange(`L5:L${viewLastRow}`)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$M5<>""')
      .setBackground('#fce8e6').setFontColor('#b3261e').setBold(true)
      .setRanges([sh.getRange(`M5:M${viewLastRow}`)]).build()
  ]);
  sh.showColumns(1, sh.getMaxColumns());
  sh.hideColumns(14, 4); // 申込ID・枝番・元の読経済・年度候補は内部照合用
  if (sh.isSheetHidden()) sh.showSheet();
  const source = ss.getSheetByName(ANNUAL.SHEETS.READING);
  if (source && !source.isSheetHidden()) source.hideSheet();
  SpreadsheetApp.flush();
  syncReadingViewCheckboxes_(ss);
  return sh;
}

/** 表示中の明細件数に合わせ、A列へ必要な分だけチェックボックスを置きます。 */
function syncReadingViewCheckboxes_(ss) {
  const sh = ss.getSheetByName(ANNUAL.SHEETS.READING_VIEW);
  if (!sh || clean_(sh.getRange('A1').getValue()) !== clean_('読経管理｜法会当日用')) return;
  SpreadsheetApp.flush();
  const oldLastRow = Math.max(4, lastDataRowByColumn_(sh, 1));
  const newLastRow = Math.max(4, lastDataRowByColumn_(sh, 14)); // N列＝申込ID
  const clearLastRow = Math.max(oldLastRow, newLastRow);
  if (clearLastRow >= 5) {
    sh.getRange(5, 1, clearLastRow - 4, 1).clearContent().clearDataValidations();
  }
  if (newLastRow < 5) return;
  const doneValues = sh.getRange(5, 16, newLastRow - 4, 1).getValues()
    .map(row => [row[0] === true]);
  const range = sh.getRange(5, 1, doneValues.length, 1);
  range.insertCheckboxes();
  range.setValues(doneValues).setHorizontalAlignment('center');
}

/** 「読経用一覧」のチェックを裏方明細と申込管理へ同期します。 */
function handleReadingViewEdit_(e) {
  const view = e.range.getSheet();
  const startRow = Math.max(5, e.range.getRow());
  const endRow = e.range.getRow() + e.range.getNumRows() - 1;
  if (endRow < 5 || e.range.getColumn() > 1 ||
      e.range.getColumn() + e.range.getNumColumns() - 1 < 1) return;

  const ss = view.getParent();
  const source = mustSheet_(ss, ANNUAL.SHEETS.READING);
  const sourceLastRow = lastDataRowByColumn_(source, 4);
  if (sourceLastRow < 2) return;
  const sourceKeys = source.getRange(2, 4, sourceLastRow - 1, 2).getDisplayValues();
  const rowByKey = new Map();
  sourceKeys.forEach((row, index) => {
    const branch = clean_(row[1]).replace(/\.0$/, '');
    if (clean_(row[0])) rowByKey.set(`${clean_(row[0])}|${branch}`, index + 2);
  });

  // 「未読のみ」表示ではチェック後に行が消えるため、表示中のキーを先に一括取得します。
  const editedRows = view.getRange(startRow, 1, endRow - startRow + 1, 15).getValues()
    .map(row => ({
      done: row[0] === true,
      applicationId: clean_(row[13]),
      branch: clean_(row[14]).replace(/\.0$/, '')
    }));
  const affectedRows = [];
  editedRows.forEach(item => {
    const applicationId = item.applicationId;
    const branch = item.branch;
    if (!applicationId) return;
    const sourceRow = rowByKey.get(`${applicationId}|${branch}`);
    if (!sourceRow) return;
    source.getRange(sourceRow, 15).setValue(item.done);
    affectedRows.push(sourceRow);
  });
  if (!affectedRows.length) return;
  SpreadsheetApp.flush();
  const first = Math.min(...affectedRows);
  const last = Math.max(...affectedRows);
  handleReadingTargetEdit_({ range: source.getRange(first, 15, last - first + 1, 1) });
  syncReadingViewCheckboxes_(ss);
}

function handleFirstObonPhoneEdit_(e) {
  const sh = e.range.getSheet();
  const start = e.range.getRow();
  const end = start + e.range.getNumRows() - 1;
  for (let row = start; row <= end; row++) {
    const values = sh.getRange(row, 3, 1, 20).getValues()[0]; // C:V
    const hasInput = values.some(value => value !== '' && value !== false);
    const receivedAt = sh.getRange(row, 2); // B
    const payStatus = sh.getRange(row, 14); // N
    const payDate = sh.getRange(row, 16); // P
    if (hasInput && !receivedAt.getValue()) receivedAt.setValue(new Date());
    if (hasInput && !payStatus.getValue()) payStatus.setValue('未入金');
    if (payStatus.getValue() === '入金済' && !payDate.getValue()) payDate.setValue(new Date());
    if (payDate.getValue() && ['', '未入金'].includes(String(payStatus.getValue()))) {
      payStatus.setValue('入金済');
    }
  }
}

/**
 * 「修正反映」がTRUEなのに、修正日時または修正者が残っていない行を検出します。
 * onEdit処理の途中停止・トリガー不調などで、関連台帳へ反映されていない可能性がある行です。
 */
function findPendingCorrectionRows_(ss) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  const lastRow = lastDataRowByColumn_(sh, 2);
  if (lastRow < 2) return [];

  const correction = ANNUAL.CORRECTION;
  const values = sh.getRange(2, correction.NAME_COLUMN, lastRow - 1, 4).getValues();
  const names = sh.getRange(2, 7, lastRow - 1, 2).getDisplayValues(); // G契約者名:H施主名
  const pending = [];
  values.forEach((row, index) => {
    if (row[1] !== true) return; // AA 修正反映
    // 正常終了時はAB修正日時・AC修正者の両方が必ず記録されます。
    if (hasValue_(row[2]) && hasValue_(row[3])) return;
    const contractor = clean_(names[index][0]);
    const sponsor = clean_(names[index][1]);
    const label = contractor && sponsor && key_(contractor) !== key_(sponsor)
      ? `${contractor}（施主：${sponsor}）`
      : (contractor || sponsor || '氏名未入力');
    pending.push(`${index + 2}行：${label}`);
  });
  return pending;
}

function checkAnnualMemorialSetup() {
  resetAnnualRuntimeCache_();
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const records = Object.values(getFormRecords_(settings));
  const expected = Object.keys(ANNUAL.FORM_LABELS).length;

  const registered = records.filter(record =>
    record.formId && record.publishedUrl && record.editUrl
  ).length;
  const openConfigured = records.filter(record => record.status === '受付中').length;

  const handlerTriggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === ANNUAL.HANDLER);
  const editTriggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'onAnnualMemorialEdit' &&
      trigger.getEventType() === ScriptApp.EventType.ON_EDIT);
  const editTriggerReady = editTriggers.length === 1 &&
    clean_(editTriggers[0].getTriggerSourceId()) === clean_(ss.getId());
  const changeTriggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'onAnnualMemorialChange' &&
      trigger.getEventType() === ScriptApp.EventType.ON_CHANGE);
  const changeTriggerReady = changeTriggers.length === 1 &&
    clean_(changeTriggers[0].getTriggerSourceId()) === clean_(ss.getId());
  const registeredFormIds = new Set(records.map(record => record.formId));
  const correctlyTriggered = records.filter(record =>
    handlerTriggers.filter(trigger =>
      clean_(trigger.getTriggerSourceId()) === record.formId
    ).length === 1
  ).length;
  const orphanTriggerCount = handlerTriggers.filter(trigger =>
    !registeredFormIds.has(clean_(trigger.getTriggerSourceId()))
  ).length;

  let linkedForms = 0;
  let statusSynced = 0;
  const formStateIssues = [];
  records.forEach(record => {
    try {
      const form = FormApp.openById(record.formId);
      if (getFormDestinationId_(form) === ss.getId()) linkedForms++;
      const expectedAccepting = record.status === '受付中';
      if (form.isAcceptingResponses() === expectedAccepting) {
        statusSynced++;
      } else {
        formStateIssues.push(`${record.eventName}・${record.category}の受付状態`);
      }
    } catch (error) {
      formStateIssues.push(`${record.eventName}・${record.category}を開けません`);
    }
  });

  let config = {};
  let configIssue = '';
  try {
    config = getAnnualConfig_(settings);
    validateAnnualConfig_(config);
  } catch (error) {
    configIssue = error && error.message ? error.message : String(error);
  }
  const baseYear = Number(config['受付対象年']);
  const validYear = Number.isInteger(baseYear) && baseYear >= 2025 && baseYear <= 2100;
  const scheduleRules = getScheduleRules_(settings);
  const scheduleReady = records.filter(record => {
    const schedule = scheduleRules.find(rule => rule.key === record.key);
    if (!schedule || !Number.isInteger(Number(schedule.year))) return false;
    if (scheduleValueIsUnset_(schedule.jointDate) ||
        scheduleValueIsUnset_(schedule.jointTime) ||
        parseScheduleTimeMinutes_(schedule.jointTime) < 0) return false;

    if (record.category === '納骨壇') {
      const dateRange = parseScheduleDateRange_(schedule.readingPeriod, schedule.year);
      const timeRange = parseScheduleTimeRange_(schedule.readingWindow);
      const slot = parseScheduleSlotMinutes_(schedule.slot);
      if (!dateRange || !timeRange || !slot) return false;
      if (!scheduleValueIsUnset_(schedule.blocked) &&
          !parseBlockedSchedule_(schedule.blocked, schedule.year).length) return false;
    }
    return true;
  }).length;

  // 志納料表は名称照合で読むため、必要な組み合わせが揃っているかを確認します。
  const feeReady = [
    ['春彼岸', '納骨壇'], ['お盆', '納骨壇'], ['お盆', '一般'], ['秋彼岸', '納骨壇']
  ].every(pair => {
    const rule = getFeeRule_(ss, pair[0], pair[1]);
    return !!rule && rule.joint > 0;
  }) && getFirstObonFee_(ss) > 0;

  const readingSheet = ss.getSheetByName(ANNUAL.SHEETS.READING);
  const readingReady = !!readingSheet && clean_(readingSheet.getRange(1, 1).getValue()) === '判定' &&
    clean_(readingSheet.getRange(1, 10).getValue()) === '読経名';
  const readingViewSheet = ss.getSheetByName(ANNUAL.SHEETS.READING_VIEW);
  const readingViewReady = !!readingViewSheet &&
    clean_(readingViewSheet.getRange('A1').getValue()) === clean_('読経管理｜法会当日用') &&
    clean_(readingViewSheet.getRange('B5').getFormula()).includes(ANNUAL.SHEETS.READING) &&
    (!clean_(readingViewSheet.getRange('N5').getValue()) || !!readingViewSheet.getRange('A5').getDataValidation());

  const workSheet = ss.getSheetByName(ANNUAL.SHEETS.WORK);
  const expectedWorkHeaders = [
    '判定', '対象年', '法会', '区分', '申込ID', '枝番',
    '札記載施主名', '札記載供養名', '表記種別', '初盆',
    '札種別', '廻向証必要', '最終照合',
    '札・塔婆作成済', '廻向証作成済', '短冊作成済',
    '契約者名', '入力供養内容', '要確認理由', '受付日時'
  ];
  const workReady = !!workSheet && workSheet.getMaxColumns() >= expectedWorkHeaders.length &&
    workSheet.getRange(1, 1, 1, expectedWorkHeaders.length).getDisplayValues()[0]
      .every((value, index) => clean_(value) === expectedWorkHeaders[index]);

  const applicationSheet = ss.getSheetByName(ANNUAL.SHEETS.APPLICATION);
  const correctionReady = !!applicationSheet &&
    applicationSheet.getMaxColumns() >= ANNUAL.CORRECTION.BY_COLUMN &&
    applicationSheet.getRange(1, ANNUAL.CORRECTION.NAME_COLUMN, 1, ANNUAL.CORRECTION.HEADERS.length)
      .getDisplayValues()[0].every((value, index) => clean_(value) === ANNUAL.CORRECTION.HEADERS[index]);
  const pendingCorrections = correctionReady ? findPendingCorrectionRows_(ss) : [];

  // 申込訂正の完了値「処理済」が、内部ログX列の入力規則で許可されているかも確認します。
  const responseSheet = ss.getSheetByName(ANNUAL.SHEETS.RESPONSE);
  let correctionStateReady = false;
  try {
    const validation = responseSheet && responseSheet.getRange('X2').getDataValidation();
    const criteria = validation && validation.getCriteriaValues();
    const allowed = Array.isArray(criteria && criteria[0]) ? criteria[0].map(clean_) : [];
    correctionStateReady = allowed.includes(ANNUAL.RESPONSE_STATE.REVIEW) &&
      allowed.includes(ANNUAL.RESPONSE_STATE.DONE);
  } catch (error) {
    correctionStateReady = false;
  }

  const manualSheet = ss.getSheetByName(ANNUAL.SHEETS.MANUAL);
  const candidateSheet = ss.getSheetByName(ANNUAL.SHEETS.CONTRACT_CANDIDATES);
  const candidateFormula = candidateSheet ? clean_(candidateSheet.getRange('A2').getFormula()) : '';
  const candidateFormulaReady = candidateFormula.includes('納骨壇名簿') &&
    candidateFormula.includes('一般信者名簿') && candidateFormula.includes('受付入力');
  let applicantValidationReady = false;
  try {
    const validation = manualSheet && manualSheet.getRange('B9').getDataValidation();
    const values = validation && validation.getCriteriaValues();
    const range = values && values[0];
    applicantValidationReady = !!range && range.getSheet().getName() === ANNUAL.SHEETS.CONTRACT_CANDIDATES;
  } catch (error) {
    applicantValidationReady = false;
  }
  const manualReady = !!manualSheet && clean_(manualSheet.getRange('E4').getValue()) === '内部処理' &&
    candidateFormulaReady && applicantValidationReady;

  const firstObonSheet = ss.getSheetByName(ANNUAL.SHEETS.FIRST_OBON);
  const firstObonReady = !!firstObonSheet &&
    clean_(firstObonSheet.getRange(1, 22).getValue()) === '備考';

  // 履歴索引は、申込実績（DATA）と「その年度を確認済み」の印（COVERAGE）を分けて持ちます。
  // COVERAGEが消えると過去年が「？ 履歴未取込」へ戻るため、設定確認でも検出します。
  const historyIndexSheet = ss.getSheetByName(ANNUAL.SHEETS.HISTORY_INDEX);
  const historyLastRow = historyIndexSheet ? lastDataRowByColumn_(historyIndexSheet, 1) : 1;
  let historyDataCount = 0;
  let historyCoverageCount = 0;
  const historyCoverageKeys = new Set();
  if (historyIndexSheet && historyLastRow >= 2) {
    historyIndexSheet.getRange(2, 1, historyLastRow - 1, 8).getDisplayValues().forEach(row => {
      const type = clean_(row[7]);
      if (type === 'DATA') historyDataCount++;
      if (type === 'COVERAGE') {
        historyCoverageCount++;
        historyCoverageKeys.add([Number(row[0]) || 0, clean_(row[1]), clean_(row[2])].join('|'));
      }
    });
  }
  // 受付対象年そのものはこの台帳が受付の正本なので、対象範囲の印を必要としません。
  // 過去年の資料と、一般台帳が取り込まれているかだけを確認します。
  const expectedHistoryCoverage = ['2026|お盆|納骨壇', '2025|お盆|納骨壇'];
  const missingHistoryCoverage = expectedHistoryCoverage
    .filter(key => !historyCoverageKeys.has(key));
  if (![...historyCoverageKeys].some(key => /\|お盆\|一般$/.test(key))) {
    missingHistoryCoverage.push('お盆・一般');
  }
  const historyReady = historyDataCount > 0 && !missingHistoryCoverage.length;

  const normal = registered === expected && linkedForms === expected &&
    statusSynced === expected && scheduleReady === expected &&
    correctlyTriggered === expected && handlerTriggers.length === expected &&
    !orphanTriggerCount && editTriggerReady && changeTriggerReady && validYear &&
    readingReady && readingViewReady && workReady && correctionReady && correctionStateReady && manualReady && feeReady &&
    firstObonReady && historyReady && !pendingCorrections.length && !configIssue;

  const years = scheduleRules
    .filter(rule => rule.key)
    .map(rule => `${rule.eventName}${rule.category === '一般' ? '一般' : ''}=${rule.year}`)
    .join('／');

  const message = normal
    ? `設定は正常です。専用フォーム${expected}種・回答先連携${linkedForms}件・送信トリガー${correctlyTriggered}個を確認しました。` +
      `\n受付状態：受付中${openConfigured}件／停止${expected - openConfigured}件（フォーム側も一致）` +
      `\n法会年：${years}` +
      `\n受付対象年=${baseYear}は受付入力B7の初期値として使用します。` +
      '\n志納料表：春彼岸・お盆・秋彼岸・初盆をすべて確認しました。' +
      `\n申込履歴索引：実績${historyDataCount}件／対象範囲${historyCoverageCount}件` +
      '\n受付入力の候補切替・登録・読経済チェック・行削除トリガー：正常' +
      '\n一般のお盆供養：受付入力のみ（一般フォームなし）'
    : `要確認：フォーム登録=${registered}/${expected}／回答先連携=${linkedForms}/${expected}／` +
      `受付状態同期=${statusSynced}/${expected}／日程設定=${scheduleReady}/${expected}／` +
      `送信トリガー=${correctlyTriggered}/${expected}／不要トリガー=${orphanTriggerCount}／` +
      `職員受付編集トリガー=${editTriggerReady ? '正常' : `要確認(${editTriggers.length}個)`}／` +
      `入金行削除トリガー=${changeTriggerReady ? '正常' : `要確認(${changeTriggers.length}個)`}／` +
      `受付対象年=${validYear ? baseYear : '不正'}／志納料表=${feeReady ? '正常' : '要確認'}／` +
      `読経対象一覧=${readingReady ? '正常' : '要確認'}／` +
      `読経用一覧=${readingViewReady ? '正常' : '要確認'}／` +
      `作札一覧=${workReady ? '正常' : '要確認'}／申込内容訂正=${correctionReady ? '正常' : '要確認'}／` +
      `訂正処理状態=${correctionStateReady ? '正常' : '要確認'}／` +
      `修正反映の未処理=${pendingCorrections.length}件／` +
      `受付入力候補=${manualReady ? '正常' : '要確認'}／初盆電話受付=${firstObonReady ? '正常' : '要確認'}／` +
      `申込履歴=実績${historyDataCount}件・対象範囲${historyCoverageCount}件${historyReady ? '' : '（要確認）'}／` +
      `通知・決済設定=${configIssue ? '要確認' : '正常'}` +
      (missingHistoryCoverage.length
        ? `\n不足している履歴対象範囲：${missingHistoryCoverage.map(key => key.replace(/\|/g, '・')).join('、')}`
        : '') +
      (pendingCorrections.length ? `\n修正反映の未処理：${pendingCorrections.slice(0, 10).join('、')}` : '') +
      (formStateIssues.length ? `\nフォーム状態：${formStateIssues.join('、')}` : '') +
      (configIssue ? `\n${configIssue}` : '');
  SpreadsheetApp.getUi().alert(message);
}

function calculateFee_(ss, eventName, category, requestType, count) {
  return calculateFeeFromRule_(getFeeRule_(ss, eventName, category), requestType, count);
}

function getMaster_(ss, contractor) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
  if (!contractor || sh.getLastRow() < 2) return [];
  const key = key_(contractor);
  return sh.getRange(2, 1, sh.getLastRow() - 1, 14).getValues()
    .filter(r => key_(r[0]) === key);
}

function normalizeAncestorMemorialName_(value) {
  let name = clean_(value).replace(/先祖供養/g, '先祖代々').replace(/供養$/, '');
  if (!name) return '';
  if (/家先祖代々$/.test(name)) return name;
  if (/家先祖$/.test(name)) return name.replace(/家先祖$/, '家先祖代々');
  if (/家$/.test(name)) return `${name}先祖代々`;
  if (/先祖代々$/.test(name)) return name;
  if (/先祖$/.test(name)) {
    const prefix = name.replace(/先祖$/, '');
    if (!prefix) return '先祖代々';
    return /家$/.test(prefix) ? `${prefix}先祖代々` : `${prefix}家先祖代々`;
  }
  return /先祖/.test(name) ? name : '';
}

function resolveMemorial_(raw, category, master) {
  const cleaned = clean_(raw).replace(/供養$/, '');
  const ancestorName = normalizeAncestorMemorialName_(raw);
  if (ancestorName) return { name: ancestorName, type: '先祖', issue: '' };

  const name = cleaned;
  if (category !== '納骨壇') {
    const issue = /[()（）/／]/.test(name) ? `供養名「${raw}」は戒名・俗名の併記を確認` : '';
    return { name, type: /水子|嬰児/.test(name) ? '水子' : '入力', issue };
  }
  const k = key_(name);
  const hits = master.filter(r => key_(r[2]) === k || key_(r[4]) === k);
  if (hits.length === 1) {
    const dharma = clean_(hits[0][4]);
    return { name: dharma || clean_(hits[0][2]) || name, type: dharma ? '戒名' : '俗名', issue: '' };
  }
  return {
    name,
    type: /水子|嬰児/.test(name) ? '水子' : '未照合',
    issue: hits.length > 1 ? `供養名「${raw}」が名簿で複数一致` : `供養名「${raw}」を名簿で確認できません`
  };
}

function writeFirstEmptyIdRow_(sh, idColumn, rowValues) {
  const maxRows = sh.getMaxRows();
  const ids = maxRows >= 2
    ? sh.getRange(2, idColumn, maxRows - 1, 1).getDisplayValues()
    : [];
  const emptyIndex = ids.findIndex(row => clean_(row[0]) === '');
  let targetRow;

  if (emptyIndex >= 0) {
    targetRow = emptyIndex + 2;
  } else {
    sh.insertRowAfter(maxRows);
    targetRow = maxRows + 1;

    if (maxRows >= 2) {
      // 書式・入力規則のコピー範囲はシートの実列数を超えないようにします。
      const copyWidth = sh.getMaxColumns();
      const source = sh.getRange(maxRows, 1, 1, copyWidth);
      const target = sh.getRange(targetRow, 1, 1, copyWidth);
      source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
      source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    }
  }

  if (sh.getMaxColumns() < rowValues.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), rowValues.length - sh.getMaxColumns());
  }
  sh.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues.map(safeSheetValue_)]);
  return targetRow;
}

function findIdRow_(sh, column, id) {
  const lastRow = lastDataRowByColumn_(sh, column);
  if (lastRow < 2) return 0;
  const hit = sh.getRange(2, column, lastRow - 1, 1)
    .createTextFinder(String(id)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function workKeys_(sh, id) {
  const result = new Set();
  const lastRow = lastDataRowByColumn_(sh, 5);
  if (lastRow < 2) return result;
  sh.getRange(2, 5, lastRow - 1, 2).getValues().forEach(r => {
    if (String(r[0]) === String(id)) result.add(Number(r[1]));
  });
  return result;
}

function readingKeys_(sh, id) {
  const result = new Set();
  const lastRow = lastDataRowByColumn_(sh, 4);
  if (lastRow < 2) return result;
  sh.getRange(2, 4, lastRow - 1, 2).getValues().forEach(row => {
    if (String(row[0]) === String(id)) result.add(Number(row[1]));
  });
  return result;
}

function mustSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error(`必要なシート「${name}」がありません。`);
  return sh;
}

function answer_(answers, title) {
  const value = answers[title];
  return Array.isArray(value) ? value.join('、') : (value == null ? '' : value);
}

function safeSheetValue_(value) {
  if (typeof value !== 'string') return value;
  // Googleフォーム等から「=IMPORTRANGE(...)」のような文字列が来ても数式として実行させません。
  return /^[=+@-]/.test(value) ? `'${value}` : value;
}

function clean_(value) {
  return String(value == null ? '' : value).normalize('NFKC').replace(/[\r\n]+/g, ' ').trim();
}

function cleanMultiline_(value) {
  return String(value == null ? '' : value)
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

function key_(value) {
  return clean_(value).replace(/[\s　]/g, '').toLowerCase();
}

function pad_(array, length) {
  return Array.from({ length }, (_, i) => array[i] || '');
}

/**
 * 受付入力の候補切替・自動表示・画面整理は、権限不要の単純トリガーで即時反映します。
 * 受付登録と読経済チェックは、設定済みの認可済みトリガーで実行します。
 */
function onEdit(e) {
  if (!e || !e.range || e.range.getRow() < 2) return;
  const sheetName = e.range.getSheet().getName();
  if (sheetName === ANNUAL.SHEETS.READING_VIEW) {
    const filterChanged = [[2, 2], [2, 4], [2, 6], [2, 8]]
      .some(([row, column]) => rangeTouchesCell_(e.range, row, column));
    if (filterChanged) {
      try { syncReadingViewCheckboxes_(e.range.getSheet().getParent()); } catch (error) {}
    }
    return;
  }
  if (sheetName !== ANNUAL.SHEETS.MANUAL) return;
  // 登録チェックは認可済みトリガーだけに任せ、同じ画面更新を二重実行しません。
  if (rangeTouchesCell_(e.range, 26, 2)) return;
  try {
    handleManualReceptionEdit_(e, false);
  } catch (error) {
    // 入力そのものを妨げないよう、単純トリガーの画面更新エラーは登録時の確認へ回します。
  }
}

/** 入金履歴の行削除後も、変更前の申込を含めて全件を再集計します。 */
function onAnnualMemorialChange(e) {
  if (!e || !e.source || e.changeType !== 'REMOVE_ROW') return;
  const active = e.source.getActiveSheet();
  if (!active || active.getName() !== ANNUAL.SHEETS.PAYMENT_HISTORY) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    ensureAnnualV16Schemas_(e.source, false);
    syncAllPaymentSummaries_(e.source);
  } finally {
    lock.releaseLock();
  }
}

/* ========================================================================== *
 * 初期設定・画面整理（v20〜v22.7）
 * ========================================================================== */

/** 一般お盆フォームの設定・回答タブ・送信トリガーを、受付管理から安全に取り除きます。 */
function removeObonGeneralRouteFromWorkbook_(ss) {
  const retiredFormId = '1oRGlzc3DwvhI1cR2_533cX4mj6fGocEs5oZQ8fTL5jc';
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === ANNUAL.HANDLER &&
      clean_(trigger.getTriggerSourceId()) === retiredFormId)
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // フォーム回答タブはリンク中のまま削除できないため、先に受付停止・リンク解除し、フォームをゴミ箱へ移します。
  try {
    const retiredForm = FormApp.openById(retiredFormId);
    retiredForm.setAcceptingResponses(false);
    if (getFormDestinationId_(retiredForm)) retiredForm.removeDestination();
    DriveApp.getFileById(retiredFormId).setTrashed(true);
  } catch (error) {
    // 既に削除済みの場合もあるため、回答タブの削除可否で最終判定します。
  }

  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const settingValues = settings.getRange(1, 1, settings.getLastRow(), 1).getDisplayValues();
  const rowsToDelete = [];
  settingValues.forEach((row, index) => {
    if (['OBON_GENERAL', 'お盆・一般・合同供養URL'].includes(clean_(row[0]))) {
      rowsToDelete.push(index + 1);
    }
  });
  rowsToDelete.sort((a, b) => b - a).forEach(row => settings.deleteRow(row));
  settings.getRange('A2').setValue(
    '金額・受付対象・廻向証・法会日時の基準です。一般のお盆供養と初盆は「受付入力」で受け付けます。'
  );
  // 設定シートを書き換えたので、読み取りキャッシュを捨てます。
  resetAnnualRuntimeCache_();

  const design = ss.getSheetByName('フォーム設計');
  if (design && design.getLastRow() >= 2) {
    const targets = design.getRange(2, 1, design.getLastRow() - 1, 1).getDisplayValues();
    const designRowsToDelete = [];
    targets.forEach((row, index) => {
      if (clean_(row[0]) === 'お盆一般') designRowsToDelete.push(index + 2);
    });
    designRowsToDelete.sort((a, b) => b - a).forEach(row => design.deleteRow(row));
    design.createTextFinder('4専用フォーム').matchEntireCell(true).replaceAllWith('3専用フォーム');
    design.createTextFinder('合同供養あり・一般').matchEntireCell(true).replaceAllWith('合同供養あり');
  }

  const obsoleteResponse = ss.getSheetByName('原本回答｜お盆・一般');
  if (obsoleteResponse) {
    try {
      ss.deleteSheet(obsoleteResponse);
    } catch (error) {
      throw new Error(
        '一般お盆フォームのリンク解除に失敗しました。管理担当者へお知らせください。'
      );
    }
  }
}

/** 現行運用だけに絞った、職員向けの短い使い方説明です。 */
function ensureUsageGuideV23_(ss) {
  const sh = mustSheet_(ss, '使い方');
  const values = [
    ['年間法会受付管理｜使い方', ''],
    ['概要', '一般のお盆供養と初盆は「受付入力」で完結します。春彼岸・お盆（納骨壇）・秋彼岸のWeb申込は、3つの専用フォームから自動で取り込みます。'],
    ['', ''],
    ['日常の流れ', ''],
    ['1. 受付', '電話・窓口・郵送で受けた申込は「受付入力」を開きます。'],
    ['2. 内容入力', '法会・申込者区分 → 申込者名 → 供養内容 → 入金情報の順に入力します。'],
    ['3. 登録', '内容を確認して「登録」をチェックします。登録後は入力欄が次の受付用に初期化されます。'],
    ['4. 確認', '「申込管理」で要確認を、「未納確認」で未入金・一部入金・未収額を確認します。'],
    ['5. 作札・読経', '「作札一覧」で札・塔婆・廻向証を確認します。読経当日は「読経用一覧」のA列で読経済を記録します。'],
    ['', ''],
    ['受付経路', ''],
    ['一般のお盆供養', 'フォームは使用しません。電話・窓口・郵送のすべてを「受付入力」から登録します。'],
    ['初盆', '合同供養会で読上げる初盆は「受付入力」で初盆へチェックします。別日での個別供養はこのシートへ登録せず、通常の供養受付を使用します。'],
    ['お盆・納骨壇', 'Web申込は専用フォーム、電話・窓口・郵送は「受付入力」を使用します。'],
    ['春彼岸・秋彼岸', '納骨壇契約者用フォームを継続します。職員が受ける場合は「受付入力」も使用できます。'],
    ['', ''],
    ['受付入力の見方', ''],
    ['使用範囲', '日常入力はA:Dだけです。E:Gは内部処理列として非表示です。黄色は入力、緑は自動表示、灰色は入力不要です。'],
    ['必須項目', '「*」が付いた欄は必須です。受付方法は電話・窓口・郵送から必ず選びます。'],
    ['申込者名', '区分が「納骨壇」なら納骨壇名簿、「一般」なら一般信者名簿へ候補が切り替わります。選ぶと画面下部に直近3年の申込内容を表示します。'],
    ['志納料・入金額', '志納料はD22へ自動表示します。入金済はB23へ同額を自動入力し、一部入金だけ実際の入金額へ変更します。'],
    ['登録後の初期化', '登録後は入金状況B21・入金日B22・今回入金額B23を含む入力欄が空欄へ戻ります。'],
    ['', ''],
    ['入金状態', ''],
    ['未入金', 'まだ入金を確認していない状態です。赤色で警告表示します。'],
    ['一部入金', '一部だけ受領した状態です。今回入金額へ実際の金額を入力します。'],
    ['入金済', '全額を確認した状態です。入金日が空欄なら当日を自動入力します。'],
    ['免除', '支払い不要の申込です。'],
    ['要確認', '申込内容または入金情報に確認事項がある状態です。'],
    ['', ''],
    ['シートの役割', ''],
    ['申込管理／未納確認', '申込管理は1申込1行の台帳です。未納確認は未入金・一部入金・未収額の確認に使用します。'],
    ['作札一覧／読経用一覧', '作札一覧は札・塔婆・廻向証の確認専用です。読経用一覧は当日の確認と読経済チェックに使用します。裏方の読経対象一覧は通常操作しません。'],
    ['名簿', '納骨壇名簿・一般信者名簿を、申込者名と供養内容の確認に使用します。'],
    ['内部記録', 'フォーム回答・入金履歴・読経対象一覧などの非表示シートは、自動処理用です。日常操作では開きません。'],
    ['', ''],
    ['申込内容を訂正する場合', ''],
    ['① 訂正', '「申込管理」で契約者名・施主名・供養内容・読経内容を修正します。'],
    ['② 反映', 'AA列「修正反映」をチェックすると、作札一覧・読経用一覧・志納料を再計算します。'],
    ['③ 確認', '判定・備考・未収額を確認します。修復用スクリプトを実行する必要はありません。'],
    ['', ''],
    ['通年法会受付メニュー', ''],
    ['受付入力の内容を登録', '通常は受付入力の「登録」チェックで登録します。チェックが反応しない場合だけ、この項目を使用します。'],
    ['フォームの受付設定を反映', '「設定」シートで対象年・受付期間・法会日時・受付中／停止を変更したときだけ実行します。'],
    ['一般信者名簿を更新', 'らくまる寺務側の人物・世帯台帳を追加・修正したあと、受付入力の候補へ反映するときに実行します。'],
    ['設定状態を確認', 'フォーム連携・受付対象年・トリガー・主要シートの状態を読み取り専用で確認します。不具合時や設定変更後に使用します。'],
    ['廃止した操作', '初期設定・フォーム連携修復・入金再計算・旧台帳取込・自己診断のメニューは廃止しました。日常業務でスクリプトを実行する必要はありません。'],
    ['', ''],
    ['運用上の注意', ''],
    ['連絡先・案内', '受付入力ではメール・住所・案内方法を入力しません。「らくまる寺務」で管理します。'],
    ['受付入力の同時操作', '受付入力は1件ずつ使用します。ほかの職員の登録完了後に次の受付を入力してください。'],
    ['v22.8｜履歴の対象範囲判定を年に依存しない方式へ', '過去年の取込状況を、年を固定した判定から「取り込み済みの範囲を失わない」判定へ変更しました。管理者用のApps Script実行は、過年度資料を追加した場合の「importRecentApplicationHistory」と、フォーム送信トリガーを復旧する「repairAnnualFormTriggers」の2つだけです。']
  ];
  const sectionRows = [4, 11, 17, 24, 31, 37, 42, 49];
  sh.getRange('A1:B80').breakApart().clearContent().clearNote().clearFormat();
  sh.getRange(1, 1, values.length, 2)
    .setValues(values)
    .setFontFamily('Arial')
    .setFontColor('#202124')
    .setFontSize(10)
    .setWrap(true)
    .setVerticalAlignment('middle');
  sh.getRange('A1:B1').merge().setBackground('#1f4e78').setFontColor('#ffffff').setFontWeight('bold').setFontSize(15);
  sh.getRange('A2:B2').setBackground('#eaf2f8');
  sectionRows.forEach(row => {
    sh.getRange(row, 1, 1, 2).merge().setBackground('#5b3a29').setFontColor('#ffffff').setFontWeight('bold');
  });
  sh.getRange('A43:B47').setBackground('#eef4fb');
  sh.getRange(values.length, 1, 1, 2).setBackground('#e8eaed').setFontWeight('bold');
  sh.getRange(2, 1, values.length - 1, 1).setFontWeight('bold');
  sh.setColumnWidth(1, 180);
  sh.setColumnWidth(2, 650);
  sh.autoResizeRows(1, values.length);
  sh.setRowHeight(1, 36);
  sectionRows.forEach(row => sh.setRowHeight(row, 26));
  sh.setFrozenRows(2);
  sh.setHiddenGridlines(true);
}

/** 旧名称のダッシュボードを、日常用の「未納確認」へ引き継ぎます。 */
function renameLegacyPaymentDashboardV20_(ss) {
  const current = ss.getSheetByName(ANNUAL.SHEETS.PAYMENT_DASHBOARD);
  const legacy = ss.getSheetByName('確認・入金');
  if (!current && legacy) legacy.setName(ANNUAL.SHEETS.PAYMENT_DASHBOARD);
}

/** 日常業務に必要な列だけを見せ、内部列と内部履歴は残したまま画面を簡素化します。 */
function simplifyAnnualWorkbookV20_(ss) {
  renameLegacyPaymentDashboardV20_(ss);

  const paymentGuide = ss.getSheetByName('支払案内');
  if (paymentGuide) ss.deleteSheet(paymentGuide);
  const paymentHistory = ss.getSheetByName(ANNUAL.SHEETS.PAYMENT_HISTORY);
  if (paymentHistory && !paymentHistory.isSheetHidden()) paymentHistory.hideSheet();
  const responseLog = ss.getSheetByName(ANNUAL.SHEETS.RESPONSE);
  if (responseLog && !responseLog.isSheetHidden()) responseLog.hideSheet();
  const readingSource = ss.getSheetByName(ANNUAL.SHEETS.READING);
  if (readingSource && !readingSource.isSheetHidden()) readingSource.hideSheet();

  const styleHeader = (sh, width, color) => {
    sh.getRange(1, 1, 1, width).setBackground(color || '#5b3a29')
      .setFontColor('#ffffff').setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
    sh.setRowHeight(1, 42);
    sh.setFrozenRows(1);
  };
  const setWidths = (sh, map) => Object.keys(map).forEach(column =>
    sh.setColumnWidth(Number(column), map[column]));

  const general = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
  general.showColumns(1, general.getMaxColumns());
  if (general.getMaxColumns() >= 21) general.hideColumns(11, 11); // 人物ID～最終確認日は内部管理
  styleHeader(general, 21, '#365f91');
  setWidths(general, {1:180, 2:150, 3:125, 4:95, 5:260, 6:110, 7:90, 8:115, 9:210, 10:260});
  general.setFrozenColumns(2);

  const master = mustSheet_(ss, ANNUAL.SHEETS.MASTER);
  master.showColumns(1, master.getMaxColumns());
  master.hideColumns(10, 3); // 郵便番号・住所・建物名はらくまる寺務で確認
  styleHeader(master, 22, '#6b4f3a');
  master.getRange('O1:V1').setBackground('#5b7f5b');
  setWidths(master, {
    1:170, 2:150, 3:150, 4:140, 5:190, 6:170, 7:90, 8:95, 9:70,
    13:125, 14:125, 15:230, 16:90, 17:230, 18:90, 19:230, 20:90, 21:115, 22:210
  });
  master.setFrozenColumns(2);

  const app = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  app.showColumns(1, app.getMaxColumns());
  [[2,1],[9,2],[13,1],[15,1],[24,1],[28,2],[32,1],[35,1],[37,2],[40,5],[46,1]]
    .forEach(([start, count]) => app.hideColumns(start, count));
  styleHeader(app, 46, '#5b3a29');
  app.getRange('K1:R1').setBackground('#6b5b95');
  app.getRange('S1:V1').setBackground('#4f7b63');
  app.getRange('W1:AA1').setBackground('#4f6f8f');
  app.getRange('AD1:AJ1').setBackground('#8a5a2b');
  setWidths(app, {
    1:90, 3:135, 4:70, 5:90, 6:80, 7:160, 8:160, 11:190, 12:260, 14:90,
    16:100, 17:105, 18:90, 19:90, 20:95, 21:95, 22:105, 23:80, 25:300, 26:170,
    27:90, 30:95, 31:95, 33:105, 34:110, 36:95, 39:180, 45:170
  });
  app.setFrozenColumns(6);

  const work = mustSheet_(ss, ANNUAL.SHEETS.WORK);
  work.showColumns(1, work.getMaxColumns());
  [[5,2],[13,6],[20,4]].forEach(([start, count]) => work.hideColumns(start, count));
  styleHeader(work, 23, '#5b3a29');
  work.getRange('G1:L1').setBackground('#365f91');
  work.getRange('S1:S1').setBackground('#8a5a2b');
  setWidths(work, {1:90, 2:70, 3:90, 4:80, 7:180, 8:240, 9:100, 10:75, 11:110, 12:105, 19:320});
  work.setFrozenColumns(4);

  const unpaid = mustSheet_(ss, ANNUAL.SHEETS.PAYMENT_DASHBOARD);
  unpaid.getRange('A1:L2').breakApart();
  unpaid.getRange('B1:K1').merge().setValue('未納確認');
  unpaid.getRange('B2:K2').merge().setValue(
    '赤＝未入金　黄＝一部入金　紫＝要確認　濃赤＝支払期限超過　※受付中・保留の申込を表示'
  );
  unpaid.showColumns(1, unpaid.getMaxColumns());
  unpaid.hideColumns(1, 1);  // 申込IDは内部照合用
  unpaid.hideColumns(10, 1); // 通知状態はらくまる寺務で管理
  unpaid.hideColumns(12, 1); // 督促状態は内部管理
  setWidths(unpaid, {2:70, 3:90, 4:80, 5:180, 6:95, 7:95, 8:95, 9:105, 11:95});
  unpaid.setFrozenRows(5);
  unpaid.setHiddenGridlines(true);

  const order = [
    ANNUAL.SHEETS.MANUAL, ANNUAL.SHEETS.PAYMENT_DASHBOARD, ANNUAL.SHEETS.APPLICATION,
    ANNUAL.SHEETS.WORK, ANNUAL.SHEETS.READING_VIEW, ANNUAL.SHEETS.GENERAL_MASTER,
    ANNUAL.SHEETS.MASTER, '使い方', ANNUAL.SHEETS.SETTINGS
  ];
  order.forEach((name, index) => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(index + 1);
  });
  ss.setActiveSheet(mustSheet_(ss, ANNUAL.SHEETS.MANUAL));
}

/**
 * 管理者用：3フォームの送信トリガーを、設定シートの登録内容へ合わせ直します。
 * フォーム側に紐づくトリガーはトリガー画面から作り直せないため、この入口を残します。
 * 職員用の「通年法会受付」メニューには表示しません。
 */
function repairAnnualFormTriggers() {
  resetAnnualRuntimeCache_();
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const records = Object.values(getFormRecords_(settings)).filter(record => record.formId);
  const registeredFormIds = new Set(records.map(record => record.formId));

  // 設定シートにないフォームのトリガーと、同じフォームの重複トリガーを取り除きます。
  const kept = new Map();
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === ANNUAL.HANDLER)
    .forEach(trigger => {
      const formId = clean_(trigger.getTriggerSourceId());
      if (!registeredFormIds.has(formId) || kept.has(formId)) {
        ScriptApp.deleteTrigger(trigger);
        return;
      }
      kept.set(formId, trigger);
    });

  const created = [];
  records.forEach(record => {
    if (kept.has(record.formId)) return;
    ScriptApp.newTrigger(ANNUAL.HANDLER)
      .forForm(FormApp.openById(record.formId)).onFormSubmit().create();
    created.push(`${record.eventName}・${record.category}`);
  });
  ensureAnnualMemorialEditTrigger_(ss);

  const message = created.length
    ? `フォーム送信トリガーを${created.length}件作成しました：${created.join('、')}`
    : 'フォーム送信トリガーは既に正しく設定されています。';
  // エディタから実行するため、UIに依存しない方法でも結果を残します。
  Logger.log(message);
  showAnnualStatus_(ss, message, 10);
}

/**
 * 管理者用：過年度資料を追加・確定した場合だけ、Apps Scriptエディタから実行します。
 * 職員用の「通年法会受付」メニューには表示しません。
 */
function importRecentApplicationHistory() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    syncRecentApplicationHistory_();
  } finally {
    lock.releaseLock();
  }
}

/** 将来の構成変更時だけ使用する内部初期設定です。職員メニューには表示しません。 */
function setupAnnualMemorialV23_() {
  const ss = SpreadsheetApp.openById(ANNUAL.SPREADSHEET_ID);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    resetAnnualRuntimeCache_();
    removeObonGeneralRouteFromWorkbook_(ss);
    renameLegacyPaymentDashboardV20_(ss);
    ensureAnnualV16Schemas_(ss, true);
    ensureAnnualMemorialEditTrigger_(ss);
    migrateApplicationV16Data_(ss);
    // 直近3年履歴は初回（索引が空のとき）だけ構築します。
    // 画面修正のたびに外部台帳を全件読み直さないため、再設定を軽く保ちます。
    const historyIndex = mustSheet_(ss, ANNUAL.SHEETS.HISTORY_INDEX);
    if (lastDataRowByColumn_(historyIndex, 1) < 2) syncRecentApplicationHistory_();
    syncAllPaymentSummaries_(ss);
    syncAllOperationalStatuses_(ss);
    const manual = ss.getSheetByName(ANNUAL.SHEETS.MANUAL);
    if (manual) {
      ensureManualApplicantCandidateFormula_(ss);
      setManualApplicantValidation_(ss, clean_(manual.getRange('D5').getValue()));
      updateManualReceptionMode_(ss, manual);
      updateManualV16Preview_(ss, manual);
      renderRecentApplicationHistory_(ss, manual);
      const hasActiveEntry = ['B5', 'D5', 'B9'].some(a1 => clean_(manual.getRange(a1).getValue()));
      if (!hasActiveEntry) {
        manual.getRangeList(['B21', 'B22', ANNUAL_V16.MANUAL.PAYMENT_AMOUNT]).clearContent();
      }
    }
    ensureReadingOperationViewV23_(ss);
    ensureUsageGuideV23_(ss);
    simplifyAnnualWorkbookV20_(ss);
    showAnnualStatus_(ss, '内部初期設定が完了しました。', 10);
    SpreadsheetApp.getUi().alert(
      '内部初期設定が完了しました。\n\n' +
      '【今回の修正】\n' +
      '・AA列「修正反映」で発生していた入力規則エラーを解消\n' +
      '・読経用一覧の不足したチェックボックスを復旧\n' +
      '・通年法会受付メニューと旧版関数を整理\n' +
      '・読経用一覧の書式処理を軽量化\n' +
      '・受付方法を必須として説明を統一\n' +
      '・彼岸を選ぶと初盆チェックを自動解除し、供養種別が消える不具合を修正\n' +
      '・初盆は合同供養会受付、別日供養は通常受付を使う案内を表示\n' +
      '・受付日時を登録時刻で自動記録\n' +
      '・フォーム回答と読経対象一覧を内部シートとして非表示\n' +
      '・読経用一覧のA列で読経済を直接チェック可能\n' +
      '・受付入力の必須項目と色の説明を整理\n' +
      '・寺院一任でも寺院側の確定日時を記録し、読経用一覧へ反映可能\n' +
      '・読経用一覧の結合セルと固定列の競合を修正\n\n' +
      '【継続する運用】\n' +
      '・一般のお盆供養と初盆は「受付入力」だけで受付\n' +
      '・登録後に入金状況・入金日・今回入金額を空欄へ初期化\n' +
      '・直近3年を常時表示し、登録後は前の申込者表示を消去\n' +
      '・納骨壇名簿Q/R/Uは申込履歴索引参照の数式\n\n' +
      '春彼岸・お盆（納骨壇）・秋彼岸の3フォームは継続します。'
    );
  } finally {
    lock.releaseLock();
  }
}

function ensureAnnualMemorialEditTrigger_(ss) {
  const triggers = ScriptApp.getProjectTriggers();
  const legacy = triggers.filter(trigger =>
    trigger.getHandlerFunction() === 'onEdit' &&
    trigger.getEventType() === ScriptApp.EventType.ON_EDIT
  );
  legacy.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  const editTriggers = triggers.filter(trigger =>
    trigger.getHandlerFunction() === 'onAnnualMemorialEdit' &&
    trigger.getEventType() === ScriptApp.EventType.ON_EDIT
  );
  const current = editTriggers.filter(trigger =>
    clean_(trigger.getTriggerSourceId()) === clean_(ss.getId())
  );
  editTriggers.filter(trigger =>
    clean_(trigger.getTriggerSourceId()) !== clean_(ss.getId())
  ).forEach(trigger => ScriptApp.deleteTrigger(trigger));
  current.slice(1).forEach(trigger => ScriptApp.deleteTrigger(trigger));
  if (!current.length) {
    ScriptApp.newTrigger('onAnnualMemorialEdit').forSpreadsheet(ss).onEdit().create();
  }

  const changeTriggers = triggers.filter(trigger =>
    trigger.getHandlerFunction() === 'onAnnualMemorialChange' &&
    trigger.getEventType() === ScriptApp.EventType.ON_CHANGE
  );
  const changes = changeTriggers.filter(trigger =>
    clean_(trigger.getTriggerSourceId()) === clean_(ss.getId())
  );
  changeTriggers.filter(trigger =>
    clean_(trigger.getTriggerSourceId()) !== clean_(ss.getId())
  ).forEach(trigger => ScriptApp.deleteTrigger(trigger));
  changes.slice(1).forEach(trigger => ScriptApp.deleteTrigger(trigger));
  if (!changes.length) {
    ScriptApp.newTrigger('onAnnualMemorialChange').forSpreadsheet(ss).onChange().create();
  }
}

function ensureApplicationCorrectionSchema_(ss, fullSetup) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  const correction = ANNUAL.CORRECTION;
  if (sh.getMaxColumns() < correction.BY_COLUMN) {
    sh.insertColumnsAfter(sh.getMaxColumns(), correction.BY_COLUMN - sh.getMaxColumns());
  }
  if (fullSetup || !sheetHeadersMatch_(sh, 1, correction.NAME_COLUMN, correction.HEADERS)) {
    sh.getRange(1, correction.NAME_COLUMN, 1, correction.HEADERS.length)
      .setValues([correction.HEADERS])
      .setBackground('#8a6d3b').setFontColor('#ffffff').setFontWeight('bold')
      .setHorizontalAlignment('center').setWrap(true);
  }
  const rows = Math.max(1, sh.getMaxRows() - 1);
  const checkbox = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sh.getRange(2, correction.APPLY_COLUMN, rows, 1).setDataValidation(checkbox);
  sh.getRange(2, correction.AT_COLUMN, rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  if (fullSetup) {
    sh.setColumnWidth(correction.NAME_COLUMN, 170);
    sh.setColumnWidth(correction.APPLY_COLUMN, 90);
    sh.setColumnWidth(correction.AT_COLUMN, 135);
    sh.setColumnWidth(correction.BY_COLUMN, 150);

    // Q/R は参列希望の日時だけでなく、寺院一任後に寺院側で確定した日時も記録します。
    sh.getRange('P1').setNote('参列する／寺院一任を管理します。寺院一任のままでも、寺院側で日時確定後はQ・Rへ日時を入力できます。');
    sh.getRange('Q1').setNote('参列する場合は希望日。寺院一任の場合は寺院側の確定日として使用できます。Q・Rをセットで入力後、AA列「修正反映」をチェックしてください。');
    sh.getRange('R1').setNote('参列する場合は希望時刻。寺院一任の場合は寺院側の確定時刻として使用できます。Q・Rをセットで入力後、AA列「修正反映」をチェックしてください。');
    sh.getRange(1, correction.APPLY_COLUMN).setNote('申込内容を訂正した後にチェックすると、作札一覧・読経対象一覧・読経用一覧へ反映します。');
  }
  return sh;
}

/** 内部ログの処理状態を、訂正処理が書き込む値と一致させます。 */
function ensureResponseProcessingStateValidation_(ss) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.RESPONSE);
  if (sh.getMaxColumns() < 24 || sh.getMaxRows() < 2) return sh;
  const rows = sh.getMaxRows() - 1;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.values(ANNUAL.RESPONSE_STATE), true)
    .setAllowInvalid(false)
    .setHelpText('内部処理状態（通常は自動更新）')
    .build();
  sh.getRange(2, 24, rows, 1).setDataValidation(rule);
  return sh;
}

function ensureAnnualV16Schemas_(ss, fullSetup) {
  if (!fullSetup) {
    assertAnnualV17SchemaReady_(ss);
    return;
  }
  ensureApplicationCorrectionSchema_(ss, true);
  ensureResponseProcessingStateValidation_(ss);
  ensureApplicationV16Schema_(ss, true);
  ensurePaymentHistorySchema_(ss, true);
  ensureManualV16Panel_(ss, true);
  const readingSh = ensureReadingV16Schema_(ss, true);
  const workSh = ensureWorkSheetSchema_(ss);
  ensureV16OperationConditionalFormats_(workSh, readingSh);
  ensureMemorialMasterHeaders_(ss);
  ensureRecentHistoryIndex_(ss);
  restoreNokotsuObonHistoryFormulas_(ss);
  ensureReceiveErrorSheet_(ss);
  ensurePaymentDashboard_(ss, true);
}

function sheetHeadersMatch_(sh, row, column, headers) {
  if (!sh || sh.getMaxColumns() < column + headers.length - 1) return false;
  const current = sh.getRange(row, column, 1, headers.length).getDisplayValues()[0];
  return current.every((value, index) => clean_(value) === clean_(headers[index]));
}

function assertAnnualV17SchemaReady_(ss) {
  const checks = [
    sheetHeadersMatch_(ss.getSheetByName(ANNUAL.SHEETS.APPLICATION), 1,
      ANNUAL.CORRECTION.NAME_COLUMN, ANNUAL.CORRECTION.HEADERS),
    sheetHeadersMatch_(ss.getSheetByName(ANNUAL.SHEETS.APPLICATION), 1,
      ANNUAL_V16.COL.RECEPTION_STATE, ANNUAL_V16.APPLICATION_HEADERS),
    sheetHeadersMatch_(ss.getSheetByName(ANNUAL.SHEETS.PAYMENT_HISTORY), 1, 1,
      ANNUAL_V16.PAYMENT_HISTORY_HEADERS),
    sheetHeadersMatch_(ss.getSheetByName(ANNUAL.SHEETS.READING), 1, 18,
      ['受付状態', '入金状態', '督促状態']),
    sheetHeadersMatch_(ss.getSheetByName(ANNUAL.SHEETS.WORK), 1, 21,
      ['受付状態', '入金状態', '督促状態']),
    !!ss.getSheetByName(ANNUAL.SHEETS.PAYMENT_DASHBOARD),
    !!ss.getSheetByName(ANNUAL.SHEETS.MANUAL),
    sheetHeadersMatch_(ss.getSheetByName(ANNUAL.SHEETS.HISTORY_INDEX), 1, 1,
      ['対象年', '法会', '区分', '申込者名', '供養内容', '申込ID', '参照元', '種別', '更新日時']),
    !!ss.getSheetByName(ANNUAL.SHEETS.RECEIVE_ERROR)
  ];
  if (checks.some(value => !value)) {
    throw new Error('必要なシート構成が不足しています。「設定状態を確認」の結果を管理担当者へお知らせください。');
  }
}

function lastDataRowByColumn_(sh, column) {
  if (!sh || sh.getMaxRows() < 2) return 1;
  const values = sh.getRange(2, column, sh.getMaxRows() - 1, 1).getDisplayValues();
  for (let index = values.length - 1; index >= 0; index--) {
    if (clean_(values[index][0])) return index + 2;
  }
  return 1;
}

function ensureApplicationV16Schema_(ss, fullSetup) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  const lastCol = ANNUAL_V16.COL.CONFIRMED_PERSON_ID;
  if (sh.getMaxColumns() < lastCol) {
    sh.insertColumnsAfter(sh.getMaxColumns(), lastCol - sh.getMaxColumns());
  }
  if (!fullSetup && sheetHeadersMatch_(sh, 1, ANNUAL_V16.COL.RECEPTION_STATE, ANNUAL_V16.APPLICATION_HEADERS)) {
    return sh;
  }
  sh.getRange(1, ANNUAL_V16.COL.RECEPTION_STATE, 1, ANNUAL_V16.APPLICATION_HEADERS.length)
    .setValues([ANNUAL_V16.APPLICATION_HEADERS])
    .setBackground('#5b3a29').setFontColor('#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center').setWrap(true);

  const rows = Math.max(1, sh.getMaxRows() - 1);
  const listRule = values => SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(false).build();
  sh.getRange(2, 20, rows, 1).setDataValidation(listRule(ANNUAL_V16.PAYMENT_STATUSES));
  sh.getRange(2, ANNUAL_V16.COL.RECEPTION_STATE, rows, 1)
    .setDataValidation(listRule(['受付中', '保留', '取消', '重複', 'テスト']));
  sh.getRange(2, ANNUAL_V16.COL.CONTENT_STATE, rows, 1)
    .setDataValidation(listRule(['確認済', '要確認']));
  sh.getRange(2, ANNUAL_V16.COL.NOTICE_STATE, rows, 1)
    .setDataValidation(listRule(['未案内', '送信処理中', '送信済', '送信失敗', '印刷待ち', '印刷済', '郵送待ち', '郵送済', '案内不要', '外部管理', '自動返信無効', '履歴未確認']));
  sh.getRange(2, ANNUAL_V16.COL.GUIDE_METHOD, rows, 1)
    .setDataValidation(listRule(['メール', '印刷', '郵送', '案内不要', 'らくまる寺務', '未確認']));
  sh.getRange(2, ANNUAL_V16.COL.REMINDER_STATE, rows, 1)
    .setDataValidation(listRule(['未督促', '案内済', '再案内済', '連絡不要']));
  sh.getRange(2, ANNUAL_V16.COL.PAYMENT_DUE, rows, 1).setNumberFormat('yyyy/mm/dd');
  sh.getRange(2, ANNUAL_V16.COL.PAYMENT_ENTRY, rows, 3).setNumberFormat('#,##0"円"');
  sh.getRange(2, ANNUAL_V16.COL.EXCLUSION_REASON, rows, 1).setWrap(true);
  sh.setFrozenRows(1);

  if (fullSetup) {
    const widths = {
      30: 90, 31: 90, 32: 110, 33: 95, 34: 105, 35: 105, 36: 105,
      37: 170, 38: 135, 39: 190, 40: 145, 41: 135, 42: 210,
      43: 95, 44: 95, 45: 180, 46: 145
    };
    Object.keys(widths).forEach(column => sh.setColumnWidth(Number(column), widths[column]));
    ensureV16ApplicationConditionalFormats_(sh);
  }
  return sh;
}

function ensureV16ApplicationConditionalFormats_(sh) {
  const formulas = new Set([
    '=OR($AD2="取消",$AD2="重複",$AD2="テスト")',
    '=$T2="未入金"', '=$T2="一部入金"', '=$T2="入金済"', '=$T2="免除"', '=$T2="要確認"',
    '=$AE2="要確認"', '=AND($AJ2>0,$AD2="受付中")'
  ]);
  const kept = sh.getConditionalFormatRules().filter(rule => {
    const condition = rule.getBooleanCondition();
    if (!condition) return true;
    const values = condition.getCriteriaValues();
    return !(values && formulas.has(String(values[0] || '')));
  });
  const lastRow = Math.max(2, sh.getMaxRows());
  const whole = sh.getRange(2, 1, lastRow - 1, ANNUAL_V16.COL.CONFIRMED_PERSON_ID);
  const payment = sh.getRange(2, 20, lastRow - 1, 3);
  const content = sh.getRange(2, ANNUAL_V16.COL.CONTENT_STATE, lastRow - 1, 1);
  const balance = sh.getRange(2, ANNUAL_V16.COL.BALANCE, lastRow - 1, 1);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=OR($AD2="取消",$AD2="重複",$AD2="テスト")')
      .setBackground('#e0e0e0').setFontColor('#777777').setRanges([whole]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$T2="未入金"')
      .setBackground('#fce8e6').setFontColor('#b3261e').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$T2="一部入金"')
      .setBackground('#fff2cc').setFontColor('#8a4b00').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$T2="入金済"')
      .setBackground('#e6f4ea').setFontColor('#137333').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$T2="要確認"')
      .setBackground('#eadcf8').setFontColor('#5b2a86').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$T2="免除"')
      .setBackground('#eeeeee').setFontColor('#666666').setRanges([payment]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$AE2="要確認"')
      .setBackground('#fff2cc').setRanges([content]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($AJ2>0,$AD2="受付中")')
      .setBackground('#fce8e6').setFontColor('#b3261e').setRanges([balance]).build()
  ];
  sh.setConditionalFormatRules([...kept, ...rules]);
}

function ensurePaymentHistorySchema_(ss, fullSetup) {
  let sh = ss.getSheetByName(ANNUAL.SHEETS.PAYMENT_HISTORY);
  if (!sh) sh = ss.insertSheet(ANNUAL.SHEETS.PAYMENT_HISTORY);
  const width = ANNUAL_V16.PAYMENT_HISTORY_HEADERS.length;
  if (sh.getMaxColumns() < width) sh.insertColumnsAfter(sh.getMaxColumns(), width - sh.getMaxColumns());
  if (!fullSetup && sheetHeadersMatch_(sh, 1, 1, ANNUAL_V16.PAYMENT_HISTORY_HEADERS)) return sh;
  if (sh.getMaxRows() < 1000) sh.insertRowsAfter(sh.getMaxRows(), 1000 - sh.getMaxRows());
  sh.getRange(1, 1, 1, width).setValues([ANNUAL_V16.PAYMENT_HISTORY_HEADERS])
    .setBackground('#355e3b').setFontColor('#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center').setWrap(true);
  const rows = Math.max(1, sh.getMaxRows() - 1);
  const listRule = values => SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(false).build();
  sh.getRange(2, 4, rows, 1).setDataValidation(listRule(['現金', '振込', 'クレジット', 'コンビニ', 'その他']));
  sh.getRange(2, 6, rows, 1).setDataValidation(listRule(['申込時入金', '追加入金', '返金', '調整']));
  sh.getRange(2, 9, rows, 1).setDataValidation(listRule(['確認済', '要確認', '取消']));
  const checkbox = SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build();
  sh.getRange(2, 10, rows, 2).setDataValidation(checkbox);
  sh.getRange(2, 3, rows, 1).setNumberFormat('yyyy/mm/dd');
  sh.getRange(2, 5, rows, 1).setNumberFormat('#,##0"円"');
  sh.getRange(2, 15, rows, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.setFrozenRows(1);
  if (fullSetup) {
    [130, 180, 100, 105, 105, 105, 150, 200, 95, 75, 75, 150, 220, 120, 145]
      .forEach((widthPx, index) => sh.setColumnWidth(index + 1, widthPx));
    if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), width).createFilter();
  }
  return sh;
}

function ensureReadingV16Schema_(ss, fullSetup) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.READING);
  const headers = ['受付状態', '入金状態', '督促状態'];
  if (sh.getMaxColumns() < 20) sh.insertColumnsAfter(sh.getMaxColumns(), 20 - sh.getMaxColumns());
  if (!fullSetup && sheetHeadersMatch_(sh, 1, 18, headers)) return sh;
  sh.getRange(1, 18, 1, 3).setValues([headers])
    .setBackground('#5b3a29').setFontColor('#ffffff').setFontWeight('bold');
  const rows = Math.max(1, sh.getMaxRows() - 1);
  const listRule = values => SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(false).build();
  sh.getRange(2, 18, rows, 1).setDataValidation(listRule(['受付中', '保留', '取消', '重複', 'テスト']));
  sh.getRange(2, 19, rows, 1).setDataValidation(listRule(ANNUAL_V16.PAYMENT_STATUSES));
  sh.getRange(2, 20, rows, 1).setDataValidation(listRule(['未督促', '案内済', '再案内済', '連絡不要']));
  if (fullSetup) [95, 95, 95].forEach((width, i) => sh.setColumnWidth(18 + i, width));
  return sh;
}

function ensureManualV16Panel_(ss, fullSetup) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.MANUAL);
  if (sh.getMaxColumns() < 7) sh.insertColumnsAfter(sh.getMaxColumns(), 7 - sh.getMaxColumns());
  if (!fullSetup && clean_(sh.getRange('E4').getValue()) === '内部処理') return sh;

  const migratingFromV18 = clean_(sh.getRange('E4').getValue()) === '案内';
  const previousNote = migratingFromV18 && typeof sh.getRange('B23').getValue() === 'string'
    ? clean_(sh.getRange('B23').getValue()) : '';

  // E21は旧版の「今回入金額」ラベルでした。実際の入力欄はB23だけなので空欄にします。
  const labels = [
    ['E4', '内部処理'], ['E5', 'メール（外部管理）'], ['E6', '案内（らくまる寺務）'], ['E7', '受付日時（自動）'],
    ['E8', '人物ID'], ['E9', '世帯ID'], ['E10', '郵便番号'], ['E11', '住所'],
    ['E14', '自動確認'], ['E15', '供養件数'], ['E16', '志納料'],
    ['E17', '支払予定'], ['E18', '案内予定'], ['E19', '入力状態'],
    ['E21', ''], ['E22', '決済・振込番号'], ['E23', '要確認事項']
  ];
  labels.forEach(item => sh.getRange(item[0]).setValue(item[1]));
  sh.getRange('F21').clearContent().clearNote();

  // 右側へ列を増設した際に引き継がれた入力規則を先に全解除し、必要なセルだけ付け直します。
  sh.getRange('E4:G25').clearDataValidations();
  if (fullSetup) {
    sh.getRange('A1:G2').breakApart();
    sh.getRange('A1:D1').merge().setValue('年間法会｜受付入力（職員用）');
    sh.getRange('A2:D2').merge().setValue(
      '法会・区分 → 申込者 → 供養内容 → 入金 → 登録　※連絡先・案内はらくまる寺務で管理'
    );
    sh.getRange('A3:D3').breakApart().merge().setValue(
      '黄色＝入力　緑＝自動表示　灰色＝この申込では入力不要　「*」は必須項目です'
    );
    sh.getRange('A24:D24').breakApart().merge().clearContent();
    sh.getRange('B23:D23').breakApart();
    ['A4:D4', 'A8:D8', 'A12:D12', 'A18:D18', 'A25:D25']
      .forEach(a1 => sh.getRange(a1).breakApart().merge());
    ['E4:G4', 'E14:G14'].forEach(a1 => sh.getRange(a1).breakApart().merge());
    ['F5:G5', 'F6:G6', 'F7:G7', 'F8:G8', 'F9:G9', 'F10:G10',
      'F11:G12', 'F15:G15', 'F16:G16', 'F17:G17', 'F18:G18', 'F19:G19',
      'F21:G21', 'F22:G22', 'F23:G25']
      .forEach(a1 => sh.getRange(a1).breakApart().merge().setWrap(true));

    sh.getRange('A4').setValue('① 基本情報');
    sh.getRange('A5').setValue('法会 *');
    sh.getRange('C5').setValue('申込者区分 *');
    sh.getRange('A6').setValue('受付方法 *');
    sh.getRange('A8').setValue('② 申込者');
    sh.getRange('A12').setValue('③ 供養内容');
    sh.getRange('A13').setValue('ご希望の供養 *');
    sh.getRange('C13').setValue('初盆（お盆のみ）');
    sh.getRange('A18').setValue('④ 読経・入金');
    sh.getRange('A21').setValue('入金状況 *');
    sh.getRange('C21').setValue('入金方法 *');
    sh.getRange('A25').setValue('⑤ 内容を確認して登録');
    sh.getRange('A31').setValue('直近3年の申込');
    sh.getRange('C22').setValue('志納料（自動）');
    sh.getRange('A23').setValue('今回入金額');
    sh.getRange('C23').setValue('備考');
    sh.getRange('A26').setValue('登録する');
    sh.getRange('C26').setValue('登録結果');
    if (migratingFromV18) {
      sh.getRange('B23').clearContent();
      if (previousNote) sh.getRange(ANNUAL_V16.MANUAL.NOTE).setValue(previousNote);
    }

    sh.getRange('A1:G36').setFontFamily('Noto Sans JP').setFontSize(11)
      .setVerticalAlignment('middle').setWrap(true);
    sh.getRange('A1:D1').setBackground('#1f4e78').setFontColor('#ffffff')
      .setFontWeight('bold').setFontSize(16).setHorizontalAlignment('left');
    sh.getRange('A2:D2').setBackground('#eaf2f8').setFontColor('#34495e').setFontSize(10);
    sh.getRange('A3:D3').setBackground('#fff8e1').setFontColor('#6b4f00')
      .setFontSize(10).setHorizontalAlignment('left');
    sh.getRange('A24:D24').setBackground('#fff2cc').setFontColor('#8a4b00')
      .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('left').setWrap(true);
    sh.getRangeList(['A4:D4', 'A8:D8', 'A12:D12', 'A18:D18', 'A25:D25'])
      .setBackground('#5b7fa3').setFontColor('#ffffff').setFontWeight('bold');
    sh.getRangeList(['E4:G4', 'E14:G14'])
      .setBackground('#44546a').setFontColor('#ffffff').setFontWeight('bold');
    ['E4:G4', 'E14:G14'].forEach(a1 => sh.getRange(a1).setHorizontalAlignment('center'));
    sh.getRangeList([
      'A5:A11', 'C5:C11', 'A13:A17', 'C13:C17', 'A19:A23', 'C19:C23',
      'E5:E11', 'E15:E19', 'E21:E23', 'A26', 'C26'
    ]).setBackground('#edf2f7').setFontColor('#334155').setFontWeight('bold');
    sh.getRangeList([
      'B5:B7', 'D5:D6', 'B9:B11', 'D9:D10', 'B13:B17', 'D13:D17',
      'B19:B23', 'D19:D23', 'F5:G7', 'F22:G22', 'B26'
    ]).setBackground('#fff4cc').setFontColor('#202124');
    sh.getRangeList(['D7', ANNUAL_V16.MANUAL.FEE_DISPLAY, 'F15:G16', 'F19:G19', 'F23:G25', 'D26'])
      .setBackground('#e2f0d9').setFontColor('#254117');

    // 人物ID・世帯ID・住所と重複する要約は内部処理に残し、通常画面では目立たせません。
    sh.getRangeList(['E8:G12', 'E17:G18'])
      .setBackground('#ffffff').setFontColor('#ffffff').setFontWeight('normal');

    ['A4:D11', 'A12:D17', 'A18:D23', 'A25:D26', 'E4:G12', 'E14:G25']
      .forEach(a1 => sh.getRange(a1).setBorder(true, true, true, true, true, true, '#b8c4cf', SpreadsheetApp.BorderStyle.SOLID));
    ['E8:G12', 'E17:G18']
      .forEach(a1 => sh.getRange(a1).setBorder(false, false, false, false, false, false));

    [150, 220, 155, 235, 140, 170, 100]
      .forEach((width, index) => sh.setColumnWidth(index + 1, width));
    sh.setRowHeight(1, 42);
    sh.setRowHeight(2, 36);
    sh.setRowHeight(3, 28);
    sh.setRowHeights(5, 7, 34);
    sh.setRowHeight(12, 32);
    sh.setRowHeights(13, 5, 34);
    sh.setRowHeight(18, 32);
    sh.setRowHeights(19, 5, 34);
    sh.setRowHeight(24, 44);
    sh.setRowHeight(25, 32);
    sh.setRowHeight(26, 40);
    ensureRecentHistoryPanel_(sh);
    sh.getRange('E13:G13').clearContent().clearDataValidations();
    sh.hideColumns(5, 3);
    if (sh.getMaxRows() >= 27) sh.hideRows(27, sh.getMaxRows() - 26);
    if (sh.getMaxRows() >= 35) sh.showRows(31, 5);
    sh.setFrozenRows(2);
    sh.setHiddenGridlines(true);
  }
  sh.getRange(ANNUAL_V16.MANUAL.EMAIL).clearContent().clearDataValidations()
    .setNote('連絡先は「らくまる寺務」で管理します。受付入力では使用しません。');
  sh.getRange(ANNUAL_V16.MANUAL.GUIDE_METHOD).setValue('らくまる寺務').clearDataValidations()
    .setNote('案内方法は「らくまる寺務」で管理します。');
  sh.getRange(ANNUAL_V16.MANUAL.RECEIVED_DATE).clearContent().clearDataValidations()
    .setNote('受付日時は登録処理を行った時刻を自動記録します。非表示セルの値は使用しません。');
  sh.getRange(ANNUAL_V16.MANUAL.PAYMENT_AMOUNT).setNumberFormat('#,##0"円"')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());
  sh.getRange(ANNUAL_V16.MANUAL.FEE_DISPLAY).setNumberFormat('#,##0"円"')
    .setBackground('#e2f0d9').setFontWeight('bold');
  sh.getRange(ANNUAL_V16.MANUAL.NOTE).clearDataValidations().setWrap(true);
  sh.getRange('A6').setNote('必須項目です。電話・窓口・郵送から実際の受付方法を選択してください。');
  sh.getRange('B6').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['電話', '窓口', '郵送'], true).setAllowInvalid(false)
    .setHelpText('必須項目です。実際の受付方法を選択してください。').build());
  sh.getRange('D13').setNote(
    '初盆の合同供養会で読上げる場合だけチェックします。別日での個別供養は通常の供養受付を使用してください。'
  );
  sh.getRange('B21').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(ANNUAL_V16.PAYMENT_STATUSES, true).setAllowInvalid(false).build());
  sh.getRange('D21').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['現金', '振込', 'クレジット', 'コンビニ'], true).setAllowInvalid(false).build());
  sh.getRangeList(['F7', 'F22']).setBackground('#fffdf5');
  if (!clean_(sh.getRange('B21').getValue())) sh.getRange('B21').setValue('未入金');
  if (fullSetup) {
    sh.setColumnWidth(5, 135);
    sh.setColumnWidth(6, 190);
    sh.setColumnWidth(7, 120);
    sh.hideColumns(5, 3);
    if (/^登録できません：案内方法/.test(clean_(sh.getRange('D26').getValue()))) {
      sh.getRange('D26').clearContent().setBackground('#ffffff');
    }
    ensureManualSimpleConditionalFormats_(sh);
  }
  updateManualSimpleVisibility_(sh);
  return sh;
}

function ensurePaymentDashboard_(ss, fullSetup) {
  let sh = ss.getSheetByName(ANNUAL.SHEETS.PAYMENT_DASHBOARD);
  if (!sh) sh = ss.insertSheet(ANNUAL.SHEETS.PAYMENT_DASHBOARD);
  if (sh.getMaxColumns() < 20) sh.insertColumnsAfter(sh.getMaxColumns(), 20 - sh.getMaxColumns());
  sh.getRange('A1:L2').breakApart();
  sh.getRange('B1:K1').merge().setValue('未納確認')
    .setBackground('#5b3a29').setFontColor('#ffffff').setFontWeight('bold')
    .setFontSize(14).setHorizontalAlignment('center');
  sh.getRange('B2:K2').merge().setValue(
    '赤＝未入金　黄＝一部入金　紫＝要確認　濃赤＝支払期限超過　※保留中の申込も集計します'
  ).setBackground('#f8f5f1').setFontColor('#6b4b35').setFontSize(10).setWrap(true);
  sh.getRange('A3:H3').clearContent();
  sh.getRange('B3:G3').setValues([[
    '未入金件数', '=SUM(COUNTIFS(申込管理!T:T,"未入金",申込管理!AD:AD,{"受付中","保留"}))',
    '一部入金件数', '=SUM(COUNTIFS(申込管理!T:T,"一部入金",申込管理!AD:AD,{"受付中","保留"}))',
    '未収合計', '=SUM(SUMIFS(申込管理!AJ:AJ,申込管理!AD:AD,{"受付中","保留"}))'
  ]]).setBackground('#ffffff').setFontColor('#202124').setFontWeight('normal');
  sh.getRange('A5:L5').setValues([[
    '申込ID', '対象年', '法会', '区分', '施主名', '志納料', '入金状態', '未収額',
    '支払期限', '通知状態', '受付状態', '督促状態'
  ]]).setBackground('#d9ead3').setFontWeight('bold');
  sh.getRange('A6').setFormula(
    '=IFERROR(SORT(FILTER({申込管理!B2:B,申込管理!D2:D,申込管理!E2:E,申込管理!F2:F,申込管理!H2:H,申込管理!N2:N,申込管理!T2:T,申込管理!AJ2:AJ,申込管理!AG2:AG,申込管理!AF2:AF,申込管理!AD2:AD,申込管理!AR2:AR},申込管理!B2:B<>"",REGEXMATCH(申込管理!T2:T,"^(未入金|一部入金|要確認)$"),REGEXMATCH(申込管理!AD2:AD,"^(受付中|保留)$")),9,TRUE),"")'
  );
  sh.setFrozenRows(5);
  sh.getRange('C3').setBackground('#fce8e6').setFontWeight('bold');
  sh.getRange('E3').setBackground('#fff2cc').setFontWeight('bold');
  sh.getRange('G3').setBackground('#fce8e6').setFontWeight('bold').setNumberFormat('#,##0"円"');
  sh.getRange('F6:F').setNumberFormat('#,##0"円"');
  sh.getRange('H6:H').setNumberFormat('#,##0"円"');
  sh.getRange('I6:I').setNumberFormat('yyyy/mm/dd');
  const dashboardFormulas = new Set([
    '=AND($I6<>"",$I6<TODAY(),OR($G6="未入金",$G6="一部入金"))',
    '=$G6="未入金"', '=$G6="一部入金"', '=$G6="要確認"'
  ]);
  const kept = sh.getConditionalFormatRules().filter(rule => {
    const condition = rule.getBooleanCondition();
    const values = condition && condition.getCriteriaValues();
    return !(values && dashboardFormulas.has(String(values[0] || '')));
  });
  const dashboardRows = sh.getRange(6, 1, Math.max(1, sh.getMaxRows() - 5), 12);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($I6<>"",$I6<TODAY(),OR($G6="未入金",$G6="一部入金"))')
      .setBackground('#b3261e').setFontColor('#ffffff').setBold(true).setRanges([dashboardRows]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$G6="未入金"')
      .setBackground('#fce8e6').setFontColor('#b3261e').setBold(true).setRanges([dashboardRows]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$G6="一部入金"')
      .setBackground('#fff2cc').setFontColor('#8a4b00').setBold(true).setRanges([dashboardRows]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$G6="要確認"')
      .setBackground('#eadcf8').setFontColor('#5b2a86').setBold(true).setRanges([dashboardRows]).build()
  ];
  sh.setConditionalFormatRules([...kept, ...rules]);
  sh.setHiddenGridlines(true);
  if (fullSetup) {
    [190, 80, 90, 80, 170, 100, 100, 100, 100, 110, 95, 95]
      .forEach((width, i) => sh.setColumnWidth(i + 1, width));
  }
  return sh;
}

function calculatePaymentDue_(ss, application) {
  if (!application || clean_(application.payStatus) === '免除' || clean_(application.payMethod) === '現金') return '';
  const settings = mustSheet_(ss, ANNUAL.SHEETS.SETTINGS);
  const config = getAnnualConfig_(settings);
  const days = Number(config['支払期限日数']) || 5;
  const base = application.timestamp instanceof Date && !isNaN(application.timestamp.getTime())
    ? new Date(application.timestamp.getTime()) : new Date();
  base.setDate(base.getDate() + days);
  return base;
}

function writeApplicationV16Fields_(appSh, row, application, options) {
  const ss = appSh.getParent();
  const opts = options || {};
  const start = ANNUAL_V16.COL.RECEPTION_STATE;
  const current = appSh.getRange(row, start, 1, ANNUAL_V16.APPLICATION_HEADERS.length).getValues()[0];
  const existingReception = clean_(current[0]);
  const receptionState = ANNUAL_V16.EXCLUDED_RECEPTION_STATES.includes(existingReception)
    ? existingReception : (clean_(opts.receptionState) || existingReception || '受付中');
  const contentState = clean_(opts.contentState) || clean_(current[1]) ||
    (clean_(application.status) === '要確認' ? '要確認' : '確認済');
  const noticeState = clean_(current[2]) || clean_(opts.noticeState) || '未案内';
  const paymentDue = current[3] || calculatePaymentDue_(ss, application);
  const paymentEntry = Object.prototype.hasOwnProperty.call(opts, 'paymentAmount')
    ? Number(opts.paymentAmount) || 0 : (Number(current[4]) || 0);
  const paymentTotal = Object.prototype.hasOwnProperty.call(opts, 'paymentTotal')
    ? Number(opts.paymentTotal) || 0 : (Number(current[5]) || 0);
  const fee = Number(application.fee) || Number(appSh.getRange(row, 14).getValue()) || 0;
  const balance = clean_(application.payStatus) === '免除' ? 0 : Math.max(0, fee - paymentTotal);
  const personId = clean_(opts.personId) || clean_(application.personId) || clean_(current[10]);
  const householdId = clean_(opts.householdId) || clean_(application.householdId) || clean_(current[11]);
  const email = clean_(opts.email) || clean_(application.email) || clean_(current[12]);
  const guideMethod = clean_(opts.guideMethod) || clean_(application.guideMethod) || clean_(current[13]) || '未確認';
  const confirmedApplicant = clean_(current[15]) || clean_(application.applicantName) ||
    clean_(application.contractor) || clean_(application.sponsor);
  appSh.getRange(row, start, 1, ANNUAL_V16.APPLICATION_HEADERS.length).setValues([[
    receptionState,
    contentState,
    noticeState,
    paymentDue,
    paymentEntry,
    paymentTotal,
    balance,
    clean_(opts.paymentReference) || clean_(application.paymentReference) || clean_(current[7]),
    clean_(opts.verifier) || clean_(current[8]),
    clean_(current[9]),
    personId,
    householdId,
    email,
    guideMethod,
    clean_(current[14]) || '未督促',
    confirmedApplicant,
    clean_(current[16]) || personId
  ]]);
}

function updateApplicationNoticeState_(appSh, row, state) {
  if (!appSh || !row) return;
  appSh.getRange(row, ANNUAL_V16.COL.NOTICE_STATE).setValue(clean_(state) || '未案内');
}

function migrateApplicationV16Data_(ss) {
  const appSh = ensureApplicationV16Schema_(ss, false);
  if (appSh.getLastRow() < 2) return;
  const rawSh = mustSheet_(ss, ANNUAL.SHEETS.RESPONSE);
  const rawMap = new Map();
  if (rawSh.getLastRow() >= 2) {
    rawSh.getRange(2, 1, rawSh.getLastRow() - 1, 25).getValues().forEach(row => {
      const id = clean_(row[1]);
      if (id) rawMap.set(id, row);
    });
  }
  const rows = appSh.getRange(2, 1, appSh.getLastRow() - 1, ANNUAL_V16.COL.CONFIRMED_PERSON_ID).getValues();
  rows.forEach((values, index) => {
    const row = index + 2;
    const id = clean_(values[1]);
    if (!id) return;
    const raw = rawMap.get(id) || [];
    const explicitTest = [values[6], values[7], values[11], values[24]]
      .some(value => /(^|[\s　])テスト($|[\s　])|^テスト|テスト$/.test(clean_(value)));
    const receptionState = explicitTest ? 'テスト' :
      (clean_(values[ANNUAL_V16.COL.RECEPTION_STATE - 1]) || '受付中');
    const contentState = clean_(values[ANNUAL_V16.COL.CONTENT_STATE - 1]) ||
      (clean_(values[0]) === '要確認' ? '要確認' : '確認済');
    const category = clean_(values[5]);
    const applicantName = category === '一般'
      ? (extractAuditValue_(raw[22], '申込者名') || clean_(values[7]))
      : clean_(values[6]);
    const record = findManualApplicantRecord_(ss, category, applicantName);
    const application = {
      timestamp: values[2], fee: Number(values[13]) || 0,
      payMethod: clean_(values[20]), payStatus: clean_(values[19]),
      category, contractor: clean_(values[6]), applicantName, sponsor: clean_(values[7]),
      email: clean_(raw[2]), personId: record ? record.personId : '',
      householdId: record ? record.householdId : ''
    };
    writeApplicationV16Fields_(appSh, row, application, {
      receptionState,
      contentState,
      noticeState: clean_(values[ANNUAL_V16.COL.NOTICE_STATE - 1]) || '履歴未確認',
      guideMethod: clean_(values[18]) === 'フォーム' ? 'メール' : '未確認',
      personId: record ? record.personId : '',
      householdId: record ? record.householdId : '',
      email: clean_(raw[2])
    });
    migrateExistingPaymentForRow_(ss, appSh, row);
  });
}

function migrateExistingPaymentForRow_(ss, appSh, row) {
  const values = appSh.getRange(row, 1, 1, ANNUAL_V16.COL.CONFIRMED_PERSON_ID).getValues()[0];
  const applicationId = clean_(values[1]);
  if (!applicationId) return;
  const paymentSh = ensurePaymentHistorySchema_(ss, false);
  const hasHistory = paymentSh.getLastRow() >= 2 && paymentSh.getRange(2, 2, paymentSh.getLastRow() - 1, 1)
    .getDisplayValues().some(item => clean_(item[0]) === applicationId);
  if (hasHistory) return;
  let amount = Number(values[ANNUAL_V16.COL.PAYMENT_ENTRY - 1]) || 0;
  const payStatus = clean_(values[19]);
  if (!amount && payStatus === '入金済') amount = Number(values[13]) || 0;
  if (amount <= 0 || payStatus === '免除') return;
  upsertPaymentHistoryRecord_(ss, `PAY-LEGACY-${applicationId}`, [
    `PAY-LEGACY-${applicationId}`, applicationId, values[21] || values[2] || new Date(),
    clean_(values[20]) || 'その他', amount, '申込時入金', clean_(values[7]),
    clean_(values[ANNUAL_V16.COL.PAYMENT_REFERENCE - 1]), '確認済', false, false,
    clean_(values[ANNUAL_V16.COL.PAYMENT_VERIFIER - 1]) || 'v16移行',
    'v15の入金済表示から移行', '申込管理', new Date()
  ]);
}

function upsertPaymentHistoryRecord_(ss, paymentId, values) {
  const sh = ensurePaymentHistorySchema_(ss, false);
  const row = findIdRow_(sh, 1, paymentId);
  if (row) {
    sh.getRange(row, 1, 1, ANNUAL_V16.PAYMENT_HISTORY_HEADERS.length).setValues([values]);
    return row;
  }
  return writeFirstEmptyIdRow_(sh, 1, values);
}

function upsertMainPaymentHistory_(ss, application, editor) {
  const amount = Number(application.paymentAmount) || 0;
  if (!application.responseId || amount <= 0 || application.payStatus === '免除') return 0;
  const paymentId = `PAY-MAIN-${application.responseId}`;
  return upsertPaymentHistoryRecord_(ss, paymentId, [
    paymentId,
    application.responseId,
    application.payDate || application.receivedDate || application.timestamp || new Date(),
    application.payMethod || 'その他',
    amount,
    '申込時入金',
    application.sponsor || application.applicantName || '',
    application.paymentReference || '',
    '確認済', false, false,
    clean_(editor) || application.receptionStaff || '職員',
    '受付入力の今回入金額から同期',
    '受付入力',
    new Date()
  ]);
}

function upsertMainPaymentHistoryFromApplicationRow_(ss, appSh, row) {
  const values = appSh.getRange(row, 1, 1, ANNUAL_V16.COL.CONFIRMED_PERSON_ID).getValues()[0];
  const applicationId = clean_(values[1]);
  if (!applicationId) return;
  const paymentId = `PAY-MAIN-${applicationId}`;
  const historySh = ensurePaymentHistorySchema_(ss, false);
  const existing = findIdRow_(historySh, 1, paymentId);
  const payStatus = clean_(values[19]);
  let amount = Number(values[ANNUAL_V16.COL.PAYMENT_ENTRY - 1]) || 0;
  if (!amount && payStatus === '入金済') amount = Number(values[13]) || 0;
  if (amount <= 0 || payStatus === '免除') {
    if (existing) {
      historySh.getRange(existing, 5).setValue(0);
      historySh.getRange(existing, 9).setValue('取消');
      historySh.getRange(existing, 15).setValue(new Date());
    }
    return;
  }
  upsertPaymentHistoryRecord_(ss, paymentId, [
    paymentId, applicationId, values[21] || new Date(), clean_(values[20]) || 'その他',
    amount, '申込時入金', clean_(values[7]),
    clean_(values[ANNUAL_V16.COL.PAYMENT_REFERENCE - 1]), '確認済', false, false,
    clean_(values[ANNUAL_V16.COL.PAYMENT_VERIFIER - 1]) || correctionEditor_({}),
    '申込管理の今回入金額から同期', '申込管理', new Date()
  ]);
}

function collectPaymentSummaries_(historySh) {
  const result = new Map();
  const lastRow = lastDataRowByColumn_(historySh, 1);
  if (lastRow < 2) return result;
  historySh.getRange(2, 1, lastRow - 1, ANNUAL_V16.PAYMENT_HISTORY_HEADERS.length)
    .getValues().forEach(row => {
      const applicationId = clean_(row[1]);
      const confirmation = clean_(row[8]) || '確認済';
      if (!applicationId || confirmation !== '確認済') return;
      if (!result.has(applicationId)) result.set(applicationId, { total: 0, latestDate: '', latestVerifier: '' });
      const item = result.get(applicationId);
      item.total += Number(row[4]) || 0;
      const date = row[2] instanceof Date ? row[2] : new Date(row[2]);
      const latest = item.latestDate instanceof Date ? item.latestDate : new Date(item.latestDate || 0);
      if (date instanceof Date && !isNaN(date.getTime()) && date.getTime() >= latest.getTime()) {
        item.latestDate = row[2];
        item.latestVerifier = clean_(row[11]);
      }
    });
  return result;
}

function calculatePaymentSummary_(fee, currentStatus, summary) {
  const total = summary ? Number(summary.total) || 0 : 0;
  let status = clean_(currentStatus) === '免除' ? '免除'
    : total <= 0 ? '未入金'
    : total < fee ? '一部入金'
    : total === fee ? '入金済' : '要確認';
  if (!fee && clean_(currentStatus) !== '免除') status = '要確認';
  return {
    status,
    total,
    balance: status === '免除' ? 0 : Math.max(0, fee - total),
    latestDate: summary ? summary.latestDate : '',
    latestVerifier: summary ? summary.latestVerifier : ''
  };
}

function syncPaymentSummaryForApplication_(ss, applicationId) {
  const appSh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  const appRow = findIdRow_(appSh, 2, applicationId);
  if (!appRow) return;
  const historySh = ensurePaymentHistorySchema_(ss, false);
  const summaries = collectPaymentSummaries_(historySh);
  const fee = Number(appSh.getRange(appRow, 14).getValue()) || 0;
  const currentStatus = clean_(appSh.getRange(appRow, 20).getValue());
  const calculated = calculatePaymentSummary_(fee, currentStatus, summaries.get(clean_(applicationId)));
  appSh.getRange(appRow, ANNUAL_V16.COL.PAYMENT_TOTAL, 1, 2)
    .setValues([[calculated.total, calculated.balance]]);
  appSh.getRange(appRow, 20).setValue(calculated.status);
  if (calculated.latestDate) appSh.getRange(appRow, 22).setValue(calculated.latestDate);
  if (calculated.latestVerifier) {
    appSh.getRange(appRow, ANNUAL_V16.COL.PAYMENT_VERIFIER).setValue(calculated.latestVerifier);
  }
  const balanceCell = appSh.getRange(appRow, ANNUAL_V16.COL.BALANCE);
  if (calculated.total > fee && fee > 0) {
    balanceCell.setNote(`過入金 ${formatYen_(calculated.total - fee)}。入金履歴を確認してください。`);
  } else {
    balanceCell.clearNote();
  }
  syncFirstObonPaymentFromApplication_(
    ss, applicationId, calculated.status,
    appSh.getRange(appRow, 21).getValue(), calculated.latestDate || appSh.getRange(appRow, 22).getValue() || ''
  );
  syncOperationalStatus_(
    ss, applicationId,
    clean_(appSh.getRange(appRow, ANNUAL_V16.COL.RECEPTION_STATE).getValue()) || '受付中',
    calculated.status,
    clean_(appSh.getRange(appRow, ANNUAL_V16.COL.REMINDER_STATE).getValue()) || '未督促'
  );
}

function syncAllPaymentSummaries_(ss) {
  const appSh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  const lastRow = lastDataRowByColumn_(appSh, 2);
  if (lastRow < 2) return;
  const historySh = ensurePaymentHistorySchema_(ss, false);
  const summaries = collectPaymentSummaries_(historySh);
  const rows = appSh.getRange(2, 1, lastRow - 1, ANNUAL_V16.COL.REMINDER_STATE).getValues();
  const statuses = [];
  const dates = [];
  const totals = [];
  const verifiers = [];
  const notes = [];
  const stateMap = new Map();

  rows.forEach(row => {
    const id = clean_(row[1]);
    if (!id) {
      statuses.push([row[19] || '']);
      dates.push([row[21] || '']);
      totals.push([row[ANNUAL_V16.COL.PAYMENT_TOTAL - 1] || '', row[ANNUAL_V16.COL.BALANCE - 1] || '']);
      verifiers.push([row[ANNUAL_V16.COL.PAYMENT_VERIFIER - 1] || '']);
      notes.push(['']);
      return;
    }
    const fee = Number(row[13]) || 0;
    const calculated = calculatePaymentSummary_(fee, row[19], summaries.get(id));
    const payDate = calculated.latestDate || row[21] || '';
    const verifier = calculated.latestVerifier || row[ANNUAL_V16.COL.PAYMENT_VERIFIER - 1] || '';
    statuses.push([calculated.status]);
    dates.push([payDate]);
    totals.push([calculated.total, calculated.balance]);
    verifiers.push([verifier]);
    notes.push([calculated.total > fee && fee > 0
      ? `過入金 ${formatYen_(calculated.total - fee)}。入金履歴を確認してください。` : '']);
    stateMap.set(id, {
      receptionState: clean_(row[ANNUAL_V16.COL.RECEPTION_STATE - 1]) || '受付中',
      paymentStatus: calculated.status,
      reminderState: clean_(row[ANNUAL_V16.COL.REMINDER_STATE - 1]) || '未督促',
      payMethod: clean_(row[20]),
      payDate
    });
  });

  appSh.getRange(2, 20, statuses.length, 1).setValues(statuses);
  appSh.getRange(2, 22, dates.length, 1).setValues(dates);
  appSh.getRange(2, ANNUAL_V16.COL.PAYMENT_TOTAL, totals.length, 2).setValues(totals);
  appSh.getRange(2, ANNUAL_V16.COL.PAYMENT_VERIFIER, verifiers.length, 1).setValues(verifiers);
  appSh.getRange(2, ANNUAL_V16.COL.BALANCE, notes.length, 1).setNotes(notes);
  syncOperationalStatusesBatch_(ss, stateMap);
  syncFirstObonPaymentsBatch_(ss, stateMap);
}

function handlePaymentHistoryEdit_(e) {
  const sh = e.range.getSheet();
  const ss = sh.getParent();
  const ids = new Set();
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  const touchesApplicationId = firstColumn <= 2 && lastColumn >= 2;
  const requiresFullSync = touchesApplicationId &&
    (e.range.getNumRows() > 1 || e.range.getNumColumns() > 1);
  if (touchesApplicationId && e.range.getNumRows() === 1 && e.range.getNumColumns() === 1 && clean_(e.oldValue)) {
    ids.add(clean_(e.oldValue));
  }
  const firstRow = Math.max(2, e.range.getRow());
  const lastRow = e.range.getRow() + e.range.getNumRows() - 1;
  for (let row = firstRow; row <= lastRow; row++) {
    const applicationId = clean_(sh.getRange(row, 2).getValue());
    const amount = Number(sh.getRange(row, 5).getValue()) || 0;
    if (!applicationId && !amount) continue;
    if (!applicationId) {
      sh.getRange(row, 2).setBackground('#fce8e6').setNote('申込IDを入力してください。');
      continue;
    }
    if (!clean_(sh.getRange(row, 1).getValue())) {
      sh.getRange(row, 1).setValue(`PAY-${Utilities.getUuid().slice(0, 16).toUpperCase()}`);
    }
    if (amount && !sh.getRange(row, 3).getValue()) sh.getRange(row, 3).setValue(new Date());
    if (!clean_(sh.getRange(row, 6).getValue())) sh.getRange(row, 6).setValue(amount < 0 ? '返金' : '追加入金');
    if (!clean_(sh.getRange(row, 9).getValue())) sh.getRange(row, 9).setValue('確認済');
    if (!clean_(sh.getRange(row, 12).getValue())) sh.getRange(row, 12).setValue(correctionEditor_(e));
    sh.getRange(row, 15).setValue(new Date());
    ids.add(applicationId);
  }
  if (requiresFullSync) syncAllPaymentSummaries_(ss);
  else ids.forEach(id => syncPaymentSummaryForApplication_(ss, id));
}

function syncOperationalStatus_(ss, applicationId, receptionState, paymentStatus, reminderState) {
  const workSh = ensureWorkSheetSchema_(ss);
  const workLastRow = lastDataRowByColumn_(workSh, 5);
  if (workLastRow >= 2) {
    workSh.getRange(2, 5, workLastRow - 1, 1)
      .createTextFinder(String(applicationId)).matchEntireCell(true).findAll()
      .forEach(hit => workSh.getRange(hit.getRow(), 21, 1, 3).setValues([[
        receptionState || '受付中', paymentStatus || '未入金', reminderState || '未督促'
      ]]));
  }
  const readingSh = ensureReadingV16Schema_(ss, false);
  const readingLastRow = lastDataRowByColumn_(readingSh, 4);
  if (readingLastRow >= 2) {
    readingSh.getRange(2, 4, readingLastRow - 1, 1)
      .createTextFinder(String(applicationId)).matchEntireCell(true).findAll()
      .forEach(hit => readingSh.getRange(hit.getRow(), 18, 1, 3).setValues([[
        receptionState || '受付中', paymentStatus || '未入金', reminderState || '未督促'
      ]]));
  }
}

function syncOperationalStatusesBatch_(ss, stateMap) {
  const apply = (sh, idColumn, firstStateColumn) => {
    const lastRow = lastDataRowByColumn_(sh, idColumn);
    if (lastRow < 2) return;
    const ids = sh.getRange(2, idColumn, lastRow - 1, 1).getDisplayValues();
    const current = sh.getRange(2, firstStateColumn, lastRow - 1, 3).getValues();
    const next = ids.map((row, index) => {
      const state = stateMap.get(clean_(row[0]));
      return state ? [state.receptionState, state.paymentStatus, state.reminderState] : current[index];
    });
    sh.getRange(2, firstStateColumn, next.length, 3).setValues(next);
  };
  apply(ensureWorkSheetSchema_(ss), 5, 21);
  apply(ensureReadingV16Schema_(ss, false), 4, 18);
}

/**
 * 初盆電話受付の入金欄（N:P）を一括で合わせます。
 * 照合キーは備考（V列）の「申込ID：〜」です。受付日時（B列）では申込IDと一致しません。
 */
function syncFirstObonPaymentsBatch_(ss, stateMap) {
  const sh = mustSheet_(ss, ANNUAL.SHEETS.FIRST_OBON);
  const rowsById = firstObonRowsByApplicationId_(sh);
  if (!rowsById.size) return;
  rowsById.forEach((row, applicationId) => {
    const state = stateMap.get(applicationId);
    if (!state) return;
    sh.getRange(row, 14, 1, 3).setValues([[
      state.paymentStatus || '未入金', state.payMethod || '', state.payDate || ''
    ]]);
  });
}

function syncAllOperationalStatuses_(ss) {
  const appSh = mustSheet_(ss, ANNUAL.SHEETS.APPLICATION);
  const lastRow = lastDataRowByColumn_(appSh, 2);
  if (lastRow < 2) return;
  const stateMap = new Map();
  appSh.getRange(2, 1, lastRow - 1, ANNUAL_V16.COL.REMINDER_STATE).getValues()
    .forEach(row => {
      const id = clean_(row[1]);
      if (!id) return;
      stateMap.set(id, {
        receptionState: clean_(row[ANNUAL_V16.COL.RECEPTION_STATE - 1]) || '受付中',
        paymentStatus: clean_(row[19]) || '未入金',
        reminderState: clean_(row[ANNUAL_V16.COL.REMINDER_STATE - 1]) || '未督促',
        payMethod: clean_(row[20]),
        payDate: row[21] || ''
      });
    });
  syncOperationalStatusesBatch_(ss, stateMap);
  syncFirstObonPaymentsBatch_(ss, stateMap);
}

function ensureV16OperationConditionalFormats_(workSh, readingSh) {
  const apply = (sh, stateColumn, paymentColumn, width) => {
    const lastRow = Math.max(2, sh.getMaxRows());
    const whole = sh.getRange(2, 1, lastRow - 1, width);
    const payment = sh.getRange(2, paymentColumn, lastRow - 1, 1);
    const stateLetter = columnLetter_(stateColumn);
    const paymentLetter = columnLetter_(paymentColumn);
    const marker = `=OR($${stateLetter}2="取消",$${stateLetter}2="重複",$${stateLetter}2="テスト")`;
    const formulas = new Set([marker, `=$${paymentLetter}2="未入金"`, `=$${paymentLetter}2="一部入金"`]);
    const kept = sh.getConditionalFormatRules().filter(rule => {
      const condition = rule.getBooleanCondition();
      const values = condition && condition.getCriteriaValues();
      return !(values && formulas.has(String(values[0] || '')));
    });
    const rules = [
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(marker)
        .setBackground('#e0e0e0').setFontColor('#777777').setRanges([whole]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=$${paymentLetter}2="未入金"`)
        .setBackground('#fce8e6').setFontColor('#b3261e').setRanges([payment]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=$${paymentLetter}2="一部入金"`)
        .setBackground('#fff2cc').setFontColor('#8a4b00').setRanges([payment]).build()
    ];
    sh.setConditionalFormatRules([...kept, ...rules]);
  };
  apply(workSh, 21, 22, 23);
  apply(readingSh, 18, 19, 20);
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

function updateManualV16Preview_(ss, sh) {
  try {
    const eventName = clean_(sh.getRange('B5').getValue());
    const category = clean_(sh.getRange('D5').getValue());
    const firstObon = sh.getRange('D13').getValue() === true;
    const requestType = firstObon ? '初盆供養'
      : (category === '一般' && eventName === 'お盆'
          ? '合同供養のみ' : normalizeRequestType_(sh.getRange('B13').getValue(), category));
    const memorials = firstObon
      ? [sh.getRange('B17').getValue(), sh.getRange('D17').getValue()].map(clean_).filter(Boolean).slice(0, 1)
      : ['B14', 'D14', 'B15', 'D15', 'B16'].map(a1 => clean_(sh.getRange(a1).getValue())).filter(Boolean);
    let fee = 0;
    if (eventName && category && requestType) {
      fee = firstObon ? getFirstObonFee_(ss) : calculateFee_(ss, eventName, category, requestType, memorials.length);
    }
    const payMethod = clean_(sh.getRange('D21').getValue()) || '未選択';
    const payStatus = clean_(sh.getRange('B21').getValue()) || '未入金';
    const amountCell = sh.getRange(ANNUAL_V16.MANUAL.PAYMENT_AMOUNT);
    const currentAmount = Number(amountCell.getValue()) || 0;
    sh.getRange('F15').setValue(memorials.length ? `${memorials.length}件` : '未入力');
    sh.getRange('F16').setValue(fee || '').setNumberFormat('#,##0"円"');
    sh.getRange(ANNUAL_V16.MANUAL.FEE_DISPLAY).setValue(fee || '').setNumberFormat('#,##0"円"');
    if (payStatus === '入金済' && fee > 0 && currentAmount !== fee) {
      amountCell.setValue(fee);
    } else if (['未入金', '免除'].includes(payStatus) && currentAmount > 0) {
      amountCell.clearContent();
    }
    sh.getRange('F17').setValue(`${payMethod}／${payStatus}`);
    sh.getRange('F18').setValue('らくまる寺務');
    const checks = [];
    if (!eventName) checks.push('法会未選択');
    if (!category) checks.push('区分未選択');
    if (!clean_(sh.getRange('B6').getValue())) checks.push('受付方法未選択');
    if (!clean_(sh.getRange('B9').getValue())) checks.push('申込者名未入力');
    if (!firstObon && requestType !== '納骨壇前読経のみ' && !memorials.length) checks.push('供養内容未入力');
    if (!['現金', '振込', 'クレジット', 'コンビニ'].includes(clean_(sh.getRange('D21').getValue())) &&
        clean_(sh.getRange('B21').getValue()) !== '免除') checks.push('支払方法未選択');
    const year = eventName && category
      ? manualTargetYear_(mustSheet_(ss, ANNUAL.SHEETS.SETTINGS), eventName, category, sh.getRange('B7').getValue())
      : 0;
    const readingDate = sh.getRange('D19').getValue();
    const readingTime = sh.getRange('B20').getValue();
    if (readingDate && year && dateYear_(readingDate) && dateYear_(readingDate) !== year) {
      checks.push(`読経希望日は${year}年の日付を指定`);
    }
    if (!firstObon && !isAllowedManualRequestType_(category, sh.getRange('B13').getValue())) {
      checks.push('ご希望の供養未選択');
    }
    if (!firstObon && needsAltarReading_(requestType)) {
      const attend = normalizeAttendance_(sh.getRange('B19').getValue(), requestType);
      if (!['参列する', '寺院一任'].includes(attend)) {
        checks.push('読経参列未選択');
      } else if (attend === '参列する' && (!hasValue_(readingDate) || !hasValue_(readingTime))) {
        checks.push('参列する場合は読経日・時刻が必要');
      } else if (attend === '寺院一任' && hasPartialReadingDateTime_(readingDate, readingTime)) {
        checks.push('寺院一任は読経日・時刻をセットで入力');
      }
    }
    sh.getRange('F19').setValue(checks.length ? '要確認' : '確認済')
      .setBackground(checks.length ? '#fff2cc' : '#e6f4ea');
    sh.getRange(ANNUAL_V16.MANUAL.PREVIEW)
      .setValue(checks.length ? checks.join('\n') : '登録前の必須項目を確認しました。')
      .setBackground(checks.length ? '#fff2cc' : '#e6f4ea');
  } catch (error) {
    sh.getRange(ANNUAL_V16.MANUAL.PREVIEW)
      .setValue(`プレビュー要確認：${error && error.message ? error.message : error}`)
      .setBackground('#fce8e6');
  }
}

function findPotentialDuplicateIssues_(appSh, application) {
  const lastRow = lastDataRowByColumn_(appSh, 2);
  if (!appSh || lastRow < 2) return [];
  const targetApplicant = key_(application.applicantName || application.contractor || application.sponsor);
  const targetContent = key_(application.applicationContent || (application.memorials || []).join('\n'));
  if (!targetApplicant || !targetContent) return [];
  const rows = appSh.getRange(2, 1, lastRow - 1, Math.min(appSh.getMaxColumns(), ANNUAL_V16.COL.RECEPTION_STATE)).getValues();
  const duplicate = rows.some(row => {
    if (!clean_(row[1]) || clean_(row[1]) === clean_(application.responseId)) return false;
    if (ANNUAL_V16.EXCLUDED_RECEPTION_STATES.includes(clean_(row[29]))) return false;
    if (Number(row[3]) !== Number(application.year) || clean_(row[4]) !== clean_(application.eventName) || clean_(row[5]) !== clean_(application.category)) return false;
    const existingApplicant = key_(application.category === '一般' ? row[7] : row[6]);
    return existingApplicant === targetApplicant && key_(row[11]) === targetContent;
  });
  return duplicate ? ['同じ法会・同じ申込者・同じ供養内容の受付が既にあります（重複要確認）'] : [];
}

function upsertGeneralApplicantContact_(ss, application) {
  ensureMemorialMasterHeaders_(ss);
  const sh = mustSheet_(ss, ANNUAL.SHEETS.GENERAL_MASTER);
  const name = clean_(application.applicantName || application.sponsor);
  if (!name) return null;
  const requestedPersonId = clean_(application.personId);
  let row = 0;
  if (sh.getLastRow() >= 2) {
    const values = sh.getRange(2, 1, sh.getLastRow() - 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length).getValues();
    const index = values.findIndex(item =>
      (requestedPersonId && clean_(item[10]) === requestedPersonId) ||
      (!requestedPersonId && key_(item[0]) === key_(name))
    );
    if (index >= 0) row = index + 2;
  }
  if (!row) {
    row = Math.max(2, sh.getLastRow() + 1);
    if (row > sh.getMaxRows()) sh.insertRowAfter(sh.getMaxRows());
  }
  const current = sh.getRange(row, 1, 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length).getValues()[0];
  const personId = requestedPersonId || clean_(current[10]) ||
    `PER-LOCAL-${Utilities.getUuid().slice(0, 12).toUpperCase()}`;
  const next = current.slice();
  next[0] = name;
  next[1] = clean_(application.applicantKana || application.sponsorKana) || next[1] || '';
  next[2] = clean_(application.phone) || next[2] || '';
  next[3] = '一般信者';
  next[10] = personId;
  next[11] = clean_(application.householdId) || next[11] || '';
  next[12] = clean_(application.postalCode) || next[12] || '';
  next[13] = clean_(application.address) || next[13] || '';
  next[16] = clean_(application.email) || next[16] || '';
  next[17] = clean_(application.guideMethod) || next[17] || '';
  next[20] = new Date();
  sh.getRange(row, 1, 1, ANNUAL_V16.GENERAL_MASTER_HEADERS.length).setValues([next.map(safeSheetValue_)]);
  application.personId = personId;
  return { row, personId, name };
}

function extractAuditValue_(value, label) {
  const safe = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const line = String(value == null ? '' : value).split(/\r?\n/)
    .find(item => new RegExp(`^${safe}[:：]`).test(clean_(item)));
  return line ? clean_(line.replace(new RegExp(`^${safe}[:：]\\s*`), '')) : '';
}

function replaceAuditValue_(value, label, newValue) {
  const lines = String(value == null ? '' : value).split(/\r?\n/).filter(line => line !== '');
  const safe = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${safe}[:：]`);
  let replaced = false;
  const result = lines.map(line => {
    if (!regex.test(clean_(line))) return line;
    replaced = true;
    return `${label}：${clean_(newValue)}`;
  });
  if (!replaced) result.unshift(`${label}：${clean_(newValue)}`);
  return result.join('\n');
}

function sendManualApplicantGuide_(config, application) {
  const email = clean_(application.email);
  if (!email) return '申込者メールアドレスが空欄のため案内できませんでした';
  if (MailApp.getRemainingDailyQuota() < 1) return 'メール送信上限のため案内できませんでした';
  try {
    const number = applicationNumber_(application);
    const html = buildApplicantEmailHtml_(config, application, number);
    const prefix = application.issues && application.issues.length ? '【受付内容確認中】' : '【受付完了】';
    sendHtmlMail_(
      email,
      `${prefix}${application.year}年${application.eventName}供養のお申し込み・お支払い案内`,
      html,
      clean_(config['寺院通知先'])
    );
    return '';
  } catch (error) {
    return `申込者案内メール送信失敗: ${error && error.message ? error.message : error}`;
  }
}