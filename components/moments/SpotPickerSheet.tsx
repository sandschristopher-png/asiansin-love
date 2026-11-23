'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, MapPin, Search } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { MAX_PLACE, cleanPlace } from '@/lib/momentPlace';
import { cityCenter } from '@/lib/seaLocations';

const MapCanvas = dynamic(() => import('@/components/moments/MapCanvas'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#F6F4FB]" />,
});

export interface PickedSpot {
  place: string;
  lat: number;
  lng: number;
}

type Hit = { name: string; detail: string; lat: number; lng: number };

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const MANILA: readonly [number, number] = [14.5995, 120.9842];

/** The first part of an OpenStreetMap display name is the place itself ("Tops Lookout, Busay, Cebu City, ..."). */
function splitName(display: string): { name: string; detail: string } {
  const parts = display.split(',').map((p) => p.trim()).filter(Boolean);
  return { name: parts[0] ?? '', detail: parts.slice(1, 3).join(', ') };
}

/**
 * Pin a spot for a Moment: search for a venue in the Moment's city, or tap the map to drop a pin (drag it to fine-tune).
 * A tap looks up a name for the pin, which can be edited before it is used. Searches run only when asked (no
 * type-ahead), one at a time, and are cancelled if the sheet closes. The pin is stored to about 110 m by the server.
 */
export default function SpotPickerSheet({
  city,
  initial,
  onPick,
  onClose,
}: {
  city: string;
  initial?: PickedSpot | null;
  onPick: (spot: PickedSpot) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const center = cityCenter(city) ?? MANILA;
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState<'search' | 'reverse' | null>(null);
  const [error, setError] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(initial ? { lat: initial.lat, lng: initial.lng } : null);
  const [name, setName] = useState(initial?.place ?? '');
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const begin = () => {
    controller.current?.abort();
    controller.current = new AbortController();
    setError(false);
    return controller.current.signal;
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3 || busy) return;
    const signal = begin();
    setBusy('search');
    try {
      // Only inside the city's area, so a venue name does not turn up on the other side of the world.
      const [clat, clng] = center;
      const box = `${clng - 0.45},${clat + 0.45},${clng + 0.45},${clat - 0.45}`;
      const res = await fetch(`${NOMINATIM}/search?format=json&limit=6&accept-language=en&bounded=1&viewbox=${box}&q=${encodeURIComponent(q)}`, { signal });
      if (!res.ok) throw new Error('search');
      const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      setHits(
        rows
          .map((r) => ({ ...splitName(r.display_name), lat: Number(r.lat), lng: Number(r.lon) }))
          .filter((h) => h.name && Number.isFinite(h.lat) && Number.isFinite(h.lng))
      );
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setError(true);
    } finally {
      setBusy(null);
    }
  };

  const choose = (h: Hit) => {
    setPin({ lat: h.lat, lng: h.lng });
    setName(cleanPlace(h.name));
    setHits(null);
  };

  // A tap or a drag: move the pin, then look up what is there.
  const drop = async (lat: number, lng: number) => {
    setPin({ lat, lng });
    const signal = begin();
    setBusy('reverse');
    try {
      const res = await fetch(`${NOMINATIM}/reverse?format=json&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`, { signal });
      if (!res.ok) throw new Error('reverse');
      const data = (await res.json()) as { name?: string; display_name?: string; address?: Record<string, string> };
      const a = data.address ?? {};
      const found = data.name || a.amenity || a.shop || a.tourism || a.leisure || a.road || splitName(data.display_name ?? '').name;
      if (found) setName(cleanPlace(found));
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setError(true);
    } finally {
      setBusy(null);
    }
  };

  const canUse = pin !== null && cleanPlace(name).length > 0;
  const field =
    'w-full rounded-full border border-[#D0CDE1] bg-white px-4 py-2.5 text-sm text-[#413B5E] placeholder:text-slate-400 focus:border-[#726E97] focus:outline-none';

  return (
    <BottomSheet title={t('moments.pickerTitle')} onClose={onClose}>
      <div className="space-y-4 pt-4">
        <form onSubmit={search} className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('moments.pickerSearchPlaceholder')}
            aria-label={t('moments.pickerSearchPlaceholder')}
            maxLength={80}
            className={field}
          />
          <button
            type="submit"
            disabled={busy !== null || query.trim().length < 3}
            aria-label={t('moments.pickerSearch')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#726E97] text-white transition-colors hover:bg-[#524E75] disabled:opacity-50 active:scale-95"
          >
            {busy === 'search' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>
        </form>

        {hits && (
          <ul className="divide-y divide-[#F3F4F6]">
            {hits.length === 0 ? (
              <li className="py-3 text-xs text-slate-600">{t('moments.pickerNoResults')}</li>
            ) : (
              hits.map((h) => (
                <li key={`${h.lat},${h.lng},${h.name}`}>
                  <button type="button" onClick={() => choose(h)} className="flex w-full items-start gap-2.5 py-2.5 text-left transition-colors hover:text-[#726E97]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#726E97]" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#413B5E]">{h.name}</span>
                      {h.detail && <span className="block truncate text-xs text-slate-600">{h.detail}</span>}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-[#D0CDE1]">
          <MapCanvas center={pin ? [pin.lat, pin.lng] : center} zoom={pin ? 16 : 12} marker={pin} onMapClick={(lat, lng) => void drop(lat, lng)} />
        </div>
        <p className="text-center text-xs text-slate-600">{t('moments.pickerHint')}</p>

        {error && <p role="alert" className="text-xs font-medium text-red-600">{t('moments.pickerError')}</p>}

        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_PLACE}
            placeholder={t('moments.placePlaceholder')}
            aria-label={t('moments.placeLabel')}
            className={field}
          />
          {busy === 'reverse' && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" aria-hidden />}
        </div>

        <button
          type="button"
          disabled={!canUse}
          onClick={() => pin && onPick({ place: cleanPlace(name), lat: pin.lat, lng: pin.lng })}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#726E97] text-sm font-medium text-white transition-colors hover:bg-[#524E75] disabled:opacity-50 active:scale-[0.99]"
        >
          {t('moments.pickerUse')}
        </button>
      </div>
    </BottomSheet>
  );
}
