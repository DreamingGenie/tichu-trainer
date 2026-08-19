// 라운드 점수 계산.
//
// 계산 과정을 lines 배열로 남긴다. 9챕터에서 "점수가 왜 이렇게 나왔는지"를
// 한 줄씩 따라가며 보여주기 위한 것이고, 결과만 던지는 것보다 훨씬 잘 이해된다.

import { sumPoints } from './cards.js';
import { SEAT_LABEL, SEAT_ORDER, TEAM, arePartners, opponentsOf, teamOf } from './seats.js';

export const WINNING_SCORE = 1000;
export const DOUBLE_VICTORY_POINTS = 200;

export const CALL = Object.freeze({ TICHU: 'tichu', GRAND: 'grand' });

export const CALL_LABEL = Object.freeze({
  [CALL.TICHU]: '티츄',
  [CALL.GRAND]: '그랜드 티츄',
});

const CALL_VALUE = Object.freeze({ [CALL.TICHU]: 100, [CALL.GRAND]: 200 });

/**
 * 한 라운드의 점수를 낸다.
 *
 * @param round.tricks      {seat: 카드배열} 각 자리가 트릭으로 딴 카드들
 * @param round.finishOrder 손패를 턴 순서대로 나열한 자리 배열
 * @param round.hands       {seat: 카드배열} 라운드 종료 시점의 남은 손패 (보통 꼴찌만 있다)
 * @param round.calls       {seat: 'tichu'|'grand'|null} 선언
 */
export function scoreRound(round) {
  const tricks = round.tricks || {};
  const hands = round.hands || {};
  const calls = round.calls || {};
  const finishOrder = round.finishOrder || [];

  const lines = [];
  const totals = { [TEAM.US]: 0, [TEAM.THEM]: 0 };
  const add = (team, points, label) => {
    totals[team] += points;
    lines.push({ team, points, label });
  };

  const first = finishOrder[0];
  const second = finishOrder[1];
  const doubleVictory = first && second && arePartners(first, second) ? teamOf(first) : null;

  if (doubleVictory) {
    add(doubleVictory, DOUBLE_VICTORY_POINTS,
      `원투 피니시 — ${SEAT_LABEL[first]}와 ${SEAT_LABEL[second]}가 1·2등, 카드 점수는 세지 않습니다`);
  } else {
    const last = SEAT_ORDER.find((seat) => !finishOrder.includes(seat)) || finishOrder[3];

    for (const seat of SEAT_ORDER) {
      const won = tricks[seat] || [];
      if (!won.length) continue;
      // 꼴찌가 딴 트릭은 1등에게 넘어간다.
      const to = seat === last ? teamOf(first) : teamOf(seat);
      const points = sumPoints(won);
      const note = seat === last
        ? `${SEAT_LABEL[seat]}가 딴 트릭 ${points}점 → 1등 ${SEAT_LABEL[first]}에게`
        : `${SEAT_LABEL[seat]}가 딴 트릭 ${points}점`;
      add(to, points, note);
    }

    // 꼴찌의 남은 손패는 상대 팀 점수가 된다.
    const leftover = hands[last] || [];
    if (leftover.length) {
      const to = teamOf(opponentsOf(last)[0]);
      const points = sumPoints(leftover);
      add(to, points, `${SEAT_LABEL[last]}가 손에 남긴 ${leftover.length}장 ${points}점 → 상대 팀에게`);
    }
  }

  for (const seat of SEAT_ORDER) {
    const call = calls[seat];
    if (!call) continue;
    const value = CALL_VALUE[call];
    const success = first === seat;
    add(teamOf(seat), success ? value : -value,
      `${SEAT_LABEL[seat]}의 ${CALL_LABEL[call]} ${success ? '성공' : '실패'} ${success ? '+' : '−'}${value}`);
  }

  return { us: totals[TEAM.US], them: totals[TEAM.THEM], doubleVictory, lines };
}

/** 누적 점수로 게임이 끝났는지. 1000점을 넘겨도 동점이면 계속한다. */
export function gameResult(us, them) {
  if (us < WINNING_SCORE && them < WINNING_SCORE) return null;
  if (us === them) return null;
  return us > them ? TEAM.US : TEAM.THEM;
}
