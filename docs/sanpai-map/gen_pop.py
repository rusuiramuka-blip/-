#!/usr/bin/env python3
"""掲示ポップ集(pop.html, A4)と設置ガイド(guide.html, A3横)を作る。
地図は gen_v2.py が書き出した v2.html / v2_guide.html から取り込む。"""
import re
FONT = re.search(r'@font-face\{font-family:"Noto Sans JP";src:url\("(.*?)/notosansjp.ttf"\)', open('v2.html', encoding='utf-8').read()).group(1)

def take(path):
    s = open(path, encoding='utf-8').read()
    return re.search(r'<svg viewBox.*?</svg>', s, re.S).group(0), re.search(r'<script>.*?</script>', s, re.S).group(0)

MAP, SCRIPT = take('v2.html')
MAPG, _ = take('v2_guide.html')
GO, INC, BACK, PARK, INK, SHU = '#1B6A99', '#96600F', '#B5402F', '#56626B', '#22352E', '#8F2E20'

# ---- 絵記号 ----
def arrow(deg, c='currentColor', size=150):
    return '<svg class="ico" width="%d" height="%d" viewBox="-50 -50 100 100"><path transform="rotate(%d)" d="M-44,-13H6V-38L46,0L6,38V13H-44Z" fill="%s"/></svg>' % (size, size, deg, c)
PEOPLE = '<svg class="ico" width="230" height="150" viewBox="0 0 138 90" fill="currentColor">' + ''.join(
    '<g transform="translate(%d,0)"><circle cx="21" cy="17" r="13"/><path d="M0,90V58Q0,36 21,36Q42,36 42,58V90Z"/></g>' % x for x in (0, 48, 96)) + '</svg>'
NOENTRY = '<svg class="ico" width="150" height="150" viewBox="-50 -50 100 100"><circle r="46" fill="#C8102E"/><rect x="-32" y="-9" width="64" height="18" rx="2" fill="#fff"/></svg>'

# 記号, 色, 番号, 場所, 絵記号, 本文(行のリスト), 補足, 英語
SIGNS = [
 ('A', PARK, '',  '本堂裏駐車場からお越しの方へ', '',            ['本堂参拝の方は', '幸福階段の下へ'], '階段下から参拝の列にお並びください', 'The worship line starts at the bottom of the stairs'),
 ('B', GO,   '1', '幸福階段の下',               PEOPLE,        ['参拝の列はこちら', '3列でお並びください'], '前が混み合うときは、階段下でお待ちください', 'Line up here in 3 rows'),
 ('C', GO,   '2', '幸福階段',                   arrow(-90),    ['上り専用'], '本堂に向かって右側をお上りください', 'UP ONLY'),
 ('D', INC,  '',  '幸福階段を上がられた皆さまへ', '',            ['まずは大師堂前の', '古札納所前へ'], 'テントの前で参拝の列が分かれます', 'Please proceed to the tent first'),
 ('E', INK,  '3', '大師堂前テントのご案内',       'FORK',        [], '', ''),
 ('F', INC,  '',  '大師堂前テント',               '',            ['古札納所'], '古いお札はこちらにお納めください', 'Return old amulets here'),
 ('G', INC,  '',  '大師堂前テント',               '',            ['線香・ローソク', '授与所'], 'こちらでお受け取りください', 'Incense & candles'),
 ('H', INC,  '',  '線香・ローソクをお供えされた方へ', '',         ['本堂の右入口へ'], 'お供えの後は、右の入口から本堂内へお進みください', 'After your offering, enter by the right door'),
 ('I', GO,   '4', '本堂前',                     '',            ['賽銭箱でお参り'], '本堂内へは、向かって右の入口からお入りください', 'Offertory box'),
 ('J', GO,   '',  '本堂',                       arrow(-90),    ['入口専用'], 'ご参拝の方はこちらからお入りください', 'ENTRANCE ONLY'),
 ('K', BACK, '',  '本堂',                       NOENTRY,       ['出口専用'], '入口は本堂に向かって右手です', 'EXIT ONLY · NO ENTRY'),
 ('L', BACK, '',  '本堂内',                     '',            ['お帰りはこちら'], 'こちらの出口からお進みください', 'EXIT'),
 ('M', BACK, '5', '幸福階段',                   arrow(90),     ['下り専用'], '足元にお気をつけてお下りください', 'DOWN ONLY'),
]

