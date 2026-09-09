// 厨房工作台 · 总入口：渲染编排 + 统一事件委托（Hover / Click / Drawer / Search / 键盘）

import { findRecipeForDish, payload } from './data';
import { calendarColHtml, dayHoverHtml } from './calendar';
import { dayPanelHtml, editDayDrawerHtml } from './day';
import { chefRankingHtml, currentPrefix, dishDrawerHtml, dishPopoverHtml, frequentHtml, kpisHtml, kpiPopoverHtml } from './stats';
import { markPantryDone, openPantryDrawer, openShelfDrawer, pantryHoverHtml, renderPantry, renderShelf, shelfHoverHtml, applyPantrySave } from './pantry';
import { openPriceDrawer, priceHoverHtml, renderPrices, selectPriceTab } from './prices';
import { categoryHoverHtml, closeQuickCat, openRecipeDrawer, recipeHoverHtml, recipeMarkdown, recipesQuickHtml, toggleQuickCat } from './recipes';
import { buildSearchHtml } from './search';
import { persistState, readQueryState, st, todayKey, todayRef } from './state';
import { byId, closeDrawer, dayColumnResident, hideHoverNow, hideOnScroll, keepHoverAlive, openDrawer, parseYmd, scheduleHideHover, showHover, weekdayLabel } from './ui';

// ── 渲染编排 ─────────────────────────────────────────────────
function containers() {
  return {
    kpis: byId('kKpis'),
    calendar: byId('kCalendarCol'),
    frequent: byId('kFrequent'),
    chefs: byId('kChefs'),
    recipeQuick: byId('kRecipeQuick'),
    day: byId('kDayPanel'),
    pantry: byId('kPantry'),
    shelf: byId('kShelf'),
    prices: byId('kPrices'),
  };
}

function renderStatic(): void {
  const els = containers();
  els.kpis.innerHTML = kpisHtml(currentPrefix());
  els.calendar.innerHTML = calendarColHtml();
  els.frequent.innerHTML = frequentHtml();
  els.chefs.innerHTML = chefRankingHtml();
  els.recipeQuick.innerHTML = recipesQuickHtml();
  renderPantry(els.pantry);
  renderShelf(els.shelf);
  renderPrices(els.prices);
}

