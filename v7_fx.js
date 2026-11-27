/* V7 技能／狀態特效與音效
   斬擊：乾淨的細線＋顏色與附加效果區分；法術：貼合名稱的元素表現；射擊投擲：尾翼＋破空；狀態：施加、持續、跳傷各有辨識度與音效 */
(()=>{if(typeof PFX==='undefined'||!PFX.kit)return;
const K=PFX.kit,{cel,P2,U,F,H,later,multi,flash,shock,spark,phys,debris,streak,comet,ray,column,rune,charge,flames,crystals,fog,auraUp,bubble,wind,swirl,twinkle,lunge,castPose,tint,run,locate,rg,ADD,eo,rnd2,GY,reduce,T0}=K;
const PI=Math.PI,SR=()=>K.SR(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ================= 音效（獨立匯流排，不經過 8-bit 低通，保留金屬與破空的高頻） ================= */
let G7=null,NB=null;
function A(){if(typeof MUTE!=='undefined'&&MUTE)return null;const a=typeof ctx==='function'?ctx():null;if(!a)return null;
  if(!G7){const cp=a.createDynamicsCompressor();cp.threshold.value=-18;cp.ratio.value=4;cp.connect(a.destination);G7=a.createGain();G7.gain.value=.32;G7.connect(cp);
    const n=a.sampleRate*1.5|0,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;NB=b}return a}
const now=(a,t)=>a.currentTime+(t||0);
function env(a,g,t,at,v,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.0008,t+at+dec)}
/* 濾波噪音：f0→f1 掃頻 */
function noise(t0,dur,o){const a=A();if(!a)return;o=o||{};const t=now(a,t0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=NB;s.loop=true;f.type=o.type||'bandpass';f.Q.value=o.q||1.2;
  f.frequency.setValueAtTime(o.f0||1200,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,o.f1||o.f0||1200),t+dur);env(a,g,t,o.at||.01,o.v||.5,dur);s.connect(f);f.connect(g);g.connect(G7);s.start(t,Math.random());s.stop(t+dur+.1)}
/* 振盪音 */
function tone(t0,dur,o){const a=A();if(!a)return;o=o||{};const t=now(a,t0),s=a.createOscillator(),g=a.createGain();s.type=o.w||'sine';s.frequency.setValueAtTime(o.f0||440,t);if(o.f1)s.frequency.exponentialRampToValueAtTime(o.f1,t+dur);if(o.det)s.detune.value=o.det;
  env(a,g,t,o.at||.005,o.v||.2,dur);let n=s;if(o.lp){const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;s.connect(f);n=f}n.connect(g);g.connect(G7);s.start(t);s.stop(t+dur+.1)}
const SN={
  /* 揮刃破風：短促帶通噪音由低掃到高 */
  swish(t=0,p=1,hi){noise(t,.13*p,{f0:hi?900:500,f1:hi?5200:3200,q:1.6,v:.42})},
  /* 金屬刃鳴：非整數泛音，快速衰減 */
  ring(t=0,f=1800,v=.09,d=.35){[1,2.76,5.4].forEach((m,i)=>tone(t,d*(1-i*.25),{f0:f*m,v:v/(i+1)}))},
  /* 命中：低頻撞擊＋砂礫 */
  thud(t=0,v=.5){tone(t,.18,{f0:150,f1:45,v:v*.7});noise(t,.09,{type:'lowpass',f0:1400,f1:300,v:v*.6})},
  cut(t=0,col){SN.swish(t,1,1);SN.ring(t+.03,col||2100,.07,.25);noise(t+.05,.06,{type:'highpass',f0:3000,v:.25})},
  heavy(t=0){SN.swish(t,1.6);SN.thud(t+.08,.7);noise(t+.1,.35,{type:'lowpass',f0:600,f1:120,v:.35})},
  blunt(t=0){SN.thud(t,.8);SN.ring(t+.01,620,.06,.5);noise(t,.2,{type:'lowpass',f0:900,f1:200,v:.4})},
  /* 弓弦＋破空哨音 */
  bow(t=0){tone(t,.09,{f0:220,f1:110,w:'triangle',v:.18});noise(t,.05,{f0:2500,q:4,v:.25})},
  zip(t=0,d=.2){noise(t,d,{f0:5000,f1:1400,q:5,v:.3});tone(t,d,{f0:2600,f1:900,v:.05})},
  thunk(t=0){noise(t,.05,{type:'highpass',f0:2000,v:.3});tone(t,.1,{f0:300,f1:120,w:'triangle',v:.2})},
  /* 火：低頻轟燃 */
  ignite(t=0){noise(t,.25,{f0:300,f1:1600,q:.8,v:.35,at:.04})},
  roar(t=0,d=.7,v=.45){noise(t,d,{type:'lowpass',f0:1800,f1:250,q:.7,v,at:.06});noise(t,d*.8,{type:'highpass',f0:3500,v:v*.25,at:.05})},
  boom(t=0,v=.7){tone(t,.45,{f0:90,f1:30,v:v*.8});noise(t,.6,{type:'lowpass',f0:2200,f1:120,v})},
  /* 冰：高頻碎裂與結晶聲 */
  frost(t=0){noise(t,.4,{type:'highpass',f0:4500,f1:2500,v:.18,at:.05});for(let i=0;i<5;i++)tone(t+i*.05+Math.random()*.03,.12,{f0:2400+Math.random()*2600,v:.05})},
  shatter(t=0){noise(t,.25,{type:'highpass',f0:3000,f1:6000,v:.35});for(let i=0;i<8;i++)tone(t+Math.random()*.15,.15,{f0:2000+Math.random()*4000,v:.05})},
  /* 雷：撕裂＋悶雷 */
  zap(t=0){noise(t,.08,{type:'highpass',f0:2500,v:.6});tone(t,.25,{f0:70,w:'sawtooth',v:.12,lp:900});noise(t+.06,.9,{type:'lowpass',f0:500,f1:60,v:.5,at:.03})},
  crackle(t=0,d=.3){for(let i=0;i<6;i++)noise(t+Math.random()*d,.02,{type:'highpass',f0:3000,v:.3})},
  /* 聖：鐘聲和弦 */
  chime(t=0,base=880){[1,1.25,1.5,2].forEach((m,i)=>tone(t+i*.05,.9,{f0:base*m,v:.06}))},
  bell(t=0,f=1320){tone(t,1.1,{f0:f,v:.08});tone(t,.8,{f0:f*2.4,v:.03})},
  /* 暗：低沉嗡鳴與反向湧起 */
  drone(t=0,d=.7){tone(t,d,{f0:82,w:'sawtooth',v:.12,lp:500,at:.2});tone(t,d,{f0:87,w:'sawtooth',v:.1,lp:500,at:.2});noise(t,d,{type:'lowpass',f0:200,f1:900,v:.25,at:d*.7})},
  whisper(t=0){noise(t,.5,{f0:700,f1:2400,q:6,v:.2,at:.2})},
  /* 毒：冒泡 */
  bubble(t=0,n=5){for(let i=0;i<n;i++)tone(t+i*.06+Math.random()*.03,.07,{f0:300+Math.random()*300,f1:900+Math.random()*500,v:.07})},
  hiss(t=0,d=.5){noise(t,d,{type:'highpass',f0:5000,f1:3500,v:.18,at:.05})},
  /* 吸收／治療 */
  heal(t=0){[523,659,784,1047].forEach((f,i)=>tone(t+i*.07,.5,{f0:f,v:.06}));noise(t,.6,{type:'highpass',f0:6000,v:.05,at:.2})},
  mana(t=0){[392,494,587,784].forEach((f,i)=>tone(t+i*.06,.45,{f0:f,w:'triangle',v:.06}))},
  /* 護盾：嗡鳴罩起 */
  shield(t=0){tone(t,.5,{f0:220,f1:440,w:'triangle',v:.1});SN.ring(t+.15,1400,.05,.6)},
  guard(t=0){SN.ring(t,900,.08,.5);tone(t,.3,{f0:180,v:.1})},
  /* 增益／減益 */
  up(t=0){tone(t,.25,{f0:330,f1:880,w:'triangle',v:.08});tone(t+.12,.25,{f0:494,f1:1320,w:'triangle',v:.06})},
  down(t=0){tone(t,.35,{f0:600,f1:160,w:'triangle',v:.09})},
  star(t=0){for(let i=0;i<4;i++)tone(t+i*.05,.3,{f0:1800+i*300,v:.04})},
  charge(t=0,d=.5){tone(t,d,{f0:200,f1:900,w:'sawtooth',v:.06,lp:1800,at:d*.8});noise(t,d,{f0:400,f1:3000,q:3,v:.15,at:d*.8})},
  wind(t=0){noise(t,.4,{f0:600,f1:1800,q:2,v:.25,at:.1})},
  splat(t=0){noise(t,.08,{type:'lowpass',f0:900,v:.3});tone(t,.08,{f0:200,f1:90,v:.1})}};
window.SN7=SN;

/* ================= 位置 ================= */
function stageR(){const st=document.querySelector('.stage')||document.querySelector('#xfield');return st?st.getBoundingClientRect():null}
function cardPt(el){const sr=stageR();if(!sr||!el)return null;const im=el.querySelector('.eart .art img')||el.querySelector('.eart')||el,r=im.getBoundingClientRect();if(r.width<2)return null;
  const p=[(r.left+r.width/2-sr.left)/sr.width,(r.top+r.height*.5-sr.top)/sr.height];p.g=(r.bottom-r.height*.05-sr.top)/sr.height-p[1];p.R=r.width/sr.width;return p}
/* 範圍技的目標：主目標＋活著的副目標卡片 */
function aoePts(k){const x=SK[k],out=[F];if(!x||!(x.tg==='雙體'||x.tg==='全體')||typeof RTK==='undefined')return out;
  const L=RTK.cards.filter(c=>!c.m&&c.f&&c.f.hp>0).sort((a,b)=>a.f.hp-b.f.hp).slice(0,x.tg==='雙體'?1:3);L.forEach(c=>{const p=cardPt(c.el);if(p)out.push(p)});return out}
function ptOf(t){if(t==='p')return H;if(!B||t===B)return F;if(typeof RTK==='undefined')return F;const c=RTK.cards.find(c=>c.f===t);return c&&cardPt(c.el)||null}
const HP0=()=>[H[0]+.06,H[1]-.06];

/* ================= 斬擊：乾淨的細線 ================= */
/* blade：一筆劃過的刃光。白色極細芯線＋顏色窄邊，先畫出再往刀尖收束，幾乎不糊 */
function blade(f,ang,L,col,o){o=o||{};const life=o.life||.42,W=o.w||.016,bend=o.bend??.05,d0=o.dr||.13;
  cel(life,(c,k)=>{const [x,y]=P2(f),u=U(),Lp=L*u*1.15,dr=eo(k/d0),hold=.42,th=k<hold?1:Math.pow(Math.max(0,1-(k-hold)/(1-hold)),.9);if(th<=.01)return;
    const a=-Lp/2+Lp*Math.max(0,eo((k-hold*.7)/(1-hold*.7)))*.9,b=-Lp/2+Lp*dr,w=W*u*(k<hold?1:.35+.65*th);if(b-a<1)return;
    c.translate(x,y);c.rotate(ang);if(o.flip)c.scale(1,-1);const N=20,P=[];for(let i=0;i<=N;i++){const t=i/N,xx=a+(b-a)*t,yy=-bend*Lp*Math.sin(PI*(xx+Lp/2)/Lp);P.push([xx,yy,w*Math.pow(Math.sin(PI*t),.5)])}
    const band=()=>{c.beginPath();P.forEach(([px,py,pw],i)=>i?c.lineTo(px,py-pw*.55):c.moveTo(px,py-pw*.55));for(let i=N;i>=0;i--){const [px,py,pw]=P[i];c.lineTo(px,py+pw*.45)}c.closePath()};
    /* 深色描邊：在亮色怪物身上也看得清楚 */
    c.globalCompositeOperation='source-over';c.globalAlpha=.45*th;band();c.strokeStyle='rgba(10,12,24,.9)';c.lineWidth=Math.max(1.5,w*.5);c.lineJoin='round';c.stroke();
    ADD(c);c.globalAlpha=th;c.shadowColor=col;c.shadowBlur=w*1.4;band();c.fillStyle=col;c.fill();c.shadowBlur=0;
    c.beginPath();P.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.strokeStyle='#ffffff';c.lineWidth=Math.max(1.2,w*.42);c.lineCap='round';c.stroke();
    if(k<d0*1.8){const [hx,hy]=P[N];c.fillStyle=rg(c,hx,hy,w*3.2,[[0,'#ffffff'],[.4,col],[1,T0]]);c.globalAlpha=1-k/(d0*1.8);c.fillRect(hx-w*3.2,hy-w*3.2,w*6.4,w*6.4)}})}
/* 切口殘光：刃線過後留下一道細細的發光切痕 */
function scar(f,ang,L,col,o){o=o||{};cel(o.life||.6,(c,k)=>{const [x,y]=P2(f),Lp=L*U()*.75*(1-k*.3);ADD(c);c.translate(x,y);c.rotate(ang);c.globalAlpha=(1-k)*.9;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1.5,U()*.005*(1-k*.6));c.beginPath();c.moveTo(-Lp/2,0);c.lineTo(Lp/2,0);c.stroke()},{})}
/* 刃線的附加效果 */
function edgeFx(f,ang,kind,col){const [x0,y0]=[f[0],f[1]];
  if(kind==='blood'){phys(f,'drop',10,{dir:ang+PI/2,spread:.9,spd:[.4,1],sz:[.003,.006],life:[.5,.9],col:'#c8102e'});phys(f,'drop',5,{dir:-PI/2,spread:1.2,spd:[.3,.7],sz:[.003,.005],life:[.4,.7],col:'#ff3046'})}
  else if(kind==='frost'){crystals([x0,y0],'#9fe2ff',{n:4,h:.06,sp:.05,life:.55,gy:GY(f)});phys(f,'shard',6,{spd:[.4,.9],sz:[.005,.01],life:[.5,.8],ice:1,col:'#bff0ff'});fog(f,'rgba(190,235,255,.8)',{R:.06,a:.35,life:.7,n:5})}
  else if(kind==='armor'){phys(f,'shard',7,{dir:ang,spread:1.2,spd:[.6,1.3],sz:[.006,.012],life:[.6,1],col:'#c8c8d0',hi:'#ffffff',lo:'#5a5a66'});phys(f,'spark',12,{dir:ang,spread:1.4,spd:[.7,1.5],sz:[.003,.006],life:[.2,.45],col:'#ffb04a'})}
  else if(kind==='poison'){phys(f,'drop',8,{spd:[.3,.8],sz:[.004,.008],life:[.5,.9],col:'#8be04a'});fog(f,'rgba(110,200,60,.9)',{R:.05,a:.4,life:.8,n:5,rise:.02})}
  else if(kind==='dark'){phys(f,'wisp',7,{spd:[.4,.9],sz:[.005,.009],life:[.5,.9],col:'#a060ff'})}
  else if(kind==='holy'){twinkle(f,'#fff3b0',5,{life:.6,sx:.06,sy:.06})}
  else phys(f,'spark',9,{dir:ang+PI/2,spread:1.3,spd:[.6,1.3],sz:[.003,.006],life:[.2,.4],col})}
/* 一刀：刃線＋殘光＋效果＋命中閃點 */
function slashOn(f,ang,col,o){o=o||{};blade(f,ang,o.L||.34,col,o);later(50,()=>{scar(f,ang,o.L||.34,col);if(o.ef!==false)edgeFx(f,ang,o.ef,col);spark(f,'#ffffff',.06,6,.18)})}
/* 殘影：同一刀錯開幾道淡影 */
function afterimg(f,ang,col,n){for(let i=1;i<=n;i++)later(i*35,()=>blade([f[0]-i*.012,f[1]+i*.008],ang,.32,col,{w:.006,life:.22}))}

/* ================= 鈍擊（錘、盾） ================= */
function smash(f,col,o){o=o||{};const p=o.p||1;flash(f,col,.16*p,.25);shock(f,col,.2*p,.45,.32,{gy:.12,w:.018});later(40,()=>shock(f,'#ffffff',.12*p,.3));
  phys(f,'chunk',Math.round(4+p*4),{spd:[.4,1.1],sz:[.005,.012],life:[.7,1.1]});phys(f,'spark',10,{spd:[.6,1.4],sz:[.003,.006],life:[.2,.4],col});fog([f[0],f[1]+GY(f)-.02],'rgba(220,205,175,.75)',{R:.07*p,n:7,rise:.03,life:.8,a:.5});
  if(o.crack)cel(.8,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U();c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;ADD(c);c.lineWidth=Math.max(1,u*.004);
    for(let i=0;i<6;i++){const a=PI+i/5*PI,L=u*.12*eo(k*3)*(.6+.4*Math.sin(i*7));c.beginPath();c.moveTo(x,gy);c.lineTo(x+Math.cos(a)*L*.5,gy+Math.sin(a)*L*.12+3);c.lineTo(x+Math.cos(a)*L,gy+Math.sin(a)*L*.25);c.stroke()}})}

