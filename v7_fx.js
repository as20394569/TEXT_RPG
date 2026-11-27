/* V7 技能／狀態特效與音效
   斬擊：乾淨的細線＋顏色與附加效果區分；法術：貼合名稱的元素表現；射擊投擲：尾翼＋破空；狀態：施加、持續、跳傷各有辨識度與音效 */
(()=>{if(typeof PFX==='undefined'||!PFX.kit)return;
const K=PFX.kit,{cel,P2,U,F,H,later,multi,flash,shock,spark,phys,debris,streak,comet,ray,column,rune,charge,fog,auraUp,bubble,wind,swirl,twinkle,lunge,castPose,tint,run,locate,rg,ADD,eo,rnd2,GY,reduce,T0}=K;
const PI=Math.PI,SR=()=>K.SR(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ================= 音效：多層次（低頻撞擊＋本體＋高頻細節＋空間殘響），經過飽和與壓縮讓聲音厚實 ================= */
let G7=null,NB=null,RVB=null;
function A(){if(typeof MUTE!=='undefined'&&MUTE)return null;const a=typeof ctx==='function'?ctx():null;if(!a)return null;if(G7&&G7.context!==a)G7=null;
  if(!G7){const cp=a.createDynamicsCompressor();cp.threshold.value=-20;cp.knee.value=12;cp.ratio.value=5;cp.attack.value=.003;cp.release.value=.18;cp.connect(a.destination);
    /* 柔性飽和：增加厚度 */
    const sat=a.createWaveShaper(),cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;cv[i]=Math.tanh(x*1.8)/Math.tanh(1.8)}sat.curve=cv;sat.oversample='2x';
    const mg=a.createGain();mg.gain.value=.5;sat.connect(mg);mg.connect(cp);
    /* 殘響：程式產生的雙聲道衰減噪音 */
    const len=a.sampleRate*1.8|0,ir=a.createBuffer(2,len,a.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++){const t=i/len;d[i]=(Math.random()*2-1)*Math.pow(1-t,2.6)*(i<a.sampleRate*.012?.3:1)}}
    const cvn=a.createConvolver();cvn.buffer=ir;const wet=a.createGain();wet.gain.value=.26;const rlp=a.createBiquadFilter();rlp.type='lowpass';rlp.frequency.value=5000;cvn.connect(rlp);rlp.connect(wet);wet.connect(cp);RVB=cvn;
    G7=a.createGain();G7.gain.value=.9;G7.connect(sat);G7.connect(cvn);
    const n=a.sampleRate*2|0,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;NB=b}return a}
const now=(a,t)=>a.currentTime+(t||0);
function env(a,g,t,at,v,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.0008,t+at+dec)}
function out(a,node,pan){if(pan){const p=a.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));node.connect(p);p.connect(G7)}else node.connect(G7)}
/* 濾波噪音：f0→f1 掃頻，可左右移動 */
function noise(t0,dur,o){const a=A();if(!a)return;o=o||{};const t=now(a,t0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=NB;s.loop=true;f.type=o.type||'bandpass';f.Q.value=o.q||1.2;
  f.frequency.setValueAtTime(o.f0||1200,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,o.f1||o.f0||1200),t+dur);env(a,g,t,o.at||.008,o.v||.5,dur);s.connect(f);f.connect(g);
  if(o.pan0!=null){const p=a.createStereoPanner();p.pan.setValueAtTime(o.pan0,t);p.pan.linearRampToValueAtTime(o.pan1??-o.pan0,t+dur);g.connect(p);p.connect(G7)}else out(a,g,o.pan);s.start(t,Math.random());s.stop(t+dur+.1)}
/* 振盪音 */
function tone(t0,dur,o){const a=A();if(!a)return;o=o||{};const t=now(a,t0),s=a.createOscillator(),g=a.createGain();s.type=o.w||'sine';s.frequency.setValueAtTime(o.f0||440,t);if(o.f1)s.frequency.exponentialRampToValueAtTime(o.f1,t+dur);if(o.det)s.detune.value=o.det;
  env(a,g,t,o.at||.004,o.v||.2,dur);let n=s;if(o.lp){const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;s.connect(f);n=f}n.connect(g);out(a,g,o.pan);s.start(t);s.stop(t+dur+.1)}
/* 合成元件 */
const LY={
  /* 低頻：從高往低掉的正弦，撞擊的胸口感 */
  sub(t,f0=110,f1=38,d=.35,v=.6){tone(t,d,{f0,f1,v})},
  /* 本體：低通噪音 */
  body(t,d=.2,v=.4,f=900){noise(t,d,{type:'lowpass',f0:f,f1:f*.25,q:.7,v})},
  /* 金屬：帶通高頻噪音＋不和諧泛音，短而亮，不是「叮」 */
  shing(t,v=.25,f=5200,d=.28,pan){noise(t,d,{f0:f,f1:f*1.25,q:7,v,pan});noise(t,d*.6,{type:'highpass',f0:7000,v:v*.5,pan});[1,1.47,2.09].forEach((m,i)=>tone(t,d*(1.2-i*.3),{f0:f*.55*m,v:v*.07,pan}))},
  /* 破風：雙層帶通掃頻、左右移動 */
  whoosh(t,d=.18,v=.45,hi=1){noise(t,d,{f0:hi?700:350,f1:hi?4800:2200,q:1.4,v,pan0:-.5,pan1:.5});noise(t,d*.9,{f0:hi?1500:800,f1:hi?7000:3500,q:3,v:v*.4,pan0:-.3,pan1:.6})},
  /* 碎礫 */
  grit(t,d=.25,v=.3){for(let i=0;i<6;i++)noise(t+Math.random()*d*.6,.05,{type:'bandpass',f0:1500+Math.random()*2500,q:2,v:v*(.5+Math.random()*.5),pan:Math.random()*1.2-.6})},
  /* 合唱墊：多個微失諧的鋸齒波經過低通，慢起 */
  pad(t,fs,d=1,v=.06,lp=2200){fs.forEach((f,i)=>[-8,8].forEach(dt=>tone(t,d,{f0:f,w:'sawtooth',det:dt,v,lp,at:d*.35,pan:(i%2?.3:-.3)})))}};
const SN={
  swish(t=0,p=1,hi){LY.whoosh(t,.16*p,.5,hi)},
  ring(t=0,f=1800,v=.09,d=.35){LY.shing(t,v*2.2,Math.max(2500,f*2.4),d)},
  thud(t=0,v=.5){LY.sub(t,130,40,.3,v);LY.body(t,.14,v*.7,1100)},
  /* 斬擊：破風＋刃鳴＋一點點肉感 */
  cut(t=0,col){LY.whoosh(t,.13,.7,1);LY.shing(t+.03,.32,col?Math.max(3500,col*2.2):5000,.26,Math.random()*.6-.3);LY.body(t+.035,.09,.4,2000);LY.sub(t+.035,160,70,.12,.3)},
  heavy(t=0){LY.whoosh(t,.22,.55,0);LY.sub(t+.08,150,42,.4,.75);LY.body(t+.08,.2,.55,900);LY.grit(t+.1,.3,.25)},
  blunt(t=0){LY.sub(t,120,36,.45,.85);LY.body(t,.22,.6,700);noise(t,.06,{type:'highpass',f0:2500,v:.25});LY.grit(t+.02,.25,.2);LY.shing(t,.08,2800,.3)},
  /* 弓：弦聲＋木頭＋破空 */
  bow(t=0){tone(t,.12,{f0:180,f1:95,w:'triangle',v:.28});tone(t,.08,{f0:420,f1:200,w:'triangle',v:.1});noise(t,.05,{f0:2200,q:4,v:.25})},
  zip(t=0,d=.2){noise(t,d,{f0:6500,f1:1800,q:6,v:.32,pan0:-.4,pan1:.4});noise(t,d*.8,{f0:2500,f1:900,q:2,v:.18,pan0:-.4,pan1:.4})},
  thunk(t=0){LY.sub(t,180,70,.12,.4);noise(t,.05,{type:'highpass',f0:2500,v:.3});LY.body(t,.08,.3,1500)},
  /* 火：點燃的吸氣＋轟燃（低頻＋爆裂聲） */
  ignite(t=0){noise(t,.3,{f0:250,f1:2200,q:.8,v:.4,at:.08});LY.sub(t+.05,70,120,.25,.25)},
  roar(t=0,d=.7,v=.45){noise(t,d,{type:'lowpass',f0:1600,f1:220,q:.6,v,at:.06});LY.sub(t,60,45,d,v*.5);for(let i=0;i<Math.round(d*14);i++)noise(t+Math.random()*d,.025,{type:'highpass',f0:3000+Math.random()*2000,v:v*.35,pan:Math.random()*1.2-.6})},
  boom(t=0,v=.7){LY.sub(t,95,28,.7,v);noise(t,.9,{type:'lowpass',f0:2400,f1:90,q:.5,v});LY.grit(t+.05,.5,v*.4);noise(t,.05,{type:'highpass',f0:3000,v:v*.4})},
  /* 冰：結晶生長＋玻璃碎裂（不和諧短音）＋冷風 */
  frost(t=0){noise(t,.45,{type:'highpass',f0:5000,f1:2600,v:.16,at:.06});noise(t,.5,{f0:900,f1:2500,q:2,v:.12,at:.1});for(let i=0;i<6;i++){const f=2600+Math.random()*3400;tone(t+i*.045+Math.random()*.02,.09,{f0:f,v:.035,pan:Math.random()-.5});tone(t+i*.045,.07,{f0:f*1.37,v:.02})}},
  shatter(t=0){noise(t,.3,{type:'highpass',f0:3500,f1:7000,v:.4});LY.sub(t,140,60,.15,.3);for(let i=0;i<10;i++){const f=2000+Math.random()*5000;tone(t+Math.random()*.18,.12,{f0:f,v:.04,pan:Math.random()*1.4-.7})}},
  /* 雷：撕裂聲＋電流嗡＋長悶雷 */
  zap(t=0){noise(t,.09,{type:'highpass',f0:2200,v:.7});tone(t,.3,{f0:60,w:'sawtooth',v:.16,lp:1200});tone(t,.3,{f0:90,w:'square',v:.06,lp:900});LY.sub(t+.02,80,30,1.2,.6);noise(t+.05,1.4,{type:'lowpass',f0:600,f1:50,q:.5,v:.55,at:.05})},
  crackle(t=0,d=.3){for(let i=0;i<8;i++)noise(t+Math.random()*d,.02,{type:'highpass',f0:2500+Math.random()*2500,v:.32,pan:Math.random()*1.2-.6})},
  /* 聖：鐘＋合唱墊 */
  chime(t=0,base=880){LY.pad(t,[base/2,base*.75/2*1.335,base*.75],1.1,.045,2600);[1,1.25,1.5].forEach((m,i)=>tone(t+i*.06,1,{f0:base*m,v:.05,pan:(i-1)*.4}))},
  bell(t=0,f=1320){tone(t,1.3,{f0:f,v:.08});tone(t,1,{f0:f*2.76,v:.025});tone(t,1.6,{f0:f/2,v:.05});noise(t,.03,{type:'highpass',f0:5000,v:.15})},
  /* 暗：失真的低沉嗡鳴＋反向湧起＋耳語 */
  drone(t=0,d=.7){[55,58.3,82.4].forEach((f,i)=>tone(t,d,{f0:f,w:'sawtooth',v:.12,lp:600,at:d*.4,pan:(i-1)*.4}));noise(t,d,{type:'lowpass',f0:200,f1:1200,v:.28,at:d*.75});LY.sub(t+d*.7,90,35,.4,.4)},
  whisper(t=0){noise(t,.6,{f0:700,f1:2600,q:7,v:.22,at:.25,pan0:-.6,pan1:.6});noise(t+.1,.5,{f0:1200,f1:500,q:9,v:.14,at:.2,pan0:.5,pan1:-.5})},
  /* 毒：濕潤的冒泡 */
  bubble(t=0,n=5){for(let i=0;i<n;i++){const t1=t+i*.06+Math.random()*.04;tone(t1,.08,{f0:250+Math.random()*250,f1:800+Math.random()*500,v:.09,pan:Math.random()-.5});noise(t1,.04,{type:'lowpass',f0:600,v:.12})}noise(t,n*.07,{type:'lowpass',f0:400,v:.15,at:.05})},
  hiss(t=0,d=.5){noise(t,d,{type:'highpass',f0:5500,f1:3500,v:.2,at:.05});noise(t,d,{f0:2500,q:3,v:.1,at:.1})},
  /* 回復：溫暖的和弦上行＋閃爍 */
  heal(t=0){LY.pad(t,[262,330,392],1,.06,1800);[523,659,784,1047].forEach((f,i)=>tone(t+i*.08,.6,{f0:f,v:.07,pan:(i-1.5)*.25}));noise(t+.2,.7,{type:'highpass',f0:7000,v:.06,at:.2})},
  mana(t=0){LY.pad(t,[196,247,294],.8,.035,1500);[392,494,587,784].forEach((f,i)=>tone(t+i*.06,.5,{f0:f,w:'triangle',v:.05}))},
  /* 護盾：低頻嗡＋能量罩起 */
  shield(t=0){tone(t,.6,{f0:110,f1:220,w:'sawtooth',v:.1,lp:800,at:.1});LY.shing(t+.15,.12,3200,.5);LY.sub(t,80,60,.4,.3)},
  guard(t=0){LY.shing(t,.22,3000,.45);LY.sub(t,140,60,.25,.45);LY.body(t,.1,.3,1200)},
  up(t=0){tone(t,.3,{f0:330,f1:880,w:'triangle',v:.09});tone(t+.12,.3,{f0:494,f1:1320,w:'triangle',v:.07});noise(t,.35,{f0:800,f1:4000,q:2,v:.1,at:.1})},
  down(t=0){tone(t,.4,{f0:600,f1:140,w:'sawtooth',v:.08,lp:1500});LY.sub(t+.1,90,40,.3,.25)},
  star(t=0){for(let i=0;i<4;i++)tone(t+i*.05,.35,{f0:1800+i*300,v:.035,pan:(i-1.5)*.3});noise(t,.3,{type:'highpass',f0:6000,v:.08})},
  charge(t=0,d=.5){tone(t,d,{f0:110,f1:700,w:'sawtooth',v:.08,lp:1600,at:d*.85});noise(t,d,{f0:300,f1:3500,q:3,v:.2,at:d*.85});LY.sub(t,50,90,d,.25)},
  wind(t=0){noise(t,.5,{f0:500,f1:1800,q:2,v:.3,at:.15,pan0:-.7,pan1:.7});noise(t,.45,{type:'lowpass',f0:500,v:.15,at:.1})},
  splat(t=0){noise(t,.1,{type:'lowpass',f0:900,v:.35});tone(t,.1,{f0:180,f1:70,v:.15});noise(t+.02,.08,{f0:2500,q:3,v:.12})}};
window.SN7=SN;

/* ================= 位置 ================= */
function stageR(){const st=document.querySelector('.stage')||document.querySelector('#xfield');return st?st.getBoundingClientRect():null}
function cardPt(el){const sr=stageR();if(!sr||!el)return null;const im=el.querySelector('.eart .art img')||el.querySelector('.eart')||el,r=im.getBoundingClientRect();if(r.width<2)return null;
  const p=[(r.left+r.width/2-sr.left)/sr.width,(r.top+r.height*.5-sr.top)/sr.height];p.g=(r.bottom-r.height*.05-sr.top)/sr.height-p[1];p.R=r.width/sr.width;return p}
/* 範圍技的目標：主目標＋活著的副目標卡片 */
function aoePts(k){const x=SK[k],out=[F];AOEN=1;if(!x||!(x.tg==='雙體'||x.tg==='全體')||typeof RTK==='undefined')return out;
  const L=RTK.cards.filter(c=>!c.m&&c.f&&c.f.hp>0).sort((a,b)=>a.f.hp-b.f.hp).slice(0,x.tg==='雙體'?1:3);L.forEach(c=>{const p=cardPt(c.el);if(p)out.push(p)});AOEN=out.length;setTimeout(()=>AOEN=1,1500);return out}
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
  if(kind==='blood'){physL(f,'drop',10,{dir:ang+PI/2,spread:.9,spd:[.4,1],sz:[.003,.006],life:[.5,.9],col:'#c8102e'});physL(f,'drop',5,{dir:-PI/2,spread:1.2,spd:[.3,.7],sz:[.003,.005],life:[.4,.7],col:'#ff3046'})}
  else if(kind==='frost'){crystals([x0,y0],'#9fe2ff',{n:4,h:.06,sp:.05,life:.55,gy:GY(f)});physL(f,'shard',6,{spd:[.4,.9],sz:[.005,.01],life:[.5,.8],ice:1,col:'#bff0ff'});fogL(f,'rgba(190,235,255,.8)',{R:.06,a:.35,life:.7,n:5})}
  else if(kind==='armor'){physL(f,'shard',7,{dir:ang,spread:1.2,spd:[.6,1.3],sz:[.006,.012],life:[.6,1],col:'#c8c8d0',hi:'#ffffff',lo:'#5a5a66'});bits(f,{n:12,dir:ang,spread:1.4,spd:[.7,1.5],sz:[.003,.006],life:[.2,.45],col:'#ffb04a'})}
  else if(kind==='poison'){physL(f,'drop',8,{spd:[.3,.8],sz:[.004,.008],life:[.5,.9],col:'#8be04a'});fogL(f,'rgba(110,200,60,.9)',{R:.05,a:.4,life:.8,n:5,rise:.02})}
  else if(kind==='dark'){physL(f,'wisp',7,{spd:[.4,.9],sz:[.005,.009],life:[.5,.9],col:'#a060ff'})}
  else if(kind==='holy'){twinkle(f,'#fff3b0',5,{life:.6,sx:.06,sy:.06})}
  else bits(f,{n:9,dir:ang+PI/2,spread:1.3,spd:[.6,1.3],sz:[.003,.006],life:[.2,.4],col})}
/* 一刀：刃線＋殘光＋效果＋命中閃點 */
function slashOn(f,ang,col,o){o=o||{};blade(f,ang,o.L||.34,col,o);later(50,()=>{scar(f,ang,o.L||.34,col);if(o.ef!==false)edgeFx(f,ang,o.ef,col);spk(f,'#ffffff',.06,6,.18)})}
/* 殘影：同一刀錯開幾道淡影 */
function afterimg(f,ang,col,n){for(let i=1;i<=n;i++)later(i*35,()=>blade([f[0]-i*.012,f[1]+i*.008],ang,.32,col,{w:.006,life:.22}))}

/* ================= 鈍擊（錘、盾） ================= */
function smash(f,col,o){o=o||{};const p=o.p||1;flash(f,col,.16*p,.25);shock(f,col,.2*p,.45,.32,{gy:.12,w:.018});later(40,()=>shock(f,'#ffffff',.12*p,.3));
  physL(f,'chunk',Math.round(4+p*4),{spd:[.4,1.1],sz:[.005,.012],life:[.7,1.1]});bits(f,{n:10,spd:[.6,1.4],sz:[.003,.006],life:[.2,.4],col});fogL([f[0],f[1]+GY(f)-.02],'rgba(220,205,175,.75)',{R:.07*p,n:7,rise:.03,life:.8,a:.5});
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
      ADD(c);c.fillStyle=col;c.globalAlpha=.7;c.beginPath();c.arc(s*1.8,0,s*.45,0,7);c.fill()}
    else if(type==='knife'){c.fillStyle='#e8eef6';c.strokeStyle='rgba(30,30,40,.7)';c.lineWidth=1;c.beginPath();c.moveTo(s*2.2,0);c.lineTo(-s*.4,-s*.55);c.lineTo(-s*.4,s*.55);c.closePath();c.fill();c.stroke();c.fillStyle='#4a3a30';c.fillRect(-s*1.6,-s*.3,s*1.2,s*.6);
      c.fillStyle=fl;c.beginPath();c.moveTo(-s*1.6,0);c.lineTo(-s*2.6,-s*.6);c.lineTo(-s*2.3,0);c.lineTo(-s*2.6,s*.6);c.closePath();c.fill()}
    else if(type==='needle'){c.strokeStyle=col;c.lineWidth=Math.max(1,s*.22);c.beginPath();c.moveTo(-s*2.4,0);c.lineTo(s*1.6,0);c.stroke();c.fillStyle=fl;c.beginPath();c.moveTo(-s*2.4,0);c.lineTo(-s*3.1,-s*.45);c.lineTo(-s*3.1,s*.45);c.closePath();c.fill()}
    c.restore()});
  /* 出手處的破空環 */
  cel(.25,(c,k)=>{const [x0,y0]=P2(from),[x1,y1]=P2(to),a=Math.atan2(y1-y0,x1-x0),u=U();ADD(c);c.translate(x0,y0);c.rotate(a);c.globalAlpha=1-k;c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,u*.004*(1-k));c.beginPath();c.ellipse(u*.02*k,0,u*.01*(1+k*2),u*.04*(1+k),0,0,7);c.stroke()});
  later(dur*1000,()=>{if(o.hit)o.hit();else pierceHit(to,col)})}
function pierceHit(f,col){spk(f,col,.1,8,.22);flash(f,col,.1,.2);bits(f,{n:10,spd:[.5,1.2],sz:[.003,.006],life:[.2,.4],col})}

/* ================= 元素 ================= */
/* 火球：亮核＋翻騰的火舌拖尾＋黑煙＋火星 */
function fireball(from,to,o){o=o||{};const dur=o.dur||.34,sz=o.sz||1,tr=[];
  cel(dur+.1,(c,k0)=>{const el=k0*(dur+.1),k=Math.min(1,el/dur),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),e=eo(k),arc=(o.arc??.05)*u,x=x0+(x1-x0)*e,y=y0+(y1-y0)*e-Math.sin(PI*e)*arc;
    if(el<dur){tr.push([x,y,el]);if(tr.length>16)tr.shift()}if(el>=dur)return;const R=u*.03*sz;
    for(let i=0;i<tr.length;i++){const [tx,ty,te]=tr[i],q=i/tr.length,age=el-te,r=R*(.4+q*.8)*(1+age*2);c.globalCompositeOperation='source-over';c.globalAlpha=(1-q)*.25;c.fillStyle=rg(c,tx,ty-age*u*.05,r*1.4,[[0,'rgba(60,40,35,.9)'],[1,T0]]);c.beginPath();c.arc(tx,ty-age*u*.05,r*1.4,0,7);c.fill()}
    ADD(c);for(let i=0;i<tr.length;i++){const [tx,ty]=tr[i],q=i/tr.length,r=R*(.3+q*.9)*(.85+.3*Math.random());c.globalAlpha=q*.8;c.fillStyle=rg(c,tx,ty,r*1.6,[[0,'#fff6c0'],[.25,'#ffb030'],[.6,'#ff4a10'],[1,T0]]);c.fillRect(tx-r*1.6,ty-r*1.6,r*3.2,r*3.2)}
    c.globalAlpha=1;c.fillStyle=rg(c,x,y,R*2.4,[[0,'#ffffff'],[.2,'#fff0a0'],[.45,'#ff9a2a'],[1,T0]]);c.fillRect(x-R*2.4,y-R*2.4,R*4.8,R*4.8);
    if(Math.random()<.12)physL([(x-SR().x)/SR().w,(y-SR().y)/SR().h],'ember',2,{spd:[.05,.2],sz:[.003,.006],life:[.3,.6]})});
  later(dur*1000,()=>{if(o.hit)o.hit();else fireBurst(to,sz)})}
/* 爆炸：火光、火舌、煙柱、火星、焦痕 */
function fireBurst(f,p,lite){p=p||1;flash(f,'#ffb040',.22*p,.35);shock(f,'#ff8a2a',.22*p,.45,.4,{w:.014});flames(f,'#ff5a1a',{n:Math.round(6+p*5),h:.12*p,sp:.06*p,life:.7,gy:GY(f)});
  physL(f,'ember',Math.round(8+p*8),{dir:-PI/2,spread:1.3,spd:[.3,.9],sz:[.004,.008],life:[.6,1.2]});if(!lite)physL(f,'smoke',Math.round(2+p*2),{dir:-PI/2,spread:.7,spd:[.12,.3],sz:[.02,.04],life:[.8,1.3],a:.3,col:'rgba(70,55,50,1)'});
  if(!lite)cel(1.1,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U();c.globalAlpha=(1-k)*.5;c.translate(x,gy);c.scale(1,.25);c.fillStyle=rg(c,0,0,u*.1*p,[[0,'rgba(30,20,15,.9)'],[.6,'rgba(120,40,10,.5)'],[1,T0]]);c.beginPath();c.arc(0,0,u*.1*p,0,7);c.fill()})}
