/* 大改版 V7.3（使用者企劃表 MMORPG ATB V7.3）
   - 行動制：狀態、冷卻、道具冷卻都以「受影響者自己的行動次數」計算（v6_skill.js stAdd/stTick 已改）
   - 自己行動前：持續傷害跳一次、自然回血回魔；暈眩＝跳過這次行動（仍算一次）
   - 技能配置：4 主動（含零 MP 基礎技）＋ 3 被動，3 組預設；每招最多 2 個自動條件
   - 範圍技（雙體／全體）、蓄力技、新技能效果、新被動
   - 1～4 隻怪：群體倍率、精英隊、首領召喚、伏擊行動條、獎勵合計（v7_map.js）
*/
/* ---------- 共用 ---------- */
const V7=true;
try{FK.push('ac','next','spoiled','summon7','xmul','gmul','dmul','grp7')}catch(e){}
/* v20.9：換目標時，怪物身上的所有資料都跟著牠走（CODE_AUDIT P0-3、P1-3、P2-2）。
   副目標物件只放怪物資料，所以「副目標有的欄位＋FK＋下列戰鬥中才出現的旗標」就是完整的怪物資料；玩家狀態（chg7、p6、psx…）永遠留在 B */
const FKX7=['lv','dr6Used','mresB6','p22','p23','p24','p34','gdA6','nextInf6','sm70','sm35','ph2','chg','chgSh','chgHp','chgNeed','brkN','brkP','brkFx','mid7','sumGone7','lastP6','fhit6','rage','sx','ac','acts6','mcd','phx6','pen6','st','fb','fshield','rtg','rtw','rta','rth'];
const FKNO7=new Set(['chg7','rt','log','adds','p6','psx','pcd6','fx','tot','auto','busy','menu','icd','acP','pops','ds','actor','preAc','preRes','ally']);
swapFoe=function(i){const a=B.adds[i];if(!a)return;const keys=new Set([...FK,...FKX7,...Object.keys(a)]);const cur={};for(const k of keys){if(FKNO7.has(k))continue;cur[k]=B[k];if(k in a)B[k]=a[k];else delete B[k]}for(const k in cur)if(cur[k]===undefined)delete cur[k];B.adds[i]=cur;B.fhp=null};
const aliveFoes7=()=>B?[B,...(B.adds||[])].filter(f=>f&&f.hp>0):[];
const nAlive7=()=>aliveFoes7().length;/* 召喚物也算敵人數（不給獎勵） */

/* ---------- 技能資料補欄位：目標、標籤、範圍、表上效果 ---------- */
const FX7={};/* 新技能（S7～S16 與沒有寫死的）效果，由表上文字解析 */
const TAGFX7=[['蓄力','big'],['範圍','whirl'],['灼燒','fire'],['減速','ice'],['中毒','stab'],['流血','slash'],['破甲','bash'],['護盾','aegis'],['治療','heal'],['回魔','heal'],['淨化','sanct'],['防禦','guard'],['聖印','holy'],['獵印','snipe'],['腐蝕','curse'],['穿透','pierce'],['迴避','stab'],['連擊','flurry'],['格擋','guard']];
function parseSkFx7(r){const t=r.fx||'',o={};let m;
  if((m=t.match(/附加([A-Z]+)(?:，機率(\d+)%)?/)))o.inf={id:m[1],p:m[2]?+m[2]/100:1};
  if((m=t.match(/跳傷倍率提高(\d+)%/)))o.dotAmp=+m[1]/100;
  if((m=t.match(/^自身([A-Z]+)$/)))o.self=m[1];
  if((m=t.match(/回最大HP(\d+)%/)))o.heal=+m[1]/100;
  if((m=t.match(/回最大MP(\d+)%/)))o.mp=+m[1]/100;
  if((m=t.match(/回實際HP傷害(\d+)%/)))o.ls=+m[1]/100;
  if((m=t.match(/清除(\d+)負面/)))o.cleanse=+m[1];
  if((m=t.match(/^對(.+?)敵增傷(\d+)%$/))){const st=stOf6(m[1].replace(/^已/,''));if(st)o.amp={st,v:+m[2]}}
  if((m=t.match(/^敵HP低於(\d+)%增傷(\d+)%$/)))o.amp={foeLt:+m[1],v:+m[2]};
  if((m=t.match(/^自身HP低於(\d+)%增傷(\d+)%$/)))o.amp={selfLt:+m[1],v:+m[2]};
  if((m=t.match(/^自身上次行動後受傷則增傷(\d+)%$/)))o.amp={last:'hurt',v:+m[1]};
  if((m=t.match(/^上次行動後格擋則增傷(\d+)%$/)))o.amp={last:'block',v:+m[1]};
  if((m=t.match(/^上次行動後迴避則增傷(\d+)%$/)))o.amp={last:'evade',v:+m[1]};
  if((m=t.match(/^上次行動觸發連擊則增傷(\d+)%$/)))o.amp={last:'combo',v:+m[1]};
  if((m=t.match(/^敵行動條退(\d+)百分點$/)))o.push=+m[1];
  if((m=t.match(/^本次穿透(\d+)百分點$/)))o.pen=+m[1];
  if(/本次蓄力，下次行動釋放/.test(t))o.charge=1;
  if((m=t.match(/^自身迴避\+(\d+)百分點，(\d+)次行動$/)))o.selfV={id:'EVAUP',v:+m[1],dur:+m[2]};
  if((m=t.match(/^自身格擋\+(\d+)百分點，(\d+)次行動$/)))o.selfV={id:'BLOCKUP',v:+m[1],dur:+m[2]};
  if((m=t.match(/^自身連擊率\+(\d+)百分點，(\d+)次行動$/)))o.selfV={id:'COMBOUP',v:+m[1],dur:+m[2]};
  return o}
