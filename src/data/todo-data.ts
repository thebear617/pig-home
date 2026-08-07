export interface TodoItem {
  id: string;
  title: string;
  url?: string;
  status: 'todo' | 'doing' | 'done';
  note?: string;
  createdAt?: string;
  date?: string;
}

export interface TodoBoard {
  id: string;
  name: string;
  icon: string;
  items: TodoItem[];
}

export const TODO_BOARDS: TodoBoard[] = [
  {
    id: 'summary',
    name: '汇总',
    icon: '📊',
    items: []
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'l1', title: '给宝宝做相册', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l8', title: '带赫兹去博辰复诊', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
      { id: 'l9', title: '晾晒活性炭', status: 'todo', date: '2026-09-02', createdAt: '2026-08-03', url: '', note: '甲醛处理后续：活性炭需定期晾晒保持吸附能力' },
      { id: 'l10', title: '去民主路看牙', status: 'todo', date: '2026-08-11', createdAt: '2026-08-05', url: '', note: '下午 13:00' },
      { id: 'l11', title: '购买不锈钢碗、大菜篮子、检查燃气热水器 CO', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '3 件事：① 买不锈钢碗 ② 买大菜篮子 ③ 检查燃气热水器一氧化碳问题' },
      { id: 'l12', title: '让大贝果去取赫兹的猫粮', status: 'todo', date: '2026-08-09', createdAt: '2026-08-06', url: '', note: '代取猫粮' },
      { id: 'l13', title: '逛南宁夜市：建政路、朗西、平西、西关、中山、南铁', status: 'todo', date: '2026-08-10', createdAt: '2026-08-08', url: '', note: '6 条夜市街一次性逛' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c8', title: '研究用家里的台式机作为自己的服务器', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '' },
      { id: 'c10', title: '进行「猪窝的美食地图」的升级 + 整理南宁美食', status: 'todo', date: '2026-08-07', createdAt: '2026-08-05', url: '', note: '两件事合并：① 美食地图升级 ② 整理南宁美食（刚回南宁，把当地吃的店补进地图）' }
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  }
];
