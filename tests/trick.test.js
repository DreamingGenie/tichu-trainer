// 트릭 진행 상태 기계. 미니판이 전부 이 위에서 돌아가므로 진행 규칙을 여기서 고정한다.

import { assert, describe, eq, test } from './harness.js';
import { parseHand, sumPoints } from '../src/engine/cards.js';
import { SEAT } from '../src/engine/seats.js';
import { createRound, giveDragonTrick, pass, playCards } from '../src/engine/trick.js';

const h = parseHand;

/** 그 자리의 손패에서 표기에 해당하는 카드를 꺼낸다. */
function pick(state, seat, tokens) {
  const want = new Set(h(tokens).map((c) => c.id));
  return state.hands[seat].filter((c) => want.has(c.id));
}

const play = (state, seat, tokens) => playCards(state, seat, pick(state, seat, tokens));

function round(hands, startingSeat, extra = {}) {
  return createRound({ hands: Object.fromEntries(Object.entries(hands).map(([k, v]) => [k, h(v)])), startingSeat, ...extra });
}

describe('트릭 진행', () => {
  test('남은 사람이 전부 패스하면 마지막에 낸 사람이 트릭을 가져간다', () => {
    const state = round({
      [SEAT.SOUTH]: 'G5 G2', [SEAT.EAST]: 'G7 G3',
      [SEAT.NORTH]: 'G8 G4', [SEAT.WEST]: 'G9 G6',
    }, SEAT.SOUTH);

    assert(play(state, SEAT.SOUTH, 'G5').ok);
    assert(play(state, SEAT.EAST, 'G7').ok);
    assert(pass(state, SEAT.NORTH).ok);
    assert(pass(state, SEAT.WEST).ok);
    assert(pass(state, SEAT.SOUTH).ok);

    eq(state.tricks[SEAT.EAST].length, 2, '5와 7이 동쪽에게 간다');
    eq(state.current, null, '새 트릭이 열렸다');
    eq(state.turn, SEAT.EAST, '트릭을 딴 사람이 선을 잡는다');
  });

  test('차례가 아니면 못 낸다', () => {
    const state = round({
      [SEAT.SOUTH]: 'G5 G2', [SEAT.EAST]: 'G7 G3',
      [SEAT.NORTH]: 'G8 G4', [SEAT.WEST]: 'G9 G6',
    }, SEAT.SOUTH);
    eq(play(state, SEAT.NORTH, 'G8').reason, 'NOT_YOUR_TURN');
  });

  test('리드일 때는 패스할 수 없다', () => {
    const state = round({
      [SEAT.SOUTH]: 'G5 G2', [SEAT.EAST]: 'G7 G3',
      [SEAT.NORTH]: 'G8 G4', [SEAT.WEST]: 'G9 G6',
    }, SEAT.SOUTH);
    eq(pass(state, SEAT.SOUTH).reason, 'MUST_LEAD');
  });

  test('폭탄은 차례가 아니어도 터뜨릴 수 있다', () => {
    const state = round({
      [SEAT.SOUTH]: 'G5 B5 G2', [SEAT.EAST]: 'G7 B7 G3',
      [SEAT.NORTH]: 'G8 B8 G4', [SEAT.WEST]: 'G9 B9 U9 R9',
    }, SEAT.SOUTH);

    assert(play(state, SEAT.SOUTH, 'G5 B5').ok);
    assert(play(state, SEAT.EAST, 'G7 B7').ok);
    eq(state.turn, SEAT.NORTH, '차례는 북쪽인데');

    const bomb = play(state, SEAT.WEST, 'G9 B9 U9 R9');
    assert(bomb.ok, '서쪽이 턴 밖에서 폭탄을 터뜨린다');
    eq(state.currentOwner, SEAT.WEST);
  });

  test('테이블이 비어 있으면 폭탄도 턴 밖에서 못 낸다', () => {
    const state = round({
      [SEAT.SOUTH]: 'G5 G2', [SEAT.EAST]: 'G7 G3',
      [SEAT.NORTH]: 'G8 G4', [SEAT.WEST]: 'G9 B9 U9 R9',
    }, SEAT.SOUTH);
    eq(play(state, SEAT.WEST, 'G9 B9 U9 R9').reason, 'NOTHING_TO_BOMB');
  });
});

describe('개', () => {
  test('선이 파트너에게 넘어가고 트릭은 생기지 않는다', () => {
    const state = round({
      [SEAT.SOUTH]: 'DOG G2', [SEAT.EAST]: 'G7 G3',
      [SEAT.NORTH]: 'G8 G4', [SEAT.WEST]: 'G9 G6',
    }, SEAT.SOUTH);

    assert(play(state, SEAT.SOUTH, 'DOG').ok);
    eq(state.turn, SEAT.NORTH, '파트너가 선을 잡는다');
    eq(state.current, null, '테이블에는 아무것도 남지 않는다');
    eq(state.tricks[SEAT.NORTH].length, 0, '개는 트릭이 아니다');
  });

  test('받아치는 데는 쓸 수 없다', () => {
    const state = round({
      [SEAT.SOUTH]: 'G5 G2', [SEAT.EAST]: 'DOG G3',
      [SEAT.NORTH]: 'G8 G4', [SEAT.WEST]: 'G9 G6',
    }, SEAT.SOUTH);
    assert(play(state, SEAT.SOUTH, 'G5').ok);
    eq(play(state, SEAT.EAST, 'DOG').reason, 'DOG_NOT_LEAD');
  });
});

