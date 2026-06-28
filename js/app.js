const state = {
  activePhase: 'follow-up',
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,
  selectedDay: null
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

/* ─── Tab bar ─── */

function getTotalItems(phase) {
  if (phase.type === 'calendar') return new Date(state.calendarYear, state.calendarMonth, 0).getDate() + '天';
  if (phase.type === 'map') return locations.length + '项';
  let count = 0;
  if (phase.sections) for (const s of phase.sections) count += s.items.length;
  return count + '项';
}

function buildTabBar() {
  let html = '<nav class="phase-tabs" role="tablist">';
  for (const phase of phases) {
    const active = phase.id === state.activePhase ? ' active' : '';
    html += `<button class="phase-tab${active}" role="tab" data-phase="${escapeHtml(phase.id)}">
      <span class="tab-phase">${escapeHtml(phase.title)}</span>
      <span class="tab-count">${getTotalItems(phase)}</span>
    </button>`;
  }
  html += '</nav>';
  return html;
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
  let nextRecord = null, consumption = null;
  if (idx >= 0 && idx < records.length - 1) {
    nextRecord = records[idx + 1];
    const nextRecharge = nextRecord.recharge || 0;
    consumption = record.elecRemaining - nextRecord.elecRemaining + nextRecharge;
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
    </div>`;
  }
  if (consumption !== null) {
    html += `<div class="detail-row">
      <span class="detail-label">当日消耗</span>
      <span class="detail-val consumption">${consumption.toFixed(2)} 元</span>
      <span class="detail-note">（次日剩余 ${nextRecord.elecRemaining.toFixed(2)}）</span>
    </div>`;
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

  // ── Header
  html += '<div class="cal-header">';
  html += `<span class="cal-title">${calYear}年${calMonth}月</span>`;
  html += '<div class="cal-nav">';
  html += '<button class="cal-nav-btn" id="calPrev" title="上一月">◀</button>';
  html += '<button class="cal-today-btn" id="calToday">今天</button>';
  html += '<button class="cal-nav-btn" id="calNext" title="下一月">▶</button>';
  html += '</div></div>';

  // ── Weekday header
  html += '<div class="cal-weekdays">';
  for (const w of ['日', '一', '二', '三', '四', '五', '六']) {
    html += `<span class="cal-weekday">${w}</span>`;
  }
  html += '</div>';

  // ── Grid
  html += '<div class="cal-grid">';

  // Previous month
  for (let i = 0; i < startDow; i++) {
    const d = prevMonthLastDay - startDow + i + 1;
    const lunar = getLunarInfo(calYear, calMonth - 1, d);
    html += `<div class="cal-cell cal-other-month">
      <span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>
      <span class="cal-date">${d}日</span>
    </div>`;
  }

  // Current month
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

  // Next month
  const totalCells = startDow + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    const lunar = getLunarInfo(calYear, calMonth + 1, d);
    html += `<div class="cal-cell cal-other-month">
      <span class="cal-lunar${lunar.isStart ? ' cal-lunar-start' : ''}">${lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay)}</span>
      <span class="cal-date">${d}日</span>
    </div>`;
  }

  html += '</div>'; // cal-grid
  html += '</div>'; // calendar-view

  // Detail panel (below calendar, above summary)
  html += buildDetailPanel();

  // Summary bar
  html += buildSummaryBar();

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

  // Click calendar cells with data
  const cells = document.querySelectorAll('.cal-has-data');
  for (const cell of cells) {
    cell.addEventListener('click', (e) => {
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

  // Master Bedroom
  html += '<rect x="0" y="0" width="280" height="200" rx="6" class="fp-room fp-master"/>';
  html += '<text x="140" y="100" class="fp-room-label">主卧</text>';
  html += '<text x="140" y="122" class="fp-room-area">~12㎡</text>';

  // Bathroom
  html += '<rect x="0" y="200" width="140" height="120" rx="6" class="fp-room fp-bath"/>';
  html += '<text x="70" y="260" class="fp-room-label">卫生间</text>';
  html += '<text x="70" y="282" class="fp-room-area">~4㎡</text>';

  // Wash Basin
  html += '<rect x="140" y="200" width="140" height="120" rx="6" class="fp-room fp-wash"/>';
  html += '<text x="210" y="260" class="fp-room-label">洗漱台</text>';

  // Kitchen
  html += '<rect x="380" y="320" width="420" height="180" rx="6" class="fp-room fp-kitchen"/>';
  html += '<text x="590" y="410" class="fp-room-label">厨房</text>';
  html += '<text x="590" y="432" class="fp-room-area">~12㎡</text>';

  // Entry Corridor
  html += '<rect x="280" y="320" width="100" height="180" rx="6" class="fp-room fp-entry"/>';
  html += '<text x="330" y="415" class="fp-room-label fp-vertical-label">入户通道</text>';

  // 次卧
  html += '<rect x="0" y="320" width="280" height="180" rx="6" class="fp-room fp-second"/>';
  html += '<text x="140" y="410" class="fp-room-label">次卧</text>';
  html += '<text x="140" y="432" class="fp-room-area">~7㎡</text>';

  // Dining + Living
  html += '<rect x="280" y="0" width="520" height="320" rx="6" class="fp-room fp-living"/>';
  html += '<text x="540" y="150" class="fp-room-label fp-label-large">餐厅 + 客厅</text>';
  html += '<text x="540" y="178" class="fp-room-area fp-area-large">~30㎡</text>';

  // Door icon for entry
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

/* ─── Render ─── */

function buildPhaseContent(phase) {
  if (phase.type === 'checklist') return buildChecklistView(phase);
  if (phase.type === 'calendar') return buildCalendarView();
  if (phase.type === 'map') return buildMapView();
  return '';
}

function renderApp() {
  const app = document.getElementById('app');
  const phase = phases.find(p => p.id === state.activePhase) || phases[0];

  let html = buildTabBar();
  html += '<div class="phase-panel">';
  html += buildPhaseContent(phase);
  html += '</div>';

  app.innerHTML = html;

  setupAccordion();
  setupCalendar();

  // Tab switching
  const tabs = document.querySelectorAll('.phase-tab');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      state.activePhase = tab.dataset.phase;
      if (tab.dataset.phase === 'utility-tracking') {
        const now = new Date();
        state.calendarYear = now.getFullYear();
        state.calendarMonth = now.getMonth() + 1;
      }
      state.selectedDay = null;
      renderApp();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => { renderApp(); });