(V6.SKILL||[]).forEach(r=>{const x=SK[r.id];if(!x)return;
  x.tg=r.tg||'單體';x.mx=r.mx||1;x.minE=r.minE||1;x.tags=(r.tags||[]).filter(t=>t&&t!=='None');x.pick=r.pick||'低HP';
  if(x.act&&!x.dmg&&r.pow>0&&r.dt==='無'){x.dmg={s:'MAG',p:r.pow/100,h:1};x.s='MAG';x.pow=r.pow/100;x.d=`魔法 ${r.pow}%`}
  if(x.act&&x.cd==null)x.cd=0;
  const n=+r.id.split('S')[1];if(n>=7||!FXA[r.id])FX7[r.id]=parseSkFx7(r);
  if(!FXA[r.id]){const hit=TAGFX7.find(([t])=>x.tags.includes(t));if(hit&&SKA[hit[1]])SKA[r.id]=SKA[hit[1]]}
  if(x.tg==='雙體'||x.tg==='全體')x.d+=`・${x.tg==='全體'?'全體':'兩個目標'}`;
  if(n===13&&FX7[r.id]&&FX7[r.id].charge)x.d=x.d.replace('，本次蓄力，下次行動釋放','，蓄力一次後釋放')});

/* ---------- 新被動（S14～S16） ---------- */
Object.assign(PSV,{
  J01S14:[{k:'bigdmg',v:6}],J01S15:[{k:'condmp',st:['ARMOR'],v:1}],J01S16:[{k:'drbuff',v:6}],
  J02S14:[{k:'dotk',st:['BURN'],v:10}],J02S15:[{k:'cond',st:SLOWK,v:8}],J02S16:[{k:'mp3',v:3}],
  J03S14:[{k:'pierce',v:5}],J03S15:[{k:'condcrit',st:SLOWK,v:4}],J03S16:[{k:'stat',key:'eva',v:3},{k:'stat',key:'spd',v:2}],
  J04S14:[{k:'cond',st:['SEAL'],v:6}],J04S15:[{k:'healsh',v:3,cd:2}],J04S16:[{k:'zmp',v:1}],
  J05S14:[{k:'alldmg',v:6}],J05S15:[{k:'evmp',ev:'block',v:1,gap:1}],J05S16:[{k:'counterAmp',v:10}],
  J06S14:[{k:'bigdmg',v:6}],J06S15:[{k:'lsamp',v:15}],J06S16:[{k:'lowhp',th:40,type:'crit',v:5}],
  J07S14:[{k:'dotk',st:['BURN'],v:12}],J07S15:[{k:'shamp',v:10}],J07S16:[{k:'mp3',v:4}],
  J08S14:[{k:'dotk',st:['POISON','CORRODE'],v:10}],J08S15:[{k:'lsamp',v:15}],J08S16:[{k:'debuffamp',v:6}],
  J09S14:[{k:'pierce',v:5}],J09S15:[{k:'condcrit',st:['MARK'],v:5}],J09S16:[{k:'execcd',th:30,v:10}],
  J10S14:[{k:'dotk',st:['BLEED'],v:10}],J10S15:[{k:'cond',st:['POISON'],v:6}],J10S16:[{k:'evmp',ev:'evade',v:1,gap:1}],
  J11S14:[{k:'cond',st:['JUDGE'],v:6}],J11S15:[{k:'cleansh',v:5,cd:2}],J11S16:[{k:'healmp',v:2,cd:2}],
  J12S14:[{k:'alldmg',v:6}],J12S15:[{k:'shamp',v:10}],J12S16:[{k:'evmp',ev:'block',v:1,gap:1}],
  J13S14:[{k:'stat',key:'double',v:2}],J13S15:[{k:'combomp',v:1}],J13S16:[{k:'stat',key:'spd',v:2},{k:'skdmg',sk:'J13S2',v:4}]});