/* 火牆：目標腳下一排火焰升起，熱浪 */
function fireWall(f){for(let i=0;i<6;i++)later(i*55,()=>flames([f[0]+(i-2.5)*.035,f[1]],i%2?'#ff7a2a':'#ff4a10',{n:5,h:.09+Math.random()*.06,sp:.025,life:.95,gy:GY(f)}));later(80,()=>cel(1,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U();ADD(c);c.globalAlpha=Math.sin(PI*k)*.55;c.translate(x,gy);c.scale(1,.3);c.fillStyle=rg(c,0,0,u*.16,[[0,'#ffd27a'],[.4,'#ff6a1a'],[1,T0]]);c.beginPath();c.arc(0,0,u*.16,0,7);c.fill()}));physL(f,'ember',16,{dir:-PI/2,spread:.8,spd:[.3,.9],sz:[.004,.008],life:[.8,1.4]});later(150,()=>flash(f,'#ff8a2a',.2,.5))}
/* 冰：寒氣凝結、冰刺、碎冰 */
function iceSpike(f,p){p=p||1;fogL(f,'rgba(200,238,255,.9)',{R:.07*p,a:.25,life:.8,n:6});crystals(f,'#8fdcff',{n:Math.round(4+p*3),h:.11*p,sp:.07*p,life:.8,gy:GY(f)});
  later(120,()=>{flash(f,'#d8f4ff',.14*p,.3);physL(f,'shard',Math.round(6+p*4),{spd:[.5,1.2],sz:[.006,.012],life:[.6,1],ice:1,col:'#9fe2ff'});twinkle(f,'#ffffff',5,{life:.8,sx:.08,sy:.08})})}
function frostBolt(from,to,o){o=o||{};comet(from,to,'#9fe2ff',.012,o.dur||.24,{tail:12,hit:()=>{(o.hit||iceSpike)(to,o.p||.8)}});
  for(let i=0;i<5;i++)later(i*40,()=>physL(from,'shard',1,{dir:Math.atan2(to[1]-from[1],to[0]-from[0]),spread:.3,spd:[.8,1.2],sz:[.003,.005],life:[.2,.3],ice:1,col:'#d8f4ff'}))}
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
function rays(f,col,o){o=o||{};col=vivid(col);cel(o.life||.7,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*(o.R||.2)*eo(k*2);ADD(c);c.translate(x,y);c.rotate(k*.6);const a=Math.sin(PI*Math.min(1,k*1.2));c.beginPath();for(let i=0;i<12;i++){const t=i*PI/6,w=i%2?.05:.1;c.moveTo(0,0);c.lineTo(Math.cos(t-w)*R,Math.sin(t-w)*R);c.lineTo(Math.cos(t+w)*R,Math.sin(t+w)*R);c.closePath()}c.globalAlpha=a*.45;c.fillStyle=col;c.fill();c.globalAlpha=a;c.fillStyle=rg(c,0,0,R*.45,[[0,'#ffffff'],[.5,col],[1,T0]]);c.fillRect(-R*.45,-R*.45,R*.9,R*.9)})}
function holyHit(f,p){p=p||1;column(f,'#ffe68a',{w:.06*p,life:.55});later(120,()=>{rays(f,'#fff3b0',{R:.18*p});flash(f,'#fff6d0',.2*p,.35);debrisL(f,'holy',p)})}
/* 暗：黑紫煙＋觸手狀的影 */
function shadow(f,p){p=p||1;fogL(f,'rgba(40,10,60,1)',{R:.09*p,a:.55,life:1,n:8});swirl(f,'#a060ff',{R:.1*p,life:.8});physL(f,'wisp',Math.round(6+p*4),{spd:[.3,.8],sz:[.005,.009],life:[.6,1],col:'#b080ff'});
  cel(.8,(c,k)=>{const [x,y]=P2(f),u=U(),gy=y+GY(f)*SR().h;c.globalCompositeOperation='source-over';c.lineCap='round';for(let i=0;i<5;i++){const bx=x+(i-2)*u*.035,h=u*.16*p*eo(k*2.5)*(.7+.3*Math.sin(i*3));c.globalAlpha=(k<.6?1:1-(k-.6)/.4)*.8;c.strokeStyle='rgba(30,0,50,.95)';c.lineWidth=u*.012*(1-k*.4);c.beginPath();c.moveTo(bx,gy);
      c.bezierCurveTo(bx+Math.sin(k*8+i)*u*.03,gy-h*.4,bx-Math.sin(k*6+i)*u*.04,gy-h*.8,bx+Math.sin(k*10+i)*u*.02,gy-h);c.stroke();c.strokeStyle='rgba(170,110,255,.6)';c.lineWidth*=.3;ADD(c);c.stroke();c.globalCompositeOperation='source-over'}})}
function darkOrb(from,to,o){o=o||{};comet(from,to,'#9a5aff',.016,o.dur||.3,{arc:.04,tail:14,hit:()=>{(o.hit||(()=>{flash(to,'#c99aff',.16,.3);shadow(to,o.p||.8)}))()}});later(60,()=>physL(from,'wisp',5,{spd:[.2,.5],sz:[.004,.007],life:[.4,.7],col:'#9a5aff'}))}
/* 毒：綠霧翻滾、氣泡、滴落 */
function toxic(f,p){p=p||1;fogL(f,'rgba(70,140,30,1)',{R:.1*p,a:.45,life:1.1,n:8,rise:.02});fogL(f,'rgba(160,240,90,1)',{R:.07*p,a:.3,life:.9,n:6});
  physL(f,'drop',Math.round(5+p*4),{spd:[.3,.8],sz:[.004,.008],life:[.5,.9],col:'#8be04a'});
  cel(1,(c,k)=>{const [x,y]=P2(f),u=U();for(let i=0;i<8;i++){const t=(k*1.4+i/8)%1,bx=x+Math.sin(i*2.7)*u*.07,by=y+u*.06-t*u*.12,r=u*.008*(.6+Math.sin(i)*.4)*(t<.85?1:1+(t-.85)*8);c.globalAlpha=(t<.85?.8:1-(t-.85)/.15)*(1-k*.5);c.strokeStyle='#c8ff8a';c.lineWidth=1;c.fillStyle='rgba(120,220,60,.35)';c.beginPath();c.arc(bx,by,r,0,7);c.fill();c.stroke()}})}
/* 星火（大魔導士）：星屑與星芒 */
function starBurst(f,p){p=p||1;twinkle(f,'#fff0b0',8,{life:.9,sx:.1*p,sy:.1*p});rays(f,'#ffd27a',{R:.16*p,life:.6});bits(f,{n:14,spd:[.6,1.4],sz:[.003,.006],life:[.3,.6],col:'#ffe08a'})}
/* 回復：光點上升＋十字 */
function healFx(f,col,p){p=p||1;auraUp(f,col,{life:.9});cel(1.1,(c,k)=>{const [x,y]=P2(f),u=U(),gy=y+GY(f)*SR().h;ADD(c);for(let i=0;i<7;i++){const t=(k*1.2+i/7)%1,cx=x+Math.sin(i*2.3)*u*.08,cy=gy-t*u*.3,s=u*.012*Math.sin(PI*t);c.globalAlpha=Math.sin(PI*t);c.fillStyle=i%2?'#ffffff':col;c.shadowColor=col;c.shadowBlur=8;c.fillRect(cx-s*.3,cy-s,s*.6,s*2);c.fillRect(cx-s,cy-s*.3,s*2,s*.6)}});twinkle(f,'#ffffff',5,{rise:.12})}
function manaFx(f){auraUp(f,'#6ab0ff',{life:.8});physL(f,'wisp',8,{dir:PI/2,spread:1,spd:[.2,.5],sz:[.004,.007],life:[.5,.9],col:'#8fc8ff'});rune(f,'#6ab0ff',{R:.12,life:.8})}
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
    if(aoe)return R(()=>{melee();const pts=aoePts(k);blade([.5,(pts.reduce((a,p)=>a+p[1],0)/pts.length)],-.06,.95,col,{w:.012,life:.34,bend:.02});pts.forEach((p,i)=>later(60+i*40,()=>{scar(p,-.06,.25,col);edgeFx(p,-.06,ef,col);spk(p,'#ffffff',.06,6,.18)}));if(dual)later(110,()=>blade([.5,(pts.reduce((a,p)=>a+p[1],0)/pts.length)+.03],.06,.95,'#ffffff',{w:.008,life:.28,bend:-.02}))},()=>{SN.swish(.1,1.3,1);SN.ring(.18,2000,.07,.3);if(dual)SN.swish(.22,1,1)},'slash');
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
    if(aoe)return R(()=>{melee();const pts=aoePts(k);blade([.5,pts.reduce((a,p)=>a+p[1],0)/pts.length],.05,1,'#ff7a4a',{w:.02,life:.38,bend:.04});pts.forEach((p,i)=>later(80+i*40,()=>{scar(p,.05,.3,'#ff7a4a');physL(p,'chunk',4,{spd:[.4,1],sz:[.005,.01],life:[.6,1]})}))},()=>{SN.heavy(.12)},'slash');
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
    if(ice&&aoe)return R(()=>{castPose('me');each(p=>{fogL(p,'rgba(200,238,255,.9)',{R:.09,a:.25,life:1,n:7});later(150,()=>iceSpike(p,.7))},70);tint('rgba(180,230,255,.15)',.3)},()=>{SN.wind(0);SN.frost(.2);SN.shatter(.4)},'ice');
    if(ice)return R(()=>{castPose('me');frostBolt(HP0(),F,{p:1})},()=>{SN.frost(0);SN.zip(.05,.2);SN.shatter(.3)},'ice');
    if(thun)return R(()=>{castPose('me');later(80,()=>bolt(F,'#fff3a0'));if(/爆/.test(n))later(200,()=>{shock(F,'#fff3a0',.3,.5);arcs(F,'#fff3a0',.6)})},()=>{SN.zap(.08);SN.crackle(.2,.4)},'thunder');
    return R(()=>{castPose('me');comet(HP0(),F,star?'#ffe08a':'#b98aff',.014,.26,{arc:.04,tail:12,hit:()=>{flash(F,star?'#fff0b0':'#d8b8ff',.14,.25);star?starBurst(F,.6):bits(F,{n:10,spd:[.5,1.1],sz:[.003,.006],life:[.2,.4],col:'#d8b8ff'})}})},()=>{SN.zip(0,.2);star?SN.star(.25):SN.ring(.25,1200,.05,.3);SN.thud(.27,.25)},star?'holy':'dark')}
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
    if(aoe)return R(()=>{castPose('me');rays(H,'#fff3b0',{R:.15,life:.4});later(120,()=>shock([.55,F[1]],'#ffe68a',.6,.6,.35));each(p=>later(150,()=>{flash(p,'#fff6d0',.15,.3);debrisL(p,'holy',.7)}),50)},()=>{SN.chime(0,880);SN.boom(.2,.25)},'holy');
    if(/強光/.test(n))return R(()=>{castPose('me');later(100,()=>{tint('rgba(255,255,240,.6)',.25);rays(F,'#ffffff',{R:.3,life:.6});flash(F,'#ffffff',.35,.4)})},()=>{SN.chime(0,1319);SN.bell(.1,2093)},'holy');
    if(/聖印|審判/.test(n))return R(()=>{castPose('me');comet(HP0(),F,'#ffe68a',.014,.26,{arc:.03,hit:()=>{holyHit(F,.9);sigil(F,/審判/.test(n)?'#ffffff':'#ffd34a',1)}})},()=>{SN.zip(0,.2);SN.bell(.27,1047);SN.chime(.3,784)},'holy');
    if(/聖光斬|聖光擊/.test(n))return R(()=>{castPose('me');later(60,()=>{blade(F,PI/2,.4,'#ffe68a',{w:.016,life:.35,bend:.02});later(60,()=>holyHit(F,1))})},()=>{SN.cut(.06,2600);SN.bell(.15,1175)},'holy');
    return R(()=>{castPose('me');comet(HP0(),F,'#ffe68a',.014,.26,{arc:.03,hit:()=>{flash(F,'#fff6d0',.14,.25);twinkle(F,'#ffffff',4,{life:.5,sx:.06,sy:.06});debrisL(F,'holy',.6)}})},()=>{SN.zip(0,.2);SN.bell(.27,1319)},'holy')}
  return null}
function hopOr(){try{K.hop('me')}catch(e){}}
/* 準星 */
function reticle(f,col,life){cel(life||.6,(c,k)=>{const [x,y]=P2(f),u=U(),r=u*.07*(1.6-eo(k*3)*.6);ADD(c);c.globalAlpha=k<.8?1:1-(k-.8)/.2;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1,u*.003);c.translate(x,y);c.rotate(k*1.5);c.beginPath();c.arc(0,0,r,0,7);c.stroke();
  for(let i=0;i<4;i++){c.rotate(PI/2);c.beginPath();c.moveTo(r*.55,0);c.lineTo(r*1.3,0);c.stroke()}c.fillStyle=col;c.beginPath();c.arc(0,0,Math.max(1.5,u*.004),0,7);c.fill()})}
function tone2(){SN.ring(.3,3000,.04,.2)}
function downArrows(f,col){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1.5,u*.005);c.lineCap='round';for(let i=0;i<3;i++){const t=(k*1.3+i/3)%1,yy=y-u*.08+t*u*.14,xx=x+(i-1)*u*.05;c.globalAlpha=Math.sin(PI*t);c.beginPath();c.moveTo(xx-u*.015,yy-u*.012);c.lineTo(xx,yy);c.lineTo(xx+u*.015,yy-u*.012);c.stroke()}})}
function upArrows(f,col){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1.5,u*.005);c.lineCap='round';for(let i=0;i<3;i++){const t=(k*1.3+i/3)%1,yy=y+u*.06-t*u*.16,xx=x+(i-1)*u*.05;c.globalAlpha=Math.sin(PI*t);c.beginPath();c.moveTo(xx-u*.015,yy+u*.012);c.lineTo(xx,yy);c.lineTo(xx+u*.015,yy+u*.012);c.stroke()}})}
function corrodeDrip(f){physL(f,'drop',8,{spd:[.2,.6],sz:[.004,.008],life:[.6,1],col:'#7a2ab0'});fogL(f,'rgba(90,30,120,1)',{R:.06,a:.4,life:.9,n:5,rise:.03})}
/* 頭頂符印（聖印、審判印） */
function sigil(f,col,life){cel(life||1,(c,k)=>{const [x,y]=P2(f),u=U(),cy=y-u*.13,s=u*.035*eo(k*4);ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=10;c.lineWidth=Math.max(1.5,u*.004);c.translate(x,cy);c.rotate(k*1.2);c.beginPath();c.arc(0,0,s,0,7);c.stroke();c.beginPath();c.moveTo(0,-s*.7);c.lineTo(0,s*.7);c.moveTo(-s*.7,0);c.lineTo(s*.7,0);c.stroke()})}

/* ================= 菱形刃光：壓扁的菱形，兩端尖、中間寬，筆直俐落 ================= */
/* 顏色加強：在圖卡上看得清楚（提高飽和、亮度落在中段） */
const VIV={};function vivid(c){if(typeof c!=='string'||c[0]!=='#'||c.length!==7)return c;if(VIV[c])return VIV[c];let r=parseInt(c.slice(1,3),16)/255,g=parseInt(c.slice(3,5),16)/255,b=parseInt(c.slice(5,7),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(d<.04)return VIV[c]=c;
  let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;const S=Math.min(1,(d/(1-Math.abs(2*l-1)))*1.5+.25),L=Math.max(.5,Math.min(.6,l));const C=(1-Math.abs(2*L-1))*S,X=C*(1-Math.abs((h/60)%2-1)),m=L-C/2;
  const [rr,gg,bb]=h<60?[C,X,0]:h<120?[X,C,0]:h<180?[0,C,X]:h<240?[0,X,C]:h<300?[X,0,C]:[C,0,X];const hx=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');return VIV[c]='#'+hx(rr)+hx(gg)+hx(bb)}
/* 刀光：壓得很扁的菱形，前後兩端收成尖點；白色細芯＋鮮明的色光 */
function dia(f,ang,L,W,col,o){o=o||{};const life=o.life||.42,d0=o.d0||.11,hold=o.hold||.4;col=vivid(col);
  cel(life,(c,k)=>{const [x0,y0]=P2(f),u=U(),Lp=L*u*1.1,Wp=W*u*.3,gr=eo(k/d0),out=k<hold?0:(k-hold)/(1-hold),th=1-out;if(th<=.01)return;
    const head=-Lp/2+Lp*gr,tail=-Lp/2+Lp*Math.min(.9,eo(out)*.9),len=head-tail;if(len<1)return;const bias=o.bias??.5,w=Math.max(1.6,Wp*Math.pow(th,.6)*Math.min(1,len/Lp*1.5));
    c.translate(x0+(o.dx||0)*u,y0+(o.dy||0)*u);c.rotate(ang);
    const shape=(t0,t1,ww)=>{const m=t0+(t1-t0)*bias;c.beginPath();c.moveTo(t0,0);c.lineTo(m,-ww/2);c.lineTo(t1,0);c.lineTo(m,ww/2);c.closePath()};
    /* 外層色光：同形狀放寬、半透明，讓顏色在深色卡和白色怪身上都顯眼 */
    ADD(c);c.globalAlpha=.4*th;shape(tail-len*.03,head+len*.02,w*2.1);c.fillStyle=col;c.fill();
    c.globalCompositeOperation='source-over';c.globalAlpha=.5*th;shape(tail,head,w*1.35);c.strokeStyle='rgba(6,8,20,.9)';c.lineWidth=1;c.stroke();
    ADD(c);c.globalAlpha=th;shape(tail,head,w*1.35);c.fillStyle=col;c.fill();
    shape(tail+len*.06,head-len*.01,Math.max(1,w*.42));c.fillStyle='#ffffff';c.fill();
    if(k<d0*1.6&&o.tip!==false){c.globalAlpha=1-k/(d0*1.6);const r=Math.max(6,w*3);c.fillStyle=rg(c,head,0,r,[[0,'#ffffff'],[.35,col],[1,T0]]);c.fillRect(head-r,-r,r*2,r*2)}})}
/* 刃光排列方式：同一種外形，靠排列、數量、角度、顏色、節奏分出差別 */
function slashP(f,P){const c1=P.c,c2=P.c2||'#ffffff',L=P.L||.36,W=P.W||.045,ang=P.a??-.55,gp=P.gap||70,lf=P.life;let tot=0;const D=(ff,a,l,w,cl,o)=>dia(ff,a,l,w,cl,Object.assign({life:lf},o||{}));
  switch(P.p){
  case 'one':D(f,ang,L,W,c1);break;
  case 'x':D(f,ang,L,W,c1);later(gp,()=>D(f,-ang,L,W,c2));tot=gp;break;
  case 'plus':D(f,0,L,W,c1);later(gp,()=>D(f,PI/2,L*.9,W,c2));tot=gp;break;
  case 'double':D(f,ang,L,W,c1);later(gp,()=>D(f,ang+1.05,L*.85,W*.85,c2,{dx:.01}));tot=gp;break;
  case 'tri':[-.95,.15,1.1].forEach((d,i)=>later(i*gp*.6,()=>D(f,ang*.3+d,L*.85,W*.8,i===1?c2:c1,{dx:(i-1)*.012})));tot=gp*1.2;break;
  case 'v':D(f,PI/2,L*1.15,W*1.2,c1,{dy:-.01});break;
  case 'rise':D(f,-PI/2+.35,L,W,c1,{bias:.62});break;
  case 'low':D(f,.04,L*1.1,W*.8,c1,{dy:.08});break;
  case 'zig':{const n=P.n||3;for(let i=0;i<n;i++)later(i*gp,()=>D(f,(i%2?1:-1)*(.75+i*.08),L*.85,W*.85,i%2?c2:c1,{dx:rnd2(-.02,.02),dy:(i-(n-1)/2)*.025}));tot=gp*(n-1);break}
  case 'star':{const n=P.n||4;for(let i=0;i<n;i++)later(i*25,()=>D(f,i*PI/n+(P.a||0),L*.8,W*.7,i%2?c2:c1,{life:.34}));tot=n*25;break}
  case 'fan':{const n=P.n||5;for(let i=0;i<n;i++)later(i*gp*.45,()=>D(f,-1.1+i*.55,L*.8,W*.7,i%2?c2:c1));tot=n*gp*.45;break}
  case 'ring':{const n=P.n||6;for(let i=0;i<n;i++)later(i*35,()=>{const a=i/n*6.283;D(f,a+PI/2,L*.42,W*.6,i%2?c2:c1,{dx:Math.cos(a)*.07,dy:Math.sin(a)*.05,life:.3})});tot=n*35;break}
  case 'storm':{const n=P.n||7;for(let i=0;i<n;i++)later(i*gp*.5,()=>D([f[0]+rnd2(-.05,.05),f[1]+rnd2(-.05,.05)],rnd2(-PI,PI),L*.55,W*.6,i%2?c2:c1,{life:.28}));tot=n*gp*.5;break}
  case 'pierce':D(f,P.a??-.06,L*1.6,W*.55,c1,{bias:.75,dx:-.06});break;
  case 'moon':D(f,-.9,L,W,c1,{bias:.35});later(gp,()=>D(f,.9,L,W,c2,{bias:.65}));tot=gp;break;
  case 'big':D(f,ang,L*1.6,W*1.7,c1,{life:.55,hold:.45});later(30,()=>D(f,ang,L*2.6,W*.25,'#ffffff',{life:.4,tip:false}));later(60,()=>{tint('rgba(255,255,255,.22)',.12);flash(f,c1,.26,.35)});break}
  return tot}
/* 範圍斬：一道橫越全部目標的長刃 */
function sweep(pts,P){const y=pts.reduce((a,p)=>a+p[1],0)/pts.length,x=pts.reduce((a,p)=>a+p[0],0)/pts.length;dia([x,y+(P.dy||0)],P.a??-.08,1.05,P.W||.05,P.c,{life:.48,bias:.55});if(P.c2)later(P.gap||110,()=>dia([x,y+(P.dy||0)],.22,1.05,(P.W||.05)*.8,P.c2,{life:.42,bias:.45}));pts.forEach((p,i)=>later(70+i*35,()=>{if(P.ef)edgeFx(p,0,P.ef,P.c);spk(p,'#ffffff',.06,6,.2)}))}
function hitSl(f,P,dl){later((dl||0)+60,()=>{if(P.ef)edgeFx(f,P.a||0,P.ef,P.c);spk(f,'#ffffff',.07,7,.2);if(P.p==='big'||P.heavy)shock(f,P.c,.22,.45,.35)})}

/* 破甲：對手身上浮出一面護甲，被刀光一刀劈開，兩半往外裂開掉落 */
function armorCut(f,ang,col,two){col=vivid(col);const t0=.22;cel(1.1,(c,k)=>{const [x,y]=P2(f),u=U(),s=u*.125;c.translate(x,y);
  const sh=()=>{c.beginPath();c.moveTo(0,-s);c.lineTo(s*.82,-s*.62);c.lineTo(s*.72,s*.25);c.quadraticCurveTo(s*.4,s*.8,0,s*1.05);c.quadraticCurveTo(-s*.4,s*.8,-s*.72,s*.25);c.lineTo(-s*.82,-s*.62);c.closePath()};
  const paint=(a)=>{c.globalCompositeOperation='source-over';c.globalAlpha=a*.55;sh();const g=c.createLinearGradient(-s,-s,s,s);g.addColorStop(0,'rgba(230,235,245,1)');g.addColorStop(.5,'rgba(140,150,170,1)');g.addColorStop(1,'rgba(70,75,90,1)');c.fillStyle=g;c.fill();
    c.globalAlpha=a;ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=10;c.lineWidth=Math.max(1.5,u*.005);sh();c.stroke();c.shadowBlur=0;c.globalCompositeOperation='source-over';c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.beginPath();c.moveTo(0,-s*.75);c.lineTo(0,s*.75);c.moveTo(-s*.5,-s*.2);c.lineTo(s*.5,-s*.2);c.stroke()};
  if(k<t0){paint(Math.min(1,k/(t0*.6)));return}
  const q=(k-t0)/(1-t0),fd=q<.5?1:1-(q-.5)/.5,cuts=two?[ang,-ang]:[ang];
  const pieces=two?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0]];
  for(const [sa,sb] of pieces){c.save();const n0=[-Math.sin(cuts[0]),Math.cos(cuts[0])],n1=two?[-Math.sin(cuts[1]),Math.cos(cuts[1])]:null,dx=(n0[0]*sa+(n1?n1[0]*sb:0))*u*.06*eo(q*2),dy=(n0[1]*sa+(n1?n1[1]*sb:0))*u*.06*eo(q*2)+u*.18*q*q;
    c.translate(dx,dy);c.rotate(sa*.35*q);c.beginPath();const R=s*3;
    /* 用切線把護甲分成兩塊（或四塊） */
    const half=(a,sg)=>{c.moveTo(Math.cos(a)*R,Math.sin(a)*R);c.lineTo(Math.cos(a)*R+Math.cos(a+PI/2)*R*sg,Math.sin(a)*R+Math.sin(a+PI/2)*R*sg);c.lineTo(-Math.cos(a)*R+Math.cos(a+PI/2)*R*sg,-Math.sin(a)*R+Math.sin(a+PI/2)*R*sg);c.lineTo(-Math.cos(a)*R,-Math.sin(a)*R);c.closePath()};
    half(cuts[0],sa);c.clip();if(two){c.beginPath();half(cuts[1],sb);c.clip()}paint(fd);c.restore()}
  if(q<.25){ADD(c);c.globalAlpha=1-q/.25;for(const a of cuts){c.save();c.rotate(a);c.fillStyle='#ffffff';c.shadowColor=col;c.shadowBlur=12;c.fillRect(-s*1.2,-1.5,s*2.4,3);c.restore()}}})}
