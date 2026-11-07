/**
 * _check_index.cjs - verifies the unique index on public.push_subscriptions(endpoint)
 * (migration 20261116_push_subscriptions_unique.sql) before pushing.
 *
 * Run:  node _check_index.cjs
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 *
 * How it checks (PostgREST cannot read pg_indexes): one upsert with onConflict 'endpoint' using a
 * dummy endpoint and a user_id that does not exist.
 *   - No unique index on endpoint -> Postgres rejects the statement at planning time with 42P10
 *     ("no unique or exclusion constraint matching the ON CONFLICT specification")  => MISS
 *   - Index present -> the statement plans, then fails the user_id foreign key (23503), so nothing
 *     is written                                                                     => OK
 *   - Index present and no foreign key -> the dummy row is written and deleted at once => OK
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('MISS: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const endpoint = `https://index-check.invalid/${Date.now()}-${Math.random().toString(36).slice(2)}`;
const ghostUser = '00000000-0000-4000-8000-000000000000';

(async () => {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: ghostUser, endpoint, p256dh: 'index-check', auth: 'index-check', updated_at: new Date().toISOString() },
      { onConflict: 'endpoint' }
    );

  if (error && error.code === '42P10') {
    console.log('MISS: push_subscriptions has no unique index on (endpoint). Run 20261116_push_subscriptions_unique.sql.');
    process.exit(1);
  }
  if (error && error.code === '42P01') {
    console.log('MISS: table public.push_subscriptions not found.');
    process.exit(1);
  }
  if (error && error.code !== '23503') {
    console.log(`MISS: unexpected error ${error.code}: ${error.message}`);
    process.exit(1);
  }
  if (!error) {
    // No foreign key on user_id: remove the dummy row again.
    const { error: delError } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (delError) console.log(`WARN: could not delete the check row (${endpoint}): ${delError.message}`);
  }
  console.log('OK: push_subscriptions unique index on (endpoint) is in place; the subscribe upsert will work.');
})().catch((e) => {
  console.log(`MISS: check failed to run: ${e.message}`);
  process.exit(1);
});