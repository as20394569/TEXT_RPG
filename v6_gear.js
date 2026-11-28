/* 大改版 V6.3：裝備＋經濟模組（B 線）。資料全部來自 V6（v6data.js） */
/* ---------- 基本表 ---------- */
const SL6=['main','off','head','body','feet','neck','ring'];
const SLOTS={main:'主手',off:'副手',head:'頭部',body:'身體',feet:'腳部',neck:'項鍊',ring:'戒指'};
ICON.off='<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 7v10"/>';
ICON.main=ICON.weapon;
const SLOTCH={main:ic('weapon'),off:ic('off'),head:ic('head'),body:ic('body'),feet:ic('feet'),neck:ic('neck'),ring:ic('ring')};
const RAR=V6.RAR.map(r=>({n:r.n,c:r.c,m:r.m,a:r.a0,my:r.my}));
const RMUL=[1,1.2,1.5,2,3,5];          /* 商店賣價的稀有倍率（裝備經濟表） */
const DISST=[1,2,3,5,8,12];            /* 分解給的同區強化石 */
const EQK=Object.keys(V6.EQ);
const TYK={'單手劍':'SWORD','雙手劍':'GREATSWORD','巨斧':'AXE','匕首':'DAGGER','長弓':'BOW','法杖':'STAFF','短杖':'WAND','咒術書':'BOOK','聖杖':'HOLY','戰錘':'MACE','盾牌':'SHIELD'};
const ARMK={'重甲':'HEAVY','輕甲':'LIGHT','布甲':'CLOTH'};
const WPN=new Set(['SWORD','GREATSWORD','AXE','DAGGER','BOW','STAFF','WAND','BOOK','HOLY','MACE']);
const zoneOf=lv=>Math.max(0,Math.min(9,Math.floor((lv-1)/10)));
const z2=z=>String(z+1).padStart(2,'0');
const matId=(z,k)=>`MAT${z2(z)}${k}`;          /* k：1礦石 2草藥 3魔晶 4獸材 5強化石 6首領印記 */
const consId=(z,k)=>`IT${z2(z)}${k}`;           /* k：1生命藥 2魔力藥 3淨化劑 4守護藥 */
const tplId=(k,lv)=>k+'_'+String(lv).padStart(3,'0');
function tplOf(id){const m=/^([A-Z_]+)_(\d{3})$/.exec(String(id||'').toUpperCase());if(!m||!V6.EQ[m[1]])return null;return {k:m[1],lv:+m[2],e:V6.EQ[m[1]]}}
const tplName=(k,lv)=>V6.EQ[k].n[Math.min(9,Math.floor((lv-1)/10))];
function slotsOfType(k){const s=V6.EQ[k].slot;return s.split('/').map(x=>({'頭':'head','身':'body','腳':'feet','主手':'main','副手':'off','項鍊':'neck','戒指':'ring'})[x]).filter(Boolean)}
const basePrice=lv=>Math.round(60+12*Math.pow(lv,1.4));
const slotPm=k=>WPN.has(k)?1.5:/^B_/.test(k)?1.2:1;
/* 舊程式還在用的名字：保留成新系統的對應物 */
const GEAR=new Proxy({},{get(o,id){if(typeof id!=='string')return undefined;const t=tplOf(id);if(!t)return undefined;const sl=slotsOfType(t.k)[0];return {n:tplName(t.k,t.lv),slot:sl,t:zoneOf(t.lv),lv:t.lv,price:Math.round(basePrice(t.lv)*slotPm(t.k)),uniq:0,k:t.k}},has(o,id){return !!tplOf(id)},ownKeys(){return []}});
const TLV=[1,11,21,31,41,51,61,71,81,91],TPRICE=TLV.map(basePrice);
const RZ={},SPEC={},SETS=[],CSET={},DGCORE=[],BOSSU={},BGEM={},MDROP={},SUBS={},WN={};
const GEMS=V6.GEM.map(g=>g.id);
const dgCore=()=>[];
const RW=[60,28,10,1.9,.1,0],DIS=DISST.map(n=>[n,0]);
const tierCap=()=>99,sealed=()=>false;
const specV=()=>0,specD=()=>'';
/* ---------- 物品：材料、消耗品、寶石 ---------- */
const CONSD={'恢復最大HP':v=>`回復 ${v}% HP`,'恢復最大MP':v=>`回復 ${v}% MP`,'清除負面狀態數':v=>`清除 ${v} 個負面狀態`,'護盾占最大HP':v=>`獲得 ${v}% HP 的護盾`};
for(const m of V6.MAT)ITEMS[m.id]={n:m.n,d:{'採集':'採集取得的素材','怪物':'魔物身上取得的素材','分解':'分解裝備取得，強化用','首領':'區域首領掉落'}[m.src]||m.src,sell:m.sell,mat:1,v6:1,z:Math.floor((m.lv-1)/10)};
for(const c of V6.CONS)ITEMS[c.id]={n:c.n,d:CONSD[c.fx](c.v),price:c.price,use:{v6:c.fx,v:c.v},cd:c.cd,lv:c.lv,v6:1};
const GEMST={'力量':'STR','體力':'VIT','智力':'INT','敏捷':'DEX','幸運':'LUK','物攻':'atk','魔攻':'mag','防禦':'def','魔抗':'mres','HP':'hp'};
for(const g of V6.GEM){const m=/^(.+?)\+(\d+)$/.exec(g.fx);ITEMS[g.id]={n:g.n,d:'鑲嵌：'+g.fx,gem6:{[GEMST[m[1]]]:+m[2]},sell:40,mat:1,v6:1}}
/* ---------- 詞條 ---------- */
const AFK6={STR:'STR',VIT:'VIT',INT:'INT',AGI:'DEX',LUK:'LUK',PATK:'atk',MATK:'mag',PATKP:'atkp',MATKP:'magp',CRIT:'crit',CDMG:'cd',COMBO:'double',HP:'hp',HPP:'hpp',DEF:'def',RES:'mres',EVA:'eva',SPD:'spd',MP:'mp',SAVE:'mpcut',REGEN:'regen',MREGEN:'mregen',SKILL:'skill',BOSS:'boss',PEN:'pen',MPEN:'mpen',BLOCK:'block',HEAL:'healp',GOLD:'gold',DROP:'drop',EXP:'exp',HIT:'hit',PDEF:'defp',PRES:'mresp',PMP:'mpp',LIFE:'ls',HEALIN:'healin',PRED:'pred',MRED:'mred',DOT:'dot',TEN:'ten',SHD:'shd',ELITE:'elite',MAT:'mat'};
for(const t of ['SLASH','BLUNT','PIERCE','FIRE','ICE','THUNDER','HOLY','DARK']){AFK6[t+'D']='td_'+t;AFK6[t+'R']='tr_'+t}
const AFF6={};for(const a of V6.AFF)AFF6[a.id]=a;
const AINT=new Set(['STR','VIT','INT','AGI','LUK','PATK','MATK','HP','MP','DEF','RES']);
const STATN={atk:'物攻',mag:'魔攻',def:'防禦',mres:'魔抗',hp:'HP',mp:'MP'};
for(const a of V6.AFF)STATN[AFK6[a.id]]=a.n.replace(/加成$/,'');
Object.assign(STATN,{STR:'力量',DEX:'敏捷',INT:'智力',VIT:'體力',LUK:'幸運',atkp:'物攻',magp:'魔攻',hpp:'HP',defp:'防禦',mresp:'魔抗',mpp:'MP'});
const PCT=new Set(Object.values(AK).filter(k=>!['STR','VIT','INT','DEX','LUK','atk','mag','hp','mp','def','mres'].includes(k)));
const fmt=(k,v)=>`${STATN[k]||k} +${v}${PCT.has(k)?'%':''}`;
const lvMul=lv=>.15+.85*Math.pow(lv/100,1.2);
function tagsOf(k){const t=new Set(['全部']);const sl=slotsOfType(k);if(WPN.has(k))t.add('武器');if(k==='SHIELD')t.add('盾');if(k==='HOLY')t.add('聖杖');
  for(const s of sl){const w={head:'頭',body:'身',feet:'腳',neck:'項鍊',ring:'戒指'}[s];if(w)t.add(w)}return t}
