"""V7.6.1 候選技能模擬設定：python3 tests/c761_plan.py → /tmp/c761/c_{0,1}.json
每職業：現行 vs 候選（同一套配置：候選主動技優先放入、候選被動放入），露娜同行／無同行，精良裝，連續探索。"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import JOBS
os.makedirs('/tmp/c761', exist_ok=True)
DG = {0: (30, 3), 1: (50, 5), 3: (100, 9)}
BEST = {}
for l in open('/tmp/bal/pilot.jsonl'):
    r = json.loads(l); k = r['adv'] or r['cls']; w = sum(x['res'] == 'WIN' for x in r['res']); hp = sum(x['hp'] for x in r['res']); sc = (w, -hp)
    if k not in BEST or sc > BEST[k][0]: BEST[k] = (sc, r['style'], r['tal'])
N = int(sys.argv[1]) if len(sys.argv) > 1 else 20
C = []
for c, a in JOBS:
    st, t = BEST[a or c][1:]
    for d in ([0] if not a else [1, 3]):
        lv, area = DG[d]
        for party in ('luna', 'none'):
            for var in ('現行', '候選'):
                for s0 in range(0, N, 10):
                    C.append(dict(cls=c, adv=a, lv=lv, area=area, kind='dg', arg=d, n=min(10, N - s0), chain=True, tal=t, style=st, party=party, build='opt', rar=1, loadC=True,
                                  knob={'c761': 1} if var == '候選' else {}, tag=var, seed=5000 + d * 31 + s0))
C.sort(key=lambda c: -c['n'] * c['lv']); S = [[], []]; L = [0, 0]
for c in C:
    i = L.index(min(L)); S[i].append(c); L[i] += c['n'] * (1 + c['lv'] / 50)
for i in range(2): json.dump(S[i], open(f'/tmp/c761/c_{i}.json', 'w'), ensure_ascii=False)
print(len(C), sum(c['n'] for c in C))
