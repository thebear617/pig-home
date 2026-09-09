// 厨房工作台 · UI 基础层：转义 / 日期 / 数字工具 + Drawer + Hover Card 浮层

import { escapeHtml, pad } from '../../lib/helpers';

export const BASE = import.meta.env.BASE_URL ?? '/';

export function esc(value: unknown): string {
  return escapeHtml(value);
}

export function assetUrl(value: string): string {
  if (/^(?:https?:)?\//.test(value)) return value;
  return `${BASE}${value}`;
}

// ── 日期 / 时间 ──────────────────────────────────────────────
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function mdLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}
export function todayZero(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function parseMin(v: number | string | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? 0 : n;
}
export function fmtMin(min: number): string {
  if (min <= 0) return '';
  if (min < 60) return `${min} 分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}
export function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '';
  return `¥${Math.round(n * 10) / 10}`;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
export function weekdayLabel(d: Date): string {
  return `周${WEEKDAYS[d.getDay()]}`;
}

export function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`[kitchen] missing element #${id}`);
  return el as T;
}

// ── Drawer ───────────────────────────────────────────────────
export interface DrawerOptions {
  title: string;
  subtitle?: string;
  body: string;
  footer?: string;
}

export function openDrawer(opts: DrawerOptions): void {
  const root = byId('kDrawerRoot');
  const overlay = byId('kOverlay');
  const title = esc(opts.title);
  const subtitle = opts.subtitle ? `<p class="k-drawer-sub">${esc(opts.subtitle)}</p>` : '';
  root.innerHTML = `
<div class="k-drawer-mask" data-kd-close></div>
<aside class="k-drawer" role="dialog" aria-modal="false" aria-label="${title}">
  <header class="k-drawer-head">
    <div class="k-drawer-titlebox">
      <h3 class="k-drawer-title">${title}</h3>
      ${subtitle}
    </div>
    <button class="k-icon-btn k-drawer-close" type="button" data-kd-close aria-label="关闭">✕</button>
  </header>
  <div class="k-drawer-body">${opts.body}</div>
  ${opts.footer ? `<footer class="k-drawer-foot">${opts.footer}</footer>` : ''}
</aside>`;
  overlay.hidden = false;
  root.hidden = false;
  document.body.classList.add('k-drawer-open');
  requestAnimationFrame(() => root.classList.add('open'));
}

export function closeDrawer(): void {
  const root = document.getElementById('kDrawerRoot');
  const overlay = document.getElementById('kOverlay');
  document.body.classList.remove('k-drawer-open');
  if (!root) return;
  root.classList.remove('open');
  root.hidden = true;
  if (overlay) overlay.hidden = true;
}

/** 桌面端 ≥1280 才常驻右侧日期详情；否则日期详情走 Drawer */
export function dayColumnResident(): boolean {
  return window.matchMedia('(min-width: 1280px)').matches;
}

// ── Hover Card / 轻量浮层 ────────────────────────────────────
let hoverTimer = 0;
let hideTimer = 0;

export function showHover(anchor: HTMLElement, html: string): void {
  window.clearTimeout(hideTimer);
  window.clearTimeout(hoverTimer);
  const el = document.getElementById('kHoverCard');
  if (!el) return;
  hoverTimer = window.setTimeout(() => {
    el.innerHTML = html;
    el.hidden = false;
    placeHover(el, anchor);
  }, 70);
}

export function scheduleHideHover(): void {
  window.clearTimeout(hoverTimer);
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    const el = document.getElementById('kHoverCard');
    if (el) el.hidden = true;
  }, 160);
}

export function hideHoverNow(): void {
  window.clearTimeout(hoverTimer);
  window.clearTimeout(hideTimer);
  const el = document.getElementById('kHoverCard');
  if (el) el.hidden = true;
}

/** 光标移到浮层上时防止它消失 */
export function keepHoverAlive(): void {
  window.clearTimeout(hideTimer);
}

function placeHover(el: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = el.offsetWidth || 320;
  const height = el.offsetHeight || 200;
  let left = rect.left;
  let top = rect.bottom + 8;

  if (left + width > window.innerWidth - 12) left = Math.max(12, rect.right - width);
  if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 8);
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

export function hideOnScroll(): void {
  const el = document.getElementById('kHoverCard');
  if (el) el.hidden = true;
}
