// 厨房工作台 · 日期详情（右侧常驻面板 / 窄屏时移入 Drawer-BottomSheet）

import { getLunarInfo, getLunarDayName } from '../../lib/helpers';
import { payload } from './data';
import { dayData, dishName, groupedMeals } from './meals';
import { todayKey } from './state';
import { assetUrl, esc, fmtMin, fmtMoney, parseYmd, weekdayLabel } from './ui';
import type { DishBrief } from '../../lib/kitchen-types';

const highlightKey = (k: string) => `pig.kitchen.daynote.${k}`;

export function loadHighlight(k: string): string {
  try {
    return localStorage.getItem(highlightKey(k)) ?? '';
  } catch {
    return '';
  }
}

/** 右侧详情面板 / 移动 Drawer 共用的内容 */
export function dayPanelHtml(key: string): string {
  const dd = dayData(key);
  const day = parseYmd(key);
  const lunar = getLunarInfo(day.getFullYear(), day.getMonth() + 1, day.getDate());
  const isToday = key === todayKey;

  const head = `
    <div class="k-day-head">
      <div class="k-day-head-main">
        <span class="k-day-date">${day.getMonth() + 1}月${day.getDate()}日</span>
        <span class="k-day-week">${weekdayLabel(day)} · ${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>
        ${isToday ? '<span class="k-badge k-badge-today">今天</span>' : ''}
      </div>
      <button class="k-text-btn" type="button" data-k-edit-day="${key}">编辑记录</button>
    </div>`;

  if (!dd.meals.length) {
    const hint = isToday ? '今天还没有做菜记录，累了一天就点个外卖犒劳自己吧～' : '这一天没有做菜记录，好好吃饭啦';
    return `<div class="k-card k-day-card">${head}
      <div class="k-card-empty k-day-empty">🍽️<br>${hint}</div>
    </div>`;
  }

  const cover = dd.meals.find(m => m.image);
  const coverHtml = cover?.image
    ? `<div class="k-day-cover"><img src="${esc(assetUrl(cover.image))}" alt="当天照片" loading="lazy" /></div>`
    : '';

  const meals = groupedMeals(key)
    .map(g => {
      const chips = g.meals
        .map(m => {
          const dishes = (m.dishes || []).map(d => dishChip(key, d)).join('');
          const meta: string[] = [];
          if (m.cost != null) meta.push(`花费 ${fmtMoney(m.cost)}`);
          if (m.chef) meta.push(`${esc(m.chef)} 主厨`);
          if (m.helper) meta.push(`${esc(m.helper)} 帮手`);
          return `<div class="k-meal">
            <div class="k-meal-tag-row">
              <span class="k-meal-tag">${esc(m.meal || g.label)}</span>
              ${meta.length ? `<span class="k-meal-meta">${meta.join(' · ')}</span>` : ''}
            </div>
            <div class="k-dish-chips">${dishes}</div>
          </div>`;
        })
        .join('');
      return `<div class="k-meal-group"><div class="k-meal-group-title">${esc(g.label)}</div>${chips}</div>`;
    })
    .join('');

  const stats = [
    dd.cost != null ? { icon: '💰', label: '花费', value: fmtMoney(dd.cost) || '—' } : null,
    dd.min > 0 ? { icon: '⏱️', label: '用时', value: fmtMin(dd.min) } : null,
    { icon: '🍽️', label: '菜品', value: `${dd.dishCount} 道` },
  ]
    .filter(Boolean)
    .map(s => `<div class="k-stat-cell"><span class="k-stat-icon">${s!.icon}</span><span class="k-stat-label">${s!.label}</span><span class="k-stat-value">${s!.value}</span></div>`)
    .join('');

  const saved = loadHighlight(key);
  const highlight = `
    <div class="k-day-section">
      <div class="k-day-section-title">✨ 今日亮点</div>
      <textarea class="k-day-note" data-k-note="${key}" rows="2" maxlength="200" placeholder="写一句心得：比如「鱼香肉丝味道很赞，下次多放点木耳」…">${esc(saved).replace(/\n/g, '&#10;')}</textarea>
    </div>`;

  return `<div class="k-card k-day-card">${head}${coverHtml}
    <div class="k-day-body">
      ${meals}
      <div class="k-stat-grid">${stats}</div>
      ${highlight}
    </div>
  </div>`;
}

function dishChip(key: string, d: string | DishBrief): string {
  const name = dishName(d);
  const madeBy = typeof d === 'object' ? d.madeBy : '';
  const cost = typeof d === 'object' && d.cost != null ? d.cost : null;
  const title = [madeBy && `${madeBy} 做`, cost != null ? fmtMoney(cost) : ''].filter(Boolean).join(' · ');
  return `<button type="button" class="k-dish-chip" data-k-dish="${esc(name)}" data-k-date="${key}" data-k-hover="dish:${esc(name)}" title="${esc(title)}">
    ${esc(name)}${cost != null ? `<span class="k-dish-cost">${fmtMoney(cost)}</span>` : ''}
  </button>`;
}

/** 「编辑记录」指引抽屉：数据在 food-records.ts，给出可复制的片段 */
export function editDayDrawerHtml(key: string): string {
  const meals = payload().foodRecords[key] || [];
  const json = JSON.stringify({ [key]: meals }, null, 2);
  return `
    <p class="k-note-line">做菜记录维护在数据源文件里（不是数据库）。改完在仓库跑一次构建就会回到这里。</p>
    <p class="k-note-line">文件：<code>home/src/data/food-records.ts</code></p>
    <p class="k-note-line">找到 <code>foodRecords</code> 里日期为 <code>${esc(key)}</code> 的条目，按同样格式修改即可。</p>
    <details class="k-code-details"><summary>查看 / 复制这条记录</summary>
      <pre class="k-code-pre"><code>${esc(json)}</code></pre>
    </details>
    <button class="k-btn k-btn-primary k-btn-block" type="button" data-k-copy>复制这段 JSON</button>
    <p class="k-hint-text">亮点笔记存在浏览器里，随数据一起展示；想要长期保存可以写进当天的日记。</p>`;
}
