/* 大改版 V6.3：三條線之間的接線（主線維護）
   - 怪物被動在玩家打怪時生效（A 放在怪物身上的欄位）
   - 裝備神話／套裝的增傷（B 的 gearDmgMul6）
*/
function foeDmgMod6(d,c){const f=c.f||B,o=c.o||{},s=stats();if(!f)return d;
  /* 首次受擊減傷、爆擊減傷、元素抗性 */
  if(f.dr6First&&!f.dr6Used){f.dr6Used=1;d*=1-f.dr6First/100}
  if(c.cr&&f.critRes6)d*=1-f.critRes6/100;
  const el={FIRE:'fire',ICE:'ice',THUNDER:'thunder',HOLY:'holy',DARK:'dark'}[o.tag||''];
  if(el&&f.eres6&&f.eres6[el])d*=1-f.eres6[el]/100;
  /* 格擋率：成功 ×0.65 */
  if(f.block6&&Math.random()*100<Math.min(35,f.block6)){d*=.65;try{B.log.push(`${f.name} 擋下了一部分傷害`)}catch(e){}}
  /* 神話與套裝增傷 */
  try{const has=id=>typeof stHas==='function'&&stHas(f,id);
    B.wsk6=(B.wsk6||0)+(o.skill?1:0);
    d*=gearDmgMul6({wsk:o.skill?B.wsk6:0,hpPct:S.hp/s.HP,foeHpPct:f.hp/f.max,mag:c.stat==='MAG',
      foe:{burn:has('BURN'),slow:has('SLOW')||has('FROST'),poison:has('POISON'),debuff:typeof V6!=='undefined'&&V6.STAT.some(x=>x.bad&&has(x.id))}})}catch(e){}
  /* 反刺：直接傷害的一部分彈回 */
  if(f.thorn6&&d>1){const r=Math.max(1,Math.round(d*f.thorn6/100));S.hp=Math.max(1,S.hp-r);try{B.log.push(`${f.name} 的尖刺反彈 ${r} 傷害`)}catch(e){}}
  return d}
/* 怪物韌性：已由 v6_skill.js stAdd 本體處理；這裡原本又縮短一次（CODE_AUDIT P1-1），v20.9 移除 */
/* 一鍵換上最強組合（v20.9）：只挑這個職業能用的；考慮套裝件數與神話效果，逐格嘗試替換直到整套分數不再提高 */
function autoEquip6(){const cur={};for(const sl of SL6)cur[sl]=gearBy(S.eq[sl])||null;
  const ok=(g,sl,eq)=>canEquip(g,sl)&&!SL6.some(s=>s!==sl&&eq[s]===g)&&!(sl==='off'&&eq.main&&V6.EQ[eq.main.k].occ===2);
  const climb=eq=>{let best=eqScore6(eq);for(let pass=0;pass<4;pass++){let imp=false;
      for(const sl of SL6){for(const g of [null,...S.gear]){if(g===eq[sl]||(g&&!ok(g,sl,eq)))continue;const t=Object.assign({},eq,{[sl]:g});if(sl==='main'&&g&&V6.EQ[g.k].occ===2)t.off=null;const v=eqScore6(t);if(v>best+1e-6){best=v;Object.assign(eq,t);imp=true}}}
      if(!imp)break}return best};
  let eq=Object.assign({},cur),best=climb(eq);
  /* 單格替換找不到套裝（湊到 2 件前沒有加成），所以每個套裝再試一次「先把這套湊滿」 */
  for(const id of [...new Set(S.gear.filter(g=>g.set).map(g=>g.set))]){const t=Object.assign({},eq);
    for(const sl of SL6){if(!SETSL.has(sl))continue;let b=null;for(const g of S.gear)if(g.set===id&&ok(g,sl,t)&&(!b||gearPower(g)>gearPower(b)))b=g;if(b)t[sl]=b}
    const v=climb(t);if(v>best+1e-6){best=v;eq=t}}
  let n=0;for(const sl of SL6){if(eq[sl]===cur[sl])continue;if(eq[sl]){if(eqSet(eq[sl],sl))n++}else if(cur[sl]){S.eq[sl]=null;n++}}
  return n}
Object.assign(ACT,{autoEq(){const n=autoEquip6();toast(n?`換上 ${n} 件裝備`:'已經是最好的組合');save();render()}});