/* 輕量命中：大量投射物用，不做物理與模糊（避免卡頓） */
function tick(f,col){col=vivid(col||'#ffffff');cel(.22,(c,k)=>{const [x,y]=P2(f),u=U(),r=u*.035*eo(k*3);ADD(c);c.globalAlpha=1-k;c.strokeStyle=col;c.lineWidth=Math.max(1,u*.003);c.beginPath();for(let i=0;i<4;i++){const a=i*PI/2+.4;c.moveTo(x+Math.cos(a)*r*.3,y+Math.sin(a)*r*.3);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.stroke();c.fillStyle='#ffffff';c.fillRect(x-1.5,y-1.5,3,3)})}
/* 輕量火花：一次算好軌跡，只畫短線（不用模糊與物理，避免卡頓） */
function spk(f,col,R,n,life){col=vivid(col||'#ffffff');n=n||8;const rs=[...Array(n)].map((_,i)=>[i/n*6.283+Math.random()*.5,.6+Math.random()*.6]);cel(life||.24,(c,k)=>{const [x,y]=P2(f),u=U(),g=eo(k*3.5);ADD(c);c.globalAlpha=1-k*k;c.strokeStyle=col;c.lineWidth=Math.max(1,u*.004*(1-k));c.lineCap='round';c.beginPath();
  rs.forEach(([a,l])=>{const r0=R*u*.25*g,r1=R*u*l*(.3+g*.8);c.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);c.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1)});c.stroke();c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,u*.0015);c.stroke()})}
function bits(f,o){o=o||{};const n=o.n||10,col=vivid(o.col||'#ffd27a'),dir=o.dir??-PI/2,spr=o.spread??PI,sp=o.spd||[.5,1.2],lf=o.life||[.2,.45],B=[...Array(n)].map(()=>{const a=dir+rnd2(-1,1)*spr,v=rnd2(sp[0],sp[1]);return[Math.cos(a)*v,Math.sin(a)*v,rnd2(lf[0],lf[1])]}),T=Math.max(...B.map(b=>b[2]));
  cel(T/1.3,(c,k)=>{const t=k*T,[x,y]=P2(f),u=U();ADD(c);c.strokeStyle=col;c.lineWidth=Math.max(1,u*.003);c.lineCap='round';c.beginPath();let any=0;for(const [vx,vy,l] of B){if(t>l)continue;any=1;const px=x+vx*t*u,py=y+(vy*t+1.2*t*t)*u,qx=x+vx*(t-.03)*u,qy=y+(vy*(t-.03)+1.2*(t-.03)*(t-.03))*u;c.moveTo(qx,qy);c.lineTo(px,py)}if(any){c.globalAlpha=1-k;c.stroke()}})}
/* 效能：霧、碎屑、光芒在多目標時很吃效能，這裡統一減量 */
let AOEN=1;const sc=n=>Math.max(1,Math.round(n/(AOEN>2?2:AOEN>1?1.5:1)));
function fogL(f,col,o){o=Object.assign({},o||{});o.n=Math.min(AOEN>1?3:4,o.n||7);return fog(f,col,o)}
function physL(f,kind,n,o){return phys(f,kind,Math.max(1,Math.round(sc(n)*.6)),o)}
function debrisL(f,el,p){p=p||1;const col=el==='fire'?'#ffa040':el==='ice'?'#bff0ff':el==='dark'?'#c99aff':el==='holy'?'#fff3a0':el==='thunder'?'#fff17a':'#ffe0a0';bits(f,{n:sc(Math.round(6+p*5)),col,spd:[.5,1.3],life:[.25,.5]});motes(f,col,sc(Math.round(3+p*3)))}
/* 光點上飄（取代有漸層的火星） */
function motes(f,col,n){col=vivid(col);const M=[...Array(n)].map(()=>[rnd2(-.05,.05),rnd2(-.03,.03),rnd2(.15,.35),rnd2(.5,1)]);cel(1,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.fillStyle=col;for(const [dx,dy,v,l] of M){if(k>l)continue;c.globalAlpha=1-k/l;c.beginPath();c.arc(x+dx*u+Math.sin(k*9+dx*50)*u*.008,y+dy*u-v*k*u,Math.max(1,u*.004),0,7);c.fill()}})}
/* 旋風：沿橢圓一路掃過的刀光，兩端收尖（壓扁菱形彎成弧） */
function arcSweep(f,col,o){o=o||{};col=vivid(col);const turns=o.turns||1,span=o.span||3.4,dir=o.dir||1;cel(o.life||.5,(c,k)=>{const [x,y]=P2(f),u=U(),rx=u*(o.rx||.11),ry=u*(o.ry||.04),W=u*(o.w||.012),hd=eo(Math.min(1,k/.75))*turns*6.283,fd=k<.7?1:1-(k-.7)/.3,len=Math.min(span,hd+.3),N=34;
  const pt=(a,off)=>[x+Math.cos(a)*(rx+off),y+(o.dy||0)*u+Math.sin(a)*(ry+off*.35)];const a1=dir*hd+(o.a0||0),a0=a1-dir*len;
  const side=(sg)=>{const P=[];for(let i=0;i<=N;i++){const t=i/N,a=a0+(a1-a0)*t,w=W*Math.pow(Math.sin(PI*t),.55)*(t>.5?1:.7);P.push(pt(a,sg*w))}return P};
  const A=side(1),Bs=side(-1).reverse();ADD(c);c.globalAlpha=fd*.4;c.fillStyle=col;c.beginPath();[...side(2.6),...side(-2.6).reverse()].forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.fill();
  c.globalAlpha=fd;c.beginPath();[...A,...Bs].forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.fill();
  c.beginPath();for(let i=4;i<=N;i++){const a=a0+(a1-a0)*i/N,[px,py]=pt(a,0);i===4?c.moveTo(px,py):c.lineTo(px,py)}c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,W*.4);c.stroke()})}
/* ================= 盾牌 ================= */
function shPath(c,s){c.beginPath();c.moveTo(0,-s);c.lineTo(s*.82,-s*.62);c.lineTo(s*.72,s*.25);c.quadraticCurveTo(s*.4,s*.8,0,s*1.05);c.quadraticCurveTo(-s*.4,s*.8,-s*.72,s*.25);c.lineTo(-s*.82,-s*.62);c.closePath()}
function drawShield(c,s,col,a){c.globalCompositeOperation='source-over';c.globalAlpha=a;shPath(c,s);const g=c.createLinearGradient(-s,-s,s,s);g.addColorStop(0,'#eef2fa');g.addColorStop(.45,'#9aa6bc');g.addColorStop(1,'#4a5268');c.fillStyle=g;c.fill();c.strokeStyle='rgba(20,24,36,.9)';c.lineWidth=1.5;c.stroke();
  c.fillStyle=col;c.globalAlpha=a*.9;c.fillRect(-s*.09,-s*.7,s*.18,s*1.45);c.fillRect(-s*.5,-s*.25,s*1,s*.18);ADD(c);c.globalAlpha=a*.8;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=10;c.lineWidth=Math.max(1.5,s*.07);shPath(c,s*.98);c.stroke();c.shadowBlur=0}
/* 盾牌飛／衝過去砸中目標；ret=打中後彈回來 */
function shieldFly(from,to,o){o=o||{};const col=vivid(o.col||'#8fc8ff'),dur=o.dur||.26,sc=o.sz||1,back=o.ret?dur*.9:0,tr=[];
  cel(dur+back+.1,(c,k0)=>{const el=k0*(dur+back+.1),u=U(),[x0,y0]=P2(from),[x1,y1]=P2(to);let e,x,y;if(el<dur){e=eo(el/dur);x=x0+(x1-x0)*e;y=y0+(y1-y0)*e-Math.sin(PI*e)*u*(o.arc||0)}else if(el<dur+back){e=eo((el-dur)/back);x=x1+(x0-x1)*e;y=y1+(y0-y1)*e+Math.sin(PI*e)*u*.04}else return;
    tr.push([x,y]);if(tr.length>8)tr.shift();ADD(c);tr.forEach(([tx,ty],i)=>{const q=i/tr.length;c.globalAlpha=q*.35;c.fillStyle=col;c.beginPath();c.arc(tx,ty,u*.03*sc*q,0,7);c.fill()});
    const s=u*.06*sc*(o.grow?1+eo(Math.min(1,el/dur))*.5:1);c.translate(x,y);c.rotate(o.spin?el*22:Math.atan2(y1-y0,x1-x0)*.15);drawShield(c,s,col,1)});
  later(dur*1000,()=>{flash(to,col,.18,.25);shock(to,col,.22*sc,.4,.5,{w:.02});smash(to,col,{p:.7*sc})})}
/* 盾牆：在自己面前立起一面大盾 */
function shieldWall(col,life){col=vivid(col);cel(life||1,(c,k)=>{const [x,y]=P2(H),u=U(),rise=eo(Math.min(1,k/.2)),a=k<.75?1:1-(k-.75)/.25,s=u*.11;c.translate(x+u*.13,y+u*.02+(1-rise)*u*.08);c.globalAlpha=a;drawShield(c,s,col,a*.95);
  const sw=-s+((k*1.8)%1)*s*2.2;c.save();shPath(c,s);c.clip();ADD(c);c.globalAlpha=a*.7;c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.moveTo(-s,sw);c.lineTo(s,sw-s*.5);c.lineTo(s,sw-s*.35);c.lineTo(-s,sw+s*.15);c.fill();c.restore()})}
/* 地面震波：從自己腳下沿地面傳到每個目標 */
function groundWave(pts,col){col=vivid(col);pts.forEach((p,i)=>cel(.7,(c,k)=>{const [x0,y0]=P2(H),[x1,y1]=P2(p),u=U(),g0=y0+GY(H)*SR().h,g1=y1+GY(p)*SR().h,e=eo(Math.min(1,k/.45)),x=x0+(x1-x0)*e,gy=g0+(g1-g0)*e;ADD(c);c.globalAlpha=k<.45?1:1-(k-.45)/.55;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=10;c.lineWidth=Math.max(2,u*.006);
  for(let j=0;j<3;j++){const r=u*(.03+j*.025);c.beginPath();c.ellipse(x-j*u*.03,gy,r*.6,r*.25,0,-PI/2,PI/2);c.stroke()}}));
  pts.forEach((p,i)=>later(320,()=>{shock(p,col,.2,.45,.3,{gy:.12});physL([p[0],p[1]+GY(p)],'chunk',4,{spd:[.4,.9],sz:[.004,.009],life:[.6,1]})}))}
/* ================= 旋風 ================= */
/* 劍士旋風斬：一道扁菱形刀光繞著目標轉一圈半，留下弧形殘光 */
function swirlBlade(f,col,o){o=o||{};col=vivid(col);const dir=o.dir||1,turns=o.turns||1.5;cel(o.life||.55,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*(o.R||.085),a0=dir*k*turns*6.283;ADD(c);
  for(let i=0;i<14;i++){const a=a0-dir*i*.14,q=1-i/14,px=x+Math.cos(a)*R,py=y+Math.sin(a)*R*.55;c.globalAlpha=q*.45*(1-k*.6);c.fillStyle=col;c.beginPath();c.arc(px,py,u*.006*q+1,0,7);c.fill()}
  const px=x+Math.cos(a0)*R,py=y+Math.sin(a0)*R*.55,L=u*.17,w=u*.012;c.globalAlpha=k<.8?1:1-(k-.8)/.2;c.translate(px,py);c.rotate(a0+dir*PI/2);c.shadowColor=col;c.shadowBlur=10;c.fillStyle=col;c.beginPath();c.moveTo(-L/2,0);c.lineTo(0,-w);c.lineTo(L/2,0);c.lineTo(0,w);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,w*.5);c.beginPath();c.moveTo(-L/2,0);c.lineTo(L/2,0);c.stroke()})}
/* 狂戰士旋風斧：一把沉重的斧光沿大橢圓橫掃全場兩圈，帶起塵土與碎石 */
function axeCyclone(pts){const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length+.04,col=vivid('#ff7a2a');
  cel(.8,(c,k)=>{const [x,y]=P2([cx,cy]),u=U(),RX=SR().w*.46,RY=u*.07,a0=k*2*6.283;ADD(c);
    for(let i=0;i<18;i++){const a=a0-i*.12,q=1-i/18,px=x+Math.cos(a)*RX,py=y+Math.sin(a)*RY;c.globalAlpha=q*.5;c.fillStyle=i<6?'#ffd08a':col;c.beginPath();c.arc(px,py,u*.012*q+1,0,7);c.fill()}
    const px=x+Math.cos(a0)*RX,py=y+Math.sin(a0)*RY,L=u*.26,w=u*.03,front=Math.sin(a0)>0;c.globalAlpha=(k<.85?1:1-(k-.85)/.15)*(front?1:.55);c.translate(px,py);c.rotate(a0+PI/2+.3);c.shadowColor=col;c.shadowBlur=14;c.fillStyle=col;c.beginPath();c.moveTo(-L/2,0);c.lineTo(-L*.1,-w);c.lineTo(L/2,0);c.lineTo(-L*.1,w);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle='#fff3d0';c.lineWidth=Math.max(1.5,w*.4);c.beginPath();c.moveTo(-L/2,0);c.lineTo(L/2,0);c.stroke()});
  pts.forEach((p,i)=>{for(const t of [120+i*60,520+i*60])later(t,()=>{spk(p,'#ffd08a',.1,8,.22);physL([p[0],p[1]+GY(p)*.8],'chunk',4,{spd:[.5,1.1],sz:[.004,.009],life:[.6,1]})});later(300,()=>fogL([p[0],p[1]+GY(p)-.02],'rgba(200,170,130,.8)',{R:.08,n:7,rise:.05,life:.9,a:.5}))});wind([cx,cy],'#ffd8b0',{dir:1,n:6,life:.8})}
/* ================= 其他新元件 ================= */
/* 星形彈：四芒星旋轉前進 */
function starShot(from,to,col,o){o=o||{};const dur=o.dur||.32,tr=[];cel(dur+.12,(c,k0)=>{const el=k0*(dur+.12),k=Math.min(1,el/dur),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),e=eo(k),x=x0+(x1-x0)*e,y=y0+(y1-y0)*e-Math.sin(PI*e)*u*(o.arc??.06);
  if(el<dur){tr.push([x,y]);if(tr.length>10)tr.shift()}ADD(c);tr.forEach(([tx,ty],i)=>{const q=i/tr.length,s=u*.006*q;c.globalAlpha=q*.7;c.fillStyle=col;c.beginPath();c.arc(tx,ty,s,0,7);c.fill()});if(el>=dur)return;
  const s=u*.03*(o.sz||1);c.translate(x,y);c.rotate(el*12);c.globalAlpha=1;c.shadowColor=col;c.shadowBlur=s;c.fillStyle=col;c.beginPath();for(let i=0;i<8;i++){const a=i*PI/4,r=i%2?s*.22:s;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.fill();c.fillStyle='#ffffff';c.beginPath();c.arc(0,0,s*.22,0,7);c.fill()});
  later(dur*1000,()=>{if(o.hit)o.hit();else starBurst(to,.6)})}
/* 冰鎖：冰晶環繞收緊 */
function iceChain(f){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*.11*(1.4-eo(k*2)*.6);ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.translate(x,y);c.scale(1,.45);c.rotate(k*3);c.strokeStyle='#bff0ff';c.shadowColor='#8fdcff';c.shadowBlur=8;c.lineWidth=Math.max(1.5,u*.004);
  for(let i=0;i<8;i++){const a=i/8*6.283;c.save();c.rotate(a);c.translate(R,0);c.beginPath();c.ellipse(0,0,u*.014,u*.007,0,0,7);c.stroke();c.restore()}});later(300,()=>{crystals(f,'#8fdcff',{n:6,h:.08,sp:.09,life:.7,gy:GY(f)});SN.frost(0)})}
/* 火焰龍捲 */
function fireTornado(f){cel(1.1,(c,k)=>{const [x,y]=P2(f),u=U(),gy=y+GY(f)*SR().h,H=u*.34*eo(k*2.5);ADD(c);c.globalAlpha=k<.75?1:1-(k-.75)/.25;
  for(let i=0;i<26;i++){const t=i/26,a=t*14+k*16,r=u*(.02+t*.08),px=x+Math.cos(a)*r,py=gy-t*H+Math.sin(a)*r*.25,s=u*.014*(1-t*.5);c.fillStyle=rg(c,px,py,s*2,[[0,'#fff2b0'],[.35,t<.5?'#ff8a2a':'#ff4a10'],[1,T0]]);c.fillRect(px-s*2,py-s*2,s*4,s*4)}});physL(f,'ember',18,{dir:-PI/2,spread:1.4,spd:[.3,1],sz:[.004,.008],life:[.7,1.3]})}
/* 冰爆：冰片放射 */
function iceNova(f){flash(f,'#e8f8ff',.18,.3);cel(.5,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.globalAlpha=1-k;for(let i=0;i<10;i++){const a=i/10*6.283,r=u*.03+u*.13*eo(k*2),px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.8;c.save();c.translate(px,py);c.rotate(a);c.fillStyle='#d8f4ff';c.shadowColor='#8fdcff';c.shadowBlur=6;c.beginPath();c.moveTo(u*.025,0);c.lineTo(0,-u*.007);c.lineTo(-u*.012,0);c.lineTo(0,u*.007);c.fill();c.restore()}});physL(f,'shard',10,{spd:[.6,1.4],sz:[.006,.012],life:[.6,1],ice:1,col:'#9fe2ff'})}
/* 雷球：電漿球炸開 */
function thunderBall(f){cel(.6,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*.06*(k<.5?eo(k*2):1+(k-.5)*3);ADD(c);c.globalAlpha=k<.5?1:1-(k-.5)/.5;c.fillStyle=rg(c,x,y,R,[[0,'#ffffff'],[.4,'#fff3a0'],[1,T0]]);c.fillRect(x-R,y-R,R*2,R*2);c.strokeStyle='#fff8c0';c.shadowColor='#ffe45a';c.shadowBlur=8;c.lineWidth=Math.max(1,u*.003);
  for(let j=0;j<5;j++){let px=x,py=y;c.beginPath();c.moveTo(px,py);const a=Math.random()*6.283;for(let i=1;i<5;i++){px=x+Math.cos(a)*R*1.4*i/4+rnd2(-1,1)*u*.012;py=y+Math.sin(a)*R*1.4*i/4+rnd2(-1,1)*u*.012;c.lineTo(px,py)}c.stroke()}});later(260,()=>{shock(f,'#fff3a0',.26,.4);arcs(f,'#fff3a0',.5)})}
/* 靈魂抽取：白紫色魂火被拉回施法者 */
function soulPull(f){for(let i=0;i<6;i++)later(i*70,()=>comet([f[0]+rnd2(-.05,.05),f[1]+rnd2(-.05,.05)],H,i%2?'#e8d8ff':'#b080ff',.011,.45,{arc:rnd2(-.12,.12),tail:14,hit:false}))}
/* 影刺地波：地面一路竄出黑刺 */
function shadowWave(pts){pts.forEach((p,j)=>{for(let i=0;i<4;i++)later(j*60+i*45,()=>cel(.6,(c,k)=>{const [x,y]=P2(p),u=U(),gy=y+GY(p)*SR().h,bx=x+(i-1.5)*u*.03,h=u*.1*eo(k*5)*(1-Math.max(0,k-.6)/.4);c.globalCompositeOperation='source-over';c.fillStyle='rgba(25,0,40,.95)';c.beginPath();c.moveTo(bx-u*.01,gy);c.lineTo(bx,gy-h);c.lineTo(bx+u*.01,gy);c.fill();ADD(c);c.strokeStyle='#b080ff';c.lineWidth=1;c.stroke()}))})}
/* 鎖鏈詛咒 */
function chains(f,col){cel(1,(c,k)=>{const [x,y]=P2(f),u=U(),pr=eo(k*2.5);c.globalAlpha=k<.75?1:1-(k-.75)/.25;ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1.5,u*.004);
  for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const ex=x+sx*u*.2,ey=y+sy*u*.15;for(let i=0;i<6;i++){const t=i/6;if(t>pr)break;const px=ex+(x-ex)*t,py=ey+(y-ey)*t;c.beginPath();c.ellipse(px,py,u*.009,u*.005,Math.atan2(y-ey,x-ex)+(i%2?PI/2:0),0,7);c.stroke()}}})}
/* 酸液噴濺 */
function acid(f){physL(f,'drop',14,{spd:[.5,1.2],sz:[.004,.008],life:[.5,.9],col:'#b05ae0'});fogL(f,'rgba(120,40,170,1)',{R:.06,a:.45,life:.8,n:5,rise:.03});later(150,()=>SN.hiss(0,.4))}
/* 暗紋壓頂：巨大符印由上壓下 */
function darkSigil(f){cel(1,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*.15,yy=y-u*.25+u*.25*eo(Math.max(0,k-.2)*2.5);ADD(c);c.globalAlpha=k<.8?1:1-(k-.8)/.2;c.translate(x,yy);c.scale(1,.35);c.rotate(k*2);c.strokeStyle='#9a5aff';c.shadowColor='#7a3aff';c.shadowBlur=12;c.lineWidth=Math.max(1.5,u*.005);c.beginPath();c.arc(0,0,R,0,7);c.stroke();
  c.beginPath();for(let i=0;i<=5;i++){const a=i*4*PI/5-PI/2;c.lineTo(Math.cos(a)*R*.9,Math.sin(a)*R*.9)}c.stroke()});later(550,()=>{shock(f,'#7a3aff',.3,.5,.35,{gy:.12});shadow(f,1)})}
