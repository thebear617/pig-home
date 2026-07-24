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
  }
}

type CalendarState = { year: number; month: number; selected: string | null; view: 'daily' | 'utility' };

const page = document.body.dataset.page || '';
const now = new Date();
const state: CalendarState = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  selected: null,
  view: 'daily',
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function readQueryState() {
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get('view') || params.get('focus');
  state.view = requestedView === 'utility' ? 'utility' : 'daily';
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

function utilityGrid() {
  const records = window.__utilityRecords || {};
  return calendarFrame((day, today) => {
    const key = dateKey(state.year, state.month, day);
    const record = records[key];
    const classes = ['cal-cell'];
    if (today) classes.push('cal-today');
    if (record) classes.push('cal-has-data');
    if (state.selected === key) classes.push('cal-selected');
    return `<div class="${classes.join(' ')}" data-date="${key}">${lunarText(state.year, state.month, day)}<span class="cal-date${today ? ' cal-date-today' : ''}">${day}日</span>${record ? `<span class="cal-balance">¥${record.elecRemaining.toFixed(2)}</span>` : ''}</div>`;
  });
}

function utilitySummary() {
  const prefix = `${state.year}-${pad(state.month)}`;
  const records = Object.entries(window.__utilityRecords || {})
    .filter(([key]) => key.startsWith(prefix))
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (records.length < 2) return '';
  const first = records[0].elecRemaining;
  const last = records[records.length - 1].elecRemaining;
  const recharge = records.reduce((sum, record) => sum + (record.recharge || 0), 0);
  const total = first + recharge - last;
  const span = Math.max(1, Math.round((new Date(records.at(-1)!.date).getTime() - new Date(records[0].date).getTime()) / 86400000));
  return `<div class="summary-bar"><div class="summary-item"><span class="summary-label">${state.month}月累计用电</span><span class="summary-value">${total.toFixed(2)} 元</span></div><div class="summary-divider"></div><div class="summary-item"><span class="summary-label">日均</span><span class="summary-value">${(total / span).toFixed(2)} 元</span></div><div class="summary-divider"></div><div class="summary-item"><span class="summary-label">记录</span><span class="summary-value">${records.length} 天</span></div></div>`;
}

function utilityDetail(key: string | null) {
  if (!key) return '';
  const record = window.__utilityRecords?.[key];
  if (!record) return '';
  const records = Object.entries(window.__utilityRecords || {})
    .filter(([date]) => date.startsWith(key.slice(0, 7)))
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const index = records.findIndex(item => item.date === key);
  const next = records[index + 1];
  const day = new Date(`${key}T00:00:00`);
  let html = `<div class="detail-panel"><div class="detail-header"><span class="detail-title">${day.getMonth() + 1}月${day.getDate()}日</span><button class="detail-close util-dc">✕</button></div><div class="detail-body"><div class="detail-row"><span class="detail-label">剩余电费</span><span class="detail-val">${record.elecRemaining.toFixed(2)} 元</span></div>`;
  if (record.recharge) html += `<div class="detail-row"><span class="detail-label">当日充值</span><span class="detail-val" style="color:#047857">+${record.recharge.toFixed(2)} 元</span></div>`;
  if (next) {
    const beforeRecharge = next.elecRemaining - (next.recharge || 0);
    const consumption = record.elecRemaining - beforeRecharge;
    html += `<div class="detail-row"><span class="detail-label">当日消耗</span><span class="detail-val consumption">${consumption.toFixed(2)} 元</span></div>`;
  }
  return `${html}</div></div>`;
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
    if (meal.prep) html += `<div class="food-meta-item"><span class="food-meta-label">餐前备菜</span><span class="food-meta-value">${escape(meal.prep)} 分钟</span></div>`;
    if (meal.cleanup) html += `<div class="food-meta-item"><span class="food-meta-label">收拾后厨</span><span class="food-meta-value">${escape(meal.cleanup)} 分钟</span></div>`;
    html += '</div></div>';
  }
  return `${html}</div></div>`;
}

function dailyGrid() {
  const diary = window.__diaryRecords || {};
  const expenses = window.__expenseRecords || [];
  const special = window.__specialEvents || {};
  const hema = window.__hemaDayRecords || {};
  return calendarFrame((day, today) => {
    const key = dateKey(state.year, state.month, day);
    const record = diary[key];
    const hasExpense = expenses.some(item => item.date === key);
    const monday = new Date(`${key}T00:00:00`).getDay() === 1;
    const event = special[key];
    const classes = ['cal-cell'];
    if (today) classes.push('cal-today');
    if (record || hasExpense || monday) classes.push('cal-has-data');
    if (monday) classes.push('cal-hema-day');
    if (state.selected === key) classes.push('cal-selected');
    if (event) classes.push('cal-special');
    return `<div class="${classes.join(' ')}" data-date="${key}">${lunarText(state.year, state.month, day)}<span class="cal-date${today ? ' cal-date-today' : ''}">${day}日</span>${hasExpense ? '<span class="cal-expense-dot" title="有支出"></span>' : ''}${monday ? '<span class="cal-hema-badge" title="盒马日">盒马日</span>' : ''}${event ? `<span class="cal-special-icons" title="${escape(event.keywords?.join('、'))}">${event.icons?.join('') || ''}</span>` : ''}</div>`;
  });
}

