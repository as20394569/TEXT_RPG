/* 快速戰鬥模擬（只在測試用，不會載入正式遊戲）
   - 頁面載入完成後才安裝：虛擬時鐘取代 setTimeout / performance.now，戰鬥直接呼叫 rtStep，不畫畫面、不播特效、不存檔
   - 遊戲規則、數值完全使用正式程式；候選方案（怪物技能傷害修正）只在這裡用包裝套用 */
(()=>{
const W=window;
/* ---------- 虛擬時鐘 ---------- */
let now=0,tid=1;const Q=[];
W.setTimeout=(fn,ms,...a)=>{const t={id:tid++,at:now+Math.max(0,+ms||0),fn,a};Q.push(t);return t.id};
W.clearTimeout=i=>{const k=Q.findIndex(t=>t.id===i);if(k>=0)Q.splice(k,1)};
W.setInterval=()=>0;W.clearInterval=()=>{};
W.requestAnimationFrame=()=>0;W.cancelAnimationFrame=()=>{};
performance.now=()=>now;
function adv(ms){const end=now+ms;for(let g=0;g<5000;g++){let bi=-1,ba=Infinity;for(let i=0;i<Q.length;i++)if(Q[i].at<ba){ba=Q[i].at;bi=i}if(bi<0||ba>end)break;const t=Q.splice(bi,1)[0];now=Math.max(now,t.at);try{if(typeof t.fn==='function')t.fn(...t.a)}catch(e){SIM.err(e)}}now=end}
/* ---------- 關掉畫面、特效、存檔 ---------- */
W.RTX=1;MUTE=true;
render=function(){try{clamp()}catch(e){}};
save=function(){};try{runSnap=function(){}}catch(e){}
try{for(const k of Object.keys(PFX))if(typeof PFX[k]==='function')PFX[k]=function(){}}catch(e){}
try{toast=function(){}}catch(e){}
try{playSkillSfx=function(){}}catch(e){}
try{for(const k of Object.keys(SFX))if(typeof SFX[k]==='function')SFX[k]=function(){}}catch(e){}
try{if(W.SN7)for(const k of Object.keys(W.SN7))W.SN7[k]=function(){}}catch(e){}
try{bgmAuto=function(){};BGM&&(BGM.play=function(){})}catch(e){}
try{rtPop=function(){}}catch(e){}

const SIM=W.SIM={knob:{},errs:[],err(e){if(SIM.errs.length<20)SIM.errs.push(String(e&&e.stack||e).slice(0,300))},cand:null,M:null};

/* ---------- 怪物分類（開戰時標記；換位會跟著怪物走） ---------- */
{const _g=grpDone7;grpDone7=function(){const r=_g.apply(this,arguments);try{const L=[B,...(B.adds||[])];
  for(const f of L){let c;if(B.mid7)c=f===B?'mid':'mid_add';else if(B.kind==='boss')c=f===B?'boss':'boss_add';else if(B.kind==='elite')c=f===B?'elite':'elite_add';else c=L.length>1?'grp':'solo';f.cat7=c}}catch(e){SIM.err(e)}return r}}
/* v21.4 分析修正：舊版把戰鬥中途 addFoe7 加入的單位一律標成 summon，連副本首領也被標錯；召喚物只看 summon7 旗標（catOf） */
/* 難度測試選項（只在測試）：SIM.diff={dgHp,dgAtk,exHp,exAtk,z0Mid} */
{const _mk=mkFoe;mkFoe=function(){const f=_mk.apply(this,arguments);try{const D=SIM.diff;if(D&&f&&RUN){const dg=!!RUN.dg,h=dg?D.dgHp:(RUN.area>=1?D.exHp:1),a=dg?D.dgAtk:(RUN.area>=1?D.exAtk:1);
  if(h&&h!==1){f.max=Math.round(f.max*h);f.hp=f.max}if(a&&a!==1){f.atk=Math.round(f.atk*a);if(f.mag)f.mag=Math.round(f.mag*a)}}}catch(e){SIM.err(e)}return f}}
{const _sm=startMid7;startMid7=function(){const r=_sm.apply(this,arguments);try{const D=SIM.diff;if(D&&D.z0Mid&&B&&RUN&&RUN.area===0&&B.mid7){B.atk=Math.round(B.atk*D.z0Mid);if(B.mag)B.mag=Math.round(B.mag*D.z0Mid)}}catch(e){SIM.err(e)}return r}}
const catOf=f=>f.summon7?'summon':(f.kind==='boss'&&!f.mid7&&!f.cat7?'boss':(f.cat7||'solo'));
SIM.catOf=catOf;
/* 候選方案：只改怪物「技能」的直接傷害與冷卻 */
function candMul(f){const C=SIM.cand;if(!C)return [1,0];const c=catOf(f);return C[c]||[1,0]}
{const _h=foeHit6;foeHit6=function(f,k,s,o){const r=_h.apply(this,arguments);try{if(r&&!r.miss&&k&&k.pow){const m=candMul(f)[0];if(m!==1)r.d=Math.max(1,Math.round(r.d*m))}
    const M=SIM.M;if(M&&r&&!r.miss){const c=catOf(f);M.taken+=r.d;if(k&&k.pow){M.skillT+=r.d;M.skillBy[c]=(M.skillBy[c]||0)+r.d}M.takenBy[c]=(M.takenBy[c]||0)+r.d}}catch(e){SIM.err(e)}return r}}
{const _fa=foeAttack6;foeAttack6=function(f,id,fx,o){const r=_fa.apply(this,arguments);try{const k=id?SKM[id]:null;if(k&&k.v6&&B&&B.rt){const add=candMul(f)[1];if(add)f.mcd[id]=(f.mcd[id]||0)+add}if(k&&SIM.M)SIM.M.fsk++}catch(e){SIM.err(e)}return r}}
{const _st=stTick;stTick=function(t){const h=S.hp;const r=_st.apply(this,arguments);try{if(t==='p'&&SIM.M&&S.hp<h){SIM.M.dot+=h-S.hp;SIM.M.taken+=h-S.hp}}catch(e){}return r}}
{const _us=useSkill6;useSkill6=function(k){try{if(SIM.M&&B&&B.chgRel!==k){SIM.M.mp+=mpCost6(k);SIM.M.casts++}}catch(e){}return _us.apply(this,arguments)}}
{const _ui=useItem6;useItem6=function(k,inB){const n=S.items[k]||0;const r=_ui.apply(this,arguments);try{if(SIM.M&&(S.items[k]||0)<n)SIM.M.pots++}catch(e){}return r}}
{const _l=lose;lose=function(){SIM.res='LOSE';return _l.apply(this,arguments)}}


/* ---------- 續航與前期難度測試開關（只在測試）：SIM.knob={luna,win,regen,lvl,z0Atk,z0Hp} ---------- */
let TD=0;
function track(name,fn,scale){return function(){const outer=TD===0,h0=S?S.hp:0,m0=S?S.mp:0,lv0=S?S.lv:0;TD++;let r;try{r=fn.apply(this,arguments)}finally{TD--}
  try{if(S){let dh=S.hp-h0;if(scale&&dh>0){const k=scale(lv0,h0,m0);if(k!=null&&k!==1){S.hp=Math.round(h0+dh*k);dh=S.hp-h0}}if(outer&&SIM.M&&dh>0)SIM.M.heal[name]=(SIM.M.heal[name]||0)+dh}}catch(e){SIM.err(e)}return r}}
allyAct=track('露娜',allyAct,()=>SIM.knob.luna);
onWin6=track('戰後回復',onWin6,()=>SIM.knob.win);
heal6=track('技能與吸血',heal6);
useItem6=track('藥水',useItem6);
campPick=track('營地',campPick);
{const _p=pPre7;pPre7=function(){SIM.inPre=1;SIM.hpDot=null;const h0=S.hp;TD++;let r;try{r=_p.apply(this,arguments)}finally{TD--;SIM.inPre=0}
  try{const base=SIM.hpDot!=null?SIM.hpDot:h0;let dh=S.hp-base;const k=SIM.knob.regen;if(dh>0&&k!=null&&k!==1){S.hp=Math.round(base+dh*k);dh=S.hp-base}if(TD===0&&SIM.M&&dh>0)SIM.M.heal['自然回復']=(SIM.M.heal['自然回復']||0)+dh}catch(e){SIM.err(e)}return r}}
{const _st2=stTick;stTick=function(t){const r=_st2.apply(this,arguments);if(t==='p'&&SIM.inPre)SIM.hpDot=S.hp;return r}}
{const _ge=gainExp;gainExp=function(n){const lv0=S.lv,h0=S.hp,m0=S.mp;TD++;let r;try{r=_ge.apply(this,arguments)}finally{TD--}
  try{if(S.lv>lv0){const s=stats();if(SIM.knob.lvl){S.hp=Math.min(s.HP,Math.max(h0,h0+Math.round(s.HP*SIM.knob.lvl)));S.mp=Math.min(s.MP,Math.max(m0,m0+Math.round(s.MP*SIM.knob.lvl)))}
    const dh=S.hp-h0;if(TD===0&&SIM.M&&dh>0)SIM.M.heal['升級回復']=(SIM.M.heal['升級回復']||0)+dh;if(SIM.M)SIM.M.lvups+=S.lv-lv0}}catch(e){SIM.err(e)}return r}}
/* 怪物速度與開場行動條（測試開關）：knob.spd 全部怪物速度倍率；knob.open 中段強敵與首領開場行動條 */
{const _mk2=mkFoe;mkFoe=function(){const f=_mk2.apply(this,arguments);try{const k=SIM.knob.spd;if(k&&k!==1&&f&&f.ft6)f.ft6=f.ft6/k}catch(e){}return f}}
{const _gd=grpDone7;grpDone7=function(){const r=_gd.apply(this,arguments);try{const o=SIM.knob.open;if(o&&B&&(B.mid7||B.kind==='boss'))B.rtg=Math.max(B.rtg||0,o)}catch(e){}return r}}
/* 露娜傷害與替玩家擋攻擊的機率（測試開關）：knob.lunaPw、knob.tank */
{const _ma=mkAlly;mkAlly=function(){const a=_ma.apply(this,arguments);try{const k=SIM.knob.lunaPw;if(a&&k&&k!==1)a.pw*=k}catch(e){}return a}}
{const _at=allyTgt;allyTgt=function(){const t=SIM.knob.tank;if(t==null)return _at.apply(this,arguments);const A=B.ally;if(!A||A.hp<=0)return false;if(B.taunt>0){B.taunt--;return true}return Math.random()<t}}
{const _sm2=startMid7;startMid7=function(){const r=_sm2.apply(this,arguments);try{const K=SIM.knob;if(B&&RUN&&RUN.area===0&&B.mid7){if(K.z0Atk&&K.z0Atk!==1){B.atk=Math.round(B.atk*K.z0Atk);if(B.mag)B.mag=Math.round(B.mag*K.z0Atk)}if(K.z0Hp&&K.z0Hp!==1){B.max=Math.round(B.max*K.z0Hp);B.hp=B.max}}}catch(e){SIM.err(e)}return r}}


/* ---------- 強敵機制候選（只在測試）：knob.mechA 狂暴、mechB 副本中段強敵加隨從、mechC 首領 50% 預告強力技 ---------- */
const isStrong=f=>!!f&&!f.summon7&&(f.mid7||f.kind==='boss');
const enrage=f=>{const ac=f.ac||0;return ac>=5?Math.min(.45,.15+.10*Math.floor((ac-5)/3)):0};
{const _h2=foeHit6;foeHit6=function(f,k,s,o){const r=_h2.apply(this,arguments);try{if(SIM.knob.mechA&&r&&!r.miss&&isStrong(f)){const m=enrage(f);if(m>0){r.d=Math.max(1,Math.round(r.d*(1+m)));if(SIM.M){SIM.M.mech.enr=Math.max(SIM.M.mech.enr||0,m)}}}
  if(SIM.M&&r&&!r.miss&&k&&k.v6==='M09'){SIM.M.mech.m09=(SIM.M.mech.m09||0)+1;SIM.M.mech.m09d=(SIM.M.mech.m09d||0)+r.d}}catch(e){SIM.err(e)}return r}}
{const _sm3=startMid7;startMid7=function(){const r=_sm3.apply(this,arguments);try{if(SIM.knob.mechB&&B&&RUN&&RUN.dg&&B.mid7&&aliveFoes7().length<4){const a=AREAS[RUN.area];const f=addFoe7(pick(a.mobs),'',{hp:.5,atk:.35,spd:.85,x:.5});f.cat7='mid_add';f.rtg=0;if(SIM.M)SIM.M.mech.addB=(SIM.M.mech.addB||0)+1}}catch(e){SIM.err(e)}return r}}
{const _tk2=foeTake6;foeTake6=function(f,d,src){const r=_tk2.apply(this,arguments);try{if(SIM.knob.mechC&&B&&f&&f.kind==='boss'&&!f.mid7&&!f.summon7&&f.hp>0&&f.hp<f.max*.5&&!f.c50&&SKM.v6M09){f.c50=1;f.next='v6M09';if(SIM.M)SIM.M.mech.c50=(SIM.M.mech.c50||0)+1}}catch(e){SIM.err(e)}return r}}
{const _s7=summon7;summon7=function(f){try{if(SIM.knob.mechC&&f&&f.c50&&f.hp<f.max*.35&&!f.sm35){f.sm35=1}}catch(e){}return _s7.apply(this,arguments)}}

{const _ra=rtAuto;rtAuto=function(){try{const k=SIM.knob.react;if(k&&B&&B.rt){const w=B.rtw;if(w&&w.dg&&!B.guard){const rem=w.dur-w.t;if(rem>.95&&rem<2.5&&B.hp>0)return;/* 等到能擋的時機 */
  if(rem>.15&&Math.random()<k){if(SIM.M)SIM.M.mech.react=(SIM.M.mech.react||0)+1;rtDo(w.mg?'@guard':'@parry');return}}}}catch(e){SIM.err(e)}return _ra.apply(this,arguments)}}
/* ---------- 建角色 ---------- */
const MA={'力':'STR','敏':'DEX','智':'INT'};
const SLOTTY=()=>{const J=jobEq(),o={};for(const sl of SL6){const ks=Object.keys(V6.EQ).filter(k=>{try{return slotsOfType(k).includes(sl)&&canUseType(k,sl)}catch(e){return false}});o[sl]=ks}return o};
SIM.setup=function(o){/* o:{cls,adv,lv,area,build:'auto'|'opt',rar,style,tal} */
  try{if(window.C761){if(SIM.knob&&SIM.knob.c761)C761.on();else C761.off();C761.log={}}}catch(e){SIM.err(e)}
  const m=document.getElementById('maint');if(m)m.remove();MAINT=false;try{localStorage.clear()}catch(e){}
  newGame('測試',o.cls,'m');S.tut=Object.fromEntries(Object.keys(TIPS).map(k=>[k,1]));while(S.lv<o.lv)gainExp(need(S.lv));if(o.adv)S.adv=o.adv;learn(true);EFC=null;
  const ma=MA[jobEq().main_attr]||'STR';let n=0;while(S.pts>0&&n<999){const k=(n++%3===2)?'VIT':ma;if(S.attr[k]>=ATTRMAX){const x=Object.keys(ATTR).find(a=>S.attr[a]<ATTRMAX);if(!x)break;S.attr[x]++}else S.attr[k]++;S.pts--}
  for(let i=0;i<10;i++)S.cleared[i]=i<o.area?1:0;S.main.ch=Math.max(S.main.ch||0,o.area);S.gear=[];S.eq={main:null,off:null,head:null,body:null,feet:null,neck:null,ring:null};
  if(o.build==='auto'){const nd=o.drops||24;for(let i=0;i<nd;i++)dropGear6(S.lv,'N',{force:1});for(let i=0;i<(o.drops?0:4);i++)dropGear6(S.lv,'E',{force:1});autoEquip6()}
  else{const T=SLOTTY();for(const sl of SL6){if(sl==='off'&&S.eq.main){const g0=gearBy(S.eq.main);if(g0&&V6.EQ[g0.k].occ===2)continue}const ks=T[sl];if(!ks.length)continue;let best=null;for(const k of ks){const g=genGear(k,Math.max(1,S.lv-(o.glag||0)),o.rar);if(!best||gearPower(g)>gearPower(best))best=g}S.gear.push(best);eqSet(best,sl)}}
  /* 天賦 */
  S.tal={};SIM.talBr=o.tal;if(o.tal!=null&&o.tal>=0){const T=TALS(),br=[...new Set(T.map(t=>t.br))],order=[br[o.tal%br.length],...br.filter((b,i)=>i!==o.tal%br.length)];
    for(let g=0;g<200&&talFree6()>0;g++){let did=false;for(const b of order){const c=T.filter(t=>t.br===b&&talCan6(t)).sort((a,b2)=>a.lv-b2.lv)[0];if(c){S.tal[c.id]=(S.tal[c.id]||0)+1;did=true;break}}if(!did)break}}
  EFC=null;
  /* 技能配置 */
  S.lo7=null;try{const L=lo7();const st=o.style||'均衡',jn=clsName(),R=V6.LOAD.find(x=>x.job===jn&&x.style===st);if(R){const ok=R.a.filter(k=>SK[k]&&skOk6(k));L.a=[baseSk7().id,...ok].slice(0,4);L.p=R.p.filter(k=>SK[k]&&skOk6(k)).slice(0,3)}}catch(e){SIM.err(e)}
  if(o.loadC&&window.C761){try{const L=lo7(),j=job6(),ca=C761.CAND.filter(k=>SK[k]&&SK[k].c===j&&skOk6(k));const A=ca.filter(k=>SK[k].act&&k!==baseSk7().id),P=ca.filter(k=>!SK[k].act);L.a=[...A,...L.a.filter(k=>!A.includes(k))].slice(0,3);L.p=[...P,...L.p.filter(k=>!P.includes(k))].slice(0,3);EFC=null}catch(e){SIM.err(e)}}
  if(o.party==='gale'){S.flags=S.flags||{};S.flags.galeBack=1}if(o.party!==undefined)S.party=o.party;else S.party='luna';EFC=null;const best=re=>(V6.CONS.filter(x=>x.lv<=S.lv&&re.test(x.n||'')).sort((a,b)=>b.lv-a.lv)[0]||{}).id;SIM.cons=best(/生命藥/);SIM.cons2=best(/魔力藥/);
  SIM.snap=JSON.stringify(S);return {job:clsName(),lv:S.lv,eq:SL6.filter(s=>S.eq[s]).length,pow:power(),tal:talUsed6(),luna:typeof withLuna==='function'?withLuna():null,ally:!!mkAlly()}};
function refill(){const s=stats();S.hp=s.HP;S.mp=s.MP;S.items={};if(SIM.cons)S.items[SIM.cons]=5;if(SIM.cons2)S.items[SIM.cons2]=3;EFC=null}

/* ---------- 戰鬥與流程 ---------- */
function battle(M){const t0=now;B.auto=AUTO=true;let n=0;const hp0=S.hp;
  while(B&&B.rt&&!B.rt.done&&n<36000){rtStep(.05);adv(50);n++}
  const bt=B&&B.rt?B.rt.t:0;M.btime+=bt;M.battles++;if(n>=36000){SIM.res='TIMEOUT';return}
  for(let k=0;k<60&&B;k++)adv(100)}
function view(M){if(typeof STORY!=='undefined'&&STORY){try{stNext()}catch(e){STORY=null}return}if(MODAL){MODAL=null;return}
  const v=RUN.view||{};if(v.type==='fork'){const o=v.opts.find(x=>x==='rest')||v.opts.find(x=>x==='battle')||v.opts[0];RUN.nodes[RUN.step+1]=o;runNext();return}
  if(v.type==='camp'){campPick('go');return}if(v.type==='gate'){ACT.bossGo();return}if(v.type==='ev6'){ev6Do(1);return}
  if(v.type==='event'||v.type==='shrine'||v.type==='shop'){RUN.view={type:'res',title:'',text:''};return}
  if(RUN.step>=RUN.nodes.length-1){M.zones++;if(RUN.dg&&dgCanGo()&&dgNextArea()>=0){dgNext();return}SIM.res='WIN';RUN=null;return}
  runNext()}
function drive(M){for(let i=0;i<4000;i++){if(SIM.res)return;if(!RUN){if(!SIM.res)SIM.res='LOSE';return}
  if(B){M.where={area:RUN.area,step:RUN.step,dg:RUN.dg?RUN.dg.k:null,foes:[B,...(B.adds||[])].map(f=>(f.cat7||'?')+':'+f.name)};battle(M);continue}
  view(M);adv(30)}SIM.res=SIM.res||'STUCK'}
function newM(){return {an:SIM.anNew?SIM.anNew():null,mech:{},heal:{},lvups:0,btime:0,battles:0,taken:0,skillT:0,dot:0,mp:0,casts:0,pots:0,fsk:0,zones:0,skillBy:{},takenBy:{},where:null}}
SIM.run=function(kind,arg,keep){const M=SIM.M=newM();SIM.res='';if(window.C761)C761.log={};if(!keep)refill();TAB='adv';RUN=null;B=null;MODAL=null;
  try{if(kind==='dg'){DGDIFF=0;startDg(arg,0)}else startRun(arg)}catch(e){SIM.err(e);return {res:'NOSTART'}}
  if(!RUN)return {res:'NOSTART'};const s=stats(),hpMax=s.HP,mpMax=s.MP;
  try{if(M.an)M.an.eff=effs6().map(e=>e.from+':'+e.k)}catch(e){}
  try{drive(M)}catch(e){SIM.err(e);SIM.res='ERR'}
  if(M.an){M.an.minHp=M.an._mh!=null?+M.an._mh.toFixed(2):null;delete M.an._mh;delete M.an.ring}
  B=null;RUN=null;MODAL=null;STORY=null;Q.length=0;
  return {res:SIM.res,bt:Math.round(M.btime),nb:M.battles,hp:+(M.taken/hpMax).toFixed(2),mp:+(M.mp/mpMax).toFixed(2),pots:M.pots,sk:M.taken?+(M.skillT/M.taken).toFixed(3):0,
    skillBy:M.skillBy,takenBy:M.takenBy,where:SIM.res==='WIN'?null:M.where,zones:M.zones,an:M.an,mech:M.mech,c761:window.C761?Object.assign({},C761.log):null,heal:Object.fromEntries(Object.entries(M.heal).map(([k,v])=>[k,+(v/hpMax).toFixed(3)])),lvups:M.lvups,lv:S.lv}};
SIM.qlen=()=>Q.length;
/* 回城整備（照全自動）：配點（主屬性 2：體力 1）、天賦照原路線、一鍵換裝 */
function townPrep(){const ma=MA[jobEq().main_attr]||'STR';let n=0;while(S.pts>0&&n<999){const k=(n++%3===2)?'VIT':ma;if(S.attr[k]>=ATTRMAX){const x=Object.keys(ATTR).find(a=>S.attr[a]<ATTRMAX);if(!x)break;S.attr[x]++}else S.attr[k]++;S.pts--}
  if(SIM.talBr!=null&&SIM.talBr>=0){const T=TALS(),br=[...new Set(T.map(t=>t.br))],order=[br[SIM.talBr%br.length],...br.filter((b,i)=>i!==SIM.talBr%br.length)];S.tal=S.tal||{};
    for(let g=0;g<200&&talFree6()>0;g++){let did=false;for(const b of order){const c=T.filter(t=>t.br===b&&talCan6(t)).sort((a,b2)=>a.lv-b2.lv)[0];if(c){S.tal[c.id]=(S.tal[c.id]||0)+1;did=true;break}}if(!did)break}}
  EFC=null;try{autoEquip6()}catch(e){SIM.err(e)}if(S.gear.length>80){S.gear=S.gear.filter(g=>SL6.some(sl=>S.eq[sl]===g.u)||g.lv>=S.lv-5).slice(-80)}EFC=null}
/* 連續探索：不每趟補滿。第一趟前滿血、生命藥 6／魔力藥 3、金幣＝等級×150；之後每趟回城照全自動規則：HP<70% 或 MP<50% 付錢休息，藥水補到 6／3（留等級×12 G） */
SIM.chain=function(kind,arg,n){refill();S.items={};if(SIM.cons)S.items[SIM.cons]=6;if(SIM.cons2)S.items[SIM.cons2]=3;S.gold=S.lv*150;const out=[];
  for(let i=0;i<n;i++){const g0=S.gold,p0=potCount('hp')+potCount('mp');const r=SIM.run(kind,arg,true);r.goldEarn=S.gold-g0;
    townPrep();let spentRest=0,spentPot=0;const s=stats();if(S.hp<s.HP*.7||S.mp<s.MP*.5){const c=S.lv*4;if(S.gold>=c){S.gold-=c;S.hp=s.HP;S.mp=s.MP;spentRest=c}}
    const keep=S.lv*12;for(const [kind2,want] of [['hp',6],['mp',3]]){const k=potShop(kind2);while(potCount(kind2)<want&&ITEMS[k]&&S.gold-ITEMS[k].price>=keep){S.gold-=ITEMS[k].price;addItem(k,1);spentPot+=ITEMS[k].price}}
    r.spentRest=spentRest;r.spentPot=spentPot;r.gold=S.gold;r.hpStart=null;out.push(r)}return out};/* 獨立趟：每趟開始都還原成建角色當下的狀態（等級、經驗、金幣、裝備一致） */
SIM.batch=function(kind,arg,n){const out=[];for(let i=0;i<n;i++){if(SIM.snap){S=JSON.parse(SIM.snap);EFC=null}out.push(SIM.run(kind,arg))}return out};
})();
