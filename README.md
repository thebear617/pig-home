# 猪窝

纯静态个人工具页面，汇总入住后的待办事项、生活备忘、物资采购清单、水电追踪、美食记录和物品位置记录。

在线地址：https://thebear617.github.io/pig-home/

## 文件结构

```
├── index.html          # 页面入口
├── css/
│   └── style.css       # 所有样式
└── js/
    ├── data.js         # 数据层：phases / utilityRecords / foodRecords / locations
    └── app.js          # 渲染引擎、tab 切换、日历交互
```

## 四个 Tab

### 1. 生活备忘录及物资采购（`follow-up`）

- **后续待办事项** — 即将到期的待处理事项
- **生活备忘录** — 天然气、水电缴费、门锁、马桶等日常操作指引
- **第二轮物资采购** — 按房间分类的采购清单，已购项标 ✅

每个分区可折叠展开/收起。

### 2. 水电追踪（`utility-tracking`）

- 当月日历视图，显示农历 + 公历日期
- 今天用红圈高亮
- 有记录的天显示剩余电费（¥xx.xx）
- 点击有数据的格子 → 详情面板显示当日消耗
- 详情面板下方 → 月度汇总栏（累计用电、日均、记录天数）

### 3. 猪窝地图（`home-map`）

- **户型图** — SVG 可视化，标注各房间位置和面积
- **重要物品存放** — 卡片形式记录合同等物品的存放位置

### 4. 美食记录（`food-records`）

- 当月日历视图，与水电追踪共用相同日历结构
- 有做饭记录的天显示 🍳 图标
- 点击有数据的格子 → 卡片形式展示当日菜品、花费、主厨及帮手
- 详情面板下方 → 月度汇总栏（做饭次数、总花费）
- 数据结构：在 `data.js` 的 `foodRecords` 中添加 `YYYY-MM-DD` 键值对，每条记录包含 `dishes`、`cost`、`chef`、`helper` 字段

## 开发

### 新增 Tab

在 `data.js` 的 `phases` 数组中追加对象，再到 `app.js` 的 `buildPhaseContent()` 中新增对应 type 的分发。

### 新增水电数据

在 `data.js` 的 `utilityRecords` 中添加 `YYYY-MM-DD` 键值对即可。

### 新增美食数据

在 `data.js` 的 `foodRecords` 中添加 `YYYY-MM-DD` 键值对，例如：

```js
'2026-06-29': {
  dishes: ['凉拌西兰花和萝卜（3元）', '可乐鸡翅（28元）'],
  cost: 31,
  chef: '过马路',
  helper: '耙耙柑'
}
```

### 新增物品位置

在 `data.js` 的 `locations` 数组中追加 `{ item, location }` 对象。
