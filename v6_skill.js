/* 大改版 V6.3：C 技能＋狀態＋天賦（見 .docs/v6iface.md）
   13 職業各 3 主動 3 被動、冷卻秒、MP 成本公式、狀態 40 種＋職業專屬、天賦 195、技能熟練、武器熟練。
   對外：stAdd stHas stVal stTick stClear elMul6 skPassive6 foeOutMul6 pInMul6 onBlock6 onEvade6 onWin6 mpCost6 */
const ADV_ZONE=2;/* 轉職要先打倒第 3 區首領（S.cleared 的 index） */
const JOBK={'劍士':'swordsman','法師':'mage','遊俠':'ranger','神官':'cleric','騎士':'knight','狂戰士':'berserker','大魔導士':'archmage','咒術師':'warlock','神射手':'sniper','刺客':'assassin','主教':'bishop','聖殿騎士':'templar','雙劍士':'dual'};
const JOBN=Object.fromEntries(Object.entries(JOBK).map(([n,k])=>[k,n]));
const job6=()=>S?(S.adv||S.cls):'swordsman';
const bt6=()=>B&&B.rt?B.rt.t:0;
/* V7.3：狀態、冷卻都以「受影響者自己的行動次數」計算 */
const acOf=t=>!B?0:t==='p'?(B.acP||0):((t&&t.ac)||0);
const cl6=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- 職業與轉職 ---------- */
try{if(!CLS.swordsman.adv.includes('dual'))CLS.swordsman.adv.push('dual');CLS.dual.hide=1;CLS.dual.adv=[];
  Object.assign(CLS.swordsman,{d:'血多防高的前排，四個職業裡最耐打。',f:'破甲斬削弱防禦，守勢斬一邊打一邊減傷。'});
  Object.assign(CLS.mage,{d:'魔法傷害最高，但血少、不耐打。',f:'炎爆讓敵人灼燒，冰縛拖慢敵人的行動。'});
  Object.assign(CLS.ranger,{d:'出手快、爆擊高，用弓遠距離射擊。',f:'穿林箭無視部分防禦，牽制射擊拖慢敵人。'});
  Object.assign(CLS.cleric,{d:'能補血又耐打，傷害比較低。',f:'聖印削弱敵人的傷害，祈癒回復自己。'});
  Object.assign(ADV,{knight:{n:'騎士',d:'舉盾的前排，格擋後反擊。',bonus:{}},berserker:{n:'狂戰士',d:'揮巨斧，血越少打越痛。',bonus:{}},archmage:{n:'大魔導士',d:'灼燒加結界，傷害最高的法師。',bonus:{}},warlock:{n:'咒術師',d:'用腐蝕慢慢磨，邊打邊吸血。',bonus:{}},
    sniper:{n:'神射手',d:'貫穿防禦的長弓，打殘血最痛。',bonus:{}},assassin:{n:'刺客',d:'雙匕首、下毒、躲開後反刺。',bonus:{}},bishop:{n:'主教',d:'審判印削弱敵人，治療後打得更重。',bonus:{}},templar:{n:'聖殿騎士',d:'錘與盾，靠護盾和格擋撐住。',bonus:{}},
    dual:{n:'雙劍士',d:'雙手各一把單手劍，靠連擊堆傷害。',bonus:{}}})}catch(e){}

/* ---------- 技能資料 ---------- */
const FXA={J01S2:'slash',J01S3:'whirl',J02S2:'fire',J02S3:'ice',J03S2:'pierce',J03S3:'trap',J04S2:'holy',J04S3:'heal',J05S2:'bash',J05S3:'guard',J06S2:'rage',J06S3:'feast',J07S2:'firestorm',J07S3:'nova',
  J08S2:'curse',J08S3:'drain',J09S2:'deadshot',J09S3:'snipe',J10S2:'stab',J10S3:'thousand',J11S2:'judge',J11S3:'sanct',J12S2:'hammer',J12S3:'aegis',J13S1:'slash',J13S2:'flurry',J13S3:'skyslash'};
const WTAG={'單手劍':'SLASH','雙手劍':'SLASH','巨斧':'SLASH','戰錘':'BLUNT','盾牌':'BLUNT','長弓':'PIERCE','匕首':'PIERCE'};
const jobEq6=j=>(V6.JOBEQ||[]).find(r=>JOBK[r.job]===j)||{};
for(const k in SK)delete SK[k];for(const k in PASS)delete PASS[k];
(V6.SKILL||[]).forEach(r=>{const c=JOBK[r.job];if(!c)return;const act=r.kind==='主動',dm=r.dt==='物'||r.dt==='魔',hl=r.dt==='治療';
  const lv=CLS[c]?r.lv:Math.max(r.lv,TRIAL.lv);
  SK[r.id]={id:r.id,n:r.n,c,lv,act,mp:r.mp||0,cd:r.cd||0,pow:(r.pow||0)/100,s:r.dt==='魔'?'MAG':'ATK',dt:r.dt,fx:r.fx==='無'?'':r.fx,
    dmg:dm?{s:r.dt==='魔'?'MAG':'ATK',p:(r.pow||0)/100,h:r.id==='J13S2'?2:1}:null,heal:hl?1:0,
    d:(dm?`${r.dt==='物'?'物理':'魔法'} ${r.pow}%`:hl?'治療':'')+(r.fx&&r.fx!=='無'?(dm||hl?'，':'')+r.fx:'')};
  if(FXA[r.id]&&SKA[FXA[r.id]])SKA[r.id]=SKA[FXA[r.id]]});
const jobSk6=(j,act)=>Object.values(SK).filter(k=>k.c===(j||job6())&&(act==null||k.act===act)).sort((a,b)=>a.id<b.id?-1:1);
const skOk6=k=>!!S&&S.lv>=SK[k].lv;
function mySkills(){return jobSk6(null,true).filter(k=>skOk6(k.id)).map(k=>k.id)}
function battleSkills(){return mySkills().slice(0,3)}
function learn(quiet){if(!S)return;S.skl=S.skl||{};for(const k of jobSk6(null,null))if(skOk6(k.id)&&!S.skl[k.id]){S.skl[k.id]=1;if(!quiet)toast(`習得${k.act?'技能':'被動'}【${k.n}】`)}}
function skx(id){return SK[id]}
function dmgTag6(k){const j=job6(),x=SK[k];if(['cleric','bishop','templar'].includes(j))return 'HOLY';if(x&&x.s==='MAG'){if(j==='warlock')return 'DARK';if(/炎|火|星火/.test(x.n))return 'FIRE';if(/冰|霜|寒/.test(x.n))return 'ICE';if(/雷/.test(x.n))return 'THUNDER';return 'NEUTRAL'}
  return WTAG[jobEq6(j).main]||'SLASH'}
function elMul6(tags,tag){const e=(V6.ELEM||[]).find(r=>r.id===tag);if(!e||!tags||!tags.length)return 1;const sp=x=>String(x||'').split('/');let m=1;
  if(sp(e.weak).some(w=>tags.includes(w)))m*=e.id==='NEUTRAL'?1:1.25;if(sp(e.res).some(w=>tags.includes(w)))m*=e.id==='NEUTRAL'?1:.75;return cl6(m,.5,1.5)}

/* ---------- 狀態引擎 ---------- */
/* 效果：數值型修正用 key（spd atk mag def mres crit eva hit dmgIn magIn markIn fireIn healIn regen mpCost pen mpen dr dmgOut block combo thorn），持續傷害用 dot */
const STX={POISON:{dot:'atk',r:.2},BURN:{dot:'mag',r:.2,noRegen:1},BLEED:{dot:'atk',r:.2},FROST:{m:{spd:-15}},SHOCK:{m:{magIn:10}},WEAK:{m:{atk:-15}},SILENCE:{flag:1},ARMOR:{m:{def:-15}},RESIST:{m:{mres:-15}},
  BLIND:{m:{hit:-15}},SLOW:{m:{spd:-20}},CURSE:{m:{crit:-10}},WOUND:{m:{healIn:-30}},FATIGUE:{m:{mpCost:20}},STUN:{flag:1},ROOT:{m:{spd:-10,eva:-10}},VULN:{m:{dmgIn:10}},FEAR:{m:{atk:-10,mag:-10,spd:-10}},
  MARK:{m:{markIn:10}},DRAIN:{mpdrain:2},SHIELD:{shield:1},GUARD:{m:{dr:20}},HASTE:{m:{spd:15}},RAGE:{m:{atk:20,mag:20,def:-10}},REGEN:{hot:2},THORN:{m:{thorn:10}},FOCUS:{m:{crit:10}},WARD:{m:{mres:25}},
  HARDEN:{m:{def:25}},IMMUNE:{flag:1},CHILL:{m:{fireIn:10}},SCORCH:{m:{def:-8}},HEX:{m:{mag:-15}},SAPPED:{m:{regen:-50}},EXPOSE:{m:{eva:-8}},FORTIFY:{m:{healIn:15}},CLARITY:{m:{mpcut:5}},KEEN:{m:{pen:5}},
  ARCANE:{m:{mpen:5}},MEND:{hot:1},
  /* 職業專屬（企劃表：獨立標記，不和通用狀態重複計算） */
  SEAL:{n:'聖印',bad:1,dur:2,m:{dmgOut:-10}},JUDGE:{n:'審判印',bad:1,dur:2,m:{dmgOut:-12}},CORRODE:{n:'腐蝕',bad:1,dur:3,dot:'mag',r:.4},
  BLOCKUP:{n:'盾壁',dur:2,m:{block:20}},EVAUP:{n:'影襲',dur:2,m:{eva:8}},COMBOUP:{n:'疾風',dur:2,m:{combo:6}},TAKEUP:{n:'捨身',bad:0,dur:2,m:{dmgIn:10}},POST:{n:'庇護',dur:1,m:{dr:0}}};
