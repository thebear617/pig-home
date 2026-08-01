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
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: [
      { id: 'v2', title: '中科院研究生如何用 AI 把 idea 一步步变成论文', url: 'https://www.bilibili.com/video/BV1LKjS6gEh4/', status: 'todo', note: '预计归 reanotes/literature', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v10', title: '这个 skill，让 AI 做出顶级审美的图表', url: 'https://www.bilibili.com/video/BV14HgY6YEMx/?share_source=copy_web&vd_source=03f4c4c1219f23af84f99d441d39f961', status: 'todo', note: '来源：B站', createdAt: '2026-07-31', date: '2026-07-31' },
      { id: 'v11', title: 'Cloud code 负责人的 1 小时播客，讲述他对 Vibe Coding 的看法', url: 'http://xhslink.cn/o/5mYU5BrF8KZ', status: 'todo', note: '来源：小红书', createdAt: '2026-07-31', date: '2026-07-31' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c7', title: '依据 dash.valorant-api.com API 站点去建立无畏契约的站点', url: 'https://dash.valorant-api.com/endpoints/agents', status: 'todo', date: '2026-07-27', createdAt: '2026-07-27', note: '' }
    ]
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'l1', title: '给宝宝做相册', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l7', title: '处理甲醛 - 把衣柜里的衣服全部拿出来晾晒冲洗', status: 'doing', date: '2026-07-31', createdAt: '2026-07-31', url: '', note: '7/31 起这几天陆续处理' },
      { id: 'l8', title: '带赫兹去博辰复诊', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
    ]
  }
];
