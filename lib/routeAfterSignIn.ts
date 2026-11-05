'use client';

import { supabase } from '@/lib/supabase/client';
import { safeReturnTo } from '@/lib/authRedirect';

/**
 * After any successful sign-in (OAuth return, email code, magic link, password): new members go
 * to /onboarding, everyone else to the safe returnTo or /discover. A full navigation, so the
 * middleware and server components see the fresh session cookies.
 */
export async function routeAfterSignIn(userId: string, returnTo: string | null): Promise<void> {
  const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', userId).maybeSingle();
  try {
    localStorage.setItem('ail_returning', '1');
    if (!profile?.onboarding_completed) sessionStorage.setItem('ail_active_onboarding', '1');
  } catch {}
  window.location.href = profile?.onboarding_completed ? safeReturnTo(returnTo) || '/discover' : '/onboarding';
}
