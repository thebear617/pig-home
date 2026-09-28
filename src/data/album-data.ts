/**
 * 情侣相册 · 时间线（翻页版）
 * 一本可以「翻页」的纸质相册：一个对开页 = 左页 + 右页，左右各放一条回忆。
 *
 * 章节按「实际拥有的素材」划分，不设页数上限：
 * - 每章从新的对开页开始，章内每 2 条 entry 占 1 个对开页。
 * - **对开页页码（page / side）由 layoutEntries() 自动分配**，数据里只写 chapterId + date。
 *
 * 章内排序规则：
 * - 按 date 升序（字符串比较，'YYYY-MM' 或 'YYYY-MM-DD' 都行）
 * - date 留空的排在最后，彼此保持书写顺序（适合「未完待续」这种还没定日期的占位）
 *
 * 怎么加一条：
 * 1. 在对应章节的注释块下补一条，最少写 { id, chapterId, date, title, status: 'pending' }
 * 2. 想填内容时把 status 改成 'filled'，补上 dateLong / media / text
 * 3. 图片路径以 images/albums/ 开头，文件放进 public/images/albums/
 * 4. **不用管页码**，写入顺序也无所谓，页码和左右页会按 date 自动排好
 *
 * 一条已填的示例：
 *   {
 *     id: 1, chapterId: 1,
 *     status: 'filled', date: '2024-03', dateLong: '2024 年 3 月',
 *     title: '第一次见到对方',
 *     media: [{ src: 'images/albums/album-first-meet.jpg', caption: '街角的奶茶店门口' }],
 *     text: '他穿了一件很丑的灰蓝色卫衣，但笑起来很好看'
 *   }
 */

export type AlbumStatus = 'pending' | 'filled';
export type AlbumMediaSpan = 'wide' | 'tall';

/**
 * 版面布局模板名，格式 `<张数>-<风格>`：
 * - 前缀是英文数字，表示这一面需要几张照片（CSS 类名不能以数字开头，所以用 one/two/three）
 * - 后缀是排布风格
 * 不填 entry.layout 时，按实际照片张数自动取该张数的默认模板。
 */
export type AlbumLayout =
  | 'one-full'
  | 'two-split'
  | 'two-hero'
  | 'three-hero'
  | 'three-strip'
  | 'four-grid'
  | 'four-mosaic'
  | 'many-dense';
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
  id: number;          // 全局编号，从 1 起（只作唯一标识，不代表阅读顺序）
  chapterId: number;   // 所属章节
  page: number;        // 对开页页码（由 layoutEntries 自动分配，从 1 起）
  side: 'left' | 'right'; // 在该对开页中的位置（由 layoutEntries 自动分配）
  title: string;       // 条目标题
  status: AlbumStatus;
  date?: string;       // 章内排序主键：'YYYY-MM' 或 'YYYY-MM-DD'；留空则排在本章最后
  dateLong?: string;   // 展示用日期，如「2024 年 3 月 15 日」，未填则回退到 date
  media?: AlbumMedia[]; // 多张图，按顺序排布
  layout?: AlbumLayout; // 版面模板名；不填则按 media 张数自动取默认
  blocks?: AlbumBlock[]; // 可组合的标题、正文、引语和说明
  text?: string;       // 兼容旧数据：没有 blocks 时作为 paragraph
}

/** 手写在数据源里的字段：不含 page / side，那两个由 layoutEntries() 算出来 */
export type AlbumEntrySeed = Omit<AlbumEntry, 'page' | 'side'>;

/** 7 大章节 · 顺序固定，按实际素材量划分 */
export const albumChapters: AlbumChapter[] = [
  { id: 1, title: '相遇与约会',     kicker: '从第一次见面，到一次次赴约' },
  { id: 2, title: '我们的日常',     kicker: '不特别，但因为有你' },
  { id: 3, title: '两个人的样子',   kicker: '镜头里的你和我' },
  { id: 4, title: '一起去过的地方', kicker: '路上有你就够浪漫' },
  { id: 5, title: '纪念日与节日',   kicker: '一年里的特别日子' },
  { id: 6, title: '一起努力',       kicker: '各自奔跑，也并肩' },
  { id: 7, title: '未完待续',       kicker: '故事还在写' },
];

/**
 * 数据源：只写 chapterId + date，页码与左右页交给下面的 layoutEntries() 自动排。
 * - 每章至少留 1 个对开页（2 条 entry）当骨架，以后按素材量往章内补。
 * - 章内顺序完全由 date 决定，与这里的书写顺序无关（date 相同则保持书写顺序）。
 * - date 留空的排在本章最后。id 只作唯一标识，不代表阅读顺序。
 */