/* 企劃表 V7 的 ID 對到這裡的職業專屬狀態 */
const STALIAS={CORROSION:'CORRODE',HOLYMARK:'SEAL',JUDGMENT:'JUDGE'};
(V6.STAT||[]).forEach(r=>{const id=STALIAS[r.id]||r.id;STX[id]=Object.assign({n:r.n,bad:r.bad,dur:r.dur,rep:r.rep,txt:r.fx},STX[id]||{});if(STALIAS[r.id])STX[id].dur=r.dur});
const SLOWK=['FROST','SLOW','ROOT','FEAR'];
const stBox=t=>t==='p'?(B?(B.psx=B.psx||{}):{}):(t?(t.sx=t.sx||{}):{});
function stHas(t,id){id=STALIAS[id]||id;const x=stBox(t)[id];return !!x&&x.e>acOf(t)}
/* 施加：持續 N 次受影響者行動；在受影響者自己的行動中施加時，這次不算 */
function stAdd(t,id,o){o=o||{};if(!B)return false;id=STALIAS[id]||id;const D=STX[id];if(!D)return false;const bx=stBox(t),now=acOf(t),cur=bx[id],me=t==='p',boss=!me&&t&&t.kind==='boss';
  if((id==='STUN'||id==='ROOT')&&(boss&&id==='STUN'||stHas(t,'IMMUNE')))return false;
  if(cur&&cur.e>now&&(D.rep==='不刷新'))return false;
  let dur=o.dur!=null?o.dur:D.dur||2,v=o.v!=null?o.v:null;
  if(D.bad&&id!=='IMMUNE'){const ten=me?Math.min(30,(rtS6().TEN||0)):Math.min(30,(t&&t.ten6)||0);if(ten)dur=Math.max(1,Math.round(dur*(1-ten/100)))}
  dur=Math.max(1,Math.round(dur));
  if(boss&&D.m&&D.m.spd<0)v=(v!=null?v:-D.m.spd)/2;
  const own=B.actor===t?1:0;
  const x={e:now+dur+own,a:now,v,r:o.r!=null?o.r:D.r,src:o.src||null,by:o.by||(me?'foe':'me'),amp:o.amp||0};
  if(D.shield){const cap=Math.round((me?rtS6().HP:t.max)*.3),amt=Math.min(cap,Math.round(o.amt||0));if(cur&&cur.e>now&&(cur.amt||0)>=amt){cur.e=Math.max(cur.e,x.e);return true}x.amt=amt}
  else if(cur&&cur.e>now&&v!=null&&cur.v!=null&&Math.abs(cur.v)>Math.abs(v)){cur.e=x.e;return true}
  bx[id]=x;
  if(id==='STUN'){if(me){B.rt&&(B.rt.q=null)}else{t.st=t.st||{};t.st.stun=1}stAdd(t,'IMMUNE',{dur:dur+2})}
  return true}
function stClear(t,id){const bx=stBox(t);if(id)delete bx[id];else for(const k in bx)delete bx[k]}
function stList(t){const bx=stBox(t),now=acOf(t);return Object.keys(bx).filter(k=>bx[k].e>now)}
function stVal(t,key){const bx=stBox(t),now=acOf(t);let v=0;for(const id in bx){const x=bx[id];if(x.e<=now)continue;const D=STX[id];if(!D||!D.m||D.m[key]==null)continue;
  let d=D.m[key];if(x.v!=null&&Object.keys(D.m).length===1)d=Math.sign(d||1)*Math.abs(x.v);v+=d}return v}
function stCap(t,key){const v=stVal(t,key);if(key==='spd')return Math.max(-30,v);if(['atk','mag','def','mres'].includes(key))return Math.max(-30,v);if(key==='dmgIn')return Math.min(25,v);if(key==='healIn')return Math.max(-50,v);if(key==='dr')return Math.min(40,v);return v}
const rtS6=()=>{try{return B&&B.rt&&typeof rtS==='function'?rtS():stats()}catch(e){return stats()}};
/* 持續傷害／回復：受影響者每次行動前跳一次（最後一次也算）；到期的狀態清掉 */
function stTick(t){if(!B)return;const bx=stBox(t),now=acOf(t),me=t==='p';
  for(const id in bx){const x=bx[id],D=STX[id];if(!D||x.e<=now){if(x.e<=now){delete bx[id];if(id==='STUN'&&!me&&t.st)t.st.stun=0}continue}
    if(D.dot&&x.src){let base=(x.src[D.dot]||0)*(x.r||.2)*(1+(x.amp||0));
      if(me){const s=rtS6();const df=D.dot==='mag'?s.MRES:s.DEF;let d=Math.max(1,Math.round(base*100/(100+df)*pInMul6(D.dot==='mag')));S.hp=Math.max(0,S.hp-d);B.log.push(you(`${STX[id].n}，損失 ${d} HP`));B.fx=B.fx||{by:'foe'};}
      else{const df=D.dot==='mag'?(t.mres??t.def):t.def;let d=Math.max(1,Math.round(base*100/(100+(df||0)*(1+stCap(t,D.dot==='mag'?'mres':'def')/100))));d=foeTake6(t,d,STX[id].n);B.log.push(`${t.name} 受到${STX[id].n}傷害 ${d}`);(B.pops=B.pops||[]).push({d,k:STX[id].n,f:t})}}
    if(D.hot){if(me){const s=rtS6();const h=Math.round(s.HP*D.hot/100*healInM6());S.hp=Math.min(s.HP,S.hp+h)}else{t.hp=Math.min(t.max,t.hp+Math.round(t.max*D.hot/100*(t.kind==='boss'?.5:1)))}}
    if(D.mpdrain&&me){const s=rtS6();S.mp=Math.max(0,S.mp-Math.round(s.MP*D.mpdrain/100))}}}
function foeTake6(f,d,src){const bx=stBox(f),sh=bx.SHIELD;if(sh&&sh.e>bt6()&&sh.amt>0){const ab=Math.min(sh.amt,d);sh.amt-=ab;d-=ab}if(f.fshield>0){const ab=Math.min(f.fshield,d);f.fshield-=ab;d-=ab}f.hp=Math.max(0,f.hp-d);if(f===B){try{dsrc(src||'攻擊',d)}catch(e){}try{bossPhase()}catch(e){}}return d}
const healInM6=()=>(1+Math.min(30,(rtS6().HEALIN||0))/100)*(1+stCap('p','healIn')/100);
function stStep6(){}

/* 玩家受到的傷害倍率（A 線打玩家時乘上）：防禦姿態、易傷、減傷上限 40% */
function pInMul6(isMag){if(!B)return 1;let dr=stCap('p','dr')+lowDr6();const P=effs6();for(const e of P)if(e.k==='shdr'&&stHas('p','SHIELD'))dr+=e.v;
  if(B.healDr&&B.healDr.e>acOf('p'))dr+=B.healDr.v;dr=Math.min(40,dr);
  const vin=stCap('p','dmgIn');return Math.max(.05,(1-dr/100)*(1+vin/100)*(isMag?1+stVal('p','magIn')/100:1))}
/* 怪物打出的傷害倍率：虛弱／恐懼／狂怒、聖印、審判印、腐蝕（咒術師被動） */
function foeOutMul6(f,isMag){f=f||B;if(!f)return 1;let m=1+stCap(f,isMag?'mag':'atk')/100;let o=stVal(f,'dmgOut');
  for(const e of effs6()){if(e.k==='corrDown'&&stHas(f,'CORRODE'))o-=e.v;if(e.k==='fxv'&&(e.what==='降傷')&&((e.sk==='J04S2'&&stHas(f,'SEAL'))||(e.sk==='J11S2'&&stHas(f,'JUDGE'))))o-=e.v}
  return Math.max(.1,m*(1+Math.max(-40,o)/100))}

/* ---------- 被動與天賦效果 ---------- */
/* 效果物件：{k:種類,...}。被動由下表；天賦由文字解析。值都已乘上天賦等級 */
const PSV={J01S4:[{k:'stat',key:'atkp',v:5}],J01S5:[{k:'stat',key:'hpp',v:5}],J01S6:[{k:'cond',st:['ARMOR'],v:8}],
  J02S4:[{k:'stat',key:'magp',v:5}],J02S5:[{k:'zmp',v:1}],J02S6:[{k:'cond',st:['BURN'],sk:'J02S3',v:20}],
  J03S4:[{k:'stat',key:'crit',v:3}],J03S5:[{k:'winhp',v:3}],J03S6:[{k:'cond',st:SLOWK,v:10}],
  J04S4:[{k:'stat',key:'magp',v:5}],J04S5:[{k:'stat',key:'healp',v:10}],J04S6:[{k:'next',ev:'cast',src:'J04S3',sk:'J04S1',v:35}],
  J05S4:[{k:'stat',key:'block',v:8}],J05S5:[{k:'stat',key:'hpp',v:8}],J05S6:[{k:'counter',v:35,cd:1}],
  J06S4:[{k:'stat',key:'atkp',v:8}],J06S5:[{k:'lowhp',th:40,type:'dmg',v:12}],J06S6:[{k:'lowhp',th:25,type:'dr',v:15}],
  J07S4:[{k:'stat',key:'magp',v:8}],J07S5:[{k:'zmp',v:1.5}],J07S6:[{k:'cond',st:['BURN'],sk:'J07S3',v:25}],
  J08S4:[{k:'stat',key:'dot',v:15}],J08S5:[{k:'stat',key:'mresp',v:10}],J08S6:[{k:'corrDown',v:10}],
  J09S4:[{k:'stat',key:'crit',v:5}],J09S5:[{k:'stat',key:'cd',v:12}],J09S6:[{k:'exec',th:30,v:12}],
  J10S4:[{k:'stat',key:'crit',v:4}],J10S5:[{k:'dotst',st:'POISON',v:15}],J10S6:[{k:'next',ev:'evade',v:20}],
  J11S4:[{k:'stat',key:'magp',v:6}],J11S5:[{k:'stat',key:'healp',v:15}],J11S6:[{k:'next',ev:'heal',v:40}],
  J12S4:[{k:'stat',key:'block',v:10}],J12S5:[{k:'stat',key:'hpp',v:8}],J12S6:[{k:'next',ev:'block',sk:'J12S2',v:25}],
  J13S4:[{k:'stat',key:'atkp',v:4}],J13S5:[{k:'stat',key:'double',v:3}],J13S6:[{k:'next',ev:'combo',v:10}]};
