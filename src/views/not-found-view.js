// 없는 주소·없는 챕터·없는 미니판이 모두 여기로 온다.
// 레슨 뷰 안에 있던 것을 꺼냈다 — 미니판이 레슨을 import 할 이유가 없었다.

import { element } from '../ui/dom.js';

export function notFoundPanel(message) {
  const panel = element('div', 'panel stack');
  panel.append(element('h1', null, '길을 잃었습니다'));
  panel.append(element('p', 'muted', message ?? '없는 주소입니다.'));
  const link = element('a', 'btn btn--primary', '목록으로 돌아가기');
  link.href = '#/';
  const row = element('div', 'row');
  row.append(link);
  panel.append(row);
  return panel;
}
