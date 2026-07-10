const TABS = [
  { id: 'follow-up', title: '生活备忘录及物资采购', icon: '📋' },
  { id: 'utility-tracking', title: '水电追踪', icon: '⚡' },
  { id: 'food-records', title: '美食记录与做饭心得', icon: '🍳' },
  { id: 'food-map', title: '美食地图', icon: '🗺️' },
  { id: 'relationship-timeline', title: '关系时间线', icon: '💞' },
  { id: 'home-map', title: '猪窝地图', icon: '🏠' }
];

const state = {
  activePhase: 'relationship-timeline',
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,
  selectedDay: null,
  foodMapArea: '校内',
  foodMapLocation: null,
  relCategory: 'all'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function pad(n) { return String(n).padStart(2, '0'); }

/* ─── Lunar calendar helpers ─── */

const LUNAR_MONTH_NAMES = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const LUNAR_DAY_MAP = {
  1: '初一', 2: '初二', 3: '初三', 4: '初四', 5: '初五', 6: '初六', 7: '初七', 8: '初八', 9: '初九', 10: '初十',
  11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五', 16: '十六', 17: '十七', 18: '十八', 19: '十九',
  20: '二十', 21: '廿一', 22: '廿二', 23: '廿三', 24: '廿四', 25: '廿五', 26: '廿六', 27: '廿七', 28: '廿八',
  29: '廿九', 30: '三十'
};

const LUNAR_STARTS = [
  [1, 19, 12], [2, 17, 1], [3, 19, 2], [4, 17, 3],
  [5, 17, 4], [6, 15, 5], [7, 15, 6], [8, 13, 7],
  [9, 12, 8], [10, 11, 9], [11, 10, 10], [12, 9, 11]
];

function getLunarDayName(n) { return LUNAR_DAY_MAP[n] || String(n); }

function getLunarInfo(year, month, day) {
  const target = new Date(year, month - 1, day);
  if (month === 1 && day < 19) {
    const prevNov1 = new Date(2025, 11, 21);
    const diff = Math.floor((target - prevNov1) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 30) return { lMonth: 11, lDay: diff + 1, lMonthName: '十一月', isStart: diff === 0 };
    if (diff >= 30) return { lMonth: 12, lDay: diff - 29, lMonthName: '十二月', isStart: diff === 30 };
    return { lMonth: 11, lDay: 20, lMonthName: '十一月', isStart: false };
  }
  let best = null;
  for (const [m, d, lm] of LUNAR_STARTS) {
    const s = new Date(year, m - 1, d);
    if (s <= target) best = { start: s, lMonth: lm };
  }
  if (!best) return { lMonth: 11, lDay: 20, lMonthName: '十一月', isStart: false };
  const diff = Math.floor((target - best.start) / (1000 * 60 * 60 * 24));
  return { lMonth: best.lMonth, lDay: diff + 1, lMonthName: LUNAR_MONTH_NAMES[best.lMonth], isStart: diff + 1 === 1 };
}

/* ─── Utility helpers ─── */

function dateKey(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getMonthRecords(year, month) {
  const prefix = `${year}-${pad(month)}`;
  const result = [];
  for (const [key, record] of Object.entries(utilityRecords)) {
    if (key.startsWith(prefix)) result.push({ dateKey: key, ...record });
  }
  result.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return result;
}

function getFoodMonthRecords(year, month) {
  const prefix = `${year}-${pad(month)}`;
  const result = [];
  for (const [key, meals] of Object.entries(foodRecords)) {
    if (!key.startsWith(prefix)) continue;
    for (const meal of meals) {
      result.push({ dateKey: key, ...meal });
    }
  }
  result.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return result;
}

/* ─── Sidebar navigation ─── */

function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;
  nav.innerHTML = TABS.map(tab => {
    const active = tab.id === state.activePhase ? ' active' : '';
    return `<button class="sidebar-item${active}" data-phase="${tab.id}">
      <span class="sidebar-icon">${tab.icon}</span>
      <span>${escapeHtml(tab.title)}</span>
    </button>`;
  }).join('');
}

/* ─── Sidebar toggle (mobile) ─── */

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
  document.body.style.overflow = '';
}

function openSidebar() {
  document.body.classList.add('sidebar-open');
  document.body.style.overflow = 'hidden';
}

/* ─── Checklist view ─── */

