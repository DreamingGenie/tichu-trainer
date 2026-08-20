// 카드를 SVG로 그린다. 이미지 파일이 없으므로 배포는 파일 복사로 끝나고,
// 어떤 크기에서도 선명하다.
//
// 특수카드 4장은 그림 대신 '무슨 일을 하는 카드인지'를 나타내는 도형을 쓴다.
// 개는 파트너에게 선을 넘기는 화살표, 용은 왕관(최강), 봉황은 와일드 반짝임,
// 마작은 선을 여는 표식. 학습용 사이트에서는 예쁜 삽화보다 이쪽이 오래 남는다.

import { SPECIAL, SUIT } from '../engine/cards.js';

const SUIT_VAR = {
  [SUIT.JADE]: 'var(--suit-jade)',
  [SUIT.SWORD]: 'var(--suit-sword)',
  [SUIT.PAGODA]: 'var(--suit-pagoda)',
  [SUIT.STAR]: 'var(--suit-star)',
};

// 각 문양은 24×24 좌표계 안에 그려두고 필요한 자리에 확대해 앉힌다.
const GLYPH = {
  // 옥 — 비취 고리
  [SUIT.JADE]: '<circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="4.8"/>',

  // 검 — 날, 코등이, 손잡이
  [SUIT.SWORD]: `
    <path d="M12 1.2 L15.2 8 L15.2 16 L8.8 16 L8.8 8 Z"/>
    <rect x="4.6" y="16" width="14.8" height="2.5" rx="1.2"/>
    <rect x="10.7" y="18.5" width="2.6" height="3.6"/>
    <circle cx="12" cy="22.6" r="1.5"/>`,

  // 탑 — 3층 지붕과 기단
  [SUIT.PAGODA]: `
    <circle cx="12" cy="1.6" r="1.3"/>
    <rect x="11.4" y="2.6" width="1.2" height="2.4"/>
    <path d="M7 8.4 L17 8.4 L15 5 L9 5 Z"/>
    <path d="M5 14 L19 14 L17 10.4 L7 10.4 Z"/>
    <path d="M3 19.6 L21 19.6 L19 16 L5 16 Z"/>
    <rect x="6.6" y="19.6" width="10.8" height="2.6" rx="0.6"/>`,

  // 별 — 오각별
  [SUIT.STAR]: '<path d="M12 1 L14.7 8.28 L22.46 8.6 L16.37 13.42 L18.47 20.9 L12 16.6 L5.53 20.9 L7.63 13.42 L1.54 8.6 L9.3 8.28 Z"/>',

  // 마작 — 선을 여는 표식. 가운데 점에서 사방으로 뻗는다.
  [SPECIAL.MAHJONG]: `
    <circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="12" r="3.2"/>
    <rect x="11.1" y="0.6" width="1.8" height="3.4" rx="0.9"/>
    <rect x="11.1" y="20" width="1.8" height="3.4" rx="0.9"/>
    <rect x="0.6" y="11.1" width="3.4" height="1.8" rx="0.9"/>
    <rect x="20" y="11.1" width="3.4" height="1.8" rx="0.9"/>`,

  // 개 — 선이 맞은편 파트너에게 건너간다
  [SPECIAL.DOG]: `
    <circle cx="12" cy="21.2" r="2.6"/>
    <circle cx="12" cy="3.4" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <rect x="10.9" y="9.6" width="2.2" height="8.4" rx="1.1"/>
    <path d="M12 5.6 L15.6 10.4 L8.4 10.4 Z"/>`,

  // 봉황 — 무엇이든 대신하는 와일드
  [SPECIAL.PHOENIX]: '<path d="M12 0.8 C12.9 7.6 16.4 11.1 23.2 12 C16.4 12.9 12.9 16.4 12 23.2 C11.1 16.4 7.6 12.9 0.8 12 C7.6 11.1 11.1 7.6 12 0.8 Z"/>',

  // 용 — 가장 높은 카드. 왕관.
  [SPECIAL.DRAGON]: `
    <path d="M3.2 18.4 L4.3 7 L8.6 12.2 L12 4.6 L15.4 12.2 L19.7 7 L20.8 18.4 Z"/>
    <rect x="3.2" y="18.4" width="17.6" height="2.8" rx="0.9"/>`,
};

/** 카드가 쓸 수트 색. 카드 얼굴과 문장 속 카드 칩이 같은 값을 본다. */
export function suitColor(card) {
  return card.special ? 'var(--suit-special)' : SUIT_VAR[card.suit];
}

