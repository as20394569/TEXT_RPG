// 冒險物語 field hero — hand-authored 16x22 pixel templates in the same style as 曙光冒險 (dawn-adventure 03_art.js).
// Head/hair templates + body + legs are composed per frame; colours come from palette keys so the
// paper doll (hair style/colour, skin, eyes, outfit, weapon) never changes the drawing itself.
(function(G){
'use strict';
const W=20,H=23,OX=2,OY=1;
// ---------- legs (from dawn-adventure) ----------
const LEGS={
  stand:['...kPPPPPPPPk...','...kPPPkkPPPk...','...kbBBkkBBbk...','...kkkk..kkkk...'],
  stepL:['...kPPPPPPPPk...','...kPPPkkPPPk...','...kbBBkkPPPk...','...kkkk.kBBbk...','.........kkkk...'],
  stepR:['...kPPPPPPPPk...','...kPPPkkPPPk...','...kPPPkkBBbk...','...kbBBk.kkkk...','...kkkk.........'],
  sideStand:['....kPPPPPk.....','....kPPkPPk.....','....kBBkBBk.....','....kkkkkkk.....'],
  sideStepA:['....kPPPPPk.....','...kPPPkPPPk....','...kbBkkkPPk....','...kkk..kBBbk...','........kkkk....'],
  sideStepB:['....kPPPPPk.....','....kPPPPk......','....kPPPkk......','....kBBBbk......','....kkkkkk......']
};
// ---------- torso rows 13..17 ----------
const BODY={
  down:['..kkNNNsSNNNkk..','.kNkmNWNNWNNkNk.','.kNkmNNNNNNNkNk.','.kSknNNNNNNnkSk.','..kknNRRRRNnkk..'],
  up:  ['..kkNNNNNNNNkk..','.kNkmNNNNNNNkNk.','.kNkmNNNNNNNkNk.','.kSknNNNNNNnkSk.','..kknNRRRRNnkk..'],
  left:['...kkWNNNkkkk...','...kNNNmNkNNk...','...kSNNmNkNnk...','...ksNNNnkkk....','....kNRRNk......']
};
// ---------- head base (face) rows 0..12 ----------
const FACE={
  down:['................','................','.....kkkkkk.....','...kkSSSSSSkk...','..kSSSSSSSSSSk..','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kkSSkSSSSkSSkk.','..kSSESSSSESSk..','...ksSSSSSSsk...'],
  left:['................','................','......kkkkk.....','....kkSSSSSkk...','...kSSSSSSSSSk..','..kSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSk..','.kSkSSSSSSSSSk..','.kSESSSSsSSSk...','..kSSSSskkk.....'],
  up:  ['................','................','.....kkkkkk.....','...kkSSSSSSkk...','..kSSSSSSSSSSk..','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kSSSSSSSSSSSSk.','.kkSSSSSSSSSSkk.','..kkSSSSSSSSkk..','...ksSSSSSSsk...']
};
// ---------- hair overlays ('.' keep, '_' erase, letters paint) rows 0..12 (+ optional extra rows) ----------
const BASEHAIR={
  down:['................','................','.....kkkkkk.....','...kkHHHjjHHkk..','..kHHHHjjHHHHHk.','.kHHHHHHjHHHHHk.','.kHHHHHHHHHHHHk.','.kHHHHHHHHHHHHk.','.kHhHHHHHHHHhHk.','.kHHkSSHHSSkHHk.'],
  left:['................','................','......kkkkk.....','....kkHHjHHkk...','...kHHHHjjHHHk..','..kHHHHHHHHHHHk.','.kHHHHHHHHHHHHk.','.kHHHkHHHHHHHHk.','.kHHSSkHHHHHHHk.','.kSSSSSHHHHHHk..','........HHHH....','........HHH.....','.........H......'],
  up:  ['................','................','.....kkkkkk.....','...kkHHHHHHkk...','..kHHjjjHHHHHk..','.kHjjjHHHHHHHHk.','.kHjHHHHHHHHHHk.','.kHHHHHHHHHHHHk.','.kHHHHHHHHHHHHk.','.kHHHHHHHHHHHHk.','.kkHHHHHHHHHHkk.','..kkhHHHHHHhkk..','...khHHHHHHhk...']
};
// extra hair pixels per style: list of [dir, rows] painted after the base hair; 'H' pixels get auto-outlined
const STY={
  m_spiky:{down:['..H...H....H..H.','.HHH.HHH..HHHHH.','.HHHHHHHHHHHHHH.'],left:['....H...H..H....','...HHH.HHHHHH...','..HHHHHHHHHHH...'],up:['..H...H....H..H.','.HHH.HHH..HHHHH.','.HHHHHHHHHHHHHH.']},
  m_short:{},
  m_long:{downX:{10:'.H............H.',11:'.H............H.',12:'.HH..........HH.',13:'.HH..........HH.',14:'.H............H.'},
          leftX:{10:'.......HHHHHH...',11:'.......HHHHHH...',12:'........HHHHH...',13:'........HHHH....',14:'.........HH.....'},
          upX:{10:'.HHHHHHHHHHHHHH.',11:'.HHHHHHHHHHHHHH.',12:'.HHHHHHHHHHHHHH.',13:'..HHHHHHHHHHHH..',14:'...HHHHHHHHHH...'}},
  m_tail:{leftX:{9:'.............H..',10:'............HHH.',11:'............HH..',12:'.............H..'},
          upX:{12:'......HRRH......',13:'.......HH.......',14:'.......HH.......',15:'.......H........'}},
  m_messy:{down:['...H..H..H..H...','..HH.HH.HH.HH...','.HHHHHHHHHHHHHH.'],left:['.....H..H.......','....HH.HH.H.....','..HHHHHHHHHHH...'],up:['...H..H..H..H...','..HH.HH.HH.HH...','.HHHHHHHHHHHHHH.'],
           downX:{6:'H..............H',7:'H..............H'},upX:{6:'H..............H',7:'H..............H'}},
  f_long:{fem:1,downX:{9:'H..............H',10:'HH............HH',11:'HH............HH',12:'HH............HH',13:'HH............HH',14:'HH............HH',15:'H..............H'},
          leftX:{10:'.......HHHHHHH..',11:'.......HHHHHHH..',12:'.......HHHHHHH..',13:'........HHHHHH..',14:'........HHHHHH..',15:'.........HHHH...'},
          upX:{10:'HHHHHHHHHHHHHHHH',11:'HHHHHHHHHHHHHHHH',12:'HHHHHHHHHHHHHHHH',13:'.HHHHHHHHHHHHHH.',14:'.HHHHHHHHHHHHHH.',15:'..HHHHHHHHHHHH..'}},
  f_twin:{fem:1,over:1,downX:{5:'RR..............RR',6:'HH..............HH',7:'HH..............HH',8:'HH..............HH',9:'HH..............HH',10:'HH..............HH',11:'.H..............H.'},
          leftX:{5:'...........RRR..',6:'............HHH.',7:'............HHH.',8:'............HHH.',9:'.............HH.',10:'.............H..'},
          upX:{5:'RR..............RR',6:'HH..............HH',7:'HH..............HH',8:'HH..............HH',9:'HH..............HH',10:'HH..............HH',11:'.H..............H.'}},
  f_bob:{fem:1,downX:{9:'.H............H.',10:'.HH..........HH.',11:'.HH..........HH.'},
         leftX:{10:'.......HHHHHH...',11:'.......HHHHHH...',12:'.......HHHHH....'},
         upX:{10:'.HHHHHHHHHHHHHH.',11:'.HHHHHHHHHHHHHH.',12:'..HHHHHHHHHHHH..'}},
  f_pony:{fem:1,down:['.......HH.......','.......RR.......'],left:['............HH..','...........RRH..','.............HH.'],
          leftX:{3:'.............HH.',4:'..............H.',5:'..............HH',6:'..............HH',7:'..............H.'},
          upX:{0:'.......HH.......',1:'.......RR.......',10:'......HHHH......',11:'......HHHH......',12:'.......HH.......',13:'.......HH.......',14:'.......H........'}},
  f_bun:{fem:1,down:['......HHHH......','.....HHjHHH.....','......RRRR......'],left:['.......HHHH.....','......HHjHHH....','.......RRRR.....'],up:['......HHHH......','.....HHjHHH.....','......RRRR......']}
};
const STYLE_OF={m:{spiky:'m_spiky',short:'m_short',long:'m_long',tail:'m_tail',messy:'m_messy'},f:{long:'f_long',twin:'f_twin',bob:'f_bob',pony:'f_pony',bun:'f_bun'}};

function grid(){return Array.from({length:H},()=>new Array(W).fill('.'));}
function paint(g,rows,y0,mode){rows.forEach((r,j)=>{const y=y0+j+OY;if(y<0||y>=H)return;for(let k=0;k<r.length;k++){const i=k+OX-(r.length>16?1:0);if(i>=W)break;const c=r[k];if(c==='.')continue;if(c==='_'){g[y][i]='.';continue;}if(mode==='under'&&g[y][i]!=='.'&&g[y][i]!=='k')continue;g[y][i]=c;}});}
function paintMap(g,m,mode){for(const y in m)paint(g,[m[y]],+y,mode);}
function outlineNew(g){ // add 'k' around any coloured pixel that touches transparency
  const out=g.map(r=>r.slice());
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(g[y][x]!=='.')continue;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+a,yy=y+b;if(xx>=0&&yy>=0&&xx<W&&yy<H&&g[yy][xx]!=='.'&&g[yy][xx]!=='k'){out[y][x]='k';break;}}}
  return out;
}