function buildChecklistView(phase) {
  let html = '<div class="checklist-plain">';
  for (const section of phase.sections) {
    html += `<section class="check-section open" data-section="${escapeHtml(section.title)}">`;
    html += '<div class="section-header"><div class="section-header-left">';
    html += `<h2>${escapeHtml(section.title)}</h2>`;
    html += '</div><div class="section-header-right">';
    html += `<span class="section-count">${section.items.length} 项</span>`;
    html += '<span class="section-arrow">▸</span>';
    html += '</div></div><div class="section-body"><ol class="checklist-ol">';
    for (const item of section.items) {
      html += '<li>';
      html += `<span class="checklist-q">${escapeHtml(item.q)}</span>`;
      if (item.note) html += `<p class="checklist-note">${escapeHtml(item.note)}</p>`;
      if (item.children) {
        html += '<ul class="checklist-sub">';
        for (const child of item.children) html += `<li>${escapeHtml(child)}</li>`;
        html += '</ul>';
      }
      html += '</li>';
    }
    html += '</ol></div></section>';
  }
  html += '</div>';
  return html;
}

/* ─── Detail panel ─── */

function buildDetailPanel() {
  if (!state.selectedDay) return '';
  const record = utilityRecords[state.selectedDay];
  if (!record) return '';

  const records = getMonthRecords(state.calendarYear, state.calendarMonth);
  const idx = records.findIndex(r => r.dateKey === state.selectedDay);
  let nextRecord = null, consumption = null, nextRecharge = 0, nextPreBalance = 0;
  if (idx >= 0 && idx < records.length - 1) {
    nextRecord = records[idx + 1];
    nextRecharge = nextRecord.recharge || 0;
    nextPreBalance = nextRecord.elecRemaining - nextRecharge;
    consumption = record.elecRemaining - nextPreBalance;
  }

  const d = new Date(state.selectedDay + 'T00:00:00');
  const dayName = `${d.getMonth() + 1}月${d.getDate()}日`;

  let html = '<div class="detail-panel">';
  html += '<div class="detail-header">';
  html += `<span class="detail-title">${dayName}</span>`;
  html += '<button class="detail-close" id="detailClose" title="关闭">✕</button>';
  html += '</div>';
  html += '<div class="detail-body">';
  html += `<div class="detail-row">
    <span class="detail-label">剩余电费</span>
    <span class="detail-val">${record.elecRemaining.toFixed(2)} 元</span>
  </div>`;
  if (record.recharge) {
    html += `<div class="detail-row">
      <span class="detail-label">当日充值</span>
      <span class="detail-val" style="color:var(--green)">+${record.recharge.toFixed(2)} 元</span>
      <span class="detail-note">（充值前余额 ${(record.elecRemaining - record.recharge).toFixed(2)}）</span>
    </div>`;
  }
  if (consumption !== null) {
    html += `<div class="detail-row">
      <span class="detail-label">当日消耗</span>
      <span class="detail-val consumption">${consumption.toFixed(2)} 元</span>`;
    if (nextRecharge > 0) {
      html += `<span class="detail-note">（次日充值前余额 ${nextPreBalance.toFixed(2)}，充值后 ${nextRecord.elecRemaining.toFixed(2)}）</span>`;
    } else {
      html += `<span class="detail-note">（次日剩余 ${nextRecord.elecRemaining.toFixed(2)}）</span>`;
    }
    html += `</div>`;
  } else {
    html += `<div class="detail-row muted">
      <span class="detail-label">当日消耗</span>
      <span class="detail-val">—</span>
      <span class="detail-note">无次日数据</span>
    </div>`;
  }
  html += '</div></div>';
  return html;
}

/* ─── Summary bar ─── */

function buildSummaryBar() {
  const records = getMonthRecords(state.calendarYear, state.calendarMonth);
  if (records.length < 2) return '';

  const first = records[0].elecRemaining;
  const last = records[records.length - 1].elecRemaining;
  const totalRecharge = records.reduce((sum, r) => sum + (r.recharge || 0), 0);
  const total = first + totalRecharge - last;

  const d1 = new Date(records[0].dateKey + 'T00:00:00');
  const d2 = new Date(records[records.length - 1].dateKey + 'T00:00:00');
  const spanDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) || 1;
  const dailyAvg = total / spanDays;

  let html = '<div class="summary-bar">';
  html += '<div class="summary-item">';
  html += `<span class="summary-label">${state.calendarMonth}月累计用电</span>`;
  html += `<span class="summary-value">${total.toFixed(2)} 元</span>`;
  html += '</div>';
  html += '<div class="summary-divider"></div>';
  html += '<div class="summary-item">';
  html += '<span class="summary-label">日均</span>';
  html += `<span class="summary-value">${dailyAvg.toFixed(2)} 元</span>`;
  html += '</div>';
  html += '<div class="summary-divider"></div>';
  html += '<div class="summary-item">';
  html += '<span class="summary-label">记录</span>';
  html += `<span class="summary-value">${records.length} 天</span>`;
  html += '</div>';
  html += '</div>';
  return html;
}

/* ─── Calendar view ─── */

