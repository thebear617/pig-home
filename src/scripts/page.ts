import { escapeHtml, getLunarInfo, getLunarDayName, pad } from '../lib/helpers';
import { SCHEDULE_FINANCE_VIEWS, DEFAULT_SCHEDULE_FINANCE_VIEW } from '../lib/tabs';

declare global {
  interface Window {
    __utilityRecords?: Record<string, { elecRemaining: number; recharge?: number }>;
    __hemaDayRecords?: Record<string, any>;
    __diaryRecords?: Record<string, any>;
    __specialEvents?: Record<string, any>;
    __expenseRecords?: any[];
    __expenseCategories?: any[];
    __incomeRecords?: any[];
    __incomeCategories?: any[];
    __balanceBase?: { amount: number; date: string };
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

// ─── 「日程和财务」聚合页：多视图切换 ───
const SCHEDULE_FINANCE_PAGE = 'schedule-finance';
const SF_VIEW_IDS: string[] = SCHEDULE_FINANCE_VIEWS.map(view => view.id);
const SF_VIEW_TITLES: Record<string, string> = Object.fromEntries(SCHEDULE_FINANCE_VIEWS.map(view => [view.id, view.title]));
let scheduleView: string = DEFAULT_SCHEDULE_FINANCE_VIEW;
const CONTEXT_PREVIEW_LIMIT = 3;

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
  if (!state.selected && state.year === now.getFullYear() && state.month === now.getMonth() + 1) {
    state.selected = dateKey(state.year, state.month, now.getDate());
  }
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

function isRenewalRecord(record: any) {
  return record?.willRenew === true;
}

async function syncMembershipRenewalState(record: any): Promise<boolean> {
  if (!import.meta.env.DEV) return true;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}__dev/membership-renewal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: record.name, expireDate: record.expireDate, willRenew: record.willRenew === true }),
    });
    return response.ok;
  } catch (error) {
    console.error('无法同步会员续订状态到本地文件', error);
    return false;
  }
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

const STUDY_AREAS = new Set(['study', 'dev', 'research']);

