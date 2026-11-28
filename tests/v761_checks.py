"""v21.3（V7.6.1）既有 Bug 修正回歸測試：J12S16 觸發間隔、J09S14 穿刺穿透、統一吸血、T0532 明確映射。
用法：python3 tests/v761_checks.py [輸出.json]"""
import asyncio, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import page, setup_char
R = {}
def rec(k, ok, info):
    R[k] = {'ok': bool(ok), 'info': info}; print(('PASS ' if ok else 'FAIL ') + k, json.dumps(info, ensure_ascii=False)[:500], flush=True)
BATTLE = """(o)=>{RUN=null;B=null;TAB='adv';MODAL=null;startRun(o.area||3);RUN.step=1;startBattle(AREAS[o.area||3].mobs[0],'',0);for(let i=0;i<(o.adds||0);i++)addFoe7(AREAS[o.area||3].mobs[(i+1)%AREAS[o.area||3].mobs.length],'',{});grpDone7(false);
  B.auto=AUTO=false;B.p6={nx:[],once:{},tcd:0,seq:[],third:{},mpUse:0};B.pcd6={};const L=lo7(),own=o.pas||[],not=(o.not||[]).concat(own);L.p=own.concat(jobSk6(null,false).map(k=>k.id).filter(k=>skOk6(k)&&!not.includes(k))).slice(0,3);S.tal=o.tal||{};EFC=null;for(const f of [B,...(B.adds||[])]){f.hp=f.max=9e7}return {pas:L.p,eff:effs6().map(e=>e.k+':'+e.from)}}"""
def expect_counter(th, acts, blocks_per_act=2, cd=1):
    """Python 參考模型：每行動格擋 blocks_per_act 次，回傳觸發的行動序號"""
    out = []; cntT = None; red = 0; n = 0
    for a in range(acts):
        for _ in range(blocks_per_act):
            c = max(0, cd - red)
            if cntT is not None and cntT + c + 1 > a: continue
            cntT = a; red = 0; n += 1
            if th and n % th == 0: red = 1
            out.append(a)
    return out
