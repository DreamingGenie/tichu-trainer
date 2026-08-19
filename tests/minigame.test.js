// 미니판 각본이 의도한 대로 전개되는지 확인한다.
//
// 각 판마다 "정답 수를 두면 성공", "가르치려는 실수를 하면 실패"를 둘 다 본다.
// 성공만 확인하면 아무렇게나 둬도 성공하는 판을 못 걸러낸다.

import { assert, describe, eq, test } from './harness.js';
import { createScenarioRunner } from '../src/engine/scenario.js';
import { SEAT } from '../src/engine/seats.js';
import { sumPoints } from '../src/engine/cards.js';
import { MINIGAMES, minigameById } from '../src/data/minigames/index.js';

function start(id) {
  const runner = createScenarioRunner(minigameById(id));
  runner.runBots();
  return runner;
}

describe('미니판 — 공통', () => {
  test('다섯 판 모두 사람의 첫 결정까지 각본이 굴러간다', () => {
    for (const game of MINIGAMES) {
      const runner = createScenarioRunner(game);
      runner.runBots();
      assert(runner.needsPlayer() || runner.outcome,
        `${game.id}: 사람 차례까지 오지 못했습니다 (turn=${runner.state.turn}, done=${runner.state.done})`);
      eq(runner.outcome, null, `${game.id}: 아직 아무것도 하기 전인데 결과가 났습니다`);
    }
  });

});

describe('미니판 — 파트너의 트릭을 지켜주기', () => {
  test('패스하면 파트너가 무더기를 가져간다', () => {
    const runner = start('trick-basics');
    eq(runner.state.turn, SEAT.SOUTH);
    eq(runner.state.currentOwner, SEAT.NORTH, '파트너가 잡고 있는 상태로 넘어와야 한다');

    assert(runner.pass().ok);
    runner.runBots();

    eq(runner.outcome, 'success');
    eq(sumPoints(runner.state.tricks[SEAT.NORTH]), 20, '10과 K로 20점');
  });

  test('A로 덮으면 실패한다', () => {
    const runner = start('trick-basics');
    assert(runner.play('GA').ok);
    runner.runBots();
    eq(runner.outcome, 'fail');
  });
});

describe('미니판 — 용과 개', () => {
  test('용으로 잡아 왼쪽 상대에게 주고 개로 선을 넘기면 성공', () => {
    const runner = start('dragon-and-dog');
    eq(runner.state.turn, SEAT.SOUTH);

    assert(runner.play('DRG').ok);
    runner.runBots();

    assert(runner.state.pendingDragon, '용으로 땄으니 누구에게 줄지 물어야 한다');
    eq(runner.giveDragon(SEAT.NORTH).reason, 'DRAGON_TO_OPPONENT', '파트너에게는 못 준다');
    assert(runner.giveDragon(SEAT.WEST).ok);
    runner.runBots();

    eq(runner.state.turn, SEAT.SOUTH, '무더기는 줬어도 선은 내가 잡는다');
    assert(runner.play('DOG').ok);
    runner.runBots();

    eq(runner.outcome, 'success');
  });

  test('티츄를 선언한 상대에게 주면 실패', () => {
    const runner = start('dragon-and-dog');
    assert(runner.play('DRG').ok);
    runner.runBots();
    assert(runner.giveDragon(SEAT.EAST).ok);
    eq(runner.outcome, 'fail');
  });
});

describe('미니판 — 소원에 묶이면', () => {
  test('소원이 걸린 K 말고는 아무것도 못 낸다', () => {
    const runner = start('wish-pressure');
    eq(runner.state.turn, SEAT.SOUTH);
    eq(runner.state.wish, 13);

    eq(runner.play('GA').reason, 'WISH_UNFULFILLED', 'A가 더 세도 소원이 먼저다');
    eq(runner.pass().reason, 'WISH_UNFULFILLED', '패스도 안 된다');

    assert(runner.play('GK').ok);
    eq(runner.state.wish, null, '소원이 풀린다');
    eq(runner.outcome, 'success');
  });
});

describe('미니판 — 폭탄 타이밍', () => {
  test('두 번 참았다가 25점에 터뜨리면 성공', () => {
    const runner = start('bomb-timing');

    eq(runner.state.turn, SEAT.SOUTH);
    eq(sumPoints(runner.state.pile), 0, '첫 트릭에는 점수가 없다');
    assert(runner.pass().ok);
    runner.runBots();

    eq(runner.state.turn, SEAT.SOUTH);
    eq(sumPoints(runner.state.pile), 5, '두 번째 트릭은 아직 5점뿐');
    assert(runner.pass().ok);
    runner.runBots();

    eq(runner.state.turn, SEAT.SOUTH);
    eq(sumPoints(runner.state.pile), 25, '이제 25점이 쌓였다');

    assert(runner.play('G7 B7 U7 R7').ok, '폭탄으로 K를 잡는다');
    runner.runBots();

    eq(runner.outcome, 'success');
    assert(sumPoints(runner.state.tricks[SEAT.SOUTH]) >= 25);
  });

  test('점수 없는 첫 트릭에 터뜨리면 실패', () => {
    const runner = start('bomb-timing');
    assert(runner.play('G7 B7 U7 R7').ok);
    runner.runBots();
    eq(runner.outcome, 'fail');
  });
});

describe('미니판 — 파트너의 티츄 지켜주기', () => {
  test('A로 상대를 끊고 개로 선을 돌려주면 파트너가 1등', () => {
    const runner = start('partner-play');

    eq(runner.state.turn, SEAT.SOUTH);
    eq(runner.state.currentOwner, SEAT.WEST, '상대가 파트너를 덮은 상태');

    assert(runner.play('GA').ok);
    runner.runBots();

    eq(runner.state.turn, SEAT.SOUTH, '내가 트릭을 따서 선을 잡는다');
    assert(runner.play('DOG').ok);
    runner.runBots();

    eq(runner.outcome, 'success');
    eq(runner.state.finishOrder[0], SEAT.NORTH);
  });

  test('개를 쓰지 않으면 선이 상대에게 넘어가고 파트너가 1등을 못 한다', () => {
    const runner = start('partner-play');
    assert(runner.play('GA').ok);
    runner.runBots();
    assert(runner.play('G2').ok, '개 대신 2를 내면 선이 상대에게 넘어간다');
    runner.runBots();

    // 개는 리드로만 낼 수 있는데 선이 다시 오지 않는다. 손에 쥔 채 패스만 하게 된다.
    let guard = 0;
    while (!runner.outcome && !runner.state.done && guard < 20) {
      if (runner.needsPlayer() && !runner.pass().ok) break;
      runner.runBots();
      guard += 1;
    }

    eq(runner.outcome, 'fail');
    assert(runner.state.hands[SEAT.SOUTH].some((c) => c.id === 'DOG'),
      '개는 결국 손에 남는다 — 리드가 아니면 낼 수 없기 때문');
  });
});
