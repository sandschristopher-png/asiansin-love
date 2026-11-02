// Reputation rules suite (pure functions only, no database writes).
// Run: node scripts/test-reputation.mjs
import { loadLib } from './lib/load-ts.mjs';

const {
  REPUTATION_RULES,
  applyDeduction,
  applyDailyRecovery,
  canSendMessage,
  canSendVoiceNote,
  decideMessageOutcome,
  reputationTier,
} = await loadLib('reputation');

let passed = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` -> ${detail}` : ''}`);
}

/** Replays messages for one sender starting at 100 and returns the final score. */
function replay(messages, contactUnlocked = false) {
  let score = REPUTATION_RULES.default;
  const outcomes = [];
  for (const text of messages) {
    const d = decideMessageOutcome(text, contactUnlocked);
    score = applyDeduction(score, d.deduction);
    outcomes.push(d);
  }
  return { score, outcomes };
}

// Scam -> -25 and quarantine
{
  const { score, outcomes } = replay(['Hi dear, please send me money for my hospital bills']);
  check('scam deducts 25', score === 75, `score=${score}`);
  check('scam is quarantined', outcomes[0].outcome === 'quarantine', outcomes[0].outcome);
}

// Solicitation -> -25 and quarantine
{
  const { score, outcomes } = replay(["what's your rate for the night"]);
  check('solicitation deducts 25', score === 75, `score=${score}`);
  check('solicitation is quarantined', outcomes[0].outcome === 'quarantine');
}

// Leetspeak contact evasion before unlock -> -5, soft block
{
  const { score, outcomes } = replay(['add me on wh@ts@pp']);
  check('leet contact evasion deducts 5', score === 95, `score=${score}`);
  check('leet contact evasion is soft-blocked', outcomes[0].outcome === 'soft_block', outcomes[0].outcome);
  check('leet contact evasion category', outcomes[0].category === 'contact_evasion', outcomes[0].category);
}

// Plain contact before unlock -> blocked with the friendly message, no penalty
{
  const { score, outcomes } = replay(['are you on telegram?']);
  check('plain contact before unlock: no penalty', score === 100, `score=${score}`);
  check('plain contact before unlock: soft block', outcomes[0].outcome === 'soft_block');
}

// Contact after unlock -> delivered, no penalty
{
  const { score, outcomes } = replay(['my whatsapp is 0917 123 4567'], true);
  check('contact after unlock delivered', outcomes[0].outcome === 'deliver' && score === 100, outcomes[0].outcome);
}

// Quarantine confirmed by admin -> additional -15
{
  const { score } = replay(['send nudes']);
  const afterConfirm = applyDeduction(score, REPUTATION_RULES.quarantineConfirmed);
  check('quarantine confirm deducts 15', afterConfirm === 60, `after=${afterConfirm}`);
}

// Confirmed report -> -20
check('confirmed report deducts 20', applyDeduction(100, REPUTATION_RULES.confirmedReport) === 80);

// Clean messages stay at 100
{
  const { score, outcomes } = replay([
    'Hi! How was your weekend in Cebu?',
    'I work in IT and love hiking on Sundays',
    'Lets meet for coffee at 7:30 near the mall',
  ]);
  check('clean messages stay 100', score === 100, `score=${score}`);
  check('clean messages delivered', outcomes.every((o) => o.outcome === 'deliver'));
}

// Medium severity -> delivered with warning
{
  const { score, outcomes } = replay(['do you use gcash there?'], true);
  check('wallet mention warns', outcomes[0].outcome === 'deliver_with_warning', outcomes[0].outcome);
  check('wallet mention deducts 5', score === 95, `score=${score}`);
}

// Floor at 0
check('score never below 0', applyDeduction(10, 25) === 0);

// Recovery: +1 per day, capped at 100, idempotent per day
{
  const day1 = applyDailyRecovery(80, { lastRecoveredOn: '2026-11-01', today: '2026-11-02', mutualChat: true, flaggedToday: false });
  check('recovery +1', day1.score === 81 && day1.recovered);
  const again = applyDailyRecovery(day1.score, { lastRecoveredOn: '2026-11-02', today: '2026-11-02', mutualChat: true, flaggedToday: false });
  check('recovery idempotent same day', again.score === 81 && !again.recovered);
  const capped = applyDailyRecovery(100, { lastRecoveredOn: null, today: '2026-11-02', mutualChat: true, flaggedToday: false });
  check('recovery capped at 100', capped.score === 100 && !capped.recovered);
  const flagged = applyDailyRecovery(80, { lastRecoveredOn: null, today: '2026-11-02', mutualChat: true, flaggedToday: true });
  check('no recovery on flagged day', flagged.score === 80);
  const oneSided = applyDailyRecovery(80, { lastRecoveredOn: null, today: '2026-11-02', mutualChat: false, flaggedToday: false });
  check('no recovery without mutual chat', oneSided.score === 80);
}

// Restrictions below 70
check('70 is not restricted', canSendMessage(70, 50) && canSendVoiceNote(70));
check('69 limited to 5 per hour', canSendMessage(69, 4) && !canSendMessage(69, 5));
check('69 cannot send voice notes', !canSendVoiceNote(69));

// Badge tiers
check('tier 95', reputationTier(95).tier === 'good' && reputationTier(95).label === '95% Rep');
check('tier 90', reputationTier(90).tier === 'good');
check('tier 89 fair', reputationTier(89).tier === 'fair' && reputationTier(89).label === 'Fair Rep');
check('tier 70 fair', reputationTier(70).tier === 'fair');
check('tier 69 low', reputationTier(69).tier === 'low' && reputationTier(69).label === 'Low Rep / Under Review');

const total = passed + failures.length;
for (const f of failures) console.error('  FAIL', f);
console.log(`reputation: ${passed}/${total} passed (${((passed / total) * 100).toFixed(1)}%)`);
process.exit(failures.length === 0 ? 0 : 1);
