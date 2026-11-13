const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///tmp/dbg.html');await p.waitForTimeout(3500);
  const out=await p.evaluate(()=>{
    const d=__d,H=d.H,res={};
    const dump=c=>c.toDataURL('image/png');
    const set=(g,hair,arm,hc,skin,eye,wpn)=>{H.look={g,hair,hc,skin,eye};H.arm=arm;H.wpn=wpn;};
    const arms=['cloth','leather','chain'];
    for(const g of ['m','f'])for(const [hair] of d.HAIRS[g])for(const arm of arms){
      set(g,hair,arm,0,0,0,'steel');
      const fr=d.cs('battle');const c=document.createElement('canvas');c.width=fr[0].width*4;c.height=fr[0].height*4;const x=c.getContext('2d');fr.forEach((f,i)=>x.drawImage(f,(i%4)*f.width,(i/4|0)*f.height));
      res[`battle_${g}_${hair}_${arm}`]=dump(c);
      res[`walk_${g}_${hair}_${arm}`]=dump(d.cs('walk'));
    }
    // colour variants on spiky/long plain
    for(const g of ['m','f']){const hair=g==='m'?'spiky':'pony';
      d.HAIRC.forEach((_,i)=>{set(g,hair,'cloth',i,0,0,'steel');res[`hc_${g}_${i}`]=dump(d.cs('battle')[0]);res[`hcw_${g}_${i}`]=dump(d.cs('walk'));});
      d.SKINC.forEach((_,i)=>{set(g,hair,'cloth',0,i,0,'steel');res[`sk_${g}_${i}`]=dump(d.cs('battle')[8]);res[`skw_${g}_${i}`]=dump(d.cs('walk'));});
      d.EYEC.forEach((_,i)=>{set(g,hair,'cloth',0,0,i,'steel');res[`ey_${g}_${i}`]=dump(d.cs('walk'));});
      ['wood','iron','steel','rod','elf','silver'].forEach(w=>{set(g,hair,'cloth',0,0,0,w);res[`wp_${g}_${w}`]=dump(d.cs('battle')[5]);});
    }
    return res;
  });
  for(const [k,v] of Object.entries(out))fs.writeFileSync('/tmp/rv/'+k+'.png',Buffer.from(v.split(',')[1],'base64'));
  console.log('exported',Object.keys(out).length,'errors',errs);
  await b.close();
})();
