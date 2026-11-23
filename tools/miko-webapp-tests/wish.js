const load=require('./harness'),mk=require('./state');
const dir=process.argv[2],files=process.argv[3].split(',');const g=load(dir,files);
const night={勤務帯ID:'夜勤',名前:'22〜翌6',開始:'22:00',終了:'06:00',翌日終了:true,休憩開始:'02:00',休憩終了:'03:00',時給種類:'本番',交通費対象:true};
const P=g.clean_('配置',{配置ID:'A1',日付:'2026-12-30',人ID:'P1',勤務帯ID:'夜勤',売場ID:'V1',状態:'予定'});
const W=(id,a,b,st)=>g.clean_('勤務希望',{希望ID:id,人ID:'P1',開始日時:a,終了日時:b,可否:st,確認方法:'面接'});
function t(label,wishes,action){const s=mk({勤務帯:[night],配置:[P],勤務希望:wishes});const before=s.勤務希望.slice();
 try{action(s);const ch=g.wishPlacementChanges_(s,'P1',before);console.log('OK  '+label+' → '+JSON.stringify(ch.map(c=>c.from+'→'+c.to)));}catch(e){console.log('ERR '+label+': '+e.message);}}
t('日付で分かれた2行の「可」→ 後半を不可に',[W('w1','2026-12-30T18:00','2026-12-31T00:00','可'),W('w2','2026-12-31T00:00','2026-12-31T08:00','可')],s=>{const r=s.勤務希望.find(x=>x.希望ID==='w2');g.saveWish_(s,{row:{...r,可否:'不可'},base:{...r}});});
t('「可」を削除 → 未確認',[W('w1','2026-12-30T18:00','2026-12-31T08:00','可')],s=>{const r=s.勤務希望[0];g.deleteWish_(s,{personId:'P1',id:'w1',base:{...r}});});
t('一括で夜勤帯を要相談に（確認なし）',[W('w1','2026-12-30T18:00','2026-12-31T08:00','可')],s=>g.saveWishBatch_(s,{personId:'P1',bandId:'夜勤',bandBase:{...night},days:['2026-12-30'],status:'要相談',base:s.勤務希望.map(r=>({...r}))}));
t('一括で夜勤帯を要相談に（確認あり）',[W('w1','2026-12-30T18:00','2026-12-31T08:00','可')],s=>{g.saveWishBatch_(s,{personId:'P1',bandId:'夜勤',bandBase:{...night},days:['2026-12-30'],status:'要相談',confirmOverwrite:true,base:s.勤務希望.map(r=>({...r}))});console.log('    rows:',s.勤務希望.map(r=>r.開始日時.slice(5)+'〜'+r.終了日時.slice(5)+' '+r.可否).join(', '));});
t('未確認→可を追加',[],s=>g.saveWish_(s,{row:{人ID:'P1',開始日時:'2026-12-30T22:00',終了日時:'2026-12-31T06:00',可否:'可'},base:null}));
