#!/usr/bin/env python3
"""新レイアウト案(路線図スタイル)を v2.html に書き出す。座標は 738x958 の実寸。"""
import re, os
GUIDE = os.environ.get("GUIDE") == "1"   # 設置ガイド用(説明札を外し、掲示の記号を載せる)
from parts import KANNON, TOWER
src = open('index.html', encoding='utf-8').read()
head = src[:src.index('<div class="map">')]
head = re.sub(r'<div class="view">.*?</div>', '''<div class="rules">
    <span><svg width="34" height="18" viewBox="0 0 34 18"><rect width="34" height="18" rx="3" fill="#1B6A99"/><path d="M5,9H22M17,4L24,9L17,14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>順路は一方通行</span>
    <span><svg width="34" height="18" viewBox="0 0 34 18"><g fill="#1B6A99"><circle cx="6" cy="5" r="3.5"/><path d="M1,18Q1,10 6,10Q11,10 11,18Z"/><circle cx="17" cy="5" r="3.5"/><path d="M12,18Q12,10 17,10Q22,10 22,18Z"/><circle cx="28" cy="5" r="3.5"/><path d="M23,18Q23,10 28,10Q33,10 33,18Z"/></g></svg>参拝の列は3列で並ぶ</span>
  </div>''', head, flags=re.S)
head = head.replace('</style>', '.rules{display:flex;gap:8px;margin-bottom:3px}\n.rules span{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:800;border:2px solid var(--ink);border-radius:8px;padding:5px 11px;background:#fff;white-space:nowrap}\n</style>')
tail_script = '''<script>
const NS='http://www.w3.org/2000/svg', g=document.getElementById('routes');
[...g.querySelectorAll('path.r')].forEach(p=>{
  const c=p.dataset.c, len=p.getTotalLength(), lanes=p.dataset.lanes==='3';
  const w=lanes?21:+(p.dataset.w||5.5);
  const mk=(col,ww,op)=>{const q=p.cloneNode(); q.removeAttribute('class'); q.removeAttribute('stroke-dasharray'); q.setAttribute('stroke',col); q.setAttribute('stroke-width',ww); if(op)q.setAttribute('opacity',op); g.insertBefore(q,p); return q;};
  mk('#FBF9F1',w+6,'.95');
  if(lanes){ mk(c,21); mk('#FBF9F1',10.6); p.setAttribute('stroke-linecap','butt'); }
  p.setAttribute('stroke',c); p.setAttribute('stroke-width',lanes?5.4:w);
  if(p.dataset.dash) p.setAttribute('stroke-dasharray',p.dataset.dash);
  (p.dataset.arrows||'').split(',').filter(Boolean).forEach(f=>{
    const l=len*parseFloat(f), a=p.getPointAtLength(Math.max(0,l-2)), b=p.getPointAtLength(Math.min(len,l));
    const ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
    const t=document.createElementNS(NS,'path');
    t.setAttribute('d',lanes?'M-12,-15L10,0L-12,15Z':'M-10,-8.500L6,0L-10,8.500Z'); t.setAttribute('fill',lanes?'#fff':c);
    t.setAttribute('stroke',lanes?c:'#FBF9F1'); t.setAttribute('stroke-width',lanes?2.5:1.5); t.setAttribute('stroke-linejoin','round');
    t.setAttribute('transform',`translate(${b.x},${b.y}) rotate(${ang})`);
    g.appendChild(t);
  });
});
</script>
</body>
</html>
'''
GO, INC, BACK, PARK, INK = '#1B6A99', '#96600F', '#B5402F', '#56626B', '#22352E'

def route(pts, r=16):
    """直角に曲がる道を角丸のパスにする"""
    d = 'M%g,%g' % pts[0]
    for i in range(1, len(pts) - 1):
        (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]
        def toward(ax, ay, bx, by):
            L = ((bx - ax) ** 2 + (by - ay) ** 2) ** .5
            k = min(r, L / 2) / L
            return ax + (bx - ax) * k, ay + (by - ay) * k
        ax, ay = toward(x1, y1, x0, y0); bx, by = toward(x1, y1, x2, y2)
        d += 'L%g,%gQ%g,%g %g,%g' % (ax, ay, x1, y1, bx, by)
    return d + 'L%g,%g' % pts[-1]

