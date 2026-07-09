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

## Tab 一览

| Tab | id | 内容 |
|-----|----|------|
| 生活备忘录及物资采购 | `follow-up` | 待办 / 生活备忘 / 物资采购（折叠清单） |
| 水电追踪 | `utility-tracking` | 当月电费日历 |
| 美食记录 | `food-records` | 当月做饭日历 |
| 美食地图 | `food-map` | 校外/校内探店卡片 |
| 关系时间线 | `relationship-timeline` | 旅游 + 西安 walk + 吵架复盘（分类切换） |
| 猪窝地图 | `home-map` | 户型图 + 物品存放 |

### 关系时间线（`relationship-timeline`）

顶部用分类标签在 **全部 / 旅行 ✈️ / 西安 walk 🚶 / 吵架复盘 💢** 之间切换，下方为按月份聚合的时间线。旅行与西安 walk 沿用原数据结构；吵架复盘为新增记录。

### 吵架复盘数据

在 `data.js` 的 `quarrelRecords` 数组中追加对象，例如：

```js
{
  date: '2026-07-09',            // 吵架当天
  title: '关于…的争执',           // 一句话概括
  severity: '轻微',               // 轻微 / 中等 / 严重（显示在徽章）
  participants: ['过马路', '耙耙柑'],
  trigger: '直接起因',
  myView: '我当时怎么想',
  theirView: '过马路怎么想',
  rootCause: '深层原因',
  resolution: '最后怎么和好',
  lesson: '复盘结论 / 以后怎么避免'
}
```

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