const affOk=(a,k)=>{const t=tagsOf(k);return a.at.split('/').some(x=>t.has(x))};
function rollTier(){let x=Math.random()*100;for(let i=0;i<V6.TIER.length;i++){x-=V6.TIER[i].p;if(x<0)return i}return 0}
function affVal(a,ti,lv,top){const T=V6.TIER[ti],u=top?T.hi:T.lo+Math.random()*(T.hi-T.lo),v=(a.lo+(a.hi-a.lo)*u)*lvMul(lv);return AINT.has(a.id)?Math.max(1,Math.round(v)):Math.max(.01,Math.round(v*100)/100)}
function pickAff(k,exG){const pool=V6.AFF.filter(a=>affOk(a,k)&&!exG.has(a.g));const tw=pool.reduce((s,a)=>s+a.w,0);let x=Math.random()*tw;for(const a of pool){x-=a.w;if(x<0)return a}return pool[0]}
function rollAffixes(k,lv,n){const out=[],exG=new Set();for(let i=0;i<n;i++){const a=pickAff(k,exG);if(!a)break;exG.add(a.g);const t=rollTier();out.push({id:a.id,t,v:affVal(a,t,lv)})}return out}
const affText=x=>{const a=AFF6[x.id];return a?fmt(AFK6[a.id],x.v):''};
const tierN=t=>V6.TIER[t]?V6.TIER[t].t:'';
/* ---------- 神話、套裝 ---------- */
const MYFOR={'劍/巨劍':['SWORD','GREATSWORD'],'雙持':['SWORD','DAGGER'],'法杖/短杖':['STAFF','WAND'],'巨斧':['AXE'],'盾':['SHIELD'],'弓/匕首':['BOW','DAGGER'],'聖杖':['HOLY'],'咒術書':['BOOK']};
function pickMyth(k){const c=V6.MYTH.filter(m=>(MYFOR[m.for]||[]).includes(k));return pick(c.length?c:V6.MYTH).id}
const MYX={};for(const m of V6.MYTH)MYX[m.id]=m;
const SETX={};for(const s of V6.SET)SETX[s.id]=s;
const SETP={'物攻':'atkp','魔攻':'magp','爆傷':'cd','省魔':'mpcut','敏捷':'DEX','速度':'spd','HP':'hpp','防禦':'defp','智力':'INT','魔抗穿透':'mpen','狀態傷害':'dot','爆擊':'crit','連擊':'double','幸運':'LUK','迴避':'eva','治療':'healp','MP':'mpp','力量':'STR','物防穿透':'pen'};
function setStat(txt){const m=/^(.+?)\+(\d+(?:\.\d+)?)/.exec(txt||'');return m&&SETP[m[1]]?{[SETP[m[1]]]:+m[2]}:{}}
const SETSL=new Set(['head','body','feet','neck','ring']);
const zoneSets=z=>[V6.SET[2*z],V6.SET[2*z+1]].filter(Boolean).map(s=>s.id);
/* ---------- 職業可用 ---------- */
const jobName=()=>S.adv&&ADV[S.adv]?ADV[S.adv].n:CLS[S.cls].n;
const jobEq=()=>V6.JOBEQ.find(j=>j.job===jobName())||V6.JOBEQ.find(j=>j.job===CLS[S.cls].n)||V6.JOBEQ[0];
const dexMain=()=>jobEq().main_attr==='敏';
function canUseType(k,sl){const J=jobEq();if(/^[HBF]_/.test(k))return k.endsWith('_'+ARMK[J.armor])&&(!sl||slotsOfType(k).includes(sl));if(k==='NECK'||k==='RING')return !sl||slotsOfType(k).includes(sl);
  if(sl==='off')return !['空','占用'].includes(J.off)&&TYK[J.off]===k;if(sl==='main'||!sl)return TYK[J.main]===k||(!sl&&TYK[J.off]===k);return false}
function equipSlots(g){return slotsOfType(g.k).filter(sl=>canUseType(g.k,sl))}
const offBlocked=()=>{const J=jobEq();if(['空','占用'].includes(J.off))return true;const m=gearBy(S.eq.main);return !!(m&&V6.EQ[m.k].occ===2)};
function canEquip(g,sl){if(!g)return false;sl=sl||equipSlots(g)[0];if(!sl||!canUseType(g.k,sl))return false;if(g.lv>S.lv)return false;if(sl==='off'&&offBlocked())return false;return true}
/* ---------- 裝備實例 ---------- */
function genGear(k,lv,r){lv=Math.max(1,Math.min(100,Math.round(lv)));const e=V6.EQ[k];const n=(RAR[r].a||0)+(r>=1&&e.occ===2?1:0);
  const g={u:S.uid++,id:tplId(k,lv),k,lv,r,p:0,af:rollAffixes(k,lv,n),sock:r>=4?[null,null]:r>=2?[null]:[],set:null,my:r>=5?pickMyth(k):null,lock:false};return g}
function bagAdd(g){if(!S.gbox)S.gbox=[];if(S.gear.length>=100){S.gbox.push(g);return g}S.gear.push(g);try{dexInit();S.dex.g[tplId(g.k,Math.floor((g.lv-1)/10)*10+1)]=1}catch(e){}return g}
function gearLvNow(){let L=S.lv;try{if(B&&B.L)L=B.L;else if(RUN&&AREAS[RUN.area]&&AREAS[RUN.area].base)L=Math.max(AREAS[RUN.area].base,Math.min(S.lv,AREAS[RUN.area].base+9))}catch(e){}return Math.max(1,Math.min(100,L+R(-2,2)))}
function pickType6(){if(Math.random()<.8){const J=jobEq(),c=[TYK[J.main],'H_'+ARMK[J.armor],'B_'+ARMK[J.armor],'F_'+ARMK[J.armor],'NECK','RING'];if(!['空','占用'].includes(J.off))c.push(TYK[J.off]);return pick(c)}return pick(EQK)}
function rollRar6(rank,bonus){const row=V6.DROP[{N:0,E:1,B:2}[rank]||0].r.slice();let up=1+Math.min(20,(S?stats().DROP:0))/100;if(S&&typeof fortK==='function'&&fortK('drop'))up*=1.3;if(bonus)up*=bonus;for(let i=2;i<6;i++)row[i]*=up;const tw=row.reduce((a,b)=>a+b,0);let x=Math.random()*tw;for(let i=0;i<6;i++){x-=row[i];if(x<0)return i}return 0}
let DROPS6=[];
/* 依掉落機率表產生裝備（rank: N 普通 E 精英 B 首領）。opt.extra＝額外判定次數（終局難度用），opt.force＝必掉 */
function dropGear6(lv,rank,opt){opt=opt||{};rank=rank||'N';const row=V6.DROP[{N:0,E:1,B:2}[rank]||0],got=[];let n=0;const tries=1+(opt.extra||0);for(let i=0;i<tries;i++)if(opt.force||Math.random()*100<row.p)n++;
  for(let i=0;i<n;i++){const glv=rank==='B'?lv:Math.max(1,Math.min(100,lv+R(-2,2))),k=pickType6();let r=rollRar6(rank,opt.bonus);
    if(rank==='B'){const z=zoneOf(lv);S.pity=S.pity||{};S.pity[z]=(S.pity[z]||0)+1;if(r>=4)S.pity[z]=0;else if(S.pity[z]>=20){r=4;S.pity[z]=0}}
    const g=genGear(k,glv,r);if(rank==='B'&&slotsOfType(k).some(s=>SETSL.has(s))&&Math.random()<.2)g.set=pick(zoneSets(zoneOf(lv)));
    bagAdd(g);got.push(g);if(r>=2||g.set)DROPS.push(g);if(r>=4)sys(`恭喜 ${S.name} 獲得${RAR[r].n}裝備【${gearName(g)}】！`)}
  lootMat6(lv,rank);return got}
function lootMat6(lv,rank){const z=zoneOf(lv),add=(k,n)=>{if(n>0)addItem(matId(z,k),n)};const r=Math.random;
  if(rank==='B'){add(6,2);add(3,1+(r()<.5?1:0));add(4,2)}else if(rank==='E'){add(4,1+(r()<.5?1:0));if(r()<.6)add(3,1)}else{if(r()<.3)add(4,1);if(r()<.12)add(3,1)}}
function gatherMat6(lv){const z=zoneOf(lv||S.lv),k=Math.random()<.5?1:2;let n=1;if(Math.random()*100<stats().MAT)n++;addItem(matId(z,k),n);return [matId(z,k),n]}
/* 舊程式的掉寶入口：保留名字，改用新規則 */
function rollGear(tier,minR,bonus){const r=Math.max(minR||0,rollRar6('N',bonus)),g=genGear(pickType6(),gearLvNow(),r);bagAdd(g);if(r>=2)DROPS.push(g);if(r>=4)sys(`恭喜 ${S.name} 獲得${RAR[r].n}裝備【${gearName(g)}】！`);return g}
function makeGear(tier,r){const g=genGear(pickType6(),gearLvNow(),r||0);bagAdd(g);return g}
function addGear(id,r){const t=tplOf(id);let g;if(t)g=genGear(t.k,t.lv,r||0);else{const J=jobEq(),k=/^w_/.test(id||'')?TYK[J.main]:/^a_/.test(id||'')?'B_'+ARMK[J.armor]:/^f_/.test(id||'')?'F_'+ARMK[J.armor]:/^h_/.test(id||'')?'H_'+ARMK[J.armor]:pickType6();g=genGear(k,id?1:gearLvNow(),r||0)}return bagAdd(g)}
const minG=g=>g,shine=g=>g,rollQ=()=>1,rollSubs=()=>[];
function rollRar(minR,bonus){return Math.max(minR||0,rollRar6('N',bonus))}
/* ---------- 數值 ---------- */
const ENHM=p=>(V6.ENH[p]||V6.ENH[0]).m;
function gearStat(g){gfix(g);const e=V6.EQ[g.k],o={},m=RAR[g.r].m*ENHM(g.p);for(const k in e.st){const v=e.st[k][g.lv-1];if(v)o[k]=Math.round(v*m)}return o}
function gearAll(g,inOff){const o=gearStat(g);if(inOff&&o.atk)o.atk=Math.round(o.atk*.6);const ad=(k,v)=>o[k]=Math.round(((o[k]||0)+v)*100)/100;
  for(const x of g.af||[]){const a=AFF6[x.id];if(a)ad(AFK6[a.id],x.v)}for(const gm of g.sock||[])if(gm&&ITEMS[gm]&&ITEMS[gm].gem6)for(const k in ITEMS[gm].gem6)ad(k,ITEMS[gm].gem6[k]);return o}
