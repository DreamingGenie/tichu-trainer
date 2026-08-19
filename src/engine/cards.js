// 티츄 덱 정의와 카드 표기법.
//
// 표기법: 수트 한 글자 + 랭크. 데이터 파일에서 손패를 문자열로 적기 위한 것.
//   G=옥(초록) B=검(검정) U=탑(파랑) R=별(빨강)
//   랭크는 2~10, J, Q, K, A
//   특수카드는 MAH(마작) DOG(개) PHX(봉황) DRG(용)
//   예: 'G5 B5 UK RA MAH'

export const SUIT = Object.freeze({
  JADE: 'jade',
  SWORD: 'sword',
  PAGODA: 'pagoda',
  STAR: 'star',
});

export const SPECIAL = Object.freeze({
  MAHJONG: 'mahjong',
  DOG: 'dog',
  PHOENIX: 'phoenix',
  DRAGON: 'dragon',
});

export const SUIT_ORDER = [SUIT.JADE, SUIT.SWORD, SUIT.PAGODA, SUIT.STAR];

export const SUIT_LABEL = Object.freeze({
  [SUIT.JADE]: '옥',
  [SUIT.SWORD]: '검',
  [SUIT.PAGODA]: '탑',
  [SUIT.STAR]: '별',
});

const SUIT_BY_LETTER = Object.freeze({
  G: SUIT.JADE,
  B: SUIT.SWORD,
  U: SUIT.PAGODA,
  R: SUIT.STAR,
});

const LETTER_BY_SUIT = Object.freeze({
  [SUIT.JADE]: 'G',
  [SUIT.SWORD]: 'B',
  [SUIT.PAGODA]: 'U',
  [SUIT.STAR]: 'R',
});

// 마작은 랭크 1로 스트레이트 최하단에 들어갈 수 있다. 용은 15로 모든 단일을 이긴다.
// 봉황과 개는 고정 랭크가 없어 0으로 두고 조합 판정에서 따로 다룬다.
export const MAHJONG_RANK = 1;
export const DRAGON_RANK = 15;
export const MIN_NORMAL_RANK = 2;
export const MAX_NORMAL_RANK = 14;

// 봉황을 단일로 리드했을 때의 값. 이후에는 '직전 단일 + 0.5'가 된다.
export const PHOENIX_LEAD_RANK = 1.5;

const RANK_LABEL = Object.freeze({
  1: '1', 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '용',
});

/** 랭크의 화면 표기 ('K', '10', 'A' ...). */
export function rankLabel(rank) {
  return RANK_LABEL[rank] ?? String(rank);
}

/** 카드 한 장의 점수. 5=5점, 10=10점, K=10점, 용=+25, 봉황=-25, 나머지 0. */
function pointsFor(rank, special) {
  if (special === SPECIAL.DRAGON) return 25;
  if (special === SPECIAL.PHOENIX) return -25;
  if (rank === 5) return 5;
  if (rank === 10 || rank === 13) return 10;
  return 0;
}

function makeNormal(suit, rank) {
  return Object.freeze({
    id: `${LETTER_BY_SUIT[suit]}${rankLabel(rank)}`,
    suit,
    rank,
    special: null,
    points: pointsFor(rank, null),
    label: rankLabel(rank),
    name: `${SUIT_LABEL[suit]} ${rankLabel(rank)}`,
  });
}

const SPECIAL_CARDS = Object.freeze({
  MAH: Object.freeze({
    id: 'MAH', suit: null, rank: MAHJONG_RANK, special: SPECIAL.MAHJONG,
    points: 0, label: '1', name: '마작',
  }),
  DOG: Object.freeze({
    id: 'DOG', suit: null, rank: 0, special: SPECIAL.DOG,
    points: 0, label: '개', name: '개',
  }),
  PHX: Object.freeze({
    id: 'PHX', suit: null, rank: 0, special: SPECIAL.PHOENIX,
    points: -25, label: '봉', name: '봉황',
  }),
  DRG: Object.freeze({
    id: 'DRG', suit: null, rank: DRAGON_RANK, special: SPECIAL.DRAGON,
    points: 25, label: '용', name: '용',
  }),
});

/** 56장 전체 덱. 매번 같은 순서로 만들어진다. */
export function createDeck() {
  const deck = [];
  for (const suit of SUIT_ORDER) {
    for (let rank = MIN_NORMAL_RANK; rank <= MAX_NORMAL_RANK; rank += 1) {
      deck.push(makeNormal(suit, rank));
    }
  }
  deck.push(SPECIAL_CARDS.MAH, SPECIAL_CARDS.DOG, SPECIAL_CARDS.PHX, SPECIAL_CARDS.DRG);
  return deck;
}

const DECK_BY_ID = new Map(createDeck().map((card) => [card.id, card]));

/** 'GK', 'B10', 'PHX' 같은 표기 한 개를 카드 객체로. */
export function parseCard(token) {
  const key = String(token).trim().toUpperCase();
  const card = DECK_BY_ID.get(key);
  if (!card) throw new Error(`알 수 없는 카드 표기: "${token}"`);
  return card;
}

/**
 * 'G5 B5 UK PHX' 또는 ['G5','B5'] 를 카드 배열로.
 * 배열 안에 이미 카드 객체가 있으면 그대로 통과시킨다.
 */
export function parseHand(input) {
  const tokens = Array.isArray(input)
    ? input
    : String(input).split(/[\s,]+/).filter(Boolean);
  return tokens.map((t) => (typeof t === 'string' ? parseCard(t) : t));
}

export function isPhoenix(card) {
  return card.special === SPECIAL.PHOENIX;
}

export function isDragon(card) {
  return card.special === SPECIAL.DRAGON;
}

export function isDog(card) {
  return card.special === SPECIAL.DOG;
}

/** 조합에 자연 카드로 참여할 수 있는가 (봉황·개·용은 불가, 마작은 스트레이트에서만). */
export function hasNaturalRank(card) {
  return card.rank >= MIN_NORMAL_RANK && card.rank <= MAX_NORMAL_RANK;
}

/** 카드 묶음의 점수 합. */
export function sumPoints(cards) {
  return cards.reduce((total, card) => total + card.points, 0);
}

/** 손패 정렬: 랭크 오름차순, 같은 랭크는 수트 순. 특수카드는 양 끝으로. */
export function sortCards(cards) {
  return [...cards].sort((a, b) => {
    const ra = a.special === SPECIAL.PHOENIX ? PHOENIX_LEAD_RANK : a.rank;
    const rb = b.special === SPECIAL.PHOENIX ? PHOENIX_LEAD_RANK : b.rank;
    if (ra !== rb) return ra - rb;
    return SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
  });
}
