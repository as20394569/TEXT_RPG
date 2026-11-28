"""彙整平衡測試結果 → markdown 表格片段。用法：python3 tests/balance_report.py main_*.jsonl"""
import json, sys, glob
from collections import defaultdict, Counter
N = {'swordsman':'劍士','mage':'法師','ranger':'遊俠','cleric':'神官','knight':'騎士','berserker':'狂戰士','dual':'雙劍士','archmage':'大魔導士','warlock':'咒術師','sniper':'神射手','assassin':'刺客','bishop':'主教','templar':'聖殿騎士'}
ORDER = list(N)
DGN = ['深林礦脈','霜原要塞','龍谷之路','裂谷古城']
CATN = {'solo':'單獨普通','grp':'群體普通','elite':'精英','elite_add':'精英隨從','mid':'中段強敵','mid_add':'中段隨從','boss':'首領','boss_add':'首領隨從','summon':'召喚物','?':'?'}
def load(files):
    rows = []
    for f in files:
        for l in open(f):
            r = json.loads(l)
            for x in r['res']:
                rows.append(dict(job=r['adv'] or r['cls'], build=r['build'] + (str(r.get('var') or r['rar']) if r['build'] == 'opt' else ('-few' if r.get('drops') else '')), tag=r.get('tag', 'orig'), kind=r['kind'], arg=r['arg'], lv=r['lv'], **x))
    return rows
def agg(rows):
    n = len(rows); w = sum(r['res'] == 'WIN' for r in rows)
    if not n: return None
    tk = sum(sum(r['takenBy'].values()) for r in rows) or 1
    sk = sum(sum(r['skillBy'].values()) for r in rows)
    return dict(n=n, w=w, wr=w / n, bt=sum(r['bt'] for r in rows) / n, btb=sum(r['bt'] for r in rows) / max(1, sum(r['nb'] for r in rows)),
                hp=sum(r['hp'] for r in rows) / n, mp=sum(r['mp'] for r in rows) / n, pots=sum(r['pots'] for r in rows) / n, sk=sk / tk,
                err=sum(r['res'] not in ('WIN', 'LOSE') for r in rows))
def fails(rows):
    c = Counter()
    for r in rows:
        if r['res'] == 'WIN' or not r.get('where'): continue
        wh = r['where']; cat = (wh['foes'][0].split(':')[0]) if wh['foes'] else '?'
        loc = (f"{DGN[r['arg']]}第{wh['dg']+1}區" if r['kind'] == 'dg' else '探索') + f"第{wh['step']+1}格・{CATN.get(cat, cat)}"
        c[loc] += 1
    return c
def pct(x): return f"{x*100:.0f}%"
if __name__ == '__main__':
    files = sorted(sum((glob.glob(a) for a in sys.argv[1:]), []))
    R = load(files)
    print('total runs', len(R), 'odd', Counter(r['res'] for r in R))
