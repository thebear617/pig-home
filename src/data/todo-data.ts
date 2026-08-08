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
      { id: 'l1', title: '给宝宝做相册：先选一部分素材，敲定好页数、买好本子和水彩笔', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l8', title: '带赫兹去博辰复诊', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
      { id: 'l9', title: '晾晒活性炭', status: 'todo', date: '2026-09-02', createdAt: '2026-08-03', url: '', note: '甲醛处理后续：活性炭需定期晾晒保持吸附能力' },
      { id: 'l10', title: '去民主路看牙', status: 'todo', date: '2026-08-11', createdAt: '2026-08-05', url: '', note: '下午 13:00' },
      { id: 'l11', title: '购买不锈钢碗、大菜篮子、检查燃气热水器 CO', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '3 件事：① 买不锈钢碗 ② 买大菜篮子 ③ 检查燃气热水器一氧化碳问题' },
      { id: 'l12', title: '让大贝果去取赫兹的猫粮', status: 'todo', date: '2026-08-09', createdAt: '2026-08-06', url: '', note: '代取猫粮' },
      { id: 'l13', title: '逛南宁夜市：水街、百货大楼、步行街、建政路、朗西、平西、西关、中山、南铁', status: 'todo', date: '2026-08-10', createdAt: '2026-08-08', url: '', note: '6 条夜市街一次性逛' },
      { id: 'l14', title: '8 月 9 号下午 3 点开大组会：Camouflage-aware Image-Text Retrieval via Expert Collaboration', status: 'todo', date: '2026-08-09', createdAt: '2026-08-08', url: '', note: '下午 3 点' },
      { id: 'l15', title: '研究京东 PLUS 12 积分如何使用', status: 'todo', date: '2026-08-25', createdAt: '2026-08-08', url: '', note: '京东 PLUS 会员每年有 12 积分，在「我的 → PLUS 专区 → 生活服务包」可兑换家政保洁 / 洗衣洗鞋 / 洗车 / 寄快递 / 在线问诊 / 读书月卡等（保洁 5 分、洗车 3 分、洗衣洗鞋 3 分、寄件 1 分）' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c8', title: '研究用家里的台式机作为自己的服务器', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '' },
      { id: 'c9', title: '研究浏览器的连接器具体有哪几种', status: 'todo', date: '2026-08-10', createdAt: '2026-08-08', url: '', note: '参考 devnotes「学习资源：开发资源合集」里的四款浏览器连接器对比（Cua Driver / ego / Kimi WebBridge 等）' },
      { id: 'c10', title: '仔细去研究这个项目，并且尝试去复现这个项目', status: 'todo', date: '2026-08-10', createdAt: '2026-08-08', url: 'https://www.bilibili.com/video/BV11mNA6vEJX', note: 'B 站视频项目复现' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  }
];
