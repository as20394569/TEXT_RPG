# 部署前執行：產生 art/list.json（遊戲用來判斷哪些圖存在，避免缺圖時一直重試）
import os,json
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'art')
json.dump(sorted(f[:-5] for f in os.listdir(d) if f.endswith('.webp')),open(os.path.join(d,'list.json'),'w'),separators=(',',':'))
