/* 分単位で集計。金額は整数の分×円×10000を使い、日・内訳ごとに切り上げる。 */
function minute_(s) {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(s)))throw Error('日付と時刻を入力してください。');
  const n=Date.parse(s+':00+09:00')/60000;
  if(!Number.isFinite(n)||iso_(n)!==s)throw Error('日時を確認してください。');return n;
}
function iso_(n){return new Date((n+540)*60000).toISOString().slice(0,16);}
function day_(n){return iso_(n).slice(0,10);}
function plusDay_(d,n){return new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
function monday_(d){return plusDay_(d,-((new Date(d+'T00:00:00Z').getUTCDay()+6)%7));}
function age_(birth,d){if(!birth)return null;birth=String(birth).slice(0,10);date_(birth);return Number(d.slice(0,4))-Number(birth.slice(0,4))-(d.slice(5)<birth.slice(5)?1:0);}
function schoolEnd_(birth){const d=plusDay_(String(Number(birth.slice(0,4))+15)+birth.slice(4),-1);return String(Number(d.slice(0,4))+(d.slice(5)>'03-31'?1:0))+'-03-31';}
function minimum_(s,d){const rows=s.設定.filter(r=>r.項目.startsWith('最低賃金:')&&r.項目.slice(5)<=d).sort((a,b)=>b.項目.localeCompare(a.項目));return rows.length?Number(rows[0].値):0;}
function holiday_(s,pid,d){return String(s.cfg.法定休日||'').split(/[\s,、]+/).includes(d)||yes_(s.cfg['法定休日:'+pid+':'+d]);}
function ceilYen_(units){return Math.ceil(units/600000);}
function cash_(n){n=integer_(n,'差引支給額',0,100000000);const out={};[10000,5000,1000,500,100,50,10,5,1].forEach(d=>{out[d]=Math.floor(n/d);n%=d;});return out;}
function tax_(s,year,amount){
  const prefix='丙欄:'+year+':',rows=s.設定.filter(r=>r.項目.startsWith(prefix)).map(r=>({from:Number(r.項目.slice(prefix.length)),tax:Number(r.値),rate:Number(r.説明)||0})).sort((a,b)=>a.from-b.from);
  if(!rows.length)throw Error(year+'年の税額表が未登録です。');
  const row=rows.filter(r=>r.from<=amount).pop();return row?row.tax+Math.floor((amount-row.from)*row.rate/100000):0;
}
function classify_(s,pid,actual){
  const p=record_(s,'人','人ID',pid),entries=s.配置.filter(a=>a.人ID===pid&&(actual?a.状態==='出勤':active_(a))).map(a=>({a,i:slot_(s,a,actual)})).sort((a,b)=>a.i.start-b.i.start);
  const days={},laborMinutes={},weeks={},months={};let prev=null;
  entries.forEach(({a,i})=>{
    const begin=day_(i.start),labor=prev&&i.start-prev.end<Number(s.cfg.継続勤務間隔分||120)?prev.labor:begin;
    prev={end:i.end,labor};const wk=monday_(labor),d=days[a.日付]||(days[a.日付]={date:a.日付,labor,minutes:0,nightMinutes:0,otMinutes:0,holidayMinutes:0,basic:0,night:0,overtime:0,holiday:0,transport:0,transportTaxable:0,social:0});
    const rate=i.band.時給種類==='研修'?Number(s.cfg.研修時給):Number(p.本番時給);
    if(!Number.isFinite(rate)||rate<=0)throw Error('時給を確認してください。');
    for(let t=i.start;t<i.end;t++){
      if(i.breaks.some(r=>t>=r[0]&&t<r[1]))continue;
      const cal=day_(t),cl=t-minute_(cal+'T00:00'),night=cl<300||cl>=1320,holiday=holiday_(s,pid,cal),month=cal.slice(0,7);
      const daily=!holiday&&(laborMinutes[labor]||0)>=480,weekly=!holiday&&!daily&&(weeks[wk]||0)>=2400,ot=daily||weekly;
      if(!holiday){laborMinutes[labor]=(laborMinutes[labor]||0)+1;if(!daily)weeks[wk]=(weeks[wk]||0)+1;}
      const bp=ot?((months[month]||0)>=3600?5000:2500):0;if(ot)months[month]=(months[month]||0)+1;
      d.minutes++;d.basic+=rate*10000;d.night+=night?rate*2500:0;d.overtime+=rate*bp;d.holiday+=holiday?rate*3500:0;
      if(night)d.nightMinutes++;if(ot)d.otMinutes++;if(holiday)d.holidayMinutes++;
    }
    d.social+=actual?Number(a.社会保険料||0):0;
    if(yes_(i.band.交通費対象)){
      const tr=days[labor]||(days[labor]={date:labor,labor,minutes:0,nightMinutes:0,otMinutes:0,holidayMinutes:0,basic:0,night:0,overtime:0,holiday:0,transport:0,transportTaxable:0,social:0});
      tr.transport=Number(p.交通費||0);tr.transportTaxable=Number(p.交通費課税額||0);
    }
  });
  return Object.values(days).sort((a,b)=>a.date.localeCompare(b.date)).map(d=>{['basic','night','overtime','holiday'].forEach(k=>d[k]=ceilYen_(d[k]));d.taxable=Math.max(0,d.basic+d.night+d.overtime+d.holiday+d.transportTaxable-d.social);return d;});
}
function calculate_(s,pid,payDate,other){
  date_(payDate);other=integer_(other||0,'その他控除',0,10000000);
  const p=record_(s,'人','人ID',pid),all=s.配置.filter(a=>a.人ID===pid&&a.状態!=='取消'),unpaid=all.filter(a=>!paidLock_(s,pid,a.日付)),errors=[],warnings=[];
  if(!unpaid.length)throw Error('未精算の勤務がありません。');
  const from=unpaid.map(a=>a.日付).sort()[0],through=unpaid.map(a=>a.日付).sort().pop();
  const finalDate=unpaid.map(a=>a.状態==='欠勤'?a.日付:day_(slot_(s,a,a.状態==='出勤').end)).sort().pop();
  if(unpaid.some(a=>a.状態==='予定'))errors.push('未確認の勤怠があります');
  if(payDate<finalDate)errors.push('夜勤の終了日を含む最終勤務日以降を支払日にしてください');
  if(p.税区分!=='丙欄'||!yes_(p.丙欄適用確認))errors.push('丙欄の適用条件を確認してください');
  if(!['対象外確認済','金額確認済'].includes(p.保険確認))errors.push('保険の対象・控除額を確認してください');
  const days=classify_(s,pid,true).filter(d=>d.date>=from&&d.date<=through);
  const z={basic:0,night:0,overtime:0,holiday:0,transport:0,social:0,other,tax:0,rounding:0,gross:0,net:0,minutes:0,nightMinutes:0,otMinutes:0,holidayMinutes:0};
  days.forEach(d=>{d.tax=tax_(s,Number(payDate.slice(0,4)),d.taxable);['basic','night','overtime','holiday','transport','social','minutes','nightMinutes','otMinutes','holidayMinutes'].forEach(k=>z[k]+=d[k]);z.tax+=d.tax;});
  z.gross=z.basic+z.night+z.overtime+z.holiday+z.transport;z.net=z.gross-z.social-z.other-z.tax;
  if(p.保険確認==='対象外確認済'&&z.social)errors.push('保険対象外の設定と控除額が一致しません');
  if(z.net<0)errors.push('控除が総支給額を超えています');
  if(z.net>=0&&days.length){
    const last=days[days.length-1],target=Math.ceil(z.net/100)*100,year=Number(payDate.slice(0,4));let found=false;
    for(let adjust=0;adjust<=1000;adjust++){const newTax=z.tax-last.tax+tax_(s,year,last.taxable+adjust);if(z.gross+adjust-z.social-z.other-newTax===target){z.rounding=adjust;z.gross+=adjust;z.tax=newTax;z.net=target;found=true;break;}}
    if(!found)errors.push('端数調整を確認してください');
  }
  const actualState={...s,配置:s.配置.map(a=>a.人ID===pid&&a.状態==='出勤'?{...a,予定開始上書き:a.実開始,予定終了上書き:a.実終了,休憩開始上書き:a.実休憩開始||'なし',休憩終了上書き:a.実休憩終了||'なし',休憩2開始上書き:a.実休憩2開始||'なし',休憩2終了上書き:a.実休憩2終了||'なし'}:a)};
  const checks=issues_(actualState,pid,actualState.配置.filter(a=>a.人ID===pid),false);warnings.push(...checks.errors,...checks.warnings);
  unpaid.filter(a=>a.状態==='出勤').forEach(a=>{if(slot_(s,a,true).end>minute_(clock_(s)))errors.push('勤務が終了していません');});
  if(s.cfg.労務条件確認!=='済')errors.push('管理者が労務条件（勤務日の区切り・休日・協定）を確認してください');
  return {personId:pid,name:p.氏名,from,through,payDate,totals:z,days,cash:z.net>=0?cash_(z.net):{},errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function savePay_(s,p,u){
  const c=calculate_(s,p.personId,p.date,p.other||0);if(c.errors.length)throw Error(c.errors.join('／'));
  if(c.warnings.length&&!p.warningsConfirmed)throw Error('勤怠の注意事項を確認してください。');
  if(!sameFields_(c.totals,p.expected))throw Error('計算結果が変わりました。再計算してください。');
  const person=record_(s,'人','人ID',p.personId),t=c.totals;
  const r=clean_('支払',{支払ID:id_(),人ID:p.personId,氏名:person.氏名,性別:person.性別,期間開始:c.from,期間終了:c.through,支払予定日:p.date,通常時間:t.minutes/60,深夜時間:t.nightMinutes/60,時間外時間:t.otMinutes/60,休日時間:t.holidayMinutes/60,基本給:t.basic,深夜割増:t.night,時間外割増:t.overtime,休日割増:t.holiday,交通費:t.transport,総支給:t.gross,社会保険料:t.social,その他控除:t.other,源泉税:t.tax,端数調整:t.rounding,差引支給:t.net,支払済:false});
  cashColumns_(r,c.cash);s.支払.push(r);write_('支払',s.支払);protectPaid_(s);
}
function cashColumns_(r,c){['一万円','五千円','千円','五百円','百円','五十円','十円','五円','一円'].forEach((k,i)=>r[k]=c[[10000,5000,1000,500,100,50,10,5,1][i]]||0);}
function receivePay_(s,p,u){const r=record_(s,'支払','支払ID',p.id);if(yes_(r.支払済))throw Error('支払済みです。');if(!p.received)throw Error('本人の受領を確認してください。');r.支払済=true;r.受領確認=true;r.支払日時=clock_(s);r.手渡し担当=u.email;write_('支払',s.支払);protectPaid_(s);}
function correctPay_(s,p,u){
  const old=record_(s,'支払','支払ID',p.id);if(!yes_(old.支払済)||!String(p.reason||'').trim())throw Error('支払済みの行と訂正理由を確認してください。');
  const gross=integer_(p.gross,'総支給差額',-10000000,10000000),tax=integer_(p.tax,'税差額',-10000000,10000000),deduction=integer_(p.deduction||0,'控除差額',-10000000,10000000),net=gross-tax-deduction;
  if(!net)throw Error('差額が0円です。');if(!p.reviewed)throw Error('根拠と税額を確認してください。');
  const r=clean_('支払',{支払ID:id_(),人ID:old.人ID,氏名:old.氏名,性別:old.性別,期間開始:old.期間開始,期間終了:old.期間終了,支払予定日:clock_(s).slice(0,10),総支給:gross,源泉税:tax,その他控除:deduction,差引支給:net,原支払ID:old.支払ID,訂正理由:p.reason,支払済:false});
  cashColumns_(r,net>0?cash_(net):{});s.支払.push(r);write_('支払',s.支払);
}