def sign(k, c, step, loc, ico, lines, sub, en):
    band = '<div class="band">%s<span class="loc">%s</span><span class="id">掲示 %s</span></div>' % ('<b class="step">%s</b>' % step if step else '', loc, k)
    foot = '<div class="foot"><span>成田山久留米分院</span><span class="en">%s</span></div>'
    if ico == 'FORK':
        body = ('<div class="fork"><div class="row" style="--c:%s">%s<div><h1>本堂参拝</h1><p>古札を納めた方も、こちらの参拝列へ（3列）</p></div></div>'
                '<div class="row r" style="--c:%s"><div><h1>古札・線香・ローソク</h1><p>右手のテントへお進みください</p></div>%s</div></div>') % (GO, arrow(180, size=170), INC, arrow(0, size=170))
        return '<section class="page sign" style="--c:%s">%s%s%s</section>' % (c, band, body, foot % 'Main Hall ← → Old amulets · Incense · Candles')
    n = max(len(l) for l in lines)
    avail = 760 if ico else 1010
    fs = min(210 if len(lines) == 1 else 150, int(avail / n))
    body = '<div class="main">%s<h1 style="font-size:%dpx">%s</h1></div><p class="sub">%s</p>' % (ico, fs, '<br>'.join(lines), sub)
    return '<section class="page sign" style="--c:%s">%s%s%s</section>' % (c, band, body, foot % en)

# 設置場所と向き: 記号 → (名前, 置く場所, 向ける相手)
PLACE = {
 'A': ('本堂裏駐車場', '駐車場から境内に出て、本堂側と階段下への道が分かれる手前。', '駐車場から歩いて来る方へ。曲がり角には簡易図も掲示する。'),
 'B': ('階段下の整列場所', '最下段から手前に離れた平地。3列に並び始める場所の脇。', 'これから列に並ぶ方へ。後から来る方が最後尾に続けるように。'),
 'C': ('幸福階段・上り口', '本堂を見て右側、最初の段に入る直前の平地の外側。', '上る方が、手すりの左右を選ぶ前に読める向き。'),
 'D': ('幸福階段・上りきった所', '上り側の白い欄干が終わる先。広場側の通路の脇。', '階段から上がる方へ。全員に古札納所前を案内する。'),
 'E': ('古札納所前の分岐', 'テントの階段寄りの角。納所に並ぶ手前で見える位置。', '階段から本堂を見る向き。左矢印が本堂参拝列、右矢印がテント。'),
 'F': ('古札納所', '古札を受け取る台の正面上部。職員の前や手元を空ける。', '納めに来る方へ。人が台の前にいても読める高さ。'),
 'G': ('線香・ローソク授与所', '同じテントの授与台の正面上部。古札の受け口と位置を分ける。', '授与口に近づく方へ。'),
 'H': ('お供え後の順路', '香閣・ろうそく台から本堂右入口へ向かう通路の外側。', 'お供えを終えた方へ。別のお供え場所から見えなければ追加する。'),
 'I': ('賽銭箱', '本堂前階段を上りきった踊り場。正面の賽銭箱のすぐ脇。', '下から来る参拝列へ。賽銭を納める手元を空ける。'),
 'J': ('本堂の右入口', '本堂に向かって右の扉。外側の柱脇。', '広場・本堂前階段側から入る方へ。'),
 'K': ('本堂の左出口・外側', '本堂に向かって左の扉。外側の柱脇。', '広場・本堂前階段側へ「出口専用」を見せる。'),
 'L': ('本堂の左出口・堂内側', 'Kと同じ扉の内側。堂内から出口に近づく側の柱脇。', 'お参りを終えた方へ「お帰りはこちら」を見せる。'),
 'M': ('幸福階段・下り口', '本堂を見て左の階段。帰路から下り始める直前の平場の脇。', '授与所の側から帰る方へ。上り口の札と同時に正面を向かないように。'),
}
TEXT = {s[0]: ('本堂参拝 ← → 古札・線香・ローソク' if s[4] == 'FORK' else ''.join(s[5])) for s in SIGNS}
COLOR = {s[0]: s[1] for s in SIGNS}

def rows(page0):
    o = ''
    for i, s in enumerate(SIGNS):
        k = s[0]; name, where, who = PLACE[k]
        o += ('<tr><td><b class="bd">%s</b></td><td><strong>%s</strong><span class="say" style="color:%s">「%s」</span></td><td>%s</td><td>%s</td><td class="pg">%d</td></tr>'
              % (k, name, COLOR[k], TEXT[k], where, who, page0 + i))
    return o

