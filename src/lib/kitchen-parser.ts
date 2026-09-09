// 菜谱 Markdown 结构化解析（构建期运行，把 cooking-tips 正文切成 section / block）
// 现有菜谱都遵循统一模板（## 食材 | ## 做法 | ## 小贴士 …），本解析器保持容错：
// 任意 ## / ### 都成为 section；section 内识别 表格 / 有序列表 / 无序列表 / 段落。

import type { RecipeBlock, RecipeSection } from './kitchen-types';

const splitCells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(s => s.trim());

const isSeparatorRow = (cells: string[]) => cells.length > 0 && cells.every(c => /^:?-{1,}:?$/.test(c));

function blocksFromLines(lines: string[]): RecipeBlock[] {
  const content = lines
    .map(l => l.trim())
    .filter(l => l.length > 0);
  if (!content.length) return [];

  // 表格：只要出现竖线就整段按表格解析（含表头 + 分隔行）
  if (content.some(l => l.includes('|'))) {
    const cellsAll = content.map(splitCells).filter(cells => cells.length > 1);
    const rows = cellsAll.filter(cells => !isSeparatorRow(cells));
    if (!rows.length) return [];
    const [first, ...rest] = rows;
    return [{ kind: 'table', headers: first, rows: rest }] as RecipeBlock[];
  }

  const first = content[0];
  const bullet = first.match(/^[-*]\s+(.*)$/);
  if (bullet) {
    return [{
      kind: 'ul',
      items: content
        .map(l => l.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean),
    }];
  }

  const ordered = first.match(/^\d+[.、)]?\s+(.*)$/);
  if (ordered) {
    const items: string[] = [];
    for (const line of content) {
      const m = line.match(/^\d+[.、)]?\s+(.*)$/);
      items.push(m ? m[1].trim() : line);
    }
    return [{ kind: 'ol', items }];
  }

  return [{ kind: 'p', text: content.join(' ') }];
}

export function parseRecipeMarkdown(markdown: string): RecipeSection[] {
  const sections: RecipeSection[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const raw of String(markdown ?? '').split('\n')) {
    const heading = raw.match(/^#{2,4}\s+(.*)$/);
    if (heading) {
      if (current) {
        sections.push({ title: current.title, blocks: blocksFromLines(current.lines) });
      }
      current = { title: heading[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(raw);
    }
  }
  if (current) {
    sections.push({ title: current.title, blocks: blocksFromLines(current.lines) });
  }
  return sections;
}

export interface RecipeSummaryParts {
  ingredientNames: string[];
  steps: string[];
  tips: string[];
  extra: { title: string; text: string } | null;
}

/** 供 Hover Card / 摘要用的结构化抽取 */
export function summarizeRecipe(sections: RecipeSection[]): RecipeSummaryParts {
  const ingredientNames: string[] = [];
  const steps: string[] = [];
  const tips: string[] = [];
  let extra: { title: string; text: string } | null = null;

  for (const s of sections) {
    if (s.title.includes('食材')) {
      for (const b of s.blocks) {
        if (b.kind === 'table') {
          for (const row of b.rows) {
            const name = row[0]?.replace(/[（(].*$/, '').trim();
            if (name) ingredientNames.push(name);
          }
        } else if (b.kind === 'ul' || b.kind === 'ol') {
          ingredientNames.push(...b.items.map(i => i.replace(/[（(].*$/, '').trim()));
        }
      }
    } else if (s.title.includes('做法')) {
      for (const b of s.blocks) {
        if (b.kind === 'ol') steps.push(...b.items);
        else if (b.kind === 'p') steps.push(b.text);
      }
    } else if (s.title.includes('贴士')) {
      for (const b of s.blocks) {
        if (b.kind === 'ul') tips.push(...b.items);
        else if (b.kind === 'ol') tips.push(...b.items);
        else if (b.kind === 'p') tips.push(b.text);
      }
    } else if (!extra) {
      const first = s.blocks[0];
      if (first && (first.kind === 'p' || first.kind === 'ol')) {
        const text = first.kind === 'p' ? first.text : first.items[0] || '';
        if (text) extra = { title: s.title, text };
      }
    }
  }
  return { ingredientNames, steps, tips, extra };
}
