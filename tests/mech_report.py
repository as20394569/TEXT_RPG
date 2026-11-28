"""強敵機制測試彙總：python3 tests/mech_report.py /tmp/mech/m_0.jsonl /tmp/mech/m_1.jsonl > /tmp/mech/sum.json"""
import json, sys, collections as C
R = [json.loads(l) for f in sys.argv[1:] for l in open(f)]
JN = {}
def key(r): return (r['tag'], r['cfg'], r['party'], r['gear'])
agg = C.defaultdict(lambda: dict(n=0, w=0, bt=0, pots=0, hp=0, where=C.Counter(), m09=0, react=0, addB=0, c50=0))
job = C.defaultdict(lambda: [0, 0])
errs = 0
for r in R:
    errs += len(r['errs']); j = (r['info'] or {}).get('job', r['adv'] or r['cls']); JN[r['adv'] or r['cls']] = j
    for x in r['res']:
        for k in [key(r), (r['tag'], r['cfg'], r['party'], r['gear'], j), (r['tag'], r['cfg'], r['party'], r['gear'], 'dg%d' % r['arg'])]:
            a = agg[k]; a['n'] += 1; w = x['res'] == 'WIN'; a['w'] += w; a['bt'] += x.get('bt', 0); a['pots'] += x.get('pots', 0); a['hp'] += x.get('hp', 0)
            m = x.get('mech') or {}
            for t in ('m09', 'react', 'addB', 'c50'): a[t] += m.get(t, 0)
            if not w and x.get('where'): a['where'][(x['where']['foes'] or ['?'])[0].split(':')[0]] += 1
out = {}
for k, a in agg.items():
    n = a['n'] or 1
    out['|'.join(map(str, k))] = dict(n=a['n'], win=round(a['w'] / n * 100, 1), bt=round(a['bt'] / n), pots=round(a['pots'] / n, 2), hp=round(a['hp'] / n, 2), m09=round(a['m09'] / n, 2), react=round(a['react'] / n, 2), addB=round(a['addB'] / n, 2), c50=round(a['c50'] / n, 2), where=dict(a['where']))
print(json.dumps(dict(errs=errs, runs=sum(len(r['res']) for r in R), jobs=JN, agg=out), ensure_ascii=False))
