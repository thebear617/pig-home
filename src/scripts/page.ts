import { escapeHtml, getLunarInfo, getLunarDayName, pad } from '../lib/helpers';

declare global {
  interface Window {
    __utilityRecords?: Record<string, { elecRemaining: number; recharge?: number }>;
    __foodRecords?: Record<string, any[]>;
    __hemaDayRecords?: Record<string, any>;
    __diaryRecords?: Record<string, any>;
    __specialEvents?: Record<string, any>;
    __expenseRecords?: any[];
    __expenseCategories?: any[];
    __membershipRecords?: any[];
  }
}

type CalendarState = { year: number; month: number; selected: string | null };

const page = document.body.dataset.page || '';
const now = new Date();
const state: CalendarState = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  selected: null,
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function readQueryState() {
  const params = new URLSearchParams(window.location.search);
  const month = params.get('month');
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, value] = month.split('-').map(Number);
    if (value >= 1 && value <= 12) {
      state.year = year;
      state.month = value;
    }
  }
  const selected = params.get('date');
  state.selected = selected && /^\d{4}-\d{2}-\d{2}$/.test(selected) ? selected : null;
}

function writeQueryState() {
  const params = new URLSearchParams(window.location.search);
  params.set('month', `${state.year}-${pad(state.month)}`);
  if (state.selected) params.set('date', state.selected);
  else params.delete('date');
  history.replaceState(null, '', `${window.location.pathname}?${params}`);
}

function escape(value: unknown) {
  return escapeHtml(value);
}

function renderDesc(value: unknown) {
  // 先 escape HTML,再把 [text](url) 转成 <a>,仅支持 http/https
  return escapeHtml(value).replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline">${text}</a>`
  );
}

function assetUrl(value: string) {
  if (/^(?:https?:)?\//.test(value)) return value;
  return `${import.meta.env.BASE_URL}${value}`;
}

function monthTitle() {
  return `${state.year}年${state.month}月`;
}

function lunarText(year: number, month: number, day: number) {
  const lunar = getLunarInfo(year, month, day);
  return `<span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>`;
}

function previousCells(year: number, month: number, startDay: number) {
  let html = '';
  const previousLast = new Date(year, month - 1, 0).getDate();
  for (let i = 0; i < startDay; i++) {
    const day = previousLast - startDay + i + 1;
    html += `<div class="cal-cell cal-other-month">${lunarText(year, month - 1, day)}<span class="cal-date">${day}日</span></div>`;
  }
  return html;
}

function nextCells(year: number, month: number, startDay: number, days: number) {
  let html = '';
  const remainder = (7 - ((startDay + days) % 7)) % 7;
  for (let day = 1; day <= remainder; day++) {
    html += `<div class="cal-cell cal-other-month">${lunarText(year, month + 1, day)}<span class="cal-date">${day}日</span></div>`;
  }
  return html;
}

function calendarFrame(renderDay: (day: number, today: boolean) => string) {
  const firstDay = new Date(state.year, state.month - 1, 1).getDay();
  const days = new Date(state.year, state.month, 0).getDate();
  let html = previousCells(state.year, state.month, firstDay);
  for (let day = 1; day <= days; day++) {
    const today = state.year === now.getFullYear() && state.month === now.getMonth() + 1 && day === now.getDate();
    html += renderDay(day, today);
  }
  return html + nextCells(state.year, state.month, firstDay, days);
}

function setTitle(selector: string, value = monthTitle()) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function foodGrid() {
  const records = window.__foodRecords || {};
  return calendarFrame((day, today) => {
    const key = dateKey(state.year, state.month, day);
    const hasData = Boolean(records[key]);
    const classes = ['cal-cell'];
    if (today) classes.push('cal-today');
    if (hasData) classes.push('cal-has-data');
    if (state.selected === key) classes.push('cal-selected');
    return `<div class="${classes.join(' ')}" data-date="${key}">${lunarText(state.year, state.month, day)}<span class="cal-date${today ? ' cal-date-today' : ''}">${day}日</span>${hasData ? '<span class="cal-balance food-indicator">🍳</span>' : ''}</div>`;
  });
}

function foodDetail(key: string | null) {
  const meals = key ? window.__foodRecords?.[key] : null;
  if (!meals?.length) return '';
  const day = new Date(`${key}T00:00:00`);
  let html = `<div class="detail-panel food-detail"><div class="detail-header"><span class="detail-title">${day.getMonth() + 1}月${day.getDate()}日 美食记录</span><button class="detail-close util-dc">✕</button></div><div class="detail-body">`;
  for (const [index, meal] of meals.entries()) {
    if (index) html += '<div class="food-divider"></div>';
    const dishes = meal.dishes || [];
    const objectDishes = dishes.length > 0 && typeof dishes[0] === 'object';
    html += `<div class="food-meal-block"><div class="food-meal-head"><span class="food-meal-tag">${escape(meal.meal || '餐')}</span></div><div class="food-dishes">`;
    for (const dish of dishes) {
      if (objectDishes) {
        html += `<div class="food-dish-card"><span class="food-dish-icon">🥘</span><div class="food-dish-body"><div class="food-dish-head"><span class="food-dish-name">${escape(dish.name)}</span><span class="food-dish-by">${escape(dish.madeBy || '')} 做</span>${dish.cost != null ? `<span class="food-dish-cost">${dish.cost} 元</span>` : ''}</div>${dish.note ? `<span class="food-dish-note">${escape(dish.note)}</span>` : ''}</div></div>`;
      } else {
        html += `<div class="food-dish-card"><span class="food-dish-icon">🥘</span><span class="food-dish-name">${escape(dish)}</span></div>`;
      }
    }
    html += '</div>';
    if (meal.image) html += `<div class="food-photo"><img src="${escape(assetUrl(meal.image))}" alt="照片" loading="lazy"></div>`;
    const cost = meal.cost ?? (objectDishes ? dishes.reduce((sum: number, dish: any) => sum + (dish.cost || 0), 0) : null);
    html += '<div class="food-meta-grid">';
    if (cost != null) html += `<div class="food-meta-item"><span class="food-meta-label">花费</span><span class="food-meta-value food-cost">${cost} 元</span></div>`;
    if (!objectDishes && meal.chef) html += `<div class="food-meta-item"><span class="food-meta-label">主厨</span><span class="food-meta-value">${escape(meal.chef)}</span></div>`;
    if (!objectDishes && meal.helper) html += `<div class="food-meta-item"><span class="food-meta-label">帮手</span><span class="food-meta-value">${escape(meal.helper)}</span></div>`;
    if (meal.shopping) html += `<div class="food-meta-item"><span class="food-meta-label">买菜</span><span class="food-meta-value">${escape(meal.shopping)} 分钟</span></div>`;
    if (meal.prep) html += `<div class="food-meta-item"><span class="food-meta-label">餐前备菜</span><span class="food-meta-value">${escape(meal.prep)} 分钟</span></div>`;
    if (meal.cleanup) html += `<div class="food-meta-item"><span class="food-meta-label">收拾后厨</span><span class="food-meta-value">${escape(meal.cleanup)} 分钟</span></div>`;
    html += '</div></div>';
  }
  return `${html}</div></div>`;
}

function parseMin(v: number | string | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return parseInt(v, 10) || 0;
}

function formatMin(min: number): string {
  if (min <= 0) return '';
  if (min < 60) return `${min}分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}小时${m}分钟` : `${h}小时`;
}

const RECENT_PER_PAGE = 3;
let recentPage = 0;

function monthlyStatsHtml(): string {
  const records = window.__foodRecords || {};
  const prefix = `${state.year}-${pad(state.month)}`;
  let days = 0, totalCost = 0, totalMin = 0, mealCount = 0;
  for (const [date, meals] of Object.entries(records)) {
    if (!date.startsWith(prefix)) continue;
    days++;
    for (const meal of meals) {
      mealCount++;
      const dishes = meal.dishes || [];
      const obj = dishes.length > 0 && typeof dishes[0] === 'object';
      totalMin += parseMin(meal.prep) + parseMin(meal.shopping) + parseMin(meal.cleanup);
      totalCost += meal.cost ?? (obj ? dishes.reduce((s: number, d: any) => s + (d.cost || 0), 0) : 0);
    }
  }
  if (!days) return '<div class="food-kanban-head"><h3 class="food-kanban-title">📊 本月统计</h3></div><div class="food-kanban-empty">本月暂无记录</div>';
  const avg = mealCount ? (totalCost / mealCount).toFixed(1) : '0';
  const timeStr = formatMin(totalMin);
  return `<div class="food-kanban-head"><h3 class="food-kanban-title">📊 本月统计</h3></div>
<div class="food-stats-grid">
  <div class="food-stat-item"><span class="food-stat-label">做饭</span><span class="food-stat-value">${days}天</span></div>
  <div class="food-stat-item"><span class="food-stat-label">花费</span><span class="food-stat-value food-cost">¥${totalCost.toFixed(0)}</span></div>
  <div class="food-stat-item"><span class="food-stat-label">均费</span><span class="food-stat-value">¥${avg}</span></div>
  <div class="food-stat-item"><span class="food-stat-label">用时</span><span class="food-stat-value">${timeStr || '-'}</span></div>
</div>`;
}

function topDishesHtml(): string {
  const records = window.__foodRecords || {};
  const count = new Map<string, number>();
  for (const meals of Object.values(records)) {
    for (const meal of meals) {
      const dishes = meal.dishes || [];
      const obj = dishes.length > 0 && typeof dishes[0] === 'object';
      for (const d of dishes) {
        const name = obj ? d.name : String(d);
        count.set(name, (count.get(name) || 0) + 1);
      }
    }
  }
  const top = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!top.length) return '<div class="food-kanban-head"><h3 class="food-kanban-title">🥘 高频菜品</h3></div><div class="food-kanban-empty">暂无数据</div>';
  const max = top[0][1];
  let html = '<div class="food-kanban-head"><h3 class="food-kanban-title">🥘 高频菜品</h3></div><div class="food-top-list">';
  for (const [name, n] of top) {
    const pct = Math.round((n / max) * 100);
    html += `<div class="food-top-item"><span class="food-top-name">${escape(name)}</span><span class="food-top-bar"><span class="food-top-fill" style="width:${pct}%"></span></span><span class="food-top-count">${n}次</span></div>`;
  }
  return html + '</div>';
}

