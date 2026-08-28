export interface Tab {
  id: string;
  title: string;
  icon: string;
  months?: boolean; // has month navigation
}

export const TABS: Tab[] = [
  { id: 'home-archive', title: '家居档案', icon: '🏠' },
  { id: 'food-records', title: '美食记录与做饭心得', icon: '🍳', months: true },
  { id: 'daily-tracker', title: '每日追踪', icon: '📅', months: true },
  { id: 'expense-records', title: '收支记录', icon: '💰', months: true },
  { id: 'membership', title: '会员订阅', icon: '💳' },
  { id: 'food-map', title: '美食地图', icon: '🗺️' },
  { id: 'relationship-timeline', title: '关系时间线', icon: '💞' },
  { id: 'couple-album', title: '情侣相册', icon: '📸' },
];

export const DEFAULT_TAB = 'daily-tracker';
