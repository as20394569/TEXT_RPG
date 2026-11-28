"""V7.6 規格差異比對：python3 tests/spec_diff_v76.py V7.6.xlsx → tests/results/spec_v76/ana.json（需先在 8765 埠開本地伺服器）"""
import openpyxl,sys,json
wb=openpyxl.load_workbook(sys.argv[1],read_only=True,data_only=True)
G=lambda n:[[c for c in r] for r in wb[n].iter_rows(values_only=True)]
json.dump({'sk':G('V76技能差異表'),'tal':G('V76天賦核對'),'pos':G('V76職業定位')},open('/tmp/v76.json','w'),ensure_ascii=False,default=str)
import asyncio
from playwright.async_api import async_playwright
V=json.load(open('/tmp/v76.json'))
JS="""(V)=>{const out={tal:[],sk:[]};const idOf=x=>typeof x==="string"?x:(x&&x.id?x.id:null);
for(const r of V.tal.slice(1)){if(!r[0])continue;const [id,job,br,n,lv,mx,pre,cand,fx,calc,st]=r;const t=V6.TAL.find(x=>x.id===id);const j=JOBK[job];let p=null,e=null;
 try{p=parseTal6(j,String(fx),1)}catch(x){e=String(x)}
 const ids=p?[...new Set(['sk','src','self'].map(k=>idOf(p[k])).filter(Boolean))]:[];
 out.tal.push({id,job,br,n,lv,mx,pre,cand,fx,st,game:t?{n:t.n,lv:t.lv,max:t.max,pre:t.pre,fx:t.fx,br:t.br}:null,parse:p?{k:p.k,tag:p.tag||null,stt:p.st||p.need||null}:null,pids:ids,err:e})}
for(const r of V.sk.slice(1)){if(!r[0])continue;const [id,job,cls,on,nn,olv,dt,pow,mp,cd,fx,act,asset]=r;const s=SK[id],b=V6.SKILL.find(x=>x.id===id);
 out.sk.push({id,job,cls,on,nn,olv,dt,pow,mp,cd,fx,act,asset,game:s?{n:s.n,lv:s.lv,mp:s.mp,cd:s.cd,pow:s.pow,dt:s.dt,fx:s.fx,h:s.h||null,tg:s.tg}:null,base:b?{n:b.n,lv:b.lv,mp:b.mp,cd:b.cd,pow:b.pow,dt:b.dt,fx:b.fx,tg:b.tg}:null})}
return out}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome');pg=await (await b.new_context()).new_page()
    await pg.goto('http://localhost:8765/index.html',wait_until='commit');await pg.wait_for_timeout(4000)
    r=await pg.evaluate(JS,V);json.dump(r,open('tests/results/spec_v76/ana.json','w'),ensure_ascii=False);await b.close()
asyncio.run(main())
