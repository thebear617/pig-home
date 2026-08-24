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
      { id: 'l1', title: '给宝宝做相册（0/80页）', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l8', title: '带赫兹去博辰复诊', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
      { id: 'l17', title: '回去和过马路一起打桌游', status: 'todo', date: '2026-08-25', createdAt: '2026-08-11', url: '', note: '' },
      { id: 'l15', title: '研究京东 PLUS 12 积分如何使用', status: 'todo', date: '2026-08-25', createdAt: '2026-08-08', url: '', note: '京东 PLUS 会员每年有 12 积分，在「我的 → PLUS 专区 → 生活服务包」可兑换家政保洁 / 洗衣洗鞋 / 洗车 / 寄快递 / 在线问诊 / 读书月卡等（保洁 5 分、洗车 3 分、洗衣洗鞋 3 分、寄件 1 分）' },
      { id: 'l31', title: '阿里的 qoder 免费领 800 次千问 3.8 max 调用', status: 'todo', date: '2026-09-03', createdAt: '2026-09-01', url: '', note: '9/3 可免费领，记得选 qoder cn' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c8', title: '研究用家里的台式机作为自己的服务器', status: 'todo', date: '2026-08-25', createdAt: '2026-08-05', url: '', note: '' },
      { id: 'c10', title: '复现 chatnotes', status: 'todo', date: '2026-08-22', createdAt: '2026-08-08', url: 'https://www.bilibili.com/video/BV11mNA6vEJX', note: '顺序学习的时候， 一颗节点树（N 个节点=N 个卡片画布），逆序总结收敛的时候，一篇markdown（N 个悬浮窗=经过内容总结后的 N 个节点）-无限画布去做节点树，就是可以自己任意拖拽组织的（这个能实现吗，感觉聊天对话里不能实现，但每个对话总结好以后就能实现了）' },
      { id: 'c11', title: 'MiniMax 的 2000 积分到期', status: 'todo', date: '2026-11-11', createdAt: '2026-08-12', url: '', note: '到期前用掉，别浪费' },
      { id: 'c12', title: '尝试 codex 原生功能与 skill：browser、computer use、product design、figma、image gen、goal 模式 for UI', status: 'todo', date: '2026-08-22', createdAt: '2026-08-14', url: '', note: '' },
      { id: 'c15', title: '参考 B 站视频美化自己的个人仪表盘，学习他的记笔记方式', status: 'todo', date: '2026-08-22', createdAt: '2026-08-16', url: 'https://www.bilibili.com/video/BV1bkPYzqET3', note: '' },
      { id: 'c16', title: 'idea：平时吵架/演讲前录音，丢给 AI 分析，做成网页接口', status: 'todo', date: '2026-08-22', createdAt: '2026-08-16', url: '', note: '' },
      { id: 'c17', title: '研究 Agent 路由：创建多个 Agent，一个 Agent 负责一个具体任务（如一个 Agent 负责搜索豆瓣上的评分、评论）', status: 'todo', date: '2026-08-22', createdAt: '2026-08-17', url: '', note: '' },
      { id: 'c18', title: '研究如何增强 codex 的生图', status: 'todo', date: '2026-08-22', createdAt: '2026-08-18', url: 'https://github.com/blackdm666/88API-image-gen', note: '' },
      { id: 'c19', title: '参考 B 站视频优化自己的看板视图', status: 'todo', date: '2026-08-22', createdAt: '2026-08-18', url: 'https://www.bilibili.com/video/BV1F2Mw6FExo', note: '' },
      { id: 'c20', title: '了解什么叫 BYOK', status: 'todo', date: '2026-08-23', createdAt: '2026-08-20', url: '', note: '' },
      { id: 'c21', title: '猫猫笔记升级及后台升级', status: 'todo', date: '2026-08-25', createdAt: '2026-08-23', url: '', note: '' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  }
];