async def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    # ---------- 1 J12S16／J05S15／J10S16 觸發間隔 ----------
    for cls, adv, lv, pid, ev, tal in [('cleric', 'templar', 90, 'J12S16', 'block', {'T1231': 1, 'T1232': 1, 'T1233': 1}), ('swordsman', 'knight', 69, 'J05S15', 'block', {'T0531': 1, 'T0532': 1, 'T0533': 1}), ('ranger', 'assassin', 90, 'J10S16', 'evade', {})]:
        async with page(seed=31) as pg:
            await setup_char(pg, cls, adv, lv, 3)
            r = await pg.evaluate("""([BT,pid,ev,tal])=>{const bt=eval(BT);const s=stats(),f=ev==='block'?onBlock6:onEvade6;const g=[];
              const run=(pas,tl,nt)=>{bt({pas,tal:tl,not:nt||[]});S.mp=0;const m=[];for(let a=0;a<3;a++){const m0=S.mp;f();f();f();m.push(S.mp-m0);B.acP++}return m};
              return {MP:s.MP,one:Math.round(s.MP*.01),withPas:run([pid],{}),noPas:run([],{},[pid]),withTal:run([pid],tal),talOnly:run([],tal,[pid])}}""", [BATTLE, pid, ev, tal])
            one = r['one']
            rec(f'{pid} 同一行動格擋／迴避 3 次只回魔 1 次', r['withPas'] == [one] * 3, r)
            rec(f'{pid} 未放入被動欄不回魔', r['noPas'] == [0, 0, 0], {'noPas': r['noPas']})
            if tal:
                t1 = r['talOnly'][0]
                rec(f'{pid} 天賦格擋回魔照原規則（2 次自身行動共用觸發冷卻），與被動間隔各自獨立', t1 > 0 and r['withTal'] == [one + x for x in r['talOnly']], {'talOnly': r['talOnly'], 'withTal': r['withTal'], 'withPas': r['withPas']})
            rec(f'{pid} 無頁面錯誤', not pg.errs, pg.errs[:3])
    # ---------- 2 J09S14／J03S14 穿刺穿透 ----------
    for cls, adv, lv, pid, sk in [('ranger', 'sniper', 80, 'J09S14', 'J09S2'), ('ranger', '', 30, 'J03S14', 'J03S2')]:
        async with page(seed=32) as pg:
            await setup_char(pg, cls, adv, lv, 3)
            r = await pg.evaluate("""([BT,pid,sk])=>{const bt=eval(BT);bt({pas:[pid]});const base=baseSk7().id;
              const pen=[];const _h=hitFoe;hitFoe=function(st,p,o){pen.push({st,pen:(o&&o.pen)||0});return _h.apply(this,arguments)};
              const cast=k=>{pen.length=0;S.mp=9999;B.pcd6={};B.actor='p';useSkill6(k,rtS6());B.actor=null;return pen[0]};
              const on={skill:cast(sk),base:cast(base),PEN:stats().PEN,p7:pierce7(sk)};
              bt({pas:[],not:[pid]});const off={skill:cast(sk),base:cast(base),PEN:stats().PEN,p7:pierce7(sk)};
              bt({pas:[pid]});const _t=dmgTag6;dmgTag6=()=>'SLASH';const slash={skill:cast(sk),p7:pierce7(sk)};dmgTag6=_t;
              SK.__M=Object.assign({},SK[sk],{id:'__M',s:'MAG',dmg:{s:'MAG',p:1,h:1}});const mag=pierce7('__M');delete SK.__M;
              hitFoe=_h;return {on,off,slash,mag,tag:dmgTag6(sk)}}""", [BATTLE, pid, sk])
            d = r['on']['skill']['pen'] - r['off']['skill']['pen']
            rec(f'{pid} 適用技能（物理＋穿刺標籤 {sk}）穿透 +5', d == 5 and r['on']['p7'] == 5, r)
            rec(f'{pid} 基礎技（弓＝穿刺）也套用 +5', r['on']['base']['pen'] - r['off']['base']['pen'] == 5, {'on': r['on']['base'], 'off': r['off']['base']})
            rec(f'{pid} 不再無條件加到角色穿透屬性', r['on']['PEN'] == r['off']['PEN'], {'PEN_on': r['on']['PEN'], 'PEN_off': r['off']['PEN']})
            rec(f'{pid} 不適用技能（非穿刺傷害標籤）不套用', r['slash']['p7'] == 0 and r['slash']['skill']['pen'] == r['off']['skill']['pen'], r['slash'])
            rec(f'{pid} 魔法傷害不套用', r['mag'] == 0, {'mag': r['mag']})
            rec(f'{pid} 無頁面錯誤', not pg.errs, pg.errs[:3])
    # ---------- 3 統一吸血 ----------
    async with page(seed=33) as pg:
        await setup_char(pg, 'swordsman', 'berserker', 100, 3)
        LS = """(BT,o)=>{const bt=eval(BT);bt(o);const s0=stats();S.hp=Math.round(s0.HP*(o.hpr||0.2));const ds=[];const _h=hitFoe;hitFoe=function(){const r=_h.apply(this,arguments);if(o.big)r.d=o.big;ds.push(r.d);return r};
          const s=Object.assign(rtS6(),o.s||{});const h0=S.hp;S.mp=9999;B.pcd6={};B.actor='p';useSkill6(o.k,s);B.actor=null;hitFoe=_h;const tot=ds.reduce((a,b)=>a+b,0);
          return {heal:S.hp-h0,ds,tot,HP:s0.HP,healIn:healInM6(),fxHeal:B.fx.heal||0,log:B.log.slice(-1)[0]}}"""
        J = lambda o: pg.evaluate(f"([BT,o])=>({LS})(BT,o)", [BATTLE, dict({'not': ['J06S15']}, **o)])
        a = await J({'k': 'J06S3', 'pas': []})
        b = await J({'k': 'J06S3', 'pas': ['J06S15']})
        ea = min(round(a['HP'] * .1), round(a['tot'] * .2 * a['healIn'])); eb = min(round(b['HP'] * .1), round(b['tot'] * .2 * 1.15 * b['healIn']))
        rec('嗜血斬吸血 20%（無加成）', a['heal'] == ea, dict(a, expect=ea))
        rec('嗜血斬吃到吸血強化 J06S15（+15%）', b['heal'] == eb and b['heal'] > 0, dict(b, expect=eb))
        c = await J({'k': 'J06S12', 'pas': ['J06S15']}); ec = min(round(c['HP'] * .1), round(c['tot'] * .15 * 1.15 * c['healIn']))
        rec('吸血斧（表上吸血 15%）同一流程＋加成', c['heal'] == ec, dict(c, expect=ec))
        d = await J({'k': 'J06S3', 'pas': ['J06S15'], 'big': 10 ** 6})
        rec('單次施放吸血上限最大HP 10%', d['heal'] == round(d['HP'] * .1), dict(d, expect=round(d['HP'] * .1)))
        e = await J({'k': 'J06S7', 'pas': [], 'adds': 3, 's': {'LS': 10}})
        ee = min(round(e['HP'] * .1), round(e['tot'] * .10 * e['healIn']))
        rec('範圍技：4 個目標傷害合計後只吸一次（裝備吸血 10%）', len(e['ds']) == 4 and e['heal'] == ee, dict(e, expect=ee))
        for _ in range(40):
            f = await J({'k': 'J06S3', 'pas': [], 's': {'DOUBLE': 100}})
            if '連擊' in (f['log'] or ''): break
        ef = min(round(f['HP'] * .1), round(f['ds'][0] * .2 * f['healIn']))
        rec('連擊追加傷害不吸血', f['heal'] == ef and '連擊' in (f['log'] or ''), dict(f, expect=ef))
        g = await J({'k': 'J06S3', 'pas': ['J06S15'], 'tal': {'T0625': 1}, 'hpr': .2})
        eg = min(round(g['HP'] * .1), round(g['tot'] * .2 * 1.15 * g['healIn'])) + round(g['HP'] * .05)
        rec('T0625 低血回血是百分比治療：另加最大HP 5%，不吃吸血加成、不佔吸血上限', g['heal'] == eg, dict(g, expect=eg))
        g2 = await J({'k': 'J06S3', 'pas': [], 'tal': {'T0625': 1}, 'hpr': .5})
        eg2 = min(round(g2['HP'] * .1), round(g2['tot'] * .2 * g2['healIn']))
        rec('T0625 HP 高於 30% 不觸發', g2['heal'] == eg2, dict(g2, expect=eg2))
        rec('吸血 無頁面錯誤', not pg.errs, pg.errs[:3])
    async with page(seed=34) as pg:
        await setup_char(pg, 'mage', 'warlock', 100, 3)
        LS = """(BT,o)=>{const bt=eval(BT);bt(o);const s0=stats();S.hp=Math.round(s0.HP*(o.hpr||0.2));const ds=[];const _h=hitFoe;hitFoe=function(){const r=_h.apply(this,arguments);ds.push(r.d);return r};
          const s=Object.assign(rtS6(),o.s||{});const h0=S.hp;S.mp=9999;B.pcd6={};B.actor='p';useSkill6(o.k,s);B.actor=null;hitFoe=_h;return {heal:S.hp-h0,tot:ds.reduce((a,b)=>a+b,0),HP:s0.HP,healIn:healInM6()}}"""
        J = lambda o: pg.evaluate(f"([BT,o])=>({LS})(BT,o)", [BATTLE, dict({'not': ['J08S15']}, **o)])
        a = await J({'k': 'J08S3', 'pas': []}); b = await J({'k': 'J08S3', 'pas': ['J08S15']})
        ea = min(round(a['HP'] * .1), round(a['tot'] * .1 * a['healIn'])); eb = min(round(b['HP'] * .1), round(b['tot'] * .1 * 1.15 * b['healIn']))
        rec('噬魂吸血 10%（無加成）', a['heal'] == ea, dict(a, expect=ea))
        rec('噬魂吃到噬魂精通 J08S15（+15%）', b['heal'] == eb and b['heal'] > 0, dict(b, expect=eb))
        c = await J({'k': 'J08S3', 'pas': ['J08S15'], 'tal': {'T0824': 1}, 'hpr': .2}); ec = min(round(c['HP'] * .1), round(c['tot'] * .1 * 1.20 * c['healIn']))
        rec('T0824 HP 低於 40% 噬魂治療 +5%（與吸血加成相加）', c['heal'] == ec, dict(c, expect=ec))
        rec('噬魂 無頁面錯誤', not pg.errs, pg.errs[:3])
    async with page(seed=35) as pg:
        await setup_char(pg, 'cleric', '', 30, 3)
        r = await pg.evaluate("""(BT)=>{const bt=eval(BT);bt({pas:[]});const s=stats();S.hp=Math.round(s.HP*.3);const h0=S.hp;S.mp=999;B.pcd6={};B.actor='p';useSkill6('J04S3',rtS6());B.actor=null;
          return {heal:S.hp-h0,exp:Math.round((s.HP*.08+rtS6().MAG*.5)*(1+Math.min(30,rtS6().HEALP||0)/100)*(1+(skmLv6('J04S3')-1)/100)*healInM6())}}""", BATTLE)
        rec('百分比治療（祈癒）不走吸血流程、數值不變', abs(r['heal'] - r['exp']) <= 1, r)
    # ---------- 4 T0532 ----------
    async with page(seed=36) as pg:
        await setup_char(pg, 'swordsman', 'knight', 60, 3)
        for lvl in (0, 1, 2, 3):
            r = await pg.evaluate("""([BT,lvl,txt])=>{const bt=eval(BT);if(txt)V6.TAL.find(t=>t.id==='T0532').fx=txt;bt({pas:['J05S6'],tal:lvl?{T0531:1,T0532:lvl}:{}});const acts=[];
              const _h=hitFoe;hitFoe=function(st,p,o){if(o&&o.sure&&B.actor!=='p')acts.push(B.acP||0);return _h.apply(this,arguments)};
              for(let a=0;a<16;a++){onBlock6();onBlock6();B.acP++}hitFoe=_h;const e=effs6().filter(e=>e.from==='T0532');return {acts,eff:e}}""", [BATTLE, lvl, None])
            want = expect_counter([None, 4, 3, 2][lvl], 16)
            rec(f'T0532 {"未點" if not lvl else "Lv" + str(lvl)}：反制觸發行動序列符合 {["無", "4", "3", "2"][lvl]} 次門檻、冷卻最低 0', r['acts'] == want, dict(r, expect=want))
        r = await pg.evaluate("""([BT])=>{const bt=eval(BT);V6.TAL.find(t=>t.id==='T0532').fx='反制每累計觸發4次，剩餘冷卻減1次；每級門檻減1（最低2次）';bt({pas:['J05S6'],tal:{T0532:1}});return effs6().filter(e=>e.from==='T0532')}""", [BATTLE])
        rec('T0532 換成 V7.6 新文字仍以 ID 生效（不依賴文字解析）', r and r[0]['k'] == 'counterCdn' and r[0]['sk'] == 'J05S6' and r[0]['th'] == 4, r)
        r = await pg.evaluate("""([BT])=>{const bt=eval(BT);bt({pas:[],not:['J05S6'],tal:{T0532:3}});let n=0;const _h=hitFoe;hitFoe=function(st,p,o){if(o&&o.sure)n++;return _h.apply(this,arguments)};for(let a=0;a<6;a++){onBlock6();B.acP++}hitFoe=_h;return n}""", [BATTLE])
        rec('T0532 沒放 J05S6 反制：不觸發任何反擊', r == 0, {'counters': r})
        r = await pg.evaluate("""([BT])=>{const bt=eval(BT);bt({pas:['J05S6'],tal:{T0532:3}});B.pcd6={J05S3:B.acP+5};S.mp=999;B.actor='p';useSkill6('J05S3',rtS6());B.actor=null;return {cd:B.pcd6.J05S3-B.acP}}""", [BATTLE])
        rec('T0532 不再影響主動技冷卻（skcdn 路徑已拆開）', r['cd'] == 5, r)
        rec('T0532 無頁面錯誤', not pg.errs, pg.errs[:3])
    if out: json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
    print(sum(v['ok'] for v in R.values()), '/', len(R))
if __name__ == '__main__':
    asyncio.run(main())
