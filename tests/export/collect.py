import asyncio,json
from playwright.async_api import async_playwright
JS=r"""()=>{
const sw=skFx6.toString(),caseIds=[...sw.matchAll(/case '(J\d+S\d+)'/g)].map(m=>m[1]);
const us=useSkill6.toString(),spec=[...us.matchAll(/k==='(J\d+S\d+)'/g)].map(m=>m[1]);
const sk=Object.values(SK).sort((a,b)=>{const p=x=>x.id.match(/J(\d+)S(\d+)/);const A=p(a),B2=p(b);return (+A[1]-+B2[1])||(+A[2]-+B2[2])}).map(x=>{const b=V6.SKILL.find(r=>r.id===x.id)||{};
 return {id:x.id,job:JOBN[x.c],c:x.c,n:x.n,lv:x.lv,act:x.act,kind:b.kind,tg:x.tg,mx:x.mx,minE:x.minE,dt:b.dt,s:x.s,pow:x.pow,h:x.dmg?x.dmg.h:null,mp:x.mp,cd:x.cd,fxRun:x.fx,fxTbl:b.fx,tags:x.tags,d:x.d,fx7:FX7[x.id]||null,fxa:FXA[x.id]||null,psv:PSV[x.id]||null,inCase:caseIds.includes(x.id),spec:spec.includes(x.id),selfSt:selfSt6(x.id)||null,skSt:(typeof skSt7==='function'?skSt7(x.id):null)}});
const tal=V6.TAL.map(t=>{const j=JOBK[t.job];let p1=null,pm=null;try{p1=parseTal6(j,t.fx,1)}catch(e){p1={err:String(e)}}try{pm=parseTal6(j,t.fx,t.max)}catch(e){}return Object.assign({},t,{p1,pm})});
const tail=parseTal6.toString().slice(-300);
const t532new=parseTal6('knight','反制每累計觸發4次，剩餘冷卻減1次；每級門檻減1（最低2次）',1);
const tagSk={};for(const x of Object.values(SK))for(const t of (x.tags||[]))(tagSk[t]=tagSk[t]||[]).push(x.id);
return {sk,tal,tail,t532new,tagSk,caseIds,spec,lunask:Object.fromEntries(Object.entries(LUNASK).map(([k,v])=>[k,{n:v.n,d:v.d,ok:v.ok.toString(),need:v.need||''}])),ally:ALLY&&Object.fromEntries(Object.entries(ALLY).map(([k,v])=>[k,{n:v.n,d:v.d,role:v.role,open:v.open.toString()}])),
 src:{mkAlly:mkAlly.toString(),allyAct:allyAct.toString(),allyTgt:allyTgt.toString(),allyHurt:allyHurt.toString(),withLuna:typeof withLuna==='function'?withLuna.toString():''}}}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome');pg=await (await b.new_context()).new_page()
    await pg.goto('http://localhost:8765/index.html',wait_until='commit');await pg.wait_for_timeout(4000)
    r=await pg.evaluate(JS);json.dump(r,open('/tmp/exp/run.json','w'),ensure_ascii=False);await b.close()
asyncio.run(main())
