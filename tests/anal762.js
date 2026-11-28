/* V7.6.2 弱勢職業分析用的量測（只在模擬器；不改任何結果）。結果放在 SIM.M.an，由 fastsim 回傳。 */
(()=>{
const A=()=>SIM.M&&SIM.M.an;
const inc=(o,k,v)=>{o[k]=(o[k]||0)+(v==null?1:v)};
const catF=f=>{try{return SIM.catOf(f)}catch(e){return '?'}};
SIM.anNew=()=>({deaths:[],inSk:{},inCat:{},inN:0,dot:0,minHp:[],act:0,mpStarve:0,mpZero:0,mpBins:[0,0,0,0,0],use:{},dmg:{},trig:{},nxGive:0,nxUse:0,nxV:0,gauge:0,trigMp:0,ampSum:0,ampN:0,crit:0,hitN:0,
  heal:{},healOver:{},ls:{raw:0,cap:0,real:0},mpG:{},mpCost:0,potH:{n:0,real:0,over:0},potM:{n:0,real:0,over:0},shAdd:0,shOver:0,shAbs:0,sumT:0,sumDmg:0,bt:0,ring:[],eff:null,ctr:0,pots:{n:0,real:0,capped:0}});
/* ---- 受到的傷害 ---- */
{const _fh=foeHit6;foeHit6=function(f,k,s,o){const r=_fh.apply(this,arguments);try{const a=A();if(a&&r&&!r.miss&&r.d>0){const c=catF(f),nm=(k&&k.n)||'普攻',hp=stats().HP;
  inc(a.inSk,c+'｜'+nm,r.d);inc(a.inCat,c,r.d);a.inN++;a.ring.push({t:B&&B.rt?+B.rt.t.toFixed(1):0,c,f:f.name,k:nm,d:Math.round(r.d),p:+(r.d/hp*100).toFixed(1),s7:f.summon7?1:0,kd:f.kind||''});if(a.ring.length>6)a.ring.shift();if(c==='summon')a.sumDmg+=r.d}}catch(e){}return r}}
{const _st=stTick;stTick=function(t){const h=S.hp;dotCtx=t!=='p';const r=_st.apply(this,arguments);dotCtx=false;try{const a=A();if(a&&t==='p'&&S.hp<h){a.dot+=h-S.hp;a.ring.push({c:'自身持續傷害',d:h-S.hp,p:+((h-S.hp)/stats().HP*100).toFixed(1)});if(a.ring.length>6)a.ring.shift()}}catch(e){}return r}}
let dotCtx=false;
/* ---- 死亡 ---- */
{const _l=lose;lose=function(){try{const a=A();if(a&&B){const L=aliveFoes7(),s=stats();a.deaths.push({last:a.ring.slice(-4),alive:L.map(f=>catF(f)+':'+f.name+':'+Math.round(f.hp/f.max*100)+'%'+(f.summon7?':召喚':'')+':'+(f.kind||'')),
  sum:L.filter(f=>f.summon7).length,mp:+(S.mp/s.MP).toFixed(2),pots:potCount('hp'),mpots:potCount('mp'),main:catF(B),node:RUN&&RUN.nodes?RUN.nodes[RUN.step]:null,dg:RUN&&RUN.dg?RUN.dg.k:null,wind:B.rtw?B.rtw.n:null,t:B.rt?+B.rt.t.toFixed(0):0,area:RUN&&RUN.area,step:RUN&&RUN.step})}}catch(e){}return _l.apply(this,arguments)}}
/* ---- 玩家行動：技能使用、MP ---- */
{const _pa=pAct;pAct=function(type,arg){try{const a=A();if(a&&B&&B.rt&&!B.busy){const s=rtS6(),r=S.mp/s.MP;a.act++;a.mpBins[Math.min(4,Math.floor(r*5))]++;if(S.mp<1)a.mpZero++;
  const L=battleSkills().filter(k=>SK[k]&&SK[k].act&&k!==baseSk7().id);const starved=L.some(k=>cdLeft6(k)<=0&&S.mp<mpCost6(k));const key=type==='skill'?arg:type;inc(a.use,key);
  if(starved&&(type!=='skill'||arg===baseSk7().id))a.mpStarve++}}catch(e){}return _pa.apply(this,arguments)}}
/* ---- 造成的傷害：單體／範圍主目標／範圍副目標／連擊／持續／其他 ---- */
let HC=null;
{const _h=hitFoe;hitFoe=function(stat,pow,o){const sv=HC;o=o||{};const f=o.tgt||B;HC=o.skill?{k:B&&B.fx&&B.fx.skill,role:f===B?'main':'sub'}:{role:'other'};
  try{const a=A();if(a&&o.skill){a.ampSum+=(o.amp||0);a.ampN++}}catch(e){}
  try{const r=_h.apply(this,arguments);try{const a=A();if(a&&o.skill&&!r.miss){a.hitN++;if(r.cr)a.crit++}}catch(e){}return r}finally{HC=sv}}}
{const _t=foeTake6;foeTake6=function(f,d,src){const r=_t.apply(this,arguments);try{const a=A();if(a&&r>0){let key;
  if(dotCtx)key='持續傷害';else if(src==='連擊')key='連擊';else if(HC&&HC.role!=='other'){const k=HC.k,x=k&&SK[k];const aoe=x&&(x.tg==='雙體'||x.tg==='全體');key=aoe?(HC.role==='main'?'範圍技・主目標':'範圍技・副目標'):'單體技'}
  else if(src==='反彈')key='反彈';else key='其他（反制、格擋反擊、追加）';inc(a.dmg,key,r);if(HC&&HC.k)inc(a.dmg,'技能:'+HC.k,r)}}catch(e){}return r}}
/* ---- 被動與天賦觸發 ---- */
{const _tg=trig6;trig6=function(ev,o){const a=A();const P=B&&B.p6;const n0=P?P.nx.length:0,m0=S.mp,g0=B&&B.rt?(B.rt.pgB||0):0;const r=_tg.apply(this,arguments);try{if(a&&P){inc(a.trig,ev);const dn=P.nx.length-n0,dm=S.mp-m0,dg=(B.rt?(B.rt.pgB||0):0)-g0;
  if(dn>0){a.nxGive+=dn;inc(a.trig,ev+'→下次增傷',dn)}if(dm>0){a.trigMp+=dm;inc(a.trig,ev+'→回魔',dm)}if(dg>0){a.gauge+=dg;inc(a.trig,ev+'→行動條',dg)}}}catch(e){}return r}}
{const _nb=nextBuff6;nextBuff6=function(k,direct){const r=_nb.apply(this,arguments);try{const a=A();if(a&&r&&(r.v>0||r.pen>0)){a.nxUse++;a.nxV+=r.v}}catch(e){}return r}}
{const _ob=onBlock6;onBlock6=function(){const a=A(),n0=B&&B.log?B.log.length:0;const r=_ob.apply(this,arguments);try{if(a&&B&&B.log)for(let i=n0;i<B.log.length;i++)if(/【反制】/.test(B.log[i]))a.ctr++}catch(e){}return r}}
/* ---- 治療：有效量與溢出 ---- */
{const _hl=heal6;heal6=function(k,pct,magR,s,ps){const a=A();let want=0;try{let amp=effSum('skheal',k)+(skmLv6(k)-1);for(const e of effK('lowhealp'))if(e.sk===k&&S.hp<s.HP*e.th/100)amp+=e.v;
  want=(s.HP*pct+s.MAG*magR)*(1+Math.min(30,s.HEALP||0)/100)*(1+amp/100)*healInM6();for(const e of effK('lowheal'))if(e.sk===k&&S.hp<s.HP*e.th/100)want+=s.HP*e.pct/100;want=Math.round(want)}catch(e){}
  const real=_hl.apply(this,arguments);try{if(a){inc(a.heal,'技能治療:'+k,real);inc(a.healOver,'技能治療:'+k,Math.max(0,want-real))}}catch(e){}return real}}
{const _lf=ls7Fin;ls7Fin=function(k,s,ps){const a=A(),L=B&&B.ls7,h0=S.hp;let raw=0;try{if(L&&L.d>0){let amp=effSum('lsamp');for(const e of effK('lowhealp'))if(e.sk===k&&L.hp0/s.HP*100<e.th)amp+=e.v;raw=(L.d*Math.min(10,s.LS||0)/100+L.d*L.r/100*(1+amp/100))*healInM6()}}catch(e){}
  const r=_lf.apply(this,arguments);try{if(a&&raw>0){a.ls.raw+=raw;a.ls.cap+=Math.min(raw,s.HP*.1);a.ls.real+=S.hp-h0}}catch(e){}return r}}
{const _ui=useItem6;useItem6=function(k,inB){const a=A(),h0=S.hp,m0=S.mp,n=potCount('hp'),nm=potCount('mp');const r=_ui.apply(this,arguments);try{if(a){const s=stats(),u=(ITEMS[k]||{}).use||{};
  if(potCount('hp')<n){a.pots.n++;a.pots.real+=S.hp-h0;if(S.hp>=s.HP)a.pots.capped++;const want=s.HP*(u.v||0)/100;a.potH.n++;a.potH.real+=S.hp-h0;a.potH.over+=Math.max(0,want-(S.hp-h0))}
  if(potCount('mp')<nm){const want=s.MP*(u.v||0)/100;a.potM.n++;a.potM.real+=S.mp-m0;a.potM.over+=Math.max(0,want-(S.mp-m0))}}}catch(e){}return r}}
/* ---- 護盾：獲得、被覆蓋浪費、吸收 ---- */
{const _sa=stAdd;stAdd=function(t,id,o){const a=A();let old=0;try{if(a&&t==='p'&&id==='SHIELD'){const c=B.psx&&B.psx.SHIELD;old=c&&c.e>acOf('p')?(c.amt||0):0}}catch(e){}
  const r=_sa.apply(this,arguments);try{if(a&&t==='p'&&id==='SHIELD'&&r){a.shAdd+=(o&&o.amt)||0;a.shOver+=old}}catch(e){}return r}}
const shAmt=()=>{const c=B&&B.psx&&B.psx.SHIELD;return c&&c.e>acOf('p')?(c.amt||0):0};
for(const nm of ['foeTurn','rtAddGo']){if(typeof window[nm]!=='function')continue;const _f=window[nm];window[nm]=function(){const a=A(),s0=shAmt();const r=_f.apply(this,arguments);try{if(a){const s1=shAmt();if(s1<s0)a.shAbs+=s0-s1}}catch(e){}return r}}
{const _ps=pShieldAbsorb6;pShieldAbsorb6=function(d){const r=_ps.apply(this,arguments);try{const a=A();if(a&&r<d)a.shAbs+=d-r}catch(e){}return r}}
/* ---- 召喚物存在時間、最低 HP ---- */
{const _rs=rtStep;rtStep=function(dt){const r=_rs.apply(this,arguments);try{const a=A();if(a&&B){a.bt+=dt;if((B.adds||[]).some(f=>f.hp>0&&f.summon7)||(B.summon7))a.sumT+=dt;const hr=S.hp/stats().HP;if(a._mh==null||hr<a._mh)a._mh=hr}}catch(e){}return r}}
})();

/* ---- MP 來源與消耗（以最內層函式歸屬） ---- */
(()=>{const ST=[];const A2=()=>SIM.M&&SIM.M.an;
function mt(name,get){const fn=get();return function(){const a=A2();if(!a||!S)return fn.apply(this,arguments);const fr={c:0};ST.push(fr);const m0=S.mp;let cost=0;
  if(name==='技能與被動'){try{const k=arguments[0];if(B&&B.chgRel!==k)cost=mpCost6(k)}catch(e){}}
  try{return fn.apply(this,arguments)}finally{ST.pop();const d=S.mp-m0,own=d-fr.c+cost;if(own>0)a.mpG[name]=(a.mpG[name]||0)+own;if(cost)a.mpCost+=cost;if(ST.length)ST[ST.length-1].c+=d}}}
pPre7=mt('自然回魔',()=>pPre7);trig6=mt('格擋／迴避／淨化事件',()=>trig6);useSkill6=mt('技能與被動',()=>useSkill6);onCombo7=mt('連擊回魔',()=>onCombo7);
useItem6=mt('魔力藥',()=>useItem6);onWin6=mt('戰後回復',()=>onWin6);gainExp=mt('升級',()=>gainExp)})();
