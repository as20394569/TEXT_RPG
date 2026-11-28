"""快速平衡模擬執行器。
用法：python3 tests/fastrun.py CONFIG.json OUT.jsonl
CONFIG：[{"cls","adv","lv","area","build","rar","style","tal","seed","cand","kind":"ex"|"dg","arg","n","tag"}...]"""
import asyncio, json, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import ensure_server, CHROME, PORT, SEED_JS
from playwright.async_api import async_playwright
ANAL = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'anal762.js'), encoding='utf8').read()
CAND = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cand761.js'), encoding='utf8').read()
FAST = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fastsim.js'), encoding='utf8').read()
async def main():
    cfg = json.load(open(sys.argv[1])); out = open(sys.argv[2], 'a')
    ensure_server()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        pg = None
        for i, c in enumerate(cfg):
            if pg is None or i % 40 == 0:
                if pg: await pg.context.close()
                pg = await (await b.new_context()).new_page()
                await pg.goto(f'http://localhost:{PORT}/index.html', wait_until='commit'); await pg.wait_for_timeout(3500)
                await pg.evaluate(FAST); await pg.evaluate(CAND); await pg.evaluate(ANAL)
            await pg.evaluate(SEED_JS % c.get('seed', 1))  # 每組設定重設亂數種子
            await pg.evaluate("()=>{SIM.errs=[]}")
            t = time.time()
            try:
                info = await pg.evaluate("(o)=>{SIM.cand=o.cand||null;SIM.diff=o.diff||null;SIM.knob=o.knob||{};return SIM.setup(o)}", c)
                res = await pg.evaluate("([k,a,n,ch])=>ch?SIM.chain(k,a,n):SIM.batch(k,a,n)", [c['kind'], c['arg'], c['n'], c.get('chain', False)])
                errs = await pg.evaluate("()=>SIM.errs")
            except Exception as e:
                info, res, errs = None, [], [str(e)[:300]]
                await pg.context.close(); pg = None
            rec = dict(c, info=info, res=res, errs=errs, sec=round(time.time() - t, 1))
            out.write(json.dumps(rec, ensure_ascii=False) + '\n'); out.flush()
        await b.close()
asyncio.run(main())