const albumEntrySeeds: AlbumEntrySeed[] = [
  // ── 第 1 章 · 相遇与约会 ──
  {
    id: 1, chapterId: 1, title: '我们的第一次公费约会',
    status: 'filled', date: '2022-04', dateLong: '2022 年 4—5 月',
    media: [
      { src: 'images/albums/album-IMG_1505.jpg' },
      { src: 'images/albums/album-IMG_1500.jpg' },
      { src: 'images/albums/album-IMG_1446.jpg' },
    ],
    blocks: [
      { type: 'paragraph', text: '给小朋友布置教室的间隙，顺便把约会也办了' },
    ],
  },
  {
    id: 2, chapterId: 1, title: '一次次赴约',
    status: 'filled', date: '2023-11', dateLong: '2023 — 2025', layout: 'four-grid',
    media: [
      { src: 'images/albums/album-IMG_2918.jpg', caption: '乐华欢乐世界' },
      { src: 'images/albums/album-IMG_2673.jpg', caption: '地铁上' },
      { src: 'images/albums/album-IMG_3696.jpg', caption: '圣诞节的街头' },
      { src: 'images/albums/album-IMG_7820.jpg', caption: '花鸟市场' },
    ],
    blocks: [
      { type: 'paragraph', text: '游乐园的夜场、地铁上的自拍、圣诞节的街头、花鸟市场的花丛——一次次赴约' },
    ],
  },

  // ── 第 2 章 · 我们的日常 ──
  {
    id: 3, chapterId: 2, title: '什么都不做却待在一起',
    status: 'filled', date: '2026-08', dateLong: '2026 年 8 月',
    media: [
      { src: 'images/albums/album-IMG_7815.jpg', caption: '你掌勺的火锅夜' },
      { src: 'images/albums/album-IMG_7771.jpg', caption: '辣到跳脚也要吃' },
      { src: 'images/albums/album-IMG_7825.jpg', caption: '家里新来的小成员' },
      { src: 'images/albums/album-IMG_7714.jpg', caption: '宜家的一支冰淇淋' },
    ],
    blocks: [
      { type: 'quote', text: '火锅咕嘟咕嘟，你在对面，仓鼠在脚边' },
      { type: 'paragraph', text: '什么都不做，就这样待在一起，也很好' },
    ],
  },
  {
    id: 4, chapterId: 2, title: '最常去的街道或咖啡店',
    status: 'filled', date: '2026-08', dateLong: '2026 年 8 月',
    media: [
      { src: 'images/albums/album-710202.jpg', caption: '白色那件' },
      { src: 'images/albums/album-710211.jpg', caption: '灰色那件' },
    ],
    blocks: [
      { type: 'quote', text: '白色还是灰色？都好看' },
      { type: 'paragraph', text: '试衣间的镜子，记得你所有好看的样子' },
    ],
  },

  // ── 第 3 章 · 两个人的样子（自拍 / 合拍，素材横跨 2022 — 2026）──
  { id: 5, chapterId: 3, date: '2022-05', title: '自拍里的我们',     status: 'pending' },
  { id: 6, chapterId: 3, date: '2022-10', title: '对方镜头下的样子', status: 'pending' },

  // ── 第 4 章 · 一起去过的地方 ──
  // 这批素材本身就是「拼图」（一张里含多个小画面），所以每条只放一张、用 one-full 铺满整页，
  // 细节才看得清。日期相同 → 按这里的书写顺序排，所以下面是按游玩顺序写的。
  // 文案一律不加句号。

  // 武汉 · 11 条
  {
    id: 15, chapterId: 4, title: '武汉·曾侯乙',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1261.jpg' }],
    blocks: [{ type: 'paragraph', text: '博物馆的屋顶压着蓝天' }],
  },
  {
    id: 16, chapterId: 4, title: '武汉·老街的钟楼',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1262.jpg' }],
    blocks: [{ type: 'paragraph', text: '走两步就是一栋老房子' }],
  },
  {
    id: 17, chapterId: 4, title: '武汉·砖墙前面',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1264.jpg' }],
    blocks: [{ type: 'paragraph', text: '你站在那儿，我按了快门' }],
  },
  {
    id: 18, chapterId: 4, title: '武汉·江边的美术馆',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1272.jpg' }],
    blocks: [{ type: 'paragraph', text: '白色的墙，绿色的草' }],
  },
  {
    id: 19, chapterId: 4, title: '武汉·橙色的房子',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1265.jpg' }],
    blocks: [{ type: 'paragraph', text: '整条街都是暖色' }],
  },
  {
    id: 20, chapterId: 4, title: '武汉·亮起来',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1266.jpg' }],
    blocks: [{ type: 'paragraph', text: '灯一盏一盏亮' }],
  },
  {
    id: 21, chapterId: 4, title: '武汉·我爱武汉',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1263.jpg' }],
    blocks: [{ type: 'paragraph', text: '这四个字挂在天上' }],
  },
  {
    id: 22, chapterId: 4, title: '武汉·江汉路的夜',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_3920.jpg' }],
    blocks: [{ type: 'paragraph', text: '江边的风，和你' }],
  },
  {
    id: 23, chapterId: 4, title: '武汉·挤进一场 Livehouse',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1268.jpg' }],
    blocks: [{ type: 'paragraph', text: '站着也要听完' }],
  },
  {
    id: 24, chapterId: 4, title: '武汉·牛肉饼和热干面',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_3919.jpg' }],
    blocks: [{ type: 'paragraph', text: '排队也值' }],
  },
  {
    id: 25, chapterId: 4, title: '武汉·小龙虾和串串',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1269.jpg' }],
    blocks: [{ type: 'paragraph', text: '吃到手上都是油' }],
  },

  // 长沙 · 7 条
  {
    id: 26, chapterId: 4, title: '长沙·橘子洲',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1270.jpg' }],
    blocks: [{ type: 'paragraph', text: '江风把头发吹乱' }],
  },
  {
    id: 27, chapterId: 4, title: '长沙·岳麓山',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1271.jpg' }],
    blocks: [{ type: 'paragraph', text: '树比楼高' }],
  },
  {
    id: 28, chapterId: 4, title: '长沙·文和友',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1273.jpg' }],
    blocks: [{ type: 'paragraph', text: '灯笼挂了一整条巷子' }],
  },
  {
    id: 29, chapterId: 4, title: '长沙·想你的风吹到了长沙',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1276.jpg' }],
    blocks: [{ type: 'paragraph', text: '那块牌子上写着你的名字' }],
  },
  {
    id: 30, chapterId: 4, title: '长沙·杜甫江阁',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1274.jpg' }],
    blocks: [{ type: 'paragraph', text: '金色的一栋楼' }],
  },
  {
    id: 31, chapterId: 4, title: '长沙·挤进一场 Livehouse',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1275.jpg' }],
    blocks: [{ type: 'paragraph', text: '紫红色的光' }],
  },
  {
    id: 32, chapterId: 4, title: '长沙·夜长沙',
    status: 'filled', date: '2023-08', dateLong: '2023 年 8 月', layout: 'one-full',
    media: [{ src: 'images/albums/album-IMG_1277.jpg' }],
    blocks: [{ type: 'paragraph', text: '臭豆腐和奶茶都吃到了' }],
  },

  { id: 8, chapterId: 4, date: '2024-12', title: '旅途中的碎片',     status: 'pending' },

  // ── 第 5 章 · 纪念日与节日 ──
  { id: 9,  chapterId: 5, date: '2023-10', title: '我们的纪念日',     status: 'pending' },
  { id: 10, chapterId: 5, date: '2024-09', title: '一起听过的现场',   status: 'pending' },

  // ── 第 6 章 · 一起努力 ──
  { id: 11, chapterId: 6, date: '2023-06', title: '一起熬夜的日子',   status: 'pending' },
  { id: 12, chapterId: 6, date: '2023-06', title: '各自努力的时刻',   status: 'pending' },

  // ── 第 7 章 · 未完待续（date 留空 = 排最后，因为本来就是还没到的日子）──
  { id: 13, chapterId: 7, title: '未完待续',       status: 'pending' },
  { id: 14, chapterId: 7, title: '写给未来的我们', status: 'pending' },
];

