require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
(async () => {
  const cols = ['is_plus','plus_enabled','membership_tier','subscription_status','stripe_subscription_id','stripe_customer_id','plus_until'];
  console.log('--- profiles columns ---');
  for (const c of cols) {
    const { error } = await sb.from('profiles').select(c).limit(1);
    console.log((error ? 'MISSING ' : 'OK      ') + c + (error ? '  [' + error.code + ']' : ''));
  }
})();