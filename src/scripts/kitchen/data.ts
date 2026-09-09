// 厨房工作台 · 客户端数据入口：统一消费 window.__kitchenData（构建期注入）

import type { KitchenPayload, RecipeData } from '../../lib/kitchen-types';

declare global {
  interface Window {
    __kitchenData?: KitchenPayload;
  }
}

const EMPTY: KitchenPayload = {
  foodRecords: {},
  recipes: [],
  categoryOrder: [],
  pantry: [],
  shelfGroups: [],
  priceCategories: [],
  prices: [],
};

export function payload(): KitchenPayload {
  return window.__kitchenData ?? EMPTY;
}

/** 把某道菜名匹配到菜谱：优先全名匹配，其次「菜品文字里包含整个菜谱标题」 */
export function findRecipeForDish(dishName: string, recipes: RecipeData[]): RecipeData | null {
  const name = String(dishName ?? '').trim();
  if (!name) return null;
  let best: RecipeData | null = null;
  for (const r of recipes) {
    if (r.title === name) return r;
    if (name.includes(r.title) && r.title.length > (best ? best.title.length : 0)) best = r;
  }
  return best;
}