/* ---------- 技能配置：4 主動（含基礎技）＋ 3 被動，3 組預設 ---------- */
const CONDS7=[['ALWAYS','無條件'],['HP_LOW','自身 HP 低於',60],['MP_LOW','自身 MP 低於',30],['ENEMY_HP_LOW','敵 HP 低於',30],['STATUS_MISSING','敵身上沒有主要狀態'],['STATUS_PRESENT','敵身上有主要狀態'],
  ['SELF_STATUS_MISSING','自身沒有這招的增益'],['SHIELD_LOW','自身護盾低於',5],['PREVIOUS_BLOCK','上次行動後格擋過'],['PREVIOUS_EVADE','上次行動後迴避過'],['MP_RESERVE','放完後 MP 仍高於',20],['ENEMY_COUNT','敵人至少',2]];
const COND7=Object.fromEntries(CONDS7.map(c=>[c[0],c]));
const baseSk7=()=>jobSk6(null,true)[0];
/* 這招的「主要狀態」：條件 STATUS_* 用 */
function skSt7(k){const f=FX7[k];if(f&&f.inf)return STALIAS[f.inf.id]||f.inf.id;if(f&&f.amp&&f.amp.st)return f.amp.st[0];
  return ({J01S2:'ARMOR',J05S2:'ARMOR',J12S2:'ARMOR',J02S2:'BURN',J07S2:'BURN',J02S3:'FROST',J03S3:'SLOW',J04S2:'SEAL',J11S2:'JUDGE',J08S2:'CORRODE',J09S3:'MARK',J10S2:'POISON'})[k]||null}
function skSelfSt7(k){const f=FX7[k];if(f&&f.self)return f.self;if(f&&f.selfV)return f.selfV.id;return selfSt6(k)||null}
function recoLoad7(j){j=j||job6();const jn=JOBN[j],L=(V6.LOAD||[]).find(r=>r.job===jn&&r.style==='均衡')||{a:[],p:[]};const ok=k=>SK[k]&&skOk6(k);
  const acts=jobSk6(j,true).map(k=>k.id),pas=jobSk6(j,false).map(k=>k.id),base=acts[0];
  const a=[...L.a.filter(k=>k!==base&&ok(k)),...acts.filter(k=>k!==base&&ok(k)&&SK[k].dmg)].filter((k,i,A)=>A.indexOf(k)===i).slice(0,3);
  for(const k of acts)if(a.length<3&&k!==base&&ok(k)&&!a.includes(k))a.push(k);
  const p=[...L.p.filter(ok),...pas.filter(ok)].filter((k,i,A)=>A.indexOf(k)===i).slice(0,3);
  const c={};a.forEach(k=>{const st=skSt7(k),ss=skSelfSt7(k);c[k]=[];if(SK[k].tg==='全體'||SK[k].tg==='雙體')c[k].push({t:'ENEMY_COUNT',v:2});
    else if(st)c[k].push({t:'STATUS_MISSING'});else if(ss)c[k].push({t:'SELF_STATUS_MISSING'});else if(SK[k].heal||FX7[k]&&FX7[k].heal)c[k].push({t:'HP_LOW',v:60});
    if((SK[k].mp||0)>0)c[k].push({t:'MP_RESERVE',v:20});c[k]=c[k].slice(0,2)});
  return {a,p,c}}
function lo7(){if(!S)return null;const j=job6();S.lo7=S.lo7&&S.lo7.j===j?S.lo7:{j,cur:0,sets:[recoLoad7(j),recoLoad7(j),recoLoad7(j)]};const L=S.lo7;
  /* 新解鎖的技能：空欄自動補上 */
  const st=L.sets[L.cur];st.a=(st.a||[]).filter(k=>SK[k]&&SK[k].c===j&&skOk6(k)&&k!==baseSk7().id);st.p=(st.p||[]).filter(k=>SK[k]&&SK[k].c===j&&skOk6(k));st.c=st.c||{};
  if(st.a.length<3){const r=recoLoad7(j);for(const k of r.a)if(st.a.length<3&&!st.a.includes(k)){st.a.push(k);st.c[k]=r.c[k]||[]}}
  if(st.p.length<3){const r=recoLoad7(j);for(const k of r.p)if(st.p.length<3&&!st.p.includes(k))st.p.push(k)}
  return st}
/* 戰鬥指令列：優先順序 1～3，基礎技最後兜底 */
battleSkills=function(){const L=lo7();const b=baseSk7();return [...(L?L.a:[]),b?b.id:null].filter(Boolean)};
mySkills=function(){return jobSk6(null,true).filter(k=>skOk6(k.id)).map(k=>k.id)};
const pasOn7=k=>{const L=lo7();return !!L&&L.p.includes(k)};
/* 被動只算配置的 3 個 */
/* v21.3：明確 ID 映射的天賦（不再依賴文字解析） */
const TALID7={T0532:n=>({k:'counterCdn',sk:'J05S6',th:[4,3,2][Math.max(1,Math.min(3,n))-1]})};
effs6=function(){if(!S)return [];const j=job6(),L=lo7(),key=j+'|'+S.lv+'|'+JSON.stringify(S.tal||{})+'|'+(L?L.p.join(','):'');if(EFC&&EFCK===key)return EFC;const out=[];
  for(const k of jobSk6(j,false))if(skOk6(k.id)&&pasOn7(k.id))(PSV[k.id]||[]).forEach(e=>out.push(Object.assign({from:k.id},e)));
  for(const t of TALS()){const n=(S.tal||{})[t.id]||0;if(!n)continue;const e=TALID7[t.id]?TALID7[t.id](n):parseTal6(j,t.fx,n);e.from=t.id;e.lim=t.lim;out.push(e)}
  EFC=out;EFCK=key;return out};