function dailyDetail(key: string | null) {
  if (!key) return '';
  const record = window.__diaryRecords?.[key];
  const expenses = (window.__expenseRecords || []).filter(item => item.date === key);
  const hema = window.__hemaDayRecords?.[key];
  const monday = new Date(`${key}T00:00:00`).getDay() === 1;
  if (!record && !expenses.length && !hema && !monday) return '';
  const day = new Date(`${key}T00:00:00`);
  let html = `<div class="detail-panel"><div class="detail-header"><span class="detail-title">${day.getMonth() + 1}月${day.getDate()}日</span><button class="detail-close util-dc">✕</button></div><div class="detail-body">`;
  if (record?.tasks?.length) {
    html += `<div class="detail-row"><span class="detail-label">当日日程</span><span class="detail-val">已完成 ${record.value ?? record.tasks.filter((task: any) => task.status === 'x').length} / 共 ${record.tasks.length}</span></div><div class="detail-tasks">`;
    record.tasks.forEach((task: any, index: number) => { html += `<div class="task-item"><span class="task-num">${index + 1}</span><span class="task-time">${escape(task.time)}</span><span class="task-text">${escape(task.desc)}</span></div>`; });
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

function expenseView() {
  const records = (window.__expenseRecords || []).filter(item => item.date.startsWith(`${state.year}-${pad(state.month)}`)).sort((a, b) => b.date.localeCompare(a.date));
  const categories = window.__expenseCategories || [];
  const total = records.reduce((sum, item) => sum + item.amount, 0);
  const days = new Set(records.map(item => item.date)).size;
  let html = total ? `<div class="summary-bar"><div class="summary-item"><span class="summary-label">本月支出</span><span class="summary-value expense-amount">¥${total.toFixed(2)}</span></div><div class="summary-divider"></div><div class="summary-item"><span class="summary-label">记录笔数</span><span class="summary-value">${records.length}</span></div><div class="summary-divider"></div><div class="summary-item"><span class="summary-label">日均</span><span class="summary-value expense-amount">¥${(total / days).toFixed(2)}</span></div></div>` : '<div class="empty-state"><p>本月暂无支出记录</p></div>';
  const groups = categories.map(category => ({ ...category, items: records.filter(item => item.cat === category.name) })).filter(group => group.items.length).sort((a, b) => b.items.reduce((s, item) => s + item.amount, 0) - a.items.reduce((s, item) => s + item.amount, 0));
  for (const group of groups) {
    const groupTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
    html += `<div class="check-section open"><div class="section-header"><div class="section-header-left"><span class="expense-cat-icon">${group.icon}</span><h2>${escape(group.name)}</h2></div><div class="section-header-right"><span class="expense-cat-amount">¥${groupTotal.toFixed(2)}</span><span class="section-count">${group.items.length}</span><span class="section-arrow">▸</span></div></div><div class="section-body">`;
    for (const item of group.items) {
      const date = new Date(`${item.date}T00:00:00`);
      html += `<div class="expense-item"><div class="expense-item-left"><span class="expense-item-sub">${escape(item.sub)}</span>${item.note ? `<span class="expense-item-note">${escape(item.note)}</span>` : ''}</div><div class="expense-item-right"><span class="expense-item-amount">¥${item.amount.toFixed(2)}</span><span class="expense-item-date">${date.getMonth() + 1}/${date.getDate()}</span></div></div>`;
    }
    html += '</div></div>';
  }
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

function setTrackerView(view: 'daily' | 'utility') {
  document.querySelectorAll<HTMLButtonElement>('[data-tracker-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.trackerView === view);
  });
  document.querySelectorAll<HTMLElement>('[data-tracker-panel]').forEach(panel => {
    panel.hidden = panel.dataset.trackerPanel !== view;
  });
}

function refresh() {
  if (page === 'utility-tracking' || (page === 'daily-tracker' && state.view === 'utility')) {
    document.getElementById('utilCalendar')!.innerHTML = utilityGrid();
    document.querySelector('[data-tab="utility-tracking"] .summary-container')!.innerHTML = utilitySummary();
    document.getElementById('utilDetail')!.innerHTML = utilityDetail(state.selected);
    setTitle('[data-tab="utility-tracking"] .cal-title');
  } else if (page === 'food-records') {
    document.getElementById('foodCalendar')!.innerHTML = foodGrid();
    document.querySelector('.food-detail-container')!.innerHTML = foodDetail(state.selected);
    setTitle('[data-tab="food-records"] .cal-title');
  } else if (page === 'daily-tracker' && state.view === 'daily') {
    document.getElementById('dailyCalendar')!.innerHTML = dailyGrid();
    document.getElementById('dailyDetail')!.innerHTML = dailyDetail(state.selected);
    document.getElementById('dailySummary')!.innerHTML = dailySummary();
    setTitle('[data-tab="daily-tracker"] .cal-title');
  } else if (page === 'expense-records') {
    document.getElementById('expenseContent')!.innerHTML = expenseView();
    setTitle('[data-tab="expense-records"] .cal-title', `${monthTitle()} · 支出`);
    setupAccordions(document.getElementById('expenseContent')!);
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
  const trackerView = target.closest<HTMLButtonElement>('[data-tracker-view]');
  if (trackerView && (trackerView.dataset.trackerView === 'daily' || trackerView.dataset.trackerView === 'utility')) {
    state.view = trackerView.dataset.trackerView;
    state.selected = null;
    setTrackerView(state.view);
    writeQueryState();
    refresh();
    return;
  }
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
setTrackerView(state.view);
setupAccordions();
refresh();
