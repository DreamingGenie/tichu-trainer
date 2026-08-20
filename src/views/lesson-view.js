import { chapterById, neighbours } from '../data/chapters.js';
import { minigameById } from '../data/minigames/index.js';
import { chapterStatus, markRead } from '../store/progress.js';
import { renderBlocks } from './lesson/blocks.js';
import { createSpotlight } from './lesson/spotlight.js';
import { element } from '../ui/dom.js';
import { notFoundPanel } from './not-found-view.js';

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
  header.append(element('p', 'lede measure', chapter.subtitle));
  root.append(header);

  const { body, spotlights } = renderBlocks(chapter.blocks);
  const spotlight = createSpotlight(spotlights);

  if (spotlight) {
    const layout = element('div', 'lesson-layout');
    layout.append(body);
    const rail = element('div', 'lesson-rail');
    rail.append(spotlight.element);
    layout.append(rail);
    root.append(layout);
    // 화면이 통째로 교체되면 옵저버도 같이 사라진다. 라우터가 outlet 을
    // replaceChildren 하므로 노드가 떨어져 나갈 때 끊어 준다.
    const stop = spotlight.observe(body);
    new MutationObserver((records, self) => {
      if (root.isConnected) return;
      stop();
      self.disconnect();
    }).observe(document.getElementById('app'), { childList: true });
  } else {
    root.append(body);
  }

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