function buildFrame(lk,dir,legKey,bob){
  const d=dir==='right'?'left':dir;
  const st=STY[STYLE_OF[lk.g][lk.hair]]||{};
  const g=grid();
  // back hair (drawn first, under everything) for down/left; for up it is drawn over the body
  if(d!=='up'&&st[d+'X'])paintMap(g,st[d+'X']);
  paint(g,BODY[d],13);
  paint(g,LEGS[legKey],18);
  if(d==='up'&&lk.weapon!=='none'){ // sword across the back
    [[4,13,'U'],[5,14,'T'],[6,14,'I'],[7,15,'I'],[8,15,'I'],[9,16,'I'],[10,16,'I'],[11,17,'i']].forEach(([x,y,c])=>g[y+OY][x+OX]=c);
  }
  paint(g,FACE[d],0);
  paint(g,BASEHAIR[d],0);
  if(st[d])paint(g,st[d],0);
  if(d==='up'&&st.upX)paintMap(g,st.upX);
  if(d!=='up'&&st[d+'X'])paintMap(g,st[d+'X'],st.over?null:'under'); // re-assert hanging hair around the face edge
  if(d!=='up'&&lk.weapon!=='none'){ // hilt peeking over the shoulder
    if(d==='down'){g[11+OY][13+OX]='U';g[12+OY][13+OX]='T';g[12+OY][14+OX]='T';}
    else {g[11+OY][12+OX]='U';g[12+OY][12+OX]='T';g[12+OY][13+OX]='T';}
  }
  if(st.fem&&d==='down'){g[10+OY][4+OX]='k';g[10+OY][11+OX]='k';} // lashes
  let out=outlineNew(g);
  if(bob){out=[out.slice(1),[new Array(W).fill('.')]].flat();}
  if(dir==='right')out=out.map(r=>r.slice().reverse());
  return out.map(r=>r.join(''));
}

