// 레슨 본문 옆에 붙어 다니는 펠트 판.
//
// "읽지 말고 해보면서"라는 이 사이트의 주장이 레슨에서만 지켜지지 않았다 — 규칙은
// 글로 읽고, 판은 퀴즈에 가야 나왔다. 지금 읽는 절의 형태를 계속 테이블 위에 깔아
// 두면 글과 판이 한 화면에 있게 된다.

import { parseHand } from '../../engine/cards.js';
import { cardElement } from '../../ui/card-view.js';
import { element } from '../../ui/dom.js';

// 판은 300px 짜리 단이라 장수가 늘면 카드가 두 줄로 접힌다. 한 줄에 들어가게 줄인다 —
// 접히면 조합이 한 덩어리로 안 읽힌다.
function cardWidth(count) {
  if (count <= 3) return '62px';
  if (count <= 5) return '46px';
  return '36px';
}

/**
 * @param spotlights renderBlocks 가 뽑아낸 [{ index, hand }]
 * @returns {{ element: HTMLElement, show(index: number): void, observe(root: HTMLElement): () => void } | null}
 */
export function createSpotlight(spotlights) {
  if (!spotlights.length) return null;

  const root = element('aside', 'felt spotlight');
  root.setAttribute('aria-label', '지금 보는 카드');

  // 조합 이름을 detectCombo 로 붙여봤다가 걷었다. 본문의 카드 묶음이 늘 '조합'인 건
  // 아니라서 — 덱 챕터의 점수 카드 예시가 '포카드 폭탄 A' 로, 마작 한 장이 '싱글 1'
  // 로 나온다. 데이터에 없는 의미를 지어내느니 이름을 안 붙인다. 절 제목이 바로 옆에서
  // 그 역할을 한다.
  const head = element('div', 'spotlight__head');
  head.append(element('span', 'spotlight__eyebrow', '지금 보는 카드'));
  root.append(head);

  const drop = element('div', 'spotlight__drop card-row');
  root.append(drop);

  let shown = -1;

  function show(index) {
    if (index === shown) return;
    const spot = spotlights[index];
    if (!spot) return;
    shown = index;

    const cards = parseHand(spot.hand);
    drop.replaceChildren(...cards.map((card) => cardElement(card)));
    // --card-w 를 바로 박으면 인라인 스타일이라 좁은 화면의 상한(CSS)이 못 이긴다.
    // 한 겹 두고 CSS 가 min() 으로 눌러 쓰게 한다.
    drop.style.setProperty('--spot-card-w', cardWidth(cards.length));
  }

  show(0);

  /**
   * 본문을 따라다니게 한다. 화면 위 35% 에 그은 선을 마지막으로 지나간 절이 '읽고 있는 절'이다.
   *
   * IntersectionObserver 로 띠를 만들어 봤는데, 절 사이에 띠보다 긴 빈틈이 생기면 아무
   * 절도 걸리지 않아 판이 엉뚱한 형태에 멈춰 있었다. 선을 긋고 매번 다시 고르는 쪽이
   * 빈틈이 없다.
   */
  function observe(bodyRoot) {
    const sections = [...bodyRoot.querySelectorAll('[data-spot]')];
    if (!sections.length) return () => {};

    let queued = false;
    const pick = () => {
      queued = false;
      const line = window.innerHeight * 0.35;
      let current = 0;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = Number(section.dataset.spot);
      }
      show(current);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(pick);
    };

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    pick();

    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }

  return { element: root, show, observe };
}