CSS = '''
@font-face{font-family:"Noto Sans JP";src:url("%(F)s/notosansjp.ttf");font-weight:100 900}
@font-face{font-family:"Noto Serif JP";src:url("%(F)s/notoserifjp.ttf");font-weight:200 900}
@page{margin:0} @page pt{size:210mm 297mm} @page ls{size:297mm 210mm} @page a3{size:420mm 297mm}
:root{--ink:#22352E;--sub:#5F6B65;--line:#D9D4C4;--paper:#FDFCF8;--shu:#8F2E20;
 --sans:"Noto Sans JP","Noto Sans CJK JP","Hiragino Sans","Yu Gothic",sans-serif;
 --serif:"Noto Serif JP","Noto Serif CJK JP","Hiragino Mincho ProN","Yu Mincho",serif}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff}
body{font-family:var(--sans);color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;overflow:hidden;break-after:page;background:var(--paper)}
.pt{page:pt;width:794px;height:1123px;padding:20px 28px 14px;display:flex;flex-direction:column;gap:8px}
.a3{page:a3;width:1587px;height:1123px;padding:34px 46px 26px;display:flex;flex-direction:column;gap:16px}
.a3 .lead{font-size:17px}
header{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid var(--ink);padding-bottom:8px}
header .org{font-size:13px;font-weight:600;letter-spacing:.08em;color:var(--sub)}
header h1{font-family:var(--serif);font-weight:900;font-size:33px;line-height:1.1;letter-spacing:.04em}
.a3 header h1{font-size:40px}
header .tag{font-size:13px;font-weight:600;color:var(--sub)}
.rules{display:flex;gap:8px;margin-bottom:3px}
.rules span{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:800;border:2px solid var(--ink);border-radius:8px;padding:5px 11px;background:#fff;white-space:nowrap}
.map{flex:none;border:1px solid var(--line);border-radius:6px;overflow:hidden;line-height:0}
.map svg{width:100%%;height:auto;display:block}
svg text{font-family:var(--sans)}
.bd{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:6px;background:var(--shu);color:#fff;font-size:19px;font-weight:900;line-height:1}
/* 一覧表 */
table{width:100%%;border-collapse:collapse}
th{font-size:12px;font-weight:700;color:var(--shu);text-align:left;padding:6px 8px;background:#F4F1E7;white-space:nowrap}
td:first-child{width:46px} td.pg,th:last-child{width:52px;text-align:center}
td{font-size:12.500px;line-height:1.5;padding:8px 8px;border-bottom:1px solid var(--line);vertical-align:top;word-break:auto-phrase}
td strong{display:block;font-size:14.500px;font-weight:800}
td .say{display:block;font-size:12px;font-weight:700}
td.pg{font-weight:800;color:var(--sub);text-align:center}
.a3 td{font-size:14px;padding:6px 10px;line-height:1.45} .a3 td strong{font-size:17px} .a3 td .say{font-size:13.500px} .a3 th{font-size:13.500px}
.lead{font-size:14px;line-height:1.7}
.note{font-size:12px;line-height:1.6;padding:8px 12px;border-left:4px solid var(--shu);background:#F4F1E7;border-radius:0 4px 4px 0}
.note b{color:var(--shu)}
.cols{display:grid;grid-template-columns:640px 1fr;gap:34px;flex:1;min-height:0}
/* 写真 */
.shots{display:flex;gap:14px}
.shots figure{flex:var(--a) 1 0;min-width:0}
.shots .ph{position:relative;line-height:0}
.shots img{width:100%%;display:block;border-radius:4px}
.shots .pin{position:absolute;transform:translate(-50%%,-50%%);width:16px;height:16px;border-radius:50%%;background:#fff;border:4px solid var(--shu)}
.shots .ph .bd{position:absolute;transform:translate(-50%%,-50%%);width:44px;height:44px;font-size:28px;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.shots h3{font-family:var(--serif);font-size:22px;font-weight:900;margin:10px 0 4px}
.shots p{font-size:15.500px;line-height:1.6;word-break:auto-phrase} .shots p b{color:var(--ink)}
.todo{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:14px}
.todo:before{content:'開門前の準備';grid-column:1/-1;font-family:var(--serif);font-size:24px;font-weight:900;border-bottom:1px solid var(--line);padding-bottom:6px}
.todo div{border-top:4px solid var(--shu);background:#fff;border:1px solid var(--line);border-top:4px solid var(--shu);border-radius:4px;padding:14px 16px}
.todo h3{font-size:18px;font-weight:800;line-height:1.4;margin-bottom:6px;word-break:auto-phrase}
.todo p{font-size:15.500px;line-height:1.7;word-break:auto-phrase}
.fine{font-size:11.500px;color:var(--sub);margin-top:auto}
/* 掲示 */
.sign{page:ls;width:1123px;height:794px;background:#fff;display:flex;flex-direction:column;border:14px solid var(--c)}
.sign .band{background:var(--c);color:#fff;height:96px;display:flex;align-items:center;gap:18px;padding:0 26px 10px}
.sign .step{display:grid;place-items:center;width:62px;height:62px;border-radius:50%%;background:#fff;color:var(--c);font-size:42px;font-weight:900;line-height:1}
.sign .loc{font-size:40px;font-weight:800;letter-spacing:.04em}
.sign .id{margin-left:auto;font-size:17px;font-weight:700;opacity:.85;border:1.5px solid rgba(255,255,255,.7);border-radius:6px;padding:3px 10px}
.sign .main{flex:1;display:flex;align-items:center;justify-content:center;gap:44px;color:var(--c);padding:0 30px}
.sign .main h1{font-weight:900;line-height:1.16;color:#1B1B1B;text-align:center;white-space:nowrap;letter-spacing:.01em}
.sign .ico{flex:none}
.sign .sub{font-size:39px;font-weight:700;text-align:center;color:#1B1B1B;padding:0 30px 20px;white-space:nowrap}
.sign .foot{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid #E3DFD2;margin:0 30px;padding:10px 0 12px;font-size:20px;font-weight:700;color:var(--sub)}
.sign .foot .en{font-size:22px;font-weight:800;letter-spacing:.03em;color:var(--c)}
.fork{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 34px}
.fork .row{display:flex;align-items:center;gap:34px;color:var(--c);padding:14px 0}
.fork .row.r{justify-content:flex-end;text-align:right;border-top:3px solid #E3DFD2}
.fork h1{font-size:112px;font-weight:900;line-height:1.1;white-space:nowrap}
.fork .row.r h1{font-size:76px}
.fork p{font-size:34px;font-weight:700;color:#1B1B1B;margin-top:6px;white-space:nowrap}
''' % {'F': FONT}

