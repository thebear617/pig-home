// 厨房工作台 · 菜谱：分类快捷入口 + 菜谱 Hover 卡 + 完整菜谱 Drawer

import { summarizeRecipe } from '../../lib/kitchen-parser';
import type { RecipeBlock, RecipeData, RecipeSection } from '../../lib/kitchen-types';
import { findRecipeForDish, payload } from './data';
import { topDishes } from './stats';
import { esc, openDrawer } from './ui';

/** 「菜谱大全」卡里当前展开的分类（null = 不展开），点击分类 chip 切换 */
let quickCat: string | null = null;

export function setQuickCat(cat: string | null): void {
  quickCat = cat;
}

interface CatInfo {
  cat: string;
  recipes: RecipeData[];
}

function categories(): CatInfo[] {
  const P = payload();
  const map = new Map<string, RecipeData[]>();
  for (const r of P.recipes) {
    const list = map.get(r.category) || [];
    list.push(r);
    map.set(r.category, list);
  }
  const order = new Map(P.categoryOrder.map((c, i) => [c, i]));
  return [...map.entries()]
    .sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99))
    .map(([cat, recipes]) => ({ cat, recipes }));
}

/** 每道已记录菜名 → 对应菜谱，做过的次数 */
function matchedRecipeCounts(): Map<string, number> {
  const P = payload();
  const counts = new Map<string, number>();
  for (const dish of topDishes(999)) {
    const r = findRecipeForDish(dish.name, P.recipes);
    if (r) counts.set(r.id, (counts.get(r.id) || 0) + dish.count);
  }
  return counts;
}

/** 中栏「菜谱大全」卡片 */
export function recipesQuickHtml(): string {
  const P = payload();
  const cats = categories();
  const matched = matchedRecipeCounts();

  const featured = [...matched.entries()].sort((a, b) => b[1] - a[1])[0];
  let featuredHtml = '';
  if (featured) {
    const r = P.recipes.find(x => x.id === featured[0]);
    if (r) featuredHtml = `<div class="k-feature-title">✨ 常做菜谱</div>${recipeCard(r, featured[1])}`;
  }

  const chips = cats
    .map(({ cat, recipes }) => {
      const icon = recipes[0]?.icon || '🍳';
      return `<button type="button" class="k-recipe-cat" data-k-hover="reccat:${esc(cat)}" data-k-reccat="${esc(cat)}">
        <span class="k-recipe-cat-icon">${icon}</span>
        <span class="k-recipe-cat-name">${esc(cat)}</span>
        <span class="k-recipe-cat-count">${recipes.length}</span>
      </button>`;
    })
    .join('');

  const expanded = quickCat
    ? `<div class="k-inline-recipes"><div class="k-inline-recipes-title">${esc(quickCat)} · 点任意卡片看完整做法<button type="button" class="k-link-btn k-inline-close" data-k-reccat-close>收起</button></div>
        ${recipeCategoryListHtml(quickCat)}</div>`
    : '';
  return `<div class="k-card-head"><h3 class="k-card-title">📖 菜谱大全</h3><span class="k-card-sub">${P.recipes.length} 篇</span></div>
    <div class="k-recipe-quick-body">
      ${featuredHtml}
      <div class="k-cat-grid">${chips || '<div class="k-card-empty">还没有菜谱，先写第一篇吧</div>'}</div>
      ${expanded}
    </div>`;
}

/** 点击分类 chip：在主卡内联展开/收起该分类菜谱（比跳新抽屉更轻，也保留在 dashboard 上可悬停） */
export function toggleQuickCat(el: HTMLElement, cat: string): void {
  setQuickCat(quickCat === cat ? null : cat);
  el.innerHTML = recipesQuickHtml();
}

/** 收起内联分类列表 */
export function closeQuickCat(el: HTMLElement): void {
  setQuickCat(null);
  el.innerHTML = recipesQuickHtml();
}