/* 光波：橫向擴散的光牆 */
function lightWave(pts){cel(.7,(c,k)=>{const u=U(),[x0,y0]=P2(H),xe=x0+(SR().w*1.1)*eo(k*1.3);ADD(c);c.globalAlpha=1-k;const yc=P2(pts[0])[1],g=c.createLinearGradient(xe-u*.12,0,xe,0);g.addColorStop(0,T0);g.addColorStop(1,'#fff3b0');c.fillStyle=g;c.fillRect(xe-u*.12,yc-u*.2,u*.12,u*.4);c.fillStyle='#ffffff';c.fillRect(xe-u*.006,yc-u*.2,u*.006,u*.4)});pts.forEach((p,i)=>later(150+i*60,()=>{flash(p,'#fff6d0',.12,.3);twinkle(p,'#ffffff',3,{life:.5})}))}
/* 羽毛飄落 */
function feathers(pts){pts.forEach(p=>{for(let i=0;i<5;i++)later(i*80,()=>{const sx=p[0]+rnd2(-.06,.06);cel(1,(c,k)=>{const [x,y]=P2([sx,p[1]-.25+k*.3]),u=U();ADD(c);c.globalAlpha=Math.sin(PI*k);c.translate(x+Math.sin(k*8)*u*.02,y);c.rotate(Math.sin(k*6)*.6);c.fillStyle='#fff8e0';c.shadowColor='#ffe68a';c.shadowBlur=8;c.beginPath();c.ellipse(0,0,u*.006,u*.018,0,0,7);c.fill();c.strokeStyle='#ffe68a';c.beginPath();c.moveTo(0,-u*.018);c.lineTo(0,u*.02);c.stroke()})});later(500,()=>{flash(p,'#fff6d0',.14,.3);debrisL(p,'holy',.6)})})}
/* 聖十字 */
function holyCross(f){cel(.7,(c,k)=>{const [x,y]=P2(f),u=U(),s=u*.13*eo(k*3);ADD(c);c.globalAlpha=k<.5?1:1-(k-.5)/.5;c.shadowColor='#ffe68a';c.shadowBlur=14;c.fillStyle='#fff3b0';c.fillRect(x-u*.012,y-s,u*.024,s*2);c.fillRect(x-s*.7,y-s*.35-u*.012,s*1.4,u*.024);c.fillStyle='#ffffff';c.fillRect(x-u*.004,y-s,u*.008,s*2)});later(150,()=>{rays(f,'#fff3b0',{R:.14});debrisL(f,'holy',.8)})}
/* 光之劍從天而降 */
function lightSword(f){cel(.7,(c,k)=>{const [x,y]=P2(f),u=U(),yy=SR().y-u*.1+(y-SR().y+u*.05)*eo(Math.min(1,k/.35)),L=u*.3;ADD(c);c.globalAlpha=k<.6?1:1-(k-.6)/.4;c.translate(x,yy);c.shadowColor='#ffe68a';c.shadowBlur=14;c.fillStyle='#fff6d0';c.beginPath();c.moveTo(0,0);c.lineTo(u*.018,-L*.15);c.lineTo(u*.014,-L);c.lineTo(-u*.014,-L);c.lineTo(-u*.018,-L*.15);c.closePath();c.fill();c.fillRect(-u*.05,-L*.95,u*.1,u*.012)});later(260,()=>{holyHit(f,1.1);tint('rgba(255,250,220,.25)',.12)})}
/* 箭矢的變化 */
function leafTrail(from,to){for(let i=0;i<6;i++)later(i*35,()=>{const t=i/6,p=[from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t];physL(p,'wisp',1,{spd:[.05,.15],sz:[.004,.007],life:[.5,.8],col:'#9ae05a'})})}
function sonic(f,col){cel(.5,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);for(let i=0;i<3;i++){const kk=k*1.5-i*.15;if(kk<0||kk>1)continue;c.globalAlpha=(1-kk)*.8;c.strokeStyle=i?'#ffffff':col;c.lineWidth=Math.max(1,u*.004*(1-kk));c.beginPath();c.ellipse(x,y,u*.04+u*.16*kk,u*.02+u*.1*kk,0,0,7);c.stroke()}})}
function pin(f){cel(1,(c,k)=>{const [x,y]=P2(f),u=U(),gy=y+GY(f)*SR().h;c.globalAlpha=k<.8?1:1-(k-.8)/.2;c.translate(x,gy);c.rotate(-.3);c.strokeStyle='#d8c8a8';c.lineWidth=Math.max(1,u*.004);c.beginPath();c.moveTo(0,0);c.lineTo(0,-u*.05);c.stroke();c.fillStyle='#e0d0b0';c.beginPath();c.moveTo(0,-u*.05);c.lineTo(-u*.01,-u*.065);c.lineTo(u*.01,-u*.065);c.fill()});clockRing(f,'#9fc8ff')}
function bullet(from,to){streak(from,to,'#ffffff',{w:.012,life:.18,over:1.1});later(20,()=>{const [x0]=[0];cel(.3,(c,k)=>{const [ax,ay]=P2(from),[bx,by]=P2(to),u=U();ADD(c);c.globalAlpha=1-k;c.strokeStyle='#ffe0e0';c.lineWidth=Math.max(1,u*.002);c.beginPath();c.moveTo(ax,ay);c.lineTo(bx+(bx-ax)*.4,by+(by-ay)*.4);c.stroke()})})}

/* ================= 逐招設計表 ================= */
/* 斬擊：p 排列、c/c2 顏色、ef 附加、s 音高 */
const SL={
  J01S1:{p:'one',c:'#cfe6ff',a:-.6},J01S2:{p:'one',c:'#ffa040',a:-.5,ef:'armorcut',L:.42},J01S3:{p:'rise',c:'#8fc8ff',ef:'guard'},J01S9:{p:'low',c:'#7fd3ff',ef:'frost'},
  J01S10:{p:'x',c:'#ff8a4a',c2:'#ffd0a0'},J01S11:{p:'zig',c:'#ff3a4a',c2:'#ffb0b8',ef:'blood'},J01S12:{p:'double',c:'#d8a0ff',c2:'#ffffff'},J01S13:{p:'big',c:'#ffe27a',a:-1.2},
  J05S2:{p:'tri',c:'#e8d27a',c2:'#ffffff',ef:'armor'},J05S10:{p:'x',c:'#bfe2ff',c2:'#ffffff',ef:'guard'},J05S12:{p:'v',c:'#ff9a4a',ef:'armor',heavy:1},
  J13S1:{p:'x',c:'#7ff0ff',c2:'#ff9ae8'},J13S2:{p:'moon',c:'#7ff0ff',c2:'#ff9ae8'},J13S3:{p:'storm',c:'#9ff8e8',c2:'#ffffff',n:7,ef:'wind'},J13S9:{p:'zig',c:'#ff4a6a',c2:'#7ff0ff',ef:'blood',n:4},
  J13S10:{p:'pierce',c:'#7ff0ff',ef:'after'},J13S11:{p:'x',c:'#ffb04a',c2:'#7ff0ff',a:-.6,ef:'armorcut2'},J13S12:{p:'fan',c:'#7ff0ff',c2:'#ff9ae8',n:5},J13S13:{p:'star',c:'#7ff0ff',c2:'#ff9ae8',n:6,heavy:1},
  J10S1:{p:'pierce',c:'#b080ff',a:-.25,ef:'shadow'},J10S2:{p:'tri',c:'#8be04a',c2:'#d8ffb0',ef:'poison',L:.3,W:.035},J10S3:{p:'star',c:'#a060ff',c2:'#ffffff',n:4,ef:'shadow'},J10S9:{p:'pierce',c:'#8be04a',a:.2,ef:'poison'},
  J10S10:{p:'zig',c:'#7ff0e0',c2:'#ffffff',ef:'wind',L:.3,W:.035},J10S11:{p:'v',c:'#c0304a',ef:'shadow'},J10S12:{p:'double',c:'#8be04a',c2:'#b080ff',a:-.2},J10S13:{p:'big',c:'#ff2a4a',a:-.4},
  J06S1:{p:'v',c:'#ff8a4a',heavy:1,ef:'crack',W:.07},J06S2:{p:'v',c:'#ff6a2a',heavy:1,ef:'quake',W:.09,L:.48},J06S3:{p:'one',c:'#ff3a4a',W:.07,ef:'lifesteal',a:-.9},J06S9:{p:'zig',c:'#d0142e',c2:'#ff8a8a',W:.065,ef:'blood'},
  J06S11:{p:'x',c:'#ffa040',c2:'#ff6a2a',W:.065,ef:'armor',heavy:1},J06S12:{p:'rise',c:'#ff4a6a',W:.07,ef:'lifesteal'},J06S13:{p:'big',c:'#ff5a1a',a:PI/2-.15,ef:'quake'}};
/* 範圍斬 */
const SW={J01S7:{c:'#9fd8ff'},J05S8:{c:'#ffe0a0',c2:'#ffffff'},J06S8:{c:'#ff5a2a',W:.08,ef:'crack'},J13S8:{c:'#7ff0ff',c2:'#ff9ae8'}};
/* 迴旋（全體逐一） */
const WH={J01S8:1,J06S7:1,J13S7:1};
function slashSnd(P,t){const pitch=P.c==='#ff8a4a'||/ff[4-9]/.test(P.c)?1600:2300;const n=P.p==='tri'?3:P.p==='zig'?(P.n||3):P.p==='storm'?5:P.p==='star'?3:P.p==='fan'?4:P.p==='ring'?4:(P.p==='x'||P.p==='plus'||P.p==='double'||P.p==='moon')?2:1;
  for(let i=0;i<n;i++)SN.cut(t+i*.07,pitch+i*180);if(P.W>=.065||P.heavy){SN.thud(t+.06,.6)}if(P.p==='big'){SN.boom(t+.05,.5)}
  if(P.ef==='blood')SN.splat(t+.1);if(P.ef==='frost')SN.frost(t+.08);if(/armor/.test(P.ef||''))SN.ring(t+.08,800,.08,.45);if(P.ef==='poison')SN.hiss(t+.1,.3);if(P.ef==='shadow')SN.whisper(t);if(P.ef==='lifesteal')SN.heal(t+.3);if(P.ef==='quake')SN.boom(t+.1,.6)}
function slashExtra(f,P,dl){later(dl+60,()=>{const e=P.ef;
  if(e==='armorcut'||e==='armorcut2'){edgeFx(f,P.a||0,'armor',P.c);shock(f,P.c,.16,.35)}else if(e==='crack')smash(f,P.c,{p:.7,crack:1});else if(e==='quake'){smash(f,P.c,{p:1.3,crack:1});tint('rgba(120,70,30,.18)',.25)}
  else if(e==='lifesteal')multi(5,60,()=>comet([f[0]+rnd2(-.04,.04),f[1]],H,'#ff4a6a',.008,.38,{arc:rnd2(-.08,.08),hit:false}));
  else if(e==='guard')guardFx(H,P.c);else if(e==='wind')wind(f,'#e0fff8',{dir:1,n:5,life:.45});else if(e==='after'){wind(f,'#e0fbff',{dir:1,n:4,life:.4});bits(f,{n:10,dir:0,spread:.5,spd:[.8,1.6],sz:[.003,.006],life:[.2,.4],col:vivid(P.c)})}
  else if(e==='shadow')shadow([f[0]+.03,f[1]],.45);else if(e)edgeFx(f,P.a||0,e,P.c);
  spk(f,'#ffffff',.07,7,.2);if(P.heavy)shock(f,P.c,.22,.45,.35)})}
/* 鈍擊：錘與盾，每招不同的衝擊形狀 */
const BL={
  J05S1:k=>{lunge('me',30);shieldFly(HP0(),F,{col:'#8fc8ff',dur:.2});later(240,()=>slashP(F,{p:'one',c:'#cfe6ff',a:-.6,L:.3,W:.04}))},
  J05S3:k=>{shieldWall('#8fc8ff',1);later(350,()=>{lunge('me',30);later(60,()=>slashP(F,{p:'x',c:'#8fc8ff',c2:'#ffffff',a:-.7,L:.3,W:.04}))})},
  J05S7:k=>{K.hop('me');later(120,()=>{shock([H[0],H[1]],'#9fc8ff',.18,.4,.3,{gy:.12});groundWave(aoePts(k),'#9fc8ff');aoePts(k).forEach(p=>later(380,()=>downArrows(p,'#9fc8ff')))})},
  J05S9:k=>{castPose('me');shieldFly(HP0(),F,{col:'#cfe6ff',dur:.24,spin:1,ret:1,arc:.05})},
  J05S13:k=>{wind(H,'#cfe6ff',{dir:1,n:6,life:.5});lunge('me',40);shieldFly(HP0(),F,{col:'#8fc8ff',dur:.22,sz:1.6,grow:1});later(240,()=>{smash(F,'#cfe6ff',{p:1.3,crack:1});tint('rgba(220,235,255,.2)',.12)})},
  J12S1:k=>{lunge('me',30);later(80,()=>smash(F,'#ffe27a',{p:.7}))},
  J12S2:k=>{column(F,'#ffe68a',{w:.05,life:.4});later(120,()=>{smash(F,'#ffe27a',{p:1.1,crack:1});edgeFx(F,0,'armor','#ffe27a')})},
  J12S3:k=>{lunge('me',30);later(80,()=>{smash(F,'#ffe27a',{p:.8});bubble(H,'#ffe27a',{R:.15,life:.8})})},
  J12S7:k=>{K.hop('me');tint('rgba(120,90,40,.18)',.3);aoePts(k).forEach((p,i)=>later(i*70,()=>smash(p,'#e8c87a',{p:.9,crack:1})))},
  J12S8:k=>{const pts=aoePts(k);lunge('me',30);cel(.5,(c,kk)=>{const u=U(),y=pts.reduce((a,p)=>a+P2(p)[1],0)/pts.length+u*.06,x=SR().x+SR().w*(.05+.9*eo(kk*1.6));ADD(c);c.globalAlpha=1-kk;c.fillStyle=rg(c,x,y,u*.08,[[0,'#ffffff'],[.4,'#ffe27a'],[1,T0]]);c.fillRect(x-u*.08,y-u*.08,u*.16,u*.16)});pts.forEach((p,i)=>later(80+i*70,()=>smash(p,'#ffe27a',{p:.6})))},
  J12S10:k=>{lunge('me',30);later(80,()=>{smash(F,'#ffe27a',{p:.8});later(150,()=>{ray(F,HP0(),'#9affc0',.01,.4);healFx(H,'#ffe27a',.7)})})},
  J12S11:k=>{lunge('me',30);later(80,()=>{smash(F,'#ffb060',{p:.9});brokenShield(F,'#ffb060');edgeFx(F,0,'armor','#ffb060')})},
  J12S12:k=>{guardFx(H,'#ffe27a');later(120,()=>{lunge('me',30);later(80,()=>{smash(F,'#ffd34a',{p:.9});flash(F,'#ffffff',.18,.25)})})},
  J12S13:k=>{lightSword(F);later(300,()=>smash(F,'#ffe27a',{p:1.4,crack:1}))}};
const BLS={J05S1:t=>{SN.swish(t,1);SN.blunt(t+.2);SN.cut(t+.3,2000)},J05S3:t=>{SN.guard(t);SN.shield(t+.05);SN.cut(t+.4,2100);SN.cut(t+.47,2400)},J05S7:t=>{SN.thud(t+.1,.7);SN.boom(t+.15,.4);SN.down(t+.4)},J05S9:t=>{SN.swish(t,1.2);SN.blunt(t+.24);SN.swish(t+.3,1)},J05S13:t=>{SN.wind(t);SN.blunt(t+.22);SN.boom(t+.24,.6)},
  J12S1:t=>{SN.blunt(t+.08);SN.bell(t+.1,1175)},J12S2:t=>{SN.bell(t,1047);SN.blunt(t+.12);SN.ring(t+.15,700,.08,.4)},J12S3:t=>{SN.blunt(t+.08);SN.shield(t+.15)},J12S7:t=>{SN.boom(t+.05,.7);SN.blunt(t+.1)},J12S8:t=>{SN.wind(t);SN.blunt(t+.1);SN.blunt(t+.2)},
  J12S10:t=>{SN.blunt(t+.08);SN.heal(t+.25)},J12S11:t=>{SN.blunt(t+.08);SN.ring(t+.1,650,.1,.5)},J12S12:t=>{SN.guard(t);SN.blunt(t+.2)},J12S13:t=>{SN.bell(t,1568);SN.boom(t+.28,.8)}};
/* 射擊 */
const RA={
  J03S1:{v:()=>dart(HP0(),F,{dur:.24,fl:'#9ae05a'}),s:t=>{SN.bow(t);SN.zip(t+.02,.24);SN.thunk(t+.25)}},
  J03S2:{v:()=>{dart(HP0(),F,{dur:.22,fl:'#9ae05a',col:'#c8ffa0',hit:()=>{pierceHit(F,'#c8ffa0');streak(F,[F[0]+.2,F[1]-.05],'#c8ffa0',{w:.015,life:.3})}});leafTrail(HP0(),F)},s:t=>{SN.bow(t);SN.zip(t+.02,.22);SN.thunk(t+.23);SN.wind(t+.2)}},
  J03S3:{v:()=>dart(HP0(),F,{dur:.24,fl:'#9fc8ff',hit:()=>{pierceHit(F,'#9fc8ff');pin(F)}}),s:t=>{SN.bow(t);SN.zip(t+.02,.24);SN.thunk(t+.25);SN.down(t+.3)}},
  J03S7:{aoe:1,v:k=>{const pts=aoePts(k);[-.07,0,.07].forEach((d,i)=>later(i*20,()=>pts.forEach(p=>dart(HP0(),[p[0],p[1]+d],{dur:.22,fl:'#9ae05a',hit:()=>pierceHit(p,'#ffffff')}))))},s:t=>{SN.bow(t);for(let i=0;i<3;i++)SN.zip(t+.02+i*.02,.2);SN.thunk(t+.24)}},
  J03S8:{aoe:1,v:k=>{dart(HP0(),[HP0()[0]+.05,-.2],{dur:.15,fl:'#9ae05a',hit:()=>{}});aoePts(k).forEach((p,j)=>later(j*40,()=>multi(6,45,()=>{const t=[p[0]+rnd2(-.05,.05),p[1]+rnd2(-.02,.06)];dart([t[0]-.06,-.12],t,{dur:.22,fl:'#9ae05a',hit:()=>pierceHit(t,'#ffffff')})})))},s:t=>{SN.bow(t);SN.zip(t+.05,.18);for(let i=0;i<6;i++)SN.zip(t+.3+i*.05,.12);SN.thunk(t+.55)}},
  J03S9:{v:()=>dart(HP0(),F,{dur:.24,fl:'#ffb04a',col:'#ffd08a',hit:()=>{pierceHit(F,'#ffb04a');edgeFx(F,0,'armor','#ffb04a');brokenShield(F,'#ffb060')}}),s:t=>{SN.bow(t);SN.zip(t+.02,.24);SN.ring(t+.26,700,.08,.45)}},
  J03S10:{v:()=>{wind(H,'#e8f6ff',{dir:-1,n:6,life:.5});later(120,()=>dart(HP0(),F,{dur:.24,fl:'#7ff0e0'}))},s:t=>{SN.wind(t);SN.bow(t+.12);SN.zip(t+.14,.24);SN.thunk(t+.37)}},
  J03S12:{v:()=>{dart(HP0(),F,{dur:.26,fl:'#9fc8ff',arc:.08});later(110,()=>dart(HP0(),F,{dur:.26,fl:'#9fc8ff',arc:-.06}))},s:t=>{SN.bow(t);SN.zip(t+.02,.26);SN.bow(t+.11);SN.zip(t+.13,.26);SN.thunk(t+.4)}},
  J03S13:{v:()=>{charge(HP0(),'#fff6c8',{R:.06,life:.3});later(200,()=>{sonic(HP0(),'#fff6c8');dart(HP0(),F,{dur:.18,fl:'#fff6c8',sz:1.5,hit:()=>{pierceHit(F,'#ffffff');sonic(F,'#ffe0a0');flash(F,'#ffffff',.18,.25)}})})},s:t=>{SN.charge(t,.2);SN.bow(t+.2);SN.zip(t+.22,.18);SN.boom(t+.4,.4)}},
  J09S1:{v:()=>{reticle(F,'#ff6a6a',.4);dart(HP0(),F,{dur:.22,fl:'#ff6a6a'})},s:t=>{SN.bow(t);SN.zip(t+.02,.22);SN.thunk(t+.23)}},
  J09S2:{v:()=>{dart(HP0(),F,{dur:.2,fl:'#ffe08a',col:'#ffe08a',hit:()=>{starBurst(F,.7);ray(HP0(),[F[0]+.15,F[1]-.04],'#ffe08a',.01,.35)}})},s:t=>{SN.bow(t);SN.zip(t+.02,.2);SN.star(t+.22);SN.thunk(t+.22)}},
  J09S3:{v:()=>dart(HP0(),F,{dur:.22,fl:'#ff5a5a',hit:()=>{pierceHit(F,'#ff8a8a');reticle(F,'#ff3a3a',1)}}),s:t=>{SN.bow(t);SN.zip(t+.02,.22);SN.ring(t+.24,2600,.05,.3)}},
  J09S7:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*50,()=>multi(4,60,()=>{const t=[p[0]+rnd2(-.04,.04),p[1]+rnd2(-.02,.05)];dart([t[0]+.08,-.14],t,{dur:.2,fl:'#ff5a5a',col:'#ffb0a0',sz:1.2,hit:()=>{flash(t,'#ff8a6a',.08,.2);pierceHit(t,'#ffb0a0')}})}))),s:t=>{for(let i=0;i<4;i++)SN.zip(t+.05+i*.06,.18);SN.thud(t+.3,.4)}},
  J09S8:{aoe:1,v:k=>{const pts=aoePts(k);[-.12,-.06,0,.06,.12].forEach((d,i)=>later(i*12,()=>dart(HP0(),[pts[i%pts.length][0]+d*.3,pts[i%pts.length][1]+d],{dur:.2,fl:'#ff5a5a'})))},s:t=>{SN.bow(t);for(let i=0;i<5;i++)SN.zip(t+.01+i*.012,.2);SN.thunk(t+.22)}},
  J09S9:{v:()=>dart(HP0(),F,{dur:.24,fl:'#8be04a',col:'#8be04a',hit:()=>{pierceHit(F,'#8be04a');toxic(F,.7)}}),s:t=>{SN.bow(t);SN.zip(t+.02,.24);SN.bubble(t+.27,5)}},
  J09S10:{v:()=>dart(HP0(),F,{dur:.2,fl:'#ff8a3a',sz:1.4,hit:()=>{smash(F,'#ffb060',{p:.6});edgeFx(F,0,'armor','#ffb060')}}),s:t=>{SN.bow(t);SN.zip(t+.02,.2);SN.blunt(t+.21)}},
  J09S12:{v:()=>dart(HP0(),F,{dur:.34,fl:'#ff5a5a',arc:.18,ease:1,hit:()=>{pierceHit(F,'#ff8a8a');reticle(F,'#ff5a5a',.5)}}),s:t=>{SN.bow(t);SN.zip(t+.02,.34);SN.thunk(t+.35)}},
  J09S13:{v:()=>{reticle(F,'#ff3a3a',.55);tint('rgba(0,0,0,.3)',.4);later(380,()=>{bullet(HP0(),F);later(40,()=>{flash(F,'#ffffff',.28,.3);sonic(F,'#ff6a6a');tint('rgba(255,255,255,.25)',.08)})})},s:t=>{SN.charge(t,.35);SN.zap(t+.38);SN.boom(t+.4,.5)}},
  J10S7:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*30,()=>multi(2,60,i=>dart([HP0()[0],HP0()[1]+(i?.02:-.02)],[p[0],p[1]+(i?.02:-.02)],{dur:.24,type:'knife',spin:1,fl:'#b03040',hit:()=>pierceHit(p,'#ffffff')})))),s:t=>{for(let i=0;i<3;i++)SN.zip(t+.02+i*.06,.2);SN.thunk(t+.28)}},
  J10S8:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*30,()=>multi(3,40,i=>dart([HP0()[0],HP0()[1]+(i-1)*.02],[p[0],p[1]+(i-1)*.02],{dur:.24,type:'needle',col:'#8be04a',fl:'#8be04a',hit:()=>{pierceHit(p,'#8be04a');if(i===2)toxic(p,.5)}})))),s:t=>{for(let i=0;i<3;i++)SN.zip(t+.02+i*.04,.2);SN.hiss(t+.28,.3)}}};
