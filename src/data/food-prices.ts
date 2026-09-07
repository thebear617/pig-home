// 猪窝厨房工作台 · 价格速查
// 日常买菜单价速查库：买菜时留意单价，往 foodPrices 里加一条即可。
// 分类请使用 FOOD_PRICE_CATEGORIES 已有的值；出现全新品类时先同步加进分类清单。

export interface FoodPriceItem {
  category: string; // 分类（见 FOOD_PRICE_CATEGORIES）
  name: string; // 品名
  spec?: string; // 规格/单位，如「500g」「一板」「一斤」
  price?: string; // 参考价，如「6-8 元」
  source?: string; // 哪买的 / 哪看的价
  updated?: string; // 最近更新时间 YYYY-MM-DD
  note?: string; // 备注（如「临期便宜 / 比某超市贵」）
}

export const FOOD_PRICE_CATEGORIES = [
  '蔬菜',
  '肉禽蛋',
  '水产',
  '主食豆制品',
  '调料干货',
  '水果',
  '冷冻速食',
  '饮品零食',
];

// 初始为空：等日常买菜时把真实单价记进来
export const foodPrices: FoodPriceItem[] = [
  // ── 2026-09-07 首批（耙耙柑口述）──
  { category: '肉禽蛋', name: '五花肉', spec: '一斤', price: '16.9 元', updated: '2026-09-07' },
  { category: '蔬菜', name: '黄瓜', spec: '3 根一卖', price: '6 元', updated: '2026-09-07', note: '最多 3 根一起卖' },
  { category: '肉禽蛋', name: '精瘦肉', spec: '一餐的量', price: '5–6 元', updated: '2026-09-07', note: '一斤单价还没记住；一餐够做鱼香肉丝或青椒肉丝' },
];
