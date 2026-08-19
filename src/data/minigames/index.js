// 미니판 각본.
//
// 봇의 손패와 결정적인 몇 수를 미리 못박아, 가르치려는 장면이 반드시 재현되게 한다.
// script에 적힌 수는 그 자리 차례가 되면 순서대로 소비되고, 다 떨어지면 그때부터는
// bot.js의 기본 정책이 이어받는다. 그래서 학습자가 예상 밖의 수를 둬도 판이 이어진다.

import trickBasics from './trick-basics.js';
import dragonAndDog from './dragon-and-dog.js';
import wishPressure from './wish-pressure.js';
import bombTiming from './bomb-timing.js';
import partnerPlay from './partner-play.js';

export const MINIGAMES = [trickBasics, dragonAndDog, wishPressure, bombTiming, partnerPlay];

const BY_ID = new Map(MINIGAMES.map((game) => [game.id, game]));

export function minigameById(id) {
  return BY_ID.get(id) ?? null;
}
