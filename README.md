# 猪窝

个人家庭管理工具，包含生活备忘录、物资采购、水电追踪、每日记账、美食记录、关系时间线等模块。

在线地址：https://thebear617.github.io/pig-home/

## 技术栈

- **Astro 5** — 静态站点生成，内容集合驱动
- **纯 CSS + 原生 JS** — 无框架，客户端交互通过事件委托 + DOM 操作
- **marked** — Markdown 渲染（服务端）

## 文件结构

```
├── src/
│   ├── pages/
│   │   └── index.astro          # 主页面
│   ├── components/
│   │   └── tabs/                # 8 个 Tab 组件
│   ├── content/                 # Markdown 内容集合
│   │   ├── cooking-tips/        # 做饭心得
│   │   ├── memos/               # 生活备忘录
│   │   ├── procurement/         # 物资采购清单
│   │   ├── food-places/         # 探店记录
│   │   ├── trips/               # 旅行记录
│   │   ├── xian-trips/          # 西安 walk
│   │   └── quarrels/            # 吵架复盘
│   ├── data/                    # 数值型数据模块
│   │   ├── utility-records.ts   # 电费记录
│   │   ├── food-records.ts      # 做饭记录
│   │   ├── hema-records.ts      # 盒马采购
│   │   ├── locations.ts         # 物品位置
│   │   ├── expense-categories.ts # 支出分类
│   │   ├── diary-data.js        # 日记数据（自动生成）
│   │   ├── expense-data.js      # 支出数据（自动生成）
│   │   └── special-keywords.json
│   ├── lib/
│   │   ├── helpers.ts           # 工具函数（农历、日期等）
│   │   └── tabs.ts              # Tab 配置
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
4. Astro 构建时导入所有数据

## 开发

```bash
npm install
npm run dev        # 本地开发（SITE_BASE='/'）
npm run build      # 生产构建（含日记生成）
npm run preview    # 预览构建结果
```

## 部署

Push 到 main 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。
