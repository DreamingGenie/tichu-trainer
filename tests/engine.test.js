// 엔진이 규칙과 어긋나지 않는지 고정한다.
// 정상 케이스보다 "안 되는 것이 정말 안 되는지"에 무게를 뒀다. 학습용 사이트에서
// 잘못된 정답을 가르치는 것이 가장 나쁜 실패이기 때문이다.

import { assert, describe, eq, test } from './harness.js';
import { createDeck, parseHand, sumPoints } from '../src/engine/cards.js';
import { COMBO, detectCombo } from '../src/engine/combos.js';
import { REJECT, checkPlay, resolvePlayed } from '../src/engine/compare.js';
import { enumerateLegalPlays, playableCardIds } from '../src/engine/legal.js';
import { checkWish, wishStatus } from '../src/engine/wish.js';
import { CALL, scoreRound } from '../src/engine/scoring.js';
import { SEAT } from '../src/engine/seats.js';

const h = parseHand;
const type = (s) => detectCombo(h(s))?.type ?? null;
const rank = (s) => detectCombo(h(s))?.rank ?? null;

describe('덱', () => {
  test('56장이다', () => eq(createDeck().length, 56));

  test('점수 합이 정확히 100점이다', () => eq(sumPoints(createDeck()), 100));

  test('수트마다 13장씩이다', () => {
    const deck = createDeck();
    for (const suit of ['jade', 'sword', 'pagoda', 'star']) {
      eq(deck.filter((c) => c.suit === suit).length, 13, `${suit} 장수`);
    }
  });

  test('특수카드 4장은 수트가 없다', () => {
    eq(createDeck().filter((c) => c.suit === null).length, 4);
  });
});

describe('조합 판정 — 되는 것', () => {
  test('싱글', () => {
    eq(type('G5'), COMBO.SINGLE);
    eq(rank('DRG'), 15, '용은 15');
    eq(rank('PHX'), 1.5, '봉황을 리드로 내면 1.5');
    eq(type('DOG'), COMBO.DOG);
  });

  test('페어', () => {
    eq(rank('G5 B5'), 5);
    eq(rank('G5 PHX'), 5, '봉황이 짝을 맞춘다');
  });

  test('트리플', () => {
    eq(rank('G7 B7 U7'), 7);
    eq(rank('G7 B7 PHX'), 7);
  });

  test('풀하우스', () => {
    eq(rank('G7 B7 U7 GK BK'), 7, '랭크는 트리플 쪽');
    eq(rank('G7 B7 U7 GK PHX'), 7, '봉황이 K의 짝을 맞춘다');
    eq(rank('G7 B7 GK BK PHX'), 13, '봉황은 높은 쪽에 붙어 K 트리플이 된다');
  });

  test('연속 페어', () => {
    eq(type('G5 B5 G6 B6'), COMBO.STAIRS);
    eq(rank('G5 B5 G6 B6'), 6);
    eq(detectCombo(h('G5 B5 G6 B6 G7 B7')).length, 6, '3연속 페어는 6장');
    eq(rank('G5 B5 G6 PHX'), 6, '봉황이 6의 짝을 맞춘다');
  });

  test('스트레이트', () => {
    eq(rank('G5 B6 U7 R8 G9'), 9);
    eq(rank('MAH G2 B3 U4 R5'), 5, '참새이 최하단에 들어간다');
    eq(rank('G5 B6 PHX R8 G9'), 9, '봉황이 안쪽 구멍을 메운다');
    eq(rank('G5 B6 U7 R8 PHX'), 9, '봉황이 위로 붙어 9가 된다');
    eq(rank('G10 BJ UQ RK PHX'), 14, '봉황이 A 자리로 올라간다');
    eq(rank('GJ BQ UK RA PHX'), 14, 'A까지 찼으면 봉황은 아래로 붙는다');
  });

  test('폭탄', () => {
    eq(type('G7 B7 U7 R7'), COMBO.BOMB_FOUR);
    eq(type('G5 G6 G7 G8 G9'), COMBO.BOMB_SF);
    eq(detectCombo(h('G5 G6 G7 G8 G9 G10')).length, 6, '6장짜리 스트레이트 플러시');
  });
});

