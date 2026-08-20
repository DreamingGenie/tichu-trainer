// 엔진이 내놓은 값을 사람 말로 옮기는 곳. DOM 은 모른다.
//
// engine 안에 두는 이유: 도메인 개념을 한국어로 옮기는 일이고, 같은 성격의
// COMBO_LABEL(combos.js) · SEAT_LABEL(seats.js) · CALL_LABEL(scoring.js) 이
// 이미 여기 있다.

import { rankLabel } from './cards.js';
import { COMBO, COMBO_LABEL } from './combos.js';

/** '스트레이트 5장 (최고 9)' 처럼 조합을 한 줄로 설명한다. */
export function describeCombo(combo) {
  if (!combo) return '조합 아님';
  const name = COMBO_LABEL[combo.type];

  switch (combo.type) {
    case COMBO.DOG:
      return name;
    case COMBO.SINGLE:
      return combo.phoenixSingle ? '봉황 (직전 카드보다 0.5 높게)' : `${name} ${rankLabel(combo.rank)}`;
    case COMBO.PAIR:
    case COMBO.TRIPLE:
    case COMBO.BOMB_FOUR:
      return `${name} ${rankLabel(combo.rank)}`;
    case COMBO.FULLHOUSE:
      return `${name} (${rankLabel(combo.rank)} 트리플 기준)`;
    case COMBO.STAIRS:
    case COMBO.STRAIGHT:
    case COMBO.BOMB_SF:
      return `${name} ${combo.length}장 (최고 ${rankLabel(combo.rank)})`;
    default:
      return name;
  }
}

/** 점수를 부호까지 붙여서. */
export function formatPoints(points) {
  if (points === 0) return '0점';
  return `${points > 0 ? '+' : '−'}${Math.abs(points)}점`;
}