/* ================= 射擊、投擲：尾翼＋破空 ================= */
/* 箭／飛刀／毒針：直線高速；尾端畫羽翼，沿途留下速度線與破空的音爆環 */
function dart(from,to,o){o=o||{};const dur=o.dur||.18,type=o.type||'arrow',col=o.col||'#ffffff',fl=o.fl||'#e8e0c8',tail=[],sz=o.sz||1;
  cel(dur+.25,(c,k0)=>{const el=k0*(dur+.25),k=Math.min(1,el/dur),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),e=o.ease?eo(k):k,arc=(o.arc||0)*u,x=x0+(x1-x0)*e,y=y0+(y1-y0)*e-Math.sin(PI*e)*arc;
    const dx=(x1-x0),dy=(y1-y0)-arc*PI*Math.cos(PI*e),a=Math.atan2(dy,dx);if(el<dur){tail.push([x,y,el]);if(tail.length>14)tail.shift()}
    ADD(c);
    /* 速度線（三條細線，越後面越淡） */
    for(const off of [-1,0,1]){c.beginPath();let st=0;for(let i=0;i<tail.length;i++){const [tx,ty,te]=tail[i],age=el-te;if(age>.12)continue;const ox=-Math.sin(a)*off*u*.008,oy=Math.cos(a)*off*u*.008;st?c.lineTo(tx+ox,ty+oy):(c.moveTo(tx+ox,ty+oy),st=1)}
      c.strokeStyle=off?'rgba(255,255,255,.35)':col;c.globalAlpha=off?.5:.8;c.lineWidth=Math.max(1,u*(off?.002:.004));c.stroke()}
    /* 破空：出手瞬間與飛行途中的音爆環（垂直於飛行方向的扁橢圓，向外擴散淡出） */
    for(const [tx,ty,te] of tail.filter((_,i)=>i%4===0)){const age=el-te;if(age>.22)continue;const q=age/.22;c.save();c.translate(tx,ty);c.rotate(a);c.globalAlpha=(1-q)*.55;c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,u*.003*(1-q));c.beginPath();c.ellipse(-u*.01*q,0,u*.008*(1+q*1.5),u*.035*(.5+q),0,-1.2,1.2);c.stroke();c.restore()}
    if(el>=dur)return;
    c.save();c.translate(x,y);c.rotate(o.spin?el*40:a);c.globalCompositeOperation='source-over';c.globalAlpha=1;const s=u*.019*sz;
    if(type==='arrow'){/* 箭身、箭頭、尾羽 */c.strokeStyle='#d8c8a8';c.lineWidth=Math.max(1,s*.28);c.beginPath();c.moveTo(-s*4.2,0);c.lineTo(s*1.2,0);c.stroke();
      c.fillStyle='#f4f4f8';c.strokeStyle='rgba(40,30,20,.6)';c.lineWidth=1;c.beginPath();c.moveTo(s*2.4,0);c.lineTo(s*.9,-s*.6);c.lineTo(s*1.2,0);c.lineTo(s*.9,s*.6);c.closePath();c.fill();c.stroke();
      c.fillStyle=fl;for(const sg of [-1,1]){c.beginPath();c.moveTo(-s*2.6,0);c.lineTo(-s*4.4,sg*s*.9);c.lineTo(-s*4.6,sg*s*.75);c.lineTo(-s*3.6,0);c.closePath();c.fill();c.stroke()}
      ADD(c);c.shadowColor=col;c.shadowBlur=s*2;c.fillStyle=col;c.globalAlpha=.7;c.beginPath();c.arc(s*1.8,0,s*.45,0,7);c.fill()}
    else if(type==='knife'){c.fillStyle='#e8eef6';c.strokeStyle='rgba(30,30,40,.7)';c.lineWidth=1;c.beginPath();c.moveTo(s*2.2,0);c.lineTo(-s*.4,-s*.55);c.lineTo(-s*.4,s*.55);c.closePath();c.fill();c.stroke();c.fillStyle='#4a3a30';c.fillRect(-s*1.6,-s*.3,s*1.2,s*.6);
      c.fillStyle=fl;c.beginPath();c.moveTo(-s*1.6,0);c.lineTo(-s*2.6,-s*.6);c.lineTo(-s*2.3,0);c.lineTo(-s*2.6,s*.6);c.closePath();c.fill()}
    else if(type==='needle'){c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=s;c.lineWidth=Math.max(1,s*.22);c.beginPath();c.moveTo(-s*2.4,0);c.lineTo(s*1.6,0);c.stroke();c.fillStyle=fl;c.beginPath();c.moveTo(-s*2.4,0);c.lineTo(-s*3.1,-s*.45);c.lineTo(-s*3.1,s*.45);c.closePath();c.fill()}
    c.restore()});
  /* 出手處的破空環 */
  cel(.25,(c,k)=>{const [x0,y0]=P2(from),[x1,y1]=P2(to),a=Math.atan2(y1-y0,x1-x0),u=U();ADD(c);c.translate(x0,y0);c.rotate(a);c.globalAlpha=1-k;c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,u*.004*(1-k));c.beginPath();c.ellipse(u*.02*k,0,u*.01*(1+k*2),u*.04*(1+k),0,0,7);c.stroke()});
  later(dur*1000,()=>{if(o.hit)o.hit();else pierceHit(to,col)})}