/* 法術（每招不同） */
const MG={
  J02S1:{v:()=>comet(HP0(),F,'#b98aff',.014,.26,{arc:.04,tail:12,hit:()=>{flash(F,'#d8b8ff',.14,.25);bits(F,{n:10,spd:[.5,1.1],sz:[.003,.006],life:[.2,.4],col:'#d8b8ff'})}}),s:t=>{SN.zip(t,.2);SN.ring(t+.25,1200,.05,.3)},el:'dark'},
  J02S2:{v:()=>{charge(HP0(),'#ff8a2a',{R:.06,life:.25});later(120,()=>fireball(HP0(),F,{sz:1.3,hit:()=>fireBurst(F,1.2)}))},s:t=>{SN.ignite(t);SN.roar(t+.15,.35,.3);SN.boom(t+.47,.6)},el:'fire'},
  J02S3:{v:()=>frostBolt(HP0(),F,{p:.6,hit:()=>{iceChain(F);flash(F,'#d8f4ff',.12,.25)}}),s:t=>{SN.frost(t);SN.zip(t+.05,.2);SN.ring(t+.3,2800,.05,.4)},el:'ice'},
  J02S7:{aoe:1,v:k=>{rune(F,'#ff6a1a',{R:.16,life:.8});aoePts(k).forEach((p,j)=>later(j*50,()=>multi(4,70,i=>{const t=[p[0]+rnd2(-.04,.04),p[1]+rnd2(-.02,.04)];fireball([t[0]+.08,-.12],t,{dur:.26,sz:.6,arc:0,hit:()=>fireBurst(t,.5,i<3)})})))},s:t=>{SN.ignite(t);for(let i=0;i<4;i++)SN.roar(t+.25+i*.07,.4,.3);SN.boom(t+.4,.5)},el:'fire'},
  J02S8:{aoe:1,v:k=>{aoePts(k).forEach((p,j)=>later(j*70,()=>{fogL(p,'rgba(200,238,255,.9)',{R:.09,a:.3,life:1.1,n:7});twinkle(p,'#e8f8ff',6,{life:1,sx:.08,sy:.06})}));tint('rgba(180,230,255,.15)',.3)},s:t=>{SN.wind(t);SN.frost(t+.2)},el:'ice'},
  J02S9:{v:()=>later(80,()=>bolt(F,'#fff3a0')),s:t=>{SN.zap(t+.08);SN.crackle(t+.2,.4)},el:'thunder'},
  J02S10:{v:()=>{rune(F,'#ff6a1a',{R:.14,life:.6});later(120,()=>fireWall(F))},s:t=>{SN.ignite(t);SN.roar(t+.12,1,.5)},el:'fire'},
  J02S13:{v:()=>{charge(HP0(),'#ff6a1a',{R:.09,life:.35});later(200,()=>fireball(HP0(),F,{dur:.4,sz:2.1,hit:()=>{fireBurst(F,1.6);tint('rgba(255,140,40,.25)',.2)}}))},s:t=>{SN.charge(t,.3);SN.ignite(t+.2);SN.boom(t+.62,.9)},el:'fire'},
  J07S1:{v:()=>starShot(HP0(),F,'#ffe08a'),s:t=>{SN.star(t);SN.zip(t+.02,.3);SN.star(t+.32)},el:'holy'},
  J07S2:{v:()=>{charge(HP0(),'#ffd27a',{R:.06,life:.25});later(120,()=>fireball(HP0(),F,{sz:1.2,hit:()=>{fireBurst(F,1);starBurst(F,1);rays(F,'#ffd27a',{R:.2})}}))},s:t=>{SN.ignite(t);SN.boom(t+.46,.5);SN.star(t+.5)},el:'fire'},
  J07S3:{v:()=>{rune(F,'#8fdcff',{R:.15,life:.9});later(250,()=>{crystals(F,'#8fdcff',{n:6,h:.12,sp:.12,life:.8,gy:GY(F)});starBurst(F,.6)});later(200,()=>shieldFx(H,'#bfe8ff',1))},s:t=>{SN.frost(t);SN.star(t+.25);SN.shield(t+.3)},el:'ice'},
  J07S7:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*80,()=>fireTornado(p))),s:t=>{SN.ignite(t);SN.roar(t+.1,1.1,.5);SN.wind(t+.1)},el:'fire'},
  J07S8:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*70,()=>iceNova(p))),s:t=>{SN.shatter(t+.05);SN.frost(t+.15)},el:'ice'},
  J07S9:{v:()=>{comet(HP0(),F,'#fff3a0',.02,.28,{arc:.03,hit:()=>thunderBall(F)})},s:t=>{SN.crackle(t,.3);SN.zap(t+.3);SN.boom(t+.3,.4)},el:'thunder'},
  J07S12:{v:()=>multi(4,70,i=>starShot(HP0(),F,i%2?'#ffd27a':'#ff9a4a',{dur:.3,sz:.7,arc:(i-1.5)*.06,hit:i===3?()=>{starBurst(F,.8);fireBurst(F,.6,1)}:()=>flash(F,'#ffd27a',.06,.15)})),s:t=>{for(let i=0;i<4;i++)SN.star(t+i*.07);SN.boom(t+.5,.4)},el:'fire'},
  J07S13:{v:()=>{cel(.5,(c,k)=>{const [x,y]=P2(HP0()),u=U(),R=u*.09*eo(k*2);ADD(c);c.fillStyle=rg(c,x,y,R,[[0,'#ffffff'],[.3,'#ffe08a'],[.7,'#ff6a1a'],[1,T0]]);c.fillRect(x-R,y-R,R*2,R*2)});later(320,()=>fireball(HP0(),F,{dur:.45,sz:2.6,hit:()=>{fireBurst(F,1.8);starBurst(F,1.4);tint('rgba(255,200,120,.35)',.25);shock(F,'#ffe08a',.5,.6,.35)}}))},s:t=>{SN.charge(t,.35);SN.ignite(t+.3);SN.boom(t+.77,1);SN.star(t+.8)},el:'fire'},
  J08S1:{v:()=>darkOrb(HP0(),F,{p:.6}),s:t=>{SN.whisper(t);SN.drone(t+.15,.4)},el:'dark'},
  J08S2:{v:()=>{rune(F,'#a050e0',{R:.13,life:.8});later(250,()=>{acid(F);corrodeDrip(F)})},s:t=>{SN.drone(t,.5);SN.hiss(t+.25,.6)},el:'dark'},
  J08S3:{v:()=>{darkOrb(HP0(),F,{p:.6,hit:()=>{shadow(F,.7);soulPull(F)}})},s:t=>{SN.whisper(t);SN.drone(t+.2,.6);SN.mana(t+.6)},el:'dark'},
  J08S7:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*60,()=>toxic(p,1))),s:t=>{SN.hiss(t,.8);SN.bubble(t+.2,7)},el:'poison'},
  J08S8:{aoe:1,v:k=>{const pts=aoePts(k);ray(HP0(),F,'#5a1a8a',.02,.45,{wavy:true});shadowWave(pts)},s:t=>{SN.drone(t,.6);for(let i=0;i<4;i++)SN.thud(t+.1+i*.06,.25)},el:'dark'},
  J08S9:{v:()=>{chains(F,'#b88aff');later(300,()=>downArrows(F,'#b88aff'))},s:t=>{for(let i=0;i<4;i++)SN.ring(t+i*.06,900+i*100,.04,.3);SN.down(t+.3)},el:'dark'},
  J08S10:{v:()=>{ray(F,HP0(),'#ff2a5a',.016,.6,{wavy:true});later(200,()=>{edgeFx(F,0,'blood');multi(5,60,()=>comet([F[0]+rnd2(-.03,.03),F[1]],H,'#ff4a6a',.009,.4,{arc:rnd2(-.1,.1),hit:false}))})},s:t=>{SN.drone(t,.5);SN.splat(t+.2);SN.heal(t+.5)},el:'dark'},
  J08S12:{v:()=>multi(3,80,i=>comet(HP0(),F,'#b05ae0',.011,.26,{arc:(i-1)*.06,hit:i===2?()=>acid(F):false})),s:t=>{for(let i=0;i<3;i++)SN.zip(t+i*.08,.24);SN.hiss(t+.4,.4)},el:'dark'},
  J08S13:{v:()=>darkSigil(F),s:t=>{SN.drone(t,.9);SN.boom(t+.55,.6)},el:'dark'},
  J04S1:{v:()=>comet(HP0(),F,'#ffe68a',.014,.26,{arc:.03,hit:()=>{flash(F,'#fff6d0',.14,.25);twinkle(F,'#ffffff',4,{life:.5,sx:.06,sy:.06})}}),s:t=>{SN.zip(t,.2);SN.bell(t+.27,1319)},el:'holy'},
  J04S2:{v:()=>comet(HP0(),F,'#ffd34a',.014,.26,{arc:.03,hit:()=>{flash(F,'#fff6d0',.14,.25);sigil(F,'#ffd34a',1.1)}}),s:t=>{SN.zip(t,.2);SN.bell(t+.27,1047);SN.chime(t+.3,784)},el:'holy'},
  J04S7:{aoe:1,v:k=>lightWave(aoePts(k)),s:t=>{SN.chime(t,880);SN.wind(t+.05)},el:'holy'},
  J04S8:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*40,()=>multi(5,70,()=>{const t=[p[0]+rnd2(-.05,.05),p[1]+rnd2(-.02,.05)];comet([t[0]+.03,-.1],t,'#ffe68a',.009,.22,{lin:true,tail:8,hit:()=>{flash(t,'#fff6d0',.07,.2);twinkle(t,'#ffffff',2,{life:.4})}})}))),s:t=>{for(let i=0;i<5;i++)SN.bell(t+.15+i*.07,1568+i*120)},el:'holy'},
  J04S11:{v:()=>{dia(F,PI/2,.45,.06,'#ffe68a',{life:.45});later(80,()=>holyHit(F,.9))},s:t=>{SN.cut(t,2600);SN.bell(t+.12,1175)},el:'holy'},
  J04S13:{v:()=>later(100,()=>{tint('rgba(255,255,240,.6)',.25);rays(F,'#ffffff',{R:.3,life:.6});flash(F,'#ffffff',.35,.4)}),s:t=>{SN.chime(t,1319);SN.bell(t+.1,2093)},el:'holy'},
  J11S1:{v:()=>comet(HP0(),F,'#fff6d0',.017,.26,{arc:.02,hit:()=>{shock(F,'#ffe68a',.14,.35);flash(F,'#ffffff',.14,.25)}}),s:t=>{SN.zip(t,.2);SN.bell(t+.27,1568)},el:'holy'},
  J11S2:{v:()=>{column(F,'#ffffff',{w:.05,life:.5});later(150,()=>{sigil(F,'#ffffff',1.2);rays(F,'#fff3b0',{R:.12,life:.5})})},s:t=>{SN.bell(t,1319);SN.bell(t+.15,988)},el:'holy'},
  J11S7:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*70,()=>{rays(p,'#fff3b0',{R:.14,life:.5});flash(p,'#ffffff',.16,.3);shock(p,'#ffe68a',.16,.4)})),s:t=>{SN.chime(t,1047);SN.boom(t+.1,.3)},el:'holy'},
  J11S8:{aoe:1,v:k=>feathers(aoePts(k)),s:t=>{SN.chime(t,1319);SN.bell(t+.5,1568)},el:'holy'},
  J11S11:{v:()=>holyCross(F),s:t=>{SN.bell(t,1175);SN.boom(t+.1,.3)},el:'holy'},
  J11S13:{v:()=>lightSword(F),s:t=>{SN.bell(t,1568);SN.boom(t+.28,.6);SN.chime(t+.3,1047)},el:'holy'}};
/* 由設計表產生配方；沒有列到的用舊規則 */
function designed(k){const x=SK[k];if(!x)return null;const R=(v,s,el)=>({v,s,el});
  if(SL[k]){const P=SL[k];return R(()=>{lunge('me',30);if(/armorcut/.test(P.ef||'')){armorCut(F,P.a||-.5,P.c,P.ef==='armorcut2');later(200,()=>{const tot=slashP(F,P);slashExtra(F,P,tot)});return}const tot=slashP(F,P);slashExtra(F,P,tot)},()=>{if(/armorcut/.test(P.ef||'')){SN.guard(.05);slashSnd(P,.3);SN.shatter(.36)}else slashSnd(P,.1)},P.ef==='poison'?'poison':'slash')}
  if(SW[k]){const P=SW[k];return R(()=>{lunge('me',30);sweep(aoePts(k),P);if(P.ef==='crack')aoePts(k).forEach((p,i)=>later(80+i*40,()=>smash(p,P.c,{p:.6,crack:1})))},()=>{SN.swish(.1,1.4,1);SN.ring(.18,P.c2?2400:1900,.07,.3);if(P.c2)SN.swish(.2,1,1);if(P.ef==='crack')SN.boom(.2,.4)},'slash')}
  if(k==='J01S8')return R(()=>{lunge('me',30);aoePts(k).forEach((p,n)=>later(n*45,()=>{arcSweep(p,'#8fd0ff',{rx:.1,ry:.035,w:.011,turns:1.15,span:3.2,life:.5});wind(p,'#e0f4ff',{dir:1,n:3,life:.4});later(330,()=>{spk(p,'#ffffff',.08,8,.2);shock(p,'#8fd0ff',.14,.35,.35)})}))},()=>{SN.swish(.1,1.2,1);SN.swish(.25,1,1);SN.ring(.42,2100,.06,.3)},'slash');
  if(k==='J06S7')return R(()=>{lunge('me',30);aoePts(k).forEach((p,n)=>later(n*55,()=>{arcSweep(p,'#ff7a2a',{rx:.13,ry:.045,w:.026,turns:2,span:3.8,life:.75,dy:.03});later(200,()=>fogL([p[0],p[1]+GY(p)-.02],'rgba(200,170,130,.8)',{R:.09,n:6,rise:.04,life:.8,a:.5}));later(560,()=>smash(p,'#ff8a5a',{p:.8}))}))},()=>{SN.heavy(.08);SN.wind(.15);SN.heavy(.4);SN.thud(.62,.6)},'slash');
  if(k==='J13S7')return R(()=>{lunge('me',30);aoePts(k).forEach((p,i)=>later(i*50,()=>{swirlBlade(p,'#7ff0ff',{dir:1,R:.075});swirlBlade(p,'#ff7ad8',{dir:-1,R:.075});later(380,()=>spk(p,'#ffffff',.08,8,.2))}))},()=>{for(let i=0;i<5;i++)SN.swish(.1+i*.07,.6,1);SN.ring(.45,2400,.06,.3)},'slash');
  if(BL[k])return R(()=>BL[k](k),()=>(BLS[k]||(t=>SN.blunt(t)))(.05),/J12/.test(k)?'holy':'rock');
  if(RA[k]){const r=RA[k];return R(()=>{castPose('me');r.v(k)},()=>r.s(0),'pierce')}
  if(MG[k]){const r=MG[k];return R(()=>{castPose('me');r.v(k)},()=>r.s(0),r.el)}
  return null}
/* 自身招式：每招不同 */
const SF={
  J05S11:{v:()=>{guardFx(H,'#8fc8ff');later(100,()=>{shock(H,'#8fc8ff',.22,.5,.3,{gy:.12});crystals(H,'#b8d8ff',{n:4,h:.06,sp:.1,life:.7,gy:GY(H)})})},s:t=>{SN.guard(t);SN.thud(t+.1,.4)}},
  J04S12:{v:()=>{bubble(H,'#ffe27a',{R:.16,life:.9});rays(H,'#fff3b0',{R:.14,life:.6})},s:t=>{SN.chime(t,1047);SN.shield(t+.1)}},
  J11S12:{v:()=>{rune(H,'#ffffff',{R:.15,life:.9});later(150,()=>guardFx(H,'#ffffff'))},s:t=>{SN.bell(t,1568);SN.guard(t+.15)}},
  J03S11:{v:()=>{reticle(F,'#9ae05a',.9);charge(H,'#c8ffa0',{R:.06,life:.4})},s:t=>{SN.charge(t,.3);SN.ring(t+.3,2600,.04,.2)}},
  J09S11:{v:()=>{reticle(F,'#ff4a4a',1);later(200,()=>reticle(F,'#ffffff',.6));tint('rgba(0,0,0,.15)',.3)},s:t=>{SN.charge(t,.35);SN.ring(t+.35,3200,.05,.25)}},
  J02S12:{v:()=>{for(let i=0;i<8;i++){const a=i/8*6.283;later(i*30,()=>comet([H[0]+Math.cos(a)*.2,H[1]+Math.sin(a)*.15],H,'#8fc8ff',.008,.4,{hit:false,tail:8}))}later(400,()=>flash(H,'#8fc8ff',.12,.3))},s:t=>{SN.whisper(t);SN.mana(t+.35)}},
  J07S11:{v:()=>{manaFx(H);twinkle(H,'#bfe0ff',6,{rise:.14,life:1})},s:t=>{SN.mana(t);SN.star(t+.2)}},
  J04S9:{v:()=>{column(H,'#cfeeff',{w:.07,life:.6});later(120,()=>twinkle(H,'#ffffff',6,{rise:.12}))},s:t=>{SN.bell(t,1568)}},
  J11S9:{v:()=>{column(H,'#ffffff',{w:.11,life:.8});for(let i=0;i<2;i++)later(i*180,()=>shock(H,'#e8f8ff',.18+i*.08,.5,.35,{gy:.12}));later(200,()=>rays(H,'#ffffff',{R:.18}))},s:t=>{SN.bell(t,1568);SN.chime(t+.15,1047);SN.bell(t+.35,2093)}},
  J04S3:{v:()=>healFx(H,'#7fe08a',.8),s:t=>SN.heal(t)},
  J04S10:{v:()=>{column(H,'#9affc0',{w:.06,life:.6});later(150,()=>healFx(H,'#7fe08a',1))},s:t=>{SN.bell(t,1319);SN.heal(t+.15)}},
  J11S3:{v:()=>{rays(H,'#ffe8a0',{R:.22,life:1});later(100,()=>healFx(H,'#ffe8a0',1));later(250,()=>twinkle(H,'#ffffff',6,{rise:.15}))},s:t=>{SN.chime(t,784);SN.heal(t+.2)}},
  J11S10:{v:()=>{rune(H,'#7fe08a',{R:.17,life:1});later(200,()=>{column(H,'#c8ffd0',{w:.1,life:.7});healFx(H,'#7fe08a',1.4)})},s:t=>{SN.chime(t,659);SN.heal(t+.2);SN.bell(t+.4,1319)}}};

/* ================= 擬真元素：粒子系統（預先畫好的柔光貼圖，大量粒子也不卡） ================= */
const SPR={};function spr(r,g,b,hard){const key=r+','+g+','+b+(hard?'h':'');if(SPR[key])return SPR[key];const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,`rgba(${r},${g},${b},1)`);gr.addColorStop(hard?.5:.25,`rgba(${r},${g},${b},${hard?.9:.6})`);gr.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,64,64);return SPR[key]=c}
/* 火焰色溫：白→黃→橘→紅→暗 */
const FT=[[255,225,150],[255,175,70],[255,125,35],[230,80,18],[175,42,10],[95,22,6]];
const FTS=FT.map(c=>spr(c[0],c[1],c[2]));const SMK=[spr(55,48,45),spr(35,30,30),spr(80,72,68)];const VAP=spr(225,245,255);const GAS=[spr(70,140,30),spr(110,190,50),spr(40,90,20)];const DRK=[spr(40,10,60),spr(20,5,30),spr(90,40,140)];
const PS=[];let PSon=0,PSt=0;
function psRun(){if(PSon)return;PSon=1;PSt=performance.now();run();cel(9999,(c,k,p)=>{const nw=performance.now(),dt=Math.min(.05,(nw-PSt)/1000)*(window.FXSPD||1);PSt=nw;
  for(let i=PS.length-1;i>=0;i--){const q=PS[i];q.age+=dt;if(q.age>=q.life){PS.splice(i,1);continue}const f=Math.exp(-q.drag*dt);q.vx*=f;q.vy*=f;q.vy+=q.ay*dt;q.vx+=Math.sin(q.age*q.wf+q.ph)*q.wob*dt;q.x+=q.vx*dt;q.y+=q.vy*dt}
  /* 先畫煙（遮蔽），再畫發光的火 */
  c.globalCompositeOperation='source-over';for(const q of PS){if(q.add)continue;const t=q.age/q.life,s=q.s0+(q.s1-q.s0)*t,a=q.a*(t<.15?t/.15:1-(t-.15)/.85);if(a<=.005)continue;c.globalAlpha=a;const im=q.im;c.drawImage(im,q.x-s,q.y-s,s*2,s*2)}
  c.globalCompositeOperation='lighter';for(const q of PS){if(!q.add)continue;const t=q.age/q.life,s=q.s0+(q.s1-q.s0)*t;let a=q.a*(t<.08?t/.08:1-Math.pow(t,1.4));if(a<=.005)continue;let im=q.im;if(q.fire){const ix=Math.min(FTS.length-1,Math.floor(t*FTS.length*(q.cool||1)));im=FTS[ix];a*=1-ix*.06}c.globalAlpha=Math.min(1,a);if(q.fire)c.drawImage(im,q.x-s,q.y-s*1.9,s*2,s*3);else c.drawImage(im,q.x-s,q.y-s,s*2,s*2)}
  if(!PS.length){PSon=0;p.age=1e9}},{});}
/* 發射：f 為舞台比例座標，v 為速度（舞台寬度/秒） */
function pe(f,o){const [x,y]=P2(f),u=U();const n=o.n||1;for(let i=0;i<n;i++){const a=(o.a??-PI/2)+rnd2(-1,1)*(o.spr??PI),sp=rnd2(o.v0??.05,o.v1??.2)*u;PS.push({x:x+rnd2(-1,1)*(o.jx||0)*u,y:y+rnd2(-1,1)*(o.jy||0)*u,vx:Math.cos(a)*sp+(o.vx||0)*u,vy:Math.sin(a)*sp+(o.vy||0)*u,ay:(o.ay||0)*u,drag:o.drag??2,
  life:rnd2(o.l0||.4,o.l1||.8),age:0,s0:(o.s0||.01)*u*rnd2(.7,1.3),s1:(o.s1||.03)*u*rnd2(.7,1.3),a:o.al??1,add:!!o.add,fire:!!o.fire,cool:o.cool||1,im:Array.isArray(o.im)?o.im[i%o.im.length]:o.im||FTS[0],wob:(o.wob||0)*u,wf:rnd2(4,9),ph:Math.random()*6})}if(PS.length>900)PS.splice(0,PS.length-900);psRun()}
/* ---------- 火 ---------- */
function flameAt(f,o){o=o||{};pe(f,Object.assign({n:6,a:-PI/2,spr:.45,v0:.08,v1:.22,ay:-.5,drag:1.6,l0:.35,l1:.7,s0:.032,s1:.006,al:.38,add:1,fire:1,jx:.02,jy:.01,wob:.25},o))}
function smokeAt(f,o){o=o||{};pe(f,Object.assign({n:3,a:-PI/2,spr:.6,v0:.03,v1:.08,ay:-.12,drag:1.2,l0:1,l1:1.6,s0:.02,s1:.07,al:.35,im:SMK,jx:.02,wob:.15},o))}
function fireball(from,to,o){o=o||{};const dur=o.dur||.3,sz=o.sz||1;let last=0;
  cel(dur,(c,k0)=>{const el=k0*dur,k=Math.min(1,el/dur),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),e=eo(k),arc=(o.arc??.05)*u,x=x0+(x1-x0)*e,y=y0+(y1-y0)*e-Math.sin(PI*e)*arc,fx=[(x-SR().x)/SR().w,(y-SR().y)/SR().h];
    const dx=(x1-x0)/dur/SR().w,dy=(y1-y0)/dur/SR().w;
    /* 拖尾：持續從火球噴出往後飄、往上竄的火與煙 */
    if(el-last>.016){last=el;pe(fx,{n:Math.round(3*sz),a:Math.atan2(-dy,-dx),spr:.6,v0:.05,v1:.15,vx:-dx*.15,vy:-dy*.15,ay:-.4,drag:2.5,l0:.2,l1:.4,s0:.04*sz,s1:.008*sz,al:.35,add:1,fire:1,wob:.3});if(Math.random()<.5)smokeAt(fx,{n:1,s0:.015*sz,s1:.05*sz,l0:.5,l1:.9,al:.25})}
    const R=u*.026*sz;ADD(c);c.globalAlpha=.8;c.drawImage(FTS[2],x-R*2,y-R*2,R*4,R*4);c.globalAlpha=1;c.drawImage(FTS[0],x-R*.8,y-R*.8,R*1.6,R*1.6)});
  later(dur*1000,()=>{if(o.hit)o.hit();else fireBurst(to,sz)})}
