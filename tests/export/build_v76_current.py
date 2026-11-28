"""匯出 v21.2 實際執行資料 → V76_CURRENT_DATA.xlsx（只讀，不改程式）
需要：/tmp/exp/run.json（collect.py 從瀏覽器讀出）、/tmp/exp/use.json（scan.py 掃原始碼）、/tmp/exp/cases.json"""
import json,sys
from openpyxl import Workbook
from openpyxl.styles import Font,Alignment,PatternFill
R=json.load(open('/tmp/exp/run.json'));U=json.load(open('/tmp/exp/use.json'));CS=json.load(open('/tmp/exp/cases.json'))
V76=json.load(open('tests/results/spec_v76/ana.json'))
SKD={s['id']:s for s in R['sk']};V76S={s['id']:s for s in V76['sk']};V76T={t['id']:t for t in V76['tal']}
J=lambda o:'' if o in (None,{},[]) else json.dumps(o,ensure_ascii=False)
use=lambda k:'、'.join(U.get(k,[])) or '（無消費端）'
wb=Workbook();wb.remove(wb.active)
HF=Font(bold=True,color='FFFFFF');HB=PatternFill('solid',fgColor='305496');WR=Alignment(wrap_text=True,vertical='top')
def sheet(name,head,rows,widths):
    ws=wb.create_sheet(name);ws.append(head)
    for c in ws[1]:c.font=HF;c.fill=HB;c.alignment=Alignment(wrap_text=True,vertical='center')
    for r in rows:ws.append(r)
    for i,w in enumerate(widths):ws.column_dimensions[chr(65+i) if i<26 else 'A'+chr(65+i-26)].width=w
    for row in ws.iter_rows(min_row=2):
        for c in row:c.alignment=WR
    ws.freeze_panes='C2';ws.auto_filter.ref=ws.dimensions;return ws
# ---------- 說明 ----------
ws=wb.create_sheet('說明')
for l in ['V76_CURRENT_DATA — 蒼藍誓約 v21.2 正式遊戲實際資料匯出（供 V7.6 Excel 修正）',
 '來源：在瀏覽器載入正式版 index.html 後讀出的執行期資料（SK、FX7、PSV、V6.TAL、parseTal6 結果、LUNASK、ALLY、mkAlly/allyAct/allyTgt 原始碼），再掃描 v6_skill.js／v7_core.js／v6_mob.js／index.html 找出每種效果的實際消費函式。',
 '以實際生效邏輯為準：後載入的 v7_core.js 會覆蓋 v6_skill.js 的同名函式（如 effs6、autoAct）；被動技能只有放進「被動欄」才生效（pasOn7）。',
 '本檔只匯出資料，未修改任何程式碼或數值。',
 '單位：倍率%＝程式內 pow×100；MP 為表值，實際消耗見「實際MP公式」；冷卻單位為「玩家自身行動次數」。',
 '工作表：1 現行技能、2 現行天賦、3 天賦差異、4 同行者、5 規格差異、6 T0532、附：效果處理器對照。']:ws.append([l])
