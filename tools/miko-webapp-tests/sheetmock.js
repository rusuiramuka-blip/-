// tiny in-memory sheet for 配置 write tests
module.exports=function(headers,rows,{formulaCol,maxRows=1000}={}){
  const W=headers.length;const grid=[headers.slice(),...rows.map(r=>r.slice())];const formulas=[];
  function ensure(r){while(grid.length<r)grid.push(Array(W).fill(''));}
  if(formulaCol!=null){for(let r=1;r<maxRows;r++){formulas[r]=formulas[r]||[];formulas[r][formulaCol]='=F';}}
  const sh={
    getLastRow(){let last=0;for(let r=0;r<maxRows;r++){const has=(grid[r]||[]).some(v=>v!==''&&v!=null)||(formulas[r]||[]).some(Boolean);if(has)last=r+1;}return last;},
    getMaxRows:()=>maxRows,getMaxColumns:()=>W,getSheetId:()=>7,getParent:()=>({getId:()=>'BOOK'}),
    getRange(r,c,nr=1,nc=1){return{
      getValues(){const o=[];for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++)row.push((grid[r-1+i]||[])[c-1+j]??'');o.push(row);}return o;},
      getFormulas(){const o=[];for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++)row.push((formulas[r-1+i]||[])[c-1+j]||'');o.push(row);}return o;},
      setValues(v){ensure(r-1+nr);for(let i=0;i<nr;i++)for(let j=0;j<nc;j++){grid[r-1+i][c-1+j]=v[i][j];if(formulas[r-1+i])formulas[r-1+i][c-1+j]='';}},
      clearContent(){for(let i=0;i<nr;i++)for(let j=0;j<nc;j++)if(grid[r-1+i])grid[r-1+i][c-1+j]='';}};},
    grid,formulas};
  const api={Spreadsheets:{batchUpdate(req){for(const q of req.requests){const u=q.updateCells;ensure(u.start.rowIndex+1);const v=u.rows[0].values[0].userEnteredValue;grid[u.start.rowIndex][u.start.columnIndex]=v?(v.stringValue??v.numberValue??v.boolValue):'';}}}};
  return {sh,api};
};
