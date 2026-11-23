// Ads only in the Android app, for non-Plus members, with a unit id. Run: npm run native:test
import { loadLib } from './lib/load-ts.mjs';

const { shouldShowAds } = await loadLib('adsRules');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));

const base = { native: true, plus: false, unitId: 'ca-app-pub-1/2' };
ok('the Android app, free member, unit id: ads show', shouldShowAds(base) === true);
ok('a browser never gets an ad', shouldShowAds({ ...base, native: false }) === false);
ok('a Plus member never gets an ad', shouldShowAds({ ...base, plus: true }) === false);
ok('while the plan is still unknown (null), no ad', shouldShowAds({ ...base, plus: null }) === false);
ok('no unit id configured: no ad', shouldShowAds({ ...base, unitId: '' }) === false && shouldShowAds({ ...base, unitId: '   ' }) === false && shouldShowAds({ ...base, unitId: undefined }) === false);
ok('a browser and a Plus member together: no ad', shouldShowAds({ native: false, plus: true, unitId: 'x' }) === false);

console.log(`native gates: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