def path(pts, c, arrows, dash=None, w=None, lanes=False):
    a = ' data-dash="%s"' % dash if dash else ''
    a += ' data-lanes="3"' if lanes else ''
    a += ' data-w="%s"' % w if w else ''
    return '<path class="r" data-c="%s" data-arrows="%s"%s d="%s"/>' % (c, arrows, a, route(pts))

def tile(x, y, w, h, lines, fill='#F3EAD6', stroke='#8A7B5C', fs=13, color=INK, sub=None):
    o = '<rect x="%g" y="%g" width="%g" height="%g" rx="4" fill="%s" stroke="%s" stroke-width="1.5"/>' % (x, y, w, h, fill, stroke)
    n = len(lines) + (1 if sub else 0); lh = fs + 4; y0 = y + h / 2 - (n - 1) * lh / 2 + fs * .36
    for i, t in enumerate(lines):
        o += '<text x="%g" y="%g" text-anchor="middle" font-size="%g" font-weight="800" fill="%s">%s</text>' % (x + w / 2, y0 + i * lh, fs, color, t)
    if sub:
        o += '<text x="%g" y="%g" text-anchor="middle" font-size="%g" font-weight="800" fill="#8F2E20">%s</text>' % (x + w / 2, y0 + len(lines) * lh, fs - 2.5, sub)
    return o

def num(n, x, y, c):
    return '<g><circle cx="%g" cy="%g" r="15" fill="%s" stroke="#fff" stroke-width="2.5"/><text x="%g" y="%g" text-anchor="middle" font-size="18" font-weight="900" fill="#fff">%d</text></g>' % (x, y, c, x, y + 6.4, n)

def cap(x, y, text, c, anchor='start', fs=14.5):
    """番号の横に置く説明ラベル(白い角丸の札)"""
    if GUIDE: return ""
    w = len(text) * fs * 1.0 + 16
    rx = x - 8 if anchor == 'start' else x - w + 8
    tx = x if anchor == 'start' else x
    return ('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="#fff" stroke="%s" stroke-width="1.5"/>' % (rx, y - fs - 3, w, fs + 12, (fs + 12) / 2, c) +
            '<text x="%g" y="%g" text-anchor="%s" font-size="%g" font-weight="800" fill="%s">%s</text>' % (tx, y + 1.5, anchor, fs, c, text))

def candle(x, y, vertical=False):
    if vertical:
        return ('<rect x="%g" y="%g" width="12" height="52" rx="2" fill="#EDEADF" stroke="#8A7B5C"/>' % (x, y) +
                ''.join('<circle cx="%g" cy="%g" r="3" fill="#E0892B"/>' % (x + 6, y + 10 + 16 * i) for i in range(3)))
    return ('<rect x="%g" y="%g" width="40" height="12" rx="2" fill="#EDEADF" stroke="#8A7B5C"/>' % (x, y) +
            ''.join('<circle cx="%g" cy="%g" r="3" fill="#E0892B"/>' % (x + 8 + 12 * i, y + 6) for i in range(3)))

def koro(x, y):
    return ('<g transform="translate(%g,%g)"><path d="M-30,-14L0,-40L30,-14Z" fill="#3E6A57"/>'
            '<rect x="-23" y="-14" width="4" height="40" fill="#B5503F"/><rect x="19" y="-14" width="4" height="40" fill="#B5503F"/>'
            '<path d="M-14,2H14Q14,24 0,24Q-14,24 -14,2Z" fill="#6E7F76"/>'
            '<text x="0" y="44" text-anchor="middle" font-size="14" font-weight="800" fill="%s">香閣</text></g>' % (x, y, INK))

L = []
A = L.append
A('<svg viewBox="0 0 738 1012" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="正月の参拝順路図">')
A('<rect width="738" height="1012" fill="#F5F1E4"/><g transform="translate(0,26)">')
A('<g fill="#DFE8D8"><path d="M0,0H170C130,80 60,90 0,200Z"/><path d="M738,0V330C690,270 640,150 630,0Z"/><path d="M738,740V980H570C640,930 700,860 738,740Z"/></g>')
# 広場
A('<path d="M262,336H558L640,470V712H300V690L176,372Z" fill="#FBF9F1"/>')
# 本堂
A('<polygon points="274,298 546,298 562,336 258,336" fill="#E6E2D5" stroke="#CFCABB"/>')
A('<g stroke="#CFCABB"><line x1="269" y1="311" x2="551" y2="311"/><line x1="264" y1="323" x2="556" y2="323"/></g>')
A('<rect x="274" y="236" width="272" height="62" fill="#F0ECDF" stroke="#BDB8A8" stroke-width="1.5"/>')
A('<rect x="244" y="118" width="332" height="110" fill="#F4E6D3"/>')
A('<g fill="#B5503F"><rect x="244" y="118" width="8" height="110"/><rect x="298" y="118" width="6" height="110"/><rect x="548" y="118" width="6" height="110"/><rect x="568" y="118" width="8" height="110"/>'
  '<rect x="234" y="224" width="82" height="13" rx="1"/><rect x="346" y="224" width="118" height="13" rx="1"/><rect x="494" y="224" width="92" height="13" rx="1"/></g>')
