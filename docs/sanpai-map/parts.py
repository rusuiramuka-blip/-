"""観音像・仏塔の絵(足元中央が原点、上方向がマイナス)。両方の図で共用。"""
KANNON = '''<g stroke-linejoin="round" stroke-linecap="round">
<path d="M-25,0V-9C-25,-14 25,-14 25,-9V0Z" fill="#E6E1D3" stroke="#A39D8E"/>
<g fill="#8C8778"><rect x="-17" y="-7" width="3" height="4"/><rect x="-7" y="-7" width="3" height="4"/><rect x="4" y="-7" width="3" height="4"/><rect x="14" y="-7" width="3" height="4"/></g>
<path d="M-14,-15C-15,-50 -14,-80 -11,-114L11,-114C14,-80 15,-50 14,-15C6,-12 -6,-12 -14,-15Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.2"/>
<path d="M-7,-64C-8,-48 -8,-32 -8,-17M-1,-68C-2,-50 -2,-34 -1,-15M6,-64C7,-48 7,-32 7,-17" fill="none" stroke="#D2CDBF" stroke-width="1"/>
<path d="M-23,-11C-24,-19 -17,-21 -15,-14C-14,-22 -8,-22 -7,-14C-6,-23 -1,-23 0,-14C1,-23 6,-23 7,-14C8,-22 14,-22 15,-14C17,-21 24,-19 23,-11C11,-6 -11,-6 -23,-11Z" fill="#FFFFFF" stroke="#A39D8E"/>
<!-- 袖のたれ -->
<path d="M-17,-86C-20,-74 -19,-64 -16,-58C-12,-60 -11,-70 -10,-80Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.1"/>
<path d="M17,-86C20,-74 19,-64 16,-58C12,-60 11,-70 10,-80Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.1"/>
<!-- 頭巾・顔 -->
<path d="M0,-151C-7,-151 -10,-144 -11,-135C-12,-124 -16,-113 -16,-102L-8,-100C-8,-106 -7,-110 -6,-113L6,-113C7,-110 8,-106 8,-100L16,-102C16,-113 12,-124 11,-135C10,-144 7,-151 0,-151Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.2"/>
<ellipse cx="-7.300" cy="-123" rx="1.300" ry="3.200" fill="#FFFFFF" stroke="#A39D8E" stroke-width=".7"/><ellipse cx="7.300" cy="-123" rx="1.300" ry="3.200" fill="#FFFFFF" stroke="#A39D8E" stroke-width=".7"/>
<path d="M-7,-127C-7,-135 7,-135 7,-127C7,-119 3.600,-114 0,-114C-3.600,-114 -7,-119 -7,-127Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width=".9"/>
<path d="M-7,-126.500C-7,-135.500 7,-135.500 7,-126.500C5.200,-131 1.600,-131.600 0,-129.600C-1.600,-131.600 -5.200,-131 -7,-126.500Z" fill="#D8D3C5" stroke="#A39D8E" stroke-width=".6"/>
<path d="M-5.200,-125.600Q-3.300,-127.200 -1.300,-125.900M1.300,-125.900Q3.300,-127.200 5.200,-125.600" fill="none" stroke="#8C8778" stroke-width=".7"/>
<path d="M-4.900,-123.300Q-3.200,-122.200 -1.500,-123.300M1.500,-123.300Q3.200,-122.200 4.900,-123.300" fill="none" stroke="#6F6A5D" stroke-width=".9"/>
<path d="M0,-124V-120.600Q.2,-119.900 1,-120.200" fill="none" stroke="#B5AFA0" stroke-width=".6"/>
<path d="M-1.700,-117.900Q0,-116.900 1.700,-117.900" fill="none" stroke="#C28B80" stroke-width=".9"/>
<circle cx="0" cy="-127.400" r=".9" fill="#C99A2E"/>
<path d="M-3.800,-133.500L-2.800,-141.500Q0,-145.500 2.800,-141.500L3.800,-133.500Z" fill="#D8B24A" stroke="#9A7420" stroke-width=".6"/>
<path d="M0,-142.200C-1.400,-142.200 -1.600,-139 -1.800,-135.500H1.800C1.600,-139 1.400,-142.200 0,-142.200Z" fill="#FFF7DC" stroke="#9A7420" stroke-width=".4"/>
<path d="M-6,-111C-3,-106 3,-106 6,-111" fill="none" stroke="#C99A2E" stroke-width="1.300" stroke-dasharray=".2 2.300"/>
<!-- 上腕(肩からひじ) -->
<path d="M-11,-108C-17,-102 -19,-92 -17,-84L-9,-84C-10,-92 -9,-100 -7,-104Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.1"/>
<path d="M11,-108C17,-102 19,-92 17,-84L9,-84C10,-92 9,-100 7,-104Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.1"/>
<!-- 赤ちゃん(おくるみと頭) -->
<path d="M-9,-91C-7,-99 4,-103 12,-100C15,-94 9,-86 -1,-84C-6,-84 -9,-87 -9,-91Z" fill="#F4F1E8" stroke="#A39D8E" stroke-width="1.1"/>
<circle cx="8.500" cy="-100" r="4.400" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1"/>
<path d="M6.800,-100.500H8.200M9.400,-100.500H10.800M8,-98H9.600" fill="none" stroke="#8C8778" stroke-width=".7"/>
<!-- 前腕と手(赤ちゃんを下から抱える) -->
<path d="M17,-88C19,-80 12,-76 4,-78C-1,-79 -5,-82 -7,-86L-4,-90C0,-85 6,-84 11,-86Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.1"/>
<path d="M-17,-88C-19,-81 -14,-77 -8,-79C-3,-81 1,-85 3,-90L-1,-93C-3,-88 -7,-86 -11,-87Z" fill="#FFFFFF" stroke="#A39D8E" stroke-width="1.1"/>
<ellipse cx="2.200" cy="-91.500" rx="3" ry="2.300" transform="rotate(-35 2.200 -91.500)" fill="#FFFFFF" stroke="#A39D8E" stroke-width=".9"/>
<ellipse cx="-6" cy="-87.500" rx="3" ry="2.300" transform="rotate(35 -6 -87.500)" fill="#FFFFFF" stroke="#A39D8E" stroke-width=".9"/>
</g>'''
TOWER = '''<g stroke-linejoin="round">
<rect x="-17" y="-8" width="34" height="8" fill="#B8956A" stroke="#8E6F49"/>
<path d="M-13,-8L-6,-84L6,-84L13,-8Z" fill="#CDAA7F" stroke="#8E6F49" stroke-width="1.2"/>
<g stroke="#8E6F49" stroke-width="1"><line x1="-11.500" y1="-24" x2="11.500" y2="-24"/><line x1="-10" y1="-40" x2="10" y2="-40"/><line x1="-8.500" y1="-56" x2="8.500" y2="-56"/><line x1="-7" y1="-72" x2="7" y2="-72"/></g>
<path d="M-6,-84L0,-100L6,-84Z" fill="#B8956A" stroke="#8E6F49"/>
<line x1="0" y1="-100" x2="0" y2="-110" stroke="#8E6F49" stroke-width="1.6"/>
</g>'''
