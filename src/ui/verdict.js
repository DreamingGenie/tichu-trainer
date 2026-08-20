// 판정 결과 상자. 맞았는지 틀렸는지와 그 이유를 같은 자리에 계속 보여준다.
// 퀴즈·미니판·데모가 전부 이걸 쓴다.

import { element } from './dom.js';

/**
 * @param tone    'ok' | 'bad' | 'neutral'
 * @param body    본문. 기본은 텍스트고, inline() 을 거친 마크업이면 html 을 켠다.
 * @param options.html body 를 마크업으로 넣는다
 */
export function verdictBox(tone, title, body, options = {}) {
  const box = element('div', 'verdict');
  if (tone === 'ok') box.classList.add('is-ok');
  if (tone === 'bad') box.classList.add('is-bad');

  const icon = element('span', 'verdict__icon', tone === 'ok' ? '✓' : tone === 'bad' ? '✕' : '?');
  icon.setAttribute('aria-hidden', 'true');

  const text = element('div', 'stack stack--tight');
  text.append(element('div', 'verdict__title', title));

  const bodyNode = element('div', 'verdict__body');
  if (options.html) {
    bodyNode.innerHTML = body ?? '';
  } else {
    bodyNode.textContent = body ?? '';
  }
  text.append(bodyNode);

  box.append(icon, text);
  return box;
}
