export interface Tab {
  id: string;
  title: string;
  icon: string;
  months?: boolean; // has month navigation
}

export const TABS: Tab[] = [
  { id: 'follow-up', title: '生活备忘录与物资采购', icon: '📋' },
  { id: 'food-records', title: '美食记录与做饭心得', icon: '🍳', months: true },
  { id: 'utility-tracking', title: '水电追踪', icon: '⚡', months: true },
  { id: 'daily-tracker', title: '每日追踪', icon: '📅', months: true },
  { id: 'expense-records', title: '支出记录', icon: '💰', months: true },
  { id: 'food-map', title: '美食地图', icon: '🗺️' },
  { id: 'relationship-timeline', title: '关系时间线', icon: '💞' },
  { id: 'home-map', title: '猪窝地图', icon: '🏠' },
];

export const DEFAULT_TAB = 'relationship-timeline';
