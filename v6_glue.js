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
/* 怪物韌性：負面狀態時間縮短 */
{const _sa=stAdd;stAdd=function(t,id,o){try{const D=V6.STAT.find(x=>x.id===id);if(t&&t!=='p'&&t.ten6&&D&&D.bad){o=Object.assign({},o||{});o.dur=(o.dur||D.dur)*(1-Math.min(30,t.ten6)/100)}}catch(e){}return _sa.call(this,t,id,o)}}
/* 一鍵換上戰力最高的裝備（每格挑 gearPower 最高的） */
function autoEquip6(){let n=0;for(const sl of SL6){const cur=gearBy(S.eq[sl]);let best=cur,bp=cur?gearPower(cur):-1;
    for(const g of S.gear){if(g===cur||!canEquip(g,sl)||SL6.some(s=>s!==sl&&S.eq[s]===g.u))continue;const p=gearPower(g);if(p>bp){bp=p;best=g}}
    if(best&&best!==cur&&eqSet(best,sl))n++}return n}
Object.assign(ACT,{autoEq(){const n=autoEquip6();toast(n?`換上 ${n} 件裝備`:'已經是最好的組合');save();render()}});
