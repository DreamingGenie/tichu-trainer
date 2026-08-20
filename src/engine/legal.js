// 손패에서 낼 수 있는 수를 전부 찾아낸다.
//
// 봇의 수 선택, "지금 낼 수 있는 카드" 하이라이트, 참새 소원의 강제 여부 판정이
// 모두 이 함수 하나를 공유한다. 세 곳의 판정이 어긋나면 학습자가 혼란스러우므로
// 영리한 지름길보다 전수 탐색을 택했다. 14장이면 부분집합이 16384개뿐이라
// 브라우저에서 충분히 빠르고, 무엇보다 규칙과 1:1로 대응해 틀릴 여지가 없다.

import { detectCombo, isBomb } from './combos.js';
import { checkPlay } from './compare.js';

const cache = new Map();
const CACHE_LIMIT = 200;

function cacheKey(hand, current) {
  const handKey = hand.map((c) => c.id).sort().join(',');
  const currentKey = current ? `${current.type}:${current.rank}:${current.length}` : '-';
  return `${handKey}|${currentKey}`;
}

/** 크기 k인 부분집합을 모두 훑는다. */
function forEachSubsetOfSize(cards, k, visit) {
  const n = cards.length;
  if (k > n) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  for (;;) {
    visit(idx.map((i) => cards[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i -= 1;
    if (i < 0) return;
    idx[i] += 1;
    for (let j = i + 1; j < k; j += 1) idx[j] = idx[j - 1] + 1;
  }
}

/**
 * 손패에서 current를 이길 수 있는 모든 조합을 찾는다.
 * current가 null이면 리드이므로 손패로 만들 수 있는 모든 유효 조합이 나온다.
 *
 * 폭탄은 종류·장수 제약을 받지 않으므로 항상 후보에 포함된다.
 */
export function enumerateLegalPlays(hand, current = null) {
  const key = cacheKey(hand, current);
  const hit = cache.get(key);
  if (hit) return hit;

  const found = [];
  const seen = new Set();

  const consider = (cards) => {
    const combo = detectCombo(cards);
    if (!combo) return;
    if (!checkPlay(combo, current).ok) return;
    const id = cards.map((c) => c.id).sort().join(',');
    if (seen.has(id)) return;
    seen.add(id);
    found.push(combo);
  };

  if (!current) {
    // 리드는 모든 크기가 가능하다.
    for (let k = 1; k <= hand.length; k += 1) forEachSubsetOfSize(hand, k, consider);
  } else {
    // 받아칠 때는 같은 장수만 가능하고, 거기에 폭탄이 더해진다.
    if (!isBomb(current)) forEachSubsetOfSize(hand, current.length, consider);
    forEachSubsetOfSize(hand, 4, consider);            // 포카드 폭탄
    for (let k = 5; k <= hand.length; k += 1) {        // 스트레이트 플러시 폭탄
      forEachSubsetOfSize(hand, k, consider);
    }
  }

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, found);
  return found;
}

/** 어떤 카드라도 낼 수 있는 수에 포함되는 카드들의 id 집합. UI 하이라이트용. */
export function playableCardIds(hand, current) {
  const ids = new Set();
  for (const combo of enumerateLegalPlays(hand, current)) {
    for (const card of combo.cards) ids.add(card.id);
  }
  return ids;
}

