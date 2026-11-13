import sys
from PIL import Image, ImageDraw
R='/tmp/rv/';S=sys.argv[1]
HAIRS={'m':['spiky','short','long','tail','messy'],'f':['long','twin','bob','pony','bun']}
for a in ['cloth','chain']:
  c=Image.new('RGB',(10*300,2*230),(90,110,90));d=ImageDraw.Draw(c)
  for gi,g in enumerate('mf'):
    for hi,h in enumerate(HAIRS[g]):
      b=Image.open(R+f'battle_{g}_{h}_{a}.png').convert('RGBA');cs=b.width//4
      f0=b.crop((0,0,cs,cs)).resize((200,200),Image.LANCZOS)
      w=Image.open(R+f'walk_{g}_{h}_{a}.png').convert('RGBA')
      x0=hi*600;y0=gi*230
      c.paste(f0,(x0,y0+20),f0)
      for k,(r,col) in enumerate([(0,1),(1,1),(3,1)]):
        cell=w.crop((col*32,r*48,col*32+32,r*48+48)).resize((96,144),Image.NEAREST)
        c.paste(cell,(x0+200+k*100,y0+60),cell)
      d.text((x0+4,y0+4),f'{g} {h} {a}',fill=(255,255,255))
  c.save(S+f'/cons_{a}.png')
