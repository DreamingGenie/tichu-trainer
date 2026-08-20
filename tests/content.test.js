// 콘텐츠 무결성.
//
// 레슨·퀴즈·미니판은 전부 손으로 쓴 데이터라 카드 표기 오타가 숨기 쉽고, 그런 오타는
// 그 화면에 들어가야만 드러난다. 여기서 전부 훑어 미리 잡는다.

import { assert, describe, eq, test } from './harness.js';
import { parseCard, parseHand } from '../src/engine/cards.js';
import { detectCombo } from '../src/engine/combos.js';
import { enumerateLegalPlays } from '../src/engine/legal.js';
import { wishStatus } from '../src/engine/wish.js';
import { CHAPTERS } from '../src/data/chapters.js';
import { MINIGAMES } from '../src/data/minigames/index.js';
import { SEAT_ORDER } from '../src/engine/seats.js';
import { createScenarioRunner } from '../src/engine/scenario.js';

/** 블록과 퀴즈에 들어 있는 모든 문자열을 끌어모은다. */
function allText(chapter) {
  const out = [];
  const walk = (value) => {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(chapter.blocks);
  walk(chapter.quizzes);
  return out;
}

describe('챕터 구성', () => {
  test('번호가 1부터 순서대로다', () => {
    CHAPTERS.forEach((chapter, i) => eq(chapter.num, i + 1, `${chapter.id}의 번호`));
  });

  test('id와 퀴즈 id가 전부 유일하다', () => {
    const chapterIds = new Set();
    const quizIds = new Set();
    for (const chapter of CHAPTERS) {
      assert(!chapterIds.has(chapter.id), `챕터 id 중복: ${chapter.id}`);
      chapterIds.add(chapter.id);
      for (const quiz of chapter.quizzes) {
        assert(!quizIds.has(quiz.id), `퀴즈 id 중복: ${quiz.id}`);
        quizIds.add(quiz.id);
      }
    }
  });

  test('본문의 [[카드]] 표기가 전부 실제 카드다', () => {
    for (const chapter of CHAPTERS) {
      for (const text of allText(chapter)) {
        for (const [, token] of text.matchAll(/\[\[([A-Z0-9]+)\]\]/g)) {
          try {
            parseCard(token);
          } catch {
            throw new Error(`${chapter.id}: 알 수 없는 카드 표기 [[${token}]]`);
          }
        }
      }
    }
  });

  test('예시로 쓴 카드 묶음이 전부 파싱된다', () => {
    for (const chapter of CHAPTERS) {
      for (const block of chapter.blocks) {
        if (block.kind === 'cards') parseHand(block.hand);
        if (block.kind === 'examples') block.items.forEach((item) => parseHand(item.hand));
      }
    }
  });
});

describe('퀴즈', () => {
  const quizzes = CHAPTERS.flatMap((chapter) => chapter.quizzes.map((quiz) => ({ chapter, quiz })));

  test('객관식은 정답이 정확히 하나다', () => {
    for (const { chapter, quiz } of quizzes) {
      if (quiz.mode !== 'choice') continue;
      const correct = quiz.choices.filter((c) => c.correct).length;
      eq(correct, 1, `${chapter.id}/${quiz.id}의 정답 개수`);
      assert(quiz.choices.every((c) => c.why), `${chapter.id}/${quiz.id}: 해설 없는 보기가 있다`);
    }
  });

  test('카드 문제는 풀 수 있는 문제다', () => {
    for (const { chapter, quiz } of quizzes) {
      if (quiz.mode !== 'select-cards') continue;

      const hand = parseHand(quiz.hand);
      const current = quiz.table ? detectCombo(parseHand(quiz.table)) : null;
      assert(!quiz.table || current, `${chapter.id}/${quiz.id}: 테이블 조합이 유효하지 않다`);

      const plays = enumerateLegalPlays(hand, current);
      assert(plays.length > 0, `${chapter.id}/${quiz.id}: 낼 수 있는 수가 하나도 없다`);

      if (quiz.wish) {
        assert(wishStatus(hand, current, quiz.wish).forced,
          `${chapter.id}/${quiz.id}: 소원을 걸어놨는데 이행할 수 있는 수가 없다`);
      }
      if (quiz.accept) {
        for (const set of quiz.accept) {
          const combo = detectCombo(parseHand(set));
          assert(combo, `${chapter.id}/${quiz.id}: 정답으로 적어둔 ${set}이 조합이 아니다`);
        }
      }
    }
  });

  test('손패에 없는 카드를 정답으로 적어두지 않았다', () => {
    for (const { chapter, quiz } of quizzes) {
      if (quiz.mode !== 'select-cards' || !quiz.accept) continue;
      const handIds = new Set(parseHand(quiz.hand).map((c) => c.id));
      for (const set of quiz.accept) {
        for (const card of parseHand(set)) {
          assert(handIds.has(card.id), `${chapter.id}/${quiz.id}: ${card.name}는 손패에 없다`);
        }
      }
    }
  });
});

describe('미니판 각본', () => {
  test('챕터가 가리키는 미니판이 전부 존재한다', () => {
    const ids = new Set(MINIGAMES.map((g) => g.id));
    for (const chapter of CHAPTERS) {
      for (const id of chapter.minigames) {
        assert(ids.has(id), `${chapter.id}가 없는 미니판 "${id}"를 가리킨다`);
      }
    }
  });

  test('미니판이 가리키는 챕터가 전부 존재한다', () => {
    const ids = new Set(CHAPTERS.map((c) => c.id));
    for (const game of MINIGAMES) {
      assert(ids.has(game.chapterId), `${game.id}가 없는 챕터 "${game.chapterId}"를 가리킨다`);
    }
  });

  // 짧은 판은 자기 챕터의 minigames 에 적혀 있어야 레슨 끝의 '이제 해볼 차례'에서
  // 이어진다. wish-pressure 가 목록 화면에서만 닿는 고아로 한동안 남아 있었다.
  test('짧은 판이 자기 챕터에 연결되어 있다', () => {
    for (const game of MINIGAMES) {
      const chapter = CHAPTERS.find((c) => c.id === game.chapterId);
      assert(
        chapter.minigames.includes(game.id),
        `${game.id} 가 "${chapter.title}" 챕터의 minigames 에 없다`,
      );
    }
  });

  test('한 판 안에서 같은 카드가 두 번 나오지 않는다', () => {
    for (const game of MINIGAMES) {
      const seen = new Map();
      for (const seat of SEAT_ORDER) {
        for (const card of parseHand(game.hands[seat] ?? '')) {
          assert(!seen.has(card.id),
            `${game.id}: ${card.name}가 ${seen.get(card.id)}와 ${seat} 양쪽에 있다`);
          seen.set(card.id, seat);
        }
      }
    }
  });

  test('각본의 수는 전부 그 사람 손에 있는 카드다', () => {
    for (const game of MINIGAMES) {
      for (const entry of game.script ?? []) {
        if (entry.action === 'pass') continue;
        const handIds = new Set(parseHand(game.hands[entry.seat]).map((c) => c.id));
        for (const card of parseHand(entry.cards)) {
          assert(handIds.has(card.id), `${game.id}: ${entry.seat}의 손에 ${card.name}가 없다`);
        }
      }
    }
  });

  // 각본은 사람 차례가 오면 멈췄다가 이어지므로 "전부 실행됐는지"로는 볼 수 없다.
  // 대신 실행된 구간에서 불법 수가 나와 각본이 통째로 버려지지 않았는지를 본다.
  test('사람의 첫 결정 전까지 각본이 버려지지 않는다', () => {
    for (const game of MINIGAMES) {
      const runner = createScenarioRunner(game);
      runner.runBots();
      assert(!runner.scriptAbandoned,
        `${game.id}: 도입부 각본에 합법이 아닌 수가 있어 봇 정책으로 넘어갔다`);
      assert(runner.state.log.some((e) => e.action === 'play'),
        `${game.id}: 각본이 한 수도 실행되지 않았다`);
    }
  });

  test('성공·실패 판정과 안내 문구가 갖춰져 있다', () => {
    for (const game of MINIGAMES) {
      assert(typeof game.successWhen === 'function', `${game.id}: successWhen이 없다`);
      assert(game.goal && game.intro && game.debrief, `${game.id}: 목표·상황·정리 중 빠진 게 있다`);
      assert(game.successText, `${game.id}: 성공 문구가 없다`);
    }
  });
});