/* 技能名 → ID（同職業，允許簡稱：牽制、盾壁、守勢、星火、護盾） */
function skBy6(j,tok){if(!tok)return null;tok=tok.replace(/^[「【]|[」】]$/g,'');const L=jobSk6(j,null);
  let x=L.find(k=>k.n===tok)||L.find(k=>tok.startsWith(k.n))||L.find(k=>k.n.startsWith(tok));
  if(!x&&tok==='護盾')x=L.find(k=>/護盾/.test(k.fx));if(!x&&tok==='守勢')x=L.find(k=>k.n.startsWith('守勢'));return x?x.id:null}
const STN6={破甲:'ARMOR',灼燒:'BURN',減速:SLOWK,中毒:'POISON',聖印:'SEAL',審判印:'JUDGE',腐蝕:'CORRODE',獵印:'MARK',已灼燒:'BURN',已中毒:'POISON',已腐蝕:'CORRODE'};
const stOf6=w=>STN6[w]?[].concat(STN6[w]):null;
const STATK={'物防穿透':'pen','爆傷':'cd','連擊率':'double','格擋':'block','最大HP':'hpp','最大MP':'mpp','魔抗':'mresp','行動速度':'spd','受治療':'healin','受到治療':'healin'};
function parseTal6(j,t,n){const N=x=>+x*n,m=(re)=>t.match(re);let r;
  if(r=m(/^具有(.+?)標籤的直接技能傷害\+(\d+)%$/))return {k:'tagdmg',tag:r[1],v:N(r[2])};
  if(r=m(/^(.+?)每累計施放(\d+)次該技能，該技能剩餘冷卻減1次；每級門檻減1（最低(\d+)次）$/))return {k:'skcdn',sk:skBy6(j,r[1]),th:Math.max(+r[3],+r[2]-(n-1))};
  if(r=m(/^(.+?)持續\+([\d.]+)次行動$/))return {k:'skdur',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^有效治療後減傷(\d+)%，持續(\d+)次行動$/))return {k:'healDr',v:N(r[1]),dur:+r[2]};
  if(r=m(/^每第三次(.+?)命中後(.+?)剩餘冷卻減(\d+)次$/))return {k:'third',src:skBy6(j,r[1]),sk:skBy6(j,r[2]),v:+r[3]};
  if(r=m(/^HP低於(\d+)%時?傷害\+(\d+)%$/))return {k:'lowhp',th:+r[1],type:'dmg',v:N(r[2])};
  if(r=m(/^HP低於(\d+)%爆擊\+(\d+)百分點$/))return {k:'lowhp',th:+r[1],type:'crit',v:N(r[2])};
  if(r=m(/^HP低於(\d+)%減傷額外(\d+)百分點$/))return {k:'lowhp',th:+r[1],type:'dr',v:N(r[2])};
  if(r=m(/^HP低於(\d+)%時(.+?)額外回復最大HP(\d+)%$/))return {k:'lowheal',th:+r[1],sk:skBy6(j,r[2]),pct:N(r[3])};
  if(r=m(/^HP低於(\d+)%時(.+?)治療\+(\d+)%$/))return {k:'lowhealp',th:+r[1],sk:skBy6(j,r[2]),v:N(r[3])};
  if(r=m(/^HP低於(\d+)%時獲得(\d+)%HP護盾，每場一次$/))return {k:'lowshield',th:+r[1],v:N(r[2])};
  if(r=m(/^HP首次低於(\d+)%時自身行動條\+(\d+)百分點$/))return {k:'lowgauge',th:+r[1],v:N(r[2])};
  if(r=m(/^對HP低於(\d+)%目標增傷(\d+)%$/))return {k:'exec',th:+r[1],v:N(r[2])};
  if(r=m(/^對獵印且HP低於(\d+)%目標首次命中額外造成(\d+)%物攻傷害$/))return {k:'markexec',th:+r[1],v:N(r[2])};
  if(r=m(/^對(.+?)目標(.+?)增傷(\d+)%$/))return {k:'cond',st:stOf6(r[1]),sk:skBy6(j,r[2]),v:N(r[3])};
  if(r=m(/^(.+?)對(.+?)目標增傷(\d+)%$/))return {k:'cond',st:stOf6(r[2]),sk:skBy6(j,r[1]),v:N(r[3])};
  if(r=m(/^守勢期間首次承受直接傷害後下次(.+?)增傷(\d+)%$/))return {k:'next',ev:'hurtGuard',sk:skBy6(j,r[1]),v:N(r[2]),once:1};
  if(r=m(/^(.+?)期間(.+?)後下(?:一)?次(.+?)額外增傷(\d+)%$/))return {k:'next',ev:/祈癒|治療/.test(r[2])?'heal':'cast',src:/^治療$/.test(r[2])?null:skBy6(j,r[2]),need:stOf6(r[1]),sk:skBy6(j,r[3]),v:N(r[4])};
  if(r=m(/^(.+?)期間(.+?)增傷(\d+)%$/)){const s=skBy6(j,r[1]);return {k:'during',self:s,sk:skBy6(j,r[2]),v:N(r[3])}}
  if(r=m(/^(.+?)(?:直接)?傷害\+(\d+)%$/))return {k:'skdmg',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^(.+?)MP成本-(\d+)%$/))return {k:'skmp',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^反制冷卻-([\d.]+)秒$/))return {k:'counterCd',v:N(r[1])};
  if(r=m(/^反制反擊倍率\+(\d+)百分點$/))return {k:'counterAmp',v:N(r[1])};
  if(r=m(/^(.+?)冷卻-([\d.]+)秒$/))return {k:'skcd',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^(.+?)持續\+([\d.]+)秒$/))return {k:'skdur',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^(.+?)(?:灼燒|中毒)?跳傷\+(\d+)%$/))return {k:'skdot',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^物防穿透\+(\d+)百分點$/))return {k:'stat',key:'pen',v:N(r[1])};
  if(r=m(/^(.+?)承傷懲罰降低(\d+)百分點$/))return {k:'fxv',sk:skBy6(j,r[1]),what:'承傷',v:-N(r[2])};
  if(r=m(/^(.+?)(?:物防)?穿透\+(\d+)百分點$/))return {k:'skpen',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^(.+?)爆擊率?\+(\d+)百分點$/))return r[1]==='爆擊'?{k:'stat',key:'crit',v:N(r[2])}:{k:'skcrit',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^爆傷\+(\d+)百分點$/))return {k:'stat',key:'cd',v:N(r[1])};
  if(r=m(/^(.+?)爆傷\+(\d+)百分點$/))return {k:'skcd2',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^腐蝕期間敵傷害額外降低(\d+)百分點$/))return {k:'corrDown',v:N(r[1])};
  if(r=m(/^(.+?)(物防降低|減傷|減速|降傷|降防|格擋|迴避|連擊增益|增傷|吸血)額外(\d+)百分點$/))return {k:'fxv',sk:skBy6(j,r[1]),what:r[2],v:N(r[3])};
  if(r=m(/^(.+?)護盾量\+(\d+)%$/))return {k:'skshield',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^護盾存在時(魔抗|減傷)\+?(\d+)%$/))return r[1]==='魔抗'?{k:'shmres',v:N(r[2])}:{k:'shdr',v:N(r[2])};
  if(r=m(/^(.+?)(?:治療量|治療)\+(\d+)%$/)){if(/^受/.test(r[1]))return {k:'stat',key:'healin',v:N(r[2])};return {k:'skheal',sk:skBy6(j,r[1]),v:N(r[2])}}
  if(r=m(/^(最大HP|最大MP|魔抗|行動速度|連擊率|格擋)\+([\d.]+)(?:%|百分點)$/))return {k:'stat',key:STATK[r[1]],v:N(r[2])};
  if(r=m(/^格擋成功傷害額外降低(\d+)百分點$/))return {k:'blockRed',v:N(r[1])};
  if(r=m(/^連擊追加倍率\+(\d+)百分點$/))return {k:'comboAmp',v:N(r[1])};
  if(r=m(/^(.+?)回MP額外([\d.]+)百分點$/))return {k:'zmp',v:N(r[2])};
  if(r=m(/^(格擋|迴避|成功淨化)後回MP([\d.]+)%$/))return {k:'evmp',ev:{格擋:'block',迴避:'evade',成功淨化:'cleanse'}[r[1]],v:N(r[2])};
  if(r=m(/^成功迴避後自身行動條\+(\d+)百分點$/))return {k:'gauge',ev:'evade',v:N(r[1])};
  if(r=m(/^(.+?)命中回MP([\d.]+)%$/))return {k:'hitmp',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^格擋後下一次(.+?)(?:額外)?(增傷|穿透)(\d+)(?:%|百分點)$/))return {k:'next',ev:'block',sk:skBy6(j,r[1]),v:r[2]==='增傷'?N(r[3]):0,pen:r[2]==='穿透'?N(r[3]):0};
  if(r=m(/^護盾被擊破後下一次(.+?)增傷(\d+)%$/))return {k:'next',ev:'shbreak',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^連擊命中後下一次(.+?)增傷(\d+)%$/))return {k:'next',ev:'combo',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^依序使用三種不同技能後下次(.+?)增傷(\d+)%$/))return {k:'next',ev:'seq3',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^(.+?)命中後下一次(.+?)額外穿透(\d+)百分點$/))return {k:'next',ev:'hit',src:skBy6(j,r[1]),sk:skBy6(j,r[2]),v:0,pen:N(r[3])};
  if(r=m(/^(.+?)(命中|爆擊)後(?:下一次|下次)(.+?)(?:額外)?增傷(\d+)%$/))return {k:'next',ev:r[2]==='爆擊'?'crit':'hit',src:r[1]==='反制'?'counter':skBy6(j,r[1]),sk:skBy6(j,r[3]),v:N(r[4])};
  if(r=m(/^(.+?)命中(?:已)?(.+?)目標(?:後)?自身行動條\+(\d+)百分點$/))return {k:'gauge',ev:'hit',src:skBy6(j,r[1]),st:stOf6(r[2]),v:N(r[3])};
  if(r=m(/^(.+?)(命中|爆擊)後自身行動條\+(\d+)百分點$/))return {k:'gauge',ev:r[2]==='爆擊'?'crit':'hit',src:skBy6(j,r[1]),v:N(r[3])};
  if(r=m(/^(.+?)命中(?:已)?(.+?)目標(?:時)?額外造成(\d+)%(魔攻|物攻)傷害$/))return {k:'extra',src:skBy6(j,r[1]),st:stOf6(r[2]),v:N(r[3]),stat:r[4]==='魔攻'?'MAG':'ATK'};
  if(r=m(/^(.+?)命中(.+?)目標額外回HP(\d+)%$/))return {k:'extraHeal',src:skBy6(j,r[1]),st:stOf6(r[2]),v:N(r[3])};
  if(r=m(/^每第三次(.+?)命中後(.+?)冷卻減(\d+)秒$/))return {k:'third',src:skBy6(j,r[1]),sk:skBy6(j,r[2]),v:N(r[3])};
  if(r=m(/^(.+?)命中使敵行動條退(\d+)百分點$/))return {k:'push',src:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^有效治療後減傷(\d+)%，持續(\d+)秒$/))return {k:'healDr',v:N(r[1]),dur:+r[2]};
  if(r=m(/^(.+?)溢出治療轉護盾，上限最大HP(\d+)%$/))return {k:'overShield',sk:skBy6(j,r[1]),v:N(r[2])};
  if(r=m(/^每累計消耗最大MP(\d+)%後回復最大MP(\d+)%$/))return {k:'mpcycle',per:+r[1],v:N(r[2])};
  if(r=m(/^腐蝕目標首次直接攻擊命中時獲得(\d+)%HP護盾，每場一次$/))return {k:'corrShield',v:N(r[1])};
  if(r=m(/^黎明祈禱成功淨化時額外獲得(\d+)%HP護盾$/))return {k:'cleanseShield',v:N(r[1])};
  if(r=m(/^勝利額外回HP(\d+)百分點$/))return {k:'winhp',v:N(r[1])};
  return {k:'none'}}