const gfix=g=>{if(g&&!g.k){const t=tplOf(g.id);if(t){g.k=t.k;g.lv=t.lv}else{g.k='SWORD';g.lv=1}if(g.r==null||g.r>5)g.r=0;g.af=g.af||[];g.sock=g.sock||[];g.p=g.p||0}return g};
const gearName=g=>{gfix(g);return `${tplName(g.k,g.lv)}${g.p?` +${g.p}`:''}`};
const gearDesc=g=>`Lv.${g.lv}　`+Object.entries(gearStat(g)).map(([k,v])=>fmt(k,v)).join('　')+((g.af||[]).length?`　詞條×${g.af.length}`:'')+(g.set?`　${SETX[g.set].n}`:'')+(g.my?`　【${MYX[g.my].n}】`:'')+((g.sock||[]).length?`　孔 ${(g.sock||[]).filter(Boolean).length}/${g.sock.length}`:'');
function eqList(){const L=[];for(const sl of SL6){const g=gearBy(S.eq&&S.eq[sl]);if(g)L.push([sl,g])}return L}
function setCount6(){const c={};for(const [sl,g] of eqList())if(g.set&&SETSL.has(sl))c[g.set]=(c[g.set]||0)+1;return c}
function setCounts(){return {}}
function mythOn6(){const out=[];for(const [sl,g] of eqList())if(g.my&&!out.includes(g.my)&&out.length<2)out.push(g.my);return out}
function setFx6(){const c=setCount6(),o=[];for(const id in c)if(c[id]>=4)o.push(id);return o}
function gearTotals(){const e={},add=o=>{for(const k in o)e[k]=(e[k]||0)+o[k]};const P=typeof skPassive6==='function'?(skPassive6()||{}):{};
  for(const [sl,g] of eqList()){const o=gearAll(g,sl==='off'&&WPN.has(g.k));if(P.watkp&&WPN.has(g.k)){const b=gearStat(g);if(b.atk)o.atk+=Math.round(b.atk*P.watkp/100);if(b.mag)o.mag+=Math.round(b.mag*P.watkp/100)}if(P.wdefp&&g.k==='SHIELD'){const b=gearStat(g);if(b.def)o.def+=Math.round(b.def*P.wdefp/100)}add(o)}
  const c=setCount6();for(const id in c){const s=SETX[id];if(c[id]>=2)add(setStat(s.s2));if(c[id]>=3)add(setStat(s.s3))}
  for(const k in P)if(k!=='watkp'&&k!=='wdefp')e[k]=(e[k]||0)+P[k];return e}
function stats(){const e=gearTotals(),a={},v=k=>e[k]||0,cp=(k,m)=>1+Math.min(m||30,v(k))/100;for(const k in ATTR)a[k]=S.attr[k]+v(k);
  const cm=cmul(),mainA=dexMain()?a.DEX:a.STR,r2=x=>Math.round(x*100)/100,TD={},TR={};
  for(const t of ['SLASH','BLUNT','PIERCE','FIRE','ICE','THUNDER','HOLY','DARK']){TD[t]=Math.min(20,v('td_'+t));TR[t]=Math.min(20,v('tr_'+t))}
  const R={HP:Math.round(((60+a.VIT*14+S.lv*8)*cm[0]+v('hp'))*cp('hpp')),MP:Math.round((20+a.INT*5+S.lv*3+v('mp'))*cp('mpp')),
    ATK:Math.round((mainA*2.5+v('atk'))*cp('atkp')),MAG:Math.round((a.INT*2.5+v('mag'))*cp('magp')),
    DEF:Math.round((a.VIT*1.4*cm[1]+v('def'))*cp('defp')),MRES:Math.round((a.INT*.8+a.VIT*.4+S.lv+v('mres'))*cp('mresp')),
    CRIT:r2(Math.min(75,5+a.LUK*.45+v('crit')+(typeof fortK==='function'&&fortK('crit')?8:0))),CD:r2(Math.min(250,150+a.LUK*.6+v('cd'))),EVA:r2(Math.min(45,a.DEX*.35+v('eva'))),
    DOUBLE:r2(Math.min(20,a.LUK*.12+v('double'))),MPCUT:r2(Math.min(20,a.INT*.12+v('mpcut'))),REGEN:r2(Math.min(3,a.VIT*.02+v('regen'))),MREGEN:r2(Math.min(3,v('mregen'))),
    SPD:r2(Math.min(25,a.DEX*.25+v('spd'))),PEN:r2(Math.min(30,a.STR*.15+v('pen'))),MPEN:r2(Math.min(30,v('mpen'))),BLOCK:r2(Math.min(35,v('block'))),HIT:r2(v('hit')),
    LS:r2(Math.min(10,v('ls'))),HEALP:r2(Math.min(30,v('healp'))),HEALIN:r2(v('healin')),SKILL:r2(Math.min(20,v('skill'))),BOSS:r2(Math.min(25,v('boss'))),ELITE:r2(Math.min(25,v('elite'))),
    DOT:r2(Math.min(20,v('dot'))),TEN:r2(Math.min(30,v('ten'))),SHD:r2(Math.min(30,v('shd'))),PRED:r2(Math.min(40,v('pred'))),MRED:r2(Math.min(40,v('mred'))),
    GOLD:r2(v('gold')),DROP:r2(Math.min(20,v('drop'))),EXP:r2(v('exp')),MAT:r2(Math.min(20,v('mat'))),TYPED:TD,TYPER:TR,MYTH:mythOn6(),SETFX:setFx6(),
    /* 舊戰鬥程式還會讀的欄位：新系統沒有，固定 0 */
    RF:TR.FIRE,RI:TR.ICE,RT:TR.THUNDER,RD:TR.DARK,BURN:0,STUN:0,GUARD:0,SHIELD:0,BACK:0,THORN:0,GALE:0,REAP:0,MPREG:0,RESMAX:0,BRKCD:0,DETAMP:0,FOCUSATK:0,ANSWER:0,FAITHG:0,KW:{},A:a};
  return R}
function wScore6(o){const mg=jobEq().main_attr==='智',W={atk:mg?.6:3,mag:mg?3:.6,def:2,mres:1.5,hp:.25,mp:.2,STR:mg?1:6,DEX:dexMain()?6:3,INT:mg?6:1,VIT:4,LUK:3,atkp:mg?2:12,magp:mg?12:2,crit:6,cd:2,double:6,eva:5,spd:10,pen:6,mpen:6,skill:8,boss:5,elite:4,ls:8,block:5,hpp:5,defp:4,mresp:3,pred:6,mred:6};
  let v=0;for(const k in o)v+=o[k]*(W[k]||2);return v}
function gearPower(g){let v=wScore6(gearAll(g));if(g.my)v+=60;return Math.round(v)}
/* 整套評分（自動換裝用）：單件數值＋套裝 2／3 件屬性＋4 件效果＋神話（最多 2 種生效） */
const SET4V=80,MYTHV=60;
function eqScore6(eq){let sc=0;const cnt={},my=[];for(const sl of SL6){const g=eq[sl];if(!g)continue;sc+=wScore6(gearAll(g,sl==='off'&&WPN.has(g.k)));if(g.set&&SETSL.has(sl))cnt[g.set]=(cnt[g.set]||0)+1;if(g.my&&!my.includes(g.my))my.push(g.my)}
  for(const id in cnt){const X=SETX[id];if(!X)continue;const c=cnt[id];if(c>=2)sc+=wScore6(setStat(X.s2));if(c>=3)sc+=wScore6(setStat(X.s3));if(c>=4)sc+=SET4V}
  return sc+Math.min(2,my.length)*MYTHV}
function power(){const s=stats();return Math.round(s.HP/4+s.MP/4+s.ATK*3+s.MAG*3+s.DEF*2.5+s.MRES*1.5+s.CRIT*4+(s.CD-150)*1.5+s.EVA*3+s.SPD*8+s.PEN*4+s.MPEN*4+s.DOUBLE*4+s.BLOCK*3+s.SKILL*5+s.LS*5)}
function kwCount(){return {}}
function buildName(){return ''}
function setFold(g){return g}
function setFoldAll(){}
const gIco=id=>{const t=tplOf(id);if(!t)return ic('weapon');const k=t.k,ti=Math.min(5,Math.floor((t.lv-1)/17));
  const m={SWORD:'w_swordsman',GREATSWORD:'w_knight',AXE:'w_berserker',DAGGER:'w_assassin',BOW:'w_ranger',STAFF:'w_mage',WAND:'w_warlock',BOOK:'w_warlock',HOLY:'w_cleric',MACE:'w_templar',SHIELD:'w_knight',NECK:'n',RING:'r'};
  let base=m[k];if(!base){const sl=k[0]==='H'?'h':k[0]==='B'?'a':'f';base=sl+(k.endsWith('HEAVY')?'':'b')}
  const nm={GREATSWORD:'greatsword',AXE:'axe',DAGGER:'dagger',WAND:'wand',BOOK:'book',MACE:'mace',SHIELD:'shield',H_CLOTH:'hc',B_CLOTH:'bc',F_CLOTH:'fc'}[k];
  if(nm&&typeof ARTSET!=='undefined'&&ARTSET&&ARTSET.has('icon_'+nm+'_'+ti))return icon('icon_'+nm+'_'+ti,SLOTCH[slotsOfType(k)[0]]);
  let key='icon_'+base+'_'+ti;if(!(key in ATL)){for(let i=ti;i>=0;i--)if(('icon_'+base+'_'+i) in ATL){key='icon_'+base+'_'+i;break}if(!(key in ATL))for(let i=4;i<=5;i++)if(('icon_'+base+'_'+i) in ATL){key='icon_'+base+'_'+i;break}}
  return icon(key,SLOTCH[slotsOfType(k)[0]])};