function pierceHit(f,col){spark(f,col,.1,8,.22);flash(f,col,.1,.2);phys(f,'spark',10,{spd:[.5,1.2],sz:[.003,.006],life:[.2,.4],col})}

/* ================= 元素 ================= */
/* 火球：亮核＋翻騰的火舌拖尾＋黑煙＋火星 */
function fireball(from,to,o){o=o||{};const dur=o.dur||.34,sz=o.sz||1,tr=[];
  cel(dur+.1,(c,k0)=>{const el=k0*(dur+.1),k=Math.min(1,el/dur),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),e=eo(k),arc=(o.arc??.05)*u,x=x0+(x1-x0)*e,y=y0+(y1-y0)*e-Math.sin(PI*e)*arc;
    if(el<dur){tr.push([x,y,el]);if(tr.length>16)tr.shift()}if(el>=dur)return;const R=u*.03*sz;
    for(let i=0;i<tr.length;i++){const [tx,ty,te]=tr[i],q=i/tr.length,age=el-te,r=R*(.4+q*.8)*(1+age*2);c.globalCompositeOperation='source-over';c.globalAlpha=(1-q)*.25;c.fillStyle=rg(c,tx,ty-age*u*.05,r*1.4,[[0,'rgba(60,40,35,.9)'],[1,T0]]);c.beginPath();c.arc(tx,ty-age*u*.05,r*1.4,0,7);c.fill()}
    ADD(c);for(let i=0;i<tr.length;i++){const [tx,ty]=tr[i],q=i/tr.length,r=R*(.3+q*.9)*(.85+.3*Math.random());c.globalAlpha=q*.8;c.fillStyle=rg(c,tx,ty,r*1.6,[[0,'#fff6c0'],[.25,'#ffb030'],[.6,'#ff4a10'],[1,T0]]);c.fillRect(tx-r*1.6,ty-r*1.6,r*3.2,r*3.2)}
    c.globalAlpha=1;c.fillStyle=rg(c,x,y,R*2.4,[[0,'#ffffff'],[.2,'#fff0a0'],[.45,'#ff9a2a'],[1,T0]]);c.fillRect(x-R*2.4,y-R*2.4,R*4.8,R*4.8);
    if(Math.random()<.12)phys([(x-SR().x)/SR().w,(y-SR().y)/SR().h],'ember',2,{spd:[.05,.2],sz:[.003,.006],life:[.3,.6]})});
  later(dur*1000,()=>{if(o.hit)o.hit();else fireBurst(to,sz)})}
/* 爆炸：火光、火舌、煙柱、火星、焦痕 */
function fireBurst(f,p,lite){p=p||1;flash(f,'#ffb040',.22*p,.35);shock(f,'#ff8a2a',.22*p,.45,.4,{w:.014});flames(f,'#ff5a1a',{n:Math.round(6+p*5),h:.12*p,sp:.06*p,life:.7,gy:GY(f)});
  phys(f,'ember',Math.round(8+p*8),{dir:-PI/2,spread:1.3,spd:[.3,.9],sz:[.004,.008],life:[.6,1.2]});if(!lite)phys(f,'smoke',Math.round(2+p*2),{dir:-PI/2,spread:.7,spd:[.12,.3],sz:[.02,.04],life:[.8,1.3],a:.3,col:'rgba(70,55,50,1)'});
  if(!lite)cel(1.1,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U();c.globalAlpha=(1-k)*.5;c.translate(x,gy);c.scale(1,.25);c.fillStyle=rg(c,0,0,u*.1*p,[[0,'rgba(30,20,15,.9)'],[.6,'rgba(120,40,10,.5)'],[1,T0]]);c.beginPath();c.arc(0,0,u*.1*p,0,7);c.fill()})}
/* 火牆：目標腳下一排火焰升起，熱浪 */
function fireWall(f){for(let i=0;i<6;i++)later(i*55,()=>flames([f[0]+(i-2.5)*.035,f[1]],i%2?'#ff7a2a':'#ff4a10',{n:5,h:.09+Math.random()*.06,sp:.025,life:.95,gy:GY(f)}));later(80,()=>cel(1,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U();ADD(c);c.globalAlpha=Math.sin(PI*k)*.55;c.translate(x,gy);c.scale(1,.3);c.fillStyle=rg(c,0,0,u*.16,[[0,'#ffd27a'],[.4,'#ff6a1a'],[1,T0]]);c.beginPath();c.arc(0,0,u*.16,0,7);c.fill()}));phys(f,'ember',16,{dir:-PI/2,spread:.8,spd:[.3,.9],sz:[.004,.008],life:[.8,1.4]});later(150,()=>flash(f,'#ff8a2a',.2,.5))}
/* 冰：寒氣凝結、冰刺、碎冰 */
function iceSpike(f,p){p=p||1;fog(f,'rgba(200,238,255,.9)',{R:.07*p,a:.25,life:.8,n:6});crystals(f,'#8fdcff',{n:Math.round(4+p*3),h:.11*p,sp:.07*p,life:.8,gy:GY(f)});
  later(120,()=>{flash(f,'#d8f4ff',.14*p,.3);phys(f,'shard',Math.round(6+p*4),{spd:[.5,1.2],sz:[.006,.012],life:[.6,1],ice:1,col:'#9fe2ff'});twinkle(f,'#ffffff',5,{life:.8,sx:.08,sy:.08})})}
function frostBolt(from,to,o){o=o||{};comet(from,to,'#9fe2ff',.012,o.dur||.24,{tail:12,hit:()=>{(o.hit||iceSpike)(to,o.p||.8)}});
  for(let i=0;i<5;i++)later(i*40,()=>phys(from,'shard',1,{dir:Math.atan2(to[1]-from[1],to[0]-from[0]),spread:.3,spd:[.8,1.2],sz:[.003,.005],life:[.2,.3],ice:1,col:'#d8f4ff'}))}
/* 雷：主幹＋分岔，兩次閃光，落點電弧 */
function bolt(f,col,o){o=o||{};col=col||'#fff3a0';let segs=null,last=-1;cel(o.life||.5,(c,k)=>{const [x,y]=P2(f),u=U();if(!segs||k-last>.1){last=k;segs=[];const top=SR().y-8,n=12;let px=x+rnd2(-.04,.04)*u,py=top;const main=[[px,py]];
      for(let i=1;i<=n;i++){const t=i/n,nx=x+(i<n?rnd2(-1,1)*u*.045*(1-t*.5):0),ny=top+(y-top)*t;main.push([nx,ny]);if(i>2&&i<n-1&&Math.random()<.35){const br=[[nx,ny]];let bx=nx,by=ny;for(let j=0;j<3;j++){bx+=rnd2(-1,1)*u*.04+(nx>x?1:-1)*u*.015;by+=u*.03;br.push([bx,by])}segs.push([br,.45])}}segs.unshift([main,1])}
    const vis=k<.14||(k>.2&&k<.42)||(k>.5&&k<.6);if(!vis)return;ADD(c);c.lineJoin='round';c.lineCap='round';
    for(const [pts,wm] of segs){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.shadowColor=col;c.shadowBlur=u*.04;c.strokeStyle=col;c.lineWidth=u*.012*wm;c.stroke();c.shadowBlur=0;c.strokeStyle='#ffffff';c.lineWidth=u*.004*wm;c.stroke()}
    c.fillStyle=rg(c,x,y,u*.12,[[0,'#ffffff'],[.3,col],[1,T0]]);c.globalAlpha=.6;c.fillRect(x-u*.12,y-u*.12,u*.24,u*.24)});
  later(30,()=>{tint('rgba(255,250,210,.35)',.1);flash(f,'#ffffff',.2,.25)});later(260,()=>tint('rgba(255,250,210,.2)',.08));
  later(80,()=>{shock(f,col,.2,.4,.3,{gy:.12});arcs(f,col,.5)})}
/* 小電弧：在目標身上亂竄 */
function arcs(f,col,life){cel(life||.4,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1,u*.003);for(let j=0;j<3;j++){if(Math.random()<.4)continue;let px=x+rnd2(-1,1)*u*.06,py=y+rnd2(-1,1)*u*.07;c.beginPath();c.moveTo(px,py);for(let i=0;i<4;i++){px+=rnd2(-1,1)*u*.025;py+=rnd2(-1,1)*u*.025;c.lineTo(px,py)}c.globalAlpha=1-k;c.stroke()}})}
/* 聖光：光柱、放射光芒 */
function rays(f,col,o){o=o||{};cel(o.life||.7,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*(o.R||.2)*eo(k*2);ADD(c);c.translate(x,y);c.rotate(k*.6);c.globalAlpha=Math.sin(PI*Math.min(1,k*1.2))*.7;
    for(let i=0;i<12;i++){c.rotate(PI/6);const g=c.createLinearGradient(0,0,R,0);g.addColorStop(0,'#ffffff');g.addColorStop(.3,col);g.addColorStop(1,T0);c.fillStyle=g;c.beginPath();c.moveTo(0,-u*.004);c.lineTo(R,-u*(i%2?.006:.012));c.lineTo(R,u*(i%2?.006:.012));c.lineTo(0,u*.004);c.fill()}})}
function holyHit(f,p){p=p||1;column(f,'#ffe68a',{w:.06*p,life:.55});later(120,()=>{rays(f,'#fff3b0',{R:.18*p});flash(f,'#fff6d0',.2*p,.35);debris(f,'holy',p)})}
/* 暗：黑紫煙＋觸手狀的影 */
function shadow(f,p){p=p||1;fog(f,'rgba(40,10,60,1)',{R:.09*p,a:.55,life:1,n:8});swirl(f,'#a060ff',{R:.1*p,life:.8});phys(f,'wisp',Math.round(6+p*4),{spd:[.3,.8],sz:[.005,.009],life:[.6,1],col:'#b080ff'});
  cel(.8,(c,k)=>{const [x,y]=P2(f),u=U(),gy=y+GY(f)*SR().h;c.globalCompositeOperation='source-over';c.lineCap='round';for(let i=0;i<5;i++){const bx=x+(i-2)*u*.035,h=u*.16*p*eo(k*2.5)*(.7+.3*Math.sin(i*3));c.globalAlpha=(k<.6?1:1-(k-.6)/.4)*.8;c.strokeStyle='rgba(30,0,50,.95)';c.lineWidth=u*.012*(1-k*.4);c.beginPath();c.moveTo(bx,gy);
      c.bezierCurveTo(bx+Math.sin(k*8+i)*u*.03,gy-h*.4,bx-Math.sin(k*6+i)*u*.04,gy-h*.8,bx+Math.sin(k*10+i)*u*.02,gy-h);c.stroke();c.strokeStyle='rgba(170,110,255,.6)';c.lineWidth*=.3;ADD(c);c.stroke();c.globalCompositeOperation='source-over'}})}