const TALS=()=>(V6.TAL||[]).filter(t=>JOBK[t.job]===job6());
function talPts6(){return Math.min(20,Math.floor((S?S.lv:0)/5))}
function talUsed6(){let n=0;for(const id in (S&&S.tal||{}))n+=S.tal[id];return n}
const talFree6=()=>talPts6()-talUsed6();
let EFC=null,EFCK='';
function effs6(){if(!S)return [];const j=job6(),key=j+'|'+S.lv+'|'+JSON.stringify(S.tal||{});if(EFC&&EFCK===key)return EFC;const L=[];
  for(const k of jobSk6(j,false))if(skOk6(k.id))(PSV[k.id]||[]).forEach(e=>L.push(Object.assign({from:k.id},e)));
  for(const t of TALS()){const n=(S.tal||{})[t.id]||0;if(!n)continue;const e=parseTal6(j,t.fx,n);e.from=t.id;e.lim=t.lim;L.push(e)}
  EFC=L;EFCK=key;return L}
const effK=(k)=>effs6().filter(e=>e.k===k);
const effSum=(k,sk)=>effs6().filter(e=>e.k===k&&(sk===undefined||e.sk===sk)).reduce((a,e)=>a+(e.v||0),0);
function lowDr6(){if(!S)return 0;const s=rtS6();let v=0;for(const e of effK('lowhp'))if(e.type==='dr'&&S.hp<s.HP*e.th/100)v+=e.v;return v}

/* 常駐加成：給 stats() 併入（B 線的 stats 會呼叫；還沒合併時這裡自己包一層 gearTotals） */
function skPassive6(){const o={};if(!S)return o;const add=(k,v)=>{o[k]=(o[k]||0)+v};
  for(const e of effK('stat'))add(e.key,e.v);
  /* 武器熟練：武器固定攻擊 +1%／級（盾改防禦） */
  try{const wl=wpnLv6();if(wl>1){const w=wpnBase6();if(w.atk)add('atk',Math.round(w.atk*(wl-1)/100));if(w.mag)add('mag',Math.round(w.mag*(wl-1)/100));if(w.def)add('def',Math.round(w.def*(wl-1)/100))}}catch(e){}
  if(B&&B.psx){add('atkp',stCap('p','atk'));add('magp',stCap('p','mag'));add('defp',stCap('p','def'));add('mresp',stCap('p','mres'));add('crit',stVal('p','crit'));add('eva',stVal('p','eva'));add('hit',stVal('p','hit'));
    add('pen',stVal('p','pen'));add('mpen',stVal('p','mpen'));add('mpcut',stVal('p','mpcut'));add('block',stVal('p','block'));add('double',stVal('p','combo'));
    if(stHas('p','SHIELD'))for(const e of effK('shmres'))add('mresp',e.v);
    const s0=S.hp,mx=B.mx6||1;for(const e of effK('lowhp'))if(e.type==='crit'&&s0<mx*e.th/100)add('crit',e.v)}
  return o}
if(typeof stats==='function'&&!/skPassive6/.test(stats.toString())&&typeof gearTotals==='function'){const _gt=gearTotals;gearTotals=function(){const e=_gt.apply(this,arguments);try{const p=skPassive6();for(const k in p)e[k]=(e[k]||0)+p[k]}catch(x){}return e}}

/* ---------- 熟練 ---------- */
const MSTH=[0,30,100,250,500],WPTH=[0,20,60,150,300];
const thLv=(n,T)=>{let l=1;for(let i=0;i<T.length;i++)if(n>=T[i])l=i+1;return l};
const skmLv6=k=>thLv((S.skm||{})[k]||0,MSTH);
const wpKey6=()=>jobEq6(job6()).main||'武器';
const wpnLv6=()=>thLv((S.wpm||{})[wpKey6()]||0,WPTH);
function wpnBase6(){try{const u=S.eq.main||S.eq.weapon,g=u&&gearBy(u);if(!g)return {};if(typeof gearBase6==='function')return gearBase6(g);const o=typeof gearStat==='function'?gearStat(g):{};return {atk:o.atk||0,mag:o.mag||0,def:0}}catch(e){return {}}}

/* ---------- 成本、冷卻 ---------- */
function mpCost6(k){const x=SK[k];if(!x||!x.mp)return 0;const s=rtS6();let c=x.mp*(.5+S.lv/100)*(1-Math.min(50,s.MPCUT||0)/100);
  if(!x.dmg&&!x.heal)c*=1-(skmLv6(k)-1)/100;c*=1-effSum('skmp',k)/100;if(B&&B.psx)c*=1+stVal('p','mpCost')/100;return Math.max(1,Math.round(c))}
function cdOf6(k){const x=SK[k];if(!x||!x.cd)return 0;return Math.max(Math.ceil(x.cd*.5),x.cd-Math.floor(effSum('skcd',k)))}
const cdLeft6=k=>B&&B.pcd6&&B.pcd6[k]?Math.max(0,B.pcd6[k]-acOf('p')):0;
const skReady6=k=>!!SK[k]&&SK[k].act&&skOk6(k)&&cdLeft6(k)<=0&&S.mp>=mpCost6(k)&&!(stHas('p','SILENCE')&&SK[k].s==='MAG'&&mpCost6(k)>0);
const durOf6=(k,base)=>base+effSum('skdur',k);
const fxvOf6=(k,what)=>effs6().filter(e=>e.k==='fxv'&&e.sk===k&&(!what||e.what===what)).reduce((a,e)=>a+e.v,0);

/* ---------- 打敵人 ---------- */
function foeTags6(f){if(f.tags)return f.tags;try{const r=typeof raceOf==='function'?raceOf(f.id):null;const RN={beast:'野獸',undead:'不死',construct:'構裝',element:'元素',demon:'魔族',plant:'植物',human:'人形'};return r&&RN[r]?[RN[r]]:[]}catch(e){return []}}
function hitFoe(stat,pow,o){o=o||{};if(!B)return {d:0,cr:false};const s=rtS6(),f=o.tgt||B,mg=stat==='MAG';
  if(!o.sure){const hit=cl6(100+(s.HIT||0),0,100);const ev=Math.max(0,(f.eva||0)+stVal(f,'eva'));if(Math.random()*100>=hit*(1-Math.min(90,ev)/100))return {d:0,cr:false,miss:true}}
  const atk=stat==='BOTH'?s.ATK+s.MAG:(s[stat]||s.ATK);let m=pow*(1+(o.amp||0)/100);
  if(o.skill)m*=1+Math.min(20,s.SKILL||0)/100;
  if(f.kind==='boss')m*=1+Math.min(25,s.BOSS||0)/100;else if(f.kind==='elite')m*=1+Math.min(25,s.ELITE||0)/100;
  m*=elMul6(foeTags6(f),o.tag||'NEUTRAL');
  let vin=stVal(f,'dmgIn')+(mg?stVal(f,'magIn'):0)+(o.tag==='FIRE'?stVal(f,'fireIn'):0);m*=1+Math.min(25,vin)/100;m*=1+stVal(f,'markIn')/100;
  if(B.opening)m*=1.5;
  const crc=cl6((s.CRIT||0)+(o.cr||0),0,100),cr=!!o.crit||Math.random()*100<crc;
  const pen=Math.min(30,(mg?(s.MPEN||0):(s.PEN||0))+(o.pen||0));let df=(mg?(f.mres??f.def):f.def)||0;df*=Math.max(.7,1+stCap(f,mg?'mres':'def')/100);df*=1-pen/100;
  let d=atk*m*100/(100+df)*(.9+Math.random()*.2);if(cr)d*=((s.CD||150)+(o.cd||0))/100;
  d*=1-Math.min(40,stVal(f,'dr'))/100;
  if(typeof foeDmgMod6==='function')try{d=foeDmgMod6(d,{stat,cr,o,f})}catch(e){}
  d=Math.max(1,Math.round(d));d=foeTake6(f,d,B.srcNow||'攻擊');return {d,cr}}