function dayTitle(key: string | null): string {
  if (!key) return '选个日期看看';
  const d = parseYmd(key);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function renderDayPanel(): void {
  const els = containers();
  if (!dayColumnResident()) {
    // 窄屏：右侧面板不常驻，点击日期时用 Drawer（见 selectDate）
    els.day.innerHTML = '';
    return;
  }
  if (!st.selected) {
    els.day.innerHTML = `<div class="k-card k-day-card"><div class="k-day-head"><div class="k-day-head-main"><span class="k-day-date">做菜详情</span><span class="k-day-week">点一下日历里的日期</span></div></div>
      <div class="k-card-empty k-day-empty">选一个橙点的日子，看看那天吃了什么 🍜</div></div>`;
    return;
  }
  els.day.innerHTML = dayPanelHtml(st.selected);
}

function refreshCalendarStats(): void {
  const els = containers();
  els.kpis.innerHTML = kpisHtml(currentPrefix());
  els.calendar.innerHTML = calendarColHtml();
  renderDayPanel();
}

function renderHero(): void {
  const el = document.getElementById('kHeroEyebrow');
  if (el) el.textContent = `${todayRef.getMonth() + 1}月${todayRef.getDate()}日 · ${weekdayLabel(todayRef)}`;
}

// ── 交互：日期 / 月份 ────────────────────────────────────────
function selectDate(key: string): void {
  const d = parseYmd(key);
  st.selected = key;
  st.year = d.getFullYear();
  st.month = d.getMonth() + 1;
  persistState();
  refreshCalendarStats();
  if (!dayColumnResident()) {
    const dd = dayPanelHtml(key);
    openDrawer({ title: dayTitle(key), subtitle: `${weekdayLabel(d)} 的做菜记录`, body: dd });
  }
}

function shiftMonth(delta: number): void {
  if (delta === 0) {
    st.year = todayRef.getFullYear();
    st.month = todayRef.getMonth() + 1;
    st.selected = todayKey;
  } else {
    st.month += delta;
    if (st.month < 1) { st.month = 12; st.year--; }
    if (st.month > 12) { st.month = 1; st.year++; }
    st.selected = null;
  }
  persistState();
  refreshCalendarStats();
}

function openDish(name: string): void {
  const P = payload();
  const recipe = findRecipeForDish(name, P.recipes);
  if (recipe) {
    openRecipeDrawer(recipe.id);
  } else {
    openDrawer({ title: name, subtitle: '做菜记录', body: dishDrawerHtml(name) });
  }
}

// ── 全局事件 ─────────────────────────────────────────────────
function onReady(): void {
  readQueryState();
  // 默认选中「今天」，若今天没记录则选最近有记录的一天
  if (!st.selected) {
    const keys = Object.keys(payload().foodRecords).filter(k => k <= todayKey).sort().reverse();
    const fallback = keys[0];
    if (fallback) {
      st.selected = fallback;
      const d = parseYmd(fallback);
      st.year = d.getFullYear();
      st.month = d.getMonth() + 1;
    } else {
      st.selected = todayKey;
    }
  } else {
    const d = parseYmd(st.selected);
    st.year = d.getFullYear();
    st.month = d.getMonth() + 1;
  }
  renderHero();
  renderStatic();
  renderDayPanel();

  const drawerRoot = byId('kDrawerRoot');
  const hoverCard = byId('kHoverCard');

  // ── 点击委托 ──
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-kd-close]')) {
      closeDrawer();
      return;
    }

    const mnav = target.closest<HTMLElement>('[data-k-mnav]');
    if (mnav && mnav.dataset.kMnav !== undefined) {
      shiftMonth(Number(mnav.dataset.kMnav));
      return;
    }

    const day = target.closest<HTMLElement>('.k-day[data-k-date]');
    if (day?.dataset.kDate) {
      selectDate(day.dataset.kDate);
      return;
    }

    const reccatClose = target.closest<HTMLElement>('[data-k-reccat-close]');
    if (reccatClose) {
      closeQuickCat(byId('kRecipeQuick'));
      return;
    }

    const kpi = target.closest<HTMLElement>('.k-kpi[data-k-hover]');
    if (kpi) {
      const raw = kpi.dataset.kHover || '';
      const label = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : '';
      if (label) {
        openDrawer({ title: label, subtitle: '本月概览说明', body: kpiPopoverHtml(label) });
        return;
      }
    }

    const reccat = target.closest<HTMLElement>('[data-k-reccat]');
    if (reccat?.dataset.kReccat) {
      toggleQuickCat(byId('kRecipeQuick'), reccat.dataset.kReccat);
      hideHoverNow();
      return;
    }

    const recipe = target.closest<HTMLElement>('[data-k-open-recipe]');
    if (recipe?.dataset.kOpenRecipe) {
      openRecipeDrawer(recipe.dataset.kOpenRecipe);
      hideHoverNow();
      return;
    }

    const dish = target.closest<HTMLElement>('[data-k-dish]');
    if (dish?.dataset.kDish) {
      openDish(dish.dataset.kDish);
      return;
    }

    const editDay = target.closest<HTMLElement>('[data-k-edit-day]');
    if (editDay?.dataset.kEditDay) {
      openDrawer({ title: editDay.dataset.kEditDay, subtitle: '维护这条做菜记录', body: editDayDrawerHtml(editDay.dataset.kEditDay) });
      return;
    }

    const pantry = target.closest<HTMLElement>('[data-k-pantry]');
    if (pantry?.dataset.kPantry) {
      openPantryDrawer(pantry.dataset.kPantry);
      return;
    }

    const pantrySave = target.closest<HTMLElement>('[data-k-pantry-save]');
    if (pantrySave?.dataset.kPantrySave) {
      applyPantrySave(pantrySave.dataset.kPantrySave);
      closeDrawer();
      renderPantry(byId('kPantry'));
      return;
    }

    const pantryDone = target.closest<HTMLElement>('[data-k-pantry-done]');
    if (pantryDone?.dataset.kPantryDone) {
      markPantryDone(pantryDone.dataset.kPantryDone);
      closeDrawer();
      renderPantry(byId('kPantry'));
      return;
    }

    const shelf = target.closest<HTMLElement>('[data-k-shelf]');
    if (shelf?.dataset.kShelf) {
      openShelfDrawer(shelf.dataset.kShelf);
      return;
    }

    const price = target.closest<HTMLElement>('[data-k-price]');
    if (price?.dataset.kPrice) {
      openPriceDrawer(price.dataset.kPrice);
      return;
    }

    const priceTab = target.closest<HTMLElement>('[data-k-price-tab]');
    if (priceTab?.dataset.kPriceTab) {
      selectPriceTab(byId('kPrices'), priceTab.dataset.kPriceTab);
      return;
    }

    // 搜索结果项
    const result = target.closest<HTMLElement>('#kSearchRes [data-kind]');
    if (result) {
      const kind = result.dataset.kind;
      const key = result.dataset.key || '';
      if (kind === 'recipe') openRecipeDrawer(key);
      else if (kind === 'dish') openDish(key);
      else if (kind === 'pantry') openPantryDrawer(key);
      else if (kind === 'price') openPriceDrawer(key);
      hideSearch();
      return;
    }

    const copy = target.closest<HTMLElement>('[data-k-copy]');
    if (copy) {
      const code = drawerRoot?.querySelector('pre code')?.textContent ?? '';
      const label = copy.dataset.kCopyLabel || '复制这段 JSON';
      navigator.clipboard?.writeText(code).then(() => {
        copy.textContent = '✓ 已复制';
        window.setTimeout(() => { copy.textContent = label; }, 1600);
      }).catch(() => undefined);
      return;
    }

    const copyRecipe = target.closest<HTMLElement>('[data-k-recipe-copy]');
    if (copyRecipe?.dataset.kRecipeCopy) {
      const md = recipeMarkdown(copyRecipe.dataset.kRecipeCopy);
      if (md) {
        navigator.clipboard?.writeText(md).then(() => {
          copyRecipe.textContent = '✓ 已复制 Markdown';
          window.setTimeout(() => { copyRecipe.textContent = '复制为 Markdown'; }, 1600);
        }).catch(() => undefined);
      }
      return;
    }

    // 点击搜索框外收起结果
    if (!target.closest('#kSearchWrap')) hideSearch();
  });

  // ── Hover / 轻量预览（所有 Hover 都有 Click/Tap 替代）──
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('#kHoverCard')) return;
    const src = target.closest<HTMLElement>('[data-k-hover]');
    const raw = src?.dataset.kHover;
    if (!raw) return;
    const sep = raw.indexOf(':');
    const kind = sep > 0 ? raw.slice(0, sep) : raw;
    const value = sep > 0 ? raw.slice(sep + 1) : '';
    let html = '';
    if (kind === 'kpi') html = kpiPopoverHtml(value);
    else if (kind === 'date' && value) html = dayHoverHtml(value);
    else if (kind === 'dish') html = dishPopoverHtml(value);
    else if (kind === 'recipe') html = recipeHoverHtml(value);
    else if (kind === 'reccat') html = categoryHoverHtml(value);
    else if (kind === 'pantry') html = pantryHoverHtml(value);
    else if (kind === 'shelf') html = shelfHoverHtml(value);
    else if (kind === 'price') html = priceHoverHtml(value);
    if (src && html) showHover(src, html);
  });

  document.addEventListener('mouseout', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-k-hover]') || target.closest('#kHoverCard')) scheduleHideHover();
  });
  window.addEventListener('scroll', hideOnScroll, true);
  hoverCard.addEventListener('mouseenter', keepHoverAlive);
  hoverCard.addEventListener('mouseleave', () => scheduleHideHover());

  // ── 键盘 ──
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawer();
      hideSearch();
      hideHoverNow();
    }
  });

  // ── 搜索框 ──
  const searchInput = byId<HTMLInputElement>('kSearch');
  const searchRes = byId('kSearchRes');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    if (q.trim()) {
      searchRes.innerHTML = buildSearchHtml(q);
      searchRes.hidden = false;
    } else {
      searchRes.hidden = true;
    }
  });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const first = searchRes.querySelector<HTMLElement>('[data-kind]');
      first?.click();
    }
  });

  // ── 亮点笔记自动保存 ──
  document.addEventListener('input', (event) => {
    const note = (event.target as HTMLElement).closest<HTMLTextAreaElement>('textarea[data-k-note]');
    if (!note) return;
    try {
      localStorage.setItem(`pig.kitchen.daynote.${note.dataset.kNote}`, note.value);
    } catch { /* ignore */ }
  });

  // ── 响应式：跨过 1280 断点时刷新右侧面板形态 ──
  const mq = window.matchMedia('(min-width: 1280px)');
  const onWidthChange = () => renderDayPanel();
  if (mq.addEventListener) mq.addEventListener('change', onWidthChange);
}

function hideSearch(): void {
  const res = document.getElementById('kSearchRes');
  if (res) res.hidden = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}
