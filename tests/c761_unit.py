"""V7.6.1 候選技能 39 招功能測試（只在模擬器，載入 tests/cand761.js）。
用法：python3 tests/c761_unit.py [輸出.json]"""
import asyncio, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import page, setup_char
from v761_checks import BATTLE
CJS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cand761.js'), encoding='utf8').read()
R = {}
def rec(k, ok, info):
    R[k] = {'ok': bool(ok), 'info': info}; print(('PASS ' if ok else 'FAIL ') + k, json.dumps(info, ensure_ascii=False)[:300], flush=True)
HELP = """window.T761={bt:eval(window.__BT),
 cast(k,o){o=o||{};const s=rtS6();if(o.hpr!=null)S.hp=Math.max(1,Math.round(stats().HP*o.hpr));S.mp=9999;B.pcd6={};B.actor='p';const l0=Object.assign({},C761.log),h0=S.hp;useSkill6(k,rtS6());B.actor=null;
   const d={};for(const x in C761.log)if(C761.log[x]!==(l0[x]||0))d[x]=C761.log[x]-(l0[x]||0);return {d,dh:S.hp-h0}},
 st(f,id,o){stAdd(f,id,Object.assign({dur:5},o||{}))},
 all(){return [B,...(B.adds||[])].filter(f=>f.hp>0)},
 sh(){const x=B.psx&&B.psx.SHIELD;return x&&x.e>acOf('p')?Math.round(x.amt):0}};"""
JOBS = {'swordsman': ('swordsman', '', 30), 'mage': ('mage', '', 30), 'ranger': ('ranger', '', 30), 'cleric': ('cleric', '', 30), 'knight': ('swordsman', 'knight', 60), 'berserker': ('swordsman', 'berserker', 60),
        'archmage': ('mage', 'archmage', 60), 'warlock': ('mage', 'warlock', 60), 'sniper': ('ranger', 'sniper', 80), 'assassin': ('ranger', 'assassin', 60), 'bishop': ('cleric', 'bishop', 90), 'templar': ('cleric', 'templar', 60), 'dual': ('swordsman', 'dual', 70)}
