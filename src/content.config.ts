import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const cookingTipsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cooking-tips' }),
  schema: z.object({
    title: z.string(),
    // 分类按「吃法/场合」，新分类需在此补充
    category: z.enum(['主食', '荤菜', '素菜', '汤羹', '小吃夜宵', '酱料蘸料', '烘焙面点', '饮品甜品']),
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
    // 菜系/场所分类（枚举）：新增分类需在此补充
    category: z.enum(['烧烤烤肉', '粉面米线', '特色小吃', '特色火锅', '家常炒菜', '粤菜早茶', '酒吧轻食', '湘菜小炒', '家常便饭', '外卖', '棋牌娱乐']).default(''),
    // 菜品统一为对象数组 {name, note?, price?}
    dishes: z.array(foodDish).default([]),
    // 地址、日期必填（新增店时地址用高德吸附，日期默认当天）
    address: z.string(),
    date: z.string(),
    note: z.string().default(''),
    // 状态必填，3 档：recommend推荐 / no不推荐 / wanna还没去过（原「一般」已并入不推荐，不再靠 note 推断）
    status: z.enum(['recommend', 'no', 'wanna']).default('wanna'),
    lng: z.number().optional(),
    lat: z.number().optional(),
    // 坐标状态默认 pending（待补全），confirmed/unavailable 显式标注
    coordinateStatus: z.enum(['confirmed', 'pending', 'unavailable']).default('pending'),
  }),
});

// 区域/街区评价集合：夜市、商业街等一条街/一个集中区域本身作为可评价对象，独立于具体店铺。
const foodRegion = z.object({
  name: z.string(),
  city: z.string(),
  // 具体场所类型（非菜系）：夜市地摊 / 商业街 等，遇到新的再补充
  category: z.enum(['夜市地摊', '商业街']),
  // 详细地址（必填，用于定位）
  address: z.string(),
  // 评价正文（整体感受、值得去的点、避坑提示等）
  note: z.string(),
  // 状态（必填）：recommend 推荐 / no 不推荐 / wanna 想去（「一般」已并入不推荐）
  status: z.enum(['recommend', 'no', 'wanna']),
  // 10 分制评分（可选）：去过打分；wanna 未去可不填
  score: z.number().min(0).max(10).optional(),
  // 区域中心点坐标（必填）
  lng: z.number(),
  lat: z.number(),
});

const foodRegionsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/food-regions' }),
  schema: foodRegion,
});

// 学习/自习好去处集合：评价维度与餐厅完全不同（插座、适用场景），故独立成集合，
// 但共用「地图」页的视图与筛选；新增其他业态时按同样方式再加一个集合即可。
const studySpotsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/study-spots' }),
  schema: z.object({
    name: z.string(),
    city: z.string(),
    // 片区（可选）：地图上的地区筛选用
    region: z.string().default(''),
    address: z.string(),
    // 插座情况，三选一
    power: z.enum(['插座充足', '仅大桌可插', '插座少']),
    // 适用场景，可多选：打卡 / 商务 / 自习
    scene: z.array(z.enum(['适合打卡', '适合商务', '适合自习'])).default([]),
    // 状态：recommend 推荐 / no 不推荐 / wanna 想去
    status: z.enum(['recommend', 'no', 'wanna']).default('wanna'),
    // 备注：一段话自由评价
    note: z.string().default(''),
    lng: z.number().optional(),
    lat: z.number().optional(),
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
  'food-regions': foodRegionsCollection,
  'study-spots': studySpotsCollection,
  trips: tripsCollection,
  'xian-trips': xianTripsCollection,
  quarrels: quarrelsCollection,
};
