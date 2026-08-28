export interface HomeEvent {
  date: string;
  type: '添置' | '搬走' | '更换' | '维修' | '其他';
  title: string;
  note?: string;
  image?: string;
}

// 家居发生变化时，在这里追加一条记录，按日期倒序展示。
export const homeEvents: HomeEvent[] = [
  {
    date: '2026-07-23',
    type: '添置',
    title: '消毒柜',
    note: '用上了，很好用',
    image: 'images/home/2026-07-23-disinfection-cabinet.jpg',
  },
  {
    date: '2026-07-24',
    type: '搬走',
    title: '床板',
    note: '把床板搬走',
    image: 'images/home/2026-07-24-bed-board-moved.jpg',
  },
  {
    date: '2026-08-27',
    type: '添置',
    title: '饼饼鼠入住新家',
    note: '给饼饼鼠装窝以及装滚轮，饼饼鼠入住',
    image: 'images/home/2026-08-27-bingbing-cage.jpg',
  },
];