function recipeCard(r: RecipeData, times?: number): string {
  const timesHtml = times != null ? `<span class="k-recipe-times">做过 ${times} 次</span>` : '';
  return `
  <button type="button" class="k-recipe-card" data-k-open-recipe="${esc(r.id)}" data-k-hover="recipe:${esc(r.id)}">
    <span class="k-recipe-cover-sm" aria-hidden="true">${r.icon || '🍳'}</span>
    <span class="k-recipe-card-main">
      <b>${esc(r.title)}</b>
      <span class="k-recipe-card-sub"><i>${esc(r.category)}</i>${timesHtml}</span>
    </span>
    <span class="k-chevron">›</span>
  </button>`;
}

/** 分类 Drawer 内的菜谱清单 */
export function recipeCategoryListHtml(cat: string): string {
  const found = categories().find(c => c.cat === cat);
  const matched = matchedRecipeCounts();
  if (!found) return `<div class="k-card-empty">该分类暂无菜谱</div>`;
  const rows = found.recipes
    .map(r => recipeCard(r, matched.get(r.id) ?? 0).replace('做过 0 次', '还没做过'))
    .join('');
  return `<div class="k-rec-list">${rows}</div>`;
}

/** 完整菜谱 Drawer */
export function openRecipeDrawer(id: string): void {
  const P = payload();
  const r = P.recipes.find(x => x.id === id);
  if (!r) return;
  openDrawer({
    title: r.title,
    subtitle: [r.category, r.ware].filter(Boolean).join(' · '),
    body: recipeDetailHtml(r),
    footer: `<div class="k-drawer-actions">
      <button class="k-btn k-btn-ghost" type="button" data-k-recipe-copy="${esc(r.id)}">复制为 Markdown</button>
    </div>
    <p class="k-hint-text">菜谱维护在 <code>cooking-tips/${esc(r.id)}.md</code>。想改配料或做法，复制 Markdown 改完再粘回那篇文档，构建后这里就会更新。</p>`,
  });
}

/** 把结构化菜谱还原成可编辑的 Markdown（与 cooking-tips 模板一致，方便直接改源文件） */
export function recipeMarkdown(id: string): string {
  const P = payload();
  const r = P.recipes.find(x => x.id === id);
  if (!r) return '';
  const head = ['---', `title: "${r.title}"`, `category: "${r.category}"`, `icon: "${r.icon}"`];
  if (r.ware) head.push(`ware: "${r.ware}"`);
  head.push('---', '');
  const bodyLines: string[] = [];
  for (const s of r.sections) {
    bodyLines.push(`## ${s.title}`, '');
    for (const b of s.blocks) {
      if (b.kind === 'table') {
        bodyLines.push(`| ${b.headers.join(' | ')} |`);
        bodyLines.push(`| ${b.headers.map(() => '---').join(' | ')} |`);
        for (const row of b.rows) bodyLines.push(`| ${row.join(' | ')} |`);
        bodyLines.push('');
      } else if (b.kind === 'ol') {
        b.items.forEach((it, i) => bodyLines.push(`${i + 1}. ${it}`));
        bodyLines.push('');
      } else if (b.kind === 'ul') {
        b.items.forEach(it => bodyLines.push(`- ${it}`));
        bodyLines.push('');
      } else {
        bodyLines.push(b.text, '');
      }
    }
  }
  return head.join('\n') + bodyLines.join('\n');
}

function recipeDetailHtml(r: RecipeData): string {
  const matched = matchedRecipeCounts().get(r.id) || 0;
  const cover = `
    <div class="k-recipe-cover">
      <span class="k-recipe-cover-emoji">${r.icon || '🍳'}</span>
      <div class="k-recipe-cover-info">
        <span class="k-recipe-cover-tag">${esc(r.category)}</span>
        ${matched ? `<span class="k-recipe-cover-tag k-tag-soft">做过 ${matched} 次</span>` : ''}
        ${r.ware ? `<span class="k-recipe-cover-tag">${esc(r.ware)}</span>` : ''}
      </div>
    </div>`;
  const sections = r.sections.map(sectionHtml).join('');
  return `${cover}<div class="k-recipe-body">${sections}</div>`;
}

function sectionHtml(s: RecipeSection): string {
  const blocks = s.blocks.map(blockHtml).join('');
  return `<section class="k-recipe-section"><h4 class="k-recipe-section-title">${esc(s.title)}</h4>${blocks}</section>`;
}

