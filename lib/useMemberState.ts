'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { cachedHeaderProfile, loadHeaderProfile } from '@/lib/headerProfileStore';
import { isPlusProfile } from '@/lib/plus';

/**
 * Who is looking at a public, statically rendered page (the city guides). The server always renders the signed-out
 * page, so the first render is `unknown` and counts as signed out: the HTML is identical and crawlers see it. Before
 * the first paint the cached header profile (sessionStorage) already says "signed in" for a returning member, so they
 * never see the public header flash; otherwise the local session read settles it a moment later.
 *
 *   status  'unknown' (first render) | 'in' | 'out'
 *   plus    true / false once the member's profile is known, null while signed in and still loading (so a Plus member
 *           is never shown the upsell for a moment)
 */
export type MemberState = { status: 'unknown' | 'in' | 'out'; plus: boolean | null };

export function useMemberState(): MemberState {
  const [state, setState] = useState<MemberState>({ status: 'unknown', plus: null });

  useLayoutEffect(() => {
    const hit = cachedHeaderProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the cached member before first paint so the public header never flashes
    if (hit) setState({ status: 'in', plus: isPlusProfile(hit) });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const settle = async (userId: string | null) => {
      if (cancelled) return;
      if (!userId) {
        setState({ status: 'out', plus: null });
        return;
      }
      const hit = cachedHeaderProfile(userId);
      setState({ status: 'in', plus: hit ? isPlusProfile(hit) : null });
      const fresh = await loadHeaderProfile(userId);
      if (!cancelled && fresh) setState({ status: 'in', plus: isPlusProfile(fresh) });
    };
    supabase.auth.getSession().then(({ data: { session } }) => settle(session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void settle(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