ws.column_dimensions['A'].width=160
for c in ws['A']:c.alignment=WR
ws['A1'].font=Font(bold=True,size=13)
# ---------- 1 現行技能 ----------
def handlers(s):
    h=[];f=s['fx7'] or {}
    if not s['act']:
        for e in (s['psv'] or []):h.append(f"被動 PSV「{e.get('k')}」→ {use(e.get('k'))}")
        if not s['psv']:h.append('被動：無 PSV 對應（無效果）')
        h.append('生效條件：Lv 達標且放入被動欄（effs6／pasOn7，v7_core.js）')
        return '\n'.join(h)
    if s['pow']:h.append('useSkill6 → hitFoe（基礎傷害；連擊每次施放判 1 次、追加 35%）')
    if s['h'] and s['h']>1:h.append(f"多段：{s['h']} 段（單次命中／爆擊判定後拆段顯示）")
    if s['id']=='J03S2':h.append('useSkill6 寫死：本招物防穿透 +15')
    if s['id']=='J09S2':h.append('useSkill6 寫死：本招物防穿透 +20')
    if s['id']=='J08S3':h.append('useSkill6／tgtAmp6 寫死：目標有腐蝕時增傷 +25%')
    if s['inCase']:h.append('skFx6 寫死分支：'+CS.get(s['id'],''))
    else:
        if f.get('charge'):h.append('蓄力：useSkill6 先蓄力（FX7.charge），下次行動 relCharge7 釋放')
        if 'inf' in f:h.append(f"fx7Apply：命中後 {int(f['inf']['p']*100)}% 附加 {f['inf']['id']}（持續 durOf6，預設 STX 時長或 2）")
        if 'push' in f:h.append(f"fx7Apply：敵行動條 −{f['push']}")
        if 'self' in f:h.append(f"fx7Apply：自身 {f['self']}"+('（護盾＝最大HP 12%×(1+護盾加成)）' if f['self']=='SHIELD' else ''))
        if 'selfV' in f:h.append(f"fx7Apply：自身 {f['selfV']['id']} +{f['selfV']['v']}，{f['selfV']['dur']} 次行動")
        if 'heal' in f:h.append(f"fx7Apply → heal6：回最大HP {f['heal']*100:g}%")
        if 'mp' in f:h.append(f"fx7Apply：回最大MP {f['mp']*100:g}%")
        if 'ls' in f:h.append(f"fx7Apply：吸血 {f['ls']*100:g}%（上限最大HP 10%，吃 lsamp）")
        if 'cleanse' in f:h.append(f"fx7Apply：清除 {f['cleanse']} 個負面 → cleansh7")
        if 'amp' in f:h.append('skAmp7：條件增傷 '+J(f['amp']))
        if 'pen' in f:h.append(f"skPen7：本招穿透 +{f['pen']}")
        if 'dotAmp' in f:h.append(f"fx7Apply：本招跳傷 +{f['dotAmp']*100:g}%")
    if s['tg'] in ('雙體','全體'):h.append('aoeHit7：'+('主目標＋HP 最低的 1 個副目標' if s['tg']=='雙體' else '主目標＋HP 最低的最多 3 個副目標')+'；副目標同倍率，逐目標 fx7Apply')
    fx=s['fxTbl'] or '無'
    if fx!='無' and not s['inCase'] and not f and not s['spec'] and not (s['h'] and s['h']>1):h.append('⚠ 效果文字未被任何處理器解析')
    return '\n'.join(h)
rows=[]
for s in R['sk']:
    t=V76S.get(s['id'],{})
    mpf='' if not s['mp'] else f"round({s['mp']}×(0.5+Lv/100)×(1−MP減免%)×(1−天賦skmp%)×狀態mpCost)，最低 1"
    cdf='' if not s['cd'] else f"max(ceil({s['cd']}×0.5), {s['cd']}−天賦skcd)；冷卻中以玩家行動計"
    rows.append([s['id'],s['job'],s['n'],'主動' if s['act'] else '被動',s['lv'],t.get('olv'),s['tg'],s['h'] or (1 if s['pow'] else ''),
                 s['dt'] or '',s['s'] or '',round((s['pow'] or 0)*100) if s['pow'] else 0,s['mp'] or 0,mpf,s['cd'] or 0,cdf,
                 s['fxTbl'] or '無','、'.join(s['tags'] or []),J(s['fx7']) if s['act'] else J(s['psv']),handlers(s),s['d'] or ''])
sheet('1 現行技能',['技能ID','職業','名稱','類型','解鎖Lv（現行）','V7.6表上舊解鎖Lv','目標','段數','傷害類型','使用屬性','倍率%','MP（表值）','實際MP公式','冷卻（行動）','實際冷卻公式','效果（表）','標籤','執行期解析結果（FX7／PSV）','實際處理函式','遊戲內說明'],rows,
      [9,8,12,6,8,9,7,5,7,7,7,7,30,7,28,30,16,30,60,30])
# ---------- 2 現行天賦 ----------
def tal_handler(p):
    if not p or p.get('k')=='none':return '⚠ parseTal6 無法解析（無效果）'
    k=p['k'];return f"effs6 → 「{k}」→ {use(k)}"
def tal_ids(p):
    if not p:return ''
    ids=[p.get(x) for x in ('sk','src','self') if isinstance(p.get(x),str)]
    if p.get('src')=='counter':ids=[i for i in ids if i!='counter']+['（反制事件 J05S6）']
    return '；'.join(dict.fromkeys(ids))
