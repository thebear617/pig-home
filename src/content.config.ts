import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const cookingTipsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cooking-tips' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    icon: z.string(),
    ware: z.string().optional(),
  }),
});

const memosCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/memos' }),
  schema: z.object({
    region: z.string(),
    icon: z.string().default(''),
    category: z.string(),
    order: z.number().default(0),
  }),
});

const procurementCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/procurement' }),
  schema: z.object({
    region: z.string(),
    icon: z.string().default(''),
    category: z.string(),
    note: z.string().optional(),
    order: z.number().default(0),
  }),
});

const foodDish = z.object({
  name: z.string(),
  note: z.string().default(''),
  price: z.string().default(''),
});

const foodPlacesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/food-places' }),
  schema: z.object({
    name: z.string(),
    city: z.string(),
    region: z.string(),
    category: z.string().default(''),
    // 菜品统一为对象数组 {name, note?, price?}
    dishes: z.array(foodDish).default([]),
    // 地址、日期必填（新增店时地址用高德吸附，日期默认当天）
    address: z.string(),
    date: z.string(),
    note: z.string().default(''),
    // 状态必填，4 档：recommend推荐 / tried一般 / no不推荐 / wanna还没去吃过（不再靠 note 推断）
    status: z.enum(['recommend', 'tried', 'no', 'wanna']).default('wanna'),
    lng: z.number().optional(),
    lat: z.number().optional(),
    // 坐标状态默认 pending（待补全），confirmed/unavailable 显式标注
    coordinateStatus: z.enum(['confirmed', 'pending', 'unavailable']).default('pending'),
  }),
});

const tripsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/trips' }),
  schema: z.object({
    dest: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['completed', 'upcoming']),
    travelers: z.array(z.string()),
    transport: z.string(),
  }),
});

const xianTripsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/xian-trips' }),
  schema: z.object({
    dest: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['completed', 'upcoming']),
    travelers: z.array(z.string()),
    transport: z.string(),
  }),
});

const quarrelsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/quarrels' }),
  schema: z.object({
    date: z.string(),
    title: z.string(),
    severity: z.string(),
    participants: z.array(z.string()),
    trigger: z.string().default(''),
    myView: z.string().default(''),
    theirView: z.string().default(''),
    rootCause: z.string().default(''),
    resolution: z.string().default(''),
    lesson: z.string().default(''),
    timeRange: z.string().optional(),
  }),
});

export const collections = {
  'cooking-tips': cookingTipsCollection,
  memos: memosCollection,
  procurement: procurementCollection,
  'food-places': foodPlacesCollection,
  trips: tripsCollection,
  'xian-trips': xianTripsCollection,
  quarrels: quarrelsCollection,
};
