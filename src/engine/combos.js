// 카드 묶음이 어떤 조합인지 판정한다.
//
// 공식 룰에서 헷갈리기 쉬운 지점들을 여기서 못박는다.
//   - 봉황은 페어/트리플/풀하우스/계단/스트레이트에서 와일드가 되지만 폭탄에는 못 들어간다.
//   - 용은 어떤 조합에도 못 들어간다. 단일 전용.
//   - 개는 단일 전용이고 리드로만 낼 수 있다 (그 제약은 compare.js에서 본다).
//   - 스트레이트는 5장 이상이고 참새(1)이 최하단에 올 수 있다.
//   - 봉황이 대신할 수 있는 것은 자연 카드(2~A)뿐이라 1 자리는 못 메운다.
//   - 참새는 스트레이트에만 참여한다. 참새 페어 같은 건 없다.

import {
  MAHJONG_RANK, MAX_NORMAL_RANK, MIN_NORMAL_RANK, PHOENIX_LEAD_RANK,
  hasNaturalRank, isDog, isDragon, isPhoenix,
} from './cards.js';

export const COMBO = Object.freeze({
  SINGLE: 'SINGLE',
  PAIR: 'PAIR',
  TRIPLE: 'TRIPLE',
  FULLHOUSE: 'FULLHOUSE',
  STAIRS: 'STAIRS',
  STRAIGHT: 'STRAIGHT',
  BOMB_FOUR: 'BOMB_FOUR',
  BOMB_SF: 'BOMB_SF',
  DOG: 'DOG',
});

export const COMBO_LABEL = Object.freeze({
  [COMBO.SINGLE]: '싱글',
  [COMBO.PAIR]: '페어',
  [COMBO.TRIPLE]: '트리플',
  [COMBO.FULLHOUSE]: '풀하우스',
  [COMBO.STAIRS]: '연속 페어',
  [COMBO.STRAIGHT]: '스트레이트',
  [COMBO.BOMB_FOUR]: '포카드 폭탄',
  [COMBO.BOMB_SF]: '스트레이트 플러시 폭탄',
  [COMBO.DOG]: '개',
});

export function isBomb(combo) {
  return combo != null && (combo.type === COMBO.BOMB_FOUR || combo.type === COMBO.BOMB_SF);
}

function make(type, rank, cards, extra) {
  return Object.assign({ type, rank, length: cards.length, cards }, extra || {});
}

/** 랭크별로 카드를 모은다. 봉황과 개는 자연 랭크가 없어 빠지고, 참새도 빠진다. */
function groupByRank(cards) {
  const groups = new Map();
  for (const card of cards) {
    if (!hasNaturalRank(card)) continue;
    if (!groups.has(card.rank)) groups.set(card.rank, []);
    groups.get(card.rank).push(card);
  }
  return groups;
}

function isConsecutive(sortedRanks) {
  for (let i = 1; i < sortedRanks.length; i += 1) {
    if (sortedRanks[i] !== sortedRanks[i - 1] + 1) return false;
  }
  return true;
}

/**
 * 카드 묶음의 조합을 판정한다. 유효하지 않으면 null.
 *
 * 봉황이 여러 해석을 허용하면 가장 높은 랭크로 읽는다. 봉황이 무엇을
 * 대신할지는 내는 사람이 정하고, 높게 읽는 쪽이 항상 유리하기 때문이다.
 */
export function detectCombo(input) {
  const cards = Array.isArray(input) ? input.filter(Boolean) : [];
  const n = cards.length;
  if (n === 0) return null;

  // 같은 카드를 두 번 넣은 경우.
  if (new Set(cards.map((c) => c.id)).size !== n) return null;

  const phoenixCount = cards.filter(isPhoenix).length;
  if (phoenixCount > 1) return null;
  const hasPhoenix = phoenixCount === 1;

  if (cards.some(isDog)) return n === 1 ? make(COMBO.DOG, -1, cards) : null;

  const dragon = cards.find(isDragon);
  if (dragon) return n === 1 ? make(COMBO.SINGLE, dragon.rank, cards) : null;

  if (n === 1) {
    const card = cards[0];
    if (isPhoenix(card)) {
      // 리드로 낼 때의 값. 받아칠 때의 실제 값은 compare.js가 계산한다.
      return make(COMBO.SINGLE, PHOENIX_LEAD_RANK, cards, { phoenixSingle: true });
    }
    return make(COMBO.SINGLE, card.rank, cards);
  }

  const naturals = cards.filter((c) => !isPhoenix(c));
  const groups = groupByRank(naturals);

  const bomb = detectBomb(cards, hasPhoenix, groups);
  if (bomb) return bomb;

  // 참새는 랭크 그룹에 들어가지 않으므로, 자연 카드가 전부 그룹에 담겼다는 것은
  // 곧 참새가 섞이지 않았다는 뜻이다. 랭크로 묶는 조합(페어·트리플·풀하우스·계단)은
  // 참새를 쓸 수 없으니 여기서 한 번에 막는다. 스트레이트만 참새를 받아준다.
  const grouped = [...groups.values()].reduce((sum, g) => sum + g.length, 0);
  const allGrouped = grouped === naturals.length;

  if (allGrouped) {
    const byRank = detectPair(cards, naturals, hasPhoenix, groups)
      || detectTriple(cards, hasPhoenix, groups)
      || detectFullHouse(cards, hasPhoenix, groups)
      || detectStairs(cards, hasPhoenix, groups);
    if (byRank) return byRank;
  }

  return detectStraight(cards, naturals, hasPhoenix) || null;
}