A('<path d="M200,116C290,104 350,72 410,30C470,72 530,104 620,116L606,134C530,122 290,122 214,134Z" fill="#3E6A57"/>')
A('<text x="414" y="104" text-anchor="middle" font-size="32" font-weight="900" fill="#fff" style="font-family:var(--serif);letter-spacing:.3em">本堂</text>')
A('<text x="400" y="200" text-anchor="middle" font-size="13" font-weight="600" fill="#5F6B65">本堂内</text>')
A('<text x="298" y="332" text-anchor="middle" font-size="11" font-weight="600" fill="#5F6B65">本堂前階段</text>')
# 外の賽銭箱
A('<rect x="378" y="240" width="44" height="14" rx="2" fill="#7A5A32" stroke="#4E3A1F"/><g stroke="#E9D9B8">' + ''.join('<line x1="%g" y1="243" x2="%g" y2="251"/>' % (x, x) for x in (386, 393, 400, 407, 414)) + '</g>')
# 本堂内授与
A('<line x1="578" y1="176" x2="598" y2="176" stroke="#8F2E20" stroke-width="1.5"/><circle cx="578" cy="176" r="3" fill="#8F2E20"/>')
A(tile(598, 148, 132, 56, ['本堂内でも'], fill='#fff', stroke='#8F2E20', fs=12.5, sub='御守・縁起物を授与').replace('font-size="10"', 'font-size="12.5"'))
# 観音像・仏塔・登竜門
A('<g transform="translate(62,214) scale(1.12)">%s</g><g transform="translate(118,214) scale(1.1)">%s</g>' % (KANNON, TOWER))
A('<text x="84" y="234" text-anchor="middle" font-size="11.500" font-weight="700" fill="#5F6B65">慈母大観音像</text><text x="84" y="250" text-anchor="middle" font-size="11.500" font-weight="700" fill="#5F6B65">仏塔納骨堂</text>')
A('<rect x="14" y="262" width="128" height="50" rx="4" fill="#fff" stroke="#3E6A57" stroke-width="1.5"/><text x="78" y="284" text-anchor="middle" font-size="14.5" font-weight="800" fill="#2B4D3F">登竜門 受付</text>')
A('<text x="78" y="303" text-anchor="middle" font-size="10.500" font-weight="600" fill="#5F6B65">観音様を拝観される方</text>')
# おみくじ結び所・絵馬所
A(tile(176, 140, 62, 50, ['おみくじ', '結び所'], fs=12.5))
A(tile(178, 280, 68, 54, ['絵馬所'], fs=14.5))
# 授与所(L字)
A('<path d="M24,400H138V650H282V716H24Z" fill="#A9BCA8" stroke="#7F977F" stroke-width="1.5"/><path d="M138,400V650H282" fill="none" stroke="#5E7A62" stroke-width="3.500"/>')
A('<g stroke="#7F977F" stroke-dasharray="3 3"><line x1="24" y1="650" x2="138" y2="650"/><line x1="138" y1="650" x2="138" y2="716"/></g>')
A('<text x="81" y="518" text-anchor="middle" font-size="17" font-weight="800" fill="%s">おみくじ</text><text x="81" y="541" text-anchor="middle" font-size="17" font-weight="800" fill="%s">授与所</text>' % (INK, INK))
A('<text x="81" y="681" text-anchor="middle" font-size="14" font-weight="800" fill="%s">納骨堂</text><text x="81" y="699" text-anchor="middle" font-size="14" font-weight="800" fill="%s">受付</text>' % (INK, INK))
A('<text x="210" y="682" text-anchor="middle" font-size="17" font-weight="800" fill="%s">諸札授与所</text><text x="210" y="702" text-anchor="middle" font-size="12.500" font-weight="800" fill="#8F2E20">御守・縁起物</text>' % INK)
# 香炉・ろうそく台
A(koro(426, 516)); A(koro(650, 500))
A(candle(420, 364, True)); A(candle(420, 421, True)); A(candle(586, 372)); A(candle(684, 372))
# テント・大師堂
A('<text x="586" y="590" text-anchor="middle" font-size="12.500" font-weight="700" fill="#5B4313">テント</text>')
A('<rect x="536" y="598" width="100" height="106" rx="4" fill="#F7EBCF" stroke="#A98B4E" stroke-width="1.5"/><line x1="536" y1="652" x2="636" y2="652" stroke="#A98B4E" stroke-dasharray="3 3"/>')
A('<text x="586" y="622" text-anchor="middle" font-size="13" font-weight="800" fill="#5B4313">線香・ローソク</text><text x="586" y="640" text-anchor="middle" font-size="12" font-weight="600" fill="#5B4313">授与</text><text x="586" y="684" text-anchor="middle" font-size="15" font-weight="800" fill="#5B4313">古札納所</text>')
A('<g transform="translate(694,0)"><path d="M-40,630C-20,620 -10,608 0,592C10,608 20,620 40,630Z" fill="#6F8B79"/><rect x="-30" y="630" width="60" height="62" fill="#F4E6D3" stroke="#C9B79C"/><rect x="-11" y="648" width="22" height="44" fill="#C8A77E"/>'
  '<text x="0" y="714" text-anchor="middle" font-size="17" font-weight="800" fill="%s">大師堂</text></g>' % INK)
