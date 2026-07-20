# 猪窝 home 更新日志

## v0.9.1 — 2026-07-20
feat: 每日追踪新增特殊纪念日高亮+图标 + 开发日程规则

- feat: 每日追踪日历 — 特殊纪念日高亮+图标
  - 构建脚本从 `scripts/special-keywords.json` 读取关键词→图标映射
  - 日历格金色渐变底色 + 左侧琥珀色边线 + 底部图标（每天最多一个）
  - 首批检测：6/10 毕业🎓、6/17 生日🎂、7/20 天台日出🌅
- chore: 新增 `special-keywords.json`（agent 按需维护）
- diary: 7/19 追加 devnotes Vue→Astro 迁移详情，新建 7/20 日程+支出

## v0.9.0 — 2026-07-11
feat: 每日追踪与支出记录从 personal 迁移至 home（大版本）

- feat: 新增「每日追踪」Tab（📅）
  - 日历视图：农历、今日高亮、有支出日红点、日记记录日显示已完成任务数
  - 选中日明细面板：当日日程（任务列表）+ 当日支出（分类汇总）
  - 本月汇总条：本月支出 / 日均支出 / 平均入睡·起床·睡眠
  - 样式完整对齐原 personal 日历/记账 Tab（已移除迁移时多加的蓝点/删除线/分类名/记账天数）
- feat: 新增「支出记录」Tab（💰）
  - 按月汇总：本月支出 / 记录笔数 / 日均
  - 按分类分组可折叠（图标 + 分类名 + 分类合计 + 笔数），组内按日期倒序列出每笔
  - 空月显示 empty-state
- chore: 数据管线 `scripts/build-diary.py` 按 ROOT 自动落到 home，`_diary` 软链指向 ~/Documents/notes/日记
- chore: `index.html` 在 marked 前加载 data / expense-data / diary-data
