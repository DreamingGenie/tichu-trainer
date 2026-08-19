// 레슨 본문에 끼워넣는 인터랙티브 데모들.
// 블록 데이터에서 { kind: 'demo', id: '...' } 로 부른다.

import { parseHand, sumPoints } from '../engine/cards.js';
import { CALL, scoreRound } from '../engine/scoring.js';
import { SEAT, SEAT_LABEL } from '../engine/seats.js';
import { cardElement } from './card-view.js';
import { element, formatPoints, verdictBox } from './format.js';
import { createSandbox } from './sandbox.js';

/** 2챕터 — 점수 카드만 골라내기. */
function pointPicker() {
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

/** 9챕터 — 한 라운드의 점수 계산을 한 줄씩 따라간다. */
function scoringWalkthrough() {
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

/** 7챕터 — 세 사람에게 한 장씩 건네보기. */
function passingDemo() {
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

const DEMOS = {
  sandbox: () => createSandbox({ compact: true }),
  'point-picker': pointPicker,
  'scoring-walkthrough': scoringWalkthrough,
  passing: passingDemo,
};

/** 없는 데모를 불러도 화면이 죽지 않도록 안내를 대신 보여준다. */
export function renderDemo(id, block) {
  const build = DEMOS[id];
  const wrap = element('div', 'demo');
  if (block?.title) wrap.append(element('h4', 'demo__title', block.title));

  if (!build) {
    wrap.append(element('div', 'note note--warn', `준비 중인 데모입니다 (${id}).`));
    return wrap;
  }
  wrap.append(build(block));
  return wrap;
}
