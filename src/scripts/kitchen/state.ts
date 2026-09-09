// 厨房工作台 · 页面状态（月份 / 选中日期 / 价格分类），URL month & date 参数可深链

import { pad } from '../../lib/helpers';

export interface KitState {
  year: number;
  month: number;
  selected: string | null;
  priceCat: string | null;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export const todayRef = new Date();
export const todayKey = dateKey(todayRef.getFullYear(), todayRef.getMonth() + 1, todayRef.getDate());

export const st: KitState = {
  year: todayRef.getFullYear(),
  month: todayRef.getMonth() + 1,
  selected: null,
  priceCat: null,
};

function writeQueryState(): void {
  const params = new URLSearchParams(window.location.search);
  params.set('month', `${st.year}-${pad(st.month)}`);
  if (st.selected) params.set('date', st.selected);
  else params.delete('date');
  history.replaceState(null, '', `${window.location.pathname}?${params}`);
}

export function readQueryState(): void {
  const params = new URLSearchParams(window.location.search);
  const month = params.get('month');
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      st.year = y;
      st.month = m;
    }
  }
  const selected = params.get('date');
  if (selected && /^\d{4}-\d{2}-\d{2}$/.test(selected)) {
    st.selected = selected;
    st.year = Number(selected.slice(0, 4));
    st.month = Number(selected.slice(5, 7));
  }
}

export function persistState(): void {
  writeQueryState();
}