function darkOrb(from,to,o){o=o||{};comet(from,to,'#9a5aff',.016,o.dur||.3,{arc:.04,tail:14,hit:()=>{(o.hit||(()=>{flash(to,'#c99aff',.16,.3);shadow(to,o.p||.8)}))()}});later(60,()=>phys(from,'wisp',5,{spd:[.2,.5],sz:[.004,.007],life:[.4,.7],col:'#9a5aff'}))}
/* 毒：綠霧翻滾、氣泡、滴落 */
function toxic(f,p){p=p||1;fog(f,'rgba(70,140,30,1)',{R:.1*p,a:.45,life:1.1,n:8,rise:.02});fog(f,'rgba(160,240,90,1)',{R:.07*p,a:.3,life:.9,n:6});
  phys(f,'drop',Math.round(5+p*4),{spd:[.3,.8],sz:[.004,.008],life:[.5,.9],col:'#8be04a'});
  cel(1,(c,k)=>{const [x,y]=P2(f),u=U();for(let i=0;i<8;i++){const t=(k*1.4+i/8)%1,bx=x+Math.sin(i*2.7)*u*.07,by=y+u*.06-t*u*.12,r=u*.008*(.6+Math.sin(i)*.4)*(t<.85?1:1+(t-.85)*8);c.globalAlpha=(t<.85?.8:1-(t-.85)/.15)*(1-k*.5);c.strokeStyle='#c8ff8a';c.lineWidth=1;c.fillStyle='rgba(120,220,60,.35)';c.beginPath();c.arc(bx,by,r,0,7);c.fill();c.stroke()}})}
/* 星火（大魔導士）：星屑與星芒 */
function starBurst(f,p){p=p||1;twinkle(f,'#fff0b0',8,{life:.9,sx:.1*p,sy:.1*p});rays(f,'#ffd27a',{R:.16*p,life:.6});phys(f,'spark',14,{spd:[.6,1.4],sz:[.003,.006],life:[.3,.6],col:'#ffe08a'})}
/* 回復：光點上升＋十字 */
function healFx(f,col,p){p=p||1;auraUp(f,col,{life:.9});cel(1.1,(c,k)=>{const [x,y]=P2(f),u=U(),gy=y+GY(f)*SR().h;ADD(c);for(let i=0;i<7;i++){const t=(k*1.2+i/7)%1,cx=x+Math.sin(i*2.3)*u*.08,cy=gy-t*u*.3,s=u*.012*Math.sin(PI*t);c.globalAlpha=Math.sin(PI*t);c.fillStyle=i%2?'#ffffff':col;c.shadowColor=col;c.shadowBlur=8;c.fillRect(cx-s*.3,cy-s,s*.6,s*2);c.fillRect(cx-s,cy-s*.3,s*2,s*.6)}});twinkle(f,'#ffffff',5,{rise:.12})}
function manaFx(f){auraUp(f,'#6ab0ff',{life:.8});phys(f,'wisp',8,{dir:PI/2,spread:1,spd:[.2,.5],sz:[.004,.007],life:[.5,.9],col:'#8fc8ff'});rune(f,'#6ab0ff',{R:.12,life:.8})}
function shieldFx(f,col,hex){bubble(f,col,{R:.17,life:.9});if(hex)crystals(f,'#bff0ff',{n:5,h:.07,sp:.1,life:.7,gy:GY(f)})}
function guardFx(f,col){cel(.8,(c,k)=>{const [x,y]=P2(f),u=U(),s=u*.07*(.6+eo(k*3)*.4);ADD(c);c.globalAlpha=k<.6?1:1-(k-.6)/.4;c.translate(x+u*.07,y-u*.01);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=10;c.lineWidth=Math.max(1.5,u*.005);
  c.beginPath();c.moveTo(0,-s);c.lineTo(s*.8,-s*.6);c.lineTo(s*.7,s*.3);c.lineTo(0,s);c.lineTo(-s*.7,s*.3);c.lineTo(-s*.8,-s*.6);c.closePath();c.stroke();c.globalAlpha*=.25;c.fillStyle=col;c.fill();
  const sw=-s+((k*2)%1)*s*2.4;c.globalAlpha=(k<.6?1:1-(k-.6)/.4)*.9;c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,u*.003);c.beginPath();c.moveTo(-s*.7,sw);c.lineTo(s*.7,sw-s*.4);c.stroke()});shock(f,col,.14,.4)}

/* ================= 技能配方 ================= */
const CJ={J01:'sword',J02:'mage',J03:'ranger',J04:'cleric',J05:'knight',J06:'axe',J07:'star',J08:'warlock',J09:'sniper',J10:'dagger',J11:'bishop',J12:'hammer',J13:'dual'};
/* 依效果決定顏色與附加效果 */
const tagS=x=>Array.isArray(x.tags)?x.tags.join(','):String(x.tags||'');
function look(x){const t=tagS(x)+','+(x.fx||'');
  if(/流血|BLEED|裂傷|血刃/.test(t+x.n))return['#ff3a4a','blood'];if(/減速|SLOW|FROST|斷筋/.test(t+x.n))return['#7fd3ff','frost'];if(/破甲|ARMOR/.test(t))return['#ffa040','armor'];
  if(/中毒|POISON|毒/.test(t+x.n))return['#8be04a','poison'];if(/治療|吸血/.test(t+x.n))return['#ff4a6a','blood'];if(/迴避|閃/.test(t+x.n))return['#7ff0e0','spark'];if(/連擊/.test(t))return['#9fd8ff','spark'];
  if(/格擋|防禦/.test(t))return['#8fc8ff','spark'];if(/反擊/.test(x.n))return['#ff8a4a','spark'];if(/追/.test(x.n))return['#d8a0ff','spark'];return['#cfe6ff','spark']}