function fireBurst(f,p,lite){p=p||1;flash(f,'#ffd080',.18*p,.25);
  /* 爆炎：放射後被空氣拖慢、受熱上浮 */
  pe(f,{n:Math.round(26*p),spr:PI,v0:.15*p,v1:.5*p,ay:-.35,drag:4.5,l0:.35,l1:.8,s0:.05*p,s1:.012,al:.36,add:1,fire:1,cool:1.15,wob:.3});pe(f,{n:Math.round(10*p),spr:PI,v0:.25*p,v1:.6*p,ay:-.2,drag:5,l0:.2,l1:.4,s0:.016,s1:.004,al:.8,add:1,fire:1});
  pe(f,{n:Math.round(5*p),spr:PI,v0:.02,v1:.08,ay:-.2,drag:3,l0:.12,l1:.2,s0:.05*p,s1:.02,al:.6,add:1,im:FTS[0]});
  bits(f,{n:Math.round(10*p),col:'#ffc060',spd:[.5,1.3],life:[.3,.6]});
  if(!lite){later(150,()=>smokeAt(f,{n:Math.round(7*p),spr:1,v0:.04,v1:.12,s0:.03*p,s1:.1*p,l0:1,l1:1.7,al:.38,jx:.03,jy:.02}));
    cel(1.1,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U();c.globalAlpha=(1-k)*.45;c.translate(x,gy);c.scale(1,.25);c.fillStyle=rg(c,0,0,u*.1*p,[[0,'rgba(30,20,15,.9)'],[.6,'rgba(120,40,10,.5)'],[1,T0]]);c.beginPath();c.arc(0,0,u*.1*p,0,7);c.fill()})}}
function flames(f,col,o){o=o||{};const n=o.n||8,dur=(o.life||.7)*.75,sp=o.sp||.06,gy=o.gy??GY(f);let t=0;const id=setInterval(()=>{t+=.05;if(t>dur){clearInterval(id);return}for(let i=0;i<Math.max(1,Math.round(n/3));i++)flameAt([f[0]+rnd2(-sp,sp),f[1]+gy],{n:2,v1:.12+(o.h||.1)*1.5,s0:.02+(o.h||.1)*.12,l1:.5+(o.h||.1)*2})},50/(window.FXSPD||1))}
function fireWall(f){const gy=GY(f);let t=0;const id=setInterval(()=>{t+=.05;if(t>.9){clearInterval(id);return}for(let i=0;i<6;i++){const bx=f[0]+(i-2.5)*.035;flameAt([bx,f[1]+gy],{n:2,v0:.15,v1:.35,s0:.035,l0:.45,l1:.9,spr:.2,jx:.012})}if(Math.random()<.5)smokeAt([f[0]+rnd2(-.08,.08),f[1]+gy-.12],{n:1,al:.25})},50/(window.FXSPD||1));later(80,()=>flash(f,'#ff9a40',.2,.6))}
function fireTornado(f){let t=0;const gy=GY(f);const id=setInterval(()=>{t+=.04;if(t>1){clearInterval(id);return}for(let i=0;i<4;i++){const h=Math.random(),a=t*14+i*1.57,r=.02+h*.07;pe([f[0]+Math.cos(a)*r,f[1]+gy-h*.3],{n:1,a:a+PI/2,spr:.2,v0:.1,v1:.2,ay:-.3,drag:2,l0:.3,l1:.5,s0:.022,s1:.008,add:1,fire:1})}},40/(window.FXSPD||1));bits(f,{n:14,col:'#ffb040',spd:[.4,1],life:[.5,1]})}
/* ---------- 冰：多面晶體（亮面／暗面／高光邊）、地面霜紋、下沉的冷霧 ---------- */
function crystal(c,x,y,h,w,tilt,col){c.save();c.translate(x,y);c.rotate(tilt);c.globalCompositeOperation='source-over';
  c.beginPath();c.moveTo(0,-h);c.lineTo(w,-h*.7);c.lineTo(w*.8,0);c.lineTo(0,0);c.closePath();c.fillStyle='rgba(120,190,235,.9)';c.fill();
  c.beginPath();c.moveTo(0,-h);c.lineTo(-w,-h*.72);c.lineTo(-w*.8,0);c.lineTo(0,0);c.closePath();c.fillStyle='rgba(225,245,255,.92)';c.fill();
  c.beginPath();c.moveTo(-w,-h*.72);c.lineTo(0,-h);c.lineTo(w,-h*.7);c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=1.2;c.stroke();c.beginPath();c.moveTo(0,-h);c.lineTo(0,0);c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.stroke();
  ADD(c);c.globalAlpha*=.35;c.fillStyle=col||'#8fdcff';c.beginPath();c.moveTo(0,-h);c.lineTo(w,-h*.7);c.lineTo(w*.8,0);c.lineTo(-w*.8,0);c.lineTo(-w,-h*.72);c.closePath();c.fill();c.restore()}
function crystals(f,col,o){o=o||{};const n=o.n||6,sd=[...Array(n)].map((_,i)=>[(i-(n-1)/2)/(n-1||1)*(o.sp||.15)*2+rnd2(-.01,.01),.55+Math.random()*.6,rnd2(-.4,.4)]);cel(o.life||.8,(c,k)=>{const [x,y]=P2(f),gy=y+(o.gy??GY(f))*SR().h,u=U();const fd=k<.7?1:1-(k-.7)/.3;
  sd.forEach(([dx,hh,tl],i)=>{const g=eo((k-i*.02)*5);if(g<=0)return;const h=u*(o.h||.14)*hh*g;c.globalAlpha=fd;crystal(c,x+dx*u,gy,h,h*.24,tl,col)})})}
function frostRime(f,o){o=o||{};cel(o.life||1.1,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U(),g=eo(k*2.5);ADD(c);c.globalAlpha=(k<.7?.85:.85*(1-(k-.7)/.3));c.strokeStyle='#d8f4ff';c.lineWidth=Math.max(1,u*.002);c.translate(x,gy);c.scale(1,.3);
  c.beginPath();for(let i=0;i<9;i++){const a=i/9*6.283+.2,L=u*.12*g*(.6+.4*Math.sin(i*5));c.moveTo(0,0);c.lineTo(Math.cos(a)*L,Math.sin(a)*L);for(let j=1;j<3;j++){const px=Math.cos(a)*L*j/3,py=Math.sin(a)*L*j/3,bl=L*.25;c.moveTo(px,py);c.lineTo(px+Math.cos(a+.6)*bl,py+Math.sin(a+.6)*bl);c.moveTo(px,py);c.lineTo(px+Math.cos(a-.6)*bl,py+Math.sin(a-.6)*bl)}}c.stroke()})}
function coldMist(f,p){p=p||1;pe([f[0],f[1]+GY(f)*.6],{n:Math.round(8*p),spr:PI,v0:.02,v1:.08,ay:.03,drag:1.5,l0:.8,l1:1.4,s0:.02,s1:.07*p,al:.35,im:VAP,jx:.05,jy:.02,wob:.1})}
function iceSpike(f,p){p=p||1;coldMist(f,p);frostRime(f);crystals(f,'#8fdcff',{n:Math.round(4+p*3),h:.12*p,sp:.07*p,life:.9,gy:GY(f)});
  later(120,()=>{flash(f,'#e0f6ff',.12*p,.25);physL(f,'shard',Math.round(6+p*4),{spd:[.5,1.2],sz:[.006,.012],life:[.6,1],ice:1,col:'#9fe2ff'});bits(f,{n:8,col:'#e8f8ff',spd:[.4,1],life:[.3,.6]})})}
/* 冰槍：細長多面晶體飛行，沿途留下冷霧 */
function frostBolt(from,to,o){o=o||{};const dur=o.dur||.26;let last=0;cel(dur,(c,k0)=>{const el=k0*dur,k=Math.min(1,el/dur),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),e=eo(k),x=x0+(x1-x0)*e,y=y0+(y1-y0)*e,a=Math.atan2(y1-y0,x1-x0);
    if(el-last>.02){last=el;pe([(x-SR().x)/SR().w,(y-SR().y)/SR().h],{n:2,spr:PI,v0:.01,v1:.04,ay:.02,drag:2,l0:.4,l1:.7,s0:.012,s1:.035,al:.4,im:VAP})}
    c.translate(x,y);c.rotate(a+PI/2);const h=u*.08;c.globalAlpha=1;crystal(c,0,h*.45,h,h*.16,0,'#bff0ff')});
  later(dur*1000,()=>{(o.hit||iceSpike)(to,o.p||.8)})}
function iceNova(f){flash(f,'#e8f8ff',.16,.3);coldMist(f,1.2);frostRime(f,{life:1});cel(.6,(c,k)=>{const [x,y]=P2(f),u=U(),fd=1-k;for(let i=0;i<10;i++){const a=i/10*6.283,r=u*.03+u*.14*eo(k*2.2),px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.8;c.globalAlpha=fd;crystal(c,px,py,u*.035,u*.012,a+PI/2,'#9fe2ff')}});physL(f,'shard',10,{spd:[.6,1.4],sz:[.006,.012],life:[.6,1],ice:1,col:'#9fe2ff'})}
/* ---------- 雷：中點位移分岔，多次閃爍，落點電漿 ---------- */
function lpath(x0,y0,x1,y1,d,o){if(d<=0)return[[x0,y0],[x1,y1]];const mx=(x0+x1)/2+rnd2(-1,1)*o,my=(y0+y1)/2+rnd2(-1,1)*o*.3,A=lpath(x0,y0,mx,my,d-1,o/2),Bp=lpath(mx,my,x1,y1,d-1,o/2);return A.concat(Bp.slice(1))}
function bolt(f,col,o){o=o||{};col=vivid(col||'#cfe0ff');let strokes=null,last=-1;const life=o.life||.55;
  cel(life,(c,k)=>{const [x,y]=P2(f),u=U();if(!strokes||k-last>.13){last=k;const sx=x+rnd2(-.05,.05)*u,top=SR().y-8;const main=lpath(sx,top,x,y,6,u*.12);strokes=[[main,1]];
      for(let i=0;i<4;i++){const j=2+Math.floor(Math.random()*(main.length-6)),[bx,by]=main[j];strokes.push([lpath(bx,by,bx+rnd2(-.08,.08)*u,by+rnd2(.04,.1)*u,4,u*.04),.4])}}
    const vis=k<.12||(k>.18&&k<.34)||(k>.42&&k<.52);if(!vis)return;ADD(c);c.lineJoin='round';c.lineCap='round';
    for(const [pts,wm] of strokes){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.globalAlpha=.5;c.strokeStyle=col;c.lineWidth=u*.014*wm;c.stroke();c.globalAlpha=1;c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,u*.004*wm);c.stroke()}
    c.globalAlpha=.8;const R=u*.08;c.drawImage(spr(220,230,255),x-R,y-R,R*2,R*2)});
  later(20,()=>{tint('rgba(220,230,255,.35)',.08);flash(f,'#ffffff',.18,.2)});later(220,()=>tint('rgba(220,230,255,.18)',.06));
  later(60,()=>{shock(f,col,.18,.35,.3,{gy:.12});arcs(f,col,.6);bits(f,{n:16,col:'#e8f0ff',spd:[.6,1.6],life:[.2,.5]});pe([f[0],f[1]+GY(f)],{n:6,spr:PI,v0:.02,v1:.06,ay:-.05,l0:.5,l1:.9,s0:.015,s1:.05,al:.25,im:VAP})})}
function arcs(f,col,life){col=vivid(col);cel(life||.4,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);for(let j=0;j<3;j++){if(Math.random()<.45)continue;const a=Math.random()*6.283,r=u*rnd2(.03,.08),p=lpath(x+Math.cos(a)*r*.3,y+Math.sin(a)*r*.3,x+Math.cos(a)*r,y+Math.sin(a)*r,3,u*.03);c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.globalAlpha=(1-k)*.9;c.strokeStyle=col;c.lineWidth=Math.max(1,u*.0035);c.stroke();c.strokeStyle='#ffffff';c.lineWidth=1;c.stroke()}})}
function thunderBall(f){cel(.6,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*.06*(k<.5?eo(k*2):1+(k-.5)*3);ADD(c);c.globalAlpha=k<.5?1:1-(k-.5)/.5;c.drawImage(spr(230,235,255),x-R*1.6,y-R*1.6,R*3.2,R*3.2);c.drawImage(spr(255,255,255),x-R*.6,y-R*.6,R*1.2,R*1.2);
  for(let j=0;j<5;j++){const a=Math.random()*6.283,p=lpath(x,y,x+Math.cos(a)*R*1.6,y+Math.sin(a)*R*1.6,3,u*.02);c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.strokeStyle='#e8f0ff';c.lineWidth=Math.max(1,u*.003);c.stroke()}});later(260,()=>{shock(f,'#dfe8ff',.26,.4);arcs(f,'#dfe8ff',.5);bits(f,{n:14,col:'#e8f0ff',spd:[.6,1.5],life:[.2,.5]})})}
/* ---------- 毒：翻滾的毒氣團 ---------- */
function toxic(f,p){p=p||1;pe(f,{n:Math.round(14*p),spr:PI,v0:.02,v1:.08,ay:-.03,drag:1.2,l0:1,l1:1.6,s0:.02,s1:.07*p,al:.42,im:GAS,jx:.04,jy:.03,wob:.12});pe(f,{n:Math.round(5*p),spr:PI,v0:.01,v1:.04,l0:.6,l1:1,s0:.015,s1:.04,al:.35,add:1,im:spr(160,255,90)});
  physL(f,'drop',Math.round(5+p*4),{spd:[.3,.8],sz:[.004,.008],life:[.5,.9],col:'#8be04a'});
  cel(1,(c,k)=>{const [x,y]=P2(f),u=U();for(let i=0;i<6;i++){const t=(k*1.4+i/6)%1,bx=x+Math.sin(i*2.7)*u*.07,by=y+u*.06-t*u*.12,r=u*.008*(.6+Math.sin(i)*.4)*(t<.85?1:1+(t-.85)*8);c.globalAlpha=(t<.85?.8:1-(t-.85)/.15)*(1-k*.5);c.strokeStyle='#c8ff8a';c.lineWidth=1;c.fillStyle='rgba(120,220,60,.35)';c.beginPath();c.arc(bx,by,r,0,7);c.fill();c.stroke()}})}
/* ---------- 暗：濃黑煙＋紫色邊光 ---------- */
function shadow(f,p){p=p||1;pe(f,{n:Math.round(14*p),spr:PI,v0:.03,v1:.1,ay:-.06,drag:1.6,l0:.8,l1:1.3,s0:.02,s1:.065*p,al:.5,im:DRK,jx:.03,jy:.03,wob:.15});pe(f,{n:Math.round(10*p),spr:PI,v0:.05,v1:.15,ay:-.1,drag:2,l0:.5,l1:.9,s0:.012,s1:.03,al:.55,add:1,im:spr(170,100,255)});swirl(f,'#a060ff',{R:.1*p,life:.8});
  /* 向內收縮的暗環＋紫色碎光（取代原本地上竄出的黑影） */
  cel(.6,(c,k)=>{const [x,y]=P2(f),u=U(),r=u*.12*p*(1-eo(k*1.6)*.8);ADD(c);c.globalAlpha=1-k;c.strokeStyle='#b88aff';c.lineWidth=Math.max(1.5,u*.006*(1-k));c.beginPath();c.ellipse(x,y,r,r*.8,0,0,7);c.stroke()});bits(f,{n:Math.round(8*p),col:'#c9a0ff',spd:[.3,.9],life:[.3,.6]})}

/* 腐蝕：地上一灘冒泡的酸液，嘶嘶冒出紫綠色酸霧 */
function acidPool(f,p){p=p||1;cel(1.2,(c,k)=>{const [x,y]=P2(f),gy=y+GY(f)*SR().h,u=U(),R=u*.13*p*eo(Math.min(1,k*3)),fd=k<.7?1:1-(k-.7)/.3;c.globalAlpha=fd*.9;c.translate(x,gy);c.scale(1,.28);c.fillStyle=rg(c,0,0,R,[[0,'rgba(150,60,200,.95)'],[.7,'rgba(90,150,40,.7)'],[1,T0]]);c.beginPath();c.arc(0,0,R,0,7);c.fill();
  ADD(c);for(let i=0;i<6;i++){const t=(k*2+i/6)%1,bx=Math.cos(i*2.4)*R*.6,by=Math.sin(i*2.4)*R*.5,r=u*.012*Math.sin(PI*t);c.globalAlpha=fd*Math.sin(PI*t);c.strokeStyle='#d8a0ff';c.lineWidth=2;c.beginPath();c.arc(bx,by,r,0,7);c.stroke()}});
  pe([f[0],f[1]+GY(f)],{n:Math.round(10*p),a:-PI/2,spr:.5,v0:.04,v1:.1,ay:-.08,drag:1.4,l0:.7,l1:1.2,s0:.015,s1:.06,al:.45,im:[spr(150,70,200),spr(110,170,60)],jx:.05,wob:.15});later(100,()=>SN.hiss(0,.5))}
function corrodeDrip(f){physL(f,'drop',8,{spd:[.2,.6],sz:[.004,.008],life:[.6,1],col:'#9a4ad0'});acidPool(f,.8)}
function acid(f){physL(f,'drop',14,{spd:[.5,1.2],sz:[.004,.008],life:[.5,.9],col:'#b05ae0'});acidPool(f,1)}
/* ================= 大魔導士：星辰＋真實元素 ================= */
const STAR=spr(210,230,255),STAR2=spr(255,240,200);
/* 星塵：會閃爍的細小光點 */
function stardust(f,n,o){o=o||{};pe(f,Object.assign({n:n||14,spr:PI,v0:.05,v1:.3,ay:.02,drag:3,l0:.5,l1:1,s0:.008,s1:.002,al:.9,add:1,im:[STAR,STAR2],jx:.02,jy:.02},o))}
function starBurst(f,p){p=p||1;flash(f,'#e8f0ff',.14*p,.25);stardust(f,Math.round(20*p),{v1:.4*p});bits(f,{n:Math.round(10*p),col:'#dfe8ff',spd:[.4,1.1],life:[.3,.6]})}
/* 光芒改成柔和細長的光束（不再是三角形） */
function rays(f,col,o){o=o||{};col=vivid(col);const n=10,ang=[...Array(n)].map((_,i)=>i/n*6.283+Math.random()*.3),len=ang.map(()=>.6+Math.random()*.5);cel(o.life||.7,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*(o.R||.2)*eo(k*2),a=Math.sin(PI*Math.min(1,k*1.2));ADD(c);c.lineCap='round';
  ang.forEach((t,i)=>{const L=R*len[i],g=c.createLinearGradient(x,y,x+Math.cos(t)*L,y+Math.sin(t)*L);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.25,col);g.addColorStop(1,T0);c.strokeStyle=g;c.globalAlpha=a*.6;c.lineWidth=Math.max(1,u*.006);c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(t)*L,y+Math.sin(t)*L);c.stroke()});
  c.globalAlpha=a*.8;const r=R*.35;c.drawImage(spr(255,250,230),x-r,y-r,r*2,r*2)})}
/* 星彈：星光球拖著星塵 */
function starOrb(from,to,o){o=o||{};const dur=o.dur||.3,sz=o.sz||1;let last=0;cel(dur,(c,k0)=>{const el=k0*dur,e=eo(Math.min(1,el/dur)),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),x=x0+(x1-x0)*e,y=y0+(y1-y0)*e-Math.sin(PI*e)*u*(o.arc??.05),fx=[(x-SR().x)/SR().w,(y-SR().y)/SR().h];
  if(el-last>.016){last=el;stardust(fx,2,{v0:.02,v1:.08,l0:.3,l1:.6,s0:.01*sz});if(o.fire)flameAt(fx,{n:2,s0:.026*sz,l0:.2,l1:.35,v0:.03,v1:.08})}
  const R=u*.028*sz;ADD(c);c.globalAlpha=.9;c.drawImage(o.fire?FTS[1]:STAR,x-R*2,y-R*2,R*4,R*4);c.globalAlpha=1;c.drawImage(spr(255,255,255),x-R*.7,y-R*.7,R*1.4,R*1.4)});
  later(dur*1000,()=>{if(o.hit)o.hit();else starBurst(to,.7)})}
/* 火焰風暴：由下往上、越往上越寬的火焰漏斗，頂端冒煙 */
function fireStorm(f){const gy=GY(f);let t=0;const id=setInterval(()=>{t+=.035;if(t>1.1){clearInterval(id);return}
  for(let i=0;i<6;i++){const h=Math.random(),a=t*18+Math.random()*6.283,r=.012+h*.075;pe([f[0]+Math.cos(a)*r,f[1]+gy-h*.32],{n:1,a:-PI/2,spr:.3,v0:.04,v1:.1,vx:-Math.sin(a)*.35,ay:-.25,drag:2.5,l0:.25,l1:.45,s0:.02+h*.025,s1:.006,al:.45,add:1,fire:1})}
  if(Math.random()<.4)smokeAt([f[0]+rnd2(-.06,.06),f[1]+gy-.34],{n:1,al:.3,s1:.08})},35/(window.FXSPD||1));
  bits(f,{n:16,col:'#ffb040',spd:[.4,1.1],life:[.5,1]});later(150,()=>flash([f[0],f[1]+gy*.5],'#ff9a40',.18,.8))}
/* 太陽聚能：火粒子從四周被吸進頭上的火球 */
function sunCharge(at,dur){let t=0;const id=setInterval(()=>{t+=.03;if(t>dur){clearInterval(id);return}const [x,y]=P2(at),u=U();for(let i=0;i<4;i++){const a=Math.random()*6.283,r=.12;PS.push({x:x+Math.cos(a)*r*u,y:y+Math.sin(a)*r*u,vx:-Math.cos(a)*r*u*3,vy:-Math.sin(a)*r*u*3,ay:0,drag:0,life:.3,age:0,s0:u*.02,s1:u*.008,a:.6,add:true,fire:true,cool:.6,im:FTS[0],wob:0,wf:1,ph:0})}psRun()},30/(window.FXSPD||1));
  cel(dur,(c,k)=>{const [x,y]=P2(at),u=U(),R=u*.07*eo(k);ADD(c);c.globalAlpha=.9;c.drawImage(FTS[2],x-R*1.6,y-R*1.6,R*3.2,R*3.2);c.drawImage(FTS[0],x-R*.7,y-R*.7,R*1.4,R*1.4)})}
/* 球狀閃電：電漿球一路帶著電弧飛過去 */
function ballLightning(from,to,dur){cel(dur,(c,k0)=>{const e=eo(k0),[x0,y0]=P2(from),[x1,y1]=P2(to),u=U(),x=x0+(x1-x0)*e,y=y0+(y1-y0)*e-Math.sin(PI*e)*u*.04,R=u*.035;ADD(c);c.globalAlpha=1;c.drawImage(spr(200,215,255),x-R*1.8,y-R*1.8,R*3.6,R*3.6);c.drawImage(spr(255,255,255),x-R*.6,y-R*.6,R*1.2,R*1.2);
  c.strokeStyle='#e8f0ff';c.lineWidth=Math.max(1,u*.003);for(let j=0;j<3;j++){const a=Math.random()*6.283,p=lpath(x,y,x+Math.cos(a)*R*1.8,y+Math.sin(a)*R*1.8,3,u*.015);c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()}})}
