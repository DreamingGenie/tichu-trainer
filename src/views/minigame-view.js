// 미니판 화면.
//
// 진행 규칙은 전부 engine/scenario.js 에 있고 여기는 그리기와 딜레이만 맡는다.
// 각본이 어긋나면(적힌 수가 더 이상 합법이 아니면) 진행기가 알아서 봇 정책으로
// 넘어가므로, 학습자가 예상 밖의 수를 둬도 화면이 멈추지 않는다.

import { createScenarioRunner } from '../engine/scenario.js';
import { SEAT, SEAT_LABEL } from '../engine/seats.js';
import { MINIGAMES, minigameById } from '../data/minigames/index.js';
import { chapterById } from '../data/chapters.js';
import { isMinigameCleared, recordMinigame } from '../store/progress.js';
import { element } from '../ui/dom.js';
import { htmlElement, inline, noteElement } from '../ui/markup.js';
import { verdictBox } from '../ui/verdict.js';
import { createHandView } from '../ui/hand-view.js';
import { renderLog, renderTable } from './minigame/table-view.js';
import { notFoundPanel } from './not-found-view.js';

const ME = SEAT.SOUTH;
const BOT_DELAY = 800;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

export function minigameView({ params }) {
  const game = minigameById(params.id);
  if (!game) return notFoundPanel(`"${params.id}" 미니판을 찾을 수 없습니다.`);

  const chapter = chapterById(game.chapterId);
  const runner = createScenarioRunner(game);
  let busy = false;
  let recorded = false;

  const root = element('div', 'stack stack--loose');

  // --- 머리말 ---
  const header = element('header', 'stack stack--tight');
  if (chapter) {
    const crumb = element('div', 'row');
    const back = element('a', 'btn btn--small btn--ghost', `← ${chapter.title}`);
    back.href = `#/chapter/${chapter.id}`;
    crumb.append(back);
    header.append(crumb);
  }
  header.append(element('h1', null, game.title));

  header.append(noteElement('note', '이 판의 목표', inline(game.goal)));
  header.append(htmlElement('p', 'lede', inline(game.intro)));

  // --- 자리 ---
  const tableSlot = element('div');
  const hintSlot = element('div', 'stack stack--tight');
  const handSlot = element('div', 'stack stack--tight');
  const actionSlot = element('div', 'row');
  const errorSlot = element('div');
  const outcomeSlot = element('div', 'stack');
  const logSlot = element('details', 'log-details');
  logSlot.append(element('summary', 'small muted', '진행 기록'));
  const logBody = element('div');
  logSlot.append(logBody);

  root.append(header, tableSlot, hintSlot, handSlot, actionSlot, errorSlot, outcomeSlot, logSlot);

  let handView = null;

  // --- 그리기 ---

  function render() {
    const state = runner.state;
    tableSlot.replaceChildren(renderTable(state));
    logBody.replaceChildren(renderLog(state));
    renderHints();
    renderHand();
    renderActions();
    renderOutcome();
  }

  function renderHints() {
    hintSlot.replaceChildren();
    if (runner.outcome || busy) return;
    for (const hint of game.hints ?? []) {
      if (!hint.when(runner.state)) continue;
      hintSlot.append(htmlElement('div', 'note note--warn', inline(hint.text)));
    }
  }

  function renderHand() {
    const myTurn = runner.needsPlayer() && !busy && !runner.state.pendingDragon;
    handView = createHandView({
      cards: runner.state.hands[ME],
      current: runner.state.current,
      wish: runner.state.wish,
      dimUnplayable: myTurn,
      onChange: renderActions,
    });
    handSlot.replaceChildren(
      element('div', 'small muted', myTurn ? '내 차례입니다. 낼 카드를 고르세요.' : '내 손패'),
      handView.element,
    );
  }

  function renderActions() {
    actionSlot.replaceChildren();
    const state = runner.state;

    if (state.pendingDragon?.winner === ME) {
      actionSlot.append(element('span', 'small', '용으로 딴 무더기를 누구에게 줄까요?'));
      for (const seat of state.pendingDragon.choices) {
        const button = element('button', 'btn btn--primary', SEAT_LABEL[seat]);
        button.type = 'button';
        button.addEventListener('click', () => act(() => runner.giveDragon(seat)));
        actionSlot.append(button);
      }
      actionSlot.append(restartButton('처음부터'));
      return;
    }

    if (runner.outcome || state.done) {
      actionSlot.append(restartButton());
      return;
    }

    const myTurn = runner.needsPlayer() && !busy;
    const selected = handView?.getSelected() ?? [];

    const play = element('button', 'btn btn--primary', '이대로 내기');
    play.type = 'button';
    play.disabled = !myTurn || selected.length === 0;
    play.addEventListener('click', () => act(() => runner.play(handView.getSelected())));

    const passBtn = element('button', 'btn', '패스');
    passBtn.type = 'button';
    passBtn.disabled = !myTurn || !state.current;
    passBtn.addEventListener('click', () => act(() => runner.pass()));

    actionSlot.append(play, passBtn, restartButton('처음부터'));
    if (busy) actionSlot.append(element('span', 'small muted', '다른 사람이 두는 중…'));
  }

  function restartButton(label = '다시 하기') {
    const button = element('button', 'btn btn--ghost', label);
    button.type = 'button';
    button.addEventListener('click', () => {
      runner.reset();
      errorSlot.replaceChildren();
      outcomeSlot.replaceChildren();
      render();
      if (!runner.needsPlayer()) runBots();
    });
    return button;
  }

  function renderOutcome() {
    if (!runner.outcome) {
      outcomeSlot.replaceChildren(runner.state.done
        ? verdictBox('neutral', '판이 끝났습니다', '목표는 이루지 못했습니다. 다시 해보세요.')
        : document.createTextNode(''));
      return;
    }

    if (runner.outcome === 'success' && !recorded) {
      recordMinigame(game.chapterId, game.id);
      recorded = true;
    }

    const wrap = element('div', 'stack');
    const text = runner.outcome === 'success' ? game.successText : game.failText;
    wrap.append(verdictBox(
      runner.outcome === 'success' ? 'ok' : 'bad',
      runner.outcome === 'success' ? '성공했습니다' : '아쉽습니다',
      (typeof text === 'function' ? text(runner.state) : text) ?? '',
    ));

    wrap.append(noteElement('note', '정리', inline(game.debrief)));

    const actions = element('div', 'row');
    actions.append(restartButton('한 번 더'));
    if (chapter) {
      const back = element('a', 'btn btn--primary', `${chapter.title}로 돌아가기`);
      back.href = `#/chapter/${chapter.id}`;
      actions.append(back);
    }
    wrap.append(actions);
    outcomeSlot.replaceChildren(wrap);
  }

  // --- 진행 ---

  /** 사람의 한 수. 규칙에 걸리면 실패가 아니라 이유를 알려주고 다시 고르게 한다. */
  function act(move) {
    const result = move();
    if (result && result.ok === false) {
      errorSlot.replaceChildren(verdictBox('bad', '그 수는 낼 수 없습니다', result.message));
      return;
    }
    errorSlot.replaceChildren();
    render();
    if (!runner.needsPlayer()) runBots();
  }

  async function runBots() {
    if (busy) return;
    busy = true;
    render();
    while (runner.stepBot()) {
      render();
      await sleep(BOT_DELAY);
    }
    busy = false;
    render();
  }

  render();
  if (!runner.needsPlayer()) runBots();
  return root;
}

/** 미니판 전체 목록. */
export function minigameIndexView() {
  const root = element('div', 'stack stack--loose');
  const header = element('header', 'stack stack--tight');
  header.append(element('h1', null, '미니판'));
  header.append(element('p', 'lede', '짧은 판을 직접 두면서 규칙이 몸에 붙었는지 확인해보세요.'));
  root.append(header);

  const grid = element('div', 'chapter-grid');
  for (const game of MINIGAMES) {
    const link = element('a', 'chapter-card');
    link.href = `#/minigame/${game.id}`;
    const text = element('span', 'stack stack--tight');
    text.append(element('span', 'chapter-card__title', game.title));
    text.append(element('span', 'chapter-card__sub', game.goal));
    if (isMinigameCleared(game.chapterId, game.id)) {
      link.classList.add('is-done');
      text.append(element('span', 'badge badge--ok', '클리어'));
    }
    link.append(element('span', 'chapter-card__num', isMinigameCleared(game.chapterId, game.id) ? '✓' : '▶'), text);
    grid.append(link);
  }
  root.append(grid);
  return root;
}
