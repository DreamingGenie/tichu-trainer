// 카드를 SVG로 그린다. 숫자카드는 수트 문양을 벡터로 그려 어떤 크기에서도 선명하고,
// 특수카드 4장만 assets/cards/*.webp 삽화를 카드 전면에 깐다.
//
// 삽화 경로는 import.meta.url 기준으로 잡는다. tests/cards.html 처럼 문서 깊이가
// 다른 페이지에서 불러도 경로가 어긋나지 않게 하기 위해서다.

import { SPECIAL, SUIT } from '../engine/cards.js';

const SUIT_VAR = {
  [SUIT.JADE]: 'var(--suit-jade)',
  [SUIT.SWORD]: 'var(--suit-sword)',
  [SUIT.PAGODA]: 'var(--suit-pagoda)',
  [SUIT.STAR]: 'var(--suit-star)',
};

/** 본문 속 카드 칩처럼 페이지 배경 위에 놓일 때의 수트 색. 테마를 따라간다. */
export function suitColor(card) {
  return card.special ? 'var(--suit-special)' : SUIT_VAR[card.suit];
}

/** 카드 면에 인쇄되는 수트 색. 카드는 두 테마 모두 밝으므로 진한 쪽으로 고정한다. */
function suitInk(card) {
  return card.special ? 'var(--suit-ink-special)' : `var(--suit-ink-${card.suit})`;
}

/** 특수카드 삽화. SPECIAL 값이 곧 파일 이름이다. */
function artUrl(special) {
  return new URL(`../../assets/cards/${special}.webp`, import.meta.url).href;
}

// clipPath 는 문서 전역에서 id 로 참조되므로 카드마다 다른 이름이 필요하다.
let clipSeq = 0;

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
};

function glyph(card) {
  return GLYPH[card.special ?? card.suit] ?? '';
}

/** 문양을 원하는 중심에 원하는 크기로 앉힌다. */
function placeGlyph(card, cx, cy, scale) {
  const offset = 12 * scale;
  return `<g transform="translate(${cx - offset} ${cy - offset}) scale(${scale})" fill="currentColor">${glyph(card)}</g>`;
}

/** 점수 표시. 숫자를 가리지 않게 아래쪽 모서리에 작게 둔다. */
function pointsMark(card) {
  if (card.points === 0) return '';
  const text = card.points < 0 ? `−${Math.abs(card.points)}` : `${card.points}`;
  return `
    <g class="card__points">
      <rect x="62" y="118" width="30" height="16" rx="8"
            fill="currentColor" fill-opacity="0.12"/>
      <text x="77" y="129.5" text-anchor="middle" font-size="11" font-weight="700"
            fill="currentColor" fill-opacity="0.85">${text}</text>
    </g>`;
}

/**
 * 특수카드. 삽화가 카드를 가득 채우고, 이름은 아래쪽 반투명 띠 위에 얹는다.
 * 점수는 삽화를 가리지 않도록 오른쪽 위 모서리로 뺀다.
 */
function specialFaceSvg(card) {
  const clip = `cardclip-${clipSeq += 1}`;
  const points = card.points === 0 ? '' : `
    <g class="card__points">
      <rect x="62" y="6" width="32" height="19" rx="9.5" fill="var(--card-face)" fill-opacity="0.86"/>
      <text x="78" y="19.5" text-anchor="middle" font-size="13" font-weight="700"
            fill="${card.points < 0 ? 'var(--suit-ink-star)' : 'var(--card-ink)'}">${card.points < 0 ? `−${Math.abs(card.points)}` : card.points}</text>
    </g>`;

  return `
    <defs>
      <clipPath id="${clip}"><rect x="1.5" y="1.5" width="97" height="137" rx="9"/></clipPath>
    </defs>
    <g clip-path="url(#${clip})">
      <rect x="1.5" y="1.5" width="97" height="137" fill="var(--card-face)"/>
      <image href="${artUrl(card.special)}" x="1.5" y="1.5" width="97" height="137"
             preserveAspectRatio="xMidYMid slice"/>
      <rect x="1.5" y="112" width="97" height="26.5" fill="var(--card-face)" fill-opacity="0.88"/>
      ${points}
    </g>
    <text x="50" y="130" text-anchor="middle" font-size="17" font-weight="700"
          fill="var(--card-ink)">${card.name}</text>
    <rect x="1.5" y="1.5" width="97" height="137" rx="9"
          fill="none" stroke="var(--card-edge)" stroke-width="1.5"/>`;
}

/**
 * 숫자카드. 수트 색 테두리 + 위쪽에 작은 문양 + 큰 숫자 하나.
 * 겹쳐 놓거나 작게 줄여도 무엇인지 바로 읽히는 게 이 배치의 목적이다.
 */
function faceSvg(card) {
  if (card.special) return specialFaceSvg(card);

  // 두 글자('10')는 카드 폭에 맞춰 조금 좁힌다.
  const wide = card.label.length > 1;

  return `
    <rect class="card__bg" x="1.5" y="1.5" width="97" height="137" rx="9"/>
    <rect class="card__rim" x="3" y="3" width="94" height="134" rx="7.5"/>
    ${placeGlyph(card, 50, 40, 1.0)}
    <text x="50" y="104" text-anchor="middle" font-size="${wide ? 46 : 52}"
          font-weight="700" fill="currentColor"
          ${wide ? 'textLength="62" lengthAdjust="spacingAndGlyphs"' : ''}>${card.label}</text>
    ${pointsMark(card)}`;
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
  el.style.setProperty('--suit', suitInk(card));
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
      <rect x="0.75" y="0.75" width="98.5" height="138.5" rx="9" fill="var(--card-back-line)"/>
      <rect x="4" y="4" width="92" height="132" rx="6.5" fill="var(--card-back)"/>
      <g stroke="var(--card-back-line)" fill="none" opacity="0.9">
        <rect x="8.5" y="8.5" width="83" height="123" rx="4" stroke-width="1"/>
        <circle cx="50" cy="70" r="24" stroke-width="1.6"/>
        <circle cx="50" cy="70" r="16" stroke-width="1"/>
        <circle cx="50" cy="70" r="6.5" stroke-width="1.6"/>
        <path stroke-width="1.3" d="M50 46 L50 30 M50 94 L50 110 M26 70 L14 70 M74 70 L86 70"/>
        <path stroke-width="1.1" d="M33 53 L22 42 M67 53 L78 42 M33 87 L22 98 M67 87 L78 98"/>
      </g>
      <g fill="var(--card-back-line)" opacity="0.9">
        <circle cx="50" cy="70" r="2.6"/>
        <circle cx="50" cy="26" r="2"/><circle cx="50" cy="114" r="2"/>
        <circle cx="10" cy="70" r="2"/><circle cx="90" cy="70" r="2"/>
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
