/* 大改版 V6.3：mob 模組（A 線：怪物＋地區＋內容，見 .docs/v6iface.md）
   - 10 區等級帶、怪物生成 mkFoe6、怪物技能模板／AI／被動／首領階段、出招 foeTurn
   - 經驗金幣與掉落（呼叫 B 的 dropGear6）、死亡與逃跑
   - 探索遭遇權重、探索事件、討伐委託、成就、圖鑑揭露、首領紀錄、終局難度 */
(function(){'use strict';})();
const ZN6=V6.ZONE;
const MLV6=lv=>V6.MLV[Math.max(1,Math.min(100,Math.round(lv)))-1];/* [lv,hp低,hp高,攻低,攻高,防低,防高,抗低,抗高,秒低,秒高,EXP,金幣] */
const RANK6={N:V6.MRANK[0],E:V6.MRANK[1],B:V6.MRANK[2]};
const ROLE6=Object.fromEntries(V6.MROLE.map(r=>[r.id,r]));
const PASS6=Object.fromEntries(V6.MPASS.map(p=>[p.id,p]));
const PHASE6=Object.fromEntries(V6.PHASE.map(p=>[p.id,p]));
const MSK6=Object.fromEntries(V6.MSK.map(t=>[t.id,t]));
const hash6=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const rng6=seed=>{let x=hash6(seed);return()=>{x=(x+0x6D2B79F5)>>>0;let t=Math.imul(x^x>>>15,1|x);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const lerp6=(a,b,u)=>a+(b-a)*u;
const clamp6=(v,a,b)=>Math.max(a,Math.min(b,v));
const has6=(t,id)=>{try{return typeof stHas==='function'&&!!stHas(t,id)}catch(e){return false}};
const now6=()=>B&&B.rt?B.rt.t:(B?B.turn*3:0);
const zoneOf6=()=>RUN&&AREAS[RUN.area]?RUN.area:0;

/* ============ 地區：現有 7 區對到 Z01～Z07，新增 Z08～Z10 ============ */
const NEWZ6=[
  {id:'dragon',n:'龍之山谷',d:'山谷裡的岩壁全是爪痕。龍睡在這裡很久了。',mobs:['dragonling','wyvern','rockdrake'],boss:'elderdragon'},
  {id:'rift',n:'地下裂谷',d:'地面裂開以後，下面的東西爬了上來。',mobs:['impling','voidhound','abysseye'],boss:'abyssbeast'},
  {id:'oldcastle',n:'古城',d:'霧最早出現的地方。城門沒有關。',mobs:['castleknight','ghostmage','gargoyle'],boss:'castleguard'}];
const NEWM6={
  dragonling:{n:'炎鱗幼龍',ty:'brute',base:'icedragon',f:'hue-rotate(170deg) saturate(1.6) brightness(.95)',race:'dragon',el:['ice','fire']},
  wyvern:{n:'迅翼飛龍',ty:'swift',base:'bat',f:'hue-rotate(80deg) saturate(1.3) brightness(1.1)',race:'flyer',el:['thunder']},
  rockdrake:{n:'岩甲地龍',ty:'tank',base:'golem',f:'hue-rotate(20deg) saturate(1.4) brightness(.9)',race:'dragon',el:['ice']},
  elderdragon:{n:'巨龍',ty:'brute',base:'icedragon',f:'hue-rotate(150deg) saturate(1.8) brightness(.85)',race:'dragon',el:['ice','fire'],boss:1},
  impling:{n:'深淵小鬼',ty:'swift',base:'demon',f:'hue-rotate(250deg) brightness(.75) saturate(1.4)',race:'demon',el:['holy','dark']},
  voidhound:{n:'裂谷影犬',ty:'brute',base:'wolf',f:'brightness(.45) saturate(1.6) hue-rotate(260deg)',race:'demon',el:['holy','dark']},
  abysseye:{n:'裂谷魔眼',ty:'caster',base:'phantom',f:'hue-rotate(120deg) saturate(1.8)',race:'demon',el:['holy','dark']},
  abyssbeast:{n:'深淵魔物',ty:'brute',base:'demon',f:'brightness(.6) saturate(1.8) hue-rotate(290deg)',race:'demon',el:['holy','dark'],boss:1},
  castleknight:{n:'古城騎士',ty:'tank',base:'darkknight',f:'saturate(.3) brightness(1.1)',race:'undead',el:['holy','dark']},
  ghostmage:{n:'幽魂術士',ty:'caster',base:'phantom',f:'hue-rotate(190deg) saturate(1.2) brightness(1.15)',race:'undead',el:['holy','dark']},
  gargoyle:{n:'石像鬼',ty:'swift',base:'golem',f:'saturate(.2) brightness(.75)',race:'construct',el:['thunder']},
  castleguard:{n:'古城守衛',ty:'tank',base:'darkknight',f:'sepia(.8) saturate(1.6) brightness(1.05)',race:'construct',el:['holy','dark'],boss:1}};
(function z6Setup(){
  for(const k in NEWM6){const v=NEWM6[k];MVAR[k]={n:v.n,lv:1,ty:v.ty,base:v.base,f:v.f,sk:[],el:v.el,boss:v.boss};MOBS[k]={n:v.n,lv:1,ty:v.ty,sk:[],boss:v.boss,v6new:1};MEL[k]=v.el;RACEOF[k]=v.race}
  for(const a of NEWZ6)if(!AREAS.some(x=>x.id===a.id))AREAS.push(Object.assign({},a));
  AREAS.forEach((a,i)=>{const z=ZN6[i];if(!z)return;a.z6=i;a.lv=`${z.lo}–${z.hi}`;a.base=z.lo;if(MOBS[a.boss])MOBS[a.boss].lv=z.hi;a.mobs.forEach(m=>{if(MOBS[m]&&MOBS[m].v6new)MOBS[m].lv=z.lo})});
  for(let i=0;i<CHLV.length||i<CH.length;i++)if(ZN6[i])CHLV[i]=ZN6[i].lo;
  /* 新增的戰鬥欄位要跟著主怪／小怪一起換位 */
  FK.push('ft6','role6','race6','tags','rank6','sk6','ai6','pass6','ph6','phx6','mcd','hit6','cd6','pen6','acts6','fhit6','p34','p22','p23','atkM6','eres6','block6','thorn6','ten6','dr6First','critRes6');
  NODE.rare=['✪','稀有蹤跡','稀有怪・必掉裝備'];NODE.gather=['❀','採集點','採集同區素材'];
  NRISK.rare='危險 ★★　必掉裝備';NRISK.gather='無危險・素材';
  ITEMS.mark6={n:'終局印記',d:'在討伐委託頁換取素材',price:0,sell:0};
})();
/* 區域開放：擊敗前一區首領，且達到該區最低等級 */
function areaOpen6(i){return i===0||(!!S.cleared[i-1]&&S.lv>=(ZN6[i]?ZN6[i].lo:1))}
const _bossReady6=bossReady;
bossReady=function(i){if(!CH[i])return true;return _bossReady6(i)};

/* ============ 怪物定位、種族、標籤 ============ */
const RACEZ6={beast:'野獸',flyer:'野獸',slime:'元素',plant:'植物',undead:'不死',construct:'構裝',humanoid:'人形',dragon:'野獸',elemental:'元素',insect:'野獸',demon:'魔族'};
function role6Of(id){const m=MOBS[id]||{},r=rng6('role'+id),mech=m.mech||'',sk=(m.sk||[]).join(',');
  if(id==='shadow')return 'BAL';
  if(/rebound|spike|grudge/.test(mech))return 'COUNTER';
  if(/plate|iron/.test(mech))return 'TANK';
  if(/veil/.test(mech))return 'FAST';
  if(/swell|enrage/.test(mech))return 'BERSERK';
  if(/cleanse|grove|undying/.test(mech))return 'REGEN';
  if(/summon/.test(mech))return 'CTRL';
  if(/ward/.test(mech))return 'WARD';
  if(/m_suck|m_devour|m_soul/.test(sk))return 'DRAIN';
  if(/m_spore|m_rotmist/.test(sk))return 'VENOM';
  const T={tank:['TANK','GUARD','WARD'],swift:['FAST','HUNTER','FAST'],caster:['MAGE','DOT','CTRL'],brute:['BURST','BERSERK','BAL']}[m.ty]||['BAL'];
  return T[Math.floor(r()*T.length)]}
const AI6={BURST:'AI01',MAGE:'AI01',TANK:'AI02',GUARD:'AI02',WARD:'AI02',FAST:'AI03',HUNTER:'AI03',CTRL:'AI04',DOT:'AI05',VENOM:'AI05',REGEN:'AI06',DRAIN:'AI06',COUNTER:'AI07',BERSERK:'AI08',BAL:'AI09'};
function tags6Of(id,role,race){const t=[race];const e=(MEL[id]||[])[0];
  if(role==='TANK')t.push('重甲');
  if(raceOf(id)==='slime')t.push('柔軟');
  if(raceOf(id)==='construct')t.push(/crystal|guard/.test(id)?'金屬':'岩石');
  if(e==='fire'&&race!=='植物')t.push('冰霜');if(e==='ice')t.push('火焰');if(e==='thunder'&&!t.includes('金屬'))t.push('金屬');if(e==='dark')t.push('神聖');
  return [...new Set(t)]}

/* ============ 怪物技能模板 → 戰鬥用技能（放進 SKM，即時戰鬥的出招預告直接吃得到） ============ */
const FXC6={物理:['claw','#ffd2a8'],魔法:['orb','#b9a8ff'],多段:['claw','#ffffff'],持續傷害:['spore','#9ae05a'],弱化:['roar','#d6a8ff'],ATB:['slam','#8fdcff'],防禦:['aura','#c9b08a'],恢復:['heal','#9affc0'],強化:['roar','#ff9a4a'],反制:['claw','#ff7a6a'],條件:['claw','#ff5a7a'],首領:['beam','#ff4a4a'],基礎:['claw','#ffffff'],特色:['slam','#ffcf8a']};
function msk2skm6(t){const fx=t.fx||'',k={n:t.n,v6:t.id,cd:t.cd||0,cat:t.cat,min:t.min,w:t.w||50,d:fx==='基礎'?'普通攻擊':fx};let m;
  const c=FXC6[t.cat]||FXC6.物理;k.fx=c[0];k.c=c[1];
  if(/^(物|魔|物或魔)$/.test(t.dt)&&t.pow>0){k.pow=t.pow/100;if(t.dt==='魔')k.mag=1;if(t.dt==='物或魔')k.either=1}
  if((m=fx.match(/分(\d)段/))){k.h=+m[1];k.pow=k.pow/k.h}
  if(/預告/.test(fx))k.tele=1;
  if(!/^自身/.test(fx)&&(m=fx.match(/(?:命中後|命中附加|命中必定附加|^附加)\s*([A-Z]+)/))){k.inf=m[1];const p=fx.match(/機率(\d+)%/);k.p=p?+p[1]/100:1}
  if(/^中毒/.test(fx)){k.inf='POISON';k.p=1;k.idur=6}
  if(/^灼燒/.test(fx)){k.inf='BURN';k.p=1;k.idur=6}
  if((m=fx.match(/自身附加([A-Z]+)/)))k.selfSt=m[1];
  if((m=fx.match(/恢復最大HP(\d+)%/)))k.heal=+m[1]/100;
  if((m=fx.match(/吸收實際傷害(\d+)%/)))k.drain=+m[1]/100;
  if(/清除自身1個負面/.test(fx))k.cleanse=1;
  if((m=fx.match(/玩家行動條扣(\d+)%/)))k.atbHit=+m[1];
  if(/自身行動條\+20/.test(fx))k.atbSelf=20;
  if(/減傷25%/.test(fx)){k.selfSt='GUARD';k.sv=25}
  if(/^攻擊\+15%/.test(fx)){k.selfSt='RAGE';k.sv=15}
  if(/玩家行動時間\+10%/.test(fx)){k.inf='SLOW';k.p=1;k.iv=10}
  /* 反制／條件技能：符合條件才會被選 */
  if(/上次受到物傷/.test(fx))k.cond='hitP';else if(/玩家有護盾/.test(fx))k.cond='pShield';else if(/上次成功迴避/.test(fx))k.cond='evaded';else if(/玩家上次使用攻擊技能/.test(fx))k.cond='pSkill';
  else if(/玩家有負面狀態/.test(fx))k.cond='pDebuff';else if((m=fx.match(/自身HP低於(\d+)%/))){k.cond='selfLow';k.cv=+m[1]}else if((m=fx.match(/玩家HP低於(\d+)%/))){k.cond='pLow';k.cv=+m[1]}
  else if(/玩家HP高於80%/.test(fx)){k.cond='pHigh';k.cv=80}else if((m=fx.match(/玩家(中毒|灼燒|有獵印|破甲|魔蝕)時/))){k.cond='pSt';k.cv={中毒:'POISON',灼燒:'BURN',有獵印:'MARK',破甲:'ARMOR',魔蝕:'DRAIN'}[m[1]]}
  else if(/自身狂怒/.test(fx))k.cond='selfRage';else if(/自身已行動5次/.test(fx))k.cond='acts5';
  return k}
for(const t of V6.MSK)SKM['v6'+t.id]=msk2skm6(t);
/* 新的出招預告規則：只有標示「預告」的模板放紅圈大招；舊技能照舊規則 */
function isDng(k){return !!k&&(k.v6?!!k.tele:!!k.pow&&((k.pow||0)>=1.6||(k.h||1)>=3))}
function chgDue(){return false}

/* 依定位挑技能：普通 2～3、精英 4～5、首領 6～8，至少一個基礎技 */
const POOL6={BAL:['物理','魔法'],TANK:['防禦','物理'],FAST:['多段','ATB'],MAGE:['魔法','弱化'],BURST:['物理','多段'],VENOM:['持續傷害','物理'],REGEN:['恢復','物理'],GUARD:['防禦','物理'],DRAIN:['恢復','魔法'],CTRL:['ATB','弱化'],COUNTER:['反制','物理'],DOT:['持續傷害','魔法'],BERSERK:['強化','物理'],WARD:['防禦','魔法'],HUNTER:['條件','物理']};
const RANKORD6={普通:0,精英:1,首領:2};
function skills6(id,role,rk){const r=rng6('sk'+id+rk),ri=RANKORD6[{N:'普通',E:'精英',B:'首領'}[rk]],mag=['MAGE','WARD','DOT','DRAIN'].includes(role)||(MOBS[id]&&MOBS[id].ty==='caster');
  const ok=t=>RANKORD6[t.min]<=ri&&t.cat!=='基礎',byCat=c=>V6.MSK.filter(t=>t.cat===c&&ok(t)),take=(arr,n,out)=>{arr=arr.filter(t=>!out.includes(t.id));for(let i=0;i<n&&arr.length;i++){const j=Math.floor(r()*arr.length);out.push(arr.splice(j,1)[0].id)}};
  const out=[mag?'M02':'M01'],n=rk==='B'?6+Math.floor(r()*3):rk==='E'?4+Math.floor(r()*2):2+Math.floor(r()*2);
  const sig={BURST:'M03',VENOM:'M04',MAGE:'M05',GUARD:'M06',BERSERK:'M07',CTRL:'M08'}[role];if(sig&&out.length<n)out.push(sig);
  const P=POOL6[role]||POOL6.BAL;
  if(rk==='B'){out.push('M09');take(byCat('首領'),2,out)}
  if(rk!=='N'&&out.length<n)take(byCat(rk==='E'&&role!=='HUNTER'?'反制':'條件'),1,out);
  let guard=0;while(out.length<n&&guard++<20){take(byCat(P[out.length%2]),1,out)}
  /* 最多一個硬控（失衡＝暈眩） */
  const hc=out.filter(x=>MSK6[x]&&/STUN/.test(MSK6[x].fx));if(hc.length>1)hc.slice(1).forEach(x=>out.splice(out.indexOf(x),1));
  return out.map(x=>'v6'+x)}
function passives6(id,role,rk){const r=rng6('ps'+id+rk),n=rk==='B'?2+Math.floor(r()*2):rk==='E'?1+Math.floor(r()*2):Math.floor(r()*2),ri=RANKORD6[{N:'普通',E:'精英',B:'首領'}[rk]];
  const ban={FAST:['P04'],TANK:['P01'],WARD:['P20'],REGEN:['P17'],DRAIN:['P18'],COUNTER:['P19'],BERSERK:['P21']}[role]||[];
  const pool=V6.MPASS.filter(p=>RANKORD6[p.min]<=ri&&!ban.includes(p.id)),out=[];for(let i=0;i<n&&pool.length;i++)out.push(pool.splice(Math.floor(r()*pool.length),1)[0].id);return out}
function phases6(id){const r=rng6('ph'+id),a=1+Math.floor(r()*10),b=11+Math.floor(r()*10);return ['PH'+String(a).padStart(2,'0'),'PH'+b]}

/* ============ 怪物等級 ============ */
const OLDB6=[1,5,10,15,20,26,30,34];
function ol2n6(L){for(let i=0;i<7;i++)if(L<OLDB6[i+1]){const f=clamp6((L-OLDB6[i])/(OLDB6[i+1]-OLDB6[i]),0,1);return Math.round(ZN6[i].lo+f*9)}return clamp6(ZN6[6].hi+(L-34)*2,1,100)}
function towerLv(f){return Math.min(100,25+Math.round(f*1.5))}
function foeLv6(id,rk){const m=MOBS[id]||{};if(RUN&&RUN.tower)return RUN.tlv||towerLv(RUN.floor||1);if(RUN&&RUN.trial||id==='shadow')return S.lv;
  if(RUN&&RUN.dg){const b=ol2n6(m.lv||1),dd=[0,3,6][RUN.dg.diff||0];return clamp6(Math.max(b,Math.min(S.lv,b+8))+dd+(rk==='B'?2:0),1,100)}
  const z=ZN6[zoneOf6()]||ZN6[0],lo=z.lo,hi=z.hi;
  if(rk==='B')return clamp6(Math.max(S.lv+1,Math.round((lo+hi)/2)),lo,hi);
  return clamp6(S.lv+(rk==='E'?1:0)+Math.floor(Math.random()*4)-2,lo,hi)}

/* ============ mkFoe6：等級範圍 × 階級 × 定位 × 種族 × 被動 ============ */
function mkFoe6(zi,rk,opt){opt=opt||{};const id=opt.id||pick(AREAS[zi].mobs),m=MOBS[id]||{n:id,ty:'brute'},L=opt.L||foeLv6(id,rk);
  const row=MLV6(L),R=RANK6[rk],role=opt.role||role6Of(id),O=ROLE6[role]||ROLE6.BAL,race=RACEZ6[raceOf(id)]||'野獸',u=Math.random(),rr=(a)=>lerp6(a[0],a[1],Math.random());
  const ps=opt.pass||passives6(id,role,rk);
  let hp=lerp6(row[1],row[2],u)*rr(R.hp)*O.hp*(ps.includes('P03')?1.08:1),atk=lerp6(row[3],row[4],u)*rr(R.atk)*O.atk,def=lerp6(row[5],row[6],u)*R.def*O.def*(ps.includes('P01')?1.1:1),mres=lerp6(row[7],row[8],u)*R.def*O.mres*(ps.includes('P02')?1.1:1);
  let ft=lerp6(row[9],row[10],u)*R.spd*O.spd/(ps.includes('P05')?1.05:1);ft=clamp6(ft,2,6);
  const D=endOn6()?[[1,1,1],[1.5,1.15,1.05],[2.2,1.3,1.1]][S.diff6||0]:[1,1,1];hp*=D[0];atk*=D[1];def*=D[2];mres*=D[2];
  const f={id,name:m.n,lv:L,L,rank6:rk,role6:role,race6:race,tags:tags6Of(id,role,race),hp:Math.round(hp),max:Math.round(hp),atk:Math.round(atk*(ps.includes('P06')?1.05:1)),mag:Math.round(atk*(ps.includes('P07')?1.05:1)),def:Math.round(def),mres:Math.round(mres),
    eva:(role==='FAST'?8:0)+(ps.includes('P04')?5:0),crit:5+(ps.includes('P09')?5:0),cd6:150+(ps.includes('P10')?10:0),hit6:100+(ps.includes('P08')?5:0),pen6:{p:ps.includes('P30')?5:0,m:ps.includes('P31')?5:0},
    ft6:ft,sk6:opt.sk||skills6(id,role,rk),pass6:ps,ai6:rk==='B'?'AI10':(AI6[role]||'AI09'),ph6:rk==='B'?phases6(id):[],phx6:{},mcd:{},acts6:0,fhit6:0,atkM6:1,
    block6:ps.includes('P37')?8:0,thorn6:ps.includes('P19')?5:0,ten6:ps.includes('P32')?15:0,dr6First:ps.includes('P16')?15:0,critRes6:ps.includes('P40')?15:0,
    eres6:Object.assign({},ps.includes('P38')?{fire:10,ice:10,thunder:10}:{},ps.includes('P39')?{holy:10,dark:10}:{})};
  if(ps.includes('P20')||role==='WARD')f.fshield=Math.round(f.max*.05);
  return f}
const endOn6=()=>!!(S&&S.lv>=LVMAX&&S.cleared&&S.cleared[9]);

/* 主程式呼叫的 mkFoe(id,kind) 改用新表，保留舊欄位（霧、霧紋、惡夢詞綴、魔物機制） */
function mkFoe(id,kind){const m=MOBS[id],bs=!!(m&&m.boss)||kind==='boss',rk=bs?'B':kind==='elite'?'E':'N',nm=!!(RUN&&RUN.nm);
  const L=foeLv6(id,rk)+(nm?10:0),f=mkFoe6(zoneOf6(),rk,{id,L:Math.min(100,L)});
  const aff=[];if(nm){const ks=Object.keys(AFF).sort(()=>Math.random()-.5);aff.push(...ks.slice(0,bs?2:1))}
  if(aff.includes('rage'))f.atk=Math.round(f.atk*1.4),f.mag=Math.round(f.mag*1.4);if(aff.includes('shell'))f.def=Math.round(f.def*1.8),f.mres=Math.round(f.mres*1.8);if(aff.includes('swift'))f.eva+=15,f.crit+=15;
  if(RUN&&RUN.dg){const dd=RUN.dg.diff||0;f.hp=f.max=Math.round(f.max*[1,1.4,1.95][dd]);f.atk=Math.round(f.atk*[1,1.2,1.45][dd]);f.mag=Math.round(f.mag*[1,1.2,1.45][dd])}
  const pre=(nm?'惡夢・':'')+(rk==='E'?'精英':'');
  return Object.assign(f,{m,a:{},kind:bs?'boss':kind,mut:false,nm,aff,name:pre+m.n,fb:[],fshield:f.fshield||0,st:{},rage:1,bm:false,trait:m.mech||undefined,fog:FOGN(false,bs),fogMax:FOGN(false,bs)})}
function scaleFoe(){}
/* 開場被動與事件效果 */
const _startBattle6=startBattle;
startBattle=function(id,kind,nAdds){_startBattle6(id,kind,nAdds);if(!B)return;B.dmgT6=0;B.t06=Date.now();
  if(RUN&&RUN.rare6){RUN.rare6=0;B.rare6=1;B.hoard=1;B.name='稀有・'+B.m.n;B.hp=B.max=Math.round(B.max*1.15);B.log.push(`✪ 稀有的 ${B.m.n}！`)}
  if(RUN&&RUN.open6){const o=RUN.open6;RUN.open6=null;if(typeof stAdd==='function'){try{stAdd('p',o,{})}catch(e){}}B.log.push(o==='FOCUS'?'祭壇的祝福還在身上（專注）':'詛咒纏上了你（詛咒）');if(o==='CURSE')B.bonusGear6=1}
  if(RUN&&RUN.bonus6){B.bonus6=RUN.bonus6;RUN.bonus6=null}
  dexSkill6()};

/* ============ 怪物 AI：冷卻、條件、權重 ============ */
function condOk6(k,f){const s=stats(),hp=S.hp/Math.max(1,s.HP)*100,fh=f.hp/f.max*100,L=B.lastP6||{};
  switch(k.cond){case 'hitP':return !!L.phys;case 'pShield':return B.shield>0||has6('p','SHIELD');case 'evaded':return !!L.miss;case 'pSkill':return !!L.skill;
    case 'pDebuff':return pDebuff6();case 'selfLow':return fh<k.cv;case 'pLow':return hp<k.cv;case 'pHigh':return hp>k.cv;case 'pSt':return has6('p',k.cv)||(k.cv==='POISON'&&B.pst&&B.pst.poison>0)||(k.cv==='BURN'&&B.pst&&B.pst.burn>0);
    case 'selfRage':return has6(f,'RAGE');case 'acts5':return (f.acts6||0)>=5}return true}
function pDebuff6(){try{if(typeof stList==='function')return stList('p').some(x=>x.bad)}catch(e){}const p=B.pst||{};if(p.poison>0||p.burn>0||p.bleed>0||p.weak>0||p.stun>0)return true;return ['POISON','BURN','BLEED','WEAK','ARMOR','RESIST','SLOW','FROST','SHOCK','CURSE','BLIND','VULN','FEAR','MARK','DRAIN','ROOT','WOUND','FATIGUE','SILENCE'].some(x=>has6('p',x))}
function foePick(){if(!B||!B.sk6)return null;const f=B,t=now6(),fh=f.hp/f.max,ph=f.hp/f.max<.5?1:0;
  const C=f.sk6.filter(id=>{const k=SKM[id];if(!k)return false;if((f.mcd[id]||0)>t)return false;if(k.cond&&!condOk6(k,f))return false;if(k.heal&&fh>.7)return false;if(k.cleanse&&!foeDebuff6(f))return false;if(k.selfSt&&has6(f,k.selfSt))return false;return true});
  if(!C.length)return null;
  const W=C.map(id=>{const k=SKM[id];let w=k.w||50;const ai=f.ai6;
    if(ai==='AI01'&&k.pow&&k.pow*(k.h||1)>=Math.max(...C.map(x=>(SKM[x].pow||0)*(SKM[x].h||1))))w*=2;
    if(ai==='AI02'&&fh<.4&&k.cat==='防禦')w*=3;
    if(ai==='AI03'&&k.cond&&pDebuff6())w*=3;
    if(ai==='AI04'&&k.cat==='ATB')w*=2;
    if(ai==='AI05'&&k.cat==='持續傷害')w*=2;
    if(ai==='AI06'&&fh<.5&&k.cat==='恢復')w*=3;
    if(ai==='AI07'&&k.cat==='反制')w*=3;
    if(ai==='AI08'&&fh<.3&&k.pow)w*=3;
    if(ai==='AI10'){if(k.cat==='首領')w*=ph?3:.5}
    if(k.cat==='基礎')w=ai==='AI09'?10:50;
    return w});
  if(f.ai6==='AI09'){const nb=C.find(id=>SKM[id].cat!=='基礎');if(nb&&Math.random()<.5)return nb}
  let r=Math.random()*W.reduce((a,b)=>a+b,0);for(let i=0;i<C.length;i++)if((r-=W[i])<0)return SKM[C[i]].cat==='基礎'?null:C[i];return null}
function foeDebuff6(f){if(f.st&&Object.values(f.st).some(v=>v>0))return true;return ['POISON','BURN','BLEED','WEAK','ARMOR','RESIST','SLOW','FROST','SHOCK','CURSE','HEX','VULN','FEAR','MARK','SCORCH','EXPOSE'].some(x=>has6(f,x))}

/* ============ 首領階段（70%、35% 各一次） ============ */
function phaseChk6(fx){const f=B;if(!f.ph6||!f.ph6.length||f.hp<=0)return;
  for(const pid of f.ph6){const P=PHASE6[pid];if(!P||f.phx6[pid]||f.hp/f.max*100>P.at)continue;f.phx6[pid]=1;const fx2=P.fx;let m;
    if(/^攻擊\+10%/.test(fx2)){f.atk=Math.round(f.atk*1.1);f.mag=Math.round(f.mag*1.1)}
    else if(/^速度\+10%/.test(fx2))f.ft6=Math.max(2,f.ft6/1.1);
    else if(/^防禦\+15%/.test(fx2))f.def=Math.round(f.def*1.15);
    else if(/^魔抗\+15%/.test(fx2))f.mres=Math.round(f.mres*1.15);
    else if(/^物防穿透/.test(fx2))f.pen6.p+=5;
    else if(/^魔抗穿透/.test(fx2))f.pen6.m+=5;
    else if((m=fx2.match(/^回HP(\d+)%/))){const h=Math.round(f.max*m[1]/100);f.hp=Math.min(f.max,f.hp+h);if(fx)fx.fheal=h}
    else if((m=fx2.match(/^護盾(\d+)%HP/)))f.fshield=(f.fshield||0)+Math.round(f.max*m[1]/100);
    else if(/^清除全部負面/.test(fx2)){f.st={};try{if(typeof stClear==='function')stClear(f,true)}catch(e){}}
    else if((m=fx2.match(/^下次命中附加([A-Z]+)/)))f.nextInf6=m[1];
    else if(/預告強招M09/.test(fx2))B.next='v6M09';
    else if(/^自身行動條\+20/.test(fx2))B.rtg=Math.min(99,(B.rtg||0)+20);
    else if(/^自身防禦-15%、攻擊\+15%/.test(fx2)){f.def=Math.round(f.def*.85);f.atk=Math.round(f.atk*1.15);f.mag=Math.round(f.mag*1.15)}
    else if(/^爆擊\+10/.test(fx2))f.crit+=10;
    else if(/^解鎖/.test(fx2)){const last=V6.MSK.filter(t=>t.cat==='首領').slice(-1)[0];if(last&&!f.sk6.includes('v6'+last.id))f.sk6.push('v6'+last.id)}
    blog(`${f.name}【${P.n}】${fx2}`);if(fx){fx.cut=P.n;fx.fsk='m_rage'}}}

/* ============ 傷害到玩家 ============ */
const st6Src=f=>({atk:f.atk,mag:f.mag,lv:f.L});
function inflict6(id,f,o){o=o||{};if(!id)return;if(typeof stAdd==='function'){try{stAdd('p',id,Object.assign({src:st6Src(f)},o));blog(`你陷入${(V6.STAT.find(x=>x.id===id)||{n:id}).n}`);return}catch(e){}}
  const M={POISON:['poison',3],BURN:['burn',2],BLEED:['bleed',3],WEAK:['weak',2],STUN:['stun',1]}[id];if(M&&B.pst){B.pst[M[0]]=Math.max(B.pst[M[0]]||0,M[1]);blog(`你陷入${HST[M[0]]||M[0]}`)}}
function mobSelfSt6(f,id,v){if(typeof stAdd==='function'){try{stAdd(f,id,{v});return}catch(e){}}
  const M={HARDEN:{def:.25},WARD:{mres:.25},GUARD:{def:.25},RAGE:{atk:.2},FOCUS:{crit:10},HASTE:{},THORN:{},SHIELD:{}}[id]||{};if(id==='SHIELD')f.fshield=(f.fshield||0)+Math.round(f.max*.08);else f.fb.push(Object.assign({id:'v6'+id,n:(V6.STAT.find(x=>x.id===id)||{n:id}).n,t:2},M))}
/* 直接攻擊一次：回傳 {d,miss,cr,blk} */
function foeHit6(f,k,s,o){o=o||{};const mag=k?(k.either?f.mag>=f.atk&&f.role6==='MAGE':!!k.mag):(f.role6==='MAGE'||f.role6==='WARD'),pw=k?k.pow:1,h=k&&k.h||1;
  let hit=clamp6((f.hit6||100)-(has6(f,'BLIND')?15:0),0,100)/100*(1-clamp6((s.EVA||0)+(typeof buffSum==='function'?buffSum('eva'):0),0,95)/100);
  if(o.sure)hit=1;if(Math.random()>hit)return{d:0,miss:1};
  const hpP=S.hp/Math.max(1,s.HP);
  let am=(f.atkM6||1)*(1+fbSum('atk'))*(has6(f,'RAGE')?1.2:1)*(has6(f,'FEAR')?.9:1)*(!mag&&has6(f,'WEAK')?.85:1)*(mag&&has6(f,'HEX')?.85:1)*(f.st&&f.st.weak>0?.75:1)*grudgeM();
  const ps=f.pass6||[];if(ps.includes('P21')&&f.hp/f.max<.3)am*=1.1;if(f.role6==='BERSERK'&&f.hp/f.max<.3)am*=1.1;if(ps.includes('P26')&&!f.fhit6)am*=1.15;if(ps.includes('P27')&&hpP<.3)am*=1.1;if(ps.includes('P28')&&pDebuff6())am*=1.05;
  if(ps.includes('P35')&&(f.acts6||0)%3===2)am*=1.1;
  if(typeof stVal==='function'){try{am*=1-clamp6(+stVal(f,'dmgDown')||0,0,30)/100}catch(e){}}
  const base=(mag?f.mag:f.atk)*pw*h*am;
  const pen=mag?f.pen6.m:f.pen6.p,def=(mag?(s.MRES||0):(s.DEF||0)*(1+(typeof buffSum==='function'?buffSum('def'):0))*(1-(k&&k.pierce||0)))*(1-clamp6(pen,0,30)/100);
  let d=base*100/(100+Math.max(0,def))*(.9+Math.random()*.2),cr=false;
  if(Math.random()*100<(f.crit||5)+(has6(f,'FOCUS')?10:0)+fbSum('crit')){d*=(f.cd6||150)/100;cr=true}
  let vul=(has6('p','VULN')?10:0)+(mag&&has6('p','SHOCK')?10:0);vul=Math.min(25,vul);d*=1+vul/100;
  const red=Math.min(40,(mag?(s.MRED||0):(s.PRED||0))+(has6('p','GUARD')?20:0));d*=1-red/100;
  let blk=false;if(!mag&&Math.random()*100<Math.min(35,s.BLOCK||0)){d*=.65;blk=true}
  if(ps.includes('P29')&&(B.shield>0||has6('p','SHIELD')))d*=1.15;
  return{d,cr,blk,mag}}
function applyHit6(f,r,fx,k,nm,o){o=o||{};const s=stats();let d=r.d;
  if(B.lunaWard){d*=.6;B.lunaWard=0;blog('魔法護盾擋下了部分衝擊')}
  if(B.guard)d*=o.big?.25:.5;if(B.guard&&o.big){B.opening=1;blog('✦ 完美防禦！下次攻擊傷害 +50%');setTimeout(()=>{try{talk('guard')}catch(e){}},600)}
  d=Math.max(1,Math.round(d));let ab=0;if(B.shield>0){ab=Math.min(B.shield,d);B.shield-=ab;d-=ab}
  S.hp=Math.max(0,S.hp-d);B.dmgT6=(B.dmgT6||0)+d;fx.d=(fx.d||0)+d;fx.cr=fx.cr||r.cr;fx.quake=!!k||d>s.HP*.15;f.fhit6=1;
  try{SFX.hurt(k&&!B.rt?.85:0);buzz(k?120:50)}catch(e){}
  blog(`${f.name} 的${nm}造成 ${d} 傷害${r.cr?'（爆擊）':''}${ab?`（護盾吸收 ${ab}）`:''}${r.blk?'（格擋率）':''}`);
  if(S.hp<=0&&B.endure){S.hp=1;B.endure=0;blog('鬥氣護體！以 1 HP 撐了下來')}
  if(S.hp<=0&&typeof gearFatal6==='function'&&gearFatal6()){S.hp=1;blog('【不屈】撐住了致命一擊')}
  if(S.hp>0&&typeof gearLowHp6==='function'&&S.hp<stats().HP*.3){const a=gearLowHp6();if(a>0&&typeof stAdd==='function'){try{stAdd('p','SHIELD',{amt:a,dur:6});blog(`套裝護盾展開（${a}）`)}catch(e){}}}
  if(s.THORN&&d>0&&f.hp>1){const t=Math.min(f.hp-1,Math.max(1,Math.round(d*s.THORN/100)));f.hp-=t;blog(`反傷 ${t}`)}
  const ps=f.pass6||[],dr=(k&&k.drain||0)+(ps.includes('P18')?.05:0)+(f.role6==='DRAIN'?.08:0)+((f.aff||[]).includes('leech')?.3:0);
  if(dr&&d>0){const h=Math.round(d*dr);f.hp=Math.min(f.max,f.hp+h);if(h>0){fx.fheal=(fx.fheal||0)+h;blog(`${f.name} 吸取了 ${h} HP`)}}
  if(k&&k.inf&&Math.random()<(k.p||1))inflict6(k.inf,f,{dur:k.idur,v:k.iv});
  if(f.nextInf6){inflict6(f.nextInf6,f,{});f.nextInf6=null}
  const P={P11:'POISON',P12:'BURN',P13:'FROST',P14:'BLEED',P15:'SHOCK'};for(const p of ps)if(P[p]&&(f.mcd[p]||0)<=now6()&&Math.random()<.15){f.mcd[p]=now6()+9;inflict6(P[p],f,{})}
  if(f.role6==='VENOM'&&Math.random()<.2)inflict6('POISON',f,{dur:6});
  if((f.aff||[]).includes('venom')&&B.pst)B.pst.poison=Math.max(B.pst.poison||0,2);
  if(k&&k.atbHit&&B.rt){B.rt.pg=Math.max(0,B.rt.pg-k.atbHit);blog(`你的行動條被打退了`)}}
function foeAttack6(f,id,fx,o){o=o||{};const s=stats(),k=id?SKM[id]:null,nm=k?`【${k.n}】`:'攻擊';
  if(k&&k.v6&&B.rt)f.mcd[id]=now6()+(k.cd||0);
  if(k){fx.cut=k.n;fx.fsk=id;dexSkill6(id)}
  if(k&&!k.pow){const ps=[];
    if(k.heal){const h=Math.round(f.max*Math.min(k.heal,f.kind==='boss'?.03:1)*(has6(f,'BURN')||(f.st&&f.st.burn>0)?.5:1));f.hp=Math.min(f.max,f.hp+h);fx.fheal=h;ps.push(`回復 ${h} HP`)}
    if(k.selfSt){mobSelfSt6(f,k.selfSt,k.sv);ps.push((V6.STAT.find(x=>x.id===k.selfSt)||{n:k.selfSt}).n)}
    if(k.cleanse){const ks=Object.keys(f.st||{}).filter(x=>f.st[x]>0);if(ks.length)f.st[ks[0]]=0;try{if(typeof stClear==='function')stClear(f,false,1)}catch(e){}ps.push('清除負面')}
    if(k.atbSelf&&B.rt)B.rtg=Math.min(99,(B.rtg||0)+k.atbSelf);
    if(k.inf)inflict6(k.inf,f,{v:k.iv});
    if(!k.v6){if(k.self){f.fb.push(Object.assign({id,n:k.n},k.self));ps.push(k.d)}if(k.shield){f.fshield=Math.round(f.max*k.shield);ps.push(`護盾 ${f.fshield}`)}}
    blog(`${f.name} 使用${nm}${ps.length?'，'+ps.join('，'):''}`);return}
  if(k&&k.atbSelf&&B.rt)B.rtg=Math.min(99,(B.rtg||0)+k.atbSelf);
  if(!o.add&&!(B.rt&&(B.rt.pr>B.rt.t||B.rt.ev>B.rt.t))&&allyTgt()){const r=foeHit6(f,k,s,{sure:1});allyHurt(r.d,nm,f.name);return}
  if(B.rt&&rtReact(fx,nm,o.add?f:null,k||(f.role6==='MAGE'?{mag:1}:null),o.big)){return}
  const r=foeHit6(f,k,s);
  if(r.miss){fx.miss=1;try{SFX.miss()}catch(e){}blog(`你閃開了 ${f.name} 的${nm}`);B.lastE6=1;return}
  applyHit6(f,r,fx,k,nm,o);
  /* 連擊被動：再補 35% */
  if((f.pass6||[]).includes('P36')&&S.hp>0&&Math.random()<.03){const r2=Object.assign({},r,{d:r.d*.35});applyHit6(f,r2,fx,null,'連擊',o)}}

/* ============ 怪物回合：tick＝每 3 秒結算，act＝出手 ============ */
function foeTurn(){if(!B)return;
  if(B.treasure&&B.turn>=(B.rt?6:3)&&B.hp>0){B=null;RUN.view={type:'res',title:'寶藏魔物逃走了',text:'牠抱著閃亮的寶物鑽進草叢，不見了。'};render();return}
  if(MODAL&&MODAL.k==='foe'){setTimeout(foeTurn,300);return}
  const TK=!B.rt||B.rtPh==='tick',AC=!B.rt||B.rtPh==='act';if(TK)B.tk=0;const s=stats();
  if(TK){tick6(s);if(!B)return;if(B.hp<=0){render();winSoon(1350);return}if(S.hp<=0){if(B.rt)B.rt.done=1;render();setTimeout(lose,1100);return}}
  if(!B.rt){allyAct();if(B.hp<=0){render();winSoon(1350);return}}
  const fx=AC?(B.fx={by:'foe'}):{};
  if(AC){phaseChk6(fx);
    if(B.st.stun>0||has6(B,'STUN')){if(B.st.stun>0&&!B.rt)B.st.stun--;fx.stun=1;blog(`${B.name} 暈眩中`)}
    else{const id='next' in B?B.next:foePick();delete B.next;const k=id?SKM[id]:null;
      foeAttack6(B,id,fx,{big:!!(k&&isDng(k))});B.acts6=(B.acts6||0)+1;B.lastP6={}}
    if(B.opn2){B.opening=0;B.opn2=0}
    if(!('next' in B))B.next=foePick();}
  if(!B.rt)for(const f of B.adds||[]){if(f.hp<=0||S.hp<=0)continue;if(f.st.stun>0){f.st.stun--;continue}const r={};foeAttack6(f,null,fx,{add:1})}
  if(S.hp<=0){if(B.rt)B.rt.done=1;render();setTimeout(lose,1100);return}
  if(B.hp<=0){render();winSoon(1350);return}
  if(B.rt){if(AC)rtFoeDone(fx);render();return}
  B.busy=false;render()}
function tick6(s){const usedTick=typeof stTick==='function';
  if(usedTick){if(!B.rt)try{stTick('p');stTick(B);for(const f of B.adds||[])if(f.hp>0)stTick(f)}catch(e){}}
  else{for(const k of ['poison','burn'])if(B.st[k]>0){const d=Math.max(1,Math.round(B.max*(k==='poison'?.05:.04)*(B.kind==='boss'?.5:1)));B.hp=Math.max(0,B.hp-d);try{dsrc(k==='burn'?'灼燒':'中毒',d)}catch(e){}B.st[k]--;blog(`${B.name} 受到${FOE[k]}傷害 ${d}`)}
    try{addsDot()}catch(e){}
    for(const [h,r,n] of [['poison',.04,'毒素發作'],['burn',.05,'灼燒'],['bleed',.035,'流血']])if(S.hp>0&&B.pst[h]>0){const d=Math.max(1,Math.round(s.HP*r));S.hp=Math.max(0,S.hp-d);B.pst[h]--;blog(`${n}，損失 ${d} HP`)}
    if(B.pst.weak>0)B.pst.weak--;if(B.st.weak>0)B.st.weak--;}
  if(B.st.stun>0&&B.rt){B.st.stun--;if(!B.st.stun)blog(`${B.name} 醒過來了`)}
  const f=B,ps=f.pass6||[];
  if(f.hp>0){
    if((ps.includes('P17')||f.role6==='REGEN')&&!(has6(f,'BURN')||f.st.burn>0)){const h=Math.max(1,Math.round(f.max*(ps.includes('P17')?.005:0)+f.max*(f.role6==='REGEN'?.01:0)));f.hp=Math.min(f.max,f.hp+h)}
    if(ps.includes('P22')&&!f.p22&&f.hp/f.max<.25){f.p22=1;f.fshield=(f.fshield||0)+Math.round(f.max*.08);blog(`${f.name}【護命】張開護盾`)}
    if(ps.includes('P23')&&!f.p23&&f.hp/f.max<.2){f.p23=1;const h=Math.round(f.max*.05);f.hp=Math.min(f.max,f.hp+h);blog(`${f.name}【復甦】回復 ${h} HP`)}
    if(ps.includes('P24')&&f.hp/f.max<.3&&!f.p24){f.p24=1;f.ft6=Math.max(2,f.ft6/1.1)}
    if(ps.includes('P25')){f.mresB6=f.mresB6||f.mres;f.mres=f.hp/f.max>.8?Math.round(f.mresB6*1.1):f.mresB6}
    if(ps.includes('P33')&&B.turn%6===5){const ks=Object.keys(f.st||{}).filter(x=>f.st[x]>0);if(ks.length){f.st[ks[0]]=0;blog(`${f.name}【淨化】清掉了一個負面狀態`)}try{if(typeof stClear==='function')stClear(f,false,1)}catch(e){}}
    if(f.role6==='GUARD'&&(f.acts6||0)>0&&(f.acts6%3===0)&&f.gdA6!==f.acts6){f.gdA6=f.acts6;f.fshield=(f.fshield||0)+Math.round(f.max*.05)}
    phaseChk6(null)}
  /* 保留的魔物機制（大副本霧紋等） */
  if((B.trait==='cleanse'||B.trait==='grove')&&B.hp>0&&(B.st.burn>0||B.st.poison>0||B.st.bleed>0)){B.st.burn=0;B.st.poison=0;B.st.bleed=0;const h=Math.round(B.max*.04);B.hp=Math.min(B.max,B.hp+h);blog(`${B.name} 的【${TRX(B.trait).n}】清除了持續傷害，回復 ${h} HP`)}
  if((B.trait==='summon'||B.trait==='grove')&&B.hp>0&&B.turn%3===0&&(B.adds||[]).filter(x=>x.hp>0).length<2&&RUN){try{const a=mkFoe(pick(AREAS[RUN.area].mobs.slice(0,2)),'');a.hp=a.max=Math.round(a.max*.6);B.adds=(B.adds||[]).filter(x=>x.hp>0);B.adds.push(a);blog(`${B.name} 叫來了 ${a.name}！`)}catch(e){}}
  if(B.trait==='undying'&&B.hp>0&&!(B.st.burn>0||B.st.poison>0||has6(B,'BURN')||has6(B,'POISON'))){const h=Math.round(B.max*.05);B.hp=Math.min(B.max,B.hp+h);blog(`${B.name} 的【不死】再生 ${h} HP`)}
  if(B.spk){blog(`【尖刺】你被反彈了 ${B.spk} 傷害`);B.spk=0}
  if((B.aff||[]).includes('regen')&&B.turn<20){const h=Math.round(B.max*.06);B.hp=Math.min(B.max,B.hp+h)}
  if(RUN&&RUN.tower&&B.turn>=12&&B.hp>0){B.atk=Math.round(B.atk*1.1);B.mag=Math.round(B.mag*1.1);if(B.turn===12)blog('霧越來越濃，牠的力氣變大了')}
  if(B.turn===8&&!B.talkDrag){B.talkDrag=1;setTimeout(()=>{try{talk('drag')}catch(e){}},900)}
  /* 玩家側：裝備回血回魔、舊增益遞減 */
  if(S.hp>0&&s.REGEN){const h=Math.max(1,Math.round(s.HP*s.REGEN/100*(has6('p','SAPPED')?.5:1)));S.hp=Math.min(s.HP,S.hp+h)}
  if(S.hp>0&&(s.MREGEN||s.MPREG)){S.mp=Math.min(s.MP,S.mp+Math.max(1,Math.round(s.MP*(s.MREGEN||s.MPREG)/100)))}
  B.fb.forEach(b=>b.t--);B.fb=B.fb.filter(b=>b.t>0);
  if(B.buffs){B.buffs.forEach(b=>b.t--);B.buffs=B.buffs.filter(b=>b.t>0)}
  B.turn++;
  if(B.elHit==='w')dexWeak6()}
/* 小怪的即時出手 */
function rtAddGo(f){B.rt.ph0=S.hp;f.rtw=null;f.rtg=0;f.rta=performance.now()+420;const fx=B.fx&&B.fx.by==='foe'?B.fx:(B.fx={by:'foe'});fx.af=f;
  if(f.st&&f.st.stun>0||has6(f,'STUN')){if(f.st.stun>0)f.st.stun--;return}
  foeAttack6(f,null,fx,{add:1});f.acts6=(f.acts6||0)+1}
/* 行動秒：表上低～高 × 定位 × 階級；速度狀態合計減速上限 30%（首領減半） */
function rtFT(f,add){let t=f.ft6||((typeof rtTy==='function'?rtTy(f).ft:2));let sp=0;
  if(has6(f,'HASTE'))sp+=15;let sl=(has6(f,'SLOW')?20:0)+(has6(f,'FROST')?15:0)+(has6(f,'ROOT')?10:0)+(has6(f,'FEAR')?10:0);sl=Math.min(30,sl);if(f.kind==='boss')sl/=2;
  t=t/(1+sp/100)/(1-sl/100);return clamp6(t,2,6)}
/* 致命傷保留 1 HP（不屈） */
const _winSoon6=winSoon;
winSoon=function(ms){if(B&&B.hp<=0&&(B.pass6||[]).includes('P34')&&!B.p34){B.p34=1;B.hp=1;blog(`${B.name}【不屈】撐住了`);if(B.rt)B.rt.done=0;render();return}return _winSoon6(ms)};
/* 記下玩家上一個動作（給反制技能判斷） */
const _rtSync6=rtSync;
rtSync=function(){try{if(B&&B.fx&&B.fx.by==='me'){const f=B.fx;B.lastP6={phys:f.d>0&&CLS[S.cls]&&CLS[S.cls].basic!=='MAG',miss:f.d===0,skill:!!f.skill&&f.d>0};if(B.elHit==='w')dexWeak6()}}catch(e){}return _rtSync6()};
/* 敵人卡片的狀態標籤 */
function rtFstat(f,m){const o=[];const R=ROLE6[f.role6];
  if(m){const e=MEL[f.id];if(e&&e[0]&&S.dex&&S.dex.w&&S.dex.w[f.id])o.push(`<b class="w">弱 ${(ELI[e[0]]||e[0]).replace(/^[^一-鿿]+/,'')}</b>`);if(R&&R.id!=='BAL')o.push(`<b class="g">${R.n}</b>`);if(f.trait&&TRX(f.trait))o.push(`<b class="g">${TRX(f.trait).n}</b>`);if(f.fog>0)o.push(`<b>霧 ${f.fog}</b>`);if(f.fshield>0)o.push('<b class="g">盾</b>')}
  for(const k in f.st||{})if(f.st[k]>0)o.push(`<b>${FOE[k]||k}</b>`);
  try{if(typeof stList==='function')stList(f).slice(0,3).forEach(x=>o.push(`<b${x.bad?'':' class="g"'}>${x.n}</b>`))}catch(e){}
  (f.aff||[]).forEach(x=>AFF[x]&&o.push(`<b class="g">${AFF[x].n}</b>`));return o.slice(0,m?5:3).join('')}

/* ============ 勝利結算：經驗、金幣、素材、裝備 ============ */
function zmat6(z,k){const lo=(ZN6[z]||ZN6[0]).lo;const L=V6.MAT.filter(x=>x.lv===lo);return L[k]?L[k].id:null}/* 0礦石 1草藥 2魔晶 3獸材 4強化石 5首領印記 */
function zcons6(z,k){const lo=(ZN6[z]||ZN6[0]).lo;const L=V6.CONS.filter(x=>x.lv===lo);return L[k]?L[k].id:'pot'}/* 0生命藥 1魔力藥 2淨化劑 3守護藥 */
const itemN6=id=>(ITEMS[id]&&ITEMS[id].n)||((V6.MAT.find(x=>x.id===id)||V6.CONS.find(x=>x.id===id)||{}).n)||id;
function give6(id,n,got){if(!id||!n)return;addItem(id,n);if(got)got.push(itemN6(id)+(n>1?'×'+n:''))}
function gearDrop6(L,rk,got,opt){try{if(typeof dropGear6==='function'){const gs=dropGear6(L,rk,opt||{})||[];for(const g of gs)got.push(typeof gearName6==='function'?gearName6(g):(g.n||'裝備'));return gs.length}}catch(e){try{localStorage.setItem('ao_err','dropGear6 '+e)}catch(_){}}
  if(typeof rollGear==='function'&&typeof GEAR!=='undefined'&&Math.random()<({N:.12,E:.65,B:1}[rk]||.12)||(opt&&opt.force)){try{const g=rollGear(dropTier(RUN.area),rk==='B'?2:rk==='E'?1:0);got.push(gearName(g));return 1}catch(e){}}return 0}
function zst6(z){S.z6=S.z6||{};return S.z6[z]||(S.z6[z]={ex:0,kN:0,kE:0,kB:0,ch:0,ga:0})}
function spoil(){const m=B.m,L=B.L,bs=B.kind==='boss',rk=B.rank6||(bs?'B':B.kind==='elite'?'E':'N'),T=B.tot||(B.tot={exp:0,gold:0,got:[],names:[]}),got=T.got,s=stats();
  const row=MLV6(L),R=RANK6[rk],xm=(B.nm?2.5:1)*(B.xmul||1),z=zoneOf6();
  const exp=Math.round(row[11]*R.exp*xm*(fortK('exp')?1.15:1)*liveExp()*xpPen(L)*(1+(s.EXP||0)/100));
  const gold=Math.round(row[12]*R.gold*(B.gmul||1)*(B.nm?2.5:1)*(.9+Math.random()*.2)*(fortK('gold')?1.25:1)*(RUN&&RUN.bless==='luck'?1.3:1)*(1+(s.GOLD||0)/100));
  S.gold+=gold;T.exp+=exp;T.gold+=gold;T.names.push(B.name);
  if(B.id!=='shadow'){if(Math.random()<({N:.15,E:.5,B:1}[rk]))give6(zmat6(z,Math.random()<.5?2:3),1,got);if(bs)give6(zmat6(z,5),1,got)}
  if(Math.random()<.04)give6(zcons6(z,0),1,got);
  if(B.id!=='shadow'&&!(RUN&&RUN.trial)){const dr=RUN&&RUN.tower?'tower':RUN&&RUN.dg?'dg':'field';
    gearDrop6(L,B.rare6?'E':rk,got,{force:!!(B.hoard||B.rare6),src:dr,boss:bs?B.id:null,zone:z});
    if(B.bonusGear6)gearDrop6(L,'N',got,{force:1,zone:z});
    if(endOn6()&&S.diff6&&Math.random()<[0,.5,1][S.diff6])gearDrop6(L,rk,got,{zone:z,extra:1})}
  if(B.bonus6){const b=B.bonus6;if(b.mat!=null)give6(zmat6(z,b.mat),b.n||1,got)}
  got.push(...liveDrop(bs));
  track('kill',B.id);S.st.kills++;if(S.dex){S.dex.m[B.id]=(S.dex.m[B.id]||0)+1}if(bs&&B.nm)S.st.nmboss=(S.st.nmboss||0)+1;
  if(!(RUN&&(RUN.tower||RUN.trial))){const Z=zst6(z);if(rk==='B')Z.kB++;else if(rk==='E')Z.kE++;else Z.kN++}
  if(bs&&B.id!=='shadow'&&!(RUN&&RUN.trial)){const rec=(S.brec6=S.brec6||{})[B.id]||(S.brec6[B.id]={w:0,t:null,dm:null}),t=Math.round((B.rt?B.rt.t:B.turn*3)*10)/10,dm=B.dmgT6||0;rec.w++;rec.t=rec.t==null?t:Math.min(rec.t,t);rec.dm=rec.dm==null?dm:Math.min(rec.dm,dm)}
  const fld=!!m.field;if(bs&&!fld&&!RUN.trial&&!RUN.tower){S.cleared[RUN.area]=1;track('boss',B.id);sys(`${S.name} 討伐了首領【${m.n}】！`)}}
/* 滿級後的經驗換終局印記 */
const _gainExp6=gainExp;
gainExp=function(n){if(S&&S.lv>=LVMAX&&n>0){S.endx=(S.endx||0)+n;const nd=need(LVMAX-1);let k=0;while(S.endx>=nd){S.endx-=nd;k++}if(k){addItem('mark6',k);toast(`終局印記 +${k}`)}return}return _gainExp6(n)};
/* 戰敗：回據點、扣 5% 金幣（上限＝同級普通怪金幣×10），HP／MP 全滿 */
function lose(){try{SFX.lose()}catch(e){}const lid=B?B.id:null,L=B?B.L:S.lv;const lost=Math.min(Math.round(S.gold*.05),MLV6(L)[12]*10),s=stats();S.gold=Math.max(0,S.gold-lost);S.hp=s.HP;S.mp=s.MP;B=null;RUN=null;TAB='town';save();render();
  openM('msg',{t:'戰敗',b:`<div class="panel"><div class="duo">${art(ARTSET&&ARTSET.has(AK()+'_dm')?AK()+'_dm':HK()+'_lose','戰敗','r34')}${lid&&lid!=='shadow'?art('mob_'+lid+'_win','','r11'):''}</div><p>${you('你')}倒下了。巡邏隊把你送回晨星鎮，途中遺失了 ${lost} G。</p></div><button class="btn pri big" data-a="closeM">確定</button>`})}
/* 逃跑：普通 80%、精英 50%、首領 0%（耗掉一次行動） */
function fleeChance6(){if(!B)return 0;return B.kind==='boss'?0:B.kind==='elite'?.5:.8}

/* ============ 圖鑑揭露：首殺顯示名稱、命中弱點才揭露、看過才揭露技能 ============ */
function dexWeak6(){if(!B||!S.dex)return;S.dex.w=S.dex.w||{};S.dex.w[B.id]=1}
function dexSkill6(id){if(!B||!S.dex)return;S.dex.s=S.dex.s||{};const o=S.dex.s[B.id]||(S.dex.s[B.id]={});if(id)o[id]=1}

/* ============ 探索：遭遇權重 普通 65、精英 8、稀有 2、事件 12、採集 8、寶箱 5 ============ */
function startRun(i,nm){DROPS=[];const POOL=[['battle',65],['ambush',8],['rare',2],['event',12],['gather',8],['chest',5]];
  const wp=ex=>{const P=POOL.filter(p=>p[0]!==ex);let r=Math.random()*P.reduce((a,b)=>a+b[1],0);for(const p of P)if((r-=p[1])<0)return p[0];return 'battle'};
  const F=AFX[AREAS[i].id]||{},tg2=t=>{const r=rTag(t);if(r)return r;if(F.curse&&t==='battle'&&Math.random()<F.curse)return 'cursed';if(F.bounty&&(t==='battle'||t==='ambush')&&Math.random()<F.bounty)return 'bounty';return null};
  const nodes=['battle'],forks=[null],ftags=[null],blind=[null];
  for(let k=1;k<7;k++){if(k===4){nodes.push('elite');forks.push(null);ftags.push(null);blind.push(null);continue}let x=wp(),y=wp(x);if(k===5){x='rest';y=wp('rest')}nodes.push(null);forks.push([x,y]);ftags.push([tg2(x),tg2(y)]);blind.push(k!==5&&F.blind&&Math.random()<F.blind?Math.floor(Math.random()*2):null)}
  if(!nm&&S.main.acc&&S.main.ch===i&&!S.main.mid&&CH[i]&&CH[i].mid){nodes[2]='story';forks[2]=null}
  nodes.push(nm||bossReady(i)?'boss':'elite');forks.push(null);
  RUN={area:i,nm:!!nm,etr:pick(Object.keys(ETRAIT)),step:-1,nodes,forks,ftags,blind,tagAt:{},bless:null,loot:{gold:0,exp:0,items:[]},view:{type:'start'}};render();$('#main').scrollTop=0}
const _runNext6=runNext;
runNext=function(){if(!RUN)return _runNext6();const n=RUN.step+1,t=RUN.nodes[n],z=zoneOf6(),pend=(RUN.nodes[n]==='boss'&&!RUN.gate&&RUN.step>=0)||(RUN.forks&&RUN.forks[n]&&!RUN.nodes[n]);
  if(!pend&&!RUN.tower&&(t==='rare'||t==='gather'||(t==='event'&&Math.random()<.6))){RUN.step++;zst6(z).ex++;
    if(t==='rare'){RUN.rare6=1;startBattle(pick(AREAS[RUN.area].mobs),'elite',0)}
    else if(t==='gather'){const k=Math.random()<.5?0:1,n2=1+(Math.random()*100<Math.min(20,stats().MAT||0)?1:0),got=[];give6(zmat6(z,k),n2,got);zst6(z).ga++;RUN.loot.items.push(...got);RUN.view={type:'res',title:'採集',text:`採到 ${got.join('、')}。`}}
    else{const L=ZN6[z].lo,pool=V6.EVT.filter(e=>L>=e.lo&&L<=e.hi),seen=RUN.ev6s||(RUN.ev6s=[]),p2=pool.filter(e=>!seen.includes(e.id)),ev=pick(p2.length?p2:pool);seen.push(ev.id);RUN.view={type:'ev6',id:ev.id}}
    save();render();$('#main').scrollTop=0;return}
  const s0=RUN.step;if(!pend&&t==='chest')zst6(z).ch++;const r=_runNext6();if(RUN&&RUN.step>s0&&!RUN.tower)zst6(z).ex++;return r};

/* ============ 探索事件（V6.EVT，每 20 級一組，每組 10 種） ============ */
const EVT6TX=['路邊有個商人在擺攤，貨不多，價錢還算公道。','一座長滿青苔的石壇，上面還留著別人放的花。','岩縫裡傳出低吼，地上散著骨頭。','草叢裡露出一角木箱，鎖已經生鏽。','一個發黑的護符掛在枯枝上，摸起來是冰的。','路旁倒著一個背包，主人不知去向。','泉水泛著淡淡的光，喝起來有點甜。','泥地上有一串很大的腳印，還很新。','石碑上刻著看不懂的字，邊角被磨得發亮。','空氣裂開一道縫，裡面是另一片天空。'];
const ev6Idx=id=>Math.max(0,Math.min(9,parseInt(String(id).slice(-2),10)-1));
const shopBase6=L=>Math.round(60+12*Math.pow(L,1.4));
function ev6Html(){const v=RUN.view,ev=V6.EVT.find(e=>e.id===v.id),i=ev6Idx(v.id),z=zoneOf6(),L=ZN6[z].lo,cost=Math.round(shopBase6(L)*.5);
  const a=i===0?`${ev.a.replace(/花費.*/,'買下')}（${cost} G）`:ev.a;
  return `<div class="panel">${art('area_'+AREAS[RUN.area].id,AREAS[RUN.area].n)}<h3>${esc(ev.n.split('・').pop())}</h3><p>${EVT6TX[i]}</p>
   <div class="row"><button class="btn pri grow" data-a="ev6" data-v="0" ${i===0&&S.gold<cost?'disabled':''}>${esc(a)}</button><button class="btn grow" data-a="ev6" data-v="1">${esc(ev.b.split('，')[0])}</button></div></div>`}
const _vRun6=vRun;
vRun=function(){if(RUN&&RUN.view&&RUN.view.type==='ev6')return ev6Html();return _vRun6()};
function ev6Do(o){const v=RUN.view,i=ev6Idx(v.id),z=zoneOf6(),L=ZN6[z].lo,row=MLV6(L),got=[],res=(title,text)=>{RUN.view={type:'res',title,text};save();render()};
  if(+o===1){res('離開','你沒有多停留。');return}
  if(i===0){const c=Math.round(shopBase6(L)*.5);if(S.gold<c)return;S.gold-=c;gearDrop6(Math.max(1,S.lv),'N',got,{force:1,rar:'N',zone:z});RUN.loot.items.push(...got);res('交易',got.length?`買到 ${got.join('、')}。`:'商人收了錢，給你一包乾糧。')}
  else if(i===1){RUN.open6='FOCUS';res('祈禱','心裡安靜了下來。')}
  else if(i===2){RUN.bonus6={mat:2,n:1};startBattle(pick(AREAS[RUN.area].mobs),'elite',0);render()}
  else if(i===3){if(Math.random()<.7){const g=row[12]*2;S.gold+=g;RUN.loot.gold+=g;const r=Math.random(),rar=r<.05?'R':r<.3?'U':'N';gearDrop6(Math.max(1,S.lv),'N',got,{force:1,rar,zone:z});RUN.loot.items.push(...got);zst6(z).ch++;res('寶箱',`獲得 ${g} G${got.length?'、'+got.join('、'):''}。`)}else{toast('箱子裡跳出了魔物！');startBattle(pick(AREAS[RUN.area].mobs),'',0);render()}}
  else if(i===4){RUN.open6='CURSE';res('接受','護符碎成了灰。')}
  else if(i===5){const g=row[12]*3;S.gold+=g;RUN.loot.gold+=g;give6(zcons6(z,0),1,got);res('搜尋',`找到 ${g} G、${got.join('、')}。`)}
  else if(i===6){const s=stats();S.hp=Math.min(s.HP,S.hp+Math.round(s.HP*.3));S.mp=Math.min(s.MP,S.mp+Math.round(s.MP*.3));res('飲用','HP 與 MP 回復了 30%。')}
  else if(i===7){RUN.rare6=1;startBattle(pick(AREAS[RUN.area].mobs),'elite',0);render()}
  else if(i===8){const x=row[11]*2;RUN.loot.exp+=x;gainExp(x);res('調查',`獲得 ${x} EXP。`)}
  else if(i===9){RUN.bonus6={mat:5,n:1};startBattle(pick(AREAS[RUN.area].mobs),'elite',0);render()}}

/* ============ 討伐委託（V6.QUEST，每區 5 條）＋首領紀錄＋終局 ============ */
let BZ6=null;
const zMid6=z=>Math.round((ZN6[z].lo+ZN6[z].hi)/2);
function q6Need(q){const c=q.cond;let m;if((m=c.match(/普通怪(\d+)/)))return['kN',+m[1]];if((m=c.match(/探索區域(\d+)/)))return['ex',+m[1]];if((m=c.match(/草藥(\d+)/)))return['herb',+m[1]];if((m=c.match(/精英(\d+)/)))return['kE',+m[1]];if((m=c.match(/首領(\d+)/)))return['kB',+m[1]];return['ex',1]}
const q6Z=q=>parseInt(q.z.slice(1),10)-1;
function q6Prog(q){const st=(S.q6||{})[q.id];if(!st||!st.acc)return 0;const [k,n]=q6Need(q),z=q6Z(q);if(k==='herb')return Math.min(n,S.items[zmat6(z,1)]||0);return Math.min(n,zst6(z)[k]-(st.b||0))}
function q6Rw(q,doit){const z=q6Z(q),row=MLV6(zMid6(z)),out=[];let m;const r=q.rw;
  const ex=(m=r.match(/EXP(?:基準)?×(\d+)/))?row[11]*+m[1]:0,gd=(m=r.match(/金幣×(\d+)/))?row[12]*+m[1]:0;
  if(ex)out.push(`${ex} EXP`);if(gd)out.push(`${gd} G`);
  const mats=[];if((m=r.match(/魔晶(\d+)/)))mats.push([zmat6(z,2),+m[1]]);if((m=r.match(/首領印記(\d+)/)))mats.push([zmat6(z,5),+m[1]]);mats.forEach(([id,n])=>out.push(itemN6(id)+'×'+n));
  const rg=/稀有裝備1/.test(r);if(rg)out.push('稀有裝備');
  if(doit){if(gd)S.gold+=gd;mats.forEach(([id,n])=>addItem(id,n));if(rg){const got=[];gearDrop6(zMid6(z),'E',got,{force:1,rar:'R',zone:z});if(got.length)out.push(...got)}if(ex)gainExp(ex)}
  return out.join('、')}
function vBoard6(){const op=AREAS.map((_,i)=>i).filter(i=>i<ZN6.length&&areaOpen6(i));if(BZ6==null||!op.includes(BZ6))BZ6=op[op.length-1]||0;const z=BZ6,Z=ZN6[z],a=AREAS[z];S.q6=S.q6||{};
  const tabs=`<div class="chips">${op.map(i=>`<button class="chip ${i===z?'on':''}" data-a="bz6" data-v="${i}">${AREAS[i].n}</button>`).join('')}</div>`;
  const qs=V6.QUEST.filter(q=>q6Z(q)===z).map(q=>{const st=S.q6[q.id]||{},[k,n]=q6Need(q),p=q6Prog(q),once=/一次性/.test(q.rep),done=once&&st.done;
    const btn=done?'<span class="tag ok">完成</span>':!st.acc?`<button class="btn sm" data-a="q6acc" data-v="${q.id}">接受</button>`:p>=n?`<button class="btn pri sm" data-a="q6done" data-v="${q.id}">回報</button>`:`<span class="tag">${p}/${n}</span>`;
    return `<div class="item"><span class="grow"><b>${esc(q.n)}</b><span class="sub">${esc(q.cond.replace('區域',''))}${once?'・一次':''}</span><span class="sub">獎勵：${q6Rw(q)}</span></span>${btn}</div>`}).join('');
  const rec=(S.brec6||{})[a.boss];
  const brec=`<div class="gsec"><b>首領紀錄　${MOBS[a.boss].n}</b><span class="sub">${rec?`勝利 ${rec.w} 次・最快 ${rec.t} 秒・最低承傷 ${rec.dm}`:'還沒有紀錄'}</span></div>`;
  const end=endOn6()?`<div class="gsec"><b>終局難度</b><div class="chips">${['普通','英雄','傳奇'].map((n,i)=>`<button class="chip ${(S.diff6||0)===i?'on':''}" data-a="diff6" data-v="${i}" ${B||RUN?'disabled':''}>${n}</button>`).join('')}</div><span class="sub">終局印記 ${S.items.mark6||0}　<button class="btn sm" data-a="mark6" data-v="0" ${(S.items.mark6||0)<1?'disabled':''}>換魔晶×5</button> <button class="btn sm" data-a="mark6" data-v="1" ${(S.items.mark6||0)<1?'disabled':''}>換首領印記×2</button></span></div>`:'';
  return `<p class="sub">${a.n}　Lv ${Z.lo}–${Z.hi}</p>${tabs}<div class="list">${qs}</div>${brec}${end}`}
Object.assign(ACT,{
  ev6(v){if(RUN&&RUN.view&&RUN.view.type==='ev6')ev6Do(v)},
  bz6(v){BZ6=+v;render()},
  q6acc(id){const q=V6.QUEST.find(x=>x.id===id);if(!q)return;S.q6=S.q6||{};const [k]=q6Need(q),z=q6Z(q);S.q6[id]={acc:1,b:k==='herb'?0:zst6(z)[k]};save();render()},
  q6done(id){const q=V6.QUEST.find(x=>x.id===id);if(!q)return;const st=(S.q6||{})[id];const [k,n]=q6Need(q);if(!st||!st.acc||q6Prog(q)<n)return;if(k==='herb')addItem(zmat6(q6Z(q),1),-n);const t=q6Rw(q,true);S.q6[id]={done:/一次性/.test(q.rep)?1:0};toast(`委託完成：${t}`);save();render()},
  diff6(v){if(B||RUN)return;S.diff6=+v;save();render()},
  mark6(v){if((S.items.mark6||0)<1)return;addItem('mark6',-1);const z=ZN6.length-1;if(+v===0)addItem(zmat6(z,2),5);else addItem(zmat6(z,5),2);toast('已兌換');save();render()}});

/* ============ 成就（V6.ACH，每區 10 條，取代舊成就） ============ */
(function ach6(){ACH.length=0;
  for(const a of V6.ACH){const z=parseInt(a.z.slice(1),10)-1,c=a.cond;let m,f;
    if((m=c.match(/^探索(\d+)次/)))f=()=>zst6(z).ex>=+m[1];
    else if((m=c.match(/^普通擊殺(\d+)/)))f=()=>zst6(z).kN>=+m[1];
    else if((m=c.match(/^精英擊殺(\d+)/)))f=()=>zst6(z).kE>=+m[1];
    else if((m=c.match(/^首領擊殺(\d+)/)))f=()=>zst6(z).kB>=+m[1];
    else if((m=c.match(/^開箱(\d+)次/)))f=()=>zst6(z).ch>=+m[1];
    else if((m=c.match(/^採集(\d+)次/)))f=()=>zst6(z).ga>=+m[1];
    else if((m=c.match(/取得本區(\d+)種模板/))){const n=+m[1];f=()=>{const Z=ZN6[z];return new Set((S.gear||[]).filter(g=>{const L=g.lv??g.L??g.il;return L>=Z.lo&&L<=Z.hi}).map(g=>g.t||g.tid||g.id)).size>=n}}
    else f=()=>false;
    ACH.push({id:a.id,n:a.n,d:`${AREAS[z]?AREAS[z].n:a.z}：${c}`,c:f,rw:{gold:MLV6(ZN6[z].lo)[12]*5}})}})();
