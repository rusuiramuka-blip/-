const load=require('./harness'),mk=require('./state');
const dir=process.argv[2],files=process.argv[3].split(',');const g=load(dir,files);
const band={勤務帯ID:'早番',名前:'早番',開始:'08:00',終了:'16:00',翌日終了:false,休憩開始:'12:00',休憩終了:'13:00',時給種類:'本番',交通費対象:true};
const A=g.clean_('配置',{配置ID:'A1',日付:'2026-12-28',人ID:'P1',勤務帯ID:'早番',売場ID:'V1',状態:'出勤',実開始:'2026-12-28T08:00',実終了:'2026-12-28T16:00',実休憩開始:'2026-12-28T12:00',実休憩終了:'2026-12-28T13:00'});
const s=mk({勤務帯:[band],配置:[A]});
const u={email:'admin@x'};const T=(l,f)=>{try{f();console.log('OK  '+l);}catch(e){console.log('ERR '+l+': '+e.message);}};
const c=g.calculate_(s,'P1','2027-02-10',0);
T('精算確定',()=>g.savePay_(s,{personId:'P1',date:'2027-02-10',other:0,expected:c.totals,expectedDates:c.dates,expectedRates:c.days.map(d=>({date:d.date,rates:d.rates}))},u));
const orig=s.支払[0];console.log('    元明細 差引',orig.差引支給,'端数',orig.端数調整);
T('受領前に差額訂正 → 拒否されるべき',()=>g.correctPay_(s,{id:orig.支払ID,gross:500,tax:0,reason:'r',reviewed:true,requestId:'tokenAAAA1'},u));
T('受領',()=>g.receivePay_(s,{id:orig.支払ID,received:true},u));
T('訂正1 +500',()=>g.correctPay_(s,{id:orig.支払ID,gross:500,tax:0,reason:'時給誤り',reviewed:true,requestId:'tokenAAAA1',previousIds:[]},u));
T('訂正1 再送（同じ受付番号・同内容）→ 重複作成しない',()=>g.correctPay_(s,{id:orig.支払ID,gross:500,tax:0,reason:'時給誤り',reviewed:true,requestId:'tokenAAAA1',previousIds:[]},u));
T('訂正2 再訂正 -200（元明細から）',()=>g.correctPay_(s,{id:orig.支払ID,gross:-200,tax:0,reason:'再訂正',reviewed:true,requestId:'tokenBBBB2',previousIds:s.支払.filter(r=>r.原支払ID===orig.支払ID).map(r=>r.支払ID)},u));
const c1=s.支払.find(r=>r.支払ID==='correction-tokenAAAA1');
T('差額明細からの再訂正 → 元明細へ誘導',()=>g.correctPay_(s,{id:c1.支払ID,gross:100,tax:0,reason:'x',reviewed:true,requestId:'tokenCCCC3'},u));
T('訂正1（未受領）の確定取消',()=>g.voidPay_(s,{id:c1.支払ID,reason:'誤登録',base:{...c1}},u));
T('取消後、同じ受付番号で再登録 → ?',()=>g.correctPay_(s,{id:orig.支払ID,gross:500,tax:0,reason:'時給誤り',reviewed:true,requestId:'tokenAAAA1',previousIds:s.支払.filter(r=>r.原支払ID===orig.支払ID).map(r=>r.支払ID)},u));
T('受付番号なし・取消済みと同内容で再登録',()=>g.correctPay_(s,{id:orig.支払ID,gross:500,tax:0,reason:'時給誤り',reviewed:true,previousIds:s.支払.filter(r=>r.原支払ID===orig.支払ID).map(r=>r.支払ID)},u));
const c2=s.支払.find(r=>r.支払ID==='correction-tokenBBBB2');
T('マイナス差額（返金）の受領',()=>g.receivePay_(s,{id:c2.支払ID,received:true},u));
T('元明細の確定取消（支払済）→ 拒否',()=>g.voidPay_(s,{id:orig.支払ID,reason:'x',base:{...orig}},u));
console.log('    明細:',s.支払.map(r=>[r.支払ID.slice(0,16),r.差引支給,r.原支払ID?'差額':'元',r.確定取消日時?'取消':'',r.支払済?'済':''].join('/')).join('  '));
// 精算後に勤怠を直そうとする
T('精算済みの勤怠修正 → 拒否',()=>{const old=s.配置[0];g.saveAttendance_(s,{row:{...old,実終了:'2026-12-28T17:00'},base:{...old}},u);});
// 精算後に交通費を変更
T('精算後に名簿の交通費変更 → 拒否',()=>{const p=s.人[0];g.savePerson_(s,{row:{...p,片道通勤距離km:5},base:{...p}},u);});
