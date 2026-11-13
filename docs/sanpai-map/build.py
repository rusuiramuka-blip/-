#!/usr/bin/env python3
"""map.src.html(地図の座標は 738x628 基準)から index.html を作る。
地図を縦方向に引き伸ばし、文字を大きくして A4 いっぱいに表示する。"""
import re, sys
KY = float(sys.argv[1]) if len(sys.argv) > 1 else 1.525  # 縦方向の倍率
KF = float(sys.argv[2]) if len(sys.argv) > 2 else 1.2                                                 # 地図内の文字倍率
f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
s = open('map.src.html', encoding='utf-8').read()
i = s.index('<svg viewBox'); j = s.index('</svg>', i)
svg = s[i:j]

def scale_d(d):
    out = []
    for cmd, args in re.findall(r'([MLHVCQZ])([^MLHVCQZ]*)', d):
        n = [float(x) for x in re.findall(r'-?\d+\.?\d*', args)]
        if cmd == 'V': n = [v * KY for v in n]
        elif cmd != 'H': n = [v * KY if k % 2 else v for k, v in enumerate(n)]
        out.append(cmd + ' '.join(f(v) for v in n))
    return ''.join(out)

svg = re.sub(r'\bd="([^"]+)"', lambda m: 'd="%s"' % scale_d(m.group(1)), svg)
svg = re.sub(r'\b(y|y1|y2|cy|height)="(-?\d+\.?\d*)"', lambda m: '%s="%s"' % (m.group(1), f(float(m.group(2)) * KY)), svg)
svg = re.sub(r'points="([^"]+)"', lambda m: 'points="%s"' % ' '.join(
    '%s,%s' % (p.split(',')[0], f(float(p.split(',')[1]) * KY)) for p in m.group(1).split()), svg)
svg = re.sub(r'translate\((-?\d+\.?\d*),(-?\d+\.?\d*)\)', lambda m: 'translate(%s,%s)' % (m.group(1), f(float(m.group(2)) * KY)), svg)
svg = re.sub(r'font-size="(\d+\.?\d*)"', lambda m: 'font-size="%s"' % f(float(m.group(1)) * KF), svg)
svg = re.sub(r'viewBox="0 0 738 [\d.]+"', 'viewBox="0 0 738 %s"' % f(628 * KY), svg)
from parts import KANNON, TOWER
def put(m):
    art = KANNON if m.group(1) == 'KANNON' else TOWER
    return '<g transform="translate(%s,%s) scale(%s)">%s</g>' % (m.group(2), f(float(m.group(3)) * KY), m.group(4), art)
svg = re.sub(r'<!--(KANNON|TOWER) ([\d.]+) ([\d.]+) ([\d.]+)-->', put, svg)
open('index.html', 'w', encoding='utf-8').write(s[:i] + svg + s[j:])
