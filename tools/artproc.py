# 把網頁 GPT 產生的圖整理成遊戲用的檔案
# 用法：python3 tools/artproc.py <id> <來源 png>
#   area_* → 1280x720；battle_* → 960x720；mob_* → 640x640 透明、置中留邊
#   skill_sheetN / gear_xxx / mat_sheet / gem_sheet / pot_sheet → 切格存成 128x128 圖示
import sys,os,json,colorsys
from PIL import Image,ImageOps
import numpy as np
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
ART=os.path.join(ROOT,'art')
def save(im,name,q=88):im.save(os.path.join(ART,name+'.webp'),'WEBP',quality=q,method=6);print('saved',name,im.size)
def unbg(im):
    """如果不是透明背景，把和四角相近的底色去掉"""
    im=im.convert('RGBA');a=np.array(im)
    if (a[:,:,3]<20).mean()>.05:return im
    c=np.concatenate([a[:8,:8,:3].reshape(-1,3),a[:8,-8:,:3].reshape(-1,3),a[-8:,:8,:3].reshape(-1,3),a[-8:,-8:,:3].reshape(-1,3)]).mean(0)
    d=np.abs(a[:,:,:3].astype(int)-c).sum(2)
    from scipy import ndimage
    mask=d<40;lab,n=ndimage.label(mask)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge));a[bg,3]=0;return Image.fromarray(a)
def clean(im):
    """去掉和主體分離的小碎塊"""
    from scipy import ndimage
    a=np.array(im);m=a[:,:,3]>24;lab,n=ndimage.label(m)
    if n>1:
        sz=ndimage.sum(m,lab,range(1,n+1));big=sz.max()
        for i,s in enumerate(sz):
            if s<big*.02:a[lab==i+1,3]=0
    return Image.fromarray(a)
def fit(im,size,pad):
    im=clean(unbg(im));bb=im.getbbox()
    if bb:im=im.crop(bb)
    w,h=im.size;s=(size-2*pad)/max(w,h);im=im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    out=Image.new('RGBA',(size,size),(0,0,0,0));out.paste(im,((size-im.size[0])//2,size-pad-im.size[1] if size>200 else (size-im.size[1])//2),im);return out
def cover(im,W,H):
    im=im.convert('RGB');return ImageOps.fit(im,(W,H),Image.LANCZOS)
def cells(im,cols,rows):
    """依透明間隙切格；切不出來就平均切"""
    im=unbg(im);a=np.array(im)[:,:,3]>24;W,H=im.size;out=[]
    def spans(prof,n,L):
        empty=prof<1;cuts=[]
        for k in range(1,n):
            t=L*k//n;best=None
            for d in range(0,L//(2*n)):
                for x in (t-d,t+d):
                    if 0<=x<L and empty[x]:best=x;break
                if best is not None:break
            cuts.append(best if best is not None else t)
        return [0]+cuts+[L]
    xs=spans(a.sum(0),cols,W);ys=spans(a.sum(1),rows,H)
    for r in range(rows):
        for c in range(cols):out.append(im.crop((xs[c],ys[r],xs[c+1],ys[r+1])))
    return out
def hue(im,deg):
    a=np.array(im.convert('RGBA')).astype(float)/255;rgb=a[:,:,:3]
    import matplotlib.colors as mc
    hsv=mc.rgb_to_hsv(rgb);hsv[:,:,0]=(hsv[:,:,0]+deg/360)%1;a[:,:,:3]=mc.hsv_to_rgb(hsv)
    return Image.fromarray((a*255).astype('uint8'))
SKILLS=[r[0] for r in json.load(open(os.path.join(ROOT,'.docs','v6','v63.json')))['職業技能'][1:] if r[0]]
SKILLS7=[r[0] for r in json.load(open(os.path.join(ROOT,'.docs','v6','v73.json')))['職業技能'][1:] if r[0] and int(str(r[0]).split('S')[1])>=7]
GEARK={'greatsword','axe','dagger','wand','book','mace','shield','hc','bc','fc'}
def run(id,src):
    im=Image.open(src)
    if id.startswith('area_'):save(cover(im,1280,720),id)
    elif id.startswith('battle_'):save(cover(im,960,720),id)
    elif id.startswith('mob_'):save(fit(im,640,24),id)
    elif id.startswith('skill7_sheet'):
        n=int(id[12:]);ids=SKILLS7[n*9:n*9+9]
        for k,c in zip(ids,cells(im,3,3)):save(fit(c,128,6),'skill_'+k)
    elif id.startswith('skill_sheet'):
        n=int(id[11:]);ids=SKILLS[n*9:n*9+9]
        for k,c in zip(ids,cells(im,3,3)):save(fit(c,128,6),'skill_'+k)
    elif id[5:] in GEARK and id.startswith('gear_'):
        for i,c in enumerate(cells(im,3,2)):save(fit(c,128,6),f'icon_{id[5:]}_{i}')
    elif id=='mat_sheet':
        cs=cells(im,3,2)
        for z in range(10):
            for k,c in enumerate(cs):
                ic=fit(c,128,6)
                if z and k!=5:ic=hue(ic,z*36)
                save(ic,f'item_MAT{z+1:02d}{k+1}'.replace('MAT10','MAT10'))
    elif id=='gem_sheet':
        for i,c in enumerate(cells(im,3,3)):save(fit(c,128,6),f'item_GEM{i+1:02d}')
    elif id=='pot_sheet':
        cs=cells(im,3,2)
        for z in range(10):
            for k in range(4):
                ic=fit(cs[k],128,6)
                save(ic,f'item_IT{z+1:02d}{k+1}')
        save(fit(cs[4],128,6),'item_GEM10');save(fit(cs[5],128,6),'item_mark6')
if __name__=='__main__':run(sys.argv[1],sys.argv[2])
