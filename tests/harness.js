// 브라우저와 node 양쪽에서 도는 최소 테스트 러너.
// 의존성 없이 돌아야 tests/index.html을 그냥 열어도 결과가 보인다.

const suites = [];
let currentSuite = null;

export function describe(name, fn) {
  currentSuite = { name, tests: [] };
  suites.push(currentSuite);
  fn();
  currentSuite = null;
}

export function test(name, fn) {
  if (!currentSuite) throw new Error('test()는 describe() 안에서 불러야 합니다.');
  currentSuite.tests.push({ name, fn });
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || '참이어야 하는데 거짓입니다');
}

export function eq(actual, expected, message) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message || '값이 다릅니다'} — 기대 ${format(expected)}, 실제 ${format(actual)}`);
  }
}

export function deepEq(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message || '값이 다릅니다'} — 기대 ${b}, 실제 ${a}`);
}

function format(value) {
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

/** 모든 스위트를 실행하고 결과를 돌려준다. */
export function runAll() {
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    const cases = [];
    for (const t of suite.tests) {
      try {
        t.fn();
        cases.push({ name: t.name, ok: true });
        passed += 1;
      } catch (error) {
        cases.push({ name: t.name, ok: false, error: error.message });
        failed += 1;
      }
    }
    results.push({ name: suite.name, cases });
  }

  return { passed, failed, results };
}
