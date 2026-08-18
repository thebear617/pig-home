/**
 * 情侣相册 · 时间线（翻页版）
 * 一本可以「翻页」的纸质相册：一个对开页 = 左页 + 右页，左右各放一条回忆。
 *
 * 怎么填内容：
 * - 找到要填的那条 entry，把 status 从 'pending' 改为 'filled'
 * - 填上 date（YYYY-MM-DD，显示用 dateLong 可更自由）
 * - media 里加图片（路径以 images/albums/ 开头，文件放到 public/images/albums/）
 * - text 写一段回忆文字，可选
 * - 一个 entry 支持多张图（photos），翻页时在同一条里排布
 *
 * 一条已填的示例：
 *   {
 *     id: 1, chapterId: 1, page: 1, side: 'left',
 *     status: 'filled', date: '2024-03-15', dateLong: '2024 年 3 月 15 日',
 *     title: '第一次见到对方',
 *     media: [{ src: 'images/albums/2024-03-15-first-meet.jpg', caption: '街角的奶茶店门口' }],
 *     text: '他穿了一件很丑的灰蓝色卫衣，但笑起来很好看。'
 *   }
 */

export type AlbumStatus = 'pending' | 'filled';
export type AlbumMediaSpan = 'wide' | 'tall';
export type AlbumBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'caption'; text: string }
  | { type: 'heading'; text: string };

export interface AlbumMedia {
  /** 图片路径，相对 public/，如 images/albums/xxx.jpg */
  src: string;
  /** 图片说明（可选） */
  caption?: string;
  /** 图片在杂志网格中的占位倾向（可选） */
  span?: AlbumMediaSpan;
}

export interface AlbumChapter {
  id: number;
  title: string;
  kicker: string; // 章节引言
}

export interface AlbumEntry {
  id: number;          // 1..80 全局编号
  chapterId: number;   // 1..8
  page: number;        // 对开页页码 1..40（全局）
  side: 'left' | 'right'; // 在该对开页中的位置
  title: string;       // 条目标题（沿用原始 80 条标题）
  status: AlbumStatus;
  date?: string;       // YYYY-MM-DD，用于排序
  dateLong?: string;   // 展示用日期，如「2024 年 3 月 15 日」，未填则回退到 date
  media?: AlbumMedia[]; // 多张图，按顺序排布
  blocks?: AlbumBlock[]; // 可组合的标题、正文、引语和说明
  text?: string;       // 兼容旧数据：没有 blocks 时作为 paragraph
}

/** 8 大章节 · 顺序固定 */
export const albumChapters: AlbumChapter[] = [
  { id: 1, title: '相识与心动',   kicker: '从第一次见面，到第一次心动。' },
  { id: 2, title: '恋爱里的第一次', kicker: '那些只属于我们的小事。' },
  { id: 3, title: '普通日常',     kicker: '不特别，但因为有你。' },
  { id: 4, title: '可爱的小细节', kicker: '只有我们懂的暗号。' },
  { id: 5, title: '一起去过的地方', kicker: '路上有你就够浪漫。' },
  { id: 6, title: '节日与纪念',   kicker: '一年里的特别日子。' },
  { id: 7, title: '相互陪伴',     kicker: '你在，比什么都好。' },
  { id: 8, title: '未来与此刻',   kicker: '未完待续。' },
];

/**
 * 80 条骨架 → 40 个对开页（每章 5 对开页 = 10 条）。
 * 同一条 entry 内部支持多图（media）+ 多个可组合文字块（blocks）。
 * 左页为奇数条，右页为偶数条。
 */