function buildCalendarView() {
  const today = new Date();
  const calYear = state.calendarYear;
  const calMonth = state.calendarMonth;

  const firstDay = new Date(calYear, calMonth - 1, 1);
  const lastDay = new Date(calYear, calMonth, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = firstDay.getDay();

  const prevMonthLastDay = new Date(calYear, calMonth - 1, 0).getDate();

  let html = '<div class="calendar-view">';

  html += '<div class="cal-header">';
  html += `<span class="cal-title">${calYear}年${calMonth}月</span>`;
  html += '<div class="cal-nav">';
  html += '<button class="cal-nav-btn" id="calPrev" title="上一月">◀</button>';
  html += '<button class="cal-today-btn" id="calToday">今天</button>';
  html += '<button class="cal-nav-btn" id="calNext" title="下一月">▶</button>';
  html += '</div></div>';

  html += '<div class="cal-weekdays">';
  for (const w of ['日', '一', '二', '三', '四', '五', '六']) {
    html += `<span class="cal-weekday">${w}</span>`;
  }
  html += '</div>';

  html += '<div class="cal-grid">';

  for (let i = 0; i < startDow; i++) {
    const d = prevMonthLastDay - startDow + i + 1;
    const lunar = getLunarInfo(calYear, calMonth - 1, d);
    html += `<div class="cal-cell cal-other-month">
      <span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>
      <span class="cal-date">${d}日</span>
    </div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() + 1 && d === today.getDate();
    const lunar = getLunarInfo(calYear, calMonth, d);
    const key = dateKey(calYear, calMonth, d);
    const record = utilityRecords[key];
    const isSelected = key === state.selectedDay;

    let cls = 'cal-cell';
    if (isToday) cls += ' cal-today';
    if (record) cls += ' cal-has-data';
    if (isSelected) cls += ' cal-selected';

    html += `<div class="${cls}" data-date="${key}">`;
    html += `<span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>`;
    html += `<span class="cal-date${isToday ? ' cal-date-today' : ''}">${d}日</span>`;
    if (record) {
      html += `<span class="cal-balance">¥${record.elecRemaining.toFixed(2)}</span>`;
    }
    html += '</div>';
  }

  const totalCells = startDow + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    const lunar = getLunarInfo(calYear, calMonth + 1, d);
    html += `<div class="cal-cell cal-other-month">
      <span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>
      <span class="cal-date">${d}日</span>
    </div>`;
  }

  html += '</div>';
  html += '</div>';

  html += buildDetailPanel();
  html += buildSummaryBar();

  return html;
}

/* ─── Food calendar view ─── */

function buildFoodCalendarView() {
  const today = new Date();
  const calYear = state.calendarYear;
  const calMonth = state.calendarMonth;

  const firstDay = new Date(calYear, calMonth - 1, 1);
  const lastDay = new Date(calYear, calMonth, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = firstDay.getDay();

  const prevMonthLastDay = new Date(calYear, calMonth - 1, 0).getDate();

  let html = '<div class="calendar-view">';

  html += '<div class="cal-header">';
  html += `<span class="cal-title">${calYear}年${calMonth}月</span>`;
  html += '<div class="cal-nav">';
  html += '<button class="cal-nav-btn" id="calPrev" title="上一月">◀</button>';
  html += '<button class="cal-today-btn" id="calToday">今天</button>';
  html += '<button class="cal-nav-btn" id="calNext" title="下一月">▶</button>';
  html += '</div></div>';

  html += '<div class="cal-weekdays">';
  for (const w of ['日', '一', '二', '三', '四', '五', '六']) {
    html += `<span class="cal-weekday">${w}</span>`;
  }
  html += '</div>';

  html += '<div class="cal-grid">';

  for (let i = 0; i < startDow; i++) {
    const d = prevMonthLastDay - startDow + i + 1;
    const lunar = getLunarInfo(calYear, calMonth - 1, d);
    html += `<div class="cal-cell cal-other-month">
      <span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>
      <span class="cal-date">${d}日</span>
    </div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() + 1 && d === today.getDate();
    const lunar = getLunarInfo(calYear, calMonth, d);
    const key = dateKey(calYear, calMonth, d);
    const record = foodRecords[key];
    const isSelected = key === state.selectedDay;

    let cls = 'cal-cell';
    if (isToday) cls += ' cal-today';
    if (record) cls += ' cal-has-data';
    if (isSelected) cls += ' cal-selected';

    html += `<div class="${cls}" data-date="${key}">`;
    html += `<span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>`;
    html += `<span class="cal-date${isToday ? ' cal-date-today' : ''}">${d}日</span>`;
    if (record) {
      html += `<span class="cal-balance food-indicator">🍳</span>`;
    }
    html += '</div>';
  }

  const totalCells = startDow + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    const lunar = getLunarInfo(calYear, calMonth + 1, d);
    html += `<div class="cal-cell cal-other-month">
      <span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>
      <span class="cal-date">${d}日</span>
    </div>`;
  }

  html += '</div></div>';

  html += buildFoodDetailPanel();
  html += buildFoodSummaryBar();

  return html;
}