const AOE=k=>SK[k]&&(SK[k].tg==='雙體'||SK[k].tg==='全體');
/* 每個配方回傳 {v:畫面, s:音效}；音效時間和畫面對齊 */
function recipe(k){const x=SK[k];if(!x||!x.act)return null;const j=CJ[k.slice(0,3)],n=x.n,[col,ef]=look(x),aoe=AOE(k),dmg=!!x.dmg||/直接傷害/.test(tagS(x)),heal=!!x.heal||!dmg&&/治療/.test(tagS(x));
  const R=(v,s,el)=>({v,s,el});
  /* ---------- 自身、增益 ---------- */
  if(!dmg&&!heal){
    if(/冰盾/.test(n))return R(()=>{castPose('me');shieldFx(H,'#9fe2ff',1);iceSpike(H,.5)},()=>{SN.frost(.1);SN.shield(.2)});
    if(/暗盾/.test(n))return R(()=>{castPose('me');shadow(H,.6);later(150,()=>shieldFx(H,'#a060ff'))},()=>{SN.drone(0,.5);SN.shield(.25)});
    if(/聖盾|魔盾/.test(n))return R(()=>{castPose('me');rune(H,/聖/.test(n)?'#ffd34a':'#8fa8ff',{R:.15,life:.9});later(150,()=>shieldFx(H,/聖/.test(n)?'#ffe27a':'#a8b8ff'))},()=>{SN.chime(0,/聖/.test(n)?1047:784);SN.shield(.2)});
    if(/魔力/.test(n))return R(()=>{castPose('me');manaFx(H)},()=>SN.mana(.05));
    if(/淨化/.test(n))return R(()=>{castPose('me');column(H,'#cfeeff',{w:.08,life:.7});later(120,()=>{rays(H,'#ffffff',{R:.16});twinkle(H,'#ffffff',8,{rise:.12})})},()=>{SN.bell(0,1568);SN.chime(.15,1047)});
    if(/守|堅守|光之守護|守護/.test(n))return R(()=>{castPose('me');guardFx(H,/光|守護/.test(n)?'#ffe27a':'#8fc8ff')},()=>SN.guard(.05));
    if(/瞄準/.test(n))return R(()=>{castPose('me');reticle(F,'#ff5a5a',.9);charge(H,'#9fe8ff',{R:.06,life:.4})},()=>{SN.charge(0,.3);tone2()});
    if(/怒吼/.test(n))return R(()=>{auraUp(H,'#ff3a2a',{w:.13,life:.9});later(60,()=>{shock(H,'#ff5a3a',.3,.5);shock(H,'#ff8a4a',.42,.6)});tint('rgba(200,20,0,.18)',.3)},()=>{SN.roar(0,.6,.5);SN.boom(.05,.4)});
    return R(()=>{castPose('me');auraUp(H,col)},()=>SN.up(0))}
  /* ---------- 治療 ---------- */
  if(heal&&!dmg){const g=/大|黎明/.test(n)?1.3:1;return R(()=>{castPose('me');if(/黎明/.test(n))rays(H,'#ffe8a0',{R:.2,life:.9});healFx(H,'#7fe08a',g)},()=>SN.heal(.05))}
  /* ---------- 傷害技 ---------- */
  const T=aoe?null:F;const each=(fn,gap)=>{const pts=aoePts(k);pts.forEach((p,i)=>later(i*(gap||70),()=>fn(p,i)))};
  const melee=lunge.bind(null,'me',30);
  /* 斬擊系（劍、雙劍、騎士劍、匕首） */
  if(j==='sword'||j==='dual'||j==='knight'&&!/盾/.test(n)||j==='dagger'&&!/飛刃|毒針/.test(n)){
    const thin=j==='dagger',dual=j==='dual';
    if(/旋風/.test(n))return R(()=>{melee();each((p)=>{for(let i=0;i<3;i++)later(i*80,()=>blade(p,i*PI/3+.3,.3,col,{w:.008,life:.24}));later(240,()=>{shock(p,col,.16,.35,.4);edgeFx(p,0,'spark',col)})},40)},()=>{for(let i=0;i<3;i++)SN.swish(.12+i*.09,.8,1);SN.ring(.4,1900,.06,.3);SN.thud(.42,.3)},'slash');
    if(aoe)return R(()=>{melee();const pts=aoePts(k);blade([.5,(pts.reduce((a,p)=>a+p[1],0)/pts.length)],-.06,.95,col,{w:.012,life:.34,bend:.02});pts.forEach((p,i)=>later(60+i*40,()=>{scar(p,-.06,.25,col);edgeFx(p,-.06,ef,col);spark(p,'#ffffff',.06,6,.18)}));if(dual)later(110,()=>blade([.5,(pts.reduce((a,p)=>a+p[1],0)/pts.length)+.03],.06,.95,'#ffffff',{w:.008,life:.28,bend:-.02}))},()=>{SN.swish(.1,1.3,1);SN.ring(.18,2000,.07,.3);if(dual)SN.swish(.22,1,1)},'slash');
    if(/蓄力/.test(n))return R(()=>{charge(H,'#ffe27a',{R:.12,life:.4});later(260,()=>{melee();tint('rgba(255,240,200,.25)',.12);slashOn(F,-.6,'#ffe27a',{L:.5,w:.02,life:.4,ef:'spark'});later(60,()=>{flash(F,'#ffffff',.28,.35);shock(F,'#ffe27a',.3,.5,.4)})})},()=>{SN.charge(0,.3);SN.swish(.35,1.5);SN.ring(.42,1500,.12,.6);SN.boom(.45,.5)},'slash');
    if(/反擊/.test(n))return R(()=>{melee();slashOn(F,-.8,col,{ef:'spark'});later(90,()=>slashOn(F,.8,'#ffffff',{w:.008,ef:false}))},()=>{SN.cut(.12,2300);SN.cut(.22,2600)},'slash');
    if(/閃/.test(n))return R(()=>{wind(H,'#c8fff6',{dir:1,n:5,life:.35});melee();slashOn(F,-.15,col,{L:.42,ef:'spark',bend:.01});afterimg(F,-.15,col,3)},()=>{SN.wind(0);SN.cut(.14,2500)},'slash');
    if(/連擊|雙月|交錯|雙刃|重雙/.test(n)||dual){const m=/重雙/.test(n)?4:/連擊|疾風/.test(n)?4:2;return R(()=>{melee();for(let i=0;i<m;i++)later(i*85,()=>slashOn([F[0]+rnd2(-.02,.02),F[1]+rnd2(-.03,.03)],(i%2?.7:-.7)+rnd2(-.15,.15),i%2?'#ffffff':col,{w:i%2?.008:.011,ef:i===m-1?ef:false,flip:i%2}));if(/重雙/.test(n))later(m*85,()=>{flash(F,'#ffffff',.2,.3);shock(F,col,.24,.45)})},()=>{for(let i=0;i<m;i++)SN.cut(.12+i*.085,2000+i*250)},'slash')}
    if(thin)return R(()=>{melee();if(/背刺|影/.test(n))later(0,()=>{shadow([F[0]+.02,F[1]],.4)});slashOn(F,-.35,col,{L:.26,w:.007,ef,life:.24});later(70,()=>blade(F,.35,.22,'#ffffff',{w:.005,life:.2}));if(/致命/.test(n))later(140,()=>{tint('rgba(120,0,20,.25)',.15);flash(F,'#ff4a5a',.2,.3)})},()=>{SN.swish(.1,.7,1);SN.cut(.13,2800);if(ef==='poison')SN.hiss(.2,.3);if(/致命/.test(n))SN.thud(.25,.6)},ef==='poison'?'poison':'slash');
    const ang=/斷筋/.test(n)?.15:/裂傷|血/.test(n)?-.9:-.55;
    return R(()=>{melee();slashOn(F,ang,col,{L:j==='knight'?.36:.34,w:.012,ef});if(/追/.test(n))later(90,()=>blade(F,-ang,.28,'#ffffff',{w:.007,life:.22}))},()=>{SN.cut(.12,j==='knight'?1700:2100);if(ef==='blood')SN.splat(.2);if(ef==='frost')SN.frost(.18);if(ef==='armor')SN.ring(.18,900,.08,.4);if(/追/.test(n))SN.cut(.21,2500)},'slash')}
  /* 斧（狂戰士）：粗重的弧線，地面裂開 */
  if(j==='axe'){
    if(/旋風/.test(n))return R(()=>{melee();each(p=>{for(let i=0;i<2;i++)later(i*110,()=>blade(p,i?2.6:-.5,.4,'#ff7a4a',{w:.018,life:.3,bend:.12}));later(220,()=>smash(p,'#ff8a5a',{p:.7}))},50)},()=>{SN.heavy(.1);SN.heavy(.22);SN.thud(.35,.5)},'slash');
    if(aoe)return R(()=>{melee();const pts=aoePts(k);blade([.5,pts.reduce((a,p)=>a+p[1],0)/pts.length],.05,1,'#ff7a4a',{w:.02,life:.38,bend:.04});pts.forEach((p,i)=>later(80+i*40,()=>{scar(p,.05,.3,'#ff7a4a');phys(p,'chunk',4,{spd:[.4,1],sz:[.005,.01],life:[.6,1]})}))},()=>{SN.heavy(.12)},'slash');
    const hv=/重|裂地/.test(n);return R(()=>{melee();slashOn(F,PI/2-.2,/血|吸血|嗜血/.test(n)?'#ff3a4a':'#ff8a4a',{L:.42,w:.022,bend:.08,ef:/血/.test(n)?'blood':ef==='armor'?'armor':false});later(90,()=>smash(F,'#ff9a5a',{p:hv?1.2:.8,crack:hv}));if(/吸血|嗜血/.test(n))later(200,()=>multi(4,60,()=>comet([F[0]+rnd2(-.04,.04),F[1]],H,'#ff4a6a',.008,.35,{arc:rnd2(-.08,.08),hit:false})))},
      ()=>{SN.heavy(.1);if(hv)SN.boom(.22,.5);if(/血/.test(n))SN.splat(.22);if(/吸血|嗜血/.test(n))SN.heal(.5)},'slash')}
  /* 鈍擊（騎士盾、聖殿騎士錘） */
  if(j==='hammer'||j==='knight'){const holy=j==='hammer',c2=holy?'#ffe27a':'#b8d8ff';
    if(aoe)return R(()=>{hopOr();each(p=>smash(p,c2,{p:.8,crack:/地震/.test(n)}),60);if(/地震/.test(n))tint('rgba(120,90,40,.15)',.25);if(holy)later(80,()=>shock(F,'#fff3b0',.5,.6,.25,{gy:.12}))},()=>{SN.blunt(.15);if(/地震/.test(n))SN.boom(.2,.6);if(/盾震/.test(n))SN.frost(.25)},'rock');
    return R(()=>{melee();if(holy)later(40,()=>column(F,'#ffe68a',{w:.04,life:.35}));later(90,()=>smash(F,c2,{p:/重|衝|破陣/.test(n)?1.2:.9,crack:/重|裁決/.test(n)}));if(ef==='armor')later(110,()=>edgeFx(F,0,'armor',c2));if(/治療/.test(n))later(220,()=>healFx(H,'#ffe27a',.7));if(/盾/.test(n))later(60,()=>guardFx(F,'#cfe6ff'))},
      ()=>{SN.blunt(.15);if(holy)SN.bell(.18,1175);if(ef==='armor')SN.ring(.2,700,.08,.5);if(/治療/.test(n))SN.heal(.35)},holy?'holy':'rock')}
  /* 射擊（遊俠、神射手） */
  if(j==='ranger'||j==='sniper'){const fl=ef==='poison'?'#8be04a':ef==='armor'?'#ffb04a':ef==='frost'?'#9fe2ff':j==='sniper'?'#ff6a6a':'#f0e6c8',hc=ef==='poison'?'#8be04a':ef==='armor'?'#ffb04a':'#ffffff';
    const hitK=p=>()=>{pierceHit(p,hc);if(ef==='poison')toxic(p,.6);if(ef==='armor')edgeFx(p,0,'armor',hc);if(ef==='frost')iceSpike(p,.5)};
    if(/箭雨/.test(n))return R(()=>{castPose('me');dart(HP0(),[HP0()[0]+.05,-.2],{dur:.15,col:'#ffffff',fl,hit:()=>{}});each(p=>multi(6,45,()=>{const t=[p[0]+rnd2(-.05,.05),p[1]+rnd2(-.02,.06)];dart([t[0]-.06,-.12],t,{dur:.22,col:'#ffffff',fl,hit:()=>pierceHit(t,'#ffffff')})}),40)},()=>{SN.bow(0);SN.zip(.05,.18);for(let i=0;i<6;i++)SN.zip(.3+i*.05,.12);SN.thunk(.5)},'pierce');
    if(aoe)return R(()=>{castPose('me');aoePts(k).forEach((p,i)=>later(i*30,()=>dart(HP0(),p,{dur:.22,col:'#ffffff',fl,hit:hitK(p)})))},()=>{SN.bow(0);for(let i=0;i<3;i++)SN.zip(.02+i*.03,.2);SN.thunk(.26)},'pierce');
    const strong=/強弓|貫星|狙擊|穿林/.test(n),snipe=/狙擊/.test(n);
    return R(()=>{castPose('me');if(snipe){reticle(F,'#ff4a4a',.45);tint('rgba(0,0,0,.25)',.35)}const go=()=>{dart(HP0(),F,{dur:strong?.19:.24,col:strong?'#fff6c8':'#ffffff',fl,sz:strong?1.3:1,hit:()=>{hitK(F)();if(strong){streak(F,[F[0]+.2,F[1]-.02],'#ffffff',{w:.02,life:.25});flash(F,'#ffffff',.16,.25)}if(/獵|追獵/.test(n))reticle(F,'#ff5a5a',.6)}});if(/後撤/.test(n))wind(H,'#e8f6ff',{dir:-1,n:4})};snipe?later(320,go):go()},
      ()=>{const t0=snipe?.32:0;if(snipe)SN.charge(0,.3);SN.bow(t0);SN.zip(t0+.02,strong?.19:.24);SN.thunk(t0+(strong?.2:.25));if(strong)SN.boom(t0+.21,.25);if(ef==='poison')SN.hiss(t0+.2,.3)},'pierce')}
  /* 投擲（刺客飛刃、毒針） */
  if(j==='dagger')return R(()=>{castPose('me');const nd=/毒針/.test(n);each(p=>multi(nd?3:2,60,i=>dart([HP0()[0],HP0()[1]+(i-1)*.02],[p[0],p[1]+(i-1)*.02],{dur:.24,type:nd?'needle':'knife',spin:!nd,col:nd?'#8be04a':'#e8eef6',fl:nd?'#8be04a':'#b03040',hit:()=>{pierceHit(p,nd?'#8be04a':'#ffffff');if(nd)toxic(p,.5)}})),30)},()=>{for(let i=0;i<3;i++)SN.zip(.02+i*.06,.2);SN.thunk(.28);if(/毒針/.test(n))SN.hiss(.25,.3)},'pierce');
  /* 火系（法師、大魔導士） */
  const fire=/火|炎|星火/.test(n),ice=/冰|寒/.test(n),thun=/雷/.test(n);
  if(j==='mage'||j==='star'){const star=j==='star';
    if(fire&&/雨|風暴/.test(n))return R(()=>{castPose('me');rune(F,'#ff6a1a',{R:.16,life:.8});each(p=>{multi(4,70,i=>{const t=[p[0]+rnd2(-.04,.04),p[1]+rnd2(-.02,.04)];fireball([t[0]+.08,-.12],t,{dur:.26,sz:.6,arc:0,hit:()=>fireBurst(t,.5,i<3)})})},50);if(/風暴/.test(n))later(250,()=>swirl(F,'#ff8a2a',{R:.16,life:.8}))},()=>{SN.ignite(0);for(let i=0;i<4;i++)SN.roar(.25+i*.07,.4,.3);SN.boom(.4,.5)},'fire');
    if(fire&&/牆/.test(n))return R(()=>{castPose('me');rune(F,'#ff6a1a',{R:.14,life:.6});later(120,()=>fireWall(F))},()=>{SN.ignite(0);SN.roar(.12,1,.5)},'fire');
    if(fire&&/蓄力|大炎爆/.test(n+tagS(x)))return R(()=>{castPose('me');charge(HP0(),'#ff8a2a',{R:.1,life:.45});later(250,()=>fireball(HP0(),F,{dur:.4,sz:2,hit:()=>{fireBurst(F,1.6);tint('rgba(255,140,40,.3)',.25);shock(F,'#ffe08a',.45,.6,.35)}}))},()=>{SN.charge(0,.4);SN.ignite(.25);SN.boom(.68,.9);SN.roar(.7,1,.5)},'fire');
    if(fire)return R(()=>{castPose('me');charge(HP0(),'#ff8a2a',{R:.06,life:.25});later(120,()=>fireball(HP0(),F,{sz:/大|星火爆裂|炎爆/.test(n)?1.4:1,hit:()=>{fireBurst(F,/大|爆/.test(n)?1.2:.9);if(star)starBurst(F,.7)}}))},()=>{SN.ignite(0);SN.roar(.15,.35,.3);SN.boom(.47,.55);if(star)SN.star(.5)},'fire');
    if(ice&&aoe)return R(()=>{castPose('me');each(p=>{fog(p,'rgba(200,238,255,.9)',{R:.09,a:.25,life:1,n:7});later(150,()=>iceSpike(p,.7))},70);tint('rgba(180,230,255,.15)',.3)},()=>{SN.wind(0);SN.frost(.2);SN.shatter(.4)},'ice');
    if(ice)return R(()=>{castPose('me');frostBolt(HP0(),F,{p:1})},()=>{SN.frost(0);SN.zip(.05,.2);SN.shatter(.3)},'ice');
    if(thun)return R(()=>{castPose('me');later(80,()=>bolt(F,'#fff3a0'));if(/爆/.test(n))later(200,()=>{shock(F,'#fff3a0',.3,.5);arcs(F,'#fff3a0',.6)})},()=>{SN.zap(.08);SN.crackle(.2,.4)},'thunder');
    return R(()=>{castPose('me');comet(HP0(),F,star?'#ffe08a':'#b98aff',.014,.26,{arc:.04,tail:12,hit:()=>{flash(F,star?'#fff0b0':'#d8b8ff',.14,.25);star?starBurst(F,.6):phys(F,'spark',10,{spd:[.5,1.1],sz:[.003,.006],life:[.2,.4],col:'#d8b8ff'})}})},()=>{SN.zip(0,.2);star?SN.star(.25):SN.ring(.25,1200,.05,.3);SN.thud(.27,.25)},star?'holy':'dark')}
  /* 咒術師：暗、毒、吸取 */
  if(j==='warlock'){
    if(/毒霧/.test(n))return R(()=>{castPose('me');each(p=>toxic(p,1),60)},()=>{SN.hiss(0,.8);SN.bubble(.2,7)},'poison');
    if(aoe)return R(()=>{castPose('me');ray(HP0(),F,'#7a3aff',.03,.5,{wavy:true});each(p=>later(150,()=>shadow(p,.8)),60)},()=>{SN.drone(0,.6);SN.whisper(.1)},'dark');
    if(/吸血|噬魂/.test(n))return R(()=>{castPose('me');darkOrb(HP0(),F,{p:.7});later(380,()=>{ray(F,HP0(),'#ff4a8a',.012,.5,{wavy:true});multi(5,60,()=>comet([F[0]+rnd2(-.03,.03),F[1]+rnd2(-.03,.03)],H,'#ff6a9a',.008,.35,{arc:rnd2(-.08,.08),hit:false}))})},()=>{SN.whisper(0);SN.drone(.1,.5);SN.heal(.6)},'dark');
    if(/弱化|重咒/.test(n))return R(()=>{castPose('me');rune(F,'#7a3aaa',{R:.14,life:.9});later(250,()=>{shadow(F,1);downArrows(F,'#b88aff')})},()=>{SN.drone(0,.8);SN.down(.3)},'dark');
    return R(()=>{castPose('me');darkOrb(HP0(),F,{p:/腐蝕/.test(n)?.9:.7,hit:/腐蝕/.test(n)?()=>{shadow(F,.8);corrodeDrip(F)}:null})},()=>{SN.whisper(0);SN.drone(.15,.5);if(/腐蝕/.test(n))SN.hiss(.35,.5)},'dark')}
  /* 聖職（神官、主教） */
  if(j==='cleric'||j==='bishop'){
    if(/光雨/.test(n))return R(()=>{castPose('me');each(p=>multi(5,70,()=>{const t=[p[0]+rnd2(-.05,.05),p[1]+rnd2(-.02,.05)];comet([t[0]+.03,-.1],t,'#ffe68a',.009,.22,{lin:true,tail:8,hit:()=>{flash(t,'#fff6d0',.07,.2);twinkle(t,'#ffffff',2,{life:.4})}})}),40)},()=>{for(let i=0;i<5;i++)SN.bell(.15+i*.07,1568+i*120);SN.chime(.5,1047)},'holy');
    if(aoe)return R(()=>{castPose('me');rays(H,'#fff3b0',{R:.15,life:.4});later(120,()=>shock([.55,F[1]],'#ffe68a',.6,.6,.35));each(p=>later(150,()=>{flash(p,'#fff6d0',.15,.3);debris(p,'holy',.7)}),50)},()=>{SN.chime(0,880);SN.boom(.2,.25)},'holy');
    if(/強光/.test(n))return R(()=>{castPose('me');later(100,()=>{tint('rgba(255,255,240,.6)',.25);rays(F,'#ffffff',{R:.3,life:.6});flash(F,'#ffffff',.35,.4)})},()=>{SN.chime(0,1319);SN.bell(.1,2093)},'holy');
    if(/聖印|審判/.test(n))return R(()=>{castPose('me');comet(HP0(),F,'#ffe68a',.014,.26,{arc:.03,hit:()=>{holyHit(F,.9);sigil(F,/審判/.test(n)?'#ffffff':'#ffd34a',1)}})},()=>{SN.zip(0,.2);SN.bell(.27,1047);SN.chime(.3,784)},'holy');
    if(/聖光斬|聖光擊/.test(n))return R(()=>{castPose('me');later(60,()=>{blade(F,PI/2,.4,'#ffe68a',{w:.016,life:.35,bend:.02});later(60,()=>holyHit(F,1))})},()=>{SN.cut(.06,2600);SN.bell(.15,1175)},'holy');
    return R(()=>{castPose('me');comet(HP0(),F,'#ffe68a',.014,.26,{arc:.03,hit:()=>{flash(F,'#fff6d0',.14,.25);twinkle(F,'#ffffff',4,{life:.5,sx:.06,sy:.06});debris(F,'holy',.6)}})},()=>{SN.zip(0,.2);SN.bell(.27,1319)},'holy')}
  return null}
