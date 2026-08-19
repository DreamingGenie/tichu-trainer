// 챕터 목록. 순서는 배우는 순서 그대로다.

import intro from './lessons/01-intro.js';
import deck from './lessons/02-deck.js';
import combos from './lessons/03-combos.js';
import trick from './lessons/04-trick.js';
import specials from './lessons/05-specials.js';
import bombs from './lessons/06-bombs.js';
import dealing from './lessons/07-dealing.js';
import tichuCall from './lessons/08-tichu-call.js';
import scoring from './lessons/09-scoring.js';
import partner from './lessons/10-partner.js';

const RAW = [intro, deck, combos, trick, specials, bombs, dealing, tichuCall, scoring, partner];

export const CHAPTERS = RAW.map((chapter) => ({
  ...chapter,
  quizzes: chapter.quizzes ?? [],
  minigames: chapter.minigames ?? [],
  quizCount: (chapter.quizzes ?? []).length,
}));

const BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]));

export function chapterById(id) {
  return BY_ID.get(id) ?? null;
}

/** 앞뒤 챕터. 레슨 하단의 이동 버튼에 쓴다. */
export function neighbours(id) {
  const index = CHAPTERS.findIndex((c) => c.id === id);
  return {
    prev: index > 0 ? CHAPTERS[index - 1] : null,
    next: index >= 0 && index < CHAPTERS.length - 1 ? CHAPTERS[index + 1] : null,
  };
}

/** 어떤 챕터에 속한 퀴즈인지 찾는다. */
export function quizById(chapterId, quizId) {
  return chapterById(chapterId)?.quizzes.find((q) => q.id === quizId) ?? null;
}