function dropUp(g){const sl=equipSlots(g).find(s=>canEquip(g,s));if(!sl)return 0;const cur=gearBy(S.eq[sl]);if(!cur)return 100;const a=gearPower(g),c=gearPower(cur);return a>c?Math.max(1,Math.round((a-c)/Math.max(1,c)*100)):0}
function dropFx(){if(!DROPS.length)return '';const h=DROPS.map(g=>{const up=dropUp(g);return `<div class="drop d${g.r}"><span class="ico c${g.r}">${gIco(g.id)}</span><span class="grow"><b class="c${g.r}">${gearName(g)}</b><span class="sub">${RAR[g.r].n}・Lv.${g.lv}${g.set?'・'+SETX[g.set].n:''}${g.my?'・'+MYX[g.my].n:''}</span>${up?`<span class="dup">▲ 比身上的強 ${up}%</span>`:''}</span>${up?`<button class="btn sm pri deq" data-a="dropEq" data-v="${g.u}">換上</button>`:''}</div>`}).join('');DROPS=[];setTimeout(()=>{try{SFX.holy(0);buzz([30,40,60])}catch(e){}},350);return `<div class="drops">${h}</div>`}
const gearSell=g=>Math.max(1,Math.round(basePrice(g.lv)*slotPm(g.k)*.2*RMUL[g.r]));
function dismantle(g){try{wkSt().sal++}catch(e){}const z=zoneOf(g.lv),st=DISST[g.r],cr=g.r>=4?1:0;addItem(matId(z,5),st);if(cr)addItem(matId(z,3),cr);for(const gm of g.sock||[])if(gm)addItem(gm,1);S.gear=S.gear.filter(x=>x.u!==g.u);return [st,cr,z]}
/* ---------- 工坊費用 ---------- */
const enhNext=g=>V6.ENH[g.p+1];
const enhCost=g=>g.p>=15?0:Math.round(enhNext(g).g*Math.max(.1,g.lv/100));
const enhStone=g=>g.p>=15?0:enhNext(g).mat;
const enhRate=g=>g.p>=15?0:enhNext(g).p;
const enhMat=g=>matId(zoneOf(g.lv),5);
const canEnh=g=>!!g&&g.p<15&&S.gold>=enhCost(g)&&(S.items[enhMat(g)]||0)>=enhStone(g);
const gBase=g=>basePrice(g.lv);
const reforgeCost=g=>({m:2,g:Math.round(gBase(g)*.5),id:matId(zoneOf(g.lv),3)});
const refineCost=g=>({m:3,g:gBase(g),id:matId(zoneOf(g.lv),3)});
const canReforge=g=>{if(!g||!(g.af||[]).length)return false;const c=reforgeCost(g);return S.gold>=c.g&&(S.items[c.id]||0)>=c.m};
const inscCost=g=>({g:0,s:0,d:0});
const craftCost=(k,lv)=>({ore:matId(zoneOf(lv),1),beast:matId(zoneOf(lv),4),g:Math.round(basePrice(lv)*slotPm(k)*.5)});
const gemCost=()=>{const z=zoneOf(S.lv);return {cr:matId(z,3),ore:matId(z,1)}};
const dexGear=()=>EQK.flatMap(k=>[1,11,21,31,41,51,61,71,81,91].map(l=>tplId(k,l))).filter(id=>{const t=tplOf(id);return canUseType(t.k)});
/* ---------- 使用道具（戰鬥內共用冷卻、消耗行動條） ---------- */
function useItem6(k,inB){const it=ITEMS[k];if(!it||!S.items[k])return false;const s=stats(),u=it.use||{};if(!u.v6)return false;
  const now=B&&B.rt?B.rt.t:Date.now()/1000;
  if(inB&&B){if(now<(B.icd||-1)){toast(`藥品冷卻中（${Math.ceil(B.icd-now)} 秒）`);return false}}
  else if(u.v6!=='恢復最大HP'&&u.v6!=='恢復最大MP'){toast('只能在戰鬥中使用');return false}
  let msg='';
  if(u.v6==='恢復最大HP'){if(!inB&&S.hp>=s.HP){toast('已經是滿的');return false}const h=Math.round(s.HP*u.v/100),h0=S.hp;S.hp=Math.min(s.HP,S.hp+h);msg=`回復 ${S.hp-h0} HP`;if(B)B.fx={by:'me',glow:1,heal:S.hp-h0}}
  else if(u.v6==='恢復最大MP'){if(!inB&&S.mp>=s.MP){toast('已經是滿的');return false}const m0=S.mp;S.mp=Math.min(s.MP,S.mp+Math.round(s.MP*u.v/100));msg=`回復 ${S.mp-m0} MP`;if(B)B.fx={by:'me',glow:1}}
  else if(u.v6==='清除負面狀態數'){let n=0;if(typeof stClean==='function')n=stClean('p',u.v);else if(B&&B.pst){for(const h of ['stun','poison','burn','bleed','weak'])if(n<u.v&&B.pst[h]>0){B.pst[h]=0;n++}}msg=n?`清除了 ${n} 個負面狀態`:'沒有負面狀態';if(B)B.fx={by:'me',glow:1}}
  else if(u.v6==='護盾占最大HP'){const cap=Math.round(s.HP*.3),add=Math.round(s.HP*u.v/100*(1+s.SHD/100));B.shield=Math.min(cap,(B.shield||0)+add);msg=`獲得 ${add} 護盾`;B.fx={by:'me',glow:1}}
  addItem(k,-1);if(inB&&B){B.icd=now+(it.cd||30);try{blog(`你使用了${it.n}，${msg}`)}catch(e){}}else toast(`使用${it.n}：${msg}`);try{SFX.heal()}catch(e){}return true}
/* ---------- 介面 ---------- */
(function(){const st=document.createElement('style');st.textContent=`
:root,html[data-th=ink]{--r5:#ff6b6b}
.c5{color:var(--r5)}.ico.c5{border-color:var(--r5)}.dslot.r5{border-color:#ff5a5a;box-shadow:0 0 10px rgba(255,90,90,.6)}.drop.d5{color:var(--r5);box-shadow:0 0 18px rgba(255,90,90,.6)}
.ico.c4{border-color:var(--r4)}.ico.c3{border-color:var(--r3)}.ico.c2{border-color:var(--r2)}
.g6af{display:flex;justify-content:space-between;gap:6px;font-size:13px;padding:3px 0;border-bottom:1px dashed var(--line)}
.g6af small{color:var(--sub)}.g6af.sel{background:rgba(217,174,76,.14)}
.g6t{display:inline-block;font-size:10.5px;padding:0 5px;border-radius:5px;background:var(--panel2);color:var(--sub);margin-left:4px}
.g6t.t1{color:#ffb04a}.g6t.t2{color:#c58cff}.g6t.t3{color:#6fb4ff}
.sm6tabs{display:flex;gap:4px;flex-wrap:wrap;margin:4px 0 8px}.sm6tabs button{flex:1;min-width:52px;padding:6px 2px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);font-size:12.5px}
.sm6tabs button.on{border-color:var(--gold);color:var(--hd);background:rgba(217,174,76,.15)}
.g6pick{max-height:34vh;overflow:auto}
.doll7 .dcol{gap:6px}.setbar{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.setbar .chip{font-size:11.5px}
`;document.head.appendChild(st)})();
const rarTag=g=>`<span class="tag c${g.r}" style="border-color:currentColor">${RAR[g.r].n}</span>`;
function dollHtml(){const sl=k=>{const g=gearBy(S.eq[k]);return g?`<button class="dslot r${g.r}" data-a="openGear" data-v="${g.u}"><small>${SLOTS[k]}</small><span class="ico c${g.r}">${gIco(g.id)}</span><b class="c${g.r}">${tplName(g.k,g.lv)}</b>${g.p?`<span class="pl">+${g.p}</span>`:''}</button>`:`<button class="dslot empty" data-a="bagSlot" data-v="${k}" ${k==='off'&&offBlocked()?'disabled':''}><small>${SLOTS[k]}</small><span class="ico c0">${SLOTCH[k]}</span><b>${k==='off'&&offBlocked()?'無法使用':'未裝備'}</b></button>`};
  const sc=setCount6(),my=mythOn6();
  const sets=Object.keys(sc).map(id=>`<span class="chip">${SETX[id].n} ${sc[id]}/4</span>`).join('')+my.map(id=>`<span class="chip c5">${MYX[id].n}</span>`).join('');
  return `<div class="doll doll7"><div class="dcol">${sl('head')}${sl('body')}${sl('feet')}</div><div class="dmid">${art(hasArt(HK()+'_stand')?HK()+'_stand':HK(),clsName()+'立繪','r34')}</div><div class="dcol">${sl('main')}${sl('off')}${sl('neck')}${sl('ring')}</div></div>${sets?`<div class="setbar">${sets}</div>`:''}`}
