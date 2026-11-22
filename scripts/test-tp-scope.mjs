// Travelpayouts script scope: it may run on public pages only. Run: npm run tp:test
import { loadLib } from './lib/load-ts.mjs';

const { tpScriptAllowed } = await loadLib('travelpayouts');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));

for (const p of ['/', '/cities', '/cities/', '/cities/phuket', '/cities/ho-chi-minh-city', '/manila', '/cebu', '/bangkok', '/phnom-penh', '/kuala-lumpur', '/kuala-lumpur/', '/safety']) {
  ok(`public page loads it: ${p}`, tpScriptAllowed(p) === true);
}

// Everything signed in, and the sign-in flow, must stay clear of it.
for (const p of [
  '/login', '/signup', '/onboarding', '/discover', '/favorites', '/messages', '/chat/6b86de5a-9988-4812-9eff-ff80fca42e1f',
  '/chat/someone', '/profile', '/profile/6b86de5a-9988-4812-9eff-ff80fca42e1f', '/profile/edit', '/moments', '/notifications',
  '/settings', '/verify', '/plus', '/upgrade', '/admin', '/admin/photos', '/reset-password', '/verify-email', '/auth/callback',
]) {
  ok(`kept off: ${p}`, tpScriptAllowed(p) === false);
}

// The Travel Hub lists members when signed in, so the script runs there for signed-out visitors only.
ok('travel hub: signed out loads it', tpScriptAllowed('/travel', false) === true && tpScriptAllowed('/travel/', false) === true);
ok('travel hub: signed in is kept off', tpScriptAllowed('/travel', true) === false);
ok('travel hub: unknown state counts as signed in', tpScriptAllowed('/travel') === false);
ok('signed-out flag does not open the app', tpScriptAllowed('/discover', false) === false && tpScriptAllowed('/profile/abc', false) === false);

// Near misses and odd input.
ok('a sub-page of a hub is not a hub', tpScriptAllowed('/cebu/anything') === false);
ok('a deeper cities path is not a city page', tpScriptAllowed('/cities/phuket/extra') === false);
ok('a look-alike prefix is not a hub', tpScriptAllowed('/manila-chat') === false);
ok('legal pages stay off', tpScriptAllowed('/terms') === false && tpScriptAllowed('/privacy') === false && tpScriptAllowed('/contact') === false);
ok('null and undefined are off', tpScriptAllowed(null) === false && tpScriptAllowed(undefined) === false && tpScriptAllowed('') === false);

console.log(`travelpayouts scope: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
