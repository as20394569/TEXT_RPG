"""13 職業回歸：八格探索勝率、每次行動傷害、每次行動 MP、大副本一（深林礦脈）通關率。
用法：python3 tests/sim13.py OUT.json [seed] [N探索] [N副本] [職業索引,...]
"""
import asyncio, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import page, setup_char, JOBS

STEP = """()=>{if(!RUN){return 'END'}if(typeof STORY!=='undefined'&&STORY){stNext();return 'story'}if(MODAL){MODAL=null;render();return 'm'}
 if(B){if(!B.auto){B.auto=AUTO=true}__cur.cell=RUN.step;__cur.who=[B,...(B.adds||[])].map(f=>f.name).join('+');return 'B'}
 const v=RUN.view||{};if(v.type==='fork'){const o=v.opts.find(x=>x==='rest')||v.opts.find(x=>x==='battle')||v.opts[0];RUN.nodes[RUN.step+1]=o;runNext();return 'f'}
 if(v.type==='camp'){render();campPick('go');return 'c'}if(v.type==='gate'){ACT.bossGo();return 'g'}if(v.type==='ev6'){ev6Do(1);return 'e'}
 if(v.type==='event'||v.type==='shrine'||v.type==='shop'){RUN.view={type:'res',title:'',text:''};return 'e'}
 if(RUN.step>=RUN.nodes.length-1){__cur.areas.push(RUN.area);if(RUN.dg&&dgCanGo()&&dgNextArea()>=0){dgNext();return 'dg'}__cur.res='WIN';RUN=null;return 'END'}runNext();return 'n'}"""
START_RUN = """(a)=>{const s=stats();S.hp=s.HP;S.mp=s.MP;TAB='adv';RUN=null;B=null;startRun(a);window.__cur={res:'',areas:[]};return !!RUN}"""
START_DG = """()=>{const s=stats();S.hp=s.HP;S.mp=s.MP;TAB='adv';RUN=null;B=null;DGDIFF=0;startDg(0,0);window.__cur={res:'',areas:[]};return !!RUN}"""

async def run_one(pg, start, arg=None):
    ok = await pg.evaluate(start, arg) if arg is not None else await pg.evaluate(start)
    if not ok: return {'res': 'NOSTART'}
    for _ in range(2500):
        st = await pg.evaluate(STEP)
        if st == 'END': break
        await pg.wait_for_timeout(200 if st == 'B' else 25)
    return await pg.evaluate("()=>({res:__cur.res||(B?'TIMEOUT':'LOSE'),cell:__cur.cell,who:__cur.who,areas:__cur.areas})")

async def job(i, seed, nx, nd):
    cls, adv = JOBS[i]
    lv, area = (25, 2) if not adv else (45, 4)
    out = {'job': adv or cls}
    async with page(seed=seed + i, rtx=120) as pg:
        await setup_char(pg, cls, adv, lv, area)
        rs = [await run_one(pg, START_RUN, area) for _ in range(nx)]
        m = await pg.evaluate("()=>__M")
        out['explore'] = {'lv': lv, 'area': area, 'win': sum(r['res'] == 'WIN' for r in rs), 'n': nx,
                          'fails': [(r.get('cell'), r.get('who')) for r in rs if r['res'] != 'WIN'],
                          'dmg_per_act': round(m['dmg'] / max(1, m['acts']), 1), 'mp_per_act': round(m['mp'] / max(1, m['acts']), 2),
                          'acts': m['acts']}
        out['errs'] = pg.errs[:5]
    async with page(seed=seed + 100 + i, rtx=120) as pg:
        await setup_char(pg, cls, adv, 30, 3)
        rs = [await run_one(pg, START_DG) for _ in range(nd)]
        out['dungeon'] = {'lv': 30, 'd': '深林礦脈', 'win': sum(r['res'] == 'WIN' for r in rs), 'n': nd,
                          'fails': [(r.get('areas'), r.get('cell'), r.get('who')) for r in rs if r['res'] != 'WIN']}
        out['errs'] += pg.errs[:5]
    print(json.dumps(out, ensure_ascii=False), flush=True)
    return out

async def main():
    outp = sys.argv[1]; seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    nx = int(sys.argv[3]) if len(sys.argv) > 3 else 4; nd = int(sys.argv[4]) if len(sys.argv) > 4 else 2
    idx = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 else list(range(len(JOBS)))
    res = []
    for i in idx:
        res.append(await job(i, seed, nx, nd))
    json.dump(res, open(outp, 'w'), ensure_ascii=False, indent=1)
if __name__=="__main__":asyncio.run(main())
