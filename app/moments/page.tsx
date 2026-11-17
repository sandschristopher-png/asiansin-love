'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Camera, Loader2, Plus } from 'lucide-react';
import { useActionToast } from '@/components/ActionToast';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { MomentCard } from '@/components/moments/MomentCard';
import { MomentComposer } from '@/components/moments/MomentComposer';
import { ReportMomentSheet } from '@/components/moments/ReportMomentSheet';
import { SparkMomentSheet } from '@/components/moments/SparkMomentSheet';
import { localizeError } from '@/lib/i18n/errors';
import { MOMENTS_SEEN_EVENT, MOMENTS_SEEN_KEY, MOMENT_CITIES, type MomentCity, type MomentItem } from '@/lib/moments';
import { supabase } from '@/lib/supabase/client';

/** Marks the feed as seen so the nav tab's dot clears (BottomNav listens for the event). */
function markSeen() {
  try {
    localStorage.setItem(MOMENTS_SEEN_KEY, new Date().toISOString());
    window.dispatchEvent(new Event(MOMENTS_SEEN_EVENT));
  } catch {}
}

const PILL = 'inline-flex shrink-0 items-center rounded-full px-3.5 py-2 text-xs font-medium leading-snug transition-colors cursor-pointer';

/**
 * Moments feed: city pills, then cards in one centred column. Posting needs a verified profile
 * (the server says so in the member's language), and "Spark this Moment" opens a hello sheet that
 * attaches the photo to the conversation.
 */
