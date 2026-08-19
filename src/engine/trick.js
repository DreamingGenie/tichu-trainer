// 한 라운드의 진행 상태.
//
// 미니판이 이 상태 기계 위에서 돌아간다. 트릭 종료 조건은 "3명이 패스"라고들 하지만
// 이미 손패를 턴 사람이 있으면 그 사람은 세지 않으므로, 실제로는 "카드가 남은 다른
// 사람이 전부 패스했는가"로 판정해야 한다. 여기서는 후자로 구현했다.

import { isDog, isDragon, sortCards } from './cards.js';
import { COMBO, COMBO_LABEL, detectCombo, isBomb } from './combos.js';
import { checkPlay, resolvePlayed } from './compare.js';
import { SEAT_LABEL, SEAT_ORDER, arePartners, nextSeat, opponentsOf, partnerOf } from './seats.js';
import { checkWish, isWishableRank } from './wish.js';

/**
 * 새 라운드 상태를 만든다.
 * @param setup.hands        {seat: 카드배열}
 * @param setup.startingSeat 선을 잡는 자리
 * @param setup.wish         걸려 있는 소원 랭크 (없으면 null)
 */
export function createRound(setup) {
  const hands = {};
  for (const seat of SEAT_ORDER) hands[seat] = sortCards(setup.hands?.[seat] || []);

  return {
    hands,
    tricks: Object.fromEntries(SEAT_ORDER.map((s) => [s, []])),
    turn: setup.startingSeat,
    current: null,
    currentOwner: null,
    pile: [],
    passedSince: [],
    discarded: [],
    wish: isWishableRank(setup.wish) ? setup.wish : null,
    calls: { ...(setup.calls || {}) },
    finishOrder: [],
    pendingDragon: null,
    log: [],
    done: false,
  };
}

export function activeSeats(state) {
  return SEAT_ORDER.filter((seat) => state.hands[seat].length > 0);
}

/** turn 다음으로 카드가 남은 자리. 아무도 없으면 null. */
function nextActive(state, from) {
  let seat = from;
  for (let i = 0; i < 4; i += 1) {
    seat = nextSeat(seat);
    if (state.hands[seat].length > 0) return seat;
  }
  return null;
}

function fail(message, reason) {
  return { ok: false, reason: reason || 'ILLEGAL', message };
}

/**
 * 카드를 낸다. 턴이 아니어도 폭탄이면 낼 수 있다.
 * @returns {{ok: boolean, message?: string, reason?: string}}
 */
export function playCards(state, seat, cards) {
  if (state.done) return fail('라운드가 이미 끝났습니다.');
  if (state.pendingDragon) return fail('용으로 딴 트릭을 누구에게 줄지 먼저 정해야 합니다.');

  const hand = state.hands[seat];
  const handIds = new Set(hand.map((c) => c.id));
  if (!cards.length || !cards.every((c) => handIds.has(c.id))) {
    return fail('손에 없는 카드입니다.');
  }

  const combo = detectCombo(cards);
  if (!combo) return fail('티츄에 없는 조합입니다.', 'INVALID');

  const outOfTurn = seat !== state.turn;
  if (outOfTurn) {
    if (!isBomb(combo)) return fail('자기 차례가 아닙니다. 턴 밖에서 낼 수 있는 건 폭탄뿐이에요.', 'NOT_YOUR_TURN');
    if (!state.current) return fail('테이블이 비어 있어요. 폭탄도 받아칠 것이 있어야 터뜨릴 수 있습니다.', 'NOTHING_TO_BOMB');
  }

  const legality = checkPlay(combo, state.current);
  if (!legality.ok) return fail(legality.message, legality.reason);

  const wishCheck = checkWish(hand, state.current, state.wish, combo, {
    outOfTurnBomb: outOfTurn && isBomb(combo),
  });
  if (!wishCheck.ok) return fail(wishCheck.message, wishCheck.reason);

  // --- 여기부터 상태 변경 ---
  const playedIds = new Set(cards.map((c) => c.id));
  state.hands[seat] = hand.filter((c) => !playedIds.has(c.id));
  state.log.push({
    seat, action: 'play', cards: [...cards],
    label: `${SEAT_LABEL[seat]} — ${COMBO_LABEL[combo.type]}`,
    outOfTurn,
  });

  if (state.wish && cards.some((c) => c.suit !== null && c.rank === state.wish)) {
    state.log.push({ seat, action: 'wish-met', label: `소원이 이행되어 풀렸습니다.` });
    state.wish = null;
  }

  if (state.hands[seat].length === 0 && !state.finishOrder.includes(seat)) {
    state.finishOrder.push(seat);
    state.log.push({ seat, action: 'out', label: `${SEAT_LABEL[seat]}가 ${state.finishOrder.length}등으로 손패를 털었습니다.` });
  }

  if (combo.type === COMBO.DOG) {
    playDog(state, seat, cards);
    return { ok: true };
  }

  state.pile.push(...cards);
  state.current = resolvePlayed(combo, state.current);
  state.currentOwner = seat;
  state.passedSince = [];

  if (checkRoundEnd(state)) return { ok: true };

  // 낸 사람이 손패를 털었으면 그 사람을 건너뛰고 다음 사람에게 넘긴다.
  state.turn = nextActive(state, seat) ?? seat;
  maybeResolveTrick(state);
  return { ok: true };
}

