export interface HemaRecord {
  bought: string;
  nextPlan: string;
}

export const hemaDayRecords: Record<string, HemaRecord> = {
  '2026-07-13': {
    bought: '盒马特产小酒：梅子威士忌；计划在家网购绝对伏特加（网购比盒马八八折后还便宜）',
    nextPlan: '基酒：百加得白朗姆；再试一款别的盒马特产饮品；换掉 22.8 元 9°啤酒，改喝盒马好啤酒；青芒话梅啤酒味道还可以（可复购）；梅子威士忌配雪碧也好喝（喝法备注）'
  },
  '2026-07-20': {
    bought: '柠檬大口茶、美人茶、紫苏话梅啤酒、大芒果、小番茄、凉菜、锅贴🥟、香水柠檬蛋糕🎂',
    nextPlan: '这周尝紫苏话梅啤酒和柠檬大口茶；下周不买了（要回家）'
  }
};
