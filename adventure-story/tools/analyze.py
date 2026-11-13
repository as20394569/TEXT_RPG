import numpy as np, json
from PIL import Image
R='/tmp/rv/'
HAIRS={'m':['spiky','short','long','tail','messy'],'f':['long','twin','bob','pony','bun']}
ARMS=['cloth','leather','chain']
rep={}
def A(p): return np.asarray(Image.open(R+p+'.png').convert('RGBA')).astype(int)
# 1 battle baselines / centers
bl={}
for g in 'mf':
  for h in HAIRS[g]:
    for a in ARMS:
      im=A(f'battle_{g}_{h}_{a}');cs=im.shape[0]//4
      rows=[]
      for i in range(16):
        c=im[(i//4)*cs:(i//4+1)*cs,(i%4)*cs:(i%4+1)*cs,3]>0
        ys,xs=np.nonzero(c)
        rows.append((int(ys.max()) if len(ys) else -1, int(xs.mean()) if len(xs) else -1, int(ys.min()) if len(ys) else -1))
      bl[f'{g}_{h}_{a}']=rows
# baseline spread per frame across combos of same gender
for g in 'mf':
  ks=[k for k in bl if k.startswith(g+'_')]
  spread=[]
  for i in range(16):
    b=[bl[k][i][0] for k in ks]; spread.append((i,min(b),max(b)))
  rep[f'battle_baseline_{g}']=spread
  # idle jitter frame0 vs1 center x
  rep[f'battle_idle_dx_{g}']=sorted(set(abs(bl[k][0][1]-bl[k][1][1]) for k in ks))
  rep[f'battle_top_{g}']=[ (i, min(bl[k][i][2] for k in ks)) for i in range(16)]
# 2 walk baselines
wl={}
for g in 'mf':
  for h in HAIRS[g]:
    for a in ARMS:
      im=A(f'walk_{g}_{h}_{a}')
      rr=[]
      for r in range(4):
        for c in range(3):
          cell=im[r*48:(r+1)*48,c*32:(c+1)*32,3]>0;ys,xs=np.nonzero(cell)
          rr.append((int(ys.max()),round(float(xs.mean()),1),int(ys.min())))
      wl[f'{g}_{h}_{a}']=rr
  ks=[k for k in wl if k.startswith(g+'_')]
  rep[f'walk_baseline_{g}']=sorted(set(v[0] for k in ks for v in wl[k]))
  rep[f'walk_top_range_{g}']=(min(v[2] for k in ks for v in wl[k]),max(v[2] for k in ks for v in wl[k]))
  rep[f'walk_height_{g}']=sorted(set(v[0]-v[2] for k in ks for v in wl[k]))
# 3 untinted skin with darkest tone (battle frame 8 & walk)
def peach(im):
  r,g,b,a=[im[...,i] for i in range(4)]
  return (a>0)&(r>215)&(g>165)&(g<225)&(b>120)&(b<200)&(r-b>45)&(r-g>15)&(r-g<55)
for g in 'mf':
  base=A(f'sk_{g}_0');dark=A(f'sk_{g}_3')
  pb=peach(base).sum();pd=peach(dark).sum()
  ys,xs=np.nonzero(peach(dark))
  rep[f'skin_untinted_battle_{g}']={'peach_px_base':int(pb),'peach_px_after_dark':int(pd),'bbox':[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())] if len(xs) else None}
  bw=A(f'skw_{g}_0');dw=A(f'skw_{g}_3')
  rep[f'skin_untinted_walk_{g}']={'base':int(peach(bw).sum()),'after_dark':int(peach(dw).sum())}
# 4 blade tint coverage
def blade(im):
  r,g,b,a=[im[...,i] for i in range(4)]
  mx=np.maximum(np.maximum(r,g),b);mn=np.minimum(np.minimum(r,g),b)
  return (a>0)&(mx-mn<14)&(mx>150)
for g in 'mf':
  st=A(f'wp_{g}_steel');rod=A(f'wp_{g}_rod')
  bs=blade(st);changed=(np.abs(st[...,:3]-rod[...,:3]).sum(-1)>30)
  rep[f'blade_{g}']={'blade_like_px':int(bs.sum()),'blade_px_not_tinted':int((bs&~changed).sum()),'changed_px':int(changed.sum())}
# 5 eye recolor effect on walk
for g in 'mf':
  e0=A(f'ey_{g}_0');e1=A(f'ey_{g}_1')
  dif=(np.abs(e0[...,:3]-e1[...,:3]).sum(-1)>20)
  per=[int(dif[r*48:(r+1)*48].sum()) for r in range(4)]
  rep[f'eye_changed_px_by_row_{g}']=per
# 6 alpha edge quality
for g in 'mf':
  im=A(f'battle_{g}_{HAIRS[g][0]}_cloth');a=im[...,3]
  rep[f'battle_semi_alpha_px_{g}']=int(((a>0)&(a<255)).sum())
print(json.dumps(rep,ensure_ascii=False,indent=0))
