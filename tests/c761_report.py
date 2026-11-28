"""彙總候選技能模擬：python3 tests/c761_report.py /tmp/c761/c_0.jsonl /tmp/c761/c_1.jsonl > /tmp/c761/sum.json"""
import json, sys, collections as C
A = C.defaultdict(lambda: dict(n=0, w=0, bt=0, pots=0, hp=0, where=C.Counter()))
TRIG = C.defaultdict(C.Counter); errs = 0; jobs = {}
for f in sys.argv[1:]:
    for l in open(f):
        r = json.loads(l); errs += len(r['errs']); j = (r['info'] or {}).get('job', r['adv'] or r['cls']); jobs[j] = 1
        for x in r['res']:
            for k in [(j, r['arg'], r['party'], r['tag']), ('ALL', r['party'], r['tag']), (j, 'all', r['party'], r['tag'])]:
                a = A[k]; a['n'] += 1; a['w'] += x['res'] == 'WIN'; a['bt'] += x['bt']; a['pots'] += x['pots']; a['hp'] += x['hp']
                if x['res'] != 'WIN' and x.get('where'): a['where'][(x['where']['foes'] or ['?'])[0].split(':')[0]] += 1
            if r['tag'] == '候選':
                for t, v in (x.get('c761') or {}).items(): TRIG[j][t] += v
out = {'|'.join(map(str, k)): dict(n=a['n'], win=round(a['w'] / a['n'] * 100, 1), bt=round(a['bt'] / a['n']), pots=round(a['pots'] / a['n'], 2), hp=round(a['hp'] / a['n'], 2), where=dict(a['where'])) for k, a in A.items()}
print(json.dumps(dict(errs=errs, jobs=list(jobs), agg=out, trig={j: dict(v) for j, v in TRIG.items()}), ensure_ascii=False))
