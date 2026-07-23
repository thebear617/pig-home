import { defineCollection, z } from 'astro:content';

const cookingTipsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    icon: z.string(),
    ware: z.string().optional(),
  }),
});

const memosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    region: z.string(),
    icon: z.string(),
    order: z.number().default(0),
  }),
});

const procurementCollection = defineCollection({
  type: 'content',
  schema: z.object({
    region: z.string(),
    icon: z.string(),
    note: z.string().optional(),
    order: z.number().default(0),
  }),
});

const foodPlacesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    dishes: z.array(z.string()).default([]),
    area: z.string(),
    location: z.string(),
    date: z.string().default(''),
    note: z.string().default(''),
  }),
});

const tripsCollection = defineCollection({
  type: 'content',
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
  type: 'content',
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
  type: 'content',
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