/* ---------- 自動條件 ---------- */
function condOk7(k,c){if(!c||!c.t||c.t==='ALWAYS')return true;const s=rtS6(),v=c.v!=null?c.v:(COND7[c.t]||[])[2],P=B.p6||{};
  switch(c.t){
    case 'HP_LOW':return S.hp<s.HP*v/100;
    case 'MP_LOW':return S.mp<s.MP*v/100;
    case 'ENEMY_HP_LOW':return B.hp<B.max*v/100;
    case 'STATUS_MISSING':{const st=skSt7(k);return !st||!stHas(B,st)}
    case 'STATUS_PRESENT':{const st=skSt7(k);return !!st&&stHas(B,st)}
    case 'SELF_STATUS_MISSING':{const st=skSelfSt7(k);return !st||!stHas('p',st)}
    case 'SHIELD_LOW':{const x=B.psx&&B.psx.SHIELD;return !(x&&stHas('p','SHIELD')&&(x.amt||0)>=s.HP*v/100)}
    case 'PREVIOUS_BLOCK':return !!P.lb;
    case 'PREVIOUS_EVADE':return !!P.le;
    case 'MP_RESERVE':return S.mp-mpCost6(k)>=s.MP*v/100;
    case 'ENEMY_COUNT':return nAlive7()>=v}
  return true}
function skUsable7(k){const x=SK[k];if(!x||!skReady6(k))return false;if(x.tg==='全體'||x.tg==='雙體'){if(nAlive7()<Math.max(2,x.minE||2)&&!(lo7().c[k]||[]).some(c=>c.t==='ALWAYS'))return false}
  return (lo7().c[k]||[]).every(c=>condOk7(k,c))}
/* 目標：預設剩餘 HP 最低；自動戰鬥會先把目標換到主位 */
function pickTgt7(){const L=aliveFoes7();if(L.length<2)return;let best=L[0];for(const f of L)if(f.hp<best.hp)best=f;if(best===B)return;const i=(B.adds||[]).indexOf(best);if(i>=0){swapFoe(i);B.fhp=null;if(B.rt)B.rt.vhT=0}}

/* ---------- 自己的行動：前後結算 ---------- */
function pPre7(){if(!B||!B.rt)return 'ok';if(B.preAc===acOf('p'))return B.preRes||'ok';B.preAc=acOf('p');B.actor='p';
  B.p6=B.p6||{nx:[],once:{},tcd:0,seq:[],third:{},mpUse:0};
  stTick('p');const s=rtS6();
  if(S.hp>0){const rg=Math.min(3,s.REGEN||0);if(rg>0&&!stHas('p','BURN')){const h=Math.max(1,Math.round(s.HP*rg/100*.5*(stHas('p','SAPPED')?.5:1)));/* v21.2：自然回復 ×0.5 */S.hp=Math.min(s.HP,S.hp+h)}
    const mr=Math.min(3,s.MREGEN||0);if(mr>0)S.mp=Math.min(s.MP,S.mp+Math.max(1,Math.round(s.MP*mr/100)))}
  if(S.hp<=0){B.preRes='dead';if(typeof rtLose==='function')rtLose();return 'dead'}
  if(stHas('p','STUN')){B.preRes='skip';blog(you('你動彈不得'));return 'skip'}
  B.preRes='ok';return 'ok'}
function pPost7(){if(!B)return;const P=B.p6||{};P.lb=P.nb||0;P.le=P.ne||0;P.lh=P.nh||0;P.lc=P.nc||0;P.nb=P.ne=P.nh=P.nc=0;P.mpAct=0;P.trigAct=0;
  B.acP=(B.acP||0)+1;B.actor=null;B.preAc=-1}
/* 只有真的出手才結算；MP 不足等失敗不算行動 */
{const _pa=pAct;pAct=function(type,arg){if(!B||!B.rt)return _pa.apply(this,arguments);
  const pre=pPre7();if(pre==='dead')return true;
  if(pre==='skip'){B.rt.pg=0;pPost7();render();return true}
  if(B.chg7&&type!=='flee'){const k=B.chg7;B.chg7=null;const r=relCharge7(k);pPost7();if(B&&B.rt){rtAfterP('skill')}return r}
  if(type==='skill'&&B.auto&&SK[arg]&&(SK[arg].tg==='單體'))pickTgt7();
  B.actor='p';const r=_pa.apply(this,arguments);if(r===false){B.actor=null;return r}if(B)pPost7();return r}}