# 幸福階段
A('<rect x="300" y="724" width="200" height="176" fill="#E6E2D5" stroke="#CFCABB"/><g stroke="#CFCABB">' + ''.join('<line x1="300" y1="%g" x2="500" y2="%g"/>' % (y, y) for y in range(746, 900, 22)) + '</g>')
A('<line x1="400" y1="718" x2="400" y2="906" stroke="#8A938D" stroke-width="3"/><rect x="293" y="716" width="7" height="192" fill="#BDB8A8"/><rect x="500" y="716" width="7" height="192" fill="#BDB8A8"/>')
A('<text x="520" y="868" font-size="25" font-weight="900" fill="%s" style="font-family:var(--serif);letter-spacing:.06em">幸福階段</text>' % INK)
# 順路
A('<g id="routes" fill="none" stroke-linecap="round" stroke-linejoin="round">')
A(path([(156, 64), (156, 384), (230, 384), (230, 632), (326, 632), (326, 926), (424, 926)], PARK, '0.08,0.2,0.36,0.5,0.6,0.74,0.86,1', dash='1.5 9'))
A(path([(330, 238), (330, 358), (250, 358), (250, 614), (350, 614), (350, 904)], BACK, '0.08,0.19,0.31,0.44,0.57,0.74,0.86,1'))
A(path([(466, 700), (504, 700), (504, 532), (464, 532)], INC, '0.35,0.62,1'))
A(path([(462, 482), (528, 482), (528, 252), (487, 252), (487, 150), (446, 150)], INC, '0.1,0.3,0.5,0.8,1', dash='8 8'))
A(path([(528, 684), (472, 684)], GO, '1', w=3))
A(path([(450, 908), (450, 590), (370, 590), (370, 346), (400, 346), (400, 302)], GO, '0.1,0.3,0.52,0.68,0.85', lanes=True))
A(path([(400, 300), (400, 268), (472, 268), (472, 168), (330, 168), (330, 222)], GO, '0.36,0.62,1'))
A('</g>')
# 番号と説明札
A(num(1, 450, 926, GO)); A(num(2, 450, 810, GO)); A(num(3, 450, 700, INC)); A(num(4, 400, 284, GO)); A(num(5, 250, 470, BACK))
A('<g paint-order="stroke" stroke="#FBF9F1" stroke-width="4" stroke-linejoin="round" font-weight="800">')
A('<text x="592" y="254" font-size="15" fill="%s">右入口<tspan font-size="12" font-weight="700">（入口専用）</tspan></text>' % GO)
A('<text x="262" y="254" font-size="15" fill="%s" text-anchor="end">左出口</text><text x="262" y="270" font-size="12" fill="%s" text-anchor="end">出口専用</text>' % (BACK, BACK))
A('<text x="372" y="252" font-size="12.500" fill="#4E3A1F" text-anchor="end">賽銭箱</text>')
A('<text x="394" y="652" font-size="14.500" fill="%s" text-anchor="middle">本堂参拝列</text><text x="394" y="671" font-size="13.500" fill="%s" text-anchor="middle">（3列）</text>' % (GO, GO))
A('<text x="494" y="519" font-size="14" fill="%s" text-anchor="middle">お供え</text>' % INC)
if not GUIDE: A('<text x="550" y="430" font-size="13.500" fill="%s">お供え後は</text><text x="550" y="449" font-size="13.500" fill="%s">右入口から本堂内へ</text>' % (INC, INC))
if not GUIDE: A('<text x="514" y="742" font-size="12.500" fill="%s">→ 古札・線香ローソクは右のテントへ</text>' % INC)
if not GUIDE: A('<text x="514" y="762" font-size="12.500" fill="%s">← 古札を納めた方は本堂参拝の列へ</text>' % GO)
A('<text x="24" y="40" font-size="16" fill="%s">本堂裏駐車場から</text>' % PARK)
A('</g>')
A(cap(480, 931, '階段下に3列で並ぶ（最後尾）', GO)); A(cap(480, 815, '右側は上り専用', GO)); A(cap(424, 293, '賽銭箱でお参り', GO, fs=12.5))
A(cap(274, 475, 'お帰り', BACK, fs=13.5)); A(cap(282, 747, '左側は下り専用', BACK, anchor='end'))
# 凡例
A('<g transform="translate(14,770)"><rect width="250" height="174" rx="6" fill="#fff" stroke="#D9D4C4"/>')
for i, (c, t, dash) in enumerate([(GO, '本堂参拝の列（3列）', ''), (INC, '古札納所・線香ローソク', ''), (BACK, '参拝後のお帰り', ''), (PARK, '裏駐車場から', ' stroke-dasharray="1.5 9"')]):
    y = 26 + i * 31
    if i == 0:
        A(''.join('<line x1="16" y1="%g" x2="58" y2="%g" stroke="%s" stroke-width="5"/>' % (y + d, y + d, c) for d in (-7.5, 0, 7.5)) + '<text x="70" y="%g" font-size="14.500" font-weight="700" fill="%s">%s</text>' % (y + 5, INK, t)); continue
    A('<line x1="16" y1="%g" x2="58" y2="%g" stroke="%s" stroke-width="5.500" stroke-linecap="round"%s/><text x="70" y="%g" font-size="14.500" font-weight="700" fill="%s">%s</text>' % (y, y, c, dash, y + 5, INK, t))
