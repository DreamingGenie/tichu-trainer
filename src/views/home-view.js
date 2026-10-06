import { CHAPTERS } from '../data/chapters.js';
import { MINIGAMES } from '../data/minigames/index.js';
import { SUIT_ORDER, parseHand } from '../engine/cards.js';
import { chapterStatus, resetProgress } from '../store/progress.js';
import { cardElement, suitGlyphSvg } from '../ui/card-view.js';
import { element } from '../ui/dom.js';

// 히어로에 펼쳐 놓는 손패. 특수카드 셋을 양끝과 끝 가까이 섞어, 이 게임에 숫자카드만
// 있는 게 아니라는 걸 첫 화면에서 보여준다. 장식이라 스크린리더에는 숨긴다.
const HERO_HAND = 'MAH U5 G8 R10 BJ UQ RK PHX DRG';

function heroFan() {
  const cards = parseHand(HERO_HAND);
  const fan = element('div', 'hero-fan');
  fan.setAttribute('aria-hidden', 'true');
  fan.style.setProperty('--n', String(cards.length));
  cards.forEach((card, i) => {
    const node = cardElement(card);
    node.style.setProperty('--i', String(i));
    fan.append(node);
  });
  return fan;
}

/** 아직 끝내지 않은 첫 챕터. 다 끝냈으면 null. */
function nextChapter() {
  return CHAPTERS.find((chapter) => !chapterStatus(chapter).complete) ?? null;
}

function hero() {
  const root = element('header', 'felt hero');

  const text = element('div', 'hero__text');
  text.append(element('p', 'hero__eyebrow', '보드게임 티츄 연습장'));
  text.append(element('h1', null, '티츄, 읽지 말고 해보면서 배우기'));
  text.append(element('p', 'hero__lede',
    '말로 설명하면 복잡한데 몇 판 해보면 금방 감이 옵니다. 그래서 이 사이트는 규칙을 읽는 대신 '
    + '직접 카드를 골라보고, 상황마다 무엇이 최선인지 풀어보게 만들었습니다.'));

  // 처음 온 사람에게는 1장, 하던 사람에게는 멈춘 장을 내민다.
  const next = nextChapter();
  const actions = element('div', 'row hero__actions');
  const start = element('a', 'btn btn--primary',
    !next ? '처음부터 다시 보기' : next.num === 1 ? '1장부터 시작' : `${next.num}장 이어서 하기`);
  start.href = `#/chapter/${(next ?? CHAPTERS[0]).id}`;
  const play = element('a', 'btn btn--ghost', '짧은 판 바로 두기');
  play.href = '#/minigame';
  actions.append(start, play);
  text.append(actions);

  root.append(text, heroFan());
  return root;
}

function chapterCard(chapter, isCurrent) {
  const status = chapterStatus(chapter);
  const link = element('a', 'chapter-card');
  link.href = `#/chapter/${chapter.id}`;
  link.classList.toggle('is-done', status.complete);
  link.classList.toggle('is-current', isCurrent);
  if (isCurrent) link.setAttribute('aria-current', 'step');

  // 모서리 표시는 카드 한 장의 왼쪽 위처럼 — 번호 위, 문양 아래. 수트는 차례대로 돈다.
  // 카드 면 위의 글자라 테마를 안 타는 --suit-ink-* 쪽을 쓴다.
  const suit = SUIT_ORDER[(chapter.num - 1) % SUIT_ORDER.length];
  const corner = element('span', 'chapter-card__corner');
  corner.style.setProperty('--suit', `var(--suit-ink-${suit})`);
  corner.setAttribute('aria-hidden', 'true');
  corner.append(element('span', 'chapter-card__rank', String(chapter.num)));
  const glyph = element('span', 'chapter-card__suit');
  glyph.innerHTML = suitGlyphSvg(suit);
  corner.append(glyph);
  link.append(corner);

  link.append(element('span', 'chapter-card__title', chapter.title));
  link.append(element('span', 'chapter-card__sub', chapter.subtitle));

  // 퀴즈는 개수가 적어서(2~4개) 숫자보다 점이 빨리 읽힌다. 숫자는 스크린리더용으로 남긴다.
  const foot = element('span', 'chapter-card__foot');
  if (status.quizTotal) {
    const pips = element('span', 'pips');
    pips.setAttribute('role', 'img');
    pips.setAttribute('aria-label', `퀴즈 ${status.quizTotal}개 중 ${status.quizDone}개 맞힘`);
    for (let i = 0; i < status.quizTotal; i += 1) {
      pips.append(element('span', i < status.quizDone ? 'pip is-on' : 'pip'));
    }
    foot.append(pips);
  }
  if (status.minigameTotal) {
    foot.append(element('span', 'chapter-card__game',
      `짧은 판 ${status.minigameDone}/${status.minigameTotal}`));
  }
  if (status.complete) foot.append(element('span', 'chapter-card__state', '끝냄'));
  else if (isCurrent) foot.append(element('span', 'chapter-card__state', '여기부터'));
  link.append(foot);

  return link;
}

function sectionHead(title, note) {
  const head = element('div', 'section-head');
  head.append(element('h2', null, title));
  head.append(element('span', 'section-head__rule'));
  head.append(element('span', 'small muted', note));
  return head;
}

function practiceTile(href, title, body) {
  const tile = element('a', 'practice-tile');
  tile.href = href;
  tile.append(element('span', 'practice-tile__title', title));
  tile.append(element('span', 'practice-tile__body', body));
  return tile;
}

export function homeView() {
  const root = element('div', 'stack stack--loose home-page');
  root.append(hero());

  const statuses = CHAPTERS.map(chapterStatus);
  const done = statuses.filter((s) => s.complete).length;
  const quizDone = statuses.reduce((sum, s) => sum + s.quizDone, 0);
  const quizTotal = statuses.reduce((sum, s) => sum + s.quizTotal, 0);
  const current = nextChapter();

  const chapters = element('section', 'stack');
  chapters.append(sectionHead('열 개의 장', `${done}장 끝냄 · 퀴즈 ${quizDone} / ${quizTotal}`));
  const grid = element('div', 'chapter-grid');
  for (const chapter of CHAPTERS) grid.append(chapterCard(chapter, chapter === current));
  chapters.append(grid);
  root.append(chapters);

  const tools = element('section', 'practice');
  tools.setAttribute('aria-label', '손으로 해 보기');
  tools.append(practiceTile('#/sandbox', '조합 만들어보기',
    '카드를 아무렇게나 골라보면 그게 무슨 조합인지, 테이블에 깔린 걸 이기는지 바로 알려줍니다.'));
  tools.append(practiceTile('#/minigame', `짧은 판 연습 · ${MINIGAMES.length}판`,
    '봇 셋과 한 판의 끝부분을 직접 둡니다. 규칙이 몸에 붙었는지 확인해보세요.'));
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