Object.assign(MG,{
  J07S1:{v:()=>starOrb(HP0(),F),s:t=>{SN.star(t);SN.zip(t+.02,.3);SN.star(t+.3);SN.thud(t+.3,.2)},el:'holy'},
  J07S2:{v:()=>{stardust(HP0(),10,{v1:.15});later(100,()=>starOrb(HP0(),F,{fire:1,sz:1.4,dur:.32,hit:()=>{fireBurst(F,1.1);starBurst(F,.9)}}))},s:t=>{SN.ignite(t);SN.star(t+.1);SN.boom(t+.44,.6);SN.star(t+.46)},el:'fire'},
  J07S3:{v:()=>{coldMist(F,1.2);frostRime(F,{life:1.2});later(150,()=>crystals(F,'#8fdcff',{n:7,h:.14,sp:.12,life:1,gy:GY(F)}));later(250,()=>{stardust(F,14,{im:[VAP,STAR]});shieldFx(H,'#bfe8ff',1)})},s:t=>{SN.frost(t);SN.shatter(t+.25);SN.shield(t+.3)},el:'ice'},
  J07S7:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*80,()=>fireStorm(p))),s:t=>{SN.ignite(t);SN.roar(t+.1,1.2,.55);SN.wind(t+.1)},el:'fire'},
  J07S8:{aoe:1,v:k=>aoePts(k).forEach((p,j)=>later(j*70,()=>iceNova(p))),s:t=>{SN.frost(t);SN.shatter(t+.08)},el:'ice'},
  J07S9:{v:()=>{ballLightning(HP0(),F,.36);later(360,()=>{bolt(F,'#cfe0ff');thunderBall(F)})},s:t=>{SN.crackle(t,.35);SN.zap(t+.36);SN.boom(t+.38,.4)},el:'thunder'},
  J07S12:{v:()=>multi(4,80,i=>starOrb(HP0(),F,{fire:1,sz:.7,dur:.34,arc:(i-1.5)*.1,hit:()=>i===3?(fireBurst(F,.9),starBurst(F,.6)):fireBurst(F,.4,1)})),s:t=>{for(let i=0;i<4;i++){SN.zip(t+i*.08,.3);SN.ignite(t+.34+i*.08)}SN.boom(t+.6,.5)},el:'fire'},
  J07S13:{v:()=>{const at=[HP0()[0]+.02,HP0()[1]-.12];sunCharge(at,.45);later(450,()=>fireball(at,F,{dur:.42,sz:2.6,arc:.02,hit:()=>{fireBurst(F,2);starBurst(F,1.2);tint('rgba(255,170,90,.3)',.25);shock(F,'#ffd090',.5,.6,.35)}}))},s:t=>{SN.charge(t,.45);SN.roar(t,.45,.3);SN.ignite(t+.45);SN.boom(t+.87,1)},el:'fire'}});
/* ================= 雙劍士：輕盈華麗（藍、黑雙色，小而快，每刀形狀不同） ================= */
const DC1='#2f7dff',DC2='#0b1226';
function hitShake(f,amt){try{const el=f===F?document.querySelector('#rtb .bec.big .eart .art img:not(.under)'):null;if(el&&!SHAKEOFF)el.animate([{transform:'translate(0,0)'},{transform:`translate(${(Math.random()-.5)*amt}px,${(Math.random()-.5)*amt*.6}px)`},{transform:'translate(0,0)'}],{duration:70,composite:'add'})}catch(e){}}
/* 黑刃：深色刀身＋藍色邊光＋淡藍細芯（在深色卡上也看得到） */
function darkBlade(f,ang,L,W,o){o=o||{};const life=o.life||.3,d0=o.d0||.09,hold=o.hold||.35,bias=o.bias??.5,blue=vivid('#3a8cff');cel(life,(c,k)=>{const [x0,y0]=P2(f),u=U(),Lp=L*u*1.1,Wp=W*u*.3,gr=eo(k/d0),out=k<hold?0:(k-hold)/(1-hold),th=1-out;if(th<=.01)return;
  const head=-Lp/2+Lp*gr,tail=-Lp/2+Lp*Math.min(.9,eo(out)*.9),len=head-tail;if(len<1)return;const w=Math.max(2,Wp*Math.pow(th,.6)*Math.min(1,len/Lp*1.5)),m=tail+len*bias;
  c.translate(x0+(o.dx||0)*u,y0+(o.dy||0)*u);c.rotate(ang);const sh=(t0,t1,ww)=>{const mm=t0+(t1-t0)*bias;c.beginPath();c.moveTo(t0,0);c.lineTo(mm,-ww/2);c.lineTo(t1,0);c.lineTo(mm,ww/2);c.closePath()};
  ADD(c);c.globalAlpha=.35*th;sh(tail-len*.03,head+len*.02,w*1.9);c.fillStyle=blue;c.fill();
  c.globalCompositeOperation='source-over';c.globalAlpha=th;sh(tail,head,w*1.15);c.fillStyle='#03050d';c.fill();c.strokeStyle=blue;c.lineWidth=1.6;c.lineJoin='miter';c.stroke();
  ADD(c);c.globalAlpha=.8*th;sh(tail+len*.15,head-len*.05,Math.max(1,w*.22));c.fillStyle='#8fc4ff';c.fill()})}
/* 雙劍基本單位：一次攻擊＝兩道刃（藍刃先、黑刃後），角度交錯不平行，一長一短 */
const DLEN=[.32,.2,.28,.17,.3,.22];
function pair(p,a,o){o=o||{};const L=o.L||DLEN[(o.j||0)%DLEN.length]*rnd2(.92,1.08),L2=L*(o.r2||rnd2(.6,.8)),sp=o.sp??rnd2(.5,.9),d=o.d??.012,lf=o.life||.26,
  nx=-Math.sin(a),ny=Math.cos(a),p1=[p[0]+nx*d,p[1]+ny*d],p2=[p[0]-nx*d,p[1]-ny*d],sw=(o.j||0)%2;
  const A=()=>dia(sw?p2:p1,a-sp/2,sw?L2:L,(sw?L2:L)*.21,o.c||DC1,{life:lf,hold:.32,bias:rnd2(.4,.6)}),
        B=()=>darkBlade(sw?p1:p2,a+sp/2,sw?L:L2,(sw?L:L2)*.24,{life:lf+.02,bias:rnd2(.4,.6)});
  A();later(o.gap??35,B);later(25,()=>{tick(p,'#9fc8ff');if(o.ef)edgeFx(p,a,o.ef,DC1);hitShake(F,o.sk||5)})}
/* 連擊：每一下都是一對刃，節奏越來越快、角度位置每次不同 */
function combo(f,n,o){o=o||{};const i0=o.i0||80,i1=o.i1||35,T=[];let t=0;for(let i=0;i<n;i++){T.push(t);t+=i0+(i1-i0)*(i/Math.max(1,n-1))}let pa=rnd2(-PI,PI);
  T.forEach((tt,i)=>later(tt,()=>{pa+=rnd2(.9,2.1)*(Math.random()<.5?1:-1);const p=[f[0]+rnd2(-.03,.03),f[1]+rnd2(-.035,.03)];pair(p,o.ang?o.ang(i):pa,{j:i+(o.sh||0),ef:o.ef,gap:Math.max(18,o.gap??(tt>0?30:35))});if(i%3===2)spk(p,'#cfe4ff',.05,5,.15)}));return t}
/* 收尾：一對較長的交叉刃＋藍色星屑 */
function finisher(f,o){o=o||{};const a=rnd2(-PI,PI);pair(f,a,{L:o.L||.36,r2:.85,sp:1.25,d:0,life:.32,sk:9,gap:40});
  later(100,()=>{flash(f,'#cfe4ff',.12,.2);spk(f,'#ffffff',.08,9,.22);stardust(f,12,{im:[spr(90,160,255),spr(200,225,255)],v1:.25});hitShake(F,9)})}
function comboSnd(n,i0,i1,t0,fin){let t=t0||.1;for(let i=0;i<n;i++){SN.cut(t,2300+(i%4)*150);t+=(i0+(i1-i0)*(i/Math.max(1,n-1)))/1000}if(fin){for(let j=0;j<3;j++)SN.cut(t+j*.03,2800+j*200);SN.star(t+.1)}}
/* 閃斬：殘影一閃、三道又細又快的刀光從不同方向掠過 */
function quickStep(f){wind(H,'#dceeff',{dir:1,n:5,life:.35});later(70,()=>pair(f,-.25,{L:.3,r2:.55,sp:.35,d:.02,life:.2,gap:22}));later(150,()=>{wind(f,'#e8f4ff',{dir:1,n:4,life:.3});stardust(f,8,{im:[spr(200,225,255)],v1:.2})})}
const DUAL={
  /* 交錯斬：兩對 X 字交叉刃 */
  J13S1:{v:()=>{lunge('me',30);pair(F,-.4,{L:.3,sp:1.3,d:0,j:0});later(150,()=>pair(F,.9,{L:.26,sp:1.2,d:0,j:1}));later(300,()=>finisher(F,{L:.3}))},s:()=>{SN.cut(.1,2400);SN.cut(.14,2200);SN.cut(.25,2600);SN.cut(.29,2400);comboSnd(0,0,0,.4,1)}},
  /* 雙月斬：兩道長刃上下各劃一弧位，像兩彎月牙交會 */
  J13S2:{v:()=>{lunge('me',30);dia([F[0],F[1]-.03],-.25,.38,.07,DC1,{life:.36,bias:.35});later(60,()=>darkBlade([F[0],F[1]+.03],.25,.38,.08,{life:.36,bias:.65}));later(110,()=>{flash(F,'#cfe4ff',.1,.18);hitShake(F,8)});later(260,()=>{const t=combo(F,2,{i0:70,i1:60,sh:2});later(t,()=>finisher(F))})},s:()=>{SN.swish(.1,1,1);SN.cut(.13,2500);SN.cut(.19,2200);comboSnd(2,70,60,.36,1)}},
  /* 疾風連刃：風壓中六對刃越砍越快 */
  J13S3:{v:()=>{lunge('me',30);wind(F,'#e0f0ff',{dir:1,n:5,life:.7});const t=combo(F,6,{i0:80,i1:35});later(t,()=>finisher(F))},s:()=>{SN.wind(.05);comboSnd(6,80,35,.1,1)}},
  /* 影步亂斬：殘影穿過全部敵人，每個身上留一對交叉刃，回身再補一對 */
  J13S7:{aoe:1,v:k=>{const pts=aoePts(k);wind(H,'#dceeff',{dir:1,n:5,life:.35});pts.forEach((p,i)=>later(60+i*55,()=>{wind(p,'#e8f4ff',{dir:1,n:3,life:.25});pair(p,-.3+rnd2(-.3,.3),{L:.28,sp:1.2,d:0,j:i,life:.28})}));
    const back=60+pts.length*55+80;pts.slice().reverse().forEach((p,i)=>later(back+i*45,()=>{pair(p,1.1+rnd2(-.3,.3),{L:.22,sp:.8,j:i+1,life:.24});later(40,()=>spk(p,'#cfe4ff',.05,6,.16))}))},
    s:()=>{SN.wind(.05);for(let i=0;i<4;i++){SN.cut(.12+i*.055,2300+i*120);SN.cut(.15+i*.055,2100+i*120)}for(let i=0;i<4;i++)SN.cut(.45+i*.045,2600)}},
  /* 雙刃斬：兩名敵人各吃一對 V 字刃 */
  J13S8:{aoe:1,v:k=>{lunge('me',30);aoePts(k).forEach((p,i)=>later(i*70,()=>{pair(p,PI/2+(i?.15:-.15),{L:.28,sp:.7,d:.015,j:i});later(160,()=>pair(p,-.5,{L:.2,sp:.9,j:i+1}))}))},s:()=>{comboSnd(4,70,60,.1,0)}},
  /* 裂傷斬：三對刃＋濺血 */
  J13S9:{v:()=>{lunge('me',30);const t=combo(F,3,{i0:85,i1:60,ef:'blood'});later(t,()=>{finisher(F);edgeFx(F,0,'blood')})},s:()=>{comboSnd(3,85,60,.1,1);SN.splat(.25);SN.splat(.4)}},
  /* 閃斬：殘影一閃，一對極細極快的刃 */
  J13S10:{v:()=>quickStep(F),s:()=>{SN.wind(0);SN.cut(.08,2900);SN.cut(.1,2700);SN.star(.2)}},
  /* 破甲斬：盾甲裂開，一對大 X 刃砍穿 */
  J13S11:{v:()=>{lunge('me',30);armorCut(F,-.6,'#3a8cff',1);later(120,()=>pair(F,0,{L:.34,r2:.9,sp:1.2,d:0,life:.32,sk:9}));later(200,()=>edgeFx(F,0,'armor','#9fc8ff'))},s:()=>{SN.guard(.05);SN.cut(.13,2400);SN.cut(.17,2200);SN.ring(.2,800,.1,.5);SN.shatter(.22)}},
  /* 連擊斬：四對刃 */
  J13S12:{v:()=>{lunge('me',30);const t=combo(F,4,{i0:75,i1:45,sh:3});later(t,()=>finisher(F))},s:()=>comboSnd(4,75,45,.1,1)},
  /* 重雙斬：六對刃，最後一對最長並帶衝擊 */
  J13S13:{v:()=>{lunge('me',30);const t=combo(F,6,{i0:75,i1:32,sh:4});later(t,()=>{pair(F,rnd2(-PI,PI),{L:.4,r2:.9,sp:1.3,d:0,life:.36,sk:12,gap:30});later(80,()=>{flash(F,'#cfe4ff',.15,.22);shock(F,'#5aa0ff',.12,.28);stardust(F,14,{im:[spr(90,160,255),spr(200,225,255)],v1:.3})})})},s:()=>{comboSnd(6,75,32,.1,0);SN.cut(.62,2200);SN.cut(.65,2000);SN.heavy(.66)}}};

/* ================= 接到現有流程 ================= */
const RC={};const getR=k=>k in RC?RC[k]:(RC[k]=(DUAL[k]?{v:()=>DUAL[k].v(k),s:()=>DUAL[k].s(),el:'slash'}:null)||(SF[k]?{v:()=>{castPose('me');SF[k].v()},s:()=>SF[k].s(0),el:'holy'}:null)||designed(k)||recipe(k));
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
  BURN:{c:'#ff7a2a',on:f=>{flames(f,'#ff5a1a',{n:6,h:.1,sp:.05,life:.6,gy:GY(f)});physL(f,'ember',8,{dir:-PI/2,spread:1,spd:[.2,.6],sz:[.004,.007],life:[.6,1]})},s:t=>SN.ignite(t)},
  SCORCH:{c:'#d8602a',on:f=>{physL(f,'smoke',5,{dir:-PI/2,spread:.6,spd:[.1,.2],sz:[.02,.03],life:[.8,1.2],a:.4,col:'rgba(70,50,40,1)'})},s:t=>SN.hiss(t,.3)},
  POISON:{c:'#8be04a',on:f=>toxic(f,.6),s:t=>SN.bubble(t,5)},
  CORRODE:{c:'#a050e0',on:f=>corrodeDrip(f),s:t=>{SN.hiss(t,.5);SN.drone(t,.3)}},
  BLEED:{c:'#ff3046',on:f=>edgeFx(f,0,'blood'),s:t=>SN.splat(t)},
  FROST:{c:'#8fdcff',on:f=>iceSpike(f,.5),s:t=>SN.frost(t)},
  CHILL:{c:'#bfe8ff',on:f=>fogL(f,'rgba(200,238,255,.9)',{R:.07,a:.4,life:.8,n:6}),s:t=>SN.frost(t)},
  SLOW:{c:'#7fb8ff',on:f=>{downArrows(f,'#7fb8ff');clockRing(f,'#9fc8ff')},s:t=>SN.down(t)},
  ROOT:{c:'#8bc85a',on:f=>K.vine(f,'#8bc85a',{life:.9}),s:t=>SN.thud(t,.3)},
  SHOCK:{c:'#fff17a',on:f=>arcs(f,'#fff17a',.7),s:t=>SN.crackle(t,.35)},
  WEAK:{c:'#b88aff',on:f=>downArrows(f,'#b88aff'),s:t=>SN.down(t)},
  ARMOR:{c:'#ffa040',on:f=>{edgeFx(f,0,'armor','#ffa040');brokenShield(f,'#ffb060')},s:t=>SN.ring(t,700,.09,.5)},
  RESIST:{c:'#6ab0ff',on:f=>brokenShield(f,'#8fc8ff'),s:t=>SN.ring(t,1100,.07,.4)},
  VULN:{c:'#ff4a6a',on:f=>reticle(f,'#ff4a6a',.7),s:t=>SN.down(t)},
  EXPOSE:{c:'#ff8a8a',on:f=>reticle(f,'#ff8a8a',.6),s:t=>SN.down(t)},
  MARK:{c:'#ff5a5a',on:f=>reticle(f,'#ff5a5a',.9),s:t=>SN.ring(t,2600,.05,.3)},
  BLIND:{c:'#c8c8c8',on:f=>{fogL([f[0],f[1]-.05],'rgba(40,40,50,1)',{R:.05,a:.6,life:.9,n:6});flash(f,'#ffffff',.1,.2)},s:t=>SN.whisper(t)},
  SEAL:{c:'#ffd34a',on:f=>sigil(f,'#ffd34a',1.1),s:t=>SN.bell(t,1047)},
  JUDGE:{c:'#ffffff',on:f=>{sigil(f,'#ffffff',1.1);rays(f,'#fff3b0',{R:.1,life:.5})},s:t=>{SN.bell(t,1319);SN.bell(t+.12,988)}},
  STUN:{c:'#ffe45a',on:f=>twinkle([f[0],f[1]-.1],'#ffe45a',4,{life:.7,sx:.06,sy:.02}),s:t=>SN.star(t)},
  SILENCE:{c:'#9a9ab8',on:f=>sigil(f,'#9a9ab8',.8),s:t=>SN.down(t)},
  CURSE:{c:'#7a3aaa',on:f=>shadow(f,.4),s:t=>SN.drone(t,.4)},HEX:{c:'#9a5aff',on:f=>shadow(f,.4),s:t=>SN.drone(t,.4)},FEAR:{c:'#6a2a8a',on:f=>shadow(f,.5),s:t=>SN.whisper(t)},
  WOUND:{c:'#c03040',on:f=>edgeFx(f,0,'blood'),s:t=>SN.splat(t)},DRAIN:{c:'#6ab0ff',on:f=>physL(f,'wisp',6,{spd:[.3,.6],sz:[.004,.007],life:[.5,.8],col:'#6ab0ff'}),s:t=>SN.down(t)},
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
/* ===== 減益：每種一個專屬圖案 ===== */
function sweat(f,col){for(let i=0;i<3;i++)later(i*120,()=>cel(.7,(c,k)=>{const [x,y]=P2(f),u=U(),bx=x+(i-1)*u*.04+u*.05,by=y-u*.08+k*u*.06;c.globalAlpha=1-k;c.fillStyle=col;c.beginPath();c.moveTo(bx,by-u*.012);c.quadraticCurveTo(bx+u*.008,by,bx,by+u*.006);c.quadraticCurveTo(bx-u*.008,by,bx,by-u*.012);c.fill()}))}
function glassCrack(f,col){cel(1,(c,k)=>{const [x,y]=P2(f),u=U(),pr=eo(k*4);ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1,u*.003);for(let i=0;i<6;i++){const a=i/6*6.283+.3;let px=x,py=y;c.beginPath();c.moveTo(px,py);for(let j=1;j<=3;j++){px=x+Math.cos(a+(j%2?.2:-.2))*u*.035*j*pr;py=y+Math.sin(a+(j%2?.2:-.2))*u*.035*j*pr;c.lineTo(px,py)}c.stroke()}})}
function spot(f){cel(1,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.globalAlpha=Math.sin(PI*k)*.45;const g=c.createLinearGradient(x,SR().y,x,y+u*.1);g.addColorStop(0,'rgba(255,240,200,.9)');g.addColorStop(1,T0);c.fillStyle=g;c.beginPath();c.moveTo(x-u*.02,SR().y);c.lineTo(x+u*.02,SR().y);c.lineTo(x+u*.11,y+u*.1);c.lineTo(x-u*.11,y+u*.1);c.fill()})}
function blindfold(f){cel(1,(c,k)=>{const [x,y]=P2(f),u=U(),w=u*.14*eo(k*3);c.globalAlpha=k<.7?.9:.9*(1-(k-.7)/.3);c.fillStyle='rgba(20,18,28,1)';c.fillRect(x-w/2,y-u*.07,w,u*.025);c.fillStyle='rgba(120,120,140,1)';c.fillRect(x-w/2,y-u*.07,w,u*.004)})}
function hush(f){cel(1,(c,k)=>{const [x,y]=P2(f),u=U(),bx=x+u*.07,by=y-u*.1,s=u*.03*eo(k*3);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.fillStyle='rgba(240,240,250,.95)';c.beginPath();c.ellipse(bx,by,s,s*.7,0,0,7);c.fill();c.fillStyle='#555';for(let i=-1;i<=1;i++){c.beginPath();c.arc(bx+i*s*.35,by,s*.08,0,7);c.fill()}c.strokeStyle='#e04a5a';c.lineWidth=Math.max(1.5,u*.004);c.beginPath();c.moveTo(bx-s,by-s*.7);c.lineTo(bx+s,by+s*.7);c.stroke()})}
function skullRune(f,col){cel(1.1,(c,k)=>{const [x,y]=P2(f),u=U(),cy=y-u*.13-k*u*.02,s=u*.022*eo(k*3);ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1.2,u*.003);c.beginPath();c.arc(x,cy,s,PI*.9,PI*2.1);c.lineTo(x+s*.6,cy+s*1.1);c.lineTo(x-s*.6,cy+s*1.1);c.closePath();c.stroke();c.fillStyle=col;c.beginPath();c.arc(x-s*.4,cy+s*.1,s*.22,0,7);c.arc(x+s*.4,cy+s*.1,s*.22,0,7);c.fill()})}
function pentagram(f,col){cel(1.1,(c,k)=>{const [x,y]=P2(f),u=U(),gy=y+GY(f)*SR().h,R=u*.1*eo(k*2.5);ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.translate(x,gy);c.scale(1,.32);c.rotate(k);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=10;c.lineWidth=Math.max(1.5,u*.004);c.beginPath();c.arc(0,0,R,0,7);c.stroke();c.beginPath();for(let i=0;i<=5;i++){const a=i*4*PI/5-PI/2;c.lineTo(Math.cos(a)*R,Math.sin(a)*R)}c.stroke()})}
function shake(f){try{const sp=document.querySelector('#rtb .bec.big .eart .art img:not(.under)');if(sp)sp.animate([{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(-2px)'},{transform:'translateX(0)'}],{duration:500,iterations:2,composite:'add'})}catch(e){}}
function xScar(f){dia(f,.8,.18,.03,'#c03040',{life:.6,hold:.6});later(60,()=>dia(f,-.8,.18,.03,'#c03040',{life:.6,hold:.6}))}
function manaLeak(f){physL(f,'wisp',8,{dir:-PI/2,spread:.8,spd:[.3,.7],sz:[.004,.007],life:[.6,1],col:'#6ab0ff'});cel(.8,(c,k)=>{const [x,y]=P2(f),u=U();ADD(c);c.globalAlpha=(1-k)*.4;c.fillStyle=rg(c,x,y,u*.1,[[0,'#3a6aff'],[1,T0]]);c.fillRect(x-u*.1,y-u*.1,u*.2,u*.2)})}
function dim(f){cel(1,(c,k)=>{const [x,y]=P2(f),u=U();c.globalAlpha=Math.sin(PI*k)*.5;c.fillStyle=rg(c,x,y,u*.14,[[0,'rgba(20,20,24,1)'],[1,T0]]);c.fillRect(x-u*.14,y-u*.14,u*.28,u*.28)});downArrows(f,'#8a8a8a')}
function breath(f){for(let i=0;i<3;i++)later(i*150,()=>fogL([f[0]+.03,f[1]-.06],'rgba(220,245,255,.9)',{R:.03,a:.45,life:.7,n:4,rise:.03}))}
function runeBreak(f,col){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U(),R=u*.08;ADD(c);c.globalAlpha=k<.4?1:1-(k-.4)/.6;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1.5,u*.004);const sp=eo(Math.max(0,k-.3)*2)*u*.04;
  for(let i=0;i<4;i++){const a0=i*PI/2+.2;c.save();c.translate(Math.cos(a0+PI/4)*sp,Math.sin(a0+PI/4)*sp);c.beginPath();c.arc(x,y,R,a0,a0+PI/2-.2);c.stroke();c.restore()}})}
Object.assign(STV,{
  SCORCH:{c:'#d8602a',on:f=>{physL(f,'smoke',6,{dir:-PI/2,spread:.6,spd:[.1,.2],sz:[.02,.03],life:[.8,1.2],a:.45,col:'rgba(50,35,30,1)'});physL(f,'ember',6,{spd:[.1,.3],sz:[.003,.005],life:[.4,.7]})},s:t=>{SN.hiss(t,.3);SN.crackle(t,.2)}},
  CHILL:{c:'#bfe8ff',on:f=>breath(f),s:t=>SN.wind(t)},
  WEAK:{c:'#b88aff',on:f=>downArrows(f,'#b88aff'),s:t=>SN.down(t)},
  FATIGUE:{c:'#a0a0a0',on:f=>sweat(f,'#9fb8d8'),s:t=>tone2b(t)},
  SAPPED:{c:'#808080',on:f=>dim(f),s:t=>SN.down(t)},
  VULN:{c:'#ff4a6a',on:f=>glassCrack(f,'#ff6a7a'),s:t=>SN.shatter(t)},
  EXPOSE:{c:'#ffe0a0',on:f=>spot(f),s:t=>SN.ring(t,1800,.05,.4)},
  RESIST:{c:'#6ab0ff',on:f=>runeBreak(f,'#8fc8ff'),s:t=>SN.ring(t,1100,.07,.4)},
  BLIND:{c:'#c8c8c8',on:f=>{flash(f,'#ffffff',.12,.2);blindfold(f)},s:t=>SN.whisper(t)},
  SILENCE:{c:'#9a9ab8',on:f=>hush(f),s:t=>SN.down(t)},
  CURSE:{c:'#7a3aaa',on:f=>skullRune(f,'#b06cff'),s:t=>SN.drone(t,.4)},
  HEX:{c:'#9a5aff',on:f=>pentagram(f,'#c08cff'),s:t=>SN.whisper(t)},
  FEAR:{c:'#6a2a8a',on:f=>{shake(f);shadow(f,.4);sweat(f,'#8fb8ff')},s:t=>{SN.drone(t,.3);SN.whisper(t)}},
  WOUND:{c:'#c03040',on:f=>xScar(f),s:t=>SN.cut(t,1500)},
  DRAIN:{c:'#6ab0ff',on:f=>manaLeak(f),s:t=>SN.down(t)},
  ROOT:{c:'#8bc85a',on:f=>K.vine(f,'#8bc85a',{life:.9}),s:t=>SN.thud(t,.3)}});
function tone2b(t){SN.down(t)}

function brokenShield(f,col){cel(.8,(c,k)=>{const [x,y]=P2(f),u=U(),s=u*.05;ADD(c);c.globalAlpha=k<.5?1:1-(k-.5)/.5;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1.5,u*.004);c.translate(x,y-u*.12);
  const sp=eo(Math.max(0,k-.25)*3)*s*.4;for(const sg of [-1,1]){c.save();c.translate(sg*sp,sp*.5);c.rotate(sg*sp/s*.6);c.beginPath();c.moveTo(0,-s);c.lineTo(sg*s*.8,-s*.6);c.lineTo(sg*s*.7,s*.3);c.lineTo(0,s);c.lineTo(sg*s*.1,s*.2);c.lineTo(-sg*s*.08,-s*.2);c.closePath();c.stroke();c.restore()}})}
function clockRing(f,col){cel(.9,(c,k)=>{const [x,y]=P2(f),u=U(),r=u*.05;ADD(c);c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1,u*.003);c.translate(x,y-u*.13);c.beginPath();c.arc(0,0,r,0,7);c.stroke();c.rotate(k*2);c.beginPath();c.moveTo(0,0);c.lineTo(0,-r*.8);c.moveTo(0,0);c.lineTo(r*.5,0);c.stroke()})}
/* 施加：包住 stAdd，成功時在目標身上播一次（同一目標短時間內的相同狀態不重複播） */
const LASTA=new WeakMap();
if(typeof stAdd==='function'){const _sa=stAdd;stAdd=function(t,id,o){const r=_sa.apply(this,arguments);try{if(r&&B&&B.rt){const D=STV[STALIAS[id]||id];if(D&&!D.quiet){const key=t==='p'?H:t,m=LASTA.get(key)||{},n=performance.now();if(!(m[id]>n-500)){m[id]=n;LASTA.set(key,m);
    const dl=(t==='p'?380:520)/(window.FXSPD||1);setTimeout(()=>{try{D.s(0)}catch(e){}if(reduce())return;const f=ptOf(t);if(!f)return;run();locate();try{D.on(f)}catch(e){}stRun()},dl)}}}}catch(e){}return r}}