function buildCookingTipsGrid(phase) {
  const tips = phase.cookingTips || [];
  if (!tips.length) {
    return '<div class="tips-empty">还没有做饭心得，先在 personal 记下做饭日程，再在这里沉淀技巧吧～</div>';
  }
  let html = '<div class="tips-grid">';
  for (const cat of tips) {
    html += '<div class="tips-card">';
    html += '<div class="tips-card-head">';
    html += `<span class="tips-icon">${cat.icon || '🍳'}</span>`;
    html += `<h3 class="tips-title">${escapeHtml(cat.category)}</h3>`;
    html += `<span class="tips-count">${cat.tips.length} 条</span>`;
    html += '</div>';
    html += '<ul class="tips-list">';
    for (const t of cat.tips) {
      const line = (t || '').trim();
      if (!line) continue;
      html += `<li>${escapeHtml(line)}</li>`;
    }
    html += '</ul></div>';
  }
  html += '</div>';
  return html;
}

function setupFoodViews() {
  const tabs = document.getElementById('foodViewTabs');
  if (!tabs) return;
  tabs.querySelectorAll('.food-view-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      tabs.querySelectorAll('.food-view-tab').forEach(b => b.classList.toggle('active', b === btn));
      const root = tabs.closest('.food-views');
      if (!root) return;
      root.querySelectorAll('.food-view-panel').forEach(p => {
        p.hidden = p.dataset.panel !== view;
      });
    });
  });
}

function buildFoodDetailPanel() {
  if (!state.selectedDay) return '';
  const meals = foodRecords[state.selectedDay];
  if (!meals || meals.length === 0) return '';

  const d = new Date(state.selectedDay + 'T00:00:00');
  const dayName = `${d.getMonth() + 1}月${d.getDate()}日`;

  let html = '<div class="detail-panel food-detail">';
  html += '<div class="detail-header">';
  html += `<span class="detail-title">${dayName} 美食记录</span>`;
  html += '<button class="detail-close" id="detailClose" title="关闭">✕</button>';
  html += '</div>';
  html += '<div class="detail-body">';

  meals.forEach((meal, idx) => {
    if (idx > 0) html += '<div class="food-divider"></div>';
    html += '<div class="food-meal-block">';
    html += `<div class="food-meal-head"><span class="food-meal-tag">${escapeHtml(meal.meal || '餐')}</span></div>`;
    html += '<div class="food-dishes">';
    for (const dish of meal.dishes) {
      html += `<div class="food-dish-card">
        <span class="food-dish-icon">🥘</span>
        <span class="food-dish-name">${escapeHtml(dish)}</span>
      </div>`;
    }
    html += '</div>';
    html += '<div class="food-meta-grid">';
    html += `<div class="food-meta-item">
      <span class="food-meta-label">花费</span>
      <span class="food-meta-value food-cost">${meal.cost} 元</span>
    </div>`;
    html += `<div class="food-meta-item">
      <span class="food-meta-label">主厨</span>
      <span class="food-meta-value">${escapeHtml(meal.chef)}</span>
    </div>`;
    if (meal.helper) {
      html += `<div class="food-meta-item">
        <span class="food-meta-label">帮手</span>
        <span class="food-meta-value">${escapeHtml(meal.helper)}</span>
      </div>`;
    }
    html += '</div>';
    html += '</div>';
  });

  html += '</div></div>';
  return html;
}

function buildFoodSummaryBar() {
  const records = getFoodMonthRecords(state.calendarYear, state.calendarMonth);
  if (records.length === 0) return '';

  let totalCost = 0;
  for (const r of records) totalCost += r.cost || 0;

  const cookCount = records.filter(r => r.meal === '中饭' || r.meal === '晚饭').length;

  let html = '<div class="summary-bar">';
  html += '<div class="summary-item">';
  html += `<span class="summary-label">${state.calendarMonth}月做饭</span>`;
  html += `<span class="summary-value">${cookCount} 次</span>`;
  html += '</div>';
  html += '<div class="summary-divider"></div>';
  html += '<div class="summary-item">';
  html += '<span class="summary-label">花费</span>';
  html += `<span class="summary-value">${totalCost} 元</span>`;
  html += '</div>';
  html += '</div>';
  return html;
}

/* ─── Accordion ─── */

function setupAccordion() {
  const headers = document.querySelectorAll('.section-header');
  for (const header of headers) {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      section.classList.toggle('open');
      section.classList.toggle('collapsed');
      const body = section.querySelector('.section-body');
      body.style.maxHeight = section.classList.contains('open') ? body.scrollHeight + 'px' : '0px';
    });
  }
  const bodies = document.querySelectorAll('.section-body');
  for (const body of bodies) {
    const section = body.parentElement;
    body.style.maxHeight = section.classList.contains('open') ? body.scrollHeight + 'px' : '0px';
  }
}

