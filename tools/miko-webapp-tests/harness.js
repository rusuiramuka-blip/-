const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
module.exports=function load(dir,files){
  let uuid=0;
  const ctx={console,JSON,Math,Date,Object,Array,String,Number,RegExp,Error,Set,Map,Symbol,Promise,parseInt,parseFloat,isNaN,isFinite,Intl,
    Utilities:{getUuid:()=>'id'+(++uuid),formatDate:(d,tz,f)=>{const x=new Date(d.getTime()+9*3600000).toISOString();return f.includes('HH')?x.slice(0,16):x.slice(0,10);},
      computeDigest:(a,s)=>[...crypto.createHash('sha256').update(String(s)).digest()].map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1}},
    PropertiesService:{getScriptProperties:()=>({getProperty:()=>null,setProperty(){}})},
    Session:{getActiveUser:()=>({getEmail:()=>'admin@example.invalid'})},
    LockService:{getScriptLock:()=>({waitLock(){},tryLock:()=>true,releaseLock(){}})},
    SpreadsheetApp:{flush(){}},HtmlService:{},ScriptApp:{},MailApp:{},DriveApp:{},FormApp:{},Sheets:{},CacheService:{},Logger:{log(){}}};
  vm.createContext(ctx);
  for(const f of files)vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),ctx,{filename:f});
  vm.runInContext('globalThis.__origWrite=write_;write_=function(t,rows){globalThis.__writes=(globalThis.__writes||[]);__writes.push(t);};protectPaid_=function(){};',ctx);
  return ctx;
};
