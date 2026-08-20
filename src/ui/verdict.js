// 판정 결과 상자. 맞았는지 틀렸는지와 그 이유를 같은 자리에 계속 보여준다.
// 퀴즈·미니판·데모가 전부 이걸 쓴다.

import { element } from './dom.js';

/**
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