/* 格擋按鈕也算一次行動 */
{const _rd=rtDo;rtDo=function(c){if(B&&B.rt&&c==='@parry'){const pre=pPre7();if(pre==='dead')return;if(pre==='skip'){B.rt.pg=0;pPost7();render();return}const r=_rd.apply(this,arguments);pPost7();return r}return _rd.apply(this,arguments)}}

/* ---------- 蓄力技：這次付 MP、預告，下一次自己行動強制放出（暈眩不取消） ---------- */
function relCharge7(k){const x=SK[k];if(!x||!B)return false;B.actor='p';
  /* v20.9：蓄力放出走一般技能的完整流程（增傷、連擊、吸血、觸發、回魔），只是不再扣 MP、不重算冷卻（CODE_AUDIT P1-5） */
  B.chgRel=k;try{useSkill6(k,rtS6())}finally{if(B)B.chgRel=null}if(B&&B.hp<=0)winSoon(2300);return true}

/* ---------- 新技能的增傷／穿透／爆擊（useSkill6 會呼叫） ---------- */
function lastOk7(w){const P=B&&B.p6||{};return w==='hurt'?!!P.lh:w==='block'?!!P.lb:w==='evade'?!!P.le:w==='combo'?!!P.lc:false}
function skAmp7(k,f){f=f||B;const x=SK[k],o=FX7[k],s=rtS6();let a=0;
  if(o&&o.amp){const A=o.amp;if(A.st&&A.st.some(t=>stHas(f,t)))a+=A.v;if(A.foeLt&&f.hp<f.max*A.foeLt/100)a+=A.v;if(A.selfLt&&S.hp<s.HP*A.selfLt/100)a+=A.v;if(A.last&&lastOk7(A.last))a+=A.v}
  for(const e of effK('tagdmg'))if(x&&x.tags&&x.tags.includes(e.tag))a+=e.v;
  for(const e of effK('bigdmg'))if(x&&x.dmg&&x.pow>=1.5)a+=e.v;
  for(const e of effK('alldmg'))if(x&&x.dmg)a+=e.v;
  for(const e of effK('drbuff'))if(stHas('p','GUARD')||stHas('p','POST'))a+=e.v;
  for(const e of effK('debuffamp'))if(stList(f).some(id=>STX[id]&&STX[id].bad))a+=e.v;
  return a}
function skPen7(k){const o=FX7[k];return (o&&o.pen?o.pen:0)+pierce7(k)}
/* v21.3：穿刺技能物防穿透（J03S14、J09S14）只套物理且傷害標籤為 PIERCE 的技能（傷害標籤規則：弓、匕首＝穿刺） */
function pierce7(k){const x=SK[k];if(!x||!x.dmg||x.s==='MAG'||dmgTag6(k)!=='PIERCE')return 0;return effSum('pierce')}
function skCrit7(f){let c=0;for(const e of effK('condcrit'))if(e.st.some(t=>stHas(f,t)))c+=e.v;return c}
function skCd7(f){let c=0;for(const e of effK('execcd'))if(f.hp<f.max*e.th/100)c+=e.v;return c}
const dotK7=id=>effs6().filter(e=>e.k==='dotk'&&e.st.includes(id)).reduce((a,e)=>a+e.v,0);

/* 新技能的附加效果：每個命中的目標各自判定狀態；自身效果只做一次 */
function fx7Apply(k,s,d,ps,hit,f){const o=FX7[k];if(!o)return;const T=f||B;
  if(o.inf&&hit&&T&&T.hp>0&&Math.random()<o.inf.p){const id=STALIAS[o.inf.id]||o.inf.id,D=STX[id]||{};const src=D.dot==='mag'?{mag:s.MAG}:D.dot?{atk:s.ATK}:null;
    const amp=(o.dotAmp||0)+(effSum('skdot',k)+(rtS6().DOT||0)+dotK7(id))/100;if(stAdd(T,id,src?{src,amp,dur:durOf6(k,D.dur||2)}:{dur:durOf6(k,D.dur||2)}))ps.push(`${T===B?'敵人':T.name}陷入${D.n||id}`)}
  if(o.push&&hit&&T){if(T===B)B.rtg=Math.max(0,(B.rtg||0)-o.push);else T.rtg=Math.max(0,(T.rtg||0)-o.push)}
  if(f&&f!==B)return;
  if(o.self){const id=o.self;if(id==='SHIELD'){const a=s.HP*.12*(1+(effSum('skshield',k)+effSum('shamp'))/100);stAdd('p','SHIELD',{amt:a,dur:durOf6(k,2)});ps.push('獲得護盾')}else{stAdd('p',id,{dur:durOf6(k,2)});ps.push((STX[id]||{}).n||id)}}
  if(o.selfV){stAdd('p',o.selfV.id,{v:o.selfV.v,dur:durOf6(k,o.selfV.dur)});ps.push((STX[o.selfV.id]||{}).n+'提升')}
  if(o.heal)heal6(k,o.heal,0,s,ps);
  if(o.mp){const m=Math.round(s.MP*o.mp);S.mp=Math.min(s.MP,S.mp+m);ps.push(`回復 ${m} MP`)}
  if(o.ls)ls7Rate(o.ls*100);/* v21.3：改走統一吸血流程 ls7Fin（v6_skill.js） */
  if(o.cleanse){let n=0;for(const id of stList('p'))if(n<o.cleanse&&STX[id]&&STX[id].bad&&id!=='STUN'){stClear('p',id);n++}if(n){ps.push(`解除 ${n} 個負面`);trig6('cleanse',{sk:k});cleansh7()}}}