# (技能, 職業, 戰鬥設定, 測試 JS（回傳 {ok, ...}）)
CASES = [
 ('J01S7', 'swordsman', {'adds': 1}, "for(let i=0;i<20;i++){const r=T761.cast('J01S7');if(r.d['J01S7.armor2'])return {ok:r.d['J01S7.second70']>=1,r}}return {ok:false}"),
 ('J01S8', 'swordsman', {'adds': 3}, "const a=T761.cast('J01S8');const v=B.c761n;const b=T761.cast('J01S1');return {ok:a.d['J01S8.set']&&v>=5&&v<=20&&b.d['J01S8.next']===1&&!B.c761n,v,a,b}"),
 ('J02S3', 'mage', {}, "for(let i=0;i<20;i++){delete B.psx.SHIELD;const r=T761.cast('J02S3');if(r.d['J02S3.shield'])return {ok:Math.abs(T761.sh()-Math.round(stats().HP*.05))<=1,sh:T761.sh()}}return {ok:false}"),
 ('J02S7', 'mage', {'adds': 3}, "return {ok:SK.J02S7.pow===.7&&FX7.J02S7.inf.id==='BURN'&&FX7.J02S7.inf.p===.5,pow:SK.J02S7.pow}"),
 ('J02S8', 'mage', {'adds': 3}, "for(const f of T761.all())f.rtg=60;T761.cast('J02S8');const g=T761.all().map(f=>f.rtg);return {ok:FX7.J02S8.inf&&FX7.J02S8.inf.id==='FROST'&&FX7.J02S8.push===15&&g.some(x=>x<=45),g}"),
 ('J03S7', 'ranger', {'adds': 1}, "for(let i=0;i<20;i++){const r=T761.cast('J03S7');if(r.d['J03S7.slow2'])return {ok:stHas(B.adds[0],'SLOW'),r}}return {ok:false}"),
 ('J03S8', 'ranger', {'adds': 3}, "return {ok:SK.J03S8.dmg.h===3&&SK.J03S8.pow===.75,h:SK.J03S8.dmg.h}"),
 ('J03S15', 'ranger', {}, "return {ok:SK.J03S15.n==='追獵本能'&&PSV.J03S15[0].k==='condcrit',n:SK.J03S15.n}"),
 ('J04S7', 'cleric', {'adds': 3}, "let ev=0;const _t=trig6;trig6=function(e){if(e==='heal')ev++;return _t.apply(this,arguments)};const r=T761.cast('J04S7',{hpr:.3});trig6=_t;const s=rtS6(),hb=(1+Math.min(30,s.HEALP||0)/100)*(1+(skmLv6('J04S7')-1)/100)*healInM6();const hits=C761.log;return {ok:r.d['J04S7.heal']===1&&ev===1&&[1,2,3,4].some(n=>Math.abs(r.dh-Math.round(s.HP*n/100*hb))<=1),dh:r.dh,ev,hb,HP:s.HP}"),
 ('J04S8', 'cleric', {'adds': 1}, "for(let i=0;i<20;i++){const r=T761.cast('J04S8');if(r.d['J04S8.seal2'])return {ok:stHas(B.adds[0],'SEAL'),r}}return {ok:false}"),
 ('J05S7', 'knight', {'adds': 3}, "delete B.psx.SHIELD;const r=T761.cast('J05S7');return {ok:!!r.d['J05S7.shield']&&FX7.J05S7.inf.id==='SLOW'&&T761.sh()>0&&T761.sh()<=Math.round(stats().HP*.12)+1,sh:T761.sh(),HP:stats().HP}"),
 ('J05S8', 'knight', {'adds': 1}, "for(let i=0;i<20;i++){const r=T761.cast('J05S8');if(r.d['J05S8.block'])return {ok:stHas('p','BLOCKUP'),r}}return {ok:false}"),
 ('J06S7', 'berserker', {'adds': 3}, "const HP=stats().HP;S.hp=Math.round(HP*.8);const h=S.hp;const a=T761.cast('J06S7');const cost=a.d['J06S7.cost'];const b=T761.cast('J06S7',{hpr:.4});S.hp=Math.ceil(HP*.05);const ready=skUsable7('J06S7');return {ok:cost===1&&!a.d['J06S7.low']&&b.d['J06S7.low']>=1&&ready===false,a,b,ready}"),
 ('J06S8', 'berserker', {'adds': 1}, "for(let i=0;i<20;i++){for(const f of T761.all())f.hp=1;const r=T761.cast('J06S8',{hpr:.3});if(r.d['J06S8.kill'])return {ok:r.dh>0,r};T761.bt({adds:1,pas:[]})}return {ok:false}"),
 ('J07S7', 'archmage', {'adds': 3}, "for(let i=0;i<30;i++){for(const f of T761.all())T761.st(f,'BURN',{src:{mag:10}});const r=T761.cast('J07S7');if(r.d['J07S7.stack2']){const f=T761.all().find(f=>f.sx.BURN&&f.sx.BURN.l2);const ok1=!!f&&!('BURN2' in f.sx);const e1=f.sx.BURN.e,e2=f.sx.BURN.l2.e;f.sx.BURN.e=acOf(f);stTick(f);const prom=f.sx.BURN&&f.sx.BURN.e===e2&&!f.sx.BURN.l2;return {ok:ok1&&prom,e1,e2,prom}}}return {ok:false}"),
 ('J07S8', 'archmage', {'adds': 3}, "for(let i=0;i<40;i++){for(const f of T761.all())T761.st(f,'SLOW');const r=T761.cast('J07S8');if(r.d['J07S8.stun'])return {ok:FX7.J07S8.inf.id==='FROST'&&T761.all().some(f=>stHas(f,'STUN')),r}}return {ok:false}"),
 ('J07S15', 'archmage', {}, "return {ok:SK.J07S15.n==='結界精通'&&PSV.J07S15[0].k==='shamp'}"),
 ('J07S16', 'archmage', {}, "return {ok:SK.J07S16.n==='奧術回流'&&PSV.J07S16[0].k==='mp3'}"),
 ('J08S7', 'warlock', {'adds': 3}, "for(let i=0;i<30;i++){const r=T761.cast('J08S7');const p=T761.all().find(f=>f.p761&&stHas(f,'POISON'));const q=T761.all().find(f=>!stHas(f,'POISON'));if(p&&q){foeTake6(p,p.hp+10,'測試');const s=stHas(q,'POISON');const n1=C761.log['J08S7.spread']||0;q.p761=1;const z=T761.all().find(f=>f!==q&&!stHas(f,'POISON'));foeTake6(q,q.hp+10,'測試');const again=z?stHas(z,'POISON'):false;return {ok:s&&n1===1&&!again&&(C761.log['J08S7.spread']||0)===1,again}}T761.bt({adds:2,pas:[]})}return {ok:false}"),
 ('J08S8', 'warlock', {'adds': 1}, "for(const f of T761.all()){T761.st(f,'POISON',{src:{mag:10}});T761.st(f,'WEAK')}for(let i=0;i<20;i++){const r=T761.cast('J08S8');if(r.d['J08S8.amp'])return {ok:true,r}}return {ok:false}"),
 ('J08S15', 'warlock', {}, "return {ok:SK.J08S15.n==='噬魂精通'&&PSV.J08S15[0].k==='lsamp'}"),
 ('J09S7', 'sniper', {'adds': 3}, "for(const f of T761.all())T761.st(f,'MARK');const r=T761.cast('J09S7');return {ok:FX7.J09S7.pen===20&&r.d['J09S7.crit']>=1,r}"),
 ('J09S8', 'sniper', {'adds': 1}, "const r=T761.cast('J09S8');return {ok:r.d['J09S8.mark']>=1&&stHas(B,'MARK'),r}"),
 ('J09S10', 'sniper', {}, "B.eva=25;T761.cast('J09S10');let seen=null;const _h=hitFoe;hitFoe=function(st,p,o){const f=(o&&o.tgt)||B;if(o&&o.skill&&seen==null)seen=f.eva;return _h.apply(this,arguments)};const r=T761.cast('J09S2');hitFoe=_h;return {ok:r.d['J09S10.acc']===1&&B.eva===25&&!B.c761a,seen,after:B.eva}"),
 ('J09S11', 'sniper', {}, "T761.cast('J09S11');T761.st(B,'MARK');const r=T761.cast('J09S2');return {ok:r.d['J09S11.crit']===1&&!B.c761f,r}"),
 ('J09S14', 'sniper', {'pas': ['J09S14']}, "T761.st(B,'MARK');const r=T761.cast('J09S2');return {ok:r.d['J09S14.mark']===1,r}"),
 ('J10S3', 'assassin', {}, "T761.cast('J10S3');const ev=B.psx.EVAUP.v;const f=B;let used=0;for(let i=0;i<10&&!used;i++){const r=foeHit6(f,null,stats());used=C761.log['J10S3.used']||0}return {ok:ev>=12&&used===1&&!B.c761w,ev}"),
 ('J10S7', 'assassin', {'adds': 1}, "for(let i=0;i<20;i++){stAdd('p','EVAUP',{v:12,dur:3});const e0=B.psx.EVAUP.e;const r=T761.cast('J10S7');if(r.d['J10S7.eva'])return {ok:B.psx.EVAUP.v===12&&B.psx.EVAUP.e===e0&&r.d['rule.weakerSkip']===1,r}}return {ok:false}"),
 ('J10S8', 'assassin', {'adds': 3}, "for(const f of T761.all())T761.st(f,'POISON',{src:{atk:10}});const r=T761.cast('J10S8');return {ok:r.d['J10S8.crit']>=1,r}"),
 ('J10S14', 'assassin', {}, "return {ok:SK.J10S14.n==='毒刃精通'&&PSV.J10S14[0].st[0]==='POISON'}"),
 ('J11S7', 'bishop', {'adds': 3}, "delete B.psx.SHIELD;T761.cast('J11S7');stAdd('p','SHIELD',{amt:stats().HP*.5,dur:3});const big=T761.sh();const r1=T761.cast('J11S7');if(T761.sh()!==big||!r1.d['rule.shieldKeep'])return {ok:false,big,now:T761.sh()};delete B.psx.SHIELD;const r=T761.cast('J11S7');return {ok:!!r.d['J11S7.shield']&&T761.sh()<=Math.round(stats().HP*.08)+1&&T761.sh()>0,sh:T761.sh()}"),
 ('J11S8', 'bishop', {'adds': 1}, "for(const f of T761.all())T761.st(f,'JUDGE');const r=T761.cast('J11S8');return {ok:r.d['J11S8.amp']>=1,r}"),
 ('J11S12', 'bishop', {}, "return {ok:SK.J11S12.n==='聖光守護'}"),
 ('J12S7', 'templar', {'adds': 3}, "const r=T761.cast('J12S7');const f=T761.all().find(f=>stHas(f,'ARMOR'));return {ok:r.d['J12S7.armor']>=1&&stHas('p','BLOCKUP')&&!FX7.J12S7.inf&&f&&f.sx.ARMOR.e-acOf(f)===1,r}"),
 ('J12S8', 'templar', {'adds': 1}, "for(let i=0;i<20;i++){const r=T761.cast('J12S8');if(r.d['J12S8.set'])break}let ok=0;for(let i=0;i<10&&!ok;i++){foeHit6(B,null,stats());ok=C761.log['J12S8.reflect']||0}return {ok:ok===1}"),
 ('J12S16', 'templar', {}, "return {ok:SK.J12S16.n==='聖盾回魔'&&PSV.J12S16[0].gap===1}"),
 ('J13S7', 'dual', {'adds': 3}, "if(SK.J13S7.dmg.h!==2)return {ok:false};for(let i=0;i<60;i++){const r=T761.cast('J13S7');if(r.d['J13S7.gauge'])return {ok:r.d['J13S7.gauge']===1,i}}return {ok:false}"),
 ('J13S8', 'dual', {'adds': 1}, "return {ok:SK.J13S8.dmg.h===2}"),
 ('J13S11', 'dual', {}, "const r=T761.cast('J13S11');return {ok:SK.J13S11.dmg.h===2&&FX7.J13S11.inf.id==='ARMOR'}"),
]
async def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    by = {}
    for c in CASES: by.setdefault(c[1], []).append(c)
    for job, cs in by.items():
        cls, adv, lv = JOBS[job]
        async with page(seed=41) as pg:
            await setup_char(pg, cls, adv, lv, 3)
            await pg.evaluate(CJS); await pg.evaluate("(bt)=>{window.__BT=bt}", BATTLE); await pg.evaluate(HELP)
            for k, _, o, js in cs:
                o = dict({'pas': []}, **o)
                try:
                    r = await pg.evaluate(f"(o)=>{{C761.on();T761.bt(o);C761.log={{}};const res=(()=>{{{js}}})();return res}}", o)
                except Exception as e:
                    r = {'ok': False, 'err': str(e)[:200]}
                rec(f'{k} {job}', r.get('ok'), r)
            r = await pg.evaluate("()=>{C761.off();T761.bt({pas:[]});C761.log={};const k=Object.keys(SK).find(x=>C761.CAND.includes(x)&&SK[x].c===job6()&&SK[x].act&&skOk6(x));if(k)T761.cast(k);return {k,log:C761.log,act:C761.act}}")
            rec(f'{job} 關閉候選後不觸發任何候選效果', not r['log'] and not r['act'], r)
            rec(f'{job} 無頁面錯誤', not pg.errs, pg.errs[:3])
    if out: json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
    print(sum(v['ok'] for v in R.values()), '/', len(R))
if __name__ == '__main__':
    asyncio.run(main())
