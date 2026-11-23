const load=require('./harness'),mk=require('./state'),mock=require('./sheetmock');
const dir=process.argv[2],files=process.argv[3].split(',');
const g=load(dir,files);
const night={勤務帯ID:'夜勤',名前:'22〜翌6',開始:'22:00',終了:'06:00',翌日終了:true,休憩開始:'02:00',休憩終了:'03:00',時給種類:'本番',交通費対象:true};
const day={勤務帯ID:'日勤',名前:'9-17',開始:'09:00',終了:'17:00',翌日終了:false,休憩開始:'12:00',休憩終了:'13:00',時給種類:'本番',交通費対象:true};
function scenario(label,placements,targetId,at){
  const s=mk({勤務帯:[night,day],必要人数:[{枠ID:'D1',日付:'2026-12-30',勤務帯ID:'夜勤',売場ID:'V1',人数:2,大学生以上:0,確認:'運用'},{枠ID:'D2',日付:'2026-12-30',勤務帯ID:'夜勤',売場ID:'V2',人数:2,大学生以上:0,確認:'運用'},{枠ID:'D3',日付:'2026-12-29',勤務帯ID:'日勤',売場ID:'V1',人数:2,確認:'運用'}],
    勤務希望:[{希望ID:'W1',人ID:'P1',開始日時:'2026-12-20T00:00',終了日時:'2027-01-01T00:00',可否:'可'},{希望ID:'W2',人ID:'P1',開始日時:'2027-01-01T00:00',終了日時:'2027-01-02T00:00',可否:'可'}],配置:placements});
  const h=g.headers_('配置');
  const {sh,api}=mock(h,placements.map(a=>h.map(k=>a[k]??'')),{formulaCol:h.indexOf('実休憩分')});
  g.Sheets=api;g.db_=()=>({getSheetByName:()=>sh,getId:()=>'BOOK'});
  g.write_=g.__origWrite||g.write_;
  try{
    g.splitPlacement_(s,{id:targetId,base:{...s.配置.find(a=>a.配置ID===targetId)},at,venue:'V2',method:'口頭'},{email:'a@x'});
    const rows=sh.grid.slice(1).filter(r=>r[0]);
    console.log('OK   '+label);rows.forEach(r=>console.log('      '+[r[0],r[1],r[4],r[9],r[10],r[11],r[12]].join(' | ')));
    const ids=new Set(rows.map(r=>r[0]));if(ids.size!==rows.length)console.log('   !! duplicate ids');
  }catch(e){console.log('ERR  '+label+' : '+e.message);}
}
const base=(id,date,band)=>g.clean_('配置',{配置ID:id,日付:date,人ID:'P1',勤務帯ID:band,売場ID:'V1',状態:'予定',了解方法:'口頭'});
scenario('夜勤を0:00で分割（表の末尾の行）',[base('X1','2026-12-29','日勤'),base('X2','2026-12-30','夜勤')],'X2','2026-12-31T00:00');
scenario('夜勤を0:00で分割（表の途中の行）',[base('X2','2026-12-30','夜勤'),base('X1','2026-12-29','日勤')],'X2','2026-12-31T00:00');
scenario('夜勤を休憩後04:00で分割（末尾）',[base('X1','2026-12-29','日勤'),base('X2','2026-12-30','夜勤')],'X2','2026-12-31T04:00');
