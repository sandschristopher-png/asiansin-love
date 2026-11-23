'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useActionToast } from '@/components/ActionToast';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { intentLabel } from '@/lib/intents';
import { FALLBACK_CENTER, FALLBACK_ZOOM, pickMapStart, pinVisible, type MapStart } from '@/lib/momentMap';
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

const PILL = 'inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-xs font-medium transition-colors active:scale-95';
const PILL_ON = 'border-[#726E97] bg-[#726E97] text-white hover:border-[#524E75] hover:bg-[#524E75]';
const PILL_OFF = 'border-[#D0CDE1] bg-white text-[#413B5E] hover:border-[#524E75] hover:text-[#524E75]';

/**
 * Where to open: the member's own position, if the browser already allows it. It never asks (the map is not the place for a
 * permission prompt), and gives up after a few seconds.
 */
function deviceFix(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation || !navigator.permissions) return resolve(null);
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((p) => {
        if (p.state !== 'granted') return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 600_000 }
        );
      })
      .catch(() => resolve(null));
  });
}

/**
 * The spot map, full bleed: the map fills the whole screen behind the header and the floating tab bar (inside the 480px
 * app column), with the filter strip, the empty card, the attribution and the spot sheet all clear of the bar. It opens on
 * the member (profile coordinates, profile city, or an allowed device fix), else frames the pins, and only then falls back
 * to Manila. The page fetches once, aborts if you leave, and the map cleans itself up on unmount.
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
  /** undefined while it is being worked out, null when the member's position is unknown. */
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let profile: { latitude?: number | null; longitude?: number | null; city?: string | null } | null = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase.from('profiles').select('latitude, longitude, city').eq('id', session.user.id).maybeSingle();
          profile = data;
        }
      } catch {
        // No profile read: fall through to the device position and the pins.
      }
      let found = pickMapStart({ profileLat: profile?.latitude, profileLng: profile?.longitude, city: profile?.city });
      if (!found) found = pickMapStart({ device: await deviceFix() });
      if (!cancelled) setStart(found);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () =>
      (items ?? []).filter(
        (m) => m.place && m.placeLat != null && m.placeLng != null && pinVisible(m.author, { intent: filter === 'friends' ? 'friends' : null, picks: filter === 'picks' })
      ),
    [items, filter]
  );
  const pins: Pin[] = useMemo(
    () => visible.map((m) => ({ id: m.id, lat: m.placeLat as number, lng: m.placeLng as number, label: m.place as string, avatarUrl: m.author.avatarUrl })),
    [visible]
  );
  const selected = visible.find((m) => m.id === selectedId) ?? null;
  const loading = items === null && !failed;

  return (
    // Full bleed: the whole viewport height, kept to the 480px column like the tab bar. Header and tab bar sit above it (z-50).
    <div className="ail-map-lift fixed inset-y-0 left-1/2 z-0 h-dvh w-full max-w-[480px] -translate-x-1/2 bg-[#FAF9FC]">
      {start !== undefined && (
        <MapCanvas
          pins={pins}
          selectedId={selectedId}
          onPinClick={setSelectedId}
          center={start?.center ?? FALLBACK_CENTER}
          zoom={start?.zoom ?? FALLBACK_ZOOM}
          // No member position: frame the pins (Manila only if there are none).
          fit={start === null}
        />
      )}

      {/* The filter strip floats just under the header: one scrolling row of flat pills (no blur, no shadow). */}
      <div className="no-scrollbar absolute inset-x-0 top-14 z-10 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap px-4 pt-3">
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
        <div className="pointer-events-none absolute inset-x-4 bottom-[88px] z-10 rounded-2xl border border-[#D0CDE1] bg-white px-4 py-4 text-center">
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
