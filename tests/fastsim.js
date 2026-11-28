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

const SIM=W.SIM={errs:[],err(e){if(SIM.errs.length<20)SIM.errs.push(String(e&&e.stack||e).slice(0,300))},cand:null,M:null};

/* ---------- 怪物分類（開戰時標記；換位會跟著怪物走） ---------- */
{const _g=grpDone7;grpDone7=function(){const r=_g.apply(this,arguments);try{const L=[B,...(B.adds||[])];
  for(const f of L){let c;if(B.mid7)c=f===B?'mid':'mid_add';else if(B.kind==='boss')c=f===B?'boss':'boss_add';else if(B.kind==='elite')c=f===B?'elite':'elite_add';else c=L.length>1?'grp':'solo';f.cat7=c}}catch(e){SIM.err(e)}return r}}
{const _a=addFoe7;addFoe7=function(){const f=_a.apply(this,arguments);try{if(B&&B.rt&&B.rt.t>0)f.cat7='summon'}catch(e){}return f}}
const catOf=f=>f.summon7?'summon':(f.cat7||'solo');
/* 候選方案：只改怪物「技能」的直接傷害與冷卻 */
function candMul(f){const C=SIM.cand;if(!C)return [1,0];const c=catOf(f);return C[c]||[1,0]}
{const _h=foeHit6;foeHit6=function(f,k,s,o){const r=_h.apply(this,arguments);try{if(r&&!r.miss&&k&&k.pow){const m=candMul(f)[0];if(m!==1)r.d=Math.max(1,Math.round(r.d*m))}
    const M=SIM.M;if(M&&r&&!r.miss){const c=catOf(f);M.taken+=r.d;if(k&&k.pow){M.skillT+=r.d;M.skillBy[c]=(M.skillBy[c]||0)+r.d}M.takenBy[c]=(M.takenBy[c]||0)+r.d}}catch(e){SIM.err(e)}return r}}
{const _fa=foeAttack6;foeAttack6=function(f,id,fx,o){const r=_fa.apply(this,arguments);try{const k=id?SKM[id]:null;if(k&&k.v6&&B&&B.rt){const add=candMul(f)[1];if(add)f.mcd[id]=(f.mcd[id]||0)+add}if(k&&SIM.M)SIM.M.fsk++}catch(e){SIM.err(e)}return r}}
{const _st=stTick;stTick=function(t){const h=S.hp;const r=_st.apply(this,arguments);try{if(t==='p'&&SIM.M&&S.hp<h){SIM.M.dot+=h-S.hp;SIM.M.taken+=h-S.hp}}catch(e){}return r}}
{const _us=useSkill6;useSkill6=function(k){try{if(SIM.M&&B&&B.chgRel!==k){SIM.M.mp+=mpCost6(k);SIM.M.casts++}}catch(e){}return _us.apply(this,arguments)}}
{const _ui=useItem6;useItem6=function(k,inB){const n=S.items[k]||0;const r=_ui.apply(this,arguments);try{if(SIM.M&&(S.items[k]||0)<n)SIM.M.pots++}catch(e){}return r}}
{const _l=lose;lose=function(){SIM.res='LOSE';return _l.apply(this,arguments)}}