/**
 * 自动排版：按章分组 → 章内按 date 升序 → 每 2 条铺满 1 个对开页。
 * 章节之间不共页（每章都从新的对开页开始），空章不占页。
 */
function layoutEntries(seeds: AlbumEntrySeed[]): AlbumEntry[] {
  const laid: AlbumEntry[] = [];
  let page = 0;

  for (const chapter of albumChapters) {
    const list = seeds
      .map((seed, index) => ({ seed, index }))
      .filter(({ seed }) => seed.chapterId === chapter.id)
      .sort((a, b) => {
        const da = a.seed.date;
        const db = b.seed.date;
        if (!da && !db) return a.index - b.index;
        if (!da) return 1;              // 没日期的沉底
        if (!db) return -1;
        if (da === db) return a.index - b.index;
        return da < db ? -1 : 1;
      });

    if (list.length === 0) continue;    // 空章不占对开页

    list.forEach(({ seed }, i) => {
      if (i % 2 === 0) page += 1;       // 每满 2 条开新页
      laid.push({ ...seed, page, side: i % 2 === 0 ? 'left' : 'right' });
    });
  }

  return laid;
}

/** 页面实际使用的 entry 列表：已排好章内顺序、对开页页码与左右页 */
export const albumEntries: AlbumEntry[] = layoutEntries(albumEntrySeeds);

/** 章节 id → 中文数字（UI 装饰用）。 */
export const ALBUM_CHAPTER_NUMERAL = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒'] as const;

/** 对开页总数 —— 由排版结果自动推导，不写死；加 entry 时只改上面的 seeds 即可 */
export const TOTAL_PAGES = Math.max(1, ...albumEntries.map(e => e.page));
