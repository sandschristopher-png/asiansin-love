'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Camera, Loader2, LocateFixed } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localizeError } from '@/lib/i18n/errors';
import { prepareMomentPhoto } from '@/lib/images/momentPhoto';
import { MAX_CAPTION, MOMENT_PROMPTS, VIBE_TAGS, type MomentCity, type MomentPrompt, type VibeTag } from '@/lib/moments';
import { SEA_LOCATIONS } from '@/lib/seaLocations';
import type { TKey } from '@/lib/i18n';

const FIELD =
  'w-full rounded-xl border border-[#D0CDE1] bg-white px-3.5 py-2.5 text-sm text-[#413B5E] placeholder:text-slate-400 focus:border-[#8574B7] focus:outline-none';
const LABEL = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600';

/**
 * "Post a Moment" sheet: pick a photo (cropped to 4:5 and resized to 1080 px wide in the browser),
 * a Southeast Asian city (grouped by country, with an optional "use current location" check), one
 * lifestyle vibe, an optional guided prompt and an optional 140-character caption. The server screens the caption and
 * enforces verification and the 2-per-24-hours cap; its answers are shown here in the member's language.
 */
export function MomentComposer({
  defaultCity,
  initialPrompt = null,
  onClose,
  onPosted,
}: {
  defaultCity: MomentCity;
  /** A prompt to start on (the Today's Prompt card). */
  initialPrompt?: MomentPrompt | null;
  onClose: () => void;
  onPosted: () => void;
}) {
  const { t } = useLocale();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [city, setCity] = useState<MomentCity>(defaultCity);
  const [vibe, setVibe] = useState<VibeTag | null>(null);
  const [prompt, setPrompt] = useState<MomentPrompt | null>(initialPrompt);
  const [locating, setLocating] = useState(false);
  /** A server-checked GPS fix for one city; only counts while that city is still selected. */
  const [fix, setFix] = useState<{ city: MomentCity; token: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);

  const preview = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError(t('errors.fileType'));
      return;
    }
    try {
      setBlob(await prepareMomentPhoto(file));
    } catch {
      setError(t('errors.fileTooLarge'));
    }
  };

  const locate = () => {
    if (locating) return;
    setError(null);
    setNeedsVerify(false);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError(t('moments.locateDenied'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/moments/locate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data?.code === 'LOCATION_OUTSIDE_SEA' ? t('moments.locateOutside') : localizeError({ status: res.status, code: data?.code, message: data?.error }, t));
          } else {
            setCity(data.city as MomentCity);
            setFix({ city: data.city as MomentCity, token: String(data.token) });
          }
        } catch {
          setError(t('errors.network'));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError(t('moments.locateDenied'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blob || !vibe || busy) return;
    setBusy(true);
    setError(null);
    setNeedsVerify(false);
    try {
      const form = new FormData();
      form.append('image', new File([blob], 'moment', { type: blob.type }));
      form.append('caption', caption.trim());
      form.append('vibeTag', vibe);
      if (prompt) form.append('prompt', prompt);
      form.append('city', city);
      if (fix && fix.city === city) form.append('locationToken', fix.token);
      const res = await fetch('/api/moments', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data?.code as string | undefined;
        if (code === 'MOMENT_VERIFICATION_REQUIRED') {
          setNeedsVerify(true);
          setError(t('moments.errVerify'));
        } else if (code === 'MOMENT_RATE_LIMIT') setError(t('moments.errRate'));
        else if (code === 'MOMENT_CAPTION_REJECTED' || code === 'SAFETY_BLOCKED') setError(t('moments.errCaption'));
        else if (code === 'MOMENT_LOW_REPUTATION') setError(t('moments.errReputation'));
        else if (code === 'ACCOUNT_UNDER_REVIEW') setError(t('moments.errFrozen'));
        else setError(localizeError({ status: res.status, code, message: data?.error }, t));
        return;
      }
      onPosted();
    } catch {
      setError(t('errors.network'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet title={t('moments.composeTitle')} onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium leading-relaxed text-red-600">
            {error}
            {needsVerify && (
              <>
                {' '}
                <Link href="/verify" className="font-semibold underline underline-offset-2">
                  {t('settings.identityVerification')}
                </Link>
              </>
            )}
          </p>
        )}

        <label className="relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#8574B7]/50 bg-[#FAF9FC] text-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 px-6 text-[#413B5E]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8574B7]/15 text-[#8574B7]">
                <Camera className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold leading-snug">{t('moments.addPhoto')}</span>
              <span className="text-[11px] leading-relaxed text-slate-600">{t('moments.photoHint')}</span>
            </span>
          )}
          {preview && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold leading-none text-[#413B5E] backdrop-blur-md">
              {t('moments.changePhoto')}
            </span>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>

        <div>
          <label htmlFor="moment-city" className={LABEL}>{t('moments.city')}</label>
          <div className="flex items-center gap-2">
            <select
              id="moment-city"
              value={city}
              onChange={(e) => setCity(e.target.value as MomentCity)}
              className={`${FIELD} min-w-0 flex-1`}
            >
              {SEA_LOCATIONS.map((loc) => (
                <optgroup key={loc.country} label={loc.country}>
                  {loc.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              aria-label={t('moments.useLocation')}
              title={t('moments.useLocation')}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-[#D0CDE1] bg-white text-[#8574B7] transition-colors hover:bg-[#E8E6F1]/50 disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LocateFixed className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {fix && fix.city === city && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium leading-snug text-[#8574B7]">
              <LocateFixed className="h-3 w-3" aria-hidden />
              {t('moments.locationVerified')}
            </p>
          )}
        </div>

        <div>
          <span className={LABEL}>{t('moments.vibeLabel')}</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('moments.vibeLabel')}>
            {VIBE_TAGS.map((tg) => {
              const on = vibe === tg;
              return (
                <button
                  key={tg}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setVibe(tg)}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium leading-snug transition-colors ${
                    on ? 'bg-[#8574B7] text-white' : 'bg-[#8574B7]/[0.08] text-[#413B5E] hover:bg-[#8574B7]/[0.15]'
                  }`}
                >
                  {t(`moments.vibe.${tg}` as TKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className={LABEL}>{t('moments.promptLabel')}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('moments.promptLabel')}>
            {MOMENT_PROMPTS.map((pr) => {
              const on = prompt === pr;
              return (
                <button
                  key={pr}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPrompt(on ? null : pr)}
                  className={`rounded-full border px-3.5 py-2 text-left text-xs font-medium leading-snug transition-colors ${
                    on ? 'border-[#8574B7] bg-[#8574B7] text-white' : 'border-[#E6E2F0] bg-white text-[#413B5E] hover:bg-[#F6F4FB]'
                  }`}
                >
                  {t(`moments.prompt.${pr}` as TKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <textarea
            rows={3}
            value={caption}
            maxLength={MAX_CAPTION}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t('moments.captionPlaceholder')}
            className={`${FIELD} resize-none`}
          />
          <p className="mt-1 text-right text-[11px] tabular-nums text-slate-500">
            {caption.length}/{MAX_CAPTION}
          </p>
        </div>

        <button
          type="submit"
          disabled={!blob || !vibe || busy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8574B7] text-sm font-medium text-white transition-colors hover:bg-[#534377] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? t('moments.publishing') : t('moments.publish')}
        </button>
      </form>
    </BottomSheet>
  );
}

export default MomentComposer;