/* ---------- 建角色 ---------- */
const MA={'力':'STR','敏':'DEX','智':'INT'};
const SLOTTY=()=>{const J=jobEq(),o={};for(const sl of SL6){const ks=Object.keys(V6.EQ).filter(k=>{try{return slotsOfType(k).includes(sl)&&canUseType(k,sl)}catch(e){return false}});o[sl]=ks}return o};
SIM.setup=function(o){/* o:{cls,adv,lv,area,build:'auto'|'opt',rar,style,tal} */
  const m=document.getElementById('maint');if(m)m.remove();MAINT=false;try{localStorage.clear()}catch(e){}
  newGame('測試',o.cls,'m');S.tut=Object.fromEntries(Object.keys(TIPS).map(k=>[k,1]));while(S.lv<o.lv)gainExp(need(S.lv));if(o.adv)S.adv=o.adv;learn(true);EFC=null;
  const ma=MA[jobEq().main_attr]||'STR';let n=0;while(S.pts>0&&n<999){const k=(n++%3===2)?'VIT':ma;if(S.attr[k]>=ATTRMAX){const x=Object.keys(ATTR).find(a=>S.attr[a]<ATTRMAX);if(!x)break;S.attr[x]++}else S.attr[k]++;S.pts--}
  for(let i=0;i<10;i++)S.cleared[i]=i<o.area?1:0;S.main.ch=Math.max(S.main.ch||0,o.area);S.gear=[];S.eq={main:null,off:null,head:null,body:null,feet:null,neck:null,ring:null};
  if(o.build==='auto'){for(let i=0;i<24;i++)dropGear6(S.lv,'N',{force:1});for(let i=0;i<4;i++)dropGear6(S.lv,'E',{force:1});autoEquip6()}
  else{const T=SLOTTY();for(const sl of SL6){if(sl==='off'&&S.eq.main){const g0=gearBy(S.eq.main);if(g0&&V6.EQ[g0.k].occ===2)continue}const ks=T[sl];if(!ks.length)continue;let best=null;for(const k of ks){const g=genGear(k,S.lv,o.rar);if(!best||gearPower(g)>gearPower(best))best=g}S.gear.push(best);eqSet(best,sl)}}
  /* 天賦 */
  S.tal={};if(o.tal!=null&&o.tal>=0){const T=TALS(),br=[...new Set(T.map(t=>t.br))],order=[br[o.tal%br.length],...br.filter((b,i)=>i!==o.tal%br.length)];
    for(let g=0;g<200&&talFree6()>0;g++){let did=false;for(const b of order){const c=T.filter(t=>t.br===b&&talCan6(t)).sort((a,b2)=>a.lv-b2.lv)[0];if(c){S.tal[c.id]=(S.tal[c.id]||0)+1;did=true;break}}if(!did)break}}
  EFC=null;
  /* 技能配置 */
  S.lo7=null;try{const L=lo7();const st=o.style||'均衡',jn=clsName(),R=V6.LOAD.find(x=>x.job===jn&&x.style===st);if(R){const ok=R.a.filter(k=>SK[k]&&skOk6(k));L.a=[baseSk7().id,...ok].slice(0,4);L.p=R.p.filter(k=>SK[k]&&skOk6(k)).slice(0,3)}}catch(e){SIM.err(e)}
  EFC=null;const best=re=>(V6.CONS.filter(x=>x.lv<=S.lv&&re.test(x.n||'')).sort((a,b)=>b.lv-a.lv)[0]||{}).id;SIM.cons=best(/生命藥/);SIM.cons2=best(/魔力藥/);
  return {job:clsName(),lv:S.lv,eq:SL6.filter(s=>S.eq[s]).length,pow:power(),tal:talUsed6()}};
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
function newM(){return {btime:0,battles:0,taken:0,skillT:0,dot:0,mp:0,casts:0,pots:0,fsk:0,zones:0,skillBy:{},takenBy:{},where:null}}
SIM.run=function(kind,arg){const M=SIM.M=newM();SIM.res='';refill();TAB='adv';RUN=null;B=null;MODAL=null;
  try{if(kind==='dg'){DGDIFF=0;startDg(arg,0)}else startRun(arg)}catch(e){SIM.err(e);return {res:'NOSTART'}}
  if(!RUN)return {res:'NOSTART'};const s=stats(),hpMax=s.HP,mpMax=s.MP;
  try{drive(M)}catch(e){SIM.err(e);SIM.res='ERR'}
  B=null;RUN=null;MODAL=null;STORY=null;Q.length=0;
  return {res:SIM.res,bt:Math.round(M.btime),nb:M.battles,hp:+(M.taken/hpMax).toFixed(2),mp:+(M.mp/mpMax).toFixed(2),pots:M.pots,sk:M.taken?+(M.skillT/M.taken).toFixed(3):0,
    skillBy:M.skillBy,takenBy:M.takenBy,where:SIM.res==='WIN'?null:M.where,zones:M.zones}};
SIM.qlen=()=>Q.length;SIM.batch=function(kind,arg,n){const out=[];for(let i=0;i<n;i++)out.push(SIM.run(kind,arg));return out};
})();