def tal_cond(p):
    if not p:return ''
    o=[]
    if p.get('st'):o.append('目標狀態 '+'/'.join(p['st']))
    if p.get('need'):o.append('目標身上需有 '+'/'.join(p['need']))
    if p.get('tag'):o.append('技能標籤「'+p['tag']+'」')
    if p.get('key'):o.append('屬性 '+p['key'])
    if p.get('ev'):o.append('事件 '+str(p['ev']))
    if p.get('th') is not None:o.append('門檻 '+str(p['th']))
    return '；'.join(o)
rows=[]
for t in R['tal']:
    v=V76T.get(t['id'],{})
    rows.append([t['id'],t['job'],t['br'],t['n'],t['lv'],t['max'],t['pre'],t['fx'],t['calc'],tal_ids(t['p1']),tal_cond(t['p1']),J(t['p1']),J(t['pm']),tal_handler(t['p1']),
                 v.get('cand',''),v.get('st',''),'' if v.get('fx')==t['fx'] else v.get('fx','')])
sheet('2 現行天賦',['天賦ID','職業','分支','名稱','解鎖Lv','最大等級','前置ID','效果（現行文字）','計算','關聯技能ID（程式實際解析）','其他條件（狀態／標籤／屬性／事件）','解析結果 Lv1','解析結果 滿級','實際效果處理器','V7.6 候選關聯ID','V7.6 狀態','V7.6 文字（與現行不同時）'],rows,
      [8,8,7,10,6,6,7,36,8,16,22,30,30,44,16,12,30])
# ---------- 3 天賦差異 ----------
TAG=R['tagSk']
D=[
('T0121','J01S3','J01S3','J01S16「守勢」是被動（drbuff：守勢狀態期間增傷），不會被「守勢斬減傷額外」影響。只綁主動技守勢斬。'),
('T0122','J01S3','J01S3（間接影響 J01S16）','延長的是守勢斬造成的 GUARD 狀態；J01S16 在 GUARD 期間生效，會被間接延長，但不需綁定。'),
('T0125','J01S1（事件：守勢期間受傷）','J01S1；條件狀態 GUARD（來源 J01S3）','增傷對象是斬擊 J01S1；「守勢期間」指 J01S3 給的 GUARD，不是被動 J01S16。建議表上分開「目標技能」與「條件來源」。'),
('T0133','J01S3','J01S3','冷卻計數只對主動技有意義；J01S16 是被動，沒有冷卻。'),
('T0231','（無 ID：所有 0 MP 技能命中時）','J02S1','程式 zmp 套用在「本次 MP 消耗為 0 的技能」，法師目前只有魔彈 J02S1 是 0 MP，結果相同；建議寫明 J02S1，避免日後新增 0 MP 技能被誤套。'),
('T0311','J03S2','J03S2','J03S14「穿透」是被動（全技能穿透 +5），不是被強化對象。'),
('T0312','（無 ID：標籤「穿透」）','標籤「穿透」：'+'、'.join(TAG.get('穿透',[])),'程式依標籤套用，實際命中 '+'、'.join(TAG.get('穿透',[]))+'（含其他職業標籤但只套本職業天賦）；J03S14 是被動，沒有直接傷害。建議表上列出實際標籤技能。'),
('T0313','J03S1','J03S1','同 T0311，J03S14 為被動，不需綁定。'),
('T0315','來源 J03S2 → 目標 J03S1','來源 J03S2；目標 J03S1','J03S14 不參與；建議表上分「觸發來源」與「受益技能」兩欄。'),
('T0413','J04S1（條件狀態 SEAL）','J04S1；條件狀態 SEAL（來源 J04S2）','程式判斷目標身上有沒有聖印狀態，不管是誰施加；J04S2 是狀態來源，不是受益技能。'),
('T0415','來源 J04S3 → 目標 J04S1（條件：自身聖印期間）','來源 J04S3；目標 J04S1；條件狀態 SEAL（來源 J04S2）','同上，J04S2 只是條件來源。程式在 trig6 檢查「敵人身上有 SEAL」才登記下次增傷，行為符合文字。'),
('T0531','（無 ID：反制事件）','J05S6','程式 counterAmp 直接加在反制反擊倍率；反制來自被動 J05S6，需放入被動欄才會觸發。'),
('T0532','⚠ 新文字無法解析（現行文字解析為 skcdn → J05S6）','J05S6（新處理器：反制觸發計數）','見工作表「6 T0532」。'),
('T0535','來源「counter」事件 → 目標 J05S1','來源 J05S6（反制事件）；目標 J05S1','程式用內部事件名 counter 代表反制，行為與 J05S6 相同；建議表上寫 J05S6 並註明「事件」。'),
('T0731','（無 ID：所有 0 MP 技能命中時）','J07S1','同 T0231，大魔導士目前只有星彈 J07S1 是 0 MP。'),
('T0931','J09S2','J09S2','J09S14 是被動（現行：全技能穿透 +5），不需綁定。'),
('T0932','（無 ID：標籤「穿透」）','標籤「穿透」：'+'、'.join(TAG.get('穿透',[])),'同 T0312；神射手實際有穿透標籤的是 J09S2。'),
('T1113','J11S1（條件狀態 JUDGE）','J11S1；條件狀態 JUDGE（來源 J11S2）','同 T0413。'),
('T1115','目標 J11S1（條件：自身審判印期間、事件：治療）','目標 J11S1；條件狀態 JUDGE（來源 J11S2）；事件：任何治療','同 T0415：trig6 檢查敵人身上有 JUDGE，任何治療事件都算。'),
('T1125','（無 ID：寫死在 J11S3 分支）','J11S3','程式在 skFx6 的黎明祈禱分支內處理 cleanseShield；其他淨化技能（如 fx7Apply 的清除負面）不會觸發。'),
]
rows=[]
for tid,cur,sug,why in D:
    t=next(x for x in R['tal'] if x['id']==tid);v=V76T[tid]
    rows.append([tid,t['job'],t['n'],v['fx'],v['cand'],cur,sug,why,J(t['p1'])])
