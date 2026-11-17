// Voice-call rules regression suite. Run: npm run calls:test
import fs from 'node:fs';
import { loadLib } from './lib/load-ts.mjs';

const r = await loadLib('callRules');
let passed = 0;
const failures = [];
const ok = (name, cond, detail = '') => (cond ? passed++ : failures.push(`${name}${detail ? ` -> ${detail}` : ''}`));

// --- Unlock gate ---------------------------------------------------------------------------------
const gate = (fromMe, fromThem, meVerified = true, theyVerified = true) => r.callUnlockState({ fromMe, fromThem, meVerified, theyVerified });
ok('locked below 5 messages', gate(2, 2) === 'few_messages');
ok('unlocked at exactly 5 with both sides', gate(3, 2) === 'ok');
ok('5 messages from one side only stays locked', gate(5, 0) === 'few_messages' && gate(0, 6) === 'few_messages');
ok('unverified me locks calling', gate(10, 10, false, true) === 'unverified');
ok('unverified them locks calling', gate(10, 10, true, false) === 'unverified');
ok('verification is checked before message count', gate(0, 0, false, true) === 'unverified');

// --- Miss cooldown -------------------------------------------------------------------------------
const H = 60 * 60 * 1000;
const NOW = 10 * H;
const log = (minsAgo, reason) => ({ endedAt: NOW - minsAgo * 60_000, reason });
ok('no calls: open', r.missLockUntil([], null, NOW) === null);
ok('one miss: open', r.missLockUntil([log(5, 'missed')], null, NOW) === null);
ok('two misses: locked for 60 minutes from the latest', r.missLockUntil([log(5, 'missed'), log(20, 'declined')], null, NOW) === NOW - 5 * 60_000 + H);
ok('a completed call in between breaks the streak', r.missLockUntil([log(5, 'missed'), log(20, 'completed'), log(40, 'missed')], null, NOW) === null);
ok('the lock expires after 60 minutes', r.missLockUntil([log(61, 'missed'), log(90, 'missed')], null, NOW) === null);
ok('a new message from them unlocks immediately', r.missLockUntil([log(5, 'missed'), log(20, 'missed')], NOW - 60_000, NOW) === null);
ok('a message from them before the last miss does not unlock', r.missLockUntil([log(5, 'missed'), log(20, 'missed')], NOW - 30 * 60_000, NOW) !== null);
ok('a technical failure does not count as a miss', r.missLockUntil([log(5, 'failed'), log(20, 'missed')], null, NOW) === null);
ok('a failure does not break a miss streak', r.missLockUntil([log(5, 'missed'), log(10, 'failed'), log(20, 'missed')], null, NOW) !== null);

// --- Network quality -----------------------------------------------------------------------------
const s = (over = {}) => ({ rttMs: 80, lossPct: 0, jitterMs: 10, iceState: 'connected', ...over });
ok('healthy sample is not weak', !r.isSampleWeak(s()));
ok('RTT over 450 ms is weak', r.isSampleWeak(s({ rttMs: 451 })) && !r.isSampleWeak(s({ rttMs: 450 })));
ok('loss over 8% is weak', r.isSampleWeak(s({ lossPct: 8.1 })) && !r.isSampleWeak(s({ lossPct: 8 })));
ok('jitter over 60 ms is weak', r.isSampleWeak(s({ jitterMs: 61 })) && !r.isSampleWeak(s({ jitterMs: 60 })));
ok('ICE disconnected is weak', r.isSampleWeak(s({ iceState: 'disconnected' })));
ok('missing stats are not treated as weak', !r.isSampleWeak(s({ rttMs: null, lossPct: null, jitterMs: null })));
{
  const t = new r.QualityTracker();
  ok('starts good', t.status === 'good');
  ok('first bad sample flips to weak', t.push(s({ rttMs: 900 })) === 'weak');
  ok('further bad samples do not re-announce', t.push(s({ rttMs: 900 })) === null);
  ok('one healthy sample is not enough', t.push(s({ iceState: 'checking' })) === null && t.status === 'weak');
  ok('two healthy samples clear it', t.push(s({ iceState: 'checking' })) === 'good' && t.status === 'good');
  t.push(s({ rttMs: 900 }));
  t.push(s({ iceState: 'checking' }));
  t.push(s({ rttMs: 900 }));
  ok('a bad sample resets the healthy streak', t.push(s({ iceState: 'checking' })) === null && t.status === 'weak');
  const t2 = new r.QualityTracker();
  t2.push(s({ iceState: 'disconnected' }));
  ok('ICE connected clears weak at once', t2.push(s({ iceState: 'connected' })) === 'good');
}
ok('loss percent over an interval', Math.abs(r.lossPercent({ received: 100, lost: 0 }, { received: 190, lost: 10 }) - 10) < 1e-9);
ok('loss percent needs a previous reading', r.lossPercent(null, { received: 1, lost: 0 }) === null);
ok('loss percent ignores an idle interval', r.lossPercent({ received: 5, lost: 1 }, { received: 5, lost: 1 }) === null);

