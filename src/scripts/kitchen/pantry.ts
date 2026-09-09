// 厨房工作台 · 食材存放：18 天甘特图 + 状态 Badge + 保鲜 Hover + 编辑 Drawer
// 业务口径与原来一致：到期日 = 买入日 + 可放天数；红(diff<=0) 黄(<=2) 绿(其余)。
// 「吃完 / 改日期 / 改存放方式」保存在浏览器 localStorage（pig.kitchen.pantry.v1），
// 不改动数据源文件；下次要重置时清空该 key 即可。

import type { PantryItemData, ShelfGroupData } from '../../lib/kitchen-types';
import { payload } from './data';
import { dayDiff, esc, mdLabel, openDrawer, parseYmd, todayZero, ymd } from './ui';

interface RowView extends PantryItemData {
  status: 'red' | 'yellow' | 'green';
  diff: number;
  buy: Date;
  exp: Date;
  startCol: number;
  endCol: number;
}

const PANTRY_COLS = 18;

type PatchMap = Record<string, { done?: boolean; bought?: string; days?: number; place?: string; note?: string }>;
const PATCH_KEY = 'pig.kitchen.pantry.v1';

function readPatch(): PatchMap {
  try {
    return JSON.parse(localStorage.getItem(PATCH_KEY) || '{}') as PatchMap;
  } catch {
    return {};
  }
}
function writePatch(map: PatchMap): void {
  try {
    localStorage.setItem(PATCH_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function placeTone(place: string): string {
  if (place.includes('冷藏')) return 'cold';
  if (place.includes('冷冻')) return 'freeze';
  if (place.includes('阴凉')) return 'shade';
  return 'room';
}

function computeRows(): RowView[] {
  const patch = readPatch();
  const P = payload();
  const today = todayZero();
  const axisStart = new Date(today);
  axisStart.setDate(today.getDate() - 2);

  const statusRank: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  const rows = P.pantry
    .filter(it => !patch[it.name]?.done)
    .map(it => {
      const over = patch[it.name] || {};
      const boughtStr = over.bought ?? it.bought;
      const days = over.days ?? it.days;
      const place = over.place ?? it.place;
      const note = over.note ?? it.note;
      const buy = parseYmd(boughtStr);
      const exp = new Date(buy);
      exp.setDate(buy.getDate() + Math.max(0, Math.round(days || 0)));
      const diff = dayDiff(exp, today);
      return {
        ...it,
        place,
        note,
        buy,
        exp,
        diff,
        status: (diff <= 0 ? 'red' : diff <= 2 ? 'yellow' : 'green') as RowView['status'],
        startCol: dayDiff(buy, axisStart),
        endCol: dayDiff(exp, axisStart),
      };
    })
    .sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.diff - b.diff);
  return rows;
}

const STATUS_LABEL: Record<string, string> = {
  red: '已过期 / 今天到期',
  yellow: '明后天到期',
  green: '安全',
};

export function renderPantry(el: HTMLElement): void {
  const rows = computeRows();
  const head = `<div class="k-card-head"><h3 class="k-card-title">🧊 食材存放</h3>
    <span class="k-card-sub">18 天窗口 · 吃完就标掉</span></div>`;

  if (!rows.length && !payload().pantry.length) {
    el.innerHTML = `${head}<div class="k-card-empty">冰箱/储物柜现在有什么、几号买的、放几天？报给我录进 <code>food-pantry.ts</code>，这里就会长出「哪天过期」的甘特图。</div>`;
    return;
  }
  if (!rows.length) {
    el.innerHTML = `${head}<div class="k-card-empty">在吃的都吃完啦，冰箱很干净 ✨</div>`;
    return;
  }

  const counts = { red: 0, yellow: 0, green: 0 };
  rows.forEach(r => counts[r.status]++);
  const badges = `
    <div class="k-pantry-badges">
      <span class="k-pantry-badge k-pb-info">在库 ${rows.length}</span>
      <span class="k-pantry-badge k-pb-red">${counts.red} 过期 / 今天</span>
      <span class="k-pantry-badge k-pb-yellow">${counts.yellow} 明后天</span>
      <span class="k-pantry-badge k-pb-green">${counts.green} 安全</span>
    </div>`;

  const axisCols = `repeat(${PANTRY_COLS}, minmax(12px, 1fr))`;
  const today = todayZero();
  const axisStart = new Date(today);
  axisStart.setDate(today.getDate() - 2);

  const axisCells = Array.from({ length: PANTRY_COLS }, (_, i) => {
    const d = new Date(axisStart.getFullYear(), axisStart.getMonth(), axisStart.getDate() + i);
    const isToday = ymd(d) === ymd(today);
    const label = isToday ? '今' : d.getDate() === 1 ? `${d.getMonth() + 1}/${d.getDate()}` : String(d.getDate());
    return `<span class="k-px-day${isToday ? ' is-today' : ''}">${label}</span>`;
  }).join('');

  const rowsHtml = rows
    .map(r => {
      const label = `
        <div class="k-px-label">
          <div class="k-px-label-top">
            <span class="k-px-name">${esc(r.name)}</span>
            <span class="k-place-chip place-${placeTone(r.place)}">${esc(r.place)}</span>
          </div>
          <div class="k-px-dates">
            <span>${mdLabel(r.buy)} 买</span><i>·</i>
            <span class="k-px-exp exp-${r.status}">${mdLabel(r.exp)} 到期</span>
          </div>
        </div>`;
      let cells = '';
      for (let i = 0; i < PANTRY_COLS; i++) {
        const on = i >= Math.max(0, r.startCol) && i <= Math.min(r.endCol, PANTRY_COLS - 1);
        cells += `<span class="k-px-cell${on ? ` bar-${r.status}` : ''}"></span>`;
      }
      return `
        <div class="k-px-row" data-k-hover="pantry:${esc(r.name)}" data-k-pantry="${esc(r.name)}" role="button" tabindex="0">
          ${label}
          <div class="k-px-track" style="grid-template-columns:${axisCols}">${cells}</div>
        </div>`;
    })
    .join('');

  el.innerHTML = `${head}${badges}
    <div class="k-pantry-scroll">
      <div class="k-pantry-head">
        <div class="k-pantry-head-label">食材 · 存放位置</div>
        <div class="k-pantry-head-axis" style="grid-template-columns:${axisCols}">${axisCells}</div>
      </div>
      ${rowsHtml}
    </div>`;
}

/** Hover 保鲜信息 */
export function pantryHoverHtml(name: string): string {
  const r = computeRows().find(x => x.name === name);
  if (!r) return '';
  const refs = lookupRefs(name);
  const statusText = STATUS_LABEL[r.status];
  const toneCls = `txt-${r.status}`;
  return `
    <div class="k-pop-title">${esc(r.name)} <span class="k-pop-status ${toneCls}">${statusText}</span></div>
    <p class="k-pop-line">${esc(r.place)}存放 · 已存 ${Math.max(0, dayDiff(todayZero(), r.buy))} 天</p>
    ${refs ? `<p class="k-pop-line">${esc(refs)}</p>` : ''}
    <p class="k-pop-line">预计 ${r.exp.getMonth() + 1}/${r.exp.getDate()} 到期${r.diff >= 0 ? `（还有 ${r.diff} 天）` : `（已过 ${-r.diff} 天）`}</p>
    ${r.note ? `<p class="k-pop-line k-pop-note">${esc(r.note)}</p>` : ''}`;
}

/** 根据食材名找「存放周期参考」里的建议（名字互相包含即算命中） */
function lookupRefs(name: string): string | null {
  const P = payload();
  for (const group of P.shelfGroups) {
    for (const item of group.items) {
      const key = item.name.replace(/[（(].*$/, '').trim();
      if (name.includes(key) || key.includes(name)) {
        return item.refs.map(r => `${r.p} ${r.t}`).join('；');
      }
    }
  }
  return null;
}

export function openPantryDrawer(name: string): void {
  const r = computeRows().find(x => x.name === name);
  if (!r) return;
  const body = pantryEditBody(r);
  openDrawer({
    title: r.name,
    subtitle: `${r.place} · ${r.diff <= 0 ? '该处理啦' : `还能放 ${r.diff} 天`}`,
    body,
    footer: `<p class="k-hint-text">「吃完 / 删除」保存在本机浏览器；数据源文件 <code>food-pantry.ts</code> 保持不变。</p>`,
  });
}

function pantryEditBody(r: RowView): string {
  const patch = readPatch()[r.name] || {};
  const placeOptions = ['冷藏', '冷冻', '常温', '阴凉'];
  const select = placeOptions
    .map(p => `<option value="${p}"${p === (patch.place ?? r.place) ? ' selected' : ''}>${p}</option>`)
    .join('');
  return `
    <div class="k-field-row">
      <label class="k-field"><span>入库日期</span><input type="date" data-k-bought="${esc(r.name)}" value="${patch.bought ?? ymd(r.buy)}"></label>
      <label class="k-field"><span>预计可放天数</span><input type="number" data-k-days="${esc(r.name)}" min="0" max="365" value="${patch.days ?? r.days}"></label>
    </div>
    <div class="k-field-row">
      <label class="k-field"><span>存放方式</span><select data-k-place="${esc(r.name)}">${select}</select></label>
    </div>
    ${r.note ? `<p class="k-note-line">备注：${esc(r.note)}</p>` : ''}
    <div class="k-drawer-actions">
      <button class="k-btn k-btn-primary" type="button" data-k-pantry-save="${esc(r.name)}">保存变更</button>
      <button class="k-btn k-btn-ghost" type="button" data-k-pantry-done="${esc(r.name)}">标记吃完 / 删除</button>
    </div>`;
}

export function applyPantrySave(name: string): void {
  const map = readPatch();
  const cur = map[name] || {};
  const boughtVal = document.querySelector<HTMLInputElement>(`[data-k-bought="${CSS.escape(name)}"]`)?.value;
  const daysVal = document.querySelector<HTMLInputElement>(`[data-k-days="${CSS.escape(name)}"]`)?.value;
  const placeVal = document.querySelector<HTMLSelectElement>(`[data-k-place="${CSS.escape(name)}"]`)?.value;
  if (boughtVal) cur.bought = boughtVal;
  if (daysVal !== undefined && daysVal !== '') cur.days = Number(daysVal);
  if (placeVal) cur.place = placeVal;
  map[name] = cur;
  writePatch(map);
}

export function markPantryDone(name: string): void {
  const map = readPatch();
  map[name] = { ...(map[name] || {}), done: true };
  writePatch(map);
}

/** 存放周期参考：按分类分组、每组内列出具体食材与冷藏/冷冻时长 */
export function renderShelf(el: HTMLElement): void {
  const P = payload();
  const dotCls = (place: string) =>
    place.includes('冷藏') ? 'cold' :
    place.includes('冷冻') ? 'freeze' :
    place.includes('阴凉') ? 'shade' : 'room';
  const groups = P.shelfGroups
    .map(g => {
      const icon = String(g.cat).split(' ')[0] || '🍱';
      const label = String(g.cat).replace(/^\S+\s*/, '');
      const items = g.items.map(item => {
        // "冷藏 1-2 天" / "冷藏至保质期；开封后 1-3 天" → 拆出方式 + 时长
        const refs = item.refs.map(ref => {
          const txt = `${ref.p} ${ref.t}`.trim();
          // 拆中文分号（；/;）为多行
          const parts = txt.split(/[；;]/).map(s => s.trim()).filter(Boolean);
          const lines = parts.map(p => `<span class="k-shelf-ref"><i class="${dotCls(ref.p)}"></i>${esc(p)}</span>`).join('');
          return `<div class="k-shelf-refs">${lines}</div>`;
        }).join('');
        return `<div class="k-shelf-item">
          <b class="k-shelf-name">${esc(item.name)}</b>
          ${refs}
        </div>`;
      }).join('');
      return `<section class="k-shelf-group" data-k-hover="shelf:${esc(g.cat)}" data-k-shelf="${esc(g.cat)}">
        <h4 class="k-shelf-group-title">${icon} ${esc(label)}</h4>
        <div class="k-shelf-items">${items || '<div class="k-card-empty">该分类暂无条目</div>'}</div>
      </section>`;
    })
    .join('');
  el.innerHTML = `<div class="k-card-head"><h3 class="k-card-title">📋 存放周期参考</h3>
    <span class="k-card-sub">悬停看细节 · 点击展开</span></div>
    <div class="k-shelf-list">${groups || '<div class="k-card-empty">暂无参考</div>'}</div>`;
}

export function shelfHoverHtml(cat: string): string {
  const P = payload();
  const group = P.shelfGroups.find(g => g.cat === cat);
  if (!group) return '';
  const rows = group.items
    .map(it => `<p class="k-pop-line"><b>${esc(it.name)}</b><br>${it.refs.map(ref => `${esc(ref.p)}：${esc(ref.t)}`).join('　')}</p>`)
    .join('');
  return `<div class="k-pop-title">${esc(cat)}</div>${rows}<p class="k-hint-text">点击可看整组参考</p>`;
}

export function openShelfDrawer(cat: string): void {
  const P = payload();
  const group = P.shelfGroups.find(g => g.cat === cat);
  if (!group) return;
  const rows = group.items
    .map(it => `
      <div class="k-shelf-item">
        <b>${esc(it.name)}</b>
        <span class="k-shelf-refs">${it.refs.map(ref => `<span class="k-shelf-ref">${esc(ref.p)} · ${esc(ref.t)}</span>`).join('')}</span>
      </div>`)
    .join('');
  openDrawer({
    title: cat,
    body: rows,
    footer: '<p class="k-hint-text">入库时照着这张卡填「能放几天」，甘特图才准哦～</p>',
  });
}