sheet('3 天賦差異',['天賦ID','職業','名稱','V7.6 效果文字','V7.6 候選關聯ID','現行程式對應','建議明確對應','原因','現行解析結果'],rows,[8,8,10,34,18,30,30,60,34])
# ---------- 4 同行者 ----------
C=[
('露娜','開放條件','S.party==="luna" 且主線第 1 章後（ALLY.luna.open：S.main.ch>=1）','進隊伍選擇','withLuna()、ALLY（index.html）',''),
('露娜','生命／防禦','HP＝玩家最大HP×70%；DEF＝玩家DEF×60%','每場戰鬥開始補滿','mkAlly（index.html）','倒下後本場不再行動、不代擋'),
('露娜','攻擊基準 pw','max(玩家物攻, 玩家魔攻)×0.5×羈絆係數','羈絆係數＝1＋min(20,羈絆)×0.02（最高 1.4）','mkAlly','V7.6 候選：玩家魔攻 20%／行動'),
('露娜','出手頻率','即時戰鬥：自身行動條 3.3 秒滿一次（手動操作時 ×0.5 速度）；舊回合制：每回合 1 次','B.allyTurn 防重複','rtStep／allyAct（index.html）',''),
('露娜','傷害公式','pw×招式倍率×100/(100＋敵DEF×(1＋敵防禦增益))×亂數0.9～1.1，先扣敵護盾，首領受 capB 上限','—','allyAct 內 hit()','獨立計算，不觸發玩家被動、連擊、吸血'),
('露娜','技能優先序 1：星光爆裂（oath）','倍率 3.0 傷害＋治療玩家最大HP 7.5%','羈絆≥6；每場一次；首領戰或敵HP<50%；主敵已行動≥3 次','allyAct、LUNASK.oath','⚠ 遊戲內說明仍寫「治療你 15%」，實際 7.5%（v21.2）'),
('露娜','技能優先序 2：治癒術（heal）','回復玩家最大HP×0.1×羈絆係數（最高 14%）','玩家HP<45% 且冷卻 0；冷卻 3 次露娜行動','allyAct、mkAlly.heal','⚠ 說明寫「冷卻 9 秒」，實際為 3 次行動（約 9.9 秒）'),
('露娜','技能優先序 3：魔法護盾（ward）','玩家下一次受到的傷害 ×0.6','敵人蓄力或下一招是預告危險技；第 3 章或羈絆 3 解鎖；冷卻 4 次行動','allyAct、v6_mob.js foeHit 區段、index.html 受傷處理','不是護盾量，是一次性減傷 40%'),
('露娜','技能優先序 4：驅散術（clear）','敵人虛弱 2 回合＋倍率 0.8 傷害','第 4 章解鎖；冷卻 4；玩家中毒／灼燒或敵有增益時 60% 機率','allyAct','只削弱敵人，不清除玩家負面'),
('露娜','技能優先序 5：火球術（flame）','倍率 1.6 傷害，40% 灼燒 2 回合','主敵行動次數為 3 的倍數','allyAct',''),
('露娜','技能優先序 6：魔法彈（bolt）','倍率 1.0 傷害','以上都不成立時','allyAct',''),
('露娜','代擋','28% 機率代替玩家承受主敵攻擊','只對主敵（隨從、召喚物不會被代擋）；玩家格擋／閃避窗口中不代擋；露娜HP>0','allyTgt、foeAttack6（v6_mob.js）','V7.6 候選：0%／10%'),
('露娜','代擋承傷','原始傷害×100/(100＋露娜DEF)×0.9～1.1','—','allyHurt（index.html）',''),
('露娜','黑霧','每次行動驅散 1 層霧','戰鬥有霧時','fogStrip',''),
('露娜','治療（自然回復等）','無其他治療；玩家自然回復 ×0.5（v21.2）與露娜無關','—','pPre7（v7_core.js）',''),
('蓋爾','開放條件','S.party==="gale" 且 S.flags.galeBack','劇情旗標','ALLY.gale.open',''),
('蓋爾','生命／防禦','HP＝玩家最大HP×105%；DEF＝玩家DEF×110%','每場戰鬥開始補滿','mkAlly',''),
('蓋爾','攻擊基準 pw','max(玩家物攻, 玩家魔攻)×0.62（無羈絆加成）','—','mkAlly','V7.6 候選：玩家物攻 20%／行動'),
('蓋爾','出手頻率／傷害公式','同露娜（3.3 秒行動條；同一 hit() 公式）','—','allyAct',''),
('蓋爾','技能優先序 1：嘲諷','接下來 2 次主敵攻擊必定由蓋爾承受','冷卻 0 時 35% 機率；冷卻 3 次行動','allyAct、allyTgt（B.taunt）',''),
('蓋爾','技能優先序 2：雪葬','倍率 1.9 傷害','主敵行動次數為 3 的倍數','allyAct',''),
('蓋爾','技能優先序 3：揮劍斬擊','倍率 1.1 傷害','其餘情況','allyAct',''),
('蓋爾','代擋','28%（與露娜共用 allyTgt）＋嘲諷時必擋','只對主敵；玩家格擋／閃避窗口中不代擋','allyTgt','V7.6 候選：15%／20%；需把露娜、蓋爾代擋拆開'),
('蓋爾','治療','無','—','—',''),
('蓋爾','護盾','⚠ 現行沒有任何護盾技能','—','—','V7.6「護盾：沿用現行」→ 現行不存在，需定義（若指嘲諷請改名）'),
('共通','同時同行','只能選一位（S.party 單值）','—','—','V7.6「不得與露娜同時同行」與現行一致'),
('共通','觸發玩家被動／連擊','不會（同行者傷害走自己的 hit()）','—','allyAct','與 V7.6 規則一致'),
]
sheet('4 同行者',['角色','項目','現行實際值／計算公式','觸發條件','程式位置','備註（含與 V7.6 差異、說明不一致）'],[list(x) for x in C],[7,26,52,40,32,46])
# ---------- 5 規格差異 ----------
X={
'J01S7':('aoeHit7（副目標同 100%）','逐目標倍率（副目標 70%）；副目標專屬附加 ARMOR 1 次行動','aoeHit7 副目標固定同倍率；skFx6sub7 是空殼；ARMOR 1 次 vs 破甲斬 2 次同 ID 覆蓋規則'),
'J01S8':('aoeHit7','命中數計數 → 下次「單體直接技能」增傷 5%/目標，上限 20%，不疊加','nextBuff6 現行以技能 ID 或 direct 消耗；需判斷 tg==="單體"；與 T0115 等 next 增傷的消耗順序'),
'J02S3':('skFx6 寫死：FROST 15%','分支內追加：命中後自身護盾 最大HP 5%，2 次自身行動','SHIELD 同 ID 單層覆蓋（冰盾、其他護盾）；T0221/T0222 的 durOf6 會不會延長護盾需寫明；法師生存度變化需模擬'),
'J02S7':('fx7Apply：50% BURN','BURN 持續寫明 2 次目標行動（現行預設即 2）','倍率 80→70；新文字不符 parseSkFx7「附加X，機率N%」格式，套表後會變成無效果'),
'J02S8':('fx7Apply：50% FROST','命中目標行動條 −15（FX7.push 能力已存在），每目標每次施放一次','新文字未提 FROST，需確認是否移除；文字不符「^敵行動條退N百分點$」格式，無法解析'),
'J03S7':('aoeHit7','副目標專屬附加 SLOW 1 次行動','同 J01S7：副目標專屬效果處理器'),
'J03S8':('aoeHit7（1 段）','段數改 3（每段 25%）；共用命中及爆擊','現行段數由 SK.dmg.h 決定，表上沒有段數欄；現行已是單次判定後拆段，相容；若加「多段」標籤會被 T1331 套用'),
'J03S15':('PSV condcrit（減速敵爆擊 +4）','只改名','無'),
'J04S7':('fx7Apply：50% WEAK','每命中 1 敵回自身最大HP 1%，上限 4%（逐目標計數）','heal6 會觸發 trig6("heal")，多目標可能讓 J04S6、T0415、T0424 一次施放觸發多次'),
'J04S8':('aoeHit7','副目標專屬附加 HOLYMARK（=SEAL）1 次行動','SEAL 降傷（foeOutMul6）與 T0412 疊加；副目標專屬效果處理器'),
'J05S7':('fx7Apply：50% SLOW','每命中 1 敵獲最大HP 3% 護盾，上限 12%，2 次自身行動','新文字未提 SLOW；SHIELD 同 ID 覆蓋；shamp（J07S15/J12S15）是否加成需定義'),
'J05S8':('aoeHit7','至少命中一次 → 下次格擋率 +10，1 次自身行動','BLOCKUP 已被盾壁反擊（+20）使用，同 ID 覆蓋或取大需定義'),
'J06S7':('aoeHit7','新施放成本：消耗最大HP 5%（不致死、不足不可施放）；施放前 HP<50% 增傷 25%','skReady6 只檢查 MP；自傷是否觸發 onHurt6、低血護盾、狂戰士低血天賦；FX7.amp.selfLt 可用但需「施放前」快照'),
'J06S8':('aoeHit7','擊殺至少一個非召喚敵 → 回最大HP 5%，每次施放一次','需新增「本次施放擊殺」事件；召喚物判定 summon7；群體戰獎勵去重'),
'J07S7':('fx7Apply：50% BURN','本技能 BURN 可疊 2 層，各自到期；其他來源維持單層','⚠ 狀態系統現為同 ID 單層（stAdd 覆蓋），需新增多層結構；影響 T0715、灼燒判定、跳傷結算'),
'J07S8':('fx7Apply：50% FROST','已減速目標命中後 20% 暈眩 1 次行動，遵守免疫','新文字未提 FROST；需「依目標狀態的條件附加」；暈眩會打斷首領預告（rtStep 打斷 rtw），影響首領戰'),
'J07S15':('PSV shamp 10','只改名','無'),
'J07S16':('PSV mp3 4','只改名','無'),
'J08S7':('fx7Apply：50% POISON','本技能施毒的目標死亡時，把剩餘毒傳給一個未中毒敵人，最多一次','需死亡事件鉤子並記錄毒來源；首領死亡時召喚物會被移除（v7_map foeTake6）'),
'J08S8':('aoeHit7','每目標依負面種類數增傷 10%，上限 30%','與 J08S16 debuffamp（有負面 +6%）疊加'),
'J08S15':('PSV lsamp 15','只改名','⚠ 現行 lsamp 只作用 FX7.ls 吸血；嗜血斬 J06S3、噬魂 J08S3 的吸血寫死在 skFx6，不吃 lsamp（J06S15 同）'),
'J09S7':('aoeHit7（無附加）','本次穿透 +20（FX7.pen 已有）；獵印目標爆擊 +15（逐技能條件爆擊）','複句文字 parseSkFx7 無法解析（全部以 ^…$ 單句比對）'),
'J09S8':('aoeHit7','每個命中目標附加 MARK 1 次目標行動','FX7.inf 可用，但持續時間會用 STX 預設；需指定 1 次'),
'J09S10':('fx7Apply：ARMOR','保留 ARMOR；下次貫星箭命中率 +10，2 次自身行動','需新增「下次指定技能命中率」增益；複句無法解析'),
'J09S11':('fx7Apply：自身 FOCUS','保留 FOCUS；下次命中獵印敵人的單體技能爆擊 +10，2 次自身行動','需新增條件型下次爆擊增益；複句無法解析'),
'J09S14':('PSV stat pen 5（全技能）','穿刺技能穿透 +5；對獵印敵再 +2','⚠ 現行已偏離文字：套用在所有技能而非穿刺技能；需標籤判定與條件穿透'),
'J10S3':('skFx6 寫死：EVAUP 8','EVAUP 改 12；首次未迴避的直接傷害 −15% 並消耗（一次性保護狀態）','需新狀態；T1031（fxv）、T1032（durOf6）會同時加在 12 上；刺客生存度需模擬'),
'J10S7':('aoeHit7','至少命中一次 → 自身迴避 +10，1 次自身行動','與影襲 EVAUP 同 ID 覆蓋（12 vs 10）需定義'),
'J10S8':('fx7Apply：50% POISON','保留 POISON；已中毒目標爆擊 +15','逐技能條件爆擊（現行 condcrit 只來自被動）；複句無法解析'),
'J10S14':('PSV dotk BLEED 10','改為中毒跳傷 +10%','改 PSV 對象；被動欄存檔 ID 不變，相容'),
'J11S7':('aoeHit7','每命中 1 敵給玩家最大HP 2% 護盾，上限 8%，2 次自身行動','同 J05S7 的護盾累加與覆蓋問題'),
'J11S8':('aoeHit7','對審判印目標增傷 30%','FX7.amp 已能做，但文字「目標」不符 parser 的「^對X敵增傷N%$」'),
'J11S12':('fx7Apply：自身 GUARD','只改名','無'),
'J12S7':('fx7Apply：50% ARMOR','命中附 ARMOR（機率改 100%？）1 次目標行動；自身格擋 +10，1 次自身行動','機率未寫明；BLOCKUP 同 ID 覆蓋'),
'J12S8':('aoeHit7','命中後下次承受直接傷害反彈 10% 實際HP損失，1 次自身行動','玩家側無反彈狀態（P19 反刺只給怪物），需新增'),
'J12S16':('PSV evmp block 1','只改名','⚠ 現行沒有間隔限制：PSV 項目沒有 lim，trig6 的 pool() 不會擋，每次格擋都回魔；需新增每行動一次限制'),
'J13S7':('aoeHit7（1 段）','每目標兩段各 37.5%；任一爆擊 → 自身行動條 +10，每次施放一次','段數需改 2；行動條加成可沿用 trig6("crit") 但需限制每次施放一次；名稱已是影步亂斬'),
'J13S8':('aoeHit7（1 段）','每目標兩段各 50%；共用命中爆擊；連擊每次施放最多一次','只需段數 2；現行連擊本就每次施放判 1 次'),
'J13S11':('fx7Apply：ARMOR','兩段各 65%；命中附 ARMOR 一次','段數 2；ARMOR「一次」的持續需寫明'),
}
rows=[]
for s in V76['sk']:
    if s['act']!='候選修改':continue
    g=SKD[s['id']];x=X[s['id']]
    rows.append([s['id'],s['job'],g['n'],s['nn'],g['tg'],round((g['pow'] or 0)*100),s['pow'],g['fxTbl'] or '無',s['fx'],x[0],x[1],x[2]])
