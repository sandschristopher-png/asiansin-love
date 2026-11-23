// Ads only in the Android app, for non-Plus members, with a unit id. Run: npm run native:test
import { loadLib } from './lib/load-ts.mjs';

const { shouldShowAds } = await loadLib('adsRules');
const { decideBack, ROOT_TABS } = await loadLib('nativeBack');
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

// The Android back button
const back = (path, historyLength = 5, dialogOpen = false) => decideBack({ path, historyLength, dialogOpen });
ok('an open sheet closes first, anywhere', back('/discover', 5, true) === 'close_dialog' && back('/chat/abc', 1, true) === 'close_dialog');
ok('a sub-page goes back through history', back('/profile/abc') === 'history_back' && back('/chat/abc') === 'history_back' && back('/moments/map') === 'history_back' && back('/travel/') === 'history_back');
ok('a sub-page with no history leaves the app', back('/profile/abc', 1) === 'exit');
ok('a root tab other than Discover goes to Discover', ROOT_TABS.filter((t) => t !== '/discover').every((t) => back(t) === 'go_discover') && back('/messages/', 5) === 'go_discover');
ok('Discover leaves the app', back('/discover') === 'exit' && back('/discover/') === 'exit');
ok('the five tabs are the bottom bar', ROOT_TABS.length === 5);

console.log(`native gates: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
