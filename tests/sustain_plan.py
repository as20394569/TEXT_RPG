"""續航與前期難度測試設定。
python3 tests/sustain_plan.py grass            → /tmp/sus/grass_{0,1}.json
python3 tests/sustain_plan.py screen           → /tmp/sus/screen_{0,1}.json
python3 tests/sustain_plan.py full K1,K2,...   → /tmp/sus/full_{0,1}.json（K 為組合代號）"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import JOBS
os.makedirs('/tmp/sus', exist_ok=True)
ZN = [(1,10),(11,20),(21,30),(31,40),(41,50),(51,60),(61,70),(71,80),(81,90),(91,100)]
DGLV = [30, 50, 80, 100]
BEST = {}
for l in open('/tmp/bal/pilot.jsonl'):
    r = json.loads(l); k = r['adv'] or r['cls']; w = sum(x['res'] == 'WIN' for x in r['res']); hp = sum(x['hp'] for x in r['res']); sc = (w, -hp)
    if k not in BEST or sc > BEST[k][0]: BEST[k] = (sc, r['style'], r['tal'])
COMBOS = {
    '現行': {},
    'L7': {'luna': .7}, 'L5': {'luna': .5}, 'W5': {'win': .5}, 'W0': {'win': 0}, 'R5': {'regen': .5}, 'U5': {'lvl': .5},
    'L5W0': {'luna': .5, 'win': 0}, 'L5R5': {'luna': .5, 'regen': .5}, 'W0R5': {'win': 0, 'regen': .5},
    'L7W5U5': {'luna': .7, 'win': .5, 'lvl': .5}, 'L7W0R5U5': {'luna': .7, 'win': 0, 'regen': .5, 'lvl': .5}, 'L5W0R5U5': {'luna': .5, 'win': 0, 'regen': .5, 'lvl': .5},
    'L7W5R5': {'luna': .7, 'win': .5, 'regen': .5}, 'L5W5R5U5': {'luna': .5, 'win': .5, 'regen': .5, 'lvl': .5},
}
GRASS = {'現行': {}, 'A85': {'z0Atk': .85}, 'A75': {'z0Atk': .75}, 'H50': {'z0Hp': .5 / .6}, 'A85H50': {'z0Atk': .85, 'z0Hp': .5 / .6}, 'A75H50': {'z0Atk': .75, 'z0Hp': .5 / .6}}
def job(c, a, **kw):
    st, t = BEST[a or c][1:]
    d = dict(cls=c, adv=a, build='opt', rar=1, style=st, tal=t); d.update(kw); return d
def shard(C, name, k=2):
    C.sort(key=lambda c: -c['n'] * (2.5 if c['kind'] == 'dg' else 1))
    S = [[] for _ in range(k)]; L = [0] * k
    for c in C:
        i = L.index(min(L)); S[i].append(c); L[i] += c['n'] * (2.5 if c['kind'] == 'dg' else 1)
    for i in range(k): json.dump(S[i], open(f'/tmp/sus/{name}_{i}.json', 'w'), ensure_ascii=False)
    print(name, len(C), [round(x) for x in L])
mode = sys.argv[1]; C = []
if mode == 'grass':
    for c, a in JOBS[:4]:
        for gk, kn in GRASS.items():
            for bd in ['opt', 'auto']:
                for ch in range(10):  # 獨立趟：Lv5，每 10 趟一個種子
                    C.append(job(c, a, build=bd, rar=1 if bd == 'opt' else None, lv=5, area=0, kind='ex', arg=0, n=10, seed=200 + ch, knob=kn, tag='g_' + gk, party='none', mode='ind'))
                for ch in range(5):  # 連續：從 Lv2 打 10 趟
                    C.append(job(c, a, build=bd, rar=1 if bd == 'opt' else None, lv=2, area=0, kind='ex', arg=0, n=10, seed=300 + ch, knob=kn, tag='g_' + gk, party='none', chain=True, mode='chain'))
elif mode == 'screen':
    for c, a in JOBS:
        for ck, kn in COMBOS.items():
            if not a:
                C.append(job(c, a, lv=21, area=2, kind='ex', arg=2, n=8, seed=400, knob=kn, tag=ck, chain=True, mode='chain'))
                C.append(job(c, a, lv=30, area=3, kind='dg', arg=0, n=8, seed=500, knob=kn, tag=ck, chain=True, mode='chain'))
            else:
                for z in (3, 6, 9):
                    C.append(job(c, a, lv=ZN[z][0], area=z, kind='ex', arg=z, n=4, seed=400 + z, knob=kn, tag=ck, chain=True, mode='chain'))
                for d in range(4):
                    C.append(job(c, a, lv=DGLV[d], area=[3, 5, 8, 9][d], kind='dg', arg=d, n=3, seed=500 + d, knob=kn, tag=ck, chain=True, mode='chain'))
elif mode == 'full':
    keys = sys.argv[2].split(',')
    for c, a in JOBS:
        for ck in keys:
            kn = COMBOS[ck]
            # 升級前後（連續，從區域下限開始），露娜同行
            zs = [1, 2] if not a else list(range(3, 10))
            per = 100 // len(zs) + 1
            for z in zs:
                for s0 in range(0, per, 10):
                    C.append(job(c, a, lv=ZN[z][0], area=z, kind='ex', arg=z, n=min(10, per - s0), seed=600 + z * 11 + s0, knob=kn, tag=ck, chain=True, mode='up'))
            ds = [0] if not a else [0, 1, 2, 3]
            per = 100 // len(ds)
            for d in ds:
                for s0 in range(0, per, 10):
                    C.append(job(c, a, lv=DGLV[d], area=[3, 5, 8, 9][d], kind='dg', arg=d, n=min(10, per - s0), seed=700 + d * 13 + s0, knob=kn, tag=ck, chain=True, mode='up'))
            # 無同行者（連續），樣本一半
            for z in zs[::2] if a else zs:
                C.append(job(c, a, lv=ZN[z][0], area=z, kind='ex', arg=z, n=10, seed=800 + z, knob=kn, tag=ck, chain=True, mode='solo', party='none'))
            for d in ds:
                C.append(job(c, a, lv=DGLV[d], area=[3, 5, 8, 9][d], kind='dg', arg=d, n=10 if a else 30, seed=900 + d, knob=kn, tag=ck, chain=True, mode='solo', party='none'))
            # 等級到頂（區域上限，連續）
            for z in zs[::2] if a else zs:
                C.append(job(c, a, lv=ZN[z][1], area=z, kind='ex', arg=z, n=10, seed=1100 + z, knob=kn, tag=ck, chain=True, mode='cap'))
            # 滿級 Lv100（只限進階職：古城探索、裂谷古城）
            if a:
                for s0 in range(0, 30, 10):
                    C.append(job(c, a, lv=100, area=9, kind='ex', arg=9, n=10, seed=1000 + s0, knob=kn, tag=ck, chain=True, mode='max'))
                    C.append(job(c, a, lv=100, area=9, kind='dg', arg=3, n=10, seed=1050 + s0, knob=kn, tag=ck, chain=True, mode='max'))
shard(C, mode)
