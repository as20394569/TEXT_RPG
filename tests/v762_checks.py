"""v21.4 既有 Bug 修正回歸：J13S15 連擊回魔每行動間隔一次、露娜說明與實際一致。
用法：python3 tests/v762_checks.py [輸出.json]"""
import asyncio, json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import page, setup_char
from v761_checks import BATTLE
R = {}
def rec(k, ok, info):
    R[k] = {'ok': bool(ok), 'info': info}; print(('PASS ' if ok else 'FAIL ') + k, json.dumps(info, ensure_ascii=False)[:400], flush=True)
async def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    async with page(seed=51) as pg:
        await setup_char(pg, 'swordsman', 'dual', 70, 3)
        r = await pg.evaluate("""(BT)=>{const bt=eval(BT);const run=(pas,nt)=>{bt({pas,not:nt||[]});S.mp=0;const m=[];for(let a=0;a<4;a++){const m0=S.mp;onCombo7();onCombo7();onCombo7();m.push(S.mp-m0);pPost7()}return m};
          return {one:Math.max(1,Math.round(stats().MP*.01)),on:run(['J13S15']),off:run([],['J13S15'])}}""", BATTLE)
        rec('J13S15 每個行動間隔回魔 1 次（不再每場只有 1 次）', r['on'] == [r['one']] * 4, r)
        rec('J13S15 同一行動連擊 3 次只回 1 次', all(x == r['one'] for x in r['on']), r)
        rec('J13S15 未放入被動欄不回魔', r['off'] == [0] * 4, r)
        r = await pg.evaluate("()=>({L:Object.fromEntries(Object.entries(LUNASK).map(([k,v])=>[k,v.d])),act:allyAct.toString(),mk:mkAlly.toString()})")
        L, act, mk = r['L'], r['act'], r['mk']
        rec('露娜誓約說明 7.5% 與實際一致', '7.5%' in L['oath'] and 's.HP*.075' in act and '15%' not in L['oath'], {'d': L['oath']})
        rec('露娜治癒術說明 10%、冷卻 3 次行動與實際一致', '10%' in L['heal'] and '3 次' in L['heal'] and 'heal:.1*bond' in mk and 'A.cd=3' in act and '秒' not in L['heal'], {'d': L['heal']})
        rec('露娜魔法護盾冷卻 4 次行動與實際一致', '4 次' in L['ward'] and 'A.cd2=4' in act and '秒' not in L['ward'], {'d': L['ward']})
        rec('露娜驅散術冷卻 4 次、削弱 2 回合與實際一致', '4 次' in L['clear'] and '2 回合' in L['clear'] and 'A.cd3=4' in act and 'weak||0,2)' in act and '秒' not in L['clear'], {'d': L['clear']})
        rec('露娜火球術說明與觸發條件一致', '3 次' in L['flame'] and 'B.turn%3===0' in act, {'d': L['flame']})
        rec('無頁面錯誤', not pg.errs, pg.errs[:3])
    if out: json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
    print(sum(v['ok'] for v in R.values()), '/', len(R))
if __name__ == '__main__':
    asyncio.run(main())