// --- 폭탄 -------------------------------------------------------------

function detectBomb(cards, hasPhoenix, groups) {
  if (hasPhoenix) return null; // 봉황은 폭탄에 못 들어간다.

  if (cards.length === 4 && groups.size === 1) {
    const entry = [...groups.entries()][0];
    if (entry[1].length === 4) return make(COMBO.BOMB_FOUR, entry[0], cards);
  }

  if (cards.length >= 5) {
    const suit = cards[0].suit;
    // 참새와 용은 수트가 없으므로 여기서 자동으로 걸러진다.
    if (suit && cards.every((c) => c.suit === suit)) {
      const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
      if (isConsecutive(ranks)) return make(COMBO.BOMB_SF, ranks[ranks.length - 1], cards);
    }
  }
  return null;
}

// --- 같은 랭크 묶음 ---------------------------------------------------

function detectPair(cards, naturals, hasPhoenix, groups) {
  if (cards.length !== 2) return null;
  if (hasPhoenix) {
    const card = naturals[0];
    // 봉황은 자연 카드하고만 짝이 된다. 참새도 용도 페어를 못 만든다.
    return hasNaturalRank(card) ? make(COMBO.PAIR, card.rank, cards) : null;
  }
  const entry = groups.size === 1 ? [...groups.entries()][0] : null;
  return entry && entry[1].length === 2 ? make(COMBO.PAIR, entry[0], cards) : null;
}

function detectTriple(cards, hasPhoenix, groups) {
  if (cards.length !== 3 || groups.size !== 1) return null;
  const entry = [...groups.entries()][0];
  return entry[1].length === (hasPhoenix ? 2 : 3) ? make(COMBO.TRIPLE, entry[0], cards) : null;
}

function detectFullHouse(cards, hasPhoenix, groups) {
  if (cards.length !== 5 || groups.size !== 2) return null;
  const counts = [...groups.entries()]
    .map(([rank, group]) => ({ rank, count: group.length }))
    .sort((a, b) => b.count - a.count);

  if (!hasPhoenix) {
    return counts[0].count === 3 && counts[1].count === 2
      ? make(COMBO.FULLHOUSE, counts[0].rank, cards)
      : null;
  }

  // 봉황이 있으면 자연 카드는 4장. 3+1(봉황이 짝을 맞춤) 또는 2+2(봉황이 트리플을 만듦).
  if (counts[0].count === 3 && counts[1].count === 1) {
    return make(COMBO.FULLHOUSE, counts[0].rank, cards);
  }
  if (counts[0].count === 2 && counts[1].count === 2) {
    // 봉황은 둘 중 높은 쪽에 붙여 트리플을 만드는 게 항상 낫다.
    return make(COMBO.FULLHOUSE, Math.max(counts[0].rank, counts[1].rank), cards);
  }
  return null;
}

function detectStairs(cards, hasPhoenix, groups) {
  const n = cards.length;
  if (n < 4 || n % 2 !== 0) return null;

  const entries = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  if (entries.length !== n / 2) return null;
  if (entries.some(([, group]) => group.length > 2)) return null;
  if (!isConsecutive(entries.map(([rank]) => rank))) return null;

  // 봉황이 없으면 전부 페어여야 하고, 있으면 정확히 한 랭크만 홀로 있어야 한다.
  const singles = entries.filter(([, group]) => group.length === 1).length;
  if (singles !== (hasPhoenix ? 1 : 0)) return null;

  return make(COMBO.STAIRS, entries[entries.length - 1][0], cards);
}

// --- 스트레이트 -------------------------------------------------------

function detectStraight(cards, naturals, hasPhoenix) {
  const n = cards.length;
  if (n < 5) return null;

  const ranks = naturals.map((c) => c.rank);
  if (ranks.some((r) => r < MAHJONG_RANK || r > MAX_NORMAL_RANK)) return null;
  if (new Set(ranks).size !== ranks.length) return null; // 랭크가 겹치면 스트레이트가 아니다.

  const sorted = [...ranks].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (!hasPhoenix) {
    return isConsecutive(sorted) ? make(COMBO.STRAIGHT, max, cards) : null;
  }

  const span = max - min + 1;
  if (span === n) {
    // 안쪽에 구멍이 하나 있고 봉황이 그 자리를 메운다.
    return make(COMBO.STRAIGHT, max, cards);
  }
  if (span === n - 1) {
    // 자연 카드가 이미 연속이라 봉황은 위나 아래로 붙는다. 위쪽이 더 높으니 위를 택한다.
    if (max + 1 <= MAX_NORMAL_RANK) return make(COMBO.STRAIGHT, max + 1, cards);
    // A까지 찼으면 아래로 붙이는 수밖에 없다. 봉황은 참새(1) 자리는 못 메운다.
    if (min - 1 >= MIN_NORMAL_RANK) return make(COMBO.STRAIGHT, max, cards);
  }
  return null;
}