export default function MomentsPage() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  // The floating button is portaled to <body>: the route transition wraps the page in a transformed
  // element, and a fixed child of a transformed parent scrolls with the page instead of staying put.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const showToast = useActionToast();
  const [city, setCity] = useState<'' | MomentCity>('');
  const [items, setItems] = useState<MomentItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [sparkTarget, setSparkTarget] = useState<MomentItem | null>(null);
  const [reportTarget, setReportTarget] = useState<MomentItem | null>(null);
  const [homeCity, setHomeCity] = useState<MomentCity>('Manila');

  const [reloadKey, setReloadKey] = useState(0);

  /** First page for the chosen city: re-runs when the city, the language or reloadKey changes. */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const qs = new URLSearchParams();
        if (city) qs.set('city', city);
        const res = await fetch(`/api/moments?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) throw Object.assign(new Error(data?.error || 'moments'), { status: res.status, code: data?.code });
        setItems(data.moments as MomentItem[]);
        setCursor(data.nextCursor ?? null);
      } catch (err) {
        if (active) setError(localizeError(err instanceof Error ? err : null, t));
      } finally {
        if (active) setLoading(false);
      }
    })();
    markSeen();
    return () => {
      active = false;
    };
  }, [city, reloadKey, t]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const qs = new URLSearchParams({ before: cursor });
      if (city) qs.set('city', city);
      const res = await fetch(`/api/moments?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems((prev) => [...prev, ...(data.moments as MomentItem[])]);
        setCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const selectCity = (c: '' | MomentCity) => {
    if (c === city) return;
    setLoading(true);
    setError(null);
    setCity(c);
  };

  // The composer starts on the member's own hub when their profile city is one of ours.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('city').eq('id', user.id).maybeSingle();
      const raw = String(data?.city || '').trim().toLowerCase();
      const hub = raw.length > 2 ? MOMENT_CITIES.find((c) => raw.includes(c.toLowerCase()) || c.toLowerCase().includes(raw)) : undefined;
      if (hub) setHomeCity(hub);
    })();
  }, []);

  const toggleLike = async (m: MomentItem) => {
    const flip = (liked: boolean, count: number) =>
      setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, likedByMe: liked, likesCount: count } : x)));
    flip(!m.likedByMe, Math.max(0, m.likesCount + (m.likedByMe ? -1 : 1)));
    try {
      const res = await fetch(`/api/moments/${m.id}/like`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('like');
      flip(Boolean(data.liked), Number(data.likesCount));
    } catch {
      flip(m.likedByMe, m.likesCount);
      showToast(t('errors.generic'), 'info');
    }
  };

  const remove = async (m: MomentItem) => {
    if (!window.confirm(`${t('moments.deleteMoment')}?`)) return;
    const res = await fetch(`/api/moments/${m.id}`, { method: 'DELETE' }).catch(() => null);
    if (res?.ok) {
      setItems((prev) => prev.filter((x) => x.id !== m.id));
      showToast(t('moments.deleted'), 'check');
    } else {
      showToast(t('errors.generic'), 'info');
    }
  };

  return (
    <main className="min-h-[100dvh] w-full bg-white pb-[calc(8rem+env(safe-area-inset-bottom,0px))] text-[#413B5E]">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-3">
        <p className="text-xs leading-relaxed text-slate-600">{t('moments.subtitle')}</p>

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
          {(['', ...MOMENT_CITIES] as ('' | MomentCity)[]).map((c) => {
            const on = city === c;
            return (
              <button
                key={c || 'all'}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => selectCity(c)}
                className={`${PILL} ${on ? 'bg-[#8574B7] text-white' : 'bg-[#8574B7]/[0.08] text-[#413B5E] hover:bg-[#8574B7]/[0.15]'}`}
              >
                {c === '' ? t('moments.allSea') : c}
              </button>
            );
          })}
        </div>

        <div className="mt-3 space-y-4">
          {loading ? (
            [0, 1].map((i) => <div key={i} className="aspect-[4/5] w-full rounded-3xl ail-shimmer" />)
          ) : error ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 px-4 py-10 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8E6F1]/60 text-[#8574B7]">
                <Camera className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-3 text-sm font-semibold leading-snug text-[#413B5E]">{t('moments.emptyTitle')}</h2>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-600">{t('moments.emptyBody')}</p>
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="mx-auto mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-[#8574B7] px-6 text-[13px] font-medium leading-snug text-white transition-colors hover:bg-[#534377]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('moments.postFirst')}
              </button>
            </div>
          ) : (
            items.map((m) => (
              <MomentCard key={m.id} moment={m} onLike={toggleLike} onSpark={setSparkTarget} onReport={setReportTarget} onDelete={remove} />
            ))
          )}

          {cursor && !loading && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="mx-auto flex h-11 items-center justify-center gap-2 rounded-full border border-[#D0CDE1] bg-white px-6 text-[13px] font-medium text-[#413B5E] transition-colors hover:bg-[#E8E6F1]/40 disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t('moments.loadMore')}
            </button>
          )}
        </div>
      </div>

      {/* Pinned thumb-zone button: fixed on screen, a full-width 480px track that ignores taps with the
          button docked at its right edge, 88px above the bottom edge so it clears the nav pill. */}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 justify-end px-4">
            <motion.button
              type="button"
              onClick={() => setComposing(true)}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              className="pointer-events-auto inline-flex h-12 items-center gap-1.5 rounded-full bg-[#8574B7] px-5 text-[13px] font-medium leading-snug text-white shadow-[0_8px_24px_rgba(133,116,183,0.45)] transition-colors hover:bg-[#534377]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('moments.post')}
            </motion.button>
          </div>,
          document.body
        )}

      {composing && (
        <MomentComposer
          defaultCity={city || homeCity}
          onClose={() => setComposing(false)}
          onPosted={() => {
            setComposing(false);
            showToast(t('moments.posted'), 'check');
            setLoading(true);
            setReloadKey((n) => n + 1);
          }}
        />
      )}
      {sparkTarget && (
        <SparkMomentSheet
          moment={sparkTarget}
          onClose={() => setSparkTarget(null)}
          onSent={() => {
            setSparkTarget(null);
            showToast(t('moments.sparkSent'), 'check');
          }}
        />
      )}
      {reportTarget && (
        <ReportMomentSheet
          momentId={reportTarget.id}
          onClose={() => setReportTarget(null)}
          onDone={({ duplicate, hidden }) => {
            const id = reportTarget.id;
            setReportTarget(null);
            if (hidden) setItems((prev) => prev.filter((x) => x.id !== id));
            showToast(duplicate ? t('moments.reportAlready') : t('moments.reportThanks'), 'info');
          }}
        />
      )}
    </main>
  );
}
