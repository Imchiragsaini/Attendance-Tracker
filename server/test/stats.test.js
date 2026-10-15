const test = require('node:test');
const assert = require('node:assert/strict');
const { computeStats } = require('../utils/stats');

test('no data gives null percentage', () => {
  const s = computeStats({ present: 0, absent: 0, threshold: 50 });
  assert.equal(s.percentage, null);
  assert.equal(s.status, 'no-data');
});

test('percentage is present / (present + absent)', () => {
  const s = computeStats({ present: 3, absent: 1, threshold: 50 });
  assert.equal(s.percentage, 75);
  assert.equal(s.total, 4);
});

test('canMiss at 50% with 8 present, 2 absent', () => {
  // 8 / (10 + m) >= 0.5  ->  m <= 6
  const s = computeStats({ present: 8, absent: 2, threshold: 50 });
  assert.equal(s.canMiss, 6);
  assert.equal(s.status, 'safe');
});

test('canMiss at 75% with 9 present, 1 absent', () => {
  // 9 / (10 + m) >= 0.75  ->  m <= 2
  const s = computeStats({ present: 9, absent: 1, threshold: 75 });
  assert.equal(s.canMiss, 2);
});

test('exactly on the threshold can miss 0 and is a warning', () => {
  const s = computeStats({ present: 5, absent: 5, threshold: 50 });
  assert.equal(s.canMiss, 0);
  assert.equal(s.status, 'warning');
  assert.equal(s.mustAttend, 0);
});

test('below threshold: mustAttend at 50% with 3 present, 4 absent', () => {
  // (3 + x) / (7 + x) >= 0.5  ->  x >= 1
  const s = computeStats({ present: 3, absent: 4, threshold: 50 });
  assert.equal(s.mustAttend, 1);
  assert.equal(s.status, 'danger');
  assert.equal(s.canMiss, 0);
});

test('below threshold: mustAttend at 75% with 5 present, 5 absent', () => {
  // (5 + x) / (10 + x) >= 0.75  ->  x >= 10
  const s = computeStats({ present: 5, absent: 5, threshold: 75 });
  assert.equal(s.mustAttend, 10);
});

test('mustAttend result really reaches the threshold (brute-force check)', () => {
  for (const T of [40, 50, 60, 75, 80, 90]) {
    for (let p = 0; p <= 30; p++) {
      for (let a = 1; a <= 30; a++) {
        const s = computeStats({ present: p, absent: a, threshold: T });
        if (s.status === 'danger') {
          const x = s.mustAttend;
          assert.ok((p + x) * 100 >= T * (p + a + x), `reaches ${T}% for p=${p} a=${a}`);
          if (x > 0) {
            assert.ok((p + x - 1) * 100 < T * (p + a + x - 1), `x is minimal for p=${p} a=${a} T=${T}`);
          }
        }
        if (s.status === 'safe' || s.status === 'warning') {
          const m = s.canMiss;
          assert.ok(p * 100 >= T * (p + a + m), `still safe after missing ${m}`);
          assert.ok(p * 100 < T * (p + a + m + 1), `${m} is the maximum`);
        }
      }
    }
  }
});

test('100% threshold and below it is unreachable', () => {
  const s = computeStats({ present: 9, absent: 1, threshold: 100 });
  assert.equal(s.status, 'danger');
  assert.equal(s.mustAttend, null);
});