describe('용', () => {
  test('용으로 딴 트릭은 상대 팀에게 줘야 한다', () => {
    const state = round({
      [SEAT.SOUTH]: 'DRG G2', [SEAT.EAST]: 'G3 G4',
      [SEAT.NORTH]: 'G5 G6', [SEAT.WEST]: 'G7 G8',
    }, SEAT.SOUTH);

    assert(play(state, SEAT.SOUTH, 'DRG').ok);
    assert(pass(state, SEAT.EAST).ok);
    assert(pass(state, SEAT.NORTH).ok);
    assert(pass(state, SEAT.WEST).ok);

    assert(state.pendingDragon, '누구에게 줄지 정할 때까지 멈춘다');
    eq(giveDragonTrick(state, SEAT.NORTH).reason, 'DRAGON_TO_OPPONENT', '파트너에게는 못 준다');

    assert(giveDragonTrick(state, SEAT.EAST).ok);
    eq(sumPoints(state.tricks[SEAT.EAST]), 25, '용 25점이 상대에게 넘어간다');
    eq(state.turn, SEAT.SOUTH, '카드는 줬어도 선은 딴 사람이 잡는다');
  });
});

describe('참새 소원', () => {
  function wishRound() {
    const state = round({
      [SEAT.SOUTH]: 'GK GA G2', [SEAT.EAST]: 'B4 B6',
      [SEAT.NORTH]: 'U4 U6', [SEAT.WEST]: 'G3 G4',
    }, SEAT.WEST, { wish: 13 });
    play(state, SEAT.WEST, 'G3');
    return state;
  }

  test('이행할 수 있으면 패스도 못 한다', () => {
    eq(pass(wishRound(), SEAT.SOUTH).reason, 'WISH_UNFULFILLED');
  });

  test('낼 수는 있지만 소원을 안 지키는 카드도 안 된다', () => {
    // A는 3을 이기지만 소원은 K다.
    eq(play(wishRound(), SEAT.SOUTH, 'GA').reason, 'WISH_UNFULFILLED');
  });

  test('애초에 못 내는 카드는 소원보다 그 이유를 먼저 알려준다', () => {
    // 2는 소원도 안 지키지만 3보다 낮기도 하다. 초보자에게는 이쪽이 더 와닿는 설명이다.
    eq(play(wishRound(), SEAT.SOUTH, 'G2').reason, 'TOO_LOW');
  });

  test('소원을 이행하면 풀린다', () => {
    const state = wishRound();
    assert(play(state, SEAT.SOUTH, 'GK').ok);
    eq(state.wish, null);
  });
});

describe('라운드 종료', () => {
  test('원투 피니시가 나오면 즉시 끝난다', () => {
    const state = round({
      [SEAT.SOUTH]: 'G2', [SEAT.EAST]: 'G3 G4',
      [SEAT.NORTH]: 'GA', [SEAT.WEST]: 'G7 G8',
    }, SEAT.SOUTH);

    assert(play(state, SEAT.SOUTH, 'G2').ok);
    eq(state.finishOrder[0], SEAT.SOUTH, '남쪽이 1등으로 나갔다');
    assert(play(state, SEAT.EAST, 'G3').ok);
    assert(play(state, SEAT.NORTH, 'GA').ok, '파트너가 이어서 손패를 턴다');

    eq(state.done, true, '파트너끼리 1·2등이면 즉시 라운드 종료');
    eq(state.endReason, 'double-victory');
  });

  test('이미 나간 사람이 트릭을 따면 선은 다음 사람에게 간다', () => {
    const state = round({
      [SEAT.SOUTH]: 'GA', [SEAT.EAST]: 'G3 G4',
      [SEAT.NORTH]: 'GK G5', [SEAT.WEST]: 'G7 G8',
    }, SEAT.SOUTH);

    assert(play(state, SEAT.SOUTH, 'GA').ok, '남쪽이 A를 내며 손패를 턴다');
    eq(play(state, SEAT.NORTH, 'GK').reason, 'NOT_YOUR_TURN', '아직 동쪽 차례다');

    assert(pass(state, SEAT.EAST).ok);
    assert(pass(state, SEAT.NORTH).ok);
    assert(pass(state, SEAT.WEST).ok);

    eq(state.turn, SEAT.EAST, '트릭은 남쪽이 땄지만 이미 나갔으므로 동쪽이 연다');
    eq(play(state, SEAT.NORTH, 'GK').reason, 'NOT_YOUR_TURN', '북쪽이 선을 잡는 게 아니다');
  });

  test('손패를 턴 사람은 트릭 종료 판정에서 빠진다', () => {
    const state = round({
      [SEAT.SOUTH]: 'GA', [SEAT.EAST]: 'G3 G4',
      [SEAT.NORTH]: 'B3 B4', [SEAT.WEST]: 'U3 U4',
    }, SEAT.SOUTH);

    assert(play(state, SEAT.SOUTH, 'GA').ok, '남쪽이 A를 내고 손패를 턴다');
    assert(pass(state, SEAT.EAST).ok);
    assert(pass(state, SEAT.NORTH).ok);
    assert(pass(state, SEAT.WEST).ok);

    eq(state.tricks[SEAT.SOUTH].length, 1, '나간 사람도 자기가 딴 트릭은 가져간다');
    eq(state.turn, SEAT.EAST, '나간 사람 대신 다음 사람이 선을 잡는다');
  });
});
