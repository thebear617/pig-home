// 厨房工作台 · 做菜日历（主模块）

import { getLunarDayName, getLunarInfo, pad } from '../../lib/helpers';
import { payload } from './data';
import { dateHasRecords, dayData, dishName } from './meals';
import { st, todayKey } from './state';
import { esc, fmtMin, fmtMoney, weekdayLabel } from './ui';

export function calendarColHtml(): string {
  const { year, month } = st;
  const records = payload().foodRecords;
  const prefix = `${year}-${pad(month)}`;
  const cookedDays = Object.keys(records).filter(k => k.startsWith(prefix)).length;

  const header = `
    <div class="k-cal-head">
      <div class="k-cal-titlebox">
        <h3 class="k-card-title">🍳 做菜记录</h3>
        <span class="k-cal-year">${year}年${month}月</span>
      </div>
      <div class="k-cal-nav">
        <button class="k-icon-btn" type="button" data-k-mnav="-1" aria-label="上个月">‹</button>
        <button class="k-today-btn" type="button" data-k-mnav="0">今天</button>
        <button class="k-icon-btn" type="button" data-k-mnav="1" aria-label="下个月">›</button>
      </div>
    </div>
    <div class="k-cal-legend">
      <span><i class="k-dot dot-record"></i>有记录</span>
      <span><i class="k-dot dot-today"></i>今天</span>
      <span><i class="k-dot dot-selected"></i>选中</span>
    </div>`;

  const weekRow = `<div class="k-cal-week">${['日', '一', '二', '三', '四', '五', '六'].map(w => `<span>${w}</span>`).join('')}</div>`;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: string[] = [];
  const prevLast = new Date(year, month - 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    cells.push(dayCell(year, month - 1, prevLast - firstDay + i + 1, false));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(dayCell(year, month, day, true));
  }
  const remainder = (7 - ((firstDay + daysInMonth) % 7)) % 7;
  for (let day = 1; day <= remainder; day++) {
    cells.push(dayCell(year, month + 1, day, false));
  }

  return `
    ${header}
    ${weekRow}
    <div class="k-cal-grid">${cells.join('')}</div>
    <div class="k-cal-foot">本月 ${cookedDays} 天有记录，继续好好吃饭</div>
  `;
}

function dayCell(year: number, month: number, day: number, currentMonth: boolean): string {
  const key = `${year}-${pad(month)}-${pad(day)}`;
  const lunar = getLunarInfo(year, month, day);
  const lunarText = lunar.isStart ? lunar.lMonthName : getLunarDayName(lunar.lDay);
  const has = dateHasRecords(key);
  const cls = ['k-day'];
  if (!currentMonth) cls.push('k-day-dim');
  if (key === todayKey) cls.push('is-today');
  if (has) cls.push('has-record');
  if (st.selected === key) cls.push('is-selected');
  const attrs = has ? `data-k-hover="date:${key}"` : `data-k-hover="dateempty:${key}"`;
  const tag = currentMonth ? 'button' : 'span';
  return `<${tag} type="button" class="${cls.join(' ')}" data-k-date="${key}" ${attrs} aria-label="${month}月${day}日">
    <span class="k-day-lunar">${esc(lunarText)}</span>
    <span class="k-day-num">${day}</span>
    ${has ? '<i class="k-day-dot" aria-hidden="true"></i>' : ''}
  </${tag}>`;
}

/** 日历日期 Hover 预览：有记录的日期显示当天简况 */
export function dayHoverHtml(key: string): string {
  const dd = dayData(key);
  if (!dd.meals.length) return '';
  const day = new Date(`${key}T00:00:00`);
  const head = `<div class="k-pop-title">${day.getMonth() + 1}月${day.getDate()}日 · ${weekdayLabel(day)}</div>`;
  const meals = dd.meals
    .map(m => {
      const names = (m.dishes || []).map(dishName).join('、');
      return `<p class="k-pop-line"><b>${esc(m.meal)}</b> · ${esc(names)}</p>`;
    })
    .join('');
  const stats = [
    dd.cost != null ? `花费 ${fmtMoney(dd.cost)}` : '',
    dd.min > 0 ? `用时 ${fmtMin(dd.min)}` : '',
    `${dd.dishCount} 道菜`,
  ]
    .filter(Boolean)
    .join(' · ');
  return `${head}${meals}<p class="k-pop-line k-pop-stats">${stats}</p>`;
}
