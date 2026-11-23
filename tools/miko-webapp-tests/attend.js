const load=require('./harness'),mk=require('./state');
const dir=process.argv[2],files=process.argv[3].split(',');const g=load(dir,files);
const night={勤務帯ID:'夜勤',名前:'22〜翌6',開始:'22:00',終了:'06:00',翌日終了:true,休憩開始:'02:00',休憩終了:'03:00',時給種類:'本番',交通費対象:true};
function st(firstDone,secondDone){
  const A=g.clean_('配置',{配置ID:'F',日付:'2026-12-30',人ID:'P1',勤務帯ID:'夜勤',売場ID:'V1',状態:firstDone?'出勤':'予定',予定開始上書き:'2026-12-30T22:00',予定終了上書き:'2026-12-31T00:00',休憩開始上書き:'なし',休憩終了上書き:'なし',休憩2開始上書き:'なし',休憩2終了上書き:'なし',...(firstDone?{実開始:'2026-12-30T22:00',実終了:'2026-12-31T00:00'}:{})});
  const B=g.clean_('配置',{配置ID:'S',日付:'2026-12-30',人ID:'P1',勤務帯ID:'夜勤',売場ID:'V2',状態:secondDone?'出勤':'予定',予定開始上書き:'2026-12-31T00:00',予定終了上書き:'2026-12-31T06:00',休憩開始上書き:'2026-12-31T02:00',休憩終了上書き:'2026-12-31T03:00',休憩2開始上書き:'なし',休憩2終了上書き:'なし',...(secondDone?{実開始:'2026-12-31T00:00',実終了:'2026-12-31T06:00',実休憩開始:'2026-12-31T02:00',実休憩終了:'2026-12-31T03:00'}:{})});
  return mk({勤務帯:[night],配置:[A,B]});
}
function edit(s,id,changes){const old=s.配置.find(a=>a.配置ID===id);g.saveAttendance_(s,{row:{...old,状態:'出勤',...changes},base:{...old}},{email:'a@x'});}
const F1={実開始:'2026-12-30T22:00',実終了:'2026-12-30T23:55',実休憩開始:'',実休憩終了:''};
const S1={実開始:'2026-12-30T23:55',実終了:'2026-12-31T06:00',実休憩開始:'2026-12-31T02:00',実休憩終了:'2026-12-31T03:00'};
for(const [label,a,b,order] of [['両方予定・前半→後半',0,0,'FS'],['両方予定・後半→前半',0,0,'SF'],['両方出勤済み・前半→後半',1,1,'FS'],['両方出勤済み・後半→前半',1,1,'SF']]){
  const s=st(a,b);
  try{for(const k of order)edit(s,k,k==='F'?F1:S1);const c=g.calculate_(s,'P1','2027-02-10',0);console.log('OK  '+label+' 総分'+c.totals.minutes+' 交通費'+c.totals.transport+' errors='+JSON.stringify(c.errors));}
  catch(e){console.log('ERR '+label+': '+e.message);}
}