describe('조합 판정 — 안 되는 것', () => {
  test('용은 어떤 조합에도 못 들어간다', () => {
    eq(detectCombo(h('DRG G5')), null, '용 + 카드는 페어가 아니다');
    eq(detectCombo(h('G10 BJ UQ RK DRG')), null, '용은 스트레이트에 못 들어간다');
    eq(detectCombo(h('DRG PHX')), null, '용과 봉황은 페어가 아니다');
  });

  test('봉황은 폭탄에 못 들어간다', () => {
    eq(detectCombo(h('G7 B7 U7 PHX')), null, '봉황으로 포카드를 만들 수 없다');
    const sf = detectCombo(h('G5 G6 PHX G8 G9'));
    eq(sf.type, COMBO.STRAIGHT, '수트가 같아도 봉황이 끼면 그냥 스트레이트다');
  });

  test('참새은 스트레이트에만 참여한다', () => {
    eq(detectCombo(h('MAH G2')), null, '참새 + 2는 페어가 아니다');
    eq(detectCombo(h('MAH PHX')), null, '봉황도 참새과 짝이 될 수 없다');
    eq(detectCombo(h('MAH G7 B7')), null, '참새은 트리플을 못 채운다');
    eq(detectCombo(h('MAH G7 B7 GK BK')), null, '참새은 풀하우스에 못 들어간다');
    eq(detectCombo(h('MAH G5 B5 G6 B6')), null, '참새은 연속 페어에 못 들어간다');
  });

  test('개는 혼자만 낼 수 있다', () => {
    eq(detectCombo(h('DOG G5')), null);
    eq(detectCombo(h('DOG PHX')), null);
  });

  test('스트레이트는 5장 이상이다', () => {
    eq(detectCombo(h('G5 B6 U7 R8')), null, '4장은 스트레이트가 아니다');
    eq(detectCombo(h('G5 G6 G7 G8')), null, '같은 수트 4장도 폭탄이 아니다');
  });

  test('끊긴 것과 겹친 것', () => {
    eq(detectCombo(h('G5 B6 U7 R9 G10')), null, '8이 비었다');
    eq(detectCombo(h('G5 B5 U6 R7 G8')), null, '랭크가 겹치면 스트레이트가 아니다');
    eq(detectCombo(h('G5 B5 G7 B7')), null, '5와 7은 연속이 아니다');
  });

  test('같은 카드를 두 번 낼 수 없다', () => {
    const g5 = h('G5')[0];
    eq(detectCombo([g5, g5]), null);
  });
});

