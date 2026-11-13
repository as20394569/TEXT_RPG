require('./dawnwalk.js');const D=globalThis.DawnWalk;
const HC=['#5a3a2c','#2e2a3a','#e8b850','#c84a3a','#4a6ad0'];
const SK=['#f8d0a8','#e8b890','#f8d0a8','#c08a64','#f8d0a8'];
const out=[];
for(const [g,hs] of [['m',['spiky','short','long','tail','messy']],['f',['long','twin','bob','pony','bun']]])
  hs.forEach((h,i)=>out.push(D.frames({g,hair:h,hc:HC[i],skin:SK[i],eye:'#3050a0',outfit:['plain','leather','chain','plain','leather'][i],weapon:'steel'})));
require('fs').writeFileSync('/tmp/dw.json',JSON.stringify(out));
