// Photo carousel gesture rules. Run: npm run carousel:test
import { loadLib } from './lib/load-ts.mjs';

const nav = await loadLib('carouselNav');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));

// --- Rapid taps build on the target, not the lagging position -------------------------------------------
{
  let target = 0;
  for (let n = 0; n < 3; n++) target = nav.stepIndex(target, 1, 5).index;
  ok('three quick forward taps from photo 1 land on photo 4', target === 3);
  let back = 3;
  for (let n = 0; n < 2; n++) back = nav.stepIndex(back, -1, 5).index;
  ok('two quick back taps from photo 4 land on photo 2', back === 1);
}
// The bug being fixed: stepping from where the scroll currently is (still at photo 0) three times gives photo 1, not 3.
ok('stepping from a stale position loses taps (why the target is tracked)', nav.stepIndex(0, 1, 5).index === 1);

// --- Wrapping -------------------------------------------------------------------------------------------
ok('forward from the last photo wraps to the first', JSON.stringify(nav.stepIndex(4, 1, 5)) === JSON.stringify({ index: 0, wrapped: true }));
ok('back from the first photo wraps to the last', JSON.stringify(nav.stepIndex(0, -1, 5)) === JSON.stringify({ index: 4, wrapped: true }));
ok('a normal step does not wrap', nav.stepIndex(2, 1, 5).wrapped === false && nav.stepIndex(2, -1, 5).wrapped === false);
ok('one photo never moves', nav.stepIndex(0, 1, 1).index === 0 && nav.stepIndex(0, -1, 1).index === 0 && nav.stepIndex(0, 1, 0).index === 0);
ok('a base past the end (photos were deleted) is pulled back in range', nav.stepIndex(9, -1, 3).index === 1);

// --- Tap zones ------------------------------------------------------------------------------------------
ok('left 30% goes back', nav.tapDelta(0, 400) === -1 && nav.tapDelta(119, 400) === -1);
ok('the rest goes forward', nav.tapDelta(120, 400) === 1 && nav.tapDelta(399, 400) === 1);
ok('a zero-width track goes forward instead of dividing by zero', nav.tapDelta(10, 0) === 1);

// --- Tap versus drag ------------------------------------------------------------------------------------
ok('a few pixels of finger wobble is still a tap', nav.movedBeyondSlop(3, 4) === false && nav.movedBeyondSlop(-8, 8) === false);
ok('more than 8px either way is a drag', nav.movedBeyondSlop(9, 0) === true && nav.movedBeyondSlop(0, -9) === true);

// --- Mouse swipes ---------------------------------------------------------------------------------------
ok('dragging left with a mouse goes forward, right goes back', nav.mouseSwipeDelta(-80, 5) === 1 && nav.mouseSwipeDelta(80, -5) === -1);
ok('a short drag is not a swipe', nav.mouseSwipeDelta(-39, 0) === 0);
ok('a mostly vertical drag is not a swipe', nav.mouseSwipeDelta(-60, 70) === 0 && nav.mouseSwipeDelta(50, 50) === 0);

// --- Which photo is showing -----------------------------------------------------------------------------
ok('the nearest photo flips at the halfway point', nav.nearestIndex(199, 400, 5) === 0 && nav.nearestIndex(200, 400, 5) === 1 && nav.nearestIndex(999, 400, 5) === 2 && nav.nearestIndex(1000, 400, 5) === 3);
ok('scrolling past the ends stays in range', nav.nearestIndex(-50, 400, 5) === 0 && nav.nearestIndex(99999, 400, 5) === 4);
ok('clampIndex survives junk', nav.clampIndex(Number.NaN, 5) === 0 && nav.clampIndex(2.6, 5) === 3 && nav.clampIndex(-3, 5) === 0 && nav.clampIndex(3, 0) === 0);

console.log(`carousel: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
