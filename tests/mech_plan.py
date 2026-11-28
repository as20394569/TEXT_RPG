"""強敵機制候選測試設定（只在模擬器）。
python3 tests/mech_plan.py → /tmp/mech/m_{0,1}.json
機制：A 狂暴、B 中段強敵加隨從、C 首領 50% 預告強力技；組合 A/B/C/AB/AC/BC 與現行對照。
配置：auto＝試跑最佳流派＋遊戲內建自動反應；boss＝續戰流派＋看到預告必擋（react=1）。"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import JOBS
os.makedirs('/tmp/mech', exist_ok=True)
DG = {0: (30, 3), 1: (50, 5), 3: (100, 9)}
BEST = {}
for l in open('/tmp/bal/pilot.jsonl'):
    r = json.loads(l); k = r['adv'] or r['cls']; w = sum(x['res'] == 'WIN' for x in r['res']); hp = sum(x['hp'] for x in r['res']); sc = (w, -hp)
    if k not in BEST or sc > BEST[k][0]: BEST[k] = (sc, r['style'], r['tal'])
MECH = {'現行': {}, 'A': {'mechA': 1}, 'B': {'mechB': 1}, 'C': {'mechC': 1}, 'AB': {'mechA': 1, 'mechB': 1}, 'AC': {'mechA': 1, 'mechC': 1}, 'BC': {'mechB': 1, 'mechC': 1}}
C = []
def add(c, a, d, mk, n, cfgk, party='luna', gear='rar1', seed=0):
    lv, area = DG[d]; st, t = BEST[a or c][1:]
    kn = dict(MECH[mk]); o = dict(cls=c, adv=a, lv=lv, area=area, kind='dg', arg=d, n=n, chain=True, tal=t, party=party, tag=mk, cfg=cfgk, gear=gear, seed=seed)
    if cfgk == 'boss': o['style'] = '續戰'; kn['react'] = 1
    else: o['style'] = st
    if gear == 'part': o.update(build='auto', drops=10, rar=None)
    else: o.update(build='opt', rar={'rar0': 0, 'rar1': 1, 'rar2': 2}[gear])
    o['knob'] = kn; C.append(o)
for c, a in JOBS:
    for d in ([0] if not a else [1, 3]):
        for mk in MECH:
            s = 3000 + d * 7
            add(c, a, d, mk, 10, 'auto', seed=s); add(c, a, d, mk, 10, 'boss', seed=s)
            add(c, a, d, mk, 5, 'auto', party='none', seed=s + 1); add(c, a, d, mk, 5, 'boss', party='none', seed=s + 1)
            add(c, a, d, mk, 5, 'auto', party='gale', seed=s + 2)
            for g in ('rar0', 'rar2', 'part'): add(c, a, d, mk, 5, 'auto', gear=g, seed=s + 3)
C.sort(key=lambda c: -c['n'] * c['lv']); S = [[], []]; L = [0, 0]
for c in C:
    i = L.index(min(L)); S[i].append(c); L[i] += c['n'] * (1 + c['lv'] / 50)
for i in range(2): json.dump(S[i], open(f'/tmp/mech/m_{i}.json', 'w'), ensure_ascii=False)
print(len(C), sum(c['n'] for c in C))