function chefRankHtml(): string {
  const records = window.__foodRecords || {};
  const chefs = new Map<string, { count: number; cost: number }>();
  for (const meals of Object.values(records)) {
    for (const meal of meals) {
      const dishes = meal.dishes || [];
      const obj = dishes.length > 0 && typeof dishes[0] === 'object';
      if (obj) {
        for (const d of dishes) {
          const name = d.madeBy || '未知';
          const c = chefs.get(name) || { count: 0, cost: 0 };
          c.count++;
          c.cost += d.cost || 0;
          chefs.set(name, c);
        }
      } else {
        const name = meal.chef || '未知';
        const c = chefs.get(name) || { count: 0, cost: 0 };
        c.count += dishes.length;
        c.cost += meal.cost || 0;
        chefs.set(name, c);
      }
    }
  }
  const rank = [...chefs.entries()].sort((a, b) => b[1].count - a[1].count);
  if (!rank.length) return '<div class="food-kanban-head"><h3 class="food-kanban-title">🏆 厨师排行</h3></div><div class="food-kanban-empty">暂无数据</div>';
  const medals = ['🥇', '🥈', '🥉'];
  let html = '<div class="food-kanban-head"><h3 class="food-kanban-title">🏆 厨师排行</h3></div><div class="food-chef-list">';
  for (let i = 0; i < rank.length; i++) {
    const [name, data] = rank[i];
    const medal = medals[i] || `${i + 1}.`;
    html += `<div class="food-chef-item"><span class="food-chef-medal">${medal}</span><span class="food-chef-name">${escape(name)}</span><span class="food-chef-count">${data.count}道菜</span><span class="food-chef-cost">¥${data.cost.toFixed(0)}</span></div>`;
  }
  return html + '</div>';
}

function getRecentDishes() {
  const records = window.__foodRecords || {};
  const dates = Object.keys(records).sort().reverse();
  const list: { date: string; name: string; madeBy: string; min: number; cost: number | null; meal: string }[] = [];
  for (const date of dates) {
    for (const meal of records[date]) {
      const dishes = meal.dishes || [];
      const obj = dishes.length > 0 && typeof dishes[0] === 'object';
      const min = parseMin(meal.prep) + parseMin(meal.shopping) + parseMin(meal.cleanup);
      const cost = meal.cost ?? (obj ? dishes.reduce((sum: number, dish: any) => sum + (dish.cost || 0), 0) : null);
      for (const d of dishes) {
        list.push({
          date,
          name: obj ? d.name : String(d),
          madeBy: obj ? (d.madeBy || '') : (meal.chef || ''),
          min,
          cost,
          meal: meal.meal || '餐',
        });
      }
    }
  }
  return list;
}

function recentDishesHtml(): string {
  const dishes = getRecentDishes();
  const total = Math.max(1, Math.ceil(dishes.length / RECENT_PER_PAGE));
  if (recentPage >= total) recentPage = total - 1;
  if (recentPage < 0) recentPage = 0;
  const slice = dishes.slice(recentPage * RECENT_PER_PAGE, (recentPage + 1) * RECENT_PER_PAGE);
  let html = '<div class="food-recent-head"><h3 class="food-recent-title">🍳 最近几道菜</h3>';
  if (total > 1) {
    html += `<div class="food-recent-nav"><button class="food-recent-btn food-recent-prev"${recentPage === 0 ? ' disabled' : ''}>◀</button><span class="food-recent-num">${recentPage + 1} / ${total}</span><button class="food-recent-btn food-recent-next"${recentPage >= total - 1 ? ' disabled' : ''}>▶</button></div>`;
  }
  html += '</div><div class="food-recent-list">';
  for (const d of slice) {
    const day = new Date(`${d.date}T00:00:00`);
    const dateStr = `${day.getMonth() + 1}/${day.getDate()}`;
    const timeStr = formatMin(d.min);
    html += `<div class="food-recent-card"><div class="food-recent-top"><span class="food-recent-name">🥘 ${escape(d.name)}</span><span class="food-recent-date">${dateStr}</span></div><div class="food-recent-bot">`;
    html += `<span class="food-recent-meal">${escape(d.meal)}</span>`;
    if (d.madeBy) html += `<span class="food-recent-chef">${escape(d.madeBy)}做</span>`;
    if (d.cost != null) html += `<span class="food-recent-cost">💵 ${d.cost}元</span>`;
    if (timeStr) html += `<span class="food-recent-time">⏱ ${timeStr}</span>`;
    html += '</div></div>';
  }
  if (!slice.length) html += '<div class="food-recent-empty">暂无记录</div>';
  html += '</div>';
  return html;
}

