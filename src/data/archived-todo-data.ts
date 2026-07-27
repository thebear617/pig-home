import type { TodoBoard } from './todo-data';

/**
 * 已完成任务归档 —— status: 'done' 的条目移到这里，
 * 保持 todo-data.ts 只含 todo / doing 的活跃项。
 *
 * 添加新任务时写 todo-data.ts；任务完成后可移入此文件。
 * 本文件与 todo-data.ts 类型兼容，客户端同时加载两份数据。
 */
export const ARCHIVED_TODO_BOARDS: TodoBoard[] = [
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: [
      { id: 'v1', title: '世界模型：在 AI 里抛硬币，概率是 50% 吗？', url: 'https://b23.tv/1RotOy9', status: 'done', note: '预计归 lifenotes/AI产业', createdAt: '2026-07-18', date: '2026-07-27' },
      { id: 'v3', title: 'GPT-5.6 + image2 三步法输出高质量学术 PPT', url: 'https://www.bilibili.com/video/BV1mgNj6MEuX/', status: 'done', note: '预计归 reanotes/dlproject（产物：devnotes/src/content/prompts/lit-to-ppt.md）', createdAt: '2026-07-18', date: '2026-07-26' },
      { id: 'v4', title: '如何学习AI全栈 - 数据、算法、模型、硬件、架构', url: 'https://github.com/lvy010/AI-wiki', status: 'done', note: '来源：@lvyneko 小红书笔记，含 AI-wiki 思维导图（原科研看板 r2）', createdAt: '2026-07-22', date: '2026-07-26' },
      { id: 'v5', title: '5.9K Star 神器 drawio-skill 版本大升级 更专业 更全面 更优秀', url: 'https://www.bilibili.com/video/BV1bcNZ6xEK3/', status: 'done', note: '预计归 devnotes/提示词库', createdAt: '2026-07-26', date: '2026-07-27' },
      { id: 'v6', title: '从夯到拉锐评中美七大桌面办公AI agent', url: 'https://www.bilibili.com/video/BV15f336QETT/', status: 'done', note: '', createdAt: '2026-07-26', date: '2026-07-27' },
      { id: 'v7', title: '猫乱尿的知识点都给你们咯！- 孙文-猫行为学', url: 'https://www.xiaohongshu.com/discovery/item/6544c3260000000025017af3?source=webshare&xhsshare=pc_web&xsec_token=CB0CMzuCfT2-fiNEBL1BMfUMrEJEnCQxkcgcIM0ESxumY=&xsec_source=pc_share', status: 'done', note: '来源：小红书 @孙文-猫行为学；预计归 lifenotes/猫协', createdAt: '2026-07-27', date: '2026-07-27' }
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c2', title: '删除开发笔记页面的操作系统', status: 'done', date: '2026-07-24', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c3', title: '增加一个新板块，叫做"提示词工程"，专门记录当前 Agent 的一些好的使用案例和好的提示词', status: 'done', date: '2026-07-25', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c4', title: '写一篇博客叫 Vibe Working——how to make a PPT', status: 'done', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '产物：devnotes/src/content/prompts/lit-to-ppt.md' },
      { id: 'c5', title: 'design a site: Valorant', status: 'done', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '' },
      { id: 'c6', title: '写一篇博客叫 Vibe Working——how to make a picture', status: 'done', date: '2026-07-27', createdAt: '2026-07-26', url: '', note: '' }
    ]
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'l2', title: '小猫赫兹-博辰看牙', status: 'done', date: '2026-07-24', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l3', title: '约会安排', status: 'done', date: '2026-07-20', createdAt: '2026-07-20', url: '', note: '' },
      { id: 'l4', title: '把床板搬走', status: 'done', date: '2026-07-24', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'l5', title: '7 月 26 日回学校放游泳装备、拿电脑、拿身份证、收拾宿舍', status: 'done', date: '2026-07-25', createdAt: '2026-07-24', url: '', note: '提前 7/25 完成' },
      { id: 'l6', title: '带行李箱回去学校把衣服收拾好，把泳衣泳帽拿回去', status: 'done', date: '2026-07-26', createdAt: '2026-07-25', url: '', note: '' }
    ]
  }
];
