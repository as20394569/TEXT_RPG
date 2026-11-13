const mkctx=()=>{const t={};return new Proxy(t,{get:(o,k)=>{
  if(k in o)return o[k];
  if(k==='getImageData')return (x,y,w,h)=>({data:new Uint8Array(w*h*4)});if(k==='createImageData')return (w,h)=>({data:new Uint8ClampedArray(w*h*4)});
  if(k==='measureText')return ()=>({width:40});
  if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});
  return ()=>{};},set:(o,k,v)=>{o[k]=v;return true}});};
function el(){const e={style:{},dataset:{},classList:{toggle(){}},children:[],hidden:false,textContent:'',innerHTML:'',className:'',L:{},
 addEventListener(n,f){(e.L[n]=e.L[n]||[]).push(f)},appendChild(c){e.children.push(c)},getContext:()=>mkctx(),
 getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){},clientWidth:360,clientHeight:440,width:0,height:0,scrollIntoView(){},querySelectorAll:()=>[],querySelector:()=>null,setAttribute(){},focus(){},blur(){}};return e;}
const els={};
global.document={getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),addEventListener(){}};
let rafs=[];let T=0;
global.window={addEventListener(){},matchMedia:()=>({matches:true}),devicePixelRatio:2};
global.requestAnimationFrame=f=>rafs.push(f);
global.performance={now:()=>T};
global.Image=class{set src(v){setImmediate(()=>this.onload&&this.onload())}};global.localStorage={getItem:()=>null,setItem(){}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a);ce(...a)};
let src=require('fs').readFileSync('/tmp/w.js','utf8').replace("'use strict';","'use strict';globalThis.__d={get P(){return P},get H(){return H},get W(){return W},get ui(){return ui},get busy(){return busy},get B(){return B},get F(){return F},get mode(){return mode},get place(){return place},get press(){return press},get setHeld(){return setHeld},get run(){return run},get battle(){return battle}};");
eval(src);
const D=globalThis.__d;
async function step(n){for(let i=0;i<n;i++){T+=16;const r=rafs;rafs=[];r.forEach(f=>f(T));await new Promise(r=>setImmediate(r));}}
async function drive(max,pick){let s=0;while(s<max&&(D.mode==='battle'||D.busy)){if(D.ui.dialog)D.press('a');else if(D.ui.menu){if(pick)pick(D.ui.menu);D.press('a');}await step(1);s++;}return s;}
(async()=>{
  await step(5);D.press('a');await step(40);
  for(let i=0;i<20;i++){D.press('a');await step(6);}
  console.log('start',D.mode,D.P.x,D.P.y,'busy',D.busy);
  D.setHeld('up');await step(80);D.setHeld(null);await step(20);
  console.log('moved to',D.P.x,D.P.y);
  D.W.map='field';D.place(2,2);
  let enc=0;
  for(let i=0;i<60&&enc<3;i++){D.setHeld(i%2?'right':'left');await step(14);D.setHeld(null);await step(2);
    if(D.mode==='battle'||D.busy){enc++;const s=await drive(8000);console.log('battle',enc,'steps',s,'lv',D.H.lv,'hp',D.H.hp,'mode',D.mode);}}
  // skills
  D.H.lv=9;D.H.mp=99;D.H.int=20;D.H.vit=40;D.H.hp=D.H.vit*4+20+27;
  for(let si=0;si<7;si++){
    D.run(async()=>{await D.battle(['crab','bat','crab']);});
    let st=0,used=false;
    while(st<9000&&(D.mode==='battle'||D.busy)){
      if(D.ui.dialog)D.press('a');
      else if(D.ui.menu){const m=D.ui.menu;if(m.items.length===5&&m.cfg.cols===2){m.idx=used?0:1;}else if(m.items.length===7){m.idx=si;used=true;}D.press('a');}
      if(D.B)D.B.en.forEach(e=>{if(!used&&e.hp<40)e.hp=40;});
      await step(1);st++;}
    console.log('skill',si,'done mode',D.mode,'hp',D.H.hp,'steps',st);
  }
  // bosses
  D.W.map='forest';D.place(9,6);D.P.dir='up';D.H.hp=999;D.H.str=60;
  D.press('a');await drive(9000);console.log('tree',D.F.tree,D.F.key);
  D.W.map='cave';D.place(7,7);D.P.dir='up';D.press('a');await drive(400);console.log('gate',D.F.gate);
  D.place(7,4);D.P.dir='up';D.H.hp=999;D.press('a');
  let g=0;await drive(20000,m=>{if(m.items.length===5&&m.cfg.cols===2)m.idx=(g++<12)?3:0;});
  console.log('golem',D.F.boss,'mode',D.mode,'hp',D.H.hp);
  // lose
  D.W.map='field';D.place(9,9);D.H.hp=1;D.H.vit=0;D.H.agi=0;
  D.run(async()=>{await D.battle(['wolf']);});
  await drive(8000,m=>{if(m.items.length===5&&m.cfg.cols===2)m.idx=3;});
  console.log('after lose',D.W.map,D.P.x,D.P.y,D.H.hp,D.mode);
  console.log('errors',errs.length);
})().catch(e=>{console.error('ERR',e);process.exit(1)});
