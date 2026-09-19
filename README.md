# 猪窝

个人家庭管理工具，包含家居档案、厨房工作台、日程和财务、美食地图、关系时间线和情侣相册等模块。

在线地址：https://thebear617.github.io/pig-home/

## 技术栈

- **Astro 7** — 静态站点生成，基于 Content Layer 的内容集合驱动
- **纯 CSS + 原生 JS** — 无框架，客户端交互通过事件委托 + DOM 操作
- **marked** — Markdown 渲染（服务端）

## 页面与视图

站点采用 Astro 多路由架构，侧边栏入口对应独立页面；同一页面内的相关功能使用视图切换。侧边栏入口配置在 `src/lib/tabs.ts`，默认入口由 `DEFAULT_TAB` 定义，`src/pages/index.astro` 重定向到该入口。

| 页面 | 路由 | 视图 / 内容 |
| --- | --- | --- |
| 家居档案 | `/home-archive/` | 生活备忘录、猪窝地图、家居变动、入住清单 |
| 厨房工作台 | `/food-records/` | 做菜记录、高频菜品、厨师排行、菜谱速查、食材甘特图、价格速查 |
| 日程和财务 | `/schedule-finance/` | 每日追踪 `?view=daily-tracker`、收支记录 `?view=expense-records`、会员订阅 `?view=membership` |
| 美食地图 | `/food-map/` | 探店记录、街区/区域评价与地点筛选 |
| 关系时间线 | `/relationship-timeline/` | 旅行、西安 walk、吵架复盘 |
| 情侣相册 | `/couple-album/` | 对开页相册：章节分组、页码跳转、键盘翻页、图片灯箱 |

### 视图切换

- 聚合页内的多个视图**一次性全部渲染进 DOM**，切换只改 `hidden`，各视图内部状态（月/年/选中日/翻页）不重置。
- 「日程和财务」的切换逻辑在 `src/scripts/page.ts` 的 `applyScheduleView()`，视图顺序与配置在 `src/lib/tabs.ts` 的 `SCHEDULE_FINANCE_VIEWS`（顺序即切换条顺序）。
- 厨房工作台是单页多模块 Dashboard，视图与交互逻辑在 `src/scripts/kitchen/`（`index` 负责事件与状态，`calendar` / `day` / `recipes` / `pantry` / `prices` / `search` 分模块渲染）。

### 兼容跳转

以下旧地址已改为跳转页，避免旧链接失效；不要再把它们作为侧边栏入口加回：

| 旧地址 | 跳转到 |
| --- | --- |
| `/daily-tracker/` | `/schedule-finance/?view=daily-tracker` |
| `/expense-records/` | `/schedule-finance/?view=expense-records` |
| `/membership/` | `/schedule-finance/?view=membership` |
| `/utility-tracking/` | `/schedule-finance/?view=daily-tracker&focus=utility` |
| `/follow-up/` | `/home-archive/?view=memos` |
| `/home-map/` | `/home-archive/?view=map` |
| `/todo-board/` | 熊窝 `https://me.thebear617.cn/todo-board/` |

生活备忘录和入住清单的条目仍使用独立详情路由：`/follow-up/memos/[slug]/`、`/follow-up/procurement/[slug]/`。

## 文件结构

```
├── src/
│   ├── content.config.ts          # Content Layer 内容集合配置
│   ├── pages/
│   │   ├── home-archive.astro     # 家居档案四视图
│   │   ├── food-records.astro     # 厨房工作台 Dashboard
│   │   ├── schedule-finance.astro # 日程和财务聚合页
│   │   ├── food-map.astro         # 美食地图
│   │   ├── relationship-timeline.astro # 关系时间线
│   │   ├── couple-album.astro     # 情侣相册
│   │   ├── follow-up/             # 备忘录与入住清单详情路由
│   │   └── *.astro                # 其余为兼容跳转页
│   ├── components/tabs/           # 各页面与视图组件
│   ├── content/                   # Markdown 内容集合
│   │   ├── cooking-tips/          # 做饭心得
│   │   ├── memos/                 # 生活备忘录
│   │   ├── procurement/           # 入住清单
│   │   ├── food-places/           # 探店记录
│   │   ├── trips/                 # 旅行记录
│   │   ├── xian-trips/            # 西安 walk
│   │   └── quarrels/              # 吵架复盘
│   ├── data/                      # 数值型数据模块
│   │   ├── utility-records.ts     # 电费记录
│   │   ├── food-records.ts        # 做饭记录
│   │   ├── food-pantry.ts         # 食材存放
│   │   ├── food-prices.ts         # 价格速查
│   │   ├── hema-records.ts        # 盒马采购
│   │   ├── locations.ts           # 物品位置
│   │   ├── home-events.ts         # 家居变动记录
│   │   ├── expense-categories.ts  # 支出分类
│   │   ├── diary-data.js          # 日记数据（自动生成）
│   │   └── expense-data.js        # 支出数据（自动生成）
│   ├── lib/
│   │   ├── helpers.ts             # 工具函数（农历、日期等）
│   │   └── tabs.ts                # 侧边栏页面与视图配置
│   ├── layouts/Layout.astro       # 共享侧边栏与页面骨架
│   ├── scripts/
│   │   ├── layout.ts              # 移动端侧边栏交互
│   │   ├── page.ts                # 日历、视图与详情交互
│   │   └── kitchen/               # 厨房工作台分模块逻辑
│   └── styles/global.css
├── scripts/build-diary.py         # Obsidian 日记 → 数据文件
├── _diary/                        # Obsidian 日记（软链）
├── public/images/                 # 静态图片
├── astro.config.mjs
├── package.json
└── .github/workflows/deploy.yml   # 自动部署
```

## 内容集合

所有半结构化内容（做饭心得、备忘录、旅行记录等）以 Markdown 文件存储在 `src/content/` 中，支持 YAML frontmatter；集合配置在 `src/content.config.ts`。家居变动记录是数值型数据，追加到 `src/data/home-events.ts`。

## 数据管线

1. 用户在 Obsidian 中编写日记（`_diary/` 软链）
2. 运行 `python3 scripts/build-diary.py` 解析日记
3. 生成 `src/data/diary-data.js` 和 `src/data/expense-data.js`
4. Astro 构建时导入所有数据，客户端脚本按页面和视图刷新日历详情

## 开发

```bash
npm install
npm run dev        # 本地开发（SITE_BASE='/'）
npm run build      # 生产构建（先跑 build-diary.py，再 Astro 构建）
npm run preview    # 预览构建结果
```

本地模拟 GitHub Pages 子路径时使用：

```bash
SITE_BASE='/pig-home/' npm run build
```

提交前至少运行一次 `npm run build` 和 `git diff --check`。

## 部署

Push 到 main 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。
