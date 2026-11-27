"""排行榜伺服器測試：上榜需帳號、不能冒名刪紀錄、名字等級以雲端存檔為準、GM 驗證。
用法：python3 tests/server_test.py  （會在暫存資料夾啟動一份 rank_server.py）"""
import json, os, shutil, subprocess, sys, tempfile, time, base64, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp(); shutil.copy(os.path.join(ROOT, 'tools', 'rank_server.py'), tmp)
open(os.path.join(tmp, 'fb_token.txt'), 'w').write('devkey123')
PORT = '8799'; env = dict(os.environ, RANK_PORT=PORT)
p = subprocess.Popen([sys.executable, os.path.join(tmp, 'rank_server.py')], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)
def post(path, body):
    req = urllib.request.Request(f'http://127.0.0.1:{PORT}{path}', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
def get(path):
    with urllib.request.urlopen(f'http://127.0.0.1:{PORT}{path}') as r: return json.loads(r.read())
def code(name, lv):
    return 'AO1.' + base64.b64encode(json.dumps({'name': name, 'lv': lv, 'v': 3}).encode()).decode() + '.x'
R = []
def chk(n, ok, info=''):
    R.append((n, ok)); print(('PASS ' if ok else 'FAIL ') + n, info)
try:
    s, j = post('/api/acc/register', {'name': 'alice01', 'pw': 'secret1', 'data': code('艾莉絲', 42)}); tka = j.get('token')
    s, j = post('/api/acc/register', {'name': 'bobby01', 'pw': 'secret2', 'data': code('鮑伯', 10)}); tkb = j.get('token')
    s, j = post('/api/submit', {'id': 'abcd1234', 'name': '艾莉絲', 'cls': '劍士', 'lv': 99, 'power': 9999}); chk('匿名上榜被拒', s == 403, s)
    s, j = post('/api/submit', {'acc': 'alice01', 'token': tka, 'name': '亂填', 'cls': '劍士', 'lv': 1, 'power': 1234}); chk('帳號上榜成功', s == 200, (s, j))
    top = get('/api/top?n=50'); a = [r for r in top if r['power'] == 1234]
    chk('名字與等級以雲端存檔為準', a and a[0]['name'] == '艾莉絲' and a[0]['lv'] == 42, a)
    s, j = post('/api/submit', {'acc': 'bobby01', 'token': tkb, 'name': '艾莉絲', 'cls': '劍士', 'lv': 50, 'power': 1}); time.sleep(.1)
    top = get('/api/top?n=50'); chk('冒名不會刪掉別人的紀錄', any(r['name'] == '艾莉絲' and r['power'] == 1234 for r in top), [(r['name'], r['power']) for r in top])
    chk('冒名者顯示自己的名字', any(r['name'] == '鮑伯' for r in top))
    s, j = post('/api/submit', {'acc': 'alice01', 'token': 'bad', 'power': 5}); chk('token 錯誤被拒', s == 403, s)
    s, j = post('/api/gm', {'key': 'wrong'}); chk('GM 錯誤金鑰被拒', s == 403 and not j.get('gm'), (s, j))
    s, j = post('/api/gm', {'key': 'devkey123'}); chk('GM 正確金鑰通過', s == 200 and j.get('gm'), (s, j))
    s, j = post('/api/xfer', {'id': 'abcd1234', 'name': 'x', 'lv': 100, 'data': code('x', 100)})
    s2, j2 = post('/api/xfer/get', {'code': j.get('code')}); chk('轉移碼等級可到 100', j2.get('lv') == 100, j2.get('lv'))
finally:
    p.terminate(); shutil.rmtree(tmp, ignore_errors=True)
sys.exit(0 if all(ok for _, ok in R) else 1)
