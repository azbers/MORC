import sys, base64, io, json
import numpy as np
from PIL import Image, ImageFilter
from collections import deque
U='/root/.claude/uploads/8b0b728e-fb1d-58f8-a3d4-f8b07feaeb91/'
OUT=sys.argv[1]
SRC={'heel':'80be093c','heelred':'99175abf','sport':'76a97335','chunky':'5a916565','runner':'57b2817c'}
FILLS={'heel':['#CCFF00','#ff8fb1','#EDEBE4'],'chunky':['#CCFF00','#EDEBE4','#7cc4ff'],'runner':['#CCFF00','#ff9f43','#EDEBE4'],'heelred':[None],'sport':[None]}
def hexrgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def label(mask):
    h,w=mask.shape; lab=np.zeros((h,w),int); n=0; sizes=[]
    for y in range(h):
        for x in range(w):
            if mask[y,x] and not lab[y,x]:
                n+=1; q=deque([(y,x)]); lab[y,x]=n; c=0
                while q:
                    cy,cx=q.popleft(); c+=1
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny,nx=cy+dy,cx+dx
                        if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not lab[ny,nx]: lab[ny,nx]=n; q.append((ny,nx))
                sizes.append(c)
    return lab,sizes
res=[]
for key,fid in SRC.items():
    im=Image.open(U+fid+'-image.png').convert('RGBA')
    bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); a=np.array(bg.convert('RGB')).astype(int)
    light=(a.min(axis=2)>200)
    # close the small gaps in open line drawings first, so their inside can be filled
    K={'chunky':17,'runner':17}.get(key,3)
    dark=Image.fromarray(((~light)*255).astype(np.uint8))
    closed=np.array(dark.filter(ImageFilter.MaxFilter(K)))>0
    lab,sizes=label(~closed)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    outside=np.isin(lab,list(border))
    shape=~outside
    # keep only the biggest piece (drops the little motion dashes), then undo the widening
    sl,ss=label(shape); big=1+int(np.argmax(ss)); shape=(sl==big)
    shape=np.array(Image.fromarray((shape*255).astype(np.uint8)).filter(ImageFilter.MinFilter(K)))>0
    sl,ss=label(shape); shape=(sl==1+int(np.argmax(ss)))
    # fill holes that belonged to the shape interior
    for fill in FILLS[key]:
        out=np.zeros((a.shape[0],a.shape[1],4),np.uint8)
        rgb=a.copy()
        if fill:
            f=np.array(hexrgb(fill)); t=np.clip((a.min(axis=2)-60)/195,0,1)[...,None]
            rgb=(f*t+np.array([11,11,11])*(1-t)).astype(int)
        out[...,:3]=rgb; out[...,3]=np.where(shape,255,0)
        img=Image.fromarray(out,'RGBA')
        # soft light rim so dark strokes read on the black footer
        al=img.split()[3].filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.2))
        rim=Image.new('RGBA',img.size,(237,235,228,0)); rim.putalpha(al.point(lambda v:int(v*0.85)))
        rim.alpha_composite(img); img=rim
        img=img.crop(img.getbbox())
        wdt=240; img=img.resize((wdt,max(1,round(img.height*wdt/img.width))),Image.LANCZOS)
        name=f'{key}-{(fill or "orig").lstrip("#")}'
        img.save(f'{OUT}/{name}.png',optimize=True)
        q=img.quantize(colors=48,method=Image.Quantize.FASTOCTREE); b=io.BytesIO(); q.save(b,'PNG',optimize=True)
        res.append({'k':key,'r':round(img.height/img.width,3),'src':'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()})
json.dump(res,open(OUT+'/pile.json','w'))
print([ (r['k'],r['r'],len(r['src'])//1024) for r in res])
