// 퀴즈 화면.
//
// 카드를 고르는 문제는 정답 배열을 문자열로 비교하지 않고 **엔진으로 채점**한다.
// 그래야 정답이 여러 개인 문제를 다룰 수 있고, 틀렸을 때 "장수가 다르다 / 소원을
// 안 지켰다 / 못 이긴다"를 구분해서 알려줄 수 있다. 그 구분이 이 사이트의 핵심이다.

import { parseHand } from '../engine/cards.js';
import { detectCombo } from '../engine/combos.js';
import { checkPlay } from '../engine/compare.js';
import { enumerateLegalPlays } from '../engine/legal.js';
import { checkWish, wishStatus } from '../engine/wish.js';
import { chapterById, neighbours } from '../data/chapters.js';
import { navigate } from '../router.js';
import { recordQuiz } from '../store/progress.js';
import { describeCombo } from '../engine/describe.js';
import { cardElement } from '../ui/card-view.js';
import { element } from '../ui/dom.js';
import { htmlElement, inline } from '../ui/markup.js';
import { verdictBox } from '../ui/verdict.js';
import { createHandView } from '../ui/hand-view.js';

/** 문제 지문. [[GK]] 같은 표기를 카드 이름으로 바꿔 보여준다. */
function promptNode(text) {
  return htmlElement('p', 'quiz__prompt', inline(text));
}