/* ─── Calendar navigation & interaction ─── */

function setupCalendar() {
  const prevBtn = document.getElementById('calPrev');
  const nextBtn = document.getElementById('calNext');
  const todayBtn = document.getElementById('calToday');
  const closeBtn = document.getElementById('detailClose');

  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (state.calendarMonth === 1) { state.calendarYear--; state.calendarMonth = 12; }
    else state.calendarMonth--;
    state.selectedDay = null;
    renderApp();
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (state.calendarMonth === 12) { state.calendarYear++; state.calendarMonth = 1; }
    else state.calendarMonth++;
    state.selectedDay = null;
    renderApp();
  });

  if (todayBtn) todayBtn.addEventListener('click', () => {
    const now = new Date();
    state.calendarYear = now.getFullYear();
    state.calendarMonth = now.getMonth() + 1;
    state.selectedDay = null;
    renderApp();
  });

  if (closeBtn) closeBtn.addEventListener('click', () => {
    state.selectedDay = null;
    renderApp();
  });

  const cells = document.querySelectorAll('.cal-has-data');
  for (const cell of cells) {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      if (date === state.selectedDay) {
        state.selectedDay = null;
      } else {
        state.selectedDay = date;
      }
      renderApp();
    });
  }
}

/* ─── Map view ─── */

function buildMapView() {
  let html = '';
  html += '<div class="floor-plan">';
  html += '<svg viewBox="0 0 800 500" class="fp-svg">';

  html += '<rect x="0" y="0" width="280" height="200" rx="6" class="fp-room fp-master"/>';
  html += '<text x="140" y="100" class="fp-room-label">主卧</text>';
  html += '<text x="140" y="122" class="fp-room-area">~12㎡</text>';

  html += '<rect x="0" y="200" width="140" height="120" rx="6" class="fp-room fp-bath"/>';
  html += '<text x="70" y="260" class="fp-room-label">卫生间</text>';
  html += '<text x="70" y="282" class="fp-room-area">~4㎡</text>';

  html += '<rect x="140" y="200" width="140" height="120" rx="6" class="fp-room fp-wash"/>';
  html += '<text x="210" y="260" class="fp-room-label">洗漱台</text>';

  html += '<rect x="380" y="320" width="420" height="180" rx="6" class="fp-room fp-kitchen"/>';
  html += '<text x="590" y="410" class="fp-room-label">厨房</text>';
  html += '<text x="590" y="432" class="fp-room-area">~12㎡</text>';

  html += '<rect x="280" y="320" width="100" height="180" rx="6" class="fp-room fp-entry"/>';
  html += '<text x="330" y="415" class="fp-room-label fp-vertical-label">入户通道</text>';

  html += '<rect x="0" y="320" width="280" height="180" rx="6" class="fp-room fp-second"/>';
  html += '<text x="140" y="410" class="fp-room-label">次卧</text>';
  html += '<text x="140" y="432" class="fp-room-area">~7㎡</text>';

  html += '<rect x="280" y="0" width="520" height="320" rx="6" class="fp-room fp-living"/>';
  html += '<text x="540" y="150" class="fp-room-label fp-label-large">餐厅 + 客厅</text>';
  html += '<text x="540" y="178" class="fp-room-area fp-area-large">~30㎡</text>';

  html += '<path d="M310 500 L310 470 L350 470 L350 500" class="fp-door"/>';
  html += '<text x="330" y="465" class="fp-door-label">入户门</text>';

  html += '</svg>';
  html += '</div>';

  html += '<div class="location-section">';
  html += '<h2 class="location-title">重要物品存放</h2>';
  html += '<div class="map-grid">';
  for (const loc of locations) {
    html += '<div class="map-card">';
    html += `<h3 class="map-item-name">${escapeHtml(loc.item)}</h3>`;
    html += `<p class="map-location">${escapeHtml(loc.location)}</p>`;
    html += '</div>';
  }
  html += '</div>';
  html += '</div>';

  return html;
}

/* ─── Food map view ─── */

