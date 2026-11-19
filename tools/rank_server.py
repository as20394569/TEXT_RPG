"""蒼藍誓約 Online 排行榜伺服器（只用 Python 標準函式庫）
GET  /api/top?n=50   -> 依戰力排序的玩家列表
POST /api/submit     -> {"id","name","cls","lv","power"} 新增或更新自己的紀錄
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
                n = max(1, min(100, int(parse_qs(u.query).get('n', ['50'])[0])))
            except ValueError:
                n = 50
            with LOCK:
                rows = sorted(DB.values(), key=lambda r: -r['power'])[:n]
            return self.reply(200, rows)
        if u.path == '/api/ping':
            return self.reply(200, {'ok': True, 'players': len(DB)})
        self.reply(404, {'error': 'not found'})

    def do_POST(self):
        if urlparse(self.path).path != '/api/submit':
            return self.reply(404, {'error': 'not found'})
        try:
            ln = int(self.headers.get('Content-Length', '0'))
            if ln <= 0 or ln > 1024:
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
