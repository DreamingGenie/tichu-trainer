// 미니판 각본을 실제 라운드로 돌리는 진행기.
//
// 화면(minigame-view)과 테스트가 이 코드를 함께 쓴다. 화면은 stepBot() 사이에 딜레이를
// 두어 사람이 따라갈 수 있게 하고, 테스트는 딜레이 없이 끝까지 돌린다. 진행 규칙이
// 두 곳에 나뉘어 있으면 "테스트는 통과하는데 화면은 다르게 도는" 상황이 생긴다.

import { parseHand } from './cards.js';
import { chooseBotMove } from './bot.js';
import { SEAT } from './seats.js';
import { createRound, giveDragonTrick, pass, playCards } from './trick.js';

const ME = SEAT.SOUTH;
const MAX_STEPS = 60; // 각본이 꼬여 무한 루프가 되는 걸 막는 안전장치

export function createScenarioRunner(game) {
  let state;
  let scriptIndex;
  let scriptAlive;
  let outcome;

  function reset() {
    state = createRound({
      hands: Object.fromEntries(
        Object.entries(game.hands).map(([seat, cards]) => [seat, parseHand(cards)]),
      ),
      startingSeat: game.startingSeat,
      wish: game.wish ?? null,
      calls: game.calls ?? {},
    });
    scriptIndex = 0;
    scriptAlive = Boolean(game.script?.length);
    outcome = null;
    checkOutcome();
  }

  function cardsFromHand(seat, tokens) {
    const want = new Set(parseHand(tokens).map((c) => c.id));
    return state.hands[seat].filter((c) => want.has(c.id));
  }

  /**
   * 성패는 상태가 정리된 시점에만 본다. 봇이 연달아 두는 도중에는 트릭이 아직
   * 넘어가지 않아 실패로 오판할 수 있다.
   */
  function checkOutcome() {
    if (outcome) return;
    if (game.successWhen(state)) {
      outcome = 'success';
      return;
    }
    const settled = state.done || state.turn === ME || Boolean(state.pendingDragon);
    if (settled && game.failWhen?.(state)) outcome = 'fail';
  }

  /** 지금 사람이 결정할 차례인가. */
  function needsPlayer() {
    if (outcome || state.done) return false;
    if (state.pendingDragon) return state.pendingDragon.winner === ME;
    return state.turn === ME;
  }

  /**
   * 봇 한 명의 한 수를 둔다.
   * @returns {boolean} 둘 게 있었으면 true
   */
  function stepBot() {
    if (outcome || state.done || needsPlayer()) return false;

    if (state.pendingDragon) {
      giveDragonTrick(state, state.pendingDragon.choices[0]);
      checkOutcome();
      return true;
    }

    const seat = state.turn;
    if (seat === ME) return false;

    const scripted = scriptAlive ? game.script?.[scriptIndex] : null;
    if (scripted && scripted.seat === seat) {
      const result = scripted.action === 'pass'
        ? pass(state, seat)
        : playCards(state, seat, cardsFromHand(seat, scripted.cards));
      if (result.ok) {
        scriptIndex += 1;
        checkOutcome();
        return true;
      }
      // 학습자가 각본과 다른 길로 갔다. 이제부터는 봇이 알아서 둔다.
      scriptAlive = false;
    }

    const move = chooseBotMove(state, seat);
    const result = move.action === 'pass' ? pass(state, seat) : playCards(state, seat, move.cards);
    if (!result.ok) pass(state, seat); // 봇이 낼 수 없다고 판단되면 넘어간다
    checkOutcome();
    return true;
  }

  /** 사람 차례가 오거나 판이 끝날 때까지 봇을 돌린다. */
  function runBots() {
    let steps = 0;
    while (steps < MAX_STEPS && stepBot()) steps += 1;
    checkOutcome();
    return steps;
  }

  function play(tokensOrCards) {
    const cards = typeof tokensOrCards === 'string' ? cardsFromHand(ME, tokensOrCards) : tokensOrCards;
    const result = playCards(state, ME, cards);
    if (result.ok) checkOutcome();
    return result;
  }

  function playerPass() {
    const result = pass(state, ME);
    if (result.ok) checkOutcome();
    return result;
  }

  function giveDragon(seat) {
    const result = giveDragonTrick(state, seat);
    if (result.ok) checkOutcome();
    return result;
  }

  reset();

  return {
    get state() { return state; },
    get outcome() { return outcome; },
    /** 각본을 버리고 봇 정책으로 넘어갔는가. 학습자가 예상 밖의 수를 두면 true가 된다. */
    get scriptAbandoned() { return Boolean(game.script?.length) && !scriptAlive; },
    /** 각본에서 아직 실행되지 않은 수의 개수. */
    get scriptRemaining() { return Math.max(0, (game.script?.length ?? 0) - scriptIndex); },
    reset, stepBot, runBots, needsPlayer, play, pass: playerPass, giveDragon,
  };
}
