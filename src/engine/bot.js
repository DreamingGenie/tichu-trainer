// 미니판의 봇.
//
// 티츄를 잘 두는 AI가 목표가 아니다. 목표는 **예측 가능하고 상식적인** 봇이다.
// 학습자가 예상 밖의 수를 둬도 판이 무너지지 않을 만큼은 유연하되, 같은 상황에서는
// 항상 같은 선택을 해야 시나리오가 가르치려던 장면이 재현된다.
//
// 규칙은 네 줄로 요약된다.
//   1. 소원이 걸리면 그것부터 지킨다.
//   2. 파트너가 트릭을 잡고 있으면 덮지 않는다.
//   3. 폭탄과 용은 점수가 걸렸을 때만 쓴다.
//   4. 그 외에는 가장 낮은 수를 낸다. 같은 높이면 장수가 많은 쪽을 낸다.

import { isDog, isDragon, sumPoints } from './cards.js';
import { isBomb } from './combos.js';
import { enumerateLegalPlays } from './legal.js';
import { arePartners } from './seats.js';
import { comboFulfillsWish } from './wish.js';

const BOMB_WORTH_IT = 15;   // 이만큼 쌓여야 폭탄을 터뜨린다
const DRAGON_WORTH_IT = 10; // 이만큼 쌓여야 용을 쓴다

function sortKey(combo) {
  return [combo.rank, -combo.length];
}

function lowest(plays) {
  return [...plays].sort((a, b) => {
    const [ar, al] = sortKey(a);
    const [br, bl] = sortKey(b);
    return ar - br || al - bl;
  })[0];
}

/**
 * 봇의 한 수를 고른다.
 * @returns {{action:'play', cards:object[]} | {action:'pass'}}
 */
export function chooseBotMove(state, seat) {
  const hand = state.hands[seat];
  if (!hand.length) return { action: 'pass' };

  const current = state.current;
  const leading = !current;
  let plays = enumerateLegalPlays(hand, current);

  // 1. 소원이 강제되면 선택지가 그것뿐이다.
  if (state.wish) {
    const fulfilling = plays.filter((play) => comboFulfillsWish(play, state.wish));
    if (fulfilling.length) {
      return { action: 'play', cards: lowest(fulfilling).cards };
    }
  }

  if (!plays.length) return { action: 'pass' };

  // 2. 파트너가 잡고 있으면 굳이 덮지 않는다.
  if (!leading && state.currentOwner && arePartners(seat, state.currentOwner)) {
    return { action: 'pass' };
  }

  const trickPoints = sumPoints(state.pile);

  // 3. 값비싼 카드는 값어치가 있을 때만.
  const withoutBombs = plays.filter((play) => !isBomb(play));
  if (withoutBombs.length && trickPoints < BOMB_WORTH_IT) plays = withoutBombs;

  const withoutDragon = plays.filter((play) => !play.cards.some(isDragon));
  if (withoutDragon.length && trickPoints < DRAGON_WORTH_IT) plays = withoutDragon;

  // 개는 선을 넘기는 카드라 아무 때나 내면 이상하다. 달리 낼 게 없을 때만.
  const withoutDog = plays.filter((play) => !play.cards.some(isDog));
  if (withoutDog.length) plays = withoutDog;

  if (!plays.length) return { action: 'pass' };

  // 4. 리드가 아니면 굳이 이기지 않아도 된다 — 낮은 트릭은 흘려보낸다.
  if (!leading && trickPoints <= 0 && lowest(plays).rank >= 13) {
    return { action: 'pass' };
  }

  return { action: 'play', cards: lowest(plays).cards };
}
