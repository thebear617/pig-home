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
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c2', title: '删除开发笔记页面的操作系统', status: 'done', date: '2026-07-24', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c3', title: '增加一个新板块，叫做"提示词工程"，专门记录当前 Agent 的一些好的使用案例和好的提示词', status: 'done', date: '2026-07-25', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c4', title: '写一篇博客叫 Vibe Working——how to make a PPT', status: 'done', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '产物：devnotes/src/content/prompts/lit-to-ppt.md' },
      { id: 'c5', title: 'design a site: Valorant', status: 'done', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '' },
      { id: 'c6', title: '写一篇博客叫 Vibe Working——how to make a picture', status: 'done', date: '2026-07-27', createdAt: '2026-07-26', url: '', note: '' },
      { id: 'c7', title: '依据 dash.valorant-api.com API 站点去建立无畏契约的站点', url: 'https://dash.valorant-api.com/endpoints/agents', status: 'done', date: '2026-08-02', createdAt: '2026-07-27', note: '' }
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
      { id: 'r1', title: '做好端到端的 pdf2html 的 skill', status: 'done', date: '2026-08-01', createdAt: '2026-07-19', url: '', note: 'pdf2blog-zh skill 开发完成；产物：reanotes v0.7.0（b248924 02:49 feat + 237baff 02:49 docs）' },
      { id: 'r2', title: '录制 IGrass 12 分钟 oral 视频', status: 'done', date: '2026-08-06', createdAt: '2026-08-05', url: '', note: '8/6 20:30-22:30 录制完成' },
      { id: 'v10', title: '这个 skill，让 AI 做出顶级审美的图表', url: 'https://www.bilibili.com/video/BV14HgY6YEMx/?share_source=copy_web&vd_source=03f4c4c1219f23af84f99d441d39f961', status: 'done', note: '来源：B站；已完成 8/6', createdAt: '2026-07-31', date: '2026-08-06' }
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
      { id: 'l6', title: '带行李箱回去学校把衣服收拾好，把泳衣泳帽拿回去', status: 'done', date: '2026-07-26', createdAt: '2026-07-25', url: '', note: '' },
      { id: 'l7', title: '处理甲醛 - 把衣柜里的衣服全部拿出来晾晒冲洗', status: 'done', date: '2026-08-02', createdAt: '2026-07-31', url: '', note: '活性炭 + 晾晒冲洗全流程完成' }
    ]
  }
];
