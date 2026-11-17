// Step-up liveness regression suite. Run: npm run stepup:test
import fs from 'node:fs';
import { loadLib } from './lib/load-ts.mjs';

const hp = await loadLib('headPose');
const rules = await loadLib('verify/stepUpRules');
let passed = 0;
const failures = [];
const ok = (name, cond, detail = '') => (cond ? passed++ : failures.push(`${name}${detail ? ` -> ${detail}` : ''}`));

// Synthetic face: cheeks at x 0.3 / 0.7, forehead y 0.2, chin y 0.8, nose a little in front of centre.
const face = (noseX, noseY) => {
  const lm = [];
  lm[1] = { x: noseX, y: noseY };
  lm[234] = { x: 0.3, y: 0.5 };
  lm[454] = { x: 0.7, y: 0.5 };
  lm[10] = { x: 0.5, y: 0.2 };
  lm[152] = { x: 0.5, y: 0.8 };
  return lm;
};
const neutral = hp.poseRatios(face(0.5, 0.55));
ok('neutral ratios', Math.abs(neutral.yaw) < 1e-9 && Math.abs(neutral.pitch - 0.05 / 0.6) < 1e-9);
const at = (x, y) => hp.poseRatios(face(x, y));

// Raw (un-mirrored) frame: turning to the member's own left moves the nose toward larger x.
ok('turn_left needs the nose toward larger x', hp.poseReached('turn_left', at(0.58, 0.55), neutral) && !hp.poseReached('turn_left', at(0.42, 0.55), neutral));
ok('turn_right needs the nose toward smaller x', hp.poseReached('turn_right', at(0.42, 0.55), neutral) && !hp.poseReached('turn_right', at(0.58, 0.55), neutral));
ok('look_up needs the nose to rise', hp.poseReached('look_up', at(0.5, 0.49), neutral) && !hp.poseReached('look_up', at(0.5, 0.61), neutral));
ok('look_down needs the nose to drop', hp.poseReached('look_down', at(0.5, 0.61), neutral) && !hp.poseReached('look_down', at(0.5, 0.49), neutral));
ok('a small head movement is not a turn', !hp.poseReached('turn_left', at(0.52, 0.55), neutral) && !hp.poseReached('look_up', at(0.5, 0.54), neutral));
ok('a diagonal tilt does not count as a pure turn', !hp.poseReached('turn_left', at(0.6, 0.66), neutral));
ok('the member neutral pose is respected (looking slightly down at rest)', hp.poseReached('look_down', at(0.5, 0.66), hp.poseRatios(face(0.5, 0.6))) === true);
ok('progress runs 0..1', hp.poseProgress('turn_left', neutral, neutral) === 0 && hp.poseProgress('turn_left', at(0.58, 0.55), neutral) === 1 && hp.poseProgress('turn_left', at(0.46, 0.55), neutral) === 0);
ok('missing landmarks give no ratios', hp.poseRatios([]) === null && hp.poseRatios(null) === null);

// Challenge rules
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
let allValid = true;
for (let i = 0; i < 50; i++) {
  const p = rules.pickPoses(rand);
  if (p.length !== 3 || new Set(p).size !== 3 || !p.every((x) => rules.STEP_UP_POSES.includes(x))) allValid = false;
}
ok('pickPoses returns 3 distinct valid poses', allValid);
const seen = new Set();
for (let i = 0; i < 200; i++) rules.pickPoses(rand).forEach((p) => seen.add(p));
ok('every pose can be requested', seen.size === 4);
const req = ['turn_left', 'look_up', 'turn_right'];
const log = (o = []) => req.map((pose, i) => ({ pose, holdMs: 700, ...(o[i] || {}) }));
ok('a complete log validates', rules.validPoseLog(req, log()));
ok('a hold under 600 ms fails', !rules.validPoseLog(req, log([{}, { holdMs: 599 }])) && rules.validPoseLog(req, log([{}, { holdMs: 600 }])));
ok('wrong order fails', !rules.validPoseLog(req, [log()[1], log()[0], log()[2]]));
ok('missing or extra entries fail', !rules.validPoseLog(req, log().slice(0, 2)) && !rules.validPoseLog(req, [...log(), { pose: 'turn_left', holdMs: 700 }]));
ok('absurd holds fail', !rules.validPoseLog(req, log([{ holdMs: 60000 }])) && !rules.validPoseLog(req, log([{ holdMs: NaN }])));
ok('garbage logs fail', !rules.validPoseLog(req, null) && !rules.validPoseLog(req, 'x'));
const t0 = 1_000_000;
ok('under 4 seconds is too fast', rules.elapsedOk(t0, t0 + 3999) === 'too_fast' && rules.elapsedOk(t0, t0 + 4000) === 'ok');
ok('older than 5 minutes expires', rules.elapsedOk(t0, t0 + 300_001) === 'expired' && rules.elapsedOk(t0, t0 + 300_000) === 'ok');
ok('trigger reasons', rules.isTriggerReason('photo_swap') && rules.isTriggerReason('quarantine_recovery') && !rules.isTriggerReason('voice_call') && !rules.isTriggerReason(5));

// Risk triggers
ok('velocity: more than 15 in 10 minutes', !rules.velocityExceeded(15) && rules.velocityExceeded(16));
ok('reports: 2 or more in 7 days', !rules.reportsExceeded(1) && rules.reportsExceeded(2));
ok('new country: differs from the last session and the profile (a profile in that country is a trip home, not a flag)', rules.newCountryLogin('TH', 'PH', 'PH') === true && rules.newCountryLogin('TH', 'PH', 'TH') === false && rules.newCountryLogin('TH', 'PH', 'VN') === true);
ok('new country: same as last session never flags', rules.newCountryLogin('PH', 'PH', 'VN') === false);
ok('new country: first session or unknown never flags', rules.newCountryLogin('TH', null, 'PH') === false && rules.newCountryLogin(null, 'PH', 'PH') === false);
ok('new country is case-insensitive', rules.newCountryLogin('th', 'PH', 'ph') === true && rules.newCountryLogin('ph', 'PH', 'vn') === false);
ok('three attempts an hour, then a person', rules.MAX_ATTEMPTS_PER_HOUR === 3);

// Migration
const sql = fs.readFileSync('supabase/migrations/20261127_stepup_liveness.sql', 'utf8');
const code = sql.replace(/--.*$/gm, '');
ok('profile columns exist', /reverification_required boolean not null default false/.test(sql) && /reverification_reason text/.test(sql));
ok('members cannot change the flag themselves', /guard_profile_reverification/.test(sql) && /auth\.uid\(\) is null or coalesce\(auth\.role\(\), ''\) = 'service_role'/.test(sql));
ok('liveness_challenges has RLS and read-own only', /alter table public\.liveness_challenges enable row level security/.test(sql) && !/on public\.liveness_challenges\s+for (insert|update|delete|all)/.test(code));
ok('reasons in SQL match TypeScript', rules.TRIGGER_REASONS.every((r) => sql.includes(`'${r}'`)));
ok('no video or image columns', !/video|image|selfie|blob/i.test(code));

console.log(`Step-up: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(' FAIL ' + f);
  process.exit(1);
}