// --- Formatting and keys ---------------------------------------------------------------------------
ok('clock', r.formatClock(0) === '00:00' && r.formatClock(65) === '01:05' && r.formatClock(1800) === '30:00');
ok('duration', r.formatDuration(384) === '6m 24s' && r.formatDuration(45) === '45s' && r.formatDuration(3720) === '1h 2m');
ok('pair key is order independent', r.pairKey('b', 'a') === 'a:b' && r.pairKey('a', 'b') === 'a:b');
ok('constants', r.RING_TIMEOUT_MS === 30000 && r.SESSION_CAP_SEC === 1800 && r.SESSION_WARN_SEC === 1500 && r.MISS_LOCK_MS === 3600000);

// --- Call log body (also sent by sendBeacon when a tab closes) ------------------------------------
{
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const now = Date.parse('2026-11-17T12:00:00Z');
  const body = (o = {}) => ({ id: A, peer: B, startedAt: '2026-11-17T11:50:00Z', endedAt: '2026-11-17T11:56:24Z', durationSec: 384, reason: 'completed', ...o });
  ok('a normal completed call parses', r.parseCallLogBody(body(), now)?.durationSec === 384);
  ok('a missed call has no duration', r.parseCallLogBody(body({ reason: 'missed', durationSec: 0 }), now) !== null && r.parseCallLogBody(body({ reason: 'missed', durationSec: 30 }), now) === null);
  ok('unknown reasons are refused', r.parseCallLogBody(body({ reason: 'ghosted' }), now) === null);
  ok('non-UUID ids are refused', r.parseCallLogBody(body({ peer: 'abc' }), now) === null && r.parseCallLogBody(body({ id: 'x' }), now) === null);
  ok('over the session cap is refused', r.parseCallLogBody(body({ durationSec: 1800 + 121 }), now) === null && r.parseCallLogBody(body({ durationSec: 1800 }), now) !== null);
  ok('a call from the future or older than 3 hours is refused', r.parseCallLogBody(body({ endedAt: '2026-11-17T13:00:00Z' }), now) === null && r.parseCallLogBody(body({ startedAt: '2026-11-17T07:00:00Z', endedAt: '2026-11-17T07:10:00Z' }), now) === null);
  ok('end before start is refused', r.parseCallLogBody(body({ endedAt: '2026-11-17T11:40:00Z' }), now) === null);
  ok('garbage is refused', r.parseCallLogBody(null, now) === null && r.parseCallLogBody('x', now) === null);
}

// --- Migration -------------------------------------------------------------------------------------
const sql = fs.readFileSync('supabase/migrations/20261126_voice_calls.sql', 'utf8');
ok('call_logs end reasons match the TypeScript union', ["'completed'", "'missed'", "'declined'", "'failed'"].every((x) => sql.includes(x)));
ok('call_logs has RLS enabled', /alter table public\.call_logs enable row level security/.test(sql));
ok('call_logs reads are limited to the two members', /for select[\s\S]*?auth\.uid\(\) = caller_id or auth\.uid\(\) = callee_id/.test(sql));
ok('call_logs inserts are caller only', /for insert[\s\S]*?with check \(auth\.uid\(\) = caller_id\)/.test(sql));
ok('no audio column anywhere', !/audio_(path|url|blob)|recording/i.test(sql.replace(/--.*$/gm, '')));
ok('private channel policies exist', sql.includes('voice_signaling_receive') && sql.includes('voice_signaling_send'));

console.log(`Call rules: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(' FAIL ' + f);
  process.exit(1);
}