function dailyGrid() {
  const diary = window.__diaryRecords || {};
  const expenses = window.__expenseRecords || [];
  const special = window.__specialEvents || {};
  const hema = window.__hemaDayRecords || {};
  const utility = window.__utilityRecords || {};
  return calendarFrame((day, today) => {
    const key = dateKey(state.year, state.month, day);
    const record = diary[key];
    const hasExpense = expenses.some(item => item.date === key);
    const monday = new Date(`${key}T00:00:00`).getDay() === 1;
    const event = special[key];
    const utilRecord = utility[key];
    const classes = ['cal-cell'];
    if (today) classes.push('cal-today');
    if (record || hasExpense || monday) classes.push('cal-has-data');
    if (monday) classes.push('cal-hema-day');
    if (state.selected === key) classes.push('cal-selected');
    if (event) classes.push('cal-special');
    return `<div class="${classes.join(' ')}" data-date="${key}">${lunarText(state.year, state.month, day)}<span class="cal-date${today ? ' cal-date-today' : ''}">${day}日</span>${hasExpense ? '<span class="cal-expense-dot" title="有支出"></span>' : ''}${monday ? '<span class="cal-hema-badge" title="盒马日">盒马日</span>' : ''}${event ? `<span class="cal-special-icons" title="${escape(event.keywords?.join('、'))}">${event.icons?.join('') || ''}</span>` : ''}${utilRecord ? `<span class="cal-utility-balance">¥${utilRecord.elecRemaining.toFixed(2)}</span>` : ''}</div>`;
  });
}

function dailyDetail(key: string | null) {
  if (!key) return '';
  const record = window.__diaryRecords?.[key];
  const expenses = (window.__expenseRecords || []).filter(item => item.date === key);
  const hema = window.__hemaDayRecords?.[key];
  const utility = window.__utilityRecords?.[key];
  const monday = new Date(`${key}T00:00:00`).getDay() === 1;
  if (!record && !expenses.length && !hema && !monday && !utility) return '';
  const day = new Date(`${key}T00:00:00`);
  let html = `<div class="detail-panel"><div class="detail-header"><span class="detail-title">${day.getMonth() + 1}月${day.getDate()}日</span><button class="detail-close util-dc">✕</button></div><div class="detail-body">`;
  if (utility) {
    html += `<div class="detail-row"><span class="detail-label">电费余额</span><span class="detail-val">¥${utility.elecRemaining.toFixed(2)}</span></div>`;
    if (utility.recharge) html += `<div class="detail-row"><span class="detail-label">当日充值</span><span class="detail-val" style="color:#047857">+¥${utility.recharge.toFixed(2)}</span></div>`;
  }
  if (record?.tasks?.length) {
    html += `<div class="detail-row"><span class="detail-label">当日日程</span><span class="detail-val">已完成 ${record.value ?? record.tasks.filter((task: any) => task.status === 'x').length} / 共 ${record.tasks.length}</span></div><div class="detail-tasks">`;
    record.tasks.forEach((task: any, index: number) => { html += `<div class="task-item"><span class="task-num">${index + 1}</span><span class="task-time">${escape(task.time)}</span><span class="task-text">${renderDesc(task.desc)}</span></div>`; });
    html += '</div>';
  }
  if (expenses.length) {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    html += `<div class="detail-row"><span class="detail-label">当日支出</span><span class="detail-val expense-amount">¥${total.toFixed(2)}</span></div><div class="detail-expenses">`;
    expenses.forEach(item => { html += `<div class="expense-detail-item"><span class="expense-detail-sub">${escape(item.sub)}</span>${item.note ? `<span class="expense-detail-note">${escape(item.note)}</span>` : ''}<span class="expense-detail-amount">¥${item.amount.toFixed(2)}</span></div>`; });
    html += '</div>';
  }
  if (hema || monday) {
    html += '<div class="detail-row"><span class="detail-label">盒马日</span><span class="detail-val">周一采购</span></div>';
    if (hema?.bought) html += `<div class="hema-block"><span class="hema-tag hema-bought">本周购买</span><p class="hema-text">${escape(hema.bought)}</p></div>`;
    if (hema?.nextPlan) html += `<div class="hema-block"><span class="hema-tag hema-next">下周想买</span><p class="hema-text">${escape(hema.nextPlan)}</p></div>`;
    if (!hema) html += '<div class="hema-empty">本周还没记录盒马日，记得补上～</div>';
  }
  return `${html}</div></div>`;
}

function dailySummary() {
  const prefix = `${state.year}-${pad(state.month)}`;
  const expenses = (window.__expenseRecords || []).filter(item => item.date.startsWith(prefix));
  const html: string[] = [];
  if (expenses.length) {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const days = new Set(expenses.map(item => item.date)).size;
    html.push(`<div class="summary-item"><span class="summary-label">本月支出</span><span class="summary-value expense-amount">¥${total.toFixed(2)}</span></div><div class="summary-divider"></div><div class="summary-item"><span class="summary-label">日均支出</span><span class="summary-value expense-amount">¥${(total / days).toFixed(2)}</span></div>`);
  }
  const sleepStart: number[] = [];
  const sleepEnd: number[] = [];
  const sleepDuration: number[] = [];
  const toMinutes = (value: string) => {
    const [hour, minute] = value.trim().split(':').map(Number);
    return hour * 60 + minute;
  };
  const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(Math.round(minutes % 60))}`;
  for (const [date, record] of Object.entries(window.__diaryRecords || {})) {
    if (!date.startsWith(prefix)) continue;
    let latest: { start: number; end: number } | null = null;
    for (const task of record.tasks || []) {
      if (task.desc !== '睡觉' && task.desc !== '睡懒觉') continue;
      const parts = String(task.time || '').split('-');
      if (parts.length !== 2) continue;
      const start = toMinutes(parts[0]);
      const end = toMinutes(parts[1]);
      if (Number.isNaN(start) || Number.isNaN(end) || !latest || start > latest.start) latest = { start, end };
    }
    if (latest) {
      let end = latest.end;
      if (end <= latest.start) end += 24 * 60;
      sleepStart.push(latest.start);
      sleepEnd.push(latest.end);
      sleepDuration.push(end - latest.start);
    }
  }
  if (sleepStart.length) {
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    if (html.length) html.push('<div class="summary-divider"></div>');
    html.push(`<div class="summary-item"><span class="summary-label">平均入睡</span><span class="summary-value">${toTime(average(sleepStart))}</span></div>`);
    html.push('<div class="summary-divider"></div>');
    html.push(`<div class="summary-item"><span class="summary-label">平均起床</span><span class="summary-value">${toTime(average(sleepEnd))}</span></div>`);
    html.push('<div class="summary-divider"></div>');
    html.push(`<div class="summary-item"><span class="summary-label">平均睡眠</span><span class="summary-value">${(average(sleepDuration) / 60).toFixed(1)}h</span></div>`);
  }
  return html.length ? `<div class="summary-bar">${html.join('')}</div>` : '';
}

function dailyUtilitySummaryHtml(): string {
  const records = window.__utilityRecords || {};
  const prefix = `${state.year}-${pad(state.month)}`;
  const monthRecords = Object.entries(records)
    .filter(([key]) => key.startsWith(prefix))
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (monthRecords.length < 2) return '';
  const first = monthRecords[0].elecRemaining;
  const last = monthRecords[monthRecords.length - 1].elecRemaining;
  const recharge = monthRecords.reduce((sum, record) => sum + (record.recharge || 0), 0);
  const total = first + recharge - last;
  const span = Math.max(1, Math.round((new Date(monthRecords.at(-1)!.date).getTime() - new Date(monthRecords[0].date).getTime()) / 86400000));
  const currentBalance = monthRecords[monthRecords.length - 1].elecRemaining;
  return `<div class="daily-utility-bar"><div class="daily-utility-item"><span class="daily-utility-label">当前余额</span><span class="daily-utility-value daily-utility-current">¥${currentBalance.toFixed(2)}</span></div><div class="daily-utility-divider"></div><div class="daily-utility-item"><span class="daily-utility-label">${state.month}月累计用电</span><span class="daily-utility-value">${total.toFixed(2)} 元</span></div><div class="daily-utility-divider"></div><div class="daily-utility-item"><span class="daily-utility-label">日均</span><span class="daily-utility-value">${(total / span).toFixed(2)} 元</span></div><div class="daily-utility-divider"></div><div class="daily-utility-item"><span class="daily-utility-label">充值</span><span class="daily-utility-value">¥${recharge.toFixed(0)}</span></div><div class="daily-utility-divider"></div><div class="daily-utility-item"><span class="daily-utility-label">记录</span><span class="daily-utility-value">${monthRecords.length} 天</span></div></div>`;
}

function dailyMonthlyOverviewHtml(): string {
  const prefix = `${state.year}-${pad(state.month)}`;
  const diary = window.__diaryRecords || {};
  const expenses = (window.__expenseRecords || []).filter(item => item.date.startsWith(prefix));
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const expenseDays = new Set(expenses.map(item => item.date)).size;
  const avgExpense = expenseDays ? totalExpense / expenseDays : 0;
  let recordDays = 0;
  const sleepDuration: number[] = [];
  const toMinutes = (value: string) => {
    const [hour, minute] = value.trim().split(':').map(Number);
    return hour * 60 + minute;
  };
  for (const [date, record] of Object.entries(diary)) {
    if (!date.startsWith(prefix)) continue;
    recordDays++;
    for (const task of record.tasks || []) {
      if (task.desc !== '睡觉' && task.desc !== '睡懒觉') continue;
      const parts = String(task.time || '').split('-');
      if (parts.length !== 2) continue;
      const start = toMinutes(parts[0]);
      const end = toMinutes(parts[1]);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      let e = end;
      if (e <= start) e += 24 * 60;
      sleepDuration.push(e - start);
    }
  }
  if (!recordDays) return '<div class="daily-kanban-head"><h3 class="daily-kanban-title">📊 本月概览</h3></div><div class="daily-kanban-empty">本月暂无记录</div>';
  const avgSleep = sleepDuration.length ? (sleepDuration.reduce((a, b) => a + b, 0) / sleepDuration.length / 60).toFixed(1) : '-';
  return `<div class="daily-kanban-head"><h3 class="daily-kanban-title"> 本月概览</h3></div>
