# 把 .docs/v6/v63.json（使用者的 V6.3 企劃表）轉成 v6data.js，遊戲直接讀
import json,re,os
D=json.load(open(os.path.join(os.path.dirname(__file__),'..','.docs','v6','v63.json'),encoding='utf8'))
def rows(n,skip=1):return [r for r in D[n][skip:] if r and r[0] is not None]
def num(v):
    if v is None:return 0
    if isinstance(v,(int,float)):return int(v) if float(v).is_integer() else v
    try:
        f=float(v);return int(f) if f.is_integer() else f
    except:return v
O={}
# 裝備模板：類型 → 欄位、占用、每級數值
eq={}
for r in rows('裝備資料'):
    tid,name,lv,slot,typ,occ=r[0],r[1],int(r[2]),r[3],r[4],int(r[5])
    key=re.sub(r'_\d+$','',tid)
    e=eq.setdefault(key,{'slot':slot,'type':typ,'occ':occ,'n':[None]*10,'st':{k:[0]*100 for k in ['atk','mag','def','mres','hp','mp']}})
    e['n'][(lv-1)//10]=name
    for k,c in zip(['atk','mag','def','mres','hp','mp'],r[6:12]):e['st'][k][lv-1]=num(c)
for e in eq.values():e['st']={k:v for k,v in e['st'].items() if any(v)}
O['EQ']=eq
O['RAR']=[{'id':r[0],'n':r[1],'m':num(r[2]),'a0':num(r[3]),'a1':num(r[4]),'my':num(r[5]),'c':r[6]} for r in rows('稀有度')]
O['AFF']=[{'id':r[0],'n':r[1],'lo':num(r[3]),'hi':num(r[4]),'at':r[5],'g':r[6],'w':num(r[7])} for r in rows('詞條資料')]
O['TIER']=[{'t':r[0],'lo':num(r[1]),'hi':num(r[2]),'p':num(r[3])} for r in rows('詞條品質')]
O['DROP']=[{'k':r[0],'p':num(r[1]),'r':[num(x) for x in r[2:8]]} for r in rows('掉落機率')]
O['ENH']=[{'m':num(r[1]),'p':num(r[2]),'mat':num(r[3]),'g':num(r[4])} for r in rows('強化')]
O['JOBEQ']=[{'job':r[0],'armor':r[1],'main':r[2],'off':r[3],'hp':num(r[4]),'def':num(r[5]),'main_attr':r[6]} for r in rows('職業裝備')]
O['MYTH']=[{'id':r[0],'n':r[1],'for':r[2],'when':r[3],'fx':r[4],'lim':r[5]} for r in rows('神話效果')]
O['SKILL']=[{'id':r[0],'job':r[1],'n':r[2],'kind':r[3],'lv':num(r[4]),'dt':r[5],'pow':num(r[6]),'mp':num(r[7]),'cd':num(r[8]),'fx':r[9]} for r in rows('職業技能')]
O['MLV']=[[num(x) for x in r[:13]] for r in rows('怪物等級範圍')]
O['MRANK']=[{'k':r[0],'hp':[num(r[1]),num(r[2])],'atk':[num(r[3]),num(r[4])],'def':num(r[5]),'spd':num(r[6]),'exp':num(r[7]),'gold':num(r[8]),'sk':r[9]} for r in rows('怪物階級')]
O['MROLE']=[{'id':r[0],'n':r[1],'hp':num(r[2]),'atk':num(r[3]),'def':num(r[4]),'mres':num(r[5]),'spd':num(r[6]),'fx':r[7]} for r in rows('怪物特性')]
O['MRACE']=[{'n':r[0],'p':num(r[1]),'m':num(r[2]),'fx':r[3]} for r in rows('怪物種族')]
O['MSK']=[{'id':r[0],'n':r[1],'dt':r[2],'pow':num(r[3]),'cd':num(r[4]),'fx':r[5],'min':r[6],'cat':r[7],'w':num(r[8])} for r in rows('怪物技能模板')]
O['MPASS']=[{'id':r[0],'n':r[1],'fx':r[2],'min':r[3]} for r in rows('怪物被動')]
O['PHASE']=[{'id':r[0],'n':r[1],'at':num(r[2]),'fx':r[3]} for r in rows('首領階段')]
O['MAI']=[{'id':r[0],'n':r[1],'rule':r[2]} for r in rows('怪物AI')]
O['STAT']=[{'id':r[0],'n':r[1],'fx':r[2],'dur':num(r[3]),'max':num(r[4]),'rep':r[5],'bad':r[6]=='負面'} for r in rows('異常與增益狀態')]
O['ZONE']=[{'id':r[0],'n':r[1],'lo':num(r[2]),'hi':num(r[3]),'race':r[4],'boss':r[5],'env':r[6],'req':r[7]} for r in rows('地圖與首領')]
O['ELEM']=[{'id':r[0],'n':r[1],'weak':r[2],'res':r[3]} for r in rows('傷害相剋')]
O['TAL']=[{'id':r[0],'job':r[1],'br':r[2],'n':r[3],'lv':num(r[4]),'max':num(r[5]),'pre':r[6],'fx':r[7],'calc':r[8],'lim':r[9]} for r in rows('職業天賦')]
O['SET']=[{'id':r[0],'n':r[1],'lv':num(r[2]),'s2':r[3],'s3':r[4],'s4':r[5],'src':r[6]} for r in rows('裝備套裝')]
O['MAT']=[{'id':r[0],'n':r[1],'lv':num(r[2]),'src':r[3],'sell':num(r[4])} for r in rows('材料資料')]
O['CONS']=[{'id':r[0],'n':r[1],'lv':num(r[2]),'fx':r[3],'v':num(r[4]),'cd':num(r[5]),'price':num(r[6])} for r in rows('消耗道具')]
O['GEM']=[{'id':r[0],'n':r[1],'fx':r[2],'cost':r[3]} for r in rows('寶石資料')]
O['EVT']=[{'id':r[0],'n':r[1],'lo':num(r[2]),'hi':num(r[3]),'a':r[4],'ra':r[5],'b':r[6],'w':num(r[7])} for r in rows('探索事件')]
O['QUEST']=[{'id':r[0],'n':r[1],'z':r[2],'cond':r[3],'rw':r[4],'rep':r[5]} for r in rows('任務資料')]
O['ACH']=[{'id':r[0],'n':r[1],'z':r[2],'cond':r[3],'rw':r[4],'lim':r[5]} for r in rows('成就稱號')]
O['RECO']={r[0]:[num(x) for x in r[1:6]] for r in rows('職業推薦配點')}
txt={}
for n in ['使用說明','生成規則','戰鬥規則','技能共通規則','怪物生成規則','狀態結算規則','配點規則','遊戲循環','探索與遭遇','傷害標籤規則','天賦技能成長','怪物配置補充','裝備經濟','終局與難度','新增詞條與上限']:
    txt[n]={r[0]:r[1] for r in rows(n)}
O['RULE']=txt
js='/* 自動產生：tools/v6gen.py ← 使用者的 MMORPG ATB V6.3 企劃表。不要手改 */\nconst V6='+json.dumps(O,ensure_ascii=False,separators=(',',':'))+';\n'
open(os.path.join(os.path.dirname(__file__),'..','v6data.js'),'w',encoding='utf8').write(js)
print(len(js),{k:len(v) for k,v in O.items()})
