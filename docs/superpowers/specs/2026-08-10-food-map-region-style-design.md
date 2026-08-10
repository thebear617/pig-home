# FoodMap 区域目录样式修复设计

## 目标

恢复美食地图在字段从 `area/location` 合并为 `region` 后丢失的区域目录样式，解决区域按钮显示为浏览器默认按钮的问题。

## 范围

- 修改 `src/styles/global.css` 中区域目录的选择器，使其与 `FoodMap.astro` 当前使用的 `foodmap-region-*` 类名一致。
- 保留原有桌面端纵向目录、选中态和移动端横向滚动行为。
- 将区域内容的隐藏规则同步到 `foodmap-region-content[hidden]`。
- 本次不修改美食地点数据、字段 schema、搜索逻辑或地图逻辑。

## 验证

- `npm run build` 验证 Astro 构建。
- `git diff --check` 验证无空白错误。
- 检查构建后的 `/food-map/` HTML，确认区域按钮使用现有 `foodmap-region-*` 类名，且无旧字段选择器残留在 FoodMap 专属 CSS 中。