<div class="daily-stats-grid">
  <div class="daily-stat-item"><span class="daily-stat-label">记录</span><span class="daily-stat-value">${recordDays}天</span></div>
  <div class="daily-stat-item"><span class="daily-stat-label">支出</span><span class="daily-stat-value daily-cost">¥${totalExpense.toFixed(0)}</span></div>
  <div class="daily-stat-item"><span class="daily-stat-label">日均</span><span class="daily-stat-value">¥${avgExpense.toFixed(0)}</span></div>
  <div class="daily-stat-item"><span class="daily-stat-label">睡眠</span><span class="daily-stat-value">${avgSleep}h</span></div>
</div>`;
}

function dailyExpenseCategoryHtml(): string {
  const prefix = `${state.year}-${pad(state.month)}`;
  const expenses = (window.__expenseRecords || []).filter(item => item.date.startsWith(prefix));
  if (!expenses.length) return '<div class="daily-kanban-head"><h3 class="daily-kanban-title"> 支出分类</h3></div><div class="daily-kanban-empty">本月暂无支出</div>';
  const catMap = new Map<string, number>();
  for (const item of expenses) {
    catMap.set(item.cat, (catMap.get(item.cat) || 0) + item.amount);
  }
  const cats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  const total = Math.max(1, Math.ceil(cats.length / EXPENSE_CAT_PER_PAGE));
  if (expenseCatPage >= total) expenseCatPage = total - 1;
  if (expenseCatPage < 0) expenseCatPage = 0;
  const slice = cats.slice(expenseCatPage * EXPENSE_CAT_PER_PAGE, (expenseCatPage + 1) * EXPENSE_CAT_PER_PAGE);
  let html = '<div class="daily-kanban-head"><h3 class="daily-kanban-title">💰 支出分类</h3>';
  if (total > 1) {
    html += `<div class="daily-expense-nav"><button class="daily-expense-btn daily-expense-prev"${expenseCatPage === 0 ? ' disabled' : ''}>◀</button><span class="daily-expense-num">${expenseCatPage + 1}/${total}</span><button class="daily-expense-btn daily-expense-next"${expenseCatPage >= total - 1 ? ' disabled' : ''}>▶</button></div>`;
  }
  html += '</div><div class="daily-cat-grid">';
  for (const [cat, amount] of slice) {
    html += `<div class="daily-cat-grid-item"><span class="daily-cat-grid-name">${escape(cat)}</span><span class="daily-cat-grid-amount">¥${amount.toFixed(0)}</span></div>`;
  }
  return html + '</div>';
}

const HEMA_PER_PAGE = 1;
let hemaPage = 0;

const EXPENSE_CAT_PER_PAGE = 6;
let expenseCatPage = 0;

function dailyHemaDayHtml(): string {
  const hema = window.__hemaDayRecords || {};
  const prefix = `${state.year}-${pad(state.month)}`;
  const records = Object.entries(hema).filter(([date]) => date.startsWith(prefix)).sort((a, b) => b[0].localeCompare(a[0]));
  if (!records.length) return '<div class="daily-kanban-head"><h3 class="daily-kanban-title">🛒 盒马日</h3></div><div class="daily-kanban-empty">本月暂无记录</div>';
  const total = Math.max(1, Math.ceil(records.length / HEMA_PER_PAGE));
  if (hemaPage >= total) hemaPage = total - 1;
  if (hemaPage < 0) hemaPage = 0;
  const slice = records.slice(hemaPage * HEMA_PER_PAGE, (hemaPage + 1) * HEMA_PER_PAGE);
  let html = '<div class="daily-kanban-head"><h3 class="daily-kanban-title">🛒 盒马日</h3>';
  if (total > 1) {
    html += `<div class="daily-hema-nav"><button class="daily-hema-btn daily-hema-prev"${hemaPage === 0 ? ' disabled' : ''}>◀</button><span class="daily-hema-num">${hemaPage + 1}/${total}</span><button class="daily-hema-btn daily-hema-next"${hemaPage >= total - 1 ? ' disabled' : ''}>▶</button></div>`;
  }
  html += '</div><div class="daily-hema-list">';
  for (const [date, record] of slice) {
    const day = new Date(`${date}T00:00:00`);
    const dateStr = `${day.getMonth() + 1}/${day.getDate()}`;
    html += `<div class="daily-hema-item"><div class="daily-hema-date">${dateStr}</div>`;
    if (record.bought) html += `<div class="daily-hema-block"><span class="daily-hema-tag daily-hema-bought">本周购买</span><p class="daily-hema-text">${escape(record.bought)}</p></div>`;
    if (record.nextPlan) html += `<div class="daily-hema-block"><span class="daily-hema-tag daily-hema-next">下周想买</span><p class="daily-hema-text">${escape(record.nextPlan)}</p></div>`;
    html += '</div>';
  }
  return html + '</div>';
}

let expenseCatView = 'bar';
let expenseCatPages: Record<string, number> = {};
let expenseTrendSelectedDay: number | null = null;
let expenseTopPage = 0;
let membershipView = 'active';

function expenseView() {
  const records = (window.__expenseRecords || []).filter(item => item.date.startsWith(`${state.year}-${pad(state.month)}`)).sort((a, b) => b.date.localeCompare(a.date));
  const categories = window.__expenseCategories || [];
  const total = records.reduce((sum, item) => sum + item.amount, 0);
  const days = new Set(records.map(item => item.date)).size;
  let html = total ? `<div class="summary-bar"><div class="summary-item"><span class="summary-label">本月支出</span><span class="summary-value expense-amount">¥${total.toFixed(2)}</span></div><div class="summary-divider"></div><div class="summary-item"><span class="summary-label">记录笔数</span><span class="summary-value">${records.length}</span></div><div class="summary-divider"></div><div class="summary-item"><span class="summary-label">日均</span><span class="summary-value expense-amount">¥${(total / days).toFixed(2)}</span></div></div>` : '<div class="empty-state"><p>本月暂无支出记录</p></div>';

  const groups = categories.map(category => ({ ...category, items: records.filter(item => item.cat === category.name) })).filter(group => group.items.length).sort((a, b) => b.items.reduce((s, item) => s + item.amount, 0) - a.items.reduce((s, item) => s + item.amount, 0));

  html += '<div class="expense-grid">';
  for (const group of groups) {
    const groupTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
    const catKey = group.name;
    if (!(catKey in expenseCatPages)) expenseCatPages[catKey] = 0;
    const perPage = 5;
    const totalPages = Math.max(1, Math.ceil(group.items.length / perPage));
    if (expenseCatPages[catKey] >= totalPages) expenseCatPages[catKey] = totalPages - 1;
    const page = expenseCatPages[catKey];
    const pageItems = group.items.slice(page * perPage, (page + 1) * perPage);

    html += `<div class="expense-grid-card"><div class="expense-grid-header"><div class="expense-grid-header-left"><span class="expense-cat-icon">${group.icon}</span><h3>${escape(group.name)}</h3></div><div class="expense-grid-header-right"><span class="expense-cat-amount">¥${groupTotal.toFixed(2)}</span></div></div>`;

    if (totalPages > 1) {
      html += `<div class="expense-grid-nav"><button class="expense-grid-btn expense-grid-prev"${page === 0 ? ' disabled' : ''} data-cat="${escape(catKey)}">◀</button><span class="expense-grid-page">${page + 1}/${totalPages}</span><button class="expense-grid-btn expense-grid-next"${page >= totalPages - 1 ? ' disabled' : ''} data-cat="${escape(catKey)}">▶</button></div>`;
    }

    html += '<div class="expense-grid-body">';
    for (const item of pageItems) {
      const date = new Date(`${item.date}T00:00:00`);
      html += `<div class="expense-item"><div class="expense-item-left"><span class="expense-item-sub">${escape(item.sub)}</span>${item.note ? `<span class="expense-item-note">${escape(item.note)}</span>` : ''}</div><div class="expense-item-right"><span class="expense-item-amount">¥${item.amount.toFixed(2)}</span><span class="expense-item-date">${date.getMonth() + 1}/${date.getDate()}</span></div></div>`;
    }
    if (!pageItems.length) html += '<div class="expense-grid-empty">暂无记录</div>';
    html += '</div></div>';
  }
  html += '</div>';
  return html;
}

function expenseTrendHtml(): string {
  const records = (window.__expenseRecords || []).filter(item => item.date.startsWith(`${state.year}-${pad(state.month)}`));
  if (!records.length) return '<div class="expense-kanban-head"><h3 class="expense-kanban-title"> 支出趋势</h3></div><div class="expense-kanban-empty">本月暂无支出</div>';
  const daysInMonth = new Date(state.year, state.month, 0).getDate();
  if (expenseTrendSelectedDay && expenseTrendSelectedDay > daysInMonth) expenseTrendSelectedDay = null;
  const dailyTotals = Array.from({ length: daysInMonth }, (_, index) => records.filter(record => Number(record.date.slice(-2)) === index + 1).reduce((sum, record) => sum + record.amount, 0));
  const max = Math.max(...dailyTotals, 1);
  const width = 760;
  const height = 190;
  const padding = { top: 18, right: 16, bottom: 30, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = dailyTotals.map((total, index) => ({ x: padding.left + (index * plotWidth) / Math.max(daysInMonth - 1, 1), y: padding.top + (1 - total / max) * plotHeight }));
  const linePath = points.map((item, index) => `${index ? 'L' : 'M'}${item.x.toFixed(1)},${item.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(padding.top + plotHeight).toFixed(1)} L${points[0].x.toFixed(1)},${(padding.top + plotHeight).toFixed(1)} Z`;
  const gridLines = [0, .5, 1].map(ratio => { const y = padding.top + (1 - ratio) * plotHeight; return `<line class="expense-line-grid" x1="${padding.left}" x2="${width - padding.right}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text class="expense-line-y-label" x="${padding.left - 8}" y="${(y + 3).toFixed(1)}">¥${(max * ratio).toFixed(0)}</text>`; }).join('');
  const labels = [...new Set([1, 8, 15, 22, daysInMonth])].map(day => `<text class="expense-line-x-label" x="${points[day - 1].x.toFixed(1)}" y="${height - 8}">${day}日</text>`).join('');
  const nodes = points.map((item, index) => `<circle class="expense-line-node${dailyTotals[index] === 0 ? ' zero' : ''}${expenseTrendSelectedDay === index + 1 ? ' selected' : ''}" data-expense-trend-day="${index + 1}" cx="${item.x.toFixed(1)}" cy="${item.y.toFixed(1)}" r="3.2" role="button" tabindex="0"><title>${state.month}/${index + 1} · ¥${dailyTotals[index].toFixed(2)}</title></circle>`).join('');
  let tooltip = '';
  if (expenseTrendSelectedDay) {
    const selectedIndex = expenseTrendSelectedDay - 1;
    const selectedPoint = points[selectedIndex];
    const selectedRecords = records.filter(record => Number(record.date.slice(-2)) === expenseTrendSelectedDay);
    const details = selectedRecords.length ? selectedRecords.map(record => `<li><span><b>${escape(record.cat)}</b> · ${escape(record.sub)}${record.note ? `<small>${escape(record.note)}</small>` : ''}</span><strong>¥${record.amount.toFixed(2)}</strong></li>`).join('') : '<li class="expense-line-tooltip-empty">当天无支出</li>';
    const tooltipTop = selectedPoint.y > 88 ? Math.max(8, selectedPoint.y - 84) : selectedPoint.y + 12;
    tooltip = `<div class="expense-line-tooltip" style="--point-x:${(selectedPoint.x / width * 100).toFixed(2)}%; top:${tooltipTop.toFixed(1)}px"><div class="expense-line-tooltip-head"><strong>${state.month}/${expenseTrendSelectedDay} · ¥${dailyTotals[selectedIndex].toFixed(2)}</strong><button class="expense-line-tooltip-close" type="button" aria-label="关闭当天支出详情">×</button></div><ul>${details}</ul></div>`;
  }
  const peak = Math.max(...dailyTotals);
  const peakDay = dailyTotals.indexOf(peak) + 1;
  return `<div class="expense-kanban-head"><h3 class="expense-kanban-title">📈 每日支出趋势</h3></div><div class="expense-line-chart-wrap"><svg class="expense-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${state.month}月每日支出趋势">${gridLines}<path class="expense-line-area" d="${areaPath}"/><path class="expense-line-path" d="${linePath}"/>${nodes}${labels}</svg>${tooltip}</div><div class="expense-line-meta"><span>共 ${daysInMonth} 个每日节点</span><span>峰值：${state.month}/${peakDay} ¥${peak.toFixed(0)}</span></div>`;
}

