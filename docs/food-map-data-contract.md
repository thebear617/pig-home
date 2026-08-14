# 美食地图数据契约

这份约定服务于猪窝的多城市美食地图。当前地图包含西安和南宁，城市是地点数据的一级维度；区域、类型和状态都在城市内部筛选。

## 数据层级

```text
city
└── region
    └── name
```

- `city`：城市名称，例如 `西安`、`南宁`。必填。
- `region`：城市内的地图区域 + 具体地点标签。例如 `钟楼`、`白苍岭`、`广西大学`、`南铁夜市火车站`、`水街夜市百货大楼`。必填。
- `name`：店铺或摊位名称。必填。

> 历史字段 `area`（校内/校外）与 `location` 已删除；原 `location` 的语义并入 `region`。

## 地点属性

- `category`：粉、烧烤、甜品、菜馆等主分类。
- `tags`：用于后续图层筛选，例如 `南宁`、`烧烤`、`想吃`。
- `status`：可选的明确状态：`tried`、`recommend`、`wanna`、`no`。未填写时，旧页面继续根据评价文字推断状态。
- `address`：高德或人工确认后的详细地址。具体门牌、街道路名。
- `dishes`：菜品、价格和单品评价。
- `note`：整体评价和补充说明。
- `date`：探店日期。

## 地图属性

- `lng` / `lat`：高德坐标，经度在前、纬度在后；没有确认时可以暂时不填。
- `coordinateStatus`：`confirmed`、`pending` 或 `unavailable`，默认是 `pending`。
- `coordinateSource`：`amap` 或 `manual`，记录坐标来源。

没有可靠坐标的地点不会硬放到地图上，而是在后续 UI 中进入”待确认地点”列表。

## 示例

```yaml
---
name: 真好吃牛杂
city: 南宁
region: 英华桥水果一条街白沙店
category: 牛杂
address: 南宁市江南区……
tags:
  - 南宁
  - 牛杂
  - 想吃
status: wanna
lng: 108.32
lat: 22.79
coordinateStatus: confirmed
coordinateSource: amap
note: 想去试试
---
```

## 页面实施顺序

1. 先按 `city` 切换西安和南宁。
2. 再在当前城市内按 `region`、`category`、`status` 筛选。
3. 地图只显示当前城市且坐标已确认的地点。
4. 列表和详情可以显示所有地点，包括待确认地点。

## 地图开发配置

地图页面使用高德 Web 平台的 JS API Key。开发时可复制 `.env.example` 为 `.env.local`，填写：

```env
PUBLIC_AMAP_JS_KEY=你的高德 JS API Key
PUBLIC_AMAP_JS_SECURITY_CODE=你的安全配置（如当前高德方案要求）
```

JS API Key 会出现在浏览器请求中，因此需要在高德控制台配置网站域名白名单。不要把 Web Service Key 填入这里，也不要提交 `.env.local`。

## 区域评价（food-regions）

夜市 / 一条街 / 集中区域**本身**也可以作为评价对象，独立于具体店铺。这类记录放在 `src/content/food-regions/`（一个文件一个区域），schema 见 `content.config.ts` 的 `foodRegion`。

### 字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | string | ✅ | 区域名（如「中山路夜市」） |
| `city` | string | ✅ | 南宁 / 西安 |
| `category` | string | ✅ | **具体场所类型枚举**（非菜系）：`夜市地摊` / `商业街`，遇到新的再补充 |
| `address` | string | ✅ | 详细地址（用于定位） |
| `note` | string | ✅ | 区域整体评价（值得去的点、避坑、人气等） |
| `status` | enum | ✅ | 必填状态：`recommend` / `tried` / `no` / `wanna` |
| `score` | number | — | **10 分制评分**（0-10），可选；与 `status` 一起用于渲染 |
| `lng`/`lat` | number | ✅ | 区域中心点坐标（必填） |

### 示例

```yaml
---
name: 中山路夜市
city: 南宁
category: 夜市地摊
address: 青秀区中山路美食街
note: 最干净的一条夜市，但没那么多烟火气……
status: recommend
score: 7
lng: 108.323482
lat: 22.809688
---
```

> 区域记录的 `status` 必填，`score` 可选；展示层同时使用两者：`status` 表达状态，`score` 驱动评分视觉档位（≥7 推荐 / 4-6 一般 / ≤3 不推荐）。

### 与 food-places 的关系

- **food-places**：具体店铺（甘家界柠檬鸭、小杜果酱烧烤……），`region` 字段指向它所属片区。
- **food-regions**：夜市 / 商业街等**整条街或集中区域**本身的评价，用 `address` 定位。
- 关联方式：food-place 的 `region` 名对应某个 food-region 的 `name`（如「中山路夜市」下聚合同为中山路片区的店）。