describe('비교 — 받아치기', () => {
  const play = (cand, curr) => checkPlay(h(cand), curr ? detectCombo(h(curr)) : null);

  test('같은 종류, 같은 장수, 더 높게', () => {
    assert(play('G7 B7', 'G5 B5').ok, '7 페어는 5 페어를 이긴다');
    eq(play('G5 B5', 'G7 B7').reason, REJECT.TOO_LOW);
  });

  test('장수가 다르면 못 낸다', () => {
    const r = play('G5 B6 U7 R8 G9 B10', 'G2 B3 U4 R5 G6');
    eq(r.reason, REJECT.LENGTH_MISMATCH, '6장 스트레이트로 5장을 받아칠 수 없다');
  });

  test('종류가 다르면 못 낸다', () => {
    eq(play('G7 B7 U7', 'G5 B5').reason, REJECT.TYPE_MISMATCH);
  });

  test('폭탄은 아무거나 받아친다', () => {
    assert(play('G7 B7 U7 R7', 'GA BA').ok, '포카드는 A 페어를 이긴다');
    assert(play('G7 B7 U7 R7', 'DRG').ok, '포카드는 용도 잡는다');
  });

  test('폭탄끼리는 서열이 있다', () => {
    assert(play('G5 G6 G7 G8 G9', 'BA UA RA GA').ok, '스트레이트 플러시 > 포카드');
    eq(play('BA UA RA GA', 'G5 G6 G7 G8 G9').reason, REJECT.WEAKER_BOMB, '포카드는 SF를 못 이긴다');
    assert(play('B2 B3 B4 B5 B6 B7', 'G10 GJ GQ GK GA').ok, 'SF는 랭크보다 길이가 먼저다');
    eq(play('G10 GJ GQ GK GA', 'B2 B3 B4 B5 B6 B7').reason, REJECT.WEAKER_BOMB, '짧은 SF는 아무리 높아도 진다');
  });

  test('봉황 단일', () => {
    assert(play('PHX', 'GK').ok, '봉황은 K를 이긴다');
    eq(play('PHX', 'DRG').reason, REJECT.PHOENIX_VS_DRAGON, '봉황은 용을 못 이긴다');
  });

  test('봉황이 K 위에 올라가면 13.5가 된다', () => {
    const king = detectCombo(h('GK'));
    const phoenix = resolvePlayed(detectCombo(h('PHX')), king);
    eq(phoenix.rank, 13.5);
    assert(checkPlay(h('BA'), phoenix).ok, 'A는 봉황을 넘는다');
    eq(checkPlay(h('BK'), phoenix).reason, REJECT.TOO_LOW, '다른 K는 봉황을 못 넘는다');
  });

  test('개는 리드로만 낼 수 있다', () => {
    assert(play('DOG', null).ok, '새 트릭을 여는 건 된다');
    eq(play('DOG', 'G5').reason, REJECT.DOG_NOT_LEAD, '받아치는 데는 못 쓴다');
  });

  test('리드는 유효한 조합이면 무엇이든 된다', () => {
    assert(play('G5 B5 G6 B6', null).ok);
    eq(play('G5 B6', null).reason, REJECT.INVALID, '조합이 아니면 리드도 못 한다');
  });
});

describe('합법 수 열거', () => {
  test('페어 위에서는 더 높은 페어와 폭탄만 나온다', () => {
    const hand = h('G5 B5 G7 B7 U7 R7');
    const current = detectCombo(h('G6 B6'));
    const plays = enumerateLegalPlays(hand, current);
    assert(plays.some((p) => p.type === COMBO.PAIR && p.rank === 7), '7 페어가 있어야 한다');
    assert(plays.some((p) => p.type === COMBO.BOMB_FOUR), '7 포카드가 있어야 한다');
    assert(!plays.some((p) => p.rank === 5), '5 페어는 나오면 안 된다');
  });

  test('낼 수 있는 카드만 하이라이트된다', () => {
    const hand = h('G2 B3 GA BA');
    const ids = playableCardIds(hand, detectCombo(h('GK BK')));
    assert(ids.has('GA') && ids.has('BA'), 'A 페어는 낼 수 있다');
    assert(!ids.has('G2'), '2는 이 트릭에 쓸 수 없다');
  });

  test('낼 게 없으면 빈 배열이다', () => {
    eq(enumerateLegalPlays(h('G2 B3'), detectCombo(h('GA BA'))).length, 0);
  });
});

