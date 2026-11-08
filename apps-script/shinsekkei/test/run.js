// Apps Script の純粋な計算部分を Node で確かめる。実行: node apps-script/shinsekkei/test/run.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..');

// 最大行を超える getRange で例外を出す、最小限のシートの模型（実際の Sheets と同じ挙動）
function Sheet(name, maxRows, cols) { this.name = name; this.max = maxRows; this.cols = cols; this.cells = []; this.formulas = {}; }
Sheet.prototype = {
  getMaxRows() { return this.max; },
  getLastRow() { let l = 0; this.cells.forEach((r, i) => { if (r && r.some(v => v !== '')) l = i + 1; }); return l; },
  insertRowsAfter(after, n) { this.max += n; },
  getRange(r, c, nr = 1, nc = 1) {
    if (r < 1 || r + nr - 1 > this.max || c + nc - 1 > this.cols) throw Error('範囲の座標がシートの範囲外です');
    const sh = this;
    return {
      getValues() { return Array.from({length: nr}, (_, i) => Array.from({length: nc}, (_, j) => ((sh.cells[r - 1 + i] || [])[c - 1 + j]) ?? '')); },
      setValues(v) { v.forEach((row, i) => { sh.cells[r - 1 + i] = sh.cells[r - 1 + i] || Array(sh.cols).fill(''); row.forEach((x, j) => { sh.cells[r - 1 + i][c - 1 + j] = x; }); }); return this; },
      setFormulas(f) { f.forEach((row, i) => { sh.formulas[(r + i) + ':' + c] = row[0]; }); return this; },
      setNumberFormat() { return this; }, copyTo() {}, clearContent() { (sh.cells[r - 1] || [])[c - 1] = ''; return this; }
    };
  }
};

const ctx = {console, Sheet, Utilities: {getUuid: () => Math.random().toString(36).slice(2)},
  SpreadsheetApp: {CopyPasteType: {PASTE_FORMAT: 'FORMAT', PASTE_DATA_VALIDATION: 'VALIDATION'}}};
vm.createContext(ctx);
['Code.gs', 'Payroll.gs', 'Setup.gs'].forEach(f => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, {filename: f}));
const run = code => vm.runInContext(code, ctx);

let failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message); }
}
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw Error((label || '') + ' 期待 ' + b + ' / 実際 ' + a);
}

run(`
var base = () => {
  const s = {設定: [{項目: '最低賃金:2025-10-01', 値: 1057}],
    勤務帯: [{勤務帯ID: 'd', 開始: '09:00', 終了: '18:00', 翌日終了: false, 休憩開始: '12:00', 休憩終了: '13:00', 休憩2開始: '', 休憩2終了: '', 時給種類: '通常', 交通費対象: true}],
    人: [{人ID: 'p', 区分: '大学生', 生年月日: '2005-05-05', 状態: '採用', 本人承諾: '済', 本番時給: 1100, 交通費: 300, 交通費課税額: 0}],
    勤務希望: [], 配置: [], 支払: []};
  s.cfg = {'36協定': true, 継続勤務間隔分: 120, 休息注意分: 480};
  return s;
};
var shift = (id, d, st, en) => ({配置ID: id, 日付: d, 人ID: 'p', 勤務帯ID: 'd', 状態: '予定',
  予定開始上書き: st, 予定終了上書き: en, 休憩開始上書き: 'なし', 休憩終了上書き: 'なし'});
`);

