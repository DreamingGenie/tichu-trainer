// 레슨 본문을 선언형 블록으로 받아 DOM으로 그린다.
// 콘텐츠(data/lessons/*)와 렌더링을 갈라놔야 글을 고칠 때 코드를 건드리지 않는다.

import { parseHand } from '../../engine/cards.js';
import { cardElement } from '../../ui/card-view.js';
import { renderDemo } from './demos/index.js';
import { htmlElement as el, inline, noteElement } from '../../ui/markup.js';

const RENDERERS = {
  p: (block) => el('p', block.muted ? 'muted' : null, inline(block.text)),

  h: (block) => el('h3', null, inline(block.text)),

  list: (block) => {
    const list = el(block.ordered ? 'ol' : 'ul');
    for (const item of block.items) list.append(el('li', null, inline(item)));
    return list;
  },

  note: (block) => {
    const tone = block.tone && block.tone !== 'info' ? ` note--${block.tone}` : '';
    return noteElement(`note${tone}`, block.title, inline(block.text));
  },

  cards: (block) => {
    const figure = el('figure', 'block-cards');
    const row = el('div', 'card-row');
    for (const card of parseHand(block.hand)) {
      row.append(cardElement(card, { tag: block.tags?.[card.id] }));
    }
    figure.append(row);
    if (block.caption) figure.append(el('figcaption', 'small muted', inline(block.caption)));
    return figure;
  },

  // 되는 예와 안 되는 예를 나란히. 규칙 설명에서 가장 잘 먹히는 형태다.
  examples: (block) => {
    const wrap = el('div', 'examples');
    for (const item of block.items) {
      const card = el('div', `example ${item.ok ? 'is-ok' : 'is-bad'}`);
      const head = el('div', 'example__head');
      head.append(el('span', 'example__mark', item.ok ? '○' : '✕'));
      head.append(el('span', 'example__label', inline(item.label)));
      card.append(head);

      const row = el('div', 'card-row');
      for (const c of parseHand(item.hand)) row.append(cardElement(c));
      card.append(row);

      if (item.why) card.append(el('p', 'small muted', inline(item.why)));
      wrap.append(card);
    }
    return wrap;
  },

  table: (block) => {
    const wrap = el('div', 'table-wrap');
    const table = el('table', 'data');
    if (block.head) {
      const thead = el('thead');
      const tr = el('tr');
      for (const cell of block.head) tr.append(el('th', null, inline(cell)));
      thead.append(tr);
      table.append(thead);
    }
    const tbody = el('tbody');
    for (const row of block.rows) {
      const tr = el('tr');
      row.forEach((cell, i) => {
        const isNum = block.numeric?.includes(i);
        tr.append(el('td', isNum ? 'num' : null, inline(cell)));
      });
      tbody.append(tr);
    }
    table.append(tbody);
    wrap.append(table);
    return wrap;
  },

  demo: (block) => renderDemo(block.id, block),
};

/** 블록 배열을 하나의 섹션으로. */
export function renderBlocks(blocks) {
  const wrap = el('div', 'stack');
  for (const block of blocks) {
    const render = RENDERERS[block.kind];
    if (!render) {
      console.warn(`알 수 없는 블록 종류: ${block.kind}`);
      continue;
    }
    wrap.append(render(block));
  }
  return wrap;
}
