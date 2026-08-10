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