A(candle(17, 144) + '<text x="70" y="155" font-size="14.500" font-weight="700" fill="%s">ろうそく台（4か所）</text></g>' % INK)
if GUIDE:
    # 掲示の記号: (記号, 掲示する点x, y, 札の中心x, y)
    for k, px, py, bx, by in [('A', 156, 96, 204, 82), ('B', 432, 944, 540, 960), ('C', 468, 884, 566, 914), ('D', 476, 722, 552, 772),
                              ('E', 532, 708, 606, 746), ('F', 636, 676, 652, 700), ('G', 636, 624, 652, 600), ('H', 528, 410, 584, 432),
                              ('I', 424, 250, 444, 304), ('J', 496, 238, 572, 296), ('K', 318, 240, 290, 300), ('L', 320, 212, 276, 190),
                              ('M', 346, 720, 300, 686)]:
        A('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="#8F2E20" stroke-width="2"/><circle cx="%g" cy="%g" r="4" fill="#fff" stroke="#8F2E20" stroke-width="2"/>' % (px, py, bx, by, px, py))
        A('<rect x="%g" y="%g" width="30" height="30" rx="6" fill="#8F2E20" stroke="#fff" stroke-width="2"/><text x="%g" y="%g" text-anchor="middle" font-size="19" font-weight="900" fill="#fff">%s</text>' % (bx - 15, by - 15, bx, by + 7, k))
A('</g></svg>')
svg = '\n'.join(L).replace('(', '（').replace(')', '）') if False else '\n'.join(L)
body = head + '<div class="map">\n' + svg + '\n</div>\n\n' + tail_script
open('v2_guide.html' if GUIDE else 'v2.html', 'w', encoding='utf-8').write(body)
