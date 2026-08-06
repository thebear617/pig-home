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
      { id: 'r2', title: '录制 IGrass 12 分钟 oral 视频', status: 'todo', date: '2026-08-06', createdAt: '2026-08-05', url: '', note: '' }
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c8', title: '研究用家里的台式机作为自己的服务器', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '' },
      { id: 'c9', title: '个人仪表盘-逻辑继续完善，加入番茄钟插件联动逻辑', status: 'todo', date: '2026-08-06', createdAt: '2026-08-05', url: '', note: '个人仪表盘 v0.18.0 后续：番茄钟 + 仪表盘数据联动' },
      { id: 'c10', title: '进行「猪窝的美食地图」的升级 + 整理南宁美食', status: 'todo', date: '2026-08-07', createdAt: '2026-08-05', url: '', note: '两件事合并：① 美食地图升级 ② 整理南宁美食（刚回南宁，把当地吃的店补进地图）' },
      { id: 'c11', title: '把之前的视频转录 skill 升级为端到端的 video2image skill', status: 'todo', date: '2026-08-08', createdAt: '2026-08-06', url: '', note: '具体思路参考 8 月 6 号随想中的视频字幕图像 pipeline' }
    ]
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
    ]
  }
];