/* ---------- 出手 ---------- */
function nextBuff6(k,direct){const P=B.p6;if(!P||!P.nx.length)return {v:0,pen:0};let v=0,pen=0;P.nx=P.nx.filter(n=>{if(n.sk?n.sk===k:direct){v+=n.v||0;pen+=n.pen||0;return false}return true});return {v,pen}}
function trig6(ev,o){if(!B||!B.p6)return;o=o||{};const P=B.p6,now=acOf('p'),s=rtS6();
  const pool=e=>{if(/共用觸發冷卻/.test(e.lim||'')){if(P.tcd>now)return false;P.tcd=now+3}if(e.lim==='每場一次'||e.once){if(P.once[e.from])return false;P.once[e.from]=1}return true};
  for(const e of effs6()){
    if(e.k==='next'&&e.ev===ev&&(!e.src||e.src===o.sk)&&(!e.need||e.need.some(x=>stHas(B,x)))){if(pool(e))P.nx.push({sk:e.sk||null,v:e.v,pen:e.pen||0})}
    else if(e.k==='gauge'&&e.ev===ev&&(!e.src||e.src===o.sk)&&(!e.st||e.st.some(x=>stHas(B,x)))){if(pool(e))B.rt.pgB=(B.rt.pgB||0)+e.v}
    else if(e.k==='evmp'&&e.ev===ev){if(pool(e))S.mp=Math.min(s.MP,S.mp+Math.round(s.MP*e.v/100))}}}
function pAct(type,arg){if(!B||B.busy)return false;const s=rtS6();B.p6=B.p6||{nx:[],once:{},tcd:0,seq:[],third:{},mpUse:0};
  if(type==='atk'){type='skill';arg=battleSkills()[0]}
  if(type==='skill'){const x=SK[arg];if(!x||!x.act||!skOk6(arg))return false;if(cdLeft6(arg)>0)return false;const c=mpCost6(arg);if(S.mp<c){toast('MP 不足');return false}
    if(stHas('p','SILENCE')&&x.s==='MAG'&&c>0){toast('沉默中，只能用不耗 MP 的招式');return false}}
  if(type==='flee'&&typeof flee6==='function')return flee6();
  if(type==='flee'&&B.kind==='boss'){toast('首領戰無法逃跑');return false}
  if(B.opening&&type!=='guard'&&type!=='item'){B.opn2=1}B.elHit=null;
  if(type==='skill')useSkill6(arg,s);
  else if(type==='item'){if(typeof useItem6==='function'){if(useItem6(arg,true)===false)return false}else{const it=ITEMS[arg];if(!it||!S.items[arg]||!it.use)return false;addItem(arg,-1);const h0=S.hp;if(it.use.hp)S.hp=Math.min(s.HP,S.hp+Math.round(it.use.hp*healInM6()));if(it.use.mp)S.mp=Math.min(s.MP,S.mp+it.use.mp);B.fx={by:'me',glow:1,heal:S.hp-h0||0};SFX.heal();blog(`你使用了${it.n}`)}}
  else if(type==='guard'){B.guard=true;S.mp=Math.min(s.MP,S.mp+Math.max(2,Math.round(s.MP*.05)));B.fx={by:'me',glow:1};SFX.buff();blog('你擺出防禦架式')}
  else if(type==='flee'){if(Math.random()<(typeof fleeChance6==='function'?fleeChance6():B.kind==='elite'?.5:.8)){B=null;RUN.view={type:'res',title:'成功逃離',text:'你甩開了魔物，繼續趕路。'};render();return true}blog('逃跑失敗')}
  if(B.rt){rtAfterP(type);const R=B.rt;if(R.pgB){R.pg=Math.min(100,R.pg+R.pgB);R.pgB=0}return true}
  B.menu='main';B.busy=true;render();if(B.hp<=0){winSoon(1350);return true}setTimeout(foeTurn,AS(850));return true}
function useSkill6(k,s){const x=SK[k],P=B.p6,now=acOf('p'),c=mpCost6(k),j=job6(),ps=[];try{lunaSkill(k)}catch(e){}
  if(typeof FX7!=='undefined'&&FX7[k]&&FX7[k].charge&&B.rt){S.mp-=c;P.mpUse+=c;if(x.cd)B.pcd6[k]=now+cdOf6(k)+1;B.chg7=k;B.fx={by:'me',cut:x.n+'・蓄力',skill:k,glow:1};try{SFX.buff()}catch(e){}blog(`你開始蓄力【${x.n}】`);return}
  S.mp-=c;P.mpUse+=c;if(x.cd){B.pcd6[k]=now+cdOf6(k)+1;for(const e of effK('skcdn'))if(e.sk===k){P.cast=P.cast||{};P.cast[k]=(P.cast[k]||0)+1;if(P.cast[k]%e.th===0)B.pcd6[k]-=1}}
  {const L=Math.abs((B.L||B.lv||S.lv)-S.lv);if(L<=10){S.skm=S.skm||{};S.skm[k]=(S.skm[k]||0)+1}}
  const fx=B.fx={by:'me',cut:x.n,skill:k,el:dmgTag6(k).toLowerCase(),hits:x.dmg?x.dmg.h:1};B.srcNow=x.n;
  try{playSkillSfx(k,x)}catch(e){}
  /* 三連不同技能 */
  P.seq.push(k);P.seq=P.seq.slice(-3);
  let tot=0;
  if(x.dmg){const nb=nextBuff6(k,true);let amp=(skmLv6(k)-1)+effSum('skdmg',k)+nb.v,pen=effSum('skpen',k)+nb.pen,cr=effSum('skcrit',k),cdB=effSum('skcd2',k);
    if(k==='J03S2')pen+=15;if(k==='J09S2')pen+=20;
    for(const e of effK('cond'))if((!e.sk||e.sk===k)&&e.st&&e.st.some(t=>stHas(B,t)))amp+=e.v;
    for(const e of effK('during'))if((!e.sk||e.sk===k)&&e.self&&stHas('p',selfSt6(e.self)))amp+=e.v;
    for(const e of effK('exec'))if(B.hp<B.max*e.th/100)amp+=e.v;
    for(const e of effK('lowhp'))if(e.type==='dmg'&&S.hp<s.HP*e.th/100)amp+=e.v;
    if(k==='J08S3'&&stHas(B,'CORRODE'))amp+=25;
    if(typeof skAmp7==='function'){amp+=skAmp7(k,B);pen+=skPen7(k);cr+=skCrit7(B);cdB+=skCd7(B)}
    const r=hitFoe(x.s,x.pow,{skill:1,tag:dmgTag6(k),amp,pen,cr,cd:cdB});tot=r.d;fx.d=r.d;fx.cr=r.cr;
    if(x.dmg.h>1&&r.d>0){const a=Math.floor(r.d/x.dmg.h);fx.hl=Array.from({length:x.dmg.h},(_,i)=>i===x.dmg.h-1?r.d-a*(x.dmg.h-1):a)}
    if(r.miss)ps.push(`${B.name} 閃開了`);else{ps.push(`造成 ${r.d} 傷害${r.cr?'（爆擊！）':''}`);
      /* 連擊：只判一次，追加這招實際傷害的 35% */
      const dbl=Math.min(20,(s.DOUBLE||0));if(B.hp>0&&Math.random()*100<dbl){const ex=Math.max(1,Math.round(r.d*(.35+effSum('comboAmp')/100)));foeTake6(B,ex,'連擊');tot+=ex;ps.push(`連擊 +${ex}`);(fx.tags=fx.tags||[]).push('連擊');trig6('combo',{sk:k});try{onCombo7()}catch(e){}}
      if(s.LS){const h=Math.round(r.d*Math.min(10,s.LS)/100*healInM6());if(h>0){S.hp=Math.min(s.HP,S.hp+h);fx.heal=(fx.heal||0)+h}}
      trig6('hit',{sk:k});if(r.cr)trig6('crit',{sk:k});
      if(c===0){const z=effSum('zmp');if(z)S.mp=Math.min(s.MP,S.mp+Math.max(1,Math.round(s.MP*z/100)))}
      for(const e of effK('hitmp'))if(e.sk===k)S.mp=Math.min(s.MP,S.mp+Math.max(1,Math.round(s.MP*e.v/100)));
      for(const e of effK('extra'))if(e.src===k&&e.st&&e.st.some(t=>stHas(B,t))&&B.hp>0){const r2=hitFoe(e.stat,e.v/100,{sure:1,tag:dmgTag6(k)});tot+=r2.d;ps.push(`追加 ${r2.d}`)}
      for(const e of effK('extraHeal'))if(e.src===k&&e.st&&e.st.some(t=>stHas(B,t))){const h=Math.round(s.HP*e.v/100*healInM6());S.hp=Math.min(s.HP,S.hp+h);fx.heal=(fx.heal||0)+h}
      for(const e of effK('markexec'))if(stHas(B,'MARK')&&B.hp>0&&B.hp<B.max*e.th/100&&!P.once[e.from]){P.once[e.from]=1;const r2=hitFoe('ATK',e.v/100,{sure:1});tot+=r2.d;ps.push(`追加 ${r2.d}`)}
      for(const e of effK('corrShield'))if(stHas(B,'CORRODE')&&!P.once[e.from]){P.once[e.from]=1;stAdd('p','SHIELD',{amt:s.HP*e.v/100,dur:2})}
      for(const e of effK('push'))if(e.src===k)B.rtg=Math.max(0,(B.rtg||0)-e.v);
      for(const e of effK('third'))if(e.src===k){P.third[e.from]=(P.third[e.from]||0)+1;if(P.third[e.from]%3===0&&B.pcd6[e.sk])B.pcd6[e.sk]-=e.v}}
    skFx6(k,s,r.d,ps,B.hp>0&&!r.miss);
    if(typeof aoeHit7==='function')tot+=aoeHit7(k,s,amp,pen,cr,cdB,ps);
    try{afterCast7(k,s,!r.miss)}catch(e){}}
  else{skFx6(k,s,0,ps,false);try{afterCast7(k,s,false)}catch(e){}}
  /* 三種不同技能依序使用 */
  if(new Set(P.seq).size===3&&P.seq.length===3){trig6('seq3',{sk:k});P.seq=[]}
  trig6('cast',{sk:k});
  for(const e of effK('mpcycle')){const per=s.MP*e.per/100;if(per>0&&P.mpUse>=per){P.mpUse-=per;S.mp=Math.min(s.MP,S.mp+Math.round(s.MP*e.v/100))}}
  fx.d=x.dmg?tot:undefined;if(x.dmg)fx.d=tot;
  fx.tags=(fx.tags||[]).concat(ps.filter(t=>/陷入|護盾|減傷|格擋率|迴避|連擊率/.test(t)).map(t=>t.replace(/^敵人陷入/,''))).slice(0,3);
  blog(`你施展【${x.n}】${ps.length?'，'+ps.join('，'):''}`)}
