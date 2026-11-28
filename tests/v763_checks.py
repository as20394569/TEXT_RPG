"""v21.5 被動格擋／迴避事件修正回歸測試。用法：python3 tests/v763_checks.py [輸出.json]"""
import asyncio, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import page, setup_char
from v761_checks import BATTLE
R = {}
def rec(k, ok, info):
    R[k] = {'ok': bool(ok), 'info': info}; print(('PASS ' if ok else 'FAIL ') + k, json.dumps(info, ensure_ascii=False)[:400], flush=True)
HELP = """window.T763={bt:eval(window.__BT),
 force(o){window.__st0=window.__st0||stats;stats=function(){const s=window.__st0.apply(this,arguments);return Object.assign({},s,o)};EFC=null},
 unforce(){if(window.__st0){stats=window.__st0;window.__st0=null}},
 spy(){const c={block:0,evade:0,per:[],ctr:0};const _b=onBlock6x,_t=trig6;onBlock6x=function(){c.block++;return _b.apply(this,arguments)};trig6=function(ev){if(ev==='evade')c.evade++;return _t.apply(this,arguments)};
   c.off=()=>{onBlock6x=_b;trig6=_t};return c},
 atk(n,o){o=o||{};const out={miss:0,ev:0,hit:0,blkEv:0,evEv:0,maxPer:0};for(let i=0;i<n;i++){if(S.hp<stats().HP*.5)S.hp=stats().HP;const f=o.f||B;const c=this.spy();const fx={};const L0=B.log.length;
   foeAttack6(f,o.id||null,fx,o.ao||{});c.off();const per=c.block+c.evade;out.maxPer=Math.max(out.maxPer,c.block,c.evade);out.blkEv+=c.block;out.evEv+=c.evade;if(fx.miss)out.miss++;else out.hit++;B.acP=(B.acP||0)+1}return out}};"""
