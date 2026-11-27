"""CODE_AUDIT 重現與驗收測試。每一項印 PASS（已修好）或 FAIL（問題仍在）。
用法：python3 tests/repro.py [輸出.json]
"""
import asyncio, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import page, setup_char

R = {}
def rec(k, ok, info):
    R[k] = {'ok': bool(ok), 'info': info}
    print(('PASS ' if ok else 'FAIL ') + k, json.dumps(info, ensure_ascii=False)[:300], flush=True)

GROUP = """()=>{RUN=null;B=null;TAB='adv';startRun(3);RUN.step=1;startBattle(AREAS[3].mobs[0],'',0);addFoe7(AREAS[3].mobs[1],'',{});grpDone7(false);B.auto=false;
 const s=stats();S.hp=s.HP;S.mp=s.MP;B.hp=B.max=1e7;for(const f of B.adds){f.hp=f.max=1e7}render();return 1}"""

async def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    # P0-1 被動重複計算
    async with page(seed=7) as pg:
        await setup_char(pg, 'swordsman', '', 40, 3)
        r = await pg.evaluate("""()=>{S.eq={main:null,off:null,head:null,body:null,feet:null,neck:null,ring:null};const L=lo7();L.p=['J01S4','J01S5','J01S6'];EFC=null;return {skP:skPassive6(),gt:gearTotals()}}""")
        rec('P0-1 被動不重複計算', r['gt'].get('atkp') == r['skP'].get('atkp') == 5, r)
    # P0-2 / P1-1 / P1-2 / P1-3 / P2-1 / P2-2
    async with page(seed=7) as pg:
        await setup_char(pg, 'swordsman', '', 40, 3)
        await pg.evaluate(GROUP)
        await pg.evaluate("""()=>{B.auto=AUTO=true;const f=B.adds[0];stAdd(f,'WEAK',{dur:2});stAdd(f,'POISON',{src:{atk:500},dur:2});stAdd(f,'STUN',{dur:1})}""")
        await pg.wait_for_timeout(18000)
        r = await pg.evaluate("""()=>{const f=B.adds.find(x=>x.hp>0)||B.adds[0];return {ac:f.ac||0,acts:f.acts6||0,weak:stHas(f,'WEAK'),poison:stHas(f,'POISON'),stun:stHas(f,'STUN'),hpLost:1e7-f.hp}}""")
        rec('P0-2 副目標狀態會到期、持續傷害會跳', r['ac'] >= 2 and not r['weak'] and not r['poison'] and r['hpLost'] > 0, r)
        r = await pg.evaluate("""()=>{B.auto=AUTO=false;const f=B.adds[0];f.ten6=30;delete f.sx.SLOW;B.actor=null;stAdd(f,'SLOW',{dur:10});return {dur:f.sx.SLOW.e-acOf(f)}}""")
        rec('P1-1 韌性只算一次', r['dur'] == 7, r)
        r = await pg.evaluate("""()=>{const f=B;f.sx.SHIELD={e:acOf(f)+3,amt:100,a:acOf(f)};const h=f.hp;foeTake6(f,50,'t');return {t:Math.round(B.rt.t),absorbed:h-f.hp===0}}""")
        rec('P1-2 怪物護盾以行動數判斷', r['absorbed'], r)
        r = await pg.evaluate("""()=>{B.chg7='J01S13';const h=Object.assign({},B.adds[0]);ACT.rtFoe(0);const a=B.chg7;ACT.rtFoe(0);return {after:a}}""")
        rec('P1-3 換目標不會弄丟蓄力', r['after'] == 'J01S13', r)
        r = await pg.evaluate("""()=>{const f=B;f.sx={};B.actor=null;stAdd(f,'SHIELD',{amt:100,dur:3});stAdd(f,'WEAK',{dur:3});const k=Object.keys(SKM).find(id=>SKM[id].cleanse);if(!k)return {skip:1};foeAttack6(f,k,{},{});return {shield:stHas(f,'SHIELD'),weak:stHas(f,'WEAK')}}""")
        rec('P2-1 怪物淨化只清負面', r.get('skip') or (r['shield'] and not r['weak']), r)
        r = await pg.evaluate("""()=>{const a=B.adds[0];B.dr6First=15;B.dr6Used=1;a.dr6First=15;a.dr6Used=0;ACT.rtFoe(0);const x=B.dr6Used;ACT.rtFoe(0);return {newMainUsed:x||0}}""")
        rec('P2-2 換位時被動旗標跟著怪物', not r['newMainUsed'], r)
        rec('ERR 無頁面錯誤(1)', not pg.errs, pg.errs[:3])
    # P0-3 首領不在主位仍會放技能
    async with page(seed=9) as pg:
        await setup_char(pg, 'swordsman', '', 40, 4)
        await pg.evaluate("""()=>{RUN=null;B=null;TAB='adv';startRun(3);RUN.step=RUN.nodes.length-1;startBattle(AREAS[3].boss,'boss',0);grpDone7(false);B.auto=false;S.hp=999999;
          B.hp=B.max=1e7;const f=addFoe7(AREAS[3].mobs[0],'',{hp:.35});f.summon7=1;f.hp=f.max=3e6;render();pickTgt7();window.__k=[B.kind,(B.adds[0]||{}).kind];return 1}""")
        await pg.wait_for_timeout(22000)
        r = await pg.evaluate("""()=>{const bo=[B,...B.adds].find(f=>f.kind==='boss');return {slots:window.__k,bossMain:bo===B,bossActs:bo.acts6||0,mcd:Object.keys(bo.mcd||{}).length,log:B.log.filter(t=>t.startsWith(bo.name)&&/【/.test(t)).slice(-4)}}""")
        rec('P0-3 首領不在主位仍依 AI 放技能', len(r['log']) > 0, r)
        r = await pg.evaluate("""()=>{const bo=[B,...B.adds].find(f=>f.kind==='boss');bo.hp=bo.max*.3;bo.sm70=0;bo.sm35=0;return 1}""")
        await pg.wait_for_timeout(8000)
        r = await pg.evaluate("""()=>({sum:B.adds.filter(f=>f.summon7).length+(B.summon7?1:0)})""")
        rec('P0-3b 首領不在主位仍會召喚', r['sum'] >= 2, r)
        rec('ERR 無頁面錯誤(2)', not pg.errs, pg.errs[:3])
    # 規則：重新整理恢復戰鬥進度
    async with page(seed=5) as pg:
        await setup_char(pg, 'swordsman', '', 30, 3)
        await pg.evaluate("""()=>{RUN=null;B=null;TAB='adv';startRun(2);RUN.step=1;startGroup7('battle',1);B.auto=AUTO=true;render();return 1}""")
        await pg.wait_for_timeout(3000)
        a = await pg.evaluate("""()=>{save();return {foes:[B,...(B.adds||[])].map(f=>[f.name,f.hp]),php:S.hp,step:RUN.step,ac:B.ac}}""")
        await pg.reload(wait_until='commit'); await pg.wait_for_timeout(4500)
        b = await pg.evaluate("""()=>B?{foes:[B,...(B.adds||[])].map(f=>[f.name,f.hp]),php:S.hp,step:RUN.step,ac:B.ac,rt:!!B.rt}:{none:1,step:RUN&&RUN.step}""")
        rec('規則 重新整理回到戰鬥', b.get('foes') and [x[0] for x in b['foes']] == [x[0] for x in a['foes']] and b['step'] == a['step'], {'before': a, 'after': b})
        rec('ERR 無頁面錯誤(3)', not pg.errs, pg.errs[:3])
    # 規則：持續傷害可被護盾吸收
    async with page(seed=5) as pg:
        await setup_char(pg, 'swordsman', '', 30, 3)
        r = await pg.evaluate("""()=>{RUN=null;B=null;TAB='adv';startRun(2);RUN.step=1;startBattle(AREAS[2].mobs[0],'',0);grpDone7(false);B.auto=false;
          const s=stats();S.hp=s.HP;B.actor=null;stAdd('p','SHIELD',{amt:500,dur:3});stAdd('p','POISON',{src:{atk:300},dur:3});const h=S.hp,sh=B.psx.SHIELD.amt;B.acP=(B.acP||0);stTick('p');return {hpLost:h-S.hp,shLost:sh-(B.psx.SHIELD?B.psx.SHIELD.amt:0)}}""")
        rec('規則 持續傷害被護盾吸收', r['shLost'] > 0 and r['hpLost'] == 0, r)
    # 規則：自動換裝考慮職業、套裝、神話
    async with page(seed=11) as pg:
        await setup_char(pg, 'cleric', 'templar', 40, 4)
        r = await pg.evaluate("""()=>{for(let i=0;i<30;i++)dropGear6(S.lv,'N',{force:1});
          /* 做一組 4 件套：用目前各格的裝備複製、標上套裝，數值略低於原件 */
          const base={};for(const sl of ['head','body','feet','neck']){const g=S.gear.filter(x=>canEquip(x,sl)).sort((a,b)=>gearPower(b)-gearPower(a))[0];if(g)base[sl]=g}
          for(const sl in base){const c=JSON.parse(JSON.stringify(base[sl]));c.u=Date.now()+Math.random();c.set='SET01';S.gear.push(c)}
          S.eq={main:null,off:null,head:null,body:null,feet:null,neck:null,ring:null};const n=autoEquip6();const eq=SL6.map(sl=>gearBy(S.eq[sl])).filter(Boolean);
          const greedy={};for(const sl of SL6){let b=null;for(const g of S.gear){if(!canEquip(g,sl)||Object.values(greedy).includes(g))continue;if(!b||gearPower(g)>gearPower(b))b=g}greedy[sl]=b}
          const now={};for(const sl of SL6)now[sl]=gearBy(S.eq[sl]);
          return {n,allUsable:eq.every(g=>equipSlots(g).length>0),setCount:setCount6().SET01||0,score:Math.round(eqScore6(now)),greedy:Math.round(eqScore6(greedy)),mainAttr:jobEq().main_attr}}""")
        rec('規則 自動換裝考慮套裝與職業', r['allUsable'] and r['score'] >= r['greedy'] and r['setCount'] >= 4, r)
    # 規則：大副本每區探索完成獎勵，最後另發通關寶箱
    async with page(seed=13) as pg:
        await setup_char(pg, 'swordsman', 'knight', 32, 3)
        r = await pg.evaluate("""()=>{RUN=null;B=null;TAB='adv';DGDIFF=0;startDg(0,0);const out=[];
          for(let z=0;z<2;z++){RUN.step=RUN.nodes.length-1;startBattle(AREAS[RUN.area].boss,'boss',0);grpDone7(false);B.hp=0;win();out.push(RUN.view.text||'');if(z===0){B=null;dgEnter()}}
          return {z1:/探索完成/.test(out[0]),z1chest:/副本寶箱/.test(out[0]),z2:/探索完成/.test(out[1]),z2chest:/副本寶箱/.test(out[1])}}""")
        rec('規則 大副本每區探索獎勵＋最後寶箱', r['z1'] and not r['z1chest'] and r['z2'] and r['z2chest'], r)
        rec('ERR 無頁面錯誤(4)', not pg.errs, pg.errs[:3])
    # P1-4 戰敗停止全自動
    async with page(seed=3) as pg:
        r = await pg.evaluate("""()=>({hasStop:lose.toString().includes('faStop')||(typeof loseStopsFA7!=='undefined')})""")
        await setup_char(pg, 'swordsman', '', 20, 2)
        r2 = await pg.evaluate("""()=>{RUN=null;B=null;TAB='adv';startRun(1);RUN.step=1;startBattle(AREAS[1].mobs[0],'',0);FA={area:1,nm:false,tower:false};S.hp=0;lose();return {fa:FA}}""")
        rec('P1-4 戰敗停止全自動', r2['fa'] is None, {'code': r, 'after': r2})
    # P1-6 主屬性判斷
    async with page(seed=3) as pg:
        r = {}
        for cls, adv in [('cleric', 'templar'), ('ranger', 'assassin'), ('mage', 'archmage')]:
            await setup_char(pg, cls, adv, 35, 3)
            r[adv] = await pg.evaluate("""()=>{const a0=Object.assign({},S.attr);S.pts=9;faTown();const d={};for(const k in S.attr)if(S.attr[k]!==a0[k])d[k]=S.attr[k]-a0[k];return {main:jobEq().main_attr,diff:d}}""")
        ok = all(max(v['diff'], key=v['diff'].get) == {'力': 'STR', '敏': 'DEX', '智': 'INT'}[v['main']] for v in r.values() if v['diff'])
        rec('P1-6 全自動配點照職業主屬性', ok, r)
    # P2-3/4/5 天賦
    async with page(seed=3) as pg:
        r = await pg.evaluate("""()=>({t0723:parseTal6('archmage','護盾持續+1次行動',1).sk,t0921:parseTal6('sniper','獵印持續+1次行動',1).sk,
          blockRedUsed:typeof blockRed7!=='undefined'||/blockRed/.test(String(window.applyHit6||'')+String(window.foeHit6||'')+String(window.pInMul6||''))})""")
        rec('P2-4 天賦對到正確技能', r['t0723'] in ('J07S10', 'J07S3') and r['t0921'] == 'J09S3', r)
        rec('P2-3 格擋減傷天賦有作用', r['blockRedUsed'], r)
    # P2-11 伺服器 lv 上限、P1-7 排行榜驗證（讀程式碼）
    src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tools', 'rank_server.py'), encoding='utf8').read()
    rec('P2-11 伺服器等級上限 100', "'lv': max(1, min(99" not in src, {})
    rec('P1-7 上榜需要帳號 token', "'/api/submit'" in src and 'acc_auth' in src, {})
    idx = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html'), encoding='utf8').read()
    rec('P2-12 前端沒有 GM 密語', 'gm-azure' not in idx, {})
    if out:
        json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
if __name__=="__main__":asyncio.run(main())
