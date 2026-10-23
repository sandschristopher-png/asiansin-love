// REVIEW TOOL: approve or reject a pending verification attempt
// Usage: node review-verify.cjs <userId> <approve|reject> [note]
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const [userId, action, note] = process.argv.slice(2);
  if (!userId || !['approve', 'reject'].includes(action)) {
    console.log('Usage: node review-verify.cjs <userId> <approve|reject> [note]');
    process.exit(1);
  }
  const approve = action === 'approve';

  const { data: attempt, error: ae } = await admin.from('verification_attempts')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'submitted')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ae) { console.log('QUERY ERROR:', ae.message); process.exit(1); }
  if (!attempt) { console.log('No submitted attempt found for that user.'); process.exit(1); }

  const { error: te } = await admin.from('verification_attempts')
    .update({ status: approve ? 'approved' : 'rejected', reviewed_at: new Date().toISOString(), review_note: note || null })
    .eq('id', attempt.id);
  if (te) { console.log('ATTEMPT UPDATE FAILED:', te.message); process.exit(1); }

  const { error: pe } = await admin.from('profiles')
    .update({
      is_verified: approve,
      verification_status: approve ? 'verified' : 'rejected',
      pose_verified_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (pe) { console.log('PROFILE UPDATE FAILED:', pe.message); process.exit(1); }

  if (!approve) {
    await admin.from('verification_strikes').insert({ user_id: userId, attempt_id: attempt.id, reason: note || 'rejected by reviewer' });
  }

  console.log('DONE:', action.toUpperCase(), '- attempt', attempt.id, '| profile is_verified =', approve);
})();