const selfSt6=k=>({J01S3:'GUARD',J05S3:'BLOCKUP',J07S3:'SHIELD',J12S3:'SHIELD',J10S3:'EVAUP',J13S3:'COMBOUP',J06S2:'TAKEUP'})[k];
function heal6(k,pct,magR,s,ps){let amp=effSum('skheal',k)+(skmLv6(k)-1);for(const e of effK('lowhealp'))if(e.sk===k&&S.hp<s.HP*e.th/100)amp+=e.v;
  let h=(s.HP*pct+s.MAG*magR)*(1+Math.min(30,s.HEALP||0)/100)*(1+amp/100)*healInM6();for(const e of effK('lowheal'))if(e.sk===k&&S.hp<s.HP*e.th/100)h+=s.HP*e.pct/100;
  h=Math.round(h);const room=s.HP-S.hp,real=Math.min(room,h);S.hp+=real;B.fx.heal=(B.fx.heal||0)+real;ps.push(`回復 ${real} HP`);
  for(const e of effK('overShield'))if(e.sk===k&&h>real)stAdd('p','SHIELD',{amt:Math.min(s.HP*e.v/100,h-real),dur:2});
  for(const e of effK('healDr'))if(real>0)B.healDr={v:e.v,e:acOf('p')+e.dur+1};
  if(real>0)trig6('heal',{sk:k});return real}
/* 主動技能效果（企劃表「效果」欄） */
function skFx6(k,s,d,ps,hit){const T=B,dot=x=>1+(effSum('skdot',k)+(rtS6().DOT||0)+(x==='POISON'?effSum('dotst'):0)+(typeof dotK7==='function'?dotK7(x||''):0))/100,foeSt=(id,o)=>{if(hit&&stAdd(T,id,o))ps.push(`敵人陷入${STX[id].n}`)};
  switch(k){
    case 'J01S2':foeSt('ARMOR',{v:12+fxvOf6(k),dur:durOf6(k,2)});break;
    case 'J05S2':foeSt('ARMOR',{v:10+fxvOf6(k),dur:durOf6(k,2)});break;
    case 'J12S2':foeSt('ARMOR',{v:10+fxvOf6(k),dur:durOf6(k,2)});break;
    case 'J01S3':stAdd('p','GUARD',{v:20+fxvOf6(k),dur:durOf6(k,2)});ps.push('減傷');break;
    case 'J02S2':foeSt('BURN',{src:{mag:s.MAG},r:.25,amp:dot('BURN')-1,dur:durOf6(k,2)});break;
    case 'J07S2':foeSt('BURN',{src:{mag:s.MAG},r:.30,amp:dot('BURN')-1,dur:durOf6(k,2)});break;
    case 'J02S3':foeSt('FROST',{v:15+fxvOf6(k),dur:durOf6(k,2)});break;
    case 'J03S3':foeSt('SLOW',{v:15+fxvOf6(k),dur:durOf6(k,2)});break;
    case 'J04S2':foeSt('SEAL',{dur:durOf6(k,2)});break;
    case 'J11S2':foeSt('JUDGE',{dur:durOf6(k,2)});break;
    case 'J04S3':heal6(k,.08,.5,s,ps);break;
    case 'J11S3':{heal6(k,.10,.6,s,ps);const bad=stList('p').find(id=>STX[id].bad&&id!=='STUN');if(bad){stClear('p',bad);ps.push(`解除${STX[bad].n}`);trig6('cleanse',{sk:k});for(const e of effK('cleanseShield'))stAdd('p','SHIELD',{amt:s.HP*e.v/100,dur:2})}break}
    case 'J05S3':stAdd('p','BLOCKUP',{v:20+fxvOf6(k),dur:durOf6(k,2)});ps.push('格擋率提升');break;
    case 'J06S2':stAdd('p','TAKEUP',{v:Math.max(0,10+fxvOf6(k,'承傷')),dur:2});break;
    case 'J06S3':case 'J08S3':{const r=(k==='J06S3'?20:10)+fxvOf6(k,'吸血');const h=Math.round(d*r/100*healInM6());if(h>0){S.hp=Math.min(s.HP,S.hp+h);B.fx.heal=(B.fx.heal||0)+h;ps.push(`吸取 ${h} HP`)}break}
    case 'J07S3':stAdd('p','SHIELD',{amt:s.HP*.10*(1+(effSum('skshield',k)+effSum('shamp'))/100),dur:durOf6(k,2)});ps.push('獲得護盾');break;
    case 'J12S3':stAdd('p','SHIELD',{amt:s.HP*.12*(1+(effSum('skshield',k)+effSum('shamp'))/100),dur:durOf6(k,2)});ps.push('獲得護盾');break;
    case 'J08S2':foeSt('CORRODE',{src:{mag:s.MAG},r:.4,amp:dot('CORRODE')-1,dur:durOf6(k,3)});break;
    case 'J09S3':foeSt('MARK',{v:10+fxvOf6(k),dur:durOf6(k,2)});break;
    case 'J10S2':foeSt('POISON',{src:{atk:s.ATK},r:.3,amp:dot('POISON')-1,dur:durOf6(k,3)});break;
    case 'J10S3':stAdd('p','EVAUP',{v:8+fxvOf6(k),dur:durOf6(k,2)});ps.push('迴避提升');break;
    case 'J13S3':stAdd('p','COMBOUP',{v:6+fxvOf6(k),dur:durOf6(k,2)});ps.push('連擊率提升');break;
    default:if(typeof fx7Apply==='function')fx7Apply(k,s,d,ps,hit)}}

/* 格擋（玩家按的格擋成功，或 A 線的格擋率被動觸發都呼叫）、閃避、受傷 */
function onBlock6(){if(!B)return;B.p6=B.p6||{nx:[],once:{},tcd:0,seq:[],third:{},mpUse:0};trig6('block');
  for(const e of effK('counter')){const cd=e.cd;if(B.p6.cntT!=null&&B.p6.cntT+cd+1>acOf('p'))continue;B.p6.cntT=acOf('p');const r=hitFoe('ATK',(e.v+effSum('counterAmp'))/100,{sure:1,tag:dmgTag6(battleSkills()[0])});B.log.push(`【反制】反擊 ${r.d}`);(B.pops=B.pops||[]).push({d:r.d,k:'反制'});trig6('hit',{sk:'counter'})}}
function onEvade6(){if(!B)return;B.p6=B.p6||{nx:[],once:{},tcd:0,seq:[],third:{},mpUse:0};trig6('evade')}
function onHurt6(d,sh0){if(!B||!B.p6)return;const s=rtS6(),P=B.p6;
  if(sh0&&!stHas('p','SHIELD'))trig6('shbreak');
  if(d>0&&stHas('p','GUARD'))trig6('hurtGuard');
  for(const e of effK('lowshield'))if(S.hp>0&&S.hp<s.HP*e.th/100&&!P.once[e.from]){P.once[e.from]=1;stAdd('p','SHIELD',{amt:s.HP*e.v/100,dur:2});B.log.push('護盾展開')}
  for(const e of effK('lowgauge'))if(S.hp>0&&S.hp<s.HP*e.th/100&&!P.once[e.from]){P.once[e.from]=1;B.rt.pg=Math.min(100,B.rt.pg+e.v)}}
/* 勝利：回 5% HP、8% MP（企劃表）＋被動；武器熟練 +1 */
function onWin6(){if(!S)return;const s=stats();let hp=5;for(const e of effK('winhp'))hp+=e.v;S.hp=Math.min(s.HP,S.hp+Math.round(s.HP*hp/100));S.mp=Math.min(s.MP,S.mp+Math.round(s.MP*.08));
  S.wpm=S.wpm||{};const k=wpKey6(),l0=wpnLv6();S.wpm[k]=(S.wpm[k]||0)+1;if(wpnLv6()>l0)toast(`${k}熟練提升到 Lv.${wpnLv6()}`)}

/* ---------- 掛到戰鬥流程 ---------- */
try{if(Array.isArray(FK)&&!FK.includes('sx'))FK.push('sx')}catch(e){}
{const _sb=startBattle;startBattle=function(){const r=_sb.apply(this,arguments);if(B){B.pcd6={};B.psx={};B.p6={nx:[],once:{},tcd:0,seq:[],third:{},mpUse:0};B.mx6=stats().HP;B.sx=B.sx||{};(B.adds||[]).forEach(f=>f.sx=f.sx||{})}return r}}
{const _rs=rtStep;rtStep=function(dt){_rs(dt);if(B&&B.rt&&!B.rt.done)stStep6()}}
{const _w=win;win=function(){const fin=B&&B.hp<=0&&!(B.adds||[]).some(f=>f.hp>0);const r=_w.apply(this,arguments);if(fin)try{onWin6()}catch(e){}return r}}
/* 怪物出手：玩家護盾吸收、量掉血觸發被動；A 線沒有自己乘倍率時（window.MOB6_MUL 未設），這裡暫時把狀態倍率乘到怪物攻擊上 */
function pShieldAbsorb6(d){const sh=B&&B.psx&&B.psx.SHIELD;if(!sh||!stHas('p','SHIELD')||!(sh.amt>0))return d;const ab=Math.min(sh.amt,d);sh.amt-=ab;if(sh.amt<=0)delete B.psx.SHIELD;return d-ab}
const foeWrap6=(fn,isAdd)=>function(){if(!B||window.MOB6_MUL)return fn.apply(this,arguments);const f=isAdd?arguments[0]:B,act=isAdd||!B.rt||B.rtPh!=='tick';
  const h0=S.hp,shx=B.psx&&B.psx.SHIELD&&stHas('p','SHIELD')?B.psx.SHIELD:null,amt=shx?shx.amt||0:0,mul=act&&f?foeOutMul6(f)*pInMul6(false):1,a0=f&&f.atk,m0=f&&f.mag;
  if(mul!==1&&f){f.atk=a0*mul;f.mag=m0*mul}S.hp+=amt;
  try{return fn.apply(this,arguments)}finally{if(f&&mul!==1){f.atk=a0;f.mag=m0}
    const lost=Math.max(0,h0+amt-S.hp);if(amt){const ab=Math.min(amt,lost);shx.amt-=ab;if(shx.amt<=0&&B&&B.psx)delete B.psx.SHIELD;S.hp=Math.max(0,h0-Math.max(0,lost-amt))}
    if(B)try{onHurt6(Math.max(0,lost-amt),!!shx)}catch(e){}}};