async def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    async with page(seed=61) as pg:
        await setup_char(pg, 'swordsman', 'knight', 69, 3)
        await pg.evaluate("(bt)=>{window.__BT=bt}", BATTLE); await pg.evaluate(HELP)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6','J05S15']});B.rt.pr=-9;B.rt.ev=-9;T763.force({BLOCK:35,EVA:0});S.mp=0;const L0=B.log.length;const a=T763.atk(300);const ctr=B.log.slice(L0).filter(x=>/【反制】/.test(x)).length;T763.unforce();return Object.assign(a,{ctr,mp:S.mp})}""")
        rec('騎士被動格擋觸發格擋事件與反制', r['blkEv'] > 40 and r['ctr'] > 20 and r['mp'] > 0, r)
        rec('同一次攻擊格擋事件最多 1 次', r['maxPer'] <= 1, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});B.rt.pr=-9;T763.force({BLOCK:35,EVA:0});const a=T763.atk(200,{id:Object.keys(SKM).find(k=>SKM[k].mag&&SKM[k].pow&&!SKM[k].either)});T763.unforce();return a}""")
        rec('魔法攻擊不能被格擋、不觸發事件', r['blkEv'] == 0, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});T763.force({BLOCK:35,EVA:0});const f=B;const h=f.hit6;f.hit6=0.001;const a=T763.atk(100);f.hit6=h;T763.unforce();return a}""")
        rec('敵人自然未命中不算格擋／迴避', r['blkEv'] == 0 and r['evEv'] == 0 and r['miss'] == 100, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});T763.force({BLOCK:0,EVA:0});stAdd('p','SHIELD',{amt:1e9,dur:99});const a=T763.atk(100);T763.unforce();return a}""")
        rec('護盾吸收不算格擋', r['blkEv'] == 0, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});T763.force({BLOCK:35,EVA:30});const c=T763.spy();stAdd('p','POISON',{src:{atk:50},dur:5});for(let i=0;i<5;i++){stTick('p');B.acP++}c.off();T763.unforce();return {block:c.block,evade:c.evade}}""")
        rec('持續傷害不算格擋／迴避', r['block'] == 0 and r['evade'] == 0, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});B.rt.pr=B.rt.t+5;T763.force({BLOCK:35,EVA:0});const c=T763.spy();const fx={};foeAttack6(B,null,fx,{});const n1=c.block;B.inAtk=777;onBlock6();onBlock6();B.inAtk=null;c.off();T763.unforce();return {manualParry:n1,parry:!!fx.parry,twiceSameAtk:c.block-n1}}""")
        rec('手動格擋成功只觸發 1 次（不會再加被動格擋）', r['manualParry'] == 1 and r['parry'], r)
        rec('同一次攻擊內重複呼叫只算 1 次', r['twiceSameAtk'] == 1, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});let depth=0,maxD=0;const _t=trig6;trig6=function(ev){if(ev==='block'){depth++;maxD=Math.max(maxD,depth);onBlock6('passive');onEvade6('passive')}try{return _t.apply(this,arguments)}finally{if(ev==='block')depth--}};
          B.inAtk=null;onBlock6('passive');trig6=_t;return {maxD}}""")
        rec('事件處理中重入被擋下（防遞迴）', r['maxD'] == 1, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6','J05S15'],tal:{T0531:1,T0532:3}});B.rt.pr=-9;T763.force({BLOCK:0,EVA:0});const _fh=foeHit6;foeHit6=function(){const r=_fh.apply(this,arguments);if(!r.miss)r.blk=true;return r};S.mp=0;const L0=B.log.length;const m=[];for(let a=0;a<6;a++){const m0=S.mp;T763.atk(1);m.push(S.mp-m0)}const ctr=B.log.slice(L0).filter(x=>/【反制】/.test(x)).length;foeHit6=_fh;T763.unforce();return {m,ctr,one:Math.round(stats().HP&&stats().MP*.01)}}""")
        rec('被動格擋下 J05S15 每行動回魔 1 次、T0532 Lv3 反制序列不變（6 行動 4 次）', r['ctr'] == 4 and r['m'] == [r['one']] * 6, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});const a=B.atkN||0;let ok=true;try{rtAddGo&&0}catch(e){}return {ok}}""")
        r = await pg.evaluate("""()=>{T763.bt({pas:[]});T763.force({BLOCK:0,EVA:20});const f=B;const h=f.hit6;f.hit6=90;let nat=0,ev=0,n=4000;for(let i=0;i<n;i++){const r=foeHit6(f,null,stats());if(r.miss){if(r.ev)ev++;else nat++}}f.hit6=h;T763.unforce();return {nat:nat/n,ev:ev/n,miss:(nat+ev)/n}}""")
        rec('命中機率與舊版相同（自然未命中 10%、迴避 18%、合計 28%）', abs(r['miss'] - .28) < .025 and abs(r['nat'] - .10) < .02 and abs(r['ev'] - .18) < .02, r)
        rec('騎士 無頁面錯誤', not pg.errs, pg.errs[:3])
    async with page(seed=62) as pg:
        await setup_char(pg, 'ranger', 'assassin', 100, 3)
        await pg.evaluate("(bt)=>{window.__BT=bt}", BATTLE); await pg.evaluate(HELP)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J10S6','J10S16'],tal:{T1031:1,T1032:1,T1033:1,T1034:1,T1035:1}});B.rt.ev=-9;T763.force({EVA:30,BLOCK:0});S.mp=0;let nx=0,g=0;const _t=trig6;trig6=function(ev){const n0=B.p6?B.p6.nx.length:0,g0=B.rt.pgB||0;const r=_t.apply(this,arguments);if(ev==='evade'){nx+=(B.p6.nx.length-n0);g+=(B.rt.pgB||0)-g0}return r};
          const a=T763.atk(300);trig6=_t;T763.unforce();return Object.assign(a,{nx,g,mp:S.mp})}""")
        rec('刺客被動迴避觸發影步（下次增傷）、迴避回魔', r['evEv'] > 40 and r['nx'] > 0 and r['mp'] > 0, r)
        r2 = await pg.evaluate("""()=>{T763.bt({pas:['J10S6'],tal:{T1035:1}});B.rt.ev=-9;T763.force({EVA:30,BLOCK:0});let g=0;const _t=trig6;trig6=function(ev){const g0=B.rt.pgB||0;const r=_t.apply(this,arguments);if(ev==='evade')g+=(B.rt.pgB||0)-g0;return r};const a=T763.atk(200);trig6=_t;T763.unforce();return Object.assign(a,{g})}""")
        rec('刺客被動迴避觸發迴避加速（T1035 單獨點時）', r2['g'] > 0, r2)
        rec('同一次攻擊迴避事件最多 1 次', r['maxPer'] <= 1, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J10S6']});T763.force({EVA:95,BLOCK:0});B.taunt=0;S.party='luna';B.ally={id:'luna',n:'露娜',hp:9999,max:9999,def:10,pw:1};const _a=allyTgt;allyTgt=()=>true;window.allyHurt=window.allyHurt||function(){};const a=T763.atk(50);allyTgt=_a;B.ally=null;T763.unforce();return a}""")
        rec('同行者代擋不算玩家迴避', r['evEv'] == 0, r)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J05S6']});B.rt.ev=-9;const out={};for(const set of [[],['SET03'],['SET08']]){T763.force({EVA:95,BLOCK:0,SETFX:set});B.p6.nx=[];B.rt.pgB=0;B.p6.set3cd=null;const g=[];for(let a=0;a<9;a++){const g0=B.rt.pgB||0;T763.atk(1);g.push((B.rt.pgB||0)-g0)}out[set.join()||'none']={g,set8:B.p6.nx.filter(n=>n.set8).length};T763.unforce()}return out}""")
        ix = [i for i, v in enumerate(r['SET03']['g']) if v]
        rec('套裝：疾風／生命 4 件迴避後行動條 +10、冷卻 2 次行動', len(ix) >= 2 and all(b - a >= 3 for a, b in zip(ix, ix[1:])) and set(r['SET03']['g']) <= {0, 10} and not any(r['none']['g']), r)
        rec('套裝：暗殺／獵人 4 件迴避後下次攻擊增傷 8%、不疊加', r['SET08']['set8'] == 1 and r['none']['set8'] == 0, r)
        rec('刺客 無頁面錯誤', not pg.errs, pg.errs[:3])
    async with page(seed=63) as pg:
        await setup_char(pg, 'cleric', 'templar', 90, 3)
        await pg.evaluate("(bt)=>{window.__BT=bt}", BATTLE); await pg.evaluate(HELP)
        r = await pg.evaluate("""()=>{T763.bt({pas:['J12S6','J12S16'],tal:{T1231:1,T1232:1,T1233:1,T1234:1,T1235:1}});B.rt.pr=-9;T763.force({BLOCK:35,EVA:0});S.mp=0;let nx=0;const _t=trig6;trig6=function(ev){const n0=B.p6?B.p6.nx.length:0;const r=_t.apply(this,arguments);if(ev==='block')nx+=B.p6.nx.length-n0;return r};const a=T763.atk(300);trig6=_t;T763.unforce();return Object.assign(a,{nx,mp:S.mp})}""")
        rec('聖殿騎士被動格擋觸發聖裁（格擋後裁決錘增傷）與格擋回魔', r['blkEv'] > 40 and r['nx'] > 0 and r['mp'] > 0, r)
        rec('聖殿騎士 無頁面錯誤', not pg.errs, pg.errs[:3])
    if out: json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
    print(sum(v['ok'] for v in R.values()), '/', len(R))
if __name__ == '__main__':
    asyncio.run(main())
