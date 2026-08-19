// 엔진이 내놓은 값을 사람 말로 옮기는 곳.

import { rankLabel } from '../engine/cards.js';
import { COMBO, COMBO_LABEL } from '../engine/combos.js';

/** '스트레이트 5장 (최고 9)' 처럼 조합을 한 줄로 설명한다. */
export function describeCombo(combo) {
  if (!combo) return '조합 아님';
  const name = COMBO_LABEL[combo.type];

  switch (combo.type) {
    case COMBO.DOG:
      return name;
    case COMBO.SINGLE:
      return combo.phoenixSingle ? '봉황 (직전 카드보다 0.5 높게)' : `${name} ${rankLabel(combo.rank)}`;
    case COMBO.PAIR:
    case COMBO.TRIPLE:
    case COMBO.BOMB_FOUR:
      return `${name} ${rankLabel(combo.rank)}`;
    case COMBO.FULLHOUSE:
      return `${name} (${rankLabel(combo.rank)} 트리플 기준)`;
    case COMBO.STAIRS:
    case COMBO.STRAIGHT:
    case COMBO.BOMB_SF:
      return `${name} ${combo.length}장 (최고 ${rankLabel(combo.rank)})`;
    default:
      return name;
  }
}

/** 점수를 부호까지 붙여서. */
export function formatPoints(points) {
  if (points === 0) return '0점';
  return `${points > 0 ? '+' : '−'}${Math.abs(points)}점`;
}

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * 판정 결과 상자. 맞았는지 틀렸는지와 그 이유를 같은 자리에 계속 보여준다.
 *
 * .verdict__body 는 내용이 비어 있어도 항상 만든다. 부르는 쪽에서 나중에
 * innerHTML 로 채워 넣는 일이 잦은데, 없으면 그 자리에서 터진다.
 *
 * @param tone 'ok' | 'bad' | 'neutral'
 */
export function verdictBox(tone, title, body) {
  const box = element('div', 'verdict');
  if (tone === 'ok') box.classList.add('is-ok');
  if (tone === 'bad') box.classList.add('is-bad');

  const icon = element('span', 'verdict__icon', tone === 'ok' ? '✓' : tone === 'bad' ? '✕' : '?');
  icon.setAttribute('aria-hidden', 'true');

  const text = element('div', 'stack stack--tight');
  text.append(element('div', 'verdict__title', title));
  text.append(element('div', 'verdict__body', body ?? ''));

  box.append(icon, text);
  return box;
}
