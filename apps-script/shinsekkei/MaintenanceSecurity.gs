/* 保守処理は管理者の手動操作と非公開トリガーに分離する。先にこのファイルを保存し、
 * 既存トリガーを移行してから Setup.gs / Code.gs を差し替える。 */
const MIKO_BACKUP_CLOCK_ = Object.freeze({confirmed: true, days: 1, hour: 5, timeZone: 'Asia/Tokyo'});
const MIKO_MAINTENANCE_HANDLERS_ = Object.freeze({
  dailyBackup: 'dailyBackupTrigger_',
  onApplicationSubmit: 'applicationSubmitTrigger_'
});

function requireMikoMaintenanceOwner_() {
  const owner = String(PropertiesService.getScriptProperties().getProperty('管理者') || '').trim().toLowerCase();
  const active = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!owner || !active || owner !== active) throw Error('保守操作は登録済み管理者のGoogleアカウントで実行してください。');
  return owner;
}

function mikoMaintenanceConfig_() {
  return Object.fromEntries(read_('設定').map(r => [r.項目, r.値]));
}

function mikoMaintenanceTriggerInfo_(t) {
  return {id: String(t.getUniqueId()), handler: t.getHandlerFunction(),
    event: String(t.getEventType()), source: String(t.getTriggerSource()),
    sourceId: t.getTriggerSourceId() || ''};
}

function mikoMaintenancePlan_() {
  const config = mikoMaintenanceConfig_();
  const all = ScriptApp.getProjectTriggers();
  const groups = Object.keys(MIKO_MAINTENANCE_HANDLERS_).map(oldName => {
    const newName = MIKO_MAINTENANCE_HANDLERS_[oldName];
    const oldTriggers = all.filter(t => t.getHandlerFunction() === oldName);
    const newTriggers = all.filter(t => t.getHandlerFunction() === newName);
    if (oldTriggers.length > 1 || newTriggers.length > 1) throw Error(oldName + 'のトリガーが重複しています。既存の設定を確認してください。');
    const isClock = oldName === 'dailyBackup';
    const expectedEvent = isClock ? ScriptApp.EventType.CLOCK : ScriptApp.EventType.ON_FORM_SUBMIT;
    const expectedSource = isClock ? ScriptApp.TriggerSource.CLOCK : ScriptApp.TriggerSource.FORMS;
    const formId = String(config.応募フォームID || '').trim();
    oldTriggers.concat(newTriggers).forEach(t => {
      if (t.getEventType() !== expectedEvent || t.getTriggerSource() !== expectedSource) throw Error(oldName + 'の起動条件が想定と異なります。変更していません。');
      if (!isClock && (!formId || t.getTriggerSourceId() !== formId)) throw Error('応募トリガーのフォームと現在の設定が一致しません。変更していません。');
    });
    return {oldName, newName, oldTriggers, newTriggers, isClock, formId};
  });
  return groups;
}

function inspectMikoMaintenanceSecurity() {
  requireMikoMaintenanceOwner_();
  const groups = mikoMaintenancePlan_();
  const result = {ok: true, clockConfirmed: MIKO_BACKUP_CLOCK_.confirmed,
    clock: {days: MIKO_BACKUP_CLOCK_.days, hour: MIKO_BACKUP_CLOCK_.hour, timeZone: MIKO_BACKUP_CLOCK_.timeZone},
    groups: groups.map(g => ({oldHandler: g.oldName, privateHandler: g.newName,
      old: g.oldTriggers.map(mikoMaintenanceTriggerInfo_), current: g.newTriggers.map(mikoMaintenanceTriggerInfo_)}))};
  console.log(JSON.stringify(result));
  return result;
}