function hopOr(){try{K.hop('me')}catch(e){}}
/* 準星 */
function reticle(f,col,life){cel(life||.6,(c,k)=>{const [x,y]=P2(f),u=U(),r=u*.07*(1.6-eo(k*3)*.6);ADD(c);c.globalAlpha=k<.8?1:1-(k-.8)/.2;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1,u*.003);c.translate(x,y);c.rotate(k*1.5);c.beginPath();c.arc(0,0,r,0,7);c.stroke();
  for(let i=0;i<4;i++){c.rotate(PI/2);c.beginPath();c.moveTo(r*.55,0);c.lineTo(r*1.3,0);c.stroke()}c.fillStyle=col;c.beginPath();c.arc(0,0,Math.max(1.5,u*.004),0,7);c.fill()})}
function tone2(){SN.ring(.3,3000,.04,.2)}
function downArrows(f,col){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1.5,u*.005);c.lineCap='round';for(let i=0;i<3;i++){const t=(k*1.3+i/3)%1,yy=y-u*.08+t*u*.14,xx=x+(i-1)*u*.05;c.globalAlpha=Math.sin(PI*t);c.beginPath();c.moveTo(xx-u*.015,yy-u*.012);c.lineTo(xx,yy);c.lineTo(xx+u*.015,yy-u*.012);c.stroke()}})}
function upArrows(f,col){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1.5,u*.005);c.lineCap='round';for(let i=0;i<3;i++){const t=(k*1.3+i/3)%1,yy=y+u*.06-t*u*.16,xx=x+(i-1)*u*.05;c.globalAlpha=Math.sin(PI*t);c.beginPath();c.moveTo(xx-u*.015,yy+u*.012);c.lineTo(xx,yy);c.lineTo(xx+u*.015,yy+u*.012);c.stroke()}})}
function corrodeDrip(f){phys(f,'drop',8,{spd:[.2,.6],sz:[.004,.008],life:[.6,1],col:'#7a2ab0'});fog(f,'rgba(90,30,120,1)',{R:.06,a:.4,life:.9,n:5,rise:.03})}
/* 頭頂符印（聖印、審判印） */
function sigil(f,col,life){cel(life||1,(c,k)=>{const [x,y]=P2(f),u=U(),cy=y-u*.13,s=u*.035*eo(k*4);ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=10;c.lineWidth=Math.max(1.5,u*.004);c.translate(x,cy);c.rotate(k*1.2);c.beginPath();c.arc(0,0,s,0,7);c.stroke();c.beginPath();c.moveTo(0,-s*.7);c.lineTo(0,s*.7);c.moveTo(-s*.7,0);c.lineTo(s*.7,0);c.stroke()})}

/* ================= 接到現有流程 ================= */
const RC={};const getR=k=>k in RC?RC[k]:(RC[k]=recipe(k));
/* 依配方的屬性選擇命中碎屑 */
const ELN={slash:'slash_white',fire:'fire_burst',ice:'ice_shatter',thunder:'lightning_strike',holy:'holy_burst',dark:'dark_burst',poison:'poison_cloud',pierce:'impact_hit',rock:'rock_burst'};
const _me=PFX.me,_hf=PFX.heroFxn;
PFX.me=function(fx){const r=fx&&fx.skill&&getR(fx.skill);if(!r)return _me.call(this,fx);
  /* 蓄力技第一下：只播聚氣 */
  if(fx.d==null&&typeof FX7!=='undefined'&&FX7[fx.skill]&&FX7[fx.skill].charge){SN.charge(0,.5);if(reduce())return;run();locate();charge(H,/炎|火/.test(SK[fx.skill].n)?'#ff8a2a':'#ffe27a',{R:.12,life:.6});auraUp(H,/炎|火/.test(SK[fx.skill].n)?'#ff6a2a':'#ffe27a',{life:.7});return}try{r.s()}catch(e){}if(reduce())return;run();locate();try{r.v()}catch(e){window.__fxe=(window.__fxe||[]).concat(String(e)).slice(-5)}};
PFX.heroFxn=function(fx){const r=fx&&fx.skill&&getR(fx.skill);return r&&r.el?ELN[r.el]||'impact_hit':_hf.call(this,fx)};
/* 舊的施放音效改由配方處理（畫面和聲音對齊） */
if(typeof playSkillSfx==='function'){const _ps=playSkillSfx;playSkillSfx=function(id,k){if(getR(id))return;return _ps(id,k)}}

