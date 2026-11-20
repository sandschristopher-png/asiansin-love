'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Camera, Loader2, Plus } from 'lucide-react';
import { useActionToast } from '@/components/ActionToast';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { MomentCard } from '@/components/moments/MomentCard';
import { MomentComposer } from '@/components/moments/MomentComposer';
import { MomentSkeleton } from '@/components/moments/MomentSkeleton';
import { ReportMomentSheet } from '@/components/moments/ReportMomentSheet';
import { SparkMomentSheet } from '@/components/moments/SparkMomentSheet';
import { localizeError } from '@/lib/i18n/errors';
import { clearMomentsCache, readMomentsCache, writeMomentsCache, type MomentsFeed } from '@/lib/momentsCache';
import { haptic } from '@/lib/haptics';
import { useStepUp } from '@/components/verify/useStepUp';
import { useReverification } from '@/lib/useReverification';
import { mergeRefresh, type MomentEdit } from '@/lib/momentsMerge';
import { MOMENTS_SEEN_EVENT, MOMENTS_SEEN_KEY, promptOfDay, type MomentCity, type MomentItem, type MomentPrompt } from '@/lib/moments';
import { matchSeaCity } from '@/lib/seaLocations';
import { supabase } from '@/lib/supabase/client';
import { fetchUpcomingTrips, localIsoDate } from '@/lib/trips';
import type { TKey } from '@/lib/i18n';

/** Marks the feed as seen so the nav tab's dot clears (BottomNav listens for the event). */
function markSeen() {
  try {
    localStorage.setItem(MOMENTS_SEEN_KEY, new Date().toISOString());
    window.dispatchEvent(new Event(MOMENTS_SEEN_EVENT));
  } catch {}
}

/**
 * Moments feed: a Today's Prompt card (the same prompt for every member each day), then one
 * chronological Southeast Asia stream (each card names its city) in one centred column. Posting needs
 * a verified profile (the server says so in the member's language), and "Spark this Moment" opens a
 * hello sheet that attaches the photo to the conversation.
 *
 * Speed: the first page is cached in sessionStorage (lib/momentsCache.ts), so returning to the tab
 * paints real cards at once and quietly revalidates /api/moments. A cold first visit shows a two-card
 * shimmer skeleton, and cards that arrive after it ease in one after another (cards painted from the
 * cache do not re-animate).
 */
