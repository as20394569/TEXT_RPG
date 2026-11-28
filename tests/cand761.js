/* V7.6.1 候選技能 39 招：只在測試模擬器載入，不進正式遊戲。
   C761.on() 套用候選、C761.off() 還原。規格不明處依字面處理，見 V761_TEST_REPORT.md「規格不明」。 */
(()=>{
const C=window.C761={act:false,log:{}};
const hit1=(id)=>{C.log[id]=(C.log[id]||0)+1};
const CAND=['J01S7','J01S8','J02S3','J02S7','J02S8','J03S7','J03S8','J03S15','J04S7','J04S8','J05S7','J05S8','J06S7','J06S8','J07S7','J07S8','J07S15','J07S16','J08S7','J08S8','J08S15',
  'J09S7','J09S8','J09S10','J09S11','J09S14','J10S3','J10S7','J10S8','J10S14','J11S7','J11S8','J11S12','J12S7','J12S8','J12S16','J13S7','J13S8','J13S11'];
C.CAND=CAND;
const NAME={J03S15:'追獵本能',J05S8:'盾擊橫掃',J07S15:'結界精通',J07S16:'奧術回流',J08S15:'噬魂精通',J09S7:'穿雲箭雨',J09S8:'雙星射擊',J09S10:'裂甲箭',J09S11:'凝神瞄準',
  J09S14:'貫甲精通',J10S14:'毒刃精通',J11S8:'審判之雨',J11S12:'聖光守護',J12S16:'聖盾回魔',J13S7:'影步亂斬',J13S11:'交刃破甲'};
const POW={J02S7:.7,J07S7:.8,J03S8:.75};
const HITS={J03S8:3,J13S7:2,J13S8:2,J13S11:2};
const FXN={J02S8:{push:15},J05S7:{},J07S8:{},J12S7:{},J09S7:{pen:20},J09S8:{}};/* 新文字未提的舊附加效果依字面移除 */
let SAVE=null;
C.on=function(){if(C.act)return;SAVE={sk:{},fx:{},psv:{}};
  for(const k of CAND){const x=SK[k];SAVE.sk[k]={n:x.n,pow:x.pow,dmg:x.dmg?Object.assign({},x.dmg):null};SAVE.fx[k]=FX7[k]?JSON.parse(JSON.stringify(FX7[k])):undefined;SAVE.psv[k]=PSV[k]}
  for(const k in NAME)SK[k].n=NAME[k];
  for(const k in POW){SK[k].pow=POW[k];if(SK[k].dmg)SK[k].dmg.p=POW[k]}
  for(const k in HITS)if(SK[k].dmg)SK[k].dmg.h=HITS[k];
  for(const k in FXN)FX7[k]=Object.assign({},FXN[k]);
  PSV.J10S14=[{k:'dotk',st:['POISON'],v:10}];
  PSV.J09S14=[{k:'pierce',v:5},{k:'markpen7',v:2}];
  C.act=true;EFC=null};
C.off=function(){if(!C.act)return;for(const k of CAND){const x=SK[k],o=SAVE.sk[k];x.n=o.n;x.pow=o.pow;if(o.dmg)x.dmg=o.dmg;if(SAVE.fx[k]===undefined)delete FX7[k];else FX7[k]=SAVE.fx[k];PSV[k]=SAVE.psv[k]}C.act=false;EFC=null};
const isC=k=>C.act&&CAND.includes(k);
const SLOW=()=>SLOWK;
/* ---- 施放期間的命中紀錄與命中前修正 ---- */
let CUR=null;/* {k,hits:[{f,r}],hp0,low} */
{const _h=hitFoe;hitFoe=function(stat,pow,o){if(!CUR||!o||!o.skill)return _h.apply(this,arguments);o=Object.assign({},o);const k=CUR.k,f=o.tgt||B;
  if(k==='J01S7'&&f!==B){pow*=.7;hit1('J01S7.second70')}
  if(k==='J06S7'&&CUR.low){o.amp=(o.amp||0)+25;hit1('J06S7.low')}
  if(k==='J08S8'){const n=stList(f).filter(id=>STX[id]&&STX[id].bad).length;if(n){o.amp=(o.amp||0)+Math.min(30,n*10);hit1('J08S8.amp')}}
  if(k==='J09S7'&&stHas(f,'MARK')){o.cr=(o.cr||0)+15;hit1('J09S7.crit')}
  if(k==='J10S8'&&stHas(f,'POISON')){o.cr=(o.cr||0)+15;hit1('J10S8.crit')}
  if(k==='J11S8'&&stHas(f,'JUDGE')){o.amp=(o.amp||0)+30;hit1('J11S8.amp')}
  if(C.act&&stHas(f,'MARK')&&pierce7(k)>0){const v=effSum('markpen7');if(v){o.pen=(o.pen||0)+v;hit1('J09S14.mark')}}
  if(C.act&&B.c761f&&B.c761f.until>acOf('p')&&SK[k].tg==='單體'&&stHas(f,'MARK')){o.cr=(o.cr||0)+10;B.c761f=null;hit1('J09S11.crit')}
  if(C.act&&B.c761n&&SK[k].tg==='單體'&&SK[k].dmg){o.amp=(o.amp||0)+B.c761n;B.c761n=0;hit1('J01S8.next')}
  const r=_h.call(this,stat,pow,o);CUR.hits.push({f,r});return r}}
{const _us=useSkill6;useSkill6=function(k,s){const rel=B&&B.chgRel===k;if(!C.act||!B)return _us.apply(this,arguments);
  const x=SK[k],sv=CUR;CUR={k,hits:[],hp0:S.hp,low:S.hp<s.HP*.5};
  if(k==='J06S7'&&!rel){const c=Math.ceil(s.HP*.05);S.hp=Math.max(1,S.hp-c);hit1('J06S7.cost')}
  let ret;try{ret=_us.apply(this,arguments)}finally{const H=CUR;CUR=sv;try{post(k,s,H)}catch(e){console.error(e)}}return ret}}
function post(k,s,H){if(!isC(k)||!H)return;const ok=H.hits.filter(h=>!h.r.miss),n=ok.length,tgts=[...new Set(ok.map(h=>h.f))];
  const self=(id,o)=>stAdd('p',id,o),sh=(pct)=>{stAdd('p','SHIELD',{amt:s.HP*pct/100,dur:2})};
  switch(k){
    case 'J01S7':for(const f of tgts)if(f!==B){stAdd(f,'ARMOR',{dur:1});hit1('J01S7.armor2')}break;
    case 'J01S8':if(n){B.c761n=Math.min(20,5*n);hit1('J01S8.set')}break;
    case 'J02S3':if(tgts.includes(B)){sh(5);hit1('J02S3.shield')}break;
    case 'J03S7':for(const f of tgts)if(f!==B){stAdd(f,'SLOW',{dur:1});hit1('J03S7.slow2')}break;
    case 'J04S7':if(n){const h=Math.round(s.HP*Math.min(4,n)/100*healInM6()),real=Math.min(h,s.HP-S.hp);S.hp+=real;hit1('J04S7.heal')}break;
    case 'J04S8':for(const f of tgts)if(f!==B){stAdd(f,'SEAL',{dur:1});hit1('J04S8.seal2')}break;
    case 'J05S7':if(n){sh(Math.min(12,3*n));hit1('J05S7.shield')}break;
    case 'J05S8':if(n){self('BLOCKUP',{v:10,dur:1});hit1('J05S8.block')}break;
    case 'J06S8':if(tgts.some(f=>f.hp<=0&&!f.summon7)){const h=Math.round(s.HP*.05),real=Math.min(h,s.HP-S.hp);S.hp+=real;hit1('J06S8.kill')}break;
    case 'J07S8':for(const f of tgts)if(SLOW().some(id=>stHas(f,id))&&Math.random()<.2){if(stAdd(f,'STUN',{dur:1}))hit1('J07S8.stun');else hit1('J07S8.immune')}break;
    case 'J08S7':for(const f of tgts)if(stHas(f,'POISON')){f.p761=1}break;
    case 'J09S8':for(const f of tgts){stAdd(f,'MARK',{dur:1});hit1('J09S8.mark')}break;
    case 'J09S11':B.c761f={until:acOf('p')+2+1};hit1('J09S11.set');break;
    case 'J10S3':if(B){self('EVAUP',{v:12+fxvOf6(k),dur:durOf6(k,2)});B.c761w=1;hit1('J10S3.ward')}break;
    case 'J10S7':if(n){const c=B.psx&&B.psx.EVAUP;if(!(c&&c.e>acOf('p')&&(c.v||0)>=10))self('EVAUP',{v:10,dur:1});hit1('J10S7.eva')}break;
    case 'J11S7':if(n){sh(Math.min(8,2*n));hit1('J11S7.shield')}break;
    case 'J12S7':for(const f of tgts){stAdd(f,'ARMOR',{dur:1});hit1('J12S7.armor')}if(n)self('BLOCKUP',{v:10,dur:1});break;
    case 'J12S8':if(n){B.c761r={until:acOf('p')+1+1};hit1('J12S8.set')}break;
    case 'J13S7':if(ok.some(h=>h.r.cr)&&B.rt){B.rt.pgB=(B.rt.pgB||0)+10;hit1('J13S7.gauge')}break;
    case 'J09S10':hit1('J09S10.noop');break;/* 命中率 +10：現行命中公式上限 100，玩家命中≥0 時沒有作用 */
  }}
/* J07S7：本技能可疊 2 層灼燒，各自到期（第二層用 BURN2 模擬，結算與 BURN 相同） */
STX.BURN2=Object.assign({},STX.BURN,{n:(STX.BURN.n||'灼燒')+'②'});
{const _fa=fx7Apply;fx7Apply=function(k,s,d,ps,hit,f){if(C.act&&k==='J07S7'&&hit){const T=f||B;const bx=stBox(T);if(bx.BURN&&bx.BURN.e>acOf(T)&&Math.random()<.5){
  if(stAdd(T,'BURN2',{src:{mag:s.MAG},amp:(effSum('skdot',k)+(rtS6().DOT||0)+dotK7('BURN'))/100,dur:durOf6(k,2)})){hit1('J07S7.stack2')}const o=FX7[k];FX7[k]={};try{return _fa.apply(this,arguments)}finally{FX7[k]=o}}}
  return _fa.apply(this,arguments)}}
/* J06S7：HP 不足 5% 不能施放（不得致死） */
{const _r=skUsable7;skUsable7=function(k){if(C.act&&k==='J06S7'){const s=rtS6();if(S.hp<=Math.ceil(s.HP*.05))return false}return _r.apply(this,arguments)}}
/* J08S7：本技能施毒的目標死亡時，把剩餘毒傳給一個未中毒敵人，最多一次 */
{const _t=foeTake6;foeTake6=function(f,d,src){const r=_t.apply(this,arguments);try{if(C.act&&f&&f.hp<=0&&f.p761&&!f.p761done&&B){f.p761done=1;const bx=stBox(f),p=bx.POISON;if(p&&p.e>acOf(f)){const L=aliveFoes7().filter(g=>g!==f&&!stHas(g,'POISON'));if(L.length){const g=L[0];stBox(g).POISON=Object.assign({},p,{e:acOf(g)+(p.e-acOf(f)),a:acOf(g)});hit1('J08S7.spread')}}}}catch(e){}return r}}
/* J10S3 一次性減傷、J12S8 反彈：玩家承受直接傷害時 */
{const _fh=foeHit6;foeHit6=function(f,k,s,o){const r=_fh.apply(this,arguments);try{if(C.act&&B&&r&&!r.miss&&r.d>0){
  if(B.c761w){r.d=Math.max(1,Math.round(r.d*.85));B.c761w=0;hit1('J10S3.used')}
  if(B.c761r&&B.c761r.until>acOf('p')){const v=Math.max(1,Math.round(r.d*.1));foeTake6(f,v,'反彈');B.c761r=null;hit1('J12S8.reflect')}}}catch(e){}return r}}
})();
