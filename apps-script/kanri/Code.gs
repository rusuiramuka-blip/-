/* 巫女管理・新設計。表の行を直接読み書きする。旧システムの保存処理は使用しない。 */
const COLS = {
  設定: '項目|値|説明',
  売場: '売場ID|売場名|並び順|大学生以上必要',
  勤務帯: '勤務帯ID|名前|開始|終了|翌日終了|休憩開始|休憩終了|昼食|夕食|時給種類|並び順|交通費対象|休憩2開始|休憩2終了|メモ',
  必要人数: '枠ID|日付|勤務帯ID|売場ID|人数|大学生以上|昼食上書き|夕食上書き|確認',
  人: '人ID|氏名|ふりがな|区分|生年月日|性別|住所|電話|メール|状態|面接日時|面接完了日|本番時給|交通費|交通費課税額|基本勤務帯ID|経験|フォーム勤務希望|面接メモ|本人承諾|承諾日時|通知交付日|保護者学校確認|税区分|丙欄適用確認|保険確認|メモ|回答ID|移行元ID|面接担当|本人確認|志望動機|経験確認|通勤確認|説明確認|本人質問|本人意向|評価接遇|評価理解|評価意欲|採否伝達方法|採否伝達日|面接追記|応募連絡状況|応募連絡方法|応募連絡日|応募連絡対象日時|採否伝達結果',
  勤務希望: '希望ID|人ID|開始日時|終了日時|可否|確認方法|メモ',
  配置: '配置ID|日付|人ID|勤務帯ID|売場ID|了解方法|了解日時|了解担当|状態|予定開始上書き|予定終了上書き|休憩開始上書き|休憩終了上書き|実開始|実終了|実休憩開始|実休憩終了|実休憩分|社会保険料|確認者|メモ|休憩2開始上書き|休憩2終了上書き|実休憩2開始|実休憩2終了',
  支払: '支払ID|人ID|氏名|性別|期間開始|期間終了|支払予定日|通常時間|深夜時間|時間外時間|休日時間|基本給|深夜割増|時間外割増|休日割増|交通費|総支給|社会保険料|その他控除|源泉税|端数調整|差引支給|一万円|五千円|千円|五百円|百円|五十円|十円|五円|一円|支払日時|手渡し担当|受領確認|支払済|原支払ID|訂正理由',
  メール文面: 'テンプレートID|分類|名称|件名|本文|説明|対象|記録区分|有効|並び順',
  連絡記録: '連絡ID|人ID|日時|方法|用途ID|用途|宛先|件名|本文|面接日時|採否|記録者|記録日時',
  フォーム回答: '回答ID|受付日時|氏名|ふりがな|区分|生年月日|住所|電話|メール|面接日時|経験|勤務希望|その他回答|人ID'
};
const PERSON_STATES = ['応募','面接予定','採用','不採用','辞退'];
function doGet() { return HtmlService.createHtmlOutputFromFile('index').setTitle('巫女管理').addMetaTag('viewport','width=device-width, initial-scale=1'); }
function db_() {
  const id = PropertiesService.getScriptProperties().getProperty('台帳ID');
  if (!id) throw Error('初期設定が未実行です。');
  return SpreadsheetApp.openById(id);
}
function headers_(table) { if (!Object.prototype.hasOwnProperty.call(COLS,table)) throw Error('対象の表がありません。'); return COLS[table].split('|'); }
function cell_(v) { return v instanceof Date ? Utilities.formatDate(v,'Asia/Tokyo','yyyy-MM-dd\'T\'HH:mm') : v == null ? '' : v; }
function read_(table, book) {
  const sh=(book||db_()).getSheetByName(table), h=headers_(table);
  if (!sh || sh.getLastRow()<2) return [];
  const values=sh.getRange(1,1,sh.getLastRow(),h.length).getValues();
  if (values[0].join('|')!==COLS[table]) throw Error(table+'の列名が変わっています。列名を戻してください。');
  return values.slice(1).filter(r=>r[0]!==''&&r[0]!=null).map(r=>Object.fromEntries(h.map((k,i)=>[k,cell_(r[i])])));
}
function clean_(table,r) { return Object.fromEntries(headers_(table).map(k=>{const v=r[k]==null?'':r[k];if(typeof v==='object'||typeof v==='function')throw Error('セルには文字・数値・真偽値を入力してください。');return [k,v];})); }
function write_(table,rows,book) {
  const sh=(book||db_()).getSheetByName(table), h=headers_(table), last=sh.getLastRow();
  const data=rows.map(r=>h.map(k=>{const v=r[k]==null?'':r[k]; return typeof v==='string'&&/^[=+@]/.test(v)?"'"+v:v;}));
  if(last<=1&&data.length&&table!=='配置'){sh.getRange(2,1,data.length,h.length).setValues(data);return;}
  const before=last>1?sh.getRange(2,1,last-1,h.length).getValues():[];
  data.forEach((r,i)=>{
    let begin=-1;
    for(let j=0;j<=h.length;j++){
      const differs=j<h.length && !(table==='配置'&&h[j]==='実休憩分') && (!before[i]||String(r[j])!==String(cell_(before[i][j])));
      if(differs&&begin<0)begin=j;
      if(!differs&&begin>=0){sh.getRange(i+2,begin+1,1,j-begin).setValues([r.slice(begin,j)]);begin=-1;}
    }
  });
  for(let i=rows.length;i<before.length;i++)if(before[i][0]!==''&&before[i][0]!=null){h.forEach((k,j)=>{if(!(table==='配置'&&k==='実休憩分'))sh.getRange(i+2,j+1).clearContent();});}
}
function state_() { const b=db_(), s={}; Object.keys(COLS).forEach(t=>s[t]=read_(t,b)); s.cfg=Object.fromEntries(s.設定.map(r=>[r.項目,r.値])); return s; }
function yes_(v) { return v===true||v==='TRUE'||v==='true'||v==='はい'||v==='済'; }
function id_() { return Utilities.getUuid(); }
function now_() { return Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd\'T\'HH:mm'); }
function clock_(s) { return s.cfg.運用モード==='確認用'&&s.cfg.検証日時 ? String(s.cfg.検証日時) : now_(); }
function auth_(s,admin) {
  const who=String(Session.getActiveUser().getEmail()||'').toLowerCase();
  const owner=String(PropertiesService.getScriptProperties().getProperty('管理者')||'').toLowerCase();
  if (!who || !owner) throw Error('職員のGoogleアカウントで開いてください。');
  const editors=db_().getEditors().map(u=>u.getEmail().toLowerCase());
  if (who!==owner && !editors.includes(who)) throw Error('この台帳の編集権限がありません。');
  if (admin && who!==owner) throw Error('この操作は管理者が行ってください。');
  return {email:who,admin:who===owner};
}
function record_(s,t,key,value) { const r=s[t].find(x=>String(x[key])===String(value)); if(!r) throw Error('対象が見つかりません。更新してください。'); return r; }
function num_(v,label,min,max) { const n=Number(v); if(v===''||v==null||!Number.isFinite(n)||n<min||n>max)throw Error(label+'を確認してください。'); return n; }
function integer_(v,label,min,max) { const n=num_(v,label,min,max); if(!Number.isInteger(n))throw Error(label+'は整数で入力してください。'); return n; }
function date_(d) { if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d))||new Date(d+'T00:00:00Z').toISOString().slice(0,10)!==d)throw Error('日付を確認してください。'); return d; }
function inPeriod_(s,d) { date_(d); if(d<String(s.cfg.期間開始)||d>String(s.cfg.期間終了))throw Error('対象期間内の日付を選んでください。'); }
function active_(r) { return r.状態!=='取消'&&r.状態!=='欠勤'; }
function paidLock_(s,pid,day) { return s.支払.some(p=>p.人ID===pid&&!p.原支払ID&&p.期間開始<=day&&p.期間終了>=day); }
function sameFields_(a,b) { return !!b&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.prototype.hasOwnProperty.call(b,k)&&a[k]===b[k]); }
function unchanged_(old,base) { if(!sameFields_(old,base)) throw Error('別の担当者が更新しました。更新ボタンを押し、内容を確認して保存してください。'); }
function put_(s,table,row,base) {
  const key=headers_(table)[0], i=s[table].findIndex(r=>r[key]===row[key]);
  if(i>=0) { unchanged_(s[table][i],base); s[table][i]=clean_(table,row); }
  else { if(base)throw Error('記録が見つかりません。'); s[table].push(clean_(table,row)); }
  write_(table,s[table]);
}
function slot_(s,a,actual) {
  const band=record_(s,'勤務帯','勤務帯ID',a.勤務帯ID), day=date_(String(a.日付).slice(0,10));
  let start=day+'T'+band.開始,end=plusDay_(day,yes_(band.翌日終了)?1:0)+'T'+band.終了;
  start=a.予定開始上書き||start; end=a.予定終了上書き||end;
  function breakAt(t) { return t&&t!=='なし' ? (t.includes('T')?t:plusDay_(day,t<band.開始?1:0)+'T'+t) : ''; }
  let bs=breakAt(a.休憩開始上書き||band.休憩開始),be=breakAt(a.休憩終了上書き||band.休憩終了);
  if(actual) { start=a.実開始;end=a.実終了;bs=a.実休憩開始;be=a.実休憩終了; }
  const st=minute_(start),en=minute_(end),b1=bs?minute_(bs):null,b2=be?minute_(be):null;
  const bs2=actual?a.実休憩2開始:breakAt(a.休憩2開始上書き||band.休憩2開始),be2=actual?a.実休憩2終了:breakAt(a.休憩2終了上書き||band.休憩2終了);
  const cuts=[];[[bs,be],[bs2,be2]].forEach(([x,y])=>{if(!x&&!y)return;if(!x||!y)throw Error('休憩の開始・終了を両方入力してください。');const a=minute_(x),b=minute_(y);if(a<=st||b>=en||b<=a)throw Error('休憩を勤務の途中に入力してください。');cuts.push([a,b]);});cuts.sort((a,b)=>a[0]-b[0]);
  if(cuts.length===2&&cuts[0][1]>cuts[1][0])throw Error('休憩の時間が重なっています。');
  if(!actual&&day_(st)!==day&&!(yes_(band.翌日終了)&&day_(st)===plusDay_(day,1)))throw Error('開始日時は枠の日付または夜勤の翌日にしてください。');
  if(en<=st||en-st>1440)throw Error('勤務の開始・終了を確認してください（24時間以内）。');
  if((bs&&!be)||(!bs&&be)||(bs&&(b1<=st||b2>=en||b2<=b1)))throw Error('休憩は勤務の途中に開始・終了を入力してください。');
  const rest=cuts.reduce((n,r)=>n+r[1]-r[0],0);
  return {start:st,end:en,bs:b1,be:b2,bs2:bs2?minute_(bs2):null,be2:be2?minute_(be2):null,breaks:cuts,breakMinutes:rest,minutes:en-st-rest,band};
}
function availability_(s,pid,inf) {
  const rows=s.勤務希望.filter(r=>r.人ID===pid);
  const blocked=rows.find(r=>r.可否!=='可'&&minute_(r.開始日時)<inf.end&&minute_(r.終了日時)>inf.start);
  if(blocked)return blocked.可否==='不可'?'勤務できない時間です':'本人への相談が必要です';
  const allowed=rows.filter(r=>r.可否==='可').map(r=>[minute_(r.開始日時),minute_(r.終了日時)]).sort((a,b)=>a[0]-b[0]);
  let end=inf.start; allowed.forEach(r=>{if(r[0]<=end&&r[1]>end)end=r[1];});
  return end>=inf.end?'':'この時間の勤務希望が未確認です';
}
function issues_(s,pid,list,checkAvailability) {
  const errors=[],warnings=[],p=record_(s,'人','人ID',pid), c=s.cfg;
  const add=(where,text)=>{if(!where.includes(text))where.push(text);};
  if(!p.生年月日||!['高校生','大学生','社会人'].includes(p.区分))add(errors,'生年月日・区分を入力してください');
  if(p.状態!=='採用')add(errors,'採用者だけを配置できます');
  if(!yes_(p.本人承諾))add(errors,'本人の承諾を記録してください');
  const entries=[]; list.filter(active_).forEach(a=>{try{entries.push({a,i:slot_(s,a,false)});}catch(e){add(errors,e.message);}});
  entries.sort((a,b)=>a.i.start-b.i.start);
  const workDays=new Set(),days={},weeks={},months={}; let prev=null;
  entries.forEach(({a,i})=>{
    const on=day_(i.start), age=age_(p.生年月日,on), last=prev;
    if(age!=null && on<=schoolEnd_(p.生年月日))add(errors,'義務教育終了前の方は配置できません');
    if(last&&i.start<last.i.end)add(errors,'他の勤務と時間が重なっています');
    if(last&&i.start-last.i.end>=0&&i.start-last.i.end<Number(c.休息注意分||480))add(warnings,'前の勤務からの休息が短くなっています');
    const labor=last&&i.start-last.i.end<Number(c.継続勤務間隔分||120)?last.labor:on;
    const d=days[labor]||(days[labor]={minutes:0,worked:0,rest:0}); d.rest+=i.breakMinutes;d.worked+=i.minutes;
    if(last&&last.labor===labor&&i.start>last.i.end)d.rest+=i.start-last.i.end;
    const wk=monday_(labor); if(checkAvailability){const av=availability_(s,pid,i);if(av)add(errors,av);}
    for(let t=i.start;t<i.end;t++){
      if(i.breaks.some(r=>t>=r[0]&&t<r[1]))continue;
      const cal=day_(t),cl=t-minute_(cal+'T00:00'),holiday=holiday_(s,pid,cal),month=cal.slice(0,7);
      workDays.add(cal);
      const rate=i.band.時給種類==='研修'?Number(c.研修時給):Number(p.本番時給),min=minimum_(s,cal);
      if(!rate||!min||rate<min)add(errors,'適用日の最低賃金・時給を確認してください');
      if((age==null||age<18)&&(cl<300||cl>=1320))add(errors,'18歳未満・年齢未確認の深夜勤務はできません');
      const daily=!holiday&&d.minutes>=480, weekly=!holiday&&!daily&&(weeks[wk]||0)>=2400,ot=daily||weekly;
      if(!holiday){d.minutes++;if(!daily)weeks[wk]=(weeks[wk]||0)+1;}
      if(holiday&&(age==null||age<18))add(errors,'18歳未満の休日勤務はできません');
      if(holiday&&!yes_(c['36協定']))add(errors,'36協定未確認の法定休日勤務はできません');
      if(ot){months[month]=(months[month]||0)+1;if(age==null||age<18)add(errors,'18歳未満の時間外勤務はできません');else if(!yes_(c['36協定']))add(errors,'36協定未確認の1日8時間・週40時間超です');else add(warnings,'時間外割増の対象です');}
    }
    prev={i,labor};
  });
  Object.keys(days).forEach(d=>{const x=days[d];if(x.worked>480&&x.rest<60||x.worked>360&&x.rest<45)add(errors,d+'の休憩時間が不足しています');});
  const holidayWeeks={};workDays.forEach(d=>{const w=monday_(d);holidayWeeks[w]=(holidayWeeks[w]||0)+1;});
  Object.keys(holidayWeeks).forEach(w=>{if(holidayWeeks[w]===7)add(errors,w+'からの週に休日がありません');});
  Object.keys(months).forEach(m=>{if(months[m]>Number(c.月時間外上限分||2700))add(errors,m+'の36協定上限を超えます');});
  return {errors,warnings};
}
function demand_(s,a) { return s.必要人数.find(d=>d.日付===a.日付&&d.勤務帯ID===a.勤務帯ID&&d.売場ID===a.売場ID); }
function candidates_(s,d) {
  return s.人.filter(p=>p.状態==='採用').map(p=>{
    const a={日付:d.日付,勤務帯ID:d.勤務帯ID,売場ID:d.売場ID,人ID:p.人ID,状態:'予定'};
    const check=issues_(s,p.人ID,s.配置.filter(r=>r.人ID===p.人ID).concat(a),false);
    const av=availability_(s,p.人ID,slot_(s,a,false));if(av)check.errors.push(av);
    if(paidLock_(s,p.人ID,d.日付))check.errors.push('精算を確定した期間です');
    return {id:p.人ID,name:p.氏名,category:p.区分,band:p.基本勤務帯ID,...check};
  }).sort((a,b)=>a.errors.length-b.errors.length||a.name.localeCompare(b.name,'ja'));
}
function audit_(s) {
  const out=[];
  Object.keys(COLS).forEach(t=>{const key=headers_(t)[0],seen=new Set();s[t].forEach((r,i)=>{if(seen.has(r[key]))out.push({level:'要修正',person:t+' '+(i+2)+'行',text:'IDが重複しています'});seen.add(r[key]);});});
  ['配置','勤務希望','必要人数'].forEach(t=>s[t].forEach((r,i)=>{try{
    if(r.人ID)record_(s,'人','人ID',r.人ID);
    if(t==='勤務希望'){if(minute_(r.終了日時)<=minute_(r.開始日時))throw Error('希望の開始・終了を確認してください');}
    else{inPeriod_(s,String(r.日付));record_(s,'売場','売場ID',r.売場ID);record_(s,'勤務帯','勤務帯ID',r.勤務帯ID);if(t==='必要人数')integer_(r.人数,'必要人数',0,100);else if(!r.人ID)throw Error('人IDが未登録です');}
  }catch(e){out.push({level:'要修正',person:t+' '+(i+2)+'行',text:e.message});}}));
  s.人.filter(p=>s.配置.some(a=>a.人ID===p.人ID&&active_(a))).forEach(p=>{try{const x=issues_(s,p.人ID,s.配置.filter(a=>a.人ID===p.人ID),false);x.errors.forEach(m=>out.push({level:'要修正',person:p.氏名,text:m}));x.warnings.forEach(m=>out.push({level:'注意',person:p.氏名,text:m}));}catch(e){out.push({level:'要修正',person:p.氏名,text:e.message});}});
  s.必要人数.forEach(d=>{const a=s.配置.filter(x=>active_(x)&&x.日付===d.日付&&x.売場ID===d.売場ID&&x.勤務帯ID===d.勤務帯ID);if(a.length!==Number(d.人数))out.push({level:'不足・過員',person:d.日付,text:name_(s,'売場','売場ID',d.売場ID,'売場名')+' '+name_(s,'勤務帯','勤務帯ID',d.勤務帯ID,'名前')+' '+a.length+'/'+d.人数+'人'});const uni=a.filter(x=>['大学生','社会人'].includes((s.人.find(p=>p.人ID===x.人ID)||{}).区分)).length;if(uni<Number(d.大学生以上))out.push({level:'注意',person:d.日付,text:'大学生以上の人数が不足しています'});});
  s.配置.filter(active_).forEach(a=>{if(!demand_(s,a))out.push({level:'要修正',person:a.日付,text:'必要人数の登録がない配置があります'});});
  const actual={...s,配置:s.配置.filter(a=>a.状態==='出勤').map(a=>({...a,予定開始上書き:a.実開始,予定終了上書き:a.実終了,休憩開始上書き:a.実休憩開始||'なし',休憩終了上書き:a.実休憩終了||'なし',休憩2開始上書き:a.実休憩2開始||'なし',休憩2終了上書き:a.実休憩2終了||'なし'}))};
  s.人.filter(p=>actual.配置.some(a=>a.人ID===p.人ID)).forEach(p=>{try{const x=issues_(actual,p.人ID,actual.配置.filter(a=>a.人ID===p.人ID),false);x.errors.concat(x.warnings).forEach(m=>out.push({level:'実績確認',person:p.氏名,text:m}));}catch(e){out.push({level:'実績確認',person:p.氏名,text:e.message});}});
  return out;
}
function name_(s,t,k,id,label){return (s[t].find(r=>r[k]===id)||{})[label]||id;}
function view_(s,user) {
  const out={...s,user,issues:audit_(s),now:clock_(s),sheetUrl:db_().getUrl(),reception:{connected:!!s.cfg.応募フォームID,mode:s.cfg.応募受信方式||'',last:s.cfg.応募最終確認||''}};
  delete out.cfg.応募フォームID;
  out.設定=out.設定.filter(r=>!r.項目.includes('フォームID')&&!r.項目.includes('移行元'));
  return out;
}
function api(action,payload) {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{
    const s=state_(),u=auth_(s,false),p=payload||{};
    if(JSON.stringify(p).length>100000)throw Error('一度の入力が多すぎます。');
    if(action==='load')return view_(s,u);
    if(action==='mailCompose')return mailCompose_(s,p);
    if(action==='candidates')return candidates_(s,record_(s,'必要人数','枠ID',p.id));
    if(action==='person')savePerson_(s,p,u);
    else if(action==='mailTemplate'){auth_(s,true);saveMailTemplate_(s,p);}
    else if(action==='mailSettings'){auth_(s,true);const keys=['寺院名','電話','所在地','面接場所','面接持参品','募集年'].map(k=>'メール:'+k);keys.forEach(k=>{const old=s.設定.find(r=>r.項目===k);if(old)unchanged_(old,(p.base||[]).find(r=>r.項目===k));});keys.forEach(k=>{const row=s.設定.find(r=>r.項目===k);if(row)row.値=String(p.values[k]||'');else s.設定.push({項目:k,値:String(p.values[k]||''),説明:'メールの共通情報'});});write_('設定',s.設定);}
    else if(action==='mailRecord')saveMailRecord_(s,p,u);
    else if(action==='wish')saveWish_(s,p);
    else if(action==='demand')saveDemand_(s,p);
    else if(action==='assign')assign_(s,p,u);
    else if(action==='placement')savePlacement_(s,p,u);
    else if(action==='splitPlacement')splitPlacement_(s,p,u);
    else if(action==='attendance')saveAttendance_(s,p,u);
    else if(action==='allPresent')allPresent_(s,p,u);
    else if(action==='import')importResponses_(s,p,u);
    else if(action==='pollForm'){auth_(s,true);pullResponses_(s);return view_(state_(),u);}
    else if(action==='payPreview'){auth_(s,true);return calculate_(s,p.personId,p.date,p.other||0);}
    else if(action==='paySave'){auth_(s,true);savePay_(s,p,u);}
    else if(action==='payReceived'){auth_(s,true);receivePay_(s,p,u);}
    else if(action==='correction'){auth_(s,true);correctPay_(s,p,u);}
    else if(action==='setting'){auth_(s,true);saveSetting_(s,p);}
    else if(action==='migrationPreview'){auth_(s,true);const m=migratePreview_(s);return {sources:m.sources,count:m.people.length,excluded:m.excluded};}
    else if(action==='migrationImport'){auth_(s,true);migrateApply_(s);return view_(state_(),u);}
    else if(action==='templateImport'){auth_(s,true);migrateTemplates_(s);return view_(state_(),u);}
    else if(action==='nextYear'){auth_(s,true);return {url:nextYear_(s,p.start,p.end)};}
    else if(!['person','wish','demand','assign','placement','attendance','allPresent','import'].includes(action))throw Error('操作を確認してください。');
    SpreadsheetApp.flush(); return view_(state_(),u);
  }finally{lock.releaseLock();}
}
function savePerson_(s,p,u) {
  const r=clean_('人',p.row),old=s.人.find(x=>x.人ID===r.人ID);
  r.人ID=r.人ID||id_();r.氏名=String(r.氏名||'').trim();if(!r.氏名)throw Error('氏名を入力してください。');
  if(!PERSON_STATES.includes(r.状態))throw Error('状態を選んでください。');
  if(r.生年月日){date_(r.生年月日);if(r.生年月日>clock_(s).slice(0,10))throw Error('生年月日を確認してください。');}
  ['本番時給','交通費','交通費課税額'].forEach(k=>{if(r[k]!=='')r[k]=integer_(r[k],k,0,100000);});
  if(Number(r.交通費課税額)>Number(r.交通費))throw Error('交通費課税額を確認してください。');
  if(old && s.支払.some(x=>x.人ID===r.人ID))['本番時給','交通費','交通費課税額','税区分','丙欄適用確認'].forEach(k=>{if(String(old[k])!==String(r[k]))throw Error('精算後の金額変更は精算画面の差額訂正で記録してください。');});
  if(old && s.配置.some(a=>a.人ID===r.人ID&&active_(a)) && r.状態!=='採用')throw Error('勤務予定を取り消してから採用状況を変更してください。');
  if(yes_(r.本人承諾)&&!r.承諾日時)r.承諾日時=clock_(s);
  const next={...s,人:s.人.filter(x=>x.人ID!==r.人ID).concat(r)};
  if(s.配置.some(a=>a.人ID===r.人ID&&active_(a))){const check=issues_(next,r.人ID,s.配置.filter(a=>a.人ID===r.人ID),false);if(check.errors.length)throw Error(check.errors.join('／'));}
  ['評価接遇','評価理解','評価意欲'].forEach(k=>{if(r[k]!==''&&!['未評価','1','2','3','4','5'].includes(String(r[k])))throw Error('評価を選択してください。');});
  if(r.面接完了日)date_(r.面接完了日);if(r.採否伝達日)date_(r.採否伝達日);if(r.応募連絡日)date_(r.応募連絡日);
  const options={応募連絡状況:['未確認','返信が必要','連絡済み','追加連絡不要'],応募連絡方法:['電話','メール','LINE','対面','その他'],採否伝達方法:['未連絡','その場で口頭','電話','メール','その他']};
  Object.keys(options).forEach(k=>{if(r[k]&&!options[k].includes(r[k]))throw Error('連絡方法・状況を選んでください。');});
  if(old&&old.状態!==r.状態&&r.採否伝達方法===old.採否伝達方法&&r.採否伝達日===old.採否伝達日){r.採否伝達方法='未連絡';r.採否伝達日='';r.採否伝達結果='';}
  if(r.採否伝達方法&&r.採否伝達方法!=='未連絡'&&['採用','不採用'].includes(r.状態)){r.採否伝達日=r.採否伝達日||clock_(s).slice(0,10);r.採否伝達結果=r.状態;}
  if(r.応募連絡状況==='連絡済み'&&(!old||r.応募連絡状況!==old.応募連絡状況||r.応募連絡方法!==old.応募連絡方法||r.応募連絡日!==old.応募連絡日)){r.応募連絡日=r.応募連絡日||clock_(s).slice(0,10);r.応募連絡対象日時=r.面接日時;}
  if(r.応募連絡状況==='追加連絡不要'&&(!old||r.応募連絡状況!==old.応募連絡状況))r.応募連絡対象日時=r.面接日時;
  put_(s,'人',r,p.base);
}
function saveWish_(s,p) {
  const r=clean_('勤務希望',p.row);r.希望ID=r.希望ID||id_();record_(s,'人','人ID',r.人ID);
  inPeriod_(s,r.開始日時.slice(0,10));const a=minute_(r.開始日時),b=minute_(r.終了日時);
  if(b<=a||b-a>1440||!['可','不可','要相談'].includes(r.可否))throw Error('希望の開始・終了・可否を確認してください。');
  if(s.勤務希望.some(x=>x.希望ID!==r.希望ID&&x.人ID===r.人ID&&minute_(x.開始日時)<b&&minute_(x.終了日時)>a))throw Error('既存の勤務希望と重なっています。既存の行を直してください。');
  put_(s,'勤務希望',r,p.base);
}
function saveDemand_(s,p) {
  const r=clean_('必要人数',p.row);r.枠ID=r.枠ID||id_();inPeriod_(s,r.日付);
  record_(s,'勤務帯','勤務帯ID',r.勤務帯ID);record_(s,'売場','売場ID',r.売場ID);
  r.人数=integer_(r.人数,'必要人数',0,100);r.大学生以上=integer_(r.大学生以上||0,'大学生以上',0,r.人数);
  if(s.必要人数.some(d=>d.枠ID!==r.枠ID&&d.日付===r.日付&&d.勤務帯ID===r.勤務帯ID&&d.売場ID===r.売場ID))throw Error('同じ枠があります。既存の必要人数を直してください。');
  if(!['運用','下書き'].includes(r.確認))throw Error('枠の確認は「運用」か「下書き」を選んでください。');
  const old=s.必要人数.find(x=>x.枠ID===r.枠ID);
  if(old&&s.配置.some(a=>active_(a)&&demand_(s,a)===old)){
    if(old.日付!==r.日付||old.勤務帯ID!==r.勤務帯ID||old.売場ID!==r.売場ID)throw Error('配置済みの枠の日付・売場・勤務帯は変更できません。配置を外してから直してください。');
    if(Number(old.人数)!==r.人数&&!p.confirm)throw Error('配置済みの必要人数を変更します。確認してもう一度保存してください。');
  }
  put_(s,'必要人数',r,p.base);
}
function assign_(s,p,u) {
  const d=record_(s,'必要人数','枠ID',p.id), ids=p.people||[];
  if(d.確認==='下書き')throw Error('この枠はひな形の下書きです。人数変更から確認を「運用」にしてください。');
  if(!Array.isArray(ids)||!ids.length||ids.length>100||new Set(ids).size!==ids.length)throw Error('候補を選んでください。');
  const used=s.配置.filter(a=>active_(a)&&a.日付===d.日付&&a.勤務帯ID===d.勤務帯ID&&a.売場ID===d.売場ID).length;
  if(used+ids.length>Number(d.人数))throw Error('この枠は満員です。他の担当者の保存を反映して更新してください。');
  if(!String(p.method||'').trim())throw Error('勤務の了解方法を入力してください。');
  ids.forEach(pid=>{
    const person=record_(s,'人','人ID',pid);
    if(paidLock_(s,pid,d.日付))throw Error('精算を確定した期間です。');
    const a=clean_('配置',{配置ID:id_(),日付:d.日付,人ID:pid,勤務帯ID:d.勤務帯ID,売場ID:d.売場ID,了解方法:p.method,了解日時:clock_(s),了解担当:u.email,状態:'予定'});
    const check=issues_(s,pid,s.配置.filter(x=>x.人ID===pid).concat(a),false),av=availability_(s,pid,slot_(s,a,false));
    if(av)check.errors.push(av);if(check.errors.length)throw Error(person.氏名+'：'+check.errors.join('／'));
    s.配置.push(a);
  });
  write_('配置',s.配置);
}
function savePlacement_(s,p,u) {
  const old=record_(s,'配置','配置ID',p.row.配置ID);unchanged_(old,p.base);
  if(paidLock_(s,old.人ID,old.日付)||old.状態==='出勤')throw Error('実績・精算済みの予定は変更できません。');
  const r=clean_('配置',{...old,...p.row});
  if(r.人ID!==old.人ID||r.日付!==old.日付)throw Error('人や日付を替える場合は取り消して再配置してください。');
  if(!['予定','取消'].includes(r.状態))throw Error('予定・取消を選んでください。');
  if(r.状態==='予定'){
    const d=demand_(s,r);if(!d)throw Error('移動先の必要人数を登録してください。');if(d.確認==='下書き')throw Error('移動先は下書きです。人数変更から確認を「運用」にしてください。');
    const used=s.配置.filter(a=>a.配置ID!==r.配置ID&&active_(a)&&a.日付===r.日付&&a.勤務帯ID===r.勤務帯ID&&a.売場ID===r.売場ID).length;
    if(used>=Number(d.人数))throw Error('移動先は満員です。');
    const check=issues_(s,r.人ID,s.配置.filter(a=>a.人ID===r.人ID&&a.配置ID!==r.配置ID).concat(r),false);
    const av=availability_(s,r.人ID,slot_(s,r,false));if(av)check.errors.push(av);if(check.errors.length)throw Error(check.errors.join('／'));
  }
  ['実開始','実終了','実休憩開始','実休憩終了','実休憩2開始','実休憩2終了','実休憩分','社会保険料','確認者'].forEach(k=>r[k]=old[k]);
  r.了解方法=String(p.row.了解方法||old.了解方法);r.了解日時=clock_(s);r.了解担当=u.email;
  put_(s,'配置',r,p.base);
}
function splitPlacement_(s,p,u) {
  const old=record_(s,'配置','配置ID',p.id);unchanged_(old,p.base);
  if(old.状態!=='予定'||paidLock_(s,old.人ID,old.日付))throw Error('予定の配置だけを分割できます。');
  const i=slot_(s,old,false),at=minute_(p.at);
  if(at<=i.start||at>=i.end||i.breaks.some(b=>at>b[0]&&at<b[1]))throw Error('勤務の途中で、休憩の途中ではない時刻を選んでください。');
  if(p.venue===old.売場ID)throw Error('移動先の売場を選んでください。');
  if(!String(p.method||'').trim())throw Error('変更の了解方法を入力してください。');
  function segment(start,end,venue,id){
    const r={...old,配置ID:id,売場ID:venue,予定開始上書き:iso_(start),予定終了上書き:iso_(end),了解方法:p.method,了解日時:clock_(s),了解担当:u.email};
    const cuts=i.breaks.filter(b=>b[0]>=start&&b[1]<=end);
    if(cuts.some(b=>b[0]===start||b[1]===end))throw Error('休憩の境界ではなく、実際に売場を移動する時刻で分けてください。');
    ['','2'].forEach((n,j)=>{r['休憩'+n+'開始上書き']=cuts[j]?iso_(cuts[j][0]):'なし';r['休憩'+n+'終了上書き']=cuts[j]?iso_(cuts[j][1]):'なし';});
    return clean_('配置',r);
  }
  const first=segment(i.start,at,old.売場ID,old.配置ID),second=segment(at,i.end,p.venue,id_()),d=demand_(s,second);
  if(!d||d.確認!=='運用')throw Error('移動先に確認済みの必要人数を登録してください。');
  const used=s.配置.filter(a=>active_(a)&&a.日付===d.日付&&a.勤務帯ID===d.勤務帯ID&&a.売場ID===d.売場ID).length;
  if(used>=Number(d.人数))throw Error('移動先は満員です。');
  const others=s.配置.filter(a=>a.配置ID!==old.配置ID),check=issues_(s,old.人ID,others.filter(a=>a.人ID===old.人ID).concat(first,second),true);
  if(check.errors.length)throw Error(check.errors.join('／'));
  s.配置=s.配置.map(a=>a.配置ID===old.配置ID?first:a).concat(second);write_('配置',s.配置);
}
function actualRow_(s,old,r,u) {
  if(paidLock_(s,old.人ID,old.日付))throw Error('精算確定済みの勤怠です。差額訂正を使ってください。');
  const out={...old};['状態','実開始','実終了','実休憩開始','実休憩終了','実休憩2開始','実休憩2終了','社会保険料','メモ'].forEach(k=>out[k]=r[k]==null?old[k]:r[k]);
  if(!['出勤','欠勤','予定'].includes(out.状態))throw Error('実績の状態を確認してください。');
  if(out.状態==='出勤'){
    const inf=slot_(s,out,true);if(inf.end>minute_(clock_(s)))throw Error('勤務終了後に実績を確定してください。');
    if(Math.abs(inf.start-minute_(old.日付+'T00:00'))>2880)throw Error('実績の日付を確認してください。');
    s.配置.filter(a=>a.配置ID!==old.配置ID&&a.人ID===old.人ID&&a.状態==='出勤').forEach(a=>{const b=slot_(s,a,true);if(inf.start<b.end&&inf.end>b.start)throw Error('実績の時間が重複しています。');});
    out.実休憩分=inf.breakMinutes;out.社会保険料=integer_(out.社会保険料||0,'社会保険料',0,1000000);
  }else ['実開始','実終了','実休憩開始','実休憩終了','実休憩2開始','実休憩2終了','実休憩分','社会保険料'].forEach(k=>out[k]='');
  out.確認者=u.email;return clean_('配置',out);
}
function saveAttendance_(s,p,u) {const old=record_(s,'配置','配置ID',p.row.配置ID);unchanged_(old,p.base);put_(s,'配置',actualRow_(s,old,p.row,u),p.base);}
function allPresent_(s,p,u) {
  inPeriod_(s,p.day);let count=0;
  s.配置=s.配置.map(a=>{if(a.日付!==p.day||a.状態!=='予定')return a;const inf=slot_(s,a,false);if(inf.end>minute_(clock_(s)))return a;count++;return actualRow_(s,a,{状態:'出勤',実開始:iso_(inf.start),実終了:iso_(inf.end),実休憩開始:inf.bs==null?'':iso_(inf.bs),実休憩終了:inf.be==null?'':iso_(inf.be),実休憩2開始:inf.bs2==null?'':iso_(inf.bs2),実休憩2終了:inf.be2==null?'':iso_(inf.be2),社会保険料:0},u);});
  if(!count)throw Error('終了済みで実績未入力の勤務はありません。');write_('配置',s.配置);
}
function saveSetting_(s,p) {
  if(!['設定','売場','勤務帯'].includes(p.table))throw Error('設定の表を選んでください。');
  const r=clean_(p.table,p.row),key=headers_(p.table)[0];
  const label=p.table==='設定'?'項目':p.table==='売場'?'売場名':'名前';if(!String(r[label]||'').trim())throw Error(label+'を入力してください。');
  if(!r[key])r[key]=id_();
  if(p.table==='設定'&&['管理者','台帳ID'].includes(r.項目))throw Error('この項目は画面では変更できません。');
  if(p.table==='勤務帯'){
    const a={日付:String(s.cfg.期間開始),勤務帯ID:r.勤務帯ID};
    slot_({...s,勤務帯:s.勤務帯.filter(x=>x.勤務帯ID!==r.勤務帯ID).concat(r)},a,false);
    if(s.配置.some(a=>a.勤務帯ID===r.勤務帯ID&&a.状態!=='取消'))throw Error('使用中の勤務帯は書き換えず、別の勤務帯を追加してください。');
  }
  if(p.table==='設定'&&s.支払.length&&/税|時給|賃金|継続|休日|割増/.test(r.項目))throw Error('精算済みです。計算条件の変更は次年度の台帳で行ってください。');
  put_(s,p.table,r,p.base);
}

