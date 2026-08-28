#!/usr/bin/env python3
"""Parse _diary/*.md → js/diary-data.js + js/expense-data.js + js/income-data.js"""
import re, os, json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DIARY_DIR = ROOT / '_diary'
DIARY_OUT = ROOT / 'src' / 'data' / 'diary-data.js'
EXPENSE_OUT = ROOT / 'src' / 'data' / 'expense-data.js'
INCOME_OUT = ROOT / 'src' / 'data' / 'income-data.js'

records = {}
expenses = []
incomes = []
seen = set()

# 合法分类（大类）集合 —— 与 src/data/expense-categories.ts / income-categories.ts 保持一致。
# build-diary.py 无法 import TS，故此处硬编码。若分类表变更需同步更新这里。
EXPENSE_CATS = {
    '居家生活', '通讯订阅', '形象装扮', '市内出行', '娱乐消费', '自我提升',
    '电子产品', '人情社交', '市外出行', '猫协救助', '医疗保健',
}
INCOME_CATS = {
    '工资收入', '兼职外快', '红包礼金', '退款返现', '报销', '他人还款', '理财收益', '其他收入',
}
violations = []  # [(类型, 日期, 原始分类, 提示)] 非规范记录收集，用于报错兜底

# 从配置文件加载特殊纪念关键词→图标映射
KW_FILE = ROOT / 'scripts' / 'special-keywords.json'
SPECIAL_KEYWORDS = {}
if KW_FILE.exists():
    with open(KW_FILE, encoding='utf-8') as f:
        SPECIAL_KEYWORDS = json.load(f)
special_events = {}

# GitHub Actions 不包含本地 Obsidian 日记目录时，沿用仓库中已提交的生成数据。
if not DIARY_DIR.is_dir():
    print(f'Warning: {DIARY_DIR} not found; keep existing generated data.')
    raise SystemExit(0)


def classify_meal(hhmm):
    """按时间段归类餐型（推荐默认阈值）。hhmm 形如 '12:30'。"""
    h, m = int(hhmm[:2]), int(hhmm[3:5])
    t = h * 60 + m
    if t >= 22 * 60 or t < 6 * 60:
        return '夜宵'
    if 6 * 60 <= t <= 9 * 60 + 59:
        return '早饭'
    if 10 * 60 <= t <= 14 * 60 + 59:
        return '中饭'
    if 17 * 60 <= t <= 21 * 60 + 59:
        return '晚饭'
    return '其他'


def extract_dish(desc):
    """从做饭描述里猜测菜名：取 '做饭：' 后到第一个逗号/句号前的内容。"""
    m = re.search(r'做饭[：:]\s*([^，,。.]+)', desc)
    if m:
        return m.group(1).strip()
    return None