function buildPanel(){const sc=setCount6(),my=mythOn6(),ks=Object.keys(sc);
  return `<div class="panel bld"><h3>套裝</h3>${ks.map(id=>{const s=SETX[id],n=sc[id];return `<div class="bk"><div class="bkh"><b>${s.n}</b><span class="pips">${[1,2,3,4].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span></div>${[[2,s.s2],[3,s.s3],[4,s.s4]].map(([c,t])=>`<span class="sub ${n>=c?'son':''}">${c}件　${t}</span>`).join('')}</div>`}).join('')}
   ${my.map(id=>`<div class="gsec"><b class="c5">${MYX[id].n}</b><span class="sub">${MYX[id].fx}</span></div>`).join('')}
   ${!ks.length&&!my.length?'<p class="sub">首領裝可能帶套裝；神話效果最多 2 種。</p>':''}</div>`}
const BAGSL={all:null,main:['main'],off:['off'],head:['head'],body:['body'],feet:['feet'],neck:['neck'],ring:['ring']};
function vBag(){
  const tabs=`<div class="tabs">${[['gear','裝備'],['use','道具'],['mat','素材']].map(([k,n])=>`<button class="${BAGTAB===k?'on':''}" data-a="bagTab" data-v="${k}">${n}</button>`).join('')}</div>`;
  let body='';if(!BAGSL.hasOwnProperty(BAGF))BAGF='all';
  if(BAGTAB==='gear'){const eqd=Object.values(S.eq),F=BAGSL[BAGF];const BF=S.bagf||(S.bagf={r:0,sort:'pow',up:0});
    const SORT={pow:(a,b)=>gearPower(b)-gearPower(a),rar:(a,b)=>b.r-a.r||gearPower(b)-gearPower(a),new:(a,b)=>b.u-a.u,lv:(a,b)=>b.lv-a.lv||b.r-a.r};
    const gs0=S.gear.filter(g=>(!F||slotsOfType(g.k).some(s=>F.includes(s)))&&g.r>=(BF.r||0));
    const up=g=>!eqd.includes(g.u)&&dropUp(g)>0;
    const gs=gs0.filter(g=>!BF.up||up(g)).sort((a,b)=>(eqd.includes(b.u)-eqd.includes(a.u))||(SORT[BF.sort]||SORT.pow)(a,b));
    const ch=(act,v,on,n)=>`<button class="${on?'on':''}" data-a="${act}" data-v="${v}">${n}</button>`;
    body=`<div class="fchips">${[['all','全部'],['main','主手'],['off','副手'],['head','頭'],['body','身'],['feet','腳'],['neck','項鍊'],['ring','戒指']].map(([k,n])=>ch('gearF',k,BAGF===k,n)).join('')}</div>
      <div class="fchips">${[[0,'全部'],[2,'稀有+'],[3,'史詩+'],[4,'傳說+'],[5,'神話']].map(([k,n])=>ch('gearR',k,(BF.r||0)===k,n)).join('')}${ch('gearT','up',BF.up,'▲更強')}</div>
      <div class="fchips">排序：${[['pow','戰力'],['rar','稀有度'],['lv','等級'],['new','最新']].map(([k,n])=>ch('gearS',k,BF.sort===k,n)).join('')}<span class="sub" style="margin-left:auto">${S.gear.length}/100</span></div>
      ${(S.gbox||[]).length?`<div class="row"><span class="grow sub">待領箱 ${S.gbox.length} 件（背包滿了先放這裡）</span><button class="btn sm pri" data-a="gboxTake">領取</button></div>`:''}
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm" data-a="disAll">分解普通、精良</button><button class="btn sm" data-a="sellAll" data-v="1">賣出普通、精良</button><button class="btn sm" data-a="sellAll" data-v="2">賣出稀有以下</button></div>`+
      (gs.map(g=>`<button class="item" data-a="openGear" data-v="${g.u}"><span class="ico c${g.r}">${gIco(g.id)}</span><span class="grow"><b class="c${g.r}">${gearName(g)}</b><span class="sub">${RAR[g.r].n}・${gearDesc(g)}</span></span>${eqd.includes(g.u)?'<span class="tag ok">裝備中</span>':!equipSlots(g).length?'<span class="tag off">不可用</span>':g.lv>S.lv?`<span class="tag off">Lv.${g.lv}</span>`:up(g)?'<span class="tag upt">▲</span>':''}${g.lock?'<span class="tag off">鎖</span>':''}</button>`).join('')||'<p class="empty">沒有裝備</p>')}
  else{const ks=Object.keys(S.items).filter(k=>ITEMS[k]&&(BAGTAB==='use'?ITEMS[k].use:ITEMS[k].mat));
    body=ks.map(k=>`<div class="item"><span class="ico c0">${icon('item_'+k,ic(BAGTAB==='use'?'potion':'mat'))}</span><span class="grow"><b>${ITEMS[k].n} ×${S.items[k]}</b><span class="sub">${ITEMS[k].d}</span></span>${ITEMS[k].use?`<button class="btn sm" data-a="useItem" data-v="${k}">使用</button>`:''}<button class="btn sm" data-a="sellItem" data-v="${k}">賣 ${sellPrice(k)}G</button></div>`).join('')||'<p class="empty">空空如也</p>'}
  return `<h2>背包</h2>${BAGTAB==='gear'?`<div class="panel">${dollHtml()}</div>`:''}${tabs}<div class="panel"><div class="list">${body}</div></div>`}
function affRows(g,selI){return (g.af||[]).map((x,i)=>`<div class="g6af ${selI===i?'sel':''}"><span>${affText(x)}<span class="g6t t${V6.TIER.length-x.t}">${tierN(x.t)}</span></span>${g.rf===i?'<small>重鑄位置</small>':''}</div>`).join('')||'<p class="sub">沒有詞條</p>'}
let SMTAB='enh',SMSEL=null,SMAF=0,SMSRC=null,SMCK='main';
Object.assign(MV,{
  gear(u){const g=gearBy(u);if(!g)return{t:'裝備',b:'<p class="empty">這件裝備已不存在</p>'};
    const sls=equipSlots(g),onSl=SL6.find(s=>S.eq[s]===g.u),cur=sls.length?gearBy(S.eq[sls[0]]):null,cmp=!onSl&&cur?gearPower(g)-gearPower(cur):null;
    const s=g.set?SETX[g.set]:null,sc=s?(setCount6()[g.set]||0):0;
    const eqBtns=onSl?`<button class="btn big" data-a="unequip" data-v="${onSl}">卸下</button>`:sls.map(sl=>`<button class="btn pri big" data-a="equip" data-v="${g.u}|${sl}" ${canEquip(g,sl)?'':'disabled'}>裝備到${SLOTS[sl]}</button>`).join('')||'<p class="sub" style="text-align:center">目前職業無法使用</p>';
    return{t:gearName(g),b:`<div class="row"><span class="ico c${g.r}">${gIco(g.id)}</span><div class="grow"><b class="c${g.r}" style="display:block">${gearName(g)}</b><span class="sub">${RAR[g.r].n}・${V6.EQ[g.k].type}・${sls.map(x=>SLOTS[x]).join('／')||SLOTS[slotsOfType(g.k)[0]]}・需求 Lv.${g.lv}・評分 ${gearPower(g)}${cmp!=null?`（${cmp>=0?'+':''}${cmp}）`:''}</span></div></div>
     <div class="gsec"><b>基礎${g.p?`（強化 +${g.p}）`:''}</b><div class="chips">${Object.entries(gearStat(g)).map(([k,v])=>`<span class="chip">${fmt(k,v)}</span>`).join('')}</div></div>
     <div class="gsec"><b>詞條</b>${affRows(g)}</div>
     ${(g.sock||[]).length?`<div class="gsec"><b>鑲嵌孔</b>${g.sock.map(gm=>`<span class="subl">◆ ${gm?ITEMS[gm].n+'：'+ITEMS[gm].d.replace('鑲嵌：',''):'空'}</span>`).join('')}</div>`:''}
     ${s?`<div class="gsec"><b>${s.n}（已裝備 ${sc} 件）</b><span class="sub ${sc>=2?'son':''}">2 件：${s.s2}</span><span class="sub ${sc>=3?'son':''}">3 件：${s.s3}</span><span class="sub ${sc>=4?'son':''}">4 件：${s.s4}</span></div>`:''}
     ${g.my?`<div class="gsec"><b class="c5">神話【${MYX[g.my].n}】</b><span class="sub">${MYX[g.my].when}：${MYX[g.my].fx}（${MYX[g.my].lim}）</span></div>`:''}
     ${!onSl&&cur?`<p class="sub">目前裝備：<b class="c${cur.r}">${gearName(cur)}</b>（評分 ${gearPower(cur)}）</p>`:''}
     <div class="row wrap">${eqBtns}</div>
     <div class="row wrap"><button class="btn grow" data-a="smithOpen" data-v="${g.u}">工坊</button><button class="btn grow" data-a="lock" data-v="${g.u}">${g.lock?'解鎖':'鎖定'}</button></div>
     ${onSl||g.lock?'':`<div class="row"><button class="btn grow" data-a="dis" data-v="${g.u}">分解：${ITEMS[matId(zoneOf(g.lv),5)].n}×${DISST[g.r]}${g.r>=4?'、魔晶×1':''}</button><button class="btn grow" data-a="sellGear" data-v="${g.u}">出售 ${gearSell(g)} G</button></div>`}`}},
  smith(){const eqd=Object.values(S.eq);const gs=[...S.gear].sort((a,b)=>eqd.includes(b.u)-eqd.includes(a.u)||b.r-a.r||b.lv-a.lv);
    if(SMSEL&&!gearBy(SMSEL))SMSEL=null;if(!SMSEL&&gs[0])SMSEL=gs[0].u;const g=gearBy(SMSEL);const own=k=>S.items[k]||0,nm=k=>ITEMS[k]?ITEMS[k].n:k;
    const TB=[['enh','強化'],['reforge','重鑄'],['refine','精煉'],['inherit','繼承'],['sock','鑲嵌'],['craft','製作'],['dis','分解']];
    const list=(act,filter)=>`<div class="list g6pick">${gs.filter(filter||(()=>true)).map(x=>`<button class="item ${x.u===SMSEL?'on':''}" data-a="${act}" data-v="${x.u}"><span class="ico c${x.r}">${gIco(x.id)}</span><span class="grow"><b class="c${x.r}">${gearName(x)}</b><span class="sub">${RAR[x.r].n}・Lv.${x.lv}${eqd.includes(x.u)?'・裝備中':''}</span></span></button>`).join('')||'<p class="empty">沒有裝備</p>'}</div>`;
    const FT={reforge:x=>(x.af||[]).length,refine:x=>(x.af||[]).length,sock:x=>(x.sock||[]).length};if(FT[SMTAB]&&!(g&&FT[SMTAB](g))){const f=gs.find(FT[SMTAB]);if(f){SMSEL=f.u;return MV.smith()}}
    let b='';
    if(SMTAB==='enh'){b=g?`<div class="gsec"><b class="c${g.r}">${gearName(g)}</b>${g.p>=15?'<span class="sub">已達強化上限 +15</span>':`<span class="sub">+${g.p} → +${g.p+1}：基礎 ×${ENHM(g.p+1)}、成功率 ${enhRate(g)}%，失敗不降級</span><span class="sub">${enhCost(g)} G、${nm(enhMat(g))}×${enhStone(g)}（持有 ${own(enhMat(g))}）</span>`}<button class="btn pri big" data-a="enh" data-v="${g.u}" ${canEnh(g)?'':'disabled'}>強化</button></div>`:'';b+=list('smSel')}
    else if(SMTAB==='reforge'||SMTAB==='refine'){const c=g?(SMTAB==='reforge'?reforgeCost(g):refineCost(g)):null;if(g&&g.rf!=null)SMAF=g.rf;
      b=g?`<div class="gsec"><b class="c${g.r}">${gearName(g)}</b>${(g.af||[]).length?`<span class="sub">${SMTAB==='reforge'?'選一個詞條重新抽（每件只能固定一個位置，選了就不能換）':'把選定詞條提高到同品質的上限'}</span>${(g.af||[]).map((x,i)=>`<button class="item ${SMAF===i?'on':''}" data-a="smAf" data-v="${i}" ${SMTAB==='reforge'&&g.rf!=null&&g.rf!==i?'disabled':''}><span class="grow">${affText(x)}<span class="g6t t${V6.TIER.length-x.t}">${tierN(x.t)}</span></span></button>`).join('')}
        <span class="sub">${c.g} G、${nm(c.id)}×${c.m}（持有 ${own(c.id)}）</span><button class="btn pri big" data-a="${SMTAB}" data-v="${g.u}" ${S.gold>=c.g&&own(c.id)>=c.m?'':'disabled'}>${SMTAB==='reforge'?'重鑄':'精煉'}</button>`:'<span class="sub">這件沒有詞條</span>'}</div>`:'';b+=list('smSel',x=>(x.af||[]).length)}
    else if(SMTAB==='inherit'){const src=gearBy(SMSRC);b=`<div class="gsec"><b>繼承強化</b><span class="sub">來源的強化等級 −1 轉到目標，來源會消失。必須同類型，目標等級不能比來源低。</span>
        <span class="sub">目標：${g?`<b class="c${g.r}">${gearName(g)}</b>`:'未選'}　來源：${src?`<b class="c${src.r}">${gearName(src)}</b>`:'未選'}</span>
        <button class="btn pri big" data-a="inherit" ${g&&src&&src.u!==g.u&&src.k===g.k&&g.lv>=src.lv&&src.p>0&&!eqd.includes(src.u)?'':'disabled'}>繼承（+${src?Math.max(0,src.p-1):0}）</button></div><h3>目標</h3>${list('smSel')}<h3>來源（有強化的）</h3>${list('smSrc',x=>x.p>0&&(!g||x.k===g.k))}`}
    else if(SMTAB==='sock'){const gc=gemCost();b=g?`<div class="gsec"><b class="c${g.r}">${gearName(g)}</b>${(g.sock||[]).length?g.sock.map((gm,i)=>`<div class="row"><span class="grow">孔 ${i+1}：${gm?ITEMS[gm].n+'（'+ITEMS[gm].d.replace('鑲嵌：','')+'）':'空'}</span>${gm?`<button class="btn sm" data-a="sockOut" data-v="${g.u}|${i}">拆除 ${Math.round(gBase(g)*.2)} G</button>`:''}</div>`).join(''):'<span class="sub">稀有 1 孔、傳說以上 2 孔</span>'}</div>`:'';
      b+=`<div class="gsec"><b>寶石</b>${V6.GEM.map(x=>`<div class="row"><span class="grow">${x.n}　<small class="sub">${x.fx}　持有 ${own(x.id)}</small></span>${g&&(g.sock||[]).includes(null)&&!(g.sock||[]).includes(x.id)&&own(x.id)?`<button class="btn sm pri" data-a="sockIn" data-v="${g.u}|${x.id}">鑲上</button>`:''}<button class="btn sm" data-a="gemMake" data-v="${x.id}" ${own(gc.cr)>=3&&own(gc.ore)>=2?'':'disabled'}>製作</button></div>`).join('')}<span class="sub">製作一顆：${nm(gc.cr)}×3（${own(gc.cr)}）、${nm(gc.ore)}×2（${own(gc.ore)}）</span></div>`+list('smSel',x=>(x.sock||[]).length)}
    else if(SMTAB==='craft'){const J=jobEq(),ks=[TYK[J.main],...(['空','占用'].includes(J.off)?[]:[TYK[J.off]]),'H_'+ARMK[J.armor],'B_'+ARMK[J.armor],'F_'+ARMK[J.armor],'NECK','RING'].filter((v,i,a)=>a.indexOf(v)===i);if(!ks.includes(SMCK))SMCK=ks[0];const c=craftCost(SMCK,S.lv);
      b=`<div class="gsec"><b>製作 Lv.${S.lv} 裝備</b><span class="sub">品質照一般魔物掉落的機率抽。</span><div class="fchips">${ks.map(k=>`<button class="${SMCK===k?'on':''}" data-a="smCk" data-v="${k}">${tplName(k,S.lv)}</button>`).join('')}</div>
        <span class="sub">${nm(c.ore)}×4（${own(c.ore)}）、${nm(c.beast)}×2（${own(c.beast)}）、${c.g} G</span><button class="btn pri big" data-a="craft6" ${own(c.ore)>=4&&own(c.beast)>=2&&S.gold>=c.g?'':'disabled'}>製作</button></div>`}
    else{b=`<div class="gsec"><b>分解</b><span class="sub">普通到神話分別得到 1／2／3／5／8／12 個同區強化石，傳說以上多 1 個魔晶。鑲著的寶石會退回。</span><div class="row"><button class="btn grow" data-a="disAll">分解所有普通、精良</button></div></div>`+list('disSel',x=>!eqd.includes(x.u)&&!x.lock)}
    return{t:'工坊',b:npcSay('npc_bald','巴爾德','要做什麼？')+`<div class="sm6tabs">${TB.map(([k,n])=>`<button class="${SMTAB===k?'on':''}" data-a="smTab" data-v="${k}">${n}</button>`).join('')}</div>`+b+`<p class="sub">持有 ${S.gold} G</p>`}},
  shop(){const z=zoneOf(S.lv),own=k=>S.items[k]||0;
    const its=[];for(let i=0;i<=z;i++)for(let k=1;k<=4;k++){const id=consId(i,k);if(ITEMS[id]&&(i===z||i===z-1))its.push(id)}
    const J=jobEq(),ks=[TYK[J.main],...(['空','占用'].includes(J.off)?[]:[TYK[J.off]]),'H_'+ARMK[J.armor],'B_'+ARMK[J.armor],'F_'+ARMK[J.armor],'NECK','RING'].filter((v,i,a)=>a.indexOf(v)===i);
    const gl=ks.map(k=>{const id=tplId(k,S.lv),p=Math.round(basePrice(S.lv)*slotPm(k));const st=V6.EQ[k].st,stt=Object.keys(st).map(x=>fmt(x,st[x][S.lv-1])).join('　');return `<div class="item"><span class="ico c0">${gIco(id)}</span><span class="grow"><b>${tplName(k,S.lv)}</b><span class="sub">Lv.${S.lv}・${stt}</span></span><button class="btn sm pri" data-a="buyGear" data-v="${id}" ${S.gold>=p?'':'disabled'}>${p} G</button></div>`}).join('');
    return{t:'道具商店',b:npcSay('npc_miko','蜜可','歡迎光臨！')+`<h3>消耗品</h3><div class="list">${its.map(k=>`<div class="item"><span class="ico c0">${icon('item_'+k,ic('potion'))}</span><span class="grow"><b>${ITEMS[k].n}</b><span class="sub">${ITEMS[k].d}・持有 ${own(k)}</span></span><button class="btn sm pri" data-a="buyItem" data-v="${k}" ${S.gold>=ITEMS[k].price?'':'disabled'}>${ITEMS[k].price} G</button></div>`).join('')}</div><h3>裝備（普通）</h3><div class="list">${gl}</div><p class="sub">持有 ${S.gold} G　藥品戰鬥中共用冷卻，使用會用掉這次行動。</p>`}}
});
function eqSet(g,sl){if(!canEquip(g,sl))return false;if(sl==='main'&&V6.EQ[g.k].occ===2)S.eq.off=null;for(const s of SL6)if(S.eq[s]===g.u)S.eq[s]=null;S.eq[sl]=g.u;clamp();return true}
Object.assign(ACT,{
  equip(v){const [u,sl0]=String(v).split('|'),g=gearBy(+u);if(!g)return;const sl=sl0||equipSlots(g).find(s=>canEquip(g,s));if(!sl||!eqSet(g,sl)){toast(g.lv>S.lv?`需要 Lv.${g.lv}`:'目前無法裝備');return}toast(`裝備了 ${gearName(g)}`);save();closeM();render()},
  dropEq(u,el){const g=gearBy(+u);if(!g||!dropUp(g))return;const sl=equipSlots(g).find(s=>canEquip(g,s));if(!sl||!eqSet(g,sl))return;if(el&&el.closest){const d=el.closest('.drop');if(d){d.classList.add('done');el.remove()}}save();toast(`換上 ${gearName(g)}`)},
  unequip(sl){S.eq[sl]=null;clamp();save();closeM();render()},
  gboxTake(){let n=0;while((S.gbox||[]).length&&S.gear.length<100){S.gear.push(S.gbox.shift());n++}toast(n?`領取 ${n} 件`:'背包已滿');save();render()},
  sellAll(v){const mx=+v||1,eqd=Object.values(S.eq),L=S.gear.filter(g=>g.r<=mx&&!g.lock&&!eqd.includes(g.u)&&!g.set);if(!L.length){toast('沒有可賣的裝備');return}const sum=L.reduce((a,g)=>a+gearSell(g),0);if(!confirm(`賣出 ${L.length} 件，得到 ${sum} G？`))return;const ids=new Set(L.map(g=>g.u));S.gear=S.gear.filter(g=>!ids.has(g.u));S.gold+=sum;toast(`賣出 ${L.length} 件，+${sum} G`);save();render()},
  sellGear(u){const g=gearBy(+u);if(!g||g.lock||Object.values(S.eq).includes(g.u))return;const p=gearSell(g);S.gold+=p;S.gear=S.gear.filter(x=>x.u!==g.u);toast(`出售獲得 ${p} G`);save();closeM();render()},
  buyGear(id){const t=tplOf(id);if(!t)return;const p=Math.round(basePrice(t.lv)*slotPm(t.k));if(S.gold<p)return;if(S.gear.length>=100){toast('背包已滿');return}S.gold-=p;const g=genGear(t.k,t.lv,0);bagAdd(g);toast(`買了 ${gearName(g)}`);save();render()},
  enh(u){const g=gearBy(+u);if(!canEnh(g)||document.querySelector('.enhfx'))return;S.gold-=enhCost(g);addItem(enhMat(g),-enhStone(g));try{track('enh')}catch(e){}
    const rate=enhRate(g),p0=g.p,ok=Math.random()*100<rate;let msg,cls;if(ok){g.p++;cls='ok';msg=`成功！+${p0} → +${g.p}`;if(g.p>=10)sys(`${S.name} 將【${tplName(g.k,g.lv)}】強化到 +${g.p}！`)}else{cls='ng';msg='失敗……強化等級沒有變'}clamp();save();enhFx(g,p0,rate,cls,msg)},
  smithOpen(v){SMSEL=+v;MODAL={k:'smith'};drawModal()},
  smTab(v){SMTAB=v;SMAF=0;drawModal()},smSel(v){SMSEL=+v;SMAF=0;drawModal()},smSrc(v){SMSRC=+v;drawModal()},smAf(v){SMAF=+v;drawModal()},smCk(v){SMCK=v;drawModal()},
  reforge(u){const g=gearBy(+u);if(!g||!(g.af||[]).length)return;const i=g.rf!=null?g.rf:Math.min(SMAF,g.af.length-1),c=reforgeCost(g);if(S.gold<c.g||(S.items[c.id]||0)<c.m)return;S.gold-=c.g;addItem(c.id,-c.m);g.rf=i;
    const exG=new Set(g.af.filter((x,j)=>j!==i).map(x=>AFF6[x.id].g)),a=pickAff(g.k,exG),t=rollTier();g.af[i]={id:a.id,t,v:affVal(a,t,g.lv)};try{SFX.buff()}catch(e){}toast(`重鑄：${affText(g.af[i])}`);clamp();save();drawModal()},
  refine(u){const g=gearBy(+u);if(!g||!(g.af||[]).length)return;const i=Math.min(SMAF,g.af.length-1),c=refineCost(g),x=g.af[i];if(S.gold<c.g||(S.items[c.id]||0)<c.m)return;const top=affVal(AFF6[x.id],x.t,g.lv,true);if(x.v>=top){toast('已經是這個品質的上限');return}S.gold-=c.g;addItem(c.id,-c.m);x.v=top;toast(`精煉：${affText(x)}`);clamp();save();drawModal()},
  inherit(){const g=gearBy(SMSEL),s=gearBy(SMSRC);if(!g||!s||s.u===g.u||s.k!==g.k||g.lv<s.lv||!(s.p>0)||Object.values(S.eq).includes(s.u))return;if(!confirm(`把 +${s.p} 的強化轉到【${gearName(g)}】（變成 +${s.p-1}），來源裝備會消失。確定？`))return;g.p=Math.max(g.p,s.p-1);S.gear=S.gear.filter(x=>x.u!==s.u);SMSRC=null;toast(`繼承完成：+${g.p}`);clamp();save();drawModal()},
  sockIn(v){const [u,gm]=String(v).split('|'),g=gearBy(+u);if(!g||!(S.items[gm]>0))return;const i=(g.sock||[]).indexOf(null);if(i<0||g.sock.includes(gm))return;g.sock[i]=gm;addItem(gm,-1);toast(`鑲上 ${ITEMS[gm].n}`);clamp();save();drawModal()},
  sockOut(v){const [u,i]=String(v).split('|'),g=gearBy(+u);if(!g||!g.sock[+i])return;const c=Math.round(gBase(g)*.2);if(S.gold<c){toast(`需要 ${c} G`);return}S.gold-=c;addItem(g.sock[+i],1);g.sock[+i]=null;clamp();save();drawModal()},
  gemMake(id){const c=gemCost();if((S.items[c.cr]||0)<3||(S.items[c.ore]||0)<2)return;addItem(c.cr,-3);addItem(c.ore,-2);addItem(id,1);toast(`做好了 ${ITEMS[id].n}`);save();drawModal()},
  craft6(){const k=SMCK,c=craftCost(k,S.lv);if((S.items[c.ore]||0)<4||(S.items[c.beast]||0)<2||S.gold<c.g)return;if(S.gear.length>=100){toast('背包已滿');return}addItem(c.ore,-4);addItem(c.beast,-2);S.gold-=c.g;const row=V6.DROP[0].r.slice(),tw=row.reduce((a,b)=>a+b,0);let x=Math.random()*tw,r=0;for(let i=0;i<6;i++){x-=row[i];if(x<0){r=i;break}}const g=genGear(k,S.lv,r);bagAdd(g);toast(`做出了${RAR[r].n}【${gearName(g)}】`);try{track('craft')}catch(e){}save();drawModal()},
  disSel(u){if(!confirmTap('dis'+u))return;ACT.dis(u)},
  lock(u){const g=gearBy(+u);if(!g)return;g.lock=!g.lock;save();if(MODAL)drawModal();else render()},
  dis(u){const g=gearBy(+u);if(!g||g.lock||Object.values(S.eq).includes(g.u))return;const [st,cr,z]=dismantle(g);toast(`分解得到 ${ITEMS[matId(z,5)].n}×${st}${cr?'、魔晶×1':''}`);save();if(MODAL&&MODAL.k==='smith')drawModal();else{closeM();render()}},
  disAll(){const eqd=Object.values(S.eq),L=S.gear.filter(g=>g.r<=1&&!g.lock&&!eqd.includes(g.u));if(!L.length){toast('沒有可分解的普通、精良裝備');return}let n=0;L.forEach(g=>{n+=dismantle(g)[0]});toast(`分解 ${L.length} 件，強化石×${n}`);save();if(MODAL)drawModal();else render()},
  useItem(k){if(RUN&&B)return;const it=ITEMS[k];if(it&&it.use&&it.use.v6){if(useItem6(k,false)){save();render()}return}const s=stats();if(it.use.hp&&S.hp>=s.HP||it.use.mp&&S.mp>=s.MP){toast('已經是滿的');return}addItem(k,-1);if(it.use.hp)S.hp=Math.min(s.HP,S.hp+it.use.hp);if(it.use.mp)S.mp=Math.min(s.MP,S.mp+it.use.mp);save();render()},
  bagSlot(v){BAGTAB='gear';BAGF=BAGSL.hasOwnProperty(v)?v:'all';ACT.tab('bag')}
});
/* 新角色：Lv.1 普通適用裝備＋草原生命藥×3 */
const _newGame6=newGame;
newGame=function(name,cls,sex){_newGame6(name,cls,sex);S.gear=[];S.eq={main:null,off:null,head:null,body:null,feet:null,neck:null,ring:null};S.gbox=[];S.pity={};
  delete S.items.pot;delete S.items.eth;S.items[consId(0,1)]=3;
  const J=jobEq(),ks=[['main',TYK[J.main]],['body','B_'+ARMK[J.armor]],['feet','F_'+ARMK[J.armor]]];if(!['空','占用'].includes(J.off))ks.push(['off',TYK[J.off]]);
  for(const [sl,k] of ks){const g=bagAdd(genGear(k,1,0));S.eq[sl]=g.u}const s=stats();S.hp=s.HP;S.mp=s.MP;save()};
/* 星象台：每區首領掉的套裝 */
MV.altar=function(){const rows=AREAS.map((A,i)=>{const lock=i>=S.main.ch+1&&!S.main.done;let tr='';try{const t=BTRAIT[weekTrait(A.boss)];if(t)tr=`<span class="subl" style="color:#c2410c">⚠ 本週惡夢首領特性【${t.n}】${t.d}</span>`}catch(e){}
  const z=Math.min(9,i),ss=zoneSets(z).map(id=>SETX[id].n).join('、');return `<div class="gsec"><b>${A.n}　<small class="sub">Lv.${A.lv}</small></b>${lock?'<span class="sub">星象尚未顯現……推進主線後再來。</span>':`${tr}<span class="subl">◆ 首領裝備可能帶套裝：${ss}</span>`}</div>`}).join('');
  const ft=fortune(),FI=FORT[ft&&ft.k];
  return{t:'星象台',b:npcSay('npc_oracle','占星師',FI?`今天的星象是【${FI.n}】。${FI.say}`:'星辰不賣裝備，只告訴你去哪裡找。……要看看今天的星象嗎？')+`<div class="gsec"><b>今日星象</b>${FI?`<span class="subl">✦ ${FI.n}：${FI.d}（今天有效）</span>`:`<span class="sub">每天免費占卜一次，抽一個整天有效的祝福。</span><button class="btn pri" data-a="fortune">占卜今天的星象</button>`}</div>`+rows}};

/* 舊獎勵的強化石、星塵：換成目前所在區的強化石／魔晶 */
const _addItem6=addItem;
/* v21.1 合法道具查詢：V7 能用的消耗品只有企劃表的 IT 系列（ITEMS[k].v6）。
   舊版道具 ID（pot、pot2、pot3 治療藥水；eth、eth2 魔力藥水）一律換算成目前等級區域的生命藥／魔力藥，所有地方都用這組函式 */
const CONSK={hp:'恢復最大HP',mp:'恢復最大MP',clean:'清除負面狀態數',shield:'護盾占最大HP'};
const POTOLD={pot:'hp',pot2:'hp',pot3:'hp',eth:'mp',eth2:'mp'};
function potList(kind){const fx=CONSK[kind];if(!S||!fx)return [];return Object.keys(S.items||{}).filter(k=>S.items[k]>0&&ITEMS[k]&&ITEMS[k].v6&&ITEMS[k].use&&ITEMS[k].use.v6===fx)}
function potCount(kind){return potList(kind).reduce((a,k)=>a+S.items[k],0)}
function potBest(kind){return potList(kind).sort((a,b)=>(ITEMS[b].use.v||0)-(ITEMS[a].use.v||0))[0]||null}
function potShop(kind){return consId(zoneOf(S?S.lv:1),{hp:1,mp:2,clean:3,shield:4}[kind]||1)}
function itemCount(id){return POTOLD[id]?potCount(POTOLD[id]):((S&&S.items[id])||0)}
addItem=function(id,n){if(id==='stone'&&S)id=matId(zoneOf(S.lv),5);else if(id==='dust'&&S&&n>0){id=matId(zoneOf(S.lv),3);n=Math.max(1,Math.ceil(n/10))}
  else if(POTOLD[id]&&S){const kind=POTOLD[id];if(n>0)id=potShop(kind);else{let left=-n;for(const k of potList(kind).sort((a,b)=>(ITEMS[a].use.v||0)-(ITEMS[b].use.v||0))){const t=Math.min(left,S.items[k]);_addItem6(k,-t);left-=t;if(!left)break}return}}
  return _addItem6(id,n)};
/* 舊存檔裡的舊版藥水換成新版 */
function migratePots6(){if(!S||!S.items)return;for(const k of Object.keys(POTOLD)){const n=S.items[k]||0;if(n>0){delete S.items[k];_addItem6(potShop(POTOLD[k]),n)}else delete S.items[k]}}
{const _ld=load;load=function(){const r=_ld.apply(this,arguments);try{migratePots6()}catch(e){}return r}}
/* ---------- 戰鬥掛鉤（給戰鬥程式呼叫）：神話效果與套裝 4 件效果 ----------
   gearDmgMul6(o)：o={wsk:武器技能累計次數, mag:是否魔法, hpPct:自己HP比例, foeHpPct, foe:{burn,slow,poison,debuff}}，回傳傷害倍率
   gearFatal6()：受到致命傷時呼叫，回傳 true 表示保留 1 HP（神話「不屈」每場一次）
   gearLowHp6()：HP 跌破 30% 時呼叫，回傳護盾量（重甲／熔岩套裝 4 件，每場一次）
   其他觸發型效果（連擊加速、耗魔回復、治療護盾、疾風／法師／雷擊／暗殺／治療套裝 4 件）看 stats().MYTH 與 stats().SETFX 的 ID 由戰鬥程式實作 */
function gearDmgMul6(o){o=o||{};const s=stats(),M=s.MYTH,F=s.SETFX,f=o.foe||{};let m=1;
  if(M.includes('MY01')&&o.wsk&&o.wsk%3===0)m*=1.12;
  if(M.includes('MY04')&&o.hpPct<.3)m*=1.1;
  if(M.includes('MY06')&&o.foeHpPct<.25)m*=1.1;
  if(M.includes('MY08')&&o.mag&&f.debuff)m*=1.08;
  if((F.includes('SET01')||F.includes('SET11'))&&f.burn)m*=1.08;
  if((F.includes('SET02')||F.includes('SET12'))&&f.slow)m*=1.08;
  if((F.includes('SET06')||F.includes('SET16'))&&f.poison)m*=1.08;
  if((F.includes('SET10')||F.includes('SET20'))&&o.hpPct<.3)m*=1.08;
  return m}
/* v21.5：迴避觸發的套裝 4 件效果（原本規格有、程式未實作）：疾風／生命 迴避後行動條 +10（冷卻 2 次自身行動）；暗殺／獵人 迴避後下次攻擊增傷 8%（不疊加） */
function gearEvade6(){if(!B||!B.p6)return;const F=stats().SETFX||[],P=B.p6,now=acOf('p');
  if((F.includes('SET03')||F.includes('SET13'))&&B.rt&&!(P.set3cd>now)){P.set3cd=now+2+1;B.rt.pgB=(B.rt.pgB||0)+10}
  if((F.includes('SET08')||F.includes('SET18'))&&!P.nx.some(n=>n.set8))P.nx.push({sk:null,v:8,pen:0,set8:1})}
function gearFatal6(){if(!B||B.my5)return false;if(!stats().MYTH.includes('MY05'))return false;B.my5=1;return true}
function gearLowHp6(){if(!B||B.set4hp)return 0;const F=stats().SETFX;if(!F.includes('SET04')&&!F.includes('SET14'))return 0;B.set4hp=1;return Math.round(stats().HP*.1)}
