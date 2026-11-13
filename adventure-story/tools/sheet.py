import sys
from PIL import Image, ImageDraw
R='/tmp/rv/';S=sys.argv[1]
def grid(files,out,scale=1,cols=None,bg=(90,110,90)):
  ims=[Image.open(R+f+'.png').convert('RGBA') for f in files]
  ims=[i.resize((int(i.width*scale),int(i.height*scale)),Image.NEAREST) for i in ims]
  cols=cols or len(ims);w=max(i.width for i in ims);h=max(i.height for i in ims)
  rows=(len(ims)+cols-1)//cols
  c=Image.new('RGB',(cols*w,rows*(h+12)),bg);d=ImageDraw.Draw(c)
  for k,(f,i) in enumerate(zip(files,ims)):
    x=(k%cols)*w;y=(k//cols)*(h+12)
    c.paste(i,(x,y+12),i);d.text((x+2,y),f,fill=(255,255,255))
  c.save(S+'/'+out)
# skin: battle frame crops
grid([f'sk_m_{i}' for i in range(4)]+[f'sk_f_{i}' for i in range(4)],'skin.png',0.5,4)
grid([f'skw_m_{i}' for i in range(4)]+[f'skw_f_{i}' for i in range(4)],'skinw.png',2,4)
grid([f'hc_m_{i}' for i in range(8)]+[f'hc_f_{i}' for i in range(8)],'hair.png',0.4,8)
grid([f'ey_m_{i}' for i in range(6)]+[f'ey_f_{i}' for i in range(6)],'eye.png',2,6)
