# 后续事宜 · 水电追踪

两个 Tab 的纯静态页面，布局风格继承自 `/Users/mokaiche/Documents/house`。

## 文件结构

```
├── index.html          # 页面入口
├── css/
│   └── style.css       # 所有样式
└── js/
    ├── data.js         # phases 定义 + utilityRecords 数据
    └── app.js          # 渲染引擎、tab 切换、日历交互
```

## 两个 Tab

### 1. 后续事宜及物资采购（`follow-up`，type: `checklist`）
- 3 个可折叠区域：后续待办事项、生活备忘录、第二轮物资采购
- 手风琴交互，点击 section header 展开/收起

### 2. 水电追踪（`utility-tracking`，type: `calendar`）
- 当月日历视图，农历 + 公历日期
- 今天用红圈高亮
- 有数据的天显示剩余电费（琥珀色小字 ¥xx.xx）
- **点击有数据的格子** → 下方出现详情面板，显示当日消耗
- 详情面板下方 → 月度汇总栏（累计用电、日均、记录天数）

## 数据结构

### phases（Tab 定义）
```js
const phases = [
  { id: 'follow-up', title: '…', type: 'checklist', sections: […] },
  { id: 'utility-tracking', title: '水电追踪', type: 'calendar', sections: [] }
];
```
新增 Tab 只需在 `phases` 数组中追加对象，再在 `app.js` 的 `buildPhaseContent()` 中添加对应 type 的分发。

### utilityRecords（水电数据）
```js
const utilityRecords = {
  '2026-06-25': { elecRemaining: 15.81 },
  '2026-06-26': { elecRemaining: 11.32 },
};
```
- Key 格式：`YYYY-MM-DD`
- 消耗计算：当天剩余 − 次日剩余 = 当日消耗（记在当天头上）

## 关键逻辑

- `state.selectedDay`：当前选中的日期 key，控制详情面板显隐
- `getMonthRecords(year, month)`：按月份过滤当天数据
- `buildDetailPanel()`：渲染选中日期的详情卡片
- `buildSummaryBar()`：渲染月度汇总（>=2 条数据才显示）
- 日历前后翻月 / 切 Tab / 点「今天」→ 自动关闭详情面板

## 农历日历

农历数据基于 2026 年月首查找表（`LUNAR_STARTS`），覆盖全年。仅 2026 年精确，跨年导航可能不准。

## 样式

所有 CSS 变量定义在 `:root` 中，色值统一，与 house 项目一致。
