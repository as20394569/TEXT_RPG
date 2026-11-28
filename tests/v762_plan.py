"""V7.6.2 弱勢職業分析：python3 tests/v762_plan.py → /tmp/v762/a_{0,1}.json
7 職業（法師、神官、大魔導士、咒術師、刺客、主教、神射手）× 三種流派配置（均衡／輸出／續戰）× 副本，無同行者、精良裝、連續探索，現行正式技能。"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.makedirs('/tmp/v762', exist_ok=True)
JOBS = [('mage', ''), ('cleric', ''), ('mage', 'archmage'), ('mage', 'warlock'), ('ranger', 'assassin'), ('cleric', 'bishop'), ('ranger', 'sniper')]
DG = {0: (30, 3), 1: (50, 5), 3: (100, 9)}
BEST = {}
for l in open('/tmp/bal/pilot.jsonl'):
    r = json.loads(l); k = r['adv'] or r['cls']; w = sum(x['res'] == 'WIN' for x in r['res']); hp = sum(x['hp'] for x in r['res']); sc = (w, -hp)
    if k not in BEST or sc > BEST[k][0]: BEST[k] = (sc, r['style'], r['tal'])
N = int(sys.argv[1]) if len(sys.argv) > 1 else 30
C = []
for c, a in JOBS:
    t = BEST[a or c][2]
    for d in ([0] if not a else [1, 3]):
        lv, area = DG[d]
        for st in ('均衡', '輸出', '續戰'):
            for s0 in range(0, N, 10):
                C.append(dict(cls=c, adv=a, lv=lv, area=area, kind='dg', arg=d, n=min(10, N - s0), chain=True, tal=t, style=st, party='none', build='opt', rar=1, knob={}, tag=st, seed=7000 + d * 31 + s0))
C.sort(key=lambda c: -c['n'] * c['lv']); S = [[], []]; L = [0, 0]
for c in C:
    i = L.index(min(L)); S[i].append(c); L[i] += c['n'] * (1 + c['lv'] / 50)
for i in range(2): json.dump(S[i], open(f'/tmp/v762/a_{i}.json', 'w'), ensure_ascii=False)
print(len(C), sum(c['n'] for c in C))