export const albumEntries: AlbumEntry[] = [
  // ── 第 1 章 · 相识与心动（对开页 1-5）──
  { id: 1,  chapterId: 1, page: 1, side: 'left',  title: '第一次见到对方',     status: 'pending' },
  { id: 2,  chapterId: 1, page: 1, side: 'right', title: '第一次正式自我介绍', status: 'pending' },
  { id: 3,  chapterId: 1, page: 2, side: 'left',  title: '第一条聊天记录',     status: 'pending' },
  { id: 4,  chapterId: 1, page: 2, side: 'right', title: '第一次记住对方的小习惯', status: 'pending' },
  { id: 5,  chapterId: 1, page: 3, side: 'left',  title: '第一次为了见面而等待', status: 'pending' },
  { id: 6,  chapterId: 1, page: 3, side: 'right', title: '第一次聊到深夜',     status: 'pending' },
  { id: 7,  chapterId: 1, page: 4, side: 'left',  title: '第一次分享秘密',     status: 'pending' },
  { id: 8,  chapterId: 1, page: 4, side: 'right', title: '第一张合照',         status: 'pending' },
  { id: 9,  chapterId: 1, page: 5, side: 'left',  title: '第一次收到的礼物',   status: 'pending' },
  { id: 10, chapterId: 1, page: 5, side: 'right', title: '确定关系的那一天',   status: 'pending' },

  // ── 第 2 章 · 恋爱里的第一次（对开页 6-10）──
  { id: 11, chapterId: 2, page: 6,  side: 'left',  title: '第一次约会',         status: 'pending' },
  { id: 12, chapterId: 2, page: 6,  side: 'right', title: '第一次一起看电影',   status: 'pending' },
  { id: 13, chapterId: 2, page: 7,  side: 'left',  title: '第一次一起吃饭',     status: 'pending' },
  { id: 14, chapterId: 2, page: 7,  side: 'right', title: '第一次牵手',         status: 'pending' },
  { id: 15, chapterId: 2, page: 8,  side: 'left',  title: '第一次拥抱',         status: 'pending' },
  { id: 16, chapterId: 2, page: 8,  side: 'right', title: '第一次接吻',         status: 'pending' },
  { id: 17, chapterId: 2, page: 9,  side: 'left',  title: '第一次一起旅行',     status: 'pending' },
  { id: 18, chapterId: 2, page: 9,  side: 'right', title: '第一次见对方的朋友', status: 'pending' },
  { id: 19, chapterId: 2, page: 10, side: 'left',  title: '第一次见对方的家人', status: 'pending' },
  { id: 20, chapterId: 2, page: 10, side: 'right', title: '第一次说"想你"',     status: 'pending' },

  // ── 第 3 章 · 普通日常（对开页 11-15）──
  { id: 21, chapterId: 3, page: 11, side: 'left',  title: '早安和晚安',         status: 'pending' },
  { id: 22, chapterId: 3, page: 11, side: 'right', title: '对方刚睡醒的样子',   status: 'pending' },
  { id: 23, chapterId: 3, page: 12, side: 'left',  title: '一起通勤或接送',     status: 'pending' },
  { id: 24, chapterId: 3, page: 12, side: 'right', title: '雨天共撑一把伞',     status: 'pending' },
  { id: 25, chapterId: 3, page: 13, side: 'left',  title: '一起买菜',           status: 'pending' },
  { id: 26, chapterId: 3, page: 13, side: 'right', title: '第一次一起做饭',     status: 'pending' },
  { id: 27, chapterId: 3, page: 14, side: 'left',  title: '分享一碗饭或一杯饮料', status: 'pending' },
  { id: 28, chapterId: 3, page: 14, side: 'right', title: '靠在一起午睡',       status: 'pending' },
  { id: 29, chapterId: 3, page: 15, side: 'left',  title: '什么都不做却待在一起', status: 'pending' },
  { id: 30, chapterId: 3, page: 15, side: 'right', title: '最常去的街道或咖啡店', status: 'pending' },

  // ── 第 4 章 · 可爱的小细节（对开页 16-20）──
  { id: 31, chapterId: 4, page: 16, side: 'left',  title: '放在一起的两只手',   status: 'pending' },
  { id: 32, chapterId: 4, page: 16, side: 'right', title: '并排摆放的鞋子',     status: 'pending' },
  { id: 33, chapterId: 4, page: 17, side: 'left',  title: '对方的背影',         status: 'pending' },
  { id: 34, chapterId: 4, page: 17, side: 'right', title: '对方睡乱的头发',     status: 'pending' },
  { id: 35, chapterId: 4, page: 18, side: 'left',  title: '只有你们懂的昵称',   status: 'pending' },
  { id: 36, chapterId: 4, page: 18, side: 'right', title: '一句专属口头禅',     status: 'pending' },
  { id: 37, chapterId: 4, page: 19, side: 'left',  title: '共同歌单',           status: 'pending' },
  { id: 38, chapterId: 4, page: 19, side: 'right', title: '最常用的表情包',     status: 'pending' },
  { id: 39, chapterId: 4, page: 20, side: 'left',  title: '手机相册里的截图',   status: 'pending' },
  { id: 40, chapterId: 4, page: 20, side: 'right', title: '对方没发现的抓拍',   status: 'pending' },

  // ── 第 5 章 · 一起去过的地方（对开页 21-25）──
  { id: 41, chapterId: 5, page: 21, side: 'left',  title: '第一次坐火车或飞机', status: 'pending' },
  { id: 42, chapterId: 5, page: 21, side: 'right', title: '一起迷路',           status: 'pending' },
  { id: 43, chapterId: 5, page: 22, side: 'left',  title: '错过公交或高铁',     status: 'pending' },
  { id: 44, chapterId: 5, page: 22, side: 'right', title: '在雨里赶路',         status: 'pending' },
  { id: 45, chapterId: 5, page: 23, side: 'left',  title: '一起看日出',         status: 'pending' },
  { id: 46, chapterId: 5, page: 23, side: 'right', title: '一起看日落',         status: 'pending' },
  { id: 47, chapterId: 5, page: 24, side: 'left',  title: '路边摊或深夜宵夜',   status: 'pending' },
  { id: 48, chapterId: 5, page: 24, side: 'right', title: '旅行中的酒店早餐',   status: 'pending' },
  { id: 49, chapterId: 5, page: 25, side: 'left',  title: '一起坐过的游乐设施', status: 'pending' },
  { id: 50, chapterId: 5, page: 25, side: 'right', title: '从窗户看出去的风景', status: 'pending' },

  // ── 第 6 章 · 节日与纪念（对开页 26-30）──
  { id: 51, chapterId: 6, page: 26, side: 'left',  title: '第一次过生日',       status: 'pending' },
  { id: 52, chapterId: 6, page: 26, side: 'right', title: '第一个纪念日',       status: 'pending' },
  { id: 53, chapterId: 6, page: 27, side: 'left',  title: '第一次过情人节',     status: 'pending' },
  { id: 54, chapterId: 6, page: 27, side: 'right', title: '一起跨年倒计时',     status: 'pending' },
  { id: 55, chapterId: 6, page: 28, side: 'left',  title: '一起过春节或中秋',   status: 'pending' },
  { id: 56, chapterId: 6, page: 28, side: 'right', title: '第一次互送节日礼物', status: 'pending' },
  { id: 57, chapterId: 6, page: 29, side: 'left',  title: '旅行票根',           status: 'pending' },
  { id: 58, chapterId: 6, page: 29, side: 'right', title: '一起看过的演唱会或展览', status: 'pending' },
  { id: 59, chapterId: 6, page: 30, side: 'left',  title: '买过的情侣物件',     status: 'pending' },
  { id: 60, chapterId: 6, page: 30, side: 'right', title: '写给对方的手写卡片', status: 'pending' },

  // ── 第 7 章 · 相互陪伴（对开页 31-35）──
  { id: 61, chapterId: 7, page: 31, side: 'left',  title: '生病时被照顾',       status: 'pending' },
  { id: 62, chapterId: 7, page: 31, side: 'right', title: '难过时被安慰',       status: 'pending' },
  { id: 63, chapterId: 7, page: 32, side: 'left',  title: '考试或面试前的鼓励', status: 'pending' },
  { id: 64, chapterId: 7, page: 32, side: 'right', title: '加班或熬夜时的陪伴', status: 'pending' },
  { id: 65, chapterId: 7, page: 33, side: 'left',  title: '在车站等待对方',     status: 'pending' },
  { id: 66, chapterId: 7, page: 33, side: 'right', title: '第一次吵架后的和好', status: 'pending' },
  { id: 67, chapterId: 7, page: 34, side: 'left',  title: '异地时的视频通话',   status: 'pending' },
  { id: 68, chapterId: 7, page: 34, side: 'right', title: '一起搬家或组装家具', status: 'pending' },
  { id: 69, chapterId: 7, page: 35, side: 'left',  title: '为对方感到骄傲的时刻', status: 'pending' },
  { id: 70, chapterId: 7, page: 35, side: 'right', title: '一起熬过的困难时期', status: 'pending' },

  // ── 第 8 章 · 未来与此刻（对开页 36-40）──
  { id: 71, chapterId: 8, page: 36, side: 'left',  title: '第一次买进共同生活的物品', status: 'pending' },
  { id: 72, chapterId: 8, page: 36, side: 'right', title: '一起存钱或计划旅行', status: 'pending' },
  { id: 73, chapterId: 8, page: 37, side: 'left',  title: '写下想去的地方清单', status: 'pending' },
  { id: 74, chapterId: 8, page: 37, side: 'right', title: '聊到未来的家',       status: 'pending' },
  { id: 75, chapterId: 8, page: 38, side: 'left',  title: '一起尝试的新爱好',   status: 'pending' },
  { id: 76, chapterId: 8, page: 38, side: 'right', title: '复刻第一次合照',     status: 'pending' },
  { id: 77, chapterId: 8, page: 39, side: 'left',  title: '一起制作这本相册',   status: 'pending' },
  { id: 78, chapterId: 8, page: 39, side: 'right', title: '最近的一张自然合照', status: 'pending' },
  { id: 79, chapterId: 8, page: 40, side: 'left',  title: '写给未来彼此的信',   status: 'pending' },
  { id: 80, chapterId: 8, page: 40, side: 'right', title: '未完待续',           status: 'pending' },
];

/** 章节 id → 中文数字（UI 装饰用）。 */
export const ALBUM_CHAPTER_NUMERAL = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌'] as const;

/** 对开页总数（80 条 ÷ 2） */
export const TOTAL_PAGES = 40;