function cleansh7(){const s=rtS6(),P=B.p6;for(const e of effK('cleansh')){if((P['c_'+e.from]||-9)>acOf('p'))continue;P['c_'+e.from]=acOf('p')+e.cd+1;stAdd('p','SHIELD',{amt:s.HP*e.v/100,dur:2})}}
/* 有效治療後：護盾、回魔（各有 2 次行動冷卻） */
{const _h=heal6;heal6=function(k,pct,magR,s,ps){const real=_h.apply(this,arguments);if(real>0&&B&&B.p6){const P=B.p6;
  for(const e of effK('healsh')){if((P['h_'+e.from]||-9)>acOf('p'))continue;P['h_'+e.from]=acOf('p')+e.cd+1;stAdd('p','SHIELD',{amt:s.HP*e.v/100*(1+effSum('shamp')/100),dur:2})}
  for(const e of effK('healmp')){if((P['m_'+e.from]||-9)>acOf('p'))continue;P['m_'+e.from]=acOf('p')+e.cd+1;S.mp=Math.min(s.MP,S.mp+Math.round(s.MP*e.v/100))}}return real}}
/* 零 MP 以外的第三次施放回魔；連擊命中回魔；對指定狀態命中回魔（每次行動一次） */
function afterCast7(k,s,hitOk){const P=B.p6;if(mpCost6(k)>0){P.nz=(P.nz||0)+1;if(P.nz%3===0)for(const e of effK('mp3'))S.mp=Math.min(s.MP,S.mp+Math.round(s.MP*e.v/100))}
  if(hitOk&&!P.mpAct)for(const e of effK('condmp'))if(e.st.some(t=>stHas(B,t))){S.mp=Math.min(s.MP,S.mp+Math.max(1,Math.round(s.MP*e.v/100)));P.mpAct=1}}
function onCombo7(){const P=B.p6,s=rtS6();P.nc=1;if(!P.cmb){for(const e of effK('combomp'))S.mp=Math.min(s.MP,S.mp+Math.max(1,Math.round(s.MP*e.v/100)));P.cmb=1}}
/* 格擋／迴避／受傷：記下「上次行動後」旗標 */
{const _ob=onBlock6;onBlock6=function(){if(B&&B.p6)B.p6.nb=1;return _ob.apply(this,arguments)}}
{const _oe=onEvade6;onEvade6=function(){if(B&&B.p6)B.p6.ne=1;return _oe.apply(this,arguments)}}
{const _oh=onHurt6;onHurt6=function(d){if(B&&B.p6&&d>0)B.p6.nh=1;return _oh.apply(this,arguments)}}

/* ---------- 範圍技：主目標之外的目標（每個目標各自命中、爆擊、狀態） ---------- */
function aoeTargets7(k){const x=SK[k];if(!x||!(x.tg==='雙體'||x.tg==='全體'))return [];const L=(B.adds||[]).filter(f=>f.hp>0).sort((a,b)=>a.hp-b.hp);return x.tg==='雙體'?L.slice(0,1):L.slice(0,3)}
function aoeHit7(k,s,amp,pen,cr,cdB,ps){let tot=0;const x=SK[k];
  const tB=tgtAmp6(k,B);for(const f of aoeTargets7(k)){const r=hitFoe(x.s,x.pow,{skill:1,tag:dmgTag6(k),amp:amp+skAmp7(k,f)-skAmp7(k,B)+tgtAmp6(k,f)-tB,pen,cr:cr+skCrit7(f)-skCrit7(B),cd:cdB,tgt:f});tot+=r.d;if(!r.miss&&B.ls7)B.ls7.d+=r.d;
    if(r.miss)ps.push(`${f.name} 閃開了`);else{f.rth=performance.now()+450;(B.pops=B.pops||[]).push({d:r.d,k:r.cr?'爆擊':'',f});fx7Apply(k,s,r.d,ps,true,f);
      /* 範圍技對副目標也附加原本的狀態（破甲、灼燒…） */
      try{skFx6sub7(k,s,f,ps)}catch(e){}
      if(f.hp<=0)blog(`${f.name} 倒下了`)}}
  return tot}