describe('참새 소원', () => {
  test('낼 수 있으면 강제된다', () => {
    const status = wishStatus(h('GK B5 U9'), detectCombo(h('G3')), 13);
    assert(status.forced, 'K를 낼 수 있으니 반드시 내야 한다');
    assert(status.plays.every((p) => p.cards.some((c) => c.id === 'GK')));
  });

  test('그 랭크가 없으면 자유다', () => {
    assert(!wishStatus(h('G5 B9'), detectCombo(h('G3')), 13).forced);
  });

  test('가지고는 있지만 합법적으로 못 내면 자유다', () => {
    // K는 있는데 테이블에 페어가 깔려 있어 K 페어를 만들 수 없다.
    const status = wishStatus(h('GK B5 U9'), detectCombo(h('G3 B3')), 13);
    assert(!status.forced, '낼 방법이 없으면 강제되지 않는다');
  });

  test('봉황으로는 소원을 이행하지 못한다', () => {
    const status = wishStatus(h('PHX B5'), detectCombo(h('G3')), 13);
    assert(!status.forced, '봉황은 K를 대신할 수 없다');
  });

  test('소원을 두고 다른 걸 내면 반칙이다', () => {
    const hand = h('GK B5');
    const current = detectCombo(h('G3'));
    eq(checkWish(hand, current, 13, detectCombo(h('B5'))).ok, false);
    eq(checkWish(hand, current, 13, detectCombo(h('GK'))).ok, true);
  });

  test('턴 밖 폭탄은 소원 의무를 면제받는다', () => {
    const hand = h('GK B7 U7 R7 G7');
    const bomb = detectCombo(h('B7 U7 R7 G7'));
    eq(checkWish(hand, detectCombo(h('G3')), 13, bomb, { outOfTurnBomb: true }).ok, true);
  });
});

describe('라운드 점수', () => {
  test('원투 피니시는 200점이고 카드는 세지 않는다', () => {
    const result = scoreRound({
      finishOrder: [SEAT.SOUTH, SEAT.NORTH, SEAT.EAST, SEAT.WEST],
      tricks: { [SEAT.EAST]: h('GK BK G5') },
      hands: {},
      calls: {},
    });
    eq(result.us, 200);
    eq(result.them, 0, '상대가 딴 25점은 무시된다');
    eq(result.doubleVictory, 'us');
  });

  test('꼴찌의 남은 손패는 상대 팀에게 간다', () => {
    const result = scoreRound({
      finishOrder: [SEAT.EAST, SEAT.SOUTH, SEAT.WEST],
      tricks: {},
      hands: { [SEAT.NORTH]: h('GK B10 G5') }, // 25점
      calls: {},
    });
    eq(result.them, 25, '파트너가 꼴찌면 그 손패는 상대 점수다');
    eq(result.us, 0);
  });

  test('꼴찌가 딴 트릭은 1등에게 간다', () => {
    const result = scoreRound({
      finishOrder: [SEAT.SOUTH, SEAT.EAST, SEAT.WEST],
      tricks: { [SEAT.NORTH]: h('GK BK') }, // 20점
      hands: { [SEAT.NORTH]: [] },
      calls: {},
    });
    eq(result.us, 20, '꼴찌가 파트너여도 1등이 나라서 우리 팀으로 온다');
  });

  test('티츄 선언은 성패에 따라 더하고 뺀다', () => {
    const win = scoreRound({
      finishOrder: [SEAT.SOUTH, SEAT.EAST, SEAT.WEST],
      tricks: {}, hands: {}, calls: { [SEAT.SOUTH]: CALL.TICHU },
    });
    eq(win.us, 100);

    const lose = scoreRound({
      finishOrder: [SEAT.EAST, SEAT.SOUTH, SEAT.WEST],
      tricks: {}, hands: {}, calls: { [SEAT.SOUTH]: CALL.GRAND },
    });
    eq(lose.us, -200, '라지 티츄 실패는 -200');
  });

  test('양 팀 점수 합은 100점이다', () => {
    // 점수 카드 20장을 한 장도 빠짐없이, 겹치지도 않게 나눠 놓는다.
    const result = scoreRound({
      finishOrder: [SEAT.SOUTH, SEAT.EAST, SEAT.NORTH],
      tricks: {
        [SEAT.SOUTH]: h('DRG GK'),
        [SEAT.EAST]: h('B10 G10 U10 R10 B5 U5 R5 BK UK RK PHX'),
      },
      hands: { [SEAT.WEST]: h('G5') },
      calls: {},
    });
    eq(result.us + result.them, 100, '라운드마다 오가는 점수는 언제나 100점이다');
    eq(result.us, 40, '내 트릭 35점 + 꼴찌가 남긴 5점');
    eq(result.them, 60);
  });
});
