"""V7.6.2 弱勢職業分析彙總：python3 tests/v762_report.py OUT.json OUT_TABLES.md /tmp/v762/a_0.jsonl /tmp/v762/a_1.jsonl"""
import json, sys, collections as C
out, md = sys.argv[1], sys.argv[2]
G = C.defaultdict(lambda: C.defaultdict(float)); D = C.defaultdict(lambda: C.defaultdict(C.Counter)); errs = 0
SKN = {}
CATN = {'boss': '首領', 'mid': '中段強敵', 'mid_add': '中段隨從', 'elite': '精英', 'elite_add': '精英隨從', 'grp': '群體', 'solo': '單隻', 'boss_add': '首領隨從', 'summon': '首領召喚物', '?': '其他', '自身持續傷害': '持續傷害'}
DGN = {0: '初階', 1: '中階', 3: '高階'}
for f in sys.argv[3:]:
    for l in open(f):
        r = json.loads(l); errs += len(r['errs']); j = (r['info'] or {}).get('job', r['adv'] or r['cls'])
        for x in r['res']:
            a = x.get('an') or {}
            for key in [(j, r['arg'], r['tag']), (j, r['arg'], '全部'), (j, 'all', '全部')]:
                g = G[key]; d = D[key]
                g['n'] += 1; g['w'] += x['res'] == 'WIN'; g['bt'] += x['bt']; g['pots'] += x['pots']; g['taken'] += sum(a.get('inCat', {}).values()) + a.get('dot', 0)
                for c, v in a.get('inCat', {}).items(): d['inCat'][c] += v
                d['inCat']['自身持續傷害'] += a.get('dot', 0)
                for k, v in a.get('inSk', {}).items(): d['inSk'][k] += v
                for k, v in a.get('use', {}).items(): d['use'][k] += v
                for k, v in a.get('dmg', {}).items(): d['dmg'][k] += v
                for k, v in a.get('trig', {}).items(): d['trig'][k] += v
                for k, v in a.get('heal', {}).items(): d['heal'][k] += v
                for k, v in a.get('healOver', {}).items(): d['healOver'][k] += v
                for k, v in (x.get('heal') or {}).items(): d['healR'][k] += v
                for t in ('act', 'mpStarve', 'mpZero', 'nxGive', 'nxUse', 'nxV', 'gauge', 'trigMp', 'ampSum', 'ampN', 'crit', 'hitN', 'shAdd', 'shOver', 'shAbs', 'sumT', 'sumDmg', 'bt', 'ctr', 'inN'):
                    g['a_' + t] += a.get(t, 0) or 0
                for i, v in enumerate(a.get('mpBins', [])): g[f'mp{i}'] += v
                ls = a.get('ls', {}); g['ls_raw'] += ls.get('raw', 0); g['ls_cap'] += ls.get('cap', 0); g['ls_real'] += ls.get('real', 0)
                p = a.get('pots', {}); g['pot_n'] += p.get('n', 0); g['pot_real'] += p.get('real', 0); g['pot_cap'] += p.get('capped', 0)
                if a.get('minHp') is not None: g['minHp'] += a['minHp']; g['minHpN'] += 1
                for de in a.get('deaths', []):
                    g['deaths'] += 1; last = de['last'] or [{}]; k = last[-1]
                    d['killCat'][CATN.get(k.get('c'), k.get('c', '?'))] += 1; d['killSk'][(CATN.get(k.get('c'), k.get('c', '?')) + '｜' + str(k.get('k', '持續傷害')))] += 1
                    g['d_burst'] += sum(h.get('p', 0) for h in last); g['d_mp10'] += de['mp'] < .1; g['d_pot0'] += de['pots'] == 0; g['d_wind'] += bool(de['wind'])
                    g['d_sum'] += de.get('sum', 0) > 0; g['d_t'] += de.get('t', 0)
                    d['deathStep'][f"區{de.get('area')}-格{de.get('step')}"] += 1
                if x['res'] != 'WIN' and not a.get('deaths'): g['nodeath'] += 1
