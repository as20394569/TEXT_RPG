"""產生平衡測試的設定檔。
python3 tests/balance_plan.py pilot  → /tmp/bal/pilot_{0,1}.json
python3 tests/balance_plan.py main PILOT.jsonl → /tmp/bal/main_{0,1}.json
python3 tests/balance_plan.py gear PILOT.jsonl → /tmp/bal/gear_{0,1}.json"""
import json, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import JOBS
os.makedirs('/tmp/bal', exist_ok=True)
ZN = [(1,10),(11,20),(21,30),(31,40),(41,50),(51,60),(61,70),(71,80),(81,90),(91,100)]
DGLV = [30, 50, 80, 100]
CAND = {'grp': [0.85, 0], 'elite_add': [0.75, 1], 'mid_add': [0.75, 1], 'boss_add': [0.75, 1], 'summon': [0.65, 1]}
def jid(c, a): return a or c
def shard(cfgs, name, k=2):
    cfgs.sort(key=lambda c: -c['n'] * (2 if c['kind'] == 'dg' else 1))
    S = [[] for _ in range(k)]; load = [0] * k
    for c in cfgs:
        i = load.index(min(load)); S[i].append(c); load[i] += c['n'] * (2.5 if c['kind'] == 'dg' else 1)
    for i in range(k): json.dump(S[i], open(f'/tmp/bal/{name}_{i}.json', 'w'), ensure_ascii=False)
    print(name, [len(s) for s in S], [round(l) for l in load])
def explore_cells(adv):
    zs = [0, 1, 2] if not adv else list(range(3, 10))
    n = math.ceil(100 / len(zs))
    return [(z, round((ZN[z][0] + ZN[z][1]) / 2), n) for z in zs]
def dungeon_cells(adv):
    return [(0, 30, 100)] if not adv else [(d, DGLV[d], 25) for d in range(4)]
def best(pilot):
    R = {}
    for l in open(pilot):
        r = json.loads(l); k = jid(r['cls'], r['adv']); w = sum(x['res'] == 'WIN' for x in r['res']); hp = sum(x['hp'] for x in r['res'])
        sc = (w, -hp)
        if k not in R or sc > R[k][0]: R[k] = (sc, r['style'], r['tal'])
    return {k: (v[1], v[2]) for k, v in R.items()}
mode = sys.argv[1]
if mode == 'pilot':
    C = []
    for c, a in JOBS:
        for st in ['均衡', '輸出', '續戰']:
            for t in [0, 1, 2]:
                C.append(dict(cls=c, adv=a, lv=30, area=3, build='opt', rar=2, style=st, tal=t, kind='dg', arg=0, n=12, seed=7))
    shard(C, 'pilot')
elif mode in ('main', 'gear'):
    B = best(sys.argv[2]); C = []
    for c, a in JOBS:
        st, t = B[jid(c, a)]
        builds = [('auto', None), ('opt', 1)] if mode == 'main' else [('opt', 0), ('opt', 2), ('opt', 3)]
        nmul = 1 if mode == 'main' else 0.3
        for bd, rar in builds:
            for cand in [None, CAND]:
                tag = ('cand' if cand else 'orig')
                for z, lv, n in explore_cells(a):
                    nn = max(5, round(n * nmul))
                    for ch in range(0, nn, 10):
                        C.append(dict(cls=c, adv=a, lv=lv, area=z, build=bd, rar=rar, style=st if bd == 'opt' else '均衡', tal=t if bd == 'opt' else None,
                                      kind='ex', arg=z, n=min(10, nn - ch), seed=1000 + z * 37 + ch, cand=cand, tag=tag))
                for d, lv, n in dungeon_cells(a):
                    nn = max(5, round(n * nmul))
                    for ch in range(0, nn, 10):
                        C.append(dict(cls=c, adv=a, lv=lv, area=min(9, [3, 5, 8, 9][d]), build=bd, rar=rar, style=st if bd == 'opt' else '均衡', tal=t if bd == 'opt' else None,
                                      kind='dg', arg=d, n=min(10, nn - ch), seed=5000 + d * 53 + ch, cand=cand, tag=tag))
    shard(C, mode)