/* ================= 狀態：施加、持續、跳傷 ================= */
/* 每種狀態：顏色、施加特效、音效。相同類型共用骨架但細節不同 */
const STV={
  BURN:{c:'#ff7a2a',on:f=>{flames(f,'#ff5a1a',{n:6,h:.1,sp:.05,life:.6,gy:GY(f)});phys(f,'ember',8,{dir:-PI/2,spread:1,spd:[.2,.6],sz:[.004,.007],life:[.6,1]})},s:t=>SN.ignite(t)},
  SCORCH:{c:'#d8602a',on:f=>{phys(f,'smoke',5,{dir:-PI/2,spread:.6,spd:[.1,.2],sz:[.02,.03],life:[.8,1.2],a:.4,col:'rgba(70,50,40,1)'})},s:t=>SN.hiss(t,.3)},
  POISON:{c:'#8be04a',on:f=>toxic(f,.6),s:t=>SN.bubble(t,5)},
  CORRODE:{c:'#a050e0',on:f=>corrodeDrip(f),s:t=>{SN.hiss(t,.5);SN.drone(t,.3)}},
  BLEED:{c:'#ff3046',on:f=>edgeFx(f,0,'blood'),s:t=>SN.splat(t)},
  FROST:{c:'#8fdcff',on:f=>iceSpike(f,.5),s:t=>SN.frost(t)},
  CHILL:{c:'#bfe8ff',on:f=>fog(f,'rgba(200,238,255,.9)',{R:.07,a:.4,life:.8,n:6}),s:t=>SN.frost(t)},
  SLOW:{c:'#7fb8ff',on:f=>{downArrows(f,'#7fb8ff');clockRing(f,'#9fc8ff')},s:t=>SN.down(t)},
  ROOT:{c:'#8bc85a',on:f=>K.vine(f,'#8bc85a',{life:.9}),s:t=>SN.thud(t,.3)},
  SHOCK:{c:'#fff17a',on:f=>arcs(f,'#fff17a',.7),s:t=>SN.crackle(t,.35)},
  WEAK:{c:'#b88aff',on:f=>downArrows(f,'#b88aff'),s:t=>SN.down(t)},
  ARMOR:{c:'#ffa040',on:f=>{edgeFx(f,0,'armor','#ffa040');brokenShield(f,'#ffb060')},s:t=>SN.ring(t,700,.09,.5)},
  RESIST:{c:'#6ab0ff',on:f=>brokenShield(f,'#8fc8ff'),s:t=>SN.ring(t,1100,.07,.4)},
  VULN:{c:'#ff4a6a',on:f=>reticle(f,'#ff4a6a',.7),s:t=>SN.down(t)},
  EXPOSE:{c:'#ff8a8a',on:f=>reticle(f,'#ff8a8a',.6),s:t=>SN.down(t)},
  MARK:{c:'#ff5a5a',on:f=>reticle(f,'#ff5a5a',.9),s:t=>SN.ring(t,2600,.05,.3)},
  BLIND:{c:'#c8c8c8',on:f=>{fog([f[0],f[1]-.05],'rgba(40,40,50,1)',{R:.05,a:.6,life:.9,n:6});flash(f,'#ffffff',.1,.2)},s:t=>SN.whisper(t)},
  SEAL:{c:'#ffd34a',on:f=>sigil(f,'#ffd34a',1.1),s:t=>SN.bell(t,1047)},
  JUDGE:{c:'#ffffff',on:f=>{sigil(f,'#ffffff',1.1);rays(f,'#fff3b0',{R:.1,life:.5})},s:t=>{SN.bell(t,1319);SN.bell(t+.12,988)}},
  STUN:{c:'#ffe45a',on:f=>twinkle([f[0],f[1]-.1],'#ffe45a',4,{life:.7,sx:.06,sy:.02}),s:t=>SN.star(t)},
  SILENCE:{c:'#9a9ab8',on:f=>sigil(f,'#9a9ab8',.8),s:t=>SN.down(t)},
  CURSE:{c:'#7a3aaa',on:f=>shadow(f,.4),s:t=>SN.drone(t,.4)},HEX:{c:'#9a5aff',on:f=>shadow(f,.4),s:t=>SN.drone(t,.4)},FEAR:{c:'#6a2a8a',on:f=>shadow(f,.5),s:t=>SN.whisper(t)},
  WOUND:{c:'#c03040',on:f=>edgeFx(f,0,'blood'),s:t=>SN.splat(t)},DRAIN:{c:'#6ab0ff',on:f=>phys(f,'wisp',6,{spd:[.3,.6],sz:[.004,.007],life:[.5,.8],col:'#6ab0ff'}),s:t=>SN.down(t)},
  FATIGUE:{c:'#a0a0a0',on:f=>downArrows(f,'#a0a0a0'),s:t=>SN.down(t)},SAPPED:{c:'#808080',on:f=>downArrows(f,'#909090'),s:t=>SN.down(t)},
  /* 增益 */
  SHIELD:{c:'#9fd8ff',on:f=>shieldFx(f,'#9fd8ff'),s:t=>SN.shield(t),good:1},
  GUARD:{c:'#8fc8ff',on:f=>guardFx(f,'#8fc8ff'),s:t=>SN.guard(t),good:1},
  HARDEN:{c:'#c8b080',on:f=>guardFx(f,'#d8c090'),s:t=>SN.guard(t),good:1},WARD:{c:'#b8a0ff',on:f=>guardFx(f,'#c8b0ff'),s:t=>SN.shield(t),good:1},
  BLOCKUP:{c:'#cfe6ff',on:f=>guardFx(f,'#cfe6ff'),s:t=>SN.guard(t),good:1},
  RAGE:{c:'#ff3a2a',on:f=>auraUp(f,'#ff3a2a',{life:.7}),s:t=>SN.roar(t,.4,.35),good:1},
  FOCUS:{c:'#7ff0ff',on:f=>{charge(f,'#7ff0ff',{R:.07,life:.4})},s:t=>SN.charge(t,.25),good:1},
  HASTE:{c:'#ffe45a',on:f=>{wind(f,'#fff3a0',{dir:1,n:5,life:.5});upArrows(f,'#ffe45a')},s:t=>SN.wind(t),good:1},
  EVAUP:{c:'#7ff0e0',on:f=>wind(f,'#c8fff6',{dir:-1,n:6,life:.5}),s:t=>SN.wind(t),good:1},
  COMBOUP:{c:'#9fd8ff',on:f=>{wind(f,'#cfeeff',{dir:1,n:4,life:.4});upArrows(f,'#9fd8ff')},s:t=>SN.up(t),good:1},
  REGEN:{c:'#7fe08a',on:f=>healFx(f,'#7fe08a',.6),s:t=>SN.heal(t),good:1},MEND:{c:'#a8f0b0',on:f=>healFx(f,'#a8f0b0',.5),s:t=>SN.heal(t),good:1},
  THORN:{c:'#a0d060',on:f=>crystals(f,'#a0d060',{n:5,h:.06,sp:.08,life:.6,gy:GY(f)}),s:t=>SN.ring(t,900,.05,.3),good:1},
  FORTIFY:{c:'#ffb0a0',on:f=>upArrows(f,'#ffb0a0'),s:t=>SN.up(t),good:1},CLARITY:{c:'#a0d8ff',on:f=>upArrows(f,'#a0d8ff'),s:t=>SN.up(t),good:1},KEEN:{c:'#ffd08a',on:f=>upArrows(f,'#ffd08a'),s:t=>SN.up(t),good:1},ARCANE:{c:'#c8a0ff',on:f=>upArrows(f,'#c8a0ff'),s:t=>SN.up(t),good:1},
  IMMUNE:{c:'#ffffff',on:()=>{},s:()=>{},quiet:1},TAKEUP:{c:'#ff6a5a',on:f=>auraUp(f,'#ff6a5a',{life:.5}),s:t=>SN.down(t)},POST:{c:'#fff',on:()=>{},s:()=>{},quiet:1}};
function brokenShield(f,col){cel(.8,(c,k)=>{const [x,y]=P2(f),u=U(),s=u*.05;ADD(c);c.globalAlpha=k<.5?1:1-(k-.5)/.5;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1.5,u*.004);c.translate(x,y-u*.12);
  const sp=eo(Math.max(0,k-.25)*3)*s*.4;for(const sg of [-1,1]){c.save();c.translate(sg*sp,sp*.5);c.rotate(sg*sp/s*.6);c.beginPath();c.moveTo(0,-s);c.lineTo(sg*s*.8,-s*.6);c.lineTo(sg*s*.7,s*.3);c.lineTo(0,s);c.lineTo(sg*s*.1,s*.2);c.lineTo(-sg*s*.08,-s*.2);c.closePath();c.stroke();c.restore()}})}
function clockRing(f,col){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U(),r=u*.05;ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1,u*.003);c.translate(x,y-u*.13);c.beginPath();c.arc(0,0,r,0,7);c.stroke();c.rotate(k*2);c.beginPath();c.moveTo(0,0);c.lineTo(0,-r*.8);c.moveTo(0,0);c.lineTo(r*.5,0);c.stroke()})}
/* 施加：包住 stAdd，成功時在目標身上播一次（同一目標短時間內的相同狀態不重複播） */
const LASTA=new WeakMap();
if(typeof stAdd==='function'){const _sa=stAdd;stAdd=function(t,id,o){const r=_sa.apply(this,arguments);try{if(r&&B&&B.rt){const D=STV[STALIAS[id]||id];if(D&&!D.quiet){const key=t==='p'?H:t,m=LASTA.get(key)||{},n=performance.now();if(!(m[id]>n-500)){m[id]=n;LASTA.set(key,m);
    const dl=t==='p'?380:520;setTimeout(()=>{try{D.s(0)}catch(e){}if(reduce())return;const f=ptOf(t);if(!f)return;run();locate();try{D.on(f)}catch(e){}stRun()},dl)}}}}catch(e){}return r}}
/* 跳傷：持續傷害每跳一次在目標身上冒一下 */
if(typeof stTick==='function'){const _tk=stTick;stTick=function(t){let dots=[];try{if(B&&B.rt){const bx=stBox(t),nw=acOf(t);for(const id in bx){const D=STX[id];if(D&&(D.dot||D.hot)&&bx[id].e>nw)dots.push(id)}}}catch(e){}const r=_tk.apply(this,arguments);
  if(dots.length)setTimeout(()=>{const f=ptOf(t);dots.forEach((id,i)=>setTimeout(()=>{const v=STV[id];if(!v)return;try{tickSnd(id)}catch(e){}if(reduce()||!f)return;run();locate();tickFx(f,id,v.c)},i*120))},60);return r}}
function tickSnd(id){({BURN:()=>SN.roar(0,.25,.2),POISON:()=>SN.bubble(0,3),CORRODE:()=>SN.hiss(0,.25),BLEED:()=>SN.splat(0),REGEN:()=>SN.mana(0),MEND:()=>SN.mana(0)}[id]||(()=>{}))()}
function tickFx(f,id,col){if(id==='BURN'){flames(f,'#ff5a1a',{n:4,h:.07,sp:.04,life:.45,gy:GY(f)});flash(f,'#ff8a2a',.08,.2)}else if(id==='POISON'){fog(f,'rgba(120,220,60,1)',{R:.05,a:.35,life:.6,n:4});flash(f,'#8be04a',.07,.2)}
  else if(id==='CORRODE'){corrodeDrip(f)}else if(id==='BLEED'){phys(f,'drop',6,{spd:[.2,.6],sz:[.004,.007],life:[.4,.8],col:'#d0142e'});flash(f,'#ff3046',.07,.18)}else if(STX[id]&&STX[id].hot){twinkle(f,col,3,{rise:.08,life:.6})}}
/* 持續表現：身上掛著的狀態一直有小動態（主角、主目標、副目標） */
let SLON=0,SLT=0,TG=[],TGt=0;
function stRun(){if(SLON||reduce())return;SLON=1;SLT=performance.now();run();cel(9999,(c,k,p)=>{const nw=performance.now(),t=nw/1000;SLT=nw;
  if(!B||!B.rt||B.hp<=0&&!(B.adds||[]).some(a=>a.hp>0)){SLON=0;p.age=1e9;return}
  if(nw-TGt>300){TGt=nw;TG=[['p',H]];if(B.hp>0)TG.push([B,F]);(B.adds||[]).forEach(a=>{if(a.hp>0){const q=ptOf(a);if(q)TG.push([a,q])}})}
  let any=0;const u=U();
  for(const [tt,f] of TG){let L=[];try{L=stList(tt)}catch(e){}if(!L.length)continue;const [x,y]=P2(f),gy=y+(f.g!=null?f.g:GY(f))*SR().h,R=(f.R||.25)*SR().w*.45;
    for(const id of L){const v=STV[id];if(!v||v.quiet)continue;any=1;c.save();drawSt(c,id,v.c,x,y,gy,R,t,u);c.restore()}}
  if(!any){SLON=0;p.age=1e9}},{});}