RULES = re.search(r'<div class="rules">.*?</div>', open('v2.html', encoding='utf-8').read(), re.S).group(0)
def doc(title, body):
    return '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<title>%s</title>\n<style>%s</style>\n</head>\n<body>\n%s\n%s\n</body>\n</html>\n' % (title, CSS, body, SCRIPT)

# ---- 掲示ポップ集(A4) ----
p1 = '<section class="page pt"><header><div><div class="org">成田山久留米分院</div><h1>正月の参拝順路</h1></div>%s</header><div class="map">%s</div></section>' % (RULES, MAP)
p2 = ('<section class="page pt" style="padding:34px 40px 24px;gap:14px"><header><div><div class="org">成田山久留米分院　正月参拝</div><h1>掲示の一覧と置き場所</h1></div><div class="tag">設営用</div></header>'
      '<p class="lead">掲示は A〜M の13枚です。記号は各掲示の右上にも入っています。<br>置く場所の図と現地写真は、別紙「設置ガイド」をご覧ください。</p>'
      '<table><tr><th></th><th style="width:27%%">掲示</th><th style="width:31%%">置く場所</th><th>向ける相手・使い方</th><th>ページ</th></tr>%s</table>'
      '<div class="note"><b>左右の基準</b>　掲示Eの矢印は、幸福階段から本堂を見た向きです。下りの掲示Mは帰る方に向けます。</div>'
      '<p class="fine">1ページは簡易図、3〜15ページは掲示原稿（A4横）。必要なページだけ印刷できます。</p></section>') % rows(3)
open('pop.html', 'w', encoding='utf-8').write(doc('正月参拝 掲示ポップ集', p1 + p2 + ''.join(sign(*s) for s in SIGNS)))

