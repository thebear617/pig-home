# 猪窝

个人家庭管理工具，包含家居档案、每日追踪、美食记录、支出记录、美食地图和关系时间线等模块。

在线地址：https://thebear617.github.io/pig-home/

## 技术栈

- **Astro 5** — 静态站点生成，内容集合驱动
- **纯 CSS + 原生 JS** — 无框架，客户端交互通过事件委托 + DOM 操作
- **marked** — Markdown 渲染（服务端）

## 页面与视图

站点采用 Astro 多路由架构，侧边栏入口对应独立页面；同一页面内的相关功能使用视图切换，不再把所有内容渲染在一个入口页面中。

| 页面 | 路由 | 视图 / 内容 |
| --- | --- | --- |
| 家居档案 | `/home-archive/` | 生活备忘录、猪窝地图、家居变动、入住清单 |
| 每日追踪 | `/daily-tracker/` | 每日追踪、水电追踪 |
| 美食记录与做饭心得 | `/food-records/` | 美食日历、做饭心得 |
| 支出记录 | `/expense-records/` | 按月支出与分类明细 |
| 美食地图 | `/food-map/` | 探店记录与地点筛选 |
| 关系时间线 | `/relationship-timeline/` | 旅行、西安 walk、吵架复盘 |

生活备忘录和入住清单的条目仍然使用独立详情路由：

- `/follow-up/memos/[slug]/`
- `/follow-up/procurement/[slug]/`

历史入口 `/follow-up/`、`/home-map/` 和 `/utility-tracking/` 会跳转到对应的新页面或视图，避免旧链接失效。

## 文件结构

```
├── src/
│   ├── pages/
│   │   ├── home-archive.astro   # 家居档案四视图
│   │   ├── daily-tracker.astro  # 每日追踪 / 水电追踪双视图
│   │   ├── follow-up/            # 备忘录与入住清单详情路由
│   │   └── ...                   # 其他独立页面路由
│   ├── components/
│   │   └── tabs/                # 页面和视图组件
│   ├── content/                 # Markdown 内容集合
│   │   ├── cooking-tips/        # 做饭心得
│   │   ├── memos/               # 生活备忘录
│   │   ├── procurement/         # 入住清单
│   │   ├── food-places/         # 探店记录
│   │   ├── trips/               # 旅行记录
│   │   ├── xian-trips/          # 西安 walk
│   │   └── quarrels/            # 吵架复盘
│   ├── data/                    # 数值型数据模块
│   │   ├── utility-records.ts   # 电费记录
│   │   ├── food-records.ts      # 做饭记录
│   │   ├── hema-records.ts      # 盒马采购
│   │   ├── locations.ts         # 物品位置
│   │   ├── home-events.ts       # 家居变动记录
│   │   ├── expense-categories.ts # 支出分类
│   │   ├── diary-data.js        # 日记数据（自动生成）
│   │   ├── expense-data.js      # 支出数据（自动生成）
│   │   └── special-keywords.json
│   ├── lib/
│   │   ├── helpers.ts           # 工具函数（农历、日期等）
│   │   └── tabs.ts              # 侧边栏页面配置
│   ├── layouts/
│   │   └── Layout.astro         # 共享侧边栏与页面骨架
│   ├── scripts/
│   │   ├── layout.ts            # 移动端侧边栏交互
│   │   └── page.ts              # 日历、视图与详情交互
│   └── styles/
│       └── global.css
├── scripts/
│   ├── build-diary.py           # Obsidian 日记 → 数据文件
│   └── special-keywords.json
├── _diary/                      # Obsidian 日记（软链）
├── public/images/               # 静态图片
├── astro.config.mjs
├── package.json
└── .github/workflows/deploy.yml # 自动部署
```

## 内容集合

所有半结构化内容（做饭心得、备忘录、旅行记录等）以 Markdown 文件存储在 `src/content/` 中，支持 YAML frontmatter。编辑 Markdown 文件即可更新站点内容。

## 数据管线

1. 用户在 Obsidian 中编写日记（`_diary/` 软链）
2. 运行 `python3 scripts/build-diary.py` 解析日记
3. 生成 `src/data/diary-data.js` 和 `src/data/expense-data.js`
4. Astro 构建时导入所有数据，客户端脚本按页面和视图刷新日历详情

## 开发

```bash
npm install
npm run dev        # 本地开发（SITE_BASE='/'）
npm run build      # 生产构建（含日记生成）
npm run preview    # 预览构建结果
```

本地模拟 GitHub Pages 子路径时使用：

```bash
SITE_BASE='/pig-home/' npm run build
```

## 部署

Push 到 main 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。