function buildFoodMapView() {
  const areas = {};
  for (const place of foodPlaces) {
    const area = place.area || '未分类';
    if (!areas[area]) areas[area] = {};
    if (!areas[area][place.location]) areas[area][place.location] = [];
    areas[area][place.location].push(place);
  }

  for (const area of Object.keys(areas)) {
    for (const loc of Object.keys(areas[area])) {
      areas[area][loc].sort((a, b) => b.date.localeCompare(a.date));
    }
  }

  const areaOrder = ['校内', '校外'].filter(a => areas[a]);
  const otherAreas = Object.keys(areas).filter(a => !areaOrder.includes(a)).sort();
  areaOrder.push(...otherAreas);

  if (state.foodMapArea && !areas[state.foodMapArea]) {
    state.foodMapArea = areaOrder[0];
  }
  if (!state.foodMapArea) state.foodMapArea = areaOrder[0] || '';

  const currentArea = state.foodMapArea;
  const locations = areas[currentArea] ? Object.keys(areas[currentArea]).sort() : [];

  if (state.foodMapLocation && !locations.includes(state.foodMapLocation)) {
    state.foodMapLocation = locations[0] || null;
  }
  if (!state.foodMapLocation && locations.length) {
    state.foodMapLocation = locations[0];
  }

  let html = '';

  /* Top-level area cards */
  html += '<div class="foodmap-cards" data-fm="area">';
  for (const area of areaOrder) {
    const locCount = Object.keys(areas[area]).length;
    const active = area === currentArea ? ' active' : '';
    html += `<button class="foodmap-card${active}" data-fm-area="${escapeHtml(area)}">
      <span class="foodmap-card-label">${escapeHtml(area)}</span>
      <span class="foodmap-card-sub">${locCount} 个地点</span>
    </button>`;
  }
  html += '</div>';

  if (!currentArea || !locations.length) {
    html += '<div class="empty-state"><p>还没记录好吃的，快去探店吧 🍜</p></div>';
    return html;
  }

  /* Sub-tabs for locations */
  html += '<div class="foodmap-tabs" data-fm="location">';
  for (const loc of locations) {
    const places = areas[currentArea][loc];
    const active = loc === state.foodMapLocation ? ' active' : '';
    html += `<button class="foodmap-tab${active}" data-fm-location="${escapeHtml(loc)}">
      📍 ${escapeHtml(loc)}
      <span class="foodmap-tab-count">${places.length}</span>
    </button>`;
  }
  html += '</div>';

  /* Restaurant cards for selected location */
  const selectedPlaces = areas[currentArea][state.foodMapLocation] || [];
  html += '<div class="food-grid">';
  for (const place of selectedPlaces) {
    html += '<div class="food-card">';
    html += '<div class="food-card-top">';
    html += `<h4 class="food-card-name">${escapeHtml(place.name)}</h4>`;
    html += `<span class="food-card-date">${escapeHtml(place.date)}</span>`;
    html += '</div>';
    html += '<div class="food-card-dishes">';
    for (const dish of place.dishes) {
      html += `<span class="food-tag">${escapeHtml(dish)}</span>`;
    }
    html += '</div>';
    if (place.note) {
      html += `<p class="food-card-note">${escapeHtml(place.note)}</p>`;
    }
    html += '</div>';
  }
  html += '</div>';

  return html;
}

function setupFoodMap() {
  const areaCards = document.querySelectorAll('[data-fm-area]');
  for (const btn of areaCards) {
    btn.addEventListener('click', () => {
      state.foodMapArea = btn.dataset.fmArea;
      state.foodMapLocation = null;
      renderApp();
    });
  }

  const locTabs = document.querySelectorAll('[data-fm-location]');
  for (const btn of locTabs) {
    btn.addEventListener('click', () => {
      state.foodMapLocation = btn.dataset.fmLocation;
      renderApp();
    });
  }
}

/* ─── Travel timeline view ─── */

function buildTravelTimeline(tripsData = trips) {
  const sorted = [...tripsData].sort((a, b) => a.startDate.localeCompare(b.startDate));

  let html = '<div class="timeline">';

  const months = {};
  for (const trip of sorted) {
    const d = new Date(trip.startDate + 'T00:00:00');
    const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (!months[key]) months[key] = [];
    months[key].push(trip);
  }

  for (const [monthKey, monthTrips] of Object.entries(months)) {
    html += `<div class="timeline-month">${monthKey}</div>`;
    for (const trip of monthTrips) {
      const isUpcoming = trip.status === 'upcoming';
      const startD = new Date(trip.startDate + 'T00:00:00');
      const endD = new Date(trip.endDate + 'T00:00:00');
      const dateStr = trip.startDate === trip.endDate
        ? `${startD.getMonth() + 1}/${startD.getDate()}`
        : `${startD.getMonth() + 1}/${startD.getDate()} - ${endD.getMonth() + 1}/${endD.getDate()}`;

      html += '<div class="timeline-item">';
      html += '<div class="timeline-marker">';
      html += `<div class="timeline-dot${isUpcoming ? ' tl-dot-upcoming' : ' tl-dot-done'}"></div>`;
      html += '<div class="timeline-line"></div>';
      html += '</div>';
      html += '<div class="timeline-card">';
      html += '<div class="timeline-card-top">';
      html += `<h3 class="timeline-card-title">${escapeHtml(trip.dest)}</h3>`;
      html += `<span class="timeline-badge${isUpcoming ? ' tl-badge-upcoming' : ' tl-badge-done'}">${isUpcoming ? '计划中' : '已完成'}</span>`;
      html += '</div>';
      html += `<div class="timeline-card-meta">`;
      html += `<span class="tl-meta">📅 ${dateStr}</span>`;
      html += `<span class="tl-meta">🚗 ${escapeHtml(trip.transport)}</span>`;
      html += `<span class="tl-meta">👤 ${trip.travelers.map(t => escapeHtml(t)).join('、')}</span>`;
      html += '</div>';
      if (trip.note) {
        html += `<p class="timeline-card-note">${escapeHtml(trip.note)}</p>`;
      }
      html += '</div>';
      html += '</div>';
    }
  }

  html += '</div>';
  return html;
}

