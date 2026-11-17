'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * Whether the signed-in member must confirm their identity (profiles.reverification_required, set by the
 * server for unusual activity, a released safety hold, ...). The columns come from
 * 20261127_stepup_liveness.sql; until it is applied the read simply fails and nothing is restricted.
 * `markRequired` lets a page react the moment an API answers REVERIFICATION_REQUIRED, and `clear` the
 * moment a check passes, without waiting for a refetch.
 */
export function useReverification() {
  const [required, setRequired] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { data, error } = await supabase.from('profiles').select('reverification_required').eq('id', uid).maybeSingle();
      if (alive && !error && data) setRequired(data.reverification_required === true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const markRequired = useCallback(() => setRequired(true), []);
  const clear = useCallback(() => setRequired(false), []);
  return { required, markRequired, clear };
}

/** True when an API response carries the restriction code. */
export const isReverificationError = (body: unknown): boolean =>
  Boolean(body && typeof body === 'object' && (body as { code?: unknown }).code === 'REVERIFICATION_REQUIRED');
