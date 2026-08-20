// 레슨 본문을 선언형 블록으로 받아 DOM으로 그린다.
// 콘텐츠(data/lessons/*)와 렌더링을 갈라놔야 글을 고칠 때 코드를 건드리지 않는다.

import { parseHand } from '../../engine/cards.js';
import { cardElement } from '../../ui/card-view.js';
import { renderDemo } from './demos/index.js';
import { htmlElement as el, inline, noteElement } from '../../ui/markup.js';

const RENDERERS = {
  p: (block) => el('p', block.muted ? 'muted' : null, inline(block.text)),

  // 레슨 제목이 h1 이므로 본문 절은 h2 다. h3 으로 두면 계층이 한 단계 건너뛴다.
  h: (block) => el('h2', null, inline(block.text)),

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
      // 머리글도 그 열의 정렬을 따라가야 한다. 숫자는 오른쪽인데 머리글만 왼쪽이면
      // 어느 머리글이 어느 열인지 눈으로 잇기가 어렵다.
      block.head.forEach((cell, i) => {
        tr.append(el('th', block.numeric?.includes(i) ? 'num' : null, inline(cell)));
      });
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

/**
 * 블록 배열을 절 단위로 끊어 본문을 만든다.
 *
 * 절마다 첫 'cards' 블록은 본문에 그리지 않고 spotlight 로 빼낸다 — 레슨 화면이
 * 그걸 옆의 펠트 판에 올려서, 읽고 있는 형태가 늘 테이블 위에 깔려 있게 한다.
 * 캡션은 그 절의 설명 문장이므로 본문에 남는다.
 *
 * @returns {{ body: HTMLElement, spotlights: Array<{index: number, hand: string}> }}
 */
export function renderBlocks(blocks) {
  const body = el('div', 'stack stack--loose');
  const spotlights = [];

  let section = null;
  const openSection = () => {
    section = el('section', 'lesson-section stack');
    body.append(section);
    return section;
  };

  for (const block of blocks) {
    if (block.kind === 'h') {
      openSection().append(RENDERERS.h(block));
      continue;
    }
    if (!section) openSection();

    // 절의 첫 카드 묶음만 판으로 올라간다. 두 번째부터는 본문에 그대로 둔다 —
    // 판은 한 번에 하나만 보여줄 수 있기 때문이다.
    if (block.kind === 'cards' && !section.dataset.spot) {
      const index = spotlights.length;
      spotlights.push({ index, hand: block.hand });
      section.dataset.spot = String(index);
      if (block.caption) section.append(el('p', null, inline(block.caption)));
      continue;
    }

    const render = RENDERERS[block.kind];
    if (!render) {
      console.warn(`알 수 없는 블록 종류: ${block.kind}`);
      continue;
    }
    section.append(render(block));
  }

  return { body, spotlights };
}
