// 9챕터 — 한 라운드의 점수 계산을 한 줄씩 따라간다.
// 카드 점수 100점과 티츄 보너스가 어떻게 따로 붙는지가 이 데모의 목적이다.

import { parseHand } from '../../../engine/cards.js';
import { CALL, scoreRound } from '../../../engine/scoring.js';
import { SEAT } from '../../../engine/seats.js';
import { element } from '../../../ui/dom.js';

export default function scoringWalkthrough() {
  const round = {
    finishOrder: [SEAT.SOUTH, SEAT.EAST, SEAT.NORTH],
    tricks: {
      [SEAT.SOUTH]: parseHand('DRG BK'),
      [SEAT.EAST]: parseHand('G10 B10 PHX'),
      [SEAT.NORTH]: parseHand('GK RK U10'),
      [SEAT.WEST]: parseHand('UK G5 B5'),
    },
    hands: { [SEAT.WEST]: parseHand('R10 U5 R5') },
    calls: { [SEAT.SOUTH]: CALL.TICHU },
  };

  const result = scoreRound(round);
  const root = element('div', 'stack');
  let shown = 0;

  const setup = element('div', 'stack stack--tight');
  setup.append(element('h4', null, '이런 라운드였다고 해봅시다'));
  const list = element('ul');
  list.append(
    element('li', null, '나 → 오른쪽 상대 → 파트너 순서로 손패를 털었고, 왼쪽 상대가 꼴찌로 남았습니다.'),
    element('li', null, '나는 이 판 시작 전에 티츄를 선언했습니다.'),
    element('li', null, '꼴찌인 왼쪽 상대의 손에는 아직 20점어치가 남아 있습니다.'),
  );
  setup.append(list);

  const lines = element('div', 'log');
  const totals = element('div', 'row');
  const next = element('button', 'btn btn--primary', '한 줄씩 계산해보기');
  next.type = 'button';

  function render() {
    lines.replaceChildren(...result.lines.slice(0, shown).map((line) => {
      const item = element('div', 'log__item');
      item.append(element('span', null, line.label));
      const points = element('span', 'badge');
      points.classList.add(line.team === 'us' ? 'badge--accent' : 'badge--warn');
      points.textContent = `${line.team === 'us' ? '우리' : '상대'} ${line.points >= 0 ? '+' : '−'}${Math.abs(line.points)}`;
      item.append(' ', points);
      return item;
    }));

    if (shown >= result.lines.length) {
      next.disabled = true;
      next.textContent = '계산 끝';
      totals.replaceChildren(
        element('span', 'badge badge--accent', `우리 팀 ${result.us}점`),
        element('span', 'badge badge--warn', `상대 팀 ${result.them}점`),
        element('span', 'small muted', '카드 점수는 언제나 합쳐서 100점, 티츄 보너스는 그 위에 따로 붙습니다.'),
      );
    }
  }

  next.addEventListener('click', () => { shown += 1; render(); });
  render();

  root.append(setup, next, lines, totals);
  return root;
}
