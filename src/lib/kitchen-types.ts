// 厨房工作台 · 共享类型（服务端构造 payload、客户端消费，二者共用）
// 注意：这些接口是「现有真实数据」的镜像，不新增任何数据含义。

export interface DishBrief {
  name: string;
  madeBy?: string;
  cost?: number;
  note?: string;
}

export interface MealData {
  meal: string;
  dishes: (string | DishBrief)[];
  cost?: number;
  chef?: string;
  helper?: string;
  shopping?: number | string;
  prep?: number | string;
  cleanup?: number | string;
  image?: string;
}

export type FoodRecordMap = Record<string, MealData[]>;

export type RecipeBlock =
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'p'; text: string };

export interface RecipeSection {
  title: string;
  blocks: RecipeBlock[];
}

export interface RecipeData {
  id: string;
  title: string;
  category: string;
  icon: string;
  ware?: string;
  sections: RecipeSection[];
}

export interface PantryItemData {
  name: string;
  place: string;
  bought: string;
  days: number;
  note?: string;
}

export interface ShelfRefData {
  p: string;
  t: string;
}

export interface ShelfGroupData {
  cat: string;
  items: { name: string; refs: ShelfRefData[] }[];
}

export interface PriceItemData {
  category: string;
  name: string;
  spec?: string;
  price?: string;
  source?: string;
  updated?: string;
  note?: string;
}

export interface KitchenPayload {
  foodRecords: FoodRecordMap;
  recipes: RecipeData[];
  categoryOrder: string[];
  pantry: PantryItemData[];
  shelfGroups: ShelfGroupData[];
  priceCategories: string[];
  prices: PriceItemData[];
}