export function quizView({ params }) {
  const chapter = chapterById(params.id);
  if (!chapter || !chapter.quizzes.length) {
    const missing = element('div', 'panel');
    missing.append(element('p', null, '이 챕터에는 퀴즈가 없습니다.'));
    return missing;
  }

  const root = element('div', 'stack stack--loose');
  let index = 0;
  let answeredCorrectly = 0;

  const header = element('div', 'stack stack--tight');
  const body = element('div');
  root.append(header, body);

  function renderHeader() {
    header.replaceChildren();
    const crumb = element('div', 'row');
    const back = element('a', 'btn btn--small btn--ghost', `← ${chapter.title}`);
    back.href = `#/chapter/${chapter.id}`;
    crumb.append(back);
    header.append(crumb);

    // 이 화면의 주인공은 지금 풀고 있는 문제지 챕터 이름이 아니다. 제목은 h1 으로
    // 두되(스크린리더와 라우터가 이걸 잡는다) 눈에는 조용하게 둔다.
    header.append(element('h1', 'quiz__title', `${chapter.title} — 연습문제`));

    // 막대 대신 문제 수만큼의 칸. 몇 번째인지가 비율보다 알고 싶은 정보다.
    const dots = element('div', 'quiz-steps');
    dots.setAttribute('role', 'img');
    dots.setAttribute('aria-label', `${chapter.quizzes.length}문제 중 ${Math.min(index + 1, chapter.quizzes.length)}번째`);
    chapter.quizzes.forEach((_, i) => {
      const dot = element('span', 'quiz-steps__dot');
      if (i < index) dot.classList.add('is-done');
      else if (i === index) dot.classList.add('is-current');
      dots.append(dot);
    });
    const steps = element('div', 'row');
    steps.append(dots);
    steps.append(element('span', 'small muted',
      index >= chapter.quizzes.length ? '끝' : `${index + 1} / ${chapter.quizzes.length}`));
    header.append(steps);
  }

  function renderDone() {
    body.replaceChildren();
    const panel = element('div', 'panel stack');
    const all = chapter.quizzes.length;
    panel.append(element('h2', null, answeredCorrectly === all ? '전부 맞혔습니다' : '연습 끝'));
    panel.append(element('p', null, `${all}문제 중 ${answeredCorrectly}문제를 한 번에 맞혔습니다.`));

    const actions = element('div', 'row');
    const retry = element('button', 'btn', '다시 풀기');
    retry.type = 'button';
    retry.addEventListener('click', () => { index = 0; answeredCorrectly = 0; render(); });
    actions.append(retry);

    const { next } = neighbours(chapter.id);
    if (next) {
      const go = element('button', 'btn btn--primary', `다음 챕터 — ${next.title}`);
      go.type = 'button';
      go.addEventListener('click', () => navigate(`/chapter/${next.id}`));
      actions.append(go);
    } else {
      const home = element('button', 'btn btn--primary', '목록으로');
      home.type = 'button';
      home.addEventListener('click', () => navigate('/'));
      actions.append(home);
    }

    panel.append(actions);
    body.append(panel);
  }

  /** 맞혔을 때만 부른다. firstTry 면 '한 번에 맞힌 문제' 로도 센다. */
  function advance(firstTry) {
    recordQuiz(chapter.id, chapter.quizzes[index].id);
    if (firstTry) answeredCorrectly += 1;
  }

  function render() {
    renderHeader();
    if (index >= chapter.quizzes.length) {
      renderDone();
      return;
    }
    const quiz = chapter.quizzes[index];
    body.replaceChildren(quiz.mode === 'choice' ? choiceQuestion(quiz) : cardQuestion(quiz));
  }

  function nextButton() {
    const button = element('button', 'btn btn--primary', index === chapter.quizzes.length - 1 ? '결과 보기' : '다음 문제');
    button.type = 'button';
    button.addEventListener('click', () => { index += 1; render(); });
    return button;
  }

  // --- 객관식 -------------------------------------------------------

  function choiceQuestion(quiz) {
    const panel = element('div', 'stack stack--loose');
    panel.append(promptNode(quiz.prompt));

    const options = element('div', 'stack stack--tight');
    const feedback = element('div', 'stack stack--tight');
    let settled = false;
    let firstTry = true;

    quiz.choices.forEach((choice) => {
      const button = htmlElement('button', 'choice', inline(choice.text));
      button.type = 'button';
      button.addEventListener('click', () => {
        if (settled) return;
        button.classList.add(choice.correct ? 'is-correct' : 'is-wrong');

        feedback.replaceChildren(verdictBox(
          choice.correct ? 'ok' : 'bad',
          choice.correct ? '맞습니다' : '아쉽습니다',
          inline(choice.why),
          { html: true },
        ));

        if (choice.correct) {
          settled = true;
          advance(firstTry);
          for (const b of options.querySelectorAll('.choice')) b.disabled = true;
          if (quiz.explain) feedback.append(htmlElement('div', 'note', inline(quiz.explain)));
          feedback.append(nextButton());
        } else {
          firstTry = false;
          button.disabled = true;
        }
      });
      options.append(button);
    });

    panel.append(options, feedback);
    return panel;
  }

  // --- 카드 고르기 ---------------------------------------------------

  function cardQuestion(quiz) {
    const panel = element('div', 'stack stack--loose');
    panel.append(promptNode(quiz.prompt));

    const hand = parseHand(quiz.hand);
    const current = quiz.table ? detectCombo(parseHand(quiz.table)) : null;
    const wish = quiz.wish ?? null;

    // 테이블 상황
    const table = element('div', 'quiz__table felt');
    table.append(element('div', 'quiz__table-eyebrow', current ? '테이블 위' : '새 트릭을 여는 상황입니다'));
    if (current) {
      table.append(element('div', 'table-call', describeCombo(current)));
      const row = element('div', 'card-row');
      for (const card of parseHand(quiz.table)) row.append(cardElement(card));
      table.append(row);
    }
    if (wish) {
      table.append(htmlElement('div', 'note note--warn',
        inline(`참새의 소원이 **${quiz.wishLabel ?? wish}**로 걸려 있습니다.`)));
    }
    panel.append(table);

    const feedback = element('div', 'stack stack--tight');
    let settled = false;
    let firstTry = true;

    const handView = createHandView({
      cards: hand,
      current,
      wish,
      dimUnplayable: false, // 퀴즈에서는 힌트를 주지 않는다. 스스로 판단해야 배운다.
      onChange: () => {
        if (!settled) feedback.replaceChildren();
        const count = handView.getSelected().length;
        submit.disabled = count === 0;
        clear.hidden = count === 0;
        handLabel.textContent = count ? `내 손패 · ${count}장 골랐음` : '내 손패';
      },
    });
    const handLabel = element('div', 'quiz__hand-label', '내 손패');
    const handBlock = element('div', 'stack stack--tight');
    handBlock.append(handLabel, handView.element);
    panel.append(handBlock);

    const submit = element('button', 'btn btn--primary', '이대로 내기');
    submit.type = 'button';
    submit.disabled = true;
    submit.addEventListener('click', () => grade(handView.getSelected()));

    const actions = element('div', 'row');
    actions.append(submit);

    if (quiz.allowPass) {
      const passBtn = element('button', 'btn', '낼 게 없다');
      passBtn.type = 'button';
      passBtn.addEventListener('click', () => grade(null));
      actions.append(passBtn);
    }

    // 고른 걸 무르는 길이 없으면 카드를 하나씩 다시 눌러 빼야 한다.
    const clear = element('button', 'btn btn--ghost', '선택 해제');
    clear.type = 'button';
    clear.hidden = true;
    clear.addEventListener('click', () => handView.clear());
    actions.append(element('span', 'spacer'), clear);

    panel.append(actions, feedback);

    function settle() {
      settled = true;
      advance(firstTry);
      submit.disabled = true;
      for (const b of actions.querySelectorAll('button')) b.disabled = true;
      if (quiz.explain) feedback.append(htmlElement('div', 'note', inline(quiz.explain)));
      feedback.append(nextButton());
    }

    function grade(selected) {
      if (settled) return;

      if (selected === null) {
        const forced = wish && wishStatus(hand, current, wish).forced;
        const canPass = Boolean(current) && !forced;
        if (quiz.expectPass && canPass) {
          feedback.replaceChildren(verdictBox('ok', '맞습니다', '여기서는 패스가 정답입니다.'));
          settle();
        } else {
          firstTry = false;
          feedback.replaceChildren(verdictBox('bad', '패스할 수 없습니다',
            forced ? '소원이 걸려 있고 이행할 수 있는 상황이라 패스가 안 됩니다.'
              : !current ? '선을 잡았을 때는 반드시 무언가 내야 합니다.'
                : '여기서는 낼 수 있는 카드가 있습니다. 찾아보세요.'));
        }
        return;
      }

      const play = checkPlay(selected, current);
      if (!play.ok) {
        firstTry = false;
        feedback.replaceChildren(verdictBox('bad',
          play.combo ? `${describeCombo(play.combo)} — 하지만 못 냅니다` : '낼 수 없는 조합입니다',
          play.message));
        return;
      }

      const wishCheck = checkWish(hand, current, wish, play.combo);
      if (!wishCheck.ok) {
        firstTry = false;
        feedback.replaceChildren(verdictBox('bad', '소원을 지키지 않았습니다', wishCheck.message));
        return;
      }

      if (quiz.accept) {
        const chosen = selected.map((c) => c.id).sort().join(',');
        const ok = quiz.accept.some((set) => parseHand(set).map((c) => c.id).sort().join(',') === chosen);
        if (!ok) {
          firstTry = false;
          feedback.replaceChildren(verdictBox('bad', `${describeCombo(play.combo)} — 낼 수는 있지만`,
            quiz.betterHint ?? '규칙상 문제는 없습니다. 하지만 이 상황에서 더 나은 수가 있습니다.'));
          return;
        }
      }

      feedback.replaceChildren(verdictBox('ok', `${describeCombo(play.combo)} — 좋습니다`,
        `이 손패로 낼 수 있는 방법은 ${enumerateLegalPlays(hand, current).length}가지였습니다.`));
      settle();
    }

    return panel;
  }

  render();
  return root;
}
