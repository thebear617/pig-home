// 猪窝 · 超市会员日（周期性折扣规则）
// 用途：在「日程和财务」日历上把会员日标出来，点开当天详情能看到完整折扣档。
// 规则变更时改这里即可，日历会自动命中每个月的那一天（不写死具体日期）。
//
// 注意：这里记的是门店挂牌的折扣档（原价 × rate = 实付）。
// 实际单价仍以 food-prices.ts 为准，两者不互相推导。

export interface PromoTier {
  label: string; // 品类名（按门店挂牌写法）
  rate: number; // 折率，0.85 = 8.5 折
}

export interface PromoShop {
  id: string;
  name: string; // 门店名
  day: number; // 每月几号
  tiers: PromoTier[];
  excludes?: string[]; // 明确不参与促销的品类
  note?: string;
  updated: string; // 规则最近确认时间 YYYY-MM
}

export const supermarketPromos: PromoShop[] = [
  {
    id: 'xikelai',
    name: '喜客来生活超市（隆江店）',
    day: 16,
    tiers: [
      { label: '文体玩具', rate: 0.59 },
      { label: '锅碗瓢盆、日用百货', rate: 0.69 },
      { label: '毛巾袜子拖鞋被子', rate: 0.69 },
      { label: '卫生巾湿巾', rate: 0.79 },
      { label: '冻货', rate: 0.85 },
      { label: '散货', rate: 0.85 },
      { label: '面点', rate: 0.85 },
      { label: '豆制品', rate: 0.85 },
      { label: '调料调味品', rate: 0.89 },
    ],
    excludes: ['生鲜肉类'],
    note: '生鲜肉摊不参与（9/16 实测猪前排按原价结算）；小票逐项打印的是折后价，底部「合计」才是折前原价。',
    updated: '2026-09',
  },
];
