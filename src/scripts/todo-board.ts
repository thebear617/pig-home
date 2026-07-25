import { escapeHtml, pad } from '../lib/helpers';
import type { TodoBoard, TodoItem } from '../data/todo-data';

declare global {
  interface Window {
    __TODO_BOARDS?: TodoBoard[];
  }
}

let activeTabId = 'video';
let historyOpen = false;

function dateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr(): string {
  return dateKey();
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff <= 6) return `${diff} 天前`;
  if (diff <= 13) return '1 周前';
  if (diff <= 30) return `${Math.round(diff / 7)} 周前`;
  return dateStr;
}

function escape(value: unknown): string {
  return escapeHtml(value);
}

function boards(): TodoBoard[] {
  return window.__TODO_BOARDS || [];
}

function activeBoard(): TodoBoard | undefined {
  return boards().find(b => b.id === activeTabId);
}

function allItems(): TodoItem[] {
  return activeBoard()?.items || [];
}

function todoItems(): TodoItem[] {
  const today = todayStr();
  return allItems().filter(it => {
    const status = it.status || 'todo';
    const date = it.date || today;
    return status === 'todo' && date <= today;
  });
}

function doingItems(): TodoItem[] {
  return allItems().filter(it => (it.status || 'todo') === 'doing');
}

function doneItems(): TodoItem[] {
  return allItems().filter(it => {
    const status = it.status || 'todo';
    const date = it.date || todayStr();
    return status === 'done' && date === todayStr();
  });
}

