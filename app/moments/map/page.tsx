'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useActionToast } from '@/components/ActionToast';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { intentLabel } from '@/lib/intents';
import { pinVisible } from '@/lib/momentMap';
import { cityCenter } from '@/lib/seaLocations';
import type { MomentItem } from '@/lib/moments';
import type { Pin } from '@/components/moments/MapCanvas';

// maplibre-gl and everything that touches the browser load only on this screen, and only on the client.
const MapCanvas = dynamic(() => import('@/components/moments/MapCanvas'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#F6F4FB]" />,
});
const SpotSheet = dynamic(() => import('@/components/moments/SpotSheet'), { ssr: false });
const SparkMomentSheet = dynamic(() => import('@/components/moments/SparkMomentSheet').then((m) => m.SparkMomentSheet), { ssr: false });

// Opens on Manila until the pins frame themselves.
const START: readonly [number, number] = cityCenter('Manila') ?? [14.5995, 120.9842];

const PILL = 'inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-xs font-medium transition-colors active:scale-95';
const PILL_ON = 'border-[#726E97] bg-[#726E97] text-white';
const PILL_OFF = 'border-[#D0CDE1] bg-white text-[#413B5E] hover:bg-[#EAE9F2]/40';

/**
 * The spot map: every pinned Moment as an avatar pin on a light map, narrowed by All, Local Guide Picks and Friends. A pin opens the spot sheet (photo, caption, who, profile / Spark, directions). The page fetches
 * once, aborts the request if you leave, and the map cleans itself up on unmount.
 */
export default function MomentsMapPage() {
  const { t } = useLocale();
  const showToast = useActionToast();
  const [items, setItems] = useState<MomentItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  // The strip is All, Local Guide Picks or Friends: one at a time.
  const [filter, setFilter] = useState<'all' | 'picks' | 'friends'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sparkTarget, setSparkTarget] = useState<MomentItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/moments?map=1', { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error('map');
        setItems(Array.isArray(data.moments) ? (data.moments as MomentItem[]) : []);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setFailed(true);
      }
    })();
    return () => controller.abort();
  }, []);

  const visible = useMemo(
    () => (items ?? []).filter((m) => m.place && m.placeLat != null && m.placeLng != null && pinVisible(m.author, { intent: filter === 'friends' ? 'friends' : null, picks: filter === 'picks' })),
    [items, filter]
  );
  const pins: Pin[] = useMemo(
    () =>
      visible.map((m) => ({ id: m.id, lat: m.placeLat as number, lng: m.placeLng as number, label: m.place as string, avatarUrl: m.author.avatarUrl })),
    [visible]
  );
  const selected = visible.find((m) => m.id === selectedId) ?? null;
  const loading = items === null && !failed;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="relative h-[calc(100dvh-8.5rem)] min-h-[420px] w-full">
        <MapCanvas pins={pins} selectedId={selectedId} onPinClick={setSelectedId} center={START} zoom={11} fit />

        {/* Filters float over the map as flat white pills (no blur, no shadow) in one scrolling row, so they take one line of map: it keeps panning at full speed. */}
        <div className="no-scrollbar absolute inset-x-0 top-0 z-10 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap px-4 pt-3">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')} className={`${PILL} ${filter === 'all' ? PILL_ON : PILL_OFF}`}>
            {t('moments.mapAll')}
          </button>
          <button type="button" aria-pressed={filter === 'picks'} onClick={() => setFilter('picks')} className={`${PILL} ${filter === 'picks' ? PILL_ON : PILL_OFF}`}>
            {t('moments.mapPicks')}
          </button>
          <button type="button" aria-pressed={filter === 'friends'} onClick={() => setFilter('friends')} className={`${PILL} ${filter === 'friends' ? PILL_ON : PILL_OFF}`}>
            {intentLabel('friends')}
          </button>
        </div>

        {(failed || (!loading && pins.length === 0)) && (
          <div className="pointer-events-none absolute inset-x-4 bottom-16 z-10 rounded-2xl border border-[#D0CDE1] bg-white px-4 py-4 text-center">
            <p className="text-sm font-semibold text-[#413B5E]">{failed ? t('moments.mapError') : t('moments.mapEmptyTitle')}</p>
            {!failed && <p className="mt-1 text-xs leading-relaxed text-slate-600">{t('moments.mapEmptyBody')}</p>}
          </div>
        )}
      </div>

      {selected && <SpotSheet moment={selected} onClose={() => setSelectedId(null)} onSpark={setSparkTarget} />}
      {sparkTarget && (
        <SparkMomentSheet
          moment={sparkTarget}
          onClose={() => setSparkTarget(null)}
          onSent={() => {
            setSparkTarget(null);
            setSelectedId(null);
            showToast(t('moments.sparkSent'), 'check');
          }}
        />
      )}
    </div>
  );
}