function glyph(card) {
  return GLYPH[card.special ?? card.suit] ?? '';
}

/** 문양을 원하는 중심에 원하는 크기로 앉힌다. */
function placeGlyph(card, cx, cy, scale) {
  const offset = 12 * scale;
  return `<g transform="translate(${cx - offset} ${cy - offset}) scale(${scale})" fill="currentColor">${glyph(card)}</g>`;
}

function pointsPill(card, cy) {
  if (card.points === 0) return '';
  const text = card.points < 0 ? `−${Math.abs(card.points)}` : `${card.points}`;
  return `
    <g class="card__points">
      <rect x="30" y="${cy - 11}" width="40" height="22" rx="11"
            fill="currentColor" fill-opacity="0.13" stroke="currentColor" stroke-opacity="0.4" stroke-width="1"/>
      <text x="50" y="${cy + 5.5}" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">${text}</text>
    </g>`;
}

function faceSvg(card) {
  const body = `<rect class="card__bg" x="1.5" y="1.5" width="97" height="137" rx="9"/>`;

  if (card.special) {
    return `
      ${body}
      ${placeGlyph(card, 50, 56, 1.9)}
      <text x="50" y="102" text-anchor="middle" font-size="19" font-weight="700" fill="currentColor">${card.name}</text>
      ${pointsPill(card, 122)}`;
  }

  return `
    ${body}
    <text x="11" y="33" font-size="29" font-weight="700" fill="currentColor">${card.label}</text>
    ${placeGlyph(card, 17, 47, 0.55)}
    ${placeGlyph(card, 50, 78, 1.55)}
    ${pointsPill(card, 120)}`;
}

/** 스크린리더가 읽을 이름. 점수 카드는 점수까지 알려준다. */
export function cardAriaLabel(card) {
  const points = card.points === 0 ? '' : `, ${card.points}점`;
  return `${card.name}${points}`;
}

/**
 * 카드 한 장의 DOM 요소.
 *
 * @param options.selectable 클릭으로 고를 수 있게 한다 (button으로 렌더링)
 * @param options.selected   고른 상태
 * @param options.muted      낼 수 없어 흐리게 보여줄 때
 * @param options.tag        카드 위에 붙일 짧은 표시 (예: '소원')
 */
export function cardElement(card, options = {}) {
  const { selectable = false, selected = false, muted = false, tag = null } = options;
  const el = document.createElement(selectable ? 'button' : 'span');

  if (selectable) {
    el.type = 'button';
    el.setAttribute('aria-pressed', String(selected));
  } else {
    el.setAttribute('role', 'img');
  }

  el.className = 'card';
  el.classList.toggle('is-selected', selected);
  el.classList.toggle('is-muted', muted);
  el.dataset.cardId = card.id;
  el.style.setProperty('--suit', suitColor(card));
  el.setAttribute('aria-label', cardAriaLabel(card));
  el.innerHTML = `<svg class="card__face" viewBox="0 0 100 140" aria-hidden="true">${faceSvg(card)}</svg>`
    + (tag ? `<span class="card__tag">${tag}</span>` : '');

  return el;
}

/** 상대 손패처럼 뒷면만 보여줄 때. */
export function cardBackElement() {
  const el = document.createElement('span');
  el.className = 'card card--back';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <svg class="card__face" viewBox="0 0 100 140">
      <rect x="1.5" y="1.5" width="97" height="137" rx="9" fill="var(--card-back)" stroke="var(--card-edge)"/>
      <g stroke="var(--card-back-line)" stroke-width="2.4" fill="none" opacity="0.85">
        <circle cx="50" cy="70" r="26"/>
        <circle cx="50" cy="70" r="14"/>
        <path d="M50 32 L50 108 M12 70 L88 70"/>
      </g>
    </svg>`;
  return el;
}

/**
 * 카드 여러 장을 한 줄로. 손패처럼 겹쳐 보이게 하려면 overlap을 켠다.
 */
export function cardRow(cards, options = {}) {
  const { overlap = false, ...cardOptions } = options;
  const row = document.createElement('div');
  row.className = overlap ? 'card-row card-row--overlap' : 'card-row';
  for (const card of cards) {
    row.append(cardElement(card, typeof cardOptions.per === 'function' ? cardOptions.per(card) : cardOptions));
  }
  return row;
}
