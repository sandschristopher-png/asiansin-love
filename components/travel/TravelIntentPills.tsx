'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { supabase } from '@/lib/supabase/client';
import { TRAVEL_INTENTS, isTravelIntent, type TravelIntent } from '@/lib/travelHub';
import type { TKey } from '@/lib/i18n';

const LABEL: Record<TravelIntent, TKey> = {
  open_to_dates: 'travelHub.intent.openToDates',
  local_guide: 'travelHub.intent.localGuide',
  relocating: 'travelHub.intent.relocating',
};

/**
 * The optional travel intent (profiles.travel_intent): three pills, tap one to choose it, tap it again to clear.
 * Saves at once and puts the old choice back if the save fails. Old stored values (expat, explorer...) show as
 * "nothing chosen" and are left alone until the member picks one.
 */
export function TravelIntentPills({ userId }: { userId: string }) {
  const { t } = useLocale();
  const [value, setValue] = useState<TravelIntent | null>(null);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('profiles')
      .select('travel_intent')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && isTravelIntent(data?.travel_intent)) setValue(data.travel_intent);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const choose = async (next: TravelIntent) => {
    if (busy.current) return;
    busy.current = true;
    const previous = value;
    const target = previous === next ? null : next;
    setValue(target);
    setError(false);
    const { error: saveError } = await supabase.from('profiles').update({ travel_intent: target }).eq('id', userId);
    if (saveError) {
      setValue(previous);
      setError(true);
    }
    busy.current = false;
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">{t('travelHub.intentLabel')}</p>
      <div role="group" aria-label={t('travelHub.intentLabel')} className="flex flex-wrap gap-2">
        {TRAVEL_INTENTS.map((intent) => {
          const on = value === intent;
          return (
            <button
              key={intent}
              type="button"
              aria-pressed={on}
              onClick={() => void choose(intent)}
              className={`h-8 rounded-full border px-3.5 text-xs font-medium transition-colors active:scale-95 ${
                on
                  ? 'border-[#726E97] bg-[#726E97] text-white'
                  : 'border-[#D0CDE1] bg-white text-[#726E97] hover:bg-[#EAE9F2]/50'
              }`}
            >
              {t(LABEL[intent])}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="status" className="text-xs font-medium text-red-600">
          {t('travelHub.intentError')}
        </p>
      )}
    </div>
  );
}

export default TravelIntentPills;
