// 厨房工作台 · 价格速查：分类浏览 + 条目 Hover + 详情 Drawer
// 真实数据模型是「一物一价、更新时间」；没有多期历史，因此 Hover 只展示备注/来源/最近记录，不虚构均价曲线。

import type { PriceItemData } from '../../lib/kitchen-types';
import { payload } from './data';
import { esc, openDrawer } from './ui';

const ICONS: Record<string, string> = {
  蔬菜: '🥬',
  肉禽蛋: '🥩',
  水产: '🦐',
  主食豆制品: '🍚',
  调料干货: '🧂',
  水果: '🍎',
  冷冻速食: '🧊',
  饮品零食: '🥤',
};

let currentCat: string | null = null;

export function renderPrices(el: HTMLElement, catOverride?: string): void {
  const P = payload();
  if (!P.prices.length) {
    el.innerHTML = `<div class="k-card-head"><h3 class="k-card-title">🏷️ 价格速查</h3></div>
      <div class="k-card-empty">买菜时留意单价，整理进 <code>food-prices.ts</code>，买菜前先瞄一眼就不怕买贵啦。</div>`;
    return;
  }
  const groups = groupPrices();
  if (catOverride) currentCat = catOverride;
  if (!currentCat || !groups.some(g => g.cat === currentCat)) {
    currentCat = groups.find(g => g.items.length)?.cat ?? null;
  }

  const tabs = groups
    .map(g => {
      const active = g.cat === currentCat;
      return `<button type="button" class="k-price-tab${active ? ' active' : ''}" data-k-price-tab="${esc(g.cat)}">
        ${ICONS[g.cat] ?? '🛒'} ${esc(g.cat)}<em>${g.items.length}</em>
      </button>`;
    })
    .join('');

  const head = `<div class="k-card-head"><h3 class="k-card-title">🏷️ 价格速查</h3>
    <span class="k-card-sub">${P.prices.length} 条记录</span></div>`;

  const activeGroup = groups.find(g => g.cat === currentCat);
  const list = activeGroup
    ? activeGroup.items
        .map(item => `
          <button type="button" class="k-price-row" data-k-hover="price:${esc(item.name)}" data-k-price="${esc(item.name)}">
            <span class="k-price-emoji">${priceEmoji(item)}</span>
            <span class="k-price-main">
              <span class="k-price-top"><b>${esc(item.name)}</b>${item.spec ? `<span class="k-price-spec">${esc(item.spec)}</span>` : ''}</span>
              <span class="k-price-meta">${item.price ? `<span class="k-price-current">${esc(item.price)}</span>` : '价格待补'}${item.updated ? ` · ${esc(item.updated)}` : ''}</span>
            </span>
            <span class="k-chevron">›</span>
          </button>`)
        .join('')
    : '';

  el.innerHTML = `${head}<div class="k-price-body">
    <div class="k-price-tabs">${tabs}</div>
    <div class="k-price-list">${list || '<div class="k-card-empty">这个分类还没有记录</div>'}</div>
  </div>`;
}

function groupPrices(): { cat: string; items: PriceItemData[] }[] {
  const P = payload();
  const order = new Map(P.priceCategories.map((c, i) => [c, i]));
  return [...new Set(P.prices.map(p => p.category))]
    .sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
    .map(cat => ({ cat, items: P.prices.filter(p => p.category === cat) }));
}

function priceEmoji(item: PriceItemData): string {
  return ICONS[item.category] ?? '🛒';
}

/** Hover：备注 / 来源 / 最近记录日期（历史不足就只显示备注） */
export function priceHoverHtml(name: string): string {
  const items = payload().prices.filter(p => p.name === name);
  if (!items.length) return '';
  const it = items[items.length - 1];
  const lines: string[] = [];
  if (it.price) lines.push(`<p class="k-pop-line">当前参考价 <b>${esc(it.price)}</b>${it.spec ? `（${esc(it.spec)}）` : ''}</p>`);
  if (it.updated) lines.push(`<p class="k-pop-line">最近记录 · ${esc(it.updated)}</p>`);
  if (it.source) lines.push(`<p class="k-pop-line">📍 ${esc(it.source)}</p>`);
  if (it.note) lines.push(`<p class="k-pop-line k-pop-note">${esc(it.note)}</p>`);
  if (!lines.length) lines.push('<p class="k-pop-line">还没有记过价</p>');
  return `<div class="k-pop-title">${esc(name)}</div>${lines.join('')}`;
}

export function openPriceDrawer(name: string): void {
  const P = payload();
  const item = P.prices.find(p => p.name === name);
  if (!item) return;
  const row = (label: string, value: string) => `<div class="k-detail-row"><span>${label}</span><b>${value}</b></div>`;
  const rows = [
    item.price ? row('参考价', esc(item.price)) : '',
    item.spec ? row('规格 / 单位', esc(item.spec)) : '',
    item.source ? row('购买地点', esc(item.source)) : '',
    item.updated ? row('最近记录', esc(item.updated)) : '',
  ].join('');
  const json = JSON.stringify(item, null, 2);
  openDrawer({
    title: item.name,
    subtitle: ICONS[item.category] ? `${ICONS[item.category]} ${esc(item.category)}` : esc(item.category),
    body: `
      ${rows}
      ${item.note ? `<div class="k-note-box">${esc(item.note)}</div>` : ''}
      <details class="k-code-details"><summary>查看这条价格记录的结构</summary>
        <pre class="k-code-pre"><code>${esc(json)}</code></pre>
      </details>
      <div class="k-drawer-actions">
        <button class="k-btn k-btn-ghost" type="button" data-k-copy data-k-copy-label="复制这条记录">复制这条记录</button>
      </div>`,
    footer: '<p class="k-hint-text">价格维护在 <code>food-prices.ts</code>，买完菜把真实单价补进去，数据会越来越有用。</p>',
  });
}

export function selectPriceTab(el: HTMLElement, cat: string): void {
  currentCat = cat;
  renderPrices(el);
}