foeTurn=foeWrap6(foeTurn,false);if(typeof rtAddGo==='function')rtAddGo=foeWrap6(rtAddGo,true);
/* 玩家格擋成功（即時格擋按鈕）也算格擋 */
{const _rr=rtReact;rtReact=function(fx){const r=_rr.apply(this,arguments);if(r&&fx&&fx.parry)try{onBlock6()}catch(e){}if(r&&fx&&fx.evade)try{onEvade6()}catch(e){}return r}}
/* 行動條：玩家看行動速度、狀態速度另乘；怪物被減速時變慢（首領減半已在施加時處理） */
function rtPT(){let t=3/(1+Math.min(25,rtS6().SPD||0)/100);if(job6()==='dual')t*=.9;const sp=B&&B.psx?stCap('p','spd'):0;return t/Math.max(.7,1+sp/100)}

/* 冷卻中的技能：保留預約，冷卻好了才放 */
{const _rd=rtDo;rtDo=function(c){if(B&&B.rt&&SK[c]&&!skReady6(c)){if(S.mp<mpCost6(c)){B.rt.q=null;return}B.rt.q=c;return}return _rd.apply(this,arguments)}}
Object.assign(ACT,{rtCmd(v){if(!B||!B.rt||B.rt.done)return;const R=B.rt,xi=$('#xitems');if(xi)xi.hidden=true;if(R.paused)return;
  if(v[0]!=='@'&&SK[v]){if(S.mp<mpCost6(v)){toast('MP 不足');return}if(stHas('p','SILENCE')&&SK[v].s==='MAG'&&mpCost6(v)>0){toast('沉默中');return}}
  if(R.pg>=100&&R.t>=R.pstun&&R.t>=0&&(!SK[v]||skReady6(v)))rtDo(v);else R.q=R.q===v?null:v;try{SFX.ui()}catch(e){}}});

/* ---------- 自動戰鬥 ---------- */
function autoAct(){if(!B||B.busy||!B.auto)return;if(B.rt&&(B.rt.pg<100||B.rt.done||B.rt.t<B.rt.pstun))return;if(MODAL&&MODAL.k==='foe')return;
  const s=rtS6(),sk=battleSkills(),ok=sk.filter(skReady6),hpR=S.hp/s.HP,boss=B.kind==='boss'||B.kind==='elite';
  const heal=ok.find(k=>SK[k].heal);if(heal&&hpR<.5)return pAct('skill',heal);
  if(hpR<.3){const p=Object.keys(S.items||{}).filter(k=>ITEMS[k]&&ITEMS[k].use&&ITEMS[k].use.hp&&S.items[k]>0).sort((a,b)=>ITEMS[b].use.hp-ITEMS[a].use.hp)[0];if(p)return pAct('item',p)}
  if(typeof brkDone==='function'&&B.chg&&!B.guard){const need=B.chgNeed?B.chgNeed-brkDone():0;if(need>0&&B.hp>0){const best=ok.filter(k=>SK[k].dmg).sort((a,b)=>SK[b].pow-SK[a].pow)[0];if(!best||estD6(best,s)<need*.9)return pAct('guard')}}
  /* 先上減益／增益（還沒掛上才放） */
  const want={J01S2:()=>!stHas(B,'ARMOR'),J05S2:()=>!stHas(B,'ARMOR'),J12S2:()=>!stHas(B,'ARMOR'),J02S2:()=>!stHas(B,'BURN'),J07S2:()=>!stHas(B,'BURN'),J02S3:()=>!stHas(B,'FROST'),J03S3:()=>!stHas(B,'SLOW'),J04S2:()=>!stHas(B,'SEAL'),J11S2:()=>!stHas(B,'JUDGE'),
    J08S2:()=>!stHas(B,'CORRODE'),J09S3:()=>!stHas(B,'MARK'),J10S2:()=>!stHas(B,'POISON'),J01S3:()=>!stHas('p','GUARD')&&(boss||hpR<.7),J05S3:()=>!stHas('p','BLOCKUP')&&(boss||hpR<.7),J07S3:()=>!stHas('p','SHIELD'),J12S3:()=>!stHas('p','SHIELD')&&(boss||hpR<.8),
    J10S3:()=>!stHas('p','EVAUP'),J13S3:()=>!stHas('p','COMBOUP'),J06S2:()=>hpR>.45};
  const killer=ok.filter(k=>SK[k].dmg&&estD6(k,s)>=B.hp).sort((a,b)=>mpCost6(a)-mpCost6(b))[0];if(killer)return pAct('skill',killer);
  const bf=ok.find(k=>!SK[k].heal&&want[k]&&want[k]()&&B.hp>estD6(sk[0],s)*1.5);if(bf)return pAct('skill',bf);
  const d=ok.filter(k=>SK[k].dmg&&k!==sk[0]&&(S.mp-mpCost6(k)>=s.MP*.15||boss)).sort((a,b)=>estD6(b,s)-estD6(a,s))[0];
  pAct('skill',d||sk[0])}
function estD6(k,s){const x=SK[k];if(!x||!x.dmg)return 0;const mg=x.s==='MAG',df=(mg?(B.mres??B.def):B.def)||0;return (mg?s.MAG:s.ATK)*x.pow*elMul6(foeTags6(B),dmgTag6(k))*100/(100+df)*(1+(skmLv6(k)-1+effSum('skdmg',k))/100)}
function myPd(k,s){s=s||rtS6();return estD6(k||battleSkills()[0],s)}

/* ---------- 戰鬥畫面 ---------- */
const skIcK6=k=>['skill_'+k,'skill_'+(FXA[k]||'')].find(q=>q in ATL||(ARTSET&&ARTSET.has(q)))||'skill_'+k;
function rtSkIc(k){const ks=['skill_'+k,'skill_'+(FXA[k]||'')];for(const q of ks){if(q in ATL)return `<i class="bi at" style="background-position:${(ATL[q]%ATC)/(ATC-1)*100}% ${Math.floor(ATL[q]/ATC)/(ATR-1)*100}%"></i>`;if(ARTSET&&ARTSET.has(q))return `<img class="bi" src="art/${q}.webp" alt="">`}return ''}
function rtCmdB(){const el=$('#xcmds');if(!el)return;const sk=battleSkills();
  const a=sk.map((k,i)=>{const x=SK[k];return `<button class="bcm sk c-${x.heal?'heal':x.dmg?'atk':'sup'}" style="grid-column:span ${Math.floor(60/sk.length)}" data-a="rtCmd" data-v="${k}"><span class="ci">${rtSkIc(k)||(i===0?RTI.atk:'')}</span><span class="cn">${esc(x.n)}</span><span class="cf"></span><i class="cdv"></i><span class="cq">預約</span><span class="kn">${i===0?'Z':i+1}</span></button>`}).join('');
  const b=[['guard','防禦','c-def','減傷','X'],['parry','格擋','c-par','擋下反擊','空白']].map(([k,n,c,f,kb])=>`<button class="bcm ${c}" style="grid-column:span 30" data-a="rtCmd" data-v="@${k}"><span class="ci">${RTI[k]}</span><span class="cn">${n}</span><span class="cf">${f}</span><span class="cq">預約</span><span class="kn">${kb}</span></button>`).join('');
  el.innerHTML=a+b;RTK.cb=[...el.querySelectorAll('.bcm')]}
function rtCd6(){if(!B||!B.rt||!RTK.cb)return;for(const b of RTK.cb){const k=b.dataset.v;if(!SK[k])continue;const cd=cdLeft6(k),c=mpCost6(k),e=b.querySelector('.cf'),v=b.querySelector('.cdv');
  const t=cd>0?`冷卻 ${cd}`:c?`MP ${c}`:'';if(e.textContent!==t)e.textContent=t;b.classList.toggle('na',B.rt.done||S.mp<c||cd>0);b.classList.toggle('cdn',cd>0);
  if(v){const p=cd>0?cd/Math.max(.1,cdOf6(k))*100:0;v.style.height=p+'%'}}}
{const _rf=rtFrame;rtFrame=function(){_rf.apply(this,arguments);try{rtCd6()}catch(e){}}}
function rtPose(k){const ks=battleSkills(),i=ks.indexOf(k);if(i<1)return false;const n=i===1?1:2,key=AK()+'_s'+n,x=$('#xfield');if(!x||!(ARTSET&&ARTSET.has(key)))return false;
  const d=document.createElement('div');d.className='posein p'+n;d.style.setProperty('--c',(SKA[k]||[])[1]||'#ffd86b');d.innerHTML=`<i></i><img src="art/${key}.webp" alt=""><b>${esc(SK[k].n)}</b>`;x.appendChild(d);setTimeout(()=>d.remove(),600);return true}
