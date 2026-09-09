// 厨房工作台 · 统计：月度 KPI、高频菜品、厨师排行（全部基于真实记录计算）

import { findRecipeForDish, payload } from './data';
import { st } from './state';
import { pad } from '../../lib/helpers';
import { esc, fmtMin, fmtMoney, parseMin } from './ui';

interface DishRow {
  date: string;
  meal: string;
  name: string;
  madeBy: string;
  cost: number | null;
  min: number | null;
}

function flattenDishes(): DishRow[] {
  const P = payload();
  const rows: DishRow[] = [];
  for (const [date, meals] of Object.entries(P.foodRecords)) {
    for (const meal of meals) {
      const dishes = meal.dishes || [];
      const obj = dishes.length > 0 && typeof dishes[0] === 'object';
      const single = dishes.length === 1;
      const wholeCost = meal.cost ?? (obj ? dishes.reduce<number>((s, d: any) => s + (Number(d.cost) || 0), 0) : null);
      const wholeMin = parseMin(meal.prep) + parseMin(meal.shopping) + parseMin(meal.cleanup);
      for (const d of dishes) {
        const dd = (obj ? d : null) as { name: string; madeBy?: string; cost?: number } | null;
        rows.push({
          date,
          meal: meal.meal || '餐',
          name: dd ? String(dd.name) : String(d),
          madeBy: dd?.madeBy || meal.chef || '',
          cost: dd && dd.cost != null ? Number(dd.cost) : single ? Number(wholeCost ?? NaN) : null,
          min: single && wholeMin > 0 ? wholeMin : null,
        });
      }
    }
  }
  return rows;
}

export interface MonthAgg {
  days: number;
  meals: number;
  dishes: number;
  cost: number;
  min: number;
}

export function monthAgg(prefix: string): MonthAgg {
  const P = payload();
  const agg: MonthAgg = { days: 0, meals: 0, dishes: 0, cost: 0, min: 0 };
  for (const [date, meals] of Object.entries(P.foodRecords)) {
    if (!date.startsWith(prefix)) continue;
    agg.days++;
    for (const meal of meals) {
      agg.meals++;
      const dishes = meal.dishes || [];
      const obj = dishes.length > 0 && typeof dishes[0] === 'object';
      agg.dishes += dishes.length;
      agg.min += parseMin(meal.prep) + parseMin(meal.shopping) + parseMin(meal.cleanup);
      agg.cost += meal.cost ?? (obj ? dishes.reduce((s, d: any) => s + (Number(d.cost) || 0), 0) : 0);
    }
  }
  return agg;
}

