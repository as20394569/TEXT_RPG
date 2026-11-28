import json, glob, sys
from collections import Counter, defaultdict
from balance_report import N, ORDER, DGN, CATN, pct
def load(pat):
    rows = []
    for f in glob.glob(pat):
        for l in open(f):
            r = json.loads(l)
            for i, x in enumerate(r['res']):
                rows.append(dict(job=r['adv'] or r['cls'], build=r['build'], tag=r.get('tag'), mode=r.get('mode'), kind=r['kind'], arg=r['arg'], lv0=r['lv'], party=r.get('party', 'luna'), idx=i, **x))
    return rows
def agg(rows):
    n = len(rows)
    if not n: return None
    H = defaultdict(float)
    for r in rows:
        for k, v in (r.get('heal') or {}).items(): H[k] += v
    return dict(n=n, wr=sum(r['res'] == 'WIN' for r in rows) / n, bt=sum(r['bt'] for r in rows) / n, hp=sum(r['hp'] for r in rows) / n,
                pots=sum(r['pots'] for r in rows) / n, heal={k: v / n for k, v in H.items()},
                earn=sum(r.get('goldEarn') or 0 for r in rows) / n, rest=sum(r.get('spentRest') or 0 for r in rows) / n, potg=sum(r.get('spentPot') or 0 for r in rows) / n)
def fails(rows):
    c = Counter()
    for r in rows:
        if r['res'] == 'WIN' or not r.get('where'): continue
        wh = r['where']; cat = wh['foes'][0].split(':')[0] if wh['foes'] else '?'
        c[(f"{DGN[r['arg']]}第{wh['dg']+1}區" if r['kind'] == 'dg' else '探索') + f"第{wh['step']+1}格・{CATN.get(cat, cat)}"] += 1
    return c
HS = ['露娜', '戰後回復', '自然回復', '升級回復', '技能與吸血', '藥水', '營地']