function mailKeys_(text){return [...new Set((String(text).match(/\{\{[^{}\n]+\}\}/g)||[]).map(x=>x.slice(2,-2)))];}
function mailAllowed_(t,p){return yes_(t.有効)&&(!t.対象||String(t.対象).split('／').includes(p.状態));}
function scheduleText_(s,pid){
  return s.配置.filter(a=>a.人ID===pid&&!['取消','欠勤'].includes(a.状態)).sort((a,b)=>a.日付.localeCompare(b.日付)||slot_(s,a,false).start-slot_(s,b,false).start).map(a=>{
    const t=slot_(s,a,false),fmt=n=>iso_(n).replace('T',' '),d=s.必要人数.find(d=>d.日付===a.日付&&d.勤務帯ID===a.勤務帯ID&&d.売場ID===a.売場ID),meal=k=>yes_(d&&d[k+'上書き']!==''?d[k+'上書き']:t.band[k]);
    return fmt(t.start)+'〜'+fmt(t.end)+' ／ '+name_(s,'売場','売場ID',a.売場ID,'売場名')+'\n休憩：'+(t.breaks.length?t.breaks.map(b=>fmt(b[0])+'〜'+fmt(b[1])).join('、'):'なし')+' ／ 昼食：'+(meal('昼食')?'提供':'提供なし')+' ／ 夕食：'+(meal('夕食')?'提供':'提供なし');
  }).join('\n\n');
}
function mailValues_(s,p){const c=s.cfg;return {氏名:p.氏名,募集年:c['メール:募集年']||String(c.期間終了).slice(0,4),面接日時:p.面接日時?p.面接日時.replace('T',' '):'',面接持参品:c['メール:面接持参品']||'本人確認書類',寺院名:c['メール:寺院名']||c.拠点名,電話:c['メール:電話']||'',所在地:c['メール:所在地']||'',面接場所:c['メール:面接場所']||'',勤務予定:scheduleText_(s,p.人ID),本番時給:p.本番時給!==''?String(p.本番時給)+'円':'',交通費:p.交通費!==''?String(p.交通費)+'円／日':''};}
function mailCompose_(s,p){const person=record_(s,'人','人ID',p.personId),t=record_(s,'メール文面','テンプレートID',p.templateId);if(!mailAllowed_(t,person))throw Error('現在の採用状況に合う文面を選んでください。');const values=mailValues_(s,person),replace=x=>String(x).replace(/\{\{([^{}\n]+)\}\}/g,(all,k)=>values[k]?String(values[k]):all);return {draftId:id_(),person,template:t,to:person.メール,subject:replace(t.件名),body:replace(t.本文),values};}
function saveMailTemplate_(s,p){
  const r=clean_('メール文面',p.row);r.テンプレートID=r.テンプレートID||id_();
  if(!String(r.名称).trim()||!String(r.件名).trim()||!String(r.本文).trim())throw Error('名称・件名・本文を入力してください。');
  if(r.件名.length>180||/[\r\n]/.test(r.件名)||r.本文.length>10000)throw Error('件名は改行なし180文字以内、本文は10000文字以内です。');
  if(!['応募連絡','採用連絡','不採用連絡','その他'].includes(r.記録区分))throw Error('連絡記録の種類を選んでください。');
  if(r.対象&&String(r.対象).split('／').some(x=>!PERSON_STATES.includes(x)))throw Error('対象の採用状況を確認してください。');
  if(r.記録区分==='採用連絡'&&r.対象!=='採用'||r.記録区分==='不採用連絡'&&r.対象!=='不採用')throw Error('採否の文面は、その採否だけを対象にしてください。');
  r.並び順=integer_(r.並び順||0,'並び順',0,999);put_(s,'メール文面',r,p.base);
}
function saveMailRecord_(s,p,u){
  const person=record_(s,'人','人ID',p.personId),t=record_(s,'メール文面','テンプレートID',p.templateId);
  if(!p.id||p.confirmed!==true)throw Error('実際に送信したことを確認してください。');
  if(s.連絡記録.some(r=>r.連絡ID===p.id))return;
  unchanged_(person,p.base);unchanged_(t,p.templateBase);
  if(!mailAllowed_(t,person))throw Error('現在の採用状況に合う文面で記録してください。');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.sentAt)||p.sentAt>clock_(s))throw Error('実際に送信した日時を入力してください。');minute_(p.sentAt);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.to)||p.to.toLowerCase()!==String(person.メール).trim().toLowerCase())throw Error('登録されている本人のメールアドレスを確認してください。');
  if(!String(p.subject||'').trim()||!String(p.body||'').trim()||p.subject.length>180||/[\r\n]/.test(p.subject)||p.body.length>10000)throw Error('件名・本文を確認してください。');
  if(mailKeys_(p.subject+'\n'+p.body).length)throw Error('差し替え項目が残っています。入力してから記録してください。');
  if(['interview','reminder'].includes(t.テンプレートID)&&!person.面接日時)throw Error('面接日時を先に記録してください。');
  const r=clean_('連絡記録',{連絡ID:p.id,人ID:person.人ID,日時:p.sentAt,方法:'メール',用途ID:t.テンプレートID,用途:t.名称,宛先:p.to,件名:p.subject,本文:p.body,面接日時:person.面接日時,採否:person.状態,記録者:u.email,記録日時:clock_(s)});
  s.連絡記録.push(r);write_('連絡記録',s.連絡記録);
  const row={...person};
  if(t.記録区分==='応募連絡'&&p.sentAt.slice(0,10)>=(row.応募連絡日||''))Object.assign(row,{応募連絡状況:'連絡済み',応募連絡方法:'メール',応募連絡日:p.sentAt.slice(0,10),応募連絡対象日時:['interview','reminder'].includes(t.テンプレートID)?person.面接日時:''});
  if(['採用連絡','不採用連絡'].includes(t.記録区分)&&p.sentAt.slice(0,10)>=(row.採否伝達日||''))Object.assign(row,{採否伝達方法:'メール',採否伝達日:p.sentAt.slice(0,10),採否伝達結果:person.状態});
  // The delivery record is the source of truth if the summary update fails.
  try{put_(s,'人',row,person);}catch(e){throw Error('送信した文面は連絡記録に保存済みです。連絡状況の更新に失敗しました。更新後「連絡を記録」で確認してください。');}
}