export function currentPrefix(): string {
  return `${st.year}-${pad(st.month)}`;
}
export function prevPrefix(): string {
  const date = new Date(st.year, st.month - 2, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function kpisHtml(prefix: string): string {
  const agg = monthAgg(prefix);
  const avg = agg.meals ? agg.cost / agg.meals : 0;
  const timeStr = fmtMin(agg.min);
  const kpi = (icon: string, tone: string, label: string, value: string) => `
    <div class="k-kpi" data-k-hover="kpi:${label}">
      <span class="k-kpi-icon tone-${tone}">${icon}</span>
      <div class="k-kpi-copy"><span class="k-kpi-label">${label}</span><span class="k-kpi-value">${value}</span></div>
    </div>`;
  return `<div class="k-kpis-inner">
    ${kpi('🍳', 'primary', '本月做饭', `<span>${agg.days}</span><small> 天</small>`)}
    ${kpi('💰', 'amber', '本月花费', agg.meals ? `<span>${fmtMoney(agg.cost) || '¥0'}</span>` : `<span>—</span>`)}
    ${kpi('🍽️', 'green', '均费 / 餐', avg ? `<span>${fmtMoney(avg)}</span>` : `<span>—</span>`)}
    ${kpi('⏱️', 'info', '本月用时', timeStr ? `<span>${esc(timeStr)}</span>` : `<span>—</span>`)}
  </div>`;
}

export function kpiPopoverHtml(label: string): string {
  const agg = monthAgg(currentPrefix());
  const prevAgg = monthAgg(prevPrefix());
  const lines: string[] = [];
  const line = (s: string) => `<p class="k-pop-line">${s}</p>`;
  const changeOf = (cur: number, prev: number) => {
    if (!prev) return '';
    const pct = Math.round(((cur - prev) / prev) * 100);
    return pct >= 0 ? `较上月 +${pct}%` : `较上月 ${pct}%`;
  };
  if (label === '本月做饭') {
    lines.push(line(`下厨 ${agg.days} 天 · ${agg.meals} 顿饭 · ${agg.dishes} 道菜`));
    const ch = changeOf(agg.days, prevAgg.days);
    if (ch) lines.push(line(ch));
  } else if (label === '本月花费') {
    lines.push(line(`共 ${agg.meals} 顿饭，平均每餐 ${agg.meals ? fmtMoney(agg.cost / agg.meals) || '¥0' : '—'}`));
    const ch = changeOf(agg.cost, prevAgg.cost);
    if (ch) lines.push(line(ch));
  } else if (label === '均费 / 餐') {
    lines.push(line(`本月总花费 ${fmtMoney(agg.cost) || '¥0'}`));
    lines.push(line(`本月下厨 ${agg.meals} 顿饭`));
  } else if (label === '本月用时') {
    lines.push(line(`总用时 ${fmtMin(agg.min) || '—'}`));
    const ch = changeOf(agg.min, prevAgg.min);
    if (ch) lines.push(line(ch));
  }
  if (!lines.length) lines.push(line('这个月还没有做菜记录，来一桌好菜吧～'));
  return `<div class="k-pop-title">${esc(label)}</div>${lines.join('')}`;
}

// ── 高频菜品 ────────────────────────────────────────────────
interface DishAgg {
  name: string;
  count: number;
  rows: DishRow[];
}

export function topDishes(limit = 5): DishAgg[] {
  const map = new Map<string, DishAgg>();
  for (const r of flattenDishes()) {
    let d = map.get(r.name);
    if (!d) {
      d = { name: r.name, count: 0, rows: [] };
      map.set(r.name, d);
    }
    d.count++;
    d.rows.push(r);
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.rows[0].date.localeCompare(a.rows[0].date))
    .slice(0, limit);
}

export function frequentHtml(limit = 3): string {
  const top = topDishes(limit);
  if (!top.length) {
    return `<div class="k-card-head"><h3 class="k-card-title">🥘 高频菜品</h3></div>
      <div class="k-card-empty">做过几次就会有统计啦</div>`;
  }
  const max = Math.max(1, top[0].count);
  const rows = top
    .map((d, i) => `
      <button class="k-freq-row" type="button" data-k-hover="dish:${esc(d.name)}" data-k-dish="${esc(d.name)}">
        <span class="k-rank">${i + 1}</span>
        <span class="k-freq-name">${esc(d.name)}</span>
        <span class="k-freq-bar"><i style="width:${Math.round((d.count / max) * 100)}%"></i></span>
        <span class="k-freq-count">${d.count} 次</span>
      </button>`)
    .join('');
  return `<div class="k-card-head"><h3 class="k-card-title">🥘 高频菜品</h3></div>
    <div class="k-freq-list">${rows}</div>`;
}

export function dishPopoverHtml(name: string): string {
  const P = payload();
  const target = topDishes(999).find(x => x.name === name);
  if (!target) return `<div class="k-pop-title">${esc(name)}</div><p class="k-pop-line">暂无记录</p>`;
  const last = target.rows.reduce((a, b) => (a.date > b.date ? a : b));
  const avgCost = avgOf(target.rows.map(r => r.cost));
  const avgMin = avgOf(target.rows.map(r => r.min));
  const day = new Date(`${last.date}T00:00:00`);
  const dateStr = `${day.getMonth() + 1}.${day.getDate()}`;
  const recipe = findRecipeForDish(name, P.recipes);
  const recipeLink = recipe
    ? `<button class="k-link-btn" type="button" data-k-open-recipe="${esc(recipe.id)}">查看菜谱「${esc(recipe.title)}」→</button>`
    : '';
  return `
    <div class="k-pop-title">${esc(name)}</div>
    <p class="k-pop-line">最近 · ${dateStr}（${esc(last.meal)}）· 累计 ${target.count} 次</p>
    ${avgCost != null ? `<p class="k-pop-line">平均花费 ${fmtMoney(avgCost)}</p>` : ''}
    ${avgMin != null ? `<p class="k-pop-line">平均用时 ${fmtMin(avgMin)}</p>` : ''}
    ${recipeLink}`;
}

function avgOf(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── 厨师排行 ────────────────────────────────────────────────
export function chefRankingHtml(): string {
  const P = payload();
  const chefs = new Map<string, { count: number; cost: number }>();
  for (const meals of Object.values(P.foodRecords)) {
    for (const meal of meals) {
      const dishes = meal.dishes || [];
      const obj = dishes.length > 0 && typeof dishes[0] === 'object';
      if (obj) {
        for (const d of dishes as any[]) {
          const madeBy = String(d.madeBy || '未知');
          const c = chefs.get(madeBy) || { count: 0, cost: 0 };
          c.count++;
          c.cost += Number(d.cost) || 0;
          chefs.set(madeBy, c);
        }
      } else {
        const madeBy = meal.chef || '未知';
        const c = chefs.get(madeBy) || { count: 0, cost: 0 };
        c.count += dishes.length;
        c.cost += Number(meal.cost) || 0;
        chefs.set(madeBy, c);
      }
    }
  }
  const rank = [...chefs.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 3);
  if (!rank.length) {
    return `<div class="k-card-head"><h3 class="k-card-title">🏆 厨师排行</h3></div>
      <div class="k-card-empty">谁是大厨，做几顿就知道啦</div>`;
  }
  const medals = ['🥇', '🥈', '🥉'];
  const rows = rank
    .map(([name, d], i) => `
      <div class="k-chef-row">
        <span class="k-rank">${medals[i] || `${i + 1}`}</span>
        <span class="k-chef-name">${esc(name)}</span>
        <span class="k-chef-count">${d.count} 道</span>
        <span class="k-chef-cost">${fmtMoney(d.cost) || ''}</span>
      </div>`)
    .join('');
  return `<div class="k-card-head"><h3 class="k-card-title">🏆 厨师排行</h3></div>
    <div class="k-chef-list">${rows}</div>`;
}

// ── 某道菜（非菜谱）的记录抽屉 ──────────────────────────────
export function dishDrawerHtml(name: string): string {
  const target = topDishes(999).find(x => x.name === name);
  const P = payload();
  const recipe = P.recipes.find(r => r.title === name);
  let items = '';
  if (target) {
    items = target.rows
      .slice()
      .reverse()
      .map(r => {
        const day = new Date(`${r.date}T00:00:00`);
        const dateStr = `${day.getFullYear()}.${day.getMonth() + 1}.${day.getDate()}`;
        const parts = [esc(r.meal)];
        if (r.madeBy) parts.push(`${esc(r.madeBy)} 做`);
        if (r.cost != null) parts.push(`<b>${fmtMoney(r.cost)}</b>`);
        return `<div class="k-meta-list-item"><span class="k-meta-list-date">${dateStr}</span><span class="k-meta-list-rest">${parts.join(' · ')}</span></div>`;
      })
      .join('');
  } else {
    items = `<div class="k-card-empty">还没做过这道菜</div>`;
  }
  const recipeLine = recipe
    ? `<p class="k-note-line">已有菜谱「${esc(recipe.title)}」<button class="k-link-btn" type="button" data-k-open-recipe="${esc(recipe.id)}">查看菜谱 →</button></p>`
    : `<p class="k-note-line">这道菜还没有菜谱，把它写进 <code>cooking-tips/</code> 就能在工作台里看到～</p>`;
  return `<p class="k-drawer-lead">${esc(name)} 的所有做菜记录（共 ${target?.count ?? 0} 次）</p>
    <div class="k-meta-list">${items}</div>${recipeLine}`;
}