/* 舊技能（S1～S6）的敵方狀態：只用在範圍技的副目標（目前只有新技能是範圍技，保留給之後） */
function skFx6sub7(){}

/* ---------- 自動戰鬥：依優先序、條件、MP、冷卻，第一個能用的就放；基礎技兜底 ---------- */
autoAct=function(){if(!B||B.busy||!B.auto)return;if(B.rt&&(B.rt.pg<100||B.rt.done))return;if(MODAL&&MODAL.k==='foe')return;
  const s=rtS6(),hpR=S.hp/s.HP;
  if(B.chg7)return pAct('skill',B.chg7);
  /* 道具：HP 低於 30% 用回復藥（占一次行動） */
  if(hpR<.3&&itemReady7()){const p=potBest('hp');if(p&&pAct('item',p)!==false)return}
  const L=battleSkills(),base=L[L.length-1];
  for(const k of L.slice(0,-1))if(skUsable7(k))return pAct('skill',k);
  pAct('skill',base)};
const itemReady7=()=>!B||!(B.icd>acOf('p'));

/* ---------- 道具冷卻：自己的行動數 ---------- */
{const _ui=useItem6;useItem6=function(k,inB){if(inB&&B&&B.rt){const it=ITEMS[k];if(B.icd>acOf('p')){toast(`藥品冷卻中（${B.icd-acOf('p')} 次行動）`);return false}
    const ic=B.icd;B.icd=-1;const r=_ui.apply(this,arguments);if(r!==false)B.icd=acOf('p')+(it&&it.cd||10)+1;else B.icd=ic;return r}return _ui.apply(this,arguments)}}

/* ---------- 行動條：開場雙方 0；伏擊時敵人 20% ---------- */
{const _ri=rtInit;rtInit=function(){_ri.apply(this,arguments);if(!B||!B.rt)return;const amb=!!B.amb7;B.rt.pg=0;B.rt.t=Math.min(B.rt.t,-.4);
  B.rtg=amb?20:0;(B.adds||[]).forEach(f=>{f.rtg=amb?20:0});B.acP=0;B.ac=0;(B.adds||[]).forEach(f=>f.ac=0)}}

/* ---------- 初始職業屬性（企劃表 V7.3）：轉職保留 ---------- */
try{for(const [jn,v] of Object.entries(V6.INIT||{})){const c=JOBK[jn];if(!CLS[c])continue;CLS[c].base={STR:v[0],VIT:v[1],INT:v[2],DEX:v[3],LUK:v[4]}}}catch(e){}

/* ---------- 技能配置畫面 ---------- */
let LOUI=null;/* {k:'a'|'p'|'c', i, ci} 正在挑的欄位 */
const CONDOPT7=[['ALWAYS'],['HP_LOW',30],['HP_LOW',50],['HP_LOW',70],['MP_LOW',20],['MP_LOW',40],['ENEMY_HP_LOW',30],['ENEMY_HP_LOW',50],['STATUS_MISSING'],['STATUS_PRESENT'],['SELF_STATUS_MISSING'],
  ['SHIELD_LOW',5],['SHIELD_LOW',10],['PREVIOUS_BLOCK'],['PREVIOUS_EVADE'],['MP_RESERVE',10],['MP_RESERVE',20],['MP_RESERVE',30],['ENEMY_COUNT',2],['ENEMY_COUNT',3]];
const condTx7=c=>{if(!c)return '＋條件';const d=COND7[c.t];if(!d)return c.t;return d[2]!=null?`${d[1]} ${c.v!=null?c.v:d[2]}${c.t==='ENEMY_COUNT'?' 隻':'%'}`:d[1]};
const skIco7=k=>`<span class="ico c2">${icon(skIcK6(k),ic('skill'))}</span>`;
function loPanel7(inModal){const L=lo7(),b=baseSk7(),cur=S.lo7.cur;if(!L)return '';
  const tabs=`<div class="chips">${[0,1,2].map(i=>`<button class="chip ${cur===i?'on':''}" data-a="lo7set" data-v="${i}">配置 ${i+1}</button>`).join('')}</div>`;
  const aRow=(k,i)=>{const x=SK[k],cs=L.c[k]||[];return `<div class="item lo7"><b class="lo7n">${i+1}</b><button class="lo7s" data-a="lo7pick" data-v="a|${i}">${k?skIco7(k)+`<span>${esc(x.n)}<small>${x.mp?'MP '+mpCost6(k):''}${x.cd?'・冷卻 '+x.cd:''}${x.tg&&x.tg!=='單體'?'・'+x.tg:''}</small></span>`:'<span class="sub">空</span>'}</button>
     ${k?`<span class="lo7c">${[0,1].map(ci=>`<button class="chip ${cs[ci]?'on':''}" data-a="lo7pick" data-v="c|${i}|${ci}">${esc(condTx7(cs[ci]))}</button>`).join('')}</span>`:''}</div>`};
  const a=[0,1,2].map(i=>aRow(L.a[i],i)).join('');
  const base=b?`<div class="item lo7"><b class="lo7n">底</b><span class="lo7s">${skIco7(b.id)}<span>${esc(b.n)}<small>零 MP・前面都不能用時放</small></span></span></div>`:'';
  const p=`<div class="lo7p">${[0,1,2].map(i=>{const k=L.p[i];return `<button class="lo7s" data-a="lo7pick" data-v="p|${i}">${k?skIco7(k)+`<span>${esc(SK[k].n)}<small>${esc(SK[k].fx||'')}</small></span>`:'<span class="sub">空</span>'}</button>`}).join('')}</div>`;
  return `${tabs}<div class="lbl">主動（由上往下，第一個符合條件的就放）</div><div class="list">${a}${base}</div><div class="lbl">被動（3 個）</div>${p}${inModal?'':''}`}
