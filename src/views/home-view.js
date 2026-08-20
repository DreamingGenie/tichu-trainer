import { CHAPTERS } from '../data/chapters.js';
import { parseHand } from '../engine/cards.js';
import { chapterStatus, overallProgress, resetProgress } from '../store/progress.js';
import { cardElement } from '../ui/card-view.js';
import { element } from '../ui/dom.js';

// 히어로에 펼쳐 놓는 손패. 실제 한 판에서 나올 법한 열한 장이고, 수트가 골고루 섞이도록
// 골랐다. 장식이라 스크린리더에는 숨긴다.
const HERO_HAND = 'G3 B4 U6 R7 G8 B9 U10 RJ GQ BK UA';

function heroFan() {
  const cards = parseHand(HERO_HAND);
  const fan = element('div', 'hero-fan');
  fan.setAttribute('aria-hidden', 'true');
  fan.style.setProperty('--n', String(cards.length));
  // 부채가 벌어지는 각도. 미니판의 손패와 같은 방식이되, 얼굴이 보이는 카드라 더 완만하게 편다.
  fan.style.setProperty('--fan-step', `${Math.min(5, 46 / cards.length)}deg`);
  cards.forEach((card, i) => {
    const node = cardElement(card);
    node.style.setProperty('--i', String(i));
    fan.append(node);
  });
  return fan;
}

function chapterCard(chapter) {
  const status = chapterStatus(chapter);
  const link = element('a', 'chapter-card');
  link.href = `#/chapter/${chapter.id}`;
  if (status.complete) link.classList.add('is-done');

  // 번호는 카드 한 장의 모양을 빌린다. 수트 색은 차례대로 돌아가는데, 카드 면 위에
  // 얹히는 글자라 테마를 안 타는 --suit-ink-* 쪽을 쓴다.
  const num = element('span', 'chapter-card__rank', String(chapter.num));
  num.style.setProperty('--suit', `var(${SUIT_INKS[(chapter.num - 1) % SUIT_INKS.length]})`);
  link.append(num);

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
  return link;
}

const SUIT_INKS = ['--suit-ink-jade', '--suit-ink-sword', '--suit-ink-pagoda', '--suit-ink-star'];

function sectionHead(title, note) {
  const head = element('div', 'section-head');
  head.append(element('h2', null, title));
  head.append(element('span', 'section-head__rule'));
  head.append(element('span', 'small muted', note));
  return head;
}

export function homeView() {
  const root = element('div', 'stack stack--loose');

  const hero = element('header', 'felt hero');
  hero.append(element('p', 'hero__eyebrow', '손에 든 열한 장'));
  hero.append(element('h1', null, '티츄, 읽지 말고 해보면서 배우기'));
  hero.append(element('p', 'hero__lede measure',
    '말로 설명하면 복잡한데 몇 판 해보면 금방 감이 옵니다. 그래서 이 사이트는 규칙을 읽는 대신 '
    + '직접 카드를 골라보고, 상황마다 무엇이 최선인지 풀어보게 만들었습니다.'));
  hero.append(heroFan());
  root.append(hero);

  const done = CHAPTERS.filter((chapter) => chapterStatus(chapter).complete).length;
  const percent = Math.round(overallProgress(CHAPTERS) * 100);

  const chapters = element('section', 'stack');
  chapters.append(sectionHead('열 개의 장', `${done}장 끝냄 · 연습 ${percent}%`));
  const grid = element('div', 'chapter-grid');
  for (const chapter of CHAPTERS) grid.append(chapterCard(chapter));
  chapters.append(grid);
  root.append(chapters);

  const tools = element('section', 'felt banner');
  const toolText = element('div', 'stack stack--tight');
  toolText.append(element('h2', null, '조합 판정 샌드박스'));
  toolText.append(element('p', 'measure',
    '카드를 아무렇게나 골라보면 그게 무슨 조합인지, 테이블에 깔린 걸 이기는지 바로 알려줍니다. '
    + '규칙이 헷갈릴 때 여기서 직접 확인해보세요.'));
  tools.append(toolText);
  const open = element('a', 'btn banner__action', '샌드박스 열기');
  open.href = '#/sandbox';
  tools.append(open);
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
