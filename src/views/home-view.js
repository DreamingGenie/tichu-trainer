import { CHAPTERS } from '../data/chapters.js';
import { chapterStatus, overallProgress, resetProgress } from '../store/progress.js';
import { element } from '../ui/format.js';

export function homeView() {
  const root = element('div', 'stack stack--loose');

  const hero = element('header', 'stack');
  hero.append(element('h1', null, '티츄, 읽지 말고 해보면서 배우기'));
  hero.append(element('p', 'lede',
    '티츄는 말로 설명하면 복잡한데 몇 판 해보면 금방 감이 옵니다. 그래서 이 사이트는 규칙을 읽는 대신 '
    + '직접 카드를 골라보고, 상황마다 무엇이 최선인지 풀어보게 만들었습니다.'));

  const ratio = overallProgress(CHAPTERS);
  const bar = element('div', 'progress');
  const fill = element('div', 'progress__fill');
  fill.style.width = `${Math.round(ratio * 100)}%`;
  bar.append(fill);
  hero.append(bar);
  hero.append(element('p', 'small muted', `전체 진도 ${Math.round(ratio * 100)}%`));
  root.append(hero);

  const grid = element('div', 'chapter-grid');
  for (const chapter of CHAPTERS) {
    const status = chapterStatus(chapter);
    const link = element('a', 'chapter-card');
    link.href = `#/chapter/${chapter.id}`;
    if (status.complete) link.classList.add('is-done');

    link.append(element('span', 'chapter-card__num', status.complete ? '✓' : String(chapter.num)));

    const text = element('span', 'stack stack--tight');
    text.append(element('span', 'chapter-card__title', chapter.title));
    text.append(element('span', 'chapter-card__sub', chapter.subtitle));

    const tags = element('span', 'row');
    if (status.quizTotal) {
      const badge = element('span', 'badge', `퀴즈 ${status.quizDone}/${status.quizTotal}`);
      if (status.quizDone === status.quizTotal) badge.classList.add('badge--ok');
      tags.append(badge);
    }
    if (status.minigameTotal) {
      const badge = element('span', 'badge', `미니판 ${status.minigameDone}/${status.minigameTotal}`);
      if (status.minigameDone === status.minigameTotal) badge.classList.add('badge--ok');
      tags.append(badge);
    }
    if (tags.children.length) text.append(tags);

    link.append(text);
    grid.append(link);
  }
  root.append(grid);

  const tools = element('section', 'panel stack');
  tools.append(element('h2', null, '조합 판정 샌드박스'));
  tools.append(element('p', 'muted',
    '카드를 아무렇게나 골라보면 그게 무슨 조합인지, 테이블에 깔린 걸 이기는지 바로 알려줍니다. '
    + '규칙이 헷갈릴 때 여기서 직접 확인해보세요.'));
  const open = element('a', 'btn btn--primary', '샌드박스 열기');
  open.href = '#/sandbox';
  const toolRow = element('div', 'row');
  toolRow.append(open);
  tools.append(toolRow);
  root.append(tools);

  const footer = element('div', 'row');
  const reset = element('button', 'btn btn--small btn--ghost', '진도 초기화');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    if (confirm('지금까지의 진도를 모두 지웁니다. 계속할까요?')) {
      resetProgress();
      location.reload();
    }
  });
  footer.append(reset);
  root.append(footer);

  return root;
}
