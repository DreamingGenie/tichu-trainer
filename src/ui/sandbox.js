// 조합 판정 샌드박스.
//
// 카드를 고르면 그게 무슨 조합인지, 테이블 위의 것을 이기는지 즉시 알려준다.
// 규칙을 읽고 외우는 대신 손으로 만져보며 감을 잡는 게 이 사이트의 핵심이라
// 3챕터 안에도 들어가고 별도 화면으로도 열린다.

import { parseHand } from '../engine/cards.js';
import { detectCombo } from '../engine/combos.js';
import { checkPlay } from '../engine/compare.js';
import { enumerateLegalPlays } from '../engine/legal.js';
import { cardElement } from './card-view.js';
import { describeCombo } from '../engine/describe.js';
import { element } from './dom.js';
import { verdictBox } from './verdict.js';
import { createHandView } from './hand-view.js';

// 연습용 손패.
//
// 고르는 기준은 하나다 — **아래 TABLE_PRESETS 하나하나마다 폭탄이 아닌 답이 적어도
// 하나씩 있어야 한다.** 예전 손패는 페어가 5·6·K 뿐이라 연속 페어(77 88)와 풀하우스(9)를
// 이기는 길이 5 폭탄밖에 없었다. 규칙을 배우러 온 사람이 "폭탄만 만들면 다 이긴다"를
// 배우고 가면 안 된다. tests/sandbox.test.js 가 이 조건을 지킨다.
//
// 수트는 프리셋과 겹치지 않게 골랐다(같은 카드가 테이블과 손에 동시에 있을 수 없다).
export const PRACTICE_HAND = 'MAH DOG PHX DRG B2 B3 B4 B5 G6 G7 G8 G9 G10 GQ BQ UQ RQ GK BK GA';

export const TABLE_PRESETS = [
  { id: 'none', label: '비어 있음 (새 트릭)', hand: null },
  { id: 'single7', label: '싱글 7', hand: 'U7' },
  { id: 'singleK', label: '싱글 K', hand: 'UK' },
  { id: 'dragon', label: '용', hand: 'DRG' },
  { id: 'pair8', label: '페어 8', hand: 'U8 R8' },
  { id: 'triple9', label: '트리플 9', hand: 'U9 R9 B9' },
  { id: 'stairs', label: '연속 페어 (77 88)', hand: 'U7 R7 U8 R8' },
  { id: 'straight5', label: '스트레이트 5장 (3~7)', hand: 'U3 R4 U5 R6 U7' },
  { id: 'fullhouse', label: '풀하우스 (9 트리플)', hand: 'U9 R9 B9 U4 R4' },
  { id: 'bomb', label: '포카드 폭탄 (J)', hand: 'GJ BJ UJ RJ' },
];

/**
 * 그 상황에서 내가 들고 있을 수 있는 손패.
 *
 * 테이블에 깔린 카드는 손에 있을 수 없다 — 덱에 한 장씩뿐이다. 용 프리셋에서 용이
 * 테이블과 손에 동시에 보이던 걸 여기서 막는다.
 */
export function handForPreset(preset) {
  const onTable = new Set(preset?.hand ? parseHand(preset.hand).map((c) => c.id) : []);
  return parseHand(PRACTICE_HAND).filter((card) => !onTable.has(card.id));
}

/**
 * @param options.compact 레슨 안에 끼워넣을 때 설명을 줄인다
 */
export function createSandbox(options = {}) {
  const root = element('div', 'stack sandbox');
  let hand = handForPreset(null);

  let table = null;

  // --- 테이블 위 ---
  const tableSection = element('div', 'stack stack--tight');
  const tableHead = element('div', 'row');
  const label = element('label', 'small muted', '테이블 위에 깔린 것');
  label.htmlFor = 'sandbox-table';

  const select = document.createElement('select');
  select.id = 'sandbox-table';
  select.className = 'select';
  for (const preset of TABLE_PRESETS) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.label;
    select.append(option);
  }
  tableHead.append(label, select);

  const tableCards = element('div', 'card-row');
  tableSection.append(tableHead, tableCards);

  // --- 판정 ---
  const verdict = element('div', 'sandbox__verdict');

  // --- 손패 ---
  const handView = createHandView({
    cards: hand,
    current: null,
    dimUnplayable: true,
    onChange: update,
  });

  const handSection = element('div', 'stack stack--tight');
  const handHead = element('div', 'row');
  handHead.append(element('span', 'small muted', '연습용 손패 — 카드를 눌러 골라보세요'));
  handHead.append(element('span', 'spacer'));

  const clearBtn = element('button', 'btn btn--small btn--ghost', '선택 해제');
  clearBtn.type = 'button';
  clearBtn.addEventListener('click', () => handView.clear());
  handHead.append(clearBtn);

  handSection.append(handHead, handView.element);

  // --- 힌트 ---
  const hint = element('p', 'small muted');

  function renderTable() {
    const preset = TABLE_PRESETS.find((p) => p.id === select.value);
    table = preset.hand ? detectCombo(parseHand(preset.hand)) : null;

    tableCards.replaceChildren(
      ...(preset.hand
        ? parseHand(preset.hand).map((card) => cardElement(card))
        : [element('div', 'card-slot', '비어 있음')]),
    );

    hand = handForPreset(preset);
    handView.setCards(hand);
    handView.setCurrent(table);
    update(handView.getSelected());
  }

  function update(selected) {
    if (!selected.length) {
      verdict.replaceChildren(verdictBox('neutral', '카드를 골라보세요',
        table
          ? `지금은 ${describeCombo(table)}이(가) 깔려 있습니다. 이걸 받아칠 수 있는 카드는 진하게 보입니다.`
          : '새 트릭을 여는 상황이라 유효한 조합이면 무엇이든 낼 수 있습니다.'));
      renderHint();
      return;
    }

    const result = checkPlay(selected, table);
    const combo = result.combo ?? detectCombo(selected);

    if (result.ok) {
      verdict.replaceChildren(verdictBox('ok', describeCombo(combo),
        table ? '낼 수 있습니다. 이 트릭을 가져옵니다.' : '낼 수 있습니다.'));
    } else if (!combo) {
      verdict.replaceChildren(verdictBox('bad', '조합이 아닙니다', result.message));
    } else {
      verdict.replaceChildren(verdictBox('bad', `${describeCombo(combo)} — 하지만 못 냅니다`, result.message));
    }
    renderHint();
  }

  function renderHint() {
    const count = enumerateLegalPlays(hand, table).length;
    hint.textContent = table
      ? `이 손패로 지금 낼 수 있는 방법은 ${count}가지입니다.`
      : `이 손패로 만들 수 있는 조합은 ${count}가지입니다.`;
  }

  select.addEventListener('change', renderTable);

  if (!options.compact) {
    root.append(element('p', 'lede',
      '카드를 눌러 골라보세요. 무슨 조합인지, 테이블에 깔린 것을 이기는지 바로 알려줍니다.'));
  }
  root.append(tableSection, verdict, handSection, hint);
  renderTable();

  return root;
}