for fname in sorted(os.listdir(DIARY_DIR)):
    if not fname.endswith('.md'):
        continue
    date = fname.replace('.md', '')
    with open(DIARY_DIR / fname, encoding='utf-8') as f:
        content = f.read()

    # ---- Day planner → diaryRecords ----
    m = re.search(r'# Day planner\n(.*?)(?=\n# )', content, re.DOTALL)
    if m:
        planner = m.group(1)
        tasks = []
        for line in planner.strip().split('\n'):
            match = re.match(r'- \[(.)\] #task (\d{2}:\d{2}) - (\d{2}:\d{2}) (.+?) \⏳', line)
            if match:
                status = match.group(1)
                start = match.group(2)
                end = match.group(3)
                time = f'{start}-{end}'
                desc = match.group(4).strip()
                is_cooking = '做饭' in desc
                meal_type = classify_meal(start) if is_cooking else None
                dish_guess = extract_dish(desc) if is_cooking else None
                tasks.append({
                    'status': status,
                    'time': time,
                    'desc': desc,
                    'isCooking': is_cooking,
                    'mealType': meal_type,
                    'dishGuess': dish_guess,
                })

        if tasks:
            done_count = sum(1 for t in tasks if t['status'] == 'x')
            records[date] = {'value': done_count, 'tasks': tasks}

            # 检测特殊纪念日程（每天最多一个图标）
            date_icons = {}
            for t in tasks:
                for kw, icon in SPECIAL_KEYWORDS.items():
                    if kw in t['desc']:
                        date_icons[kw] = icon
            if date_icons:
                special_events[date] = {
                    'icons': [list(date_icons.values())[0]],    # 每天最多一个图标
                    'keywords': list(date_icons.keys()),
                }

    # ---- # 支出 / # 收入 table → expenseRecords / incomeRecords ----
    # 表格结构：| 时间 | 分类 | 子项 | 金额(¥) | 备注 |；跳过表头/分隔行/当日合计/空分类
    def parse_table_section(header, out):
        m = re.search(r'# %s\n(.*?)(?=\n# |\Z)' % re.escape(header), content, re.DOTALL)
        if not m:
            return
        for line in m.group(1).strip().split('\n'):
            line = line.strip()
            if not line.startswith('|'):
                continue
            cells = [c.strip() for c in line.strip('|').split('|')]
            if len(cells) < 5:
                continue
            if cells[0] == '时间':
                continue
            if set(cells[1]) <= set('-: '):
                continue
            cat = cells[1]
            sub = cells[2]
            amt_raw = cells[3].replace('*', '').replace('¥', '').replace(',', '').strip()
            note = cells[4].replace('*', '').strip()
            if not cat or '合计' in cat:
                continue
            try:
                amount = float(amt_raw)
            except ValueError:
                continue

            # ---- 分类归一化 + 规范校验 ----
            # 分类列可能写成「大类/子类」合并格式（如「市内出行/奶茶饮品」），
            # 需拆出合法大类；无法识别的大类直接报错兜底，阻止编译。
            valid_cats = EXPENSE_CATS if header == '支出' else INCOME_CATS
            major = None
            minor = None
            for part in cat.split('/'):
                part = part.strip()
                if part in valid_cats:
                    major = part
                    break
            if major is None:
                violations.append(
                    f'  ✗ {header}记录 日期={date} 分类「{cat}」→ 未命中任何合法大类。'
                    f'合法大类：{"、".join(sorted(valid_cats))}。请改成规范大类（子类放子项列）。'
                )
                continue
            if '/' in cat:
                # 提取大类后的第一段作为子类，并入 sub；原 sub（具体项）并入 note，避免丢信息
                minor = [p.strip() for p in cat.split('/') if p.strip() and p.strip() not in valid_cats]
                minor = minor[0] if minor else ''
                if minor:
                    sub = minor + ('·' + sub if sub and sub != minor else '')
                if not minor and sub:
                    pass
            cat = major

            key = (date, cat, sub, amount, note)
            if key in seen:
                continue
            seen.add(key)
            out.append({
                'date': date,
                'cat': cat,
                'sub': sub,
                'amount': amount,
                'note': note,
            })

    parse_table_section('支出', expenses)
    parse_table_section('收入', incomes)

# ---- 规范校验：存在非规范分类时阻止编译，逼 Agent 查明并修正 ----
if violations:
    print('\n❌ 检测到非规范分类记录，未生成数据，请先修正以下内容：')
    for v in violations:
        print(v)
    print('\n说明：分类列应写规范大类（如「市内出行」），子类/子项写子项列。')
    print('     脚本会自动把「大类/子类」合并格式拆分为规范大类。')
    raise SystemExit(1)

with open(DIARY_OUT, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated from _diary/*.md by scripts/build-diary.py\n')
    f.write('export const diaryRecords = ')
    json.dump(records, f, ensure_ascii=False, indent=2)
    f.write(';\n')
    f.write('export const specialEvents = ')
    json.dump(special_events, f, ensure_ascii=False, indent=2)
    f.write(';\n')

with open(EXPENSE_OUT, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated from _diary/*.md by scripts/build-diary.py\n')
    f.write('export const expenseRecords = ')
    json.dump(expenses, f, ensure_ascii=False, indent=2)
    f.write(';\n')

with open(INCOME_OUT, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated from _diary/*.md by scripts/build-diary.py\n')
    f.write('export const incomeRecords = ')
    json.dump(incomes, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print(f'Wrote {len(records)} days, {len(expenses)} expenses, {len(incomes)} incomes to {DIARY_OUT} / {EXPENSE_OUT} / {INCOME_OUT}')

# ---- cooking detection summary (for agent to sync home foodRecords) ----
cooking = [(d, t) for d, rec in records.items() for t in rec['tasks'] if t.get('isCooking')]
if cooking:
    print('\n🍳 检测到做饭日程，建议同步到 home 美食记录：')
    for d, t in cooking:
        print(f"  - {d} {t['time']} 餐型={t['mealType']} 菜名≈{t['dishGuess']}")