function expenseCategoryChartHtml(): string {
  const records = (window.__expenseRecords || []).filter(item => item.date.startsWith(`${state.year}-${pad(state.month)}`));
  if (!records.length) return '<div class="expense-kanban-head"><h3 class="expense-kanban-title">📊 分类占比</h3></div><div class="expense-kanban-empty">本月暂无支出</div>';
  const catMap = new Map<string, { amount: number; count: number }>();
  for (const r of records) {
    const c = catMap.get(r.cat) || { amount: 0, count: 0 };
    c.amount += r.amount;
    c.count++;
    catMap.set(r.cat, c);
  }
  const cats = [...catMap.entries()].sort((a, b) => b[1].amount - a[1].amount);
  const total = cats.reduce((s, c) => s + c[1].amount, 0);
  let html = '<div class="expense-kanban-head"><h3 class="expense-kanban-title">📊 分类占比</h3>';
  html += `<div class="expense-cat-view-nav"><button class="expense-cat-view-btn${expenseCatView === 'bar' ? ' active' : ''}" data-catview="bar">柱状</button><button class="expense-cat-view-btn${expenseCatView === 'pie' ? ' active' : ''}" data-catview="pie">饼图</button></div>`;
  html += '</div>';
  if (expenseCatView === 'bar') {
    const max = cats[0][1].amount;
    html += '<div class="expense-cat-bar-list">';
    for (const [cat, data] of cats) {
      const pct = Math.round((data.amount / max) * 100);
      html += `<div class="expense-cat-bar-item"><span class="expense-cat-bar-name">${escape(cat)}</span><div class="expense-cat-bar-track"><div class="expense-cat-bar-fill" style="width:${pct}%"></div></div><span class="expense-cat-bar-amount">¥${data.amount.toFixed(0)}</span></div>`;
    }
    html += '</div>';
  } else {
    const colors = ['#4f46e5','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#65a30d','#ea580c','#475569','#8b5cf6'];
    let offset = 0;
    const segments: string[] = [];
    for (let i = 0; i < cats.length; i++) {
      const pct = (cats[i][1].amount / total) * 100;
      segments.push(`${colors[i % colors.length]} ${offset}% ${offset + pct}%`);
      offset += pct;
    }
    html += `<div class="expense-cat-pie"><div class="expense-cat-pie-ring" style="background:conic-gradient(${segments.join(', ')})"><div class="expense-cat-pie-center"><span class="expense-cat-pie-total">¥${total.toFixed(0)}</span></div></div><div class="expense-cat-pie-legend">`;
    for (let i = 0; i < cats.length; i++) {
      const pct = ((cats[i][1].amount / total) * 100).toFixed(0);
      html += `<div class="expense-cat-pie-legend-item"><span class="expense-cat-pie-dot" style="background:${colors[i % colors.length]}"></span><span class="expense-cat-pie-legend-name">${escape(cats[i][0])}</span><span class="expense-cat-pie-legend-pct">${pct}%</span></div>`;
    }
    html += '</div></div>';
  }
  return html;
}

