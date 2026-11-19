import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, chance, threshold, firstDrop, zoomWindows } from '../public/odds.mjs';

test('official rates and cumulative odds', () => {
  assert.equal(BASE, 137_500);
  assert.equal(chance(0), 0);
  assert.equal(chance(1), 1 / BASE);
  assert.ok(Math.abs(chance(1, 1.5) - 1.5 / BASE) < 1e-18);
  assert.ok(Math.abs(chance(1000) - 0.00724637) < 1e-8);
  assert.ok(Math.abs(1 - chance(BASE) - 0.3678781) < 1e-7);
  assert.equal(threshold(0.5), 95308);
  assert.equal(threshold(0.9), 316605);
  for (const rate of [1, 1.5, 2]) {
    const cutoff = threshold(0.5, rate);
    assert.ok(chance(cutoff - 1, rate) < 0.5);
    assert.ok(chance(cutoff, rate) >= 0.5);
  }
});

test('geometric chest draws start at one and respect the selected rate', () => {
  assert.equal(firstDrop(0), 1);
  assert.equal(firstDrop(0.5), threshold(0.5));
  assert.equal(firstDrop(0.5, 1.5), threshold(0.5, 1.5));
  assert.ok(Number.isFinite(firstDrop(1 - Number.EPSILON)));
});

test('every possible winner fits each nested, undistorted field view', () => {
  for (let y = 0; y < 250; y++) {
    for (let x = 0; x < 550; x++) {
      const windows = zoomWindows(x, y);
      assert.deepEqual(windows.map(({ width, height }) => width * height), [137500, 5500, 220, 55]);
      for (let i = 0; i < windows.length; i++) {
        const current = windows[i];
        assert.ok(x >= current.x && x < current.x + current.width);
        assert.ok(y >= current.y && y < current.y + current.height);
        if (i === 0) continue;
        const parent = windows[i - 1];
        assert.ok(current.x >= parent.x && current.x + current.width <= parent.x + parent.width);
        assert.ok(current.y >= parent.y && current.y + current.height <= parent.y + parent.height);
      }
    }
  }
});
