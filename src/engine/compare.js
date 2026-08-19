// 낸 조합이 지금 테이블 위의 조합을 이기는지 판정한다.
//
// 초보자가 가장 많이 틀리는 두 가지를 여기서 명시적으로 구분해 알려준다.
//   1. 종류는 맞는데 장수가 다른 경우 (스트레이트 5장 위에 6장은 못 낸다)
//   2. 봉황으로 용을 잡으려는 경우

import { DRAGON_RANK, PHOENIX_LEAD_RANK } from './cards.js';
import { COMBO, COMBO_LABEL, detectCombo, isBomb } from './combos.js';

export const REJECT = Object.freeze({
  INVALID: 'INVALID',
  DOG_NOT_LEAD: 'DOG_NOT_LEAD',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
  LENGTH_MISMATCH: 'LENGTH_MISMATCH',
  TOO_LOW: 'TOO_LOW',
  WEAKER_BOMB: 'WEAKER_BOMB',
  PHOENIX_VS_DRAGON: 'PHOENIX_VS_DRAGON',
});

/** 폭탄끼리의 서열: 스트레이트 플러시 > 포카드, 같은 종류면 길이 → 랭크 순. */
function bombBeatsBomb(candidate, current) {
  const candSF = candidate.type === COMBO.BOMB_SF;
  const currSF = current.type === COMBO.BOMB_SF;
  if (candSF !== currSF) return candSF;
  if (candSF && candidate.length !== current.length) return candidate.length > current.length;
  return candidate.rank > current.rank;
}

/**
 * 봉황을 단일로 냈을 때 실제로 갖는 값.
 * 리드면 1.5, 아니면 직전 단일보다 0.5 높다.
 */
export function effectiveRank(candidate, current) {
  if (candidate?.phoenixSingle) {
    return current ? current.rank + 0.5 : PHOENIX_LEAD_RANK;
  }
  return candidate.rank;
}

/**
 * 테이블에 올릴 형태로 조합을 확정한다. 봉황 단일의 랭크가 여기서 고정되므로
 * 다음 사람은 이 값만 보고 비교하면 된다.
 */
export function resolvePlayed(candidate, current) {
  return { ...candidate, rank: effectiveRank(candidate, current) };
}

/**
 * candidate가 current를 이기는가.
 * current가 null이면 리드이므로 유효한 조합은 무엇이든 낼 수 있다.
 */
export function beats(candidate, current) {
  return checkPlay(candidate, current).ok;
}

/**
 * beats()와 같은 판정을 하되, 안 되는 이유까지 돌려준다.
 * 퀴즈 해설이 "왜 못 내는지"를 상황에 맞게 말할 수 있는 건 이 함수 덕분이다.
 *
 * @param candidate 조합 객체 또는 카드 배열
 * @param current   테이블 위의 조합 (없으면 null)
 * @returns {{ok: boolean, reason?: string, message?: string, combo?: object}}
 */
export function checkPlay(candidate, current) {
  const combo = Array.isArray(candidate) ? detectCombo(candidate) : candidate;
  if (!combo) {
    return fail(REJECT.INVALID, '티츄에 없는 조합입니다. 낼 수 있는 형태가 아니에요.');
  }

  if (combo.type === COMBO.DOG) {
    return current
      ? fail(REJECT.DOG_NOT_LEAD, '개는 새 트릭을 시작할 때만 낼 수 있어요. 다른 카드를 받아치는 데는 못 씁니다.', combo)
      : ok(combo);
  }

  if (!current) return ok(combo);

  if (isBomb(combo)) {
    if (!isBomb(current)) return ok(combo);
    return bombBeatsBomb(combo, current)
      ? ok(combo)
      : fail(REJECT.WEAKER_BOMB, `테이블의 ${COMBO_LABEL[current.type]}보다 약한 폭탄이에요. 더 센 폭탄만 받아칠 수 있습니다.`, combo);
  }

  if (isBomb(current)) {
    return fail(REJECT.WEAKER_BOMB, '폭탄이 깔려 있어요. 더 센 폭탄이 아니면 받아칠 수 없습니다.', combo);
  }

  if (combo.type !== current.type) {
    return fail(
      REJECT.TYPE_MISMATCH,
      `테이블에는 ${COMBO_LABEL[current.type]}이(가) 깔려 있어요. 같은 종류로 받아쳐야 합니다.`,
      combo,
    );
  }

  if (combo.length !== current.length) {
    return fail(
      REJECT.LENGTH_MISMATCH,
      `장수가 달라요. ${current.length}장짜리 ${COMBO_LABEL[current.type]} 위에는 똑같이 ${current.length}장을 내야 합니다.`,
      combo,
    );
  }

  if (combo.phoenixSingle) {
    return current.rank === DRAGON_RANK
      ? fail(REJECT.PHOENIX_VS_DRAGON, '봉황은 용을 이기지 못해요. 용을 잡으려면 폭탄이 필요합니다.', combo)
      : ok(combo);
  }

  return combo.rank > current.rank
    ? ok(combo)
    : fail(REJECT.TOO_LOW, '테이블에 깔린 것보다 낮아요. 더 높은 걸 내야 합니다.', combo);
}

function ok(combo) {
  return { ok: true, combo };
}

function fail(reason, message, combo) {
  return { ok: false, reason, message, combo };
}