function expenseTopItemsHtml(): string {
  const records = (window.__expenseRecords || []).filter(item => item.date.startsWith(`${state.year}-${pad(state.month)}`)).sort((a, b) => b.amount - a.amount);
  if (!records.length) return '<div class="expense-kanban-head"><h3 class="expense-kanban-title">🔥 最高支出</h3></div><div class="expense-kanban-empty">本月暂无支出</div>';
  const perPage = 5;
  const totalPages = Math.ceil(records.length / perPage);
  if (expenseTopPage >= totalPages) expenseTopPage = totalPages - 1;
  const pageRecords = records.slice(expenseTopPage * perPage, (expenseTopPage + 1) * perPage);
  const medals = ['🥇','🥈','🥉','4.','5.'];
  let html = '<div class="expense-kanban-head"><h3 class="expense-kanban-title">🔥 最高支出</h3>';
  if (totalPages > 1) html += `<div class="expense-grid-nav expense-top-nav"><button class="expense-grid-btn expense-top-prev"${expenseTopPage === 0 ? ' disabled' : ''}>◀</button><span class="expense-grid-page">${expenseTopPage + 1}/${totalPages}</span><button class="expense-grid-btn expense-top-next"${expenseTopPage >= totalPages - 1 ? ' disabled' : ''}>▶</button></div>`;
  html += '</div><div class="expense-top-list">';
  for (let i = 0; i < pageRecords.length; i++) {
    const r = pageRecords[i];
    const day = new Date(`${r.date}T00:00:00`);
    const dateStr = `${day.getMonth() + 1}/${day.getDate()}`;
    const rank = expenseTopPage * perPage + i;
    html += `<div class="expense-top-item"><span class="expense-top-medal">${medals[rank] || `${rank + 1}.`}</span><div class="expense-top-info"><span class="expense-top-sub">${escape(r.sub)}</span><span class="expense-top-note">${escape(r.note || '')}</span></div><div class="expense-top-right"><span class="expense-top-amount">¥${r.amount.toFixed(2)}</span><span class="expense-top-date">${dateStr}</span></div></div>`;
  }
  return html + '</div>';
}

const SERVICE_ICONS: Record<string, string> = {
  'monica': '', 'ksqnm': '🌐', 'wpsai会员': '📝', 'wink': '🎬', 'csdn': '💻',
  'chatgpt': '🤖', 'claude': '🤖', 'opencode': '🤖', 'minimax': '🤖',
  '爱奇艺': '🎬', 'b站': '📺', 'youtube': '▶️',
  '京东': '🛍️', '88vip': '🛍️', '腾讯': '🛍️',
  '网易云': '🎵', 'qq音乐': '', '全民k歌': '🎤',
  '百度云': '☁️', '迅雷': '️', '夸克': '', 'icloud': '☁️',
  '梯子': '🌐', '鲨鱼记账': '💰', '剪映': '',
  'microsoft': '📦', 'wps': '📝', 'notion': '📋', 'figma': '🎨',
};

function getServiceIcon(record: any): string {
  if (record.icon) return `<img src="${record.icon}" alt="" aria-hidden="true">`;
  const lower = record.name.toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📌';
}

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  'AI': { bg: '#ede9fe', fg: '#6d28d9' },
  '工具': { bg: '#dcfce7', fg: '#166534' },
  '视频': { bg: '#ffedd5', fg: '#9a3412' },
  '购物': { bg: '#fce7f3', fg: '#9d174d' },
  '音乐': { bg: '#f3e8ff', fg: '#7e22ce' },
  '网盘': { bg: '#cffafe', fg: '#155e75' },
  '其他': { bg: '#f1f5f9', fg: '#475569' },
};

