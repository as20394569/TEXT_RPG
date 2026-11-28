import re,json,collections as C
files=['v6_skill.js','v7_core.js','v6_mob.js','v6_glue.js','v7_map.js','v6_gear.js','index.html']
name_re=re.compile(r'^(?:function\s+(\w+)\s*\(|(?:const|let)\s+(\w+)\s*=|\{const _\w+=(\w+);\w+=function|(\w+)=function)')
use=C.defaultdict(set)
for f in files:
  cur=f
  for ln,l in enumerate(open('./'+f,encoding='utf8')):
    m=name_re.match(l)
    if m:cur=next(g for g in m.groups() if g)
    for k in re.findall(r"eff(?:K|Sum)\('(\w+)'",l)+re.findall(r"\.k==='(\w+)'",l):use[k].add(f'{cur}（{f}）')
    if 'fxvOf6(' in l and not l.lstrip().startswith('const fxvOf6'):use['fxv'].add(f'{cur}（{f}）')
    if 'durOf6(' in l and not l.lstrip().startswith('const durOf6'):use['skdur'].add(f'{cur}（{f}）')
json.dump({k:sorted(v) for k,v in use.items()},open('/tmp/exp/use.json','w'),ensure_ascii=False,indent=0)
print({k:len(v) for k,v in use.items()})
