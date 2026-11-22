'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import { Flag, Heart, LocateFixed, MapPin, MoreHorizontal, Trash2, Zap } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { supabaseImage, AVATAR_IMAGE } from '@/lib/images/supabaseImage';
import type { MomentItem } from '@/lib/moments';
import type { TKey } from '@/lib/i18n';

// Only opened on a tap: kept out of the feed's first bundle.
const MomentPlaceSheet = dynamic(() => import('@/components/moments/MomentPlaceSheet').then((m) => m.MomentPlaceSheet), { ssr: false });

/** "3 hours ago" in the member's language. */
function ago(iso: string, locale: string): string {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
  return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * One Moment, with.is style: author header (badges, city and country), a 4:5 rounded photo with a
 * frosted vibe tag, a "Shared vibe" pill when the viewer's interests match, the guided-prompt eyebrow
 * and caption (no comments, so nothing to spam), then a like toggle and the primary "Spark this Moment"
 * pill. A card that mounts after the skeleton (or a new post arriving) eases in: opacity 0 to 1 and
 * 10px up over 260ms, offset by `enter.delay`. Cards painted straight from the cache pass `enter={null}`
 * and appear at once, and reduced motion skips the movement altogether.
 */
export function MomentCard({
  moment,
  onLike,
  onSpark,
  onReport,
  onDelete,
  enter = null,
  priority = false,
}: {
  moment: MomentItem;
  onLike: (m: MomentItem) => void;
  onSpark: (m: MomentItem) => void;
  onReport: (m: MomentItem) => void;
  onDelete: (m: MomentItem) => void;
  /** Entrance animation with its stagger delay in seconds; null shows the card immediately. */
  enter?: { delay: number } | null;
  /** The first card's photo loads eagerly (it is above the fold). */
  priority?: boolean;
}) {
  const { t, locale } = useLocale();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const { author } = moment;
  const vibeLabel = moment.vibeTag ? t(`moments.vibe.${moment.vibeTag}` as TKey) : '';
  return (
    <motion.article
      initial={reduce || !enter ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: 'easeOut', delay: enter?.delay ?? 0 }}
      className="rounded-[20px] border border-[#E6E2F0] bg-white p-3"
    >
      <header className="flex items-center gap-3 px-1 pb-3">
        <Link href={`/profile/${author.id}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#D0CDE1] bg-[#EAE9F2]/60">
          {author.avatarUrl ? (
            <Image src={supabaseImage(author.avatarUrl, AVATAR_IMAGE)} alt={author.username} fill sizes="40px" className="object-cover" />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Link href={`/profile/${author.id}`} className="truncate text-[13.5px] font-semibold leading-snug text-[#413B5E]">
              {author.username}
              {author.age ? <span className="font-medium text-slate-600">, {author.age}</span> : null}
            </Link>
            {author.verified && <VerifiedBadge size="sm" />}
            {author.founding && (
              <span className="inline-flex items-center rounded-md bg-[#726E97]/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#726E97]">
                {t('moments.founding')}
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] leading-snug text-slate-600">
            <MapPin className="h-3 w-3 shrink-0 text-[#726E97]" aria-hidden />
            <span className="truncate">{moment.country ? `${moment.city}, ${moment.country}` : moment.city}</span>
            {moment.locationVerified && (
              <span className="inline-flex shrink-0" title={t('moments.locationVerified')}>
                <LocateFixed className="h-3 w-3 text-[#726E97]" aria-hidden />
                <span className="sr-only">{t('moments.locationVerified')}</span>
              </span>
            )}
            <span aria-hidden>·</span>
            <span suppressHydrationWarning className="shrink-0">{ago(moment.createdAt, locale)}</span>
          </p>
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t('moments.menu')}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#EAE9F2]/70"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-9 z-20 min-w-[11rem] overflow-hidden rounded-2xl border border-[#D0CDE1] bg-white py-1 shadow-[0_12px_30px_rgba(65,59,94,0.16)]">
              {moment.isMine ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(moment);
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] leading-snug text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {t('moments.deleteMoment')}
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onReport(moment);
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] leading-snug text-[#413B5E] hover:bg-[#EAE9F2]/50"
                >
                  <Flag className="h-3.5 w-3.5 text-[#726E97]" aria-hidden />
                  {t('moments.reportMoment')}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#EAE9F2]/50">
        <Image src={moment.imageUrl} alt={vibeLabel || t('moments.attachedAlt')} fill sizes="(max-width: 480px) 100vw, 440px" preload={priority} className="object-cover" />
        {vibeLabel && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold leading-none text-[#413B5E]">
            {vibeLabel}
          </span>
        )}
      </div>

      {moment.place && (
        <div className="flex flex-wrap items-center gap-2 px-1 pt-3">
          <button
            type="button"
            onClick={() => setPlaceOpen(true)}
            aria-label={t('moments.placeDirections', { place: moment.place })}
            className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[#726E97]/25 bg-[#EAE9F2] px-3 text-xs font-semibold text-[#524E75] transition-colors hover:border-[#726E97]/50 active:scale-95"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{moment.place}</span>
          </button>
          {moment.author.localGuide && (
            <span className="inline-flex h-6 items-center rounded-full border border-[#D0CDE1] bg-white px-2.5 text-[11px] font-semibold text-[#726E97]">
              {t('moments.guideTag')}
            </span>
          )}
        </div>
      )}

      {(moment.sharedVibe || moment.prompt || moment.caption) && (
        <div className="px-1 pt-3">
          {moment.sharedVibe && (
            <span className="mb-2 inline-flex items-center rounded-md bg-[#F6F4FB] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#726E97]">
              {t('moments.sharedVibe')}
            </span>
          )}
          {moment.prompt && <p className="text-xs font-medium leading-snug text-[#726E97]">{t(`moments.prompt.${moment.prompt}` as TKey)}</p>}
          {moment.caption && <p className={`text-sm leading-relaxed text-[#413B5E] break-words ${moment.prompt ? 'mt-1' : ''}`}>{moment.caption}</p>}
        </div>
      )}

      <div className="flex items-center gap-2.5 px-1 pt-3">
        <motion.button
          type="button"
          whileTap={reduce ? undefined : { scale: 0.9 }}
          onClick={() => onLike(moment)}
          aria-pressed={moment.likedByMe}
          aria-label={moment.likedByMe ? t('moments.liked') : t('moments.like')}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#D0CDE1] bg-white px-4 text-[13px] font-medium text-[#413B5E] transition-colors hover:bg-[#EAE9F2]/40"
        >
          <Heart className={`h-4 w-4 transition-colors ${moment.likedByMe ? 'fill-[#726E97] text-[#726E97]' : 'text-slate-600'}`} aria-hidden />
          <span className="tabular-nums">{moment.likesCount}</span>
        </motion.button>
        {!moment.isMine && (
          <motion.button
            type="button"
            whileTap={reduce ? undefined : { scale: 0.98 }}
            onClick={() => onSpark(moment)}
            className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#726E97] px-5 text-[13px] font-medium leading-snug text-white transition-colors hover:bg-[#524E75]"
          >
            <Zap className="h-4 w-4 shrink-0 fill-current" aria-hidden />
            <span className="truncate">{t('moments.spark')}</span>
          </motion.button>
        )}
      </div>
      {placeOpen && moment.place && <MomentPlaceSheet place={moment.place} city={moment.city} onClose={() => setPlaceOpen(false)} />}
    </motion.article>
  );
}

export default MomentCard;