function membershipIcon(name: 'card' | 'calendar' | 'shield' | 'clock'): string {
  const paths = {
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    shield: '<path d="M12 3 20 7v5c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  };
  return `<svg class="membership-line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function membershipSubscriptionsHtml(): string {
  const records = window.__membershipRecords || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const parseDate = (value: string) => new Date(`${value}T00:00:00`).getTime();
  const active = records.filter(record => record.expireDate && parseDate(record.expireDate) > todayTime).sort((a, b) => parseDate(a.expireDate) - parseDate(b.expireDate));
  const expired = records.filter(record => record.expireDate && parseDate(record.expireDate) < todayTime).sort((a, b) => parseDate(b.expireDate) - parseDate(a.expireDate));
  const monthly = active.reduce((sum, record) => record.price == null || record.cycleMonths !== 1 ? sum : sum + record.price, 0);
  const annual = active.reduce((sum, record) => record.price == null || !record.cycleMonths ? sum : sum + record.price / record.cycleMonths * 12, 0);
  const dueSoon = active.filter(record => (parseDate(record.expireDate) - todayTime) / 86400000 <= 30).length;
  const groups: Record<string, any[]> = { all: records, active, expired };
  const current = groups[membershipView] || active;
  const daysLabel = (record: any) => { const days = Math.round((parseDate(record.expireDate) - todayTime) / 86400000); return days > 0 ? `${days} 天后到期` : `已过期 ${-days} 天`; };
  const isDueSoon = (record: any) => (parseDate(record.expireDate) - todayTime) / 86400000 <= 30;
  const isExpired = (record: any) => parseDate(record.expireDate) < todayTime;

  let html = `<div class="membership-header"><h2 class="membership-title"><span class="membership-title-icon">${membershipIcon('card')}</span>会员订阅</h2>`;
  html += `<div class="membership-view-nav"><button class="membership-view-btn${membershipView === 'active' ? ' active' : ''}" data-membership-view="active">有效</button><button class="membership-view-btn${membershipView === 'expired' ? ' active' : ''}" data-membership-view="expired">过期</button><button class="membership-view-btn${membershipView === 'all' ? ' active' : ''}" data-membership-view="all">全部</button></div></div>`;

  html += '<div class="membership-summary">';
  html += `<div class="membership-stat-card"><span class="membership-stat-icon">${membershipIcon('card')}</span><div class="membership-stat-body"><span class="membership-stat-label">每月订阅</span><span class="membership-stat-value membership-stat-price">¥${Math.round(monthly)}</span></div></div>`;
  html += `<div class="membership-stat-card"><span class="membership-stat-icon">${membershipIcon('calendar')}</span><div class="membership-stat-body"><span class="membership-stat-label">每年订阅</span><span class="membership-stat-value membership-stat-price">¥${Math.round(annual)}</span></div></div>`;
  html += `<div class="membership-stat-card"><span class="membership-stat-icon">${membershipIcon('shield')}</span><div class="membership-stat-body"><span class="membership-stat-label">有效订阅</span><span class="membership-stat-value">${active.length} 项</span></div></div>`;
  html += `<div class="membership-stat-card${dueSoon ? ' membership-stat-warning' : ''}"><span class="membership-stat-icon">${membershipIcon('clock')}</span><div class="membership-stat-body"><span class="membership-stat-label">30天内到期</span><span class="membership-stat-value">${dueSoon} 项</span></div></div>`;
  html += '</div>';

  const yearGroups = new Map<number, { items: any[]; total: number }>();
  for (const record of active) {
    if (!record.expireDate || record.price == null) continue;
    const year = new Date(`${record.expireDate}T00:00:00`).getFullYear();
    if (!yearGroups.has(year)) yearGroups.set(year, { items: [], total: 0 });
    yearGroups.get(year)!.items.push(record);
    yearGroups.get(year)!.total += record.price;
  }
  const sortedYears = [...yearGroups.keys()].sort();
  if (sortedYears.length) {
    html += '<div class="membership-yearly-section"><h3 class="membership-section-title">每年订阅费用</h3><div class="membership-yearly-cards">';
    for (const year of sortedYears) {
      const group = yearGroups.get(year)!;
      html += `<div class="membership-yearly-card"><span class="membership-yearly-icon">${membershipIcon('calendar')}</span><div class="membership-yearly-body"><div class="membership-yearly-info"><strong class="membership-yearly-year">${year}</strong><span class="membership-yearly-count">${group.items.length} 个订阅</span></div><strong class="membership-yearly-total">¥${Math.round(group.total)}</strong></div></div>`;
    }
    html += '</div></div>';
  }

  html += '<div class="membership-list-section"><h3 class="membership-section-title">订阅列表</h3><div class="membership-table">';
  html += '<div class="membership-table-head"><span class="membership-th-name">订阅服务</span><span class="membership-th-tag">标签</span><span class="membership-th-note">备注</span><span class="membership-th-price">价格</span><span class="membership-th-status">到期状态</span></div>';
  for (const record of current) {
    const icon = getServiceIcon(record);
    const tags = (record.tags || []) as string[];
    const priceText = record.price == null ? '价格待补' : record.price === 0 ? '免费' : `¥${record.price}${record.cycleMonths ? ` / ${record.cycleMonths}月` : ''}`;
    const statusText = daysLabel(record);
    const dueSoonClass = isDueSoon(record) ? ' membership-due-soon' : '';
    const expiredClass = isExpired(record) ? ' membership-expired' : '';
    const tagHtml = tags.map(tag => {
      const colors = TAG_COLORS[tag] || TAG_COLORS['其他'];
      return `<span class="membership-tag" style="background:${colors.bg};color:${colors.fg}">${escape(tag)}</span>`;
    }).join('');
    html += `<div class="membership-row${dueSoonClass}${expiredClass}">`;
    html += `<div class="membership-row-main"><span class="membership-row-logo">${icon}</span><div class="membership-row-copy"><strong>${escape(record.name)}</strong><span class="membership-row-note-mobile">${record.note ? escape(record.note) : '—'}</span></div></div>`;
    html += `<div class="membership-row-tags">${tagHtml}</div>`;
    html += `<div class="membership-row-note">${record.note ? escape(record.note) : '—'}</div>`;
    html += `<div class="membership-row-price"><strong>${priceText}</strong></div>`;
    const statusIcon = membershipIcon('clock');
    html += `<div class="membership-row-status"><span class="membership-status-icon">${statusIcon}</span><span>${statusText}</span></div>`;
    html += `</div>`;
  }
  html += '</div></div>';
  return html;
}

function setupAccordions(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.section-header').forEach(header => {
    const section = header.parentElement;
    const body = section?.querySelector<HTMLElement>('.section-body');
    if (!section || !body || header.dataset.bound) return;
    header.dataset.bound = 'true';
    body.style.maxHeight = section.classList.contains('open') ? `${body.scrollHeight}px` : '0px';
    header.addEventListener('click', () => {
      section.classList.toggle('open');
      section.classList.toggle('collapsed');
      body.style.maxHeight = section.classList.contains('open') ? `${body.scrollHeight}px` : '0px';
    });
  });
}

function refresh() {
  if (page === 'food-records') {
    document.getElementById('foodCalendar')!.innerHTML = foodGrid();
    document.querySelector('.food-detail-container')!.innerHTML = foodDetail(state.selected);
    const statsEl = document.getElementById('foodMonthlyStats');
    if (statsEl) statsEl.innerHTML = monthlyStatsHtml();
    const topEl = document.getElementById('foodTopDishes');
    if (topEl) topEl.innerHTML = topDishesHtml();
    const chefEl = document.getElementById('foodChefRank');
    if (chefEl) chefEl.innerHTML = chefRankHtml();
    const recentEl = document.getElementById('foodRecentKanban');
    if (recentEl) recentEl.innerHTML = recentDishesHtml();
    setTitle('[data-tab="food-records"] .cal-title');
  } else if (page === 'daily-tracker') {
    document.getElementById('dailyCalendar')!.innerHTML = dailyGrid();
    document.getElementById('dailyDetail')!.innerHTML = dailyDetail(state.selected);
    const summaryEl = document.getElementById('dailySummary');
    if (summaryEl) summaryEl.innerHTML = dailySummary();
    const utilityEl = document.getElementById('dailyUtilitySummary');
    if (utilityEl) utilityEl.innerHTML = dailyUtilitySummaryHtml();
    const overviewEl = document.getElementById('dailyMonthlyOverview');
    if (overviewEl) overviewEl.innerHTML = dailyMonthlyOverviewHtml();
    const catEl = document.getElementById('dailyExpenseCategory');
    if (catEl) catEl.innerHTML = dailyExpenseCategoryHtml();
    const hemaEl = document.getElementById('dailyHemaDay');
    if (hemaEl) hemaEl.innerHTML = dailyHemaDayHtml();
    setTitle('[data-tab="daily-tracker"] .cal-title');
  } else if (page === 'expense-records') {
    document.getElementById('expenseContent')!.innerHTML = expenseView();
    const trendEl = document.getElementById('expenseTrendChart');
    if (trendEl) trendEl.innerHTML = expenseTrendHtml();
    const catEl = document.getElementById('expenseCategoryChart');
    if (catEl) catEl.innerHTML = expenseCategoryChartHtml();
    const topEl = document.getElementById('expenseTopItems');
    if (topEl) topEl.innerHTML = expenseTopItemsHtml();
    setTitle('[data-tab="expense-records"] .cal-title', `${monthTitle()} · 支出`);
    setupAccordions(document.getElementById('expenseContent')!);
  } else if (page === 'membership') {
    const membershipEl = document.getElementById('membershipSubscriptions');
    if (membershipEl) membershipEl.innerHTML = membershipSubscriptionsHtml();
  }
}

function shiftMonth(delta: number) {
  state.month += delta;
  if (state.month < 1) { state.year--; state.month = 12; }
  if (state.month > 12) { state.year++; state.month = 1; }
  state.selected = null;
  writeQueryState();
  refresh();
}

document.addEventListener('click', event => {
  const target = event.target as HTMLElement;
  if (target.closest('.cal-prev')) { shiftMonth(-1); return; }
  if (target.closest('.cal-next')) { shiftMonth(1); return; }
  if (target.closest('.cal-today-btn')) {
    state.year = now.getFullYear(); state.month = now.getMonth() + 1; state.selected = null;
    writeQueryState(); refresh(); return;
  }
  const cell = target.closest<HTMLElement>('.cal-has-data');
  if (cell?.dataset.date) {
    state.selected = state.selected === cell.dataset.date ? null : cell.dataset.date;
    writeQueryState(); refresh(); return;
  }
  if (target.closest('.util-dc')) { state.selected = null; writeQueryState(); refresh(); return; }

  const foodView = target.closest<HTMLButtonElement>('.food-view-tab');
  if (foodView) {
    const root = foodView.closest('.food-views');
    root?.querySelectorAll('.food-view-tab').forEach(button => button.classList.toggle('active', button === foodView));
    root?.querySelectorAll<HTMLElement>('.food-view-panel').forEach(panel => { panel.hidden = panel.dataset.panel !== foodView.dataset.view; });
    return;
  }
  const recentPrev = target.closest<HTMLButtonElement>('.food-recent-prev');
  if (recentPrev && !recentPrev.disabled) { recentPage--; const el = document.getElementById('foodRecentKanban'); if (el) el.innerHTML = recentDishesHtml(); return; }
  const recentNext = target.closest<HTMLButtonElement>('.food-recent-next');
  if (recentNext && !recentNext.disabled) { recentPage++; const el = document.getElementById('foodRecentKanban'); if (el) el.innerHTML = recentDishesHtml(); return; }
  const hemaPrev = target.closest<HTMLButtonElement>('.daily-hema-prev');
  if (hemaPrev && !hemaPrev.disabled) { hemaPage--; const el = document.getElementById('dailyHemaDay'); if (el) el.innerHTML = dailyHemaDayHtml(); return; }
  const hemaNext = target.closest<HTMLButtonElement>('.daily-hema-next');
  if (hemaNext && !hemaNext.disabled) { hemaPage++; const el = document.getElementById('dailyHemaDay'); if (el) el.innerHTML = dailyHemaDayHtml(); return; }
  const expenseCatPrev = target.closest<HTMLButtonElement>('.daily-expense-prev');
  if (expenseCatPrev && !expenseCatPrev.disabled) { expenseCatPage--; const el = document.getElementById('dailyExpenseCategory'); if (el) el.innerHTML = dailyExpenseCategoryHtml(); return; }
  const expenseCatNext = target.closest<HTMLButtonElement>('.daily-expense-next');
  if (expenseCatNext && !expenseCatNext.disabled) { expenseCatPage++; const el = document.getElementById('dailyExpenseCategory'); if (el) el.innerHTML = dailyExpenseCategoryHtml(); return; }
  const catViewBtn = target.closest<HTMLButtonElement>('.expense-cat-view-btn');
  if (catViewBtn && catViewBtn.dataset.catview) { expenseCatView = catViewBtn.dataset.catview; const el = document.getElementById('expenseCategoryChart'); if (el) el.innerHTML = expenseCategoryChartHtml(); return; }
  const membershipViewBtn = target.closest<HTMLButtonElement>('.membership-view-btn');
  if (membershipViewBtn?.dataset.membershipView) { membershipView = membershipViewBtn.dataset.membershipView; const el = document.getElementById('membershipSubscriptions'); if (el) el.innerHTML = membershipSubscriptionsHtml(); return; }
  const trendNode = target.closest<SVGCircleElement>('.expense-line-node');
  if (trendNode?.dataset.expenseTrendDay) { expenseTrendSelectedDay = Number(trendNode.dataset.expenseTrendDay); const el = document.getElementById('expenseTrendChart'); if (el) el.innerHTML = expenseTrendHtml(); return; }
  const tooltipClose = target.closest<HTMLButtonElement>('.expense-line-tooltip-close');
  if (tooltipClose) { expenseTrendSelectedDay = null; const el = document.getElementById('expenseTrendChart'); if (el) el.innerHTML = expenseTrendHtml(); return; }
  const topPrev = target.closest<HTMLButtonElement>('.expense-top-prev');
  if (topPrev && !topPrev.disabled) { expenseTopPage--; const el = document.getElementById('expenseTopItems'); if (el) el.innerHTML = expenseTopItemsHtml(); return; }
  const topNext = target.closest<HTMLButtonElement>('.expense-top-next');
  if (topNext && !topNext.disabled) { expenseTopPage++; const el = document.getElementById('expenseTopItems'); if (el) el.innerHTML = expenseTopItemsHtml(); return; }
  const gridPrev = target.closest<HTMLButtonElement>('.expense-grid-prev');
  if (gridPrev && gridPrev.dataset.cat && !gridPrev.disabled) { const cat = gridPrev.dataset.cat; expenseCatPages[cat] = Math.max(0, expenseCatPages[cat] - 1); document.getElementById('expenseContent')!.innerHTML = expenseView(); return; }
  const gridNext = target.closest<HTMLButtonElement>('.expense-grid-next');
  if (gridNext && gridNext.dataset.cat && !gridNext.disabled) { const cat = gridNext.dataset.cat; expenseCatPages[cat]++; document.getElementById('expenseContent')!.innerHTML = expenseView(); return; }
  const category = target.closest<HTMLButtonElement>('.cook-nav-btn');
  if (category) {
    const root = category.closest('.cookbook');
    root?.querySelectorAll('.cook-nav-btn').forEach(button => button.classList.toggle('active', button === category));
    root?.querySelectorAll<HTMLElement>('.cook-cat-panel').forEach(panel => { panel.hidden = panel.dataset.cat !== category.dataset.cat; });
    return;
  }
  const recipe = target.closest<HTMLButtonElement>('.cook-rec-head');
  if (recipe) {
    const body = recipe.parentElement?.querySelector<HTMLElement>('.cook-rec-body');
    if (body) body.hidden = !body.hidden;
    recipe.classList.toggle('open', body ? !body.hidden : false);
    return;
  }
  const area = target.closest<HTMLButtonElement>('[data-fm-area]');
  if (area) {
    const value = area.dataset.fmArea;
    document.querySelectorAll('[data-fm-area]').forEach(button => button.classList.toggle('active', button === area));
    document.querySelectorAll<HTMLElement>('[data-fm-area-content]').forEach(content => { content.hidden = content.dataset.fmAreaContent !== value; });
    const first = document.querySelector<HTMLButtonElement>(`[data-fm-area-content="${CSS.escape(value || '')}"] [data-fm-location]`);
    first?.click();
    return;
  }
  const location = target.closest<HTMLButtonElement>('[data-fm-location]');
  if (location) {
    const parent = location.closest('[data-fm-area-content]');
    parent?.querySelectorAll('[data-fm-location]').forEach(button => button.classList.toggle('active', button === location));
    parent?.querySelectorAll<HTMLElement>('[data-fm-location-content]').forEach(content => { content.hidden = content.dataset.fmLocationContent !== location.dataset.fmLocation; });
    return;
  }
  const relation = target.closest<HTMLButtonElement>('[data-rl-cat]');
  if (relation) {
    const categoryValue = relation.dataset.rlCat;
    document.querySelectorAll('[data-rl-cat]').forEach(button => button.classList.toggle('active', button === relation));
    document.querySelectorAll<HTMLElement>('.tl-cat-travel, .tl-cat-xian, .tl-cat-quarrel').forEach(item => { item.hidden = categoryValue !== 'all' && !item.classList.contains(`tl-cat-${categoryValue}`); });
    return;
  }
  const quarrel = target.closest<HTMLElement>('[data-rl-q-toggle]');
  if (quarrel) {
    const body = quarrel.parentElement?.querySelector<HTMLElement>('.q-body');
    body?.classList.toggle('collapsed');
    quarrel.classList.toggle('open', !body?.classList.contains('collapsed'));
  }
});

readQueryState();
setupAccordions();
refresh();
