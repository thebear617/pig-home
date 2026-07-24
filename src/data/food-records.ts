export interface FoodDish {
  name: string;
  madeBy: string;
  cost?: number;
  note?: string;
}

export interface FoodMeal {
  meal: string;
  dishes: (string | FoodDish)[];
  cost?: number;
  chef?: string;
  helper?: string;
  prep?: number | string;
  cleanup?: number | string;
  image?: string;
}

export const foodRecords: Record<string, FoodMeal[]> = {
  '2026-06-29': [
    { meal: '中饭', dishes: ['凉拌西兰花和萝卜（3元）', '可乐鸡翅（28元）'], cost: 31, chef: '过马路', helper: '耙耙柑' }
  ],
  '2026-06-30': [
    { meal: '中饭', dishes: ['油泼辣子蘸香菇猪肉水饺（10元）'], cost: 10, chef: '过马路' }
  ],
  '2026-07-02': [
    { meal: '中饭', dishes: ['猪肉大葱水饺（10元）', '咖喱洋葱胡萝卜土豆拌米饭（11.5元）'], cost: 21.5, chef: '过马路' }
  ],
  '2026-07-07': [
    { meal: '中饭', dishes: ['泡面（2元）'], cost: 2, chef: '耙耙柑' }
  ],
  '2026-07-09': [
    { meal: '中饭', dishes: ['青椒土豆丝（1.5元）', '红油凉皮（2元）', '火腿肠泡面（4.5元）'], cost: 8, chef: '过马路', helper: '耙耙柑' },
    { meal: '晚饭', dishes: ['油泼辣子韭菜鸡蛋水饺（10元）'], cost: 10, chef: '耙耙柑', helper: '过马路' }
  ],
  '2026-07-10': [
    { meal: '中饭', dishes: ['番茄酸菜肉丝米线'], cost: 18, chef: '过马路', helper: '耙耙柑' }
  ],
  '2026-07-11': [
    { meal: '中饭', dishes: ['芦笋番茄黑椒牛排和鸡翅'], cost: 10, chef: '过马路', helper: '耙耙柑', cleanup: 20 },
    { meal: '晚饭', prep: '30-40', cleanup: 20, dishes: [
      { name: '白灼香螺', madeBy: '耙耙柑', cost: 1, note: '葱蒜姜、小米辣（与牛排共享 1 元）' },
      { name: '黑胡椒迷迭香牛排', madeBy: '耙耙柑', cost: 1, note: '葱蒜姜、小米辣（与香螺共享 1 元）' },
      { name: '羊角菜肉沫汤', madeBy: '过马路', cost: 1, note: '肉沫' }
    ]}
  ],
  '2026-07-12': [
    { meal: '夜宵', prep: 10, cleanup: 10, dishes: [{ name: '螺狮粉牛肉丸', madeBy: '过马路', cost: 13, note: '一起吃' }] },
    { meal: '中饭', prep: 10, cleanup: 10, dishes: [{ name: '蛋炒饭', madeBy: '耙耙柑', cost: 2, note: '葱、鸡蛋两个、火腿肠，剩饭半个拉面碗、生抽、盐和味精' }] },
    { meal: '晚饭', prep: 15, cleanup: 5, dishes: [
      { name: '水煮玉米', madeBy: '耙耙柑', cost: 2 },
      { name: '红油凉皮', madeBy: '耙耙柑', cost: 4 },
      { name: '红豆红枣花生红糖汤', madeBy: '耙耙柑', cost: 5 }
    ]}
  ],
  '2026-07-13': [
    { meal: '中饭', prep: 0, cleanup: 10, dishes: [{ name: '猪肉大葱水饺', madeBy: '耙耙柑', cost: 10, note: '猪肉大葱口味' }] }
  ],
  '2026-07-14': [
    { meal: '中饭', prep: 5, cleanup: 15, dishes: [{ name: '酸汤面', madeBy: '过马路', cost: 5, note: '' }] },
    { meal: '晚饭', prep: 15, cleanup: 20, dishes: [
      { name: '西红柿鸡蛋油泼面', madeBy: '过马路', cost: 5 },
      { name: '紫菜虾米羊角菜汤', madeBy: '过马路' },
      { name: '白灼香螺', madeBy: '耙耙柑' },
      { name: '黑胡椒黄油牛排', madeBy: '耙耙柑' }
    ]}
  ],
  '2026-07-15': [
    { meal: '晚饭', prep: 20, cleanup: 20, dishes: [
      { name: '玉米排骨汤', madeBy: '过马路', cost: 18 },
      { name: '青椒炒肉', madeBy: '耙耙柑', cost: 8 },
      { name: '青菜面条', madeBy: '耙耙柑', cost: 4 }
    ]}
  ],
  '2026-07-16': [
    { meal: '中饭', prep: 5, cleanup: 5, dishes: [{ name: '猪肉香菇水饺', madeBy: '过马路', cost: 10 }] },
    { meal: '晚饭', prep: 10, cleanup: 10, dishes: [{ name: '煲仔饭', madeBy: '过马路' }] }
  ],
  '2026-07-18': [
    { meal: '中饭', prep: 0, cleanup: 2, dishes: [{ name: '汤达人泡面', madeBy: '耙耙柑', cost: 2 }] }
  ],
  '2026-07-21': [
    { meal: '中饭', prep: 0, cleanup: 5, dishes: [{ name: '汤达人泡面', madeBy: '耙耙柑', cost: 4 }] }
  ],
  '2026-07-22': [
    { meal: '中饭', prep: 0, cleanup: 10, dishes: [{ name: '饺子', madeBy: '耙耙柑', cost: 8 }, { name: '煎牛排', madeBy: '过马路', cost: 0 }] }
  ],
  '2026-07-23': [
    { meal: '中饭', prep: 0, cleanup: 5, dishes: [{ name: '酸汤面', madeBy: '过马路', cost: 0 }, { name: '牛排', madeBy: '过马路', cost: 0 }, { name: '煎蛋', madeBy: '过马路', cost: 0 }] },
    { meal: '晚饭', image: 'images/food/2026-07-23-dinner.jpg', prep: 10, cleanup: 25, dishes: [
      { name: '腊肠炒肉', madeBy: '过马路', cost: 4 },
      { name: '番茄炒蛋', madeBy: '过马路', cost: 2 }
    ]}
  ],
  '2026-07-24': [
    { meal: '夜宵', image: 'images/food/2026-07-24-yexiao.jpg', prep: 5, cleanup: 10, dishes: [
      { name: '汤达人泡面', madeBy: '耙耙柑', cost: 0 },
      { name: '牛排', madeBy: '耙耙柑', cost: 0 },
      { name: '鱿鱼', madeBy: '过马路', cost: 0 }
    ]},
    { meal: '中饭', prep: 5, cleanup: 5, dishes: [
      { name: '蛋炒饭', madeBy: '耙耙柑', cost: 3 }
    ]}
  ]
};
