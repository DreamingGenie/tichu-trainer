// 7챕터 — 세 사람에게 한 장씩 건네보기.
// 조합을 깨지 않으면서 무엇을 내줄지 고르는 감각이 목적이다.

import { parseHand } from '../../../engine/cards.js';
import { cardElement } from '../../../ui/card-view.js';
import { element } from '../../../ui/dom.js';
import { verdictBox } from '../../../ui/verdict.js';

export default function passingDemo() {
  // 7 트리플과 10-J-Q-K-A 스트레이트가 숨어 있는 손패.
  // 무심코 집으면 둘 중 하나가 깨지도록 짜여 있다.
  const hand = parseHand('MAH DOG G2 B3 U4 R6 G7 B7 U7 G10 BJ UQ GK GA');
  const TARGETS = [
    { id: 'west', label: '왼쪽 상대', opponent: true },
    { id: 'north', label: '파트너', opponent: false },
    { id: 'east', label: '오른쪽 상대', opponent: true },
  ];

  // 카드마다 "왜 주면 안 되는지 / 줘도 되는지"를 미리 달아둔다.
  const NOTES = {
    G7: ['7 트리플이 깨집니다', 'break'], B7: ['7 트리플이 깨집니다', 'break'], U7: ['7 트리플이 깨집니다', 'break'],
    G10: ['10-J-Q-K-A 스트레이트가 깨집니다', 'break'], BJ: ['10-J-Q-K-A 스트레이트가 깨집니다', 'break'],
    UQ: ['10-J-Q-K-A 스트레이트가 깨집니다', 'break'], GK: ['10-J-Q-K-A 스트레이트가 깨집니다', 'break'],
    GA: ['10-J-Q-K-A 스트레이트가 깨집니다', 'break'],
    MAH: ['선을 잡고 소원까지 거는 권한이 딸려 있습니다', 'power'],
    DOG: ['상대가 자기 파트너에게 선을 넘기는 데 씁니다', 'power'],
    G2: ['낮은 외톨이 — 주기 좋습니다', 'spare'],
    B3: ['낮은 외톨이 — 주기 좋습니다', 'spare'],
    U4: ['낮은 외톨이 — 주기 좋습니다', 'spare'],
    R6: ['낮은 외톨이 — 주기 좋습니다', 'spare'],
  };

  const root = element('div', 'stack');
  const given = {};           // targetId -> card
  let picked = null;

  const slots = element('div', 'passing-slots');
  const handRow = element('div', 'card-row card-row--overlap');
  const verdict = element('div');

  function assignedIds() {
    return new Set(Object.values(given).filter(Boolean).map((c) => c.id));
  }

  function render() {
    const used = assignedIds();

    handRow.replaceChildren(...hand.filter((c) => !used.has(c.id)).map((card) => {
      const node = cardElement(card, { selectable: true, selected: picked?.id === card.id });
      node.addEventListener('click', () => { picked = picked?.id === card.id ? null : card; verdict.replaceChildren(); render(); });
      return node;
    }));

    slots.replaceChildren(...TARGETS.map((target) => {
      const box = element('div', 'passing-slot');
      box.append(element('div', 'small muted', target.label));

      const card = given[target.id];
      if (card) {
        const node = cardElement(card, { selectable: true });
        node.addEventListener('click', () => { given[target.id] = null; verdict.replaceChildren(); render(); });
        node.title = '눌러서 되돌리기';
        box.append(node);
      } else {
        const drop = element('button', 'card-slot', picked ? '여기에 놓기' : '카드를 먼저 고르세요');
        drop.type = 'button';
        drop.disabled = !picked;
        drop.addEventListener('click', () => {
          given[target.id] = picked;
          picked = null;
          verdict.replaceChildren();
          render();
        });
        box.append(drop);
      }
      return box;
    }));

    check.disabled = TARGETS.some((t) => !given[t.id]);
  }

  const check = element('button', 'btn btn--primary', '이렇게 건네기');
  check.type = 'button';
  check.addEventListener('click', () => {
    const problems = [];
    const good = [];

    for (const target of TARGETS) {
      const card = given[target.id];
      const note = NOTES[card.id] ?? ['특별히 아깝지는 않습니다', 'spare'];
      const [text, kind] = note;

      if (target.opponent && (kind === 'break' || kind === 'power')) {
        problems.push(`${target.label}에게 ${card.name} — ${text}`);
      } else if (!target.opponent && kind === 'break') {
        problems.push(`파트너에게 ${card.name} — ${text}. 파트너에게 주는 것도 내 조합을 깨는 건 마찬가지입니다.`);
      } else if (target.opponent) {
        good.push(`${target.label}에게 ${card.name} — ${text}`);
      } else {
        good.push(`파트너에게 ${card.name} — 파트너 손을 도우면서 내 조합도 지켰습니다`);
      }
    }

    verdict.replaceChildren(problems.length
      ? verdictBox('bad', '다시 볼 만한 선택이 있습니다', problems.join(' / '))
      : verdictBox('ok', '좋은 선택입니다', good.join(' / ')));
  });

  const reset = element('button', 'btn btn--small btn--ghost', '처음부터');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    for (const t of TARGETS) given[t.id] = null;
    picked = null;
    verdict.replaceChildren();
    render();
  });

  const actions = element('div', 'row');
  actions.append(check, reset);

  root.append(
    element('p', 'small muted', '이 손패에는 7 트리플과 10-J-Q-K-A 스트레이트가 숨어 있습니다. 무엇을 건넬지 골라보세요.'),
    slots, handRow, actions, verdict,
  );
  render();
  return root;
}
