export interface Tab {
  id: string;
  title: string;
  icon: string;
  months?: boolean; // has month navigation
}

export const TABS: Tab[] = [
  { id: 'home-archive', title: '家居档案', icon: '🏠' },
  { id: 'food-records', title: '厨房工作台', icon: '🍳', months: true },
  { id: 'schedule-finance', title: '日程和财务', icon: '📅', months: true },
  { id: 'food-map', title: '美食地图', icon: '🗺️' },
  { id: 'relationship-timeline', title: '关系时间线', icon: '💞' },
  { id: 'couple-album', title: '情侣相册', icon: '📸' },
];

export const DEFAULT_TAB = 'schedule-finance';

/** 「日程和财务」聚合页的视图配置（顺序即切换条顺序） */
export const SCHEDULE_FINANCE_VIEWS = [
  { id: 'daily-tracker', icon: '📅', label: '每日追踪', title: '每日追踪 · 猪窝' },
  { id: 'expense-records', icon: '💰', label: '收支记录', title: '收支记录 · 猪窝' },
  { id: 'membership', icon: '💳', label: '会员订阅', title: '会员订阅 · 猪窝' },
] as const;

export const DEFAULT_SCHEDULE_FINANCE_VIEW = 'daily-tracker';