// ---------- palettes ----------
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>toHex(hex(a).map((v,i)=>v+(hex(b)[i]-v)*t));
const OUTFIT={
  plain:{N:'#3c5aa8',n:'#28407a',m:'#5a7ad0',W:'#f6f2e8',R:'#6a4428',G:'#e8c048',P:'#4a4458',b:'#3a2418',B:'#6a4028'},
  leather:{N:'#8a5430',n:'#5e3820',m:'#b07040',W:'#e8d8b0',R:'#3a2418',G:'#e8c048',P:'#4a3a30',b:'#2a1a12',B:'#5a3420'},
  chain:{N:'#9aa2b6',n:'#6a7286',m:'#c8d0e0',W:'#e8c048',R:'#4a3424',G:'#e8c048',P:'#3a3648',b:'#2a1a12',B:'#4a3020'}
};
const BLADES={steel:'#e4ecf6',iron:'#c4ccdc',silver:'#f8fbff',elf:'#9ff0c8',wood:'#c89050',rod:'#b48cff',hunter:'#d8d0c0'};
function palette(lk){
  const o=OUTFIT[lk.outfit]||OUTFIT.plain;
  const bl=BLADES[lk.weapon]||'#e4ecf6';
  return Object.assign({k:'#2a2238',H:lk.hc,h:mix(lk.hc,'#1a1028',.35),j:mix(lk.hc,'#fff8e8',.35),
    S:lk.skin,s:mix(lk.skin,'#a05040',.28),E:lk.eye,R2:'#d84848',
    I:bl,i:mix(bl,'#2a2238',.4),T:'#e8c048',U:'#6a3a26'},o,{Rr:'#d84848'});
}
function colourOf(p,ch,lk){
  if(ch==='R'&&/H/.test('')) return p.R;
  return p[ch];
}
function frames(lk){
  const P=palette(lk);P.R=P.R; // tunic accent
  const hairTie='#d84848';
  const F={};
  const mk=(dir,leg,bob)=>{const rows=buildFrame(lk,dir,leg,bob);return rows.map((r,y)=>[...r].map((c,x)=>c==='.'?null:(c==='R'&&y<13+OY?hairTie:P[c]||null)));};
  for(const d of ['down','up'])F[d]=[mk(d,'stand',0),mk(d,'stepL',1),mk(d,'stand',0),mk(d,'stepR',1)];
  F.left=[mk('left','sideStand',0),mk('left','sideStepA',1),mk('left','sideStand',0),mk('left','sideStepB',1)];
  F.right=[mk('right','sideStand',0),mk('right','sideStepA',1),mk('right','sideStand',0),mk('right','sideStepB',1)];
  return F;
}
G.DawnWalk={frames,buildFrame,W,H};
})(typeof window!=='undefined'?window:globalThis);
