// 참새의 소원.
//
// 참새을 낸 사람은 랭크 하나(2~A)를 소원할 수 있고, 그 소원은 해당 랭크가
// 실제로 나올 때까지 살아있다. 규칙 자체보다 "언제 강제되는가"가 헷갈리는데,
// 정리하면 이렇다.
//   - 자기 차례에 그 랭크를 포함하는 합법 수가 하나라도 있으면 반드시 그중 하나를 낸다.
//   - 하나도 없으면 자유롭게 내거나 패스한다.
//   - 봉황은 소원을 이행하지 못한다. 어떤 랭크도 대신할 수 없다.
//   - 턴 밖에서 터뜨리는 폭탄은 소원 의무를 면제받는다. 대신 다음 자기 차례에 이행해야 한다.

import { MAX_NORMAL_RANK, MIN_NORMAL_RANK, rankLabel } from './cards.js';
import { enumerateLegalPlays } from './legal.js';

export function isWishableRank(rank) {
  return Number.isInteger(rank) && rank >= MIN_NORMAL_RANK && rank <= MAX_NORMAL_RANK;
}

/** 이 카드가 소원 랭크를 이행하는가. 수트가 있는 자연 카드만 인정된다. */
export function fulfillsWish(card, wishRank) {
  return card.suit !== null && card.rank === wishRank;
}

export function comboFulfillsWish(combo, wishRank) {
  return combo.cards.some((card) => fulfillsWish(card, wishRank));
}

/**
 * 지금 이 사람에게 소원이 강제되는지, 강제된다면 어떤 수들이 가능한지.
 *
 * @returns {{active: boolean, forced: boolean, plays: object[]}}
 *   forced가 true면 plays 안에서만 골라야 한다.
 *   active하지만 forced가 아니면 소원은 살아있으나 이번 차례에는 자유다.
 */
export function wishStatus(hand, current, wishRank) {
  if (!isWishableRank(wishRank)) return { active: false, forced: false, plays: [] };

  const plays = enumerateLegalPlays(hand, current).filter((combo) => comboFulfillsWish(combo, wishRank));
  return { active: true, forced: plays.length > 0, plays };
}

/**
 * 고른 수가 소원 규칙을 어기지 않는지 검사한다.
 *
 * @param options.outOfTurnBomb 턴 밖 폭탄이면 true. 이 경우 의무가 면제된다.
 */
export function checkWish(hand, current, wishRank, chosen, options = {}) {
  if (!isWishableRank(wishRank)) return { ok: true };
  if (options.outOfTurnBomb) return { ok: true };

  const status = wishStatus(hand, current, wishRank);
  if (!status.forced) return { ok: true };
  if (chosen && comboFulfillsWish(chosen, wishRank)) return { ok: true };

  return {
    ok: false,
    reason: 'WISH_UNFULFILLED',
    message: `소원이 ${rankLabel(wishRank)}로 걸려 있어요. ${rankLabel(wishRank)}를 포함해서 낼 수 있는 수가 있으면 반드시 그걸 내야 합니다.`,
    plays: status.plays,
  };
}

/** 소원이 걸린 상태에서 패스해도 되는가. 이행 가능한 수가 있으면 패스도 못 한다. */
export function canPass(hand, current, wishRank) {
  if (!current) return false; // 리드는 패스할 수 없다.
  return !wishStatus(hand, current, wishRank).forced;
}
