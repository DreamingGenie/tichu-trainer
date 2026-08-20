// 샌드박스 화면.
//
// 샌드박스 컴포넌트 자체(ui/sandbox.js)는 레슨 3·6챕터 본문에도 들어가므로
// ui/ 에 남고, 여기서는 그걸 한 화면으로 감싸기만 한다.

import { element } from '../ui/dom.js';
import { createSandbox } from '../ui/sandbox.js';

export function sandboxView() {
  const root = element('div', 'stack stack--loose');
  const header = element('header', 'stack stack--tight');
  header.append(element('h1', null, '조합 판정 샌드박스'));
  header.append(element('p', 'lede',
    '규칙이 헷갈릴 때 여기서 직접 확인해보세요. 카드를 고르면 무슨 조합인지, '
    + '테이블에 깔린 걸 이기는지 바로 알려줍니다.'));
  root.append(header);

  const panel = element('div', 'panel');
  panel.append(createSandbox());
  root.append(panel);
  return root;
}
