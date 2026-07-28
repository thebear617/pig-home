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
      { id: 'v8', title: '常见食材保存时间', url: 'https://www.xiaohongshu.com/discovery/item/6a40c4d1000000001700a5f0?source=webshare&xhsshare=pc_web&xsec_token=ABfByeG9HdtqXyQZ__cmspiXjK4rv6qCQrhOMux0milD4=&xsec_source=pc_share', status: 'todo', note: '来源：小红书；预计归 lifenotes/居家生活', createdAt: '2026-07-28', date: '2026-07-28' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
      { id: 'r1', title: '做好端到端的 pdf2html 的 skill', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' }
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
    ]
  }
];
