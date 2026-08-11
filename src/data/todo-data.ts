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
      { id: 'l19', title: '参加27届求职面试通关指南腾讯会议', status: 'todo', date: '2026-08-12', createdAt: '2026-08-12', url: '', note: '15:00 腾讯会议，会议号 216543013' },
      { id: 'l8', title: '带赫兹去博辰复诊', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
      { id: 'l9', title: '晾晒活性炭', status: 'todo', date: '2026-09-02', createdAt: '2026-08-03', url: '', note: '甲醛处理后续：活性炭需定期晾晒保持吸附能力' },
      { id: 'l16', title: '继续去民主路补牙', status: 'todo', date: '2026-08-19', createdAt: '2026-08-11', url: '', note: '补第 4 颗牙' },
      { id: 'l18', title: '去九木杂志社购买水豚噜噜盲盒，带回去给过马路', status: 'todo', date: '2026-08-19', createdAt: '2026-08-12', url: '', note: '大概 20 元' },
      { id: 'l17', title: '回去和过马路一起打桌游', status: 'todo', date: '2026-08-25', createdAt: '2026-08-11', url: '', note: '' },
      { id: 'l11', title: '购买不锈钢碗、大菜篮子、检查燃气热水器 CO', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '3 件事：① 买不锈钢碗 ② 买大菜篮子 ③ 检查燃气热水器一氧化碳问题' },
      { id: 'l13', title: '逛南宁夜市：水街、百货大楼、步行街、建政路、朗西、平西、西关、中山、南铁', status: 'todo', date: '2026-08-10', createdAt: '2026-08-08', url: '', note: '6 条夜市街一次性逛' },
      { id: 'l15', title: '研究京东 PLUS 12 积分如何使用', status: 'todo', date: '2026-08-25', createdAt: '2026-08-08', url: '', note: '京东 PLUS 会员每年有 12 积分，在「我的 → PLUS 专区 → 生活服务包」可兑换家政保洁 / 洗衣洗鞋 / 洗车 / 寄快递 / 在线问诊 / 读书月卡等（保洁 5 分、洗车 3 分、洗衣洗鞋 3 分、寄件 1 分）' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c8', title: '研究用家里的台式机作为自己的服务器', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '' },
      { id: 'c9', title: '研究浏览器的连接器具体有哪几种', status: 'doing', date: '2026-08-10', createdAt: '2026-08-08', url: '', note: '参考 devnotes「学习资源：开发资源合集」里的四款浏览器连接器对比（Cua Driver / ego / Kimi WebBridge 等）' },
      { id: 'c10', title: '仔细去研究这个项目，并且尝试去复现这个项目', status: 'doing', date: '2026-08-10', createdAt: '2026-08-08', url: 'https://www.bilibili.com/video/BV11mNA6vEJX', note: 'B 站视频项目复现' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  }
];
