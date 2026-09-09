// 厨房工作台 · 单日做菜记录聚合（日历 hover 与日期详情共用）

import { payload } from './data';
import { parseMin } from './ui';
import type { DishBrief, MealData } from '../../lib/kitchen-types';

export interface DayData {
  meals: MealData[];
  cost: number | null;
  min: number;
  dishCount: number;
}

export function dateHasRecords(key: string): boolean {
  return Boolean(payload().foodRecords[key]?.length);
}

export function dayData(key: string): DayData {
  const meals = payload().foodRecords[key] || [];
  let cost: number | null = 0;
  let min = 0;
  let dishCount = 0;
  for (const meal of meals) {
    const dishes = meal.dishes || [];
    const obj = dishes.length > 0 && typeof dishes[0] === 'object';
    const mealCost = meal.cost ?? (obj ? dishes.reduce((s, d: any) => s + (Number(d.cost) || 0), 0) : null);
    if (mealCost == null) cost = null;
    else if (cost != null) cost += mealCost;
    min += parseMin(meal.prep) + parseMin(meal.shopping) + parseMin(meal.cleanup);
    dishCount += dishes.length;
  }
  return { meals, cost, min, dishCount };
}

export function dishName(d: string | DishBrief): string {
  return typeof d === 'object' ? d.name : d;
}

/** 把原始餐次标签归类到早/中/晚/宵（不改数据本身，仅用于分组排布） */
export function mealGroup(mealLabel: string): number {
  const label = mealLabel || '';
  if (label.includes('早')) return 0;
  if (label.includes('中') || label.includes('午')) return 1;
  if (label.includes('晚')) return 2;
  if (label.includes('宵')) return 3;
  return 4;
}

export const MEAL_GROUP_TITLES = ['早餐', '午餐', '晚餐', '夜宵', '加餐'];

/** 按 早/午/晚/宵 顺序返回某天的用餐分组 */
export function groupedMeals(key: string): { label: string; meals: MealData[] }[] {
  const groups: MealData[][] = Array.from({ length: 5 }, () => []);
  for (const meal of dayData(key).meals) {
    groups[mealGroup(meal.meal)].push(meal);
  }
  return groups
    .map((meals, i) => ({ label: MEAL_GROUP_TITLES[i], meals }))
    .filter(g => g.meals.length > 0);
}
