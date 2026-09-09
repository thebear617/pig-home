// 厨房工作台 · 全局搜索：菜谱 / 做菜记录里的菜 / 食材库存 / 价格
// 结果浮层展示，点选后交给 index 分发到对应 Drawer。

import { payload } from './data';
import { topDishes } from './stats';
import { esc } from './ui';

export function buildSearchHtml(raw: string): string {
  const q = raw.trim().toLowerCase();
  const P = payload();
  if (!q) return '';

  const recipeRows = P.recipes
    .filter(r => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
    .slice(0, 8)
    .map(r => item('recipe', r.id, r.icon || '🍳', r.title, r.category))
    .join('');

  const dishRows = topDishes(999)
    .filter(d => d.name.toLowerCase().includes(q))
    .slice(0, 8)
    .map(d => item('dish', d.name, '🍽️', d.name, `做过 ${d.count} 次`))
    .join('');

  const pantryRows = P.pantry
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 6)
    .map(p => item('pantry', p.name, '🧊', p.name, `${p.place} · ${p.bought} 购入`))
    .join('');

  const priceRows = P.prices
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 6)
    .map(p => item('price', p.name, '🏷️', p.name, p.price || '价格待补'))
    .join('');

  const groups = [
    recipeRows ? group('📖 菜谱', recipeRows) : '',
    dishRows ? group('🍳 做过的菜', dishRows) : '',
    pantryRows ? group('🧊 食材库存', pantryRows) : '',
    priceRows ? group('🏷️ 价格', priceRows) : '',
  ].join('');

  return groups || `<div class="k-search-empty">没有找到「${esc(raw.trim())}」<br><span>换个词试试？比如菜名、食材名</span></div>`;
}

function group(name: string, rows: string): string {
  return `<div class="k-search-group"><div class="k-search-group-name">${name}</div>${rows}</div>`;
}

function item(kind: string, key: string, icon: string, title: string, sub: string): string {
  return `
  <button type="button" class="k-search-item" data-kind="${kind}" data-key="${esc(key)}">
    <span class="k-search-emoji">${icon}</span>
    <span class="k-search-main"><b>${esc(title)}</b><em>${esc(sub)}</em></span>
    <span class="k-chevron">›</span>
  </button>`;
}
