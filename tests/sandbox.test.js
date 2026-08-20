// 연습용 손패가 "폭탄만 답인" 상황을 만들지 않는지 지킨다.
//
// 예전 손패는 페어가 5·6·K 뿐이라 연속 페어(77 88)와 풀하우스(9 트리플)를 이기는 길이
// 5 폭탄밖에 없었다. 규칙을 배우러 온 사람이 "폭탄만 만들면 다 이긴다"를 배우고 간다.
// 손패를 손볼 때 이 조건이 조용히 깨지는 걸 막는다.

import { assert, describe, test } from './harness.js';
import { parseHand } from '../src/engine/cards.js';
import { detectCombo, isBomb } from '../src/engine/combos.js';
import { enumerateLegalPlays } from '../src/engine/legal.js';
import { PRACTICE_HAND, TABLE_PRESETS, handForPreset } from '../src/ui/sandbox.js';

// 용은 단일로 가장 센 카드라 폭탄 말고는 답이 없는 게 규칙상 맞다.
const BOMB_ONLY = new Set(['dragon', 'bomb']);

describe('조합 만들어보기 — 연습용 손패', () => {
  test('같은 카드가 두 번 들어 있지 않다', () => {
    const ids = parseHand(PRACTICE_HAND).map((c) => c.id);
    assert(new Set(ids).size === ids.length, `중복: ${ids.join(' ')}`);
  });

  test('테이블에 깔린 카드는 손패에서 빠진다', () => {
    for (const preset of TABLE_PRESETS) {
      const inHand = new Set(handForPreset(preset).map((c) => c.id));
      for (const card of parseHand(preset.hand ?? '')) {
        assert(!inHand.has(card.id), `${preset.label} 의 ${card.name} 이 손패에도 있다`);
      }
    }
  });

  test('프리셋마다 폭탄이 아닌 답이 하나는 있다', () => {
    for (const preset of TABLE_PRESETS) {
      if (BOMB_ONLY.has(preset.id)) continue;
      const table = preset.hand ? detectCombo(parseHand(preset.hand)) : null;
      const plays = enumerateLegalPlays(handForPreset(preset), table);
      const plain = plays.filter((play) => !isBomb(detectCombo(play)));
      assert(plain.length > 0, `${preset.label} — 폭탄 말고는 낼 수 있는 게 없다`);
    }
  });

  test('폭탄으로만 답이 나오는 프리셋에는 폭탄이 있다', () => {
    for (const id of BOMB_ONLY) {
      const preset = TABLE_PRESETS.find((p) => p.id === id);
      const table = detectCombo(parseHand(preset.hand));
      const plays = enumerateLegalPlays(handForPreset(preset), table);
      assert(plays.length > 0, `${preset.label} — 손패로 이길 방법이 아예 없다`);
    }
  });
});
