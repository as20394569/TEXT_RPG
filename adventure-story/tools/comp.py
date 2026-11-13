import numpy as np
from PIL import Image
D='/tmp/pd7/'
def lut(hexc):
    b=np.array([int(hexc[i:i+2],16) for i in (1,3,5)],float)
    mix=lambda t,k:b+(np.array(t,float)-b)*k
    stops=[(0,mix([0,0,0],.8)),(70,mix([0,0,0],.45)),(150,b),(210,mix([255]*3,.18)),(255,mix([255]*3,.4))]
    out=np.zeros((256,3))
    for L in range(256):
        j=0
        while j<len(stops)-2 and L>stops[j+1][0]: j+=1
        (a0,c0),(a1,c1)=stops[j],stops[j+1];k=(L-a0)/(a1-a0);out[L]=c0+(c1-c0)*k
    return out.astype(np.uint8)
def grad(im,hexc):
    a=np.asarray(im.convert('RGBA')).copy();L=(a[...,0]*.3+a[...,1]*.59+a[...,2]*.11).astype(int);t=lut(hexc)
    m=a[...,3]>0;a[m,0:3]=t[L[m]];return Image.fromarray(a)
def comp(g,o,h,hexc='#9a6438'):
    body=Image.open(D+f'battle_body_{g}_{o}.png').convert('RGBA');cap=Image.open(D+f'battle_body_{g}_{o}_cap.png').convert('L')
    capimg=body.copy();capimg.putalpha(Image.fromarray(np.minimum(np.asarray(body.split()[3]),np.asarray(cap))))
    out=body.copy();out.alpha_composite(grad(capimg,hexc));out.alpha_composite(grad(Image.open(D+f'battle_hair_{g}_{h}.png'),hexc));return out