ws=sheet('5 規格差異',['技能ID','職業','現行名稱','V7.6 名稱','目標','現行倍率%','V7.6 倍率%','現行效果（表）','V7.6 候選效果','現行處理器','需要新增／修改的處理','可能衝突'],rows,[8,8,10,10,6,7,7,24,40,26,44,50])
ws.append([]);ws.append(['共通問題'])
for l in ['1. parseSkFx7 全部以「^…$」單句比對，V7.6 的複句（含「；」）套表後會解析失敗、變成沒有效果。需改成結構化欄位或擴充解析器。',
          '2. aoeHit7 對所有副目標用同一倍率，也沒有副目標專屬效果（skFx6sub7 為空殼）。橫斬、散射、光雨都需要。',
          '3. 狀態是同 ID 單層：SHIELD、BLOCKUP、EVAUP 會被不同技能互相覆蓋；火焰風暴的雙層灼燒需新結構。',
          '4. 範圍技逐目標觸發效果時，trig6 事件（heal、hit、crit）可能一次施放觸發多次，需「每次施放一次」去重。',
          '5. 段數由 SK.dmg.h 決定，Excel 沒有段數欄；建議新增「段數」欄。']:ws.append([l])
# ---------- 6 T0532 ----------
t=next(x for x in R['tal'] if x['id']=='T0532')
rows=[
('天賦資料（現行）',f"{t['id']} {t['n']}｜騎士／反擊分支｜Lv{t['lv']}｜最大 {t['max']}｜前置 {t['pre']}"),
('現行文字',t['fx']),
('V7.6 新文字',V76T['T0532']['fx']),
('現行解析方式','parseTal6 以「(技能名)每累計施放N次該技能，該技能剩餘冷卻減1次；每級門檻減1（最低M次）」比對 → {k:"skcdn", sk: skBy6("反制")}；skBy6 找到被動 J05S6「反制」。'),
('現行解析結果 Lv1／Lv2／Lv3',f"{J(t['p1'])}；門檻依等級 4／3／2（max(最低2, 4−(等級−1))）"),
('現行實際生效位置','① useSkill6：施放「主動技」k 時累計 P.cast[k]，達門檻冷卻 −1 → J05S6 是被動、不會被施放，這條路徑永遠不生效。\n② onBlock6（v21.1 修正）：格擋成功觸發反制（PSV J05S6：counter 倍率 35%、冷卻 1 次行動）時，對 skcdn 中 sk＝J05S6 的項目累計觸發次數，達門檻時把反制冷卻起點 cntT −1。'),
('現行有效機制（白話）','每次「反制」觸發計 1 次；累計滿 4／3／2 次（依天賦等級），下一次反制的冷卻少 1 次行動。反制本身冷卻只有 1 次行動，減 1 後等於下一次立即可再觸發。'),
('生效前提','①已學 J05S6 且放入被動欄（effs6／pasOn7），否則沒有 counter 效果；②格擋成功（被動格擋率或手動格擋）；③魔法攻擊無法格擋，不會觸發。'),
('新文字解析結果',J(R['t532new'])+' → parseTal6 最後回傳 {k:"none"}，天賦點了也沒有任何效果。'),
('語意相容性','新文字「每累計觸發4次」與現行 v21.1 的實際行為（計算反制觸發次數）一致，比舊文字「施放」更正確。'),
('相容性問題 1：解析','新文字少了「該技能」與「施放」，現行正則無法比對；套表前需新增解析規則（例：反制每累計觸發N次，剩餘冷卻減1次…），或改用明確 ID 映射（建議：T0532 → 處理器 counterCdn，綁 J05S6）。'),
('相容性問題 2：冷卻單位','反制冷卻只有 1 次行動，「剩餘冷卻減 1」效果很小（只讓下一次反制可在同一行動區間連續觸發）；若企劃意圖較強，需同時確認反制基礎冷卻。'),
('相容性問題 3：處理器借用','現行把 skcdn（主動技冷卻）借給反制事件使用，兩種語意混在同一種效果；建議拆成獨立處理器，避免日後 skBy6 把其他被動名誤綁。'),
('相容性問題 4：存檔','天賦 ID 不變、等級上限不變，舊存檔已點的 T0532 等級可直接沿用，無需遷移。'),
('相容性問題 5：說明顯示','天賦頁顯示的是 V6.TAL 文字；若只改程式不改資料，玩家看到的仍是舊文字「施放」。'),
('建議（不在本次實作）','V7.6 表採用新文字；程式新增明確映射 T0532 → counterCdn（J05S6）；回歸測試加入「格擋 4／3／2 次反制後冷卻減 1」案例。'),
]
sheet('6 T0532',['項目','內容'],[list(x) for x in rows],[26,120])
# ---------- 附：處理器對照 ----------
rows=[[k,'、'.join(v)] for k,v in sorted(U.items()) if k not in ('foe','big','a','c','lo7','smith','fb','rank','settings','atk','SHIELD')]
sheet('附 處理器對照',['效果種類 k','實際消費函式（檔案）'],rows,[18,100])
out=sys.argv[1] if len(sys.argv)>1 else 'V76_CURRENT_DATA.xlsx';wb.save(out);print('saved',out)
