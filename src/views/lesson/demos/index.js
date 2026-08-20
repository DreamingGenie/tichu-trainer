// 레슨 본문에 끼워넣는 인터랙티브 데모들의 레지스트리.
// 블록 데이터에서 { kind: 'demo', id: '...' } 로 부른다.
//
// 데모끼리는 서로 무관하고 각각 다른 챕터에서 쓰이므로 파일을 나눠 둔다.

import { element } from '../../../ui/dom.js';
import { createSandbox } from '../../../ui/sandbox.js';
import pointPicker from './point-picker.js';
import scoringWalkthrough from './scoring-walkthrough.js';
import passingDemo from './passing.js';

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
