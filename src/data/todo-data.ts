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
      { id: 'v1', title: '世界模型：在 AI 里抛硬币，概率是 50% 吗？', url: 'https://b23.tv/1RotOy9', status: 'todo', note: '预计归 lifenotes/AI产业', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v2', title: '中科院研究生如何用 AI 把 idea 一步步变成论文', url: 'https://www.bilibili.com/video/BV1LKjS6gEh4/', status: 'todo', note: '预计归 reanotes/literature', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v3', title: 'GPT-5.6 + image2 三步法输出高质量学术 PPT', url: 'https://www.bilibili.com/video/BV1mgNj6MEuX/', status: 'todo', note: '预计归 reanotes/dlproject', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v4', title: '如何学习AI全栈 - 数据、算法、模型、硬件、架构', url: 'https://github.com/lvy010/AI-wiki', status: 'todo', note: '来源：@lvyneko 小红书笔记，含 AI-wiki 思维导图（原科研看板 r2）', createdAt: '2026-07-22', date: '2026-07-22' }
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
      { id: 'c2', title: '删除开发笔记页面的操作系统', status: 'done', date: '2026-07-24', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c3', title: '增加一个新板块，叫做"提示词工程"，专门记录当前 Agent 的一些好的使用案例和好的提示词', status: 'done', date: '2026-07-25', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c4', title: '写一篇博客叫 Vibe Working——how to make a PPT', status: 'todo', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '' },
      { id: 'c5', title: 'design a site: Valorant', status: 'todo', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '' },
      { id: 'c6', title: '写一篇博客叫 Vibe Working——how to make a picture', status: 'todo', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '' }
    ]
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'l1', title: '给宝宝做相册', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l2', title: '小猫赫兹-博辰看牙', status: 'done', date: '2026-07-24', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l3', title: '约会安排', status: 'done', date: '2026-07-20', createdAt: '2026-07-20', url: '', note: '' },
      { id: 'l4', title: '把床板搬走', status: 'done', date: '2026-07-24', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'l5', title: '7 月 26 日回学校放游泳装备、拿电脑、拿身份证、收拾宿舍', status: 'done', date: '2026-07-25', createdAt: '2026-07-24', url: '', note: '提前 7/25 完成' },
      { id: 'l6', title: '带行李箱回去学校把衣服收拾好，把泳衣泳帽拿回去', status: 'done', date: '2026-07-26', createdAt: '2026-07-25', url: '', note: '' }
    ]
  }
];
