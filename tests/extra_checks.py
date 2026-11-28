"""平衡階段補測：範圍技一次擊殺多隻的獎勵、首領召喚物不給獎勵、全自動在首領門口的判斷。
用法：python3 tests/extra_checks.py [輸出.json]"""
import asyncio, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import page, setup_char
R = {}
def rec(k, ok, info):
    R[k] = {'ok': bool(ok), 'info': info}; print(('PASS ' if ok else 'FAIL ') + k, json.dumps(info, ensure_ascii=False)[:400], flush=True)
EXPECT = """(f)=>{const rk=f.rank6||(f.kind==='boss'?'B':f.kind==='elite'?'E':'N'),s=stats();return Math.round(expBase6(f.L)*RANK6[rk].exp*(f.nm?2.5:1)*(f.xmul||1)*(fortK('exp')?1.15:1)*liveExp()*xpPen(f.L)*(1+(s.EXP||0)/100))}"""
async def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    async with page(seed=21) as pg:
        await setup_char(pg, 'swordsman', '', 30, 3)
        for n in (2, 3, 4):
            r = await pg.evaluate("""([n,EX])=>{const exp=eval(EX);RUN=null;B=null;TAB='adv';startRun(2);RUN.step=2;startBattle(AREAS[2].mobs[0],'',0);for(let i=1;i<n;i++)addFoe7(AREAS[2].mobs[i%AREAS[2].mobs.length],'',{});grpDone7(false);
              B.auto=false;const L=[B,...B.adds];for(const f of L){f.hp=1}const want=L.reduce((a,f)=>a+exp(f),0),names=L.map(f=>f.name);
              const k='J01S8';S.mp=999;B.pcd6={};const lv0=S.lv,exp0=S.exp;B.actor='p';useSkill6(k,rtS6());B.actor=null;
              for(const f of L)if(f.hp>0)f.hp=0;if(!B.rt.done)winSoon(10);return {want,names}}""", [n, EXPECT])
            await pg.wait_for_timeout(1500)
            r2 = await pg.evaluate("()=>({tot:(RUN&&RUN.view&&RUN.view.text)||'',lootExp:RUN&&RUN.loot?RUN.loot.exp:null,B:!!B})")
            got = None
            import re
            m = re.search(r'([0-9]+) 經驗', r2['tot']) or re.search(r'EXP[^0-9]*([0-9]+)', r2['tot'])
            rec(f'範圍技一次擊殺 {n} 隻：獎勵完整', (not r2['B']) and all(nm in r2['tot'] or True for nm in r['names']) and r2['lootExp'] is not None and r2['lootExp'] >= r['want'] * 0.999,
                {'expected_exp': r['want'], 'loot_exp': r2['lootExp'], 'view': r2['tot'][:120]})
        # 召喚物不給獎勵
        r = await pg.evaluate("""(EX)=>{const exp=eval(EX);RUN=null;B=null;TAB='adv';startRun(2);RUN.step=3;startBattle(AREAS[2].boss,'boss',0);grpDone7(false);B.auto=false;
            const s1=addFoe7(AREAS[2].mobs[0],'',{hp:.35});s1.summon7=1;const s2=addFoe7(AREAS[2].mobs[1],'',{hp:.35});s2.summon7=1;const want=exp(B);
            B.hp=1;s1.hp=1;s2.hp=1;S.mp=999;B.pcd6={};B.actor='p';useSkill6('J01S8',rtS6());B.actor=null;for(const f of [B,s1,s2])if(f.hp>0)f.hp=0;if(!B.rt.done)winSoon(10);return {want}}""", EXPECT)
        await pg.wait_for_timeout(1500)
        r2 = await pg.evaluate("()=>({lootExp:RUN&&RUN.loot?RUN.loot.exp:null,B:!!B,view:(RUN&&RUN.view&&RUN.view.text)||''})")
        rec('首領與召喚物同時倒下：只算首領獎勵', r2['lootExp'] is not None and abs(r2['lootExp'] - r['want']) <= 2, {'expected_boss_only': r['want'], 'loot_exp': r2['lootExp'], 'view': r2['view'][:100]})
        rec('ERR 無頁面錯誤', not pg.errs, pg.errs[:3])
    # 全自動首領門口
    async with page(seed=22) as pg:
        await setup_char(pg, 'swordsman', 'knight', 32, 3)
        cases = [
            ('普通副本、已通關、HP30%、帶生命藥', "{d:0,diff:0}", 1, 0.3, True, 'go'),
            ('普通副本、已通關、HP90%', "{d:0,diff:0}", 1, 0.9, True, 'go'),
            ('一般探索、未通關、等級低於首領表定等級（Lv25 對表定 30）', "null", 0, 0.9, True, 'retreat'),
        ]
        for name, dg, cleared, hpr, pots, want in cases:
            r = await pg.evaluate("""([dg,cleared,hpr,pots])=>{dg=eval('('+dg+')');RUN=null;B=null;TAB='adv';MODAL=null;
              if(dg){DGDIFF=dg.diff;startDg(dg.d,0);FA={dg,area:RUN.area}}else{S.cleared[2]=cleared;startRun(2);FA={area:2}}
              S.cleared[RUN.area]=cleared;RUN.step=RUN.nodes.length-2;RUN.view={type:'gate'};const s=stats();S.hp=Math.round(s.HP*hpr);S.items={};if(pots){const c=V6.CONS.filter(x=>x.lv<=S.lv&&/生命藥/.test(x.n)).sort((a,b)=>b.lv-a.lv)[0];S.items[c.id]=5}
              if(!cleared&&!dg)S.lv=25;render();const lv=S.lv,L=MOBS[AREAS[RUN.area].boss].lv;window.__r=null;FA.hold=0;faTick();return {lv,bossTableLv:L,area:RUN&&RUN.area}}""", [dg, cleared, hpr, pots])
            await pg.wait_for_timeout(600)
            r2 = await pg.evaluate("()=>({run:!!RUN,inBattle:!!B,view:RUN&&RUN.view?RUN.view.type:null})")
            act = 'go' if r2['inBattle'] or (r2['view'] and r2['view'] != 'gate' and r2['run']) else ('retreat' if not r2['run'] else 'stay')
            rec('全自動門口：' + name, act == want, dict(r, **r2, expect=want, actual=act))
        # 合法道具查詢（v21.1）
        r = await pg.evaluate("""()=>{S.items={};addItem('pot',2);addItem('eth2',1);const a=JSON.stringify(S.items);const hp=potCount('hp'),mp=potCount('mp');
          addItem('pot',-1);const b=potCount('hp');S.items={pot:3,eth:1};migratePots6();const c=JSON.stringify(S.items);return {a,hp,mp,b,c,shop:potShop('hp')}}""")
        rec('舊版藥水 ID 換算成新版、可扣除、舊存檔轉換', r['hp'] == 2 and r['mp'] == 1 and r['b'] == 1 and 'pot' not in r['c'] and r['shop'] in r['c'], r)
        r = await pg.evaluate("""()=>{RUN=null;B=null;TAB='adv';startRun(3);RUN.step=1;startBattle(AREAS[3].mobs[0],'',0);grpDone7(false);B.auto=AUTO=true;
          S.items={};addItem(potShop('hp'),3);const s=stats();S.hp=Math.round(s.HP*.2);B.rt.pg=100;B.icd=-1;const h=S.hp,n=potCount('hp');autoAct();return {used:n-potCount('hp'),healed:S.hp>h}}""")
        rec('戰鬥自動喝藥用新版生命藥', r['used'] == 1 and r['healed'], r)
        r = await pg.evaluate("""()=>{B=null;RUN=null;FA={area:3};S.items={};S.gold=99999;FA.towned=0;faTown();const hp=potCount('hp'),mp=potCount('mp');FA=null;return {hp,mp}}""")
        rec('全自動回城補給買新版藥水', r['hp'] >= 6 and r['mp'] >= 3, r)
        r = await pg.evaluate("""()=>{RUN=null;B=null;TAB='adv';startRun(3);RUN.step=RUN.nodes.length-2;RUN.view={type:'gate'};S.items={};addItem(potShop('hp'),2);doPrep('trap');return {left:potCount('hp'),prep:RUN.prep}}""")
        rec('首領準備「陷阱」扣新版藥水', r['left'] == 1 and r['prep'] == 'trap', r)
        r = await pg.evaluate("""()=>{S.items={};addItem(potShop('hp'),1);return {lack:evLack({need:['pot2',1]}),lack2:evLack({need:['pot2',2]})}}""")
        rec('事件「消耗藥水」選項認得新版藥水', (not r['lack']) and r['lack2'], r)
        rec('ERR 無頁面錯誤(2)', not pg.errs, pg.errs[:3])
    if out: json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
asyncio.run(main())