function blockHtml(b: RecipeBlock): string {
  if (b.kind === 'table') {
    const head = b.headers.map(h => `<th>${esc(h)}</th>`).join('');
    const rows = b.rows.map(row => `<tr>${row.map(c => `<td>${inlineMarkup(c)}</td>`).join('')}</tr>`).join('');
    return `<div class="k-table-wrap"><table class="k-recipe-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (b.kind === 'ol') {
    return `<ol class="k-steps">${b.items.map(i => `<li>${inlineMarkup(i)}</li>`).join('')}</ol>`;
  }
  if (b.kind === 'ul') {
    return `<ul class="k-tip-list">${b.items.map(i => `<li>${inlineMarkup(i)}</li>`).join('')}</ul>`;
  }
  return `<p>${inlineMarkup(b.text)}</p>`;
}

/** 轻量内联 Markdown：只处理 **加粗** */
function inlineMarkup(text: string): string {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>');
}

/** 菜谱 Hover Card（设计稿核心交互：摘要 + 前几步做法） */
export function recipeHoverHtml(id: string): string {
  const P = payload();
  const r = P.recipes.find(x => x.id === id);
  if (!r) return '';
  const sum = summarizeRecipe(r.sections);

  const ingred = sum.ingredientNames.slice(0, 6);
  const more = sum.ingredientNames.length - ingred.length;
  const ingredHtml = sum.ingredientNames.length
    ? `<div class="k-hv-block"><div class="k-hv-label">食材</div>
       <p class="k-hv-text">${ingred.map(esc).join(' · ')}${more > 0 ? ` …（${sum.ingredientNames.length} 种）` : ''}</p></div>`
    : '';

  const stepsHtml = sum.steps.length
    ? `<div class="k-hv-block"><div class="k-hv-label">做法</div><ol class="k-hv-steps">${sum.steps.slice(0, 3).map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>`
    : sum.extra
      ? `<div class="k-hv-block"><div class="k-hv-label">${esc(sum.extra.title)}</div><p class="k-hv-text">${esc(sum.extra.text)}</p></div>`
      : '';

  const tipsHtml = sum.tips.length
    ? `<div class="k-hv-block"><div class="k-hv-label">小贴士</div><p class="k-hv-text">${esc(sum.tips[0])}</p></div>`
    : '';

  return `
    <div class="k-hv-recipe">
      <div class="k-hv-recipe-top">
        <span class="k-hv-emoji">${r.icon || '🍳'}</span>
        <div><b class="k-hv-title">${esc(r.title)}</b>
          <span class="k-hv-tags"><i>${esc(r.category)}</i>${r.ware ? `<i>${esc(r.ware)}</i>` : ''}</span>
        </div>
      </div>
      ${ingredHtml}
      ${stepsHtml}
      ${tipsHtml}
      <button class="k-link-btn k-hv-more" type="button" data-k-open-recipe="${esc(r.id)}">查看完整菜谱 →</button>
    </div>`;
}

/** 分类卡 Hover：该分类下最常做的 2–4 篇菜谱名 */
export function categoryHoverHtml(cat: string): string {
  const found = categories().find(c => c.cat === cat);
  if (!found) return '';
  const matched = matchedRecipeCounts();
  const rows = found.recipes
    .slice()
    .sort((a, b) => (matched.get(b.id) || 0) - (matched.get(a.id) || 0))
    .slice(0, 4)
    .map(r => {
      const n = matched.get(r.id) || 0;
      return `<button class="k-hv-row" type="button" data-k-open-recipe="${esc(r.id)}">
        <span>${r.icon || '🍳'} ${esc(r.title)}</span>
        <em>${n ? `做过 ${n} 次` : '还没做过'}</em>
      </button>`;
    })
    .join('');
  return `<div class="k-pop-title">${esc(cat)}</div>
    ${rows || '<p class="k-pop-line">这个分类还没有菜谱</p>'}
    <p class="k-hint-text">点分类可看全部 · 点菜谱直接打开</p>`;
}
