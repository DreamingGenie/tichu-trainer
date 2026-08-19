import { chapterById, neighbours } from '../data/chapters.js';
import { minigameById } from '../data/minigames/index.js';
import { chapterStatus, markRead } from '../store/progress.js';
import { renderBlocks } from '../ui/blocks.js';
import { element } from '../ui/format.js';

export function lessonView({ params }) {
  const chapter = chapterById(params.id);
  if (!chapter) return notFoundPanel(`"${params.id}" 챕터를 찾을 수 없습니다.`);

  // 챕터를 열었다는 것만으로 읽음 처리한다. 끝까지 스크롤했는지까지 따지면
  // 진도가 안 올라가서 답답해지고, 어차피 퀴즈와 미니판이 진짜 진도를 잰다.
  markRead(chapter.id);

  const root = element('article', 'stack stack--loose');

  const header = element('header', 'stack stack--tight');
  const crumb = element('div', 'row');
  const back = element('a', 'btn btn--small btn--ghost', '← 목록');
  back.href = '#/';
  crumb.append(back, element('span', 'small muted', `${chapter.num} / 10`));
  header.append(crumb);
  header.append(element('h1', null, chapter.title));
  header.append(element('p', 'lede', chapter.subtitle));
  root.append(header);

  root.append(renderBlocks(chapter.blocks));

  // --- 연습 ---
  const status = chapterStatus(chapter);
  const practice = element('section', 'panel stack');
  practice.append(element('h2', null, '이제 해볼 차례'));

  if (chapter.quizzes.length) {
    const row = element('div', 'row');
    const link = element('a', 'btn btn--primary', `연습문제 ${chapter.quizzes.length}개 풀기`);
    link.href = `#/quiz/${chapter.id}`;
    row.append(link);
    if (status.quizDone) {
      row.append(element('span', 'badge badge--ok', `${status.quizDone}/${status.quizTotal} 완료`));
    }
    practice.append(row);
  }

  for (const id of chapter.minigames) {
    const game = minigameById(id);
    if (!game) continue;
    const row = element('div', 'row');
    const link = element('a', 'btn', `미니판 — ${game.title}`);
    link.href = `#/minigame/${id}`;
    row.append(link);
    row.append(element('span', 'small muted', game.goal));
    practice.append(row);
  }

  if (!chapter.quizzes.length && !chapter.minigames.length) {
    practice.append(element('p', 'muted', '이 챕터는 읽는 것으로 충분합니다.'));
  }
  root.append(practice);

  // --- 앞뒤 이동 ---
  const { prev, next } = neighbours(chapter.id);
  const nav = element('nav', 'row lesson-nav');
  if (prev) {
    const link = element('a', 'btn btn--ghost', `← ${prev.title}`);
    link.href = `#/chapter/${prev.id}`;
    nav.append(link);
  }
  nav.append(element('span', 'spacer'));
  if (next) {
    const link = element('a', 'btn', `${next.title} →`);
    link.href = `#/chapter/${next.id}`;
    nav.append(link);
  }
  root.append(nav);

  return root;
}

export function notFoundPanel(message) {
  const panel = element('div', 'panel stack');
  panel.append(element('h1', null, '길을 잃었습니다'));
  panel.append(element('p', 'muted', message ?? '없는 주소입니다.'));
  const link = element('a', 'btn btn--primary', '목록으로 돌아가기');
  link.href = '#/';
  const row = element('div', 'row');
  row.append(link);
  panel.append(row);
  return panel;
}
