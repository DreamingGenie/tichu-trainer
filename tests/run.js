// node tests/run.js — 터미널에서 엔진 테스트를 돌린다.
import './engine.test.js';
import './trick.test.js';
import './minigame.test.js';
import './content.test.js';
import './sandbox.test.js';
import { runAll } from './harness.js';

const { passed, failed, results } = runAll();

for (const suite of results) {
  console.log(`\n${suite.name}`);
  for (const c of suite.cases) {
    if (c.ok) {
      console.log(`  PASS  ${c.name}`);
    } else {
      console.log(`  FAIL  ${c.name}\n        ${c.error}`);
    }
  }
}

console.log(`\n통과 ${passed} / 실패 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
