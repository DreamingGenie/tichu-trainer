// 2챕터 — 점수 카드만 골라내기.
// 5·10·K 와 용·봉황만 점수가 붙는다는 걸 외우는 대신 직접 집어보게 한다.

import { parseHand, sumPoints } from '../../../engine/cards.js';
import { formatPoints } from '../../../engine/describe.js';
import { cardElement } from '../../../ui/card-view.js';
import { element } from '../../../ui/dom.js';
import { verdictBox } from '../../../ui/verdict.js';

export default function pointPicker() {
  const root = element('div', 'stack');
  const cards = parseHand('G5 B7 U10 RK G2 DRG BJ U5 PHX R9');
  const answer = new Set(cards.filter((c) => c.points !== 0).map((c) => c.id));
  const picked = new Set();

  const row = element('div', 'card-row');
  const verdict = element('div');

  function render() {
    row.replaceChildren(...cards.map((card) => {
      const node = cardElement(card, { selectable: true, selected: picked.has(card.id) });
      node.addEventListener('click', () => {
        picked.has(card.id) ? picked.delete(card.id) : picked.add(card.id);
        verdict.replaceChildren();
        render();
      });
      return node;
    }));
  }

  const check = element('button', 'btn btn--primary', '확인');
  check.type = 'button';
  check.addEventListener('click', () => {
    const missed = [...answer].filter((id) => !picked.has(id));
    const wrong = [...picked].filter((id) => !answer.has(id));
    const total = sumPoints(cards.filter((c) => answer.has(c.id)));

    if (!missed.length && !wrong.length) {
      verdict.replaceChildren(verdictBox('ok', '정확합니다',
        `점수가 붙은 건 5·10·K와 용·봉황뿐입니다. 여기 있는 것만 더하면 ${formatPoints(total)}이고, 봉황이 −25라 생각보다 적습니다.`));
      return;
    }

    const name = (id) => cards.find((c) => c.id === id).name;
    const parts = [];
    if (missed.length) parts.push(`빠뜨린 것: ${missed.map(name).join(', ')}`);
    if (wrong.length) parts.push(`점수가 없는데 고른 것: ${wrong.map(name).join(', ')}`);
    verdict.replaceChildren(verdictBox('bad', '다시 보세요', parts.join(' / ')));
  });

  render();
  const actions = element('div', 'row');
  actions.append(check);
  root.append(
    element('p', 'small muted', '이 중에서 점수가 붙은 카드를 전부 골라보세요.'),
    row,
    actions,
    verdict,
  );
  return root;
}
