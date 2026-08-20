// 콘텐츠 안의 최소 문법을 HTML 로 바꾼다.
//
// 레슨·퀴즈·미니판이 전부 같은 표기를 쓰기 때문에 어느 화면에도 속하지 않는다.
// 여기서 나온 문자열은 innerHTML 로 들어가므로, 만드는 쪽에서 반드시 이스케이프한다.

import { parseCard } from '../engine/cards.js';
import { suitColor } from './card-view.js';

function escapeHtml(text) {
  return String(text).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/**
 * 본문에서 쓰는 최소 문법.
 *   **굵게**      강조
 *   `코드`        용어
 *   [[GK]]        카드 이름을 수트 색으로 (예: 옥 K)
 */
export function inline(text) {
  return escapeHtml(text)
    .replace(/\[\[([A-Z0-9]+)\]\]/g, (whole, token) => {
      try {
        const card = parseCard(token);
        return `<span class="card-chip" style="--suit:${suitColor(card)}">${escapeHtml(card.name)}</span>`;
      } catch {
        return whole;
      }
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

/**
 * 마크업을 담은 요소. inline() 을 거친 문자열을 넣는 자리라
 * element() 와 달리 innerHTML 로 들어간다.
 */
export function htmlElement(tag, className, markup) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (markup != null) node.innerHTML = markup;
  return node;
}

/** 제목이 붙은 안내 상자. 레슨·미니판이 같은 모양을 쓴다. */
export function noteElement(className, title, markup) {
  const node = htmlElement('div', className);
  if (title) node.append(htmlElement('strong', 'note__title', inline(title)));
  node.append(htmlElement('span', null, markup));
  return node;
}