function taskAreas(task: any): string[] {
  if (Array.isArray(task?.areas)) return task.areas;
  return Array.from(String(task?.desc || '').matchAll(/#area\/([A-Za-z0-9_-]+)/g), match => match[1]);
}

function isStudyTask(task: any): boolean {
  if (task?.isStudy === true) return true;
  return taskAreas(task).some(area => STUDY_AREAS.has(area));
}

// 可支配余额不包含租房储蓄：已攒 4000 元，本月再预留 1850 元。
const RENT_RESERVE = 4000;
const RENT_SAVING_RESERVE = 1850;
const BALANCE_ADJUSTMENT = 529.31;

function getAvailableBalance(): number | null {
  const base = window.__balanceBase;
  if (!base) return null;
  const todayKey = dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const sinceIncome = (window.__incomeRecords || [])
    .filter(item => item.date >= base.date && item.date <= todayKey)
    .reduce((sum, item) => sum + item.amount, 0);
  const sinceExpense = (window.__expenseRecords || [])
    .filter(item => item.date >= base.date && item.date <= todayKey)
    .reduce((sum, item) => sum + item.amount, 0);
  const currentBalance = base.amount + sinceIncome - sinceExpense;
  return currentBalance - RENT_RESERVE - RENT_SAVING_RESERVE - BALANCE_ADJUSTMENT;
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
    html += `<div class="cal-cell cal-other-month"><span class="cal-date">${day}日</span>${lunarText(year, month - 1, day)}</div>`;
  }
  return html;
}

function nextCells(year: number, month: number, startDay: number, days: number) {
  let html = '';
  const remainder = (7 - ((startDay + days) % 7)) % 7;
  for (let day = 1; day <= remainder; day++) {
    html += `<div class="cal-cell cal-other-month"><span class="cal-date">${day}日</span>${lunarText(year, month + 1, day)}</div>`;
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
  document.querySelectorAll<HTMLElement>('[data-sf-month-title]').forEach((month) => { month.textContent = monthTitle(); });
}

function renderScheduleFinanceKpis() {
  const prefix = `${state.year}-${pad(state.month)}`;
  const expenses = (window.__expenseRecords || []).filter(item => item.date.startsWith(prefix));
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const expenseDays = new Set(expenses.map(item => item.date)).size;
  const availableBalance = getAvailableBalance();

  const toMinutes = (value: string) => {
    const [hour, minute] = value.trim().split(':').map(Number);
    return hour * 60 + minute;
  };
  const studyDailyDurations: number[] = [];
  for (const [date, record] of Object.entries(window.__diaryRecords || {})) {
    if (!date.startsWith(prefix)) continue;
    let dailyDuration = 0;
    for (const task of record.tasks || []) {
      if (!isStudyTask(task)) continue;
      const parts = String(task.time || '').split('-');
      if (parts.length !== 2) continue;
      const start = toMinutes(parts[0]);
      const endValue = toMinutes(parts[1]);
      if (Number.isNaN(start) || Number.isNaN(endValue)) continue;
      const end = endValue <= start ? endValue + 24 * 60 : endValue;
      dailyDuration += end - start;
    }
    if (dailyDuration > 0) studyDailyDurations.push(dailyDuration);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewalCount = (window.__membershipRecords || []).filter(record => {
    if (!isRenewalRecord(record)) return false;
    if (!record.expireDate) return false;
    const days = (new Date(`${record.expireDate}T00:00:00`).getTime() - today.getTime()) / 86400000;
    return days >= 0 && days <= 7;
  }).length;
  const values: Record<string, string> = {
    balance: availableBalance == null ? '—' : `¥${availableBalance.toFixed(2)}`,
    expense: `¥${totalExpense.toFixed(2)}`,
    'daily-expense': `¥${expenseDays ? (totalExpense / expenseDays).toFixed(2) : '0.00'}`,
    study: studyDailyDurations.length ? `${(studyDailyDurations.reduce((sum, value) => sum + value, 0) / studyDailyDurations.length / 60).toFixed(1)}h` : '—',
    renewal: `${renewalCount} 项`,
  };
  Object.entries(values).forEach(([key, value]) => {
    const element = document.querySelector<HTMLElement>(`[data-sf-kpi="${key}"]`);
    if (element) element.textContent = value;
  });
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

function dailyGrid() {
  const diary = window.__diaryRecords || {};
  const expenses = window.__expenseRecords || [];
  const incomes = window.__incomeRecords || [];
  const special = window.__specialEvents || {};
  const hema = window.__hemaDayRecords || {};
  const memberships = window.__membershipRecords || [];
  return calendarFrame((day, today) => {
    const key = dateKey(state.year, state.month, day);
    const record = diary[key];
    const hasExpense = expenses.some(item => item.date === key);
    const hasIncome = incomes.some(item => item.date === key);
    const monday = new Date(`${key}T00:00:00`).getDay() === 1;
    const event = special[key];
    const hasSchedule = Boolean(record?.tasks?.length);
    const hasSleep = Boolean(record?.tasks?.some((task: any) => task.desc === '睡觉' || task.desc === '睡懒觉'));
    const hasSubscription = memberships.some(item => isRenewalRecord(item) && item.expireDate === key);
    const classes = ['cal-cell'];
    if (today) classes.push('cal-today');
    if (record || hasExpense || hasIncome || monday) classes.push('cal-has-data');
    if (monday) classes.push('cal-hema-day');
    if (state.selected === key) classes.push('cal-selected');
    if (event) classes.push('cal-special');
    return `<div class="${classes.join(' ')}" data-date="${key}"><span class="cal-date${today ? ' cal-date-today' : ''}">${day}日</span>${lunarText(state.year, state.month, day)}${hasExpense ? '<span class="cal-expense-dot" title="有支出"></span>' : ''}${hasSchedule ? '<span class="cal-schedule-dot" title="有日程"></span>' : ''}${hasSubscription ? '<span class="cal-subscription-dot" title="有订阅"></span>' : ''}${hasSleep ? '<span class="cal-sleep-dot" title="睡眠良好"></span>' : ''}${event ? `<span class="cal-special-icons" title="${escape(event.keywords?.join('、'))}">${event.icons?.join('') || ''}</span>` : ''}</div>`;
  });
}

function dailyDetail(key: string | null) {
  if (!key) return '';
  const record = window.__diaryRecords?.[key];
  const expenses = (window.__expenseRecords || []).filter(item => item.date === key);
  const incomes = (window.__incomeRecords || []).filter(item => item.date === key);
  const hema = window.__hemaDayRecords?.[key];
  const utility = window.__utilityRecords?.[key];
  const monday = new Date(`${key}T00:00:00`).getDay() === 1;
  if (!record && !expenses.length && !incomes.length && !hema && !monday && !utility) return '';
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
  if (incomes.length) {
    const total = incomes.reduce((sum, item) => sum + item.amount, 0);
    html += `<div class="detail-row"><span class="detail-label">当日收入</span><span class="detail-val income-amount">¥${total.toFixed(2)}</span></div><div class="detail-expenses">`;
    incomes.forEach(item => { html += `<div class="expense-detail-item"><span class="expense-detail-sub">${escape(item.sub)}</span>${item.note ? `<span class="expense-detail-note">${escape(item.note)}</span>` : ''}<span class="expense-detail-amount income-amount">¥${item.amount.toFixed(2)}</span></div>`; });
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

function contextExpenseIcon(item: any): string {
  const value = `${item.cat || ''}${item.sub || ''}`;
  if (/交通|打车|地铁|公交/.test(value)) return '▣';
  if (/奶茶|饮品|酒水/.test(value)) return '◉';
  if (/做饭|餐饮|炒菜|面|饭|粉|包子|蛋糕|鸭脖/.test(value)) return '♨';
  return '▤';
}

function dailyContextHtml(key: string | null): string {
  if (!key) return '<div class="sf-context-empty">选择一个日期查看当天记录</div>';
  const day = new Date(`${key}T00:00:00`);
  const expenses = (window.__expenseRecords || []).filter(item => item.date === key);
  const record = window.__diaryRecords?.[key];
  const tasks = (record?.tasks || []).filter((task: any) => task.desc !== '睡觉' && task.desc !== '睡懒觉');
  const sleepTask = (record?.tasks || []).filter((task: any) => task.desc === '睡觉' || task.desc === '睡懒觉').at(-1);
  const subscriptions = (window.__membershipRecords || []).filter(item => isRenewalRecord(item) && item.expireDate === key);
  const todayKey = dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const nextSubscription = (window.__membershipRecords || [])
    .filter(item => isRenewalRecord(item) && item.expireDate >= todayKey)
    .sort((a, b) => a.expireDate.localeCompare(b.expireDate))[0];
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const sleepText = sleepTask?.time || '';
  let sleepDuration = 0;
  if (sleepText.includes('-')) {
    const [startText, endText] = sleepText.split('-');
    const toMinutes = (value: string) => {
      const [hour, minute] = value.trim().split(':').map(Number);
      return hour * 60 + minute;
    };
    const start = toMinutes(startText);
    const endValue = toMinutes(endText);
    if (!Number.isNaN(start) && !Number.isNaN(endValue)) sleepDuration = (endValue <= start ? endValue + 1440 : endValue) - start;
  }
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(day);
  const dateTitle = `${day.getMonth() + 1}月${day.getDate()}日 ${weekday}`;
  const expenseRow = (item: any) => `<div class="sf-context-expense-row"><span class="sf-context-row-icon" aria-hidden="true">${contextExpenseIcon(item)}</span><span class="sf-context-expense-name">${escape(item.sub)}${item.note ? `<small>${escape(item.note)}</small>` : ''}</span><strong>¥${item.amount.toFixed(2)}</strong></div>`;
  const expenseRows = expenses.length
    ? expenses.map(expenseRow).join('')
    : '<div class="sf-context-no-record">当天无支出</div>';
  const expensePreviewRows = expenses.slice(0, CONTEXT_PREVIEW_LIMIT).map(expenseRow).join('');
  const scheduleRow = (task: any) => `<div class="sf-context-schedule-row"><i></i><span>${escape(task.time || '')}</span><strong>${renderDesc(task.desc)}</strong></div>`;
  const scheduleRows = tasks.length
    ? tasks.map(scheduleRow).join('')
    : '<span class="sf-context-muted">当天无日程</span>';
  const schedulePreviewRows = tasks.slice(0, CONTEXT_PREVIEW_LIMIT).map(scheduleRow).join('');
  const utility = window.__utilityRecords?.[key];
  const nextSubscriptionDateText = nextSubscription ? (() => { const nextDate = new Date(`${nextSubscription.expireDate}T00:00:00`); return `${nextDate.getMonth() + 1}月${nextDate.getDate()}日`; })() : '';
  const subscriptionText = subscriptions.length
    ? `今日 ${subscriptions.length} 项续费`
    : nextSubscription ? nextSubscriptionDateText : '暂无待续费项目';
  const subscriptionDetailText = subscriptions.length
    ? `今日 ${subscriptions.length} 项续费`
    : nextSubscription ? `下次续费：${nextSubscriptionDateText} ${escape(nextSubscription.name)}` : '暂无待续费项目';
  return `<div class="sf-context-header"><div class="sf-context-heading"><h2>${dateTitle}</h2></div><p>“平凡的一天，<br />也是值得记录的生活。”</p></div>
<div class="sf-context-body${utility ? ' has-utility' : ''}"><section class="sf-context-expenses" data-sf-popover="expenses" aria-label="今日支出"><header><span class="sf-context-section-icon is-wallet" aria-hidden="true">▰</span><div><strong>¥${expenseTotal.toFixed(2)}</strong></div><button class="sf-context-record-button" type="button" data-sf-record-expense data-sf-view-btn="expense-records">＋ 记一笔</button></header><div class="sf-context-expense-list">${expenses.length ? expensePreviewRows : expenseRows}</div>${expenses.length > CONTEXT_PREVIEW_LIMIT ? `<div class="sf-context-popover sf-context-expense-popover" id="sfExpensePopover" role="tooltip" aria-hidden="true"><div class="sf-context-popover-head"><span>全部支出</span><small>${expenses.length} 项记录</small></div><div class="sf-context-popover-list">${expenseRows}</div></div>` : ''}</section>
<section class="sf-context-mini sf-context-sleep" aria-label="睡眠"><span class="sf-context-section-icon is-sleep" aria-hidden="true">☾</span><div><strong>${sleepDuration ? `${(sleepDuration / 60).toFixed(1)}h` : '—'}</strong></div><small>${sleepText || '暂无睡眠记录'}</small></section>
<section class="sf-context-mini sf-context-schedule" data-sf-popover="schedule" aria-label="今日日程"><span class="sf-context-section-icon is-schedule" aria-hidden="true">▦</span><div><div class="sf-context-schedule-list">${tasks.length ? schedulePreviewRows : scheduleRows}</div></div>${tasks.length > CONTEXT_PREVIEW_LIMIT ? `<div class="sf-context-popover sf-context-schedule-popover" id="sfSchedulePopover" role="tooltip" aria-hidden="true"><div class="sf-context-popover-head"><span>全部日程</span><small>${tasks.length} 项安排</small></div><div class="sf-context-popover-list">${scheduleRows}</div></div>` : ''}</section>
${utility ? `<section class="sf-context-mini sf-context-utility" aria-label="电费余额"><span class="sf-context-section-icon is-utility" aria-hidden="true">ϟ</span><div><strong>¥${utility.elecRemaining.toFixed(2)}</strong></div></section>` : ''}
<section class="sf-context-mini sf-context-subscription" data-sf-popover="subscription" aria-label="订阅与续费"><span class="sf-context-section-icon is-subscription" aria-hidden="true">♛</span><div><small>${subscriptionText}</small></div><div class="sf-context-popover sf-context-subscription-popover" id="sfSubscriptionPopover" role="tooltip" aria-hidden="true"><div class="sf-context-popover-head"><span>续费详情</span><small>完整信息</small></div><div class="sf-context-popover-copy">${subscriptionDetailText}</div></div></section></div>`;
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
  const incomes = (window.__incomeRecords || []).filter(item => item.date.startsWith(prefix));
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
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
  <div class="daily-stat-item"><span class="daily-stat-label">收入</span><span class="daily-stat-value daily-income">¥${totalIncome.toFixed(0)}</span></div>
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

let expenseTrendSelectedDay: number | null = null;
let expenseTrendView: 'expense' | 'income' = 'expense';
let scheduleCategoryView: 'amount' | 'percentage' = 'amount';
let expenseTopPage = 0;
let expenseRecordView: 'expense' | 'income' = 'expense';
let expenseRecordCategory = 'all';
let expenseRecordPage = 0;
const EXPENSE_RECORDS_PER_PAGE = 8;
let membershipView = 'active';
const MEMBERSHIP_PER_PAGE = 10;
let membershipListPage = 0;

function expenseView() {
  const prefix = `${state.year}-${pad(state.month)}`;
  const expenseRecords = (window.__expenseRecords || []).filter(item => item.date.startsWith(prefix));
  const incomeRecords = (window.__incomeRecords || []).filter(item => item.date.startsWith(prefix));
  const totalExpense = expenseRecords.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = incomeRecords.reduce((sum, item) => sum + item.amount, 0);
  const expenseDays = new Set(expenseRecords.map(item => item.date)).size;
  const availableBalance = getAvailableBalance();
  const categoryDefinitions = expenseRecordView === 'income' ? (window.__incomeCategories || []) : (window.__expenseCategories || []);
  const categoryNames = categoryDefinitions
    .map(category => category.name)
    .filter(name => (expenseRecordView === 'income' ? incomeRecords : expenseRecords).some(item => item.cat === name));
  if (expenseRecordCategory !== 'all' && !categoryNames.includes(expenseRecordCategory)) expenseRecordCategory = 'all';
  const activeRecords = (expenseRecordView === 'income' ? incomeRecords : expenseRecords)
    .filter(item => expenseRecordCategory === 'all' || item.cat === expenseRecordCategory)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalPages = Math.max(1, Math.ceil(activeRecords.length / EXPENSE_RECORDS_PER_PAGE));
  if (expenseRecordPage >= totalPages) expenseRecordPage = totalPages - 1;
  if (expenseRecordPage < 0) expenseRecordPage = 0;
  const pageRecords = activeRecords.slice(expenseRecordPage * EXPENSE_RECORDS_PER_PAGE, (expenseRecordPage + 1) * EXPENSE_RECORDS_PER_PAGE);
  const typeLabel = expenseRecordView === 'income' ? '收入' : '支出';
  const typeButton = (value: 'expense' | 'income', label: string) => `<button class="expense-record-type-btn${expenseRecordView === value ? ' is-active' : ''}" type="button" data-expense-record-type="${value}" role="tab" aria-selected="${expenseRecordView === value}">${label}</button>`;
  const categoryButton = (name: string) => `<button class="expense-record-category-btn${expenseRecordCategory === name ? ' is-active' : ''}" type="button" data-expense-record-category="${escape(name)}" role="tab" aria-selected="${expenseRecordCategory === name}">${name === 'all' ? '全部' : escape(name)}</button>`;
  const summary = `<div class="expense-summary-strip"><div><span>可支配余额</span><strong class="${availableBalance != null && availableBalance >= 0 ? 'income-amount' : 'expense-amount'}">${availableBalance == null ? '—' : `¥${availableBalance.toFixed(2)}`}</strong></div><div><span>本月支出</span><strong class="expense-amount">¥${totalExpense.toFixed(2)}</strong></div><div><span>本月收入</span><strong class="income-amount">¥${totalIncome.toFixed(2)}</strong></div><div><span>记录</span><strong>${expenseRecords.length + incomeRecords.length} 笔</strong></div><div><span>日均支出</span><strong class="expense-amount">¥${expenseDays ? (totalExpense / expenseDays).toFixed(2) : '0.00'}</strong></div></div>`;
  const categoryNav = `<div class="expense-record-category-nav" role="tablist" aria-label="${typeLabel}分类">${categoryButton('all')}${categoryNames.map(categoryButton).join('')}</div>`;
  const controls = `<div class="expense-record-controls">${categoryNav}<div class="expense-record-type-nav" role="tablist" aria-label="记录类型">${typeButton('expense', '支出')}${typeButton('income', '收入')}</div></div>`;
  const rows = pageRecords.map(item => {
    const date = new Date(`${item.date}T00:00:00`);
    return `<div class="expense-record-row"><time datetime="${item.date}">${date.getMonth() + 1}/${date.getDate()}</time><span class="expense-record-category">${escape(item.cat)}</span><div class="expense-record-copy"><strong>${escape(item.sub)}</strong>${item.note ? `<small>${escape(item.note)}</small>` : ''}</div><strong class="expense-record-amount ${expenseRecordView === 'income' ? 'income-amount' : 'expense-amount'}">${expenseRecordView === 'income' ? '+' : '-'}¥${item.amount.toFixed(2)}</strong></div>`;
  }).join('');
  const list = rows || `<div class="expense-record-empty">本月暂无${typeLabel}记录</div>`;
  const pagination = `<nav class="expense-record-pagination" aria-label="${typeLabel}记录分页"><button type="button" data-expense-record-page="prev" aria-label="上一页"${expenseRecordPage === 0 ? ' disabled' : ''}>‹</button><span>${expenseRecordPage + 1} / ${totalPages}</span><button type="button" data-expense-record-page="next" aria-label="下一页"${expenseRecordPage >= totalPages - 1 ? ' disabled' : ''}>›</button></nav>`;
  const footer = `<div class="expense-record-footer"><span class="expense-record-count">${typeLabel} ${activeRecords.length} 笔</span>${pagination}</div>`;
  return `<div class="expense-record-workspace">${summary}${controls}<div class="expense-record-list">${list}</div>${footer}</div>`;
}

function expenseTrendHtml(): string {
  const prefix = `${state.year}-${pad(state.month)}`;
  const activeTrendView = scheduleView === 'expense-records' ? expenseTrendView : 'expense';
  const trendLabel = activeTrendView === 'income' ? '收入' : '支出';
  const trendRecords = activeTrendView === 'income' ? (window.__incomeRecords || []) : (window.__expenseRecords || []);
  const records = trendRecords.filter(item => item.date.startsWith(prefix));
  const trendToggle = scheduleView === 'expense-records'
    ? `<div class="sf-chart-toggle" role="tablist" aria-label="趋势类型"><button type="button" class="${expenseTrendView === 'expense' ? 'is-active' : ''}" data-sf-trend-view="expense" role="tab" aria-selected="${expenseTrendView === 'expense'}">支出</button><button type="button" class="${expenseTrendView === 'income' ? 'is-active' : ''}" data-sf-trend-view="income" role="tab" aria-selected="${expenseTrendView === 'income'}">收入</button></div>`
    : '';
  const detailLink = scheduleView === 'daily-tracker' ? '<button class="sf-content-action-button sf-chart-detail-button" type="button" data-sf-view-btn="expense-records">收支记录 <span aria-hidden="true">›</span></button>' : '';
  const trendToggleInHeader = scheduleView === 'expense-records' ? trendToggle : '';
  const trendHeader = `<div class="expense-kanban-head sf-chart-head"><h3 class="expense-kanban-title"><span class="sf-chart-icon" aria-hidden="true"><i></i><i></i><i></i></span>本月${trendLabel}趋势</h3>${detailLink}${trendToggleInHeader}</div>`;
  if (!records.length) return `${trendHeader}<div class="expense-kanban-empty">本月暂无${trendLabel}</div>`;
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
    const details = selectedRecords.length ? selectedRecords.map(record => `<li><span><b>${escape(record.cat)}</b> · ${escape(record.sub)}${record.note ? `<small>${escape(record.note)}</small>` : ''}</span><strong class="${activeTrendView === 'income' ? 'income-amount' : ''}">¥${record.amount.toFixed(2)}</strong></li>`).join('') : `<li class="expense-line-tooltip-empty">当天无${trendLabel}</li>`;
    const tooltipTop = selectedPoint.y > 88 ? Math.max(8, selectedPoint.y - 84) : selectedPoint.y + 12;
    tooltip = `<div class="expense-line-tooltip" style="--point-x:${(selectedPoint.x / width * 100).toFixed(2)}%; top:${tooltipTop.toFixed(1)}px"><div class="expense-line-tooltip-head"><strong>${state.month}/${expenseTrendSelectedDay} · ¥${dailyTotals[selectedIndex].toFixed(2)}</strong><button class="expense-line-tooltip-close" type="button" aria-label="关闭当天${trendLabel}详情">×</button></div><ul>${details}</ul></div>`;
  }
  const peak = Math.max(...dailyTotals);
  const peakDay = dailyTotals.indexOf(peak) + 1;
  const trendClass = activeTrendView === 'income' ? ' expense-line-income' : '';
  return `${trendHeader}<div class="expense-line-chart-wrap"><svg class="expense-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${state.month}月每日${trendLabel}趋势">${gridLines}<path class="expense-line-area${trendClass}" d="${areaPath}"/><path class="expense-line-path${trendClass}" d="${linePath}"/>${nodes.replaceAll('expense-line-node', `expense-line-node${trendClass}`)}${labels}</svg>${tooltip}</div><div class="expense-line-meta"><span>共 ${daysInMonth} 个每日节点</span><span>峰值：${state.month}/${peakDay} ¥${peak.toFixed(0)}</span></div>`;
}

function scheduleExpenseCategoryHtml(): string {
  const records = (window.__expenseRecords || []).filter(item => item.date.startsWith(`${state.year}-${pad(state.month)}`));
  const catMap = new Map<string, number>();
  for (const record of records) catMap.set(record.cat, (catMap.get(record.cat) || 0) + record.amount);
  const categories = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  if (!categories.length) return '<div class="sf-chart-empty">本月暂无支出</div>';
  const max = categories[0][1];
  const total = categories.reduce((sum, [, amount]) => sum + amount, 0);
  const rows = categories.map(([name, amount], index) => {
    const percentage = amount / total * 100;
    const barWidth = scheduleCategoryView === 'percentage' ? percentage : amount / max * 100;
    const value = scheduleCategoryView === 'percentage' ? `${percentage.toFixed(1)}%` : `¥${amount.toFixed(2)}`;
    const minimumBarWidth = scheduleCategoryView === 'percentage' ? 2 : 5;
    return `<div class="sf-category-row"><span class="sf-category-swatch sf-category-swatch-${index % 6}" aria-hidden="true"></span><span class="sf-category-name">${escape(name)}</span><span class="sf-category-track"><span class="sf-category-fill sf-category-fill-${index % 6}" style="width:${Math.max(minimumBarWidth, Math.round(barWidth))}%"></span></span><strong class="sf-category-amount">${value}</strong></div>`;
  }).join('');
  const categoryToggle = `<div class="sf-chart-toggle" role="tablist" aria-label="支出分类显示方式"><button type="button" class="${scheduleCategoryView === 'amount' ? 'is-active' : ''}" data-sf-category-view="amount" role="tab" aria-selected="${scheduleCategoryView === 'amount'}">金额</button><button type="button" class="${scheduleCategoryView === 'percentage' ? 'is-active' : ''}" data-sf-category-view="percentage" role="tab" aria-selected="${scheduleCategoryView === 'percentage'}">占比</button></div>`;
  return `<div class="expense-kanban-head sf-chart-head"><h3 class="expense-kanban-title"><span class="sf-category-icon" aria-hidden="true">◕</span>支出分类占比</h3>${categoryToggle}</div><div class="sf-category-list">${rows}</div>`;
}

function scheduleSubscriptionHtml(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const parseDate = (value: string) => new Date(`${value}T00:00:00`).getTime();
  const upcoming = (window.__membershipRecords || [])
    .filter(record => isRenewalRecord(record) && record.expireDate && parseDate(record.expireDate) >= todayTime)
    .sort((a, b) => parseDate(a.expireDate) - parseDate(b.expireDate))
    .slice(0, 2);
  const priceText = (record: any) => record.price == null ? '待补' : record.price === 0 ? '免费' : `¥${record.price.toFixed(2)}`;
  const rows = upcoming.map(record => {
    const date = new Date(`${record.expireDate}T00:00:00`);
    const days = Math.round((date.getTime() - todayTime) / 86400000);
    const daysText = days === 0 ? '今天' : `还有 ${days} 天`;
    return `<div class="sf-subscription-row"><span class="sf-subscription-logo">${getServiceIcon(record)}</span><div class="sf-subscription-copy"><strong>${escape(record.name)}</strong><span>${date.getMonth() + 1}月${date.getDate()}日 <em class="sf-renewal-label">续费</em></span></div><div class="sf-subscription-price"><strong>${priceText(record)}</strong><span>${daysText}</span></div></div>`;
  }).join('');
  const header = `<div class="expense-kanban-head sf-chart-head"><h3 class="expense-kanban-title"><span class="sf-subscription-icon" aria-hidden="true">♛</span>订阅与周期账单</h3><button class="sf-content-action-button sf-subscription-entry" type="button" data-sf-view-btn="membership">全部订阅 <span aria-hidden="true">›</span></button></div>`;
  if (!rows) return `${header}<div class="sf-chart-empty">暂无待续费订阅</div>`;
  return `${header}<div class="sf-subscription-list">${rows}</div>`;
}

function expenseCategoryChartHtml(): string {
  return scheduleExpenseCategoryHtml();
}

function expenseTopItemsHtml(): string {
  const records = (window.__expenseRecords || []).filter(item => item.date.startsWith(`${state.year}-${pad(state.month)}`)).sort((a, b) => b.amount - a.amount);
  if (!records.length) return '<div class="expense-kanban-head"><h3 class="expense-kanban-title">🔥 最高支出</h3></div><div class="expense-kanban-empty">本月暂无支出</div>';
  const perPage = 10;
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
  const showRenewalColumn = import.meta.env.DEV;
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
  const totalPages = Math.max(1, Math.ceil(current.length / MEMBERSHIP_PER_PAGE));
  if (membershipListPage >= totalPages) membershipListPage = totalPages - 1;
  if (membershipListPage < 0) membershipListPage = 0;
  const pageRecords = current.slice(membershipListPage * MEMBERSHIP_PER_PAGE, (membershipListPage + 1) * MEMBERSHIP_PER_PAGE);
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

  const membershipPagination = totalPages > 1
    ? `<nav class="membership-pagination" aria-label="订阅列表分页"><button class="membership-page-btn" type="button" data-membership-page="prev" aria-label="上一页"${membershipListPage === 0 ? ' disabled' : ''}>‹</button><span class="membership-page-num">${membershipListPage + 1} / ${totalPages}</span><button class="membership-page-btn" type="button" data-membership-page="next" aria-label="下一页"${membershipListPage >= totalPages - 1 ? ' disabled' : ''}>›</button></nav>`
    : '';
  html += `<div class="membership-list-section"><div class="membership-list-heading"><h3 class="membership-section-title">订阅列表</h3>${membershipPagination}</div><div class="membership-table${showRenewalColumn ? ' is-local' : ''}">`;
  html += `<div class="membership-table-head"><span class="membership-th-name">订阅服务</span><span class="membership-th-tag">标签</span><span class="membership-th-note">备注</span><span class="membership-th-price">价格</span>${showRenewalColumn ? '<span class="membership-th-renew">续订</span>' : ''}<span class="membership-th-status">到期状态</span></div>`;
  for (const record of pageRecords) {
    const recordIndex = records.indexOf(record);
    const willRenew = isRenewalRecord(record);
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
    const nameHtml = record.url ? `<a class="membership-name-link" href="${escape(record.url)}" target="_blank" rel="noopener">${escape(record.name)}</a>` : `<strong>${escape(record.name)}</strong>`;
    html += `<div class="membership-row-main"><span class="membership-row-logo">${icon}</span><div class="membership-row-copy">${nameHtml}<span class="membership-row-note-mobile">${record.note ? escape(record.note) : '—'}</span></div></div>`;
    html += `<div class="membership-row-tags">${tagHtml}</div>`;
    html += `<div class="membership-row-note">${record.note ? escape(record.note) : '—'}</div>`;
    html += `<div class="membership-row-price"><strong>${priceText}</strong></div>`;
    if (showRenewalColumn) html += `<div class="membership-row-renew"><button class="membership-renew-switch${willRenew ? ' is-on' : ''}" type="button" data-membership-index="${recordIndex}" aria-pressed="${willRenew}" aria-label="${willRenew ? '关闭' : '开启'} ${escape(record.name)}续订"><span aria-hidden="true"></span></button></div>`;
    const statusIcon = membershipIcon('clock');
    html += `<div class="membership-row-status"><span class="membership-status-icon">${statusIcon}</span><span>${statusText}</span></div>`;
    html += `</div>`;
  }
  html += '</div></div>';
  return html;
}

let membershipNoteTip: HTMLElement | null = null;
let membershipNoteTipTimer: number | undefined;

function membershipNoteTipText(cell: HTMLElement): string {
  const text = cell.textContent?.trim() || '';
  return text && text !== '—' ? text : '';
}

function showMembershipNoteTip(cell: HTMLElement, text: string, copied = false) {
  if (!membershipNoteTip) {
    membershipNoteTip = document.createElement('div');
    membershipNoteTip.className = 'membership-note-tooltip';
    document.body.appendChild(membershipNoteTip);
  }
  window.clearTimeout(membershipNoteTipTimer);
  const tip = membershipNoteTip;
  tip.textContent = copied ? `✓ 已复制：${text}` : text;
  tip.classList.toggle('copied', copied);
  tip.style.display = 'block';
  tip.style.visibility = 'hidden';
  const rect = cell.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  let left = rect.left;
  if (left + tipRect.width > window.innerWidth - 12) left = Math.max(12, window.innerWidth - tipRect.width - 12);
  let top = rect.bottom + 6;
  if (top + tipRect.height > window.innerHeight - 12) top = Math.max(12, rect.top - tipRect.height - 6);
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
  tip.style.visibility = 'visible';
}

function hideMembershipNoteTip() {
  window.clearTimeout(membershipNoteTipTimer);
  if (membershipNoteTip) membershipNoteTip.style.display = 'none';
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

function renderView(view: string) {
  if (view === 'daily-tracker') {
    document.getElementById('dailyCalendar')!.innerHTML = dailyGrid();
    document.getElementById('dailyDetail')!.innerHTML = dailyDetail(state.selected);
    const contextPanel = document.getElementById('sfContextPanel');
    if (contextPanel) {
      contextPanel.innerHTML = dailyContextHtml(state.selected);
    }
    const scheduleTrendEl = document.getElementById('sfExpenseTrend');
    if (scheduleTrendEl) scheduleTrendEl.innerHTML = expenseTrendHtml();
    const scheduleCategoryEl = document.getElementById('sfCategorySummary');
    if (scheduleCategoryEl) scheduleCategoryEl.innerHTML = scheduleExpenseCategoryHtml();
    const scheduleSubscriptionEl = document.getElementById('sfSubscriptionSummary');
    if (scheduleSubscriptionEl) scheduleSubscriptionEl.innerHTML = scheduleSubscriptionHtml();
    const summaryEl = document.getElementById('dailySummary');
    if (summaryEl) summaryEl.innerHTML = dailySummary();
    const utilityEl = document.getElementById('dailyUtilitySummary');
    if (utilityEl) utilityEl.innerHTML = dailyUtilitySummaryHtml();
    setTitle('[data-tab="daily-tracker"] .cal-title');
  } else if (view === 'expense-records') {
    document.getElementById('expenseContent')!.innerHTML = expenseView();
    const trendEl = document.getElementById('expenseTrendChart');
    if (trendEl) trendEl.innerHTML = expenseTrendHtml();
    const catEl = document.getElementById('expenseCategoryChart');
    if (catEl) catEl.innerHTML = expenseCategoryChartHtml();
    const topEl = document.getElementById('expenseTopItems');
    if (topEl) topEl.innerHTML = expenseTopItemsHtml();
    setTitle('[data-tab="expense-records"] .cal-title', `${monthTitle()} · 收支`);
    setupAccordions(document.getElementById('expenseContent')!);
  } else if (view === 'membership') {
    const membershipEl = document.getElementById('membershipSubscriptions');
    if (membershipEl) membershipEl.innerHTML = membershipSubscriptionsHtml();
  }
}

function refresh() {
  if (page === SCHEDULE_FINANCE_PAGE) renderScheduleFinanceKpis();
  renderView(page === SCHEDULE_FINANCE_PAGE ? scheduleView : page);
}

function readScheduleView(): string {
  const value = new URLSearchParams(window.location.search).get('view');
  return value && SF_VIEW_IDS.includes(value) ? value : DEFAULT_SCHEDULE_FINANCE_VIEW;
}

function applyScheduleView(view: string, options: { replace?: boolean; render?: boolean } = {}) {
  if (!SF_VIEW_IDS.includes(view)) view = DEFAULT_SCHEDULE_FINANCE_VIEW;
  scheduleView = view;
  document.body.dataset.view = view;

  document.querySelectorAll<HTMLElement>('[data-sf-view]').forEach(panel => {
    const active = panel.dataset.sfView === view;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-sf-view-btn]').forEach(button => {
    const active = button.dataset.sfViewBtn === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  const title = SF_VIEW_TITLES[view];
  if (title) document.title = title;

  const params = new URLSearchParams(window.location.search);
  params.set('view', view);
  const url = `${window.location.pathname}?${params}`;
  if (options.replace === false) history.pushState(null, '', url);
  else history.replaceState(null, '', url);

  if (options.render !== false) refresh();
}

function renderExpenseTrendTargets() {
  ['expenseTrendChart', 'sfExpenseTrend'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.innerHTML = expenseTrendHtml();
  });
}

function shiftMonth(delta: number) {
  state.month += delta;
  if (state.month < 1) { state.year--; state.month = 12; }
  if (state.month > 12) { state.year++; state.month = 1; }
  state.selected = null;
  writeQueryState();
  setTitle('[data-sf-month-title]');
  refresh();
}

function applyTimelineFilter(categoryValue: string) {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  timeline.querySelectorAll<HTMLElement>('.tl-cat-travel, .tl-cat-xian, .tl-cat-quarrel')
    .forEach(item => { item.hidden = categoryValue !== 'all' && !item.classList.contains(`tl-cat-${categoryValue}`); });
  // 隐藏没有可见条目的月份标题
  timeline.querySelectorAll<HTMLElement>('.timeline-month').forEach(month => {
    let node = month.nextElementSibling;
    let anyVisible = false;
    while (node && !node.classList.contains('timeline-month')) {
      if (node.classList.contains('timeline-item') && !node.hidden) { anyVisible = true; break; }
      node = node.nextElementSibling;
    }
    month.hidden = !anyVisible;
  });
}

document.addEventListener('click', async event => {
  const target = event.target as HTMLElement;
  const sfViewBtn = target.closest<HTMLButtonElement>('[data-sf-view-btn]');
  if (sfViewBtn?.dataset.sfViewBtn) {
    if (sfViewBtn.dataset.sfViewBtn !== scheduleView) applyScheduleView(sfViewBtn.dataset.sfViewBtn, { replace: false });
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
  const contextPopoverTrigger = target.closest<HTMLElement>('[data-sf-popover]');
  if (contextPopoverTrigger && !target.closest('.sf-context-popover') && window.matchMedia('(hover: none)').matches) {
    const isOpen = contextPopoverTrigger.classList.toggle('is-open');
    const popover = contextPopoverTrigger.querySelector<HTMLElement>('.sf-context-popover');
    popover?.setAttribute('aria-hidden', String(!isOpen));
    return;
  }
  if (target.closest('.util-dc')) { state.selected = null; writeQueryState(); refresh(); return; }

  const hemaPrev = target.closest<HTMLButtonElement>('.daily-hema-prev');
  if (hemaPrev && !hemaPrev.disabled) { hemaPage--; const el = document.getElementById('dailyHemaDay'); if (el) el.innerHTML = dailyHemaDayHtml(); return; }
  const hemaNext = target.closest<HTMLButtonElement>('.daily-hema-next');
  if (hemaNext && !hemaNext.disabled) { hemaPage++; const el = document.getElementById('dailyHemaDay'); if (el) el.innerHTML = dailyHemaDayHtml(); return; }
  const expenseCatPrev = target.closest<HTMLButtonElement>('.daily-expense-prev');
  if (expenseCatPrev && !expenseCatPrev.disabled) { expenseCatPage--; const el = document.getElementById('dailyExpenseCategory'); if (el) el.innerHTML = dailyExpenseCategoryHtml(); return; }
  const expenseCatNext = target.closest<HTMLButtonElement>('.daily-expense-next');
  if (expenseCatNext && !expenseCatNext.disabled) { expenseCatPage++; const el = document.getElementById('dailyExpenseCategory'); if (el) el.innerHTML = dailyExpenseCategoryHtml(); return; }
  const expenseRecordTypeBtn = target.closest<HTMLButtonElement>('[data-expense-record-type]');
  if (expenseRecordTypeBtn?.dataset.expenseRecordType === 'expense' || expenseRecordTypeBtn?.dataset.expenseRecordType === 'income') {
    expenseRecordView = expenseRecordTypeBtn.dataset.expenseRecordType;
    expenseRecordCategory = 'all';
    expenseRecordPage = 0;
    const el = document.getElementById('expenseContent');
    if (el) el.innerHTML = expenseView();
    return;
  }
  const expenseRecordCategoryBtn = target.closest<HTMLButtonElement>('[data-expense-record-category]');
  if (expenseRecordCategoryBtn?.dataset.expenseRecordCategory) {
    expenseRecordCategory = expenseRecordCategoryBtn.dataset.expenseRecordCategory;
    expenseRecordPage = 0;
    const el = document.getElementById('expenseContent');
    if (el) el.innerHTML = expenseView();
    return;
  }
  const trendViewBtn = target.closest<HTMLButtonElement>('[data-sf-trend-view]');
  if (trendViewBtn?.dataset.sfTrendView === 'expense' || trendViewBtn?.dataset.sfTrendView === 'income') {
    expenseTrendView = trendViewBtn.dataset.sfTrendView;
    expenseTrendSelectedDay = null;
    renderExpenseTrendTargets();
    return;
  }
  const scheduleCategoryViewBtn = target.closest<HTMLButtonElement>('[data-sf-category-view]');
  if (scheduleCategoryViewBtn?.dataset.sfCategoryView === 'amount' || scheduleCategoryViewBtn?.dataset.sfCategoryView === 'percentage') {
    scheduleCategoryView = scheduleCategoryViewBtn.dataset.sfCategoryView;
    ['sfCategorySummary', 'expenseCategoryChart'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.innerHTML = scheduleExpenseCategoryHtml();
    });
    return;
  }
  const membershipNoteCell = target.closest<HTMLElement>('.membership-row-note, .membership-row-note-mobile');
  if (membershipNoteCell) {
    const noteText = membershipNoteTipText(membershipNoteCell);
    if (noteText && navigator.clipboard) {
      navigator.clipboard.writeText(noteText).then(() => {
        showMembershipNoteTip(membershipNoteCell, noteText, true);
        membershipNoteTipTimer = window.setTimeout(hideMembershipNoteTip, 1600);
      }).catch(() => {});
    }
    return;
  }
  const membershipViewBtn = target.closest<HTMLButtonElement>('.membership-view-btn');
  if (membershipViewBtn?.dataset.membershipView) { hideMembershipNoteTip(); membershipView = membershipViewBtn.dataset.membershipView; membershipListPage = 0; const el = document.getElementById('membershipSubscriptions'); if (el) el.innerHTML = membershipSubscriptionsHtml(); return; }
  const membershipRenewBtn = target.closest<HTMLButtonElement>('[data-membership-index]');
  if (membershipRenewBtn?.dataset.membershipIndex) {
    const index = Number(membershipRenewBtn.dataset.membershipIndex);
    const record = (window.__membershipRecords || [])[index];
    if (record) {
      const previousValue = isRenewalRecord(record);
      record.willRenew = !isRenewalRecord(record);
      const synced = await syncMembershipRenewalState(record);
      if (!synced) record.willRenew = previousValue;
      refresh();
    }
    return;
  }
  const membershipPageBtn = target.closest<HTMLButtonElement>('[data-membership-page]');
  if (membershipPageBtn && !membershipPageBtn.disabled) {
    membershipListPage += membershipPageBtn.dataset.membershipPage === 'next' ? 1 : -1;
    const el = document.getElementById('membershipSubscriptions');
    if (el) el.innerHTML = membershipSubscriptionsHtml();
    return;
  }
  const trendNode = target.closest<SVGCircleElement>('.expense-line-node');
  if (trendNode?.dataset.expenseTrendDay) { expenseTrendSelectedDay = Number(trendNode.dataset.expenseTrendDay); renderExpenseTrendTargets(); return; }
  const tooltipClose = target.closest<HTMLButtonElement>('.expense-line-tooltip-close');
  if (tooltipClose) { expenseTrendSelectedDay = null; renderExpenseTrendTargets(); return; }
  const topPrev = target.closest<HTMLButtonElement>('.expense-top-prev');
  if (topPrev && !topPrev.disabled) { expenseTopPage--; const el = document.getElementById('expenseTopItems'); if (el) el.innerHTML = expenseTopItemsHtml(); return; }
  const topNext = target.closest<HTMLButtonElement>('.expense-top-next');
  if (topNext && !topNext.disabled) { expenseTopPage++; const el = document.getElementById('expenseTopItems'); if (el) el.innerHTML = expenseTopItemsHtml(); return; }
  const expenseRecordPageBtn = target.closest<HTMLButtonElement>('[data-expense-record-page]');
  if (expenseRecordPageBtn && !expenseRecordPageBtn.disabled) {
    expenseRecordPage += expenseRecordPageBtn.dataset.expenseRecordPage === 'next' ? 1 : -1;
    const el = document.getElementById('expenseContent');
    if (el) el.innerHTML = expenseView();
    return;
  }
  const city = target.closest<HTMLButtonElement>('[data-fm-city]');
  if (city) {
    const value = city.dataset.fmCity;
    const root = city.closest<HTMLElement>('[data-tab="food-map"]');
    if (!value || !root) return;
    root.querySelectorAll('[data-fm-city]').forEach(button => {
      const active = button === city;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    root.querySelectorAll<HTMLElement>('[data-fm-city-content]').forEach(content => {
      content.hidden = content.dataset.fmCityContent !== value;
    });
    const cityContent = root.querySelector<HTMLElement>(`[data-fm-city-content="${CSS.escape(value)}"]`);
    const first = cityContent?.querySelector<HTMLButtonElement>('[data-fm-area]');
    first?.click();
    return;
  }
  const area = target.closest<HTMLButtonElement>('[data-fm-area]');
  if (area) {
    const value = area.dataset.fmArea;
    const cityContent = area.closest<HTMLElement>('[data-fm-city-content]');
    cityContent?.querySelectorAll('[data-fm-area]').forEach(button => button.classList.toggle('active', button === area));
    cityContent?.querySelectorAll<HTMLElement>('[data-fm-area-content]').forEach(content => { content.hidden = content.dataset.fmAreaContent !== value; });
    const first = cityContent?.querySelector<HTMLButtonElement>(`[data-fm-area-content="${CSS.escape(value || '')}"] [data-fm-location]`);
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
    const categoryValue = relation.dataset.rlCat!;
    document.querySelectorAll('[data-rl-cat]').forEach(button => button.classList.toggle('active', button === relation));
    applyTimelineFilter(categoryValue);
    return;
  }
  const quarrel = target.closest<HTMLElement>('[data-rl-q-toggle]');
  if (quarrel) {
    const body = quarrel.parentElement?.querySelector<HTMLElement>('.q-body');
    body?.classList.toggle('collapsed');
    quarrel.classList.toggle('open', !body?.classList.contains('collapsed'));
  }
});

document.addEventListener('mouseover', event => {
  const cell = (event.target as HTMLElement).closest<HTMLElement>('.membership-row-note, .membership-row-note-mobile');
  if (!cell) return;
  const text = membershipNoteTipText(cell);
  if (text) showMembershipNoteTip(cell, text);
});
document.addEventListener('mouseout', event => {
  if ((event.target as HTMLElement).closest('.membership-row-note, .membership-row-note-mobile')) hideMembershipNoteTip();
});
window.addEventListener('scroll', hideMembershipNoteTip, true);

window.addEventListener('popstate', () => {
  if (page !== SCHEDULE_FINANCE_PAGE) return;
  applyScheduleView(readScheduleView());
});

readQueryState();
setupAccordions();

if (page === SCHEDULE_FINANCE_PAGE) {
  applyScheduleView(readScheduleView(), { render: false });
  renderScheduleFinanceKpis();
  // 三个视图一次性渲染，切换时无需等待，各自内部状态（月/年/选中日/翻页）保持不变
  SF_VIEW_IDS.forEach(renderView);
} else {
  refresh();
}