export default function MomentsPage() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const showToast = useActionToast();
  // Cached first page: read live on the client and null on the server, so a hard reload hydrates cleanly.
  const cached = useSyncExternalStore(
    () => () => {},
    () => readMomentsCache(),
    () => null
  );
  const [local, setLocal] = useState<MomentsFeed | null>(null);
  const feed = local ?? cached;
  const items = feed?.items ?? [];
  const cursor = feed?.cursor ?? null;
  /** True until the first network answer; the skeleton shows only while there is nothing cached either. */
  const [loading, setLoading] = useState(true);
  const showSkeleton = loading && feed === null;
  /** Cards painted from the cache on arrival appear at once; every card that mounts later eases in. */
  const [initialIds] = useState<Set<string>>(() => new Set((readMomentsCache()?.items ?? []).map((m) => m.id)));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  /** The prompt the composer opens on: today's when started from the card, none from the button. */
  const [composerPrompt, setComposerPrompt] = useState<MomentPrompt | null>(null);
  const [todaysPrompt] = useState<MomentPrompt>(() => promptOfDay());
  const [sparkTarget, setSparkTarget] = useState<MomentItem | null>(null);
  const [reportTarget, setReportTarget] = useState<MomentItem | null>(null);
  const [homeCity, setHomeCity] = useState<MomentCity>('Manila');

  const [reloadKey, setReloadKey] = useState(0);

  /**
   * Likes and deletes the member makes while a feed refresh is in flight. The cards are already on
   * screen (from the cache), so a refresh that started before the tap would otherwise land afterwards
   * with the old count and flip the heart back. Entries newer than the refresh's start are re-applied.
   */
  const localEdits = useRef(new Map<string, MomentEdit>());

  const updateFeed = (change: (f: MomentsFeed) => MomentsFeed) =>
    setLocal((prev) => change(prev ?? readMomentsCache() ?? { items: [], cursor: null }));
  const updateItems = (change: (list: MomentItem[]) => MomentItem[]) => updateFeed((f) => ({ ...f, items: change(f.items) }));

  // Keep the cache in step with the feed (a like, a delete, a fresh load, "Load more"), so it never shows
  // a count the member has already changed.
  useEffect(() => {
    if (local) writeMomentsCache(local);
  }, [local]);

  /** First page of the unified feed: re-runs when the language or reloadKey changes. */
  useEffect(() => {
    let active = true;
    const startedAt = Date.now();
    (async () => {
      try {
        const res = await fetch('/api/moments');
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) throw Object.assign(new Error(data?.error || 'moments'), { status: res.status, code: data?.code });
        setLocal({ items: mergeRefresh(data.moments as MomentItem[], localEdits.current, startedAt), cursor: data.nextCursor ?? null });
        setError(null);
      } catch (err) {
        // Shown only when there is nothing on screen: a failed background refresh keeps the cached cards.
        if (active) setError(localizeError(err instanceof Error ? err : null, t));
      } finally {
        if (active) setLoading(false);
      }
    })();
    markSeen();
    return () => {
      active = false;
    };
  }, [reloadKey, t]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const qs = new URLSearchParams({ before: cursor });
      const res = await fetch(`/api/moments?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        updateFeed((f) => ({ items: [...f.items, ...(data.moments as MomentItem[])], cursor: data.nextCursor ?? null }));
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // The composer starts on the city the member is visiting right now (an active Visiting Soon trip),
  // otherwise their profile city, when it is one of ours.
  useEffect(() => {
    // Wait for the feed: these lookups must not compete with it on a cold visit.
    if (loading) return;
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const today = localIsoDate();
      const trips = await fetchUpcomingTrips(user.id);
      const current = trips.find((trip) => trip.start_date <= today && trip.end_date >= today);
      const tripCity = matchSeaCity(current?.destination_city);
      if (tripCity) {
        if (active) setHomeCity(tripCity);
        return;
      }
      const { data } = await supabase.from('profiles').select('city').eq('id', user.id).maybeSingle();
      const hub = matchSeaCity(data?.city);
      if (hub && active) setHomeCity(hub);
    })();
    return () => {
      active = false;
    };
  }, [loading]);

  // Step-up identity check: a restricted account confirms its identity before it can post.
  const reverification = useReverification();
  const stepUp = useStepUp();
  const confirmThenCompose = async (prompt: MomentPrompt | null) => {
    const result = await stepUp.run();
    if (result?.status === 'passed') {
      reverification.clear();
      setComposerPrompt(prompt);
      setComposing(true);
    }
  };

  const openComposer = (prompt: MomentPrompt | null) => {
    haptic.tap();
    if (reverification.required) {
      void confirmThenCompose(prompt);
      return;
    }
    setComposerPrompt(prompt);
    setComposing(true);
  };

  const toggleLike = async (m: MomentItem) => {
    if (!m.likedByMe) haptic.like(); // synchronous, inside the tap; nothing on unlike
    const flip = (liked: boolean, count: number) => {
      localEdits.current.set(m.id, { at: Date.now(), like: { liked, count } });
      updateItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, likedByMe: liked, likesCount: count } : x)));
    };
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
      localEdits.current.set(m.id, { at: Date.now(), removed: true });
      updateItems((prev) => prev.filter((x) => x.id !== m.id));
      showToast(t('moments.deleted'), 'check');
    } else {
      showToast(t('errors.generic'), 'info');
    }
  };

  return (
    <main className="min-h-[100dvh] w-full bg-white pb-[calc(8rem+env(safe-area-inset-bottom,0px))] text-[#413B5E]">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-3">
        {/* Header row: the subtitle on the left, the compact Post Moment pill on the right. It sits in the page
            flow (never floating), so it cannot cover a caption. /moments is members-only, so it is always there. */}
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-600">{t('moments.subtitle')}</p>
          <motion.button
            type="button"
            onClick={() => openComposer(null)}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#726E97] px-4 text-xs font-medium leading-none text-white transition-colors hover:bg-[#524E75]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('moments.post')}
          </motion.button>
        </div>

        {/* Today's Prompt: the card itself opens the composer on this prompt. */}
        <button
          type="button"
          onClick={() => openComposer(todaysPrompt)}
          className="mt-4 block w-full rounded-[20px] border border-[#E6E2F0] bg-[#F6F4FB] p-4 text-left transition-colors hover:border-[#726E97]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#726E97]"
        >
          <span className="block text-[11px] font-semibold uppercase leading-none tracking-wider text-[#726E97]">{t('moments.todaysPrompt')}</span>
          <span className="mt-2.5 block text-base font-semibold leading-snug text-[#413B5E]">{t(`moments.prompt.${todaysPrompt}` as TKey)}</span>
        </button>

        <div className="mt-4 space-y-4" aria-busy={showSkeleton}>
          {showSkeleton ? (
            <MomentSkeleton />
          ) : error && feed === null ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 px-4 py-10 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAE9F2]/60 text-[#726E97]">
                <Camera className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-3 text-sm font-semibold leading-snug text-[#413B5E]">{t('moments.emptyTitle')}</h2>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-600">{t('moments.emptyBody')}</p>
            </div>
          ) : (
            items.map((m, i) => (
              <MomentCard
                key={m.id}
                moment={m}
                onLike={toggleLike}
                onSpark={setSparkTarget}
                onReport={setReportTarget}
                onDelete={remove}
                enter={initialIds.has(m.id) ? null : { delay: Math.min(i % 12, 8) * 0.045 }}
                priority={i === 0}
              />
            ))
          )}

          {cursor && !showSkeleton && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="mx-auto flex h-11 items-center justify-center gap-2 rounded-full border border-[#D0CDE1] bg-white px-6 text-[13px] font-medium text-[#413B5E] transition-colors hover:bg-[#EAE9F2]/40 disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t('moments.loadMore')}
            </button>
          )}
        </div>
      </div>

      {stepUp.element}
      {composing && (
        <MomentComposer
          defaultCity={homeCity}
          initialPrompt={composerPrompt}
          onClose={() => setComposing(false)}
          onReverificationRequired={() => {
            setComposing(false);
            reverification.markRequired();
            void confirmThenCompose(composerPrompt);
          }}
          onPosted={() => {
            setComposing(false);
            showToast(t('moments.posted'), 'check');
            // A post changes the feed: drop the cache and refresh in the background (no skeleton flash).
            clearMomentsCache();
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
            if (hidden) {
              localEdits.current.set(id, { at: Date.now(), removed: true });
              updateItems((prev) => prev.filter((x) => x.id !== id));
            }
            showToast(duplicate ? t('moments.reportAlready') : t('moments.reportThanks'), 'info');
          }}
        />
      )}
    </main>
  );
}