function installMikoMaintenanceSecurity() {
  requireMikoMaintenanceOwner_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const groups = mikoMaintenancePlan_();
    if (groups.some(g => g.isClock && g.oldTriggers.length && !g.newTriggers.length) && !MIKO_BACKUP_CLOCK_.confirmed)
      throw Error('既存dailyBackupの毎日・5時台・Asia/Tokyoを管理画面で確認し、確認フラグを設定してから実行してください。変更していません。');
    const created = [];
    // 新しい起動先をすべて確保してから旧トリガーだけを削除する。
    try {
      groups.forEach(g => {
        if (!g.oldTriggers.length || g.newTriggers.length) return;
        let t;
        if (g.isClock) {
          t = ScriptApp.newTrigger(g.newName).timeBased().everyDays(MIKO_BACKUP_CLOCK_.days)
            .atHour(MIKO_BACKUP_CLOCK_.hour).inTimezone(MIKO_BACKUP_CLOCK_.timeZone).create();
        } else {
          // IDは既存トリガーから引き継ぎ、上の事前検査で設定との一致を確認済み。
          t = ScriptApp.newTrigger(g.newName).forForm(g.oldTriggers[0].getTriggerSourceId()).onFormSubmit().create();
        }
        created.push(t);
        g.newTriggers = [t];
      });
      const verified = ScriptApp.getProjectTriggers();
      groups.forEach(g => {
        if (!g.oldTriggers.length) return;
        const t = g.newTriggers[0];
        if (!t || !verified.some(v => v.getUniqueId() === t.getUniqueId() && v.getHandlerFunction() === g.newName))
          throw Error('新トリガーを再確認できません。旧トリガーは残しています。');
      });
    } catch (error) {
      created.forEach(t => { try { ScriptApp.deleteTrigger(t); } catch (_) {} });
      throw error;
    }
    groups.forEach(g => g.oldTriggers.forEach(t => ScriptApp.deleteTrigger(t)));
    const remaining = ScriptApp.getProjectTriggers();
    if (remaining.some(t => Object.prototype.hasOwnProperty.call(MIKO_MAINTENANCE_HANDLERS_, t.getHandlerFunction())))
      throw Error('旧トリガーが残っています。新トリガーは保持しました。管理画面を確認して再実行してください。');
    const result = {ok: true, changed: created.length > 0 || groups.some(g => g.oldTriggers.length > 0),
      triggers: remaining.filter(t => Object.values(MIKO_MAINTENANCE_HANDLERS_).includes(t.getHandlerFunction())).map(mikoMaintenanceTriggerInfo_)};
    console.log(JSON.stringify(result));
    return result;
  } finally { lock.releaseLock(); }
}

function requireMikoTriggerContext_(event, handler, eventType, source) {
  const owner = String(PropertiesService.getScriptProperties().getProperty('管理者') || '').trim().toLowerCase();
  const effective = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (!owner || owner !== effective || !event || !event.triggerUid) throw Error('登録済みの保守トリガーから実行してください。');
  const registered = ScriptApp.getProjectTriggers().find(t => String(t.getUniqueId()) === String(event.triggerUid)
    && t.getHandlerFunction() === handler && t.getEventType() === eventType && t.getTriggerSource() === source);
  if (!registered) throw Error('登録済みの保守トリガーを確認できません。');
  if (source === ScriptApp.TriggerSource.FORMS) {
    const formId = String(mikoMaintenanceConfig_().応募フォームID || '').trim();
    if (!formId || registered.getTriggerSourceId() !== formId) throw Error('応募トリガーのフォーム設定が一致しません。');
  }
}

function dailyBackupTrigger_(event) {
  requireMikoTriggerContext_(event, 'dailyBackupTrigger_', ScriptApp.EventType.CLOCK, ScriptApp.TriggerSource.CLOCK);
  // 移行時は旧実装、Setup.gs差替え後は非公開の実装を呼ぶ。
  return typeof dailyBackup_ === 'function' ? dailyBackup_() : dailyBackup();
}

function applicationSubmitTrigger_(event) {
  requireMikoTriggerContext_(event, 'applicationSubmitTrigger_', ScriptApp.EventType.ON_FORM_SUBMIT, ScriptApp.TriggerSource.FORMS);
  return typeof onApplicationSubmit_ === 'function' ? onApplicationSubmit_(event) : onApplicationSubmit(event);
}
