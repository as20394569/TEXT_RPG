"""蒼藍誓約 Online 排行榜伺服器（只用 Python 標準函式庫）
GET  /api/top?n=50   -> 依戰力排序的玩家列表（最多 300）
POST /api/submit     -> {"id","name","cls","lv","power"} 新增或更新自己的紀錄
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

    def do_POST(self):
        path = urlparse(self.path).path
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
                row['ex'] = {k: max(0, min(9999999, int(ex[k]))) for k in ('ch', 'kills', 'enh', 'nm', 'boss') if k in ex and str(ex[k]).lstrip('-').isdigit()}
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

if __name__ == '__main__':
    print(f'rank server on 127.0.0.1:{PORT}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