/* ─── Relationship timeline (travel + xian + quarrel) ─── */

function qField(label, text) {
  return `<div class="q-field">
    <span class="q-field-label">${escapeHtml(label)}</span>
    <p class="q-field-text">${escapeHtml(text)}</p>
  </div>`;
}

function buildTravelCard(trip) {
  const isUpcoming = trip.status === 'upcoming';
  const startD = new Date(trip.startDate + 'T00:00:00');
  const endD = new Date(trip.endDate + 'T00:00:00');
  const dateStr = trip.startDate === trip.endDate
    ? `${startD.getMonth() + 1}/${startD.getDate()}`
    : `${startD.getMonth() + 1}/${startD.getDate()} - ${endD.getMonth() + 1}/${endD.getDate()}`;
  let html = '<div class="timeline-card-top">';
  html += `<h3 class="timeline-card-title">${escapeHtml(trip.dest)}</h3>`;
  html += `<span class="timeline-badge ${isUpcoming ? 'tl-badge-upcoming' : 'tl-badge-done'}">${isUpcoming ? '计划中' : '已完成'}</span>`;
  html += '</div>';
  html += '<div class="timeline-card-meta">';
  html += `<span class="tl-meta">📅 ${dateStr}</span>`;
  html += `<span class="tl-meta">🚗 ${escapeHtml(trip.transport)}</span>`;
  html += `<span class="tl-meta">👤 ${trip.travelers.map(t => escapeHtml(t)).join('、')}</span>`;
  html += '</div>';
  if (trip.note) html += `<p class="timeline-card-note">${escapeHtml(trip.note)}</p>`;
  return html;
}

function buildQuarrelCard(q) {
  const d = new Date(q.date + 'T00:00:00');
  const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  const dateLabel = q.timeRange ? `${dateStr} ${q.timeRange}` : dateStr;
  let html = '<div class="q-header" data-rl="q-toggle">';
  html += '<div class="q-header-main">';
  html += '<div class="timeline-card-top">';
  html += `<h3 class="timeline-card-title">${escapeHtml(q.title)}</h3>`;
  html += `<span class="timeline-badge tl-badge-quarrel">${escapeHtml(q.severity || '吵架')}</span>`;
  html += '</div>';
  html += '<div class="timeline-card-meta">';
  html += `<span class="tl-meta">📅 ${escapeHtml(dateLabel)}</span>`;
  if (q.participants) html += `<span class="tl-meta">👤 ${q.participants.map(t => escapeHtml(t)).join('、')}</span>`;
  html += '</div>';
  html += '</div>';
  html += '<span class="q-chevron" aria-hidden="true">▸</span>';
  html += '</div>';
  html += '<div class="q-body collapsed">';
  if (q.trigger) html += qField('起因', q.trigger);
  if (q.myView) html += qField('我的视角', q.myView);
  if (q.theirView) html += qField('过马路视角', q.theirView);
  if (q.rootCause) html += qField('深层原因', q.rootCause);
  if (q.resolution) html += qField('怎么和好', q.resolution);
  if (q.lesson) html += qField('复盘结论', q.lesson);
  html += '</div>';
  return html;
}

function buildRelTimelineCard(ev) {
  const isQuarrel = ev.cat === 'quarrel';
  const dotClass = isQuarrel ? 'tl-dot-quarrel' : 'tl-dot-done';
  const itemClass = `timeline-item tl-cat-${ev.cat}`;

  let html = `<div class="${itemClass}">`;
  html += '<div class="timeline-marker">';
  html += `<div class="timeline-dot ${dotClass}"></div>`;
  html += '<div class="timeline-line"></div>';
  html += '</div>';
  html += '<div class="timeline-card">';
  html += isQuarrel ? buildQuarrelCard(ev.raw) : buildTravelCard(ev.raw);
  html += '</div></div>';
  return html;
}