function loPicker7(){const L=lo7(),j=job6(),u=LOUI;if(!u)return '';
  if(u.k==='c'){const k=L.a[u.i];return `<div class="lbl">【${esc(SK[k].n)}】條件 ${u.ci+1}</div><div class="chips">${CONDOPT7.map(([t,v])=>`<button class="chip" data-a="lo7cond" data-v="${t}|${v==null?'':v}">${esc(condTx7({t,v}))}</button>`).join('')}<button class="chip" data-a="lo7cond" data-v="">清除</button></div>`}
  const act=u.k==='a',b=baseSk7(),own=act?L.a:L.p;
  const list=jobSk6(j,act).filter(k=>(!act||k.id!==b.id));
  return `<div class="lbl">選擇${act?'主動':'被動'}（第 ${u.i+1} 格）</div><div class="list">${list.map(k=>{const ok=skOk6(k.id),on=own.includes(k.id);return `<button class="item ${ok?'':'off'}" data-a="lo7put" data-v="${k.id}" ${ok?'':'disabled'}>${skIco7(k.id)}<span class="grow"><b>${esc(k.n)}${on?'　<small class="tag">配置中</small>':''}${ok?'':`　<small class="tag red">Lv.${k.lv}</small>`}</b><span class="sub">${esc(k.d||k.fx||'')}</span></span></button>`}).join('')}</div>`}
MV.lo7=()=>({t:'技能配置',b:B?'<p class="sub">戰鬥中不能更換。</p>'+loPanel7(1):loPanel7(1)+loPicker7()});
Object.assign(ACT,{
  lo7set(v){if(B)return;lo7();S.lo7.cur=+v;LOUI=null;EFC=null;save();drawModal();render()},
  lo7pick(v){if(B)return;const [k,i,ci]=String(v).split('|');LOUI={k,i:+i,ci:ci!=null?+ci:0};if(MODAL&&MODAL.k==='lo7')drawModal();else openM('lo7')},
  lo7put(k){if(B||!LOUI)return;const L=lo7(),own=LOUI.k==='a'?L.a:L.p,i=LOUI.i,j=own.indexOf(k);if(j>=0&&j!==i){own[j]=own[i]}own[i]=k;
    if(LOUI.k==='a'){L.c[k]=L.c[k]||recoLoad7().c[k]||[]}const fl=own.filter(Boolean);own.length=0;own.push(...fl);LOUI=null;EFC=null;save();drawModal();render()},
  lo7cond(v){if(B||!LOUI)return;const L=lo7(),k=L.a[LOUI.i];if(!k)return;const cs=L.c[k]=L.c[k]||[];if(!v){cs.splice(LOUI.ci,1)}else{const [t,x]=v.split('|');cs[LOUI.ci]={t,v:x===''?undefined:+x}}
    L.c[k]=cs.filter(Boolean).slice(0,2);LOUI=null;save();drawModal();render()}});
/* 角色頁「技能」分頁：上方放配置 */
{const _sk=skTab6;skTab6=function(){return `<div class="panel"><h3>技能配置<button class="btn sm" style="float:right" data-a="openM" data-v="lo7">調整</button></h3>${loPanel7(0)}</div>`+_sk.apply(this,arguments)}}
(()=>{const st=document.createElement('style');st.textContent=`.lo7{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.lo7n{width:18px;text-align:center;color:var(--gold,#d9ae4c)}
.lo7s{display:flex;align-items:center;gap:6px;flex:1;min-width:0;background:none;border:0;color:inherit;text-align:left;padding:2px}.lo7s span{display:flex;flex-direction:column;min-width:0}.lo7s small{font-size:10.5px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lo7c{display:flex;gap:4px;width:100%;padding-left:24px}.lo7c .chip{font-size:11px;padding:2px 8px}.lo7p{display:grid;grid-template-columns:1fr;gap:4px}.lo7p .lo7s{border:1px solid var(--line,#444);border-radius:10px;padding:5px 8px}`;document.head.appendChild(st)})();
