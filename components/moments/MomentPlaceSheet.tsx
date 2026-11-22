'use client';

import React, { useState } from 'react';
import { Car, Footprints, TrainFront } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { directionsUrl, placeQuery, type NavApp, type NavMode } from '@/lib/momentPlace';
import type { TKey } from '@/lib/i18n';

const MODES: { mode: NavMode; label: TKey; Icon: typeof Footprints }[] = [
  { mode: 'walk', label: 'moments.navWalk', Icon: Footprints },
  { mode: 'drive', label: 'moments.navDrive', Icon: Car },
  { mode: 'transit', label: 'moments.navTransit', Icon: TrainFront },
];

const APPS: { app: NavApp; label: TKey }[] = [
  { app: 'google', label: 'moments.openGoogle' },
  { app: 'apple', label: 'moments.openApple' },
];

/**
 * The drawer a Moment's spot pill opens: pick walk, drive or transit, then hand "<spot>, <city>" to Google Maps or Apple
 * Maps. Plain links, so there is no map SDK to download and the maps app does the routing (including local transit).
 */
export function MomentPlaceSheet({ place, city, onClose }: { place: string; city: string; onClose: () => void }) {
  const { t } = useLocale();
  const [mode, setMode] = useState<NavMode>('walk');
  const query = placeQuery(place, city);

  return (
    <BottomSheet title={place} onClose={onClose}>
      <div className="space-y-4 pt-4">
        <p className="text-xs text-slate-600">{city}</p>

        <div role="radiogroup" aria-label={t('moments.navHow')} className="flex flex-wrap gap-2">
          {MODES.map(({ mode: m, label, Icon }) => {
            const on = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setMode(m)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors active:scale-95 ${
                  on ? 'border-[#726E97] bg-[#726E97] text-white' : 'border-[#D0CDE1] bg-white text-[#413B5E] hover:bg-[#EAE9F2]/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {t(label)}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pb-1">
          {APPS.map(({ app, label }) => (
            <a
              key={app}
              href={directionsUrl(app, query, mode)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex h-12 w-full items-center justify-center rounded-full border border-[#D0CDE1] bg-white text-sm font-medium text-[#413B5E] transition-colors hover:bg-[#EAE9F2]/40 active:scale-[0.99]"
            >
              {t(label)}
            </a>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

export default MomentPlaceSheet;
