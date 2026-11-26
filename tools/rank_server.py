"""蒼藍誓約 Online 排行榜伺服器（只用 Python 標準函式庫）
GET  /api/top?n=50   -> 依戰力排序的玩家列表（最多 300）
POST /api/submit     -> {"id","name","cls","lv","power"} 新增或更新自己的紀錄
POST /api/acc/register|login|load|save|logout -> 雲端帳號（帳號＋密碼，多裝置共用存檔）
POST /api/xfer        -> {"id","name","lv","data"} 上傳存檔換 6 碼轉移碼（24 小時）
POST /api/xfer/get    -> {"code","take"} 用轉移碼取回存檔（take=1 取用後刪除）
GET  /api/fb?n=50    -> 玩家意見回報（新到舊），與排行榜資料分開存放
POST /api/fb         -> {"id","name","cls","lv","cat","text"} 送出意見（每人 60 秒一則）
POST /api/fb/reply   -> {"token","ts","reply"} 開發者回覆（token 存在 fb_token.txt）
"""
import json, os, re, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'rank_data.json')
PORT = int(os.environ.get('RANK_PORT', '8787'))
ORIGINS = {'https://as20394569.github.io', 'http://localhost:8765', 'http://127.0.0.1:8765'}
LOCK = threading.Lock()
LAST = {}  # 每個 id 的上次提交時間（防洗）
FB_DATA = os.path.join(HERE, 'feedback_data.json')
FB_LAST = {}
FB_CATS = {'bug', 'idea', 'balance', 'art', 'other'}
def fb_load():
    try:
        with open(FB_DATA, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []
FB = fb_load()
def fb_save():
    tmp = FB_DATA + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(FB, f, ensure_ascii=False)
    os.replace(tmp, FB_DATA)
def fb_token():
    try:
        with open(os.path.join(HERE, 'fb_token.txt'), encoding='utf-8') as f:
            return f.read().strip()
    except Exception:
        return ''

# ---- 存檔轉移：上傳存檔換 6 碼轉移碼，24 小時內在另一台裝置輸入即可下載（取用一次即刪除） ----
XF_DATA = os.path.join(HERE, 'xfer_data.json')
XF_LAST = {}
XF_GET = {}

# ---- 雲端帳號：帳號＋密碼，多台裝置共用同一份存檔（每個帳號一個檔案，密碼只存 PBKDF2 雜湊） ----
import hashlib, hmac, secrets as _sec
ACC_DIR = os.path.join(HERE, 'accounts')
ACC_TRY = {}
def acc_path(name):
    return os.path.join(ACC_DIR, hashlib.sha256(name.lower().encode('utf-8')).hexdigest()[:32] + '.json')
def acc_read(name):
    try:
        with open(acc_path(name), encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None
def acc_write(name, a):
    os.makedirs(ACC_DIR, exist_ok=True)
    tmp = acc_path(name) + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(a, f, ensure_ascii=False)
    os.replace(tmp, acc_path(name))
def acc_hash(pw, salt):
    return hashlib.pbkdf2_hmac('sha256', pw.encode('utf-8'), bytes.fromhex(salt), 120000).hex()
def acc_ok_name(n):
    return isinstance(n, str) and re.fullmatch(r'[A-Za-z0-9_\u4e00-\u9fff]{3,16}', n) is not None
def acc_ok_data(d):
    return isinstance(d, str) and d.startswith('AO1.') and len(d) <= 780000
XF_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
def xf_load():
    try:
        with open(XF_DATA, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}
XF = xf_load()
def xf_save():
    now = time.time()
    for k in [k for k, v in XF.items() if v.get('exp', 0) < now]:
        XF.pop(k, None)
    tmp = XF_DATA + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(XF, f, ensure_ascii=False)
    os.replace(tmp, XF_DATA)

def load():
    try:
        with open(DATA, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

DB = load()

def save():
    tmp = DATA + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(DB, f, ensure_ascii=False)
    os.replace(tmp, DATA)

def clean(s, n):
    s = re.sub(r'[\x00-\x1f<>"\'`]', '', str(s or ''))
    return s[:n]

class H(BaseHTTPRequestHandler):
    def cors(self):
        o = self.headers.get('Origin', '')
        if o in ORIGINS:
            self.send_header('Access-Control-Allow-Origin', o)
            self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def reply(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/api/top':
            try:
                n = max(1, min(300, int(parse_qs(u.query).get('n', ['50'])[0])))
            except ValueError:
                n = 50
            with LOCK:
                rows = sorted(DB.values(), key=lambda r: -r['power'])[:n]
            return self.reply(200, rows)
        if u.path == '/api/fb':
            try:
                n = max(1, min(100, int(parse_qs(u.query).get('n', ['50'])[0])))
            except ValueError:
                n = 50
            with LOCK:
                rows = [{k: r[k] for k in ('name', 'cls', 'lv', 'cat', 'text', 'ts', 'reply') if k in r} for r in FB[-n:]][::-1]
            return self.reply(200, rows)
        if u.path == '/api/ping':
            return self.reply(200, {'ok': True, 'players': len(DB)})
        self.reply(404, {'error': 'not found'})

    def body(self, limit):
        ln = int(self.headers.get('Content-Length', '0'))
        if ln <= 0 or ln > limit:
            raise ValueError('bad size')
        return json.loads(self.rfile.read(ln).decode('utf-8'))

    def ip(self):
        return self.headers.get('CF-Connecting-IP') or self.client_address[0]

    def do_POST(self):
        path = urlparse(self.path).path
        if path.startswith('/api/acc/'):
            try:
                d = self.body(800000)
                name = d.get('name'); now = time.time(); ip = self.ip()
                if not acc_ok_name(name):
                    return self.reply(400, {'error': 'bad name'})
                act = path[len('/api/acc/'):]
                if act in ('register', 'login'):
                    hist = [t for t in ACC_TRY.get(ip, []) if now - t < 600]
                    if len(hist) >= 12:
                        return self.reply(429, {'error': 'too many tries'})
                    hist.append(now); ACC_TRY[ip] = hist
                    pw = d.get('pw')
                    if not isinstance(pw, str) or not (6 <= len(pw) <= 64):
                        return self.reply(400, {'error': 'bad password'})
                with LOCK:
                    a = acc_read(name)
                    if act == 'register':
                        if a:
                            return self.reply(409, {'error': 'exists'})
                        if not acc_ok_data(d.get('data')):
                            return self.reply(400, {'error': 'bad data'})
                        salt = _sec.token_hex(16); tok = _sec.token_hex(24)
                        a = {'name': name, 'salt': salt, 'hash': acc_hash(pw, salt), 'toks': [tok], 'data': d['data'], 'ts': int(now * 1000), 'dev': clean(d.get('dev'), 24)}
                        acc_write(name, a)
                        return self.reply(200, {'token': tok, 'ts': a['ts']})
                    if not a:
                        return self.reply(404, {'error': 'not found'})
                    if act == 'login':
                        if not hmac.compare_digest(acc_hash(pw, a['salt']), a['hash']):
                            return self.reply(403, {'error': 'wrong password'})
                        tok = _sec.token_hex(24)
                        a['toks'] = (a.get('toks') or [])[-7:] + [tok]
                        acc_write(name, a)
                        return self.reply(200, {'token': tok, 'ts': a['ts'], 'data': a['data'], 'dev': a.get('dev', '')})
                    if d.get('token') not in (a.get('toks') or []):
                        return self.reply(403, {'error': 'bad token'})
                    if act == 'load':
                        if d.get('meta'):
                            return self.reply(200, {'ts': a['ts'], 'dev': a.get('dev', '')})
                        return self.reply(200, {'ts': a['ts'], 'data': a['data'], 'dev': a.get('dev', '')})
                    if act == 'save':
                        if not acc_ok_data(d.get('data')):
                            return self.reply(400, {'error': 'bad data'})
                        if not d.get('force') and int(d.get('base', 0)) != a['ts']:
                            return self.reply(409, {'error': 'conflict', 'ts': a['ts'], 'dev': a.get('dev', '')})
                        a['data'] = d['data']; a['ts'] = int(now * 1000); a['dev'] = clean(d.get('dev'), 24)
                        acc_write(name, a)
                        return self.reply(200, {'ts': a['ts']})
                    if act == 'logout':
                        a['toks'] = [t for t in (a.get('toks') or []) if t != d.get('token')]
                        acc_write(name, a)
                        return self.reply(200, {'ok': True})
                return self.reply(404, {'error': 'unknown'})
            except Exception:
                return self.reply(400, {'error': 'bad request'})
        if path == '/api/xfer':
            try:
                d = self.body(800000)
                pid = str(d.get('id', ''))
                data = d.get('data')
                if not re.fullmatch(r'[a-z0-9]{4,16}', pid) or not isinstance(data, str) or not data.startswith('AO1.') or len(data) > 780000:
                    return self.reply(400, {'error': 'bad data'})
                now = time.time()
                if now - XF_LAST.get(pid, 0) < 30:
                    return self.reply(429, {'error': 'too fast'})
                XF_LAST[pid] = now
                import secrets
                with LOCK:
                    for k in [k for k, v in XF.items() if v.get('id') == pid]:
                        XF.pop(k, None)
                    code = ''.join(secrets.choice(XF_CH) for _ in range(6))
                    while code in XF:
                        code = ''.join(secrets.choice(XF_CH) for _ in range(6))
                    XF[code] = {'id': pid, 'd': data, 'exp': now + 86400, 'n': clean(d.get('name'), 16), 'lv': max(1, min(99, int(d.get('lv', 1))))}
                    xf_save()
                return self.reply(200, {'code': code, 'exp': int((now + 86400) * 1000)})
            except Exception:
                return self.reply(400, {'error': 'bad request'})
        if path == '/api/xfer/get':
            try:
                d = self.body(200)
                code = str(d.get('code', '')).upper().replace(' ', '')
                ip = self.ip()
                now = time.time()
                hist = [t for t in XF_GET.get(ip, []) if now - t < 600]
                if len(hist) >= 10:
                    return self.reply(429, {'error': 'too many tries'})
                hist.append(now)
                XF_GET[ip] = hist
                with LOCK:
                    v = XF.get(code)
                    if not v or v.get('exp', 0) < now:
                        return self.reply(404, {'error': 'not found'})
                    if d.get('take'):
                        XF.pop(code, None)
                        xf_save()
                return self.reply(200, {'data': v['d'], 'name': v.get('n', ''), 'lv': v.get('lv', 1)})
            except Exception:
                return self.reply(400, {'error': 'bad request'})
        if path == '/api/fb':
            try:
                d = self.body(4096)
                pid = str(d.get('id', ''))
                if not re.fullmatch(r'[a-z0-9]{4,16}', pid):
                    return self.reply(400, {'error': 'bad id'})
                text = re.sub(r'[\x00-\x09\x0b-\x1f<>`]', '', str(d.get('text') or '')).strip()[:300]
                if len(text) < 4:
                    return self.reply(400, {'error': 'too short'})
                now = time.time()
                if now - FB_LAST.get(pid, 0) < 60:
                    return self.reply(429, {'error': 'too fast'})
                FB_LAST[pid] = now
                cat = str(d.get('cat', 'other'))
                row = {'pid': pid, 'name': clean(d.get('name'), 16) or '冒險者', 'cls': clean(d.get('cls'), 10),
                       'lv': max(1, min(99, int(d.get('lv', 1)))), 'cat': cat if cat in FB_CATS else 'other',
                       'text': text, 'ts': int(now * 1000)}
                with LOCK:
                    FB.append(row)
                    del FB[:-1000]
                    fb_save()
                return self.reply(200, {'ok': True})
            except Exception:
                return self.reply(400, {'error': 'bad request'})
        if path == '/api/fb/reply':
            try:
                d = self.body(4096)
                tok = fb_token()
                if not tok or str(d.get('token', '')) != tok:
                    return self.reply(403, {'error': 'forbidden'})
                ts = int(d.get('ts', 0)); rep = clean(d.get('reply'), 300)
                with LOCK:
                    for r in FB:
                        if r['ts'] == ts:
                            r['reply'] = rep
                    fb_save()
                return self.reply(200, {'ok': True})
            except Exception:
                return self.reply(400, {'error': 'bad request'})
        if path != '/api/submit':
            return self.reply(404, {'error': 'not found'})
        try:
            ln = int(self.headers.get('Content-Length', '0'))
            if ln <= 0 or ln > 4096:
                return self.reply(400, {'error': 'bad size'})
            d = json.loads(self.rfile.read(ln).decode('utf-8'))
            pid = str(d.get('id', ''))
            if not re.fullmatch(r'[a-z0-9]{4,16}', pid):
                return self.reply(400, {'error': 'bad id'})
            now = time.time()
            if now - LAST.get(pid, 0) < 20:
                return self.reply(429, {'error': 'too fast'})
            LAST[pid] = now
            row = {'id': pid, 'name': clean(d.get('name'), 16) or '冒險者', 'cls': clean(d.get('cls'), 10),
                   'lv': max(1, min(99, int(d.get('lv', 1)))), 'power': max(0, min(999999, int(d.get('power', 0)))),
                   'ts': int(now * 1000)}
            hk = str(d.get('hk', ''))
            if re.fullmatch(r'class_[a-z]{3,12}_[mf]', hk):
                row['hk'] = hk
            eq = d.get('eq')
            if isinstance(eq, list) and len(eq) <= 8:
                out = []
                for e in eq:
                    if isinstance(e, list) and len(e) >= 3 and re.fullmatch(r'[a-z0-9_]{1,24}', str(e[0])):
                        out.append([str(e[0])] + [max(-1, min(99, int(v))) for v in e[1:5]])
                    else:
                        out.append(None)
                row['eq'] = out
            ex = d.get('ex')
            if isinstance(ex, dict):
                row['ex'] = {k: max(0, min(9999999, int(ex[k]))) for k in ('ch', 'kills', 'enh', 'nm', 'boss', 'ab', 'abw') if k in ex and str(ex[k]).lstrip('-').isdigit()}
            st = d.get('st')
            if isinstance(st, list) and len(st) <= 8:
                row['st'] = [max(0, min(9999999, int(v))) for v in st]
            with LOCK:
                for k in [k for k, r in DB.items() if k != pid and r.get('name') == row['name'] and r.get('cls') == row['cls']]:
                    DB.pop(k, None)  # 同名同職業的舊紀錄（重整產生的分身）合併
                DB[pid] = row
                save()
                rank = sorted(DB.values(), key=lambda r: -r['power']).index(row) + 1
            return self.reply(200, {'rank': rank, 'total': len(DB)})
        except Exception:
            return self.reply(400, {'error': 'bad request'})

    def log_message(self, *a):
        pass

def backup_loop():
    """每天把帳號、排行、回報打包一份到 backups/，只留最近 14 份。失敗不影響伺服器。"""
    import zipfile
    bdir = os.path.join(HERE, 'backups')
    while True:
        try:
            os.makedirs(bdir, exist_ok=True)
            name = os.path.join(bdir, time.strftime('%Y%m%d') + '.zip')
            if not os.path.exists(name):
                tmp = name + '.tmp'
                with LOCK:
                    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
                        for fn in ('rank_data.json', 'feedback_data.json', 'xfer_data.json'):
                            fp = os.path.join(HERE, fn)
                            if os.path.isfile(fp):
                                z.write(fp, fn)
                        adir = os.path.join(HERE, 'accounts')
                        if os.path.isdir(adir):
                            for fn in os.listdir(adir):
                                fp = os.path.join(adir, fn)
                                if os.path.isfile(fp):
                                    z.write(fp, 'accounts/' + fn)
                os.replace(tmp, name)
                old = sorted(f for f in os.listdir(bdir) if re.fullmatch(r'\d{8}\.zip', f))
                for f in old[:-14]:
                    os.remove(os.path.join(bdir, f))
        except Exception:
            pass
        time.sleep(3600)

if __name__ == '__main__':
    print(f'rank server on 127.0.0.1:{PORT}', flush=True)
    threading.Thread(target=backup_loop, daemon=True).start()
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