function drawSt(c,id,col,x,y,gy,R,t,u){const pu=.6+.4*Math.sin(t*4);
  if(id==='BURN'){ADD(c);for(let i=0;i<5;i++){const ph=(t*1.6+i/5)%1,bx=x+Math.sin(i*2.3+t)*R*.5,by=gy-ph*R*1.1,s=u*.012*(1-ph);c.globalAlpha=(1-ph)*.85;c.fillStyle=rg(c,bx,by,s*2.2,[[0,'#fff4b0'],[.35,'#ff8a2a'],[1,T0]]);c.fillRect(bx-s*2.2,by-s*2.2,s*4.4,s*4.4)}}
  else if(id==='POISON'){for(let i=0;i<4;i++){const ph=(t*.8+i/4)%1,bx=x+Math.sin(i*2.9)*R*.5,by=y+R*.2-ph*R*.8,r=u*.006*(ph<.85?1:1+(ph-.85)*6);c.globalAlpha=(ph<.85?.75:1-(ph-.85)/.15);c.strokeStyle='#c8ff8a';c.fillStyle='rgba(120,220,60,.35)';c.lineWidth=1;c.beginPath();c.arc(bx,by,r,0,7);c.fill();c.stroke()}}
  else if(id==='CORRODE'){c.save();ADD(c);c.globalAlpha=.25*pu;c.fillStyle=rg(c,x,y,R*.8,[[0,'#5a1a8a'],[1,T0]]);c.fillRect(x-R,y-R,R*2,R*2);c.restore();for(let i=0;i<3;i++){const ph=(t*.7+i/3)%1,bx=x+(i-1)*R*.4,by=y-R*.2+ph*R*1.2;c.globalAlpha=(1-ph)*.9;c.fillStyle='#8a3ac8';c.beginPath();c.ellipse(bx,by,u*.004,u*.007,0,0,7);c.fill()}}
  else if(id==='BLEED'){for(let i=0;i<2;i++){const ph=(t*.9+i/2)%1,bx=x+(i?R*.2:-R*.25),by=y-R*.1+ph*(gy-y+R*.1);c.globalAlpha=Math.min(1,(1-ph)*2);c.fillStyle='#d0142e';c.beginPath();c.ellipse(bx,by,u*.004,u*.007,0,0,7);c.fill()}}
  else if(id==='FROST'||id==='CHILL'){ADD(c);c.globalAlpha=.3*pu;c.fillStyle=rg(c,x,gy,R*1.1,[[0,'#bfeaff'],[1,T0]]);c.fillRect(x-R*1.2,gy-R*1.2,R*2.4,R*2.4);for(let i=0;i<3;i++){const a=t*.8+i*2.1,bx=x+Math.cos(a)*R*.6,by=y+Math.sin(a)*R*.3;c.globalAlpha=.6+.4*Math.sin(t*5+i);c.fillStyle='#e8f8ff';const s=u*.006;c.beginPath();for(let j=0;j<8;j++){const aa=j*PI/4,rr=j%2?s*.3:s;c.lineTo(bx+Math.cos(aa)*rr,by+Math.sin(aa)*rr)}c.fill()}}
  else if(id==='SLOW'){ADD(c);c.strokeStyle=col;c.globalAlpha=.6;c.lineWidth=Math.max(1,u*.003);const cy=y-R*1.1;c.beginPath();c.arc(x,cy,u*.018,0,7);c.stroke();c.beginPath();c.moveTo(x,cy);c.lineTo(x+Math.cos(t*.8-PI/2)*u*.014,cy+Math.sin(t*.8-PI/2)*u*.014);c.stroke()}
  else if(id==='SHOCK'){if(Math.random()<.35){ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1,u*.0025);let px=x+rnd2(-1,1)*R*.6,py=y+rnd2(-1,1)*R*.5;c.beginPath();c.moveTo(px,py);for(let i=0;i<3;i++){px+=rnd2(-1,1)*u*.02;py+=rnd2(-1,1)*u*.02;c.lineTo(px,py)}c.stroke()}}
  else if(id==='WEAK'||id==='FATIGUE'||id==='SAPPED'){ADD(c);c.strokeStyle=col;c.globalAlpha=.7;c.lineWidth=Math.max(1.5,u*.004);c.lineCap='round';const ph=(t*.7)%1,yy=y-R*.9+ph*u*.03;c.globalAlpha=Math.sin(PI*ph)*.8;c.beginPath();c.moveTo(x+R*.7-u*.012,yy-u*.01);c.lineTo(x+R*.7,yy);c.lineTo(x+R*.7+u*.012,yy-u*.01);c.stroke()}
  else if(id==='ARMOR'||id==='RESIST'){ADD(c);c.strokeStyle=col;c.globalAlpha=.55+.3*pu;c.lineWidth=Math.max(1,u*.003);const s=u*.016,cx=x-R*.7,cy=y-R*.9;c.beginPath();c.moveTo(cx,cy-s);c.lineTo(cx+s*.8,cy-s*.6);c.lineTo(cx+s*.7,cy+s*.3);c.lineTo(cx,cy+s);c.lineTo(cx-s*.7,cy+s*.3);c.lineTo(cx-s*.8,cy-s*.6);c.closePath();c.stroke();c.beginPath();c.moveTo(cx-s*.2,cy-s);c.lineTo(cx+s*.15,cy-s*.1);c.lineTo(cx-s*.1,cy+s*.4);c.stroke()}
  else if(id==='MARK'||id==='VULN'||id==='EXPOSE'){ADD(c);c.strokeStyle=col;c.globalAlpha=.4+.3*pu;c.lineWidth=Math.max(1,u*.0025);c.translate(x,y);c.rotate(t*.8);const r=R*.55;c.beginPath();c.arc(0,0,r,0,7);c.stroke();for(let i=0;i<4;i++){c.rotate(PI/2);c.beginPath();c.moveTo(r*.75,0);c.lineTo(r*1.15,0);c.stroke()}}
  else if(id==='SEAL'||id==='JUDGE'){ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.globalAlpha=.6+.3*pu;c.lineWidth=Math.max(1.2,u*.003);const cy=y-R*1.15,s=u*.016;c.translate(x,cy);c.rotate(t*.6);c.beginPath();c.arc(0,0,s,0,7);c.stroke();c.beginPath();c.moveTo(0,-s*.7);c.lineTo(0,s*.7);c.moveTo(-s*.7,0);c.lineTo(s*.7,0);c.stroke();if(id==='JUDGE'){c.beginPath();c.arc(0,0,s*1.4,0,7);c.stroke()}}
  else if(id==='BLIND'){c.globalAlpha=.45;c.fillStyle='rgba(20,20,28,1)';c.beginPath();c.ellipse(x,y-R*.55,R*.55,u*.012,0,0,7);c.fill()}
  else if(id==='STUN'){ADD(c);const cy=y-R*1.05;for(let i=0;i<3;i++){const a=t*4+i*2.09,sx=x+Math.cos(a)*R*.4,sy=cy+Math.sin(a)*R*.1,s=u*.008;c.fillStyle='#ffe45a';c.shadowColor='#ffe45a';c.shadowBlur=6;c.beginPath();for(let j=0;j<10;j++){const aa=j*PI/5-PI/2,rr=j%2?s*.45:s;c.lineTo(sx+Math.cos(aa)*rr,sy+Math.sin(aa)*rr)}c.fill()}}
  else if(id==='CURSE'||id==='HEX'||id==='FEAR'){c.globalAlpha=.25*pu;c.fillStyle=rg(c,x,y,R*.9,[[0,'rgba(40,0,60,1)'],[1,T0]]);c.fillRect(x-R,y-R,R*2,R*2)}
  else if(id==='SHIELD'){ADD(c);c.globalAlpha=.35+.15*pu;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1,u*.003);c.beginPath();c.ellipse(x,y,R*.85,R*1.05,0,0,7);c.stroke();c.globalAlpha*=.4;c.fillStyle=rg(c,x,y,R,[[0,T0],[.7,T0],[1,col]]);c.fill()}
  else if(id==='GUARD'||id==='HARDEN'||id==='WARD'||id==='BLOCKUP'){ADD(c);c.globalAlpha=.4+.3*pu;c.strokeStyle=col;c.lineWidth=Math.max(1,u*.003);const s=u*.015,cx=x+R*.75,cy=y-R*.6;c.beginPath();c.moveTo(cx,cy-s);c.lineTo(cx+s*.8,cy-s*.6);c.lineTo(cx+s*.7,cy+s*.3);c.lineTo(cx,cy+s);c.lineTo(cx-s*.7,cy+s*.3);c.lineTo(cx-s*.8,cy-s*.6);c.closePath();c.stroke()}
  else if(id==='RAGE'||id==='TAKEUP'){ADD(c);c.globalAlpha=.3*pu;c.fillStyle=rg(c,x,gy,R*1.2,[[0,col],[1,T0]]);c.fillRect(x-R*1.2,gy-R*1.2,R*2.4,R*2.4)}
  else if(id==='FOCUS'){ADD(c);c.strokeStyle=col;c.globalAlpha=.5+.3*pu;c.lineWidth=Math.max(1,u*.003);c.beginPath();c.ellipse(x,y-R*1.05,u*.014,u*.008,0,0,7);c.stroke();c.fillStyle=col;c.beginPath();c.arc(x,y-R*1.05,u*.004,0,7);c.fill()}
  else if(id==='HASTE'||id==='EVAUP'||id==='COMBOUP'){ADD(c);c.strokeStyle=col;c.lineWidth=Math.max(1,u*.0025);for(let i=0;i<3;i++){const ph=(t*1.5+i/3)%1,yy=y+(i-1)*R*.35,xx=x-R*.9-ph*u*.05;c.globalAlpha=Math.sin(PI*ph)*.6;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-u*.035,yy);c.stroke()}}
  else if(id==='REGEN'||id==='MEND'){ADD(c);for(let i=0;i<2;i++){const ph=(t*.6+i/2)%1,bx=x+(i?R*.4:-R*.4),by=gy-ph*R*1.4,s=u*.006*Math.sin(PI*ph);c.globalAlpha=Math.sin(PI*ph);c.fillStyle=col;c.fillRect(bx-s*.3,by-s,s*.6,s*2);c.fillRect(bx-s,by-s*.3,s*2,s*.6)}}
  else{ADD(c);c.globalAlpha=.2*pu;c.fillStyle=rg(c,x,gy,R,[[0,col],[1,T0]]);c.fillRect(x-R,gy-R,R*2,R*2)}}
/* 戰鬥開始或狀態變化時啟動持續層 */
setInterval(()=>{try{if(B&&B.rt&&!SLON){const any=stList('p').length||stList(B).length||(B.adds||[]).some(a=>stList(a).length);if(any)stRun()}}catch(e){}},500);
window.FX7V={recipe:getR,STV,SN,dart,blade,fireball,bolt,HP0};
})();
