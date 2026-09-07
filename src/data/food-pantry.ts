// 猪窝厨房工作台 · 食材存放
// 两部分数据：
// 1) pantryShelfGroups —— 存放周期参考卡（下部知识卡，默认时长查这里）
// 2) foodPantry —— 当前冰箱/储物柜里在吃的食材（上部甘特图数据）
//
// foodPantry 每加一条 = 一次入库。吃完/扔了就删掉那条。
// bought 为买入日期 YYYY-MM-DD；days 为预计能放的天数（按下面知识卡填默认值，特殊情况可改）；
// 到期日 = bought + days，前端按“离到期还有几天”自动标红/黄/绿。

export interface PantryShelfGroup {
  cat: string; // 分类（带图标，直接展示）
  items: { name: string; refs: { p: string; t: string }[] }[]; // refs: 存放位置 · 时长
}

export const pantryShelfGroups: PantryShelfGroup[] = [
  {
    cat: '🥩 肉禽海鲜',
    items: [
      { name: '猪 / 牛 / 羊肉', refs: [{ p: '冷藏', t: '1–2 天' }, { p: '冷冻', t: '3–6 个月' }] },
      { name: '鸡 / 鸭肉', refs: [{ p: '冷藏', t: '1–2 天' }, { p: '冷冻', t: '6–12 个月' }] },
      { name: '鲜鱼、虾、贝', refs: [{ p: '冷藏', t: '1–2 天' }, { p: '冷冻', t: '2–3 个月' }] },
      { name: '肉馅、内脏', refs: [{ p: '冷藏', t: '1 天' }, { p: '冷冻', t: '1–3 个月' }] },
    ],
  },
  {
    cat: '🥛 蛋奶豆制',
    items: [
      { name: '鸡蛋', refs: [{ p: '冷藏', t: '3–5 周' }] },
      { name: '巴氏鲜奶 / 酸奶', refs: [{ p: '冷藏', t: '至保质期；开封后 1–3 天' }] },
      { name: '豆腐 / 豆浆 / 鲜豆干', refs: [{ p: '冷藏', t: '2–3 天' }] },
    ],
  },
  {
    cat: '🥬 蔬菜',
    items: [
      { name: '叶菜（菠菜 / 生菜 / 油菜 / 空心菜）', refs: [{ p: '冷藏', t: '2–3 天' }] },
      { name: '菌菇（金针菇 / 香菇）', refs: [{ p: '冷藏', t: '3–5 天' }] },
      { name: '西兰花 / 花菜 / 豆角', refs: [{ p: '冷藏', t: '5–7 天' }] },
      { name: '黄瓜', refs: [{ p: '冷藏', t: '3–5 天' }] },
      { name: '萝卜 / 冬瓜（完整）', refs: [{ p: '阴凉', t: '1–2 周' }, { p: '冷藏（切开）', t: '3–5 天' }] },
    ],
  },
  {
    cat: '🍎 水果',
    items: [
      { name: '浆果（草莓 / 蓝莓）', refs: [{ p: '冷藏', t: '1–3 天' }] },
      { name: '葡萄 / 樱桃', refs: [{ p: '冷藏', t: '3–5 天' }] },
      { name: '苹果 / 梨', refs: [{ p: '冷藏', t: '1–2 周' }] },
      { name: '香蕉 / 芒果', refs: [{ p: '常温', t: '3–7 天（不建议冷藏）' }] },
    ],
  },
  {
    cat: '🫙 干货酱料',
    items: [
      { name: '开封酱料（蚝油 / 沙拉酱）', refs: [{ p: '冷藏', t: '1–3 个月' }] },
      { name: '蜂蜜 / 未开封酱油醋', refs: [{ p: '阴凉', t: '1–2 年' }] },
      { name: '大米 / 面粉', refs: [{ p: '常温', t: '3–6 个月（密封）' }] },
      { name: '干香菇 / 木耳 / 海带', refs: [{ p: '常温', t: '6–12 个月（密封）' }] },
    ],
  },
];

export interface PantryItem {
  name: string; // 食材名
  place: string; // 存放位置：冷藏 / 冷冻 / 常温 / 阴凉
  bought: string; // 买入日期 YYYY-MM-DD
  days: number; // 预计能放的天数（知识卡默认值，特殊情况可改）
  note?: string; // 备注（如「买多了」「一半已冷冻」）
}

// 当前在吃的库存。吃完/扔了就删掉对应条目。
export const foodPantry: PantryItem[] = [
  // 2026-09-07 首批（今天买菜购入）
  { name: '豆角', place: '冷藏', bought: '2026-09-07', days: 6 }, // 参考卡：豆角冷藏 5–7 天
  { name: '空心菜', place: '冷藏', bought: '2026-09-07', days: 2 }, // 空心菜建议 2 天内吃完
  { name: '猕猴桃', place: '冷藏', bought: '2026-09-07', days: 5, note: '按硬质水果冷藏约一周记，观察修正' },
];
