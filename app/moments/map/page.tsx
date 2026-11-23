'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useActionToast } from '@/components/ActionToast';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { FALLBACK_CENTER, FALLBACK_ZOOM, pickCamera, pickMapStart, type MapStart } from '@/lib/momentMap';
import { supabase } from '@/lib/supabase/client';
import type { MomentItem } from '@/lib/moments';
import type { Pin } from '@/components/moments/MapCanvas';

// maplibre-gl and everything that touches the browser load only on this screen, and only on the client.
const MapCanvas = dynamic(() => import('@/components/moments/MapCanvas'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#FAF9FC]" />,
});
const SpotSheet = dynamic(() => import('@/components/moments/SpotSheet'), { ssr: false });
const SparkMomentSheet = dynamic(() => import('@/components/moments/SparkMomentSheet').then((m) => m.SparkMomentSheet), { ssr: false });

/**
 * The spot map, full bleed: the map fills the whole screen behind the header and the floating tab bar (inside the 480px
 * app column) with nothing drawn over it but the pins; the empty card, the attribution and the spot sheet all sit clear of
 * the bar. It opens on the centre of the member's profile city at city zoom, never on their coordinates or device
 * position (so it can never open on a street near home). If no pin is within 100 km of that city, or the city is unknown, it
 * frames the active pins instead; with no pins anywhere it shows Southeast Asia as a whole. The page fetches once, aborts if
 * you leave, and the map cleans itself up on unmount.
 */
export default function MomentsMapPage() {
  const { t } = useLocale();
  const showToast = useActionToast();
  const [items, setItems] = useState<MomentItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sparkTarget, setSparkTarget] = useState<MomentItem | null>(null);
  /** undefined while the member's city is being read, null when it is unknown. */
  const [start, setStart] = useState<MapStart | null | undefined>(undefined);

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

  // Only the city is read: coordinates are never used to place the camera.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let city: string | null = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase.from('profiles').select('city').eq('id', session.user.id).maybeSingle();
          city = data?.city ?? null;
        }
      } catch {
        // No profile read: the pins frame the map.
      }
      if (!cancelled) setStart(pickMapStart({ city }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pinned = useMemo(() => (items ?? []).filter((m) => m.place && m.placeLat != null && m.placeLng != null), [items]);
  const pins: Pin[] = useMemo(
    () => pinned.map((m) => ({ id: m.id, lat: m.placeLat as number, lng: m.placeLng as number, label: m.place as string, avatarUrl: m.author.avatarUrl })),
    [pinned]
  );
  const camera = useMemo(() => pickCamera(start ?? null, pins), [start, pins]);
  const selected = pinned.find((m) => m.id === selectedId) ?? null;
  const loading = items === null && !failed;
  // The map is created once, so it waits until it knows where to open: the city and the pins have both answered.
  const ready = start !== undefined && !loading;

  return (
    // Full bleed: the whole viewport height, kept to the 480px column like the tab bar. Header and tab bar sit above it (z-50).
    <div className="ail-map-lift fixed inset-y-0 left-1/2 z-0 h-dvh w-full max-w-[480px] -translate-x-1/2 bg-[#FAF9FC]">
      {ready && (
        <MapCanvas
          pins={pins}
          selectedId={selectedId}
          onPinClick={setSelectedId}
          center={camera.fit ? (start?.center ?? FALLBACK_CENTER) : camera.center}
          zoom={camera.fit ? (start?.zoom ?? FALLBACK_ZOOM) : camera.zoom}
          fit={camera.fit}
        />
      )}

      {(failed || (!loading && pins.length === 0)) && (
        <div className="pointer-events-none absolute inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom,0px))] z-10 rounded-2xl border border-[#D0CDE1] bg-white px-4 py-4 text-center">
          <p className="text-sm font-semibold text-[#413B5E]">{failed ? t('moments.mapError') : t('moments.mapEmptyTitle')}</p>
          {!failed && <p className="mt-1 text-xs leading-relaxed text-slate-600">{t('moments.mapEmptyBody')}</p>}
        </div>
      )}

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