# ---- 設置ガイド(A3横) ----
g1 = ('<section class="page a3"><header><div><div class="org">成田山久留米分院　正月参拝</div><h1>掲示の設置位置</h1></div><div class="tag">設営用　1 / 2</div></header>'
      '<div class="cols"><div><div class="map">%s</div><p class="fine" style="margin-top:8px">朱色の記号 A〜M が掲示の位置です（点は目安）。青・赤の丸数字は参拝順路の番号です。</p></div>'
      '<div><table><tr><th></th><th style="width:26%%">掲示</th><th style="width:33%%">置く場所</th><th>掲示面を向ける相手</th><th>ページ</th></tr>%s</table>'
      '<p class="fine" style="margin-top:10px">「ページ」は掲示ポップ集のページ番号です。裏駐車場の分かれ道とテントの窓口位置は、当日の通り道に合わせてください。</p></div></div></section>') % (MAPG, rows(3))
SHOTS = [
 ('photos/1-stairs-up.jpg', 1200 / 900, 'D', .753, .626, .86, .40, '幸福階段を見上げたところ', '上りきった先に、古札納所前への予告を掲げます。', '白い欄干の広場側で、上る方が正面に読める向き。'),
 ('photos/2-tent.jpg', 675 / 900, 'E', .903, .579, .76, .72, '大師堂前テント', '写真手前の階段側の角が、分岐の掲示の候補です。', 'FとGは、当日設けるそれぞれの受付台の上へ。'),
 ('photos/3-hondo.jpg', 1200 / 900, 'J', .734, .451, .84, .26, '本堂前階段を見上げたところ', '右手の扉は入口専用。Jを外側の柱脇に掲げます。', '左出口はKを外側に、Lを同じ扉の堂内側に掲げます。'),
 ('photos/4-stairs-down.jpg', 675 / 900, 'M', .372, .570, .56, .74, '広場から幸福階段の下り口を見る', '帰路から見て、階段に足をかける手前の平場へ。', '欄干や既設看板の陰を避け、授与所側から見える向きに。'),
]
shots = ''.join('<figure style="--a:%.3f"><div class="ph"><img src="%s" alt=""><i class="pin" style="left:%.1f%%;top:%.1f%%"></i><b class="bd" style="left:%.1f%%;top:%.1f%%">%s</b></div><h3>%s</h3><p><b>%s</b><br>%s</p></figure>'
                % (a, src, px * 100, py * 100, bx * 100, by * 100, k, t, l1, l2) for src, a, k, px, py, bx, by, t, l1, l2 in SHOTS)
TODO = [
 ('階段下に、3列で待てる場所をつくる', '整列場所は平地に設けます。看板は手すりと段差を避け、下りて来る方の通路を空けます。混雑時の待ち方は、上る前に読める位置に掲示します。'),
 ('古札納所前は、立ち寄る方と通り抜ける方の幅を確保する', '古札を納める場所と線香・ローソクの授与口には、それぞれの札を掲げます。古札や紙袋の保管場所は、お供えの火から離します。'),
 ('声かけは古札納所で', '「古いお札はこちらにお納めください。本堂へは左の参拝列に3列でどうぞ。線香・ローソクはテントの授与口でお受け取りください」'),
 ('混雑時の連絡方法を決めておく', '列が階段に延びそうなときは、古札納所から責任者に連絡します。入場を見合わせる場合に階段下へ伝える手段と応援要請先を、開門前に決めておきます。'),
 ('夜間・雨天と、階段の利用が難しい方へのご案内', '夜間は段差と掲示が見えるかを点検し、濡れや凍結にも備えます。階段の利用が難しい方には、確認済みの経路と連絡先を駐車場側に掲示します。'),
]
g2 = ('<section class="page a3"><header><div><div class="org">成田山久留米分院　正月参拝</div><h1>現地写真で見る掲示の向きと、開門前の準備</h1></div><div class="tag">設営用　2 / 2</div></header>'
      '<p class="lead">設営後に、階段下から賽銭箱までと、本堂内から下り口までを歩いて、進む先の表示が人越しにも読めるか確かめます。職員の持ち場は、大師堂前テントの古札納所です。</p>'
      '<div class="shots">%s</div><div class="todo">%s</div>'
      '<p class="fine">掲示は平場の通路脇や柱脇へ。出入口の開閉、手すり、列の通り幅を現地で確かめてください。　設営の参考：兵庫県警察「雑踏警備の手引き」第4章</p></section>'
      ) % (shots, ''.join('<div><h3>%s</h3><p>%s</p></div>' % t for t in TODO))
open('guide.html', 'w', encoding='utf-8').write(doc('正月参拝 掲示の設置ガイド', g1 + g2))