function boardStats() {
  const todo = todoItems().length;
  const doing = doingItems().length;
  const done = doneItems().length;
  const total = todo + doing + done;
  return {
    total,
    todo,
    doing,
    done,
    rate: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

interface HistoryGroup {
  boardId: string;
  boardIcon: string;
  boardName: string;
  date: string;
  items: TodoItem[];
}

function historyGroups(): HistoryGroup[] {
  const today = todayStr();
  const groups: HistoryGroup[] = [];
  boards().forEach(board => {
    const past = (board.items || []).filter(it => {
      const status = it.status || 'todo';
      const date = it.date || today;
      return status === 'done' && date < today;
    });
    if (past.length > 0) {
      const byDate: Record<string, TodoItem[]> = {};
      past.forEach(it => {
        const d = it.date || today;
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(it);
      });
      Object.keys(byDate)
        .sort((a, b) => b.localeCompare(a))
        .forEach(date => {
          groups.push({
            boardId: board.id,
            boardIcon: board.icon,
            boardName: board.name,
            date,
            items: byDate[date],
          });
        });
    }
  });
  return groups;
}

function renderCard(item: TodoItem): string {
  const titleHtml = item.url
    ? `<a href="${escape(item.url)}" target="_blank" rel="noopener" class="todo-card-link"><h3 class="todo-card-title">${escape(item.title)}</h3></a>`
    : `<h3 class="todo-card-title">${escape(item.title)}</h3>`;

  const noteHtml = item.note ? `<p class="todo-card-note">${escape(item.note)}</p>` : '';
  const metaHtml = item.createdAt ? `<div class="todo-card-meta">📅 ${escape(relativeTime(item.createdAt))}</div>` : '';

  let cls = 'todo-card';
  if (item.status === 'doing') cls += ' todo-card-doing';
  if (item.status === 'done') cls += ' todo-card-done';

  return `<article class="${cls}">${titleHtml}${noteHtml}${metaHtml}</article>`;
}

function renderTabs(): string {
  return boards()
    .map(
      board =>
        `<button type="button" class="todo-board-tab${board.id === activeTabId ? ' active' : ''}" data-tb-tab="${escape(board.id)}"><span class="todo-board-tab-icon">${escape(board.icon)}</span><span class="todo-board-tab-name">${escape(board.name)}</span></button>`
    )
    .join('');
}

function renderStats(): string {
  const stats = boardStats();
  return `<div class="todo-board-stats"><span class="todo-board-stats-text">总 ${stats.total} · 已完成 ${stats.done}</span><div class="todo-board-stats-bar"><div class="todo-board-stats-fill" style="width: ${stats.rate}%"></div></div></div>`;
}

function renderColumn(
  status: 'todo' | 'doing' | 'done',
  label: string,
  statusClass: string,
  items: TodoItem[],
  suffix: string
): string {
  let emptyText = '';
  if (status === 'todo') emptyText = '📥 暂无待办';
  else if (status === 'doing') emptyText = '🚀 暂无进行中';
  else emptyText = '✅ 等待你完成第一个任务';

  const cards = items.length > 0 ? items.map(renderCard).join('') : `<p class="todo-board-empty">${emptyText}</p>`;

  return `<div class="todo-board-column"><div class="todo-board-column-header ${statusClass}"><span class="todo-board-column-dot"></span>${label} <span class="todo-board-column-count">${items.length}${suffix}</span></div><div class="todo-board-column-body">${cards}</div></div>`;
}

function renderColumns(): string {
  const todo = todoItems();
  const doing = doingItems();
  const done = doneItems();
  const all = todo.length + doing.length + done.length;

  return `<div class="todo-board-columns">${renderColumn('todo', '待办', 'todo-status-todo', todo, '')}${renderColumn('doing', '进行中', 'todo-status-doing', doing, '')}${renderColumn('done', '已完成', 'todo-status-done', done, `/${all}`)}</div>`;
}

function renderHistory(): string {
  const groups = historyGroups();
  if (groups.length === 0) {
    return `<section class="todo-board-history" aria-label="已完成历史"><h3 class="todo-board-history-title">📜 已完成历史</h3><p class="todo-board-empty">还没有历史归档</p></section>`;
  }

  const items = groups
    .map(
      g =>
        `<div class="todo-board-history-group"><details><summary><span class="todo-board-history-date">${escape(g.date)}</span><span class="todo-board-history-meta">${escape(g.boardIcon)} ${escape(g.boardName)} · ${g.items.length} 条</span></summary><ul class="todo-board-history-list">${g.items
          .map(
            it =>
              `<li class="todo-board-history-item">${it.url ? `<a href="${escape(it.url)}" target="_blank" rel="noopener">${escape(it.title)}</a>` : escape(it.title)}</li>`
          )
          .join('')}</ul></details></div>`
    )
    .join('');

  return `<section class="todo-board-history" aria-label="已完成历史"><h3 class="todo-board-history-title">📜 已完成历史</h3>${items}</section>`;
}

function renderBoard(): string {
  const today = todayStr();
  const boardsLoaded = typeof window.__TODO_BOARDS !== 'undefined' && Array.isArray(window.__TODO_BOARDS);

  return `<header class="todo-board-header"><div class="todo-board-date"><span class="todo-board-date-icon">📅</span><span class="todo-board-date-text">${escape(today)}（今天）</span></div><button class="todo-board-history-toggle" type="button" data-tb-history>📜 查看历史 ${historyOpen ? '▴' : '▾'}</button></header>${
    boardsLoaded ? renderStats() + renderTabs() + (historyOpen ? renderHistory() : '') + renderColumns() : '<div class="todo-board-empty">看板数据未加载。请检查 todo-data.ts 是否正常编译。</div>'
  }`;
}

function refresh() {
  const container = document.getElementById('todoBoard');
  if (!container) return;
  container.innerHTML = renderBoard();
}

document.addEventListener('click', event => {
  const target = event.target as HTMLElement;

  const tabBtn = target.closest<HTMLButtonElement>('[data-tb-tab]');
  if (tabBtn) {
    activeTabId = tabBtn.dataset.tbTab || 'video';
    refresh();
    return;
  }

  const historyBtn = target.closest<HTMLButtonElement>('[data-tb-history]');
  if (historyBtn) {
    historyOpen = !historyOpen;
    refresh();
    return;
  }
});

refresh();
