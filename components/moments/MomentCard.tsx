'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Flag, Heart, MapPin, MoreHorizontal, Trash2, Zap } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { supabaseImage, AVATAR_IMAGE } from '@/lib/images/supabaseImage';
import type { MomentItem } from '@/lib/moments';
import type { TKey } from '@/lib/i18n';

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
 * One Moment, with.is style: author header, a 4:5 rounded photo with a frosted activity tag, the
 * caption (no comments, so nothing to spam), then a like toggle and the primary "Spark this Moment"
 * pill. Cards ease in as they scroll into view unless the visitor prefers reduced motion.
 */
export function MomentCard({
  moment,
  onLike,
  onSpark,
  onReport,
  onDelete,
}: {
  moment: MomentItem;
  onLike: (m: MomentItem) => void;
  onSpark: (m: MomentItem) => void;
  onReport: (m: MomentItem) => void;
  onDelete: (m: MomentItem) => void;
}) {
  const { t, locale } = useLocale();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
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
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_2px_14px_rgba(65,59,94,0.05)]"
    >
      <header className="flex items-center gap-3 px-1 pb-3">
        <Link href={`/profile/${author.id}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/60">
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
              <span className="inline-flex items-center rounded-md bg-[#8574B7]/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#8574B7]">
                {t('moments.founding')}
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] leading-snug text-slate-600">
            <MapPin className="h-3 w-3 shrink-0 text-[#8574B7]" aria-hidden />
            <span className="truncate">{moment.city}</span>
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#E8E6F1]/70"
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
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] leading-snug text-[#413B5E] hover:bg-[#E8E6F1]/50"
                >
                  <Flag className="h-3.5 w-3.5 text-[#8574B7]" aria-hidden />
                  {t('moments.reportMoment')}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#E8E6F1]/50">
        <Image src={moment.imageUrl} alt={t(`moments.tag.${moment.activityTag}` as TKey)} fill sizes="(max-width: 480px) 100vw, 456px" className="object-cover" />
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-semibold leading-none text-[#413B5E] backdrop-blur-md">
          {t(`moments.tag.${moment.activityTag}` as TKey)}
        </span>
      </div>

      {moment.caption && <p className="px-1 pt-3 text-sm leading-relaxed text-[#413B5E] break-words">{moment.caption}</p>}

      <div className="flex items-center gap-2.5 px-1 pt-3">
        <motion.button
          type="button"
          whileTap={reduce ? undefined : { scale: 0.9 }}
          onClick={() => onLike(moment)}
          aria-pressed={moment.likedByMe}
          aria-label={moment.likedByMe ? t('moments.liked') : t('moments.like')}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#D0CDE1] bg-white px-4 text-[13px] font-medium text-[#413B5E] transition-colors hover:bg-[#E8E6F1]/40"
        >
          <Heart className={`h-4 w-4 transition-colors ${moment.likedByMe ? 'fill-[#8574B7] text-[#8574B7]' : 'text-slate-600'}`} aria-hidden />
          <span className="tabular-nums">{moment.likesCount}</span>
        </motion.button>
        {!moment.isMine && (
          <motion.button
            type="button"
            whileTap={reduce ? undefined : { scale: 0.98 }}
            onClick={() => onSpark(moment)}
            className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#8574B7] px-5 text-[13px] font-medium leading-snug text-white transition-colors hover:bg-[#534377]"
          >
            <Zap className="h-4 w-4 shrink-0 fill-current" aria-hidden />
            <span className="truncate">{t('moments.spark')}</span>
          </motion.button>
        )}
      </div>
    </motion.article>
  );
}

export default MomentCard;