res = {}
for key, g in G.items():
    d = D[key]; n = g['n'] or 1; T = g['taken'] or 1; dmgT = sum(v for k, v in d['dmg'].items() if not k.startswith('技能:')) or 1
    act = g['a_act'] or 1; dn = g['deaths'] or 1
    o = dict(n=int(g['n']), win=round(g['w'] / n * 100, 1), bt=round(g['bt'] / n), pots=round(g['pots'] / n, 2), minHp=round(g['minHp'] / (g['minHpN'] or 1), 2),
             deaths=int(g['deaths']), noDeathLose=int(g['nodeath']),
             death=dict(burst4=round(g['d_burst'] / dn, 1), mp10=round(g['d_mp10'] / dn * 100), pot0=round(g['d_pot0'] / dn * 100), wind=round(g['d_wind'] / dn * 100), withSummon=round(g['d_sum'] / dn * 100), t=round(g['d_t'] / dn)),
             killCat=dict(d['killCat'].most_common()), killSk=dict(d['killSk'].most_common(6)), deathStep=dict(d['deathStep'].most_common(5)),
             inCat={CATN.get(k, k): round(v / T * 100, 1) for k, v in sorted(d['inCat'].items(), key=lambda t: -t[1])},
             inSk={k: round(v / T * 100, 1) for k, v in d['inSk'].most_common(8)},
             mp=dict(lt20=round(g['mp0'] / act * 100, 1), starve=round(g['a_mpStarve'] / act * 100, 1), zero=round(g['a_mpZero'] / act * 100, 1)),
             use={k: round(v / act * 100, 1) for k, v in d['use'].most_common(8)},
             dmgShare={k: round(v / dmgT * 100, 1) for k, v in sorted(d['dmg'].items(), key=lambda t: -t[1]) if not k.startswith('技能:')},
             dmgSkill={k[3:]: round(v / dmgT * 100, 1) for k, v in sorted(d['dmg'].items(), key=lambda t: -t[1]) if k.startswith('技能:')},
             trigPerRun={k: round(v / n, 1) for k, v in d['trig'].most_common(12)},
             nx=dict(give=round(g['a_nxGive'] / n, 1), use=round(g['a_nxUse'] / n, 1), avgV=round(g['a_nxV'] / (g['a_nxUse'] or 1), 1)), gaugePerRun=round(g['a_gauge'] / n, 1), trigMpPerRun=round(g['a_trigMp'] / n, 1),
             ampAvg=round(g['a_ampSum'] / (g['a_ampN'] or 1), 1), critRate=round(g['a_crit'] / (g['a_hitN'] or 1) * 100, 1), counterPerRun=round(g['a_ctr'] / n, 1),
             heal={k: dict(real=round(v / n), over=round(d['healOver'][k] / n), overPct=round(d['healOver'][k] / ((v + d['healOver'][k]) or 1) * 100)) for k, v in d['heal'].items()},
             healRatio={k: round(v / n, 2) for k, v in d['healR'].items()},
             ls=dict(raw=round(g['ls_raw'] / n), cap=round(g['ls_cap'] / n), real=round(g['ls_real'] / n)),
             pot=dict(n=round(g['pot_n'] / n, 2), avg=round(g['pot_real'] / (g['pot_n'] or 1)), cappedPct=round(g['pot_cap'] / (g['pot_n'] or 1) * 100)),
             shield=dict(add=round(g['a_shAdd'] / n), over=round(g['a_shOver'] / n), abs=round(g['a_shAbs'] / n), waste=round((g['a_shAdd'] - g['a_shOver'] - g['a_shAbs']) / n)),
             summon=dict(timePct=round(g['a_sumT'] / (g['a_bt'] or 1) * 100, 1), dmgPct=round(g['a_sumDmg'] / T * 100, 1)))
    res['|'.join(map(str, key))] = o
json.dump(dict(errs=errs, agg=res), open(out, 'w'), ensure_ascii=False, indent=0)
# markdown
J = sorted({k[0] for k in G})
ORDER = ['法師', '神官', '大魔導士', '咒術師', '刺客', '主教', '神射手']
J = [j for j in ORDER if j in J]
L = []
L.append('### 配置差異（通關率／戰鬥秒數／藥水）\n| 職業 | 副本 | 均衡 | 輸出 | 續戰 |\n|---|---|---|---|---|')
for j in J:
    for dg in (0, 1, 3):
        if f'{j}|{dg}|全部' not in res: continue
        row = [f"{res[f'{j}|{dg}|{s}']['win']:.0f}%／{res[f'{j}|{dg}|{s}']['bt']}s／{res[f'{j}|{dg}|{s}']['pots']}" for s in ('均衡', '輸出', '續戰')]
        L.append(f"| {j} | {DGN[dg]} | " + ' | '.join(row) + ' |')
open(md, 'w').write('\n'.join(L))
print('errs', errs, 'keys', len(res))