function buildRelationshipTimeline() {
  const cats = [
    { key: 'all', label: '全部' },
    { key: 'travel', label: '旅行 ✈️' },
    { key: 'xian', label: '西安 walk 🚶' },
    { key: 'quarrel', label: '吵架复盘 💢' }
  ];
  const counts = {
    travel: trips.length,
    xian: xianTrips.length,
    quarrel: quarrelRecords.length
  };
  const total = counts.travel + counts.xian + counts.quarrel;

  const want = (k) => state.relCategory === 'all' || state.relCategory === k;
  let events = [];
  if (want('travel')) for (const t of trips) events.push({ cat: 'travel', sortDate: t.startDate, raw: t });
  if (want('xian')) for (const t of xianTrips) events.push({ cat: 'xian', sortDate: t.startDate, raw: t });
  if (want('quarrel')) for (const q of quarrelRecords) events.push({ cat: 'quarrel', sortDate: q.date, raw: q });
  events.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  let html = '<div class="rel-wrap">';
  html += '<div class="rel-filter" data-rl="filter">';
  for (const c of cats) {
    const active = c.key === state.relCategory ? ' active' : '';
    const count = c.key === 'all' ? total : (counts[c.key] || 0);
    html += `<button class="rel-filter-tab${active}" data-rl-cat="${c.key}">${c.label}<span class="rel-filter-count">${count}</span></button>`;
  }
  html += '</div>';

  if (events.length === 0) {
    html += '<div class="empty-state"><p>这里还空空如也～</p></div></div>';
    return html;
  }

  const months = {};
  for (const ev of events) {
    const d = new Date(ev.sortDate + 'T00:00:00');
    const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (!months[key]) months[key] = [];
    months[key].push(ev);
  }

  html += '<div class="timeline">';
  for (const [monthKey, monthEvents] of Object.entries(months)) {
    html += `<div class="timeline-month">${monthKey}</div>`;
    for (const ev of monthEvents) html += buildRelTimelineCard(ev);
  }
  html += '</div></div>';
  return html;
}

function setupRelationshipTimeline() {
  const tabs = document.querySelectorAll('[data-rl-cat]');
  for (const btn of tabs) {
    btn.addEventListener('click', () => {
      state.relCategory = btn.dataset.rlCat;
      renderApp();
    });
  }
  const toggles = document.querySelectorAll('[data-rl="q-toggle"]');
  for (const t of toggles) {
    t.addEventListener('click', () => {
      const body = t.parentElement.querySelector('.q-body');
      if (!body) return;
      const collapsed = body.classList.toggle('collapsed');
      t.classList.toggle('open', !collapsed);
    });
  }
}

/* ─── Render ─── */

function buildPhaseContent(phase) {
  if (phase.type === 'checklist') return buildChecklistView(phase);
  if (phase.type === 'calendar') return buildCalendarView();
  if (phase.type === 'food-calendar') {
    let html = '<div class="food-views">';
    html += '<div class="food-view-tabs" id="foodViewTabs">';
    html += '<button class="food-view-tab active" data-view="calendar">📅 美食日历</button>';
    html += '<button class="food-view-tab" data-view="tips">💡 做饭心得</button>';
    html += '</div>';
    html += '<div class="food-view-panel" data-panel="calendar">' + buildFoodCalendarView() + '</div>';
    html += '<div class="food-view-panel" data-panel="tips" hidden>' + buildCookingTipsGrid(phase) + '</div>';
    html += '</div>';
    return html;
  }
  if (phase.type === 'food-map') return buildFoodMapView();
  if (phase.type === 'relationship-timeline') return buildRelationshipTimeline();
  if (phase.type === 'map') return buildMapView();
  return '';
}

function renderApp() {
  const app = document.getElementById('app');
  const phase = phases.find(p => p.id === state.activePhase) || phases[0];

  app.innerHTML = buildPhaseContent(phase);

  renderSidebar();
  setupAccordion();
  setupCalendar();
  setupFoodMap();
  setupRelationshipTimeline();
  setupFoodViews();

  const sidebarNav = document.getElementById('sidebarNav');
  if (sidebarNav) {
    sidebarNav.querySelectorAll('.sidebar-item').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activePhase = btn.dataset.phase;
        if (btn.dataset.phase === 'utility-tracking' || btn.dataset.phase === 'food-records') {
          const now = new Date();
          state.calendarYear = now.getFullYear();
          state.calendarMonth = now.getMonth() + 1;
        }
        state.selectedDay = null;
        renderApp();
        if (window.innerWidth < 720) closeSidebar();
      });
    });
  }
}

/* ─── Sidebar toggle init ─── */

(function initSidebarToggle() {
  const toggle = document.getElementById('sidebarToggle');
  const backdrop = document.getElementById('sidebarBackdrop');
  const close = document.getElementById('sidebarClose');

  if (toggle) toggle.addEventListener('click', openSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  if (close) close.addEventListener('click', closeSidebar);
})();

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSidebar();
});

document.addEventListener('DOMContentLoaded', () => { renderApp(); });