/** 개는 트릭을 만들지 않고 선만 파트너에게 넘긴다. */
function playDog(state, seat, cards) {
  state.discarded.push(...cards);
  state.current = null;
  state.currentOwner = null;
  state.pile = [];
  state.passedSince = [];

  const partner = partnerOf(seat);
  const to = state.hands[partner].length > 0 ? partner : nextActive(state, partner);
  state.log.push({ seat, action: 'dog', label: `개 — 선이 ${SEAT_LABEL[to]}에게 넘어갑니다.` });

  if (checkRoundEnd(state)) return;
  state.turn = to ?? state.turn;
}

/** 패스. 리드일 때는 패스할 수 없고, 소원이 강제될 때도 패스할 수 없다. */
export function pass(state, seat) {
  if (state.done) return fail('라운드가 이미 끝났습니다.');
  if (state.pendingDragon) return fail('용으로 딴 트릭을 누구에게 줄지 먼저 정해야 합니다.');
  if (seat !== state.turn) return fail('자기 차례가 아닙니다.', 'NOT_YOUR_TURN');
  if (!state.current) return fail('새 트릭을 여는 차례라 패스할 수 없어요. 무엇이든 내야 합니다.', 'MUST_LEAD');

  const wishCheck = checkWish(state.hands[seat], state.current, state.wish, null);
  if (!wishCheck.ok) return fail(wishCheck.message, wishCheck.reason);

  state.passedSince.push(seat);
  state.log.push({ seat, action: 'pass', label: `${SEAT_LABEL[seat]} — 패스` });
  state.turn = nextActive(state, seat) ?? seat;
  maybeResolveTrick(state);
  return { ok: true };
}

/** 카드가 남은 사람 중 트릭 주인을 뺀 전원이 패스했으면 트릭이 끝난다. */
function maybeResolveTrick(state) {
  if (!state.currentOwner || !state.current) return;
  const waiting = activeSeats(state).filter(
    (seat) => seat !== state.currentOwner && !state.passedSince.includes(seat),
  );
  if (waiting.length > 0) return;
  resolveTrick(state);
}

function resolveTrick(state) {
  const winner = state.currentOwner;
  const pile = state.pile;

  if (pile.some(isDragon)) {
    // 용으로 딴 트릭은 반드시 상대 팀에게 준다.
    state.pendingDragon = { winner, pile: [...pile], choices: opponentsOf(winner) };
    state.log.push({ seat: winner, action: 'dragon', label: `${SEAT_LABEL[winner]}가 용으로 트릭을 땄습니다. 상대 팀 중 한 명에게 줘야 합니다.` });
    return;
  }

  awardTrick(state, winner, pile);
}

function awardTrick(state, toSeat, pile) {
  state.tricks[toSeat].push(...pile);
  state.pile = [];
  state.current = null;
  state.passedSince = [];
  state.log.push({ seat: toSeat, action: 'trick', label: `${SEAT_LABEL[toSeat]}가 트릭을 가져갑니다.`, cards: [...pile] });

  if (checkRoundEnd(state)) return;

  // 트릭을 딴 사람이 새 트릭을 연다. 이미 손패를 털었으면 다음 사람이 연다.
  const leader = state.hands[state.currentOwner].length > 0
    ? state.currentOwner
    : nextActive(state, state.currentOwner);
  state.currentOwner = null;
  state.turn = leader ?? state.turn;
}

/** 용으로 딴 트릭을 상대에게 넘긴다. */
export function giveDragonTrick(state, toSeat) {
  if (!state.pendingDragon) return fail('지금은 용 트릭을 넘길 차례가 아닙니다.');
  if (!state.pendingDragon.choices.includes(toSeat)) {
    return fail('용으로 딴 트릭은 반드시 상대 팀에게 줘야 합니다. 파트너에게는 못 줍니다.', 'DRAGON_TO_OPPONENT');
  }
  const { pile } = state.pendingDragon;
  state.pendingDragon = null;
  awardTrick(state, toSeat, pile);
  return { ok: true };
}

/** 세 명이 나가거나 원투 피니시가 나오면 라운드가 끝난다. */
function checkRoundEnd(state) {
  if (state.done) return true;

  const [first, second] = state.finishOrder;
  if (first && second && arePartners(first, second)) {
    state.done = true;
    state.endReason = 'double-victory';
    state.log.push({ action: 'end', label: '원투 피니시! 카드 점수를 세지 않고 라운드가 끝납니다.' });
    return true;
  }

  if (state.finishOrder.length >= 3) {
    state.done = true;
    state.endReason = 'three-out';
    // 아직 테이블에 남은 트릭은 마지막 주인에게 준다.
    if (state.pile.length && state.currentOwner) {
      state.tricks[state.currentOwner].push(...state.pile);
      state.pile = [];
    }
    state.log.push({ action: 'end', label: '세 명이 손패를 털어 라운드가 끝났습니다.' });
    return true;
  }

  return false;
}

/** 지금 이 자리가 낼 수 있는 상태인지 UI가 묻기 위한 요약. */
export function turnInfo(state, seat) {
  return {
    isTurn: seat === state.turn && !state.done && !state.pendingDragon,
    canPass: seat === state.turn && Boolean(state.current) && !state.done,
    mustLead: seat === state.turn && !state.current,
    wish: state.wish,
  };
}
