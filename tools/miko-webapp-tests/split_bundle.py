import sys,re,os
out=sys.argv[-1]
for src in sys.argv[1:-1]:
    cur=None;buf=[]
    for line in open(src,encoding='utf-8-sig'):
        m=re.match(r'^===== BEGIN FILE: (.+?) =====\s*$',line)
        e=re.match(r'^===== END FILE: (.+?) =====\s*$',line)
        if m: cur=m.group(1);buf=[];continue
        if e and cur:
            open(os.path.join(out,cur),'w',encoding='utf-8').write(''.join(buf));cur=None;continue
        if cur is not None: buf.append(line)
