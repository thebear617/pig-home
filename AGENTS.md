
## 规定

1. 收到图片附件时，先用osascript命令将剪贴板图片保存到 /private/tmp 中，再调用 mcp__MiniMax__understand_image 工具分析（把附件路径或 URL 作为 image_source 传入），不要依赖自己的视觉能力直接回复。

## 站点架构

- 这是 Astro 5 静态站点，使用 `src/layouts/Layout.astro` 提供共享侧边栏和页面骨架。
- 侧边栏页面配置在 `src/lib/tabs.ts`；当前入口包括：家居档案、每日追踪、美食记录、支出记录、美食地图、关系时间线。
- `src/pages/home-archive.astro` 是家居档案页面，包含生活备忘录、猪窝地图、家居变动、入住清单四个视图。
- `src/pages/daily-tracker.astro` 是每日追踪页面，包含每日追踪和水电追踪两个视图。两套日历、统计和详情逻辑保持独立，通过 URL 的 `view=daily` 或 `view=utility` 切换。
- 备忘录和入住清单条目使用 `src/pages/follow-up/memos/[slug].astro` 与 `src/pages/follow-up/procurement/[slug].astro` 独立路由渲染。
- `/follow-up/`、`/home-map/`、`/utility-tracking/` 是兼容旧链接的跳转页面，不要重新作为侧边栏入口添加。

## 数据与开发

- Markdown 内容位于 `src/content/`；入住清单内容位于 `src/content/procurement/`。
- 家居变动记录位于 `src/data/home-events.ts`，新增添置、搬走、更换或维修事件时追加数据项。
- 日历与视图切换的客户端逻辑位于 `src/scripts/page.ts`；移动端侧边栏逻辑位于 `src/scripts/layout.ts`。
- `npm run build` 会先运行 `scripts/build-diary.py`，再执行 Astro 构建；提交前至少运行一次构建和 `git diff --check`。