/* 跳傷：持續傷害每跳一次在目標身上冒一下 */
if(typeof stTick==='function'){const _tk=stTick;stTick=function(t){let dots=[];try{if(B&&B.rt){const bx=stBox(t),nw=acOf(t);for(const id in bx){const D=STX[id];if(D&&(D.dot||D.hot)&&bx[id].e>nw)dots.push(id)}}}catch(e){}const r=_tk.apply(this,arguments);
  if(dots.length)setTimeout(()=>{const f=ptOf(t);dots.forEach((id,i)=>setTimeout(()=>{const v=STV[id];if(!v)return;try{tickSnd(id)}catch(e){}if(reduce()||!f)return;run();locate();tickFx(f,id,v.c)},i*120))},60);return r}}
function tickSnd(id){({BURN:()=>SN.roar(0,.25,.2),POISON:()=>SN.bubble(0,3),CORRODE:()=>SN.hiss(0,.25),BLEED:()=>SN.splat(0),REGEN:()=>SN.mana(0),MEND:()=>SN.mana(0)}[id]||(()=>{}))()}
function tickFx(f,id,col){if(id==='BURN'){flames(f,'#ff5a1a',{n:4,h:.07,sp:.04,life:.45,gy:GY(f)});flash(f,'#ff8a2a',.08,.2)}else if(id==='POISON'){fogL(f,'rgba(120,220,60,1)',{R:.05,a:.35,life:.6,n:4});flash(f,'#8be04a',.07,.2)}
  else if(id==='CORRODE'){corrodeDrip(f)}else if(id==='BLEED'){physL(f,'drop',6,{spd:[.2,.6],sz:[.004,.007],life:[.4,.8],col:'#d0142e'});flash(f,'#ff3046',.07,.18)}else if(STX[id]&&STX[id].hot){twinkle(f,col,3,{rise:.08,life:.6})}}
/* 持續表現：身上掛著的狀態一直有小動態（主角、主目標、副目標） */
let SLON=0,SLT=0,TG=[],TGt=0;
function stRun(){if(SLON||reduce())return;SLON=1;SLT=performance.now();run();cel(9999,(c,k,p)=>{const nw=performance.now(),t=nw/1000;SLT=nw;
  if(!B||!B.rt||B.hp<=0&&!(B.adds||[]).some(a=>a.hp>0)){SLON=0;p.age=1e9;return}
  if(nw-TGt>300){TGt=nw;TG=[['p',H]];if(B.hp>0)TG.push([B,F]);(B.adds||[]).forEach(a=>{if(a.hp>0){const q=ptOf(a);if(q)TG.push([a,q])}})}
  let any=0;const u=U();
  for(const [tt,f] of TG){let L=[];try{L=stList(tt)}catch(e){}if(!L.length)continue;const [x,y]=P2(f),gy=y+(f.g!=null?f.g:GY(f))*SR().h,R=(f.R||.25)*SR().w*.45;
    for(const id of L){const v=STV[id];if(!v||v.quiet)continue;any=1;c.save();drawSt(c,id,v.c,x,y,gy,R,t,u);c.restore()}}
  if(!any){SLON=0;p.age=1e9}},{});}
function drawSt(c,id,col,x,y,gy,R,t,u){col=vivid(col);const pu=.6+.4*Math.sin(t*4);
  if(id==='BURN'){ADD(c);for(let i=0;i<5;i++){const ph=(t*1.6+i/5)%1,bx=x+Math.sin(i*2.3+t)*R*.5,by=gy-ph*R*1.1,s=u*.012*(1-ph);c.globalAlpha=(1-ph)*.85;c.fillStyle=rg(c,bx,by,s*2.2,[[0,'#fff4b0'],[.35,'#ff8a2a'],[1,T0]]);c.fillRect(bx-s*2.2,by-s*2.2,s*4.4,s*4.4)}}
  else if(id==='POISON'){for(let i=0;i<4;i++){const ph=(t*.8+i/4)%1,bx=x+Math.sin(i*2.9)*R*.5,by=y+R*.2-ph*R*.8,r=u*.006*(ph<.85?1:1+(ph-.85)*6);c.globalAlpha=(ph<.85?.75:1-(ph-.85)/.15);c.strokeStyle='#c8ff8a';c.fillStyle='rgba(120,220,60,.35)';c.lineWidth=1;c.beginPath();c.arc(bx,by,r,0,7);c.fill();c.stroke()}}
  else if(id==='CORRODE'){c.save();ADD(c);c.globalAlpha=.25*pu;c.fillStyle=rg(c,x,y,R*.8,[[0,'#5a1a8a'],[1,T0]]);c.fillRect(x-R,y-R,R*2,R*2);c.restore();for(let i=0;i<3;i++){const ph=(t*.7+i/3)%1,bx=x+(i-1)*R*.4,by=y-R*.2+ph*R*1.2;c.globalAlpha=(1-ph)*.9;c.fillStyle='#8a3ac8';c.beginPath();c.ellipse(bx,by,u*.004,u*.007,0,0,7);c.fill()}}
  else if(id==='BLEED'){for(let i=0;i<2;i++){const ph=(t*.9+i/2)%1,bx=x+(i?R*.2:-R*.25),by=y-R*.1+ph*(gy-y+R*.1);c.globalAlpha=Math.min(1,(1-ph)*2);c.fillStyle='#d0142e';c.beginPath();c.ellipse(bx,by,u*.004,u*.007,0,0,7);c.fill()}}
  else if(id==='FROST'){ADD(c);c.globalAlpha=.3*pu;c.fillStyle=rg(c,x,gy,R*1.1,[[0,'#bfeaff'],[1,T0]]);c.fillRect(x-R*1.2,gy-R*1.2,R*2.4,R*2.4);for(let i=0;i<3;i++){const a=t*.8+i*2.1,bx=x+Math.cos(a)*R*.6,by=y+Math.sin(a)*R*.3;c.globalAlpha=.6+.4*Math.sin(t*5+i);c.fillStyle='#e8f8ff';const s=u*.006;c.beginPath();for(let j=0;j<8;j++){const aa=j*PI/4,rr=j%2?s*.3:s;c.lineTo(bx+Math.cos(aa)*rr,by+Math.sin(aa)*rr)}c.fill()}}
  else if(id==='SLOW'){ADD(c);c.strokeStyle=col;c.globalAlpha=.6;c.lineWidth=Math.max(1,u*.003);const cy=y-R*1.1;c.beginPath();c.arc(x,cy,u*.018,0,7);c.stroke();c.beginPath();c.moveTo(x,cy);c.lineTo(x+Math.cos(t*.8-PI/2)*u*.014,cy+Math.sin(t*.8-PI/2)*u*.014);c.stroke()}
  else if(id==='SHOCK'){if(Math.random()<.35){ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=6;c.lineWidth=Math.max(1,u*.0025);let px=x+rnd2(-1,1)*R*.6,py=y+rnd2(-1,1)*R*.5;c.beginPath();c.moveTo(px,py);for(let i=0;i<3;i++){px+=rnd2(-1,1)*u*.02;py+=rnd2(-1,1)*u*.02;c.lineTo(px,py)}c.stroke()}}
  else if(id==='FATIGUE'){const ph=(t*.8)%1,bx=x+R*.6,by=y-R*.7+ph*R*.4;c.globalAlpha=Math.sin(PI*ph)*.9;c.fillStyle='#9fb8d8';c.beginPath();c.moveTo(bx,by-u*.01);c.quadraticCurveTo(bx+u*.007,by,bx,by+u*.005);c.quadraticCurveTo(bx-u*.007,by,bx,by-u*.01);c.fill()}
  else if(id==='SAPPED'){c.globalAlpha=.3*pu;c.fillStyle=rg(c,x,y,R*.9,[[0,'rgba(20,20,24,1)'],[1,T0]]);c.fillRect(x-R,y-R,R*2,R*2)}
  else if(id==='WEAK'){ADD(c);c.strokeStyle=col;c.globalAlpha=.7;c.lineWidth=Math.max(1.5,u*.004);c.lineCap='round';const ph=(t*.7)%1,yy=y-R*.9+ph*u*.03;c.globalAlpha=Math.sin(PI*ph)*.8;c.beginPath();c.moveTo(x+R*.7-u*.012,yy-u*.01);c.lineTo(x+R*.7,yy);c.lineTo(x+R*.7+u*.012,yy-u*.01);c.stroke()}
  else if(id==='RESIST'){ADD(c);c.strokeStyle=col;c.globalAlpha=.5+.3*pu;c.lineWidth=Math.max(1,u*.003);const cx=x-R*.7,cy=y-R*.9,r=u*.014;for(let i=0;i<4;i++){c.beginPath();c.arc(cx,cy,r,i*PI/2+.25,i*PI/2+PI/2-.25);c.stroke()}}
  else if(id==='ARMOR'){ADD(c);c.strokeStyle=col;c.globalAlpha=.55+.3*pu;c.lineWidth=Math.max(1,u*.003);const s=u*.016,cx=x-R*.7,cy=y-R*.9;c.beginPath();c.moveTo(cx,cy-s);c.lineTo(cx+s*.8,cy-s*.6);c.lineTo(cx+s*.7,cy+s*.3);c.lineTo(cx,cy+s);c.lineTo(cx-s*.7,cy+s*.3);c.lineTo(cx-s*.8,cy-s*.6);c.closePath();c.stroke();c.beginPath();c.moveTo(cx-s*.2,cy-s);c.lineTo(cx+s*.15,cy-s*.1);c.lineTo(cx-s*.1,cy+s*.4);c.stroke()}
  else if(id==='VULN'){ADD(c);c.strokeStyle=col;c.globalAlpha=.35+.25*pu;c.lineWidth=Math.max(1,u*.0025);for(let i=0;i<5;i++){const a=i/5*6.283+.3;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a+.2)*R*.3,y+Math.sin(a+.2)*R*.3);c.lineTo(x+Math.cos(a-.1)*R*.55,y+Math.sin(a-.1)*R*.55);c.stroke()}}
  else if(id==='EXPOSE'){ADD(c);c.globalAlpha=.18*pu;const g=c.createLinearGradient(x,y-R*2,x,y+R);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,T0);c.fillStyle=g;c.beginPath();c.moveTo(x-u*.01,y-R*2);c.lineTo(x+u*.01,y-R*2);c.lineTo(x+R*.8,y+R);c.lineTo(x-R*.8,y+R);c.fill()}
  else if(id==='MARK'){ADD(c);c.strokeStyle=col;c.globalAlpha=.4+.3*pu;c.lineWidth=Math.max(1,u*.0025);c.translate(x,y);c.rotate(t*.8);const r=R*.55;c.beginPath();c.arc(0,0,r,0,7);c.stroke();for(let i=0;i<4;i++){c.rotate(PI/2);c.beginPath();c.moveTo(r*.75,0);c.lineTo(r*1.15,0);c.stroke()}}
  else if(id==='SEAL'||id==='JUDGE'){ADD(c);c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.globalAlpha=.6+.3*pu;c.lineWidth=Math.max(1.2,u*.003);const cy=y-R*1.15,s=u*.016;c.translate(x,cy);c.rotate(t*.6);c.beginPath();c.arc(0,0,s,0,7);c.stroke();c.beginPath();c.moveTo(0,-s*.7);c.lineTo(0,s*.7);c.moveTo(-s*.7,0);c.lineTo(s*.7,0);c.stroke();if(id==='JUDGE'){c.beginPath();c.arc(0,0,s*1.4,0,7);c.stroke()}}
  else if(id==='BLIND'){c.globalAlpha=.45;c.fillStyle='rgba(20,20,28,1)';c.beginPath();c.ellipse(x,y-R*.55,R*.55,u*.012,0,0,7);c.fill()}
  else if(id==='STUN'){ADD(c);const cy=y-R*1.05;for(let i=0;i<3;i++){const a=t*4+i*2.09,sx=x+Math.cos(a)*R*.4,sy=cy+Math.sin(a)*R*.1,s=u*.008;c.fillStyle='#ffe45a';c.shadowColor='#ffe45a';c.shadowBlur=6;c.beginPath();for(let j=0;j<10;j++){const aa=j*PI/5-PI/2,rr=j%2?s*.45:s;c.lineTo(sx+Math.cos(aa)*rr,sy+Math.sin(aa)*rr)}c.fill()}}
  else if(id==='CURSE'){ADD(c);const cy=y-R*1.1+Math.sin(t*2)*u*.004,s=u*.012;c.globalAlpha=.6+.3*pu;c.strokeStyle=col;c.lineWidth=Math.max(1,u*.0025);c.beginPath();c.arc(x-R*.5,cy,s,PI*.9,PI*2.1);c.lineTo(x-R*.5+s*.6,cy+s*1.1);c.lineTo(x-R*.5-s*.6,cy+s*1.1);c.closePath();c.stroke()}
  else if(id==='HEX'){ADD(c);c.globalAlpha=.35+.2*pu;c.translate(x,gy);c.scale(1,.32);c.rotate(t*.5);c.strokeStyle=col;c.lineWidth=Math.max(1,u*.003);const r=R*.8;c.beginPath();for(let i=0;i<=5;i++){const a=i*4*PI/5-PI/2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.stroke()}
  else if(id==='FEAR'){ADD(c);c.strokeStyle='#8fb8ff';c.globalAlpha=.5;c.lineWidth=Math.max(1,u*.0025);for(const sg of [-1,1]){const xx=x+sg*R*.85+Math.sin(t*30)*u*.002;c.beginPath();c.moveTo(xx,y-R*.3);c.lineTo(xx,y+R*.1);c.stroke()}}
  else if(id==='SILENCE'){c.globalAlpha=.75;c.fillStyle='rgba(240,240,250,.9)';const bx=x+R*.7,by=y-R*.9,s=u*.012;c.beginPath();c.ellipse(bx,by,s*1.4,s,0,0,7);c.fill();c.strokeStyle='#e04a5a';c.lineWidth=Math.max(1,u*.003);c.beginPath();c.moveTo(bx-s,by-s*.7);c.lineTo(bx+s,by+s*.7);c.stroke()}
  else if(id==='WOUND'){ADD(c);c.strokeStyle=col;c.globalAlpha=.5+.3*pu;c.lineWidth=Math.max(1.5,u*.004);const s=u*.012;c.beginPath();c.moveTo(x-s,y-s);c.lineTo(x+s,y+s);c.moveTo(x+s,y-s);c.lineTo(x-s,y+s);c.stroke()}
  else if(id==='DRAIN'){ADD(c);for(let i=0;i<2;i++){const ph=(t*.7+i/2)%1,bx=x+(i?R*.3:-R*.3)+Math.sin(t*3+i)*u*.006,by=y-ph*R*1.2;c.globalAlpha=Math.sin(PI*ph)*.8;c.fillStyle=rg(c,bx,by,u*.01,[[0,'#ffffff'],[.4,'#6ab0ff'],[1,T0]]);c.fillRect(bx-u*.01,by-u*.01,u*.02,u*.02)}}
  else if(id==='SCORCH'){c.globalAlpha=.35;const ph=(t*.5)%1;c.fillStyle=rg(c,x+R*.2,y-ph*R,u*.02*(1+ph),[[0,'rgba(40,30,25,1)'],[1,T0]]);c.beginPath();c.arc(x+R*.2,y-ph*R,u*.02*(1+ph),0,7);c.fill()}
  else if(id==='CHILL'){if(Math.sin(t*2)>.6){c.globalAlpha=.3;c.fillStyle=rg(c,x+R*.4,y-R*.4,u*.02,[[0,'rgba(230,248,255,1)'],[1,T0]]);c.beginPath();c.arc(x+R*.4,y-R*.4,u*.02,0,7);c.fill()}}
  else if(id==='ROOT'){c.strokeStyle='#6a9a3a';c.globalAlpha=.7;c.lineWidth=Math.max(1.5,u*.004);for(let i=0;i<3;i++){const bx=x+(i-1)*R*.4;c.beginPath();c.moveTo(bx,gy);c.quadraticCurveTo(bx+u*.01,gy-u*.02,bx-u*.005,gy-u*.035);c.stroke()}}
  else if(id==='SHIELD'){ADD(c);c.globalAlpha=.35+.15*pu;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=8;c.lineWidth=Math.max(1,u*.003);c.beginPath();c.ellipse(x,y,R*.85,R*1.05,0,0,7);c.stroke();c.globalAlpha*=.4;c.fillStyle=rg(c,x,y,R,[[0,T0],[.7,T0],[1,col]]);c.fill()}
  else if(id==='GUARD'||id==='HARDEN'||id==='WARD'||id==='BLOCKUP'){ADD(c);c.globalAlpha=.4+.3*pu;c.strokeStyle=col;c.lineWidth=Math.max(1,u*.003);const s=u*.015,cx=x+R*.75,cy=y-R*.6;c.beginPath();c.moveTo(cx,cy-s);c.lineTo(cx+s*.8,cy-s*.6);c.lineTo(cx+s*.7,cy+s*.3);c.lineTo(cx,cy+s);c.lineTo(cx-s*.7,cy+s*.3);c.lineTo(cx-s*.8,cy-s*.6);c.closePath();c.stroke()}
  else if(id==='RAGE'||id==='TAKEUP'){ADD(c);c.globalAlpha=.3*pu;c.fillStyle=rg(c,x,gy,R*1.2,[[0,col],[1,T0]]);c.fillRect(x-R*1.2,gy-R*1.2,R*2.4,R*2.4)}
  else if(id==='FOCUS'){ADD(c);c.strokeStyle=col;c.globalAlpha=.5+.3*pu;c.lineWidth=Math.max(1,u*.003);c.beginPath();c.ellipse(x,y-R*1.05,u*.014,u*.008,0,0,7);c.stroke();c.fillStyle=col;c.beginPath();c.arc(x,y-R*1.05,u*.004,0,7);c.fill()}
  else if(id==='HASTE'||id==='EVAUP'||id==='COMBOUP'){ADD(c);c.strokeStyle=col;c.lineWidth=Math.max(1,u*.0025);for(let i=0;i<3;i++){const ph=(t*1.5+i/3)%1,yy=y+(i-1)*R*.35,xx=x-R*.9-ph*u*.05;c.globalAlpha=Math.sin(PI*ph)*.6;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-u*.035,yy);c.stroke()}}
  else if(id==='REGEN'||id==='MEND'){ADD(c);for(let i=0;i<2;i++){const ph=(t*.6+i/2)%1,bx=x+(i?R*.4:-R*.4),by=gy-ph*R*1.4,s=u*.006*Math.sin(PI*ph);c.globalAlpha=Math.sin(PI*ph);c.fillStyle=col;c.fillRect(bx-s*.3,by-s,s*.6,s*2);c.fillRect(bx-s,by-s*.3,s*2,s*.6)}}
  else{ADD(c);c.globalAlpha=.2*pu;c.fillStyle=rg(c,x,gy,R,[[0,col],[1,T0]]);c.fillRect(x-R,gy-R,R*2,R*2)}}
/* 戰鬥開始或狀態變化時啟動持續層 */
setInterval(()=>{try{if(B&&B.rt&&!SLON){const any=stList('p').length||stList(B).length||(B.adds||[]).some(a=>stList(a).length);if(any)stRun()}}catch(e){}},500);
window.FX7V={recipe:getR,STV,SN,dart,blade,fireball,bolt,HP0,tick,aoePts,pierceHit,spk,bits,fogL,smash,iceNova,arcSweep,SN,fireBurst,motes,rays,crystals,twinkle,flames,shock};
})();
