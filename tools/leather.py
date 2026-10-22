"""Makes the pebbled leather tiles behind the site: assets/leather.jpg (light, multiplied over the hide
colour) and assets/leather-dark.jpg (mid grey, overlaid on saddle panels and the dark theme).
Cellular pebbles with soft creases, lit from the top left, seamless at 384 px.
Usage: python3 tools/leather.py [size] [seed] [pebbles per side]   (needs numpy and Pillow)"""
import os
import numpy as np, sys
from PIL import Image
rng=np.random.default_rng(int(sys.argv[2]) if len(sys.argv)>2 else 9)
S=int(sys.argv[1]) if len(sys.argv)>1 else 384
N=int(sys.argv[3]) if len(sys.argv)>3 else 14
pts=(np.stack(np.meshgrid(np.arange(N),np.arange(N),indexing='ij'),-1)+rng.random((N,N,2))*0.9+0.05)*(S/N)
pts=pts.reshape(-1,2)
yy,xx=np.mgrid[0:S,0:S].astype(float)
F1=np.full((S,S),1e9);F2=np.full((S,S),1e9)
for p in pts:
    for oy in (-S,0,S):
        for ox in (-S,0,S):
            dy=yy-(p[0]+oy); dx=xx-(p[1]+ox)
            if abs(oy)>0 and (p[0]+oy< -S/N*2 or p[0]+oy> S+S/N*2): continue
            if abs(ox)>0 and (p[1]+ox< -S/N*2 or p[1]+ox> S+S/N*2): continue
            d=np.sqrt(dy*dy+dx*dx)
            m=d<F1; F2=np.where(m,F1,np.minimum(F2,d)); F1=np.where(m,d,F1)
edge=F2-F1
h=np.clip(edge/9,0,1); h=h*h*(3-2*h)   # grooves between pebbles
dome=1-(F1/(S/N))**2*0.9                  # slight dome per pebble
def tnoise(fr,oct=3):
    out=np.zeros((S,S))
    for o in range(oct):
        f=fr*2**o; k=np.fft.fftfreq(S)*S
        KX,KY=np.meshgrid(k,k); r=np.sqrt(KX**2+KY**2)
        spec=(rng.normal(size=(S,S))+1j*rng.normal(size=(S,S)))*np.exp(-((r-f)**2)/(2*(f*0.5)**2))
        out+=np.real(np.fft.ifft2(spec))/(2**o)
    return (out-out.mean())/out.std()
low=tnoise(3,3); fine=tnoise(60,2)
H=h*0.5+dome*0.5+low*0.22+fine*0.05
k=np.fft.fftfreq(S); KX,KY=np.meshgrid(k,k)
H=np.real(np.fft.ifft2(np.fft.fft2(H)*np.exp(-2*(np.pi**2)*(1.1**2)*(KX**2+KY**2))))
gy,gx=np.gradient(H*6)
# light from top left
L=np.array([-0.55,-0.55,0.63]); L/=np.linalg.norm(L)
nz=1/np.sqrt(gx**2+gy**2+1); shade=(-gx*L[1]*nz - gy*L[0]*nz + L[2]*nz)
shade=(shade-shade.mean())/shade.std()
out=np.clip(0.94+shade*0.035+low*0.012,0,1)
img=Image.fromarray((out*255).astype(np.uint8),'L')
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','assets')
img.save(os.path.join(OUT,'leather.jpg'),quality=78)
d=np.clip(0.5+shade*0.10+low*0.03,0,1)
Image.fromarray((d*255).astype(np.uint8),'L').save(os.path.join(OUT,'leather-dark.jpg'),quality=78)
print('leather tiles written to', os.path.normpath(OUT))
