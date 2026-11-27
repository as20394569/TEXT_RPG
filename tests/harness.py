"""測試共用：啟動本機伺服器、固定亂數種子、建角色。
用法：from harness import page, setup_char
"""
import asyncio, os, socket, subprocess, sys, time, json
from contextlib import asynccontextmanager
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('TEST_PORT', '8765'))
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')

def ensure_server():
    s = socket.socket()
    try:
        s.connect(('127.0.0.1', PORT)); s.close(); return
    except OSError:
        pass
    subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT,
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)

# 固定亂數：mulberry32。即時戰鬥的影格時間仍有誤差，所以同種子結果「接近」但不保證逐位相同。
SEED_JS = """(()=>{let s=%d>>>0;Math.random=function(){s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();"""

@asynccontextmanager
async def page(seed=1, rtx=None, viewport=(390, 844)):
    ensure_server()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        ctx = await b.new_context(viewport={'width': viewport[0], 'height': viewport[1]})
        pg = await ctx.new_page()
        pg.errs = []
        pg.on('pageerror', lambda e: pg.errs.append(str(e)[:300]))
        await pg.add_init_script(SEED_JS % seed)
        if rtx:
            await pg.add_init_script('window.RTX=%d;' % rtx)
        await pg.goto(f'http://localhost:{PORT}/index.html', wait_until='commit')
        await pg.wait_for_timeout(3500)
        try:
            yield pg
        finally:
            await b.close()

JOBS = [  # (基礎職, 進階職或空字串)
    ('swordsman', ''), ('mage', ''), ('ranger', ''), ('cleric', ''),
    ('swordsman', 'knight'), ('swordsman', 'berserker'), ('swordsman', 'dual'),
    ('mage', 'archmage'), ('mage', 'warlock'), ('ranger', 'sniper'), ('ranger', 'assassin'),
    ('cleric', 'bishop'), ('cleric', 'templar'),
]

# 建角色：屬性照職業主屬性 2:1 配體力；裝備用測試自己的規則挑（不受遊戲自動換裝邏輯影響），前後版本可比
SETUP_JS = """([cls,adv,lv,area])=>{const m=document.getElementById('maint');if(m)m.remove();MAINT=false;localStorage.clear();MUTE=true;
 newGame('測試',cls,'m');S.tut=Object.fromEntries(Object.keys(TIPS).map(k=>[k,1]));while(S.lv<lv)gainExp(need(S.lv));if(adv)S.adv=adv;learn(true);EFC=null;
 const ma={'力':'STR','敏':'DEX','智':'INT'}[jobEq().main_attr]||'STR';let n=0;while(S.pts>0){const k=n++%3===2?'VIT':ma;if(S.attr[k]<ATTRMAX){S.attr[k]++;S.pts--}else{const o=['VIT','LUK','DEX','STR','INT'].find(x=>S.attr[x]<ATTRMAX);if(!o)break;S.attr[o]++;S.pts--}}
 for(let i=0;i<area;i++)S.cleared[i]=1;S.main.ch=area;S.gear=[];S.eq={main:null,off:null,head:null,body:null,feet:null,neck:null,ring:null};
 for(let i=0;i<14;i++)dropGear6(S.lv,'N',{force:1});
 for(const sl of SL6){let best=null;for(const g of S.gear){if(!canEquip(g,sl)||SL6.some(s=>S.eq[s]===g.u))continue;if(!best||g.r>best.r||(g.r===best.r&&g.lv>best.lv))best=g}if(best)eqSet(best,sl)}
 S.items={};const z=ZN6[area].lo,c=V6.CONS.filter(x=>x.lv===z);if(c[0])S.items[c[0].id]=5;S.party=null;S.lo7=null;EFC=null;
 /* 量測鉤子 */
 window.__M={dmg:0,acts:0,mp:0,casts:0};
 {const _ft=foeTake6;foeTake6=function(f,d,src){const r=_ft.apply(this,arguments);if(B&&(B.actor==='p'||B.actor==null))__M.dmg+=r;return r}}
 {const _pp=pPost7;pPost7=function(){if(B)__M.acts++;return _pp.apply(this,arguments)}}
 {const _us=useSkill6;useSkill6=function(k,s){__M.mp+=mpCost6(k);__M.casts++;return _us.apply(this,arguments)}}
 return {job:adv||cls,lv:S.lv,eq:SL6.filter(s=>S.eq[s]).length}}"""

async def setup_char(pg, cls, adv, lv, area):
    return await pg.evaluate(SETUP_JS, [cls, adv, lv, area])