test('売場移動で分けた勤務に休息の注意を出さない', () => {
  eq(run(`issues_(base(), 'p', [shift('1','2027-01-02','2027-01-02T09:00','2027-01-02T12:00'), shift('2','2027-01-02','2027-01-02T12:00','2027-01-02T15:00')], false).warnings`), []);
});
test('同じ日の中抜け（60分）に休息の注意を出さない', () => {
  eq(run(`issues_(base(), 'p', [shift('1','2027-01-02','2027-01-02T09:00','2027-01-02T12:00'), shift('2','2027-01-02','2027-01-02T13:00','2027-01-02T17:00')], false).warnings`), []);
});
test('勤務日の間の休息が8時間未満なら注意を出す', () => {
  eq(run(`issues_(base(), 'p', [shift('1','2027-01-02','2027-01-02T14:00','2027-01-02T22:00'), shift('2','2027-01-03','2027-01-03T05:00','2027-01-03T09:00')], false).warnings`), ['前の勤務からの休息が短くなっています']);
});
test('18歳未満の深夜勤務を止める', () => {
  const e = run(`(() => { const s = base(); s.人[0].生年月日 = '2010-03-01'; return issues_(s, 'p', [shift('1','2027-01-02','2027-01-02T17:00','2027-01-02T22:30')], false).errors; })()`);
  if (!e.includes('18歳未満・年齢未確認の深夜勤務はできません')) throw Error(JSON.stringify(e));
});
test('9時間勤務（休憩1時間）の給与を分単位で出す', () => {
  const d = run(`(() => { const s = base(); s.配置 = [{配置ID: 'a', 日付: '2027-01-02', 人ID: 'p', 勤務帯ID: 'd', 状態: '出勤',
    実開始: '2027-01-02T09:00', 実終了: '2027-01-02T18:00', 実休憩開始: '2027-01-02T12:00', 実休憩終了: '2027-01-02T13:00'}]; return classify_(s, 'p', true); })()`);
  eq([d.length, d[0].minutes, d[0].basic, d[0].night, d[0].overtime, d[0].transport], [1, 480, 8800, 0, 0, 300]);
});
test('深夜帯（22時〜5時）に25%を加算する', () => {
  const d = run(`(() => { const s = base(); s.配置 = [{配置ID: 'a', 日付: '2027-01-01', 人ID: 'p', 勤務帯ID: 'd', 状態: '出勤',
    実開始: '2027-01-01T21:00', 実終了: '2027-01-02T01:00'}]; return classify_(s, 'p', true); })()`);
  eq([d[0].minutes, d[0].nightMinutes, d[0].night], [240, 180, 825]);
});
test('80人×10勤務の点検が1秒以内', () => {
  const ms = run(`(() => { const s = base(); const days = ['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03','2027-01-05','2027-01-06','2027-01-07'];
    for (let i = 0; i < 80; i++) { s.人.push({...s.人[0], 人ID: 'p' + i}); days.forEach((d, j) => s.配置.push({配置ID: i + '_' + j, 日付: d, 人ID: 'p' + i, 勤務帯ID: 'd', 状態: '予定'})); }
    const t = Date.now(); s.人.slice(1).forEach(p => issues_(s, p.人ID, s.配置.filter(a => a.人ID === p.人ID), false)); return Date.now() - t; })()`);
  if (ms > 1000) throw Error(ms + 'ms');
});
test('1,000行を超えて保存できる（勤務希望 2,400行）', () => {
  const r = run(`(() => { const h = headers_('勤務希望'), sh = new Sheet('勤務希望', 1000, h.length), book = {getSheetByName: () => sh};
    sh.getRange(1, 1, 1, h.length).setValues([h]); const rows = [];
    for (const n of [900, 1500, 2400]) { while (rows.length < n) rows.push({希望ID: 'w' + rows.length, 人ID: 'p', 開始日時: '2026-12-28T09:00', 終了日時: '2026-12-28T18:00', 可否: '可'}); write_('勤務希望', rows, book); }
    return read_('勤務希望', book).length; })()`);
  eq(r, 2400);
});
test('配置の行を足したとき実休憩分の式も足す', () => {
  const r = run(`(() => { const h = headers_('配置'), sh = new Sheet('配置', 1000, h.length), book = {getSheetByName: () => sh};
    sh.getRange(1, 1, 1, h.length).setValues([h]); const rows = [];
    for (let i = 0; i < 1200; i++) rows.push({配置ID: 'a' + i, 日付: '2027-01-02', 人ID: 'p', 勤務帯ID: 'd', 売場ID: 'v', 状態: '予定'});
    write_('配置', rows, book); const col = h.indexOf('実休憩分') + 1; return [read_('配置', book).length, sh.formulas['1001:' + col] || '', sh.formulas['1500:' + col] || '']; })()`);
  eq(r[0], 1200); if (!r[1].startsWith('=IF(AND(P1001') || !r[2].startsWith('=IF(AND(P1500')) throw Error(JSON.stringify(r));
});
test('実休憩分の式の列記号が見出しと一致する', () => {
  eq(run(`['実休憩開始','実休憩終了','実休憩2開始','実休憩2終了'].map(k => String.fromCharCode(65 + headers_('配置').indexOf(k))).join('')`), 'PQXY');
});

if (failed) { console.log(failed + '件失敗'); process.exit(1); }
console.log('すべて成功');