try{const _me=PFX.me;PFX.me=function(fx){return _me.call(this,fx&&fx.skill&&FXA[fx.skill]?Object.assign({},fx,{skill:FXA[fx.skill]}):(fx&&fx.skill&&!FXA[fx.skill]?Object.assign({},fx,{skill:null}):fx))};
  const _hf=PFX.heroFxn;PFX.heroFxn=function(fx){return _hf.call(this,fx&&fx.skill?Object.assign({},fx,{skill:FXA[fx.skill]||null}):fx)}}catch(e){}
function stChip6(t){const now=acOf(t),bx=stBox(t);return Object.keys(bx).filter(id=>bx[id].e>now&&id!=='IMMUNE').map(id=>{const x=bx[id],D=STX[id];return `<${t==='p'?'span':'b'} class="${D.bad?'bad':'g'}">${D.n}${id==='SHIELD'&&x.amt?' '+Math.round(x.amt):''}</${t==='p'?'span':'b'}>`}).join('')}
function rtPchips(R){const o=[];if(R.pr>R.t)o.push('<b>格擋</b>');if(B.guard)o.push('<b>防禦</b>');if(B.opening)o.push('<b>下一擊 +50%</b>');
  if(B.p6&&B.p6.nx.length)o.push('<span>蓄勢</span>');return o.join('')+stChip6('p')}
{const _fs=rtFstat;rtFstat=function(f,m){let o='';try{o=_fs.apply(this,arguments)}catch(e){}return o+stChip6(f)}}
/* 戰鬥紀錄的分類：新狀態名 */
{const _lt=rtLT;rtLT=function(t){if(/^你施展【/.test(t)){if(/爆擊/.test(t))return 'crit';if(/造成/.test(t))return 'atk';if(/回復/.test(t))return 'heal';return 'buff'}if(/^(中毒|灼燒|流血|腐蝕)，損失/.test(t))return 'foe';return _lt(t)}}

/* ---------- 角色頁：技能、天賦 ---------- */
let TALSEL=null;
function skTab6(){const j=job6(),L=jobSk6(j,null);const row=k=>{const ok=skOk6(k.id),ml=skmLv6(k.id),mc=(S.skm||{})[k.id]||0,nx=MSTH[ml]||null;
    return `<div class="item cy-sk ${ok?'':'off'}"><span class="ico c2">${icon(skIcK6(k.id),ic('skill'))}</span><span class="grow"><b>${esc(k.n)}${k.act?'':'<small class="tag off">被動</small>'}${ok?(k.act?`　<small>熟練 Lv.${ml}${nx?` ${mc}/${nx}`:''}</small>`:''):`　<small class="tag red">Lv.${k.lv}</small>`}</b><span class="sub">${k.act?`${k.mp?'MP '+(ok?mpCost6(k.id):k.mp):'不耗 MP'}${k.cd?`・冷卻 ${cdOf6(k.id)} 秒`:''}・`:''}${esc(k.d||k.fx)}</span></span></div>`};
  const wl=wpnLv6(),wc=(S.wpm||{})[wpKey6()]||0;
  return `<div class="panel"><h3>技能　<small class="sub">${JOBN[j]||''}</small></h3><div class="list">${L.filter(k=>k.act).map(row).join('')}</div><h3 style="margin-top:8px">被動</h3><div class="list">${L.filter(k=>!k.act).map(row).join('')}</div>
   <p class="sub">${esc(wpKey6())}熟練 Lv.${wl}${WPTH[wl]?`（${wc}/${WPTH[wl]}）`:''}：武器攻擊 +${wl-1}%。技能用越多次越熟練，每級傷害 +1%。</p></div>`}
function talTab6(){const T=TALS(),br=[...new Set(T.map(t=>t.br))],free=talFree6();if(!T.length)return '<div class="panel"><p class="sub">沒有天賦。</p></div>';
  const sel=T.find(t=>t.id===TALSEL)||null;
  const col=b=>`<div class="tal-c"><b class="tal-h">${esc(b)}</b>${T.filter(t=>t.br===b).map(t=>{const n=(S.tal||{})[t.id]||0,can=talCan6(t);return `<button class="tal-n ${n?'on':''} ${can?'can':''} ${TALSEL===t.id?'sel':''}" data-a="talSel" data-v="${t.id}"><span>${esc(t.n)}</span><small>${n}/${t.max}${S.lv<t.lv?`・Lv${t.lv}`:''}</small></button>`}).join('')}</div>`;
  return `<div class="panel"><h3>天賦　<span class="tag ${free>0?'red':'off'}">可用 ${free} 點</span><button class="btn sm" style="float:right" data-a="talReset">重置（${talResetCost6()} G）</button></h3><div class="tal-g">${br.map(col).join('')}</div>
   ${sel?`<div class="gsec"><b>${esc(sel.n)}　${(S.tal||{})[sel.id]||0}/${sel.max}</b><span class="sub">${esc(sel.fx)}${sel.max>1?'（每級）':''}${sel.lim&&sel.lim!=='常駐或技能觸發'?'・'+esc(sel.lim):''}</span><span class="sub">需要 Lv.${sel.lv}${sel.pre&&sel.pre!=='無'?`・先點「${esc((T.find(t=>t.id===sel.pre)||{}).n||'')}」`:''}${/5$/.test(sel.id)?'・同分支先投入 6 點':''}</span><button class="btn pri" data-a="talUp" data-v="${sel.id}" ${talCan6(sel)?'':'disabled'}>投入 1 點</button></div>`:'<p class="sub">點天賦看說明。每 5 級得 1 點，最多 20 點。</p>'}</div>`}
function talCan6(t){if(!S||talFree6()<1)return false;const n=(S.tal||{})[t.id]||0;if(n>=t.max||S.lv<t.lv)return false;if(t.pre&&t.pre!=='無'&&!((S.tal||{})[t.pre]>0))return false;
  if(/5$/.test(t.id)){const inBr=TALS().filter(x=>x.br===t.br&&x.id!==t.id).reduce((a,x)=>a+((S.tal||{})[x.id]||0),0);if(inBr<6)return false}return true}
const talResetCost6=()=>S&&S.talR?S.lv*100:0;
function jobPanel6(){const j=job6(),P=jobSk6(j,false);return `<div class="panel"><h3>${JOBN[j]||''}・被動</h3><p class="sub">${esc((S.adv?ADV[S.adv].d:CLS[S.cls].f)||'')}</p>${P.slice().sort((a,b)=>a.lv-b.lv).map(k=>`<span class="subl ${skOk6(k.id)?'':'sub'}"><b>${esc(k.n)}</b> Lv.${k.lv}　${esc(k.fx)}</span>`).join('')}</div>`}
Object.assign(ACT,{
  talSel(v){TALSEL=TALSEL===v?null:v;render()},
  talUp(v){const t=TALS().find(x=>x.id===v);if(!t||!talCan6(t))return;S.tal=S.tal||{};S.tal[v]=(S.tal[v]||0)+1;EFC=null;try{SFX.buff()}catch(e){}save();render()},
  talReset(){if(B){toast('戰鬥中不能重置');return}const c=talResetCost6();if(!talUsed6()){toast('還沒投入天賦');return}if(S.gold<c){toast(`需要 ${c} G`);return}if(!confirmTap('talR'))return;S.gold-=c;S.tal={};S.talR=1;EFC=null;toast('天賦已重置');save();render()},
  skUp(){},skLoad(){},skOpen(){},
  trial(){if(S.adv||S.trial||S.lv<TRIAL.lv)return;if(!S.cleared||!S.cleared[ADV_ZONE]){toast('要先打倒第 3 區的首領');return}if(S.hp<=1){toast('HP 太低，先到旅店休息');return}const sh=SHADOW[S.cls];MOBS.shadow.ty=sh[0];MOBS.shadow.sk=sh[1];
    closeM();TAB='adv';RUN={area:Math.min(ADV_ZONE,Math.max(0,S.main.ch)),trial:true,nm:false,step:0,nodes:['boss'],loot:{gold:0,exp:0,items:[]},view:{type:'start'}};startBattle('shadow','boss');render()},
  advance(k){if(S.lv<TRIAL.lv||S.adv||!S.trial||!CLS[S.cls].adv.includes(k))return;S.adv=k;WARM=0;S.tal={};S.respec=0;EFC=null;learn(true);const s=stats();S.hp=s.HP;S.mp=s.MP;sys(`${S.name} 轉職為【${ADV[k].n}】！`);toast(`轉職成功：${ADV[k].n}（天賦已返還、可免費重置一次屬性）`);save();render()}});
/* 轉職神殿：Lv30＋打倒第 3 區首領 */
try{const _tp=MV.temple;MV.temple=function(){const o=_tp.apply(this,arguments);if(!S.adv&&S.lv>=TRIAL.lv&&!S.trial&&!(S.cleared&&S.cleared[ADV_ZONE]))o.b=o.b.replace(/<button class="btn pri big" data-a="trial"[^>]*>[^<]*<\/button>/,'<p class="sub">要先打倒第 3 區的首領。</p>');o.b=o.b.replace('等級 24','等級 '+TRIAL.lv);return o}}catch(e){}

/* 樣式：指令列冷卻遮罩、天賦格 */
(()=>{const st=document.createElement('style');st.textContent=`#rtb .bcm .cdv{position:absolute;left:0;right:0;bottom:0;height:0;background:rgba(0,0,0,.55);border-radius:0 0 13px 13px;pointer-events:none}
#rtb .bcm.cdn .cf{color:#ffd76a;opacity:1}
.tal-g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.tal-c{display:flex;flex-direction:column;gap:4px}.tal-h{font-size:12px;text-align:center;color:var(--hd,#ecd08a)}
.tal-n{display:flex;flex-direction:column;align-items:center;gap:0;padding:5px 2px;border-radius:9px;border:1px solid var(--line,#444);background:var(--card,rgba(255,255,255,.04));color:inherit;font-size:12px;line-height:1.2;opacity:.55}
.tal-n small{font-size:10px;opacity:.75}.tal-n.can{opacity:1;border-color:var(--gold,#d9ae4c)}.tal-n.on{opacity:1;background:rgba(217,174,76,.18)}.tal-n.sel{box-shadow:0 0 0 2px var(--gold,#d9ae4c)}`;document.head.appendChild(st)})();
